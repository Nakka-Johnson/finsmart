import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Shell } from '@/components/Shell';
import { Guard } from '@/components/Guard';
import { Toast } from '@/components/Toast';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Dashboard } from '@/pages/Dashboard';
import { Transactions } from '@/pages/Transactions';
import { Budgets } from '@/pages/Budgets';
import { Categories } from '@/pages/Categories';
import { InsightsPage } from '@/pages/InsightsPage';
import { CSVImportPage } from '@/pages/CSVImportPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { useAuthStore } from '@/store/auth';
import { useToastStore } from '@/store/toast';
import { set401Handler } from '@/api/http';

function AppContent() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore(state => state.clearAuth);
  const showToast = useToastStore(state => state.showToast);

  useEffect(() => {
    // Set up global 401 handler
    set401Handler(() => {
      clearAuth();
      showToast('Session expired. Please log in again.', 'error');
      navigate('/login', { replace: true });
    });
  }, [navigate, clearAuth, showToast]);

  return (
    <>
      <Toast />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <Shell>
              <Guard>
                <Dashboard />
              </Guard>
            </Shell>
          }
        />
        <Route
          path="/dashboard"
          element={
            <Shell>
              <Guard>
                <Dashboard />
              </Guard>
            </Shell>
          }
        />
        <Route
          path="/transactions"
          element={
            <Shell>
              <Guard>
                <Transactions />
              </Guard>
            </Shell>
          }
        />
        <Route
          path="/budgets"
          element={
            <Shell>
              <Guard>
                <Budgets />
              </Guard>
            </Shell>
          }
        />
        <Route
          path="/categories"
          element={
            <Shell>
              <Guard>
                <Categories />
              </Guard>
            </Shell>
          }
        />
        <Route
          path="/insights"
          element={
            <Shell>
              <Guard>
                <InsightsPage />
              </Guard>
            </Shell>
          }
        />
        <Route
          path="/import"
          element={
            <Shell>
              <Guard>
                <CSVImportPage />
              </Guard>
            </Shell>
          }
        />
        <Route
          path="/onboarding"
          element={
            <Guard>
              <OnboardingPage />
            </Guard>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
