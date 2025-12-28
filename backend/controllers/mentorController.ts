import { Response } from "express";
import { pgPool } from "../config/database";
import { AuthRequest } from "../middlewares/authMiddleware";

// =====================
// List all expertise
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

// =====================
// Setup mentor profile
// =====================
export const setupMentorProfile = async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== "mentor") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  const { bio, experience, location, responseTime, expertiseIds, hourlyRate } = req.body;

  if (!bio || !experience || !location || !Array.isArray(expertiseIds)) {
    return res.status(422).json({ success: false, message: "All fields required" });
  }

  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `INSERT INTO mentors (user_id, bio, experience, location, response_time, hourly_rate)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [req.user.id, bio, experience, location, responseTime || null, hourlyRate || null]
    );

    const mentorId = rows[0].id;

    for (const id of expertiseIds) {
      await client.query(
        "INSERT INTO mentor_expertise (mentor_id, expertise_id) VALUES ($1,$2)",
        [mentorId, id]
      );
    }

    await client.query("COMMIT");
    res.json({ success: true, message: "Mentor profile setup complete" });
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
       SET bio = $1, experience = $2, location = $3, hourly_rate = $4, response_time = $5, updated_at = NOW()
       WHERE user_id = $6
       RETURNING id`,
      [bio, experience, location, hourlyRate || null, responseTime || null, req.user.id]
    );

    const mentor = rows[0];
    if (!mentor) {
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, message: "Mentor not found" });
    }

    if (Array.isArray(expertiseIds)) {
      await client.query("DELETE FROM mentor_expertise WHERE mentor_id = $1", [mentor.id]);
      for (const id of expertiseIds) {
        await client.query(
          "INSERT INTO mentor_expertise (mentor_id, expertise_id) VALUES ($1,$2)",
          [mentor.id, id]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ success: true, message: "Mentor profile updated" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("updateMentorProfile error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};

// =====================
// Get single mentor profile
// =====================
export const getMentorProfile = async (req: AuthRequest, res: Response) => {
  const { mentorId } = req.params;
  const client = await pgPool.connect();
  try {
    const { rows } = await client.query(
      `SELECT m.*, u.name AS full_name, u.email, u.profile_picture, u."status"
       FROM mentors m
       JOIN users u ON m.user_id = u.id
       WHERE m.id = $1`,
      [mentorId]
    );

    if (rows.length === 0) return res.status(404).json({ success: false, message: "Mentor not found" });

    const mentor = rows[0];

    const { rows: expertiseRows } = await client.query(
      `SELECT e.id, e.name
       FROM mentor_expertise me
       JOIN expertise e ON me.expertise_id = e.id
       WHERE me.mentor_id = $1`,
      [mentor.id]
    );

    mentor.expertise = expertiseRows;
    res.json({ success: true, data: mentor });
  } catch (err) {
    console.error("getMentorProfile error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};

// =====================
// List all mentors
// =====================
export const listMentors = async (_req: AuthRequest, res: Response) => {
  const client = await pgPool.connect();
  try {
    const { rows: mentors } = await client.query(
      `SELECT m.*, u.name AS full_name, u.email, u.profile_picture, u."status"
       FROM mentors m
       JOIN users u ON m.user_id = u.id
       ORDER BY m.created_at DESC`
    );

    if (mentors.length === 0) return res.json({ success: true, data: [] });

    const mentorIds = mentors.map(m => m.id);
    const { rows: expertiseRows } = await client.query(
      `SELECT me.mentor_id, e.id AS expertise_id, e.name
       FROM mentor_expertise me
       JOIN expertise e ON me.expertise_id = e.id
       WHERE me.mentor_id = ANY($1::uuid[])`,
      [mentorIds]
    );

    const expertiseMap = mentorIds.reduce((acc, id) => {
      acc[id] = [];
      return acc;
    }, {} as Record<string, { id: string; name: string }[]>);

    expertiseRows.forEach(e => {
      expertiseMap[e.mentor_id].push({ id: e.expertise_id, name: e.name });
    });

    const result = mentors.map(m => ({ ...m, expertise: expertiseMap[m.id] || [] }));

    res.json({ success: true, data: result });
  } catch (err) {
    console.error("listMentors error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
};
