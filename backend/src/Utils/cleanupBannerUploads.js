import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import Banner from "../Modules/Banner/BannerMd.js";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "uploads", "banners");
const MIN_AGE_MS = 24 * 60 * 60 * 1000; // فایلی که تازه آپلود شده و هنوز بنری بهش وصل نشده پاک نمی‌شه

export const cleanupBannerUploads = async () => {
  let files;
  try {
    files = await fs.readdir(dir);
  } catch {
    return 0; // پوشه هنوز ساخته نشده
  }

  const banners = await Banner.find({ image: { $ne: null } }).select("image").lean();
  const used = new Set(banners.map((b) => path.basename(b.image)));

  let removed = 0;
  for (const file of files) {
    if (used.has(file)) continue;

    const full = path.join(dir, file);
    const stat = await fs.stat(full).catch(() => null);
    if (!stat?.isFile() || Date.now() - stat.mtimeMs < MIN_AGE_MS) continue;

    await fs.unlink(full).catch(() => {});
    removed += 1;
  }

  return removed;
};

export const startBannerCleanupJob = (intervalMs = 24 * 60 * 60 * 1000) => {
  const run = () =>
    cleanupBannerUploads()
      .then((n) => n > 0 && console.log(`🧹 ${n} فایل بی‌صاحب بنر پاک شد`))
      .catch((err) => console.error("خطا در پاک‌سازی تصاویر بنر:", err.message));

  setTimeout(run, 60_000);
  const timer = setInterval(run, intervalMs);
  timer.unref();
  return timer;
};