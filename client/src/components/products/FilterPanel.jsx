import { useEffect, useState } from "react";
import { toPersianDigits } from "../../utils/authHelpers";
import { getBrands } from "../../features/brands/brandsApi";
import useCategoryTree from "../../features/categories/useCategoryTree";

const FilterPanel = ({ draft, onChange, onApply, onClear, showApply = false }) => {
  const { categories } = useCategoryTree();
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    getBrands()
      .then((res) => setBrands(res.data.data))
      .catch(() => setBrands([]));
  }, []);

  const toggleCategory = (id) => {
    onChange({ ...draft, category: draft.category === id ? "" : id });
  };

  const toggleBrand = (id) => {
    const current = draft.brands || [];
    const next = current.includes(id) ? current.filter((b) => b !== id) : [...current, id];
    onChange({ ...draft, brands: next });
  };

  return (
    <div>
      {/* دسته‌بندی */}
      <div className="border-b border-line pb-5">
        <p className="mb-3 text-sm font-medium text-paper">دسته‌بندی</p>
        <div className="flex flex-col gap-2.5">
          {categories.map((cat) => (
            <label key={cat._id} className="flex cursor-pointer items-center gap-2.5">
              <input
                type="radio"
                checked={draft.category === cat._id}
                onChange={() => toggleCategory(cat._id)}
                className="h-4 w-4 accent-bronze"
              />
              <span className="text-sm text-muted">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* برند */}
      {brands.length > 0 && (
        <div className="border-b border-line py-5">
          <p className="mb-3 text-sm font-medium text-paper">برند</p>
          <div className="flex flex-col gap-2.5">
            {brands.map((brand) => (
              <label key={brand._id} className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={(draft.brands || []).includes(brand._id)}
                  onChange={() => toggleBrand(brand._id)}
                  className="h-4 w-4 accent-bronze"
                />
                <span className="text-sm text-muted">{brand.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* بازه قیمت */}
      <div className="border-b border-line py-5">
        <p className="mb-3 text-sm font-medium text-paper">
          بازه قیمت <span dir="ltr">(تومان)</span>
        </p>
        <div dir="ltr" className="flex items-center gap-2">
          <input
            type="number"
            placeholder="حداقل"
            value={draft.minPrice}
            onChange={(e) => onChange({ ...draft, minPrice: e.target.value })}
            className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-paper placeholder:text-muted focus:border-bronze focus:outline-none"
          />
          <span className="text-muted">—</span>
          <input
            type="number"
            placeholder="حداکثر"
            value={draft.maxPrice}
            onChange={(e) => onChange({ ...draft, maxPrice: e.target.value })}
            className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-paper placeholder:text-muted focus:border-bronze focus:outline-none"
          />
        </div>
      </div>

      {/* فقط موجودها */}
      <div className="py-5">
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={draft.inStock}
            onChange={(e) => onChange({ ...draft, inStock: e.target.checked })}
            className="h-4 w-4 accent-bronze"
          />
          <span className="text-sm text-muted">فقط کالاهای موجود</span>
        </label>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={onClear}
          className="flex-1 rounded-lg border border-line py-2.5 text-sm text-muted transition-colors hover:text-paper"
        >
          حذف فیلترها
        </button>
        {showApply && (
          <button
            onClick={onApply}
            className="flex-1 rounded-lg bg-bronze py-2.5 text-sm font-medium text-ink"
          >
            اعمال فیلتر
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterPanel;