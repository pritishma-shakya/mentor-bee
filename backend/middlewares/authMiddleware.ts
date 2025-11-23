import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { pgPool } from "../config/database";

const JWT_SECRET = process.env.SECRET_KEY || "defaultsecret";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string | null;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };

    const { rows } = await pgPool.query(
      "SELECT id, email, name FROM users WHERE id = $1",
      [decoded.id]
    );

    if (!rows[0]) return res.status(401).json({ message: "User not found" });

    req.user = rows[0];
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
