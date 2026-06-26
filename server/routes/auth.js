import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import User from "../models/User.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/signup", upload.single("profileImage"), async (req, res) => {
  try {
    const { name, email, password, phone, state, district, dietaryCategory } = req.body;

    console.log("[Signup] Attempting signup for email:", email);

    const existing = await User.findOne({ email });
    if (existing) {
      console.log("[Signup] Email already exists:", email);
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Upload profile image if provided
    let profileImage = "";
    let profileImagePublicId = "";
    if (req.file) {
      const cloudResult = await uploadToCloudinary(req.file.buffer, "profile-images");
      profileImage = cloudResult.secure_url;
      profileImagePublicId = cloudResult.public_id;
    }

    const user = await User.create({
      name, email, phone, state, district, dietaryCategory,
      password: hashedPassword,
      profileImage,
      profileImagePublicId,
      bio: "",
      createdAt: new Date(),
      lastLoginAt: new Date(),
      loginHistory: [{ loginTime: new Date(), ipAddress: req.ip }]
    });

    console.log("[Signup] User created successfully:", user._id);

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      token,
      user: {
        id: user._id, name: user.name, email: user.email,
        state: user.state, district: user.district,
        dietaryCategory: user.dietaryCategory,
        profileImage: user.profileImage,
        bio: user.bio
      }
    });
  } catch (err) {
    console.error("[Signup] Error:", err.code, err.message);
    // Handle MongoDB duplicate key error (E11000) - stale index case
    if (err.code === 11000) {
      return res.status(400).json({ message: "Email already registered (duplicate key)" });
    }
    res.status(500).json({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    user.lastLoginAt = new Date();
    user.loginHistory.push({ loginTime: new Date(), ipAddress: req.ip });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: {
        id: user._id, name: user.name, email: user.email,
        state: user.state, district: user.district,
        dietaryCategory: user.dietaryCategory,
        profileImage: user.profileImage || "",
        bio: user.bio || ""
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
