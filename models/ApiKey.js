import mongoose from "mongoose";

const apiKeySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    apiKey: {
      type: String,
      required: true,
      unique: true,
    },

    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: false,
    },

    usageCount: {
      type: Number,
      default: 0,
    },

    dailyLimit: {
      type: Number,
      default: 1000, // per day, you can change
    },

    lastUsed: {
      type: Date,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ApiKey", apiKeySchema);
