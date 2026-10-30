import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import StarField from './StarField';

export default function MainLayout() {
  return (
    <div className="min-h-screen text-slate-100" style={{ background: 'radial-gradient(ellipse at 50% 20%, #110a24 0%, #07050d 75%)' }}>
      <StarField count={50} />
      <Sidebar />
      <main className="ml-64 min-h-screen relative z-10">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
