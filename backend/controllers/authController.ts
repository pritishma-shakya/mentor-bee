import { Response } from "express";
import bcrypt from "bcryptjs";
import { pgPool } from "../config/database";
import { generateToken } from "../utils/generateToken";
import { AuthRequest } from "../middlewares/authMiddleware";
import { createNotification, getAdminUserId } from "../utils/notificationService";
import { uploadToCloudinary } from "../utils/cloudinaryUpload";
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

/* ================= SIGNUP ================= */
export const signup = async (req: AuthRequest, res: Response) => {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name || !role)
    return res.status(422).json({ message: "All fields required" });

  if (!VALID_ROLES.includes(role))
    return res.status(400).json({ message: "Invalid role" });

  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const { rows } = await client.query(
      `INSERT INTO users (email, password, name, role)
       VALUES ($1,$2,$3,$4)
       RETURNING id, email, name, role`,
      [email, hashedPassword, name, role]
    );

    const user = rows[0];
    const token = generateToken(user.id, user.email, user.role);

    // set separate cookie
    if (user.role === "student") {
      res.cookie("student_auth_token", token, authCookieOptions);
      await addPoints(user.id, 20, "First account registration", client);
    } else if (user.role === "mentor") {
      res.cookie("mentor_auth_token", token, authCookieOptions);
    } else {
      res.cookie("admin_auth_token", token, authCookieOptions);
    }

    await client.query("COMMIT");

    // Notify admin of new user registration
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

    res.status(201).json({ success: true, user });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Signup error:", err);
    res.status(500).json({ message: "Signup failed" });
  } finally {
    client.release();
  }
};

/* ================= LOGIN ================= */
export const login = async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(422).json({ message: "Missing credentials" });

  try {
    const { rows } = await pgPool.query(
      "SELECT id, email, name, password, role, profile_picture, phone_number, bio, language, theme, timezone, email_notifications, push_notifications, sms_alerts, interests, skill_level, preferred_times FROM users WHERE email = $1",
      [email.trim()]
    );

    const user = rows[0];
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid email or password" });

    const token = generateToken(user.id, user.email, user.role);

    // clear old cookies
    res.clearCookie("student_auth_token", clearCookieOptions);
    res.clearCookie("mentor_auth_token", clearCookieOptions);
    res.clearCookie("admin_auth_token", clearCookieOptions); // Clear admin cookie too

    // set new cookie based on role
    if (user.role === "student") {
      res.cookie("student_auth_token", token, authCookieOptions);
      try { await handleLoginPoints(user.id); } catch(e) { console.error("Error giving login points", e); }
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
        language: user.language,
        theme: user.theme,
        timezone: user.timezone,
        email_notifications: user.email_notifications,
        push_notifications: user.push_notifications,
        sms_alerts: user.sms_alerts,
        interests: user.interests,
        skill_level: user.skill_level,
        preferred_times: user.preferred_times,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
};

/* ================= LOGOUT ================= */
export const logout = (_req: AuthRequest, res: Response) => {
  res.clearCookie("student_auth_token", clearCookieOptions);
  res.clearCookie("mentor_auth_token", clearCookieOptions);
  res.clearCookie("admin_auth_token", clearCookieOptions);
  res.json({ success: true, message: "Logged out successfully" });
};

/* ================= PROFILE ================= */
export const getProfile = (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  res.json({
    success: true,
    user: req.user,
  });
};

/* ================= UPDATE ACCOUNT ================= */
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

// =====================
// Update user preferences
// =====================
export const updatePreferences = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const {
    language,
    theme,
    timezone,
    email_notifications,
    push_notifications,
    sms_alerts,
    interests,
    skill_level,
    preferred_times
  } = req.body;

  const client = await pgPool.connect();
  try {
    const { rows } = await client.query(
      `UPDATE users 
       SET language = COALESCE($1, language),
           theme = COALESCE($2, theme),
           timezone = COALESCE($3, timezone),
           email_notifications = COALESCE($4, email_notifications),
           push_notifications = COALESCE($5, push_notifications),
           sms_alerts = COALESCE($6, sms_alerts),
           interests = COALESCE($7, interests),
           skill_level = COALESCE($8, skill_level),
           preferred_times = COALESCE($9, preferred_times),
           updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [
        language,
        theme,
        timezone,
        email_notifications,
        push_notifications,
        sms_alerts,
        interests,
        skill_level,
        preferred_times,
        userId
      ]
    );

    res.json({
      success: true,
      message: "Preferences updated successfully",
      user: rows[0]
    });
  } catch (err) {
    console.error("updatePreferences error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};

/* ================= CHANGE PASSWORD ================= */
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
