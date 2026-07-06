import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import { Users, Plus, Edit2, Trash2, Download, Eye, LayoutGrid, List, Mail, Award, Briefcase, Calendar } from 'lucide-react';
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

const TeachersPage = () => {
  const { user } = useAuthStore();
  const [teachers, setTeachers] = useState([]);
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
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [viewingTeacher, setViewingTeacher] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    email: '',
    phone: '',
    department: '',
    qualification: '',
    experience: 0,
    maxDailyPeriods: 4,
    maxWeeklyPeriods: 20,
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  });

  const fetchTeachers = useCallback(async () => {
    setIsLoading(true);
    try {
      const deptQuery = selectedDept ? `&department=${selectedDept}` : '';
      const [tRes, dRes] = await Promise.all([
        api.get(`/teachers?search=${encodeURIComponent(searchQuery)}${deptQuery}&page=${page}&limit=12`),
        api.get('/departments'),
      ]);
      setTeachers(tRes.data.data || []);
      setTotalPages(tRes.data.pages || 1);
      setTotalItems(tRes.data.total || (tRes.data.data?.length || 0));
      setDepartments(dRes.data.data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Failed to load teachers');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDept, searchQuery, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTeachers();
  }, [fetchTeachers]);

  const handleOpenModal = (t = null) => {
    if (t) {
      setEditingTeacher(t);
      setFormData({
        name: t.name || '',
        employeeId: t.employeeId || '',
        email: t.email || '',
        phone: t.phone || '',
        department: t.department?._id || t.department || '',
        qualification: t.qualification || '',
        experience: t.experience || 0,
        maxDailyPeriods: t.maxDailyPeriods || 4,
        maxWeeklyPeriods: t.maxWeeklyPeriods || 20,
        workingDays: t.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      });
    } else {
      setEditingTeacher(null);
      setFormData({
        name: '',
        employeeId: `EMP${Math.floor(1000 + Math.random() * 9000)}`,
        email: '',
        phone: '',
        department: departments[0]?._id || '',
        qualification: '',
        experience: 0,
        maxDailyPeriods: 4,
        maxWeeklyPeriods: 20,
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.department) {
      return toast.error('Please fill in all required fields');
    }
    setIsSubmitting(true);
    try {
      if (editingTeacher) {
        await api.put(`/teachers/${editingTeacher._id}`, formData);
        toast.success('Teacher updated successfully!');
      } else {
        await api.post('/teachers', formData);
        toast.success('Teacher added successfully!');
      }
      setModalOpen(false);
      fetchTeachers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save teacher');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (t, e) => {
    if (e) e.stopPropagation();
    setTeacherToDelete(t);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!teacherToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/teachers/${teacherToDelete._id}`);
      toast.success('Teacher deleted successfully');
      setDeleteModalOpen(false);
      setTeacherToDelete(null);
      fetchTeachers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete teacher');
    } finally {
      setIsDeleting(false);
    }
  };

  const exportToExcel = () => {
    if (teachers.length === 0) return toast.error('No records to export');
    const data = teachers.map((t) => ({
      'Employee ID': t.employeeId,
      'Name': t.name,
      'Email': t.email,
      'Phone': t.phone || 'N/A',
      'Department': t.department?.name || 'General',
      'Qualification': t.qualification || 'N/A',
      'Experience (Yrs)': t.experience || 0,
      'Max Daily Periods': t.maxDailyPeriods,
      'Max Weekly Periods': t.maxWeeklyPeriods,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Teachers');
    XLSX.writeFile(workbook, 'Faculty_Directory_2026.xlsx');
    toast.success('Exported faculty directory to Excel!');
  };

  const columns = [
    {
      key: 'employeeId',
      label: 'ID & Faculty Member',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt={row.name}
            className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/20 shrink-0"
          />
          <div className="overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white truncate">{row.name}</span>
              <Badge variant="primary" size="sm">{row.employeeId}</Badge>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate block">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      render: (row) => (
        <Badge variant="secondary">
          {row.department?.name || 'General Dept'}
        </Badge>
      ),
    },
    {
      key: 'qualification',
      label: 'Qualification',
      render: (row) => <span className="text-xs font-semibold">{row.qualification || 'N/A'}</span>,
    },
    {
      key: 'experience',
      label: 'Experience',
      render: (row) => <span className="text-xs">{row.experience || 0} years</span>,
    },
    {
      key: 'workload',
      label: 'Weekly Workload',
      render: (row) => (
        <div className="flex flex-col gap-1 w-32">
          <div className="flex justify-between text-[11px] font-bold">
            <span className="text-slate-500 dark:text-slate-400">Capacity</span>
            <span className="text-indigo-600 dark:text-indigo-400">{row.maxWeeklyPeriods} / wk</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full w-3/4 rounded-full" />
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setViewingTeacher(row)}
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
              <Users className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Faculty & Teachers Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage teaching staff, workload capacities, qualifications, and working schedules across all campus departments.
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
              Add Teacher
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
        searchPlaceholder="Search faculty by name, employee ID, qualification..."
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
            data={teachers}
            isLoading={isLoading}
            emptyMessage="No faculty members found matching your search criteria."
            onRowClick={(row) => setViewingTeacher(row)}
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
                <div key={idx} className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : teachers.length === 0 ? (
            <div className="p-16 text-center text-slate-400 font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
              No faculty members found matching your search criteria.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teachers.map((t) => (
                <GlassCard
                  key={t._id}
                  hover
                  onClick={() => setViewingTeacher(t)}
                  className="p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img
                          src={t.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={t.name}
                          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/20 shrink-0"
                        />
                        <div className="overflow-hidden">
                          <Badge variant="primary" size="sm" className="mb-1">{t.employeeId}</Badge>
                          <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">{t.name}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                            {t.department?.name || 'General Dept'}
                          </p>
                        </div>
                      </div>

                      {user?.role === 'Admin' && (
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenModal(t)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(t, e)}
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
                        <span className="flex items-center gap-1.5"><Mail size={13} /> Email:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-200 truncate max-w-[11rem]">{t.email}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5"><Award size={13} /> Qualification:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-200">{t.qualification || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5"><Briefcase size={13} /> Experience:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-200">{t.experience || 0} years</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5"><Calendar size={13} /> Max Weekly:</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{t.maxWeeklyPeriods} periods / wk</span>
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
        isOpen={Boolean(viewingTeacher)}
        onClose={() => setViewingTeacher(null)}
        title="Faculty Member Profile"
        description="Comprehensive details and academic workload capacities."
        footer={
          user?.role === 'Admin' && viewingTeacher ? (
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  const t = viewingTeacher;
                  setViewingTeacher(null);
                  handleOpenModal(t);
                }}
              >
                Edit Details
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={() => {
                  const t = viewingTeacher;
                  setViewingTeacher(null);
                  handleDeleteClick(t);
                }}
              >
                Delete Faculty
              </Button>
            </div>
          ) : null
        }
      >
        {viewingTeacher && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              <img
                src={viewingTeacher.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={viewingTeacher.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/30"
              />
              <div>
                <Badge variant="primary" size="sm" className="mb-1">{viewingTeacher.employeeId}</Badge>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{viewingTeacher.name}</h4>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {viewingTeacher.department?.name || 'General Department'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Contact & Academic Info</h5>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Email Address</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{viewingTeacher.email}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Phone Number</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingTeacher.phone || 'N/A'}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Qualification</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingTeacher.qualification || 'N/A'}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Teaching Experience</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingTeacher.experience || 0} Years</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Workload & Schedule Limits</h5>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                  <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Max Daily Periods</span>
                  <span className="font-black text-lg text-indigo-600 dark:text-indigo-400">{viewingTeacher.maxDailyPeriods}</span>
                </div>
                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                  <span className="text-slate-500 dark:text-slate-400 block mb-0.5">Max Weekly Periods</span>
                  <span className="font-black text-lg text-indigo-600 dark:text-indigo-400">{viewingTeacher.maxWeeklyPeriods}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Working Days</h5>
              <div className="flex flex-wrap gap-2">
                {(viewingTeacher.workingDays || []).map((day) => (
                  <Badge key={day} variant="success" size="sm">{day}</Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Add / Edit Teacher Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTeacher ? 'Edit Teacher Details' : 'Add New Faculty Member'}
        description="Enter the academic credentials, workload rules, and department assignment."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Prof. Anita Verma"
            />
            <Input
              label="Employee ID"
              required
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              placeholder="EMP1005"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="anita@Learning.edu"
            />
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 9876543210"
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
              label="Qualification"
              value={formData.qualification}
              onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
              placeholder="Ph.D in CSE"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Experience (Yrs)"
              type="number"
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: Number(e.target.value) })}
            />
            <Input
              label="Max Daily Periods"
              type="number"
              value={formData.maxDailyPeriods}
              onChange={(e) => setFormData({ ...formData, maxDailyPeriods: Number(e.target.value) })}
            />
            <Input
              label="Max Weekly Periods"
              type="number"
              value={formData.maxWeeklyPeriods}
              onChange={(e) => setFormData({ ...formData, maxWeeklyPeriods: Number(e.target.value) })}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {editingTeacher ? 'Update Faculty' : 'Save Faculty Member'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Faculty Member"
        message="Are you sure you want to remove this teacher? Their schedule assignments and workload allocations will be impacted."
        itemName={teacherToDelete?.name}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default TeachersPage;
