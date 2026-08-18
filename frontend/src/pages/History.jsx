import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Download, FileText, Search, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    axios.get('http://localhost:5000/api/history')
      .then(r => setHistory(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/delete/${id}`);
      setHistory(history.filter(h => h.id !== id));
    } catch (e) { console.error(e); }
  };

  const filtered = history.filter(item =>
    item.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.disease.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const riskBadge = (r) => r === 'High' ? 'badge badge-high' : r === 'Medium' ? 'badge badge-medium' : 'badge badge-low';

  if (loading) return <div className="p-8 flex justify-center"><Activity className="animate-spin text-blue-600 h-8 w-8" /></div>;

  return (
    <div className="p-6 lg:p-8 w-full max-w-6xl mx-auto space-y-6">

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Records</p>
          <h1 className="text-2xl font-black text-slate-900">Analysis History</h1>
          <p className="text-slate-500 text-sm mt-0.5">{filtered.length} record{filtered.length !== 1 ? 's' : ''} found</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Search patient or disease…" value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)} className="input-field pl-10" />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-slate-500 text-xs uppercase tracking-wide">
                {user?.role === 'doctor' && <th className="px-5 py-3.5 font-semibold">Patient</th>}
                <th className="px-5 py-3.5 font-semibold">Date</th>
                <th className="px-5 py-3.5 font-semibold">Prediction</th>
                <th className="px-5 py-3.5 font-semibold">Confidence</th>
                <th className="px-5 py-3.5 font-semibold">Risk</th>
                <th className="px-5 py-3.5 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? filtered.map(record => (
                <tr key={record.id} className="hover:bg-blue-50/40 transition-colors">
                  {user?.role === 'doctor' && <td className="px-5 py-4 font-semibold text-slate-800">{record.patient_name}</td>}
                  <td className="px-5 py-4 text-slate-400 text-xs whitespace-nowrap">{record.date}</td>
                  <td className="px-5 py-4 font-semibold text-slate-800">{record.disease}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${record.confidence}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{record.confidence.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4"><span className={riskBadge(record.risk_level)}>{record.risk_level}</span></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <a href={`http://localhost:5000/api/report/${record.id}/download`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition">
                        <Download className="h-3.5 w-3.5" /> PDF
                      </a>
                      {user?.role === 'doctor' && (
                        <button onClick={() => handleDelete(record.id)}
                          className="text-slate-300 hover:text-red-500 transition">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={user?.role === 'doctor' ? 6 : 5} className="px-5 py-16 text-center">
                  <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500 font-semibold">No records found.</p>
                  <p className="text-slate-400 text-xs mt-1">Run your first analysis to see results here.</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default History;
