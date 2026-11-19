import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { FileUp, History, Microscope } from 'lucide-react';

export default function PatientDashboard() {
  const { user } = useAuth();
  return (
    <div className="page-shell">
      <header>
        <h1 className="page-title">Welcome, {user.name}</h1>
        <p className="page-intro">Manage your endoscopy assessments and choose who can review them.</p>
      </header>
      <div className="grid gap-5 sm:grid-cols-3 sm:gap-6">
        {[
          ['/predict', 'New assessment', 'Upload an endoscopy image.', FileUp],
          ['/history', 'My assessments', 'Compare images, manage review access and export reports.', History],
          ['/evidence', 'Model evidence', 'See what data and evaluation are available.', Microscope],
        ].map(([path, title, description, Icon]) => <Link key={path} to={path}
          className="card panel-padding block transition-colors hover:border-[#8eb9a9]">
          <Icon className="mb-4 size-6 text-[#17604e]" />
          <h2 className="font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </Link>)}
      </div>
    </div>
  );
}
