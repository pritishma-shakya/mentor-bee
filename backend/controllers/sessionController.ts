import { Request, Response } from "express";
import { pgPool } from "../config/database";
import { AuthRequest } from "../middlewares/authMiddleware";

// Create a new session (student books a session)
export const bookSession = async (req: AuthRequest, res: Response) => {
  const studentId = req.user?.id;
  const { mentor_id, date, time, course, notes, type, location } = req.body;

  if (!studentId) return res.status(401).json({ message: "Unauthorized" });
  if (!mentor_id || !date || !time || !course)
    return res.status(400).json({ message: "Missing required fields" });

  try {
    const { rows } = await pgPool.query(
      `INSERT INTO sessions 
       (mentor_id, student_id, date, time, course, notes, type, location, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, 'Pending')
       RETURNING *`,
      [mentor_id, studentId, date, time, course, notes || null, type || "Online", location || null]
    );

    res.status(201).json({ message: "Session booked", session: rows[0] });
  } catch (err: any) {
    console.error(err);
    if (err.code === "23505") {
      // Unique violation: double booking
      return res.status(400).json({ message: "Time slot already booked" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// Get sessions for a mentor
export const getMentorSessions = async (req: AuthRequest, res: Response) => {
  const mentorId = req.user?.id;
  if (!mentorId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const { rows } = await pgPool.query(
      `SELECT s.*, u.name AS student_name, u.profile_picture
       FROM sessions s
       JOIN mentors m ON s.mentor_id = m.id
       JOIN users u ON u.id = s.student_id
       WHERE m.user_id = $1
       ORDER BY s.date ASC, s.time ASC`,
      [mentorId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get sessions for a student
export const getStudentSessions = async (req: AuthRequest, res: Response) => {
  const studentId = req.user?.id;
  if (!studentId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const { rows } = await pgPool.query(
      `SELECT s.*, u.name AS mentor_name, u.profile_picture AS mentor_profile_picture, u.id AS mentor_user_id
       FROM sessions s
       JOIN mentors m ON m.id = s.mentor_id
       JOIN users u ON m.user_id = u.id
       WHERE s.student_id = $1
       ORDER BY s.date ASC, s.time ASC`,
      [studentId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateSessionStatus = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { sessionId } = req.params;
  const { status } = req.body;

  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  if (!status) return res.status(400).json({ message: "Status required" });

  try {
    const query = `
      UPDATE sessions 
      SET status = $1, 
          updated_at = now()
      WHERE id = $2
      RETURNING *`;
    const params = [status, sessionId];

    const { rows } = await pgPool.query(query, params);

    if (!rows.length) return res.status(404).json({ message: "Session not found" });

    res.json({ message: "Status updated", session: rows[0] });
  } catch (err) {
    console.error("Error updating session status:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Cancel a session (student or mentor)
export const cancelSession = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { sessionId } = req.params;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const { rows } = await pgPool.query(
      `DELETE FROM sessions WHERE id=$1 RETURNING *`,
      [sessionId]
    );
    if (!rows.length) return res.status(404).json({ message: "Session not found" });

    res.json({ message: "Session cancelled", session: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
