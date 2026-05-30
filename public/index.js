console.json = (obj) => console.log(JSON.stringify(obj, null, 2));

document.addEventListener("alpine:init", () => {
  Alpine.data("alpineInit", () => ({
    user: {},
    users: [],
    chat: [],
    newMessage: "",
    activeTab: "chat", // 📱 Mobile Focus: Track which panel is active on screen

    async init() {
      if (readAccessToken()) {
        await this.syncSessionContext();
      } else {
        const result = await login();
        this.user = result.data.user;
        saveAccessToken(result.data.token);
        await this.syncSessionContext();
      }

      setInterval(() => {
        if (readAccessToken()) {
          this.getAllUsers();
          this.getAllGlobalChat();
        }
      }, 2000);
    },

    async syncSessionContext() {
      const res = await getOneUser();
      if (res && res.data) {
        this.user = res.data.user;
      }
      this.getAllUsers();
      this.getAllGlobalChat();
    },

    async getUser() {
      const result = await getOneUser();
      console.json(result);
    },

    async getAllUsers() {
      const result = await getAllUsers();
      if (result && result.data) {
        this.users = result.data;
      }
    },

    async getAllGlobalChat() {
      const result = await getAllGlobalChat();
      if (result && result.data) {
        // 📏 Check if there are actually new messages before updating
        const hasNewMessages = result.data.length > this.chat.length;

        this.chat = result.data;

        // ⬇️ Auto-scroll to the bottom if a new transmission is detected
        if (hasNewMessages) {
          setTimeout(() => {
            const view = document.getElementById("chat-viewport");
            if (view) {
              view.scrollTo({
                top: view.scrollHeight,
                behavior: "smooth", // Gives it a clean animation on phones
              });
            }
          }, 50);
        }
      }
    },

    async sendMessage() {
      if (!this.newMessage.trim()) return;

      const payloadText = this.newMessage.trim();
      this.newMessage = "";

      const result = await addOneGlobalChat(payloadText);
      if (result && result.message.includes("Success")) {
        await this.getAllGlobalChat();
        setTimeout(() => {
          const view = document.getElementById("chat-viewport");
          if (view) view.scrollTop = view.scrollHeight;
        }, 50);
      }
    },

    logout() {
      if (
        confirm(
          "⚠️ Warning: Activating self-destruct sequence will delete this session key forever! Continue?",
        )
      ) {
        deleteAccessToken();
        window.location.reload();
      }
    },
  }));
});
