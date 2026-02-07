import { Router } from "express";
import {
  setupMentorProfile,
  getMentorProfile,
  updateMentorProfile,
  listMentors,
  listExpertise
} from "../controllers/mentorController";
import { authenticate } from "../middlewares/authMiddleware";
import { upload } from "../middlewares/uploadMiddleware";

const router = Router();

router.get("/expertise", listExpertise);
router.post("/setup", authenticate, upload.single("profilePicture"), setupMentorProfile);
router.put("/update", authenticate, updateMentorProfile);
router.get("/", listMentors); // list all mentors
router.get("/:mentorId", getMentorProfile); // dynamic route must come last

export default router;
