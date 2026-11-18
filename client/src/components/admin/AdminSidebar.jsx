import { Link, NavLink } from "react-router-dom";
import { ChevronsLeft, ChevronsRight, Store, X } from "lucide-react";

import Logo from "../common/Logo";
import { ADMIN_NAV } from "./adminNav";

const itemBase =
  "group relative flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13px] transition-all duration-200";

const AdminSidebar = ({
  collapsed = false,
  onToggleCollapse,
  onNavigate,
  onClose,
}) => {
  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden bg-transparent">
      {/* Header */}
      <div
        className={`flex h-[60px] shrink-0 items-center border-b border-line/70 ${
          collapsed ? "justify-center px-2" : "justify-between px-4"
        }`}
      >
        {!collapsed && (
          <Link
            to="/admin"
            onClick={onNavigate}
            className="flex min-w-0 items-center gap-2.5"
          >

            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold leading-none text-paper">
                پنل مدیریت
              </span>
              <span className="text-[10px] text-muted">مدیریت فروشگاه</span>
            </div>
          </Link>
        )}

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن منو"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-well hover:text-paper"
          >
            <X size={17} strokeWidth={1.8} />
          </button>
        ) : (
          onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? "باز کردن سایدبار" : "جمع کردن سایدبار"}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-well hover:text-paper"
            >
              {collapsed ? (
                <ChevronsLeft size={18} />
              ) : (
                <ChevronsRight size={18} />
              )}
            </button>
          )
        )}
      </div>

      {/* Navigation */}
      <nav
        aria-label="منوی مدیریت"
        className="admin-sidebar-scroll min-h-0 flex-1 space-y-6 overflow-y-auto px-2 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="space-y-5">
          {ADMIN_NAV.map((group, groupIndex) => (
            <div key={group.title}>
              {!collapsed && (
                <div className="mb-2 flex items-center gap-2 px-3">
                  <span className="text-[10px] font-semibold tracking-wide text-muted/65">
                    {group.title}
                  </span>
                </div>
              )}

              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  if (!item.ready) {
                    return (
                      <li key={item.to}>
                        <div
                          title={
                            collapsed ? `${item.label} - به‌زودی` : undefined
                          }
                          aria-disabled="true"
                          className={`${itemBase} cursor-not-allowed text-muted/40 ${
                            collapsed ? "justify-center px-0" : ""
                          }`}
                        >
                          <Icon
                            size={18}
                            strokeWidth={1.6}
                            className="shrink-0"
                          />

                          {!collapsed && (
                            <>
                              <span className="flex-1 truncate">
                                {item.label}
                              </span>
                              <span className="rounded-md bg-well/70 px-1.5 py-0.5 text-[9px] text-muted/60">
                                به‌زودی
                              </span>
                            </>
                          )}
                        </div>
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
                          `${itemBase} ${
                            collapsed ? "justify-center px-0" : ""
                          } ${
                            isActive
                              ? "bg-well text-paper shadow-sm"
                              : "text-muted hover:bg-well/60 hover:text-paper"
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && (
                              <span className="absolute right-0 top-2 bottom-2 w-[3px] rounded-full bg-bronze" />
                            )}

                            <Icon
                              size={18}
                              strokeWidth={1.7}
                              className={`shrink-0 transition-colors ${
                                isActive
                                  ? "text-bronze"
                                  : "text-muted/80 group-hover:text-paper"
                              }`}
                            />

                            {!collapsed && (
                              <span className="min-w-0 flex-1 truncate">
                                {item.label}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-line/70 p-2.5">
        <Link
          to="/"
          onClick={onNavigate}
          title={collapsed ? "مشاهده سایت" : undefined}
          className={`${itemBase} text-muted hover:bg-well/70 hover:text-paper ${
            collapsed ? "justify-center px-0" : ""
          }`}
        >
          <Store size={18} strokeWidth={1.7} className="shrink-0" />

          {!collapsed && <span className="flex-1">مشاهده سایت</span>}
        </Link>
      </div>

      {/* Scrollbar styling */}
      <style>{`
        .admin-sidebar-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .admin-sidebar-scroll::-webkit-scrollbar {
          display: none;
          width: 0;
        }
      `}</style>
    </aside>
  );
};

export default AdminSidebar;
