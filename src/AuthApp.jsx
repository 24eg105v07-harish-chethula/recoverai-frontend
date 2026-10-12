import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import api from './services/api';
import { ThemeProvider } from './context/ThemeContext';
import ShellLayout from './components/ShellLayout';
import './design-system.css';

// Lazy-loaded pages for code splitting & optimal performance
const Landing = lazy(() => import('./pages/Landing'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const DashboardView = lazy(() => import('./pages/DashboardView'));
const RecoveryCasesView = lazy(() => import('./pages/RecoveryCasesView'));
const CaseDetailView = lazy(() => import('./pages/CaseDetailView'));
const RecoveryActionsView = lazy(() => import('./pages/RecoveryActionsView'));
const AIRecommendationsView = lazy(() => import('./pages/AIRecommendationsView'));
const PaymentsView = lazy(() => import('./pages/PaymentsView'));
const ProfileView = lazy(() => import('./pages/ProfileView'));

// Admin pages
const AdminOverview = lazy(() => import('./pages/AdminOverview'));
const AdminUsers = lazy(() => import('./AdminUsers'));

const tokenKey = 'recoverai_token';
const userKey = 'recoverai_user';

export default function AuthApp() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}

function AuthRoutes() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(userKey));
    } catch {
      return null;
    }
  });
  const [checking, setChecking] = useState(Boolean(sessionStorage.getItem(tokenKey)));
  const sessionCheckStarted = useRef(false);

  useEffect(() => {
    const expired = () => {
      setUser(null);
      setChecking(false);
      navigate('/login', { replace: true });
    };
    window.addEventListener('recoverai:session-expired', expired);

    if (sessionStorage.getItem(tokenKey) && !sessionCheckStarted.current) {
      sessionCheckStarted.current = true;
      api.get('/api/auth/me')
        .then(({ data }) => {
          setUser(data);
          sessionStorage.setItem(userKey, JSON.stringify(data));
        })
        .catch(() => {
          sessionStorage.removeItem(tokenKey);
          sessionStorage.removeItem(userKey);
          setUser(null);
        })
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }

    return () => {
      window.removeEventListener('recoverai:session-expired', expired);
    };
  }, [navigate]);

  function setSession(data) {
    sessionStorage.setItem(tokenKey, data.token);
    sessionStorage.setItem(userKey, JSON.stringify(data.user));
    setUser(data.user);
    navigate(data.user.role === 'ADMIN' ? '/admin' : '/dashboard', { replace: true });
  }

  async function logout() {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Local session is cleared regardless
    }
    sessionStorage.removeItem(tokenKey);
    sessionStorage.removeItem(userKey);
    setUser(null);
    navigate('/login', { replace: true });
  }

  if (checking) {
    return (
      <div className="auth-loading-screen">
        <div className="btn-spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }} />
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          Verifying your RecoverAI workspace session…
        </p>
      </div>
    );
  }

  const defaultUserPath = user?.role === 'ADMIN' ? '/admin' : '/dashboard';

  return (
    <Suspense
      fallback={
        <div className="auth-loading-screen">
          <div className="btn-spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }} />
          <p style={{ marginTop: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Loading interface…
          </p>
        </div>
      }
    >
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route
          path="/login"
          element={user ? <Navigate to={defaultUserPath} replace /> : <AuthPage mode="login" onSession={setSession} />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to={defaultUserPath} replace /> : <AuthPage mode="signup" onSession={setSession} />}
        />

        {/* Authenticated User Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user}>
              <ShellLayout user={user} onLogout={logout}>
                <DashboardView user={user} />
              </ShellLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/recovery-cases"
          element={
            <ProtectedRoute user={user}>
              <ShellLayout user={user} onLogout={logout}>
                <RecoveryCasesView user={user} />
              </ShellLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/recovery-cases/:id"
          element={
            <ProtectedRoute user={user}>
              <ShellLayout user={user} onLogout={logout}>
                <CaseDetailView user={user} />
              </ShellLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/recovery-actions"
          element={
            <ProtectedRoute user={user}>
              <ShellLayout user={user} onLogout={logout}>
                <RecoveryActionsView user={user} />
              </ShellLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-recommendations"
          element={
            <ProtectedRoute user={user}>
              <ShellLayout user={user} onLogout={logout}>
                <AIRecommendationsView user={user} />
              </ShellLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute user={user}>
              <ShellLayout user={user} onLogout={logout}>
                <PaymentsView user={user} />
              </ShellLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute user={user}>
              <ShellLayout user={user} onLogout={logout}>
                <ProfileView user={user} onLogout={logout} />
              </ShellLayout>
            </ProtectedRoute>
          }
        />

        {/* Administrator Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute user={user} adminOnly>
              <ShellLayout user={user} onLogout={logout}>
                <AdminOverview user={user} />
              </ShellLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute user={user} adminOnly>
              <ShellLayout user={user} onLogout={logout}>
                <AdminUsers user={user} onLogout={logout} />
              </ShellLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/:id"
          element={
            <ProtectedRoute user={user} adminOnly>
              <ShellLayout user={user} onLogout={logout}>
                <AdminUsers user={user} onLogout={logout} />
              </ShellLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <ProtectedRoute user={user} adminOnly>
              <ShellLayout user={user} onLogout={logout}>
                <PaymentsView user={user} />
              </ShellLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/recovery-cases"
          element={
            <ProtectedRoute user={user} adminOnly>
              <ShellLayout user={user} onLogout={logout}>
                <RecoveryCasesView user={user} />
              </ShellLayout>
            </ProtectedRoute>
          }
        />

        {/* Access Denied & Not Found Fallbacks */}
        <Route
          path="/access-denied"
          element={
            <div className="auth-loading-screen">
              <div style={{ textAlign: 'center', maxWidth: '420px', padding: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Access Denied</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                  Your account does not have administrative privileges to access this console route.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button className="btn btn-primary btn-md" onClick={() => navigate('/dashboard')}>
                    Return to Dashboard
                  </button>
                  <button className="btn btn-ghost btn-md" onClick={logout}>
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          }
        />

        <Route
          path="*"
          element={
            <div className="auth-loading-screen">
              <div style={{ textAlign: 'center', maxWidth: '420px', padding: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Page Not Found</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                  The requested RecoverAI workspace path does not exist.
                </p>
                <button className="btn btn-primary btn-md" onClick={() => navigate(user ? defaultUserPath : '/')}>
                  Return to Safety
                </button>
              </div>
            </div>
          }
        />
      </Routes>
    </Suspense>
  );
}

function ProtectedRoute({ user, adminOnly = false, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/access-denied" replace />;
  return children;
}
