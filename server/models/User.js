import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  profileImage: { type: String, default: "" },
  profileImagePublicId: { type: String, default: "" },
  bio: { type: String, default: "" },
  state: { type: String, required: true },
  district: { type: String, required: true },
  dietaryCategory: {
    type: String,
    enum: ["vegetarian", "jain", "eggetarian", "nonvegetarian"],
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date },
  loginHistory: [{ loginTime: Date, ipAddress: String }],
  analyses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Analysis" }],
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  sentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  receivedRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
});

export default mongoose.model("User", UserSchema);
