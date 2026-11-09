import asyncHandler from "express-async-handler";
import { logAudit } from "../../Utils/audit.js";
import Banner from "./BannerMd.js";

// خطای ثبت لاگ نباید مانع جواب API بشه
const audit = (req, data) =>
  Promise.resolve(logAudit(req, data)).catch((err) => console.error("banner audit failed:", err.message));

// ---------- عمومی (فروشگاه) ----------
// GET /banners?slot=main → فقط بنرهای فعال و داخل بازه‌ی زمان‌بندی
export const list = asyncHandler(async (req, res) => {
  const now = new Date();
  const filter = {
    isActive: true,
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
    ],
    ...(req.query.slot && { slot: req.query.slot }),
  };

  const banners = await Banner.find(filter)
    .sort({ order: 1, createdAt: -1 })
    .select("-isActive -startsAt -endsAt -createdAt -updatedAt -__v")
    .lean();

  res.status(200).json({ success: true, data: banners });
});

// ---------- ادمین ----------
export const adminList = asyncHandler(async (req, res) => {
  const banners = await Banner.find().sort({ slot: 1, order: 1, createdAt: -1 });
  res.status(200).json({ success: true, data: banners });
});

export const adminGetById = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) {
    res.status(404);
    throw new Error("بنر یافت نشد");
  }
  res.status(200).json({ success: true, data: banner });
});

export const create = asyncHandler(async (req, res) => {
  const banner = await Banner.create(req.body);

  await audit(req, {
    action: "banner.create",
    entityType: "banner",
    entityId: banner._id,
    entityLabel: banner.title,
    summary: `بنر «${banner.title}» ساخته شد`,
  });

  res.status(201).json({ success: true, message: "بنر ایجاد شد", data: banner });
});

export const update = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) {
    res.status(404);
    throw new Error("بنر یافت نشد");
  }

  banner.set(req.body);
  await banner.save();
  // TODO: اگه توی این پروژه helper حذف فایل آپلود داری، تصویر قدیمی (اگه عوض شده و جای دیگه‌ای استفاده نمیشه) رو اینجا پاک کن

  await audit(req, {
    action: "banner.update",
    entityType: "banner",
    entityId: banner._id,
    entityLabel: banner.title,
    summary: `بنر «${banner.title}» ویرایش شد`,
  });

  res.status(200).json({ success: true, message: "بنر بروزرسانی شد", data: banner });
});

export const remove = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) {
    res.status(404);
    throw new Error("بنر یافت نشد");
  }

  await banner.deleteOne();
  // TODO: حذف فایل تصویر از دیسک (مثل بالا)

  await audit(req, {
    action: "banner.delete",
    entityType: "banner",
    entityId: banner._id,
    entityLabel: banner.title,
    summary: `بنر «${banner.title}» حذف شد`,
  });

  res.status(200).json({ success: true, message: "بنر حذف شد", data: null });
});