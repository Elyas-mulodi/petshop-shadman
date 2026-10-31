import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PackageX } from "lucide-react";
import ProductForm from "../../components/admin/products/ProductForm";
import Button from "../../components/admin/ui/Button";
import Skeleton from "../../components/common/Skeleton";
import ErrorState from "../../components/common/ErrorState";
import { useAdminProduct } from "../../features/admin/products/useAdminProducts";

const AdminProductFormPage = () => {
  const { id } = useParams(); // روی /products/new تعریف‌نشده است
  const isEdit = !!id;
  const query = useAdminProduct(id, isEdit);

  // مبنای مقایسه‌ی فرم: فقط اولین بار که محصول می‌رسه و بعد از ذخیره‌ی خود فرم عوض می‌شه.
  // تغییرهای بعدیِ سرور (موجودی، عکس) فرم رو «تغییرکرده» نشون نمی‌دن.
  const [baseline, setBaseline] = useState(null);
  const [version, setVersion] = useState(0);

  if (isEdit && query.data && baseline?._id !== id) {
    setBaseline(query.data);
  }

  if (isEdit && query.isLoading) {
    return (
      <>
        <Skeleton className="mb-5 h-5 w-24" />
        <Skeleton className="h-10 w-64" />
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </>
    );
  }

  if (isEdit && query.error?.response?.status === 404) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-line bg-card py-16 text-center">
        <PackageX className="mb-4 h-10 w-10 text-sage" strokeWidth={1.3} />
        <p className="font-display text-base font-bold text-paper">
          محصول پیدا نشد
        </p>
        <Link to="/admin/products" className="mt-5">
          <Button variant="primary">بازگشت به محصولات</Button>
        </Link>
      </div>
    );
  }

  if (isEdit && !query.data) {
    return (
      <ErrorState
        message="دریافت اطلاعات محصول با خطا مواجه شد"
        onRetry={query.refetch}
      />
    );
  }

  if (isEdit && baseline?._id !== id) return null; // لحظه‌ی کوتاه تا مبنا ست بشه

  return (
    <ProductForm
      key={`${id ?? "new"}-${version}`}
      product={isEdit ? baseline : null}
      liveProduct={query.data}
      onSaved={(saved) => {
        setBaseline(saved);
        setVersion((v) => v + 1);
      }}
    />
  );
};

export default AdminProductFormPage;
