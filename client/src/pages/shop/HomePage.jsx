import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Truck, ShieldCheck, Sparkles } from "lucide-react";
import Section from "../../components/home/Section";
import BentoHero from "../../components/home/BentoHero";
import ProductCard from "../../components/common/ProductCard";
import Skeleton from "../../components/common/Skeleton";
import ErrorState from "../../components/common/ErrorState";
import { CarouselGrid, CarouselItem } from "../../components/common/CarouselGrid";
import useCategoryTree from "../../features/categories/useCategoryTree";
import { getNewProducts, getDiscountedProducts } from "../../features/products/productsApi";
import { getImageUrl } from "../../utils/imageUrl";

const ease = [0.22, 1, 0.36, 1];

const perks = [
  { icon: Truck, text: "ارسال سریع به سراسر کشور" },
  { icon: ShieldCheck, text: "ضمانت اصالت کالا" },
  { icon: Sparkles, text: "مشاوره رایگان انتخاب محصول" },
];

const useProductList = (fetcher, errorMessage) => {
  const [state, setState] = useState({ products: [], loading: true, error: null });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));

    fetcher()
      .then((res) => active && setState({ products: res.data.data, loading: false, error: null }))
      .catch(() => active && setState({ products: [], loading: false, error: errorMessage }));

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  return { ...state, retry };
};

const MobileHero = () => (
  <section className="relative lg:hidden">
    <div className="relative aspect-[3/4] w-full overflow-hidden bg-well sm:aspect-[16/9]">
      {/* TODO: عکس واقعی هرو جایگزین این پس‌زمینه بشه */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/10" />
      <div className="absolute inset-x-0 bottom-0 p-5 pb-8 sm:p-8">
        <p className="mb-2 text-xs text-sage">پت شاپ شادمان</p>
        <h1 className="max-w-xs font-display text-3xl font-bold leading-snug text-paper sm:max-w-sm sm:text-4xl">
          هر آنچه همراه چهارپای شما نیاز دارد
        </h1>
        <Link
          to="/products"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-bronze px-5 py-2.5 text-sm font-medium text-ink"
        >
          مشاهده محصولات
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
    </div>
  </section>
);

const PerksRow = () => (
  <div className="border-b border-line">
    <div className="flex gap-2 overflow-x-auto px-4 py-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-3 lg:hidden [&::-webkit-scrollbar]:hidden">
      {perks.map(({ icon: Icon, text }) => (
        <div
          key={text}
          className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-card px-3.5 py-2"
        >
          <Icon className="h-4 w-4 shrink-0 text-bronze" strokeWidth={1.6} />
          <span className="whitespace-nowrap text-xs text-muted">{text}</span>
        </div>
      ))}
    </div>

    <div className="mx-auto hidden max-w-7xl grid-cols-3 divide-x divide-x-reverse divide-line px-8 lg:grid">
      {perks.map(({ icon: Icon, text }) => (
        <div key={text} className="flex items-center gap-3 py-4">
          <Icon className="h-5 w-5 shrink-0 text-bronze" strokeWidth={1.6} />
          <span className="text-sm text-muted">{text}</span>
        </div>
      ))}
    </div>
  </div>
);

const CategoryTile = ({ cat }) => {
  const image = getImageUrl(cat.image);
  return (
    <Link
      to={`/products?category=${cat._id}`}
      className="group relative block aspect-square overflow-hidden rounded-lg border border-line bg-well"
    >
      {image && (
        <img
          src={image}
          alt={cat.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      )}
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 to-transparent p-3 text-sm font-medium text-paper">
        {cat.name}
      </span>
    </Link>
  );
};

const HomePage = () => {
  const { categories, loading: categoriesLoading, error: categoriesError, retry: retryCategories } =
    useCategoryTree();
  const newState = useProductList(getNewProducts, "دریافت محصولات جدید با خطا مواجه شد");
  const discountedState = useProductList(getDiscountedProducts, "دریافت تخفیف‌ها با خطا مواجه شد");

  return (
    <div>
      <MobileHero />
      <BentoHero />
      <PerksRow />

      {/* دسته‌های پیشنهادی */}
      <Section title="دسته‌بندی‌ها" viewAllTo="/categories">
        {categoriesLoading ? (
          <CarouselGrid>
            {Array.from({ length: 4 }).map((_, i) => (
              <CarouselItem key={i}>
                <Skeleton className="aspect-square" />
              </CarouselItem>
            ))}
          </CarouselGrid>
        ) : categoriesError ? (
          <ErrorState message={categoriesError} onRetry={retryCategories} />
        ) : categories.length === 0 ? (
          <p className="px-4 text-sm text-muted lg:px-0">هنوز دسته‌بندی‌ای ثبت نشده است.</p>
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
      <Section title="محصولات جدید" subtitle="تازه‌ترین‌ها در فروشگاه" viewAllTo="/products?sort=newest">
        {newState.loading ? (
          <CarouselGrid>
            {Array.from({ length: 4 }).map((_, i) => (
              <CarouselItem key={i} wide>
                <Skeleton className="aspect-[3/4.2]" />
              </CarouselItem>
            ))}
          </CarouselGrid>
        ) : newState.error ? (
          <ErrorState message={newState.error} onRetry={newState.retry} />
        ) : newState.products.length === 0 ? (
          <p className="px-4 text-sm text-muted lg:px-0">در حال حاضر محصول جدیدی ثبت نشده است.</p>
        ) : (
          <CarouselGrid>
            {newState.products.slice(0, 8).map((p) => (
              <CarouselItem key={p._id} wide>
                <ProductCard product={p} />
              </CarouselItem>
            ))}
          </CarouselGrid>
        )}
      </Section>

      {/* تخفیف‌دارها */}
      <Section title="تخفیف‌های ویژه" subtitle="پیشنهادهای محدود" viewAllTo="/discounts">
        {discountedState.loading ? (
          <CarouselGrid>
            {Array.from({ length: 4 }).map((_, i) => (
              <CarouselItem key={i} wide>
                <Skeleton className="aspect-[3/4.2]" />
              </CarouselItem>
            ))}
          </CarouselGrid>
        ) : discountedState.error ? (
          <ErrorState message={discountedState.error} onRetry={discountedState.retry} />
        ) : discountedState.products.length === 0 ? (
          <p className="px-4 text-sm text-muted lg:px-0">در حال حاضر تخفیف فعالی وجود ندارد.</p>
        ) : (
          <CarouselGrid>
            {discountedState.products.slice(0, 8).map((p) => (
              <CarouselItem key={p._id} wide>
                <ProductCard product={p} />
              </CarouselItem>
            ))}
          </CarouselGrid>
        )}
      </Section>
    </div>
  );
};

export default HomePage;