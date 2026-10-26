import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

const SearchInput = ({ value, onChange, placeholder = "جستجو...", delay = 350, className = "" }) => {
  const [local, setLocal] = useState(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // وقتی مقدار از بیرون عوض شد (دکمه‌ی برگشت مرورگر یا ریست فیلتر)
  useEffect(() => {
    setLocal((prev) => (prev.trim() === value ? prev : value));
  }, [value]);

  useEffect(() => {
    if (local.trim() === value) return;
    const timer = setTimeout(() => onChangeRef.current(local.trim()), delay);
    return () => clearTimeout(timer);
  }, [local, value, delay]);

  const clear = () => {
    setLocal("");
    onChangeRef.current("");
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-line bg-card py-2.5 pr-10 pl-9 text-sm text-paper transition-colors placeholder:text-muted focus:border-sage focus:outline-none"
      />
      <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sage" />
      {local && (
        <button
          type="button"
          onClick={clear}
          aria-label="پاک کردن جستجو"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-paper"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;