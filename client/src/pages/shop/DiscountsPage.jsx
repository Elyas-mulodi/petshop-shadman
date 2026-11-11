import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

const chip = (active) =>
  `shrink-0 rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
    active
      ? "border-bronze/60 bg-bronze/10 text-bronze"
      : "border-line text-muted hover:text-paper"
  }`;

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
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 lg:px-8 lg:py-12">
      {loading && !data ? (
        <>
          <Skeleton className="h-72 rounded-3xl" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-96 rounded-2xl" />
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
          <section className="rounded-3xl border border-line bg-card px-6 py-16 text-center">
            <h1 className="font-display text-2xl font-bold text-paper">
              فعلاً تخفیف ویژه‌ای نداریم
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted">
              به‌زودی تخفیف‌های تازه می‌رسند. تا آن موقع می‌توانی از مزایای
              باشگاه مشتریان و کد تخفیف استفاده کنی.
            </p>
            <Link
              to="/products"
              className="mt-6 inline-block rounded-lg bg-bronze px-6 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90"
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
            <h2 id="all-deals" className="sr-only">
              همه‌ی محصولات تخفیف‌دار
            </h2>

            <div className="mb-6 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  className={chip(band === 0)}
                  onClick={() => setBand(0)}
                  aria-pressed={band === 0}
                >
                  همه‌ی تخفیف‌ها
                </button>
                {bands.map((b) => (
                  <button
                    key={b}
                    className={chip(band === b)}
                    onClick={() => setBand(band === b ? 0 : b)}
                    aria-pressed={band === b}
                  >
                    {toPersianDigits(b)}٪ به بالا
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {rootCategories.length > 0 && (
                  <>
                    <button
                      className={chip(!categoryId)}
                      onClick={() => setCategoryId("")}
                      aria-pressed={!categoryId}
                    >
                      همه‌ی دسته‌ها
                    </button>
                    {rootCategories.map((c) => (
                      <button
                        key={c._id}
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
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                <div className="flex items-center gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-paper">
                    <input
                      type="checkbox"
                      checked={onlyAvailable}
                      onChange={(e) => setOnlyAvailable(e.target.checked)}
                      className="h-4 w-4 accent-bronze"
                    />
                    فقط کالاهای موجود
                  </label>
                  <span className="text-xs text-muted">
                    {toPersianDigits(visible.length)} محصول
                  </span>
                  {filtersActive && (
                    <button
                      onClick={resetFilters}
                      className="text-xs text-bronze transition-opacity hover:opacity-80"
                    >
                      حذف فیلترها
                    </button>
                  )}
                </div>

                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  aria-label="مرتب‌سازی"
                  className="rounded-lg border border-line bg-card px-3 py-2 text-sm text-paper focus:border-bronze focus:outline-none"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {visible.length === 0 ? (
              <div className="rounded-2xl border border-line bg-card px-6 py-14 text-center">
                <p className="font-display text-base font-bold text-paper">
                  محصولی با این فیلترها پیدا نشد
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-4 text-sm text-bronze transition-opacity hover:opacity-80"
                >
                  حذف فیلترها
                </button>
              </div>
            ) : (
              <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {visible.map((p, i) => (
                  <li key={p._id}>
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
