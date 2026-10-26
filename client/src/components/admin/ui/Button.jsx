import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary: "bg-bronze text-ink hover:opacity-90",
  secondary: "border border-line text-paper hover:border-bronze/60 hover:text-bronze",
  danger: "bg-danger text-ink hover:opacity-90",
  dangerOutline: "border border-danger/40 text-danger hover:bg-danger hover:text-ink",
  ghost: "text-muted hover:bg-well hover:text-paper",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  icon: "h-9 w-9",
};

const Button = ({
  variant = "secondary",
  size = "md",
  loading = false,
  disabled = false,
  icon: Icon,
  type = "button",
  className = "",
  children,
  ...props
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    {...props}
  >
    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon && <Icon className="h-4 w-4" />}
    {children}
  </button>
);

export default Button;