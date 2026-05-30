import { Response } from "express";
import { pgPool } from "../config/database";
import { AuthRequest } from "../middlewares/authMiddleware";

export const getRefundHistory = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const role = req.user?.role;

  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    let query = `
      SELECT r.*,
             COALESCE(r.refund_amount, r.amount, 0) AS refund_amount,
             COALESCE(r.refund_percentage, r.percentage, 0) AS refund_percentage,
             s.course,
             s.date,
             s.time,
             stu.name AS student_name,
             mentor_user.name AS mentor_name
      FROM refunds r
      JOIN sessions s ON s.id::text = r.session_id::text
      JOIN users stu ON stu.id::text = r.student_id::text
      JOIN mentors m ON m.id::text = s.mentor_id::text
      JOIN users mentor_user ON mentor_user.id::text = m.user_id::text
    `;
    let params: string[] = [];

    if (role === "student") {
      query += " WHERE r.student_id::text = $1::text";
      params = [userId];
    } else if (role === "mentor") {
      query += " WHERE m.user_id::text = $1::text";
      params = [userId];
    } else if (role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    query += " ORDER BY r.created_at DESC";

    const { rows } = await pgPool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("getRefundHistory error:", err);
    res.status(500).json({ message: "Failed to load refunds" });
  }
};
