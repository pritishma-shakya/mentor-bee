import { Router } from "express";
import { submitReview, getMentorReviews, getMyReviews } from "../controllers/reviewController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

// Submit a review (student)
router.post("/", authenticate, submitReview);

// Get reviews for the currently logged-in mentor
router.get("/my-reviews", authenticate, getMyReviews);

// Get reviews for a specific mentor
router.get("/mentor/:mentorId", getMentorReviews);

export default router;
