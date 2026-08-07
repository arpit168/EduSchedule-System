import { useState, useEffect } from 'react';
import { X, Check, Trash2, BookOpen, User, Building2, Clock } from 'lucide-react';
import api from '../../services/api';
import useTimetableStore from '../../store/useTimetableStore';

const SlotEditModal = ({ isOpen, onClose, slotData, classInfo }) => {
  const { updateSlot } = useTimetableStore();
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  
  const [selectedSubject, setSelectedSubject] = useState(slotData?.subject?._id || '');
  const [selectedTeacher, setSelectedTeacher] = useState(slotData?.teacher?._id || '');
  const [selectedRoom, setSelectedRoom] = useState(slotData?.room?._id || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load dropdown options
      const loadOptions = async () => {
        try {
          const [sRes, tRes, rRes] = await Promise.all([
            api.get('/subjects'),
            api.get('/teachers'),
            api.get('/rooms'),
          ]);
          setSubjects(sRes.data.data || []);
          setTeachers(tRes.data.data || []);
          setRooms(rRes.data.data || []);
          setSelectedSubject(slotData?.subject?._id || '');
          setSelectedTeacher(slotData?.teacher?._id || '');
          setSelectedRoom(slotData?.room?._id || '');
        } catch (error) {
          console.error('Error loading options:', error);
        }
      };
      loadOptions();
    }
  }, [isOpen, slotData]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await updateSlot({
      classRefId: classInfo._id,
      day: slotData.day,
      periodNumber: slotData.periodNumber,
      subject: selectedSubject || null,
      teacher: selectedTeacher || null,
      room: selectedRoom || null,
    });
    setIsSaving(false);
    if (res && res.success) {
      onClose();
    }
  };

  const handleClear = async () => {
    setIsSaving(true);
    const res = await updateSlot({
      classRefId: classInfo._id,
      day: slotData.day,
      periodNumber: slotData.periodNumber,
      subject: null,
      teacher: null,
      room: null,
    });
    setIsSaving(false);
    if (res && res.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-enter">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-colors duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-50/50 via-white to-indigo-50/20 dark:from-indigo-950/40 dark:via-slate-900 dark:to-indigo-950/20 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-650 dark:text-indigo-400 block mb-0.5">
              {classInfo?.className} {classInfo?.section}
            </span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Clock size={18} className="text-indigo-650 dark:text-indigo-400" /> {slotData?.day} • Period {slotData?.periodNumber}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <BookOpen size={14} className="text-violet-500 dark:text-violet-400" /> Select Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">-- Free / Empty Slot --</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{s.name} ({s.code}) - {s.type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User size={14} className="text-indigo-600 dark:text-indigo-400" /> Assign Teacher
            </label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">-- No Teacher Assigned --</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{t.name} ({t.employeeId})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Building2 size={14} className="text-emerald-600 dark:text-emerald-400" /> Allocate Room
            </label>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">-- No Room Allocated --</option>
              {rooms.map((r) => (
                <option key={r._id} value={r._id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{r.roomNumber} ({r.building} - {r.type})</option>
              ))}
            </select>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleClear}
              disabled={isSaving}
              className="py-3 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 size={15} /> Clear Period
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={16} />} Save Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SlotEditModal;
