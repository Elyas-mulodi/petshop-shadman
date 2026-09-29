const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC = "٠١٢٣٤٥٦٧٨٩";

// تبدیل ارقام فارسی و عربی به انگلیسی (کاربر ایرانی معمولاً با کیبورد فارسی تایپ می‌کنه)
export const normalizeDigits = (value = "") =>
  value
    .replace(/[۰-۹]/g, (d) => String(PERSIAN.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC.indexOf(d)));

export const toPersianDigits = (value) => String(value).replace(/\d/g, (d) => PERSIAN[d]);

// استخراج پیام خطا از پاسخ بک‌اند
export const parseApiError = (err) => {
  const data = err?.response?.data;

  if (data?.errors) {
    const first = Object.values(data.errors)[0];
    return { message: first || data.message };
  }
  if (data?.message) return { message: data.message };
  if (err?.request) return { message: "ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید." };

  return { message: "خطایی رخ داد. دوباره تلاش کنید." };
};