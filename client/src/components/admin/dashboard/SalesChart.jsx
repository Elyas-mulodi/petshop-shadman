import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { Panel, Segmented } from "./Panel";
import { ChartFrame, ChartTooltip } from "./charts";
import { AXIS, COLORS, compactToman, formatNumber } from "./chartTheme";
import { useSales } from "../../../features/admin/dashboard/useDashboard";
import { formatBucketFull, formatBucketTick } from "../../../utils/tehranDate";
import { formatToman } from "../../../utils/price";

const METRICS = {
  revenue: { label: "درآمد", format: formatToman, tick: compactToman },
  orders: { label: "تعداد سفارش", format: (v) => `${formatNumber(v)} سفارش`, tick: formatNumber },
  aov: { label: "میانگین سفارش", format: formatToman, tick: compactToman },
};

const METRIC_OPTIONS = Object.entries(METRICS).map(([id, m]) => ({ id, label: m.label }));

const GRANULARITY_OPTIONS = [
  { id: "auto", label: "خودکار" },
  { id: "day", label: "روزانه" },
  { id: "week", label: "هفتگی" },
  { id: "month", label: "ماهانه" },
];

const SalesChart = ({ range }) => {
  const [metric, setMetric] = useState("revenue");
  const [granularity, setGranularity] = useState("auto");
  const query = useSales(range, granularity);

  const points = query.data?.points ?? [];
  const gran = query.data?.granularity ?? "day";
  const m = METRICS[metric];
  const hasData = points.some((p) => p.revenue > 0 || p.orders > 0);

  const totalRevenue = points.reduce((sum, p) => sum + p.revenue, 0);
  const totalOrders = points.reduce((sum, p) => sum + p.orders, 0);
  const peak = points.reduce((best, p) => (!best || p[metric] > best[metric] ? p : best), null);

  const tooltip = (props) => (
    <ChartTooltip
      {...props}
      render={(payload, label) => {
        const p = payload[0].payload;
        return {
          title: formatBucketFull(label, gran),
          rows: [
            { label: "درآمد", value: formatToman(p.revenue), color: metric === "revenue" ? COLORS.bronze : undefined },
            { label: "سفارش", value: formatNumber(p.orders), color: metric === "orders" ? COLORS.bronze : undefined },
            { label: "میانگین سفارش", value: formatToman(p.aov), color: metric === "aov" ? COLORS.bronze : undefined },
          ],
        };
      }}
    />
  );

  const axes = [
    <CartesianGrid key="grid" vertical={false} stroke={COLORS.line} strokeDasharray="3 3" />,
    <XAxis
      key="x"
      dataKey="date"
      reversed
      minTickGap={28}
      tickFormatter={(d) => formatBucketTick(d, gran)}
      {...AXIS}
    />,
    <YAxis key="y" orientation="right" width={68} tickFormatter={m.tick} {...AXIS} />,
    <Tooltip key="tip" cursor={{ stroke: COLORS.muted, strokeDasharray: "3 3" }} content={tooltip} />,
  ];

  return (
    <Panel
      title="روند فروش"
      subtitle="بر اساس زمان پرداخت و به وقت تهران"
      query={query}
      isEmpty={!hasData}
      emptyText="در این بازه فروشی ثبت نشده است."
      height={300}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Segmented value={metric} onChange={setMetric} options={METRIC_OPTIONS} ariaLabel="معیار نمودار" />
          <Segmented value={granularity} onChange={setGranularity} options={GRANULARITY_OPTIONS} ariaLabel="بازه‌ی تجمیع" />
        </div>
      }
    >
      <ChartFrame height={300}>
        {metric === "orders" ? (
          <BarChart data={points} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
            {axes}
            <Bar dataKey="orders" fill={COLORS.bronze} radius={[3, 3, 0, 0]} maxBarSize={28} />
          </BarChart>
        ) : (
          <AreaChart data={points} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.bronze} stopOpacity={0.35} />
                <stop offset="100%" stopColor={COLORS.bronze} stopOpacity={0} />
              </linearGradient>
            </defs>
            {axes}
            <Area
              type="monotone"
              dataKey={metric}
              stroke={COLORS.bronze}
              strokeWidth={2}
              fill="url(#salesFill)"
              dot={false}
              activeDot={{ r: 4, fill: COLORS.bronze, stroke: COLORS.card, strokeWidth: 2 }}
            />
          </AreaChart>
        )}
      </ChartFrame>

      <div className="mt-5 grid grid-cols-1 gap-3 border-t border-line pt-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted">مجموع درآمد بازه</p>
          <p className="mt-1 text-paper">{formatToman(totalRevenue)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">مجموع سفارش‌ها</p>
          <p className="mt-1 text-paper">{formatNumber(totalOrders)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">بهترین دوره ({m.label})</p>
          <p className="mt-1 text-paper">
            {peak && peak[metric] > 0 ? `${formatBucketTick(peak.date, gran)}: ${m.format(peak[metric])}` : "—"}
          </p>
        </div>
      </div>
    </Panel>
  );
};

export default SalesChart;