import { Router } from "express";
import { authenticate } from "../middlewares/authMiddleware";
import { 
    createPromoCode, 
    getPromoCodes, 
    updatePromoCodeStatus, 
    validatePromoCode,
    getMentorActivePromoCodes,
    deletePromoCode
} from "../controllers/promoCodeController";

const router = Router();

// Student-accessible (unauthenticated validation and listing)
router.post("/validate", validatePromoCode);
router.get("/mentor/:mentorId/active", getMentorActivePromoCodes);

// Authenticated routes
router.use(authenticate);

router.post("/", createPromoCode);
router.get("/", getPromoCodes);
router.patch("/:id/status", updatePromoCodeStatus);
router.delete("/:id", deletePromoCode);

export default router;
