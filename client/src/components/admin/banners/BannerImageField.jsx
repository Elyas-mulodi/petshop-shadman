import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import Button from "../ui/Button";
import { uploadBannerImage } from "../../../features/admin/banners/useAdminBanners";
import { getImageUrl } from "../../../utils/imageUrl";
import { parseApiError } from "../../../utils/authHelpers";

const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;
const clamp = (n) => Math.min(100, Math.max(0, Math.round(n)));

const BannerImageField = ({ value, onChange, focal, onFocalChange, onBusyChange, error, showFocal = true }) => {
  const fileInput = useRef(null);
  const picker = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleFile = async (file) => {
    if (!file) return;
    if (!TYPES.includes(file.type)) return setLocalError("فرمت تصویر مجاز نیست (jpg، png یا webp)");
    if (file.size > MAX_SIZE) return setLocalError("حجم تصویر بیش از ۵ مگابایت است");

    setLocalError("");
    setUploading(true);
    onBusyChange?.(true);
    try {
      onChange(await uploadBannerImage(file));
    } catch (err) {
      setLocalError(parseApiError(err).message);
    } finally {
      setUploading(false);
      onBusyChange?.(false);
    }
  };

  // نقطه‌ی مهم = درصد موقعیت کلیک روی خود عکس (بدون برش)
  const setFocal = (e) => {
    const rect = picker.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return;
    onFocalChange({
      x: clamp(((e.clientX - rect.left) / rect.width) * 100),
      y: clamp(((e.clientY - rect.top) / rect.height) * 100),
    });
  };

  const image = getImageUrl(value);
  const shownError = localError || error;

  const spinner = uploading && (
    <div className="absolute inset-0 flex items-center justify-center bg-ink/70">
      <Loader2 className="h-6 w-6 animate-spin text-bronze" />
    </div>
  );

  return (
    <div>
      {image ? (
        <>
          {showFocal ? (
            <>
              <div
                ref={picker}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setFocal(e);
                }}
                onPointerMove={(e) => e.buttons && setFocal(e)}
                className="relative cursor-crosshair touch-none overflow-hidden rounded-xl border border-line"
              >
                <img src={image} alt="" draggable={false} className="block w-full select-none" />
                <span
                  className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper shadow-lg ring-2 ring-bronze"
                  style={{ left: `${focal.x}%`, top: `${focal.y}%` }}
                />
                {spinner}
              </div>
              <p className="mt-2 text-xs leading-6 text-muted">
                روی مهم‌ترین قسمت عکس (مثلاً صورت حیوان) کلیک کنید تا هنگام برش همیشه در کادر بماند.
              </p>
            </>
          ) : (
            <div className="relative overflow-hidden rounded-xl border border-line bg-ink">
              <img src={image} alt="" className="block max-h-56 w-full object-cover" />
              {spinner}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" icon={ImagePlus} disabled={uploading} onClick={() => fileInput.current?.click()}>
              تغییر تصویر
            </Button>
            <Button size="sm" variant="ghost" icon={Trash2} disabled={uploading} onClick={() => onChange("")}>
              حذف تصویر
            </Button>
          </div>
        </>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInput.current?.click()}
          className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-ink text-muted transition-colors hover:border-bronze/60 hover:text-paper"
        >
          {uploading ? <Loader2 className="h-6 w-6 animate-spin text-bronze" /> : <ImagePlus className="h-6 w-6" />}
          <span className="text-xs">{uploading ? "در حال آپلود..." : "انتخاب تصویر (jpg، png یا webp، حداکثر ۵ مگابایت)"}</span>
        </button>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = ""; // امکان انتخاب دوباره‌ی همان فایل
        }}
      />

      {shownError && <p className="mt-2 text-xs text-danger">{shownError}</p>}
    </div>
  );
};

export default BannerImageField;