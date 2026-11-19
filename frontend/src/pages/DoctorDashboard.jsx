import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function DoctorDashboard() {
  const [cases, setCases] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    axios.get('/api/assessments', { signal: controller.signal }).then(({ data }) => setCases(data))
      .catch(() => { if (!controller.signal.aborted) setError('Could not load the review queue.'); });
    return () => controller.abort();
  }, []);

  return (
    <div className="page-shell">
      <header>
        <h1 className="page-title">Reviewer dashboard</h1>
        <p className="page-intro">Open assessments patients have shared with you and add a review note.</p>
      </header>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {!cases && !error && <p role="status">Loading review queue…</p>}
      {cases && <div className="grid gap-5 sm:grid-cols-3 sm:gap-6">
        {[
          ['Shared assessments', cases.length],
          ['Awaiting review', cases.filter(record => !record.reviewed_at).length],
          ['Reviewed', cases.filter(record => record.reviewed_at).length],
        ].map(([label, number]) => <div key={label} className="card panel-padding">
          <p className="font-semibold text-slate-600">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tabular-nums text-[#17604e]">{number}</p>
        </div>)}
      </div>}
      <Link to="/history" className="btn-primary inline-flex">Open review queue</Link>
    </div>
  );
}
