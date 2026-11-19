import { useState } from 'react';
import axios from 'axios';
import { Download } from 'lucide-react';
import { downloadReport, formatDate, labelName, sourceName } from '../../assessments';
import PrivateImage from './PrivateImage';
import ClassScores from './ClassScores';

export default function AssessmentCard({ record, role, onChange }) {
  const [email, setEmail] = useState(record.reviewer_email || '');
  const [note, setNote] = useState(record.review_note || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const details = record.image_details;

  async function run(action, message) {
    setBusy(true);
    setError('');
    setFeedback('');
    try {
      await action();
      setFeedback(message);
    } catch (err) {
      setError(err.response?.data?.message || 'The action failed. Try again.');
    } finally {
      setBusy(false);
    }
  }

  function share(nextEmail) {
    return run(async () => {
      const { data } = await axios.put(`/api/assessments/${record.id}/sharing`, { email: nextEmail });
      setEmail(data.reviewer_email || '');
      onChange(data);
    }, nextEmail ? 'Review access granted.' : 'Review access revoked.');
  }

  function review(event) {
    event.preventDefault();
    return run(async () => {
      const { data } = await axios.put(`/api/assessments/${record.id}/review`, { note });
      onChange(data);
    }, 'Review saved.');
  }

  return (
    <article className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-7 space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">Assessment #{record.id} · {formatDate(record.created_at)}</p>
          <h2 className="text-xl font-bold capitalize text-slate-900">{labelName(record.inference?.label)}</h2>
          {role === 'doctor' && <p className="text-sm text-slate-600">{record.patient_name}</p>}
        </div>
        <button type="button" className="btn-secondary inline-flex items-center gap-2" disabled={busy}
          onClick={() => run(() => downloadReport(record.id), 'Report downloaded.')}>
          <Download className="size-4" /> Download PDF
        </button>
      </header>

      <div className={record.heatmap_url ? 'grid gap-4 sm:grid-cols-2' : 'max-w-xl'}>
        <figure>
          <PrivateImage url={record.image_url} alt="Submitted endoscopy image" />
          <figcaption className="mt-2 text-xs font-semibold text-slate-600">Submitted image</figcaption>
        </figure>
        {record.heatmap_url && <figure>
          <PrivateImage url={record.heatmap_url} alt="Grad-CAM overlay" />
          <figcaption className="mt-2 text-xs font-semibold text-slate-600">Grad-CAM overlay</figcaption>
        </figure>}
      </div>

      <section className="space-y-2 rounded-xl bg-slate-50 p-4">
        <h3 className="font-bold text-slate-900">Image provenance</h3>
        <p className="text-sm text-slate-600">{sourceName(record.source)} · {details.format} · {details.width} × {details.height} px · {(details.bytes / 1024).toFixed(1)} KiB</p>
        <p className="text-sm text-slate-600">Mean brightness {details.brightness}/255 · Contrast (pixel standard deviation) {details.contrast}</p>
        {details.source_url && <p className="text-sm text-slate-600 break-all">Declared source <a href={details.source_url}
          target="_blank" rel="noreferrer" className="text-blue-700 underline">{details.source_url}</a></p>}
        <p className="text-xs text-slate-600 break-all">Original SHA-256 <code>{record.sha256}</code></p>
      </section>

      {record.inference && <section className="space-y-3">
        <h3 className="font-bold text-slate-900">Class scores</h3>
        <p className="text-sm text-slate-600">Training dataset <a className="underline" href={record.inference.dataset_url}>{record.inference.dataset}</a>. Scores are for academic interpretation.</p>
        <ClassScores classes={record.inference.classes} />
      </section>}

      <section className="space-y-3 border-t border-slate-200 pt-4">
        <h3 className="font-bold text-slate-900">Review</h3>
        {record.reviewer && <p className="text-sm text-slate-600">Reviewer {record.reviewer}{record.reviewed_at ? ` · Reviewed ${formatDate(record.reviewed_at)}` : ' · Awaiting review'}</p>}
        {record.review_note && <p className="whitespace-pre-wrap break-words rounded-xl bg-blue-50 p-3 text-sm text-slate-800">{record.review_note}</p>}
        {role === 'patient' && <form onSubmit={(event) => { event.preventDefault(); share(email.trim()); }} className="space-y-2">
          <label htmlFor={`reviewer-${record.id}`} className="text-sm text-slate-600">Share this assessment with a reviewer using their account email.</label>
          <div className="flex flex-wrap gap-2">
            <input id={`reviewer-${record.id}`} className="input-field flex-1 min-w-48" type="email" maxLength={120}
              required value={email} onChange={event => setEmail(event.target.value)} />
            <button className="btn-primary" disabled={busy}>Share</button>
            {record.reviewer && <button type="button" className="btn-secondary" disabled={busy} onClick={() => share('')}>
              {record.review_note ? 'Revoke access and clear note' : 'Revoke access'}
            </button>}
          </div>
        </form>}
        {role === 'doctor' && <form onSubmit={review} className="space-y-2">
          <label htmlFor={`note-${record.id}`} className="text-sm text-slate-600">Reviewer note</label>
          <textarea id={`note-${record.id}`} className="input-field" required rows={3} maxLength={2000}
            value={note} onChange={event => setNote(event.target.value)} />
          <button className="btn-primary" disabled={busy}>Save review</button>
        </form>}
        {feedback && <p role="status" className="text-sm text-emerald-700">{feedback}</p>}
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      </section>
    </article>
  );
}
