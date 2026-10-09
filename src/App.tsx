import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Login } from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Pipeline from '@/pages/Pipeline';
import Leads from '@/pages/Leads';
import FollowUps from '@/pages/FollowUps';
import Demonstrations from '@/pages/Demonstrations';
import Proposals from '@/pages/Proposals';
import SalesFinance from '@/pages/SalesFinance';
import Performance from '@/pages/Performance';
import Settings from '@/pages/Settings';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <LoadingSpinner message="Carregando Cortex CRM..." size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

const PublicRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <LoadingSpinner message="Carregando Cortex CRM..." size="lg" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>
        
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/follow-ups" element={<FollowUps />} />
            <Route path="/demos" element={<Demonstrations />} />
            <Route path="/proposals" element={<Proposals />} />
            <Route path="/sales" element={<SalesFinance />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
};

export default App;
