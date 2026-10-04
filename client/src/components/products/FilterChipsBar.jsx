import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, X } from "lucide-react";
import useCategoryTree from "../../features/categories/useCategoryTree";
import CategorySection from "./filters/CategorySection";
import BrandSection from "./filters/BrandSection";
import PriceSection from "./filters/PriceSection";
import StockSection from "./filters/StockSection";

const ease = [0.22, 1, 0.36, 1];

const Chip = ({ label, active, open, onClick }) => (
  <button
    onClick={onClick}
    className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
      active || open ? "border-bronze bg-bronze text-ink" : "border-line bg-card text-muted"
    }`}
  >
    {label}
    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
  </button>
);

const FilterChipsBar = ({ draft, onChange, onClear }) => {
  const [openKey, setOpenKey] = useState(null); // "category" | "brand" | "price" | "stock" | null
  const { categories } = useCategoryTree();

  const toggle = (key) => setOpenKey((prev) => (prev === key ? null : key));

  const categoryLabel = draft.category
    ? categories.find((c) => c._id === draft.category)?.name || "دسته‌بندی"
    : "دسته‌بندی";
  const priceActive = draft.minPrice || draft.maxPrice;
  const hasAnyFilter = draft.category || draft.brands.length > 0 || priceActive || draft.inStock;

  const panels = {
    category: (
      <CategorySection value={draft.category} onChange={(category) => onChange({ ...draft, category })} />
    ),
    brand: <BrandSection value={draft.brands} onChange={(brands) => onChange({ ...draft, brands })} />,
    price: (
      <PriceSection
        min={draft.minPrice}
        max={draft.maxPrice}
        onChange={(minPrice, maxPrice) => onChange({ ...draft, minPrice, maxPrice })}
      />
    ),
    stock: <StockSection value={draft.inStock} onChange={(inStock) => onChange({ ...draft, inStock })} />,
  };

  const panelTitle = { category: "دسته‌بندی", brand: "برند", price: "بازه قیمت", stock: "موجودی" };

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Chip
          label={categoryLabel}
          active={!!draft.category}
          open={openKey === "category"}
          onClick={() => toggle("category")}
        />
        <Chip
          label={draft.brands.length ? `برند (${draft.brands.length})` : "برند"}
          active={draft.brands.length > 0}
          open={openKey === "brand"}
          onClick={() => toggle("brand")}
        />
        <Chip label="قیمت" active={!!priceActive} open={openKey === "price"} onClick={() => toggle("price")} />
        <Chip label="موجود" active={draft.inStock} open={openKey === "stock"} onClick={() => toggle("stock")} />

        {hasAnyFilter && (
          <button
            onClick={() => {
              onClear();
              setOpenKey(null);
            }}
            className="flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-xs text-muted"
          >
            <X className="h-3.5 w-3.5" />
            پاک کردن
          </button>
        )}
      </div>

      {/* پنل inline — دقیقاً زیر چیپ‌ها باز می‌شه، نه از پایین صفحه */}
      <AnimatePresence initial={false}>
        {openKey && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-xl border border-line bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-paper">{panelTitle[openKey]}</p>
                <button onClick={() => setOpenKey(null)} aria-label="بستن" className="text-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {panels[openKey]}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterChipsBar;