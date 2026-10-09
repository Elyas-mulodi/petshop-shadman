import { Link } from "react-router-dom";
import { formatToman } from "../../utils/price";
import { toPersianDigits } from "../../utils/authHelpers";

const shippingText = (shipping) =>
  shipping === null ? "در مرحله بعد" : shipping === 0 ? "رایگان" : formatToman(shipping);

const Row = ({ label, value, accent }) => (
  <div className="flex items-center justify-between">
    <dt className="text-muted">{label}</dt>
    <dd className={accent ? "text-bronze" : "text-paper"}>{value}</dd>
  </div>
);

const CtaLink = ({ cta, className }) => (
  <Link to={cta.to} state={cta.state} className={className}>
    {cta.label}
  </Link>
);

// کارت خلاصه (دسکتاپ)
const CartSummary = ({ summary, cta }) => (
  <div className="rounded-xl border border-line bg-card p-5 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)]">
    <p className="mb-4 font-display text-base font-bold text-paper">خلاصه سفارش</p>

    <dl className="flex flex-col gap-3 text-sm">
      <Row label="جمع کالاها" value={formatToman(summary.subtotal)} />
      {summary.discount > 0 && (
        <Row
          label={`تخفیف وفاداری (${toPersianDigits(summary.discountPercent)}٪)`}
          value={`−${formatToman(summary.discount)}`}
          accent
        />
      )}
      <Row label="هزینه ارسال" value={shippingText(summary.shipping)} />
    </dl>

    <div className="my-4 flex items-center justify-between border-t border-line pt-4">
      <span className="text-sm text-paper">مبلغ قابل پرداخت</span>
      <span className="text-lg font-bold text-bronze">{formatToman(summary.total)}</span>
    </div>

    <CtaLink
      cta={cta}
      className="block rounded-lg bg-bronze py-3 text-center text-sm font-medium text-ink transition-opacity hover:opacity-90"
    />

    <p className="mt-3 text-center text-[11px] leading-5 text-muted">
      کد تخفیف را در مرحله بعد (تسویه حساب) وارد کنید.
    </p>
  </div>
);

// نوار چسبیده پایین صفحه (موبایل و تبلت)
export const CartStickyBar = ({ summary, cta }) => (
  <div
    className="sticky bottom-0 z-30 -mx-4 mt-6 border-t border-line bg-card/95 px-4 pt-3 backdrop-blur-md lg:hidden"
    style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
  >
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
      <CtaLink
        cta={cta}
        className="flex-1 rounded-lg bg-bronze py-3 text-center text-sm font-medium text-ink"
      />
    </div>
  </div>
);

export default CartSummary;