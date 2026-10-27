import { PRESETS } from "../../../features/admin/dashboard/useDashboardRange";
import { Segmented } from "./Panel";

const OPTIONS = [...PRESETS.map(({ id, label }) => ({ id, label })), { id: "custom", label: "سفارشی" }];

const dateInput =
  "rounded-lg border border-line bg-card px-3 py-1.5 text-xs text-paper [color-scheme:dark] focus:border-bronze focus:outline-none";

const RangePicker = ({ preset, range, onPreset, onCustom }) => (
  <div className="flex flex-wrap items-center gap-2">
    <Segmented value={preset} onChange={onPreset} options={OPTIONS} ariaLabel="بازه‌ی گزارش" />

    {preset === "custom" && (
      <div className="flex items-center gap-2 text-xs text-muted">
        <input
          type="date"
          value={range.from}
          max={range.to}
          onChange={(e) => onCustom({ from: e.target.value, to: range.to })}
          aria-label="از تاریخ"
          className={dateInput}
        />
        تا
        <input
          type="date"
          value={range.to}
          min={range.from}
          onChange={(e) => onCustom({ from: range.from, to: e.target.value })}
          aria-label="تا تاریخ"
          className={dateInput}
        />
      </div>
    )}
  </div>
);

export default RangePicker;