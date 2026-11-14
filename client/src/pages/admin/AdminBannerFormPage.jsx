import { useMemo, useRef, useState } from "react";

import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import {
  CalendarClock,
  Image as ImageIcon,
  Layers,
  LayoutTemplate,
  Sparkles,
  Type,
} from "lucide-react";

import PageHeader from "../../components/admin/ui/PageHeader";

import ConfirmDialog from "../../components/admin/ui/ConfirmDialog";

import Button from "../../components/admin/ui/Button";

import { useToast } from "../../components/admin/ui/ToastProvider";

import { Card } from "../../components/profile/ProfileParts";

import { Field } from "../../components/auth/AuthParts";

import { TextAreaField } from "../../components/checkout/FormControls";

import ActiveSwitch from "../../components/admin/banners/ActiveSwitch";

import BannerImageField from "../../components/admin/banners/BannerImageField";

import BannerTilePreview from "../../components/admin/banners/BannerTilePreview";

import {
  ALL_IMAGE_SLOTS,
  EYEBROW_SLOTS,
  IMAGE_SLOTS,
  SECTION_KEYS,
  SLOTS,
  SLOT_HINTS,
  SLOT_LABELS,
  TEXT_SLOTS,
  emptyForm,
  formFromBanner,
  payloadFromForm,
  validateBanner,
} from "../../components/admin/banners/bannerUtils";

import {
  useAdminBanner,
  useCreateBanner,
  useUpdateBanner,
} from "../../features/admin/banners/useAdminBanners";

import { BANNER_ICON_LABELS, BANNER_ICON_MAP } from "../../utils/bannerIcons";

import { parseApiError, toPersianDigits } from "../../utils/authHelpers";
import BannerPreviewPanel from "../../components/admin/banners/BannerPreviewPanel";

const dateInput =
  "w-full rounded-lg border border-line bg-card px-3 py-2.5 text-sm text-paper [color-scheme:dark] focus:border-bronze focus:outline-none";

// نسبت ابعاد هر تایل توی هیرو، برای پیش‌نمایش

const PREVIEW_ASPECT = {
  main: "aspect-[4/3]",

  tall: "aspect-[2/3]",

  square: "aspect-[4/3]",

  info: "aspect-[4/3]",

  promo: "aspect-[16/10]",

  section: "aspect-[16/7]",
};

const TITLE_LABEL = {
  main: "تیتر",

  promo: "تیتر",

  section: "عنوان بخش",

  info: "متن تایل",

  tall: "برچسب روی تایل",

  square: "برچسب روی تایل",
};

const LINK_LABEL = {
  main: "لینک دکمه",

  promo: "لینک دکمه",

  section: "لینک «مشاهده همه» (اختیاری)",

  info: "لینک (اختیاری)",

  tall: "لینک تایل",

  square: "لینک تایل",
};

const BannerForm = ({ banner, defaultSlot }) => {
  const navigate = useNavigate();

  const toast = useToast();

  const create = useCreateBanner();

  const update = useUpdateBanner();

  const isEdit = Boolean(banner);

  const [form, setForm] = useState(() =>
    banner ? formFromBanner(banner) : emptyForm(defaultSlot),
  );

  const initialJson = useRef(JSON.stringify(form));

  const [submitted, setSubmitted] = useState(false);

  const [uploads, setUploads] = useState(0);

  const [confirmLeave, setConfirmLeave] = useState(false);

  const errors = useMemo(
    () => (submitted ? validateBanner(form) : {}),
    [form, submitted],
  );

  const dirty = JSON.stringify(form) !== initialJson.current;

  const saving = create.isPending || update.isPending;

  const uploading = uploads > 0;

  const { slot } = form;

  const textSlot = TEXT_SLOTS.includes(slot);

  const eyebrowSlot = EYEBROW_SLOTS.includes(slot);

  const imageSlot = ALL_IMAGE_SLOTS.includes(slot);

  const imageRequired = IMAGE_SLOTS.includes(slot);

  const patch = (changes) => setForm((f) => ({ ...f, ...changes }));

  const busy = (isBusy) =>
    setUploads((n) => Math.max(0, n + (isBusy ? 1 : -1)));

  const back = () =>
    dirty ? setConfirmLeave(true) : navigate("/admin/banners");

  const submit = (e) => {
    e.preventDefault();

    setSubmitted(true);

    if (Object.keys(validateBanner(form)).length > 0) {
      toast.error("لطفاً خطاهای فرم را اصلاح کنید");

      return;
    }

    const body = payloadFromForm(form);

    const options = {
      onSuccess: () => {
        toast.success(isEdit ? "بنر بروزرسانی شد" : "بنر ساخته شد");

        navigate("/admin/banners");
      },

      onError: (err) => toast.error(parseApiError(err).message),
    };

    if (isEdit) update.mutate({ id: banner._id, body }, options);
    else create.mutate(body, options);
  };

  const preview = {
    slot,

    eyebrow: form.eyebrow,

    title: form.title,

    subtitle: form.subtitle,

    ctaText: form.ctaText,

    ctaLink: form.ctaLink,

    badge: form.badge,

    image: form.image,

    focalPoint: { x: form.focalX, y: form.focalY },

    overlay: Number(form.overlay),

    icon: form.icon,

    imageMobile: form.imageMobile,
  };

  return (
    <>
      <PageHeader
        title={isEdit ? "ویرایش بنر" : "بنر جدید"}
        description={SLOT_LABELS[slot]}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={back}>
              انصراف
            </Button>

            <Button
              type="submit"
              form="banner-form"
              size="sm"
              variant="primary"
              loading={saving}
              disabled={uploading || (isEdit && !dirty)}
            >
              {isEdit ? "ذخیره تغییرات" : "ساخت بنر"}
            </Button>
          </>
        }
      />

      <form
        id="banner-form"
        onSubmit={submit}
        noValidate
        className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"
      >
        <div className="space-y-6">
          {/* انتخاب تایل */}

          <Card icon={LayoutTemplate} title="نوع بنر" hint={SLOT_HINTS[slot]}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SLOTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={slot === s}
                  onClick={() => patch({ slot: s })}
                  className={`rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                    slot === s
                      ? "border-bronze/60 bg-bronze/10 text-bronze"
                      : "border-line text-muted hover:text-paper"
                  }`}
                >
                  {SLOT_LABELS[s]}
                </button>
              ))}
            </div>
          </Card>

          {/* انتخاب بخش صفحه */}

          {slot === "section" && (
            <Card
              icon={Layers}
              title="بخش صفحه"
              hint="این عنوان و عکس روی کدام بخش از صفحه‌ی اصلی اعمال شود. هر بخش بنر جداگانه‌ی خودش را دارد."
            >
              <div className="grid gap-2 sm:grid-cols-2">
                {SECTION_KEYS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={form.sectionKey === key}
                    onClick={() => patch({ sectionKey: key })}
                    className={`rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                      form.sectionKey === key
                        ? "border-bronze/60 bg-bronze/10 text-bronze"
                        : "border-line text-muted hover:text-paper"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {errors.sectionKey && (
                <p className="mt-2 text-xs text-danger">{errors.sectionKey}</p>
              )}
            </Card>
          )}

          {/* متن‌ها */}

          <Card icon={Type} title="متن‌ها">
            {eyebrowSlot && (
              <Field
                label="متن کوچک بالای تیتر (اختیاری)"
                value={form.eyebrow}
                onChange={(e) => patch({ eyebrow: e.target.value })}
                maxLength={60}
                error={errors.eyebrow}
              />
            )}

            <Field
              label={TITLE_LABEL[slot]}
              value={form.title}
              onChange={(e) => patch({ title: e.target.value })}
              maxLength={120}
              error={errors.title}
            />

            {textSlot && (
              <>
                <TextAreaField
                  label={
                    slot === "section"
                      ? "توضیح زیر عنوان (اختیاری)"
                      : "توضیح کوتاه (اختیاری)"
                  }
                  value={form.subtitle}
                  onChange={(e) => patch({ subtitle: e.target.value })}
                  maxLength={300}
                  error={errors.subtitle}
                />

                <Field
                  label={
                    slot === "section"
                      ? "متن لینک «مشاهده همه» (اختیاری)"
                      : "متن دکمه (اختیاری)"
                  }
                  value={form.ctaText}
                  onChange={(e) => patch({ ctaText: e.target.value })}
                  maxLength={40}
                  error={errors.ctaText}
                />
              </>
            )}

            <Field
              label={LINK_LABEL[slot]}
              dir="ltr"
              value={form.ctaLink}
              onChange={(e) => patch({ ctaLink: e.target.value })}
              maxLength={300}
              placeholder="/products?category=dog"
              error={errors.ctaLink}
            />

            {slot === "promo" && (
              <Field
                label="متن چیپ شناور روی عکس (اختیاری)"
                value={form.badge}
                onChange={(e) => patch({ badge: e.target.value })}
                maxLength={40}
                placeholder="مثلاً با عشق انتخاب شده"
                error={errors.badge}
              />
            )}
          </Card>

          {/* تصویر */}

          {imageSlot && (
            <Card
              icon={ImageIcon}
              title={imageRequired ? "تصویر" : "تصویر پس‌زمینه (اختیاری)"}
              hint={
                imageRequired
                  ? "عکس تمیز و باکیفیت؛ برای این بنر الزامی است."
                  : "اگر عکسی نگذارید، همان ظاهر ساده‌ی فعلی نمایش داده می‌شود."
              }
            >
              <p className="mb-2 text-sm text-paper">تصویر دسکتاپ</p>

              <BannerImageField
                value={form.image}
                onChange={(image) => patch({ image })}
                focal={{ x: form.focalX, y: form.focalY }}
                onFocalChange={({ x, y }) => patch({ focalX: x, focalY: y })}
                onBusyChange={busy}
                error={errors.image}
              />

              <div className="mt-5">
                <label
                  htmlFor="banner-overlay"
                  className="mb-2 flex items-center justify-between text-sm text-muted"
                >
                  <span>تیرگی روی عکس</span>

                  <span className="text-xs text-paper">
                    {toPersianDigits(form.overlay)}٪
                  </span>
                </label>

                <input
                  id="banner-overlay"
                  type="range"
                  min={0}
                  max={80}
                  step={5}
                  value={form.overlay}
                  onChange={(e) => patch({ overlay: Number(e.target.value) })}
                  className="w-full accent-[var(--color-bronze,#c8a46a)]"
                />
              </div>

              <div className="mt-6 border-t border-line pt-5">
                <p className="mb-1 text-sm text-paper">
                  تصویر موبایل (اختیاری)
                </p>

                <p className="mb-3 text-xs leading-6 text-muted">
                  اگر عکس جداگانه‌ای (مثلاً عمودی‌تر) برای موبایل دارید اینجا
                  بگذارید؛ وگرنه همان تصویر دسکتاپ استفاده می‌شود.
                </p>

                <BannerImageField
                  value={form.imageMobile}
                  onChange={(imageMobile) => patch({ imageMobile })}
                  onBusyChange={busy}
                  showFocal={false}
                />
              </div>
            </Card>
          )}

          {/* آیکون */}

          {(slot === "info" || slot === "promo") && (
            <Card
              icon={Sparkles}
              title="آیکون"
              hint={
                slot === "promo"
                  ? "کنار متن چیپ شناور نمایش داده می‌شود."
                  : undefined
              }
            >
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(BANNER_ICON_MAP).map(([key, Icon]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={form.icon === key}
                    onClick={() => patch({ icon: key })}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-[11px] transition-colors ${
                      form.icon === key
                        ? "border-bronze/60 bg-bronze/10 text-bronze"
                        : "border-line text-muted hover:text-paper"
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.6} />

                    {BANNER_ICON_LABELS[key]}
                  </button>
                ))}
              </div>

              {errors.icon && (
                <p className="mt-2 text-xs text-danger">{errors.icon}</p>
              )}
            </Card>
          )}

          {/* نمایش و زمان‌بندی */}

          <Card
            icon={CalendarClock}
            title="نمایش"
            hint="اگر زمان‌بندی نگذارید، بنر تا وقتی فعال است همیشه نمایش داده می‌شود."
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-paper">نمایش در سایت</p>

                <p className="mt-0.5 text-xs text-muted">
                  {form.isActive ? "فعال" : "غیرفعال"}
                </p>
              </div>

              <ActiveSwitch
                checked={form.isActive}
                onChange={(isActive) => patch({ isActive })}
                label="فعال بودن بنر"
              />
            </div>

            <Field
              label="ترتیب نمایش (عدد کمتر = زودتر)"
              dir="ltr"
              inputMode="numeric"
              value={form.order}
              onChange={(e) =>
                patch({ order: e.target.value.replace(/\D/g, "") })
              }
              error={errors.order}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs text-muted">
                شروع نمایش (اختیاری)
                <input
                  type="datetime-local"
                  dir="ltr"
                  value={form.startsAt}
                  onChange={(e) => patch({ startsAt: e.target.value })}
                  className={`${dateInput} mt-1.5`}
                />
                {errors.startsAt && (
                  <span className="mt-1 block text-danger">
                    {errors.startsAt}
                  </span>
                )}
              </label>

              <label className="block text-xs text-muted">
                پایان نمایش (اختیاری)
                <input
                  type="datetime-local"
                  dir="ltr"
                  value={form.endsAt}
                  min={form.startsAt || undefined}
                  onChange={(e) => patch({ endsAt: e.target.value })}
                  className={`${dateInput} mt-1.5`}
                />
                {errors.endsAt && (
                  <span className="mt-1 block text-danger">
                    {errors.endsAt}
                  </span>
                )}
              </label>
            </div>
          </Card>
        </div>

        {/* پیش‌نمایش زنده */}

        <div className="lg:sticky lg:top-6">
          <Card
            title="پیش‌نمایش"
            hint="نمایی از همین بنر در صفحه‌ی اصلی (نسخه‌ی دسکتاپ)."
          >
            <BannerPreviewPanel
              banner={preview}
              aspect={PREVIEW_ASPECT[slot]}
            />
          </Card>
        </div>
      </form>

      <ConfirmDialog
        open={confirmLeave}
        title="خروج بدون ذخیره؟"
        message="تغییراتی که ذخیره نکرده‌اید از بین می‌رود."
        confirmLabel="خروج"
        tone="primary"
        onConfirm={() => navigate("/admin/banners")}
        onClose={() => setConfirmLeave(false)}
      />
    </>
  );
};

// شناسه توی آدرس باشه یعنی ویرایش؛ فرم بعد از رسیدن داده ساخته میشه تا state اولیه درست باشه

const AdminBannerFormPage = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const banner = useAdminBanner(id);

  const slotParam = searchParams.get("slot");

  const defaultSlot = SLOTS.includes(slotParam) ? slotParam : "main";

  if (id && banner.isLoading) {
    return (
      <p className="py-24 text-center text-sm text-muted">در حال بارگذاری...</p>
    );
  }

  if (id && !banner.data) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-muted">بنر پیدا نشد.</p>

        <Button
          className="mt-4"
          variant="secondary"
          onClick={() => navigate("/admin/banners")}
        >
          بازگشت به بنرها
        </Button>
      </div>
    );
  }

  return (
    <BannerForm
      key={banner.data?._id ?? `new-${defaultSlot}`}
      banner={banner.data}
      defaultSlot={defaultSlot}
    />
  );
};

export default AdminBannerFormPage;
