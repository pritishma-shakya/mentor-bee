import { Router } from "express";
import { generateSignature } from "../controllers/paymentController";

const router = Router();

router.post("/generate-signature", generateSignature);

export default router;  