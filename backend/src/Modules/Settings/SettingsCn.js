import asyncHandler from "express-async-handler";
import Settings from "./SettingsMd.js";
import { getSettings, invalidateSettings } from "../../Utils/settings.js";
import { logAudit } from "../../Utils/audit.js";

const KEY = "main";

const FIELDS = [
  ["shipping.cost", "هزینه‌ی ارسال"],
  ["shipping.freeThreshold", "حداقل خرید برای ارسال رایگان"],
  ["inventory.lowStockThreshold", "آستانه‌ی کم‌موجودی"],
  ["store.name", "نام فروشگاه"],
  ["store.manager", "مدیر فروشگاه"],
  ["store.phone", "تلفن فروشگاه"],
  ["store.address", "آدرس فروشگاه"],
];

const read = (obj, path) =>
  path.split(".").reduce((acc, key) => acc?.[key], obj);

export const getAdminSettings = asyncHandler(async (req, res) => {
  await getSettings(); // مطمئن می‌شیم سند وجود داره

  const settings = await Settings.findOne({ key: KEY })
    .populate("updatedBy", "name phone")
    .lean();

  res.status(200).json({ success: true, data: settings });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const { shipping, inventory, store } = req.body;

  await getSettings();
  const before = await Settings.findOne({ key: KEY }).lean();

  const after = await Settings.findOneAndUpdate(
    { key: KEY },
    { $set: { shipping, inventory, store, updatedBy: req.user._id } },
    { new: true, runValidators: true },
  )
    .populate("updatedBy", "name phone")
    .lean();

  invalidateSettings();

  const changes = FIELDS.map(([field, label]) => ({
    field,
    label,
    from: read(before, field),
    to: read(after, field),
  })).filter((c) => c.from !== c.to);

  if (changes.length > 0) {
    await logAudit(req, {
      action: "settings.update",
      entityType: "settings",
      entityLabel: "تنظیمات فروشگاه",
      summary: `تنظیمات فروشگاه ویرایش شد: ${changes.map((c) => c.label).join("، ")}`,
      changes,
    });
  }

  res.status(200).json({ success: true, data: after });
});
