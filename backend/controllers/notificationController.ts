import { Response } from "express";
import { pgPool } from "../config/database";
import { AuthRequest } from "../middlewares/authMiddleware";

export const getNotifications = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    const { rows } = await pgPool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("getNotifications error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    await pgPool.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );
    res.json({ success: true, message: "Notification marked as read" });
  } catch (err) {
    console.error("markAsRead error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    await pgPool.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1`,
      [req.user.id]
    );
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    console.error("markAllAsRead error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
