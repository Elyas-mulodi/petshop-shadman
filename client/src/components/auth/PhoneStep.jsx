import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { phoneOnlySchema } from "../../features/auth/authSchemas";
import { normalizeDigits, parseApiError } from "../../utils/authHelpers";
import { Field, FormError, StepHeading, SubmitButton } from "./AuthParts";

const PhoneStep = ({ heading, hint, submitLabel, onSubmit, onError, footer }) => {
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(phoneOnlySchema) });

  const submit = async ({ phone }) => {
    setServerError("");
    setLoading(true);
    try {
      await onSubmit(phone);
    } catch (err) {
      setServerError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <StepHeading title={heading} hint={hint} />
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
      <FormError message={serverError} />
      <SubmitButton loading={loading}>{submitLabel}</SubmitButton>
      {footer}
    </form>
  );
};

export default PhoneStep;