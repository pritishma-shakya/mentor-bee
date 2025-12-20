import { Response } from "express";
import bcrypt from "bcryptjs";
import { pgPool } from "../config/database";
import { generateToken, UserRole } from "../utils/generateToken";
import { AuthRequest } from "../middlewares/authMiddleware";

const VALID_ROLES: UserRole[] = ["student", "mentor"];

/* ---------------- Cookie helper ---------------- */
const setAuthCookie = (res: Response, token: string, role: UserRole) => {
  const cookieName = role === "student" ? "student_auth_token" : "mentor_auth_token";

  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/* ================= SIGNUP ================= */
export const signup = async (req: AuthRequest, res: Response) => {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name || !role)
    return res.status(422).json({ message: "All fields required" });
  if (!VALID_ROLES.includes(role)) return res.status(400).json({ message: "Invalid role" });

  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length) return res.status(409).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 12);

    const { rows } = await client.query(
      `INSERT INTO users (email, password, name, role)
       VALUES ($1,$2,$3,$4)
       RETURNING id, email, name, role`,
      [email, hashedPassword, name, role]
    );

    const user = rows[0];
    // console.log("User inserted:", user);

    const token = generateToken(user.id, user.email, user.role);
    setAuthCookie(res, token, user.role);

    await client.query("COMMIT");
    res.status(201).json({ user });
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
  const { email, password, role } = req.body;

  if (!email || !password || !role) return res.status(422).json({ message: "Missing credentials" });
  if (!VALID_ROLES.includes(role)) return res.status(400).json({ message: "Invalid role" });

  try {
    const { rows } = await pgPool.query(
      `SELECT id, email, name, password, role
       FROM users
       WHERE email = $1 AND role = $2`,
      [email, role]
    );

    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user.id, user.email, user.role);
    setAuthCookie(res, token, user.role);

    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
};

/* ================= LOGOUT ================= */
export const logout = (_req: AuthRequest, res: Response) => {
  // Clear both possible role cookies
  res.clearCookie("student_auth_token", { httpOnly: true, sameSite: "lax" });
  res.clearCookie("mentor_auth_token", { httpOnly: true, sameSite: "lax" });

  res.json({ message: "Logged out successfully" });
};


/* ================= PROFILE ================= */
export const getProfile = (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  res.json({ user: req.user });
};
