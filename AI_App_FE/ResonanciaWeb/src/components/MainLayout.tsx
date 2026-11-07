import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import ErrorBoundary from './ErrorBoundary';

// Nguồn kỹ thuật: motion.dev/docs/react/animate#variants
const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -6 },
};

const pageTransition = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 26,
  mass: 0.9,
};

export default function MainLayout() {
  const { pathname } = useLocation();
  const isAssistantPage = pathname === '/assistant';
  const isHomePage = pathname === '/home';

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <div className={`astrica-app-shell min-h-screen relative flex flex-col justify-between ${isAssistantPage ? 'has-assistant-page' : ''}`}>
      <Navbar />

      <main className={`relative z-10 w-full container w-container mx-auto px-4 sm:px-6 lg:px-8 pt-24 ${isHomePage ? 'pb-0' : 'pb-16'} flex-1`}>
        <ErrorBoundary>
          {/* Page-level enter/exit transition — fade + subtle slide up on mount */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              style={{ width: '100%', height: '100%' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </main>

      {!isAssistantPage && <Footer />}
    </div>
  );
}
