import { Response } from "express";
import { pgPool } from "../config/database";
import { AuthRequest } from "../middlewares/authMiddleware";

export const getDashboardSummary = async (_req: AuthRequest, res: Response) => {
  const client = await pgPool.connect();
  try {
    const { rows: userRows } = await client.query(`SELECT COUNT(*) AS total FROM users where role != 'admin'`);
    const { rows: mentorRows } = await client.query(`SELECT COUNT(*) AS total FROM mentors`);
    const { rows: sessionRows } = await client.query(`SELECT COUNT(*) AS total FROM sessions`);

    // If payments table doesn't exist, mock revenue
    const revenue = 0;

    res.json({
      success: true,
      data: {
        totalUsers: parseInt(userRows[0].total),
        mentors: parseInt(mentorRows[0].total),
        sessions: parseInt(sessionRows[0].total),
        revenue,
      },
    });
  } catch (err) {
    console.error("getDashboardSummary error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};

// Get recent users
export const getRecentUsers = async (_req: AuthRequest, res: Response) => {
  const client = await pgPool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, name, email, role, created_at 
       FROM users 
       ORDER BY created_at DESC 
       LIMIT 5`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("getRecentUsers error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};

// Get pending mentor approvals
export const getPendingMentorCount = async (_req: AuthRequest, res: Response) => {
  const client = await pgPool.connect();
  try {
    const { rows } = await client.query(
      `SELECT COUNT(*) AS count 
       FROM mentors 
       WHERE status = 'pending'`
    );
    res.json({ success: true, data: parseInt(rows[0].count) });
  } catch (err) {
    console.error("getPendingMentorCount error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};

export const listMentorRequests = async (_req: AuthRequest, res: Response) => {
  const client = await pgPool.connect();
  try {
    const { rows } = await client.query(
      `SELECT m.id,
              u.name AS full_name,
              u.email,
              u.profile_picture,
              m.bio,
              m.experience,
              m.location,
              m.hourly_rate,
              m.response_time,
              m.status,
              ARRAY_AGG(e.name) AS expertise
       FROM mentors m
       JOIN users u ON m.user_id = u.id
       LEFT JOIN mentor_expertise me ON me.mentor_id = m.id
       LEFT JOIN expertise e ON e.id = me.expertise_id
       GROUP BY m.id, u.name, u.email, u.profile_picture, m.bio, m.experience, m.location, m.hourly_rate, m.response_time, m.status
       ORDER BY m.created_at DESC`
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("listMentorRequests error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};

// Approve / Reject / Suspend mentor
export const updateMentorStatus = async (req: AuthRequest, res: Response) => {
  const { id, action } = req.params;
  const client = await pgPool.connect();

  try {
    if (!["accept", "reject", "suspend"].includes(action))
      return res.status(400).json({ success: false, message: "Invalid action" });

    const { rows } = await client.query("SELECT status FROM mentors WHERE id = $1", [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: "Mentor not found" });

    const currentStatus = rows[0].status;
    if (action === "suspend" && currentStatus !== "accepted")
      return res.status(400).json({ success: false, message: "Only accepted mentors can be suspended" });

    const newStatus = action === "accept" ? "accepted" : action === "reject" ? "rejected" : "suspended";

    let query, params;

    if (action === "accept") {
      query = "UPDATE mentors SET status = $1, verified_at = NOW() WHERE id = $2 RETURNING *";
      params = [newStatus, id];
    } else {
      query = "UPDATE mentors SET status = $1 WHERE id = $2 RETURNING *";
      params = [newStatus, id];
    }

    const { rows: updatedRows } = await client.query(query, params);


    res.json({ success: true, data: updatedRows[0] });
  } catch (err) {
    console.error("updateMentorStatus error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};

// List all students
export const listStudents = async (_req: AuthRequest, res: Response) => {
  const client = await pgPool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, name, email, role, created_at
       FROM users
       WHERE role = 'student'
       ORDER BY created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("listStudents error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};

// List all users (students + mentors)
export const listAllUsers = async (_req: AuthRequest, res: Response) => {
  const client = await pgPool.connect();
  try {
    const { rows } = await client.query(
      `SELECT u.id, u.name, u.email, u.role, m.status AS mentor_status
       FROM users u
       LEFT JOIN mentors m ON m.user_id = u.id
       ORDER BY u.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("listAllUsers error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};

// List all mentors (for admin tab)
export const listMentors = async (_req: AuthRequest, res: Response) => {
  const client = await pgPool.connect();
  try {
    const { rows } = await client.query(
      `SELECT m.id, u.name, u.email, m.status, m.verified_at, u.created_at
       FROM mentors m
       JOIN users u ON u.id = m.user_id
       ORDER BY u.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("listMentors error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};
