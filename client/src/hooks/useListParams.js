import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

// defaults باید یه ثابت بیرون از کامپوننت باشه. مقدارهای عددی برای page/limit (عدد مثبت) هستن
export const useListParams = (defaults) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo(() => {
    const result = {};
    for (const [key, fallback] of Object.entries(defaults)) {
      const raw = searchParams.get(key);

      if (raw === null || raw === "") {
        result[key] = fallback;
      } else if (typeof fallback === "number") {
        const num = Number(raw);
        result[key] = Number.isFinite(num) && num > 0 ? Math.floor(num) : fallback;
      } else {
        result[key] = raw;
      }
    }
    return result;
  }, [searchParams, defaults]);

  const setParams = useCallback(
    (patch) => {
      const pureNavigation = Object.keys(patch).length === 1 && "page" in patch;

      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const entries = { ...patch };
          if (!("page" in patch)) entries.page = 1;

          for (const [key, value] of Object.entries(entries)) {
            if (value === undefined || value === null || value === "" || value === defaults[key]) {
              next.delete(key);
            } else {
              next.set(key, String(value));
            }
          }
          return next;
        },
        { replace: !pureNavigation },
      );
    },
    [setSearchParams, defaults],
  );

  return { params, setParams };
};