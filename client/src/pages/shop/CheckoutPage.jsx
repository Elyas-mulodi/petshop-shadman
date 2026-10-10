import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Accordion from "../../components/common/Accordion";
import Skeleton from "../../components/common/Skeleton";
import ErrorState from "../../components/common/ErrorState";
import { Field } from "../../components/auth/AuthParts";
import { SelectField, TextAreaField } from "../../components/checkout/FormControls";
import CouponBox from "../../components/checkout/CouponBox";
import CheckoutSummary, { CheckoutItems, CheckoutStickyBar } from "../../components/checkout/CheckoutSummary";
import useCart from "../../features/cart/useCart";
import { createOrder, getShippingConfig } from "../../features/orders/ordersApi";
import { addressSchema } from "../../features/orders/checkoutSchema";
import { getProfile } from "../../features/auth/authApi";
import { buildCartSummary } from "../../utils/cartSummary";
import { normalizeDigits, parseApiError, toPersianDigits } from "../../utils/authHelpers";
import locations from "../../data/iranLocations.json";

const provinces = locations.map((l) => l.province);

const Section = ({ title, children }) => (
  <section className="rounded-xl border border-line bg-card p-5">
    <h2 className="mb-5 font-display text-base font-bold text-paper">{title}</h2>
    {children}
  </section>
);

const CheckoutPage = () => {
  const { cart, showSkeleton, error: cartError, retry } = useCart();

  const [shippingConfig, setShippingConfig] = useState(null);
  const [loyalty, setLoyalty] = useState(null);
  const [coupon, setCoupon] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: { fullName: "", phone: "", province: "", city: "", addressLine: "", postalCode: "" },
  });

  const province = watch("province");
  const cities = useMemo(() => locations.find((l) => l.province === province)?.cities ?? [], [province]);

  useEffect(() => {
    getShippingConfig()
      .then((res) => setShippingConfig(res.data.data))
      .catch(() => setShippingConfig(null));
  }, []);

  // پیش‌پر کردن نام و موبایل از پروفایل (فقط اگه کاربر هنوز چیزی ننوشته) + تخفیف وفاداری
  useEffect(() => {
    getProfile()
      .then((res) => {
        const profile = res.data.data;
        if (!getValues("fullName") && profile.name) setValue("fullName", profile.name);
        if (!getValues("phone") && profile.phone) setValue("phone", profile.phone);
        setLoyalty(profile.pendingLoyaltyDiscount);
      })
      .catch(() => {});
  }, [getValues, setValue]);

  // اگه کاربر از صفحه درگاه با دکمه برگشت مرورگر برگرده، دکمه پرداخت نباید قفل بمونه
  useEffect(() => {
    const onPageShow = (e) => e.persisted && setSubmitting(false);
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const summary = useMemo(
    () => buildCartSummary({ subtotal: cart?.subtotal || 0, shippingConfig, loyalty, coupon }),
    [cart?.subtotal, shippingConfig, loyalty, coupon]
  );

  const onSubmit = async (address) => {
    setServerError("");
    setSubmitting(true);
    try {
      const { data } = await createOrder({
        shippingAddress: address,
        ...(coupon ? { couponCode: coupon.code } : {}),
      });
      window.location.assign(data.data.paymentUrl);
    } catch (err) {
      setServerError(parseApiError(err).message);
      setSubmitting(false);
    }
  };

  if (showSkeleton) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-12">
        <Skeleton className="mb-8 h-8 w-40" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
          <div className="flex flex-col gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="hidden h-80 lg:block" />
        </div>
      </div>
    );
  }

  if (cartError && !cart) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <ErrorState message={cartError} onRetry={retry} />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) return <Navigate to="/cart" replace />;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 lg:px-8 lg:pt-12">
      <h1 className="mb-8 font-display text-2xl font-bold text-paper">تسویه حساب</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <Section title="آدرس تحویل سفارش">
            <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                <Field
                  label="نام و نام خانوادگی گیرنده"
                  autoComplete="name"
                  error={errors.fullName?.message}
                  {...register("fullName")}
                />
                <Field
                  label="شماره موبایل گیرنده"
                  dir="ltr"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="09123456789"
                  className="text-left"
                  error={errors.phone?.message}
                  {...register("phone", {
                    onChange: (e) => {
                      e.target.value = normalizeDigits(e.target.value);
                    },
                  })}
                />
                <SelectField
                  label="استان"
                  placeholder="انتخاب استان"
                  options={provinces}
                  error={errors.province?.message}
                  {...register("province", { onChange: () => setValue("city", "") })}
                />
                <SelectField
                  label="شهر"
                  placeholder={province ? "انتخاب شهر" : "ابتدا استان را انتخاب کنید"}
                  options={cities}
                  disabled={!province}
                  error={errors.city?.message}
                  {...register("city")}
                />
              </div>

              <TextAreaField
                label="آدرس دقیق"
                placeholder="خیابان، کوچه، پلاک، واحد"
                error={errors.addressLine?.message}
                {...register("addressLine")}
              />

              <div className="sm:max-w-xs">
                <Field
                  label="کد پستی"
                  dir="ltr"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="1234567890"
                  className="text-left"
                  error={errors.postalCode?.message}
                  {...register("postalCode", {
                    onChange: (e) => {
                      e.target.value = normalizeDigits(e.target.value);
                    },
                  })}
                />
              </div>
            </form>
          </Section>

          <Section title="کد تخفیف">
            <CouponBox
              coupon={coupon}
              onApplied={setCoupon}
              onRemoved={() => setCoupon(null)}
            />
            {!coupon && summary.discountSource === "loyalty" && (
              <p className="mt-3 text-xs leading-6 text-muted">
                تخفیف وفاداری شما اعمال شده است. با ثبت کد تخفیف، فقط یکی از این دو تخفیف اعمال می‌شود.
              </p>
            )}
          </Section>

          {/* مرور سفارش: فقط موبایل و تبلت (در دسکتاپ داخل کارت خلاصه است) */}
          <div className="lg:hidden">
            <Accordion
              defaultOpen={-1}
              items={[
                {
                  title: `مرور سفارش (${toPersianDigits(cart.itemsCount)} کالا)`,
                  content: <CheckoutItems items={cart.items} />,
                },
              ]}
            />
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <CheckoutSummary items={cart.items} summary={summary} submitting={submitting} error={serverError} />
          </div>
        </aside>
      </div>

      <CheckoutStickyBar summary={summary} submitting={submitting} error={serverError} />
    </div>
  );
};

export default CheckoutPage;