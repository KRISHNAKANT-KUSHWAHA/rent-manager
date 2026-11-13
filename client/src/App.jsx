import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Layout & Common
import Layout from './components/layout/Layout';
import Skeleton from './components/common/Skeleton';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RoomsPage from './pages/RoomsPage';
import TenantsPage from './pages/TenantsPage';
import TenantDetailPage from './pages/TenantDetailPage';
import DocumentsPage from './pages/DocumentsPage';
import AgreementsPage from './pages/AgreementsPage';
import RentPage from './pages/RentPage';
import ElectricityPage from './pages/ElectricityPage';
import LedgerPage from './pages/LedgerPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-xl animate-bounce mb-4 shadow-xl shadow-indigo-500/20">
          RM
        </div>
        <p className="text-sm font-semibold text-slate-300">
          Loading Owner Portal...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Guard (prevents visiting /login when already signed in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Login Route */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />

            {/* Protected Owner Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="rooms" element={<RoomsPage />} />
              <Route path="tenants" element={<TenantsPage />} />
              <Route path="tenants/:id" element={<TenantDetailPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="agreements" element={<AgreementsPage />} />
              <Route path="rent" element={<RentPage />} />
              <Route path="electricity" element={<ElectricityPage />} />
              <Route path="ledger" element={<LedgerPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

