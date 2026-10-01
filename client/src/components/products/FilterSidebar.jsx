import useCategoryTree from "../../features/categories/useCategoryTree";
import CategorySection from "./filters/CategorySection";
import BrandSection from "./filters/BrandSection";
import PriceSection from "./filters/PriceSection";
import StockSection from "./filters/StockSection";

const FilterCard = ({ title, children }) => (
  <div className="rounded-xl border border-line bg-card p-4 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)]">
    <p className="mb-3.5 text-sm font-medium text-paper">{title}</p>
    {children}
  </div>
);

const FilterSidebar = ({ draft, onChange, onClear }) => {
  const { categories } = useCategoryTree();

  return (
    <div className="flex flex-col gap-4">
      {categories.length > 0 && (
        <FilterCard title="دسته‌بندی">
          <CategorySection
            value={draft.category}
            onChange={(category) => onChange({ ...draft, category })}
          />
        </FilterCard>
      )}

      <FilterCard title="برند">
        <BrandSection brands value={draft.brands} onChange={(brands) => onChange({ ...draft, brands })} />
      </FilterCard>

      <FilterCard title="بازه قیمت (تومان)">
        <PriceSection
          min={draft.minPrice}
          max={draft.maxPrice}
          onChange={(minPrice, maxPrice) => onChange({ ...draft, minPrice, maxPrice })}
        />
      </FilterCard>

      <FilterCard title="موجودی">
        <StockSection value={draft.inStock} onChange={(inStock) => onChange({ ...draft, inStock })} />
      </FilterCard>

      <button
        onClick={onClear}
        className="rounded-lg border border-line py-2.5 text-sm text-muted transition-colors hover:text-paper"
      >
        حذف فیلترها
      </button>
    </div>
  );
};

export default FilterSidebar;