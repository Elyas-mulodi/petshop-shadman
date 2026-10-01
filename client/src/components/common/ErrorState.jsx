import { AlertTriangle } from "lucide-react";

const ErrorState = ({ message = "مشکلی در دریافت اطلاعات پیش آمد", onRetry, compact = false }) => (
  <div
    className={`flex flex-col items-center justify-center gap-3 rounded-lg border border-line bg-card text-center ${
      compact ? "px-4 py-6" : "px-6 py-14"
    }`}
  >
    <AlertTriangle className="h-5 w-5 text-danger" strokeWidth={1.6} />
    <p className="text-sm text-muted">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="rounded-lg border border-bronze px-4 py-1.5 text-xs font-medium text-bronze transition-colors hover:bg-bronze hover:text-ink"
      >
        تلاش مجدد
      </button>
    )}
  </div>
);

export default ErrorState;