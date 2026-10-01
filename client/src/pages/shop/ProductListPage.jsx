import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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

const emptyFilters = { category: "", brands: [], minPrice: "", maxPrice: "", inStock: false };

const ProductListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories } = useCategoryTree();

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-paper">
          {search ? `نتایج جستجو برای «${search}»` : "محصولات"}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        {/* سایدبار دسکتاپ */}
        <aside className="hidden lg:block">
          <FilterSidebar
            draft={uiFilters}
            onChange={applyFilters}
            onClear={() => applyFilters(emptyFilters)}
          />
        </aside>

        <div>
          {/* چیپ‌های فیلتر موبایل */}
          <div className="mb-4 lg:hidden">
            <FilterChipsBar
              draft={uiFilters}
              onChange={applyFilters}
              onClear={() => applyFilters(emptyFilters)}
            />
          </div>

          {/* نوار ابزار: مرتب‌سازی */}
          <div className="mb-5 flex items-center justify-end">
            <SortDropdown value={sort} onChange={updateSort} />
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4.2]" />
              ))}
            </div>
          ) : error ? (
            <ErrorState message={error} />
          ) : products.length === 0 ? (
            <div className="rounded-lg border border-line bg-card py-16 text-center text-sm text-muted">
              محصولی با این فیلترها پیدا نشد.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {products.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>

              {loadingMore && (
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-[3/4.2]" />
                  ))}
                </div>
              )}

              <InfiniteSentinel onVisible={loadMore} disabled={!hasMore || loadingMore} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductListPage;