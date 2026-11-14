import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { PawPrint, SearchX, X } from "lucide-react";
import ProductCard from "../../components/common/ProductCard";
import Skeleton from "../../components/common/Skeleton";
import ErrorState from "../../components/common/ErrorState";
import FilterSidebar from "../../components/products/FilterSidebar";
import FilterChipsBar from "../../components/products/FilterChipsBar";
import SortDropdown from "../../components/products/SortDropdown";
import InfiniteSentinel from "../../components/products/InfiniteSentinel";
import useInfiniteProducts from "../../hooks/useInfiniteProducts";
import useCategoryTree from "../../features/categories/useCategoryTree";
import { collectDescendantIds, findCategoryById } from "../../utils/categoryHelpers";
import { toPersianDigits } from "../../utils/authHelpers";

const ease = [0.22, 1, 0.36, 1];

const emptyFilters = { category: "", brands: [], minPrice: "", maxPrice: "", inStock: false };

// یه گرید برای همه‌ی حالت‌ها: موبایل ۲ ستون فشرده، تبلت ۳، دسکتاپ بزرگ ۴
const GRID = "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4";

const ProductListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories } = useCategoryTree();
  const reduce = useReducedMotion();

  const uiFilters = {
    category: searchParams.get("category") || "",
    brands: searchParams.get("brands") ? searchParams.get("brands").split(",") : [],
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    inStock: searchParams.get("inStock") === "true",
  };
  const sort = searchParams.get("sort") || "newest";
  const search = searchParams.get("search") || "";

  const applyFilters = (next) => {
    const params = new URLSearchParams(searchParams);
    next.category ? params.set("category", next.category) : params.delete("category");
    next.brands.length ? params.set("brands", next.brands.join(",")) : params.delete("brands");
    next.minPrice ? params.set("minPrice", next.minPrice) : params.delete("minPrice");
    next.maxPrice ? params.set("maxPrice", next.maxPrice) : params.delete("maxPrice");
    next.inStock ? params.set("inStock", "true") : params.delete("inStock");
    setSearchParams(params);
  };

  const updateSort = (value) => {
    const params = new URLSearchParams(searchParams);
    params.set("sort", value);
    setSearchParams(params);
  };

  const clearSearch = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("search");
    setSearchParams(params);
  };

  // پاک کردن همه‌چیز (فیلترها + جستجو)، فقط مرتب‌سازی می‌مونه
  const clearAll = () => {
    const params = new URLSearchParams();
    if (searchParams.get("sort")) params.set("sort", searchParams.get("sort"));
    setSearchParams(params);
  };

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(uiFilters.category) ||
    uiFilters.brands.length > 0 ||
    Boolean(uiFilters.minPrice) ||
    Boolean(uiFilters.maxPrice) ||
    uiFilters.inStock;

  const selectedCategory = useMemo(
    () => (uiFilters.category && categories.length ? findCategoryById(categories, uiFilters.category) : null),
    [uiFilters.category, categories],
  );

  // دسته‌بندی انتخاب‌شده + همه زیردسته‌هاش، تا محصولات زیرمجموعه هم دیده بشن
  const categoryIds = useMemo(() => {
    if (!uiFilters.category || categories.length === 0) return "";
    const node = findCategoryById(categories, uiFilters.category);
    return node ? collectDescendantIds(node).join(",") : uiFilters.category;
  }, [uiFilters.category, categories]);

  const apiFilters = {
    category: categoryIds || undefined,
    brand: uiFilters.brands[0] || undefined, // بک‌اند فعلاً فقط یک برند قبول می‌کنه
    minPrice: uiFilters.minPrice || undefined,
    maxPrice: uiFilters.maxPrice || undefined,
    inStock: uiFilters.inStock ? "true" : undefined,
    sort,
    search: search || undefined,
  };

  const { products, loading, loadingMore, hasMore, error, loadMore } = useInfiniteProducts(apiFilters);

  const title = search ? `نتایج «${search}»` : selectedCategory?.name || "محصولات";
  const countLabel = `${toPersianDigits(products.length)}${hasMore ? "+" : ""} محصول`;

  return (
    <div>
      {/* سربرگ رنگی صفحه */}
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
            <span className="text-paper/70">محصولات</span>
          </nav>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="font-display text-2xl font-bold leading-tight text-paper sm:text-3xl lg:text-4xl">{title}</h1>

            {search && (
              <button
                type="button"
                onClick={clearSearch}
                className="inline-flex items-center gap-1 rounded-full border border-line bg-card px-2.5 py-1 text-xs text-muted transition-colors hover:border-bronze/60 hover:text-bronze"
              >
                پاک کردن جستجو
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {!loading && !error && (
            <p className="mt-2 text-xs text-muted sm:text-sm">
              <span className="text-bronze">{countLabel}</span>
              {hasActiveFilters ? " با فیلترهای انتخابی" : " برای چهارپای شما"}
            </p>
          )}
        </motion.div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
          {/* سایدبار دسکتاپ: هنگام اسکرول می‌چسبه */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-line bg-card/60 p-4">
              <FilterSidebar
                draft={uiFilters}
                onChange={applyFilters}
                onClear={() => applyFilters(emptyFilters)}
              />
            </div>
          </aside>

          <div className="min-w-0">
            {/* چیپ‌های فیلتر موبایل */}
            <div className="mb-3 lg:hidden">
              <FilterChipsBar
                draft={uiFilters}
                onChange={applyFilters}
                onClear={() => applyFilters(emptyFilters)}
              />
            </div>

            {/* نوار ابزار: تعداد و مرتب‌سازی */}
            <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-line bg-card/60 px-3 py-2 sm:mb-5 sm:px-4">
              <p className="text-xs text-muted sm:text-sm">
                {loading ? "در حال بارگذاری..." : error ? "" : countLabel}
              </p>
              <SortDropdown value={sort} onChange={updateSort} />
            </div>

            {loading ? (
              <div className={GRID}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[3/4.2] rounded-2xl" />
                ))}
              </div>
            ) : error ? (
              <ErrorState message={error} />
            ) : products.length === 0 ? (
              <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-card to-ink px-6 py-14 text-center sm:py-20">
                <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-bronze/15 blur-3xl" />
                <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-bronze/15 text-bronze ring-1 ring-bronze/25">
                  <SearchX className="h-6 w-6" strokeWidth={1.6} />
                </span>
                <p className="relative mt-4 font-display text-base font-bold text-paper sm:text-lg">
                  محصولی پیدا نشد
                </p>
                <p className="relative mt-1.5 text-sm text-muted">
                  {hasActiveFilters ? "فیلترها یا عبارت جستجو رو تغییر بده." : "هنوز محصولی ثبت نشده است."}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="relative mt-5 inline-flex items-center gap-2 rounded-full bg-bronze px-5 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90"
                  >
                    پاک کردن همه‌ی فیلترها
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className={GRID}>
                  {products.map((p, i) => (
                    <motion.div
                      key={p._id}
                      initial={reduce ? false : { opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, ease, delay: Math.min(i % 12, 8) * 0.03 }}
                      className="min-w-0"
                    >
                      <ProductCard product={p} />
                    </motion.div>
                  ))}
                </div>

                {loadingMore && (
                  <div className={`mt-3 sm:mt-4 ${GRID}`}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-[3/4.2] rounded-2xl" />
                    ))}
                  </div>
                )}

                <InfiniteSentinel onVisible={loadMore} disabled={!hasMore || loadingMore} />

                {!hasMore && !loadingMore && products.length > 8 && (
                  <p className="mt-8 flex items-center justify-center gap-2 text-xs text-muted">
                    <span aria-hidden className="h-px w-10 bg-line" />
                    همه‌ی محصولات نمایش داده شد
                    <span aria-hidden className="h-px w-10 bg-line" />
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductListPage;