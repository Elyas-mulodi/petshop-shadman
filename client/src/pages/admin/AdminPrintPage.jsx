import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Printer } from "lucide-react";
import axiosInstance from "../../utils/axiosInstance";
import { STORE } from "../../utils/storeInfo";
import { numberToPersianWords } from "../../utils/numberToWords";
import { formatDate } from "../../utils/formatDate";
import { toPersianDigits } from "../../utils/authHelpers";

const MAX_PRINT = 30;
const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

const num = (n) => toPersianDigits(Math.round(n).toLocaleString("en-US"));

const parseIds = (raw) => [...new Set((raw ?? "").split(",").filter((id) => OBJECT_ID.test(id)))].slice(0, MAX_PRINT);

const attrText = (item) => (item.attributes ?? []).map((a) => `${a.name}: ${a.value}`).join("، ");

const InfoBlock = ({ title, children }) => (
  <section className="rounded-lg border border-neutral-300 p-3">
    <h2 className="mb-2 text-xs font-bold text-neutral-500">{title}</h2>
    <div className="space-y-1 text-sm leading-6">{children}</div>
  </section>
);

// ---------- فاکتور ----------
const InvoiceSheet = ({ order }) => {
  const a = order.shippingAddress;
  const discountLabel =
    order.discountSource === "coupon"
      ? `کد تخفیف${order.couponCode ? ` (${order.couponCode})` : ""}`
      : "تخفیف وفاداری";

  return (
    <>
      <header className="flex items-start justify-between gap-6 border-b-2 border-neutral-900 pb-4">
        <div>
          <p className="font-display text-2xl font-bold">{STORE.name}</p>
          <p className="mt-1 text-sm text-neutral-600">فاکتور فروش</p>
        </div>
        <dl className="space-y-1 text-xs">
          <div className="flex justify-between gap-6">
            <dt className="text-neutral-500">شماره سفارش</dt>
            <dd dir="ltr" className="font-medium">{order.orderNumber}</dd>
          </div>
          <div className="flex justify-between gap-6">
            <dt className="text-neutral-500">تاریخ</dt>
            <dd>{formatDate(order.createdAt)}</dd>
          </div>
          <div className="flex justify-between gap-6">
            <dt className="text-neutral-500">وضعیت پرداخت</dt>
            <dd>{order.payment?.refId ? "پرداخت‌شده" : "پرداخت‌نشده"}</dd>
          </div>
          {order.payment?.refId && (
            <div className="flex justify-between gap-6">
              <dt className="text-neutral-500">کد پیگیری</dt>
              <dd dir="ltr">{order.payment.refId}</dd>
            </div>
          )}
        </dl>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <InfoBlock title="فروشنده">
          <p className="font-medium">{STORE.name}</p>
          <p>مدیر: {STORE.manager}</p>
          <p dir="ltr" className="text-right">{STORE.phone}</p>
          <p>{STORE.address}</p>
        </InfoBlock>
        <InfoBlock title="خریدار / گیرنده">
          <p className="font-medium">{a.fullName}</p>
          <p dir="ltr" className="text-right">{a.phone}</p>
          <p>{a.province}، {a.city}، {a.addressLine}</p>
          <p>کد پستی: {toPersianDigits(a.postalCode)}</p>
        </InfoBlock>
      </div>

      <table className="mt-5 w-full border-collapse text-sm">
        <thead>
          <tr className="border-y border-neutral-400 bg-neutral-100 text-xs">
            <th className="w-10 px-2 py-2 text-center font-medium">ردیف</th>
            <th className="px-2 py-2 text-start font-medium">شرح کالا</th>
            <th className="w-16 px-2 py-2 text-center font-medium">تعداد</th>
            <th className="w-32 px-2 py-2 text-end font-medium">قیمت واحد (تومان)</th>
            <th className="w-32 px-2 py-2 text-end font-medium">جمع (تومان)</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, i) => (
            <tr key={`${item.variantId}-${i}`} className="border-b border-neutral-300">
              <td className="px-2 py-2 text-center">{toPersianDigits(i + 1)}</td>
              <td className="px-2 py-2">
                <p>{item.productName}</p>
                {attrText(item) && <p className="text-xs text-neutral-500">{attrText(item)}</p>}
              </td>
              <td className="px-2 py-2 text-center">{toPersianDigits(item.quantity)}</td>
              <td className="px-2 py-2 text-end">{num(item.unitPrice)}</td>
              <td className="px-2 py-2 text-end">{num(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex items-start justify-between gap-6">
        <p className="max-w-sm text-sm leading-7">
          <span className="text-neutral-500">مبلغ به حروف: </span>
          {numberToPersianWords(order.totalAmount)} تومان
        </p>

        <dl className="w-72 space-y-1.5 text-sm">
          <div className="flex justify-between"><dt className="text-neutral-600">جمع کالاها</dt><dd>{num(order.subtotal)}</dd></div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between"><dt className="text-neutral-600">{discountLabel}</dt><dd>−{num(order.discountAmount)}</dd></div>
          )}
          <div className="flex justify-between">
            <dt className="text-neutral-600">هزینه ارسال</dt>
            <dd>{order.shippingCost === 0 ? "رایگان" : num(order.shippingCost)}</dd>
          </div>
          <div className="flex justify-between border-t-2 border-neutral-900 pt-2 text-base font-bold">
            <dt>مبلغ قابل پرداخت</dt>
            <dd>{num(order.totalAmount)} تومان</dd>
          </div>
        </dl>
      </div>

      <footer className="mt-10 border-t border-neutral-300 pt-3 text-center text-xs text-neutral-600">
        از خرید شما سپاسگزاریم ، {STORE.name} ، <span dir="ltr">{STORE.phone}</span>
      </footer>
    </>
  );
};

// ---------- برگه‌ی بسته‌بندی ----------
const PackingSheet = ({ order }) => {
  const a = order.shippingAddress;
  const totalQty = order.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <>
      <header className="flex items-start justify-between gap-6 border-b-2 border-neutral-900 pb-4">
        <div>
          <p className="font-display text-2xl font-bold">برگه‌ی بسته‌بندی</p>
          <p className="mt-1 text-sm text-neutral-600">{STORE.name}</p>
        </div>
        <div className="text-end">
          <p dir="ltr" className="font-display text-2xl font-bold">{order.orderNumber}</p>
          <p className="mt-1 text-xs text-neutral-600">{formatDate(order.createdAt)}</p>
        </div>
      </header>

      <section className="mt-5 rounded-lg border-2 border-neutral-900 p-4">
        <h2 className="mb-2 text-xs font-bold text-neutral-500">گیرنده</h2>
        <p className="text-xl font-bold">{a.fullName}</p>
        <p dir="ltr" className="mt-1 text-right text-lg">{a.phone}</p>
        <p className="mt-2 text-base leading-8">{a.province}، {a.city}، {a.addressLine}</p>
        <p className="mt-1 text-base">کد پستی: {toPersianDigits(a.postalCode)}</p>
      </section>

      <table className="mt-5 w-full border-collapse">
        <thead>
          <tr className="border-y border-neutral-400 bg-neutral-100 text-xs">
            <th className="w-12 px-2 py-2 text-center font-medium">✓</th>
            <th className="px-2 py-2 text-start font-medium">کالا</th>
            <th className="w-24 px-2 py-2 text-center font-medium">تعداد</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, i) => (
            <tr key={`${item.variantId}-${i}`} className="border-b border-neutral-300">
              <td className="px-2 py-3 text-center">
                <span className="inline-block h-5 w-5 rounded border-2 border-neutral-900 align-middle" />
              </td>
              <td className="px-2 py-3">
                <p className="text-base">{item.productName}</p>
                {attrText(item) && <p className="mt-0.5 text-sm text-neutral-600">{attrText(item)}</p>}
              </td>
              <td className="px-2 py-3 text-center text-xl font-bold">{toPersianDigits(item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-4 text-sm">
        جمع اقلام: <span className="font-bold">{toPersianDigits(totalQty)} عدد</span>
        {order.shipping?.carrier && <> ، پیک: {order.shipping.carrier}</>}
        {order.shipping?.trackingCode && (
          <> ، کد رهگیری: <span dir="ltr">{order.shipping.trackingCode}</span></>
        )}
      </p>

      <div className="mt-12 grid grid-cols-2 gap-10 text-sm">
        <div className="border-t border-neutral-400 pt-2 text-center text-neutral-600">بسته‌بندی‌کننده</div>
        <div className="border-t border-neutral-400 pt-2 text-center text-neutral-600">بازبین</div>
      </div>

      <p className="mt-8 text-center text-xs text-neutral-500">
        فرستنده: {STORE.name} ، <span dir="ltr">{STORE.phone}</span> ، {STORE.address}
      </p>
    </>
  );
};

const AdminPrintPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const type = searchParams.get("type") === "packing" ? "packing" : "invoice";
  const rawIds = searchParams.get("ids");
  const ids = useMemo(() => parseIds(rawIds), [rawIds]);

  const [state, setState] = useState({ loading: true, orders: [], failed: 0 });

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, orders: [], failed: 0 });

    Promise.allSettled(ids.map((id) => axiosInstance.get(`/orders/admin/${id}`))).then((results) => {
      if (cancelled) return;
      const orders = results.filter((r) => r.status === "fulfilled").map((r) => r.value.data.data.order);
      setState({ loading: false, orders, failed: results.length - orders.length });
    });

    return () => {
      cancelled = true;
    };
  }, [ids]);

  const switchType = (next) => setSearchParams({ type: next, ids: ids.join(",") }, { replace: true });
  const Sheet = type === "packing" ? PackingSheet : InvoiceSheet;
  const { loading, orders, failed } = state;

  return (
    <div className="min-h-screen bg-neutral-200 px-4 py-6 text-neutral-900 print:bg-white print:p-0">
      <style>{`
        @page { size: A4; margin: 10mm; }
        @media print { html, body { background: #fff !important; } }
      `}</style>

      <div className="mx-auto mb-5 flex max-w-[210mm] flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          {[
            { id: "invoice", label: "فاکتور" },
            { id: "packing", label: "برگه‌ی بسته‌بندی" },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => switchType(option.id)}
              aria-pressed={type === option.id}
              className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                type === option.id ? "bg-neutral-900 text-white" : "bg-white text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-600">{toPersianDigits(orders.length)} سفارش</span>
          <button
            onClick={() => window.print()}
            disabled={loading || orders.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            چاپ
          </button>
        </div>
      </div>

      {failed > 0 && (
        <p className="mx-auto mb-4 max-w-[210mm] rounded-lg bg-white px-4 py-3 text-sm text-red-700 print:hidden">
          {toPersianDigits(failed)} سفارش بارگذاری نشد و در چاپ نیست.
        </p>
      )}

      {loading ? (
        <p className="py-20 text-center text-neutral-600">در حال بارگذاری...</p>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center text-neutral-600">
          <p>سفارشی برای چاپ پیدا نشد.</p>
          <Link to="/admin/orders" className="mt-3 inline-block text-sm text-neutral-900 underline">
            بازگشت به سفارش‌ها
          </Link>
        </div>
      ) : (
        orders.map((order, i) => (
          <article
            key={order._id}
            style={{ breakAfter: i < orders.length - 1 ? "page" : "auto" }}
            className="mx-auto mb-6 min-h-[297mm] w-full max-w-[210mm] bg-white p-[10mm] shadow-lg print:mb-0 print:min-h-0 print:max-w-none print:p-0 print:shadow-none"
          >
            <Sheet order={order} />
          </article>
        ))
      )}
    </div>
  );
};

export default AdminPrintPage;