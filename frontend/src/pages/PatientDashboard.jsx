import { Link } from 'react-router-dom';
import { FileUp, Clock, ArrowRight, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const PatientDashboard = () => {
  const { user } = useAuth();
  return (
    <div className="p-6 lg:p-8 w-full max-w-4xl mx-auto space-y-6">

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Patient Portal</p>
        <h1 className="text-2xl font-black text-slate-900">Welcome, {user?.name} 👋</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your colon health assessments and AI-generated reports.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* New Analysis — highlighted */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <Link to="/predict"
            className="group block bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-7 relative overflow-hidden border border-blue-500 hover:from-blue-500 hover:to-blue-600 transition-all shadow-lg shadow-blue-200">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-15 transition">
              <FileUp className="h-32 w-32 text-white" />
            </div>
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <FileUp className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-black text-white mb-1.5">New Analysis</h2>
            <p className="text-blue-100 text-sm mb-5 leading-relaxed">
              Upload an endoscopic image and clinical data for full AI-powered risk prediction with Grad-CAM report.
            </p>
            <span className="inline-flex items-center gap-2 bg-white text-blue-700 text-sm font-bold px-4 py-2 rounded-xl group-hover:bg-blue-50 transition">
              Start Now <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </motion.div>

        {/* History */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <Link to="/history"
            className="group block bg-white border border-slate-200 rounded-2xl p-7 relative overflow-hidden hover:border-slate-300 hover:shadow-md transition-all h-full">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition">
              <Clock className="h-32 w-32 text-slate-400" />
            </div>
            <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-50 transition">
              <Clock className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-1.5">My History</h2>
            <p className="text-slate-500 text-sm mb-5 leading-relaxed">
              View all past assessments, AI predictions, confidence scores, and download PDF clinical reports.
            </p>
            <span className="inline-flex items-center gap-2 text-blue-600 text-sm font-bold hover:text-blue-700 transition">
              View Records <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </motion.div>
      </div>

      {/* AI status */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}
        className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow shadow-blue-200">
          <Activity className="h-4.5 w-4.5 text-white h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">AI Models Online</p>
          <p className="text-xs text-slate-500">MobileNetV2 (image) · XGBoost (risk) · Grad-CAM (explainability)</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Online
        </div>
      </motion.div>
    </div>
  );
};

export default PatientDashboard;
