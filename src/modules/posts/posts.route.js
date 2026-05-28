import { Router } from "express";
import { createPost, getFeed } from "./posts.controller.js";
import { addComment, getCommentsForPost } from "./comments.controller.js"; // ◄── Add this import
import { protect } from "../auth/auth.middleware.js";

const router = Router();

// Apply protection gateway globally across all post and sub-comment interactions
router.use(protect);

// Post resource endpoints
router.post("/", createPost);
router.get("/", getFeed);

// Nested sub-resource comment endpoints
router.post("/:postId/comments", addComment);
router.get("/:postId/comments", getCommentsForPost);

export default router;
