import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, Image, Layers3, ScanLine } from 'lucide-react';
import axios from 'axios';
import ClassScores from '../components/study/ClassScores';
import { labelName } from '../assessments';

export default function Demo() {
  const [sample, setSample] = useState(null);
  const [error, setError] = useState('');
  const [reveal, setReveal] = useState(false);
  const [overlay, setOverlay] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    axios.get('/api/demo', { signal: controller.signal })
      .then(({ data }) => setSample(data))
      .catch(error => {
        if (!controller.signal.aborted) {
          setError(error.response?.status === 404
            ? 'The public demo is currently unavailable.'
            : 'Could not reach the backend. Reload to try again.');
        }
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="page-shell">
      <header className="page-heading">
        <div>
          <h1 className="page-title">Endoscopy model demo</h1>
          <p className="page-intro">Explore an endoscopy image from the Kvasir v2 test set and see how the model classified it.</p>
        </div>
        <Link to="/evidence" className="btn-secondary inline-flex items-center gap-2">
          Model evidence <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </header>
      {error && <p role="alert" className="card p-5 text-slate-700">{error}</p>}
      {!sample && !error && <p role="status" className="card p-6 text-slate-600">Loading demo image…</p>}
      {sample && <div className="workspace-grid demo-grid">
        <figure className="overflow-hidden rounded-2xl border border-[#25473d] bg-[#112d27] text-white">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <span className="inline-flex items-center gap-2 text-sm font-semibold">
              <ScanLine aria-hidden="true" className="size-4 text-[#98d7bf]" /> Held-out sample
            </span>
            {reveal && sample.heatmap_url && <div role="group" aria-label="Image display" className="flex flex-wrap gap-1 rounded-lg bg-[#0a1e1a] p-1">
              <button type="button" className="image-view-toggle" aria-pressed={!overlay} onClick={() => setOverlay(false)}>
                <Image aria-hidden="true" className="size-3.5" /> Original image
              </button>
              <button type="button" className="image-view-toggle" aria-pressed={overlay} onClick={() => setOverlay(true)}>
                <Layers3 aria-hidden="true" className="size-3.5" /> Grad-CAM
              </button>
            </div>}
          </div>
          <div className="bg-[#0a1e1a]">
            <img src={overlay ? sample.heatmap_url : sample.image_url}
              alt={overlay ? 'Grad-CAM overlay on the held-out endoscopy image' : 'Held-out endoscopy image from Kvasir v2'}
              className="aspect-[4/3] w-full object-contain" />
          </div>
          <figcaption className="min-h-14 px-4 py-4 text-sm leading-relaxed text-[#c7ddd4] sm:px-5">
            {overlay ? 'Highlighted regions contributed to the displayed model prediction.' : 'Original endoscopy image · Kvasir v2'}
          </figcaption>
        </figure>
        <section className="card overflow-hidden" aria-labelledby="demo-result">
          <header className="border-b border-[#e0ebe5] px-5 py-4 sm:px-6">
            <h2 id="demo-result" className="text-xl font-bold text-[#102f28]">Model result</h2>
          </header>
          <div className="space-y-5 px-5 py-5 sm:px-6">
            {reveal ? <>
              <dl className="grid gap-2.5 sm:grid-cols-2">
                <div className="rounded-xl bg-[#ecf5f0] p-3.5">
                  <dt className="text-sm font-medium text-[#405b50]">Model prediction</dt>
                  <dd className="mt-0.5 text-lg font-bold capitalize text-[#102f28]">{labelName(sample.inference.label)}</dd>
                </div>
                <div className="rounded-xl border border-slate-200 p-3.5">
                  <dt className="text-sm font-medium text-slate-600">Dataset label</dt>
                  <dd className="mt-0.5 text-lg font-bold capitalize text-slate-900">{labelName(sample.dataset_label)}</dd>
                </div>
              </dl>
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Class scores</h3>
                <ClassScores classes={sample.inference.classes} />
              </div>
              <p className="text-xs leading-relaxed text-slate-600">Classification scores are provided for academic interpretation.</p>
            </> : <div className="rounded-xl bg-[#ecf5f0] p-4 sm:p-5">
              <p className="mb-4 text-sm leading-relaxed text-[#405b50]">Compare the model’s prediction with the dataset label and explore the Grad-CAM overlay.</p>
              <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={() => setReveal(true)}>
                Reveal prediction <ArrowDownRight aria-hidden="true" className="size-4" />
              </button>
            </div>}
            <details className="border-t border-slate-200 pt-4 text-sm text-slate-700">
              <summary className="cursor-pointer font-semibold">Sample provenance</summary>
              <p className="mt-2"><a href={sample.inference.dataset_url} className="font-semibold text-[#17604e] underline">{sample.inference.dataset} dataset</a></p>
              <p className="mt-2 break-all text-xs">Image SHA-256 <code>{sample.image_sha256}</code></p>
              <p className="mt-1 break-all text-xs">Model SHA-256 <code>{sample.inference.model_sha256}</code></p>
            </details>
          </div>
        </section>
      </div>}
    </div>
  );
}
