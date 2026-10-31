import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  ExternalLink,
  Image as ImageIcon,
  Layers,
  Package,
  Percent,
} from "lucide-react";
import PageHeader from "../ui/PageHeader";
import Button from "../ui/Button";
import Switch from "../ui/Switch";
import ConfirmDialog from "../ui/ConfirmDialog";
import { useToast } from "../ui/ToastProvider";
import { Field } from "../../auth/AuthParts";
import { TextAreaField } from "../../checkout/FormControls";
import { Card } from "../../profile/ProfileParts";
import CategoryPicker from "./CategoryPicker";
import VariantsEditor from "./VariantsEditor";
import DiscountSection from "./DiscountSection";
import StockDrawer from "./StockDrawer";
import { ImageManager, PendingImages } from "./ProductImages";
import {
  useAdminBrands,
  useAdminCategories,
  useAttributeSuggestions,
  useCreateProduct,
  useUpdateProduct,
} from "../../../features/admin/products/useAdminProducts";
import { uploadProductImages } from "../../../features/admin/products/productImages";
import { buildCategoryTree } from "../../../features/admin/products/categoryTree";
import {
  emptyForm,
  formToPayload,
  mergeSuggestions,
  productToForm,
  snapshot,
  toNumber,
  validateProductForm,
} from "../../../features/admin/products/productForm";
import { useUnsavedWarning } from "../../../hooks/useUnsavedWarning";
import { formatToman } from "../../../utils/price";
import { parseApiError, toPersianDigits } from "../../../utils/authHelpers";

const focusField = (key) => {
  const el = document.querySelector(`[data-field="${key}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(
    () => el instanceof HTMLElement && el.focus({ preventScroll: true }),
    300,
  );
};

// خطاهای ولیدیشن سرور ← کلید فیلدهای فرم
const mapServerErrors = (err) => {
  const data = err?.response?.data;
  const fields = {};

  for (const [key, message] of Object.entries(data?.errors ?? {})) {
    if (key.includes("sku"))
      fields.variants =
        "یکی از SKUها قبلاً برای محصول یا واریانت دیگری استفاده شده است";
    else fields[key] = message;
  }

  return { fields, message: data?.message ?? "ذخیره‌ی محصول با خطا مواجه شد" };
};

const ProductForm = ({ product, liveProduct, onSaved }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!product;

  const initial = useMemo(
    () => (product ? productToForm(product) : emptyForm()),
    [product],
  );
  const initialSnapshot = useMemo(() => snapshot(initial), [initial]);

  const [form, setForm] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [stockOpen, setStockOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  // عکس‌های انتخاب‌شده در حالت ساخت (قبل از آپلود)
  const [pending, setPending] = useState([]);
  const [creating, setCreating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  const pendingRef = useRef(pending);
  useEffect(() => {
    pendingRef.current = pending;
  });
  useEffect(
    () => () => pendingRef.current.forEach((p) => URL.revokeObjectURL(p.url)),
    [],
  );

  const dirty = snapshot(form) !== initialSnapshot || pending.length > 0;
  useUnsavedWarning(dirty);

  const categories = useAdminCategories();
  const brands = useAdminBrands();
  const attributeRows = useAttributeSuggestions();

  const roots = useMemo(
    () => buildCategoryTree(categories.data ?? []),
    [categories.data],
  );
  const suggestions = useMemo(
    () => mergeSuggestions(attributeRows.data),
    [attributeRows.data],
  );

  // موجودی لحظه‌ای از سرور (بعد از ویرایش سریع موجودی تغییر می‌کنه، بدون اینکه فرم ریست بشه)
  const liveStock = useMemo(
    () =>
      Object.fromEntries(
        (liveProduct?.variants ?? []).map((v) => [v._id, v.stock]),
      ),
    [liveProduct],
  );

  const create = useCreateProduct();
  const edit = useUpdateProduct(product?._id);
  const saving = creating || edit.isPending;

  const update = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setServerErrors({});
  };

  const clientErrors = useMemo(
    () => (submitted ? validateProductForm(form) : {}),
    [form, submitted],
  );
  const errors = { ...serverErrors, ...clientErrors };

  const handleSave = async () => {
    setSubmitted(true);

    const found = validateProductForm(form);
    const firstKey = Object.keys(found)[0];
    if (firstKey) {
      toast.error("چند فیلد نیاز به اصلاح دارند");
      focusField(firstKey);
      return;
    }

    const fail = (err) => {
      const mapped = mapServerErrors(err);
      setServerErrors(mapped.fields);
      toast.error(mapped.message);
      const firstServerKey = Object.keys(mapped.fields)[0];
      if (firstServerKey) setTimeout(() => focusField(firstServerKey), 60);
    };

    if (isEdit) {
      edit.mutate(formToPayload(form), {
        onSuccess: (saved) => {
          toast.success("تغییرات ذخیره شد");
          onSaved(saved);
        },
        onError: fail,
      });
      return;
    }

    setCreating(true);
    try {
      const created = await create.mutateAsync(formToPayload(form));

      if (pending.length > 0) {
        try {
          await uploadProductImages(
            created._id,
            pending.map((p) => p.file),
            setUploadProgress,
          );
          toast.success("محصول و عکس‌هایش ذخیره شد");
        } catch (err) {
          toast.error(
            `محصول ساخته شد، اما آپلود عکس‌ها انجام نشد (${parseApiError(err).message}). از همین صفحه دوباره اضافه‌شان کنید.`,
          );
        }
        queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      } else {
        toast.success("محصول ساخته شد");
      }

      navigate(`/admin/products/${created._id}`, { replace: true });
    } catch (err) {
      fail(err);
    } finally {
      setCreating(false);
      setUploadProgress(null);
    }
  };

  const requestLeave = () =>
    dirty ? setLeaveOpen(true) : navigate("/admin/products");

  // خلاصه‌ی سمت راست
  const prices = form.variants
    .map((v) => toNumber(v.price))
    .filter((n) => Number.isFinite(n) && n > 0);
  const totalStock = form.variants.reduce((sum, v) => {
    const n = v._id
      ? (liveStock[v._id] ?? toNumber(v.stock))
      : toNumber(v.stock);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);

  const brandOptions = brands.data ?? [];

  return (
    <>
      <button
        onClick={requestLeave}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-paper"
      >
        <ArrowRight className="h-4 w-4" />
        محصولات
      </button>

      <PageHeader
        title={isEdit ? product.name : "افزودن محصول"}
        description={
          isEdit ? "ویرایش اطلاعات محصول" : "اطلاعات محصول جدید را وارد کنید"
        }
        actions={
          isEdit && product.isActive ? (
            <Link
              to={`/products/${product.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:border-bronze/60 hover:text-bronze"
            >
              <ExternalLink className="h-4 w-4" />
              مشاهده در سایت
            </Link>
          ) : null
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="space-y-6">
          <Card icon={Package} title="اطلاعات پایه">
            <Field
              data-field="name"
              label="نام محصول"
              value={form.name}
              maxLength={150}
              error={errors.name}
              onChange={(e) => update({ name: e.target.value })}
            />

            <TextAreaField
              data-field="description"
              label="توضیحات"
              rows={7}
              value={form.description}
              maxLength={5000}
              error={errors.description}
              onChange={(e) => update({ description: e.target.value })}
            />

            <label className="mb-4 block">
              <span className="mb-1.5 block text-xs font-medium text-muted">
                برند
              </span>
              <select
                data-field="brand"
                value={form.brand}
                onChange={(e) => update({ brand: e.target.value })}
                className={`w-full rounded-lg border bg-ink px-3 py-2.5 text-sm text-paper focus:outline-none ${
                  errors.brand
                    ? "border-danger"
                    : "border-line focus:border-bronze"
                }`}
              >
                <option value="">انتخاب برند...</option>
                {brandOptions.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                    {!b.isActive ? " (غیرفعال)" : ""}
                  </option>
                ))}
              </select>
              {errors.brand && (
                <p className="mt-1.5 text-xs text-danger">{errors.brand}</p>
              )}
              {!brands.isLoading && brandOptions.length === 0 && (
                <p className="mt-1.5 text-xs text-muted">
                  هنوز برندی ساخته نشده است.
                </p>
              )}
            </label>

            <CategoryPicker
              roots={roots}
              loading={categories.isLoading}
              value={form.categories}
              error={errors.categories}
              onChange={(ids) => update({ categories: ids })}
            />
          </Card>

          <Card
            icon={Layers}
            title="واریانت‌ها"
            hint="هر واریانت یک ترکیب قابل فروش است (مثلاً وزن ۳ کیلوگرم با طعم مرغ) با قیمت و موجودی مخصوص خودش."
          >
            <VariantsEditor
              variants={form.variants}
              onChange={(variants) => update({ variants })}
              errors={errors}
              suggestions={suggestions}
              liveStock={liveStock}
              onEditStock={() => setStockOpen(true)}
            />
          </Card>

          <Card icon={Percent} title="تخفیف">
            <DiscountSection form={form} errors={errors} update={update} />
          </Card>
        </div>

        <div className="space-y-6 xl:sticky xl:top-20">
          <Card title="انتشار">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-paper">
                  {form.isActive ? "فعال" : "غیرفعال (پیش‌نویس)"}
                </p>
                <p className="mt-1 text-xs leading-6 text-muted">
                  {form.isActive
                    ? "محصول در سایت نمایش داده می‌شود."
                    : "محصول در سایت دیده نمی‌شود."}
                </p>
              </div>
              <Switch
                checked={form.isActive}
                onChange={(isActive) => update({ isActive })}
                label="فعال بودن محصول"
              />
            </div>
          </Card>

          <Card icon={ImageIcon} title="تصاویر">
            {isEdit ? (
              <ImageManager
                productId={product._id}
                images={liveProduct?.images ?? product.images ?? []}
              />
            ) : (
              <PendingImages
                pending={pending}
                onChange={setPending}
                disabled={saving}
              />
            )}
          </Card>

          <Card title="خلاصه">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">واریانت‌ها</dt>
                <dd className="text-paper">
                  {toPersianDigits(form.variants.length)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">قیمت</dt>
                <dd className="text-paper">
                  {prices.length === 0
                    ? "—"
                    : Math.min(...prices) === Math.max(...prices)
                      ? formatToman(prices[0])
                      : `${formatToman(Math.min(...prices))} تا ${formatToman(Math.max(...prices))}`}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">مجموع موجودی</dt>
                <dd className="text-paper">
                  {toPersianDigits(totalStock)} عدد
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>

      <div className="sticky bottom-0 z-20 -mx-4 mt-8 border-t border-line bg-ink/90 px-4 py-3 backdrop-blur-md lg:-mx-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <p className="text-xs text-muted">
            {uploadProgress !== null
              ? `در حال آپلود عکس‌ها ${toPersianDigits(uploadProgress)}٪`
              : dirty
                ? "تغییرات ذخیره‌نشده دارید"
                : isEdit
                  ? "همه‌ی تغییرات ذخیره شده است"
                  : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={requestLeave}
              disabled={saving}
            >
              انصراف
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={saving}
              disabled={isEdit && !dirty}
            >
              {isEdit ? "ذخیره‌ی تغییرات" : "ساخت محصول"}
            </Button>
          </div>
        </div>
      </div>

      <StockDrawer
        product={
          stockOpen && isEdit ? { _id: product._id, name: product.name } : null
        }
        onClose={() => setStockOpen(false)}
      />

      <ConfirmDialog
        open={leaveOpen}
        title="خروج بدون ذخیره؟"
        message="تغییراتی که ذخیره نکرده‌اید از بین می‌رود."
        confirmLabel="خروج"
        onConfirm={() => navigate("/admin/products")}
        onClose={() => setLeaveOpen(false)}
      />
    </>
  );
};

export default ProductForm;
