import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, PackageSearch, X } from "lucide-react";
import DiscountHero from "../../components/discounts/DiscountHero";
import EndingSoon from "../../components/discounts/EndingSoon";
import DiscountCard from "../../components/discounts/DiscountCard";
import PerksSection from "../../components/discounts/PerksSection";
import {
  SORTERS,
  endMs,
  inStock,
  isLive,
  maxSaving,
} from "../../components/discounts/dealMath";
import Skeleton from "../../components/common/Skeleton";
import ErrorState from "../../components/common/ErrorState";
import { useFetch } from "../../hooks/useFetch";
import { useNow } from "../../hooks/useNow";
import useCategoryTree from "../../features/categories/useCategoryTree";
import { getDiscountedProducts } from "../../features/products/productsApi";
import { toPersianDigits } from "../../utils/authHelpers";

const BANDS = [10, 20, 30, 40, 50];

const SORT_OPTIONS = [
  { id: "percent", label: "بیشترین تخفیف" },
  { id: "saving", label: "بیشترین صرفه‌جویی" },
  { id: "cheapest", label: "ارزان‌ترین" },
  { id: "ending", label: "زودترین پایان" },
];

const GRID = "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4";

const chip = (active) =>
  `inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors sm:px-3.5 ${
    active
      ? "border-bronze/60 bg-bronze/15 text-bronze"
      : "border-line bg-ink/30 text-muted hover:border-bronze/40 hover:text-paper"
  }`;

// موبایل: یک خط اسکرول افقی (کم‌جا)، از sm به بالا: چند خطی و بدون اسکرول
// -mx-3 امنه چون پنل فیلتر خودش p-3 داره
const ROW =
  "-mx-3 flex gap-2 overflow-x-auto px-3 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden";

const DiscountsPage = () => {
  const { data, loading, error, reload } = useFetch(() =>
    getDiscountedProducts().then((res) => res.data.data),
  );
  const { categories } = useCategoryTree();
  const now = useNow(30_000); // تخفیفی که تمام بشه خودکار از صفحه حذف می‌شه

  const [band, setBand] = useState(0);
  const [categoryId, setCategoryId] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sort, setSort] = useState("percent");

  const live = useMemo(
    () => (data ?? []).filter((p) => isLive(p, now)),
    [data, now],
  );

  const stats = useMemo(() => {
    const ending =
      live.filter((p) => Number.isFinite(endMs(p))).sort(SORTERS.ending)[0] ??
      null;

    return {
      count: live.length,
      maxPercent: Math.max(0, ...live.map((p) => p.discountPercent)),
      maxSaving: Math.max(0, ...live.map(maxSaving)),
      ending,
    };
  }, [live]);

  const bands = useMemo(
    () => BANDS.filter((b) => live.some((p) => p.discountPercent >= b)),
    [live],
  );

  const rootCategories = useMemo(
    () =>
      (categories ?? []).filter((c) =>
        live.some((p) =>
          (p.categories ?? []).map(String).includes(String(c._id)),
        ),
      ),
    [categories, live],
  );

  const visible = useMemo(
    () =>
      live
        .filter((p) => p.discountPercent >= band)
        .filter(
          (p) =>
            !categoryId ||
            (p.categories ?? []).map(String).includes(categoryId),
        )
        .filter((p) => !onlyAvailable || inStock(p))
        .sort(SORTERS[sort]),
    [live, band, categoryId, onlyAvailable, sort],
  );

  const filtersActive = band > 0 || categoryId || onlyAvailable;
  const resetFilters = () => {
    setBand(0);
    setCategoryId("");
    setOnlyAvailable(false);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-5 sm:space-y-10 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
      {loading && !data ? (
        <>
          <Skeleton className="h-56 rounded-3xl sm:h-72" />
          <div className={GRID}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4.4] rounded-2xl" />
            ))}
          </div>
        </>
      ) : error && !data ? (
        <ErrorState
          message="دریافت تخفیف‌ها با خطا مواجه شد"
          onRetry={reload}
        />
      ) : live.length === 0 ? (
        <>
          <section className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-card to-ink px-5 py-12 text-center sm:px-6 sm:py-16">
            <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-44 w-44 -translate-x-1/2 rounded-full bg-bronze/15 blur-3xl" />
            <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-bronze/15 text-bronze ring-1 ring-bronze/25">
              <PackageSearch className="h-6 w-6" strokeWidth={1.6} />
            </span>
            <h1 className="relative mt-4 font-display text-xl font-bold text-paper sm:text-2xl">
              فعلاً تخفیف ویژه‌ای نداریم
            </h1>
            <p className="relative mx-auto mt-3 max-w-md text-sm leading-7 text-muted">
              به‌زودی تخفیف‌های تازه می‌رسند. تا آن موقع می‌توانی از مزایای
              باشگاه مشتریان و کد تخفیف استفاده کنی.
            </p>
            <Link
              to="/products"
              className="relative mt-6 inline-block rounded-full bg-bronze px-7 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90"
            >
              مشاهده محصولات
            </Link>
          </section>
          <PerksSection />
        </>
      ) : (
        <>
          <DiscountHero stats={stats} />

          <EndingSoon products={live} now={now} />

          <section aria-labelledby="all-deals">
            <h2 id="all-deals" className="mb-3 font-display text-lg font-bold text-paper sm:mb-4 sm:text-xl">
              همه‌ی محصولات تخفیف‌دار
            </h2>

            {/* پنل فیلتر: فشرده روی موبایل */}
            <div className="mb-4 space-y-2.5 rounded-2xl border border-line bg-card/60 p-3 sm:mb-6 sm:space-y-3 sm:p-4">
              <div className={ROW} role="group" aria-label="درصد تخفیف">
                <button
                  type="button"
                  className={chip(band === 0)}
                  onClick={() => setBand(0)}
                  aria-pressed={band === 0}
                >
                  همه‌ی تخفیف‌ها
                </button>
                {bands.map((b) => (
                  <button
                    key={b}
                    type="button"
                    className={chip(band === b)}
                    onClick={() => setBand(band === b ? 0 : b)}
                    aria-pressed={band === b}
                  >
                    {toPersianDigits(b)}٪ به بالا
                  </button>
                ))}
              </div>

              {rootCategories.length > 0 && (
                <div className={ROW} role="group" aria-label="دسته‌بندی">
                  <button
                    type="button"
                    className={chip(!categoryId)}
                    onClick={() => setCategoryId("")}
                    aria-pressed={!categoryId}
                  >
                    همه‌ی دسته‌ها
                  </button>
                  {rootCategories.map((c) => (
                    <button
                      key={c._id}
                      type="button"
                      className={chip(categoryId === String(c._id))}
                      onClick={() =>
                        setCategoryId(
                          categoryId === String(c._id) ? "" : String(c._id),
                        )
                      }
                      aria-pressed={categoryId === String(c._id)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-line pt-2.5 sm:pt-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted">
                    <span className="text-bronze">{toPersianDigits(visible.length)}</span> محصول
                  </span>
                  {filtersActive && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="inline-flex items-center gap-1 text-xs text-bronze transition-opacity hover:opacity-80"
                    >
                      <X className="h-3 w-3" />
                      حذف فیلترها
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={chip(onlyAvailable)}
                    onClick={() => setOnlyAvailable((v) => !v)}
                    aria-pressed={onlyAvailable}
                  >
                    {onlyAvailable && <Check className="h-3 w-3" strokeWidth={2.4} />}
                    فقط موجودها
                  </button>

                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    aria-label="مرتب‌سازی"
                    className="rounded-full border border-line bg-ink/30 px-3 py-1.5 text-xs text-paper focus:border-bronze focus:outline-none"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {visible.length === 0 ? (
              <div className="rounded-2xl border border-line bg-card px-6 py-12 text-center sm:py-14">
                <p className="font-display text-base font-bold text-paper">
                  محصولی با این فیلترها پیدا نشد
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 rounded-full bg-bronze px-5 py-2 text-sm font-medium text-ink transition-opacity hover:opacity-90"
                >
                  حذف فیلترها
                </button>
              </div>
            ) : (
              <ul className={GRID}>
                {visible.map((p, i) => (
                  <li key={p._id} className="min-w-0">
                    <DiscountCard product={p} index={i} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <PerksSection />
        </>
      )}
    </div>
  );
};

export default DiscountsPage;