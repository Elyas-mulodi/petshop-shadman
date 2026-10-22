import { motion } from "motion/react";
import { toPersianDigits } from "../../utils/authHelpers";

const ProfileTabs = ({ tabs, active, onChange }) => (
  <div
    role="tablist"
    aria-label="بخش‌های پروفایل"
    className="flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
  >
    {tabs.map((tab) => {
      const selected = tab.id === active;
      const Icon = tab.icon;

      return (
        <button
          key={tab.id}
          role="tab"
          id={`tab-${tab.id}`}
          aria-selected={selected}
          aria-controls={`panel-${tab.id}`}
          onClick={() => onChange(tab.id)}
          className={`relative flex shrink-0 items-center gap-2 px-4 py-3.5 text-sm transition-colors ${
            selected ? "text-paper" : "text-muted hover:text-paper"
          }`}
        >
          <Icon className="h-4 w-4" strokeWidth={1.7} />
          {tab.label}
          {tab.badge > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-bronze px-1.5 text-[11px] font-medium text-ink">
              {toPersianDigits(tab.badge)}
            </span>
          )}
          {selected && (
            <motion.span
              layoutId="profile-tab-underline"
              className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-bronze"
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            />
          )}
        </button>
      );
    })}
  </div>
);

export default ProfileTabs;
