const StockSection = ({ value, onChange }) => (
  <label className="flex cursor-pointer items-center gap-2.5">
    <input
      type="checkbox"
      checked={value}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 accent-bronze"
    />
    <span className="text-sm text-muted">فقط کالاهای موجود</span>
  </label>
);

export default StockSection;