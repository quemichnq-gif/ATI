import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { uid, loading } = useSelector((s: RootState) => s.auth);
  if (loading) return <LoadingSpinner text="Đang xác thực..." />;
  if (!uid) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
