import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";

const ease = [0.22, 1, 0.36, 1];

const Section = ({ title, subtitle, viewAllTo, children }) => (
  <motion.section
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.15 }}
    transition={{ duration: 0.5, ease }}
    className="mx-auto max-w-7xl py-12 lg:px-8"
  >
    <div className="mb-6 flex items-end justify-between px-4 lg:px-0">
      {" "}
      <div>
        <h2 className="font-display text-2xl font-bold text-paper">{title}</h2>
        {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {viewAllTo && (
        <Link
          to={viewAllTo}
          className="hidden shrink-0 items-center gap-1.5 text-sm text-bronze hover:underline sm:flex"
        >
          مشاهده همه
          <ArrowLeft className="h-4 w-4" />
        </Link>
      )}
    </div>

    {children}
  </motion.section>
);

export default Section;
