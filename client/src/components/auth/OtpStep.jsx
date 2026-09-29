import { useEffect, useState } from "react";
import { parseApiError, toPersianDigits } from "../../utils/authHelpers";
import OtpInput from "./OtpInput";
import { FormError, StepHeading } from "./AuthParts";

const useCountdown = (seconds) => {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (left <= 0) return;
    const timer = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);

  return [left, () => setLeft(seconds)];
};

const formatTime = (s) => toPersianDigits(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`);

const OtpStep = ({ phone, onVerify, onResend, onEditPhone, onError }) => {
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [secondsLeft, restart] = useCountdown(120);

  const verify = async (code) => {
    setServerError("");
    setLoading(true);
    try {
      await onVerify(code);
    } catch (err) {
      setServerError(parseApiError(err).message);
      setResetKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setServerError("");
    try {
      await onResend();
      restart();
      setResetKey((k) => k + 1);
    } catch (err) {
      setServerError(parseApiError(err).message);
    }
  };

  return (
    <div>
      <StepHeading
        title="کد تایید"
        hint={
          <>
            کد ۴ رقمی ارسال‌شده به <span dir="ltr">{phone}</span> را وارد کنید
          </>
        }
      />

      <OtpInput
        key={resetKey}
        disabled={loading}
        onChange={(code) => code.length === 4 && verify(code)}
      />

      <div className="mt-5">
        <FormError message={serverError} />
      </div>

      <div className="mt-6 flex items-center justify-between text-sm">
        {secondsLeft > 0 ? (
          <span className="text-muted">ارسال مجدد کد تا {formatTime(secondsLeft)}</span>
        ) : (
          <button type="button" onClick={resend} className="text-bronze hover:underline">
            ارسال مجدد کد
          </button>
        )}
        <button type="button" onClick={onEditPhone} className="text-muted hover:text-paper">
          ویرایش شماره
        </button>
      </div>
    </div>
  );
};

export default OtpStep;