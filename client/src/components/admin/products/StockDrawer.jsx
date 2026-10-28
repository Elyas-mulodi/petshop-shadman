import { useState } from "react";
import Drawer from "../ui/Drawer";
import Button from "../ui/Button";
import ErrorState from "../../common/ErrorState";
import { useToast } from "../ui/ToastProvider";
import {
  useAdminProduct,
  useUpdateStock,
} from "../../../features/admin/products/useAdminProducts";
import { parseApiError, toPersianDigits } from "../../../utils/authHelpers";

const VariantRow = ({ productId, variant }) => {
  const toast = useToast();
  const mutation = useUpdateStock(productId);
  const [value, setValue] = useState(String(variant.stock));

  const next = Number(value);
  const valid =
    value !== "" && Number.isInteger(next) && next >= 0 && next <= 1_000_000;
  const changed = valid && next !== variant.stock;

  const save = (e) => {
    e.preventDefault();
    if (!changed) return;

    mutation.mutate(
      { variantId: variant._id, stock: next, expected: variant.stock },
      {
        onSuccess: () => toast.success("موجودی ذخیره شد"),
        onError: (err) => toast.error(parseApiError(err).message),
      },
    );
  };

  const label = variant.attributes
    .map((a) => `${a.name}: ${a.value}`)
    .join("، ");

  return (
    <li className="border-b border-line py-4 last:border-b-0">
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="text-sm text-paper">{label}</p>
        <span className="shrink-0 text-xs text-muted">
          موجودی فعلی: {toPersianDigits(variant.stock)}
        </span>
      </div>
      {variant.sku && (
        <p dir="ltr" className="mb-2 text-right text-[11px] text-muted">
          {variant.sku}
        </p>
      )}

      <form onSubmit={save} className="flex items-center gap-2" noValidate>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label={`موجودی ${label}`}
          className={`w-28 rounded-lg border bg-ink px-3 py-2 text-sm text-paper focus:outline-none ${
            value !== "" && !valid
              ? "border-danger"
              : "border-line focus:border-bronze"
          }`}
        />
        <Button
          type="submit"
          size="sm"
          variant="primary"
          loading={mutation.isPending}
          disabled={!changed}
        >
          ذخیره
        </Button>
      </form>
    </li>
  );
};

const StockDrawer = ({ product, onClose }) => {
  const { data, isLoading, error, refetch } = useAdminProduct(
    product?._id,
    !!product,
  );

  return (
    <Drawer
      open={!!product}
      title={product?.name ?? ""}
      description="ویرایش سریع موجودی واریانت‌ها"
      onClose={onClose}
    >
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-well" />
          ))}
        </div>
      ) : error && !data ? (
        <ErrorState
          compact
          message="دریافت موجودی با خطا مواجه شد"
          onRetry={refetch}
        />
      ) : (
        <ul>
          {data?.variants.map((variant) => (
            // با عوض‌شدن موجودی روی سرور، مقدار ورودی دوباره از سرور خونده می‌شه
            <VariantRow
              key={`${variant._id}-${variant.stock}`}
              productId={data._id}
              variant={variant}
            />
          ))}
        </ul>
      )}
    </Drawer>
  );
};

export default StockDrawer;
