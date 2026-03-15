import { Router } from "express";
import {
  bookSession,
  getMentorSessions,
  getStudentSessions,
  updateSessionStatus,
  requestCancellation,
  requestReschedule,
  respondToRequest,
  markSessionCashPaid,
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

// Reschedule request
router.post("/:sessionId/reschedule", authenticate, requestReschedule);

// Respond to reschedule/cancel request
router.post("/:sessionId/respond", authenticate, respondToRequest);

// Cancel request (used to be delete)
router.delete("/:sessionId", authenticate, requestCancellation);

// Mark session as cash paid (mentor for in-person sessions)
router.patch("/:sessionId/mark-cash-paid", authenticate, markSessionCashPaid);

export default router;
