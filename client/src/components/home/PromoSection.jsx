import { useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { ArrowLeft, ChevronDown, PawPrint } from "lucide-react";

import { useBanners } from "../../features/banners/useBanners";
import { BANNER_ICON_MAP } from "../../utils/bannerIcons";
import { getImageUrl } from "../../utils/imageUrl";

// اگه هنوز بنر میان‌صفحه‌ای ساخته نشده، این محتوا نمایش داده میشه (بدون عکس، با ردپا)
const FALLBACK = {
  _id: "fallback",
  eyebrow: "همراه همیشگی",
  title: "هر روز، کنار چهارپای شما",
  subtitle: "از غذای باکیفیت تا لوازم بهداشتی؛ هر چیزی که برای سلامت و شادی حیوان خانگی‌تان لازم است.",
  ctaText: "مشاهده محصولات",
  ctaLink: "/products",
  badge: "با عشق انتخاب شده",
  icon: "heart",
  image: null,
  overlay: 0,
};

// قاب قوسی باریک -> کارت عریض (ساختار هر دو رشته یکسانه تا درون‌یابی بشن)
const START_CLIP = "inset(9% 22% 9% 22% round 600px 600px 0px 0px)";
const END_CLIP = "inset(0% 0% 0% 0% round 28px 28px 28px 28px)";

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

// هر کلمه با اسکرول از کم‌رنگ به پررنگ میاد
const Word = ({ word, progress, from, to }) => {
  const opacity = useTransform(progress, [from, to], [0.12, 1]);
  const y = useTransform(progress, [from, to], [18, 0]);

  return (
    <motion.span aria-hidden style={{ opacity, y }} className="inline-block">
      {word}
    </motion.span>
  );
};

const CtaButton = ({ banner }) => (
  <SmartLink
    to={banner.ctaLink}
    className="group inline-flex w-fit items-center gap-3 rounded-full bg-bronze py-2 pl-2 pr-7 text-sm font-medium text-ink transition-opacity hover:opacity-90"
  >
    {banner.ctaText}
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-bronze transition-transform duration-300 group-hover:-translate-x-1">
      <ArrowLeft className="h-4 w-4" />
    </span>
  </SmartLink>
);

// نسخه‌ی ثابت برای کاربرانی که حرکت کم کردن
const StaticPromo = ({ banner }) => {
  const image = getImageUrl(banner.image);
  const focal = banner.focalPoint ?? { x: 50, y: 50 };

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <div className="relative flex min-h-[28rem] items-end overflow-hidden rounded-3xl border border-line bg-ink">
        {image ? (
          <img
            src={image}
            alt={banner.imageAlt || banner.title}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: `${focal.x}% ${focal.y}%` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-bronze/25 via-ink to-sage/20" />
        )}
        <div className="absolute inset-0 bg-ink" style={{ opacity: (banner.overlay ?? 0) / 100 }} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/10" />

        <div className="relative max-w-2xl p-6 sm:p-10">
          {banner.eyebrow && <p className="mb-3 text-sm text-sage">{banner.eyebrow}</p>}
          <h2 className="font-display text-3xl font-bold leading-[1.4] text-paper sm:text-5xl">{banner.title}</h2>
          {banner.subtitle && <p className="mt-4 max-w-md text-sm leading-8 text-muted">{banner.subtitle}</p>}
          {banner.ctaText && banner.ctaLink && (
            <div className="mt-7">
              <CtaButton banner={banner} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const PromoSection = ({ fallback = true }) => {
  const reduce = useReducedMotion();
  const { data, isPending } = useBanners();
  const ref = useRef(null);

  // اولین بنر promo (کمترین order) نمایش داده میشه
  const banner = useMemo(
    () => (data ?? []).find((b) => b.slot === "promo") ?? (fallback ? FALLBACK : null),
    [data, fallback],
  );

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 110, damping: 30, mass: 0.35 });

  const clipPath = useTransform(p, [0, 0.55], [START_CLIP, END_CLIP]);
  const imageScale = useTransform(p, [0, 0.6], [1.35, 1]);
  const imageY = useTransform(p, [0, 1], ["-4%", "4%"]);
  const glowOpacity = useTransform(p, [0, 0.5], [1, 0]);
  const hintOpacity = useTransform(p, [0, 0.12], [1, 0]);
  const topEyebrowOpacity = useTransform(p, [0, 0.2], [1, 0]);
  const chipLeft = useTransform(p, [0, 0.6], ["30%", "3%"]);
  const chipTop = useTransform(p, [0, 0.6], ["24%", "6%"]);
  const shadeOpacity = useTransform(p, [0.35, 0.55], [0, 1]);
  const subOpacity = useTransform(p, [0.8, 0.92], [0, 1]);
  const subY = useTransform(p, [0.8, 0.92], [16, 0]);
  const ctaOpacity = useTransform(p, [0.86, 0.98], [0, 1]);
  const ctaY = useTransform(p, [0.86, 0.98], [16, 0]);
  // دکمه تا وقتی دیده نمیشه، قابل کلیک نباشه
  const ctaEvents = useTransform(p, (v) => (v > 0.88 ? "auto" : "none"));

  if (isPending) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="h-[28rem] animate-pulse rounded-3xl bg-well/40" />
      </section>
    );
  }

  if (!banner) return null;
  if (reduce) return <StaticPromo banner={banner} />;

  const image = getImageUrl(banner.image);
  const focal = banner.focalPoint ?? { x: 50, y: 50 };
  const BadgeIcon = BANNER_ICON_MAP[banner.icon] ?? PawPrint;
  const words = banner.title.split(" ");

  return (
    // ارتفاع بلند = مسافت اسکرول؛ داخلش صحنه sticky می‌مونه
    <section ref={ref} className="mx-auto h-[210vh] max-w-7xl px-4 sm:px-6 lg:h-[240vh] lg:px-8">
      <div className="sticky top-20 h-[calc(100svh-6rem)] min-h-[30rem]">
        {/* نور برنزی پشت قاب */}
        <motion.div
          aria-hidden
          style={{ opacity: glowOpacity }}
          className="pointer-events-none absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-bronze/25 blur-3xl"
        />

        {/* متن کوچک بالای قاب، فقط اول */}
        {banner.eyebrow && (
          <motion.p
            style={{ opacity: topEyebrowOpacity }}
            className="absolute inset-x-0 top-0 z-10 flex items-center justify-center gap-3 text-sm text-sage"
          >
            <span aria-hidden className="h-px w-8 bg-sage/60" />
            {banner.eyebrow}
            <span aria-hidden className="h-px w-8 bg-sage/60" />
          </motion.p>
        )}

        {/* صحنه‌ی برش‌خورده: قاب قوسی -> کارت عریض */}
        <motion.div style={{ clipPath }} className="absolute inset-0 overflow-hidden bg-well">
          <motion.div style={{ scale: imageScale, y: imageY }} className="absolute -inset-[6%]">
            {image ? (
              <img
                src={image}
                alt={banner.imageAlt || banner.title}
                decoding="async"
                className="h-full w-full object-cover"
                style={{ objectPosition: `${focal.x}% ${focal.y}%` }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-bronze/25 via-ink to-sage/20">
                <PawPrint className="h-40 w-40 text-paper/10" strokeWidth={1} />
              </div>
            )}
          </motion.div>

          {image && <div className="absolute inset-0 bg-ink" style={{ opacity: (banner.overlay ?? 0) / 100 }} />}

          {/* سایه برای خوانایی متن؛ با باز شدن قاب میاد */}
          <motion.div aria-hidden style={{ opacity: shadeOpacity }} className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/10" />
            <div className="absolute inset-0 bg-gradient-to-l from-ink/70 via-transparent to-transparent" />
          </motion.div>

          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 lg:p-14">
            <div className="max-w-2xl">
              <h2
                aria-label={banner.title}
                className="flex flex-wrap gap-x-[0.28em] font-display text-3xl font-bold leading-[1.45] text-paper sm:text-5xl lg:text-6xl"
              >
                {words.map((word, i) => {
                  const from = 0.42 + (0.38 * i) / words.length;
                  return <Word key={i} word={word} progress={p} from={from} to={from + 0.1} />;
                })}
              </h2>

              {banner.subtitle && (
                <motion.p
                  style={{ opacity: subOpacity, y: subY }}
                  className="mt-5 max-w-md text-sm leading-8 text-paper/75"
                >
                  {banner.subtitle}
                </motion.p>
              )}

              {banner.ctaText && banner.ctaLink && (
                <motion.div style={{ opacity: ctaOpacity, y: ctaY, pointerEvents: ctaEvents }} className="mt-7">
                  <CtaButton banner={banner} />
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* چیپ شناور: از کنار قوس به گوشه‌ی کارت میره */}
        {banner.badge && (
          <motion.div
            style={{ left: chipLeft, top: chipTop }}
            initial={{ opacity: 0, scale: 0.7 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.4 }}
            className="absolute z-20 flex items-center gap-2.5 rounded-full border border-line bg-card/90 py-1.5 pl-4 pr-1.5 shadow-xl backdrop-blur"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-bronze text-ink">
              <BadgeIcon className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <span className="text-xs text-paper">{banner.badge}</span>
          </motion.div>
        )}

        {/* راهنمای اسکرول، فقط اول */}
        <motion.div
          style={{ opacity: hintOpacity }}
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center text-xs text-muted"
        >
          اسکرول کنید
          <ChevronDown className="h-4 w-4 animate-bounce" />
        </motion.div>
      </div>
    </section>
  );
};

export default PromoSection;