import { Link } from 'react-router-dom';
import { Brain, ShieldCheck, FileBarChart, ArrowRight, Microscope, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const Landing = () => (
  <div className="min-h-[calc(100vh-4rem)] bg-white flex flex-col">

    {/* Hero */}
    <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white py-24 px-6">
      <div className="max-w-4xl mx-auto text-center space-y-7">

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-blue-100 text-xs font-bold px-4 py-1.5 rounded-full tracking-widest uppercase backdrop-blur-sm">
          <Zap className="h-3 w-3" /> AI-Powered Clinical Decision Support
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-4xl lg:text-5xl font-black leading-tight">
          Intestinal Disorder Detection<br />
          <span className="text-blue-200">&amp; Cancer Risk Prediction</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-blue-100 text-lg max-w-2xl mx-auto leading-relaxed">
          Upload an endoscopic image and provide clinical history. Our dual AI pipeline classifies
          GI conditions and predicts cancer risk with Grad-CAM visual explainability.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link to="/register"
            className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-bold py-3.5 px-8 rounded-xl hover:bg-blue-50 transition shadow-lg">
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/login"
            className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-bold py-3.5 px-8 rounded-xl hover:bg-white/20 transition backdrop-blur-sm">
            Sign In
          </Link>
        </motion.div>
      </div>
    </div>

    {/* Stats strip */}
    <div className="bg-slate-50 border-b border-slate-200">
      <div className="max-w-3xl mx-auto px-6 py-6 grid grid-cols-3 divide-x divide-slate-200 text-center">
        {[
          { val: '5,000+', label: 'Training Images' },
          { val: '99.5%', label: 'XGBoost Accuracy' },
          { val: '5 Classes', label: 'GI Pathologies' },
        ].map(s => (
          <div key={s.label} className="px-4">
            <div className="text-2xl font-black text-blue-600">{s.val}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Feature cards */}
    <div className="flex-1 bg-white py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-black text-slate-900">How ColonAI Works</h2>
          <p className="text-slate-500 text-sm mt-1">Three-step AI pipeline for comprehensive GI diagnostics</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: Microscope, color: 'bg-blue-600', light: 'bg-blue-50 border-blue-100', title: 'Image Classification', desc: 'MobileNetV2 classifies colonoscopy images into 5 GI categories with Grad-CAM attention heatmaps.' },
            { icon: ShieldCheck, color: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-100', title: 'Risk Stratification', desc: 'XGBoost analyses patient age, BMI, lifestyle, and medical history to quantify cancer risk.' },
            { icon: FileBarChart, color: 'bg-violet-600', light: 'bg-violet-50 border-violet-100', title: 'PDF Report', desc: 'Auto-generates a structured clinical PDF with predictions, heatmaps, and specialist recommendations.' },
          ].map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i + 0.4 }}
              className={`rounded-2xl border p-6 ${f.light}`}>
              <div className={`w-11 h-11 rounded-xl ${f.color} flex items-center justify-center mb-4 shadow-sm`}>
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 mb-1.5">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
        <p className="text-center text-xs text-slate-400 mt-10">
          ⚠️ For academic and research purposes only. Not a substitute for professional medical diagnosis.
        </p>
      </div>
    </div>
  </div>
);

export default Landing;
