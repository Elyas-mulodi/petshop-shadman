import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "main" },
    shipping: {
      cost: { type: Number, required: true, min: 0, default: 0 },
      freeThreshold: { type: Number, required: true, min: 0, default: 0 }, // ۰ = ارسال رایگان غیرفعال
    },
    inventory: {
      lowStockThreshold: { type: Number, required: true, min: 0, default: 5 },
    },
    store: {
      name: { type: String, required: true, trim: true, maxlength: 60 },
      manager: { type: String, trim: true, maxlength: 60, default: "" },
      phone: { type: String, trim: true, maxlength: 20, default: "" },
      address: { type: String, trim: true, maxlength: 200, default: "" },
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

const Settings = mongoose.model("Settings", settingsSchema);
export default Settings;
