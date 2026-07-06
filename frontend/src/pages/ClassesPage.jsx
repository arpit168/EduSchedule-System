import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import { GraduationCap, Plus, Edit2, Trash2, Download, Eye, LayoutGrid, List, Users, Calendar, Award } from 'lucide-react';
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

const ClassesPage = () => {
  const { user } = useAuthStore();
  const [classes, setClasses] = useState([]);
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
  const [editingClass, setEditingClass] = useState(null);
  const [viewingClass, setViewingClass] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    className: '',
    section: 'A',
    semester: 3,
    batch: '2025-2028',
    strength: 60,
    department: '',
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const deptQuery = selectedDept ? `&department=${selectedDept}` : '';
      const [cRes, dRes] = await Promise.all([
        api.get(`/classes?search=${encodeURIComponent(searchQuery)}${deptQuery}&page=${page}&limit=12`),
        api.get('/departments'),
      ]);
      setClasses(cRes.data.data || []);
      setTotalPages(cRes.data.pages || 1);
      setTotalItems(cRes.data.total || (cRes.data.data?.length || 0));
      setDepartments(dRes.data.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDept, searchQuery, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (c = null) => {
    if (c) {
      setEditingClass(c);
      setFormData({
        className: c.className || '',
        section: c.section || 'A',
        semester: c.semester || 3,
        batch: c.batch || '2025-2028',
        strength: c.strength || 60,
        department: c.department?._id || c.department || '',
      });
    } else {
      setEditingClass(null);
      setFormData({
        className: 'BCA',
        section: 'A',
        semester: 3,
        batch: '2025-2028',
        strength: 60,
        department: departments[0]?._id || '',
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.className || !formData.department) {
      return toast.error('Please fill in all required fields');
    }
    setIsSubmitting(true);
    try {
      if (editingClass) {
        await api.put(`/classes/${editingClass._id}`, formData);
        toast.success('Class updated successfully!');
      } else {
        await api.post('/classes', formData);
        toast.success('Class created successfully!');
      }
      setModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save class');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (c, e) => {
    if (e) e.stopPropagation();
    setClassToDelete(c);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!classToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/classes/${classToDelete._id}`);
      toast.success('Class deleted successfully');
      setDeleteModalOpen(false);
      setClassToDelete(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete class');
    } finally {
      setIsDeleting(false);
    }
  };

  const exportToExcel = () => {
    if (classes.length === 0) return toast.error('No records to export');
    const data = classes.map((c) => ({
      'Class Name': c.className,
      'Section': c.section,
      'Semester': c.semester,
      'Batch': c.batch,
      'Student Strength': c.strength,
      'Department': c.department?.name || 'General',
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Classes');
    XLSX.writeFile(workbook, 'Academic_Classes_2026.xlsx');
    toast.success('Exported academic classes to Excel!');
  };

  const columns = [
    {
      key: 'className',
      label: 'Class & Section',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
            <GraduationCap size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white">{row.className}</span>
              <Badge variant="primary" size="sm">Sec {row.section || 'A'}</Badge>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block">{row.department?.name || 'General Dept'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'semester',
      label: 'Semester',
      render: (row) => <Badge variant="info">Sem {row.semester || 1}</Badge>,
    },
    {
      key: 'batch',
      label: 'Academic Batch',
      render: (row) => <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">{row.batch || '2025-2028'}</span>,
    },
    {
      key: 'strength',
      label: 'Student Strength',
      render: (row) => (
        <Badge variant="success" size="sm">
          {row.strength || 60} Students
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
            onClick={() => setViewingClass(row)}
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
              <GraduationCap className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Academic Classes Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage student groups, academic batches, semester divisions, sections, and classroom capacities.
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
              Add Class
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
        searchPlaceholder="Search classes by name, section, batch..."
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
            data={classes}
            isLoading={isLoading}
            emptyMessage="No academic classes found matching your search criteria."
            onRowClick={(row) => setViewingClass(row)}
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
          ) : classes.length === 0 ? (
            <div className="p-16 text-center text-slate-400 font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
              No academic classes found matching your search criteria.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((c) => (
                <GlassCard
                  key={c._id}
                  hover
                  onClick={() => setViewingClass(c)}
                  className="p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                          <GraduationCap size={22} />
                        </div>
                        <div>
                          <Badge variant="primary" size="sm" className="mb-1">Sec {c.section || 'A'}</Badge>
                          <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">{c.className}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                            {c.department?.name || 'General Dept'}
                          </p>
                        </div>
                      </div>

                      {user?.role === 'Admin' && (
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenModal(c)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(c, e)}
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
                        <span className="flex items-center gap-1.5"><Award size={13} /> Semester:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-200">Sem {c.semester || 1}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5"><Calendar size={13} /> Batch:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-200">{c.batch || '2025-2028'}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5"><Users size={13} /> Strength:</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{c.strength || 60} Students</span>
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
        isOpen={Boolean(viewingClass)}
        onClose={() => setViewingClass(null)}
        title="Class Group Profile"
        description="Student enrollment strength, batch timeline, and section details."
        footer={
          user?.role === 'Admin' && viewingClass ? (
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  const c = viewingClass;
                  setViewingClass(null);
                  handleOpenModal(c);
                }}
              >
                Edit Class
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={() => {
                  const c = viewingClass;
                  setViewingClass(null);
                  handleDeleteClick(c);
                }}
              >
                Delete Class
              </Button>
            </div>
          ) : null
        }
      >
        {viewingClass && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                <GraduationCap size={28} />
              </div>
              <div>
                <Badge variant="primary" size="sm" className="mb-1">Section {viewingClass.section || 'A'}</Badge>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{viewingClass.className}</h4>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {viewingClass.department?.name || 'General Department'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Academic Cohort Details</h5>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Current Semester</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Semester {viewingClass.semester || 1}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Academic Batch</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingClass.batch || '2025-2028'}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl col-span-2">
                  <span className="text-slate-400 block mb-0.5">Department Assignment</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingClass.department?.name || 'General'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Enrollment & Capacity</h5>
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-xs block">Total Enrolled Students</span>
                  <span className="text-xs font-medium text-slate-400">Classroom seating requirement</span>
                </div>
                <span className="font-black text-2xl text-emerald-600 dark:text-emerald-400">{viewingClass.strength || 60}</span>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Add / Edit Class Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingClass ? 'Edit Class Details' : 'Add New Academic Class'}
        description="Specify class name, section division, semester level, and student count."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Class Name"
              required
              value={formData.className}
              onChange={(e) => setFormData({ ...formData, className: e.target.value })}
              placeholder="BCA / B.Tech / MBA"
            />
            <Input
              label="Section"
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              placeholder="A / B / C"
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
            <Input
              label="Semester"
              type="number"
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Academic Batch"
              value={formData.batch}
              onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
              placeholder="2025-2028"
            />
            <Input
              label="Student Strength"
              type="number"
              value={formData.strength}
              onChange={(e) => setFormData({ ...formData, strength: Number(e.target.value) })}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {editingClass ? 'Update Class' : 'Save Academic Class'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Academic Class"
        message="Are you sure you want to delete this class group? Any timetable schedules or student allocations for this class will be removed."
        itemName={classToDelete?.className ? `${classToDelete.className} (Sec ${classToDelete.section || 'A'})` : ''}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ClassesPage;
