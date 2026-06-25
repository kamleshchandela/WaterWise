import mongoose from "mongoose";

const StorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  imageUrl: { type: String, required: true },
  cloudPublicId: { type: String }, // Cloudinary public_id for deletion
  isVideo: { type: Boolean, default: false },
  textOverlays: { type: String }, // JSON stringified array of overlays
  music: { type: String }, // URL of chosen background music track
  views: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now, expires: 86400 } // MongoDB auto-deletes after 24h
});

export default mongoose.model("Story", StorySchema);
