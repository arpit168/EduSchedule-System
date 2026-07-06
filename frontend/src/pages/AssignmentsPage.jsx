import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import { UserCheck, Plus, Edit2, Trash2, Download, Eye, LayoutGrid, List, BookOpen, GraduationCap, Clock } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import { GlassCard } from '../components/common/Card';
import Table from '../components/common/Table';
import { Modal, ConfirmDeleteModal } from '../components/common/Modal';
import Drawer from '../components/common/Drawer';
import SearchFilterBar from '../components/common/SearchFilterBar';
import { Input, Select } from '../components/common/FormControls';
import { Badge } from '../components/common/UIStates';

const AssignmentsPage = () => {
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Modal & Drawer State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssign, setEditingAssign] = useState(null);
  const [viewingAssign, setViewingAssign] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [assignToDelete, setAssignToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    teacher: '',
    subject: '',
    classRef: '',
    workloadPeriods: 4,
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const deptQuery = selectedDept ? `?department=${selectedDept}` : '';
      const [aRes, tRes, sRes, cRes, dRes] = await Promise.all([
        api.get(`/assignments${deptQuery}`),
        api.get('/teachers?limit=100'),
        api.get('/subjects?limit=100'),
        api.get('/classes?limit=100'),
        api.get('/departments'),
      ]);
      setAssignments(aRes.data.data || []);
      setTeachers(tRes.data.data || []);
      setSubjects(sRes.data.data || []);
      setClasses(cRes.data.data || []);
      setDepartments(dRes.data.data || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast.error('Failed to load workload assignments');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDept]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (a = null) => {
    if (a) {
      setEditingAssign(a);
      setFormData({
        teacher: a.teacher?._id || a.teacher || '',
        subject: a.subject?._id || a.subject || '',
        classRef: a.classRef?._id || a.classRef || '',
        workloadPeriods: a.workloadPeriods || 4,
      });
    } else {
      setEditingAssign(null);
      setFormData({
        teacher: teachers[0]?._id || '',
        subject: subjects[0]?._id || '',
        classRef: classes[0]?._id || '',
        workloadPeriods: 4,
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.teacher || !formData.subject || !formData.classRef) {
      return toast.error('Please select teacher, subject, and class');
    }
    setIsSubmitting(true);
    try {
      if (editingAssign) {
        await api.put(`/assignments/${editingAssign._id}`, formData);
        toast.success('Assignment updated successfully!');
      } else {
        await api.post('/assignments', formData);
        toast.success('Workload assignment created successfully!');
      }
      setModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (a, e) => {
    if (e) e.stopPropagation();
    setAssignToDelete(a);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!assignToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/assignments/${assignToDelete._id}`);
      toast.success('Assignment removed successfully');
      setDeleteModalOpen(false);
      setAssignToDelete(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove assignment');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    const tName = a.teacher?.name || '';
    const sName = a.subject?.name || '';
    const sCode = a.subject?.code || '';
    const cName = a.classRef?.className || '';
    const q = searchQuery.toLowerCase();
    return (
      tName.toLowerCase().includes(q) ||
      sName.toLowerCase().includes(q) ||
      sCode.toLowerCase().includes(q) ||
      cName.toLowerCase().includes(q)
    );
  });

  const exportToExcel = () => {
    if (assignments.length === 0) return toast.error('No records to export');
    const data = assignments.map((a) => ({
      'Teacher Name': a.teacher?.name || 'N/A',
      'Employee ID': a.teacher?.employeeId || 'N/A',
      'Subject Name': a.subject?.name || 'N/A',
      'Subject Code': a.subject?.code || 'N/A',
      'Assigned Class': a.classRef ? `${a.classRef.className} (Sec ${a.classRef.section || 'A'})` : 'N/A',
      'Workload Periods / Wk': a.workloadPeriods || 4,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Faculty_Workload');
    XLSX.writeFile(workbook, 'Faculty_Workload_Allocations_2026.xlsx');
    toast.success('Exported faculty workload allocations to Excel!');
  };

  const columns = [
    {
      key: 'teacher',
      label: 'Assigned Faculty Member',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.teacher?.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt={row.teacher?.name || 'Teacher'}
            className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/20 shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white">{row.teacher?.name || 'Unassigned'}</span>
              <Badge variant="primary" size="sm">{row.teacher?.employeeId || 'ID'}</Badge>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block">{row.teacher?.email || ''}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'subject',
      label: 'Academic Subject',
      render: (row) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-800 dark:text-slate-200">{row.subject?.name || 'Subject'}</span>
            <Badge variant="secondary" size="sm">{row.subject?.code || 'CODE'}</Badge>
          </div>
          <span className="text-[11px] text-slate-400 block">{row.subject?.type || 'Theory'} Course</span>
        </div>
      ),
    },
    {
      key: 'classRef',
      label: 'Class & Section',
      render: (row) => (
        <Badge variant="info">
          {row.classRef ? `${row.classRef.className} (Sec ${row.classRef.section || 'A'})` : 'Unassigned Class'}
        </Badge>
      ),
    },
    {
      key: 'workloadPeriods',
      label: 'Weekly Workload',
      render: (row) => (
        <Badge variant="success" size="sm">
          {row.workloadPeriods || 4} periods/wk
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setViewingAssign(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          {user?.role === 'Admin' && (
            <>
              <button
                onClick={() => handleOpenModal(row)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Edit"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={(e) => handleDeleteClick(row, e)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <GlassCard className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <UserCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Faculty Workload & Subject Allocations
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Map professors and lecturers to specific course curriculum and student classroom cohorts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List size={15} />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid size={15} />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>

          <Button variant="success" size="sm" icon={Download} onClick={exportToExcel}>
            Export Excel
          </Button>
          {user?.role === 'Admin' && (
            <Button variant="primary" size="sm" icon={Plus} onClick={() => handleOpenModal()}>
              Assign Workload
            </Button>
          )}
        </div>
      </GlassCard>

      {/* Search & Filters */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setPage(1);
        }}
        searchPlaceholder="Search workload allocations by teacher, subject, or class..."
        filters={[
          {
            key: 'dept',
            label: 'Department',
            value: selectedDept,
            onChange: (val) => {
              setSelectedDept(val);
              setPage(1);
            },
            options: departments.map((d) => ({ value: d._id, label: d.name })),
          },
        ]}
        hasActiveFilters={Boolean(selectedDept)}
        onResetFilters={() => setSelectedDept('')}
      />

      {/* Main Data Display */}
      {viewMode === 'table' ? (
        <Table
          columns={columns}
          data={filteredAssignments}
          isLoading={isLoading}
          emptyMessage="No faculty workload allocations found matching your search criteria."
          onRowClick={(row) => setViewingAssign(row)}
        />
      ) : (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="p-16 text-center text-slate-400 font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
              No faculty workload allocations found matching your search criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssignments.map((a) => (
                <GlassCard
                  key={a._id}
                  hover
                  onClick={() => setViewingAssign(a)}
                  className="p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img
                          src={a.teacher?.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={a.teacher?.name || 'Teacher'}
                          className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/20 shrink-0"
                        />
                        <div className="overflow-hidden">
                          <Badge variant="primary" size="sm" className="mb-1">{a.teacher?.employeeId || 'Faculty'}</Badge>
                          <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">{a.teacher?.name || 'Unassigned'}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                            {a.subject?.name || 'Subject Course'}
                          </p>
                        </div>
                      </div>

                      {user?.role === 'Admin' && (
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenModal(a)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(a, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5"><BookOpen size={13} /> Subject Code:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-200">{a.subject?.code || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5"><GraduationCap size={13} /> Target Class:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-200">
                          {a.classRef ? `${a.classRef.className} (Sec ${a.classRef.section || 'A'})` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5"><Clock size={13} /> Weekly Allocation:</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{a.workloadPeriods} periods / wk</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </>
      )}

      {/* View Details Drawer */}
      <Drawer
        isOpen={Boolean(viewingAssign)}
        onClose={() => setViewingAssign(null)}
        title="Workload Allocation Profile"
        description="Comprehensive mapping between faculty instructor, subject course, and student cohort."
        footer={
          user?.role === 'Admin' && viewingAssign ? (
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  const a = viewingAssign;
                  setViewingAssign(null);
                  handleOpenModal(a);
                }}
              >
                Edit Allocation
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={() => {
                  const a = viewingAssign;
                  setViewingAssign(null);
                  handleDeleteClick(a);
                }}
              >
                Remove Allocation
              </Button>
            </div>
          ) : null
        }
      >
        {viewingAssign && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              <img
                src={viewingAssign.teacher?.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={viewingAssign.teacher?.name || 'Teacher'}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/30"
              />
              <div>
                <Badge variant="primary" size="sm" className="mb-1">{viewingAssign.teacher?.employeeId || 'Faculty ID'}</Badge>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{viewingAssign.teacher?.name || 'Unassigned'}</h4>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {viewingAssign.teacher?.email || 'No email provided'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Course & Classroom Mapping</h5>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Subject Course</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingAssign.subject?.name || 'N/A'}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Course Code</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingAssign.subject?.code || 'N/A'}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl col-span-2">
                  <span className="text-slate-400 block mb-0.5">Student Cohort / Class Section</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {viewingAssign.classRef ? `${viewingAssign.classRef.className} (Section ${viewingAssign.classRef.section || 'A'})` : 'Unassigned'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Workload Commitment</h5>
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-xs block">Assigned Weekly Teaching Periods</span>
                  <span className="text-xs font-medium text-slate-400">Allocated towards teacher's weekly capacity</span>
                </div>
                <span className="font-black text-2xl text-indigo-600 dark:text-indigo-400">{viewingAssign.workloadPeriods}</span>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Add / Edit Workload Assignment Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAssign ? 'Edit Workload Allocation' : 'Assign Faculty Workload'}
        description="Select faculty instructor, course subject, classroom cohort, and weekly period count."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Select
              label="Select Faculty Member (Teacher)"
              required
              value={formData.teacher}
              onChange={(val) => setFormData({ ...formData, teacher: val })}
              options={[
                { value: '', label: 'Choose Faculty Instructor...' },
                ...teachers.map((t) => ({ value: t._id, label: `${t.name} (${t.employeeId})` })),
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Academic Subject Course"
              required
              value={formData.subject}
              onChange={(val) => setFormData({ ...formData, subject: val })}
              options={[
                { value: '', label: 'Select Subject...' },
                ...subjects.map((s) => ({ value: s._id, label: `${s.name} (${s.code})` })),
              ]}
            />
            <Select
              label="Target Class & Section"
              required
              value={formData.classRef}
              onChange={(val) => setFormData({ ...formData, classRef: val })}
              options={[
                { value: '', label: 'Select Class Group...' },
                ...classes.map((c) => ({ value: c._id, label: `${c.className} (Sec ${c.section || 'A'})` })),
              ]}
            />
          </div>

          <div>
            <Input
              label="Weekly Workload Periods"
              type="number"
              required
              value={formData.workloadPeriods}
              onChange={(e) => setFormData({ ...formData, workloadPeriods: Number(e.target.value) })}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Note: Ensure the assigned periods do not exceed the teacher's maximum weekly capacity.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {editingAssign ? 'Update Allocation' : 'Save Workload Allocation'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Remove Workload Allocation"
        message="Are you sure you want to remove this faculty workload assignment? This will unlink the teacher from teaching this subject to this class cohort."
        itemName={assignToDelete?.teacher?.name ? `${assignToDelete.teacher.name} -> ${assignToDelete.subject?.code || 'Subject'}` : ''}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AssignmentsPage;
