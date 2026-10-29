import Badge from "../ui/Badge";
import Input from "../ui/Input";
import {
  discountState,
  finalPrice,
  toNumber,
} from "../../../features/admin/products/productForm";
import { formatToman } from "../../../utils/price";
import { toPersianDigits } from "../../../utils/authHelpers";
import { formatDayLong, isDay, todayTehran } from "../../../utils/tehranDate";

const dateInput =
  "w-full rounded-lg border bg-ink px-3 py-2 text-sm text-paper [color-scheme:dark] focus:outline-none";

const DiscountSection = ({ form, errors, update }) => {
  const percent = toNumber(form.discountPercent);
  const state = discountState(form, todayTehran());
  const usable = Number.isFinite(percent) && percent > 0 && percent <= 100;

  const preview = usable
    ? form.variants
        .map((v) => ({ v, price: toNumber(v.price) }))
        .filter((x) => Number.isFinite(x.price) && x.price > 0)
    : [];

  const statusBadge = {
    none: <Badge>بدون تخفیف</Badge>,
    active: <Badge tone="success">فعال است</Badge>,
    scheduled: <Badge tone="warning">زمان‌بندی‌شده</Badge>,
    expired: <Badge tone="danger">مهلتش تمام شده</Badge>,
  }[state];

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <span className="text-xs text-muted">وضعیت تخفیف:</span>
        {statusBadge}
        {state === "scheduled" && (
          <span className="text-xs text-muted">
            از {formatDayLong(form.discountStartDate)} فعال می‌شود
          </span>
        )}
        {state === "expired" && (
          <span className="text-xs text-muted">روی سایت اعمال نمی‌شود</span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted">
            درصد تخفیف
          </span>
          <Input
            data-field="discountPercent"
            type="text"
            inputMode="numeric"
            dir="ltr"
            value={form.discountPercent}
            error={errors.discountPercent}
            onChange={(e) => update({ discountPercent: e.target.value })}
          />
          {errors.discountPercent && (
            <p className="mt-1 text-xs text-danger">{errors.discountPercent}</p>
          )}
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted">
            شروع (اختیاری)
          </span>
          <input
            type="date"
            value={form.discountStartDate}
            onChange={(e) => update({ discountStartDate: e.target.value })}
            aria-label="تاریخ شروع تخفیف"
            className={`${dateInput} border-line focus:border-bronze`}
          />
          {isDay(form.discountStartDate) && (
            <p className="mt-1 text-xs text-muted">
              {formatDayLong(form.discountStartDate)}
            </p>
          )}
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted">
            پایان (اختیاری)
          </span>
          <input
            data-field="discountEndDate"
            type="date"
            value={form.discountEndDate}
            onChange={(e) => update({ discountEndDate: e.target.value })}
            aria-label="تاریخ پایان تخفیف"
            className={`${dateInput} ${errors.discountEndDate ? "border-danger" : "border-line focus:border-bronze"}`}
          />
          {errors.discountEndDate ? (
            <p className="mt-1 text-xs text-danger">{errors.discountEndDate}</p>
          ) : (
            isDay(form.discountEndDate) && (
              <p className="mt-1 text-xs text-muted">
                تا پایان {formatDayLong(form.discountEndDate)}
              </p>
            )
          )}
        </div>
      </div>

      <p className="mt-4 rounded-lg border border-line bg-ink/40 px-3.5 py-3 text-xs leading-6 text-muted">
        تخفیف روی کل محصول (همه‌ی واریانت‌ها) اعمال می‌شود و فقط قیمت کالا را کم
        می‌کند؛ هزینه‌ی ارسال تخفیف نمی‌خورد. کد تخفیف و تخفیف وفاداری روی مبلغ
        بعد از این تخفیف محاسبه می‌شوند. اگر تاریخی وارد نکنید، تخفیف همیشه فعال
        است.
      </p>

      {preview.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-medium text-muted">
            پیش‌نمایش قیمت نهایی ({toPersianDigits(percent)}٪ تخفیف)
          </p>
          <ul className="divide-y divide-line rounded-lg border border-line">
            {preview.map(({ v, price }) => (
              <li
                key={v.key}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm"
              >
                <span className="truncate text-paper">
                  {v.attributes
                    .filter((a) => a.name.trim() && a.value.trim())
                    .map((a) => a.value.trim())
                    .join("، ") || "واریانت"}
                </span>
                <span className="shrink-0">
                  <span className="ml-2 text-xs text-muted line-through">
                    {formatToman(price)}
                  </span>
                  <span className="text-bronze">
                    {formatToman(finalPrice(price, percent))}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DiscountSection;
