import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { User, Application } from "./models.js";
import { createApp } from "./app.js";
const db = await MongoMemoryServer.create();
await mongoose.connect(db.getUri());
const user = await User.create({
  name: "Demo Explorer",
  email: "demo@example.com",
  passwordHash: await bcrypt.hash("demo-password-2026", 12),
});
const today = new Date();
const date = (offset) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};
const records = [
  [
    "Northstar Labs",
    "Software Engineer Intern",
    "Interview",
    "Bengaluru",
    2,
    "Prepare for technical conversation",
  ],
  [
    "Orbit Systems",
    "Frontend Developer",
    "Applied",
    "Remote",
    5,
    "Follow up with recruiting team",
  ],
  [
    "Cedar Technologies",
    "Backend Engineer Intern",
    "Saved",
    "Hyderabad",
    1,
    "Finish application and cover note",
  ],
  [
    "Lumen Studio",
    "Full Stack Developer",
    "Applied",
    "Pune",
    7,
    "Review product and engineering blog",
  ],
  [
    "Atlas Works",
    "Graduate Engineer",
    "Offer",
    "Remote",
    4,
    "Review offer details",
  ],
  [
    "Pixel Foundry",
    "React Developer",
    "Rejected",
    "Delhi",
    "",
    "Reflect on interview feedback",
  ],
];
await Application.insertMany(
  records.map(([company, role, status, location, offset, nextAction]) => ({
    owner: user._id,
    company,
    role,
    status,
    location,
    deadline: offset === "" ? "" : date(offset),
    appliedOn: status === "Saved" ? "" : date(-7),
    nextAction,
    notes: "Fictional demo application. Replace with your own data.",
    history: [
      { status: "Saved", at: new Date(Date.now() - 10 * 86400000) },
      { status, at: new Date() },
    ],
  })),
);
const app = createApp({
  secret: randomBytes(48).toString("hex"),
  origin: "http://127.0.0.1:5173",
});
const server = app.listen(3001, "127.0.0.1", () =>
  console.log(
    "Temporary demo on 127.0.0.1:3001. Login: demo@example.com / demo-password-2026. Data is deleted on exit.",
  ),
);
async function stop() {
  server.close();
  await mongoose.disconnect();
  await db.stop();
  process.exit(0);
}
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
