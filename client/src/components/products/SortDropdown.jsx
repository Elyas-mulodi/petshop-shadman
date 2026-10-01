import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

const options = [
  { value: "newest", label: "جدیدترین" },
  { value: "priceAsc", label: "ارزان‌ترین" },
  { value: "priceDesc", label: "گران‌ترین" },
];

const SortDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const current = options.find((o) => o.value === value) || options[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-line bg-card px-3.5 py-2 text-sm text-paper"
      >
        {current.label}
        <ChevronDown className={`h-4 w-4 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1.5 w-40 rounded-lg border border-line bg-card py-1.5 shadow-lg">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-3.5 py-2 text-sm text-muted hover:bg-well hover:text-paper"
            >
              {opt.label}
              {opt.value === value && <Check className="h-4 w-4 text-bronze" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SortDropdown;