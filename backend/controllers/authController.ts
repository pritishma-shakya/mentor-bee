import { Response } from "express";
import bcrypt from "bcryptjs";
import { pgPool } from "../config/database";
import { generateToken } from "../utils/generateToken";
import { AuthRequest } from "../middlewares/authMiddleware"; // Import from correct file

export const signup = async (req: AuthRequest, res: Response) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(422).json({ 
      success: false,
      message: "All fields are required" 
    });
  }

  const client = await pgPool.connect();

  try {
    await client.query("BEGIN");

    const { rows: existingUser } = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({ 
        success: false,
        message: "User already exists" 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const { rows } = await client.query(
      "INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name",
      [email, hashedPassword, name]
    );

    const user = rows[0];
    const token = generateToken(user.id, user.email);

    await client.query("COMMIT");

    res.status(201).json({ 
      success: true,
      message: "User created successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        token
      }
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Signup error:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  } finally {
    client.release();
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(422).json({ 
      success: false,
      message: "Email and password required" 
    });
  }

  try {
    const { rows } = await pgPool.query(
      "SELECT id, email, name, password FROM users WHERE email = $1",
      [email]
    );

    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    const token = generateToken(user.id, user.email);

    res.json({ 
      success: true,
      message: "Login successful",
      data: {
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name 
        }, 
        token 
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
};

export const logout = (_req: AuthRequest, res: Response) => {
  res.json({ 
    success: true,
    message: "User logged out successfully" 
  });
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ 
    success: false,
    message: "Unauthorized" 
  });

  res.json({ 
    success: true,
    data: { user: req.user } 
  });
};