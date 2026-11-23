import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true },
);
const applicationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    company: { type: String, required: true },
    role: { type: String, required: true },
    location: { type: String, default: "" },
    url: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Saved", "Applied", "Interview", "Offer", "Rejected"],
      default: "Saved",
    },
    appliedOn: { type: String, default: "" },
    deadline: { type: String, default: "" },
    nextAction: { type: String, default: "" },
    notes: { type: String, default: "" },
    history: [
      { status: String, at: { type: Date, default: Date.now }, _id: false },
    ],
  },
  { timestamps: true },
);
applicationSchema.index({ owner: 1, updatedAt: -1 });
export const User = mongoose.model("User", userSchema);
export const Application = mongoose.model("Application", applicationSchema);
