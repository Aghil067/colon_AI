import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, FileText, AlertTriangle, Activity, Download, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const DoctorDashboard = () => {
  const [stats, setStats] = useState({ totalPatients: 0, highRisk: 0, reportsGenerated: 0 });
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5000/api/history')
      .then(r => {
        const h = r.data;
        setStats({ totalPatients: new Set(h.map(x => x.patient_name)).size, highRisk: h.filter(x => x.risk_level === 'High').length, reportsGenerated: h.length });
        setRecentPatients(h.slice(0, 5));
      }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 flex justify-center"><Activity className="animate-spin text-blue-600 h-8 w-8" /></div>;

  const riskBadge = (r) => r === 'High' ? 'badge badge-high' : r === 'Medium' ? 'badge badge-medium' : 'badge badge-low';

  return (
    <div className="p-6 lg:p-8 w-full max-w-6xl mx-auto space-y-6">

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Doctor Portal</p>
        <h1 className="text-2xl font-black text-slate-900">Clinical Overview</h1>
        <p className="text-slate-500 text-sm mt-0.5">Monitor patients and latest AI predictions.</p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Patients',    val: stats.totalPatients,    icon: Users,          bg: 'bg-blue-50 border-blue-100',    iconBg: 'bg-blue-600',    text: 'text-blue-600'    },
          { label: 'High Risk Cases',   val: stats.highRisk,         icon: AlertTriangle,  bg: 'bg-red-50 border-red-100',      iconBg: 'bg-red-500',     text: 'text-red-600'     },
          { label: 'Reports Generated', val: stats.reportsGenerated, icon: FileText,       bg: 'bg-emerald-50 border-emerald-100', iconBg: 'bg-emerald-500', text: 'text-emerald-600' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={`rounded-2xl border p-5 flex items-center gap-4 ${s.bg}`}>
            <div className={`w-12 h-12 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
              <s.icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">{s.label}</p>
              <p className={`text-3xl font-black ${s.text}`}>{s.val}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
        className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h2 className="font-bold text-slate-900">Recent Analyses</h2>
          </div>
          <Link to="/history" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition">View All →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr className="text-slate-500 text-xs uppercase tracking-wide">
                <th className="px-5 py-3 font-semibold">Patient</th>
                <th className="px-5 py-3 font-semibold">Prediction</th>
                <th className="px-5 py-3 font-semibold">Risk</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentPatients.length > 0 ? recentPatients.map((p, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-slate-800">{p.patient_name}</td>
                  <td className="px-5 py-3.5 text-slate-600">{p.disease}</td>
                  <td className="px-5 py-3.5"><span className={riskBadge(p.risk_level)}>{p.risk_level}</span></td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs">{p.date}</td>
                  <td className="px-5 py-3.5">
                    <a href={`http://localhost:5000/api/report/${p.id}/download`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition">
                      <Download className="h-3.5 w-3.5" /> PDF
                    </a>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="px-5 py-12 text-center text-slate-400">
                  <FileText className="h-10 w-10 mx-auto text-slate-300 mb-2" />No recent analyses.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default DoctorDashboard;
