import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { TraderDashboard } from './pages/TraderDashboard';
import { LiquidityDashboard } from './pages/LiquidityDashboard';
import { GovernorDashboard } from './pages/GovernorDashboard';
import { ArbitrageurDashboard } from './pages/ArbitrageurDashboard';
import { AdminDashboard } from './pages/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/trader"
            element={
              <ProtectedRoute requiredRole="trader">
                <TraderDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/liquidity"
            element={
              <ProtectedRoute requiredRole="liquidity">
                <LiquidityDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/governor"
            element={
              <ProtectedRoute requiredRole="governor">
                <GovernorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/arbitrageur"
            element={
              <ProtectedRoute requiredRole="arbitrageur">
                <ArbitrageurDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

