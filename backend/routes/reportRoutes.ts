import express from "express";
import { authenticate } from "../middlewares/authMiddleware";
import { submitReport, getAllReports, updateReportStatus } from "../controllers/reportController";

const router = express.Router();

// Publicly accessible to authenticated users
router.post("/", authenticate, submitReport);

// Admin only routes
router.get("/admin", authenticate, getAllReports);
router.patch("/admin/:reportId", authenticate, updateReportStatus);

export default router;
