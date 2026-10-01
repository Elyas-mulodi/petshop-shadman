import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Truck, PawPrint } from "lucide-react";

const ease = [0.22, 1, 0.36, 1];

const tile = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const BentoHero = () => (
  <motion.section
    variants={container}
    initial="hidden"
    animate="show"
    className="hidden border-b border-line bg-card lg:block"
  >
    <div className="mx-auto grid max-w-7xl grid-cols-4 grid-rows-2 gap-4 px-8 py-10" style={{ height: 520 }}>
      {/* تایل اصلی: تیتر و CTA */}
      <motion.div
        variants={tile}
        className="relative col-span-2 row-span-2 flex flex-col justify-center overflow-hidden rounded-xl border border-line bg-ink px-10"
      >
        <p className="mb-4 text-sm text-sage">پت شاپ شادمان</p>
        <h1 className="max-w-sm font-display text-4xl font-bold leading-[1.3] text-paper">
          هر آنچه همراه چهارپای شما نیاز دارد
        </h1>
        <p className="mt-5 max-w-xs text-sm leading-7 text-muted">
          غذا، اکسسوری و لوازم بهداشتی برای سگ، گربه و دیگر حیوانات خانگی.
        </p>
        <Link
          to="/products"
          className="mt-8 inline-flex w-fit items-center gap-2 rounded-lg bg-bronze px-6 py-3 text-sm font-medium text-ink transition-opacity hover:opacity-90"
        >
          مشاهده محصولات
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </motion.div>

      {/* تایل بلند: دسته سگ‌ها */}
      <motion.div variants={tile} className="col-span-1 row-span-2">
        <Link
          to="/products?category=dog"
          className="group relative block h-full overflow-hidden rounded-xl border border-line bg-well"
        >
          {/* TODO: عکس واقعی دسته سگ جایگزین این پس‌زمینه بشه */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent transition-opacity group-hover:opacity-80" />
          <span className="absolute inset-x-0 bottom-0 p-5 font-display text-lg font-bold text-paper">
            برای سگ‌ها
          </span>
        </Link>
      </motion.div>

      {/* تایل مربعی: دسته گربه‌ها */}
      <motion.div variants={tile} className="col-span-1 row-span-1">
        <Link
          to="/products?category=cat"
          className="group relative block h-full overflow-hidden rounded-xl border border-line bg-well"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent transition-opacity group-hover:opacity-80" />
          <span className="absolute inset-x-0 bottom-0 p-4 text-sm font-medium text-paper">
            برای گربه‌ها
          </span>
        </Link>
      </motion.div>

      {/* تایل کوچیک: مزیت */}
      <motion.div
        variants={tile}
        className="col-span-1 row-span-1 flex flex-col justify-center gap-2 rounded-xl border border-line bg-ink px-5"
      >
        <Truck className="h-5 w-5 text-bronze" strokeWidth={1.6} />
        <p className="text-xs leading-5 text-muted">ارسال رایگان بالای ۵۰۰ هزار تومان</p>
      </motion.div>
    </div>
  </motion.section>
);

export default BentoHero;