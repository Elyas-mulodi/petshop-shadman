import { useState } from "react";
import { Loader2, Tag, X } from "lucide-react";
import { applyCoupon } from "../../features/coupons/couponsApi";
import { formatToman } from "../../utils/price";
import { parseApiError } from "../../utils/authHelpers";

const CouponBox = ({ coupon, onApplied, onRemoved }) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const apply = async () => {
    const value = code.trim();
    if (!value || loading) return;

    setError("");
    setLoading(true);
    try {
      const { data } = await applyCoupon(value);
      onApplied(data.data);
      setCode("");
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  if (coupon) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-bronze/40 bg-bronze/10 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Tag className="h-4 w-4 shrink-0 text-bronze" />
          <div className="min-w-0">
            <p dir="ltr" className="truncate text-left text-sm font-medium text-paper">
              {coupon.code}
            </p>
            <p className="text-xs text-bronze">{formatToman(coupon.discountAmount)} تخفیف</p>
          </div>
        </div>
        <button onClick={onRemoved} aria-label="حذف کد تخفیف" className="shrink-0 text-muted hover:text-paper">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          dir="ltr"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), apply())}
          placeholder="کد تخفیف"
          autoCapitalize="characters"
          className={`min-w-0 flex-1 rounded-lg border bg-ink px-3.5 py-2.5 text-left text-sm uppercase text-paper placeholder:normal-case placeholder:text-muted/60 focus:outline-none ${
            error ? "border-danger" : "border-line focus:border-bronze"
          }`}
        />
        <button
          onClick={apply}
          disabled={!code.trim() || loading}
          className="flex shrink-0 items-center justify-center gap-2 rounded-lg border border-bronze px-5 py-2.5 text-sm font-medium text-bronze transition-colors hover:bg-bronze hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-bronze"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          اعمال
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
};

export default CouponBox;