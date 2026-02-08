import { Router } from "express";
import {
  bookSession,
  getMentorSessions,
  getStudentSessions,
  updateSessionStatus,
  cancelSession,
} from "../controllers/sessionController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

// Book a session (student)
router.post("/", authenticate, bookSession);

// Get sessions for mentor
router.get("/mentor", authenticate, getMentorSessions);

// Get sessions for student
router.get("/student", authenticate, getStudentSessions);

// Update session status
router.patch("/:sessionId/status", authenticate, updateSessionStatus);

// Cancel/delete session
router.delete("/:sessionId", authenticate, cancelSession);

export default router;
