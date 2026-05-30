import { Router } from "express";
import { authenticate } from "../middlewares/authMiddleware";
import { getRefundHistory } from "../controllers/refundController";

const router = Router();

router.get("/history", authenticate, getRefundHistory);

export default router;
