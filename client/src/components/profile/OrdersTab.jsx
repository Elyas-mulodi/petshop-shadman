import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import OrderRow from "../orders/OrderRow";
import Skeleton from "../common/Skeleton";
import ErrorState from "../common/ErrorState";
import {
  cancelOrder,
  retryOrderPayment,
} from "../../features/orders/ordersApi";
import { redirectTo } from "../../utils/redirect";
import { toPersianDigits } from "../../utils/authHelpers";

const PAGE_SIZE = 5;

const FILTERS = [
  { id: "all", label: "همه", match: () => true },
  {
    id: "pending",
    label: "در انتظار پرداخت",
    match: (o) => o.status === "pending_payment",
  },
  {
    id: "active",
    label: "در جریان",
    match: (o) => ["paid", "processing", "shipped"].includes(o.status),
  },
  {
    id: "delivered",
    label: "تحویل‌شده",
    match: (o) => o.status === "delivered",
  },
  {
    id: "closed",
    label: "لغو یا مرجوع",
    match: (o) => ["cancelled", "returned"].includes(o.status),
  },
];

const OrdersTab = ({ orders, loading, error, onReload, onPatchOrder }) => {
  const [filter, setFilter] = useState("all");
  const [showAll, setShowAll] = useState(false);
  const [openId, setOpenId] = useState(null);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map((f) => [f.id, orders.filter(f.match).length]),
      ),
    [orders],
  );

  const current = FILTERS.find((f) => f.id === filter);
  const filtered = useMemo(
    () => orders.filter(current.match),
    [orders, current],
  );
  const visible = showAll ? filtered : filtered.slice(0, PAGE_SIZE);

  const handlePay = async (id) => {
    const { data } = await retryOrderPayment(id);
    redirectTo(data.data.paymentUrl);
  };

  const handleCancel = async (id) => {
    const { data } = await cancelOrder(id);
    onPatchOrder(id, { status: data.data.status });
  };

  const changeFilter = (id) => {
    setFilter(id);
    setShowAll(false);
    setOpenId(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={onReload} />;

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-line bg-card py-16 text-center">
        <Package className="mb-5 h-12 w-12 text-sage" strokeWidth={1.3} />
        <h2 className="font-display text-lg font-bold text-paper">
          هنوز سفارشی ثبت نکرده‌اید
        </h2>
        <p className="mt-2 text-sm text-muted">
          بعد از اولین خرید، سفارش‌هایتان اینجا نمایش داده می‌شود.
        </p>
        <Link
          to="/products"
          className="mt-6 rounded-lg bg-bronze px-6 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90"
        >
          مشاهده محصولات
        </Link>
      </div>
    );
  }

  return (
    <div>
      {counts.pending > 0 && filter !== "pending" && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-bronze/30 bg-bronze/5 px-4 py-3">
          <p className="text-sm text-paper">
            {toPersianDigits(counts.pending)} سفارش منتظر پرداخت شماست.
          </p>
          <button
            onClick={() => changeFilter("pending")}
            className="rounded-lg border border-bronze px-4 py-1.5 text-xs font-medium text-bronze transition-colors hover:bg-bronze hover:text-ink"
          >
            مشاهده و پرداخت
          </button>
        </div>
      )}

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.filter(
          (f) => f.id === "all" || f.id === filter || counts[f.id] > 0,
        ).map((f) => {
          const selected = f.id === filter;
          return (
            <button
              key={f.id}
              onClick={() => changeFilter(f.id)}
              aria-pressed={selected}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
                selected
                  ? "border-bronze/60 bg-bronze/10 text-bronze"
                  : "border-line text-muted hover:text-paper"
              }`}
            >
              {f.label}
              <span className="mr-1.5 opacity-70">
                {toPersianDigits(counts[f.id])}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-line bg-card px-4 py-10 text-center text-sm text-muted">
          سفارشی در این دسته وجود ندارد.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-card">
          <div className="hidden grid-cols-[1.4fr_1fr_1fr_1fr_auto] gap-4 border-b border-line px-4 py-2.5 text-xs text-muted md:grid">
            <span>شماره سفارش</span>
            <span>تاریخ ثبت</span>
            <span>وضعیت</span>
            <span>مبلغ کل</span>
            <span className="w-4" />
          </div>

          {visible.map((order) => (
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

          {filtered.length > PAGE_SIZE && (
            <button
              onClick={() => setShowAll((s) => !s)}
              className="w-full border-t border-line py-3 text-sm text-bronze transition-colors hover:bg-well/50"
            >
              {showAll
                ? "نمایش کمتر"
                : `نمایش همه‌ی سفارش‌ها (${toPersianDigits(filtered.length)})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OrdersTab;
