import { useEffect, useRef, useState } from "react";
import { getProducts } from "../features/products/productsApi";

const LIMIT = 12;

const useInfiniteProducts = (filters) => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const filtersKey = JSON.stringify(filters);
  const requestId = useRef(0);

  // هر وقت فیلترها عوض بشن، از صفحه ۱ شروع کن
  useEffect(() => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    setPage(1);

    getProducts({ ...filters, page: 1, limit: LIMIT })
      .then((res) => {
        if (currentRequest !== requestId.current) return;
        setProducts(res.data.data);
        setHasMore(res.data.pagination.page < res.data.pagination.pages);
      })
      .catch(() => {
        if (currentRequest !== requestId.current) return;
        setError("دریافت محصولات با خطا مواجه شد");
      })
      .finally(() => {
        if (currentRequest === requestId.current) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    const currentRequest = requestId.current;
    const nextPage = page + 1;
    setLoadingMore(true);

    getProducts({ ...filters, page: nextPage, limit: LIMIT })
      .then((res) => {
        if (currentRequest !== requestId.current) return;
        setProducts((prev) => [...prev, ...res.data.data]);
        setPage(nextPage);
        setHasMore(res.data.pagination.page < res.data.pagination.pages);
      })
      .catch(() => {
        if (currentRequest !== requestId.current) return;
        setError("دریافت محصولات بیشتر با خطا مواجه شد");
      })
      .finally(() => {
        if (currentRequest === requestId.current) setLoadingMore(false);
      });
  };

  return { products, loading, loadingMore, hasMore, error, loadMore };
};

export default useInfiniteProducts;
