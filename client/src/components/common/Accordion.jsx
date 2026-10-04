import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";

const ease = [0.22, 1, 0.36, 1];

const Accordion = ({ items, defaultOpen = 0 }) => {
  const [openIndex, setOpenIndex] = useState(defaultOpen);

  return (
    <div className="border-t border-line">
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.title} className="border-b border-line">
            <button
              onClick={() => setOpenIndex(open ? -1 : i)}
              className="flex w-full items-center justify-between py-4 text-right"
              aria-expanded={open}
            >
              <span className="text-sm font-medium text-paper">{item.title}</span>
              <ChevronDown
                className={`h-4 w-4 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease }}
                  className="overflow-hidden"
                >
                  <div className="pb-4">{item.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

export default Accordion;