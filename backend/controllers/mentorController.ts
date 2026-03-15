import { Response } from "express";
import { pgPool } from "../config/database";
import { AuthRequest } from "../middlewares/authMiddleware";
import cloudinary from "../config/cloudinary";

// =====================
// List all expertise (for dropdown when setting up profile)
// =====================
export const listExpertise = async (_req: AuthRequest, res: Response) => {
  const client = await pgPool.connect();
  try {
    const { rows } = await client.query("SELECT id, name FROM expertise ORDER BY name");
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("listExpertise error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};

export const setupMentorProfile = async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== "mentor") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  const {
    bio,
    experience,
    location,
    responseTime,
    expertiseIds,
    hourlyRate,
  } = req.body as {
    bio: string;
    experience: string;
    location: string;
    responseTime?: string;
    expertiseIds: string[];
    hourlyRate?: number | null;
  };

  if (!bio || !experience || !location || !Array.isArray(expertiseIds) || expertiseIds.length === 0) {
    return res.status(422).json({
      success: false,
      message: "All required fields must be provided",
    });
  }

  const client = await pgPool.connect();

  try {
    await client.query("BEGIN");

    // =========================
    // Upload profile picture if provided
    // =========================
    let profilePictureUrl: string | null = null;

    if (req.file) {
      // Use non-null assertion (!) because we already checked req.file exists
      const buffer = req.file.buffer!;
      
      const uploadResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "mentor_profiles",
              public_id: req.user!.id,
              overwrite: true,
              resource_type: "image",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          )
          .end(buffer); // safe now
      });

      profilePictureUrl = uploadResult.secure_url;

      await client.query(
        "UPDATE users SET profile_picture = $1 WHERE id = $2",
        [profilePictureUrl, req.user.id]
      );
    }

    // =========================
    // Insert mentor profile
    // =========================
    const { rows } = await client.query(
      `INSERT INTO mentors
         (user_id, bio, experience, location, response_time, hourly_rate, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING id`,
      [req.user.id, bio, experience, location, responseTime || null, hourlyRate || null]
    );

    const mentorId: string = rows[0].id;

    // =========================
    // Insert expertise
    // =========================
    for (const expId of expertiseIds) {
      await client.query(
        `INSERT INTO mentor_expertise (mentor_id, expertise_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [mentorId, expId]
      );
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Mentor profile setup complete. Waiting for admin approval.",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("setupMentorProfile error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};


// =====================
// Update mentor profile
// =====================
export const updateMentorProfile = async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== "mentor") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  const { bio, experience, location, hourlyRate, responseTime, expertiseIds } = req.body;

  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `UPDATE mentors
       SET bio = $1,
           experience = $2,
           location = $3,
           hourly_rate = $4,
           response_time = $5,
           updated_at = NOW()
       WHERE user_id = $6
       RETURNING id`,
      [bio, experience, location, hourlyRate || null, responseTime || null, req.user.id]
    );

    const mentor = rows[0];
    if (!mentor) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Mentor profile not found" });
    }

    // Update expertise if provided
    if (Array.isArray(expertiseIds)) {
      await client.query("DELETE FROM mentor_expertise WHERE mentor_id = $1", [mentor.id]);

      for (const expId of expertiseIds) {
        await client.query(
          "INSERT INTO mentor_expertise (mentor_id, expertise_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [mentor.id, expId]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ success: true, message: "Mentor profile updated successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("updateMentorProfile error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};

// =====================
// Get SINGLE mentor profile (for student view or own view)
// =====================
export const getMentorProfile = async (req: AuthRequest, res: Response) => {
  const { mentorId } = req.params;

  const client = await pgPool.connect();
  try {
    const { rows } = await client.query(
      `SELECT 
         m.id,
         m.user_id,
         m.bio,
         m.experience,
         m.location,
         m.response_time,
         m.hourly_rate,
         m.status,
         m.created_at,
         u.name AS full_name,
         u.email,
         u.profile_picture
       FROM mentors m
       JOIN users u ON m.user_id = u.id
       WHERE m.id = $1`,
      [mentorId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Mentor not found" });
    }

    const mentor = rows[0];

    // Fetch expertise
    const { rows: expertiseRows } = await client.query(
      `SELECT e.id, e.name
       FROM mentor_expertise me
       JOIN expertise e ON me.expertise_id = e.id
       WHERE me.mentor_id = $1
       ORDER BY e.name`,
      [mentor.id]
    );

    mentor.expertise = expertiseRows || [];

    res.json({ success: true, data: mentor });
  } catch (err) {
    console.error("getMentorProfile error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};

// =====================
// List all ACCEPTED mentors (for student dashboard / discovery)
// =====================
export const listMentors = async (_req: AuthRequest, res: Response) => {
  const client = await pgPool.connect();
  try {
    const { rows: mentors } = await client.query(
      `SELECT 
         m.id,
         m.user_id,
         m.bio,
         m.experience,
         m.location,
         m.response_time,
         m.hourly_rate,
         m.created_at,
         u.name AS full_name,
         u.email,
         u.profile_picture
       FROM mentors m
       JOIN users u ON m.user_id = u.id
       WHERE m.status = 'accepted'
       ORDER BY m.created_at DESC`
    );

    if (mentors.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const mentorIds = mentors.map((m) => m.id);

    const { rows: expertiseRows } = await client.query(
      `SELECT me.mentor_id, e.id AS expertise_id, e.name
       FROM mentor_expertise me
       JOIN expertise e ON me.expertise_id = e.id
       WHERE me.mentor_id = ANY($1::uuid[])
       ORDER BY e.name`,
      [mentorIds]
    );

    const expertiseMap: Record<string, any[]> = {};
    mentorIds.forEach((id) => (expertiseMap[id] = []));

    expertiseRows.forEach((e) => {
      expertiseMap[e.mentor_id].push({ id: e.expertise_id, name: e.name });
    });

    const result = mentors.map((m) => ({
      ...m,
      expertise: expertiseMap[m.id] || [],
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    console.error("listMentors error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};

// =====================
// Get mentor earnings (80% revenue split)
// =====================
export const getMentorEarnings = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const client = await pgPool.connect();
  try {
    // Get the mentor record for this user
    const { rows: mentorRows } = await client.query(
      `SELECT id FROM mentors WHERE user_id = $1`,
      [userId]
    );
    if (!mentorRows.length) {
      return res.status(404).json({ success: false, message: "Mentor not found" });
    }
    const mentorId = mentorRows[0].id;

    // Get summary stats
    const { rows: summaryRows } = await client.query(
      `SELECT 
         SUM(mentor_revenue) as total_revenue,
         COUNT(*) as total_payments
       FROM payments
       WHERE mentor_id = $1`,
      [mentorId]
    );

    // Monthly earnings (last 6 months)
    const { rows: monthlyRows } = await client.query(
      `SELECT 
         TO_CHAR(created_at, 'Mon YYYY') as month,
         SUM(mentor_revenue) as revenue
       FROM payments
       WHERE mentor_id = $1 AND created_at >= NOW() - INTERVAL '6 months'
       GROUP BY TO_CHAR(created_at, 'Mon YYYY'), DATE_TRUNC('month', created_at)
       ORDER BY DATE_TRUNC('month', created_at) ASC`,
      [mentorId]
    );

    // Recent transactions
    const { rows: transactions } = await client.query(
      `SELECT p.id, p.transaction_uuid, p.total_amount, p.mentor_revenue, p.created_at,
              u.name as student_name, u.email as student_email
       FROM payments p
       JOIN users u ON p.student_id = u.id
       WHERE p.mentor_id = $1
       ORDER BY p.created_at DESC`,
      [mentorId]
    );

    res.json({
      success: true,
      data: {
        totalRevenue: summaryRows[0].total_revenue ? parseFloat(summaryRows[0].total_revenue) : 0,
        totalPayments: parseInt(summaryRows[0].total_payments),
        monthlyEarnings: monthlyRows,
        transactions,
      },
    });
  } catch (err) {
    console.error("getMentorEarnings error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};

// =====================
// Get mentor dashboard stats (sessions, students, recent activity)
// =====================
export const getMentorDashboardStats = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const client = await pgPool.connect();
  try {
    // Get the mentor record for this user
    const { rows: mentorRows } = await client.query(
      `SELECT id FROM mentors WHERE user_id = $1`,
      [userId]
    );
    if (!mentorRows.length) {
      return res.status(404).json({ success: false, message: "Mentor not found" });
    }
    const mentorId = mentorRows[0].id;

    // Total sessions
    const { rows: sessionCountRows } = await client.query(
      `SELECT COUNT(*) as total FROM sessions WHERE mentor_id = $1`,
      [mentorId]
    );

    // Unique students
    const { rows: studentCountRows } = await client.query(
      `SELECT COUNT(DISTINCT student_id) as total FROM sessions WHERE mentor_id = $1`,
      [mentorId]
    );

    // Recent sessions (last 5)
    const { rows: recentSessions } = await client.query(
      `SELECT s.id, s.date, s.time, s.course, s.status, s.type,
              u.name as student_name, u.profile_picture as student_picture
       FROM sessions s
       JOIN users u ON u.id = s.student_id
       WHERE s.mentor_id = $1
       ORDER BY s.date DESC, s.time DESC
       LIMIT 5`,
      [mentorId]
    );

    res.json({
      success: true,
      data: {
        totalSessions: parseInt(sessionCountRows[0].total),
        totalStudents: parseInt(studentCountRows[0].total),
        recentSessions,
      },
    });
  } catch (err) {
    console.error("getMentorDashboardStats error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};