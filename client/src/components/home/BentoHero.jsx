import { useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowUpLeft, PawPrint } from "lucide-react";

import { useBanners } from "../../features/banners/useBanners";
import { BANNER_ICON_MAP } from "../../utils/bannerIcons";
import { getImageUrl } from "../../utils/imageUrl";

const ease = [0.22, 1, 0.36, 1];

// ورود تایل‌ها: خود تایل بالا میاد، بعد محتوای داخلش پشت سر هم
const tile = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease, delayChildren: 0.2, staggerChildren: 0.09 },
  },
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

// اگه برای یه تایل بنری ساخته نشده باشه (یا سرور جواب نده)، همین محتوا نمایش داده میشه
const FALLBACKS = {
  main: {
    eyebrow: "پت شاپ شادمان",
    title: "هر آنچه همراه چهارپای شما نیاز دارد",
    subtitle: "غذا، اکسسوری و لوازم بهداشتی برای سگ، گربه و دیگر حیوانات خانگی.",
    ctaText: "مشاهده محصولات",
    ctaLink: "/products",
    image: null,
  },
  tall: { title: "برای سگ‌ها", ctaLink: "/products?category=dog", image: null, overlay: 0 },
  square: { title: "برای گربه‌ها", ctaLink: "/products?category=cat", image: null, overlay: 0 },
  info: { icon: "truck", title: "ارسال رایگان بالای ۵۰۰ هزار تومان" },
};

// نورِ دنبال‌کننده‌ی ماوس: یه لایه‌ی برنزی که با mask فقط دور ماوس دیده میشه
const SPOT = "radial-gradient(280px circle at var(--mx, 50%) var(--my, 50%), #000, transparent 70%)";
const SPOT_MASK = { WebkitMaskImage: SPOT, maskImage: SPOT };

// بافت نقطه‌ای محو برای پس‌زمینه‌ی تایل اصلی وقتی عکس نداره
const DOTS = (() => {
  const fade = "linear-gradient(to bottom, #000, transparent 85%)";
  return {
    backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
    backgroundSize: "22px 22px",
    WebkitMaskImage: fade,
    maskImage: fade,
  };
})();

const hasBannerImage = (banner) => Boolean(getImageUrl(banner.image) || getImageUrl(banner.imageMobile));

// لینک داخلی با Link، لینک https بیرونی با <a>، بدون لینک فقط یه wrapper
const SmartLink = ({ to, className, children }) => {
  if (!to) return <div className={className}>{children}</div>;

  return /^https?:\/\//i.test(to) ? (
    <a href={to} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  ) : (
    <Link to={to} className={className}>
      {children}
    </Link>
  );
};

// قاب مشترک همه‌ی تایل‌ها: انیمیشن ورود + نور ماوس
const SpotTile = ({ className = "", children }) => {
  const ref = useRef(null);

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <motion.div
      ref={ref}
      variants={tile}
      onPointerMove={onMove}
      className={`group/tile relative overflow-hidden rounded-3xl border border-line ${className}`}
    >
      {children}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 bg-bronze/15 opacity-0 transition-opacity duration-500 group-hover/tile:opacity-100"
        style={SPOT_MASK}
      />
    </motion.div>
  );
};

const Skeleton = () => <div className="absolute inset-0 animate-pulse bg-well" />;

// عکس پس‌زمینه‌ی تایل اصلی (اختیاری) + تیرگی قابل تنظیم از پنل
const MainBackground = ({ banner }) => {
  const image = getImageUrl(banner.image);
  const mobileImage = getImageUrl(banner.imageMobile);
  if (!image && !mobileImage) return null;

  const focal = banner.focalPoint ?? { x: 50, y: 50 };

  return (
    <>
      <picture className="contents">
        {mobileImage && <source media="(max-width: 1023px)" srcSet={mobileImage} />}
        <img
          src={image || mobileImage}
          alt=""
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: `${focal.x}% ${focal.y}%` }}
        />
      </picture>
      <div className="absolute inset-0 bg-ink" style={{ opacity: (banner.overlay ?? 40) / 100 }} />
      {/* موبایل: متن پایین کارته؛ دسکتاپ: متن سمت راسته */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/55 to-ink/10 lg:bg-gradient-to-l lg:from-ink/85 lg:via-ink/50 lg:to-ink/10" />
    </>
  );
};

// پس‌زمینه‌ی تزئینی وقتی تایل اصلی عکس نداره: نور برنزی و سبز، بافت نقطه‌ای و ردپای شناور
const MainDecor = ({ reduce }) => (
  <>
    <div aria-hidden className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-bronze/20 blur-3xl" />
    <div aria-hidden className="absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-sage/15 blur-3xl" />
    <div aria-hidden className="absolute inset-0" style={DOTS} />
    <motion.div
      aria-hidden
      animate={reduce ? undefined : { y: [0, -12, 0], rotate: [-12, -7, -12] }}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      className="pointer-events-none absolute -bottom-8 left-6 text-paper/[0.06]"
    >
      <PawPrint className="h-64 w-64" strokeWidth={0.8} />
    </motion.div>
  </>
);

const MainContent = ({ banner }) => (
  <div className="relative z-10 flex max-w-md flex-col">
    {banner.eyebrow && (
      <motion.p
        variants={rise}
        className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-sage/30 bg-sage/10 px-3.5 py-1.5 text-xs text-sage backdrop-blur"
      >
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sage" />
        {banner.eyebrow}
      </motion.p>
    )}

    <motion.h1
      variants={rise}
      className="font-display text-3xl font-bold leading-[1.35] text-paper sm:text-4xl lg:text-5xl"
    >
      {banner.title}
    </motion.h1>

    {banner.subtitle && (
      <motion.p variants={rise} className="mt-5 max-w-sm text-sm leading-7 text-paper/70 sm:text-base sm:leading-8">
        {banner.subtitle}
      </motion.p>
    )}

    {banner.ctaText && banner.ctaLink && (
      <motion.div variants={rise} className="mt-8">
        <SmartLink
          to={banner.ctaLink}
          className="group/cta inline-flex w-fit items-center gap-3 rounded-full bg-bronze py-2 pl-2 pr-7 text-sm font-medium text-ink transition-opacity hover:opacity-90"
        >
          {banner.ctaText}
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-bronze transition-transform duration-300 group-hover/cta:-translate-x-1">
            <ArrowLeft className="h-4 w-4" />
          </span>
        </SmartLink>
      </motion.div>
    )}
  </div>
);

// تایل بلند و مربعی: عکس تمام‌قاب + برچسب + دکمه‌ی فلش
const ImageContent = ({ banner, large }) => {
  const image = getImageUrl(banner.image);
  const mobileImage = getImageUrl(banner.imageMobile);
  const focal = banner.focalPoint ?? { x: 50, y: 50 };

  return (
    <SmartLink to={banner.ctaLink} className="absolute inset-0 block">
      {image || mobileImage ? (
        <picture className="contents">
          {mobileImage && <source media="(max-width: 1023px)" srcSet={mobileImage} />}
          <img
            src={image || mobileImage}
            alt=""
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover/tile:scale-[1.06]"
            style={{ objectPosition: `${focal.x}% ${focal.y}%` }}
          />
        </picture>
      ) : (
        <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-bronze/15 via-well to-sage/10 text-paper/10">
          <PawPrint className={large ? "h-28 w-28" : "h-20 w-20"} strokeWidth={1} />
        </span>
      )}

      {/* تیرگی قابل تنظیم از پنل + گرادینت پایین برای خوانایی برچسب */}
      <div className="absolute inset-0 bg-ink" style={{ opacity: (banner.overlay ?? 20) / 100 }} />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 lg:p-5">
        <span className={`font-display font-bold text-paper ${large ? "text-xl" : "text-base"}`}>{banner.title}</span>
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper/10 text-paper backdrop-blur transition-colors duration-300 group-hover/tile:bg-bronze group-hover/tile:text-ink"
        >
          <ArrowUpLeft className="h-4 w-4" />
        </span>
      </div>
    </SmartLink>
  );
};

// تایل کوچیک: آیکون داخل قاب برنزی + متن
const InfoContent = ({ banner }) => {
  const Icon = BANNER_ICON_MAP[banner.icon] ?? PawPrint;
  const className =
    "absolute inset-0 flex items-center gap-4 px-5 py-4 lg:flex-col lg:items-start lg:justify-between lg:p-5";

  return (
    <SmartLink to={banner.ctaLink} className={className}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-bronze/15 text-bronze ring-1 ring-bronze/20">
        <Icon className="h-5 w-5" strokeWidth={1.6} />
      </span>
      <p className="text-sm leading-6 text-paper/80">{banner.title}</p>
    </SmartLink>
  );
};

// showOnMobile: به‌صورت پیش‌فرض روی همه‌ی اندازه‌ها دیده میشه.
// اگه توی Home یه هیرو جدا برای موبایل داری، <BentoHero showOnMobile={false} /> بزار تا دوتا نشه.
const BentoHero = ({ showOnMobile = true }) => {
  const { data, isPending } = useBanners();
  const reduce = useReducedMotion();

  // برای هر تایل، اولین بنر (کمترین order) برنده است
  const bySlot = useMemo(() => {
    const map = {};
    for (const banner of data ?? []) {
      if (!map[banner.slot]) map[banner.slot] = banner;
    }
    return map;
  }, [data]);

  const pick = (slot) => bySlot[slot] ?? FALLBACKS[slot];
  const main = pick("main");

  return (
    <motion.section
      variants={container}
      initial={reduce ? false : "hidden"}
      animate="show"
      className={`relative overflow-hidden border-b border-line bg-card ${showOnMobile ? "block" : "hidden lg:block"}`}
    >
      {/* هاله‌ی نرم بالای هیرو */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-bronze/[0.07] to-transparent" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 py-6 sm:gap-4 sm:px-6 lg:h-[560px] lg:grid-cols-4 lg:grid-rows-2 lg:px-8 lg:py-10">
        {/* تایل اصلی: عکس پس‌زمینه (اختیاری)، تیتر و CTA */}
        <SpotTile className="col-span-2 min-h-[24rem] bg-ink lg:row-span-2 lg:min-h-0">
          {isPending ? (
            <Skeleton />
          ) : (
            <>
              {hasBannerImage(main) ? <MainBackground banner={main} /> : <MainDecor reduce={reduce} />}
              <div className="relative z-10 flex h-full flex-col justify-end p-6 sm:p-10 lg:justify-center lg:p-12">
                <MainContent banner={main} />
              </div>
            </>
          )}
        </SpotTile>

        {/* تایل بلند */}
        <SpotTile className="min-h-[14rem] bg-well lg:row-span-2 lg:min-h-0">
          {isPending ? <Skeleton /> : <ImageContent banner={pick("tall")} large />}
        </SpotTile>

        {/* تایل مربعی */}
        <SpotTile className="min-h-[14rem] bg-well lg:min-h-0">
          {isPending ? <Skeleton /> : <ImageContent banner={pick("square")} />}
        </SpotTile>

        {/* تایل کوچیک */}
        <SpotTile className="col-span-2 min-h-[6rem] bg-ink lg:col-span-1 lg:min-h-0">
          {!isPending && <InfoContent banner={pick("info")} />}
        </SpotTile>
      </div>
    </motion.section>
  );
};

export default BentoHero;