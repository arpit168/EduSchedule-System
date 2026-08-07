import { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, Layers, GraduationCap } from 'lucide-react';
import api from '../../services/api';
import useTimetableStore from '../../store/useTimetableStore';

const AutoGenerateModal = ({ isOpen, onClose }) => {
  const { autoGenerate, isLoading } = useTimetableStore();
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [overwrite, setOverwrite] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        try {
          const [dRes, cRes] = await Promise.all([
            api.get('/departments'),
            api.get('/classes'),
          ]);
          setDepartments(dRes.data.data || []);
          setClasses(cRes.data.data || []);
        } catch (error) {
          console.error('Error loading generator options:', error);
        }
      };
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerate = async (e) => {
    e.preventDefault();
    const res = await autoGenerate({
      departmentId: selectedDept,
      classRefId: selectedClass,
      overwriteExisting: overwrite,
    });
    if (res && res.success) {
      onClose();
    }
  };

  const filteredClasses = selectedDept === 'all' ? classes : classes.filter((c) => c.department?._id === selectedDept || c.department === selectedDept);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-enter">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden transition-colors duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-50/50 via-white to-violet-50/20 dark:from-indigo-950/40 dark:via-slate-900 dark:to-violet-950/20 border-b border-slate-200 dark:border-indigo-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Auto Timetable Generator</h3>
              <p className="text-xs text-indigo-650 dark:text-indigo-300">Intelligent conflict-free campus scheduling algorithm</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleGenerate} className="p-6 space-y-5">
          <div className="p-4 rounded-2xl bg-indigo-550/5 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-xs text-indigo-750 dark:text-indigo-200 leading-relaxed">
            <p className="font-bold text-indigo-900 dark:text-white mb-1 flex items-center gap-1.5">
              <AlertCircle size={15} className="text-amber-500" /> How our algorithm works:
            </p>
            The scheduling engine evaluates teacher workloads, required subject credits, lab availability, and working day constraints to automatically build an optimal timetable without clashes.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Layers size={14} className="text-indigo-600 dark:text-indigo-400" /> Filter by Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setSelectedClass('all');
              }}
              className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All School Departments (Full Campus Generation)</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <GraduationCap size={14} className="text-emerald-600 dark:text-emerald-405" /> Target Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Classes in Selected Scope</option>
              {filteredClasses.map((c) => (
                <option key={c._id} value={c._id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{c.className} {c.section} (Sem {c.semester})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50">
            <input
              type="checkbox"
              id="overwrite"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="overwrite" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              Overwrite existing published timetable periods
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating Schedule...
                </>
              ) : (
                <>
                  <Sparkles size={18} /> Start AI Timetable Generation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AutoGenerateModal;
