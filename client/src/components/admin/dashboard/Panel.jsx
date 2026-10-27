import ErrorState from "../../common/ErrorState";

export const Panel = ({
  title,
  subtitle,
  actions,
  query,
  isEmpty = false,
  emptyText = "داده‌ای برای نمایش وجود ندارد.",
  height = 240,
  className = "",
  children,
}) => (
  <section className={`rounded-2xl border border-line bg-card p-5 ${className}`}>
    <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="font-display text-base font-bold text-paper">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
      </div>
      {actions}
    </header>

    {query?.isLoading ? (
      <div className="animate-pulse rounded-lg bg-well" style={{ height }} />
    ) : query?.isError && !query?.data ? (
      <ErrorState compact message="دریافت گزارش با خطا مواجه شد" onRetry={query.refetch} />
    ) : isEmpty ? (
      <p className="flex items-center justify-center text-sm text-muted" style={{ minHeight: height }}>
        {emptyText}
      </p>
    ) : (
      <div className={`transition-opacity ${query?.isFetching ? "opacity-60" : ""}`}>{children}</div>
    )}
  </section>
);

export const Segmented = ({ value, onChange, options, ariaLabel }) => (
  <div role="tablist" aria-label={ariaLabel} className="inline-flex rounded-lg border border-line bg-ink p-0.5">
    {options.map((option) => (
      <button
        key={option.id}
        role="tab"
        aria-selected={option.id === value}
        onClick={() => onChange(option.id)}
        className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
          option.id === value ? "bg-well text-paper" : "text-muted hover:text-paper"
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
);