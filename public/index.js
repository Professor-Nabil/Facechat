document.addEventListener("alpine:init", () => {
  Alpine.data("alpineInit", () => ({
    data: {
      userName: "",
      password: "",
    },
    init() {},
    async signup() {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
      });
      console.log(this.data.userName);
      console.log(this.data.password);
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
