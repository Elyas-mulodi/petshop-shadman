import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import OrderRow from "../../components/orders/OrderRow";
import Skeleton from "../../components/common/Skeleton";
import ErrorState from "../../components/common/ErrorState";
import {
  cancelOrder,
  getMyOrders,
  retryOrderPayment,
} from "../../features/orders/ordersApi";
import { redirectTo } from "../../utils/redirect";
import { toPersianDigits } from "../../utils/authHelpers";

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(null);

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

  const handlePay = async (id) => {
    const { data } = await retryOrderPayment(id);
    redirectTo(data.data.paymentUrl);
  };

  const handleCancel = async (id) => {
    const { data } = await cancelOrder(id);
    setOrders((prev) =>
      prev.map((o) => (o._id === id ? { ...o, status: data.data.status } : o)),
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8 lg:py-12">
      <h1 className="mb-8 font-display text-2xl font-bold text-paper">
        سفارش‌های من
        {orders.length > 0 && (
          <span className="mr-2 text-sm font-normal text-muted">
            ({toPersianDigits(orders.length)})
          </span>
        )}
      </h1>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <Package className="mb-5 h-12 w-12 text-sage" strokeWidth={1.3} />
          <h2 className="font-display text-lg font-bold text-paper">
            هنوز سفارشی ثبت نکرده‌اید
          </h2>
          <p className="mt-2 text-sm text-muted">
            سفارش‌های شما اینجا نمایش داده می‌شود.
          </p>
          <Link
            to="/products"
            className="mt-6 rounded-lg bg-bronze px-6 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90"
          >
            مشاهده محصولات
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-card">
          {/* سرستون جدول (فقط دسکتاپ) */}
          <div className="hidden grid-cols-[1.4fr_1fr_1fr_1fr_auto] gap-4 border-b border-line px-4 py-2.5 text-xs text-muted md:grid">
            <span>شماره سفارش</span>
            <span>تاریخ ثبت</span>
            <span>وضعیت</span>
            <span>مبلغ کل</span>
            <span className="w-4" />
          </div>

          {orders.map((order) => (
            <OrderRow
              key={order._id}
              order={order}
              open={openId === order._id}
              onToggle={() =>
                setOpenId((prev) => (prev === order._id ? null : order._id))
              }
              onPay={handlePay}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;
