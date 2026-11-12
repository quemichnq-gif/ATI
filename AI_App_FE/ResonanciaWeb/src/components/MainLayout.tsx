import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import ErrorBoundary from './ErrorBoundary';
import ChatFab from './ChatFab';

export default function MainLayout() {
  const { pathname } = useLocation();
  const isAssistantPage = pathname === '/assistant';
  const isHomePage = pathname === '/home';
  const [navigating, setNavigating] = useState(false);
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    // Kích hoạt tia sáng vũ trụ lướt mượt mà khi chuyển trang
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      setNavigating(true);
      // Đưa trang lên đỉnh đầu ngay lập tức, tránh hiện tượng trang mới bị load từ dưới cuộn lên
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      const timer = setTimeout(() => {
        setNavigating(false);
      }, 450);

      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return (
    <div className={`astrica-app-shell min-h-screen relative flex flex-col justify-between ${isAssistantPage ? 'has-assistant-page' : ''}`}>
      {/* Thanh tia sáng vũ trụ lướt nhẹ trên đầu khi chuyển trang */}
      <AnimatePresence>
        {navigating && (
          <motion.div
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 left-0 right-0 h-[2.5px] z-50 pointer-events-none"
            style={{
              transformOrigin: '0% 50%',
              background: 'linear-gradient(90deg, #ffd700 0%, #ff6eb4 50%, #9d4edd 100%)',
              boxShadow: '0 0 10px rgba(255,110,180,0.8), 0 0 20px rgba(157,78,221,0.5)',
            }}
          />
        )}
      </AnimatePresence>

      <Navbar />

      <main className={`relative z-10 w-full container w-container mx-auto px-4 sm:px-6 lg:px-8 pt-24 ${isHomePage ? 'pb-0' : 'pb-16'} flex-1`}>
        <ErrorBoundary>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{ width: '100%', height: '100%' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </main>

      {!isAssistantPage && <Footer />}

      {/* Nút nổi Nhắn Tin – hiển thị ở mọi trang trừ /chat và /assistant */}
      <ChatFab />
    </div>
  );
}
