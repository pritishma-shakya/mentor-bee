import { Router } from "express";
import { signup, login, logout, getProfile } from "../controllers/authController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", authenticate, logout); 
router.get("/profile", authenticate, getProfile); 

export default router;