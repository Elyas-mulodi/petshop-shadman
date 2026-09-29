import { useState } from "react";
import { Link } from "react-router-dom";
import AuthShell from "../../components/auth/AuthShell";
import PhoneStep from "../../components/auth/PhoneStep";
import OtpStep from "../../components/auth/OtpStep";
import PasswordStep from "../../components/auth/PasswordStep";
import {
  sendRegisterOtp,
  verifyRegisterOtp,
  setRegisterPassword,
} from "../../features/auth/authApi";
import useAuthSuccess from "../../features/auth/useAuthSuccess";

const steps = ["phone", "otp", "password"];

const copy = {
  phone: { title: "ساخت حساب", subtitle: "با شماره موبایل خود در چند ثانیه ثبت‌نام کنید" },
  otp: { title: "تایید شماره", subtitle: "کد کوتاهی برای موبایل شما ارسال شد" },
  password: { title: "آخرین قدم", subtitle: "برای حساب خود یک رمز عبور انتخاب کنید" },
};

const RegisterPage = () => {
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [registrationToken, setRegistrationToken] = useState("");

  const finishAuth = useAuthSuccess();

  const handleSendOtp = async (value) => {
    await sendRegisterOtp(value);
    setPhone(value);
    setStep("otp");
  };

  const handleVerify = async (code) => {
    const { data } = await verifyRegisterOtp(phone, code);
    setRegistrationToken(data.registrationToken);
    setStep("password");
  };

  const handleSetPassword = async (password) => {
    const { data } = await setRegisterPassword(registrationToken, password);
    await finishAuth(data);
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
          heading="ثبت‌نام"
          hint="کد تایید برای این شماره پیامک می‌شود"
          submitLabel="دریافت کد تایید"
          onSubmit={handleSendOtp}
          footer={
            <p className="mt-5 text-center text-sm text-muted">
              قبلاً ثبت‌نام کرده‌اید؟{" "}
              <Link to="/login" className="text-bronze hover:underline">
                ورود
              </Link>
            </p>
          }
        />
      )}

      {step === "otp" && (
        <OtpStep
          phone={phone}
          onVerify={handleVerify}
          onResend={() => sendRegisterOtp(phone)}
          onEditPhone={() => setStep("phone")}
        />
      )}

      {step === "password" && (
        <PasswordStep
          heading="انتخاب رمز عبور"
          hint="حداقل ۶ کاراکتر"
          submitLabel="ساخت حساب"
          onSubmit={handleSetPassword}
        />
      )}
    </AuthShell>
  );
};

export default RegisterPage;