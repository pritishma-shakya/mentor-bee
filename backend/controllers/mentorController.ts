import { Response } from "express";
import { pgPool } from "../config/database";
import { AuthRequest } from "../middlewares/authMiddleware";
import cloudinary from "../config/cloudinary";
import { uploadToCloudinary } from "../utils/cloudinaryUpload";

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
    console.error("setupMentorProfile Forbidden check failed:", {
      role: req.user?.role,
      id: req.user?.id,
      email: req.user?.email
    });
    return res.status(403).json({
      success: false,
      message: "Forbidden: Only mentors can complete this setup."
    });
  }
  const {
    bio,
    experience,
    location,
    responseTime,
    expertiseIds,
    hourlyRate,
    phone_number,
    customExpertise,
    highestDegree,
    phdDegree,
  } = req.body as {
    bio: string;
    experience: string;
    location: string;
    responseTime?: string;
    expertiseIds: string[];
    hourlyRate?: number | null;
    phone_number?: string;
    customExpertise?: string[];
    highestDegree?: string;
    phdDegree?: string;
  };

  if (!bio || !experience || !location || !Array.isArray(expertiseIds) || expertiseIds.length === 0 || !phone_number) {
    return res.status(422).json({
      success: false,
      message: "All required fields must be provided",
    });
  }

  const client = await pgPool.connect();

  try {
    await client.query("BEGIN");

    // =========================
    // Upload files if provided
    // =========================
    let profilePictureUrl: string | null = null;
    let citizenshipIdUrl: string | null = null;
    let bachelorsDegreeUrl: string | null = null;
    let mastersDegreeUrl: string | null = null;
    let experienceCertificateUrl: string | null = null;
    let plusTwoUrl: string | null = null;
    let phdUrl: string | null = null;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (files) {
      if (files.profilePicture?.[0]) {
        const result = await uploadToCloudinary(files.profilePicture[0]);
        profilePictureUrl = result.secure_url;
      }
      if (files.citizenshipId?.[0]) {
        const result = await uploadToCloudinary(files.citizenshipId[0]);
        citizenshipIdUrl = result.secure_url;
      }
      if (files.bachelorsDegree?.[0]) {
        const result = await uploadToCloudinary(files.bachelorsDegree[0]);
        bachelorsDegreeUrl = result.secure_url;
      }
      if (files.mastersDegree?.[0]) {
        const result = await uploadToCloudinary(files.mastersDegree[0]);
        mastersDegreeUrl = result.secure_url;
      }
      if (files.experienceCertificate?.[0]) {
        const result = await uploadToCloudinary(files.experienceCertificate[0]);
        experienceCertificateUrl = result.secure_url;
      }
      if (files.plusTwoTranscript?.[0]) {
        const result = await uploadToCloudinary(files.plusTwoTranscript[0]);
        plusTwoUrl = result.secure_url;
      }
      if (files.phdDegree?.[0]) {
        const result = await uploadToCloudinary(files.phdDegree[0]);
        phdUrl = result.secure_url;
      }
    }

    // Update user info (profile picture and phone number)
    await client.query(
      "UPDATE users SET profile_picture = COALESCE($1, profile_picture), phone_number = $2 WHERE id = $3",
      [profilePictureUrl, phone_number, req.user.id]
    );

    // =========================
    // Insert mentor profile
    // =========================
    const { rows } = await client.query(
      `INSERT INTO mentors
         (user_id, bio, experience, location, response_time, hourly_rate, status, 
          citizenship_id_url, bachelors_degree_url, masters_degree_url, experience_certificate_url,
          highest_degree, plus_two_url, phd_url)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, $10, $11, $12, $13)
       RETURNING id`,
      [
        req.user.id,
        bio,
        experience,
        location,
        responseTime || null,
        hourlyRate || null,
        citizenshipIdUrl,
        bachelorsDegreeUrl,
        mastersDegreeUrl,
        experienceCertificateUrl,
        highestDegree || null,
        plusTwoUrl,
        phdUrl
      ]
    );

    const mentorId: string = rows[0].id;

    // =========================
    // Insert expertise
    // =========================
    // Existing ones
    if (Array.isArray(expertiseIds)) {
      for (const expId of expertiseIds) {
        await client.query(
          `INSERT INTO mentor_expertise (mentor_id, expertise_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [mentorId, expId]
        );
      }
    }

    // New custom ones
    if (Array.isArray(customExpertise)) {
      for (const name of customExpertise) {
        if (!name || name.trim() === "") continue;

        // Insert expertise if it doesn't exist, or just get the ID
        const { rows: expRows } = await client.query(
          `INSERT INTO expertise (name) 
           VALUES ($1) 
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [name.trim()]
        );

        const newExpId = expRows[0].id;
        await client.query(
          `INSERT INTO mentor_expertise (mentor_id, expertise_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [mentorId, newExpId]
        );
      }
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

  const {
    bio,
    experience,
    location,
    hourlyRate,
    responseTime,
    expertiseIds,
    linkedin_url,
    portfolio_url,
    certifications,
    auto_accept,
    buffer_time
  } = req.body;

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
           linkedin_url = $6,
           portfolio_url = $7,
           certifications = $8,
           auto_accept = $9,
           buffer_time = $10,
           updated_at = NOW()
       WHERE user_id = $11
       RETURNING id`,
      [
        bio,
        experience,
        location,
        hourlyRate || null,
        responseTime || null,
        linkedin_url,
        portfolio_url,
        certifications,
        auto_accept,
        buffer_time,
        req.user.id
      ]
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
         u.profile_picture,
         u.phone_number,
         u.bio as user_bio
       FROM mentors m
       JOIN users u ON m.user_id = u.id
       WHERE m.id = $1`,
      [mentorId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Mentor not found" });
    }

    const mentor = rows[0];

    // Fetch average rating and review count
    const { rows: ratingRows } = await client.query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as review_count 
       FROM reviews 
       WHERE mentor_id = $1`,
      [mentorId]
    );

    mentor.rating = ratingRows[0].avg_rating ? parseFloat(parseFloat(ratingRows[0].avg_rating).toFixed(1)) : 0;
    mentor.review_count = parseInt(ratingRows[0].review_count);

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

    // Fetch ratings for all mentors in this list
    const { rows: ratingRows } = await client.query(
      `SELECT mentor_id, AVG(rating) as avg_rating, COUNT(*) as review_count 
        FROM reviews 
        WHERE mentor_id = ANY($1::uuid[])
        GROUP BY mentor_id`,
      [mentorIds]
    );

    const ratingMap: Record<string, { rating: number, count: number }> = {};
    ratingRows.forEach(r => {
      ratingMap[r.mentor_id] = {
        rating: parseFloat(parseFloat(r.avg_rating).toFixed(1)),
        count: parseInt(r.review_count)
      };
    });

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
      rating: ratingMap[m.id]?.rating || 0,
      review_count: ratingMap[m.id]?.count || 0,
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
    const { rows: countRows } = await client.query(
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
        totalSessions: parseInt(countRows[0].total),
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

// =====================
// Get list of unique students for the mentor
// =====================
export const getMentorStudents = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const client = await pgPool.connect();
  try {
    const { rows: mentorRows } = await client.query(
      `SELECT id FROM mentors WHERE user_id = $1`,
      [userId]
    );
    if (!mentorRows.length) {
      return res.status(404).json({ success: false, message: "Mentor not found" });
    }
    const mentorId = mentorRows[0].id;

    const { rows: students } = await client.query(
      `SELECT 
         u.id, 
         u.name, 
         u.email, 
         u.profile_picture,
         COUNT(s.id) as total_sessions,
         MAX(s.date) as last_session_date
       FROM sessions s
       JOIN users u ON s.student_id = u.id
       WHERE s.mentor_id = $1
       GROUP BY u.id, u.name, u.email, u.profile_picture
       ORDER BY last_session_date DESC`,
      [mentorId]
    );

    res.json({ success: true, data: students });
  } catch (err) {
    console.error("getMentorStudents error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};

export const getMyMentorProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const client = await pgPool.connect();

  try {
    // ⭐ SINGLE QUERY (mentor + user + documents together)
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

         -- documents (IMPORTANT FIX)
         m.citizenship_id_url,
         m.bachelors_degree_url,
         m.masters_degree_url,
         m.experience_certificate_url,
         m.plus_two_url,
         m.phd_url,

         u.name AS full_name,
         u.email,
         u.profile_picture,
         u.phone_number
       FROM mentors m
       JOIN users u ON m.user_id = u.id
       WHERE m.user_id = $1`,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Mentor not found" });
    }

    const mentor = rows[0];

    // ⭐ expertise
    const { rows: expertiseRows } = await client.query(
      `SELECT e.id, e.name
       FROM mentor_expertise me
       JOIN expertise e ON me.expertise_id = e.id
       WHERE me.mentor_id = $1`,
      [mentor.id]
    );

    mentor.expertise = expertiseRows || [];

    // ⭐ clean documents mapping (SAFE)
    mentor.documents = [
      mentor.citizenship_id_url && {
        name: "Citizenship",
        url: mentor.citizenship_id_url,
      },
      mentor.bachelors_degree_url && {
        name: "Bachelors Degree",
        url: mentor.bachelors_degree_url,
      },
      mentor.masters_degree_url && {
        name: "Masters Degree",
        url: mentor.masters_degree_url,
      },
      mentor.experience_certificate_url && {
        name: "Experience Certificate",
        url: mentor.experience_certificate_url,
      },
      mentor.plus_two_url && {
        name: "Plus Two Transcript",
        url: mentor.plus_two_url,
      },
      mentor.phd_url && {
        name: "PhD Degree",
        url: mentor.phd_url,
      },
    ].filter(Boolean);

    return res.json({ success: true, data: mentor });

  } catch (err) {
    console.error("getMyMentorProfile error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};