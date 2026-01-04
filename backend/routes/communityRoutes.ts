import { Router } from "express";
import {
  getPosts,
  createPost,
  reactToPost,
  addComment,
  getTags,
  createTag,
} from "../controllers/communityController";
import { authenticate} from "../middlewares/authMiddleware";

const router = Router();

// Logged-in users only
router.get("/posts", authenticate, getPosts);
router.post("/posts", authenticate, createPost);
router.post("/posts/:postId/react", authenticate, reactToPost);
router.post("/posts/:postId/comments", authenticate, addComment);
router.get("/tags", authenticate, getTags);
router.post("/tags", authenticate, createTag);

export default router;
