import express from "express";
import multer from "multer";
import User from "../models/User.js";
import Analysis from "../models/Analysis.js";
import Story from "../models/Story.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { analyzeImageWithGroq } from "../utils/groq.js";
import { buildGoogleMapsLink } from "../utils/mapsLink.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/upload", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const cloudResult = await uploadToCloudinary(req.file.buffer, "water-footprint");
    const imageUrl = cloudResult.secure_url;
    const imagePublicId = cloudResult.public_id;

    const aiResult = await analyzeImageWithGroq(
      imageUrl,
      user.dietaryCategory,
      user.state,
      user.district
    );

    const alternativesWithLinks = (aiResult.alternatives || []).map((alt, idx) => ({
      ...alt,
      imageUrl: `https://loremflickr.com/400/300/${encodeURIComponent(alt.name.replace(/ /g, ',') + ',food')}?lock=${idx + 1}`,
      googleMapsLink: buildGoogleMapsLink(alt.searchQuery, user.district, user.state)
    }));

    const initialComments = [];
    if (req.body.caption && req.body.caption.trim()) {
      initialComments.push({
        userId: user._id,
        text: req.body.caption.trim(),
        createdAt: new Date()
      });
    }

    const analysis = await Analysis.create({
      userId: user._id,
      imageUrl,
      imagePublicId,
      foodItemDetected: aiResult.foodItemDetected,
      waterUsedLiters: aiResult.waterUsedLiters,
      alternatives: alternativesWithLinks,
      dietaryCategoryUsed: user.dietaryCategory,
      userState: user.state,
      userDistrict: user.district,
      comments: initialComments
    });

    user.analyses.push(analysis._id);
    await user.save();

    res.json({ success: true, analysis });
  } catch (err) {
    console.error("Analysis error:", err);
    res.status(500).json({ message: err.message });
  }
});

router.post("/reanalyze", authMiddleware, async (req, res) => {
  try {
    const { analysisId } = req.body;
    const user = await User.findById(req.userId);
    const existing = await Analysis.findById(analysisId);

    if (!existing) return res.status(404).json({ message: "Analysis not found" });

    const aiResult = await analyzeImageWithGroq(
      existing.imageUrl,
      user.dietaryCategory,
      user.state,
      user.district
    );

    const alternativesWithLinks = (aiResult.alternatives || []).map((alt, idx) => ({
      ...alt,
      imageUrl: `https://loremflickr.com/400/300/${encodeURIComponent(alt.name.replace(/ /g, ',') + ',food')}?lock=${idx + 1}`,
      googleMapsLink: buildGoogleMapsLink(alt.searchQuery, user.district, user.state)
    }));

    const newAnalysis = await Analysis.create({
      userId: user._id,
      imageUrl: existing.imageUrl,
      imagePublicId: existing.imagePublicId,
      foodItemDetected: aiResult.foodItemDetected,
      waterUsedLiters: aiResult.waterUsedLiters,
      alternatives: alternativesWithLinks,
      dietaryCategoryUsed: user.dietaryCategory,
      userState: user.state,
      userDistrict: user.district,
    });

    user.analyses.push(newAnalysis._id);
    await user.save();

    res.json({ success: true, analysis: newAnalysis });
  } catch (err) {
    console.error("Re-analysis error:", err);
    res.status(500).json({ message: err.message });
  }
});

router.get("/history", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const friendIds = user.friends || [];
    
    const analyses = await Analysis.find({
      userId: { $in: [req.userId, ...friendIds] }
    })
    .sort({ createdAt: -1 })
    .populate("userId", "name email district state dietaryCategory profileImage")
    .select("imageUrl foodItemDetected waterUsedLiters createdAt userId userDistrict userState dietaryCategoryUsed");

    const mapped = analyses.map(a => ({
      _id: a._id,
      imageUrl: a.imageUrl,
      foodItemDetected: a.foodItemDetected,
      waterUsedLiters: a.waterUsedLiters,
      createdAt: a.createdAt,
      creatorName: a.userId ? a.userId.name : "Unknown",
      creatorAvatar: a.userId?.profileImage || "",
      dietaryCategoryUsed: a.dietaryCategoryUsed || (a.userId ? a.userId.dietaryCategory : "vegetarian"),
      userDistrict: a.userDistrict || (a.userId ? a.userId.district : "Local"),
      userState: a.userState || (a.userId ? a.userId.state : "State"),
    }));

    res.json({ analyses: mapped });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Only the logged-in user's own scans (used by Profile page)
router.get("/my-posts", authMiddleware, async (req, res) => {
  try {
    const analyses = await Analysis.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select("imageUrl foodItemDetected waterUsedLiters createdAt userDistrict userState dietaryCategoryUsed");

    res.json({ analyses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/story", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // ── Enforce 5-story limit per user (within 24hrs) ──
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeCount = await Story.countDocuments({
      userId: req.userId,
      createdAt: { $gte: cutoff }
    });
    if (activeCount >= 5) {
      return res.status(400).json({ message: "Story limit reached. You can post at most 5 stories in 24 hours.", limitReached: true });
    }

    const isVideo = req.body.isVideo === "true" || req.file.mimetype.startsWith("video/");
    const textOverlays = req.body.textOverlays || "";
    const music = req.body.music || "";

    const cloudResult = await uploadToCloudinary(req.file.buffer, "stories");
    const imageUrl = cloudResult.secure_url;
    const cloudPublicId = cloudResult.public_id;

    const story = await Story.create({
      userId: req.userId,
      imageUrl,
      cloudPublicId,
      isVideo,
      textOverlays,
      music
    });

    res.json({ success: true, story, storyCount: activeCount + 1 });
  } catch (err) {
    console.error("Story upload error:", err);
    res.status(500).json({ message: err.message });
  }
});

router.get("/stories", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const friendIds = user.friends || [];
    
    // 24 hours boundary
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const activeStories = await Story.find({
      userId: { $in: [req.userId, ...friendIds] },
      createdAt: { $gte: cutoffTime }
    })
    .sort({ createdAt: 1 })
    .populate("userId", "name email profileImage")
    .populate("views", "name")
    .populate("likes", "name");

    const grouped = {};
    activeStories.forEach(story => {
      if (!story.userId) return;
      const uId = story.userId._id.toString();
      if (!grouped[uId]) {
        grouped[uId] = {
          userId: uId,
          name: story.userId.name,
          profileImage: story.userId.profileImage || "",
          stories: []
        };
      }
      grouped[uId].stories.push({
        _id: story._id,
        imageUrl: story.imageUrl,
        isVideo: story.isVideo || false,
        textOverlays: story.textOverlays || "",
        music: story.music || "",
        views: story.views.map(v => ({ _id: v._id, name: v.name })),
        likes: story.likes.map(l => ({ _id: l._id, name: l.name })),
        createdAt: story.createdAt
      });
    });

    res.json({ success: true, stories: Object.values(grouped) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/story/:id/view", authMiddleware, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: "Story not found" });

    if (!story.views.includes(req.userId)) {
      story.views.push(req.userId);
      await story.save();
    }
    res.json({ success: true, viewsCount: story.views.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/story/:id/like", authMiddleware, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: "Story not found" });

    const alreadyLiked = story.likes.includes(req.userId);
    if (alreadyLiked) {
      story.likes.pull(req.userId);
    } else {
      story.likes.push(req.userId);
    }
    await story.save();
    res.json({ success: true, liked: !alreadyLiked, likesCount: story.likes.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id)
      .populate("comments.userId", "name");
    if (!analysis) return res.status(404).json({ message: "Analysis not found" });
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/:id/comment", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }
    const analysis = await Analysis.findById(req.params.id);
    if (!analysis) return res.status(404).json({ message: "Analysis not found" });

    analysis.comments.push({
      userId: req.userId,
      text: text.trim(),
      createdAt: new Date()
    });

    await analysis.save();

    const updated = await Analysis.findById(req.params.id)
      .populate("comments.userId", "name");

    res.json({ success: true, comments: updated.comments });
  } catch (err) {
    console.error("Add comment error:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
