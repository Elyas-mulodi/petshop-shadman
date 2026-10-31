import { useEffect, useMemo, useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Switch from "../ui/Switch";
import SingleImagePicker from "../ui/SingleImagePicker";
import { useToast } from "../ui/ToastProvider";
import { Field, FormError } from "../../auth/AuthParts";
import { useSaveCategory } from "../../../features/admin/catalog/useCatalog";
import {
  buildCategoryTree,
  descendantIds,
  flattenTree,
  indexTree,
  subtreeHeight,
} from "../../../features/admin/products/categoryTree";
import { parseApiError } from "../../../utils/authHelpers";

const MAX_LEVEL_INDEX = 2; 

const CategoryFormModal = ({
  open,
  category,
  defaultParentId = "",
  categories,
  onClose,
}) => {
  const toast = useToast();
  const save = useSaveCategory();
  const isEdit = !!category;

  const [name, setName] = useState("");
  const [parent, setParent] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [image, setImage] = useState({ file: null, removed: false });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? "");
    setParent(category ? (category.parent?._id ?? "") : defaultParentId);
    setSortOrder(String(category?.sortOrder ?? 0));
    setIsActive(category?.isActive ?? true);
    setImage({ file: null, removed: false });
    setErrors({});
    setServerError("");
  }, [open, category, defaultParentId]);

  const roots = useMemo(() => buildCategoryTree(categories), [categories]);
  const index = useMemo(() => indexTree(roots), [roots]);

  const options = useMemo(() => {
    const self = category ? index.get(category._id) : null;
    const blocked = new Set(self ? [self._id, ...descendantIds(self)] : []);
    const height = self ? subtreeHeight(self) : 0;

    return flattenTree(roots).map((node) => ({
      ...node,
      disabled:
        blocked.has(node._id) || node.depth + 1 + height > MAX_LEVEL_INDEX,
    }));
  }, [roots, index, category]);

  const hasChildren =
    isEdit && (index.get(category._id)?.children.length ?? 0) > 0;

  const submit = (e) => {
    e.preventDefault();

    const next = {};
    if (name.trim().length < 2)
      next.name = "نام دسته‌بندی باید حداقل ۲ کاراکتر باشد";
    else if (name.trim().length > 50)
      next.name = "نام دسته‌بندی خیلی طولانی است";
    if (!/^\d{1,4}$/.test(sortOrder.trim()))
      next.sortOrder = "عددی بین ۰ تا ۹۹۹۹ وارد کنید";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const body = new FormData();
    body.append("name", name.trim());
    body.append("parent", parent);
    body.append("isActive", String(isActive));
    body.append("sortOrder", sortOrder.trim());
    if (image.file) body.append("image", image.file);
    else if (isEdit && image.removed) body.append("removeImage", "true");

    setServerError("");
    save.mutate(
      { id: category?._id, body },
      {
        onSuccess: () => {
          toast.success(isEdit ? "دسته‌بندی ذخیره شد" : "دسته‌بندی ساخته شد");
          onClose();
        },
        onError: (err) => {
          const data = err?.response?.data;
          if (data?.errors) setErrors((prev) => ({ ...prev, ...data.errors }));
          setServerError(parseApiError(err).message);
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      title={isEdit ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}
      onClose={onClose}
      dismissible={!save.isPending}
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={save.isPending}
          >
            انصراف
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="category-form"
            loading={save.isPending}
          >
            {isEdit ? "ذخیره" : "ساخت"}
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={submit} noValidate>
        <Field
          label="نام دسته‌بندی"
          value={name}
          maxLength={50}
          error={errors.name}
          onChange={(e) => setName(e.target.value)}
        />

        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs font-medium text-muted">
            دسته‌ی والد
          </span>
          <select
            value={parent}
            onChange={(e) => setParent(e.target.value)}
            className="w-full rounded-lg border border-line bg-ink px-3 py-2.5 text-sm text-paper focus:border-bronze focus:outline-none"
          >
            <option value="">بدون والد (دسته‌ی اصلی)</option>
            {options.map((o) => (
              <option key={o._id} value={o._id} disabled={o.disabled}>
                {`${"— ".repeat(o.depth)}${o.name}`}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-[11px] leading-5 text-muted">
            حداکثر ۳ سطح دسته‌بندی مجاز است.
          </p>
        </label>

        <Field
          label="ترتیب نمایش"
          type="text"
          inputMode="numeric"
          dir="ltr"
          value={sortOrder}
          error={errors.sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        />
        <p className="-mt-2 mb-4 text-[11px] leading-5 text-muted">
          عدد کمتر در منوی سایت بالاتر نمایش داده می‌شود.
        </p>

        <SingleImagePicker
          label="تصویر دسته‌بندی"
          existingUrl={category?.image}
          value={image}
          onChange={setImage}
        />

        <div className="flex items-start justify-between gap-4 rounded-lg border border-line bg-ink/40 px-3.5 py-3">
          <div>
            <p className="text-sm text-paper">
              {isActive ? "فعال" : "غیرفعال"}
            </p>
            <p className="mt-1 text-xs leading-6 text-muted">
              {isActive
                ? "در منوی سایت نمایش داده می‌شود."
                : hasChildren
                  ? "با غیرفعال‌شدن، زیردسته‌های این دسته هم از منوی سایت ناپدید می‌شوند."
                  : "از منوی سایت حذف می‌شود (محصولاتش همچنان در سایت هستند)."}
            </p>
          </div>
          <Switch
            checked={isActive}
            onChange={setIsActive}
            label="فعال بودن دسته‌بندی"
          />
        </div>

        <div className="mt-4">
          <FormError message={serverError} />
        </div>
      </form>
    </Modal>
  );
};

export default CategoryFormModal;
