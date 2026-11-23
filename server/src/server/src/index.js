import "dotenv/config";
import mongoose from "mongoose";
import { createApp } from "./app.js";
if (!process.env.MONGODB_URI) throw new Error("Set MONGODB_URI in .env first");
const app = createApp({
  secret: process.env.JWT_SECRET,
  production: process.env.NODE_ENV === "production",
  origin: process.env.APP_ORIGIN,
  geminiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL,
});
await mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
});
const server = app.listen(process.env.PORT || 3001, () =>
  console.log("ApplyPilot API ready"),
);
async function stop() {
  server.close();
  await mongoose.disconnect();
  process.exit(0);
}
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
