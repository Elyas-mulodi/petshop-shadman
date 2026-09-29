import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
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

  const toggle = (
    <button
      type="button"
      onClick={() => setShow((s) => !s)}
      aria-label={show ? "پنهان کردن رمز" : "نمایش رمز"}
      className="text-muted hover:text-paper"
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
          <p className="mb-4 rounded-lg border border-sage/50 bg-sage/10 px-3 py-2 text-center text-sm text-paper">
            {notice}
          </p>
        )}

        <Field
          label="شماره موبایل"
          dir="ltr"
          inputMode="tel"
          autoComplete="tel"
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
          trailing={toggle}
          error={errors.password?.message}
          {...register("password")}
        />

        <FormError message={serverError} />
        <SubmitButton loading={loading}>ورود</SubmitButton>

        <div className="mt-5 flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="text-muted hover:text-paper">
            فراموشی رمز عبور
          </Link>
          <Link to="/register" className="text-bronze hover:underline">
            ساخت حساب
          </Link>
        </div>
      </form>
    </AuthShell>
  );
};

export default LoginPage;
