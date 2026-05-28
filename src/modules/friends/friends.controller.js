import crypto from "crypto";
import { AppError } from "../../errors/app.error.js";

// 1. SEND FRIEND REQUEST (Step 3: Guardrails & Defenses)
export const sendFriendRequest = (req, res, next) => {
  try {
    const { targetUserId } = req.body;
    const requesterId = req.user.id;

    if (!targetUserId) {
      return next(new AppError("Please provide a targetUserId", 400));
    }

    // Guardrail A: You cannot be your own friend
    if (requesterId === targetUserId) {
      return next(
        new AppError(
          "Self-Connection Error: You cannot send a friend request to yourself",
          400,
        ),
      );
    }

    // Guardrail B: Verify the target user profile actually exists in our memory heap
    const targetUserExists = global.db.users.some(
      (user) => user.id === targetUserId,
    );
    if (!targetUserExists) {
      return next(
        new AppError(
          "The targeted user account does not exist inside RAM",
          404,
        ),
      );
    }

    // Guardrail C: Prevent relation duplicates (Look for pre-existing collision edge states)
    const activeRelationshipExists = global.db.friendships.some(
      (friendship) =>
        (friendship.requesterId === requesterId &&
          friendship.receiverId === targetUserId) ||
        (friendship.requesterId === targetUserId &&
          friendship.receiverId === requesterId),
    );

    if (activeRelationshipExists) {
      return next(
        new AppError(
          "Collision Error: A pending or accepted connection already exists between these profiles",
          409,
        ),
      );
    }

    // Everything checks out -> Create friendship record
    const newRequest = {
      id: crypto.randomUUID(),
      requesterId,
      receiverId: targetUserId,
      status: "pending",
      createdAt: new Date(),
    };

    global.db.friendships.push(newRequest);

    return res.status(201).json({
      status: "success",
      message: "Friend request transmitted perfectly inside RAM!",
      data: { friendship: newRequest },
    });
  } catch (err) {
    next(err);
  }
};

// 2. ACCEPT FRIEND REQUEST
export const acceptFriendRequest = (req, res, next) => {
  try {
    const { requestId } = req.body;
    const receiverId = req.user.id;

    if (!requestId) {
      return next(new AppError("Please provide a requestId", 400));
    }

    // Search for the matching connection target record
    const requestIndex = global.db.friendships.findIndex(
      (f) => f.id === requestId,
    );
    if (requestIndex === -1) {
      return next(
        new AppError("Target connection request record not found", 404),
      );
    }

    const targetRequest = global.db.friendships[requestIndex];

    // Security Gate: Ensure only the targeted receiver can accept this request
    if (targetRequest.receiverId !== receiverId) {
      return next(
        new AppError(
          "Unauthorized Action: You cannot accept a request sent to someone else",
          403,
        ),
      );
    }

    // Update status mapping state inplace in our RAM array
    global.db.friendships[requestIndex].status = "accepted";

    return res.status(200).json({
      status: "success",
      message: "Connection successfully established!",
      data: { friendship: global.db.friendships[requestIndex] },
    });
  } catch (err) {
    next(err);
  }
};

// 3. FETCH BIDIRECTIONAL FRIENDS LIST (Step 4: Array Traversal Join)
export const getFriendsList = (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Pull down only records where connection status is 'accepted' and user matches either end
    const acceptedRelations = global.db.friendships.filter(
      (f) =>
        f.status === "accepted" &&
        (f.requesterId === userId || f.receiverId === userId),
    );

    // 2. Map over relations to pluck the opposite friendId profile metadata out of user storage
    const friendsProfiles = acceptedRelations.map((relation) => {
      // Find which ID is the friend (the one that isn't the logged-in user)
      const friendId =
        relation.requesterId === userId
          ? relation.receiverId
          : relation.requesterId;
      const profile = global.db.users.find((u) => u.id === friendId);

      return {
        relationshipId: relation.id,
        id: profile ? profile.id : friendId,
        name: profile ? profile.name : "Deactivated Account",
        email: profile ? profile.email : "Unknown email",
      };
    });

    return res.status(200).json({
      status: "success",
      results: friendsProfiles.length,
      data: { friends: friendsProfiles },
    });
  } catch (err) {
    next(err);
  }
};
