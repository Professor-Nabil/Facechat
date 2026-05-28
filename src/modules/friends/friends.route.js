import { Router } from "express";
import { protect } from "../auth/auth.middleware.js";
import {
  sendFriendRequest,
  acceptFriendRequest,
  getFriendsList,
} from "./friends.controller.js";

const router = Router();

// Apply security gate across all connection endpoints
router.use(protect);

router.post("/request", sendFriendRequest);
router.put("/accept", acceptFriendRequest);
router.get("/", getFriendsList);

export default router;
