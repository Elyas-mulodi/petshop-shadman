import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "motion/react";
import { COLORS, formatNumber, formatPercent } from "./chartTheme";

const ease = [0.22, 1, 0.36, 1];

// Recharts در RTL جای متن‌ها رو بهم می‌ریزه؛ قاب LTR + محور reversed ظاهر RTL درست می‌ده
export const ChartFrame = ({ height = 260, children }) => (
  <div dir="ltr" className="w-full" style={{ height }}>
    <ResponsiveContainer width="100%" height="100%">
      {children}
    </ResponsiveContainer>
  </div>
);

export const ChartTooltip = ({ active, payload, label, render }) => {
  if (!active || !payload?.length) return null;
  const { title, rows } = render(payload, label);

  return (
    <div dir="rtl" className="rounded-lg border border-line bg-ink px-3 py-2 text-xs shadow-lg">
      {title && <p className="mb-1.5 font-medium text-paper">{title}</p>}
      {rows.map((row) => (
        <p key={row.label} className="flex items-center justify-between gap-4 text-muted">
          <span className="flex items-center gap-1.5">
            {row.color && <span className="h-2 w-2 rounded-full" style={{ background: row.color }} />}
            {row.label}
          </span>
          <span className="text-paper">{row.value}</span>
        </p>
      ))}
    </div>
  );
};

export const DonutChart = ({ data, centerValue, centerLabel, size = 180 }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative shrink-0" dir="ltr" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={data.length > 1 ? 2 : 0}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.key ?? d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              content={(props) => (
                <ChartTooltip
                  {...props}
                  render={(payload) => ({
                    title: payload[0].name,
                    rows: [
                      { label: "تعداد", value: formatNumber(payload[0].value) },
                      { label: "سهم", value: formatPercent(Math.round((payload[0].value / total) * 100)) },
                    ],
                  })}
                />
              )}
            />
          </PieChart>
        </ResponsiveContainer>

        <div dir="rtl" className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-xl font-bold text-paper">{centerValue}</span>
          <span className="text-[11px] text-muted">{centerLabel}</span>
        </div>
      </div>

      <ul className="w-full flex-1 space-y-2.5">
        {data.map((d) => (
          <li key={d.key ?? d.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-paper">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
              {d.name}
            </span>
            <span className="text-muted">
              {formatNumber(d.value)}
              <span className="mr-1.5 text-[11px]">({formatPercent(Math.round((d.value / total) * 100))})</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// لیست میله‌ای ساده (برای رتبه‌بندی‌ها)؛ بدون SVG، پس راست‌به‌چپ بودنش خودکار درسته
export const BarList = ({ items, formatValue, max, color = COLORS.bronze }) => {
  const top = max ?? Math.max(...items.map((i) => i.value), 1);

  return (
    <ul className="space-y-3.5">
      {items.map((item) => (
        <li key={item.key}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-paper">
              {item.leading}
              <span className="truncate">{item.label}</span>
            </span>
            <span className="shrink-0 text-muted">{formatValue(item.value)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-well">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (item.value / top) * 100)}%` }}
              transition={{ duration: 0.6, ease }}
              className="h-full rounded-full"
              style={{ background: item.color ?? color }}
            />
          </div>
          {item.sub && <p className="mt-1 text-[11px] text-muted">{item.sub}</p>}
        </li>
      ))}
    </ul>
  );
};