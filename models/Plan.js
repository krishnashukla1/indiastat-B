import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },

    price: {
      type: Number,
      required: true,
    },

    durationInDays: {
      type: Number,
      required: true,
    },

    downloadLimit: {
      type: Number,
      default: 50, // Free users e.g. 50 downloads
    },

    apiDailyLimit: {
      type: Number,
      default: 1000, // Premium API request per day
    },

    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Plan", planSchema);
