import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import QuickTranslate from './pages/QuickTranslate';
import DocumentTranslation from './pages/DocumentTranslation';
import MaterialGenerator from './pages/MaterialGenerator';
import History from './pages/History';
import Login from './pages/Login';
import Register from './pages/Register';
import TranslatorReview from './pages/TranslatorReview';
import AdminDashboard from './pages/AdminDashboard';
import { Sidebar, TopBar } from './components/Sidebar';
import { AuthProvider, useAuth } from './components/AuthProvider';
import type { Role } from 'shared';

const PrivateRoute: React.FC<{ children: React.ReactElement; roles?: Role[] }> = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  // Server enforces authorization too; this guard just keeps users out of pages
  // their role can never use.
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppShell: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Public layout (login / register) — no sidebar
  return (
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="*"
        element={
          <div className="layout">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex flex-col flex-1 min-w-0">
              <TopBar onMenuClick={() => setSidebarOpen(true)} />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                  <Route path="/quick-translate" element={<PrivateRoute><QuickTranslate /></PrivateRoute>} />
                  <Route path="/document-translation" element={<PrivateRoute><DocumentTranslation /></PrivateRoute>} />
                  <Route path="/material" element={<PrivateRoute><MaterialGenerator /></PrivateRoute>} />
                  <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
                  <Route path="/translator" element={<PrivateRoute roles={['TRANSLATOR', 'ADMIN']}><TranslatorReview /></PrivateRoute>} />
                  <Route path="/admin" element={<PrivateRoute roles={['ADMIN']}><AdminDashboard /></PrivateRoute>} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </main>
            </div>
          </div>
        }
      />
    </Routes>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppShell />
  </AuthProvider>
);

export default App;
