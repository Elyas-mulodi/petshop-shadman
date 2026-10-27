// سلول‌هایی که با این کاراکترها شروع بشن، Excel به‌عنوان فرمول اجراشون می‌کنه (formula injection)
const DANGEROUS_START = /^[=+\-@\t\r]/;

export const csvCell = (value) => {
  if (value === null || value === undefined) return "";

  let text = String(value);
  if (typeof value !== "number" && DANGEROUS_START.test(text)) text = `'${text}`;

  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const csvRow = (cells) => `${cells.map(csvCell).join(",")}\r\n`;