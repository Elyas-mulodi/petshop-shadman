import { ArrowLeft, PawPrint } from "lucide-react";
import { BANNER_ICON_MAP } from "../../../utils/bannerIcons";
import { getImageUrl } from "../../../utils/imageUrl";

// device="mobile": همون انتخابی که سایت روی موبایل می‌کنه (عکس موبایل، وگرنه عکس اصلی)
const BannerTilePreview = ({ banner, className = "", device = "desktop" }) => {
  const { slot } = banner;
  const focal = banner.focalPoint ?? { x: 50, y: 50 };
  const image = getImageUrl(device === "mobile" ? banner.imageMobile || banner.image : banner.image);
  const overlay = (banner.overlay ?? 20) / 100;

  const photo = image && (
    <img
      src={image}
      alt=""
      className="absolute inset-0 h-full w-full object-cover"
      style={{ objectPosition: `${focal.x}% ${focal.y}%` }}
    />
  );

  if (slot === "main") {
    return (
      <div className={`relative flex flex-col justify-center overflow-hidden rounded-xl border border-line bg-ink p-6 ${className}`}>
        {photo}
        {image && (
          <>
            <div className="absolute inset-0 bg-ink" style={{ opacity: overlay }} />
            <div className="absolute inset-0 bg-gradient-to-l from-ink/85 via-ink/50 to-transparent" />
          </>
        )}
        <div className="relative">
          {banner.eyebrow && <p className="mb-2 text-[11px] text-sage">{banner.eyebrow}</p>}
          <h3 className="font-display text-xl font-bold leading-[1.4] text-paper">{banner.title || "عنوان بنر"}</h3>
          {banner.subtitle && <p className="mt-3 line-clamp-3 text-[11px] leading-6 text-paper/70">{banner.subtitle}</p>}
          {banner.ctaText && (
            <span className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-lg bg-bronze px-4 py-2 text-[11px] font-medium text-ink">
              {banner.ctaText}
              <ArrowLeft className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>
    );
  }

  if (slot === "section") {
    return (
      <div className={`relative flex items-end justify-between gap-3 overflow-hidden rounded-xl border border-line bg-ink p-5 ${className}`}>
        {photo}
        {image && (
          <>
            <div className="absolute inset-0 bg-ink" style={{ opacity: overlay }} />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />
          </>
        )}
        <div className="relative min-w-0">
          <h3 className="line-clamp-1 font-display text-lg font-bold text-paper">{banner.title || "عنوان بخش"}</h3>
          {banner.subtitle && <p className="mt-1 line-clamp-1 text-xs text-paper/70">{banner.subtitle}</p>}
        </div>
        {banner.ctaLink && (
          <span className="relative flex shrink-0 items-center gap-1 text-xs text-bronze">
            {banner.ctaText || "مشاهده همه"}
            <ArrowLeft className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    );
  }

  if (slot === "promo") {
    const BadgeIcon = BANNER_ICON_MAP[banner.icon] ?? PawPrint;
    return (
      <div className={`flex items-center gap-4 overflow-hidden rounded-xl border border-line bg-ink p-5 ${className}`}>
        <div className="min-w-0 flex-1">
          {banner.eyebrow && <p className="mb-1.5 text-[10px] text-sage">{banner.eyebrow}</p>}
          <h3 className="line-clamp-2 font-display text-base font-bold leading-[1.5] text-paper">{banner.title || "عنوان بنر"}</h3>
          {banner.subtitle && <p className="mt-2 line-clamp-2 text-[10px] leading-5 text-muted">{banner.subtitle}</p>}
          {banner.ctaText && (
            <span className="mt-3 inline-flex rounded-full bg-bronze px-3 py-1 text-[10px] font-medium text-ink">{banner.ctaText}</span>
          )}
        </div>
        <div className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-b-lg rounded-t-full border border-line bg-well">
          {photo}
          {banner.badge && (
            <span className="absolute inset-x-1 bottom-1 flex items-center gap-1 rounded-full bg-card/90 px-1.5 py-0.5 text-[8px] text-paper">
              <BadgeIcon className="h-2.5 w-2.5 text-bronze" />
              <span className="truncate">{banner.badge}</span>
            </span>
          )}
        </div>
      </div>
    );
  }

  if (slot === "info") {
    const Icon = BANNER_ICON_MAP[banner.icon] ?? PawPrint;
    return (
      <div className={`flex flex-col justify-center gap-2 overflow-hidden rounded-xl border border-line bg-ink px-5 ${className}`}>
        <Icon className="h-5 w-5 text-bronze" strokeWidth={1.6} />
        <p className="line-clamp-3 text-xs leading-5 text-muted">{banner.title || "متن تایل"}</p>
      </div>
    );
  }

  // tall و square
  return (
    <div className={`relative overflow-hidden rounded-xl border border-line bg-well ${className}`}>
      {photo}
      <div className="absolute inset-0 bg-ink" style={{ opacity: overlay }} />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
      <span className="absolute inset-x-0 bottom-0 p-4 font-display text-sm font-bold text-paper">
        {banner.title || "برچسب تایل"}
      </span>
    </div>
  );
};

export default BannerTilePreview;