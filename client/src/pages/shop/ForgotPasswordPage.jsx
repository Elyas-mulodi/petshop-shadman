import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../../components/auth/AuthShell";
import PhoneStep from "../../components/auth/PhoneStep";
import OtpStep from "../../components/auth/OtpStep";
import PasswordStep from "../../components/auth/PasswordStep";
import {
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPassword,
} from "../../features/auth/authApi";

const steps = ["phone", "otp", "password"];

const copy = {
  phone: { title: "بازیابی رمز عبور", subtitle: "شماره‌ای که با آن ثبت‌نام کرده‌اید را وارد کنید" },
  otp: { title: "تایید شماره", subtitle: "کد کوتاهی برای موبایل شما ارسال شد" },
  password: { title: "رمز عبور جدید", subtitle: "رمزی انتخاب کنید که فراموش نکنید" },
};

const ForgotPasswordPage = () => {
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [resetToken, setResetToken] = useState("");
  const navigate = useNavigate();


  const handleSendOtp = async (value) => {
    await sendForgotPasswordOtp(value);
    setPhone(value);
    setStep("otp");
  };

  const handleVerify = async (code) => {
    const { data } = await verifyForgotPasswordOtp(phone, code);
    setResetToken(data.resetToken);
    setStep("password");
  };

  const handleReset = async (password) => {
    await resetPassword(resetToken, password);
    navigate("/login", {
      replace: true,
      state: { notice: "رمز عبور با موفقیت تغییر کرد. وارد شوید." },
    });
  };

  return (
    <AuthShell
      title={copy[step].title}
      subtitle={copy[step].subtitle}
      stepKey={step}
      progress={(steps.indexOf(step) + 1) / steps.length}
    >
      {step === "phone" && (
        <PhoneStep
          heading="فراموشی رمز عبور"
          hint="کد بازیابی برای این شماره پیامک می‌شود"
          submitLabel="دریافت کد بازیابی"
          onSubmit={handleSendOtp}
          footer={
            <p className="mt-5 text-center text-sm text-muted">
              <Link to="/login" className="text-bronze hover:underline">
                بازگشت به ورود
              </Link>
            </p>
          }
        />
      )}

      {step === "otp" && (
        <OtpStep
          phone={phone}
          onVerify={handleVerify}
          onResend={() => sendForgotPasswordOtp(phone)}
          onEditPhone={() => setStep("phone")}
        />
      )}

      {step === "password" && (
        <PasswordStep
          heading="رمز عبور جدید"
          hint="حداقل ۶ کاراکتر"
          submitLabel="ثبت رمز جدید"
          onSubmit={handleReset}
        />
      )}
    </AuthShell>
  );
};

export default ForgotPasswordPage;