const PriceSection = ({ min, max, onChange }) => (
  <div dir="ltr" className="flex items-center gap-2">
    <input
      type="number"
      placeholder="حداقل"
      value={min}
      onChange={(e) => onChange(e.target.value, max)}
      className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-paper placeholder:text-muted focus:border-bronze focus:outline-none"
    />
    <span className="text-muted">—</span>
    <input
      type="number"
      placeholder="حداکثر"
      value={max}
      onChange={(e) => onChange(min, e.target.value)}
      className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-paper placeholder:text-muted focus:border-bronze focus:outline-none"
    />
  </div>
);

export default PriceSection;