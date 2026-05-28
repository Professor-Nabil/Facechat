import { app } from "./server.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🚀 [facechat] engine initialized successfully.`);
  console.log(`📡 Listening for requests at: http://localhost:${PORT}`);
  console.log(`💾 State engine: In-Memory (RAM) storage active.\n`);
});
