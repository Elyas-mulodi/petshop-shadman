import { Minus, Plus } from "lucide-react";
import { toPersianDigits } from "../../utils/authHelpers";

const QuantitySelector = ({ value, onChange, max }) => (
  <div className="flex items-center gap-3 rounded-lg border border-line">
    <button
      onClick={() => onChange(Math.max(1, value - 1))}
      disabled={value <= 1}
      className="p-3 text-paper disabled:opacity-30"
      aria-label="کم کردن تعداد"
    >
      <Minus className="h-4 w-4" />
    </button>
    <span className="min-w-6 text-center text-sm text-paper">{toPersianDigits(value)}</span>
    <button
      onClick={() => onChange(Math.min(max, value + 1))}
      disabled={value >= max}
      className="p-3 text-paper disabled:opacity-30"
      aria-label="زیاد کردن تعداد"
    >
      <Plus className="h-4 w-4" />
    </button>
  </div>
);

export default QuantitySelector;