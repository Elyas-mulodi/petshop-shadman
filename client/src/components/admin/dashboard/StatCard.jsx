import { ArrowDown, ArrowUp } from "lucide-react";
import { formatPercent } from "./chartTheme";

const Delta = ({ delta, neutral }) => {
  if (delta === null || delta === undefined) {
    return (
      <span className="text-[11px] text-muted" title="بازه‌ی قبلی داده‌ای نداشت">
        —
      </span>
    );
  }

  if (delta === 0) return <span className="text-[11px] text-muted">بدون تغییر</span>;

  const up = delta > 0;
  const tone = neutral ? "text-muted" : up ? "text-sage" : "text-danger";
  const Icon = up ? ArrowUp : ArrowDown;

  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${tone}`}>
      <Icon className="h-3 w-3" />
      {formatPercent(Math.abs(delta))}
    </span>
  );
};

const StatCard = ({ label, value, unit, delta, neutral = false, loading = false }) => (
  <div className="rounded-2xl border border-line bg-card p-4">
    <p className="text-xs text-muted">{label}</p>
    {loading ? (
      <div className="mt-3 h-7 w-3/4 animate-pulse rounded-md bg-well" />
    ) : (
      <>
        <p className="mt-2 font-display text-xl font-bold text-paper md:text-2xl">
          {value}
          {unit && <span className="mr-1 text-[11px] font-normal text-muted">{unit}</span>}
        </p>
        <p className="mt-2 flex items-center gap-1.5">
          <Delta delta={delta} neutral={neutral} />
          <span className="text-[11px] text-muted">نسبت به بازه‌ی قبل</span>
        </p>
      </>
    )}
  </div>
);

export default StatCard;