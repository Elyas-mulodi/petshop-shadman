import { Clock } from "lucide-react";
import { useNow } from "../../hooks/useNow";
import { toPersianDigits } from "../../utils/authHelpers";

const pad = (n) => String(n).padStart(2, "0");

export const splitRemaining = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    done: total === 0,
    total,
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
};

// چهار خانه‌ی بزرگ برای پوستر
export const CountdownBoxes = ({ endDate }) => {
  const now = useNow(1000);
  const t = splitRemaining(new Date(endDate).getTime() - now);
  const cells = [
    ["روز", t.days],
    ["ساعت", t.hours],
    ["دقیقه", t.minutes],
    ["ثانیه", t.seconds],
  ];

  return (
    <div role="timer" aria-label="زمان باقی‌مانده تا پایان تخفیف" className="grid grid-cols-4 gap-2 sm:gap-3">
      {cells.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-line bg-ink px-2 py-3 text-center sm:py-4">
          <p dir="ltr" className="font-display text-2xl font-bold tabular-nums text-paper sm:text-3xl">
            {toPersianDigits(pad(value))}
          </p>
          <p className="mt-1 text-[11px] text-muted">{label}</p>
        </div>
      ))}
    </div>
  );
};

// نسخه‌ی فشرده برای کارت‌ها؛ زیر یک ساعت قرمز می‌شه
export const CountdownChip = ({ endDate, className = "" }) => {
  const now = useNow(1000);
  const t = splitRemaining(new Date(endDate).getTime() - now);
  const urgent = t.total < 3600;

  const text =
    t.days > 0
      ? `${toPersianDigits(t.days)} روز و ${toPersianDigits(pad(t.hours))}:${toPersianDigits(pad(t.minutes))}`
      : `${toPersianDigits(pad(t.hours))}:${toPersianDigits(pad(t.minutes))}:${toPersianDigits(pad(t.seconds))}`;

  return (
    <span
      role="timer"
      aria-label="زمان باقی‌مانده تا پایان تخفیف"
      className={`inline-flex items-center gap-1.5 text-xs ${urgent ? "text-danger" : "text-muted"} ${className}`}
    >
      <Clock className="h-3.5 w-3.5" />
      <span dir="ltr" className="tabular-nums">
        {text}
      </span>
    </span>
  );
};

export const TimeProgress = ({ startMs, endMs }) => {
  const now = useNow(30_000);
  if (!startMs || !Number.isFinite(endMs) || endMs <= startMs) return null;

  const elapsed = Math.min(1, Math.max(0, (now - startMs) / (endMs - startMs)));

  return (
    <div className="h-1 overflow-hidden rounded-full bg-well" aria-hidden>
      <div
        className={`h-full rounded-full ${elapsed > 0.85 ? "bg-danger" : "bg-bronze"}`}
        style={{ width: `${Math.max(4, (1 - elapsed) * 100)}%` }}
      />
    </div>
  );
};