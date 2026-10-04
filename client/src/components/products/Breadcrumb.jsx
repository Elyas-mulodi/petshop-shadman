import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const Breadcrumb = ({ items }) => (
  <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-muted">
    <Link to="/" className="hover:text-paper">خانه</Link>
    {items.map((item, i) => (
      <span key={i} className="flex items-center gap-1.5">
        <ChevronLeft className="h-3 w-3" />
        {item.to ? (
          <Link to={item.to} className="hover:text-paper">
            {item.label}
          </Link>
        ) : (
          <span className="text-paper">{item.label}</span>
        )}
      </span>
    ))}
  </nav>
);

export default Breadcrumb;