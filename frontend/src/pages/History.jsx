import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import AssessmentCard from '../components/study/AssessmentCard';
import AssessmentComparison from '../components/study/AssessmentComparison';
import { downloadFile, formatDate, labelName } from '../assessments';
import { useAuth } from '../context/useAuth';

const reviewStatus = (record) => record.reviewed_at ? 'Reviewed' : record.reviewer ? 'Awaiting review' : 'Private';

function exportRecords(records) {
  const rows = [
    ['Assessment ID', 'Created at (UTC)', 'Source', 'Image SHA-256', 'Width', 'Height', 'Image label', 'Review status'],
    ...records.map(record => [record.id, record.created_at, record.source, record.sha256, record.image_details.width,
      record.image_details.height, record.inference?.label ?? '', reviewStatus(record)]),
  ];
  const csv = rows.map(row => row.map(cell => '"' + String(cell).replaceAll('"', '""') + '"').join(',')).join('\r\n');
  downloadFile(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'ColonAI_Assessments.csv');
}

export default function History() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [params, setParams] = useSearchParams();
  const detail = params.get('assessment');
  const [duplicatesOnly, setDuplicatesOnly] = useState(false);
  const [selected, setSelected] = useState([]);
  const [compare, setCompare] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const detailPanel = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    axios.get('/api/assessments', { signal: controller.signal })
      .then(({ data }) => setRecords(data))
      .catch(() => { if (!controller.signal.aborted) setError('Could not load assessments. Refresh to try again.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (detail && !loading) detailPanel.current?.scrollIntoView({ block: 'start' });
  }, [detail, loading]);

  if (loading) return <p className="p-8" role="status">Loading assessments…</p>;

  const openRecord = records.find(record => String(record.id) === detail);
  const compared = selected.map(id => records.find(record => record.id === id));
  const imageCounts = new Map();
  for (const record of records) {
    imageCounts.set(record.sha256, (imageCounts.get(record.sha256) ?? 0) + 1);
  }
  const visible = records.filter(record => {
    const text = `${record.id} ${record.patient_name} ${labelName(record.inference?.label)}`.toLowerCase();
    return (filter === 'All' || reviewStatus(record) === filter) && text.includes(query.trim().toLowerCase())
      && (!duplicatesOnly || imageCounts.get(record.sha256) > 1);
  });

  function toggle(id) {
    setSelected(before => before.includes(id) ? before.filter(item => item !== id) : [...before, id]);
    setCompare(false);
  }

  return (
    <div className="page-shell">
      <header className="page-heading">
        <div>
          <h1 className="page-title">{user.role === 'doctor' ? 'Shared assessments' : 'My assessments'}</h1>
          <p className="page-intro">Review recorded images, compare assessments and download reports.</p>
        </div>
        {user.role === 'patient' && <Link to="/predict" className="btn-primary">New assessment</Link>}
      </header>

      {error && <p role="alert" className="text-red-700">{error}</p>}
      {records.length === 0 && !error && <p className="bg-white border border-slate-200 rounded-xl p-5 text-slate-600">
        {user.role === 'doctor' ? 'Assessments appear here after a patient shares them with your account.' : 'Your uploaded assessments will appear here.'}
      </p>}
      {records.length > 0 && <>
        <div className="card panel-padding flex flex-wrap items-end gap-x-4 gap-y-3">
          <label className="w-full text-sm font-semibold sm:w-48">Search
            <input type="search" className="input-field block mt-1" value={query} onChange={event => setQuery(event.target.value)} />
          </label>
          <label className="w-full text-sm font-semibold sm:w-44">Review status
            <select className="input-field block mt-1" value={filter} onChange={event => setFilter(event.target.value)}>
              {['All', 'Private', 'Awaiting review', 'Reviewed'].map(value => <option key={value}>{value}</option>)}
            </select>
          </label>
          {user.role === 'patient' && <button className="btn-secondary" disabled={selected.length !== 2}
            onClick={() => { setCompare(true); setParams({}); }}>Compare selected ({selected.length}/2)</button>}
          <button className="btn-secondary" disabled={!visible.length} onClick={() => exportRecords(visible)}>Export CSV</button>
          {user.role === 'patient' && <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={duplicatesOnly} onChange={event => setDuplicatesOnly(event.target.checked)} />
            Identical files only
          </label>}
        </div>
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700"><tr>
              {user.role === 'patient' && <th scope="col" className="p-3">Compare</th>}
              <th scope="col" className="p-3">Assessment</th><th scope="col" className="p-3">Created</th>
              <th scope="col" className="p-3">Image classification</th><th scope="col" className="p-3">Review</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map(record => <tr key={record.id}>
                {user.role === 'patient' && <td className="p-3"><input type="checkbox" aria-label={`Compare assessment ${record.id}`}
                  checked={selected.includes(record.id)} disabled={selected.length === 2 && !selected.includes(record.id)}
                  onChange={() => toggle(record.id)} /></td>}
                <td className="p-3"><Link to={`?assessment=${record.id}`} className="font-semibold text-blue-700 underline" onClick={() => setCompare(false)}>
                  #{record.id}{user.role === 'doctor' ? ` · ${record.patient_name}` : ''}
                </Link></td>
                <td className="p-3">{formatDate(record.created_at)}</td>
                <td className="p-3 capitalize">{labelName(record.inference?.label)}</td>
                <td className="p-3">{reviewStatus(record)}</td>
              </tr>)}
              {!visible.length && <tr><td className="p-4 text-slate-600" colSpan={user.role === 'patient' ? 5 : 4}>No matching assessments.</td></tr>}
            </tbody>
          </table>
        </div>
      </>}

      {compare && !detail && <AssessmentComparison records={compared} />}

      {detail && !openRecord && !error && <p role="status" className="text-slate-600">This assessment is unavailable.</p>}
      {openRecord && <div ref={detailPanel} className="scroll-mt-20">
        <AssessmentCard key={openRecord.id} record={openRecord} role={user.role}
          onChange={updated => setRecords(before => before.map(record => record.id === updated.id ? updated : record))} />
      </div>}
    </div>
  );
}
