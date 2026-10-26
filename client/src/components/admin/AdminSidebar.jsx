import { Link, NavLink } from "react-router-dom";
import { ChevronsLeft, ChevronsRight, Store, X } from "lucide-react";
import Logo from "../common/Logo";
import { ADMIN_NAV } from "./adminNav";

const itemBase = "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors";

const AdminSidebar = ({ collapsed = false, onToggleCollapse, onNavigate, onClose }) => (
  <div className="flex h-full flex-col">
    <div
      className={`flex h-14 shrink-0 items-center border-b border-line ${
        collapsed ? "justify-center px-2" : "justify-between px-4"
      }`}
    >
      {!collapsed && (
        <Link to="/admin" onClick={onNavigate} className="flex items-center gap-2">
          <Logo />
          <span className="rounded-md border border-line px-1.5 py-0.5 text-[10px] text-muted">مدیریت</span>
        </Link>
      )}

      {onClose ? (
        <button onClick={onClose} aria-label="بستن منو" className="text-muted hover:text-paper">
          <X className="h-5 w-5" />
        </button>
      ) : (
        onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? "باز کردن سایدبار" : "جمع کردن سایدبار"}
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-well hover:text-paper"
          >
            {collapsed ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
          </button>
        )
      )}
    </div>

    <nav aria-label="منوی مدیریت" className="flex-1 space-y-6 overflow-y-auto px-2 py-4">
      {ADMIN_NAV.map((group) => (
        <div key={group.title}>
          {!collapsed && <p className="mb-2 px-3 text-[11px] font-medium text-muted/80">{group.title}</p>}
          <ul className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;

              if (!item.ready) {
                return (
                  <li key={item.to}>
                    <span
                      aria-disabled="true"
                      title={collapsed ? `${item.label} (به‌زودی)` : undefined}
                      className={`${itemBase} cursor-not-allowed text-muted/50 ${collapsed ? "justify-center" : ""}`}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.6} />
                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          <span className="rounded-full border border-line px-2 py-0.5 text-[10px]">به‌زودی</span>
                        </>
                      )}
                    </span>
                  </li>
                );
              }

              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === "/admin"}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `${itemBase} ${collapsed ? "justify-center" : ""} ${
                        isActive ? "bg-well text-paper" : "text-muted hover:bg-well/60 hover:text-paper"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute inset-y-2 right-0 w-0.5 rounded-full bg-bronze" />}
                        <Icon
                          className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-bronze" : ""}`}
                          strokeWidth={1.6}
                        />
                        {!collapsed && <span>{item.label}</span>}
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>

    <div className="shrink-0 border-t border-line p-2">
      <Link
        to="/"
        onClick={onNavigate}
        title={collapsed ? "مشاهده سایت" : undefined}
        className={`${itemBase} text-muted hover:bg-well/60 hover:text-paper ${collapsed ? "justify-center" : ""}`}
      >
        <Store className="h-[18px] w-[18px] shrink-0" strokeWidth={1.6} />
        {!collapsed && <span>مشاهده سایت</span>}
      </Link>
    </div>
  </div>
);

export default AdminSidebar;