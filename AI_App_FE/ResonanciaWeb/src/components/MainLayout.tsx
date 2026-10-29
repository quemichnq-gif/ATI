import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import StarField from './StarField';

export default function MainLayout() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a0015 0%, #1a0030 50%, #0d0020 100%)' }}>
      <StarField count={150} />
      <Sidebar />
      <main className="ml-64 min-h-screen relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
