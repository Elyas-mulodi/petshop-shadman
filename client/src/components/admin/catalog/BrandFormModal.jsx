import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Switch from "../ui/Switch";
import SingleImagePicker from "../ui/SingleImagePicker";
import { useToast } from "../ui/ToastProvider";
import { Field, FormError } from "../../auth/AuthParts";
import { useSaveBrand } from "../../../features/admin/catalog/useCatalog";
import { parseApiError } from "../../../utils/authHelpers";

const BrandFormModal = ({ open, brand, onClose }) => {
  const toast = useToast();
  const save = useSaveBrand();
  const isEdit = !!brand;

  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [logo, setLogo] = useState({ file: null, removed: false });
  const [error, setError] = useState("");
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(brand?.name ?? "");
    setIsActive(brand?.isActive ?? true);
    setLogo({ file: null, removed: false });
    setError("");
    setServerError("");
  }, [open, brand]);

  const submit = (e) => {
    e.preventDefault();

    const trimmed = name.trim();
    if (trimmed.length < 2)
      return setError("نام برند باید حداقل ۲ کاراکتر باشد");
    if (trimmed.length > 50) return setError("نام برند خیلی طولانی است");
    setError("");

    const body = new FormData();
    body.append("name", trimmed);
    body.append("isActive", String(isActive));
    if (logo.file) body.append("logo", logo.file);
    else if (isEdit && logo.removed) body.append("removeLogo", "true");

    setServerError("");
    save.mutate(
      { id: brand?._id, body },
      {
        onSuccess: () => {
          toast.success(isEdit ? "برند ذخیره شد" : "برند ساخته شد");
          onClose();
        },
        onError: (err) => {
          const data = err?.response?.data;
          if (data?.errors?.name) setError(data.errors.name);
          setServerError(parseApiError(err).message);
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      title={isEdit ? "ویرایش برند" : "برند جدید"}
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
            form="brand-form"
            loading={save.isPending}
          >
            {isEdit ? "ذخیره" : "ساخت"}
          </Button>
        </>
      }
    >
      <form id="brand-form" onSubmit={submit} noValidate>
        <Field
          label="نام برند"
          value={name}
          maxLength={50}
          error={error}
          onChange={(e) => setName(e.target.value)}
        />

        <SingleImagePicker
          label="لوگو"
          existingUrl={brand?.logo}
          value={logo}
          onChange={setLogo}
        />

        <div className="flex items-start justify-between gap-4 rounded-lg border border-line bg-ink/40 px-3.5 py-3">
          <div>
            <p className="text-sm text-paper">
              {isActive ? "فعال" : "غیرفعال"}
            </p>
            <p className="mt-1 text-xs leading-6 text-muted">
              {isActive
                ? "در فیلتر برند و صفحه‌ی محصول سایت نمایش داده می‌شود."
                : "در فیلتر برندهای سایت نمایش داده نمی‌شود."}
            </p>
          </div>
          <Switch
            checked={isActive}
            onChange={setIsActive}
            label="فعال بودن برند"
          />
        </div>

        <div className="mt-4">
          <FormError message={serverError} />
        </div>
      </form>
    </Modal>
  );
};

export default BrandFormModal;
