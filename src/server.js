import express from "express";
import authRouter from "./modules/auth/auth.route.js";
import postRouter from "./modules/posts/posts.route.js";
import friendsRouter from "./modules/friends/friends.route.js"; // ◄── Add this import
import { globalError } from "./errors/global.error.js";
import { AppError } from "./errors/app.error.js";

export const app = express();

global.db = global.db || {
  users: [],
  posts: [],
  comments: [],
  friendships: [],
};

app.use(express.json());

// ⚡ Mount your modular api routes
app.use("/api/auth", authRouter);
app.use("/api/posts", postRouter);
app.use("/api/friends", friendsRouter); // ◄── Mount the fresh router

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "success",
    message: "Facechat API is alive inside RAM!",
    stats: {
      activeUsers: global.db.users.length,
      totalPosts: global.db.posts.length,
    },
  });
});

app.get("/test-error", (_req, _res, next) => {
  return next(new AppError("Testing our premium RAM error handler!", 400));
});

app.use(globalError);
