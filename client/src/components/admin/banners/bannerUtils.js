export const SLOT_LABELS = {
  main: "تایل اصلی هیرو",
  tall: "تایل بلند هیرو",
  square: "تایل مربعی هیرو",
  info: "تایل کوچک هیرو",
  promo: "بنر میان‌صفحه",
  section: "عنوان بخش‌های صفحه",
};

export const SLOT_HINTS = {
  main: "تیتر و دکمه‌ی بزرگ هیرو؛ عکس پس‌زمینه اختیاری است.",
  tall: "تصویر بلند کنار تایل اصلی (مثلاً دسته‌ی سگ‌ها).",
  square: "تصویر مربعی بالای ستون آخر (مثلاً دسته‌ی گربه‌ها).",
  info: "تایل کوچک پایین ستون آخر (مثلاً ارسال رایگان).",
  promo: "بنر بزرگ بین بخش‌های صفحه‌ی اصلی: متن، عکس و یک چیپ شناور.",
  section: "عنوان، توضیح و عکس پس‌زمینه‌ی یکی از بخش‌های صفحه‌ی اصلی (مثلاً «جدیدترین محصولات»).",
};

// ⚠️ کلید هر بخش صفحه‌ی خانه: همان کلیدی که توی Home.jsx به Section میدی (bannerKey) باید با این‌ها یکی باشه
// این‌ها دقیقاً همون بخش‌هایی‌ان که الان توی Home.jsx وجود دارن
export const SECTION_KEYS = [
  { key: "categories", label: "دسته‌بندی‌ها" },
  { key: "latest", label: "جدیدترین محصولات" },
  { key: "discounts", label: "تخفیف‌های ویژه" },
];

export const SLOTS = Object.keys(SLOT_LABELS);
export const IMAGE_SLOTS = ["tall", "square", "promo"]; // عکس الزامی
export const OPTIONAL_IMAGE_SLOTS = ["main", "section"]; // عکس پس‌زمینه‌ی اختیاری
export const ALL_IMAGE_SLOTS = [...IMAGE_SLOTS, ...OPTIONAL_IMAGE_SLOTS];
export const TEXT_SLOTS = ["main", "promo", "section"];
export const EYEBROW_SLOTS = ["main", "promo"];

// وضعیت واقعی نمایش بنر (فعال بودن + بازه‌ی زمان‌بندی)
export function getBannerStatus(banner, now = Date.now()) {
  if (!banner.isActive) return { label: "غیرفعال", live: false };
  if (banner.startsAt && new Date(banner.startsAt).getTime() > now) return { label: "زمان‌بندی‌شده", live: false };
  if (banner.endsAt && new Date(banner.endsAt).getTime() < now) return { label: "منقضی‌شده", live: false };
  return { label: "در حال نمایش", live: true };
}

// ISO <-> مقدار input از نوع datetime-local (به وقت محلی)
export function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function fromLocalInput(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// هماهنگ با BannerValidation.js: مسیر داخلی یا https
export const isValidLink = (value) =>
  (value.startsWith("/") && !value.startsWith("//")) || /^https:\/\//i.test(value);

export const emptyForm = (slot = "main") => ({
  slot,
  sectionKey: "",
  eyebrow: "",
  title: "",
  subtitle: "",
  ctaText: "",
  ctaLink: "",
  badge: "",
  image: "",
  imageMobile: "",
  focalX: 50,
  focalY: 50,
  overlay: 20,
  icon: "heart",
  order: "0",
  isActive: true,
  startsAt: "",
  endsAt: "",
});

export const formFromBanner = (b) => ({
  slot: b.slot,
  sectionKey: b.sectionKey ?? "",
  eyebrow: b.eyebrow ?? "",
  title: b.title ?? "",
  subtitle: b.subtitle ?? "",
  ctaText: b.ctaText ?? "",
  ctaLink: b.ctaLink ?? "",
  badge: b.badge ?? "",
  image: b.image ?? "",
  imageMobile: b.imageMobile ?? "",
  focalX: b.focalPoint?.x ?? 50,
  focalY: b.focalPoint?.y ?? 50,
  overlay: b.overlay ?? 20,
  icon: b.icon ?? "heart",
  order: String(b.order ?? 0),
  isActive: b.isActive,
  startsAt: toLocalInput(b.startsAt),
  endsAt: toLocalInput(b.endsAt),
});

// فقط فیلدهای مربوط به تایل انتخاب‌شده فرستاده میشن؛ بقیه پاک میشن
export function payloadFromForm(form) {
  const text = TEXT_SLOTS.includes(form.slot);
  const hasImage = ALL_IMAGE_SLOTS.includes(form.slot);
  const promo = form.slot === "promo";
  const title = form.title.trim();
  const ctaText = text ? form.ctaText.trim() : "";
  const badge = promo ? form.badge.trim() : "";

  return {
    slot: form.slot,
    sectionKey: form.slot === "section" ? form.sectionKey : "",
    title,
    eyebrow: EYEBROW_SLOTS.includes(form.slot) ? form.eyebrow.trim() : "",
    subtitle: text ? form.subtitle.trim() : "",
    ctaText,
    ctaLink: text && !ctaText ? "" : form.ctaLink.trim(),
    badge,
    image: hasImage ? form.image || null : null,
    imageMobile: hasImage ? form.imageMobile || null : null,
    imageAlt: hasImage ? title : "",
    focalPoint: { x: form.focalX, y: form.focalY },
    overlay: Number(form.overlay),
    icon: form.slot === "info" || (promo && badge) ? form.icon : null,
    order: Number(form.order),
    isActive: form.isActive,
    startsAt: fromLocalInput(form.startsAt),
    endsAt: fromLocalInput(form.endsAt),
  };
}

export function validateBanner(form) {
  const errors = {};
  const title = form.title.trim();
  const link = form.ctaLink.trim();

  if (title.length < 2) errors.title = "عنوان را وارد کنید (حداقل ۲ حرف)";
  else if (title.length > 120) errors.title = "عنوان خیلی طولانی است";

  if (form.slot === "section" && !form.sectionKey) errors.sectionKey = "یک بخش را انتخاب کنید";

  if (TEXT_SLOTS.includes(form.slot)) {
    if (form.eyebrow.trim().length > 60) errors.eyebrow = "حداکثر ۶۰ کاراکتر";
    if (form.subtitle.trim().length > 300) errors.subtitle = "حداکثر ۳۰۰ کاراکتر";
    if (form.ctaText.trim().length > 40) errors.ctaText = "حداکثر ۴۰ کاراکتر";
    if (form.ctaText.trim() && !link) errors.ctaLink = "لینک را وارد کنید";
  }

  if (form.slot === "promo" && form.badge.trim().length > 40) errors.badge = "حداکثر ۴۰ کاراکتر";

  if (IMAGE_SLOTS.includes(form.slot) && !form.image) errors.image = "برای این تایل، تصویر الزامی است";
  if ((form.slot === "tall" || form.slot === "square") && !link) errors.ctaLink = "لینک تایل را وارد کنید";

  if (form.slot === "info" && !form.icon) errors.icon = "یک آیکون انتخاب کنید";
  if (link && !isValidLink(link)) errors.ctaLink = "لینک باید مسیر داخلی (مثل /products) یا آدرس کامل https باشد";

  const order = Number(form.order);
  if (form.order === "" || !Number.isInteger(order) || order < 0 || order > 1000) {
    errors.order = "ترتیب باید عدد صحیح بین ۰ تا ۱۰۰۰ باشد";
  }

  const start = fromLocalInput(form.startsAt);
  const end = fromLocalInput(form.endsAt);
  if (form.startsAt && !start) errors.startsAt = "زمان شروع معتبر نیست";
  if (form.endsAt && !end) errors.endsAt = "زمان پایان معتبر نیست";
  if (start && end && new Date(end) <= new Date(start)) errors.endsAt = "زمان پایان باید بعد از شروع باشد";

  return errors;
}