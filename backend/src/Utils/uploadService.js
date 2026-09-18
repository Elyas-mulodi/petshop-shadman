import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadRoot = path.join(__dirname, "..", "..", "uploads");

const createUploader = (folderName) => {
  const uploadPath = path.join(uploadRoot, folderName);

  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadPath),
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  });

  const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
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

export default createUploader;