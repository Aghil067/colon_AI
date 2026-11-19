import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { Activity, LogOut, User as UserIcon } from 'lucide-react';

const publicLinks = [
  ['/demo', 'Model demo'],
  ['/evidence', 'Model evidence'],
  ['/research-lab', 'Research Lab'],
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav aria-label="Main navigation" className="sticky top-0 z-50 border-b border-[#dce8e1] bg-white/95 backdrop-blur-sm">
      <div className="layout-width grid min-h-16 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 gap-y-1 py-2.5 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <Link to="/" className="group inline-flex w-fit items-center gap-2 sm:gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-[#17604e] text-white transition-colors group-hover:bg-[#114b3d]">
            <Activity aria-hidden="true" className="size-5" />
          </span>
          <span className="text-base font-extrabold tracking-tight text-[#102f28] sm:text-lg">ColonAI</span>
        </Link>

        {!user && <div className="order-last col-span-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs sm:text-sm md:order-none md:col-span-1 md:gap-x-5">
          {publicLinks.map(([href, label]) => <NavLink key={href} to={href}
            className={({ isActive }) => isActive
              ? 'py-1.5 font-semibold text-[#17604e] underline underline-offset-8'
              : 'py-1.5 font-medium text-slate-600 hover:text-[#17604e]'}>
            {label}
          </NavLink>)}
        </div>}

        <div className="col-start-2 row-start-1 flex shrink-0 items-center justify-self-end gap-1 sm:gap-2 md:col-start-3">
          {user ? <>
            <div className="flex items-center gap-2 rounded-xl bg-[#edf5f1] px-2.5 py-1.5">
              <UserIcon aria-hidden="true" className="size-4 text-[#17604e]" />
              <div className="hidden sm:block">
                <p className="max-w-36 truncate text-xs font-semibold text-slate-800" title={user.name}>{user.name}</p>
                <p className="text-xs text-slate-600">{user.role === 'doctor' ? 'Reviewer' : 'Patient'}</p>
              </div>
            </div>
            <button type="button" onClick={handleLogout} aria-label="Log out"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700">
              <LogOut aria-hidden="true" className="size-4" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </> : <>
            <Link to="/login" className="whitespace-nowrap rounded-lg px-1.5 py-2 text-sm font-semibold sm:px-2.5 text-slate-700 hover:bg-slate-50">Sign in</Link>
            <Link to="/register" className="btn-primary whitespace-nowrap px-2.5 text-sm sm:px-5">Get started</Link>
          </>}
        </div>
      </div>
    </nav>
  );
}
