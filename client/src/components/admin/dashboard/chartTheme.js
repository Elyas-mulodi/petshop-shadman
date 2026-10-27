import { toPersianDigits } from "../../../utils/authHelpers";

// همان رنگ‌های تم سایت (SVG بهتره رنگ ثابت بگیره)
export const COLORS = {
  bronze: "#b08850",
  sage: "#6b7b6e",
  paper: "#edeae3",
  muted: "#b9b6ae",
  line: "#2e3235",
  well: "#262a2d",
  card: "#1f2225",
  danger: "#e0826f",
};

export const STATUS_COLORS = {
  pending_payment: "#8a6b3b",
  paid: "#b08850",
  processing: "#d4b98c",
  shipped: "#8fa597",
  delivered: "#6b7b6e",
  cancelled: "#e0826f",
  returned: "#a35a4a",
  expired: "#5b5f61",
};

export const AXIS = {
  stroke: COLORS.line,
  tick: { fill: COLORS.muted, fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: COLORS.line },
};

export const formatNumber = (value) => toPersianDigits(Math.round(value).toLocaleString("en-US"));

const faDecimal = (value) => toPersianDigits(String(value).replace(".", "٫"));

// ۱۲٫۵ میلیون، ۳۰۰ هزار، ...
export const compactToman = (value) => {
  const abs = Math.abs(value);
  const round = (x) => Number(x.toFixed(1));
  if (abs >= 1e9) return `${faDecimal(round(value / 1e9))} میلیارد`;
  if (abs >= 1e6) return `${faDecimal(round(value / 1e6))} میلیون`;
  if (abs >= 1e3) return `${faDecimal(round(value / 1e3))} هزار`;
  return faDecimal(Math.round(value));
};

export const formatPercent = (value) => `${toPersianDigits(value)}٪`;