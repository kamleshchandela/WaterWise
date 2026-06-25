import express from "express";
import multer from "multer";
import User from "../models/User.js";
import Analysis from "../models/Analysis.js";
import Story from "../models/Story.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ────────────────────────────────────────────────
// PROFILE
// ────────────────────────────────────────────────
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password -loginHistory");
    if (!user) return res.status(404).json({ message: "User not found" });

    const totalAnalyses = await Analysis.countDocuments({ userId: req.userId });
    const analyses = await Analysis.find({ userId: req.userId }).select("waterUsedLiters alternatives");

    let totalWater = 0;
    let totalSaved = 0;
    analyses.forEach(a => {
      totalWater += a.waterUsedLiters || 0;
      if (a.alternatives && a.alternatives.length > 0) {
        // Best alternative = highest water saved (most beneficial choice)
        const bestAlt = a.alternatives.reduce((best, alt) => {
          const altSaved = alt.waterSavedLiters ?? ((a.waterUsedLiters || 0) - (alt.waterUsedLiters || 0));
          const bestSaved = best.waterSavedLiters ?? ((a.waterUsedLiters || 0) - (best.waterUsedLiters || 0));
          return altSaved > bestSaved ? alt : best;
        }, a.alternatives[0]);

        // Use AI's waterSavedLiters if available, else calculate manually
        const saved = bestAlt.waterSavedLiters != null
          ? bestAlt.waterSavedLiters
          : (a.waterUsedLiters || 0) - (bestAlt.waterUsedLiters || 0);

        totalSaved += Math.max(0, saved); // never go negative
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

// ────────────────────────────────────────────────
// MY STORIES (own user's stories for profile page)
// ────────────────────────────────────────────────
router.get("/my-stories", authMiddleware, async (req, res) => {
  try {
    const stories = await Story.find({ userId: req.userId })
      .sort({ createdAt: -1 });
    res.json({ stories });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/profile", authMiddleware, upload.single("profileImage"), async (req, res) => {
  try {
    const { name, dietaryCategory, state, district, bio } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (dietaryCategory) user.dietaryCategory = dietaryCategory;
    if (state) user.state = state;
    if (district) user.district = district;
    if (bio !== undefined) user.bio = bio;

    // Handle profile image upload
    if (req.file) {
      // Delete old image if exists
      if (user.profileImagePublicId) {
        await deleteFromCloudinary(user.profileImagePublicId, "image");
      }
      const cloudResult = await uploadToCloudinary(req.file.buffer, "profile-images");
      user.profileImage = cloudResult.secure_url;
      user.profileImagePublicId = cloudResult.public_id;
    }

    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ────────────────────────────────────────────────
// USER SEARCH — returns connection status
// ────────────────────────────────────────────────
router.get("/search", authMiddleware, async (req, res) => {
  try {
    const query = req.query.q || "";
    if (!query.trim()) return res.json({ users: [] });

    const me = await User.findById(req.userId);
    const users = await User.find({
      _id: { $ne: req.userId },
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } }
      ]
    }).select("name email district state dietaryCategory");

    const toStr = id => id.toString();
    const myFriends   = me.friends.map(toStr);
    const mySent      = me.sentRequests.map(toStr);
    const myReceived  = me.receivedRequests.map(toStr);

    const mappedUsers = users.map(u => {
      const uid = u._id.toString();
      let status = "none";
      if (myFriends.includes(uid))  status = "friends";
      else if (mySent.includes(uid)) status = "sent";
      else if (myReceived.includes(uid)) status = "received";

      return { ...u.toObject(), status };
    });

    res.json({ users: mappedUsers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ────────────────────────────────────────────────
// FRIEND REQUESTS
// ────────────────────────────────────────────────

// Send / Cancel request
router.post("/friend/request/:targetId", authMiddleware, async (req, res) => {
  try {
    const me = await User.findById(req.userId);
    const target = await User.findById(req.params.targetId);
    if (!target) return res.status(404).json({ message: "User not found" });

    const myIdStr   = me._id.toString();
    const tgtIdStr  = target._id.toString();
    const alreadySent = me.sentRequests.map(x => x.toString()).includes(tgtIdStr);

    if (alreadySent) {
      // Cancel request
      me.sentRequests.pull(target._id);
      target.receivedRequests.pull(me._id);
      await me.save(); await target.save();
      return res.json({ success: true, status: "none" });
    }

    // Auto-accept if target had already sent me a request
    const theyAlreadySent = me.receivedRequests.map(x => x.toString()).includes(tgtIdStr);
    if (theyAlreadySent) {
      me.receivedRequests.pull(target._id);
      target.sentRequests.pull(me._id);
      me.friends.push(target._id);
      target.friends.push(me._id);
      await me.save(); await target.save();
      return res.json({ success: true, status: "friends" });
    }

    // New request
    me.sentRequests.push(target._id);
    target.receivedRequests.push(me._id);
    await me.save(); await target.save();
    res.json({ success: true, status: "sent" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Accept request
router.post("/friend/accept/:senderId", authMiddleware, async (req, res) => {
  try {
    const me = await User.findById(req.userId);
    const sender = await User.findById(req.params.senderId);
    if (!sender) return res.status(404).json({ message: "User not found" });

    me.receivedRequests.pull(sender._id);
    sender.sentRequests.pull(me._id);
    me.friends.push(sender._id);
    sender.friends.push(me._id);
    await me.save(); await sender.save();

    res.json({ success: true, status: "friends" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reject request
router.post("/friend/reject/:senderId", authMiddleware, async (req, res) => {
  try {
    const me = await User.findById(req.userId);
    const sender = await User.findById(req.params.senderId);
    if (!sender) return res.status(404).json({ message: "User not found" });

    me.receivedRequests.pull(sender._id);
    sender.sentRequests.pull(me._id);
    await me.save(); await sender.save();

    res.json({ success: true, status: "none" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Unfriend
router.post("/friend/unfriend/:friendId", authMiddleware, async (req, res) => {
  try {
    const me = await User.findById(req.userId);
    const friend = await User.findById(req.params.friendId);
    if (!friend) return res.status(404).json({ message: "User not found" });

    me.friends.pull(friend._id);
    friend.friends.pull(me._id);
    await me.save(); await friend.save();

    res.json({ success: true, status: "none" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// List pending incoming requests
router.get("/friend/requests", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate("receivedRequests", "name email district state dietaryCategory");
    res.json({ requests: user.receivedRequests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Friends list
router.get("/friends", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate("friends", "name email district state dietaryCategory");
    res.json({ friends: user.friends });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
