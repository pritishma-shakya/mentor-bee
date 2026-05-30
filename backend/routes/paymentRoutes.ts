import { Router } from "express";
import { generateSignature, getUserPayments } from "../controllers/paymentController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.post("/generate-signature", generateSignature);
router.get("/history", authenticate, getUserPayments);

export default router;  