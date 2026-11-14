import asyncHandler from "express-async-handler";
import { logAudit } from "../../Utils/audit.js";
import Banner from "./BannerMd.js";
import { getFileUrl, deleteUploadedFile } from "../../Utils/uploadService.js";

// خطای ثبت لاگ نباید مانع جواب API بشه
const audit = (req, data) =>
  Promise.resolve(logAudit(req, data)).catch((err) =>
    console.error("banner audit failed:", err.message),
  );

const findBannerOrFail = async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) {
    res.status(404);
    throw new Error("بنر یافت نشد");
  }
  return banner;
};

// فایل فقط وقتی پاک می‌شه که هیچ بنر دیگه‌ای (چه به‌عنوان image چه imageMobile) ازش استفاده نکنه.
// خطای پاک‌کردن فایل نباید باعث خطای ۵۰۰ بشه، چون بنر قبلاً با موفقیت ذخیره شده.
const releaseImages = async (urls, exceptId) => {
  for (const url of new Set(urls.filter(Boolean))) {
    try {
      const stillUsed = await Banner.exists({
        $or: [{ image: url }, { imageMobile: url }],
        ...(exceptId && { _id: { $ne: exceptId } }),
      });
      if (!stillUsed) await deleteUploadedFile(url);
    } catch (err) {
      console.error("banner image cleanup failed:", err.message);
    }
  }
};

// ---------- آپلود تصویر بنر ----------
export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("فایل تصویر ارسال نشد");
  }

  res.status(201).json({
    success: true,
    data: { url: getFileUrl("banners", req.file.filename) },
  });
});

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
  const banners = await Banner.find().sort({
    slot: 1,
    order: 1,
    createdAt: -1,
  });
  res.status(200).json({ success: true, data: banners });
});

export const adminGetById = asyncHandler(async (req, res) => {
  const banner = await findBannerOrFail(req, res);
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

  res
    .status(201)
    .json({ success: true, message: "بنر ایجاد شد", data: banner });
});

export const update = asyncHandler(async (req, res) => {
  const banner = await findBannerOrFail(req, res);

  const previous = [banner.image, banner.imageMobile];

  banner.set(req.body);
  await banner.save();

  // هر عکسی که دیگه توی این بنر نیست (عوض شده یا حذف شده) آزاد میشه
  const dropped = previous.filter(
    (url) => url && url !== banner.image && url !== banner.imageMobile,
  );
  await releaseImages(dropped, banner._id);

  await audit(req, {
    action: "banner.update",
    entityType: "banner",
    entityId: banner._id,
    entityLabel: banner.title,
    summary: `بنر «${banner.title}» ویرایش شد`,
  });

  res
    .status(200)
    .json({ success: true, message: "بنر بروزرسانی شد", data: banner });
});

export const remove = asyncHandler(async (req, res) => {
  const banner = await findBannerOrFail(req, res);

  await banner.deleteOne();
  await releaseImages([banner.image, banner.imageMobile]);

  await audit(req, {
    action: "banner.delete",
    entityType: "banner",
    entityId: banner._id,
    entityLabel: banner.title,
    summary: `بنر «${banner.title}» حذف شد`,
  });

  res.status(200).json({ success: true, message: "بنر حذف شد", data: null });
});