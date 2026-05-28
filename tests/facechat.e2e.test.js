import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/server.js";

describe("🎭 Facechat Comprehensive End-to-End User Experience Suite", () => {
  // Wipe our runtime database arrays before each test scenario executes
  beforeEach(() => {
    global.db.users = [];
    global.db.posts = [];
    global.db.comments = [];
    global.db.friendships = [];
  });

  it("should successfully navigate signup, login, unauthorized blocks, and timeline broadcast flows", async () => {
    const mockUser = {
      email: "tester@facechat.com",
      password: "password123",
      name: "Nabil QA Engine",
    };

    // 1. SCENARIO: Sign Up a new user profile
    const signupResponse = await request(app)
      .post("/api/auth/signup")
      .send(mockUser);

    expect(signupResponse.status).toBe(201);
    expect(signupResponse.body.status).toBe("success");
    expect(signupResponse.body.data.user).toHaveProperty("id");
    expect(signupResponse.body.data.user.email).toBe(mockUser.email);
    expect(signupResponse.body.data.user).not.toHaveProperty("password"); // Secure sanitation check

    // 2. SCENARIO: Prevent duplicate email registration collisions (409 Conflict)
    const duplicateResponse = await request(app)
      .post("/api/auth/signup")
      .send(mockUser);

    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body.status).toBe("fail");
    expect(duplicateResponse.body.message).toContain("Conflict Error");

    // 3. SCENARIO: Secure authentication login access
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: mockUser.email,
      password: mockUser.password,
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.status).toBe("success");
    expect(loginResponse.body.data).toHaveProperty("token");

    const authTokenPassport = loginResponse.body.data.token;

    // 4. SCENARIO: Deny entry to the timeline feed for unauthenticated traffic
    const blockFeedResponse = await request(app).get("/api/posts");

    expect(blockFeedResponse.status).toBe(401);
    expect(blockFeedResponse.body.status).toBe("fail");

    // 5. SCENARIO: Broadcast an updates stream with our auth passport token
    const postContent =
      "Writing E2E validation scripts inside RAM using Vitest!";
    const broadcastResponse = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${authTokenPassport}`)
      .send({ content: postContent });

    expect(broadcastResponse.status).toBe(201);
    expect(broadcastResponse.body.status).toBe("success");
    expect(broadcastResponse.body.data.post.content).toBe(postContent);

    // 6. SCENARIO: Fetch fully hydrated feeds timeline with author object maps
    const feedResponse = await request(app)
      .get("/api/posts")
      .set("Authorization", `Bearer ${authTokenPassport}`);

    expect(feedResponse.status).toBe(200);
    expect(feedResponse.body.status).toBe("success");
    expect(feedResponse.body.data.feed).toHaveLength(1);
    expect(feedResponse.body.data.feed[0].content).toBe(postContent);
    expect(feedResponse.body.data.feed[0].author.name).toBe(mockUser.name);

    const activePostId = feedResponse.body.data.feed[0].id;

    // 7. SCENARIO: Successfully attach a text comment sub-resource to the post
    const commentPayload = {
      content: "First comment on this awesome RAM platform!",
    };
    const commentResponse = await request(app)
      .post(`/api/posts/${activePostId}/comments`)
      .set("Authorization", `Bearer ${authTokenPassport}`)
      .send(commentPayload);

    expect(commentResponse.status).toBe(201);
    expect(commentResponse.body.status).toBe("success");
    expect(commentResponse.body.data.comment.postId).toBe(activePostId);

    // 8. SCENARIO: Fail gracefully when attempting to comment on an invalid post UUID
    const fakePostUUID = "00000000-0000-0000-0000-000000000000";
    const failedCommentResponse = await request(app)
      .post(`/api/posts/${fakePostUUID}/comments`)
      .set("Authorization", `Bearer ${authTokenPassport}`)
      .send(commentPayload);

    expect(failedCommentResponse.status).toBe(404);
    expect(failedCommentResponse.body.status).toBe("fail");

    // 9. SCENARIO: Retrieve hydrated comment lists for the specific active post
    const getCommentsResponse = await request(app)
      .get(`/api/posts/${activePostId}/comments`)
      .set("Authorization", `Bearer ${authTokenPassport}`);

    expect(getCommentsResponse.status).toBe(200);
    expect(getCommentsResponse.body.data.comments).toHaveLength(1);
    expect(getCommentsResponse.body.data.comments[0].content).toBe(
      commentPayload.content,
    );
    expect(getCommentsResponse.body.data.comments[0].author.name).toBe(
      mockUser.name,
    );
  });

  it("should successfully navigate the complex bidirectional social graph friendship matrix flows", async () => {
    // 1. SETUP: Create two distinct mock user structures
    const userA = {
      email: "nabil@graph.com",
      password: "password123",
      name: "Nabil Dev",
    };
    const userB = {
      email: "sarah@graph.com",
      password: "password123",
      name: "Sarah QA",
    };

    // Register User A
    const resA = await request(app).post("/api/auth/signup").send(userA);
    const userAId = resA.body.data.user.id;

    // Register User B
    const resB = await request(app).post("/api/auth/signup").send(userB);
    const userBId = resB.body.data.user.id;

    // Log in as User A to get their authentication passport token
    const loginA = await request(app)
      .post("/api/auth/login")
      .send({ email: userA.email, password: userA.password });
    const tokenA = loginA.body.data.token;

    // Log in as User B to get their authentication passport token
    const loginB = await request(app)
      .post("/api/auth/login")
      .send({ email: userB.email, password: userB.password });
    const tokenB = loginB.body.data.token;

    // 2. SCENARIO: User A sends a friend request to User B
    const reqResponse = await request(app)
      .post("/api/friends/request")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ targetUserId: userBId });

    expect(reqResponse.status).toBe(201);
    expect(reqResponse.body.status).toBe("success");
    expect(reqResponse.body.data.friendship.status).toBe("pending");

    const friendshipRequestId = reqResponse.body.data.friendship.id;

    // 3. SCENARIO: Assert Guardrail C catches duplicate connection collision spam
    const duplicateReqResponse = await request(app)
      .post("/api/friends/request")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ targetUserId: userBId });

    expect(duplicateReqResponse.status).toBe(409);
    expect(duplicateReqResponse.body.status).toBe("fail");

    // 4. SCENARIO: User B accepts User A's connection request
    const acceptResponse = await request(app)
      .put("/api/friends/accept")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ requestId: friendshipRequestId });

    expect(acceptResponse.status).toBe(200);
    expect(acceptResponse.body.status).toBe("success");
    expect(acceptResponse.body.data.friendship.status).toBe("accepted");

    // 5. SCENARIO: Verify User A's friends array lists User B via bidirectional traversal
    const friendsOfAResponse = await request(app)
      .get("/api/friends")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(friendsOfAResponse.status).toBe(200);
    expect(friendsOfAResponse.body.data.friends).toHaveLength(1);
    expect(friendsOfAResponse.body.data.friends[0].id).toBe(userBId);
    expect(friendsOfAResponse.body.data.friends[0].name).toBe(userB.name);

    // 6. SCENARIO: Verify User B's friends array lists User A via bidirectional traversal
    const friendsOfBResponse = await request(app)
      .get("/api/friends")
      .set("Authorization", `Bearer ${tokenB}`);

    expect(friendsOfBResponse.status).toBe(200);
    expect(friendsOfBResponse.body.data.friends).toHaveLength(1);
    expect(friendsOfBResponse.body.data.friends[0].id).toBe(userAId);
    expect(friendsOfBResponse.body.data.friends[0].name).toBe(userA.name);
  });
});
