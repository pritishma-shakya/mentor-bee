import { Router } from "express";
import { authenticate } from "../middlewares/authMiddleware";
import { listMentorRequests, updateMentorStatus, listStudents, listAllUsers, listMentors,
    getDashboardSummary, getRecentUsers, getPendingMentorCount
 } from "../controllers/adminController";

const router = Router();

// Only admin can access these routes
router.use(authenticate);

router.get("/mentor-requests", listMentorRequests);
router.post("/mentor-requests/:id/:action", updateMentorStatus);
router.get("/students", listStudents);
router.get("/users", listAllUsers);
router.get("/mentors", listMentors);
router.get("/dashboard/summary", authenticate, getDashboardSummary);
router.get("/dashboard/recent-users", authenticate, getRecentUsers);
router.get("/dashboard/pending-mentors", authenticate, getPendingMentorCount);

export default router;
