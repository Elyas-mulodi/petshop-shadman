import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowUp } from "lucide-react";
import Logo from "../common/Logo";
import { navLinks } from "../../utils/navLinks";

const ease = [0.22, 1, 0.36, 1];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
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
const contactInfo = [
  { label: "آدرس", value: "آدرس فروشگاه اینجا درج می‌شود" },
  { label: "تلفن", value: "021-XXXXXXXX", ltr: true },
  { label: "ایمیل", value: "info@example.com", ltr: true },
  { label: "ساعات کاری", value: "ساعات کاری اینجا درج می‌شود" },
];

const cellClass =
  "border-b border-line py-8 md:border-b-0 md:border-s md:px-8 md:first:border-s-0 md:first:ps-0";

const Footer = () => {
  return (
    <footer className="mt-20 border-t border-line bg-card">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-col gap-6 border-b border-line py-10 md:flex-row md:items-end md:justify-between">
          <Logo />
          <p className="max-w-md font-display text-2xl font-bold leading-relaxed text-paper">
            فروشگاه تخصصی <span className="text-bronze">لوازم و غذای</span> حیوانات خانگی
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4"
        >
          {linkGroups.map((group) => (
            <motion.div key={group.title} variants={item} className={cellClass}>
              <p className="mb-4 font-display text-base font-bold text-paper">{group.title}</p>
              <ul className="flex flex-col gap-3">
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

          <motion.div variants={item} className={`${cellClass} md:col-span-2`}>
            <p className="mb-2 font-display text-base font-bold text-paper">اطلاعات تماس</p>
            <dl>
              {contactInfo.map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-4 border-b border-line py-3 last:border-b-0"
                >
                  <dt className="text-xs text-muted">{row.label}</dt>
                  <dd dir={row.ltr ? "ltr" : undefined} className="text-sm text-paper">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </motion.div>
        </motion.div>

        <div className="flex items-center justify-between border-t border-line py-5">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} پت شاپ شادمان. تمامی حقوق محفوظ است.
          </p>

          <motion.button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 text-xs text-muted transition-colors hover:text-bronze"
          >
            بازگشت به بالا
            <ArrowUp className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;