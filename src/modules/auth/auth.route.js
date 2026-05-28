import { Router } from "express";
import { signup, login } from "./auth.controller.js";
import { protect } from "./auth.middleware.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);

// 🌐 UX Upgrade: Expose all users so people can find each other instantly
router.get("/users", protect, (req, res) => {
  // Return all users except the currently logged-in user profile
  const discoveryList = global.db.users
    .filter((u) => u.id !== req.user.id)
    .map((u) => ({ id: u.id, name: u.name, email: u.email }));

  return res.status(200).json({
    status: "success",
    data: { users: discoveryList },
  });
});

export default router;
