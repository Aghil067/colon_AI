import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Download, Layers3, Table2 } from 'lucide-react';
import axios from 'axios';
import { downloadFile, labelName } from '../assessments';

function OverlayInspector({ sample }) {
  const [reveal, setReveal] = useState(50);

  return (
    <section className="card overflow-hidden" aria-labelledby="overlay-inspector">
      <header className="paired-card-header panel-padding border-b border-slate-200">
        <h2 id="overlay-inspector" className="flex items-center gap-2 text-xl font-bold text-[#102f28]">
          <Layers3 aria-hidden="true" className="size-5 text-[#17604e]" /> Grad-CAM inspector
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">Slide to compare the original and Grad-CAM views of the same held-out image.</p>
      </header>
      {sample ? <div className="space-y-4 p-5 sm:p-6">
        <figure>
          <div className="relative isolate overflow-hidden rounded-xl bg-[#0a1e1a]">
            <img src={sample.image_url} alt="Original held-out Kvasir v2 endoscopy image" className="aspect-[4/3] w-full object-contain" />
            {sample.heatmap_url && <>
              <img src={sample.heatmap_url} alt="" aria-hidden="true"
                className="absolute inset-0 h-full w-full object-contain"
                style={{ clipPath: `inset(0 ${100 - reveal}% 0 0)` }} />
              {reveal > 0 && reveal < 100 && <span aria-hidden="true"
                className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow"
                style={{ left: `${reveal}%` }} />}
            </>}
          </div>
          <figcaption className="mt-3 text-sm text-slate-600">
            Dataset label <strong className="capitalize">{labelName(sample.dataset_label)}</strong>
          </figcaption>
        </figure>
        {sample.heatmap_url ? <div>
          <label htmlFor="heatmap-reveal" className="flex items-center justify-between gap-3 text-sm font-semibold">
            Reveal overlay <span className="tabular-nums">{reveal}%</span>
          </label>
          <input id="heatmap-reveal" type="range" min="0" max="100" value={reveal}
            aria-valuetext={`${reveal} percent of the overlay revealed`}
            onChange={event => setReveal(Number(event.target.value))}
            className="mt-2 w-full cursor-pointer accent-[#17604e]" />
          <div className="flex justify-between text-xs text-slate-600"><span>Original only</span><span>Full Grad-CAM</span></div>
        </div> : <p className="text-sm text-slate-600">Grad-CAM is unavailable for this sample.</p>}
      </div> : <p className="p-5 text-sm text-slate-600">The held-out sample is currently unavailable.</p>}
    </section>
  );
}

function exportEvaluation(evaluation) {
  const { classes, confusion_matrix: matrix, per_class: metrics } = evaluation;
  const rows = [
    ['Dataset', 'Model SHA-256', 'Dataset label', 'Test images', 'Precision', 'Recall', 'F1', ...classes.map(name => `Predicted: ${name}`)],
    ...classes.map((name, index) => [
      evaluation.dataset, evaluation.model_sha256, name, metrics[name].support,
      metrics[name].precision, metrics[name].recall, metrics[name]['f1-score'], ...matrix[index],
    ]),
  ];
  const csv = rows.map(row => row.map(cell => {
    const value = String(cell);
    const safe = /^[=+@\-\t\r]/.test(value) ? "'" + value : value;
    return '"' + safe.replaceAll('"', '""') + '"';
  }).join(',')).join('\r\n');
  downloadFile(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'colonai-held-out-evaluation.csv');
}

function EvaluationExplorer({ evaluation }) {
  const [selection, setSelection] = useState(0);
  const classes = evaluation?.classes ?? [];
  const matrix = evaluation?.confusion_matrix;
  const predictions = matrix?.[selection] ?? [];
  const total = predictions.reduce((sum, count) => sum + count, 0);
  const correct = predictions[selection];
  const comparisons = classes.map((name, index) => ({
    name, predictedAs: predictions[index], mistakenFor: matrix[index][selection],
  })).filter((_, index) => index !== selection)
    .sort((left, right) => right.predictedAs - left.predictedAs || right.mistakenFor - left.mistakenFor);
  const selectedLabel = labelName(classes[selection]);

  return (
    <section className="card overflow-hidden" aria-labelledby="evaluation-explorer">
      <header className="paired-card-header panel-padding border-b border-slate-200">
        <h2 id="evaluation-explorer" className="flex items-center gap-2 text-xl font-bold text-[#102f28]">
          <Table2 aria-hidden="true" className="size-5 text-[#17604e]" /> Model error explorer
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">Pick a class to see where the model got it right and which labels it mixed up.</p>
      </header>
      {evaluation ? <div className="space-y-4 p-5 sm:p-6">
        <div>
          <label htmlFor="evaluation-class" className="block text-sm font-semibold">Dataset class</label>
          <select id="evaluation-class" className="input-field mt-1 capitalize" value={selection}
            onChange={event => setSelection(Number(event.target.value))}>
            {classes.map((name, index) => <option key={name} value={index}>{labelName(name)}</option>)}
          </select>
        </div>
        <p role="status" className="rounded-xl bg-[#edf5f1] px-4 py-3 text-sm text-[#102f28]">
          <strong>{correct} of {total}</strong> images labeled <strong>{selectedLabel}</strong> were classified correctly.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Misclassifications involving {selectedLabel} in the test set</caption>
            <thead className="bg-slate-50 text-xs text-slate-700">
              <tr>
                <th scope="col" className="p-2.5">Other class</th>
                <th scope="col" className="p-2.5 text-right">Selected → other</th>
                <th scope="col" className="p-2.5 text-right">Other → selected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparisons.map(({ name, predictedAs, mistakenFor }) => <tr key={name}>
                <th scope="row" className="p-2.5 font-medium capitalize">{labelName(name)}</th>
                <td className="p-2.5 text-right tabular-nums">{predictedAs}</td>
                <td className="p-2.5 text-right tabular-nums">{mistakenFor}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
        <p className="text-xs leading-relaxed text-slate-600">Arrows run from the dataset label to the model prediction.</p>
        <button type="button" className="btn-secondary inline-flex items-center gap-2 text-sm" onClick={() => exportEvaluation(evaluation)}>
          <Download aria-hidden="true" className="size-4" /> Download full evaluation CSV
        </button>
      </div> : <p className="p-5 text-sm text-slate-600">The held-out evaluation is currently unavailable.</p>}
    </section>
  );
}

export default function ResearchLab() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.allSettled([
      axios.get('/api/status', { signal: controller.signal }),
      axios.get('/api/demo', { signal: controller.signal }),
    ]).then(([status, demo]) => {
      if (controller.signal.aborted) return;
      setData({
        evaluation: status.status === 'fulfilled' ? status.value.data.evaluation : null,
        sample: demo.status === 'fulfilled' ? demo.value.data : null,
      });
    });
    return () => controller.abort();
  }, []);

  return (
    <div className="page-shell">
      <header className="page-heading">
        <div>
          <h1 className="page-title">Research Lab</h1>
          <p className="page-intro">Inspect a Grad-CAM overlay and explore classification errors from the held-out test set.</p>
        </div>
        <Link to="/evidence" className="btn-secondary inline-flex items-center gap-2">
          Model evidence <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </header>
      {data ? <div className="workspace-grid">
        <OverlayInspector sample={data.sample} />
        <EvaluationExplorer evaluation={data.evaluation} />
      </div> : <p role="status" className="card p-5 text-slate-600">Loading research data…</p>}
    </div>
  );
}
