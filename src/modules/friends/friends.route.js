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

// Add this route handler alongside your existing friends endpoints
router.get("/pending", protect, (req, res) => {
  // Find friendships where the current logged-in user is the receiver and status is pending
  const incomingRequests = global.db.friendships
    .filter((f) => f.receiverId === req.user.id && f.status === "pending")
    .map((f) => {
      // Find the user data of the person who sent the request
      const sender = global.db.users.find((u) => u.id === f.requesterId);
      return {
        requestId: f.id, // The ID needed to accept the request
        senderId: f.requesterId,
        name: sender ? sender.name : "Unknown User",
        email: sender ? sender.email : "",
      };
    });

  return res.status(200).json({
    status: "success",
    data: { pending: incomingRequests },
  });
});

export default router;
