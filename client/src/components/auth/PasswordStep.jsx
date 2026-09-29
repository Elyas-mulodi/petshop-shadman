import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { newPasswordSchema } from "../../features/auth/authSchemas";
import { parseApiError } from "../../utils/authHelpers";
import { Field, FormError, StepHeading, SubmitButton } from "./AuthParts";

const PasswordStep = ({ heading, hint, submitLabel, onSubmit, onError }) => {
  const [show, setShow] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(newPasswordSchema) });

  const submit = async ({ password }) => {
    setServerError("");
    setLoading(true);
    try {
      await onSubmit(password);
    } catch (err) {
      setServerError(parseApiError(err).message);
      onError?.();
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
    <form onSubmit={handleSubmit(submit)} noValidate>
      <StepHeading title={heading} hint={hint} />
      <Field
        label="رمز عبور"
        type={show ? "text" : "password"}
        dir="ltr"
        autoComplete="new-password"
        autoFocus
        trailing={toggle}
        error={errors.password?.message}
        {...register("password")}
      />
      <Field
        label="تکرار رمز عبور"
        type={show ? "text" : "password"}
        dir="ltr"
        autoComplete="new-password"
        error={errors.confirm?.message}
        {...register("confirm")}
      />
      <FormError message={serverError} />
      <SubmitButton loading={loading}>{submitLabel}</SubmitButton>
    </form>
  );
};

export default PasswordStep;