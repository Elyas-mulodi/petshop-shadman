import { Suspense, useEffect } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import PageFallback from "../components/common/PageFallback";
import RouteErrorBoundary from "../components/common/RouteErrorBoundary";

const MainLayout = () => {
  const location = useLocation();
  const outlet = useOutlet();

  useEffect(() => {
    const id = requestAnimationFrame(() => window.scrollTo(0, 0));
    return () => cancelAnimationFrame(id);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <RouteErrorBoundary>
              <Suspense fallback={<PageFallback />}>{outlet}</Suspense>
            </RouteErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;