import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import FilterPanel from "./FilterPanel";

const ease = [0.22, 1, 0.36, 1];

const FilterBottomSheet = ({ open, onClose, filters, onApply }) => {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const apply = () => {
    onApply(draft);
    onClose();
  };

  const clear = () => {
    const cleared = { category: "", brands: [], minPrice: "", maxPrice: "", inStock: false };
    setDraft(cleared);
    onApply(cleared);
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
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
            transition={{ duration: 0.35, ease }}
            className="fixed inset-x-0 bottom-0 z-[70] max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-line bg-card p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-paper">فیلترها</h3>
              <button onClick={onClose} aria-label="بستن" className="text-paper">
                <X className="h-5 w-5" />
              </button>
            </div>
            <FilterPanel draft={draft} onChange={setDraft} onApply={apply} onClear={clear} showApply />
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default FilterBottomSheet;