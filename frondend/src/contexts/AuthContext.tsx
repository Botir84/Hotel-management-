import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Profile } from '../types';

interface AuthUser {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'kassir'; // Biz Backendda shunday belgiladik
  access: string; // JWT token uchun
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => void;
  isAdmin: boolean;
  isKassir: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: () => { },
  isAdmin: false,
  isKassir: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);

          // Token va Rol borligini tekshiramiz
          if (userData && userData.access) {
            setUser(userData);
          } else {
            localStorage.removeItem('user');
          }
        }
      } catch (e) {
        console.error("Auth init error:", e);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const signOut = () => {
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  // Rollarni tekshirish uchun qulay yordamchilar
  const isAdmin = user?.role === 'admin';
  const isKassir = user?.role === 'kassir';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signOut,
      isAdmin,
      isKassir,
    }}>
      {!loading ? children : (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-slate-400 text-sm font-medium animate-pulse">Yuklanmoqda...</p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);