// تاریخ شمسی با ارقام فارسی (fa-IR به‌صورت پیش‌فرض تقویم شمسی استفاده می‌کنه)
const dateFormat = new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long", day: "numeric" });
const timeFormat = new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" });

export const formatDate = (value) => dateFormat.format(new Date(value));
export const formatDateTime = (value) => `${formatDate(value)}، ساعت ${timeFormat.format(new Date(value))}`;