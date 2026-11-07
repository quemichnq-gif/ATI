import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import ErrorBoundary from './ErrorBoundary';
import UiIcon from './UiIcon';

export default function MainLayout() {
  const { pathname } = useLocation();
  const isAssistantPage = pathname === '/assistant';
  const isHomePage = pathname === '/home';
  const [pageLoading, setPageLoading] = useState(false);
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    // Kích hoạt trạng thái loading vũ trụ mượt mà khi chuyển đổi trang
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      setPageLoading(true);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

      const timer = setTimeout(() => {
        setPageLoading(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [pathname]);

  const getLoadingText = () => {
    if (isAssistantPage) return 'Đang kết nối Resonancia AI...';
    if (isHomePage) return 'Đang kết nối vũ trụ Resonancia...';
    return 'Đang nạp dữ liệu vũ trụ...';
  };

  return (
    <div className={`astrica-app-shell min-h-screen relative flex flex-col justify-between ${isAssistantPage ? 'has-assistant-page' : ''}`}>
      {/* Thanh tia sáng vũ trụ lướt nhẹ trên đầu khi chuyển trang */}
      <AnimatePresence>
        {pageLoading && (
          <motion.div
            initial={{ width: '0%', opacity: 1 }}
            animate={{ width: '100%', opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed top-0 left-0 h-[2.5px] z-50 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, #ffd700 0%, #ff6eb4 50%, #9d4edd 100%)',
              boxShadow: '0 0 10px rgba(255,110,180,0.8), 0 0 20px rgba(157,78,221,0.5)',
            }}
          />
        )}
      </AnimatePresence>

      <Navbar />

      <main className={`relative z-10 w-full container w-container mx-auto px-4 sm:px-6 lg:px-8 pt-24 ${isHomePage ? 'pb-0' : 'pb-16'} flex-1`}>
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            {pageLoading ? (
              <motion.div
                key="page-loader"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col items-center justify-center min-h-[55vh] gap-5 py-12"
              >
                <div className="relative">
                  <div className="cosmic-spinner" />
                  <div className="absolute inset-0 flex items-center justify-center text-xl text-purple-300">
                    <UiIcon name="sparkles" label="Đang nạp dữ liệu" />
                  </div>
                </div>
                <p className="text-purple-300/80 text-sm font-medium tracking-wide animate-pulse">
                  {getLoadingText()}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{ width: '100%', height: '100%' }}
              >
                <Outlet />
              </motion.div>
            )}
          </AnimatePresence>
        </ErrorBoundary>
      </main>

      {!isAssistantPage && !pageLoading && <Footer />}
    </div>
  );
}
