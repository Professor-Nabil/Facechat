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
    friends: [],

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

    // 📝 POSTS & TIMELINE TIMELINE ACTIONS
    async fetchFeed() {
      try {
        const res = await fetch("/api/posts", { headers: this.headers });
        const json = await res.json();
        if (res.ok) {
          this.feed = json.data.feed;
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
          await this.fetchFeed(); // Instantly refresh timeline cache matrix
        }
      } catch (err) {
        console.error("Post creation error:", err);
      }
    },
  }));
});
