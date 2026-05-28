document.addEventListener("alpine:init", () => {
  Alpine.data("facechat", () => ({
    // 🗺️ UI Navigation State
    currentTab: "auth", // Options: 'auth', 'feed', 'friends'
    authMode: "login", // Options: 'login', 'signup'

    // 🔑 Session State
    token: localStorage.getItem("fc_token") || "",
    user: JSON.parse(localStorage.getItem("fc_user")) || null,

    // 📝 Input Form Bindings
    authForm: {
      email: "",
      password: "",
      name: "",
    },
    newPostContent: "",
    newCommentContent: {}, // Keyed by postId: { [postId]: 'text' }

    // 💾 Hydrated Data Arrays from Backend RAM
    feed: [],
    friends: [], // Active accepted friends list
    allUsers: [], // Discovery: Everyone on the platform
    pendingRequests: [], // Incoming requests waiting for approval

    // ⚙️ Helper to automatically append our custom Bearer Token passport
    get headers() {
      return {
        "Content-Type": "application/json",
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      };
    },

    // 🚀 Check lifecycle initialization states
    init() {
      if (this.token && this.user) {
        this.currentTab = "feed";
        this.fetchFeed();
      }
    },

    // 🔐 AUTHENTICATION ACTIONS
    async handleAuth() {
      const endpoint =
        this.authMode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const payload =
        this.authMode === "login"
          ? { email: this.authForm.email, password: this.authForm.password }
          : {
              email: this.authForm.email,
              password: this.authForm.password,
              name: this.authForm.name,
            };

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: this.headers,
          body: JSON.stringify(payload),
        });
        const json = await res.json();

        if (json.status === "fail" || json.status === "error") {
          alert(`⚠️ Error: ${json.message}`);
          return;
        }

        if (this.authMode === "login") {
          this.token = json.data.token;
          this.user = json.data.user;
          localStorage.setItem("fc_token", this.token);
          localStorage.setItem("fc_user", JSON.stringify(this.user));
          this.currentTab = "feed";
          this.fetchFeed();
        } else {
          alert("Account created successfully! Please log in.");
          this.authMode = "login";
        }

        // Reset forms
        this.authForm = { email: "", password: "", name: "" };
      } catch (err) {
        console.error("Auth Failure:", err);
      }
    },

    logout() {
      this.token = "";
      this.user = null;
      localStorage.removeItem("fc_token");
      localStorage.removeItem("fc_user");
      this.currentTab = "auth";
    },

    // 📝 POSTS & TIMELINE ACTIONS
    async fetchFeed() {
      try {
        const res = await fetch("/api/posts", { headers: this.headers });
        const json = await res.json();
        if (res.ok) {
          const postsWithComments = await Promise.all(
            json.data.feed.map(async (post) => {
              const commentsRes = await fetch(
                `/api/posts/${post.id}/comments`,
                { headers: this.headers },
              );
              const commentsJson = await commentsRes.json();
              return {
                ...post,
                comments: commentsRes.ok ? commentsJson.data.comments : [],
              };
            }),
          );
          this.feed = postsWithComments;
        }
      } catch (err) {
        console.error("Failed fetching timeline:", err);
      }
    },

    async createPost() {
      if (!this.newPostContent.trim()) return;
      try {
        const res = await fetch("/api/posts", {
          method: "POST",
          headers: this.headers,
          body: JSON.stringify({ content: this.newPostContent }),
        });
        if (res.ok) {
          this.newPostContent = "";
          await this.fetchFeed();
        }
      } catch (err) {
        console.error("Post creation error:", err);
      }
    },

    // 💬 SUB-RESOURCE COMMENTS ACTIONS
    async addComment(postId) {
      const content = this.newCommentContent[postId];
      if (!content || !content.trim()) return;

      try {
        const res = await fetch(`/api/posts/${postId}/comments`, {
          method: "POST",
          headers: this.headers,
          body: JSON.stringify({ content: content.trim() }),
        });

        if (res.ok) {
          this.newCommentContent[postId] = "";
          await this.fetchFeed();
        }
      } catch (err) {
        console.error("Comment dispatch exception:", err);
      }
    },

    // 👥 UPGRADED SOCIAL GRAPH ACTIONS (No more manual UUID pasting!)
    // 👥 UPGRADED SOCIAL GRAPH ACTIONS
    async fetchFriendsTab() {
      try {
        // 1. Fetch confirmed active friends
        const friendsRes = await fetch("/api/friends", {
          headers: this.headers,
        });
        const friendsJson = await friendsRes.json();
        this.friends = friendsRes.ok ? friendsJson.data.friends : [];

        // 2. Fetch platform users for discovery list
        const usersRes = await fetch("/api/auth/users", {
          headers: this.headers,
        });
        const usersJson = await usersRes.json();
        this.allUsers = usersRes.ok ? usersJson.data.users : [];

        // 3. 🚀 FIX: Fetch actual pending requests from our new live backend API endpoint
        const pendingRes = await fetch("/api/friends/pending", {
          headers: this.headers,
        });
        const pendingJson = await pendingRes.json();
        this.pendingRequests = pendingRes.ok ? pendingJson.data.pending : [];
      } catch (err) {
        console.error("Failed syncing social workspace metrics:", err);
      }
    },

    async sendRequest(targetUserId) {
      try {
        const res = await fetch("/api/friends/request", {
          method: "POST",
          headers: this.headers,
          body: JSON.stringify({ targetUserId }),
        });
        const json = await res.json();

        if (!res.ok) {
          alert(`⚠️ Notice: ${json.message}`);
          return;
        }

        await this.fetchFriendsTab(); // Instantly refresh UI state
      } catch (err) {
        console.error("Friend request execution exception:", err);
      }
    },

    async acceptRequest(requestId) {
      try {
        const res = await fetch("/api/friends/accept", {
          method: "PUT",
          headers: this.headers,
          body: JSON.stringify({ requestId }),
        });
        if (res.ok) {
          await this.fetchFriendsTab(); // Instantly update active graph layout on screen
        }
      } catch (err) {
        console.error("Acceptance toggle failure:", err);
      }
    },
  }));
});
