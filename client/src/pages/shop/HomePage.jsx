import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpLeft, PawPrint, ShieldCheck, Sparkles, Truck } from "lucide-react";
import Section from "../../components/home/Section";
import BentoHero from "../../components/home/BentoHero";
import PromoSection from "../../components/home/PromoSection";
import ProductCard from "../../components/common/ProductCard";
import Skeleton from "../../components/common/Skeleton";
import ErrorState from "../../components/common/ErrorState";
import {
  CarouselGrid,
  CarouselItem,
} from "../../components/common/CarouselGrid";
import useCategoryTree from "../../features/categories/useCategoryTree";
import {
  getNewProducts,
  getDiscountedProducts,
} from "../../features/products/productsApi";
import { getImageUrl } from "../../utils/imageUrl";

const ease = [0.22, 1, 0.36, 1];

// tone: رنگ آیکون (bronze یا sage)
const perks = [
  { icon: Truck, title: "ارسال سریع", text: "به سراسر کشور", tone: "bronze" },
  { icon: ShieldCheck, title: "ضمانت اصالت", text: "اصل بودن کالا تضمین می‌شود", tone: "sage" },
  { icon: Sparkles, title: "مشاوره رایگان", text: "کمک در انتخاب محصول", tone: "bronze" },
];

const TONES = {
  bronze: {
    chip: "bg-bronze/15 text-bronze ring-bronze/25",
    glow: "from-bronze/[0.12]",
  },
  sage: {
    chip: "bg-sage/15 text-sage ring-sage/25",
    glow: "from-sage/[0.12]",
  },
};

const useProductList = (fetcher, errorMessage) => {
  const [state, setState] = useState({
    products: [],
    loading: true,
    error: null,
  });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));

    fetcher()
      .then(
        (res) =>
          active &&
          setState({ products: res.data.data, loading: false, error: null }),
      )
      .catch(
        () =>
          active &&
          setState({ products: [], loading: false, error: errorMessage }),
      );

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  return { ...state, retry };
};

// کارت‌های مزایا: موبایل = اسکرول افقی با snap، تبلت و بالاتر = سه ستون
const perksContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const perkItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

const PerksRow = () => {
  const reduce = useReducedMotion();

  return (
    <section aria-label="مزایای خرید" className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-8 lg:px-8">
      {/* همیشه سه ستون و بدون اسکرول؛ موبایل: کاشی کوچک (آیکون + تیتر)، از sm: آیکون کنار تیتر و توضیح */}
      <motion.ul
        variants={perksContainer}
        initial={reduce ? false : "hidden"}
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="grid grid-cols-3 gap-2 sm:gap-4"
      >
        {perks.map(({ icon: Icon, title, text, tone }) => (
          <motion.li
            key={title}
            variants={perkItem}
            className={`group relative flex min-w-0 flex-col items-center gap-1.5 overflow-hidden rounded-xl border border-line bg-gradient-to-br ${TONES[tone].glow} to-card px-1.5 py-2.5 text-center transition-colors duration-300 hover:border-bronze/50 sm:flex-row sm:gap-3.5 sm:rounded-2xl sm:p-4 sm:text-start lg:gap-4 lg:p-5`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105 sm:h-11 sm:w-11 sm:rounded-xl lg:h-12 lg:w-12 ${TONES[tone].chip}`}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" strokeWidth={1.6} />
            </span>

            <div className="min-w-0">
              <p className="font-display text-[11px] font-bold leading-4 text-paper sm:text-sm lg:text-base">{title}</p>
              <p className="mt-0.5 hidden text-xs leading-5 text-muted sm:block">{text}</p>
            </div>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
};

const CategoryTile = ({ cat }) => {
  const image = getImageUrl(cat.image);

  return (
    <Link
      to={`/products?category=${cat._id}`}
      className="group relative block aspect-square overflow-hidden rounded-2xl border border-line bg-well transition-colors duration-300 hover:border-bronze/50"
    >
      {image ? (
        <img
          src={image}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-bronze/15 via-well to-sage/10 text-paper/10">
          <PawPrint className="h-16 w-16" strokeWidth={1} />
        </span>
      )}

      <span className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />

      <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 sm:p-4">
        <span className="text-sm font-medium text-paper sm:text-base">{cat.name}</span>
        <span
          aria-hidden
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-paper/10 text-paper backdrop-blur transition-colors duration-300 group-hover:bg-bronze group-hover:text-ink sm:h-8 sm:w-8"
        >
          <ArrowUpLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </span>
      </span>
    </Link>
  );
};

// حالت‌های بارگذاری، خطا و خالی بودن لیست محصولات (برای جلوگیری از تکرار کد)
const ProductSection = ({ state, emptyText, ...sectionProps }) => (
  <Section {...sectionProps}>
    {state.loading ? (
      <CarouselGrid>
        {Array.from({ length: 4 }).map((_, i) => (
          <CarouselItem key={i} wide>
            <Skeleton className="aspect-[3/4.2]" />
          </CarouselItem>
        ))}
      </CarouselGrid>
    ) : state.error ? (
      <ErrorState message={state.error} onRetry={state.retry} />
    ) : state.products.length === 0 ? (
      <p className="px-4 text-sm text-muted lg:px-0">{emptyText}</p>
    ) : (
      <CarouselGrid>
        {state.products.slice(0, 8).map((p) => (
          <CarouselItem key={p._id} wide>
            <ProductCard product={p} />
          </CarouselItem>
        ))}
      </CarouselGrid>
    )}
  </Section>
);

const HomePage = () => {
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    retry: retryCategories,
  } = useCategoryTree();
  const newState = useProductList(
    getNewProducts,
    "دریافت محصولات جدید با خطا مواجه شد",
  );
  const discountedState = useProductList(
    getDiscountedProducts,
    "دریافت تخفیف‌ها با خطا مواجه شد",
  );

  return (
    <div>
      <BentoHero />
      <PerksRow />

      {/* دسته‌های پیشنهادی */}
      <Section title="دسته‌بندی‌ها" bannerKey="categories" viewAllTo="/categories">
        {categoriesLoading ? (
          <CarouselGrid>
            {Array.from({ length: 4 }).map((_, i) => (
              <CarouselItem key={i}>
                <Skeleton className="aspect-square rounded-2xl" />
              </CarouselItem>
            ))}
          </CarouselGrid>
        ) : categoriesError ? (
          <ErrorState message={categoriesError} onRetry={retryCategories} />
        ) : categories.length === 0 ? (
          <p className="px-4 text-sm text-muted lg:px-0">
            هنوز دسته‌بندی‌ای ثبت نشده است.
          </p>
        ) : (
          <CarouselGrid>
            {categories.slice(0, 8).map((cat) => (
              <CarouselItem key={cat._id}>
                <CategoryTile cat={cat} />
              </CarouselItem>
            ))}
          </CarouselGrid>
        )}
      </Section>

      {/* محصولات جدید */}
      <ProductSection
        state={newState}
        emptyText="در حال حاضر محصول جدیدی ثبت نشده است."
        bannerKey="latest"
        title="جدیدترین محصولات"
        subtitle="تازه‌ترین‌ها برای عزیزانتان"
        viewAllTo="/products"
      />

      {/* بنر میان‌صفحه: وسط صفحه، نه آخرش */}
      <PromoSection />

      {/* تخفیف‌دارها */}
      <ProductSection
        state={discountedState}
        emptyText="در حال حاضر تخفیف فعالی وجود ندارد."
        bannerKey="discounts"
        title="تخفیف‌های ویژه"
        subtitle="پیشنهادهای محدود"
        viewAllTo="/discounts"
      />
    </div>
  );
};

export default HomePage;