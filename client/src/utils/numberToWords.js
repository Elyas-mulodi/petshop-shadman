const ONES = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
const TEENS = ["ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"];
const TENS = ["", "", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
const HUNDREDS = ["", "صد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];
const SCALES = ["", "هزار", "میلیون", "میلیارد", "تریلیون"];

const threeDigits = (n) => {
  const parts = [];
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;

  if (hundreds) parts.push(HUNDREDS[hundreds]);

  if (rest >= 20) {
    parts.push(TENS[Math.floor(rest / 10)]);
    if (rest % 10) parts.push(ONES[rest % 10]);
  } else if (rest >= 10) {
    parts.push(TEENS[rest - 10]);
  } else if (rest > 0) {
    parts.push(ONES[rest]);
  }

  return parts.join(" و ");
};

export const numberToPersianWords = (value) => {
  let n = Math.floor(Math.abs(Number(value)));
  if (!Number.isFinite(n)) return "";
  if (n === 0) return "صفر";

  const groups = [];
  while (n > 0) {
    groups.push(n % 1000);
    n = Math.floor(n / 1000);
  }
  if (groups.length > SCALES.length) return "";

  const words = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] === 0) continue;
    const text = threeDigits(groups[i]);
    words.push(SCALES[i] ? `${text} ${SCALES[i]}` : text);
  }

  return words.join(" و ");
};