import { useCallback, useEffect, useState } from "react";
import { getCategoryTree } from "./categoriesApi";

let cache = null;
let pending = null;

const fetchTree = () => {
  pending =
    pending ||
    getCategoryTree()
      .then((res) => {
        cache = res.data.data;
        return cache;
      })
      .catch((err) => {
        pending = null;
        throw err;
      });
  return pending;
};

const useCategoryTree = () => {
  const [categories, setCategories] = useState(cache || []);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (cache && reloadKey === 0) return;

    let active = true;
    setLoading(true);
    setError(null);

    fetchTree()
      .then((data) => {
        if (active) {
          setCategories(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError("دریافت دسته‌بندی‌ها با خطا مواجه شد");
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const retry = useCallback(() => {
    cache = null;
    pending = null;
    setReloadKey((k) => k + 1);
  }, []);

  return { categories, loading, error, retry };
};

export default useCategoryTree;