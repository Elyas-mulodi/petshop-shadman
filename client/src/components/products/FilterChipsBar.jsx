import { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, X } from "lucide-react";
import useCategoryTree from "../../features/categories/useCategoryTree";
import CategorySection from "./filters/CategorySection";
import BrandSection from "./filters/BrandSection";
import PriceSection from "./filters/PriceSection";
import StockSection from "./filters/StockSection";

const ease = [0.22, 1, 0.36, 1];

// کشوی کوچک مخصوص یک فیلتر، نه کل فیلترها
const MiniSheet = ({ title, onClose, children }) =>
  createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-ink/70"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.3, ease }}
        className="fixed inset-x-0 bottom-0 z-[70] max-h-[70vh] overflow-y-auto rounded-t-2xl border-t border-line bg-card p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-paper">{title}</h3>
          <button onClick={onClose} aria-label="بستن" className="text-paper">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </motion.div>
    </AnimatePresence>,
    document.body
  );

const Chip = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
      active ? "border-bronze bg-bronze text-ink" : "border-line bg-card text-muted"
    }`}
  >
    {label}
    <ChevronDown className="h-3.5 w-3.5" />
  </button>
);

const FilterChipsBar = ({ draft, onChange, onClear }) => {
  const [openSheet, setOpenSheet] = useState(null); // "category" | "brand" | "price" | "stock" | null
  const { categories } = useCategoryTree();

  const categoryLabel = draft.category
    ? categories.find((c) => c._id === draft.category)?.name || "دسته‌بندی"
    : "دسته‌بندی";
  const priceActive = draft.minPrice || draft.maxPrice;
  const hasAnyFilter = draft.category || draft.brands.length > 0 || priceActive || draft.inStock;

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Chip label={categoryLabel} active={!!draft.category} onClick={() => setOpenSheet("category")} />
        <Chip
          label={draft.brands.length ? `برند (${draft.brands.length})` : "برند"}
          active={draft.brands.length > 0}
          onClick={() => setOpenSheet("brand")}
        />
        <Chip label="قیمت" active={!!priceActive} onClick={() => setOpenSheet("price")} />
        <Chip label="موجود" active={draft.inStock} onClick={() => setOpenSheet("stock")} />

        {hasAnyFilter && (
          <button
            onClick={onClear}
            className="flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-xs text-muted"
          >
            <X className="h-3.5 w-3.5" />
            پاک کردن
          </button>
        )}
      </div>

      {openSheet === "category" && (
        <MiniSheet title="دسته‌بندی" onClose={() => setOpenSheet(null)}>
          <CategorySection
            value={draft.category}
            onChange={(category) => onChange({ ...draft, category })}
          />
        </MiniSheet>
      )}

      {openSheet === "brand" && (
        <MiniSheet title="برند" onClose={() => setOpenSheet(null)}>
          <BrandSection value={draft.brands} onChange={(brands) => onChange({ ...draft, brands })} />
        </MiniSheet>
      )}

      {openSheet === "price" && (
        <MiniSheet title="بازه قیمت" onClose={() => setOpenSheet(null)}>
          <PriceSection
            min={draft.minPrice}
            max={draft.maxPrice}
            onChange={(minPrice, maxPrice) => onChange({ ...draft, minPrice, maxPrice })}
          />
          <button
            onClick={() => setOpenSheet(null)}
            className="mt-5 w-full rounded-lg bg-bronze py-2.5 text-sm font-medium text-ink"
          >
            اعمال
          </button>
        </MiniSheet>
      )}

      {openSheet === "stock" && (
        <MiniSheet title="موجودی" onClose={() => setOpenSheet(null)}>
          <StockSection value={draft.inStock} onChange={(inStock) => onChange({ ...draft, inStock })} />
        </MiniSheet>
      )}
    </>
  );
};

export default FilterChipsBar;