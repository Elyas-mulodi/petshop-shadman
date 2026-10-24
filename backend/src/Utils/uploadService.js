import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadRoot = path.join(__dirname, "..", "..", "uploads");

// پسوند از روی نوع فایل ساخته می‌شه، نه نام ارسالی کاربر
const EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const createUploader = (folderName) => {
  const uploadPath = path.join(uploadRoot, folderName);

  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadPath),
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${EXTENSIONS[file.mimetype]}`;
      cb(null, uniqueName);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (EXTENSIONS[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error("فقط فرمت‌های jpg, png و webp مجاز هستند"), false);
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: 3 * 1024 * 1024 },
  });
};

export const getFileUrl = (folderName, filename) => {
  if (!filename) return null;
  return `/uploads/${folderName}/${filename}`;
};

export const deleteUploadedFile = async (fileUrl) => {
  if (typeof fileUrl !== "string" || !fileUrl.startsWith("/uploads/")) return;

  const target = path.join(uploadRoot, fileUrl.replace(/^\/uploads\//, ""));
  const relative = path.relative(uploadRoot, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return; // جلوگیری از path traversal

  try {
    await fs.promises.unlink(target);
  } catch (err) {
    if (err.code !== "ENOENT") console.error("خطا در حذف فایل:", err.message);
  }
};

// فایل‌هایی که multer ذخیره کرده ولی درخواست شکست خورده نباید روی دیسک بمونن
export const cleanupRequestFiles = async (req) => {
  const files = [
    ...(Array.isArray(req.files) ? req.files : Object.values(req.files || {}).flat()),
    ...(req.file ? [req.file] : []),
  ];
  await Promise.all(files.map((f) => fs.promises.unlink(f.path).catch(() => {})));
};

export default createUploader;