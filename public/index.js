console.json = (obj) => console.log(JSON.stringify(obj, null, 2));

document.addEventListener("alpine:init", () => {
  Alpine.data("alpineInit", () => ({
    user: {},

    async init() {
      if (readAccessToken()) {
        this.getUser();
        this.getAllUsers();
        this.getAllGlobalChat();
        this.addOneGlobalChat();
      } else {
        const result = await login();
        this.user = result.data.user;
        saveAccessToken(result.data.token);
        this.getUser();
      }
    },

    async getUser() {
      const result = await getOneUser();

      console.json(result);
    },

    async getAllUsers() {
      const result = await getAllUsers();
      console.json(result);
    },

    async getAllGlobalChat() {
      const result = await getAllGlobalChat();
      console.json(result);
    },

    async addOneGlobalChat() {
      const result = await addOneGlobalChat(Math.random());
      console.json(result);
    },
  }));
});

/*
 * - Setup
 * x-data
 *
 * - Inputs
 * x-model
 *
 * - Outputs
 * x-text
 *
 * - Loops
 * <template x-for="elm in array" :key="array.id">
 *  // ... Should be One Element
 * </template>
 *
 * - If
 * <template x-if="a > b">
 *   // ...
 * </template>
 *
 * - Events
 *   - Click Events
 *    <button x-on:click="console.log('Hi')">Click me</button>
 *    <button @click="console.log('Hi')">Click me</button>
 *
 *   - Click Event submit form
 *    <form @submit.prevent="console.log('Hi')">
 *      <button type="submit">Submit</button>
 *    </form>
 *
 * - Function
 *  <button @click="show = !show">Show</button>
 *  <div x-show="show">
 *    // ...
 *  </div>
 *
 */
