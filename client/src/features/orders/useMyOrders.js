import { useCallback, useEffect, useState } from "react";
import { getMyOrders } from "./ordersApi";

const useMyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return getMyOrders()
      .then((res) => setOrders(res.data.data))
      .catch(() => setError("دریافت سفارش‌ها با خطا مواجه شد"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patchOrder = useCallback((id, patch) => {
    setOrders((prev) =>
      prev.map((o) => (o._id === id ? { ...o, ...patch } : o)),
    );
  }, []);

  return { orders, loading, error, reload: load, patchOrder };
};

export default useMyOrders;
