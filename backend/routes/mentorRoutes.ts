import { Router, Request, Response } from "express";
import {
  setupMentorProfile,
  getMentorProfile,
  updateMentorProfile,
  listMentors,
  listExpertise,
  getMentorEarnings,
  getMentorDashboardStats,
  getMentorStudents
} from "../controllers/mentorController";
import { authenticate } from "../middlewares/authMiddleware";
import { upload } from "../middlewares/uploadMiddleware";
import { getMentorSchedules } from "../controllers/scheduleController";
const router = Router();

router.get("/expertise", listExpertise);
router.post("/setup", authenticate, upload.single("profilePicture"), setupMentorProfile);
router.put("/update", authenticate, updateMentorProfile);
router.get("/", listMentors); // list all mentors
router.get("/earnings", authenticate, getMentorEarnings); // mentor earnings (80%)
router.get("/dashboard-stats", authenticate, getMentorDashboardStats); // mentor dashboard stats
router.get("/my-students", authenticate, getMentorStudents); // mentor students list
router.get("/:mentorId", getMentorProfile); // dynamic route must come last

// routes/mentorRoutes.ts
router.get("/:mentorId/schedule", async (req: Request, res: Response) => {
  const { mentorId } = req.params;
  try {
    const schedules = await getMentorSchedules(mentorId);
    res.json({ success: true, data: schedules });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch schedule" });
  }
});

export default router;
