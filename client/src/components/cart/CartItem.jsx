import { Link } from "react-router-dom";
import { Minus, Plus, PawPrint, Trash2 } from "lucide-react";
import SwipeRow from "./SwipeRow";
import useMediaQuery from "../../hooks/useMediaQuery";
import { getImageUrl } from "../../utils/imageUrl";
import { formatToman } from "../../utils/price";
import { toPersianDigits } from "../../utils/authHelpers";
import { formatAttributes } from "../../utils/variantHelpers";

const Stepper = ({ value, max, disabled, onChange }) => (
  <div className="flex items-center rounded-lg border border-line">
    <button
      onClick={() => onChange(value - 1)}
      disabled={disabled || value <= 1}
      className="p-2 text-paper disabled:opacity-30"
      aria-label="کم کردن تعداد"
    >
      <Minus className="h-3.5 w-3.5" />
    </button>
    <span className="min-w-6 text-center text-xs text-paper">{toPersianDigits(value)}</span>
    <button
      onClick={() => onChange(value + 1)}
      disabled={disabled || value >= max}
      className="p-2 text-paper disabled:opacity-30"
      aria-label="زیاد کردن تعداد"
    >
      <Plus className="h-3.5 w-3.5" />
    </button>
  </div>
);

const CartItem = ({ item, busy, onQuantity, onRemove }) => {
  const isMobile = useMediaQuery("(max-width: 639px)");
  const image = getImageUrl(item.image);
  const maxQty = Math.min(10, item.availableStock);
  const atStockLimit = item.quantity >= item.availableStock;

  const content = (
    <div className={`flex gap-3 bg-card p-3 transition-opacity sm:p-4 ${busy ? "opacity-60" : ""}`}>
      <Link
        to={`/products/${item.productSlug}`}
        className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-well sm:h-24 sm:w-24"
      >
        {image ? (
          <img src={image} alt={item.productName} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <PawPrint className="h-6 w-6 text-sage" strokeWidth={1.4} />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          to={`/products/${item.productSlug}`}
          className="line-clamp-2 text-sm text-paper hover:text-bronze"
        >
          {item.productName}
        </Link>
        <p className="mt-0.5 text-xs text-muted">{toPersianDigits(formatAttributes(item.attributes))}</p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <Stepper value={item.quantity} max={maxQty} disabled={busy} onChange={(q) => onQuantity(item.variantId, q)} />
            {atStockLimit && <p className="mt-1 text-[11px] text-danger">حداکثر موجودی</p>}
          </div>

          <div className="text-left">
            <p className="text-sm font-bold text-bronze">{formatToman(item.lineTotal)}</p>
            {item.discountPercent > 0 && (
              <p className="text-[11px] text-muted line-through">
                {formatToman(item.originalPrice * item.quantity)}
              </p>
            )}
            {item.quantity > 1 && (
              <p className="text-[11px] text-muted">هر عدد {formatToman(item.finalPrice)}</p>
            )}
          </div>
        </div>
      </div>

      {/* دکمه حذف: فقط تبلت و دسکتاپ (موبایل با سوایپ) */}
      <button
        onClick={() => onRemove(item.variantId)}
        aria-label="حذف از سبد"
        className="hidden self-start p-1.5 text-muted transition-colors hover:text-danger sm:block"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  if (isMobile) return <SwipeRow onDelete={() => onRemove(item.variantId)}>{content}</SwipeRow>;

  return <div className="overflow-hidden rounded-xl border border-line">{content}</div>;
};

export default CartItem;