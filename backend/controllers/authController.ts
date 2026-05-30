import { Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { pgPool } from "../config/database";
import { generateToken } from "../utils/generateToken";
import { AuthRequest } from "../middlewares/authMiddleware";
import { createNotification, getAdminUserId } from "../utils/notificationService";
import { uploadToCloudinary } from "../utils/cloudinaryUpload";
import { sendPasswordResetEmail, sendVerificationEmail } from "../utils/emailService";
import { addPoints, handleLoginPoints } from "../utils/rewardsService";

export type UserRole = "student" | "mentor" | "admin";
const VALID_ROLES: UserRole[] = ["student", "mentor", "admin"];

const authCookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const clearCookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: "lax" as const,
  path: "/",
};

export const signup = async (req: AuthRequest, res: Response) => {
  const { email, password, name, role, termsAccepted } = req.body;

  if (!email || !password || !name || !role)
    return res.status(422).json({ message: "All fields required" });

  if (!VALID_ROLES.includes(role))
    return res.status(400).json({ message: "Invalid role" });

  if (!termsAccepted)
    return res.status(422).json({ message: "You must accept the Terms and Conditions" });

  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const { rows } = await client.query(
      `INSERT INTO users (email, password, name, role, is_verified, verification_token, terms_accepted_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())
       RETURNING id, email, name, role`,
      [email, hashedPassword, name, role, false, verificationToken]
    );

    const user = rows[0];

    res.clearCookie("student_auth_token", clearCookieOptions);
    res.clearCookie("mentor_auth_token", clearCookieOptions);
    res.clearCookie("admin_auth_token", clearCookieOptions);

    await client.query("COMMIT");

    try {
      const io = (req as any).app?.get?.("io");
      const adminId = await getAdminUserId();
      if (adminId) {
        await createNotification({
          userId: adminId,
          type: "interaction",
          title: "New User Registered",
          message: `${name} just signed up as a ${role} on MentorBee.`,
          data: { newUserId: user.id, role },
          io,
        });
      }
    } catch (notifErr) {
      console.error("Admin notification failed:", notifErr);
    }

    try {
      const verifyLink = `${process.env.APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
      if (user.email) await sendVerificationEmail(user.email, user.name, verifyLink);
    } catch (e) {
      console.error("Email send failed:", e);
    }

    res.status(201).json({ success: true, message: "Signup successful. Please verify your email.", user, verificationRequired: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Signup error:", err);
    res.status(500).json({ message: "Signup failed" });
  } finally {
    client.release();
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(422).json({ message: "Missing credentials" });

  try {
    const { rows } = await pgPool.query(
      "SELECT id, email, name, password, role, profile_picture, phone_number, bio, is_verified, status FROM users WHERE email = $1",
      [email.trim()]
    );

    const user = rows[0];
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    if (user.is_verified === false) {
      return res.status(403).json({ message: "Please verify your email before logging in." });
    }

    if (user.status === "banned") {
      return res.status(403).json({ message: "Your account has been permanently banned due to safety violations." });
    }

    if (user.status === "suspended") {
      return res.status(403).json({ message: "Your account is temporarily suspended. Please contact support." });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid email or password" });

    const token = generateToken(user.id, user.email, user.role);

    res.clearCookie("student_auth_token", clearCookieOptions);
    res.clearCookie("mentor_auth_token", clearCookieOptions);
    res.clearCookie("admin_auth_token", clearCookieOptions); 

    if (user.role === "student") {
      res.cookie("student_auth_token", token, authCookieOptions);
      try { await handleLoginPoints(user.id); } catch (e) { console.error("Error giving login points", e); }
    } else if (user.role === "mentor") {
      res.cookie("mentor_auth_token", token, authCookieOptions);
    } else {
      res.cookie("admin_auth_token", token, authCookieOptions);
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile_picture: user.profile_picture,
        phone_number: user.phone_number,
        bio: user.bio,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
};

export const forgotPassword = async (req: AuthRequest, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(422).json({ message: "Email is required" });
  }

  try {
    const { rows } = await pgPool.query(
      `SELECT id, email, name, status
       FROM users
       WHERE email = $1`,
      [email.trim()]
    );

    const user = rows[0];

    if (!user || ["suspended", "banned"].includes(user.status)) {
      return res.json({
        success: true,
        message: "If an account exists for that email, a password reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await pgPool.query(
      `UPDATE users
       SET password_reset_token = $1,
           password_reset_expires_at = $2
       WHERE id = $3`,
      [resetTokenHash, resetExpiresAt, user.id]
    );

    const resetLink = `${process.env.APP_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail(user.email, user.name, resetLink);

    res.json({
      success: true,
      message: "If an account exists for that email, a password reset link has been sent.",
    });
  } catch (err) {
    console.error("forgotPassword error:", err);
    res.status(500).json({ message: "Failed to process password reset request" });
  }
};

export const resetPassword = async (req: AuthRequest, res: Response) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(422).json({ message: "Reset token and new password are required" });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters long" });
  }

  const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");

  try {
    const { rows } = await pgPool.query(
      `SELECT id, status
       FROM users
       WHERE password_reset_token = $1
         AND password_reset_expires_at > NOW()`,
      [resetTokenHash]
    );

    const user = rows[0];

    if (!user || ["suspended", "banned"].includes(user.status)) {
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await pgPool.query(
      `UPDATE users
       SET password = $1,
           password_reset_token = NULL,
           password_reset_expires_at = NULL
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    res.json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    console.error("resetPassword error:", err);
    res.status(500).json({ message: "Failed to reset password" });
  }
};

export const logout = (_req: AuthRequest, res: Response) => {
  res.clearCookie("student_auth_token", clearCookieOptions);
  res.clearCookie("mentor_auth_token", clearCookieOptions);
  res.clearCookie("admin_auth_token", clearCookieOptions);
  res.json({ success: true, message: "Logged out successfully" });
};

export const getProfile = (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  res.json({
    success: true,
    user: req.user,
  });
};

export const updateAccount = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const { name, phone_number, bio } = req.body;
  let profilePicture: string | undefined;

  if (req.file) {
    try {
      const result = await uploadToCloudinary(req.file);
      profilePicture = result.secure_url;
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      return res.status(500).json({ success: false, message: "Failed to upload image to cloud" });
    }
  }

  const client = await pgPool.connect();
  try {
    const { rows } = await client.query(
      `UPDATE users 
       SET name = COALESCE($1, name), 
           profile_picture = COALESCE($2, profile_picture), 
           phone_number = COALESCE($3, phone_number), 
           bio = COALESCE($4, bio), 
           updated_at = NOW() 
       WHERE id = $5 
       RETURNING id, name, email, role, profile_picture, phone_number, bio`,
      [name, profilePicture, phone_number, bio, userId]
    );

    res.json({ success: true, message: "Account updated successfully", user: rows[0] });
  } catch (err) {
    console.error("updateAccount error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "Both current and new passwords are required" });
  }

  const client = await pgPool.connect();
  try {
    const { rows } = await client.query("SELECT password FROM users WHERE id = $1", [userId]);
    const user = rows[0];

    if (!user || !user.password) {
      return res.status(400).json({ success: false, message: "Password not set for this account (Social login?)" });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: "Incorrect current password" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await client.query("UPDATE users SET password = $1 WHERE id = $2", [hashedNewPassword, userId]);

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("changePassword error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};

export const verifyEmail = async (req: AuthRequest, res: Response) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Validation token missing",
    });
  }

  try {
    const { rows } = await pgPool.query(
      `
      UPDATE users
      SET is_verified = true,
          verification_token = NULL
      WHERE verification_token = $1
      RETURNING id, email, role
      `,
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    const user = rows[0];
    const authToken = generateToken(user.id, user.email, user.role);

    res.clearCookie("student_auth_token", clearCookieOptions);
    res.clearCookie("mentor_auth_token", clearCookieOptions);
    res.clearCookie("admin_auth_token", clearCookieOptions);

    if (user.role === "student") {
      res.cookie("student_auth_token", authToken, authCookieOptions);
    } else if (user.role === "mentor") {
      res.cookie("mentor_auth_token", authToken, authCookieOptions);
    } else {
      res.cookie("admin_auth_token", authToken, authCookieOptions);
    }

    res.json({
      success: true,
      message: "Email verified successfully",
      role: user.role,
    });
  } catch (err) {
    console.error("verifyEmail error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error during verification",
    });
  }
};