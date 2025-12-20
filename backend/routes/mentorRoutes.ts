import { Router } from "express";
import {
  setupMentorProfile,
  getMentorProfile,
  updateMentorProfile,
  listMentors,
  listExpertise
} from "../controllers/mentorController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.get("/expertise", listExpertise);
router.post("/setup", authenticate, setupMentorProfile);
router.put("/update", authenticate, updateMentorProfile);
router.get("/:mentorId", getMentorProfile);
router.get("/", listMentors);

export default router;
