import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DashboardLayout from './components/DashboardLayout';

// Protected route wrapper
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
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

        {/* Placeholder routes for teammates' pages */}
        <Route path="/vehicles" element={<PlaceholderPage title="Vehicle Management" emoji="🚛" owner="Fenil" />} />
        <Route path="/trips" element={<PlaceholderPage title="Trip Management" emoji="🗺️" owner="Fenil" />} />
        <Route path="/drivers" element={<PlaceholderPage title="Driver Management" emoji="👥" owner="Vatsal" />} />
        <Route path="/finance" element={<PlaceholderPage title="Finance & Invoicing" emoji="💰" owner="Vatsal" />} />
        <Route path="/reports" element={<PlaceholderPage title="Reports & Analytics" emoji="📊" owner="Manasvi" />} />
        <Route path="/settings" element={<PlaceholderPage title="Settings" emoji="⚙️" owner="Manasvi" />} />
      </Route>

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

// Temporary placeholder for teammate pages
function PlaceholderPage({ title, emoji, owner }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '60vh',
      gap: '12px',
      color: 'var(--text-secondary)',
    }}>
      <span style={{ fontSize: '3rem' }}>{emoji}</span>
      <h2 style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{title}</h2>
      <p>This page will be built by <strong>{owner}</strong></p>
    </div>
  );
}

export default App;
