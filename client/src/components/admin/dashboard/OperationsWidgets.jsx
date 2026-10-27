import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import StatCard from "./StatCard";
import { Panel } from "./Panel";
import Badge from "../ui/Badge";
import StatusBadge from "../../orders/StatusBadge";
import ErrorState from "../../common/ErrorState";
import { formatNumber } from "./chartTheme";
import { useInventory, useRecentOrders } from "../../../features/admin/dashboard/useDashboard";
import { formatToman } from "../../../utils/price";
import { formatDateTime } from "../../../utils/formatDate";

// ---------- شاخص‌های اصلی ----------
export const KpiGrid = ({ query }) => {
  const kpis = query.data?.kpis;
  const refunds = query.data?.refunds;

  if (query.isError && !query.data) {
    return <ErrorState message="دریافت شاخص‌ها با خطا مواجه شد" onRetry={query.refetch} />;
  }

  const cards = [
    { key: "revenue", label: "درآمد", metric: kpis?.revenue, money: true },
    { key: "orders", label: "سفارش‌های موفق", metric: kpis?.orders },
    { key: "aov", label: "میانگین ارزش سفارش", metric: kpis?.aov, money: true },
    { key: "newUsers", label: "کاربران جدید", metric: kpis?.newUsers },
    { key: "itemsSold", label: "کالای فروخته‌شده", metric: kpis?.itemsSold },
    { key: "discount", label: "مجموع تخفیف", metric: kpis?.discount, money: true, neutral: true },
  ];

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            loading={query.isLoading}
            value={card.metric ? formatNumber(card.metric.value) : "—"}
            unit={card.money ? "تومان" : undefined}
            delta={card.metric?.delta}
            neutral={card.neutral}
          />
        ))}
      </div>

      {refunds?.count > 0 && (
        <div
          role="status"
          className="mt-4 flex items-start gap-3 rounded-xl border border-danger/40 bg-danger/5 px-4 py-3 text-sm"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <p className="leading-7 text-paper">
            {formatNumber(refunds.count)} سفارش پرداخت‌شده در این بازه لغو یا مرجوع شده (مجموع {formatToman(refunds.amount)}).
            عودت وجه این سفارش‌ها باید به‌صورت دستی از پنل درگاه انجام شود.
          </p>
        </div>
      )}
    </>
  );
};

// ---------- وضعیت لحظه‌ای (مستقل از بازه) ----------
const Tile = ({ label, value, tone }) => {
  const style =
    value > 0 && tone === "alert"
      ? "border-danger/40 bg-danger/5"
      : value > 0 && tone === "attention"
        ? "border-bronze/40 bg-bronze/5"
        : "border-line bg-card";

  return (
    <div className={`rounded-xl border px-4 py-3 ${style}`}>
      <p className="font-display text-xl font-bold text-paper">{formatNumber(value)}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
};

export const LiveStrip = ({ query }) => {
  const live = query.data?.live;

  if (query.isLoading || !live) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[66px] animate-pulse rounded-xl bg-card" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <Tile label="در انتظار پرداخت" value={live.pendingPayment} />
      <Tile label="منتظر ارسال" value={live.awaitingShipment} tone="attention" />
      <Tile label="سفارش با کمبود موجودی" value={live.stockIssue} tone="alert" />
      <Tile label="کم‌موجودی" value={live.lowStock} tone="attention" />
      <Tile label="ناموجود" value={live.outOfStock} tone="alert" />
      <Tile label="کل کاربران" value={live.totalUsers} />
    </div>
  );
};

// ---------- کم‌موجودی‌ها ----------
export const LowStockCard = () => {
  const query = useInventory();
  const d = query.data;

  return (
    <Panel
      title="هشدار موجودی"
      subtitle={d ? `واریانت‌های با موجودی ${formatNumber(d.threshold)} عدد یا کمتر` : undefined}
      query={query}
      isEmpty={!d || d.items.length === 0}
      emptyText="موجودی همه‌ی کالاها کافی است."
      height={200}
    >
      <ul className="divide-y divide-line">
        {d?.items.map((item) => (
          <li key={item.variantId} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="truncate text-sm text-paper">{item.name}</p>
              <p className="mt-0.5 truncate text-xs text-muted">
                {item.attributes.map((a) => `${a.name}: ${a.value}`).join("، ")}
              </p>
            </div>
            {item.stock <= 0 ? (
              <Badge tone="danger">ناموجود</Badge>
            ) : (
              <Badge tone="warning">{formatNumber(item.stock)} عدد</Badge>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  );
};

// ---------- آخرین سفارش‌ها ----------
export const RecentOrdersCard = () => {
  const query = useRecentOrders();
  const orders = query.data ?? [];

  return (
    <Panel
      title="آخرین سفارش‌ها"
      query={query}
      isEmpty={orders.length === 0}
      emptyText="هنوز سفارشی ثبت نشده است."
      height={200}
    >
      <ul className="divide-y divide-line">
        {orders.map((order) => (
          <li key={order._id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm text-paper">
                {/* TODO: بعد از ساخت صفحه‌ی سفارش‌های ادمین به همون صفحه لینک بشه */}
                <Link
                  to={`/orders/${order._id}`}
                  target="_blank"
                  rel="noreferrer"
                  dir="ltr"
                  className="transition-colors hover:text-bronze"
                >
                  {order.orderNumber}
                </Link>
                {order.stockIssue && (
                  <span title="کمبود موجودی">
                    <AlertTriangle className="h-3.5 w-3.5 text-danger" />
                  </span>
                )}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted">
                {order.shippingAddress?.fullName || order.user?.phone} ، {formatDateTime(order.createdAt)}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-sm text-bronze">{formatToman(order.totalAmount)}</span>
              <StatusBadge status={order.status} />
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
};