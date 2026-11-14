import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpLeft, PawPrint } from "lucide-react";
import useCategoryTree from "../../features/categories/useCategoryTree";
import { getImageUrl } from "../../utils/imageUrl";
import { toPersianDigits } from "../../utils/authHelpers";

const ease = [0.22, 1, 0.36, 1];

const grid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const card = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

// بیشتر از این تعداد زیردسته توی کارت نشون داده نمیشه؛ بقیه با «بیشتر» توی صفحه‌ی خود دسته‌ان
const MAX_CHILDREN = 6;

const chipClass =
  "rounded-full border border-line bg-ink/40 px-3 py-1 text-xs text-muted transition-colors hover:border-bronze/60 hover:text-bronze";

const CategoryCard = ({ cat }) => {
  const image = getImageUrl(cat.image);
  const children = cat.children ?? [];
  const shown = children.slice(0, MAX_CHILDREN);
  const rest = children.length - shown.length;

  return (
    <motion.article
      variants={card}
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-card transition-all duration-300 hover:border-bronze/50 md:hover:-translate-y-0.5 md:hover:shadow-lg md:hover:shadow-black/20"
    >
      {/* تصویر با اسم روی آن؛ کل ناحیه لینکه */}
      <Link
        to={`/products?category=${cat._id}`}
        className="relative block aspect-[16/10] overflow-hidden bg-well focus-visible:outline-none sm:aspect-[4/3]"
      >
        {image ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 ease-out md:group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full items-center justify-center bg-gradient-to-br from-bronze/15 via-well to-sage/10">
            <PawPrint className="h-14 w-14 text-paper/10" strokeWidth={1} />
          </span>
        )}

        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-transparent" />

        <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-5">
          <span className="font-display text-xl font-bold leading-tight text-paper sm:text-2xl">{cat.name}</span>
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper/10 text-paper backdrop-blur transition-colors duration-300 group-hover:bg-bronze group-hover:text-ink"
          >
            <ArrowUpLeft className="h-4 w-4" />
          </span>
        </span>
      </Link>

      {/* زیردسته‌ها به شکل چیپ؛ کارت‌های یک ردیف هم‌قد می‌مونن */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {children.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {shown.map((child) => (
              <li key={child._id}>
                <Link to={`/products?category=${child._id}`} className={`block ${chipClass}`}>
                  {child.name}
                </Link>
              </li>
            ))}
            {rest > 0 && (
              <li>
                <Link
                  to={`/products?category=${cat._id}`}
                  className="block rounded-full bg-bronze/15 px-3 py-1 text-xs font-medium text-bronze transition-colors hover:bg-bronze/25"
                >
                  {toPersianDigits(rest)}+ بیشتر
                </Link>
              </li>
            )}
          </ul>
        ) : (
          <Link
            to={`/products?category=${cat._id}`}
            className="text-xs text-muted transition-colors hover:text-bronze"
          >
            مشاهده‌ی محصولات این دسته
          </Link>
        )}
      </div>
    </motion.article>
  );
};

const CategoriesPage = () => {
  const { categories, loading } = useCategoryTree();
  const reduce = useReducedMotion();

  return (
    <div>
      {/* سربرگ رنگی، هماهنگ با صفحه‌ی محصولات */}
      <header className="relative overflow-hidden border-b border-line bg-gradient-to-b from-card to-ink">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-bronze/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-sage/10 blur-3xl" />
        <PawPrint
          aria-hidden
          className="pointer-events-none absolute -bottom-6 left-4 h-32 w-32 -rotate-12 text-paper/[0.05] sm:left-16 sm:h-44 sm:w-44"
          strokeWidth={0.8}
        />

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-9 lg:px-8"
        >
          <nav aria-label="مسیر" className="mb-2 flex items-center gap-1.5 text-xs text-muted">
            <Link to="/" className="transition-colors hover:text-bronze">
              خانه
            </Link>
            <span aria-hidden>/</span>
            <span className="text-paper/70">دسته‌بندی‌ها</span>
          </nav>

          <h1 className="font-display text-2xl font-bold leading-tight text-paper sm:text-3xl lg:text-4xl">دسته‌بندی‌ها</h1>

          {!loading && categories.length > 0 && (
            <p className="mt-2 text-xs text-muted sm:text-sm">
              <span className="text-bronze">{toPersianDigits(categories.length)} دسته</span> برای انتخاب
            </p>
          )}
        </motion.div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-card" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-2xl border border-line bg-card py-16 text-center text-sm text-muted">
            هنوز دسته‌بندی‌ای ثبت نشده است.
          </div>
        ) : (
          <motion.div
            variants={grid}
            initial={reduce ? false : "hidden"}
            animate="show"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
          >
            {categories.map((cat) => (
              <CategoryCard key={cat._id} cat={cat} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;