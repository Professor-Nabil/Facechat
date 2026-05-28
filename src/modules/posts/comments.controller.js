import crypto from "crypto";
import { AppError } from "../../errors/app.error.js";

// 1. ADD A COMMENT TO A TARGET POST
export const addComment = (req, res, next) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return next(new AppError("Comment text field cannot be empty", 400));
    }

    // Ensure the parent post actually exists in our memory cache tables
    const postExists = global.db.posts.some((post) => post.id === postId);
    if (!postExists) {
      return next(new AppError("Target post not found", 404));
    }

    const newComment = {
      id: crypto.randomUUID(),
      postId,
      userId: req.user.id, // Set securely by the protection gateway middleware
      content,
      createdAt: new Date(),
    };

    // Commit to memory
    global.db.comments.push(newComment);

    return res.status(201).json({
      status: "success",
      message: "Comment appended successfully inside RAM!",
      data: { comment: newComment },
    });
  } catch (err) {
    next(err);
  }
};

// 2. GET ALL COMMENTS FOR A SPECIFIC POST
export const getCommentsForPost = (req, res, next) => {
  try {
    const { postId } = req.params;

    // Verify parent post existence
    const postExists = global.db.posts.some((post) => post.id === postId);
    if (!postExists) {
      return next(new AppError("Target post not found", 404));
    }

    // Filter sub-resources and map their author relational details
    const targetComments = global.db.comments
      .filter((comment) => comment.postId === postId)
      .map((comment) => {
        const commenter = global.db.users.find((u) => u.id === comment.userId);
        return {
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          author: commenter ? { name: commenter.name } : "Unknown User",
        };
      });

    return res.status(200).json({
      status: "success",
      results: targetComments.length,
      data: { comments: targetComments },
    });
  } catch (err) {
    next(err);
  }
};
