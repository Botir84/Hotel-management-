import { useState, useEffect } from 'react';
import { Users, Shield, User, Search, UserPlus, Activity, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { Badge } from '../components/ui/Badge';
import { useTheme } from '../contexts/ThemeContext';

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { isDark } = useTheme();

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setEmployees(data as Profile[]);
        setLoading(false);
      });
  }, []);

  const filtered = employees.filter(e =>
    e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    e.role.toLowerCase().includes(search.toLowerCase())
  );

  const admins = employees.filter(e => e.role === 'admin').length;
  const receptionists = employees.filter(e => e.role === 'receptionist').length;

  const cardBg = isDark ? 'bg-slate-800/30 border-slate-700/40' : 'bg-white border-gray-100 shadow-sm';
  const textPrimary = isDark ? 'text-slate-100' : 'text-gray-900';
  const textMuted = isDark ? 'text-slate-500' : 'text-gray-400';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Users size={20} className="text-blue-400" />
          </div>
          <div>
            <h2 className={`text-lg font-semibold ${textPrimary}`}>Employee Directory</h2>
            <p className={`text-xs ${textMuted}`}>{employees.length} staff members registered</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Staff', value: employees.length, icon: <Users size={16} />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Administrators', value: admins, icon: <Shield size={16} />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Receptionists', value: receptionists, icon: <User size={16} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 flex items-center gap-4 ${cardBg}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>
              {s.icon}
            </div>
            <div>
              <p className={`text-2xl font-bold ${textPrimary}`}>{s.value}</p>
              <p className={`text-xs ${textMuted}`}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
        <div className="p-5 flex items-center justify-between gap-4">
          <h3 className={`text-sm font-semibold ${textPrimary}`}>All Staff Members</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} />
              <input
                type="text"
                placeholder="Search staff..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`pl-8 pr-4 py-2 text-sm rounded-xl border outline-none focus:ring-2 ${isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500/20'
                    : 'bg-white border-gray-200 text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <UserPlus size={32} className={textMuted} />
            <p className={`text-sm ${textPrimary}`}>No staff members found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-y text-left ${isDark ? 'bg-slate-800/60 border-slate-700/40' : 'bg-gray-50 border-gray-100'}`}>
                  {['Employee', 'Role', 'Access Level', 'Member Since', 'Status'].map(h => (
                    <th key={h} className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider ${textMuted}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr
                    key={emp.id}
                    className={`border-b transition-colors ${isDark ? 'border-slate-700/20 hover:bg-slate-800/40' : 'border-gray-50 hover:bg-gray-50'}`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white ${emp.role === 'admin'
                            ? 'bg-gradient-to-br from-amber-500 to-amber-700'
                            : 'bg-gradient-to-br from-blue-500 to-blue-700'
                          }`}>
                          {emp.avatar_initials || emp.full_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${textPrimary}`}>{emp.full_name}</p>
                          <p className={`text-xs ${textMuted}`}>{emp.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {emp.role === 'admin' ? (
                          <Shield size={13} className="text-amber-400" />
                        ) : (
                          <User size={13} className="text-blue-400" />
                        )}
                        <span className={`text-sm capitalize ${textPrimary}`}>{emp.role}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={emp.role === 'admin' ? 'warning' : 'blue'} dot>
                        {emp.role === 'admin' ? 'Full Access' : 'Limited Access'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className={textMuted} />
                        <span className={`text-sm ${textPrimary}`}>
                          {new Date(emp.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Activity size={12} className="text-emerald-400" />
                        <Badge variant="success" dot>Active</Badge>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
