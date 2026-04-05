import { Router } from "express";
import multer from "multer";
import * as communityController from "../controllers/communityController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/posts", authenticate, communityController.getPosts);
router.get("/tags", authenticate, communityController.getTags);
router.get("/top-contributors", authenticate, communityController.getTopContributors);

router.post("/posts", authenticate, upload.array("images"), communityController.createPost);
router.post("/posts/:postId/react", authenticate, communityController.reactToPost);
router.post("/posts/:postId/comments", authenticate, communityController.addComment);
router.post("/tags", authenticate, communityController.createTag);

export default router;
