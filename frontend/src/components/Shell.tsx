import { Navigate, Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useFeature } from '@/hooks/useFeature';
import { useAuthStore } from '@/store/auth';
import { useToastStore } from '@/store/toast';
import '../styles/Shell.css';

interface ShellProps {
  children?: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated());
  const clearAuth = useAuthStore(state => state.clearAuth);
  const user = useAuthStore(state => state.user);
  const showToast = useToastStore(state => state.showToast);
  const navigate = useNavigate();
  const showInsights = useFeature('insightsV2');
  const showCSVImport = useFeature('csvImportV2');
  const showDemo = useFeature('demo');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    clearAuth();
    showToast('Logged out successfully', 'info');
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-logo">FinSmart</h2>
          <p className="sidebar-user">{user?.fullName || user?.email}</p>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">Dashboard</span>
          </NavLink>

          <NavLink
            to="/transactions"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">💳</span>
            <span className="nav-label">Transactions</span>
          </NavLink>

          {showCSVImport && (
            <NavLink
              to="/import"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">📥</span>
              <span className="nav-label">Import CSV</span>
            </NavLink>
          )}

          <NavLink
            to="/budgets"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">📈</span>
            <span className="nav-label">Budgets</span>
          </NavLink>

          <NavLink
            to="/categories"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">🏷️</span>
            <span className="nav-label">Categories</span>
          </NavLink>

          {showInsights && (
            <NavLink
              to="/insights"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">🔍</span>
              <span className="nav-label">Insights</span>
            </NavLink>
          )}

          <div className="nav-divider"></div>

          {showDemo && (
            <NavLink
              to="/onboarding"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">✨</span>
              <span className="nav-label">Try Demo</span>
            </NavLink>
          )}

          <button onClick={handleLogout} className="nav-link nav-button">
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Logout</span>
          </button>
        </nav>
      </aside>

      <main className="app-main">
        <div className="main-content">{children || <Outlet />}</div>
      </main>
    </div>
  );
}
