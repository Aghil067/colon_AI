import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileUp, History, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return null;

  const navItems = user.role === 'doctor'
    ? [
        { name: 'Dashboard',     path: '/doctor/dashboard', icon: LayoutDashboard },
        { name: 'New Analysis',  path: '/predict',          icon: FileUp },
        { name: 'History',       path: '/history',          icon: History },
      ]
    : [
        { name: 'Dashboard',     path: '/patient/dashboard', icon: LayoutDashboard },
        { name: 'New Analysis',  path: '/predict',           icon: FileUp },
        { name: 'My History',    path: '/history',           icon: History },
      ];

  return (
    <aside className="w-56 bg-white border-r border-slate-200 h-[calc(100vh-4rem)] sticky top-16 hidden md:flex flex-col shadow-sm">
      <div className="px-4 pt-6 pb-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Menu</p>
        <nav className="space-y-1">
          {navItems.map(({ name, path, icon: Icon }) => {
            const active = location.pathname.startsWith(path);
            return (
              <Link key={name} to={path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  active ? 'bg-blue-600 shadow shadow-blue-200' : 'bg-slate-100'
                }`}>
                  <Icon className={`h-3.5 w-3.5 ${active ? 'text-white' : 'text-slate-400'}`} />
                </div>
                {name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Status pill */}
      <div className="mt-auto px-4 pb-5">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
          <div>
            <p className="text-xs font-bold text-slate-700">AI Models Online</p>
            <p className="text-[10px] text-slate-400">MobileNetV2 · XGBoost</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
