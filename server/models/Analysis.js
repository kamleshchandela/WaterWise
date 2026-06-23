import mongoose from "mongoose";

const AnalysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  imageUrl: { type: String, required: true },
  imagePublicId: { type: String, required: true },
  foodItemDetected: { type: String },
  waterUsedLiters: { type: Number },
  alternatives: [{
    name: String,
    waterUsedLiters: Number,
    waterSavedLiters: Number,
    imageUrl: String,
    description: String,
    googleMapsLink: String
  }],
  dietaryCategoryUsed: String,
  userState: String,
  userDistrict: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Analysis", AnalysisSchema);
