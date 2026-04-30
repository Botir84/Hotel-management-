import { useState } from 'react';
import { Hotel, Eye, EyeOff, Shield } from 'lucide-react';
import { authService } from '../services/api';
import { Button } from '../components/ui/Button';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const DEMO_ACCOUNTS = [
    {
      username: 'admin',
      password: 'adminpassword',
      label: 'Admin Access',
      description: 'Full system access',
      color: 'from-blue-600 to-blue-800',
    },
    {
      username: 'kassir1',
      password: 'kassirpassword',
      label: 'Receptionist',
      description: 'Front desk operations',
      color: 'from-slate-600 to-slate-800',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Django backendga login so'rovi
      const response = await authService.login({
        username: email,
        password: password
      });

      // 2. Javobni va tokenni tekshirish
      if (response.data && response.data.access) {
        // 3. Ma'lumotni LocalStorage-ga yozish
        localStorage.setItem('user', JSON.stringify(response.data));

        // 4. "Race Condition" oldini olish uchun kichik kechikish
        // va Context/Interceptorlarni yangilash uchun to'liq yo'naltirish
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 150);
      } else {
        setError('Token topilmadi. Backend javobini tekshiring.');
      }
    } catch (err: any) {
      console.error("Login Error Details:", err.response?.data);
      const detail = err.response?.data?.detail || 'Login yoki parol xato!';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = (account: any) => {
    setEmail(account.username);
    setPassword(account.password);
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all";

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Chap tomondagi Branding qismi */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-gradient-to-br from-slate-900 to-slate-950 border-r border-slate-800/60 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Hotel size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-none">HotelCRM</p>
              <p className="text-slate-500 text-xs">AI Security System</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Intelligent Hotel
            <br />
            <span className="text-blue-400">Security & Operations</span>
          </h2>
          <p className="text-slate-400 mt-4 max-w-sm">
            Kamera orqali pulni aniqlash va o'g'irliklarning oldini olish tizimi.
          </p>
        </div>
        <div className="text-slate-600 text-xs">© 2026 HotelCRM AI. Barcha huquqlar himoyalangan.</div>
      </div>

      {/* O'ng tomondagi Form qismi */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-slate-100">Xush kelibsiz</h1>
            <p className="text-slate-500 text-sm mt-1">Tizimga kirish uchun ma'lumotlarni kiriting</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Username</label>
              <input
                type="text"
                placeholder="Foydalanuvchi nomi"
                className={inputClass}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Parol</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`${inputClass} pr-10`}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-xs px-3 py-2 bg-red-500/10 rounded-xl border border-red-500/20 animate-pulse">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3"
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Kirilmoqda...' : 'Tizimga kirish'}
            </Button>
          </form>

          {/* Quick Access */}
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-slate-600 text-xs uppercase tracking-widest">Tezkor kirish</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            <div className="grid grid-cols-1 gap-2">
              {DEMO_ACCOUNTS.map(account => (
                <button
                  key={account.username}
                  type="button"
                  onClick={() => handleDemo(account)}
                  className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${account.color} border border-white/5 hover:scale-[1.02] transition-transform active:scale-95`}
                >
                  <Shield size={15} className="text-white/80" />
                  <div className="flex-1 text-left">
                    <p className="text-white text-sm font-medium">{account.label}</p>
                    <p className="text-white/50 text-[10px]">{account.username}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}