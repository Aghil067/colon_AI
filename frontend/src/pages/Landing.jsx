import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileImage, Layers3, Microscope, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/useAuth';

const features = [
  [FileImage, 'Image provenance', 'Trace each image to its source and match duplicate files by their SHA-256 fingerprint.'],
  [Microscope, 'Model evidence', 'Explore held-out results, class scores, and the confusion matrix.'],
  [ShieldCheck, 'Controlled review', 'Share individual assessments, collect reviewer notes, and export a PDF.'],
];

export default function Landing() {
  const { user } = useAuth();
  const [imageUnavailable, setImageUnavailable] = useState(false);
  const dashboard = user?.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard';
  return (
    <div className="bg-white min-h-screen">
      <section className="bg-[#edf5f1] border-b border-[#d8e5df]">
        <div className="layout-width grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_1.02fr] lg:gap-14 lg:py-20">
          <div className="max-w-xl">
            <h1 className="text-[clamp(2.65rem,5.1vw,4.65rem)] leading-[1.03] font-extrabold tracking-[-0.065em] text-[#102f28]">
              Endoscopy assessment workspace
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-[#405b50] sm:text-lg">
              Review endoscopy images with model predictions and Grad-CAM, then share assessments for review.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/demo" className="btn-primary inline-flex items-center gap-2">
                Try the model demo <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link to={user ? dashboard : '/register'} className="btn-secondary inline-flex items-center">
                {user ? 'Open dashboard' : 'Create an account'}
              </Link>
            </div>
          </div>

          <figure className="overflow-hidden rounded-2xl bg-[#112d27] p-3.5 text-white shadow-[0_14px_40px_-25px_#123c32] sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3 px-1 text-sm">
              <span className="inline-flex items-center gap-2 font-semibold"><Layers3 aria-hidden="true" className="size-4 text-[#98d7bf]" /> Sample analysis</span>
              <span className="text-xs font-medium text-[#bdd8cd]">Kvasir v2</span>
            </div>
            {imageUnavailable ? (
              <div className="grid aspect-video place-items-center rounded-lg bg-[#1d4037] px-4 text-center text-sm text-emerald-50">
                Sample preview unavailable.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <img src="/api/demo/image" alt="Held-out Kvasir v2 endoscopy image" onError={() => setImageUnavailable(true)}
                    className="aspect-square w-full rounded-lg bg-[#0a1e1a] object-contain" />
                  <p className="mb-1 mt-2 px-1 text-xs text-[#d2e6de]">Original image</p>
                </div>
                <div>
                  <img src="/api/demo/heatmap" alt="Grad-CAM overlay on the same image" onError={() => setImageUnavailable(true)}
                    className="aspect-square w-full rounded-lg bg-[#0a1e1a] object-contain" />
                  <p className="mb-1 mt-2 px-1 text-xs text-[#d2e6de]">Grad-CAM overlay</p>
                </div>
              </div>
            )}
          </figure>
        </div>
      </section>

      <section aria-label="Research workspace features" className="layout-width grid gap-5 py-8 sm:grid-cols-3 sm:gap-6 sm:py-12">
        {features.map(([Icon, title, description]) => (
          <article key={title} className="rounded-2xl border border-[#dce8e1] bg-[#fbfdfc] p-5 sm:p-6">
            <div className="mb-4 grid size-10 place-items-center rounded-xl bg-[#e6f2ec] text-[#17604e]">
              <Icon aria-hidden="true" className="size-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{description}</p>
          </article>
        ))}
      </section>
      <footer className="layout-width flex flex-wrap items-center justify-between gap-3 pb-8 text-sm text-slate-600">
        <p>ColonAI is an academic research prototype.</p>
        <Link to="/evidence" className="font-semibold text-[#17604e] underline underline-offset-4">View model evidence</Link>
      </footer>
    </div>
  );
}
