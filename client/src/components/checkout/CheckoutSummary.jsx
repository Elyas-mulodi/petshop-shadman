import { Loader2, PawPrint } from "lucide-react";
import { formatToman } from "../../utils/price";
import { toPersianDigits } from "../../utils/authHelpers";
import { getImageUrl } from "../../utils/imageUrl";
import { formatAttributes } from "../../utils/variantHelpers";

const shippingText = (shipping) =>
  shipping === null ? "در مرحله بعد" : shipping === 0 ? "رایگان" : formatToman(shipping);

const discountLabel = (summary) =>
  summary.discountSource === "coupon"
    ? "کد تخفیف"
    : `تخفیف وفاداری (${toPersianDigits(summary.discountPercent)}٪)`;

const PayButton = ({ submitting, className }) => (
  <button
    type="submit"
    form="checkout-form"
    disabled={submitting}
    className={`flex items-center justify-center gap-2 rounded-lg bg-bronze text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-60 ${className}`}
  >
    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
    {submitting ? "در حال انتقال به درگاه..." : "پرداخت و ثبت سفارش"}
  </button>
);

const ErrorBlock = ({ message }) =>
  message ? (
    <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs leading-6 text-danger">
      {message}
    </p>
  ) : null;

// لیست فشرده کالاهای سفارش
export const CheckoutItems = ({ items }) => (
  <ul className="flex flex-col gap-3">
    {items.map((item) => {
      const image = getImageUrl(item.image);
      return (
        <li key={item.variantId} className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-well">
            {image ? (
              <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <PawPrint className="h-4 w-4 text-sage" strokeWidth={1.4} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-xs text-paper">{item.productName}</p>
            <p className="text-[11px] text-muted">
              {toPersianDigits(formatAttributes(item.attributes))} · {toPersianDigits(item.quantity)} عدد
            </p>
          </div>
          <span className="shrink-0 text-xs text-paper">{formatToman(item.lineTotal)}</span>
        </li>
      );
    })}
  </ul>
);

// کارت خلاصه (دسکتاپ)
const CheckoutSummary = ({ items, summary, submitting, error }) => (
  <div className="rounded-xl border border-line bg-card p-5 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)]">
    <p className="mb-4 font-display text-base font-bold text-paper">خلاصه سفارش</p>

    <div className="max-h-56 overflow-y-auto border-b border-line pb-4">
      <CheckoutItems items={items} />
    </div>

    <dl className="flex flex-col gap-3 pt-4 text-sm">
      <div className="flex items-center justify-between">
        <dt className="text-muted">جمع کالاها</dt>
        <dd className="text-paper">{formatToman(summary.subtotal)}</dd>
      </div>
      {summary.discount > 0 && (
        <div className="flex items-center justify-between">
          <dt className="text-muted">{discountLabel(summary)}</dt>
          <dd className="text-bronze">−{formatToman(summary.discount)}</dd>
        </div>
      )}
      <div className="flex items-center justify-between">
        <dt className="text-muted">هزینه ارسال</dt>
        <dd className="text-paper">{shippingText(summary.shipping)}</dd>
      </div>
    </dl>

    <div className="my-4 flex items-center justify-between border-t border-line pt-4">
      <span className="text-sm text-paper">مبلغ قابل پرداخت</span>
      <span className="text-lg font-bold text-bronze">{formatToman(summary.total)}</span>
    </div>

    <div className="flex flex-col gap-3">
      <ErrorBlock message={error} />
      <PayButton submitting={submitting} className="w-full py-3" />
    </div>
  </div>
);

// نوار چسبیده پایین صفحه (موبایل و تبلت)
export const CheckoutStickyBar = ({ summary, submitting, error }) => (
  <div
    className="sticky bottom-0 z-30 -mx-4 mt-6 border-t border-line bg-card/95 px-4 pt-3 backdrop-blur-md lg:hidden"
    style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
  >
    {error && (
      <div className="mb-2.5">
        <ErrorBlock message={error} />
      </div>
    )}

    <div className="mb-2.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-muted">
      <span>
        جمع کالاها: <b className="font-medium text-paper">{formatToman(summary.subtotal)}</b>
      </span>
      {summary.discount > 0 && (
        <span>
          تخفیف: <b className="font-medium text-bronze">−{formatToman(summary.discount)}</b>
        </span>
      )}
      <span>
        ارسال: <b className="font-medium text-paper">{shippingText(summary.shipping)}</b>
      </span>
    </div>

    <div className="flex items-center gap-3">
      <div className="shrink-0">
        <p className="text-[11px] text-muted">قابل پرداخت</p>
        <p className="text-base font-bold text-bronze">{formatToman(summary.total)}</p>
      </div>
      <PayButton submitting={submitting} className="flex-1 py-3" />
    </div>
  </div>
);

export default CheckoutSummary;