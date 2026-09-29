import { useEffect, useRef, useState } from "react";
import { normalizeDigits } from "../../utils/authHelpers";

const LENGTH = 4;

const OtpInput = ({ onChange, disabled }) => {
  const [digits, setDigits] = useState(Array(LENGTH).fill(""));
  const refs = useRef([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const update = (next) => {
    setDigits(next);
    onChange(next.join(""));
  };

  const handleChange = (index, e) => {
    const digit = normalizeDigits(e.target.value).replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    update(next);
    if (digit && index < LENGTH - 1) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = normalizeDigits(e.clipboardData.getData("text"))
      .replace(/\D/g, "")
      .slice(0, LENGTH);
    if (!pasted) return;
    update(Array.from({ length: LENGTH }, (_, i) => pasted[i] || ""));
    refs.current[Math.min(pasted.length, LENGTH - 1)]?.focus();
  };

  return (
    <div dir="ltr" className="flex justify-center gap-3" onPaste={handlePaste}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={digit}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={2}
          disabled={disabled}
          aria-label={`رقم ${i + 1} کد تایید`}
          className="h-12 w-11 rounded-lg border border-line bg-ink text-center text-lg font-medium text-paper transition-colors focus:border-bronze focus:outline-none disabled:opacity-60"        />
      ))}
    </div>
  );
};

export default OtpInput;