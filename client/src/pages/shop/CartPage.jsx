import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Info, PawPrint, ShoppingBag, TriangleAlert } from "lucide-react";
import CartItem from "../../components/cart/CartItem";
import CartSummary, { CartStickyBar } from "../../components/cart/CartSummary";
import FreeShippingBar from "../../components/cart/FreeShippingBar";
import Skeleton from "../../components/common/Skeleton";
import ErrorState from "../../components/common/ErrorState";
import useCart from "../../features/cart/useCart";
import { getShippingConfig } from "../../features/orders/ordersApi";
import { getProfile } from "../../features/auth/authApi";
import { buildCartSummary } from "../../utils/cartSummary";
import { toPersianDigits } from "../../utils/authHelpers";

const ease = [0.22, 1, 0.36, 1];

// ستون اصلی + ستون خلاصه‌ی سفارش؛ minmax(0,1fr) تا آیتم‌های بلند از عرض صفحه بیرون نزنن
const LAYOUT = "grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8";

const CartPage = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const { cart, showSkeleton, error, actionError, busyId, prunedNotice, updateQuantity, remove, retry } = useCart();
  const reduce = useReducedMotion();

  const [shippingConfig, setShippingConfig] = useState(null);
  const [loyalty, setLoyalty] = useState(null);

  useEffect(() => {
    getShippingConfig()
      .then((res) => setShippingConfig(res.data.data))
      .catch(() => setShippingConfig(null));
  }, []);

  // تخفیف وفاداری فقط برای کاربر لاگین‌شده؛ از پروفایل تازه خونده می‌شه
  useEffect(() => {
    if (!isAuthenticated) {
      setLoyalty(null);
      return;
    }
    getProfile()
      .then((res) => setLoyalty(res.data.data.pendingLoyaltyDiscount))
      .catch(() => setLoyalty(null));
  }, [isAuthenticated]);

  const summary = useMemo(
    () => buildCartSummary({ subtotal: cart?.subtotal || 0, shippingConfig, loyalty }),
    [cart?.subtotal, shippingConfig, loyalty]
  );

  const cta = isAuthenticated
    ? { to: "/checkout", label: "ادامه و تسویه حساب" }
    : { to: "/login", state: { from: "/checkout" }, label: "ورود و ادامه خرید" };

  if (showSkeleton) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        <Skeleton className="mb-6 h-8 w-40 sm:mb-8" />
        <div className={LAYOUT}>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-12 rounded-2xl" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="hidden h-72 rounded-2xl lg:block" />
        </div>
      </div>
    );
  }

  if (error && !cart) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <ErrorState message={error} onRetry={retry} />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
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
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="relative mx-auto flex min-h-[55vh] max-w-md flex-col items-center justify-center px-4 py-12 text-center sm:py-20"
        >
          <span className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-bronze/15 text-bronze ring-1 ring-bronze/25">
            <ShoppingBag className="h-9 w-9" strokeWidth={1.4} />
          </span>
          <h1 className="font-display text-xl font-bold text-paper sm:text-2xl">سبد خرید شما خالی است</h1>
          <p className="mt-2 text-sm leading-7 text-muted">برای شروع، محصولات فروشگاه را ببینید.</p>
          <Link
            to="/products"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-bronze px-8 py-3 text-sm font-medium text-ink transition-opacity hover:opacity-90"
          >
            مشاهده محصولات
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-12 lg:pt-12">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:mb-8">
        <h1 className="flex items-center gap-3 font-display text-xl font-bold text-paper sm:text-2xl lg:text-3xl">
          سبد خرید
          <span className="rounded-full bg-bronze/15 px-3 py-0.5 font-sans text-xs font-medium text-bronze sm:text-sm">
            {toPersianDigits(cart.itemsCount)} کالا
          </span>
        </h1>

        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-bronze sm:text-sm"
        >
          ادامه خرید
          <ArrowRight className="h-4 w-4 rotate-180" />
        </Link>
      </div>

      <div className={LAYOUT}>
        <div className="min-w-0">
          {prunedNotice && (
            <p
              role="status"
              className="mb-4 flex items-start gap-2.5 rounded-xl border border-line bg-card px-4 py-3 text-xs leading-6 text-muted"
            >
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-sage" />
              بعضی کالاها دیگر موجود نبودند و از سبد شما حذف شدند.
            </p>
          )}
          {actionError && (
            <p
              role="alert"
              className="mb-4 flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-xs leading-6 text-danger"
            >
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              {actionError}
            </p>
          )}

          <FreeShippingBar summary={summary} />

          <div className="flex flex-col gap-3">
            <AnimatePresence initial={false} mode="popLayout">
              {cart.items.map((item) => (
                <motion.div
                  key={item.variantId}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  transition={{ duration: 0.25, ease }}
                  className="min-w-0"
                >
                  <CartItem item={item} busy={busyId === item.variantId} onQuantity={updateQuantity} onRemove={remove} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <p className="mt-4 text-center text-[11px] text-muted sm:hidden">
            برای حذف یک کالا، ردیف آن را به سمت چپ بکشید.
          </p>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <CartSummary summary={summary} cta={cta} />
          </div>
        </aside>
      </div>

      <CartStickyBar summary={summary} cta={cta} />
    </div>
  );
};

export default CartPage;