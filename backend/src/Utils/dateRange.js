const TEHRAN_OFFSET = "+03:30";
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export const isDayString = (value) =>
  typeof value === "string" && DAY_RE.test(value);

export const tehranDayBoundary = (day, end = false) => {
  const time = end ? "23:59:59.999" : "00:00:00.000";
  const date = new Date(`${day}T${time}${TEHRAN_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date;
};

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
