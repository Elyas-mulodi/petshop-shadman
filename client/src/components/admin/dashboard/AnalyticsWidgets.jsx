import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { PawPrint } from "lucide-react";
import { Panel, Segmented } from "./Panel";
import { BarList, ChartFrame, ChartTooltip, DonutChart } from "./charts";
import {
  AXIS,
  COLORS,
  STATUS_COLORS,
  compactToman,
  formatNumber,
  formatPercent,
} from "./chartTheme";
import {
  useBrands,
  useCategories,
  useCustomers,
  useDiscounts,
  useFunnel,
  useGeo,
  usePatterns,
  useStatusBreakdown,
  useTopProducts,
} from "../../../features/admin/dashboard/useDashboard";
import { ORDER_STATUS } from "../../../utils/orderStatus";
import { getImageUrl } from "../../../utils/imageUrl";
import { formatToman } from "../../../utils/price";
import { formatBucketFull, formatBucketTick } from "../../../utils/tehranDate";
import { toPersianDigits } from "../../../utils/authHelpers";

const money = (v) => `${compactToman(v)} تومان`;
const count = (v) => `${formatNumber(v)} عدد`;

// ---------- وضعیت سفارش‌ها ----------
export const StatusCard = ({ range }) => {
  const query = useStatusBreakdown(range);
  const data = (query.data?.items ?? [])
    .filter((i) => i.count > 0)
    .map((i) => ({
      key: i.status,
      name: ORDER_STATUS[i.status]?.label ?? i.status,
      value: i.count,
      color: STATUS_COLORS[i.status],
    }));

  return (
    <Panel
      title="وضعیت سفارش‌ها"
      subtitle="سفارش‌های ثبت‌شده در بازه"
      query={query}
      isEmpty={data.length === 0}
      emptyText="در این بازه سفارشی ثبت نشده است."
      height={180}
    >
      <DonutChart
        data={data}
        centerValue={formatNumber(query.data?.total ?? 0)}
        centerLabel="سفارش"
      />
    </Panel>
  );
};

// ---------- قیف پرداخت ----------
export const FunnelCard = ({ range }) => {
  const query = useFunnel(range);
  const d = query.data;
  const percentOfCreated = (v) =>
    d?.created ? formatPercent(Math.round((v / d.created) * 100)) : "—";

  return (
    <Panel
      title="قیف پرداخت"
      subtitle="از ثبت سفارش تا پرداخت موفق"
      query={query}
      isEmpty={!d || d.created === 0}
      emptyText="در این بازه سفارشی ثبت نشده است."
      height={180}
    >
      {d && (
        <>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs text-muted">نرخ تبدیل به پرداخت</p>
              <p className="mt-1 font-display text-3xl font-bold text-bronze">
                {formatPercent(d.conversionRate)}
              </p>
            </div>
            {d.pending > 0 && (
              <p className="max-w-[10rem] text-left text-[11px] leading-5 text-muted">
                {formatNumber(d.pending)} سفارش هنوز فرصت پرداخت دارد و در نرخ
                حساب نشده است.
              </p>
            )}
          </div>

          <BarList
            max={d.created}
            formatValue={formatNumber}
            items={[
              {
                key: "created",
                label: "سفارش ثبت‌شده",
                value: d.created,
                color: COLORS.bronze,
              },
              {
                key: "paid",
                label: "پرداخت‌شده",
                value: d.paid,
                color: COLORS.sage,
                sub: `${percentOfCreated(d.paid)} از سفارش‌ها`,
              },
              {
                key: "abandoned",
                label: "رهاشده",
                value: d.abandoned,
                color: COLORS.danger,
                sub: `${percentOfCreated(d.abandoned)} از سفارش‌ها`,
              },
            ]}
          />
        </>
      )}
    </Panel>
  );
};

// ---------- پرفروش‌ترین محصولات ----------
export const TopProductsCard = ({ range }) => {
  const [metric, setMetric] = useState("revenue");
  const query = useTopProducts(range, metric);
  const items = query.data?.items ?? [];

  return (
    <Panel
      title="پرفروش‌ترین محصولات"
      subtitle="مبلغ فروش کالا (بدون هزینه‌ی ارسال و تخفیف سفارش)"
      query={query}
      isEmpty={items.length === 0}
      emptyText="در این بازه فروشی ثبت نشده است."
      height={240}
      actions={
        <Segmented
          value={metric}
          onChange={setMetric}
          ariaLabel="معیار رتبه‌بندی"
          options={[
            { id: "revenue", label: "مبلغ" },
            { id: "quantity", label: "تعداد" },
          ]}
        />
      }
    >
      <BarList
        formatValue={metric === "revenue" ? money : count}
        items={items.map((item) => {
          const image = getImageUrl(item.image);
          return {
            key: item._id,
            label: item.name,
            value: item[metric],
            sub:
              metric === "revenue" ? count(item.quantity) : money(item.revenue),
            leading: image ? (
              <img
                src={image}
                alt=""
                loading="lazy"
                className="h-8 w-8 shrink-0 rounded-md object-cover"
              />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-well">
                <PawPrint className="h-4 w-4 text-sage" strokeWidth={1.4} />
              </span>
            ),
          };
        })}
      />
    </Panel>
  );
};

// ---------- فروش به تفکیک دسته‌بندی و برند ----------
const TOP_N = 7;

export const BreakdownCard = ({ range }) => {
  const [tab, setTab] = useState("categories");
  const categories = useCategories(range, tab === "categories");
  const brands = useBrands(range, tab === "brands");
  const query = tab === "categories" ? categories : brands;
  const rows = query.data?.items ?? [];

  const rest = rows.slice(TOP_N).reduce((sum, r) => sum + r.revenue, 0);
  const items = [
    ...rows.slice(0, TOP_N).map((r) => ({
      key: r._id,
      label: r.name,
      value: r.revenue,
      sub: count(r.quantity),
    })),
    ...(rest > 0
      ? [{ key: "other", label: "سایر", value: rest, color: COLORS.muted }]
      : []),
  ];

  return (
    <Panel
      title="فروش به تفکیک دسته و برند"
      subtitle={
        tab === "categories"
          ? "محصول با چند زیردسته، بین آن‌ها مساوی تقسیم می‌شود"
          : undefined
      }
      query={query}
      isEmpty={items.length === 0}
      emptyText="در این بازه فروشی ثبت نشده است."
      height={240}
      actions={
        <Segmented
          value={tab}
          onChange={setTab}
          ariaLabel="نوع تفکیک"
          options={[
            { id: "categories", label: "دسته‌بندی" },
            { id: "brands", label: "برند" },
          ]}
        />
      }
    >
      <BarList items={items} formatValue={money} color={COLORS.sage} />
    </Panel>
  );
};

// ---------- مشتریان ----------
const MiniStat = ({ label, value }) => (
  <div className="rounded-xl border border-line bg-ink px-3 py-2.5">
    <p className="font-display text-lg font-bold text-paper">{value}</p>
    <p className="mt-0.5 text-[11px] text-muted">{label}</p>
  </div>
);

export const CustomersCard = ({ range }) => {
  const query = useCustomers(range);
  const d = query.data;
  const gran = d?.registrations.granularity ?? "day";
  const points = d?.registrations.points ?? [];
  const newPct = d?.buyers ? Math.round((d.newBuyers / d.buyers) * 100) : 0;

  return (
    <Panel
      title="مشتریان"
      subtitle="خریداران بازه و ثبت‌نام‌های جدید"
      query={query}
      height={320}
    >
      {d && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="خریدار" value={formatNumber(d.buyers)} />
            <MiniStat label="خریدار جدید" value={formatNumber(d.newBuyers)} />
            <MiniStat
              label="خریدار تکراری"
              value={formatNumber(d.returningBuyers)}
            />
            <MiniStat
              label="سفارش به ازای هر خریدار"
              value={toPersianDigits(
                String(d.ordersPerBuyer).replace(".", "٫"),
              )}
            />{" "}
          </div>

          {d.buyers > 0 && (
            <div className="mt-4">
              <div className="flex h-2 overflow-hidden rounded-full bg-well">
                <div
                  className="h-full bg-bronze"
                  style={{ width: `${newPct}%` }}
                />
                <div
                  className="h-full bg-sage"
                  style={{ width: `${100 - newPct}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-muted">
                <span>جدید {formatPercent(newPct)}</span>
                <span>تکراری {formatPercent(100 - newPct)}</span>
              </div>
            </div>
          )}

          <p className="mb-2 mt-6 text-xs text-muted">ثبت‌نام‌های جدید</p>
          <ChartFrame height={140}>
            <BarChart
              data={points}
              margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="date"
                reversed
                minTickGap={28}
                tickFormatter={(day) => formatBucketTick(day, gran)}
                {...AXIS}
              />
              <Tooltip
                cursor={{ fill: COLORS.well }}
                content={(props) => (
                  <ChartTooltip
                    {...props}
                    render={(payload, label) => ({
                      title: formatBucketFull(label, gran),
                      rows: [
                        {
                          label: "ثبت‌نام جدید",
                          value: formatNumber(payload[0].value),
                        },
                      ],
                    })}
                  />
                )}
              />
              <Bar
                dataKey="count"
                fill={COLORS.sage}
                radius={[3, 3, 0, 0]}
                maxBarSize={24}
              />
            </BarChart>
          </ChartFrame>
        </>
      )}
    </Panel>
  );
};

// ---------- هزینه‌ی تخفیف‌ها ----------
export const DiscountsCard = ({ range }) => {
  const query = useDiscounts(range);
  const d = query.data;
  const totalAmount = d ? d.coupon.amount + d.loyalty.amount : 0;
  const totalOrders = d
    ? d.coupon.orders + d.loyalty.orders + d.none.orders
    : 0;

  return (
    <Panel
      title="هزینه‌ی تخفیف‌ها"
      subtitle="سفارش‌های پرداخت‌شده‌ی بازه"
      query={query}
      isEmpty={!d || totalOrders === 0}
      emptyText="در این بازه فروشی ثبت نشده است."
      height={240}
    >
      {d && (
        <>
          <p className="mb-5 font-display text-2xl font-bold text-paper">
            {formatNumber(totalAmount)}
            <span className="mr-1 text-[11px] font-normal text-muted">
              تومان تخفیف داده شد
            </span>
          </p>

          {totalAmount > 0 ? (
            <BarList
              formatValue={(v) => `${formatNumber(v)} تومان`}
              items={[
                {
                  key: "coupon",
                  label: "کد تخفیف",
                  value: d.coupon.amount,
                  color: COLORS.bronze,
                  sub: `${formatNumber(d.coupon.orders)} سفارش`,
                },
                {
                  key: "loyalty",
                  label: "تخفیف وفاداری",
                  value: d.loyalty.amount,
                  color: COLORS.sage,
                  sub: `${formatNumber(d.loyalty.orders)} سفارش`,
                },
              ]}
            />
          ) : (
            <p className="text-sm text-muted">
              در این بازه تخفیفی استفاده نشده است.
            </p>
          )}

          <p className="mt-4 text-xs text-muted">
            {formatNumber(d.none.orders)} سفارش بدون تخفیف ثبت شده است.
          </p>

          {d.topCoupons.length > 0 && (
            <div className="mt-5 border-t border-line pt-4">
              <p className="mb-2 text-xs text-muted">پراستفاده‌ترین کدها</p>
              <ul className="space-y-1.5">
                {d.topCoupons.map((c) => (
                  <li
                    key={c.code}
                    className="flex items-center justify-between text-sm"
                  >
                    <span dir="ltr" className="text-paper">
                      {c.code}
                    </span>
                    <span className="text-muted">
                      {formatNumber(c.orders)} بار، {formatNumber(c.amount)}{" "}
                      تومان
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </Panel>
  );
};

// ---------- ساعت و روز پرفروش ----------
export const PatternsCard = ({ range }) => {
  const [tab, setTab] = useState("hours");
  const query = usePatterns(range);
  const d = query.data;

  const data =
    tab === "hours"
      ? (d?.hours ?? []).map((h) => ({
          key: h.hour,
          label: formatNumber(h.hour),
          title: `ساعت ${formatNumber(h.hour)} تا ${formatNumber(h.hour + 1)}`,
          orders: h.orders,
          revenue: h.revenue,
        }))
      : (d?.weekdays ?? []).map((w) => ({
          key: w.label,
          label: w.label,
          title: w.label,
          orders: w.orders,
          revenue: w.revenue,
        }));

  const hasData = data.some((x) => x.orders > 0);
  const peak = data.reduce(
    (best, x) => (!best || x.orders > best.orders ? x : best),
    null,
  );

  return (
    <Panel
      title="الگوی فروش"
      subtitle="تعداد سفارش‌های پرداخت‌شده به وقت تهران"
      query={query}
      isEmpty={!hasData}
      emptyText="در این بازه فروشی ثبت نشده است."
      height={220}
      actions={
        <Segmented
          value={tab}
          onChange={setTab}
          ariaLabel="نوع الگو"
          options={[
            { id: "hours", label: "ساعت روز" },
            { id: "weekdays", label: "روز هفته" },
          ]}
        />
      }
    >
      <ChartFrame height={220}>
        <BarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid
            vertical={false}
            stroke={COLORS.line}
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="label"
            reversed
            interval={tab === "hours" ? 1 : 0}
            {...AXIS}
          />
          <YAxis
            orientation="right"
            allowDecimals={false}
            width={32}
            {...AXIS}
          />
          <Tooltip
            cursor={{ fill: COLORS.well }}
            content={(props) => (
              <ChartTooltip
                {...props}
                render={(payload) => {
                  const p = payload[0].payload;
                  return {
                    title: p.title,
                    rows: [
                      { label: "سفارش", value: formatNumber(p.orders) },
                      { label: "درآمد", value: formatToman(p.revenue) },
                    ],
                  };
                }}
              />
            )}
          />
          <Bar
            dataKey="orders"
            fill={COLORS.bronze}
            radius={[3, 3, 0, 0]}
            maxBarSize={22}
          />
        </BarChart>
      </ChartFrame>

      {peak && peak.orders > 0 && (
        <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
          پرفروش‌ترین {tab === "hours" ? "ساعت" : "روز"}:{" "}
          <span className="text-paper">{peak.title}</span> با{" "}
          {formatNumber(peak.orders)} سفارش
        </p>
      )}
    </Panel>
  );
};

// ---------- فروش به تفکیک استان ----------
export const GeoCard = ({ range }) => {
  const query = useGeo(range);
  const items = query.data?.items ?? [];

  return (
    <Panel
      title="فروش به تفکیک استان"
      subtitle="بر اساس استان آدرس تحویل"
      query={query}
      isEmpty={items.length === 0}
      emptyText="در این بازه فروشی ثبت نشده است."
      height={240}
    >
      <BarList
        formatValue={money}
        color={COLORS.sage}
        items={items.map((item) => ({
          key: item.province,
          label: item.province,
          value: item.revenue,
          sub: `${formatNumber(item.orders)} سفارش`,
        }))}
      />
    </Panel>
  );
};
