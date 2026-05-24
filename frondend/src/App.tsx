import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AlertProvider } from './contexts/AlertContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { RevenuePage } from './pages/RevenuePage';
import { RoomsManagePage } from './pages/RoomsPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { SecurityPage } from './pages/SecurityPage';

function PrivateRoute({ children, adminOnly = false }: { children: JSX.Element; adminOnly?: boolean }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#5D7B93] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
              <Routes>
                {/* Ochiq sahifa */}
                <Route path="/login" element={<LoginPage />} />

                {/* Himoyalangan barcha sahifalar */}
                <Route path="/" element={
                  <PrivateRoute>
                    <LayoutWrapper />
                  </PrivateRoute>
                }>
                  <Route index element={<Navigate to="/dashboard" replace />} />

                  {/* 1. Umumiy sahifalar (Admin + Kassir) */}
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="profile" element={<ProfilePage />} />

                  {/* 2. Faqat Admin uchun sahifalar */}
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

                {/* Noma'lum manzillar */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Router>
          </AlertProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;