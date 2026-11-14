import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import AuthShell from "../../components/auth/AuthShell";
import {
  Field,
  FormError,
  StepHeading,
  SubmitButton,
} from "../../components/auth/AuthParts";
import { loginSchema } from "../../features/auth/authSchemas";
import { login } from "../../features/auth/authApi";
import useAuthSuccess from "../../features/auth/useAuthSuccess";
import { normalizeDigits, parseApiError } from "../../utils/authHelpers";

const LoginPage = () => {
  const [show, setShow] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const finishAuth = useAuthSuccess();
  const notice = useLocation().state?.notice;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const submit = async ({ phone, password }) => {
    setServerError("");
    setLoading(true);
    try {
      const { data } = await login(phone, password);
      await finishAuth(data);
    } catch (err) {
      setServerError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  // ناحیه‌ی لمس بزرگ‌تر از خود آیکون (روی موبایل راحت‌تر زده میشه)
  const toggle = (
    <button
      type="button"
      onClick={() => setShow((s) => !s)}
      aria-label={show ? "پنهان کردن رمز" : "نمایش رمز"}
      className="-m-2 rounded-full p-2 text-muted transition-colors hover:text-paper focus-visible:text-bronze focus-visible:outline-none"
    >
      {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
    </button>
  );

  return (
    <AuthShell
      title="خوش آمدید"
      subtitle="برای ادامه خرید وارد حساب خود شوید"
      stepKey="login"
    >
      <form onSubmit={handleSubmit(submit)} noValidate>
        <StepHeading title="ورود به حساب" />

        {notice && (
          <p
            role="status"
            className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-sage/40 bg-sage/10 px-3 py-2.5 text-center text-sm leading-6 text-paper"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-sage" />
            {notice}
          </p>
        )}

        <Field
          label="شماره موبایل"
          dir="ltr"
          inputMode="tel"
          autoComplete="username"
          enterKeyHint="next"
          placeholder="09123456789"
          autoFocus
          error={errors.phone?.message}
          {...register("phone", {
            onChange: (e) => {
              e.target.value = normalizeDigits(e.target.value);
            },
          })}
        />
        <Field
          label="رمز عبور"
          type={show ? "text" : "password"}
          dir="ltr"
          autoComplete="current-password"
          enterKeyHint="go"
          trailing={toggle}
          error={errors.password?.message}
          {...register("password")}
        />

        <FormError message={serverError} />
        <SubmitButton loading={loading}>ورود</SubmitButton>

        <div className="mt-4 text-center">
          <Link
            to="/forgot-password"
            className="inline-block py-1.5 text-sm text-muted transition-colors hover:text-paper"
          >
            فراموشی رمز عبور
          </Link>
        </div>

        {/* ثبت‌نام: جدا و واضح، با ناحیه‌ی لمس بزرگ */}
        <div className="mt-4 flex items-center gap-3" aria-hidden>
          <span className="h-px flex-1 bg-line" />
          <span className="text-xs text-muted">حساب ندارید؟</span>
          <span className="h-px flex-1 bg-line" />
        </div>
        <Link
          to="/register"
          className="mt-4 flex items-center justify-center rounded-full border border-line py-3 text-sm text-bronze transition-colors hover:border-bronze/60 hover:bg-bronze/10"
        >
          ساخت حساب
        </Link>
      </form>
    </AuthShell>
  );
};

export default LoginPage;