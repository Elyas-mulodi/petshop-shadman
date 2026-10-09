import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { AnimatePresence, motion } from "motion/react";
import { ShoppingBag } from "lucide-react";
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

const CartPage = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const { cart, showSkeleton, error, actionError, busyId, prunedNotice, updateQuantity, remove, retry } = useCart();

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
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-12">
        <Skeleton className="mb-8 h-8 w-40" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="hidden h-72 lg:block" />
        </div>
      </div>
    );
  }

  if (error && !cart) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <ErrorState message={error} onRetry={retry} />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <ShoppingBag className="mb-5 h-12 w-12 text-sage" strokeWidth={1.3} />
        <h1 className="font-display text-xl font-bold text-paper">سبد خرید شما خالی است</h1>
        <p className="mt-2 text-sm text-muted">برای شروع، محصولات فروشگاه را ببینید.</p>
        <Link
          to="/products"
          className="mt-6 rounded-lg bg-bronze px-6 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90"
        >
          مشاهده محصولات
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 lg:px-8 lg:pt-12">
      <h1 className="mb-8 font-display text-2xl font-bold text-paper">
        سبد خرید <span className="text-sm font-normal text-muted">({toPersianDigits(cart.itemsCount)} کالا)</span>
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          {prunedNotice && (
            <p className="mb-4 rounded-lg border border-line bg-card px-4 py-3 text-xs text-muted">
              بعضی کالاها دیگر موجود نبودند و از سبد شما حذف شدند.
            </p>
          )}
          {actionError && (
            <p role="alert" className="mb-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
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
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
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