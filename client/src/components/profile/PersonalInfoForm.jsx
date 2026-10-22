import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, User } from "lucide-react";
import { Field, FormError } from "../auth/AuthParts";
import { Card, FormSuccess, PrimaryButton } from "./ProfileParts";
import { profileSchema } from "../../features/users/profileSchemas";
import { updateProfile } from "../../features/users/userApi";
import { updateUser } from "../../features/auth/authSlice";
import { parseApiError } from "../../utils/authHelpers";

const PersonalInfoForm = ({ user }) => {
  const dispatch = useDispatch();
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || "", email: user?.email || "" },
  });

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 4000);
    return () => clearTimeout(t);
  }, [success]);

  const submit = async (values) => {
    setServerError("");
    setSuccess("");

    // بکند حذف ایمیل رو پشتیبانی نمی‌کنه؛ بهتره همین‌جا به کاربر بگیم
    if (!values.email && user?.email) {
      setError("email", {
        message: "ایمیل ثبت‌شده قابل حذف نیست، فقط می‌توانید آن را تغییر دهید",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = { name: values.name };
      if (values.email) payload.email = values.email.toLowerCase();

      const { data } = await updateProfile(payload);
      dispatch(updateUser(data.data));
      reset({ name: data.data.name || "", email: data.data.email || "" });
      setSuccess("اطلاعات شما ذخیره شد");
    } catch (err) {
      setServerError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      icon={User}
      title="اطلاعات شخصی"
      hint="نام و ایمیل شما در سفارش‌ها و پیام‌ها استفاده می‌شود."
    >
      <form onSubmit={handleSubmit(submit)} noValidate>
        <Field
          label="نام و نام خانوادگی"
          autoComplete="name"
          error={errors.name?.message}
          {...register("name")}
        />
        <Field
          label="ایمیل (اختیاری)"
          type="email"
          dir="ltr"
          inputMode="email"
          autoComplete="email"
          placeholder="name@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Field
          label="شماره موبایل"
          dir="ltr"
          value={user?.phone || ""}
          readOnly
          tabIndex={-1}
          className="cursor-not-allowed opacity-60"
          trailing={<Lock className="h-4 w-4 text-muted" />}
        />
        <p className="-mt-2 mb-5 text-xs leading-6 text-muted">
          شماره موبایل برای ورود استفاده می‌شود و قابل تغییر نیست.
        </p>

        <FormSuccess message={success} />
        <FormError message={serverError} />
        <PrimaryButton loading={loading} disabled={!isDirty}>
          ذخیره تغییرات
        </PrimaryButton>
      </form>
    </Card>
  );
};

export default PersonalInfoForm;
