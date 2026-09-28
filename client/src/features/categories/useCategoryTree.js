import { useEffect, useState } from "react";
import { getCategoryTree } from "./categoriesApi";

let cache = null;
let pending = null;

const useCategoryTree = () => {
  const [categories, setCategories] = useState(cache || []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;

    let active = true;

    pending =
      pending ||
      getCategoryTree().then((res) => {
        cache = res.data.data;
        return cache;
      });

    pending
      .then((data) => {
        if (active) {
          setCategories(data);
          setLoading(false);
        }
      })
      .catch(() => {
        pending = null;
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { categories, loading };
};

export default useCategoryTree;