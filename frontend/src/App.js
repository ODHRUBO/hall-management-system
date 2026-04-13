import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage, RegisterPage } from './components/auth/AuthPages';
import { Layout } from './components/dashboard/Layout';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { HallsRoomsPage } from './components/halls/HallsRoomsPage';
import { ApplicationsPage } from './components/halls/ApplicationsPage';
import { PaymentsPage } from './components/payments/PaymentsPage';
import { ComplaintsPage } from './components/complaints/ComplaintsPage';
import { ReportsPage } from './components/reports/ReportsPage';
import { UsersPage } from './components/users/UsersPage';
import { StudentDashboard, ApplyRoomPage, ProfilePage, AllocationsPage } from './components/users/StudentPages';
import { Spinner } from './components/dashboard/UI';

// ─── Route Guards ──────────────────────────────────────────────────────────
const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><Spinner /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={user.role === 'student' ? '/student' : '/admin'} replace />;
  return children;
};

const AdminRoute = ({ children }) => <PrivateRoute roles={['admin', 'hall_manager']}>{children}</PrivateRoute>;
const StudentRoute = ({ children }) => <PrivateRoute roles={['student']}>{children}</PrivateRoute>;

// ─── App ───────────────────────────────────────────────────────────────────
const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to={user.role === 'student' ? '/student' : '/admin'} replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/student" replace /> : <RegisterPage />} />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to={user ? (user.role === 'student' ? '/student' : '/admin') : '/login'} replace />} />

      {/* Admin / Hall Manager routes */}
      <Route path="/admin" element={<AdminRoute><Layout><AdminDashboard /></Layout></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><Layout><UsersPage /></Layout></AdminRoute>} />
      <Route path="/admin/halls" element={<AdminRoute><Layout><HallsRoomsPage /></Layout></AdminRoute>} />
      <Route path="/admin/applications" element={<AdminRoute><Layout><ApplicationsPage /></Layout></AdminRoute>} />
      <Route path="/admin/allocations" element={<AdminRoute><Layout><AllocationsPage /></Layout></AdminRoute>} />
      <Route path="/admin/payments" element={<AdminRoute><Layout><PaymentsPage /></Layout></AdminRoute>} />
      <Route path="/admin/complaints" element={<AdminRoute><Layout><ComplaintsPage /></Layout></AdminRoute>} />
      <Route path="/admin/reports" element={<AdminRoute><Layout><ReportsPage /></Layout></AdminRoute>} />

      {/* Student routes */}
      <Route path="/student" element={<StudentRoute><Layout><StudentDashboard /></Layout></StudentRoute>} />
      <Route path="/student/apply" element={<StudentRoute><Layout><ApplyRoomPage /></Layout></StudentRoute>} />
      <Route path="/student/my-room" element={<StudentRoute><Layout><AllocationsPage /></Layout></StudentRoute>} />
      <Route path="/student/payments" element={<StudentRoute><Layout><PaymentsPage /></Layout></StudentRoute>} />
      <Route path="/student/complaints" element={<StudentRoute><Layout><ComplaintsPage /></Layout></StudentRoute>} />
      <Route path="/student/profile" element={<StudentRoute><Layout><ProfilePage /></Layout></StudentRoute>} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
