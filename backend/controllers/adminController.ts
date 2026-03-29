import { Response } from "express";
import { pgPool } from "../config/database";
import { AuthRequest } from "../middlewares/authMiddleware";
import { createNotification } from "../utils/notificationService";

export const getDashboardSummary = async (_req: AuthRequest, res: Response) => {
  const client = await pgPool.connect();
  try {
    const { rows: userRows } = await client.query(`SELECT COUNT(*) AS total FROM users where role != 'admin'`);
    const { rows: mentorRows } = await client.query(`SELECT COUNT(*) AS total FROM mentors`);
    const { rows: sessionRows } = await client.query(`SELECT COUNT(*) AS total FROM sessions`);

    const { rows: revRows } = await client.query(`SELECT SUM(admin_revenue) as total_rev FROM payments`);
    const revenue = revRows[0].total_rev ? parseFloat(revRows[0].total_rev) : 0;

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

// Get all transactions
export const getTransactions = async (_req: AuthRequest, res: Response) => {
  const client = await pgPool.connect();
  try {
    const { rows } = await client.query(`
      SELECT p.id, p.transaction_uuid, p.total_amount, p.admin_revenue, p.mentor_revenue, p.created_at, 
             s.name as student_name, s.email as student_email,
             m_u.name as mentor_name, m_u.email as mentor_email
      FROM payments p
      JOIN users s ON p.student_id = s.id
      JOIN mentors m ON p.mentor_id = m.id
      JOIN users m_u ON m.user_id = m_u.id
      ORDER BY p.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("getTransactions error:", err);
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

    // Notify the mentor's user of approval/rejection
    try {
      const { rows: mentorUser } = await client.query(
        `SELECT user_id FROM mentors WHERE id = $1`, [id]
      );
      if (mentorUser.length) {
        const io = (req as any).app?.get?.("io");
        if (action === "accept") {
          await createNotification({
            userId: mentorUser[0].user_id, type: "interaction",
            title: "Mentor Application Approved 🎉",
            message: "Congratulations! Your mentor application has been approved. You can now start accepting sessions.",
            data: {}, io,
          });
        } else if (action === "reject") {
          await createNotification({
            userId: mentorUser[0].user_id, type: "interaction",
            title: "Mentor Application Update",
            message: "Your mentor application has been reviewed. Unfortunately it was not approved at this time.",
            data: {}, io,
          });
        } else if (action === "suspend") {
          await createNotification({
            userId: mentorUser[0].user_id, type: "interaction",
            title: "Account Suspended",
            message: "Your mentor account has been suspended. Please contact admin for more information.",
            data: {}, io,
          });
        }
      }
    } catch (notifErr) {
      console.error("Mentor approval notification error:", notifErr);
    }

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
      `SELECT m.id, u.name, u.email, m.status, m.verified_at, u.created_at,
              (SELECT AVG(rating) FROM reviews WHERE mentor_id = m.id) as avg_rating,
              (SELECT COUNT(*) FROM reviews WHERE mentor_id = m.id) as review_count
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

// Get all sessions (admin view)
export const getAllSessions = async (_req: AuthRequest, res: Response) => {
  const client = await pgPool.connect();
  try {
    const { rows } = await client.query(`
      SELECT s.id, s.date, s.time, s.course, s.type, s.location, s.status, s.payment_status,
             s.notes, s.created_at,
             stu.name AS student_name, stu.email AS student_email,
             m_u.name AS mentor_name, m_u.email AS mentor_email,
             p.total_amount, p.admin_revenue, p.mentor_revenue, p.transaction_uuid
      FROM sessions s
      JOIN users stu ON stu.id = s.student_id
      JOIN mentors m ON m.id = s.mentor_id
      JOIN users m_u ON m_u.id = m.user_id
      LEFT JOIN payments p ON p.session_id = s.id
      ORDER BY s.date DESC, s.time DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("getAllSessions error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};

// Mark an in-person session as cash paid
export const markSessionCashPaid = async (req: AuthRequest, res: Response) => {
  const { sessionId } = req.params;
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');

    // Update payment status on session
    const { rows: sessionRows } = await client.query(
      `UPDATE sessions SET payment_status = 'Paid' WHERE id = $1 RETURNING *`,
      [sessionId]
    );
    if (!sessionRows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: "Session not found" });
    }
    const session = sessionRows[0];

    // Only insert payment record if not already exists
    const { rows: existingPayment } = await client.query(
      `SELECT id FROM payments WHERE session_id = $1`, [sessionId]
    );

    if (!existingPayment.length) {
      const { rows: mentorInfo } = await client.query(
        `SELECT hourly_rate FROM mentors WHERE id = $1`, [session.mentor_id]
      );
      const amount = mentorInfo[0]?.hourly_rate || 0;
      const adminRev = amount * 0.20;
      const mentorRev = amount * 0.80;

      await client.query(
        `INSERT INTO payments (session_id, student_id, mentor_id, total_amount, admin_revenue, mentor_revenue)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [sessionId, session.student_id, session.mentor_id, amount, adminRev, mentorRev]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: "Session marked as cash paid" });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("markSessionCashPaid error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};
