import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AlertProvider } from './contexts/AlertContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Layout } from './components/layout/Layout';

// ✅ Lazy loading — har sahifa alohida yuklanadi
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const RevenuePage = lazy(() => import('./pages/RevenuePage').then(m => ({ default: m.RevenuePage })));
const RoomsManagePage = lazy(() => import('./pages/RoomsPage').then(m => ({ default: m.RoomsManagePage })));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage').then(m => ({ default: m.ProfilePage })));
const SecurityPage = lazy(() => import('./pages/SecurityPage').then(m => ({ default: m.SecurityPage })));

// ✅ Skeleton loader — sahifa o'tishda chiroyli ko'rinadi
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#5D7B93] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function PrivateRoute({ children, adminOnly = false }: { children: JSX.Element; adminOnly?: boolean }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;

  return children;
}

function LayoutWrapper() {
  const navigate = useNavigate();
  return (
    <Layout onNavigate={(page) => navigate(`/${page}`)}>
      <Outlet />
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AlertProvider>
            <Router>
              {/* ✅ Suspense — lazy load bo'lguncha spinner */}
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />

                  <Route path="/" element={
                    <PrivateRoute>
                      <LayoutWrapper />
                    </PrivateRoute>
                  }>
                    <Route index element={<Navigate to="/dashboard" replace />} />

                    {/* Umumiy sahifalar */}
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="profile" element={<ProfilePage />} />

                    {/* Faqat Admin */}
                    <Route path="revenue" element={
                      <PrivateRoute adminOnly><RevenuePage /></PrivateRoute>
                    } />
                    <Route path="rooms" element={
                      <PrivateRoute adminOnly><RoomsManagePage /></PrivateRoute>
                    } />
                    <Route path="security" element={
                      <PrivateRoute adminOnly><SecurityPage /></PrivateRoute>
                    } />
                  </Route>

                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Suspense>
            </Router>
          </AlertProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;