import { useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
} from "lucide-react";
import {
  ACCEPT,
  MAX_IMAGES,
} from "../../../features/admin/products/productImages";
import { toPersianDigits } from "../../../utils/authHelpers";

const IconButton = ({ label, onClick, disabled, danger = false, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    title={label}
    className={`flex h-7 w-7 items-center justify-center rounded-md bg-ink/80 text-paper backdrop-blur transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
      danger
        ? "hover:bg-danger hover:text-ink"
        : "hover:bg-bronze hover:text-ink"
    }`}
  >
    {children}
  </button>
);

const ImageGrid = ({
  items,
  busy = false,
  uploading = false,
  progress = null,
  onAdd,
  onMove,
  onRemove,
  onMakePrimary,
}) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const full = items.length >= MAX_IMAGES;
  const locked = busy || uploading;

  const addFiles = (list) => {
    const files = [...list];
    if (files.length > 0) onAdd(files);
  };

  return (
    <div
      onDragOver={(e) => {
        if (full || locked) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!full && !locked) addFiles(e.dataTransfer.files);
      }}
      className={`rounded-xl border border-dashed p-3 transition-colors ${
        dragging ? "border-bronze bg-bronze/5" : "border-line"
      }`}
    >
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item, i) => (
          <li
            key={item.key}
            className="group relative aspect-square overflow-hidden rounded-lg border border-line bg-well"
          >
            <img
              src={item.src}
              alt={`تصویر ${toPersianDigits(i + 1)} محصول`}
              loading="lazy"
              className="h-full w-full object-cover"
            />

            {i === 0 && (
              <span className="absolute right-1.5 top-1.5 rounded-full bg-bronze px-2 py-0.5 text-[10px] font-medium text-ink">
                اصلی
              </span>
            )}

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-ink/90 to-transparent p-1.5 md:opacity-0 md:transition-opacity md:group-focus-within:opacity-100 md:group-hover:opacity-100">
              <div className="flex gap-1">
                <IconButton
                  label="جابه‌جایی به قبل"
                  disabled={locked || i === 0}
                  onClick={() => onMove(i, i - 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </IconButton>
                <IconButton
                  label="جابه‌جایی به بعد"
                  disabled={locked || i === items.length - 1}
                  onClick={() => onMove(i, i + 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </IconButton>
              </div>
              <div className="flex gap-1">
                {i !== 0 && (
                  <IconButton
                    label="تصویر اصلی شود"
                    disabled={locked}
                    onClick={() => onMakePrimary(i)}
                  >
                    <Star className="h-4 w-4" />
                  </IconButton>
                )}
                <IconButton
                  label="حذف تصویر"
                  danger
                  disabled={locked}
                  onClick={() => onRemove(i)}
                >
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </div>
            </div>
          </li>
        ))}

        {!full && (
          <li>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={locked}
              className="flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-line text-muted transition-colors hover:border-bronze/60 hover:text-bronze disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-xs">
                    {progress !== null
                      ? `${toPersianDigits(progress)}٪`
                      : "در حال آپلود..."}
                  </span>
                </>
              ) : (
                <>
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-xs">افزودن عکس</span>
                </>
              )}
            </button>
          </li>
        )}
      </ul>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <p className="mt-3 text-[11px] leading-5 text-muted">
        {toPersianDigits(items.length)} از {toPersianDigits(MAX_IMAGES)} عکس.
        عکس اول، تصویر اصلی محصول است. فایل‌ها را بکشید و رها کنید یا دکمه را
        بزنید. فرمت jpg، png یا webp و حداکثر ۳ مگابایت.
      </p>
    </div>
  );
};

export default ImageGrid;
