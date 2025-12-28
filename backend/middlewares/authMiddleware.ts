import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { pgPool } from "../config/database";

const JWT_SECRET = process.env.SECRET_KEY!;
if (!JWT_SECRET) throw new Error("SECRET_KEY not set");

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: "student" | "mentor" | "admin";
    profile_picture?: string;
    status?: "pending" | "accepted" | "rejected" | "suspended";
  };
}

interface JwtPayload {
  id: string;
  email: string;
  role: "student" | "mentor" | "admin";
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Check all possible tokens
  const token =
    req.cookies?.student_auth_token ||
    req.cookies?.mentor_auth_token ||
    req.cookies?.admin_auth_token || // <-- added for admin
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null);

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    const { rows: userRows } = await pgPool.query(
      `SELECT id, email, COALESCE(name,'') AS name, role, profile_picture
       FROM users
       WHERE id = $1`,
      [decoded.id]
    );

    if (!userRows.length)
      return res.status(401).json({ message: "User not found" });

    const user = userRows[0];

    // Add mentor status if role is mentor
    if (user.role === "mentor") {
      const { rows: mentorRows } = await pgPool.query(
        `SELECT status, verified_at FROM mentors WHERE user_id = $1`,
        [user.id]
      );
      user.status = mentorRows.length ? mentorRows[0].status : "pending";
      (user as any).verified_at = mentorRows.length ? mentorRows[0].verified_at : null;
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("JWT verify error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Optional middleware to check for admin only
export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admins only" });
  }
  next();
};
