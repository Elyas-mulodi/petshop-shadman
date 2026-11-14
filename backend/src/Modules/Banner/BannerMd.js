import mongoose from "mongoose";

// تایل‌های هیرو صفحه‌ی اصلی
export const BANNER_SLOTS = [
  "main",
  "tall",
  "square",
  "info",
  "promo",
  "section",
];
// آیکون‌های مجاز برای تایل info (فرانت هرکدوم رو به آیکون lucide نگاشت می‌کنه)
export const BANNER_ICONS = [
  "truck",
  "paw-print",
  "shield-check",
  "gift",
  "heart",
  "clock",
  "phone",
  "percent",
];

const focalAxis = { type: Number, min: 0, max: 100, default: 50 };

const bannerSchema = new mongoose.Schema(
  {
    slot: {
      type: String,
      enum: { values: BANNER_SLOTS, message: "تایل بنر نامعتبر است" },
      required: [true, "تایل بنر الزامی است"],
    },

    // متن‌ها: برای tall و square، title همان برچسب روی تایل است؛ برای info همان متن
    eyebrow: { type: String, trim: true, default: "" },
    title: {
      type: String,
      required: [true, "عنوان بنر الزامی است"],
      trim: true,
    },
    subtitle: { type: String, trim: true, default: "" },
    badge: { type: String, trim: true, default: "" }, // متن چیپ شناور روی عکس (فقط promo)
    ctaText: { type: String, trim: true, default: "" },
    ctaLink: { type: String, trim: true, default: "" }, // لینک دکمه (main) یا لینک کل تایل (tall/square/info)

    // تصویر: برای tall، square و promo الزامی
    image: { type: String, default: null },
    imageAlt: { type: String, trim: true, default: "" },
    focalPoint: { x: focalAxis, y: focalAxis }, // نقطه‌ی مهم عکس (درصد) برای object-position
    overlay: { type: Number, min: 0, max: 80, default: 20 }, // تیرگی روی عکس (درصد)
    imageMobile: { type: String, default: null }, // عکس جدا برای موبایل (اختیاری)
    sectionKey: { type: String, trim: true, default: "" }, // فقط برای slot = section

    // null باید توی لیست باشه، وگرنه Mongoose برای بنرهای بدون آیکون خطا می‌ده
    icon: {
      type: String,
      enum: { values: [...BANNER_ICONS, null], message: "آیکون نامعتبر است" },
      default: null,
    },

    // مدیریت
    order: { type: Number, default: 0 }, // کوچیک‌تر = اول
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
  },
  { timestamps: true },
);

bannerSchema.index({ slot: 1, isActive: 1, order: 1 });

// قانون‌هایی که به چند فیلد با هم بستگی دارن (روی سند نهایی چک میشن، چه ساخت چه ویرایش)
bannerSchema.pre("validate", function () {
  // sectionKey فقط برای بخش‌های صفحه معنی داره؛ اگه تایل عوض شد، مقدار قبلی نمونه
  if (this.slot !== "section") this.sectionKey = "";

  const tile = this.slot === "tall" || this.slot === "square";

  if (tile && !this.image)
    this.invalidate("image", "برای این تایل، تصویر الزامی است");
  if (tile && !this.ctaLink)
    this.invalidate("ctaLink", "برای این تایل، لینک الزامی است");
  if (this.ctaText && !this.ctaLink)
    this.invalidate("ctaLink", "برای متن دکمه، لینک هم لازم است");
  if (this.slot === "promo" && !this.image)
    this.invalidate("image", "برای بنر میان‌صفحه، تصویر الزامی است");
  if (this.slot === "info" && !this.icon)
    this.invalidate("icon", "برای این تایل، آیکون الزامی است");
  if (this.slot === "section" && !this.sectionKey)
    this.invalidate("sectionKey", "برای عنوان بخش، انتخاب بخش الزامی است");
  if (this.startsAt && this.endsAt && this.endsAt <= this.startsAt) {
    this.invalidate("endsAt", "زمان پایان باید بعد از زمان شروع باشد");
  }
});

export default mongoose.model("Banner", bannerSchema);