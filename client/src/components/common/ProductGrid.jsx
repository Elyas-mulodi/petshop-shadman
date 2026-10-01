const ProductGridSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="aspect-[3/4.2] animate-pulse rounded-lg bg-card" />
    ))}
  </div>
);

export default ProductGridSkeleton;