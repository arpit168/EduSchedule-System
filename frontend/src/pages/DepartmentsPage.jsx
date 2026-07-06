import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import { Layers, Plus, Edit2, Trash2, Download, Eye, LayoutGrid, List } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import { GlassCard } from '../components/common/Card';
import Table from '../components/common/Table';
import { Modal, ConfirmDeleteModal } from '../components/common/Modal';
import Drawer from '../components/common/Drawer';
import SearchFilterBar from '../components/common/SearchFilterBar';
import { Input, Textarea } from '../components/common/FormControls';
import { Badge } from '../components/common/UIStates';

const DepartmentsPage = () => {
  const { user } = useAuthStore();
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Modal & Drawer State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [viewingDept, setViewingDept] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });

  const fetchDepts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/departments');
      setDepartments(res.data.data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDepts();
  }, [fetchDepts]);

  const handleOpenModal = (d = null) => {
    if (d) {
      setEditingDept(d);
      setFormData({
        name: d.name || '',
        code: d.code || '',
        description: d.description || '',
      });
    } else {
      setEditingDept(null);
      setFormData({
        name: '',
        code: '',
        description: '',
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      return toast.error('Please provide both department name and code');
    }
    setIsSubmitting(true);
    try {
      if (editingDept) {
        await api.put(`/departments/${editingDept._id}`, formData);
        toast.success('Department updated successfully!');
      } else {
        await api.post('/departments', formData);
        toast.success('Department created successfully!');
      }
      setModalOpen(false);
      fetchDepts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (d, e) => {
    if (e) e.stopPropagation();
    setDeptToDelete(d);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deptToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/departments/${deptToDelete._id}`);
      toast.success('Department deleted successfully');
      setDeleteModalOpen(false);
      setDeptToDelete(null);
      fetchDepts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete department');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredDepts = departments.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const exportToExcel = () => {
    if (departments.length === 0) return toast.error('No records to export');
    const data = departments.map((d) => ({
      'Department Code': d.code,
      'Department Name': d.name,
      'Description / Mandate': d.description || 'N/A',
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Departments');
    XLSX.writeFile(workbook, 'Academic_Departments_2026.xlsx');
    toast.success('Exported academic departments to Excel!');
  };

  const columns = [
    {
      key: 'name',
      label: 'Department & Code',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
            <Layers size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white">{row.name}</span>
              <Badge variant="primary" size="sm">{row.code}</Badge>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs block">
              {row.description || 'No description provided.'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'code',
      label: 'Code Identifier',
      render: (row) => <Badge variant="secondary">{row.code}</Badge>,
    },
    {
      key: 'description',
      label: 'Overview & Mandate',
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 max-w-md">
          {row.description || 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setViewingDept(row)}
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
              <Layers className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Academic Departments Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage institutional faculties, academic wings, department codes, and organizational hierarchies.
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
              Add Department
            </Button>
          )}
        </div>
      </GlassCard>

      {/* Search Bar */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setPage(1);
        }}
        searchPlaceholder="Search departments by name, code, or description..."
      />

      {/* Main Data Display */}
      {viewMode === 'table' ? (
        <Table
          columns={columns}
          data={filteredDepts}
          isLoading={isLoading}
          emptyMessage="No academic departments found matching your search criteria."
          onRowClick={(row) => setViewingDept(row)}
        />
      ) : (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredDepts.length === 0 ? (
            <div className="p-16 text-center text-slate-400 font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
              No academic departments found matching your search criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDepts.map((d) => (
                <GlassCard
                  key={d._id}
                  hover
                  onClick={() => setViewingDept(d)}
                  className="p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                          <Layers size={22} />
                        </div>
                        <div>
                          <Badge variant="primary" size="sm" className="mb-1">{d.code}</Badge>
                          <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">{d.name}</h3>
                        </div>
                      </div>

                      {user?.role === 'Admin' && (
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenModal(d)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(d, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-300 line-clamp-3">
                      {d.description || 'No detailed overview provided for this academic department.'}
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
        isOpen={Boolean(viewingDept)}
        onClose={() => setViewingDept(null)}
        title="Department Profile & Overview"
        description="Institutional hierarchy, academic mandate, and departmental code."
        footer={
          user?.role === 'Admin' && viewingDept ? (
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  const d = viewingDept;
                  setViewingDept(null);
                  handleOpenModal(d);
                }}
              >
                Edit Department
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={() => {
                  const d = viewingDept;
                  setViewingDept(null);
                  handleDeleteClick(d);
                }}
              >
                Delete Department
              </Button>
            </div>
          ) : null
        }
      >
        {viewingDept && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                <Layers size={28} />
              </div>
              <div>
                <Badge variant="primary" size="sm" className="mb-1">{viewingDept.code}</Badge>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{viewingDept.name}</h4>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Academic Wing & Faculty Institution
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Mandate & Description</h5>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {viewingDept.description || 'No detailed mandate or description has been recorded for this department.'}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Add / Edit Department Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDept ? 'Edit Department Details' : 'Add New Academic Department'}
        description="Specify institutional wing name, unique identifier code, and overview description."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Department Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Computer Science & Engineering"
            />
            <Input
              label="Department Code"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="CSE / ECE / MECH"
            />
          </div>

          <div>
            <Textarea
              label="Description / Mandate"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide an overview of the department's academic focus, laboratories, and degree programs..."
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {editingDept ? 'Update Department' : 'Save Academic Department'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Academic Department"
        message="Are you sure you want to delete this department? All associated teachers, classes, and subjects linked to this department may become unassigned."
        itemName={deptToDelete?.name ? `${deptToDelete.name} (${deptToDelete.code})` : ''}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default DepartmentsPage;
