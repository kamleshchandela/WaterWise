import express from "express";
import multer from "multer";
import User from "../models/User.js";
import Analysis from "../models/Analysis.js";
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
    const analyses = await Analysis.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select("imageUrl foodItemDetected waterUsedLiters createdAt");
    res.json({ analyses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id);
    if (!analysis) return res.status(404).json({ message: "Analysis not found" });
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
