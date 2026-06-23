import express from "express";
import User from "../models/User.js";
import Analysis from "../models/Analysis.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password -loginHistory");
    if (!user) return res.status(404).json({ message: "User not found" });

    const totalAnalyses = await Analysis.countDocuments({ userId: req.userId });
    const analyses = await Analysis.find({ userId: req.userId }).select("waterUsedLiters");

    let totalWater = 0;
    let totalSaved = 0;
    analyses.forEach(a => {
      totalWater += a.waterUsedLiters || 0;
      if (a.alternatives && a.alternatives.length > 0) {
        const bestAlt = a.alternatives.reduce((min, alt) =>
          alt.waterUsedLiters < min.waterUsedLiters ? alt : min, a.alternatives[0]
        );
        totalSaved += (a.waterUsedLiters || 0) - (bestAlt.waterUsedLiters || 0);
      }
    });

    res.json({
      user,
      stats: {
        totalAnalyses,
        avgWaterPerMeal: totalAnalyses > 0 ? Math.round(totalWater / totalAnalyses) : 0,
        waterSaved: Math.round(totalSaved)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
