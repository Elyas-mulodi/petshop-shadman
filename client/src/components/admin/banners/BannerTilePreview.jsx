import { ArrowLeft, PawPrint } from "lucide-react";
import { BANNER_ICON_MAP } from "../../../utils/bannerIcons";
import { getImageUrl } from "../../../utils/imageUrl";

const BannerTilePreview = ({ banner, className = "" }) => {
  const { slot } = banner;
  const focal = banner.focalPoint ?? { x: 50, y: 50 };

  if (slot === "main") {
    return (
      <div
        className={`flex flex-col justify-center overflow-hidden rounded-xl border border-line bg-ink p-6 ${className}`}
      >
        {banner.eyebrow && (
          <p className="mb-2 text-[11px] text-sage">{banner.eyebrow}</p>
        )}
        <h3 className="font-display text-xl font-bold leading-[1.4] text-paper">
          {banner.title || "عنوان بنر"}
        </h3>
        {banner.subtitle && (
          <p className="mt-3 line-clamp-3 text-[11px] leading-6 text-muted">
            {banner.subtitle}
          </p>
        )}
        {banner.ctaText && (
          <span className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-lg bg-bronze px-4 py-2 text-[11px] font-medium text-ink">
            {banner.ctaText}
            <ArrowLeft className="h-3 w-3" />
          </span>
        )}
      </div>
    );
  }
  if (slot === "promo") {
    const image = getImageUrl(banner.image);
    const focal = banner.focalPoint ?? { x: 50, y: 50 };
    const BadgeIcon = BANNER_ICON_MAP[banner.icon] ?? PawPrint;

    return (
      <div
        className={`flex items-center gap-4 overflow-hidden rounded-xl border border-line bg-ink p-5 ${className}`}
      >
        <div className="min-w-0 flex-1">
          {banner.eyebrow && (
            <p className="mb-1.5 text-[10px] text-sage">{banner.eyebrow}</p>
          )}
          <h3 className="line-clamp-2 font-display text-base font-bold leading-[1.5] text-paper">
            {banner.title || "عنوان بنر"}
          </h3>
          {banner.subtitle && (
            <p className="mt-2 line-clamp-2 text-[10px] leading-5 text-muted">
              {banner.subtitle}
            </p>
          )}
          {banner.ctaText && (
            <span className="mt-3 inline-flex rounded-full bg-bronze px-3 py-1 text-[10px] font-medium text-ink">
              {banner.ctaText}
            </span>
          )}
        </div>
        <div className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-t-full rounded-b-lg border border-line bg-well">
          {image && (
            <img
              src={image}
              alt=""
              className="h-full w-full object-cover"
              style={{ objectPosition: `${focal.x}% ${focal.y}%` }}
            />
          )}
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
      <div
        className={`flex flex-col justify-center gap-2 overflow-hidden rounded-xl border border-line bg-ink px-5 ${className}`}
      >
        <Icon className="h-5 w-5 text-bronze" strokeWidth={1.6} />
        <p className="line-clamp-3 text-xs leading-5 text-muted">
          {banner.title || "متن تایل"}
        </p>
      </div>
    );
  }

  // tall و square
  const image = getImageUrl(banner.image);
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-line bg-well ${className}`}
    >
      {image && (
        <img
          src={image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: `${focal.x}% ${focal.y}%` }}
        />
      )}
      <div
        className="absolute inset-0 bg-ink"
        style={{ opacity: (banner.overlay ?? 20) / 100 }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
      <span className="absolute inset-x-0 bottom-0 p-4 font-display text-sm font-bold text-paper">
        {banner.title || "برچسب تایل"}
      </span>
    </div>
  );
};

export default BannerTilePreview;
