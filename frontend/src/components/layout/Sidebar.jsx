import { Link, useLocation } from 'react-router-dom';
import { FlaskConical, FileUp, History, LayoutDashboard, Microscope, ScanEye } from 'lucide-react';
import { useAuth } from '../../context/useAuth';

export default function Sidebar() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  if (!user) return null;

  const reviewer = user.role === 'doctor';
  const links = [
    ['Dashboard', reviewer ? '/doctor/dashboard' : '/patient/dashboard', LayoutDashboard],
    ...(reviewer ? [] : [['New assessment', '/predict', FileUp]]),
    [reviewer ? 'Review queue' : 'My assessments', '/history', History],
    ['Model evidence', '/evidence', Microscope],
    ['Model demo', '/demo', ScanEye],
    ['Research Lab', '/research-lab', FlaskConical],
  ];

  return (
    <aside className="bg-white border-b md:border-b-0 md:border-r border-slate-200 md:w-56 md:shrink-0">
      <nav aria-label="Workspace" className="flex flex-wrap gap-2 p-3 md:flex-col md:sticky md:top-16 md:p-4">
        {links.map(([label, href, Icon]) => <Link key={href} to={href}
          aria-current={pathname === href ? 'page' : undefined}
          className={`flex items-center gap-2 p-2 md:p-3 rounded-lg text-sm font-semibold ${pathname === href
            ? 'bg-[#e6f2ec] text-[#17604e]' : 'text-slate-600 hover:bg-slate-50'}`}>
          <Icon className="size-4" /> {label}
        </Link>)}
      </nav>
    </aside>
  );
}
