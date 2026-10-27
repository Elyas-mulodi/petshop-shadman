const TZ = "Asia/Tehran";
const OFFSET = "+03:30";
const DAY_MS = 24 * 60 * 60 * 1000;

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const noon = (day) => new Date(`${day}T12:00:00${OFFSET}`);

export const todayTehran = () => dayFormatter.format(new Date()); // "2026-10-27"
export const addDays = (day, count) =>
  dayFormatter.format(new Date(noon(day).getTime() + count * DAY_MS));
export const isDay = (value) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(noon(value).getTime());

// fa-IR به‌صورت پیش‌فرض تقویم شمسی استفاده می‌کنه
const fmt = (options) => new Intl.DateTimeFormat("fa-IR", { timeZone: TZ, ...options });
const dayShort = fmt({ day: "numeric", month: "short" });
const dayLong = fmt({ day: "numeric", month: "long", year: "numeric" });
const dayFull = fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" });
const monthYear = fmt({ month: "long", year: "numeric" });

export const formatDayShort = (day) => dayShort.format(noon(day));
export const formatDayLong = (day) => dayLong.format(noon(day));

// عنوان محور و tooltip نمودارها بر اساس بازه‌ی تجمیع (روز، هفته، ماه)
export const formatBucketTick = (day, granularity) =>
  granularity === "month" ? monthYear.format(noon(day)) : dayShort.format(noon(day));

export const formatBucketFull = (day, granularity) => {
  if (granularity === "month") return monthYear.format(noon(day));
  if (granularity === "week") return `هفته‌ی ${dayShort.format(noon(day))}`;
  return dayFull.format(noon(day));
};