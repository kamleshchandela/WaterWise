import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
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
  analyses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Analysis" }]
});

export default mongoose.model("User", UserSchema);
