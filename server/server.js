import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import analysisRoutes from "./routes/analysis.js";
import userRoutes from "./routes/user.js";
import Story from "./models/Story.js";
import { deleteFromCloudinary } from "./utils/cloudinary.js";

dotenv.config();
const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "20mb" }));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    // Start Cloudinary cleanup job after DB is ready
    startCloudinaryCleanup();
  })
  .catch(err => console.error(err));

app.use("/api/auth", authRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/user", userRoutes);

app.listen(process.env.PORT || 5000, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);

// ──────────────────────────────────────────────────────
// Cloudinary Cleanup Job — runs every hour
// Deletes Cloudinary assets for stories older than 24hrs
// MongoDB TTL handles DB deletion automatically
// ──────────────────────────────────────────────────────
function startCloudinaryCleanup() {
  const runCleanup = async () => {
    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      // Find stories that expired but still have a cloudPublicId recorded
      // (MongoDB TTL may not have fired yet or may have partial state)
      const expiredStories = await Story.find({
        createdAt: { $lte: cutoff },
        cloudPublicId: { $exists: true, $ne: null }
      }).select("_id cloudPublicId isVideo");

      if (expiredStories.length === 0) return;

      console.log(`[Cleanup] Found ${expiredStories.length} expired stories to clean from Cloudinary`);

      for (const story of expiredStories) {
        const resourceType = story.isVideo ? "video" : "image";
        await deleteFromCloudinary(story.cloudPublicId, resourceType);
        // Also hard-delete from MongoDB in case TTL hasn't fired
        await Story.deleteOne({ _id: story._id });
        console.log(`[Cleanup] Deleted story ${story._id} from Cloudinary (${story.cloudPublicId})`);
      }
    } catch (err) {
      console.error("[Cleanup] Error during story cleanup:", err.message);
    }
  };

  // Run once on startup, then every hour
  runCleanup();
  setInterval(runCleanup, 60 * 60 * 1000); // every 1 hour
}
