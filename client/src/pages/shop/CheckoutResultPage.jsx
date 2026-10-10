import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

const states = {
  success: {
    icon: CheckCircle2,
    tone: "text-bronze",
    title: "پرداخت با موفقیت انجام شد",
    text: "سفارش شما ثبت شد و به‌زودی پردازش می‌شود. تایید سفارش برای شماره‌ی شما پیامک می‌شود.",
    primary: { to: "/my-orders", label: "سفارش‌های من" },
    secondary: { to: "/products", label: "ادامه خرید" },
  },
  failed: {
    icon: XCircle,
    tone: "text-danger",
    title: "پرداخت ناموفق بود",
    text: "پرداخت شما تکمیل نشد. اگر مبلغی از حساب شما کسر شده، طبق قوانین درگاه به حساب‌تان بازمی‌گردد.",
    primary: { to: "/cart", label: "بازگشت به سبد خرید" },
    secondary: { to: "/", label: "صفحه اصلی" },
  },
  "already-processed": {
    icon: Info,
    tone: "text-sage",
    title: "این سفارش قبلاً پردازش شده است",
    text: "نتیجه‌ی این پرداخت قبلاً ثبت شده است. وضعیت سفارش را از بخش سفارش‌های من ببینید.",
    primary: { to: "/my-orders", label: "سفارش‌های من" },
    secondary: { to: "/", label: "صفحه اصلی" },
  },
  "not-found": {
    icon: AlertTriangle,
    tone: "text-muted",
    title: "سفارش پیدا نشد",
    text: "اطلاعات این پرداخت پیدا نشد. اگر مبلغی از حساب شما کسر شده، با پشتیبانی تماس بگیرید.",
    primary: { to: "/", label: "صفحه اصلی" },
    secondary: { to: "/cart", label: "سبد خرید" },
  },
};

const CheckoutResultPage = () => {
  const [params] = useSearchParams();
  const state = states[params.get("status")] || states["not-found"];
  const orderNumber = params.get("order");
  const Icon = state.icon;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-line bg-card">
        <Icon className={`h-8 w-8 ${state.tone}`} strokeWidth={1.5} />
      </span>

      <h1 className="font-display text-xl font-bold text-paper">{state.title}</h1>
      <p className="mt-3 text-sm leading-7 text-muted">{state.text}</p>

      {orderNumber && (
        <p className="mt-5 rounded-lg border border-line bg-card px-4 py-2 text-xs text-muted">
          شماره سفارش: <span dir="ltr" className="font-medium text-paper">{orderNumber}</span>
        </p>
      )}

      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
        <Link
          to={state.primary.to}
          className="flex-1 rounded-lg bg-bronze py-3 text-sm font-medium text-ink transition-opacity hover:opacity-90"
        >
          {state.primary.label}
        </Link>
        <Link
          to={state.secondary.to}
          className="flex-1 rounded-lg border border-line py-3 text-sm text-paper transition-colors hover:border-bronze/60"
        >
          {state.secondary.label}
        </Link>
      </div>
    </div>
  );
};

export default CheckoutResultPage;