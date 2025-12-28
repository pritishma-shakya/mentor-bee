import { Response } from "express";
import bcrypt from "bcryptjs";
import { pgPool } from "../config/database";
import { generateToken } from "../utils/generateToken";
import { AuthRequest } from "../middlewares/authMiddleware";

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
    if (user.role === "student") res.cookie("student_auth_token", token, authCookieOptions);
    else if (user.role === "mentor") res.cookie("mentor_auth_token", token, authCookieOptions);
    else res.cookie("auth_token", token, authCookieOptions);

    await client.query("COMMIT");

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
      "SELECT id, email, name, password, role FROM users WHERE email = $1",
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

    // set new cookie based on role
    if (user.role === "student") res.cookie("student_auth_token", token, authCookieOptions);
    else if (user.role === "mentor") res.cookie("mentor_auth_token", token, authCookieOptions);
    else res.cookie("auth_token", token, authCookieOptions);

    res.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
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
  res.clearCookie("auth_token", clearCookieOptions);
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
