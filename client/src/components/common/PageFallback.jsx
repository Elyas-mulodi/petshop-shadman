import Skeleton from "./Skeleton";

const PageFallback = () => (
  <div
    role="status"
    aria-label="در حال بارگذاری"
    className="mx-auto max-w-5xl px-4 py-10 lg:px-8"
  >
    <Skeleton className="h-8 w-48" />
    <Skeleton className="mt-6 h-40" />
    <div className="mt-4 grid gap-4 md:grid-cols-3">
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
    </div>
  </div>
);

export default PageFallback;
