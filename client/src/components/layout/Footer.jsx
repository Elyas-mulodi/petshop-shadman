import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUp, Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import Logo from "../common/Logo";
import { navLinks } from "../../utils/navLinks";

// ✏️ اطلاعات خودت رو اینجا بنویس (فقط همین سه تا مقدار)
const DEVELOPER = {
  name: "Elyas Mulodi",
  telegram: "Elyas7vll", // بدون @
  phone: "09010708833",
};

const ease = [0.22, 1, 0.36, 1];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

const linkGroups = [
  {
    title: "فروشگاه",
    links: navLinks,
  },
  {
    title: "حساب کاربری",
    links: [
      { label: "ورود", to: "/login" },
      { label: "ثبت‌نام", to: "/register" },
      { label: "سفارش‌های من", to: "/my-orders" },
    ],
  },
];

// TODO: اطلاعات واقعی فروشگاه رو اینجا جایگزین کن
// tone: رنگ آیکون (bronze یا sage) برای جذابیت بیشتر
const contactInfo = [
  { label: "آدرس", value: "آدرس فروشگاه اینجا درج می‌شود", icon: MapPin, tone: "bronze" },
  { label: "تلفن", value: "021-XXXXXXXX", ltr: true, icon: Phone, tone: "sage" },
  { label: "ایمیل", value: "info@example.com", ltr: true, icon: Mail, tone: "bronze" },
  { label: "ساعات کاری", value: "ساعات کاری اینجا درج می‌شود", icon: Clock, tone: "sage" },
];

const TONES = {
  bronze: "bg-bronze/15 text-bronze ring-bronze/25",
  sage: "bg-sage/15 text-sage ring-sage/25",
};

const Footer = () => {
  const reduce = useReducedMotion();

  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-card via-card to-ink">
      {/* خط رنگی بالای فوتر */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-bronze to-transparent" />
      <div aria-hidden className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-bronze/[0.08] to-transparent" />

      {/* هاله‌های رنگی نرم */}
      <div aria-hidden className="pointer-events-none absolute -right-20 top-10 h-64 w-64 rounded-full bg-bronze/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -left-20 bottom-10 h-64 w-64 rounded-full bg-sage/15 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* برند */}
        <div className="flex flex-col gap-3 pb-6 pt-10 sm:flex-row sm:items-center sm:justify-between sm:pt-12">
          <Logo />
          <p className="font-display text-base font-bold text-paper sm:text-lg">
            فروشگاه تخصصی <span className="text-bronze">لوازم و غذای</span> حیوانات خانگی
          </p>
        </div>

        <motion.div
          variants={container}
          initial={reduce ? false : "hidden"}
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-2 gap-x-4 gap-y-8 border-t border-line/70 py-8 md:grid-cols-4 md:gap-x-8"
        >
          {linkGroups.map((group) => (
            <motion.div key={group.title} variants={item}>
              <p className="mb-3 flex items-center gap-2 font-display text-sm font-bold text-paper sm:text-base">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-bronze" />
                {group.title}
              </p>
              <ul className="flex flex-col gap-2.5">
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="inline-block text-sm text-muted transition-all duration-200 hover:-translate-x-1 hover:text-bronze"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}

          <motion.div variants={item} className="col-span-2">
            <p className="mb-3 flex items-center gap-2 font-display text-sm font-bold text-paper sm:text-base">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sage" />
              اطلاعات تماس
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {contactInfo.map(({ label, value, ltr, icon: Icon, tone }) => (
                <li key={label} className="flex items-center gap-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${TONES[tone]}`}>
                    <Icon className="h-4 w-4" strokeWidth={1.7} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted">{label}</p>
                    <p dir={ltr ? "ltr" : undefined} className={`truncate text-sm text-paper ${ltr ? "text-end" : ""}`}>
                      {value}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        {/* نوار پایین */}
        <div className="flex flex-col gap-3 border-t border-line/70 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-[11px] text-muted sm:text-start sm:text-xs">
            © {new Date().getFullYear()} پت شاپ شادمان. تمامی حقوق محفوظ است.
          </p>

          <div className="flex items-center justify-center gap-3 text-[11px] text-muted sm:justify-end sm:text-xs">
            <span>طراحی و توسعه:</span>
            <a
              href={`https://t.me/${DEVELOPER.telegram}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${DEVELOPER.name} در تلگرام`}
              className="inline-flex items-center gap-1 font-medium text-bronze transition-opacity hover:opacity-80"
            >
              <Send className="h-3 w-3" />
              {DEVELOPER.name}
            </a>
            <span aria-hidden className="h-3 w-px bg-line" />
            <a
              href={`tel:${DEVELOPER.phone.replace(/\s/g, "")}`}
              dir="ltr"
              className="transition-colors hover:text-bronze"
            >
              {DEVELOPER.phone}
            </a>
            <button
              type="button"
              aria-label="بازگشت به بالا"
              title="بازگشت به بالا"
              onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-bronze/60 hover:text-bronze"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;