import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import GroupsPage from './pages/GroupsPage';
import GroupDetailsPage from './pages/GroupDetailsPage';
import PublicInboxPage from './pages/PublicInboxPage';
import TransactionsPage from './pages/TransactionsPage';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isChecking } = useAuthStore();
  const location = useLocation();
  if (isChecking) return <p role="status" className="p-8 text-gray-700">Vérification de la session...</p>;
  return isAuthenticated ? children : <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
}

export default function App() {
  const { loadUser, expireSession } = useAuthStore();
  useEffect(() => {
    void loadUser();
    window.addEventListener('badenya:session-expired', expireSession);
    return () => window.removeEventListener('badenya:session-expired', expireSession);
  }, [loadUser, expireSession]);
  return <BrowserRouter><Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
    <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
    <Route path="/groups" element={<ProtectedRoute><GroupsPage /></ProtectedRoute>} />
    <Route path="/groups/:id" element={<ProtectedRoute><GroupDetailsPage /></ProtectedRoute>} />
    <Route path="/inbox" element={<ProtectedRoute><PublicInboxPage /></ProtectedRoute>} />
    <Route path="/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes></BrowserRouter>;
}
