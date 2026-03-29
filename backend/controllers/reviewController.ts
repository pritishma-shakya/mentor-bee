import { Response } from "express";
import { pgPool } from "../config/database";
import { AuthRequest } from "../middlewares/authMiddleware";

// Submit a review for a session
export const submitReview = async (req: AuthRequest, res: Response) => {
  const studentId = req.user?.id;
  const { sessionId, rating, comment } = req.body;

  if (!studentId) return res.status(401).json({ success: false, message: "Unauthorized" });
  if (!sessionId || !rating) return res.status(400).json({ success: false, message: "Session ID and rating are required" });

  const client = await pgPool.connect();
  try {
    // 1. Verify session exists and is 'Completed'
    const { rows: sessionRows } = await client.query(
      "SELECT id, mentor_id, student_id, status FROM sessions WHERE id = $1",
      [sessionId]
    );

    if (sessionRows.length === 0) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    const session = sessionRows[0];

    // 2. Ensure user is the student of that session
    if (session.student_id !== studentId) {
      return res.status(403).json({ success: false, message: "You can only review your own sessions" });
    }

    // 3. Ensure session is completed
    if (session.status !== "Completed") {
      return res.status(400).json({ success: false, message: "You can only review completed sessions" });
    }

    // 4. Check if already reviewed
    const { rows: existingReview } = await client.query(
      "SELECT id FROM reviews WHERE session_id = $1",
      [sessionId]
    );

    if (existingReview.length > 0) {
      return res.status(400).json({ success: false, message: "You have already reviewed this session" });
    }

    // 5. Insert review
    await client.query(
      "INSERT INTO reviews (session_id, student_id, mentor_id, rating, comment) VALUES ($1, $2, $3, $4, $5)",
      [sessionId, studentId, session.mentor_id, rating, comment || null]
    );

    res.status(201).json({ success: true, message: "Review submitted successfully" });
  } catch (err) {
    console.error("submitReview error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    client.release();
  }
};

// Get reviews for a specific mentor
export const getMentorReviews = async (req: AuthRequest, res: Response) => {
  const { mentorId } = req.params;

  try {
    const { rows: reviews } = await pgPool.query(
      `SELECT r.*, u.name as student_name, u.profile_picture as student_picture
       FROM reviews r
       JOIN users u ON r.student_id = u.id
       WHERE r.mentor_id = $1
       ORDER BY r.created_at DESC`,
      [mentorId]
    );

    res.json({ success: true, data: reviews });
  } catch (err) {
    console.error("getMentorReviews error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get reviews for the currently logged-in mentor
export const getMyReviews = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    // 1. Get mentor ID from user ID
    const { rows: mentorRows } = await pgPool.query(
      "SELECT id FROM mentors WHERE user_id = $1",
      [userId]
    );

    if (mentorRows.length === 0) {
      return res.status(404).json({ success: false, message: "Mentor profile not found" });
    }

    const mentorId = mentorRows[0].id;

    // 2. Fetch reviews
    const { rows: reviews } = await pgPool.query(
      `SELECT r.*, u.name as student_name, u.profile_picture as student_picture
       FROM reviews r
       JOIN users u ON r.student_id = u.id
       WHERE r.mentor_id = $1
       ORDER BY r.created_at DESC`,
      [mentorId]
    );

    res.json({ success: true, data: reviews });
  } catch (err) {
    console.error("getMyReviews error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
