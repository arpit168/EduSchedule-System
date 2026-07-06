import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import { BookOpen, Plus, Edit2, Trash2, Download, Eye, LayoutGrid, List, Clock, Award, Tag } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import { GlassCard } from '../components/common/Card';
import Table, { TablePagination } from '../components/common/Table';
import { Modal, ConfirmDeleteModal } from '../components/common/Modal';
import Drawer from '../components/common/Drawer';
import SearchFilterBar from '../components/common/SearchFilterBar';
import { Input, Select } from '../components/common/FormControls';
import { Badge } from '../components/common/UIStates';

const SubjectsPage = () => {
  const { user } = useAuthStore();
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Modal & Drawer State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [viewingSubject, setViewingSubject] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: '',
    type: 'Theory',
    credits: 4,
    weeklyRequiredPeriods: 4,
    color: 'indigo',
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const deptQuery = selectedDept ? `&department=${selectedDept}` : '';
      const [sRes, dRes] = await Promise.all([
        api.get(`/subjects?search=${encodeURIComponent(searchQuery)}${deptQuery}&page=${page}&limit=12`),
        api.get('/departments'),
      ]);
      setSubjects(sRes.data.data || []);
      setTotalPages(sRes.data.pages || 1);
      setTotalItems(sRes.data.total || (sRes.data.data?.length || 0));
      setDepartments(dRes.data.data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDept, searchQuery, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (s = null) => {
    if (s) {
      setEditingSubject(s);
      setFormData({
        name: s.name || '',
        code: s.code || '',
        department: s.department?._id || s.department || '',
        type: s.type || 'Theory',
        credits: s.credits || 4,
        weeklyRequiredPeriods: s.weeklyRequiredPeriods || 4,
        color: s.color || 'indigo',
      });
    } else {
      setEditingSubject(null);
      setFormData({
        name: '',
        code: `CS${Math.floor(100 + Math.random() * 900)}`,
        department: departments[0]?._id || '',
        type: 'Theory',
        credits: 4,
        weeklyRequiredPeriods: 4,
        color: 'indigo',
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.department) {
      return toast.error('Please fill in all required fields');
    }
    setIsSubmitting(true);
    try {
      if (editingSubject) {
        await api.put(`/subjects/${editingSubject._id}`, formData);
        toast.success('Subject updated successfully!');
      } else {
        await api.post('/subjects', formData);
        toast.success('Subject created successfully!');
      }
      setModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (s, e) => {
    if (e) e.stopPropagation();
    setSubjectToDelete(s);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!subjectToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/subjects/${subjectToDelete._id}`);
      toast.success('Subject deleted successfully');
      setDeleteModalOpen(false);
      setSubjectToDelete(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete subject');
    } finally {
      setIsDeleting(false);
    }
  };

  const exportToExcel = () => {
    if (subjects.length === 0) return toast.error('No records to export');
    const data = subjects.map((s) => ({
      'Subject Code': s.code,
      'Name': s.name,
      'Department': s.department?.name || 'General',
      'Type': s.type || 'Theory',
      'Credits': s.credits,
      'Weekly Periods Required': s.weeklyRequiredPeriods,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Subjects');
    XLSX.writeFile(workbook, 'Academic_Subjects_2026.xlsx');
    toast.success('Exported academic subjects to Excel!');
  };

  const columns = [
    {
      key: 'code',
      label: 'Code & Subject Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
            <BookOpen size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white">{row.name}</span>
              <Badge variant="primary" size="sm">{row.code}</Badge>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block">{row.department?.name || 'General Dept'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => (
        <Badge variant={row.type === 'Practical' || row.type === 'Lab' ? 'warning' : 'info'}>
          {row.type || 'Theory'}
        </Badge>
      ),
    },
    {
      key: 'credits',
      label: 'Credits',
      render: (row) => <span className="font-bold text-slate-800 dark:text-slate-200">{row.credits || 4} Cr</span>,
    },
    {
      key: 'weeklyRequiredPeriods',
      label: 'Weekly Periods',
      render: (row) => (
        <Badge variant="success" size="sm">
          {row.weeklyRequiredPeriods || 4} periods/wk
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
            onClick={() => setViewingSubject(row)}
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
              <BookOpen className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Academic Subjects Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage course curriculum, theory and laboratory types, credit values, and weekly period requirements.
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
              Add Subject
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
        searchPlaceholder="Search subjects by name or course code..."
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
        <>
          <Table
            columns={columns}
            data={subjects}
            isLoading={isLoading}
            emptyMessage="No academic subjects found matching your search criteria."
            onRowClick={(row) => setViewingSubject(row)}
          />
          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={(p) => setPage(p)}
          />
        </>
      ) : (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <div className="p-16 text-center text-slate-400 font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
              No academic subjects found matching your search criteria.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((s) => (
                <GlassCard
                  key={s._id}
                  hover
                  onClick={() => setViewingSubject(s)}
                  className="p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                          <BookOpen size={22} />
                        </div>
                        <div>
                          <Badge variant="primary" size="sm" className="mb-1">{s.code}</Badge>
                          <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">{s.name}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                            {s.department?.name || 'General Dept'}
                          </p>
                        </div>
                      </div>

                      {user?.role === 'Admin' && (
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenModal(s)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(s, e)}
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
                        <span className="flex items-center gap-1.5"><Tag size={13} /> Course Type:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-200">{s.type || 'Theory'}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5"><Award size={13} /> Credit Value:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-200">{s.credits || 4} Credits</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5"><Clock size={13} /> Weekly Workload:</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{s.weeklyRequiredPeriods} periods / wk</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              onPageChange={(p) => setPage(p)}
            />
            </>
          )}
        </>
      )}

      {/* View Details Drawer */}
      <Drawer
        isOpen={Boolean(viewingSubject)}
        onClose={() => setViewingSubject(null)}
        title="Subject Curriculum Profile"
        description="Course requirements, credit values, and weekly period allocation."
        footer={
          user?.role === 'Admin' && viewingSubject ? (
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  const s = viewingSubject;
                  setViewingSubject(null);
                  handleOpenModal(s);
                }}
              >
                Edit Subject
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={() => {
                  const s = viewingSubject;
                  setViewingSubject(null);
                  handleDeleteClick(s);
                }}
              >
                Delete Subject
              </Button>
            </div>
          ) : null
        }
      >
        {viewingSubject && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                <BookOpen size={28} />
              </div>
              <div>
                <Badge variant="primary" size="sm" className="mb-1">{viewingSubject.code}</Badge>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{viewingSubject.name}</h4>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {viewingSubject.department?.name || 'General Department'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Curriculum Specifications</h5>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Course Type</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingSubject.type || 'Theory'}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Credit Value</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingSubject.credits || 4} Credits</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl col-span-2">
                  <span className="text-slate-400 block mb-0.5">Department Assignment</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingSubject.department?.name || 'General'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Weekly Schedule Requirement</h5>
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-xs block">Required Teaching Periods</span>
                  <span className="text-xs font-medium text-slate-400">Per weekly class timetable</span>
                </div>
                <span className="font-black text-2xl text-indigo-600 dark:text-indigo-400">{viewingSubject.weeklyRequiredPeriods}</span>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Add / Edit Subject Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSubject ? 'Edit Subject Details' : 'Add New Academic Subject'}
        description="Define course codes, credit weights, and required weekly teaching periods."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Subject Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Data Structures & Algorithms"
            />
            <Input
              label="Subject Code"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="CS301"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Department"
              required
              value={formData.department}
              onChange={(val) => setFormData({ ...formData, department: val })}
              options={[
                { value: '', label: 'Select Department' },
                ...departments.map((d) => ({ value: d._id, label: `${d.name} (${d.code})` })),
              ]}
            />
            <Select
              label="Course Type"
              value={formData.type}
              onChange={(val) => setFormData({ ...formData, type: val })}
              options={[
                { value: 'Theory', label: 'Theory' },
                { value: 'Practical', label: 'Practical' },
                { value: 'Lab', label: 'Laboratory' },
                { value: 'Tutorial', label: 'Tutorial' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Credits"
              type="number"
              value={formData.credits}
              onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
            />
            <Input
              label="Weekly Required Periods"
              type="number"
              value={formData.weeklyRequiredPeriods}
              onChange={(e) => setFormData({ ...formData, weeklyRequiredPeriods: Number(e.target.value) })}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {editingSubject ? 'Update Subject' : 'Save Academic Subject'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Academic Subject"
        message="Are you sure you want to delete this course? Any teacher timetable allocations or class schedules referencing this subject will be affected."
        itemName={subjectToDelete?.name}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default SubjectsPage;
