import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Upload, Activity, CheckCircle, AlertTriangle, ArrowLeft, Download,
  Brain, ShieldAlert, Heart, TrendingUp, FileText, Zap, Info,
  Microscope, ClipboardList, ChevronRight, Star, AlertCircle, BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Animated counter ─── */
function AnimatedNumber({ value, decimals = 1, duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = null;
    const from = 0;
    const to = parseFloat(value);
    const step = (ts) => {
      if (!start) start = ts;
      const prog = Math.min((ts - start) / duration, 1);
      setDisplay(parseFloat((from + (to - from) * prog).toFixed(decimals)));
      if (prog < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  return <>{display}</>;
}

/* ─── Circular progress gauge ─── */
function CircularGauge({ value, max = 100, color, label, size = 120 }) {
  const radius = (size - 16) / 2;
  const circ = 2 * Math.PI * radius;
  const filled = (value / max) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - filled }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
        />
      </svg>
      <div className="text-center -mt-2">
        <div className="text-2xl font-black" style={{ color }}><AnimatedNumber value={value} />{max === 10 ? '/10' : '%'}</div>
        <div className="text-xs text-slate-500 font-medium">{label}</div>
      </div>
    </div>
  );
}

/* ─── Probability bar ─── */
function ProbBar({ label, value, highlight }) {
  const colorMap = {
    'Normal': '#10b981', 'Polyps': '#f59e0b', 'Ulcerative Colitis': '#ef4444',
    'Esophagitis': '#8b5cf6', 'Other GI Diseases': '#3b82f6'
  };
  const color = colorMap[label] || '#64748b';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-medium">
        <span className={highlight ? 'font-bold' : 'text-slate-600'}>{label}</span>
        <span style={{ color: highlight ? color : '#64748b' }} className="font-bold">{value.toFixed(1)}%</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
    </div>
  );
}

/* ─── Risk tag ─── */
function RiskTag({ level }) {
  const c = { High: 'bg-red-100 text-red-700 border-red-200', Medium: 'bg-amber-100 text-amber-700 border-amber-200', Low: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${c[level] || c.Low}`}>{level}</span>;
}

/* ─── Disease color theme ─── */
const diseaseTheme = {
  'Normal':            { from: '#10b981', to: '#059669', icon: '✅', badge: 'bg-emerald-500' },
  'Polyps':            { from: '#f59e0b', to: '#d97706', icon: '⚠️', badge: 'bg-amber-500' },
  'Ulcerative Colitis':{ from: '#ef4444', to: '#dc2626', icon: '🔴', badge: 'bg-red-500' },
  'Esophagitis':       { from: '#8b5cf6', to: '#7c3aed', icon: '🟣', badge: 'bg-violet-500' },
  'Other GI Diseases': { from: '#3b82f6', to: '#2563eb', icon: '🔵', badge: 'bg-blue-500' },
};

/* ─── Urgency badge ─── */
function UrgencyBadge({ urgency }) {
  const map = {
    Routine: 'bg-emerald-100 text-emerald-800',
    Moderate: 'bg-amber-100 text-amber-800',
    High: 'bg-orange-100 text-orange-800',
    Urgent: 'bg-red-100 text-red-800',
  };
  return <span className={`text-xs font-bold px-3 py-1 rounded-full ${map[urgency] || map.Routine}`}>{urgency} Urgency</span>;
}

/* ══════════════════════════════════════════════ */
const UploadPrediction = () => {
  const [step, setStep] = useState(1);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [clinicalData, setClinicalData] = useState({
    age: '', gender: 'Male', bmi: '', smoking: '0', alcohol: '0',
    diabetes: '0', ibd: '0', family_history: '0', tumor_size: '', previous_screening: '0'
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) { setImage(file); setPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return alert('Please upload an endoscopic image');
    setLoading(true);
    const formData = new FormData();
    formData.append('image', image);
    Object.keys(clinicalData).forEach(k => formData.append(k, clinicalData[k]));
    try {
      const res = await axios.post('http://localhost:5000/api/predict-combined', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
      setStep(3);
    } catch (err) {
      console.error('Prediction failed', err);
      alert('Prediction failed. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const theme = result ? (diseaseTheme[result.disease] || diseaseTheme['Other GI Diseases']) : null;

  return (
    <div className="p-4 lg:p-8 w-full max-w-6xl mx-auto">

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {[{ n: 1, label: 'Upload Image' }, { n: 2, label: 'Clinical Data' }, { n: 3, label: 'AI Results' }].map((s, i) => (
          <div key={s.n} className="flex items-center">
            <div className={`flex items-center gap-2 ${step >= s.n ? 'text-blue-600' : 'text-slate-400'}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${step >= s.n ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 text-slate-400'}`}>{s.n}</div>
              <span className="font-semibold text-sm hidden sm:block">{s.label}</span>
            </div>
            {i < 2 && <div className={`w-10 sm:w-20 h-0.5 mx-3 rounded ${step > s.n ? 'bg-blue-600' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── STEP 1: Image Upload ── */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Microscope className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-1">Upload Endoscopic Image</h2>
            <p className="text-slate-500 mb-8 text-sm">Provide a clear colonoscopy or endoscopy image (JPG / PNG)</p>

            <label htmlFor="imageUpload" className="cursor-pointer block">
              <div className={`border-2 border-dashed rounded-2xl p-10 transition-all ${preview ? 'border-blue-400 bg-blue-50/30' : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/20'}`}>
                {preview ? (
                  <div className="relative inline-block">
                    <img src={preview} alt="Preview" className="max-h-72 rounded-xl shadow-lg object-contain mx-auto" />
                    <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-bold">✓ Selected</div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                      <Upload className="h-7 w-7 text-slate-400" />
                    </div>
                    <p className="text-slate-500 text-sm">Drag & drop or <span className="text-blue-600 font-semibold">browse files</span></p>
                    <p className="text-slate-400 text-xs">Supported: JPG, PNG, JPEG — Max 10MB</p>
                  </div>
                )}
              </div>
            </label>
            <input type="file" id="imageUpload" className="hidden" accept="image/*" onChange={handleImageChange} />

            <button onClick={() => setStep(2)} disabled={!image}
              className="mt-6 bg-blue-600 text-white px-10 py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center gap-2 mx-auto">
              Continue <ChevronRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {/* ── STEP 2: Clinical Data ── */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep(1)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Patient Clinical History</h2>
                <p className="text-xs text-slate-500">Used for XGBoost risk stratification</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { label: 'Age (years)', name: 'age', type: 'number', placeholder: '45', required: true },
                  { label: 'BMI', name: 'bmi', type: 'number', step: '0.1', placeholder: '24.5', required: true },
                  { label: 'Tumor Size (cm, if known)', name: 'tumor_size', type: 'number', step: '0.1', placeholder: '0.0' },
                ].map(f => (
                  <div key={f.name}>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{f.label}</label>
                    <input {...f} value={clinicalData[f.name]} onChange={e => setClinicalData({ ...clinicalData, [e.target.name]: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Gender</label>
                  <select name="gender" value={clinicalData.gender} onChange={e => setClinicalData({ ...clinicalData, gender: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition">
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Clinical Risk Factors</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { name: 'smoking', label: '🚬 Smoking' },
                    { name: 'alcohol', label: '🍷 Alcohol Use' },
                    { name: 'diabetes', label: '💉 Diabetes' },
                    { name: 'ibd', label: '🔬 IBD History' },
                    { name: 'family_history', label: '👨‍👩‍👧 Family History' },
                    { name: 'previous_screening', label: '📋 Prev. Screening' },
                  ].map(f => (
                    <label key={f.name}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition text-sm font-medium select-none
                        ${clinicalData[f.name] === '1' ? 'bg-blue-50 border-blue-300 text-blue-800' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}>
                      <input type="checkbox" className="w-4 h-4 accent-blue-600" checked={clinicalData[f.name] === '1'}
                        onChange={e => setClinicalData({ ...clinicalData, [f.name]: e.target.checked ? '1' : '0' })} />
                      {f.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" disabled={loading}
                  className="bg-blue-600 text-white px-10 py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-60 flex items-center gap-2">
                  {loading ? <><Activity className="animate-spin h-5 w-5" /> Running AI Analysis...</> : <><Brain className="h-5 w-5" /> Generate AI Report</>}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* ══════ STEP 3: RESULTS ══════ */}
        {step === 3 && result && theme && (
          <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

            {/* ── Hero Banner ── */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl overflow-hidden shadow-lg"
              style={{ background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)` }}>
              <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 opacity-80" />
                    <span className="text-sm font-semibold opacity-90">Analysis Complete · ID #{result.prediction_id}</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black mb-1">{result.disease}</h1>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="bg-white/20 backdrop-blur text-white text-sm px-3 py-1 rounded-full font-semibold">
                      {result.disease_info?.icd || 'ICD-10'}
                    </span>
                    <UrgencyBadge urgency={result.disease_info?.urgency || 'Moderate'} />
                  </div>
                  <p className="text-white/80 text-sm mt-3 max-w-lg">{result.disease_info?.description}</p>
                </div>
                <div className="text-white text-right flex-shrink-0">
                  <div className="text-5xl font-black">{result.confidence.toFixed(1)}%</div>
                  <div className="text-white/70 text-sm font-medium">AI Confidence</div>
                </div>
              </div>

              {/* 4 Stat Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10">
                {[
                  { label: 'Risk Level', value: result.risk_level, icon: ShieldAlert },
                  { label: 'Cancer Prob.', value: `${result.cancer_probability.toFixed(1)}%`, icon: AlertTriangle },
                  { label: 'Survival Est.', value: `${result.survival_score}%`, icon: Heart },
                  { label: 'Severity', value: `${result.severity_score}/10`, icon: TrendingUp },
                ].map(s => (
                  <div key={s.label} className="bg-white/10 backdrop-blur p-4 flex items-center gap-3">
                    <s.icon className="h-5 w-5 text-white/60" />
                    <div>
                      <div className="text-white/60 text-xs">{s.label}</div>
                      <div className="text-white font-black text-lg leading-tight">{s.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── Row 1: GradCAM + Probability Distribution ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* GradCAM */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
                      <Microscope className="h-4 w-4 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Grad-CAM Heatmap</h3>
                      <p className="text-slate-400 text-xs">Regions influencing AI decision</p>
                    </div>
                  </div>
                  <span className="text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded-full font-semibold">MobileNetV2</span>
                </div>
                <div className="relative bg-slate-900 aspect-[4/3] overflow-hidden">
                  {result.heatmap_url ? (
                    <img src={`http://localhost:5000${result.heatmap_url}`} alt="Grad-CAM" className="w-full h-full object-cover" />
                  ) : (
                    <img src={preview} alt="Original" className="w-full h-full object-cover" />
                  )}
                  {/* Heatmap legend */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="bg-black/50 backdrop-blur text-white text-xs px-2 py-1 rounded-lg">
                      🔴 High attention &nbsp;·&nbsp; 🔵 Low attention
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-violet-50/50">
                  <p className="text-xs text-violet-800 font-medium flex items-start gap-1.5">
                    <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    Warmer colours (red/orange) highlight regions the model weighted most heavily in making its prediction.
                  </p>
                </div>
              </motion.div>

              {/* Probability Distribution */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <BarChart2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Disease Probability Distribution</h3>
                    <p className="text-slate-400 text-xs">Softmax output across all 5 classes</p>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  {(result.class_probabilities || []).sort((a, b) => b.probability - a.probability).map(cp => (
                    <ProbBar key={cp.class} label={cp.class} value={cp.probability} highlight={cp.class === result.disease} />
                  ))}
                  {(!result.class_probabilities || result.class_probabilities.length === 0) && (
                    <div className="text-center text-slate-400 text-sm py-4">Probability breakdown not available</div>
                  )}
                </div>
                <div className="px-5 pb-5">
                  <div className="bg-slate-50 rounded-xl p-3 flex items-start gap-2">
                    <Zap className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-slate-600">High confidence in a single class indicates a strong signal in the endoscopic image. Low confidence suggests ambiguous findings.</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ── Row 2: Severity + Risk Factors + Clinical Metrics ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Severity Gauges */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="font-bold text-slate-900 text-sm mb-5 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-500" /> Quantitative Metrics
                </h3>
                <div className="flex items-center justify-around gap-2 flex-wrap">
                  <CircularGauge value={result.severity_score} max={10} color={result.severity_score >= 7 ? '#ef4444' : result.severity_score >= 4 ? '#f59e0b' : '#10b981'} label="Severity" />
                  <CircularGauge value={parseFloat(result.cancer_probability.toFixed(1))} color={result.cancer_probability >= 50 ? '#ef4444' : result.cancer_probability >= 25 ? '#f59e0b' : '#10b981'} label="Cancer Prob." />
                  <CircularGauge value={parseFloat(result.survival_score.toFixed(1))} color="#3b82f6" label="Survival Est." />
                </div>
              </motion.div>

              {/* Risk Factors */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-red-500" /> Identified Risk Factors
                </h3>
                {result.risk_factors && result.risk_factors.length > 0 ? (
                  <div className="space-y-2.5">
                    {result.risk_factors.map((rf, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{rf.factor}</p>
                          <p className="text-xs text-slate-500">{rf.value}</p>
                        </div>
                        <RiskTag level={rf.level} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <CheckCircle className="h-10 w-10 text-emerald-400 mb-2" />
                    <p className="text-sm font-semibold text-emerald-700">No Major Risk Factors</p>
                    <p className="text-xs text-slate-400 mt-1">Maintain regular screening schedule</p>
                  </div>
                )}
              </motion.div>

              {/* Risk level card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className={`rounded-2xl border shadow-sm p-5 ${
                  result.risk_level === 'High' ? 'bg-red-50 border-red-200' :
                  result.risk_level === 'Medium' ? 'bg-amber-50 border-amber-200' :
                  'bg-emerald-50 border-emerald-200'}`}>
                <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500" /> Clinical Risk Assessment
                </h3>
                <div className="text-center py-4">
                  <div className={`text-5xl font-black mb-1 ${result.risk_level === 'High' ? 'text-red-600' : result.risk_level === 'Medium' ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {result.risk_level}
                  </div>
                  <div className="text-slate-500 text-sm">XGBoost Risk Category</div>
                </div>
                <div className="space-y-2 text-xs">
                  {[
                    { label: 'Cancer Probability', value: `${result.cancer_probability.toFixed(1)}%` },
                    { label: 'Survival Estimate', value: `${result.survival_score}%` },
                    { label: 'Prediction Model', value: 'XGBoost v2.0' },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between font-medium">
                      <span className="text-slate-500">{r.label}</span>
                      <span className="text-slate-800">{r.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* ── Row 3: Recommendation + Next Steps ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* AI Recommendation */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-blue-600" /> AI Clinical Recommendation
                </h3>
                <div className={`p-4 rounded-xl border flex items-start gap-3 mb-4 ${
                  result.risk_level === 'High' ? 'bg-red-50 border-red-200' :
                  result.risk_level === 'Medium' ? 'bg-amber-50 border-amber-200' :
                  'bg-emerald-50 border-emerald-200'}`}>
                  <AlertCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${result.risk_level === 'High' ? 'text-red-600' : result.risk_level === 'Medium' ? 'text-amber-600' : 'text-emerald-600'}`} />
                  <p className="text-sm font-semibold text-slate-800 leading-relaxed">{result.recommendation}</p>
                </div>
                <div className="space-y-2">
                  {(result.risk_level === 'High' || ['Polyps', 'Ulcerative Colitis'].includes(result.disease)) ? [
                    '🏥 Schedule urgent Gastroenterologist appointment',
                    '🔬 Colonoscopy with biopsy recommended within 2 weeks',
                    '💊 Discuss treatment options with specialist',
                    '📋 Complete blood panel and tumour markers advised',
                  ] : result.risk_level === 'Medium' ? [
                    '🥗 Adopt Mediterranean diet, reduce processed foods',
                    '🚭 Smoking cessation program if applicable',
                    '📅 Schedule follow-up colonoscopy in 6 months',
                    '🩺 Annual gastroenterology check-up',
                  ] : [
                    '✅ Continue regular annual screening',
                    '🥦 Maintain a high-fibre, low-fat diet',
                    '🏃 Regular physical activity recommended',
                    '📅 Next screening in 3–5 years per guidelines',
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-2.5">
                      <ChevronRight className="h-3.5 w-3.5 mt-0.5 text-blue-500 flex-shrink-0" />{tip}
                    </div>
                  ))}
                </div>
              </div>

              {/* Model Info + Download */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" /> Model Architecture
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Image Model', value: 'MobileNetV2 + Custom Head', color: 'bg-blue-100 text-blue-700' },
                      { label: 'Training Data', value: '5,000 Augmented Images', color: 'bg-violet-100 text-violet-700' },
                      { label: 'Risk Model', value: 'XGBoost (99.5% Acc.)', color: 'bg-emerald-100 text-emerald-700' },
                      { label: 'Explainability', value: 'Grad-CAM Visualization', color: 'bg-orange-100 text-orange-700' },
                      { label: 'Classes', value: '5 GI Pathology Categories', color: 'bg-pink-100 text-pink-700' },
                    ].map(r => (
                      <div key={r.label} className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">{r.label}</span>
                        <span className={`font-bold px-2 py-0.5 rounded-full ${r.color}`}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <a href={`http://localhost:5000${result.report_url}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-2xl font-bold hover:from-blue-700 hover:to-blue-800 transition shadow-md shadow-blue-200 text-sm">
                  <FileText className="h-5 w-5" />
                  Download Full PDF Report
                  <Download className="h-4 w-4 opacity-70" />
                </a>

                <button onClick={() => { setStep(1); setResult(null); setImage(null); setPreview(null); }}
                  className="flex items-center justify-center gap-2 w-full bg-slate-100 text-slate-700 px-6 py-3 rounded-2xl font-semibold hover:bg-slate-200 transition text-sm">
                  <Upload className="h-4 w-4" /> Run New Analysis
                </button>
              </div>
            </motion.div>

            {/* Disclaimer */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 font-medium">
                <strong>Medical Disclaimer:</strong> This AI-generated report is intended for decision support only and does not replace clinical judgement. All findings must be reviewed and confirmed by a qualified medical professional before any treatment decisions are made.
              </p>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadPrediction;
