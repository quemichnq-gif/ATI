import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ErrorBoundary from './ErrorBoundary';

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
          <Outlet />
        </ErrorBoundary>
      </main>

      {!isAssistantPage && <Footer />}
    </div>
  );
}
