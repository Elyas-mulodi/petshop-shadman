import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import Button from "./Button";
import { useToast } from "./ToastProvider";
import {
  ACCEPT,
  checkImageFiles,
  summarizeRejected,
} from "../../../features/admin/products/productImages";
import { getImageUrl } from "../../../utils/imageUrl";

// value: { file: File | null, removed: boolean }؛ existingUrl عکس فعلی روی سرور است
const SingleImagePicker = ({
  label,
  existingUrl,
  value,
  onChange,
  disabled = false,
}) => {
  const toast = useToast();
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!value.file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(value.file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value.file]);

  const current = preview ?? (value.removed ? null : getImageUrl(existingUrl));

  const pick = (list) => {
    const { accepted, rejected } = checkImageFiles([...list].slice(0, 1), 1);
    if (rejected.length > 0) toast.error(summarizeRejected(rejected));
    if (accepted[0]) onChange({ file: accepted[0], removed: false });
  };

  return (
    <div className="mb-4">
      <span className="mb-1.5 block text-xs font-medium text-muted">
        {label}
      </span>
      <div className="flex items-center gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-line bg-ink">
          {current ? (
            <img src={current} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-6 w-6 text-muted" strokeWidth={1.4} />
          )}
        </div>

        <div className="flex flex-col items-start gap-2">
          <Button
            size="sm"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            {current ? "تغییر تصویر" : "انتخاب تصویر"}
          </Button>
          {current && (
            <Button
              size="sm"
              variant="ghost"
              icon={Trash2}
              disabled={disabled}
              className="hover:text-danger"
              onClick={() => onChange({ file: null, removed: !!existingUrl })}
            >
              حذف تصویر
            </Button>
          )}
          <p className="text-[11px] leading-5 text-muted">
            jpg، png یا webp، حداکثر ۳ مگابایت
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
};

export default SingleImagePicker;
