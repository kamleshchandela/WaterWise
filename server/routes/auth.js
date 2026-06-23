import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone, state, district, dietaryCategory } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name, email, phone, state, district, dietaryCategory,
      password: hashedPassword,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      loginHistory: [{ loginTime: new Date(), ipAddress: req.ip }]
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      token,
      user: {
        id: user._id, name: user.name, email: user.email,
        state: user.state, district: user.district,
        dietaryCategory: user.dietaryCategory
      }
    });
  } catch (err) {
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
        dietaryCategory: user.dietaryCategory
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
