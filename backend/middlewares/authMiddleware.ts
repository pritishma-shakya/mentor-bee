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
    role: "student" | "mentor";
    profile_picture?: string;
  };
}

interface JwtPayload {
  id: string;
  email: string;
  role: "student" | "mentor";
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check student or mentor cookie
  const token =
    req.cookies?.student_auth_token ||
    req.cookies?.mentor_auth_token ||
    req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    const { rows } = await pgPool.query(
      `SELECT id, email, COALESCE(name,'') AS name, role, profile_picture
       FROM users
       WHERE id = $1`,
      [decoded.id]
    );

    if (!rows[0]) return res.status(401).json({ message: "User not found" });

    req.user = rows[0];
    next();
  } catch (err) {
    console.error("JWT verify error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
};
