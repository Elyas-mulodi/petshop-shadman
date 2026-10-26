const TEHRAN_OFFSET = "+03:30"; // ایران ساعت تابستانی نداره
export const TEHRAN_TZ = "Asia/Tehran";
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RANGE_DAYS = 366;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export const isDayString = (value) =>
  typeof value === "string" && DAY_RE.test(value);

// "2026-10-24" ← شروع یا پایانِ همان روز به وقت تهران
export const tehranDayBoundary = (day, end = false) => {
  const time = end ? "23:59:59.999" : "00:00:00.000";
  const date = new Date(`${day}T${time}${TEHRAN_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date;
};

// فیلتر آماده برای ‏createdAt‏ و امثالش؛ اگه هیچ‌کدوم معتبر نبود null
export const buildDateFilter = (from, to) => {
  const range = {};
  if (isDayString(from)) {
    const d = tehranDayBoundary(from);
    if (d) range.$gte = d;
  }
  if (isDayString(to)) {
    const d = tehranDayBoundary(to, true);
    if (d) range.$lte = d;
  }
  return Object.keys(range).length ? range : null;
};

// ---------- روزهای تهران ----------
const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TEHRAN_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const toTehranDay = (date) => dayFormatter.format(date); // "2026-10-24"

const dayToNoon = (day) => new Date(`${day}T12:00:00${TEHRAN_OFFSET}`);

export const addDays = (day, count) =>
  toTehranDay(new Date(dayToNoon(day).getTime() + count * DAY_MS));

export const listDays = (fromDay, toDay) => {
  const days = [];
  for (
    let d = fromDay;
    d <= toDay && days.length < MAX_RANGE_DAYS + 1;
    d = addDays(d, 1)
  ) {
    days.push(d);
  }
  return days;
};

// بازه‌ی گزارش (پیش‌فرض ۳۰ روز اخیر، حداکثر ۳۶۶ روز) و بازه‌ی قبلیِ هم‌اندازه برای مقایسه
export const resolveRange = ({ from, to } = {}) => {
  const today = toTehranDay(new Date());

  let toDay = isDayString(to) && tehranDayBoundary(to) ? to : today;
  let fromDay =
    isDayString(from) && tehranDayBoundary(from) ? from : addDays(toDay, -29);
  if (fromDay > toDay) [fromDay, toDay] = [toDay, fromDay];

  let days = Math.round((dayToNoon(toDay) - dayToNoon(fromDay)) / DAY_MS) + 1;
  if (days > MAX_RANGE_DAYS) {
    fromDay = addDays(toDay, -(MAX_RANGE_DAYS - 1));
    days = MAX_RANGE_DAYS;
  }

  const prevToDay = addDays(fromDay, -1);
  const prevFromDay = addDays(fromDay, -days);

  return {
    fromDay,
    toDay,
    days,
    from: tehranDayBoundary(fromDay),
    to: tehranDayBoundary(toDay, true),
    previous: {
      fromDay: prevFromDay,
      toDay: prevToDay,
      from: tehranDayBoundary(prevFromDay),
      to: tehranDayBoundary(prevToDay, true),
    },
  };
};

// ---------- تجمیع نمودار: روزانه، هفتگی (شروع از شنبه)، ماهانه (ماه شمسی) ----------
const jalaliFormatter = new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn", {
  timeZone: TEHRAN_TZ,
  year: "numeric",
  month: "numeric",
});

export const jalaliMonthKey = (day) => {
  const parts = jalaliFormatter.formatToParts(dayToNoon(day));
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  return `${year}-${month}`;
};

export const weekStart = (day) => {
  const dow = dayToNoon(day).getUTCDay(); // ۰=یکشنبه ... ۶=شنبه
  return addDays(day, -((dow + 1) % 7));
};

export const pickGranularity = (requested, daysCount) => {
  if (["day", "week", "month"].includes(requested)) return requested;
  if (daysCount <= 45) return "day";
  if (daysCount <= 210) return "week";
  return "month";
};

// daily: [{ date: "YYYY-MM-DD", ...fields }] به ترتیب صعودی و بدون روز جاافتاده
export const bucketize = (daily, granularity, fields) => {
  if (granularity === "day") return daily.map((entry) => ({ ...entry }));

  const buckets = new Map();

  for (const entry of daily) {
    const key =
      granularity === "week"
        ? weekStart(entry.date)
        : jalaliMonthKey(entry.date);
    let bucket = buckets.get(key);

    if (!bucket) {
      bucket = { date: granularity === "week" ? key : entry.date };
      fields.forEach((field) => {
        bucket[field] = 0;
      });
      buckets.set(key, bucket);
    }

    fields.forEach((field) => {
      bucket[field] += entry[field];
    });
  }

  return [...buckets.values()];
};
