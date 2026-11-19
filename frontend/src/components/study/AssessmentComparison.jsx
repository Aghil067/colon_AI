import { useState } from 'react';
import { formatDate, labelName } from '../../assessments';
import PrivateImage from './PrivateImage';

export default function AssessmentComparison({ records }) {
  const [showHeatmaps, setShowHeatmaps] = useState(false);
  const [left, right] = records;
  const withHeatmap = records.some(record => record.heatmap_url);
  const sameModel = left.inference && right.inference && left.inference.model_sha256 === right.inference.model_sha256;
  const rightScores = new Map(right.inference?.classes.map(({ label, score }) => [label, score]));

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="compare-assessments">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="compare-assessments" className="text-xl font-bold">Assessment comparison</h2>
        {withHeatmap && <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={showHeatmaps} onChange={event => setShowHeatmaps(event.target.checked)} />
          Show Grad-CAM overlays
        </label>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {records.map(record => (
          <article key={record.id} className="rounded-xl border border-slate-200 p-4 space-y-2">
            <h3 className="font-bold">Assessment #{record.id}</h3>
            <p className="text-sm text-slate-600">{formatDate(record.created_at)}</p>
            <PrivateImage url={showHeatmaps ? record.heatmap_url : record.image_url}
              alt={`${showHeatmaps ? 'Grad-CAM for assessment' : 'Image for assessment'} ${record.id}`} />
            <p className="text-sm font-semibold capitalize">{labelName(record.inference?.label)}</p>
            <p className="text-sm text-slate-600">{record.image_details.width} × {record.image_details.height} px</p>
          </article>
        ))}
      </div>
      <p className="text-sm text-slate-600">{left.sha256 === right.sha256 ? 'The files are byte-for-byte identical.' : 'The original files have different SHA-256 fingerprints.'}</p>
      {sameModel && <div className="overflow-auto">
        <table className="w-full text-left text-sm">
          <caption className="pb-2 text-left font-semibold">Class scores from the same model</caption>
          <thead className="bg-slate-100">
            <tr>
              <th scope="col" className="p-2">Class</th>
              <th scope="col" className="p-2 text-right">#{left.id}</th>
              <th scope="col" className="p-2 text-right">#{right.id}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {left.inference.classes.map(({ label, score }) => (
              <tr key={label}>
                <th scope="row" className="p-2 font-medium capitalize">{labelName(label)}</th>
                <td className="p-2 text-right tabular-nums">{(score * 100).toFixed(1)}%</td>
                <td className="p-2 text-right tabular-nums">{rightScores.has(label) ? `${(rightScores.get(label) * 100).toFixed(1)}%` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
    </section>
  );
}
