import { Router } from "express";
import {
  getStudentProfile,
  getLearningGoals,
  addLearningGoal,
  updateLearningGoal,
  getRewards,
  getSessions,
} from "../controllers/studentController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.get("/profile", authenticate, getStudentProfile);
router.get("/learning-goals", authenticate, getLearningGoals);
router.post("/learning-goals", authenticate, addLearningGoal);
router.put("/learning-goals/:goalId", authenticate, updateLearningGoal);
router.get("/rewards", authenticate, getRewards);
router.get("/sessions", authenticate, getSessions);

export default router;
