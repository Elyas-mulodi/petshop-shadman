import { useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import Button from "../ui/Button";
import { useToast } from "../ui/ToastProvider";
import { useSetStock } from "../../../features/admin/inventory/useInventory";
import { parseApiError } from "../../../utils/authHelpers";

const MAX = 1_000_000;

const StockEditor = ({ row }) => {
  const toast = useToast();
  const mutation = useSetStock();
  const [value, setValue] = useState(String(row.stock));

  const next = Number(value);
  const valid =
    value.trim() !== "" && Number.isInteger(next) && next >= 0 && next <= MAX;
  const changed = valid && next !== row.stock;

  const step = (delta) =>
    setValue(
      String(Math.min(MAX, Math.max(0, (valid ? next : row.stock) + delta))),
    );

  const save = () => {
    if (!changed) return;

    mutation.mutate(
      {
        productId: row.productId,
        variantId: row.variantId,
        stock: next,
        expected: row.stock,
      },
      {
        onSuccess: () => toast.success("موجودی ذخیره شد"),
        onError: (err) => toast.error(parseApiError(err).message),
      },
    );
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      save();
    } else if (e.key === "Escape") {
      setValue(String(row.stock));
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => step(-1)}
        aria-label="کم کردن موجودی"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:text-paper"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>

      <input
        type="text"
        inputMode="numeric"
        dir="ltr"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        aria-label={`موجودی ${row.name}`}
        className={`h-8 w-16 rounded-lg border bg-ink px-2 text-center text-sm text-paper focus:outline-none ${
          value !== "" && !valid
            ? "border-danger"
            : "border-line focus:border-bronze"
        }`}
      />

      <button
        type="button"
        onClick={() => step(1)}
        aria-label="زیاد کردن موجودی"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:text-paper"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>

      {changed && (
        <Button
          variant="primary"
          size="icon"
          className="h-8 w-8"
          aria-label="ذخیره‌ی موجودی"
          title="ذخیره"
          loading={mutation.isPending}
          onClick={save}
        >
          <Check className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default StockEditor;
