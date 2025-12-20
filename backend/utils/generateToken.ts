import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SECRET_KEY;
if (!JWT_SECRET) throw new Error("SECRET_KEY is not defined");

export type UserRole = "student" | "mentor";

export const generateToken = (id: string, email: string, role: UserRole) => {
  return jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: "7d" });
};
