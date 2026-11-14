import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { AlertTriangle, Check, CheckCircle2, Copy, Info, PawPrint, XCircle } from "lucide-react";

const ease = [0.22, 1, 0.36, 1];

// chip: قاب آیکون، glow: هاله‌ی پشت آیکون
const states = {
  success: {
    icon: CheckCircle2,
    chip: "bg-bronze/15 text-bronze ring-bronze/30",
    glow: "bg-bronze/25",
    title: "پرداخت با موفقیت انجام شد",
    text: "سفارش شما ثبت شد و به‌زودی پردازش می‌شود. تایید سفارش برای شماره‌ی شما پیامک می‌شود.",
    primary: { to: "/my-orders", label: "سفارش‌های من" },
    secondary: { to: "/products", label: "ادامه خرید" },
  },
  failed: {
    icon: XCircle,
    chip: "bg-danger/15 text-danger ring-danger/30",
    glow: "bg-danger/20",
    title: "پرداخت ناموفق بود",
    text: "پرداخت شما تکمیل نشد. اگر مبلغی از حساب شما کسر شده، طبق قوانین درگاه به حساب‌تان بازمی‌گردد.",
    primary: { to: "/cart", label: "بازگشت به سبد خرید" },
    secondary: { to: "/", label: "صفحه اصلی" },
  },
  "already-processed": {
    icon: Info,
    chip: "bg-sage/15 text-sage ring-sage/30",
    glow: "bg-sage/20",
    title: "این سفارش قبلاً پردازش شده است",
    text: "نتیجه‌ی این پرداخت قبلاً ثبت شده است. وضعیت سفارش را از بخش سفارش‌های من ببینید.",
    primary: { to: "/my-orders", label: "سفارش‌های من" },
    secondary: { to: "/", label: "صفحه اصلی" },
  },
  "not-found": {
    icon: AlertTriangle,
    chip: "bg-well text-muted ring-line",
    glow: "bg-paper/10",
    title: "سفارش پیدا نشد",
    text: "اطلاعات این پرداخت پیدا نشد. اگر مبلغی از حساب شما کسر شده، با پشتیبانی تماس بگیرید.",
    primary: { to: "/", label: "صفحه اصلی" },
    secondary: { to: "/cart", label: "سبد خرید" },
  },
};

const CheckoutResultPage = () => {
  const [params] = useSearchParams();
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState(false);

  const state = states[params.get("status")] || states["not-found"];
  const orderNumber = params.get("order");
  const Icon = state.icon;

  const copyOrder = async () => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // کپی پشتیبانی نشد؛ شماره روی صفحه هست و کاربر دستی کپی می‌کنه
    }
  };

  return (
    <div className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -right-24 top-10 h-64 w-64 rounded-full bg-bronze/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -left-24 bottom-10 h-64 w-64 rounded-full bg-sage/10 blur-3xl" />
      <PawPrint
        aria-hidden
        className="pointer-events-none absolute -bottom-8 left-4 h-40 w-40 -rotate-12 text-paper/[0.04] sm:left-24 sm:h-56 sm:w-56"
        strokeWidth={0.8}
      />

      <motion.div
        role="status"
        aria-live="polite"
        initial={reduce ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease }}
        className="relative mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-12 text-center sm:py-20"
      >
        {/* آیکون با هاله‌ی رنگی */}
        <div className="relative mb-6">
          <span aria-hidden className={`absolute inset-0 -z-0 scale-150 rounded-full blur-2xl ${state.glow}`} />
          <motion.span
            initial={reduce ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 16, delay: 0.15 }}
            className={`relative flex h-20 w-20 items-center justify-center rounded-3xl ring-1 sm:h-24 sm:w-24 ${state.chip}`}
          >
            <Icon className="h-10 w-10 sm:h-12 sm:w-12" strokeWidth={1.4} />
          </motion.span>
        </div>

        <h1 className="font-display text-xl font-bold leading-snug text-paper sm:text-2xl">{state.title}</h1>
        <p className="mt-3 max-w-sm text-sm leading-7 text-muted">{state.text}</p>

        {orderNumber && (
          <div className="mt-6 flex max-w-full items-center gap-2 rounded-full border border-line bg-card py-1.5 pe-1.5 ps-4 text-xs text-muted">
            <span className="shrink-0">شماره سفارش:</span>
            <span dir="ltr" className="min-w-0 truncate font-medium text-paper">
              {orderNumber}
            </span>
            <button
              type="button"
              onClick={copyOrder}
              aria-label="کپی شماره سفارش"
              title="کپی شماره سفارش"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-well text-muted transition-colors hover:text-bronze"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-bronze" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}

        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
          <Link
            to={state.primary.to}
            className="flex flex-1 items-center justify-center rounded-full bg-bronze py-3 text-sm font-medium text-ink transition-opacity hover:opacity-90"
          >
            {state.primary.label}
          </Link>
          <Link
            to={state.secondary.to}
            className="flex flex-1 items-center justify-center rounded-full border border-line py-3 text-sm text-paper transition-colors hover:border-bronze/60 hover:text-bronze"
          >
            {state.secondary.label}
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default CheckoutResultPage;