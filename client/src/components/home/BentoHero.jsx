import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, PawPrint } from "lucide-react";

import { useBanners } from "../../features/banners/useBanners";
import { BANNER_ICON_MAP } from "../../utils/bannerIcons";
import { getImageUrl } from "../../utils/imageUrl";

const ease = [0.22, 1, 0.36, 1];

const tile = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const FALLBACKS = {
  main: {
    eyebrow: "پت شاپ شادمان",
    title: "هر آنچه همراه چهارپای شما نیاز دارد",
    subtitle: "غذا، اکسسوری و لوازم بهداشتی برای سگ، گربه و دیگر حیوانات خانگی.",
    ctaText: "مشاهده محصولات",
    ctaLink: "/products",
  },
  tall: { title: "برای سگ‌ها", ctaLink: "/products?category=dog", image: null, overlay: 0 },
  square: { title: "برای گربه‌ها", ctaLink: "/products?category=cat", image: null, overlay: 0 },
  info: { icon: "truck", title: "ارسال رایگان بالای ۵۰۰ هزار تومان" },
};

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

const MainContent = ({ banner }) => (
  <>
    {banner.eyebrow && <p className="mb-4 text-sm text-sage">{banner.eyebrow}</p>}
    <h1 className="max-w-sm font-display text-4xl font-bold leading-[1.3] text-paper">{banner.title}</h1>
    {banner.subtitle && <p className="mt-5 max-w-xs text-sm leading-7 text-muted">{banner.subtitle}</p>}
    {banner.ctaText && banner.ctaLink && (
      <SmartLink
        to={banner.ctaLink}
        className="mt-8 inline-flex w-fit items-center gap-2 rounded-lg bg-bronze px-6 py-3 text-sm font-medium text-ink transition-opacity hover:opacity-90"
      >
        {banner.ctaText}
        <ArrowLeft className="h-4 w-4" />
      </SmartLink>
    )}
  </>
);

const ImageContent = ({ banner, large }) => {
  const image = getImageUrl(banner.image);
  const focal = banner.focalPoint ?? { x: 50, y: 50 };

  return (
    <SmartLink
      to={banner.ctaLink}
      className="group relative block h-full overflow-hidden rounded-xl border border-line bg-well"
    >
      {image && (
        <img
          src={image}
          alt=""
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          style={{ objectPosition: `${focal.x}% ${focal.y}%` }}
        />
      )}
      {/* تیرگی قابل تنظیم از پنل + گرادینت پایین برای خوانایی برچسب */}
      <div className="absolute inset-0 bg-ink" style={{ opacity: (banner.overlay ?? 20) / 100 }} />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent transition-opacity group-hover:opacity-80" />
      <span
        className={`absolute inset-x-0 bottom-0 text-paper ${
          large ? "p-5 font-display text-lg font-bold" : "p-4 text-sm font-medium"
        }`}
      >
        {banner.title}
      </span>
    </SmartLink>
  );
};

const InfoContent = ({ banner }) => {
  const Icon = BANNER_ICON_MAP[banner.icon] ?? PawPrint;
  const className = "flex h-full flex-col justify-center gap-2 px-5";
  const body = (
    <>
      <Icon className="h-5 w-5 text-bronze" strokeWidth={1.6} />
      <p className="text-xs leading-5 text-muted">{banner.title}</p>
    </>
  );

  return banner.ctaLink ? (
    <SmartLink to={banner.ctaLink} className={`${className} transition-colors hover:bg-well/40`}>
      {body}
    </SmartLink>
  ) : (
    <div className={className}>{body}</div>
  );
};

const Skeleton = () => <div className="h-full w-full animate-pulse rounded-xl bg-well" />;

const BentoHero = () => {
  const { data, isPending } = useBanners();

  // برای هر تایل، اولین بنر (کمترین order) برنده است
  const bySlot = useMemo(() => {
    const map = {};
    for (const banner of data ?? []) {
      if (!map[banner.slot]) map[banner.slot] = banner;
    }
    return map;
  }, [data]);

  const pick = (slot) => bySlot[slot] ?? FALLBACKS[slot];

  return (
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
      className="hidden border-b border-line bg-card lg:block"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-4 grid-rows-2 gap-4 px-8 py-10" style={{ height: 520 }}>
        {/* تایل اصلی: تیتر و CTA */}
        <motion.div
          variants={tile}
          className="relative col-span-2 row-span-2 flex flex-col justify-center overflow-hidden rounded-xl border border-line bg-ink px-10"
        >
          {!isPending && <MainContent banner={pick("main")} />}
        </motion.div>

        {/* تایل بلند */}
        <motion.div variants={tile} className="col-span-1 row-span-2">
          {isPending ? <Skeleton /> : <ImageContent banner={pick("tall")} large />}
        </motion.div>

        {/* تایل مربعی */}
        <motion.div variants={tile} className="col-span-1 row-span-1">
          {isPending ? <Skeleton /> : <ImageContent banner={pick("square")} />}
        </motion.div>

        {/* تایل کوچیک */}
        <motion.div
          variants={tile}
          className="col-span-1 row-span-1 overflow-hidden rounded-xl border border-line bg-ink"
        >
          {!isPending && <InfoContent banner={pick("info")} />}
        </motion.div>
      </div>
    </motion.section>
  );
};

export default BentoHero;