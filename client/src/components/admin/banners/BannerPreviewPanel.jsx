import { useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import BannerTilePreview from "./BannerTilePreview";

const OPTIONS = [
  { value: "desktop", label: "دسکتاپ", icon: Monitor },
  { value: "mobile", label: "موبایل", icon: Smartphone },
];

// پیش‌نمایش زنده با کلید دسکتاپ/موبایل
// aspect: کلاس نسبت ابعاد تایل (PREVIEW_ASPECT[slot])
const BannerPreviewPanel = ({ banner, aspect }) => {
  const [device, setDevice] = useState("desktop");
  const mobile = device === "mobile";
  const usesFallback = mobile && !banner.imageMobile && Boolean(banner.image);

  return (
    <div>
      <div className="mb-3 grid grid-cols-2 gap-1 rounded-lg border border-line bg-ink p-1">
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={device === value}
            onClick={() => setDevice(value)}
            className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs transition-colors ${
              device === value ? "bg-bronze/15 text-bronze" : "text-muted hover:text-paper"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className={mobile ? "mx-auto w-[200px]" : "w-full"}>
        <BannerTilePreview banner={banner} device={device} className={`w-full ${aspect}`} />
      </div>

      {usesFallback && (
        <p className="mt-2 text-xs leading-6 text-muted">عکس موبایل نگذاشته‌اید؛ روی موبایل همان تصویر اصلی نمایش داده می‌شود.</p>
      )}
    </div>
  );
};

export default BannerPreviewPanel;