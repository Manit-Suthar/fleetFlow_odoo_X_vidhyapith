import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DashboardLayout from './components/DashboardLayout';
import DriverPerformance from './pages/DriverPerformance';
import AnalyticsReports from './pages/AnalyticsReports';
import { HiOutlineShieldExclamation } from 'react-icons/hi';

// ── RBAC: Role → allowed pages ──
const ROLE_ACCESS = {
  fleet_manager: ['/dashboard', '/vehicles', '/trips', '/maintenance', '/expenses', '/drivers', '/analytics', '/settings'],
  dispatcher: ['/dashboard', '/vehicles', '/trips', '/drivers', '/analytics'],
  safety_officer: ['/dashboard', '/vehicles', '/maintenance', '/drivers', '/analytics'],
  financial_analyst: ['/dashboard', '/trips', '/maintenance', '/expenses', '/analytics'],
};

// Protected route wrapper
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

// Role-guarded page wrapper
function RoleGuard({ path, children }) {
  const [denied, setDenied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return;
    const user = JSON.parse(stored);
    const allowed = ROLE_ACCESS[user.role] || [];
    if (!allowed.includes(path)) {
      setDenied(true);
      setTimeout(() => {
        setDenied(false);
        navigate('/dashboard', { replace: true });
      }, 2500);
    }
  }, [path, navigate]);

  if (denied) {
    return (
      <>
        <div className="role-denied">
          <HiOutlineShieldExclamation className="role-denied__icon" />
          <h2>Access Restricted</h2>
          <p>Your role does not have permission to view this page.</p>
          <p className="role-denied__redirect">Redirecting to dashboard...</p>
        </div>
        <div className="role-error-toast">
          <HiOutlineShieldExclamation />
          You are not eligible for this section as per your role.
        </div>
      </>
    );
  }

  return children;
}

function App() {
  return (
    <>
      <style>{`
        .role-denied {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 60vh;
          gap: 8px;
          color: var(--text-secondary);
          text-align: center;
        }
        .role-denied__icon {
          font-size: 2.5rem;
          color: var(--danger);
          margin-bottom: 8px;
        }
        .role-denied h2 {
          color: var(--text-heading);
          font-weight: 700;
          font-size: 1.2rem;
        }
        .role-denied p {
          font-size: 0.85rem;
        }
        .role-denied__redirect {
          color: var(--text-muted);
          font-size: 0.78rem;
          margin-top: 8px;
        }
      `}</style>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected — wrapped in layout */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Page 3: Vehicle Registry — Fenil */}
          <Route path="/vehicles" element={
            <RoleGuard path="/vehicles">
              <PlaceholderPage title="Vehicle Registry" subtitle="Asset Management" owner="Fenil" />
            </RoleGuard>
          } />

          {/* Page 4: Trip Dispatcher — Fenil */}
          <Route path="/trips" element={
            <RoleGuard path="/trips">
              <PlaceholderPage title="Trip Dispatcher" subtitle="Trip & Route Management" owner="Fenil" />
            </RoleGuard>
          } />

          {/* Page 5: Maintenance Logs — Vatsal */}
          <Route path="/maintenance" element={
            <RoleGuard path="/maintenance">
              <PlaceholderPage title="Maintenance & Service Logs" subtitle="Service Tracking" owner="Vatsal" />
            </RoleGuard>
          } />

          {/* Page 6: Expense & Fuel — Vatsal */}
          <Route path="/expenses" element={
            <RoleGuard path="/expenses">
              <PlaceholderPage title="Expense & Fuel Logging" subtitle="Completed Trip Expenses" owner="Vatsal" />
            </RoleGuard>
          } />

          {/* Page 7: Driver Profiles — Manasvi (LIVE) */}
          <Route path="/drivers" element={
            <RoleGuard path="/drivers">
              <DriverPerformance />
            </RoleGuard>
          } />

          {/* Page 8: Analytics — Manasvi (LIVE) */}
          <Route path="/analytics" element={
            <RoleGuard path="/analytics">
              <AnalyticsReports />
            </RoleGuard>
          } />

          {/* Settings */}
          <Route path="/settings" element={
            <RoleGuard path="/settings">
              <PlaceholderPage title="Settings" subtitle="System Configuration" owner="Manit" />
            </RoleGuard>
          } />
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

// Placeholder for teammate pages
function PlaceholderPage({ title, subtitle, owner }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '60vh',
      gap: '6px',
      color: 'var(--text-secondary)',
    }}>
      <h2 style={{ color: 'var(--text-heading)', fontWeight: 700, fontSize: '1.2rem' }}>{title}</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{subtitle}</p>
      <p style={{ marginTop: '10px', fontSize: '0.78rem' }}>
        Assigned to <strong style={{ color: 'var(--accent-500)' }}>{owner}</strong>
      </p>
    </div>
  );
}

export default App;
