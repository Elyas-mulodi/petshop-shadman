import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";

import { useBanners } from "../../features/banners/useBanners";
import { getImageUrl } from "../../utils/imageUrl";

const ease = [0.22, 1, 0.36, 1];

// لینک داخلی با Link، لینک https بیرونی با <a>
const SmartLink = ({ to, className, children }) =>
  /^https?:\/\//i.test(to) ? (
    <a href={to} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  ) : (
    <Link to={to} className={className}>
      {children}
    </Link>
  );

// bannerKey: کلید بخش، باید با SECTION_KEYS توی پنل یکی باشه. بدونش، Section مثل قبل با props کار می‌کنه.
const Section = ({ bannerKey, title, subtitle, viewAllTo, viewAllLabel = "مشاهده همه", children }) => {
  const { data } = useBanners();

  // بنر این بخش از پنل (اولین مورد، کمترین order)
  const banner = useMemo(
    () => (bannerKey ? (data ?? []).find((b) => b.slot === "section" && b.sectionKey === bannerKey) : null),
    [data, bannerKey],
  );

  const heading = banner?.title || title;
  const description = banner ? banner.subtitle : subtitle;
  const linkTo = banner?.ctaLink || viewAllTo;
  const linkLabel = banner?.ctaText || viewAllLabel;

  const image = getImageUrl(banner?.image);
  const mobileImage = getImageUrl(banner?.imageMobile);
  const focal = banner?.focalPoint ?? { x: 50, y: 50 };
  const hasImage = Boolean(image || mobileImage);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease }}
      className="mx-auto max-w-7xl py-12 lg:px-8"
    >
      <div className="mb-6 px-4 lg:px-0">
        <div
          className={
            hasImage
              ? "relative flex min-h-[9rem] items-end justify-between gap-4 overflow-hidden rounded-2xl border border-line bg-ink p-5 sm:min-h-[11rem] sm:p-8"
              : "flex items-end justify-between gap-4"
          }
        >
          {hasImage && (
            <>
              <picture>
                {mobileImage && <source media="(max-width: 639px)" srcSet={mobileImage} />}
                <img
                  src={image || mobileImage}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: `${focal.x}% ${focal.y}%` }}
                />
              </picture>
              <div className="absolute inset-0 bg-ink" style={{ opacity: (banner.overlay ?? 40) / 100 }} />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />
            </>
          )}

          <div className="relative min-w-0">
            <h2 className="font-display text-2xl font-bold text-paper">{heading}</h2>
            {description && (
              <p className={`mt-1.5 text-sm ${hasImage ? "text-paper/80" : "text-muted"}`}>{description}</p>
            )}
          </div>

          {linkTo && (
            <SmartLink
              to={linkTo}
              className="relative hidden shrink-0 items-center gap-1.5 text-sm text-bronze hover:underline sm:flex"
            >
              {linkLabel}
              <ArrowLeft className="h-4 w-4" />
            </SmartLink>
          )}
        </div>
      </div>

      {children}
    </motion.section>
  );
};

export default Section;