import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, PawPrint, Tag } from "lucide-react";
import useCategoryTree from "../../features/categories/useCategoryTree";
import ErrorState from "../common/ErrorState";
import { toPersianDigits } from "../../utils/authHelpers";

const ease = [0.22, 1, 0.36, 1];

const grid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};

const column = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease } },
};

// بیشتر از این تعداد زیردسته توی هر ستون نشون داده نمیشه
const MAX_CHILDREN = 6;

// رنگ آیکون سرستون: یکی در میان برنزی و سبز
const TONES = [
  "bg-bronze/15 text-bronze ring-bronze/25",
  "bg-sage/15 text-sage ring-sage/25",
];

const MegaMenu = ({ onNavigate }) => {
  const { categories, loading, error, retry } = useCategoryTree();

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease }}
      className="absolute inset-x-0 top-full overflow-hidden border-b border-line bg-gradient-to-b from-card to-ink shadow-2xl shadow-black/40"
    >
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-bronze/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-sage/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* اگه دسته‌ها زیاد بودن، منو از صفحه بلندتر نشه */}
        <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
          {loading ? (
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl bg-well" />
              ))}
            </div>
          ) : error ? (
            <ErrorState compact message={error} onRetry={retry} />
          ) : categories.length === 0 ? (
            <p className="text-sm text-muted">هنوز دسته‌بندی‌ای ثبت نشده است.</p>
          ) : (
            <motion.div
              variants={grid}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 gap-x-6 gap-y-7 lg:grid-cols-4 lg:gap-x-8"
            >
              {categories.map((cat, i) => {
                const children = cat.children ?? [];
                const shown = children.slice(0, MAX_CHILDREN);
                const rest = children.length - shown.length;

                return (
                  <motion.div key={cat._id} variants={column} className="min-w-0">
                    <Link
                      to={`/products?category=${cat._id}`}
                      onClick={onNavigate}
                      className="group mb-3 flex items-center gap-2.5"
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 transition-transform duration-300 group-hover:-rotate-6 ${TONES[i % TONES.length]}`}
                      >
                        <PawPrint className="h-4 w-4" strokeWidth={1.7} />
                      </span>
                      <span className="truncate font-display text-base font-bold text-paper transition-colors group-hover:text-bronze">
                        {cat.name}
                      </span>
                    </Link>

                    {children.length > 0 && (
                      <ul className="flex flex-col gap-2 border-t border-line pt-3">
                        {shown.map((child) => (
                          <li key={child._id}>
                            <Link
                              to={`/products?category=${child._id}`}
                              onClick={onNavigate}
                              className="inline-block max-w-full truncate text-sm text-muted transition-all duration-200 hover:-translate-x-1 hover:text-bronze"
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                        {rest > 0 && (
                          <li>
                            <Link
                              to={`/products?category=${cat._id}`}
                              onClick={onNavigate}
                              className="inline-block text-xs text-bronze transition-opacity hover:opacity-80"
                            >
                              {toPersianDigits(rest)}+ بیشتر
                            </Link>
                          </li>
                        )}
                      </ul>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <Link
            to="/categories"
            onClick={onNavigate}
            className="group inline-flex items-center gap-2 text-sm text-bronze"
          >
            مشاهده همه دسته‌بندی‌ها
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
          </Link>

          <Link
            to="/discounts"
            onClick={onNavigate}
            className="inline-flex items-center gap-1.5 rounded-full border border-bronze/40 bg-bronze/10 px-3.5 py-1.5 text-xs text-bronze transition-colors hover:bg-bronze/20"
          >
            <Tag className="h-3.5 w-3.5" />
            تخفیف‌های ویژه
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default MegaMenu;