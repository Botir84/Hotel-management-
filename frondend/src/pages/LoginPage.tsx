import { useState } from 'react';
import { Hotel, Eye, EyeOff, Lock, User, ArrowRight } from 'lucide-react';
import { authService } from '../services/api';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({
        username: email,
        password: password
      });

      if (response.data && response.data.access) {
        localStorage.setItem('user', JSON.stringify(response.data));
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 150);
      } else {
        setError('Xavfsizlik kaliti topilmadi.');
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Login yoki parol xato!';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  // Inputlar uchun umumiy shaffof klass
  const inputClass = `w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 
    text-white placeholder-slate-500 text-sm outline-none focus:border-[#5D7B93] 
    focus:ring-4 focus:ring-[#5D7B93]/10 transition-all backdrop-blur-md`;

  const labelClass = "block text-[10px] font-black mb-2 uppercase tracking-[0.2em] text-[#A2B3C1]";

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-950 font-sans">

      {/* ORQA FON: Rasm va Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=2070"
          alt="Hotel Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/70" />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-transparent to-slate-900/50" />
      </div>

      {/* LOGIN CARD: Maksimal darajada shaffof (Pure Glassmorphism) */}
      <div className="relative z-10 w-full max-w-md p-6">
        <div className="bg-white/[0.03] border border-white/10 rounded-[3rem] shadow-2xl backdrop-blur-2xl overflow-hidden py-12 px-10 transition-all">

          {/* Logo qismi */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#5D7B93]/20 border border-white/10 rounded-2xl backdrop-blur-xl mb-4">
              <Hotel size={28} className="text-[#A2B3C1]" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">
              Hotel<span className="text-[#5D7B93]">CRM</span>
            </h1>
            <p className="text-[#A2B3C1]/60 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">
              Smart Management System
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Foydalanuvchi nomi */}
            <div>
              <label className={labelClass}>Username</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#5D7B93] transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Foydalanuvchi nomi"
                  className={inputClass}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Parol */}
            <div>
              <label className={labelClass}>Parol</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#5D7B93] transition-colors" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={inputClass}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Xatolik xabari */}
            {error && (
              <div className="text-red-400 text-[11px] font-bold text-center py-2 px-4 bg-red-500/10 rounded-xl border border-red-500/20 animate-pulse">
                {error}
              </div>
            )}

            {/* Kirish tugmasi */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] text-white shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] group relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #5D7B93 0%, #7A96AD 100%)' }}
            >
              <span className="relative z-10 flex items-center gap-2">
                {loading ? 'Kirilmoqda...' : 'Tizimga kirish'}
                {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
              </span>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </form>
        </div>


      </div>
    </div>
  );
}