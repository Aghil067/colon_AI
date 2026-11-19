import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { labelName } from '../assessments';

export default function Evidence() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    axios.get('/api/status', { signal: controller.signal }).then(({ data }) => setStatus(data))
      .catch(() => { if (!controller.signal.aborted) setError('Could not reach the backend.'); });
    return () => controller.abort();
  }, []);

  const evidence = status?.evaluation;
  return (
    <div className="page-shell">
      <header className="page-heading">
        <div>
          <h1 className="page-title">Model evidence</h1>
          <p className="page-intro">Dataset, classifier availability and reproducible evaluation.</p>
        </div>
        <Link to="/demo" className="btn-secondary inline-flex text-sm">Explore a held-out demo image</Link>
      </header>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {!status && !error && <p role="status">Loading model status…</p>}
      {status && <>
        <section className="card panel-padding space-y-2">
          <h2 className="text-lg font-bold">Endoscopy classifier</h2>
          <p>API online · {status.image_classifier === 'ready' ? 'Classifier ready'
            : status.image_classifier === 'load_error' ? 'Classifier could not be loaded' : 'Classifier unavailable'}</p>
          <p className="text-sm text-slate-600">Training source <a className="text-[#17604e] underline" href={status.dataset.url}>{status.dataset.name} from Simula</a></p>
          <ul className="flex flex-wrap gap-2">
            {status.dataset.classes.map(label => <li key={label} className="capitalize bg-slate-100 px-2 py-1 rounded text-sm">{labelName(label)}</li>)}
          </ul>
          {!evidence && <p className="text-sm text-slate-600">Evaluation results appear after training and installing the sourced model.</p>}
        </section>
        {evidence && <section className="card panel-padding space-y-4">
          <h2 className="text-lg font-bold">Held-out image evaluation</h2>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Accuracy', `${(evidence.accuracy * 100).toFixed(2)}%`],
              ['Macro F1', evidence.macro_f1.toFixed(3)],
              ['Test images', evidence.split.test.toLocaleString()],
              ['Model', evidence.architecture],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-[#edf5f1] px-3 py-3 sm:px-4">
                <dt className="text-xs font-semibold text-[#405b50]">{label}</dt>
                <dd className="mt-1 break-words text-sm font-bold tabular-nums text-[#102f28] sm:text-base">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-sm text-slate-600">Training {evidence.split.training} · Validation {evidence.split.validation} · Test {evidence.split.test} images</p>
          {evidence.preparation && (
            <p className="text-sm text-slate-600">
              {evidence.preparation.source_images.toLocaleString()} source entries · {' '}
              {evidence.preparation.unique_usable_images.toLocaleString()} unique images used · {' '}
              {evidence.preparation.conflicting_image_hashes.toLocaleString()} distinct images with conflicting labels excluded
            </p>
          )}
          <p className="text-sm text-slate-600">{evidence.method} {evidence.limitations}</p>
          <p className="text-xs text-slate-600 break-all">Dataset SHA-256 <code>{evidence.archive_sha256}</code></p>
          <p className="text-xs text-slate-600 break-all">Model SHA-256 <code>{evidence.model_sha256}</code></p>
          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200"><tr>
                {['Class', 'Precision', 'Recall', 'F1', 'Test images'].map(label => <th className="p-2" key={label} scope="col">{label}</th>)}
              </tr></thead>
              <tbody>{status.dataset.classes.map(label => {
                const result = evidence.per_class[label];
                return <tr key={label} className="border-b border-slate-100">
                  <th scope="row" className="capitalize p-2">{labelName(label)}</th>
                  <td className="p-2">{result.precision.toFixed(3)}</td><td className="p-2">{result.recall.toFixed(3)}</td>
                  <td className="p-2">{result['f1-score'].toFixed(3)}</td><td className="p-2">{result.support}</td>
                </tr>;
              })}</tbody>
            </table>
          </div>
          <details className="rounded-lg border border-slate-200 p-3">
            <summary className="cursor-pointer font-semibold">Confusion matrix</summary>
            <div className="mt-3 overflow-auto">
              <table className="w-full text-sm">
                <caption className="mb-2 text-left text-slate-600">Rows show dataset labels. Columns show model predictions.</caption>
                <thead><tr>
                  <th scope="col" className="p-2 text-left">Dataset label</th>
                  {status.dataset.classes.map(label => <th key={label} scope="col" className="p-2 capitalize">{labelName(label)}</th>)}
                </tr></thead>
                <tbody>{evidence.confusion_matrix.map((row, rowIndex) => {
                  const label = status.dataset.classes[rowIndex];
                  return <tr key={label} className="border-t border-slate-100">
                    <th scope="row" className="p-2 text-left capitalize">{labelName(label)}</th>
                    {row.map((count, columnIndex) => <td key={status.dataset.classes[columnIndex]}
                      className={`text-center tabular-nums p-2 ${columnIndex === rowIndex ? 'bg-[#edf5f1] font-bold' : ''}`}>{count}</td>)}
                  </tr>;
                })}</tbody>
              </table>
            </div>
          </details>
        </section>}
        <section className="card panel-padding space-y-2">
          <h2 className="text-lg font-bold">Colorectal cancer risk reference</h2>
          <p className="text-sm text-slate-600">ColonAI does not calculate an individual cancer risk estimate. The NCI calculator lists the populations and clinical conditions covered by its model.</p>
          <a href={status.risk_tool.url} className="inline-flex text-[#17604e] font-semibold underline">{status.risk_tool.name}</a>
        </section>
      </>}
    </div>
  );
}
