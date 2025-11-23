import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SECRET_KEY!;

export const generateToken = (id: string, email: string) => {
  return jwt.sign({ id, email }, JWT_SECRET, { expiresIn: "7d" });
};
