import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Field, FormError } from "../auth/AuthParts";
import { Card, FormSuccess, PrimaryButton } from "./ProfileParts";
import { changePasswordFormSchema } from "../../features/users/profileSchemas";
import { changePassword } from "../../features/users/userApi";
import { parseApiError } from "../../utils/authHelpers";

const STRENGTH = [
  null,
  { label: "ضعیف", tone: "bg-danger" },
  { label: "متوسط", tone: "bg-bronze" },
  { label: "خوب", tone: "bg-bronze" },
  { label: "قوی", tone: "bg-sage" },
];

const getStrength = (value = "") => {
  let score = 0;
  if (value.length >= 6) score = 1;
  if (value.length >= 8) score = 2;
  if (score === 2 && /[A-Za-z]/.test(value) && /\d/.test(value)) score = 3;
  if (score === 3 && (value.length >= 12 || /[^A-Za-z0-9]/.test(value)))
    score = 4;
  return score;
};

const ChangePasswordForm = () => {
  const [show, setShow] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(changePasswordFormSchema) });

  const newPassword = watch("newPassword");
  const score = getStrength(newPassword);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 4000);
    return () => clearTimeout(t);
  }, [success]);

  const submit = async ({ currentPassword, newPassword: next }) => {
    setServerError("");
    setSuccess("");
    setLoading(true);
    try {
      await changePassword({ currentPassword, newPassword: next });
      reset();
      setSuccess("رمز عبور شما تغییر کرد");
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
      aria-label={show ? "پنهان کردن رمزها" : "نمایش رمزها"}
      className="text-muted hover:text-paper"
    >
      {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
    </button>
  );

  return (
    <Card
      icon={ShieldCheck}
      title="امنیت حساب"
      hint="برای تغییر رمز، ابتدا رمز فعلی را وارد کنید."
    >
      <form onSubmit={handleSubmit(submit)} noValidate>
        <Field
          label="رمز عبور فعلی"
          type={show ? "text" : "password"}
          dir="ltr"
          autoComplete="current-password"
          trailing={toggle}
          error={errors.currentPassword?.message}
          {...register("currentPassword")}
        />
        <Field
          label="رمز عبور جدید"
          type={show ? "text" : "password"}
          dir="ltr"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />

        {newPassword && (
          <div className="-mt-2 mb-4">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= score ? STRENGTH[score].tone : "bg-well"
                  }`}
                />
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted">
              قدرت رمز: {STRENGTH[score]?.label ?? "خیلی کوتاه"}
            </p>
          </div>
        )}

        <Field
          label="تکرار رمز عبور جدید"
          type={show ? "text" : "password"}
          dir="ltr"
          autoComplete="new-password"
          error={errors.confirm?.message}
          {...register("confirm")}
        />

        <FormSuccess message={success} />
        <FormError message={serverError} />
        <PrimaryButton loading={loading}>تغییر رمز عبور</PrimaryButton>
      </form>
    </Card>
  );
};

export default ChangePasswordForm;
