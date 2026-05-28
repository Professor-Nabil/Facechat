import crypto from "crypto";
import { AppError } from "../../errors/app.error.js";

// 1. CREATE A BROADCAST POST
export const createPost = (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return next(new AppError("Post content field cannot be blank", 400));
    }

    const newPost = {
      id: crypto.randomUUID(),
      userId: req.user.id, // Provided securely by our protect middleware layer
      content,
      createdAt: new Date(),
    };

    // Save directly onto the global heap array
    global.db.posts.unshift(newPost); // unshift puts new posts at the very top of the timeline!

    return res.status(201).json({
      status: "success",
      message: "Post broadcasted successfully into RAM!",
      data: { post: newPost },
    });
  } catch (err) {
    next(err);
  }
};

// 2. FETCH INTEGRATED SOCIAL TIMELINE FEED
export const getFeed = (_req, res, next) => {
  try {
    // Execute a runtime memory query join across arrays to hook author names onto posts
    const enrichedFeed = global.db.posts.map((post) => {
      const authorProfile = global.db.users.find((u) => u.id === post.userId);

      return {
        id: post.id,
        content: post.content,
        createdAt: post.createdAt,
        author: authorProfile
          ? { name: authorProfile.name, email: authorProfile.email }
          : "Unknown User",
      };
    });

    return res.status(200).json({
      status: "success",
      results: enrichedFeed.length,
      data: { feed: enrichedFeed },
    });
  } catch (err) {
    next(err);
  }
};
