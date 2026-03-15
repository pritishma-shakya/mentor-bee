import { Response } from "express";
import { pgPool } from "../config/database";
import { AuthRequest } from "../middlewares/authMiddleware";

/* ===================== Helper ===================== */

const requireStudent = (req: AuthRequest, res: Response): boolean => {
  if (!req.user || req.user.role !== "student") {
    res.status(403).json({ success: false, message: "Forbidden" });
    return false;
  }
  return true;
};

/* ===================== Profile ===================== */

export const getStudentProfile = async (req: AuthRequest, res: Response) => {
  if (!requireStudent(req, res)) return;

  const client = await pgPool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, name, email, profile_picture, created_at
       FROM users
       WHERE id = $1`,
      [req.user!.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("getStudentProfile error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};

/* ===================== Learning Goals ===================== */

export const getLearningGoals = async (req: AuthRequest, res: Response) => {
  if (!requireStudent(req, res)) return;

  const client = await pgPool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, goal_text, target_time, progress
       FROM learning_goals
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user!.id]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("getLearningGoals error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch learning goals" });
  } finally {
    client.release();
  }
};

export const addLearningGoal = async (req: AuthRequest, res: Response) => {
  if (!requireStudent(req, res)) return;

  const { goal_text, target_time } = req.body;
  if (!goal_text || !target_time) {
    return res.status(422).json({ success: false, message: "Goal text and target time required" });
  }

  const client = await pgPool.connect();
  try {
    const { rows } = await client.query(
      `INSERT INTO learning_goals (user_id, goal_text, target_time, progress)
       VALUES ($1, $2, $3, 0)
       RETURNING *`,
      [req.user!.id, goal_text, target_time]
    );

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("addLearningGoal error:", err);
    res.status(500).json({ success: false, message: "Failed to add learning goal" });
  } finally {
    client.release();
  }
};

export const updateLearningGoal = async (req: AuthRequest, res: Response) => {
  if (!requireStudent(req, res)) return;

  const { goalId } = req.params;
  const { progress } = req.body;

  if (progress === undefined) {
    return res.status(422).json({ success: false, message: "Progress value required" });
  }

  const client = await pgPool.connect();
  try {
    const { rows } = await client.query(
      `UPDATE learning_goals
       SET progress = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [progress, goalId, req.user!.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Learning goal not found" });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("updateLearningGoal error:", err);
    res.status(500).json({ success: false, message: "Failed to update learning goal" });
  } finally {
    client.release();
  }
};

/* ===================== Rewards (SUMMARY) ===================== */

export const getRewards = async (req: AuthRequest, res: Response) => {
  if (!requireStudent(req, res)) return;

  const client = await pgPool.connect();
  try {
    const { rows: pointsRows } = await client.query(
      `SELECT COALESCE(SUM(points), 0) AS points
       FROM rewards
       WHERE student_id = $1`,
      [req.user!.id]
    );

    const { rows: sessionsRows } = await client.query(
       `SELECT COUNT(*) AS sessions FROM sessions WHERE student_id = $1 AND status = 'Completed'`,
       [req.user!.id]
    );

    const { rows: activitiesRows } = await client.query(
      `SELECT created_at, action, points
       FROM rewards
       WHERE student_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [req.user!.id]
    );

    const formattedActivities = activitiesRows.map(r => {
       const dateObj = new Date(r.created_at);
       const dFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
       return {
         date: dFormatter.format(dateObj),
         desc: r.action,
         points: `+${r.points}`
       };
    });

    res.json({
      success: true,
      data: {
        points: Number(pointsRows[0].points),
        sessions: Number(sessionsRows[0].sessions),
        hours: Number(sessionsRows[0].sessions) * 1,
        recentActivities: formattedActivities
      },
    });
  } catch (err) {
    console.error("getRewards error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch rewards" });
  } finally {
    client.release();
  }
};

/* ===================== Sessions ===================== */

export const getSessions = async (req: AuthRequest, res: Response) => {
  if (!requireStudent(req, res)) return;

  const client = await pgPool.connect();
  try {
    const { rows } = await client.query(
      `SELECT s.id, s.date, s.time, s.status,
              u.name AS mentor_name
       FROM sessions s
       JOIN mentors m ON s.mentor_id = m.id
       JOIN users u ON m.user_id = u.id
       WHERE s.student_id = $1
       ORDER BY s.date DESC, s.time DESC`,
      [req.user!.id]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("getSessions error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch sessions" });
  } finally {
    client.release();
  }
};
