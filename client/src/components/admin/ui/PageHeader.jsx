const PageHeader = ({ title, description, actions }) => (
  <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
    <div>
      <h1 className="font-display text-xl font-bold text-paper md:text-2xl">{title}</h1>
      {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

export default PageHeader;