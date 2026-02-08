import { Router, Response } from "express";
import { AuthRequest, authenticate } from "../middlewares/authMiddleware";
import { getMentorSchedules, upsertSchedule, deleteSchedule } from "../controllers/scheduleController";
import { pgPool } from "../config/database";

const router = Router();

// Helper to get mentor ID
const getMentorId = async (userId: string) => {
  const { rows } = await pgPool.query(`SELECT id FROM mentors WHERE user_id=$1`, [userId]);
  return rows.length ? rows[0].id : null;
};

// Get all schedules
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const mentorId = await getMentorId(userId);
    if (!mentorId) return res.status(400).json({ message: "Mentor not found" });

    const schedules = await getMentorSchedules(mentorId);
    res.json(schedules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Add or update schedule
router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { date, times, originalDate } = req.body;

  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  if (!date || !times?.length) return res.status(400).json({ message: "Date and times required" });

  try {
    const mentorId = await getMentorId(userId);
    if (!mentorId) return res.status(400).json({ message: "Mentor not found" });

    const schedule = await upsertSchedule(mentorId, date, times, originalDate);
    res.json({ message: "Availability saved", schedule });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete schedule
router.delete("/:date", authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { date } = req.params;

  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const mentorId = await getMentorId(userId);
    if (!mentorId) return res.status(400).json({ message: "Mentor not found" });

    await deleteSchedule(mentorId, date);
    res.json({ message: "Schedule deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
