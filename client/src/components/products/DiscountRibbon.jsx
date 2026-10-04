import { toPersianDigits } from "../../utils/authHelpers";

// بج تخفیف به شکل برچسب چرخیده روی گوشه عکس
const DiscountRibbon = ({ percent }) => (
  <div
    className="absolute -right-2 -top-2 z-10 rotate-[-10deg] rounded-md bg-bronze px-3 py-1.5 text-xs font-bold text-ink shadow-[0_6px_16px_-4px_rgba(176,136,80,0.5)]"
    aria-hidden="true"
  >
    {toPersianDigits(percent)}٪
    <span className="block text-[10px] font-medium">تخفیف</span>
  </div>
);

export default DiscountRibbon;