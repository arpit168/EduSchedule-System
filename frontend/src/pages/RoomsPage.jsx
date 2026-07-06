import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import { Building2, Plus, Edit2, Trash2, Download, Eye, LayoutGrid, List, Users, Layers, Tag } from 'lucide-react';
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

const RoomsPage = () => {
  const { user } = useAuthStore();
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Modal & Drawer State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [viewingRoom, setViewingRoom] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    roomNumber: '',
    capacity: 60,
    type: 'Classroom',
    building: 'Main Block',
    floor: '1st Floor',
  });

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const typeQuery = selectedType ? `&type=${encodeURIComponent(selectedType)}` : '';
      const res = await api.get(`/rooms?search=${encodeURIComponent(searchQuery)}${typeQuery}&page=${page}&limit=12`);
      setRooms(res.data.data || []);
      setTotalPages(res.data.pages || 1);
      setTotalItems(res.data.total || (res.data.data?.length || 0));
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Failed to load rooms');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedType, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRooms();
  }, [fetchRooms]);

  const handleOpenModal = (r = null) => {
    if (r) {
      setEditingRoom(r);
      setFormData({
        roomNumber: r.roomNumber || '',
        capacity: r.capacity || 60,
        type: r.type || 'Classroom',
        building: r.building || 'Main Block',
        floor: r.floor || '1st Floor',
      });
    } else {
      setEditingRoom(null);
      setFormData({
        roomNumber: `Room ${Math.floor(100 + Math.random() * 300)}`,
        capacity: 60,
        type: 'Classroom',
        building: 'Main Block',
        floor: '1st Floor',
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.roomNumber || !formData.capacity) {
      return toast.error('Please fill in all required fields');
    }
    setIsSubmitting(true);
    try {
      if (editingRoom) {
        await api.put(`/rooms/${editingRoom._id}`, formData);
        toast.success('Room updated successfully!');
      } else {
        await api.post('/rooms', formData);
        toast.success('Room added successfully!');
      }
      setModalOpen(false);
      fetchRooms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save room');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (r, e) => {
    if (e) e.stopPropagation();
    setRoomToDelete(r);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!roomToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/rooms/${roomToDelete._id}`);
      toast.success('Room deleted successfully');
      setDeleteModalOpen(false);
      setRoomToDelete(null);
      fetchRooms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete room');
    } finally {
      setIsDeleting(false);
    }
  };

  const exportToExcel = () => {
    if (rooms.length === 0) return toast.error('No records to export');
    const data = rooms.map((r) => ({
      'Room Number': r.roomNumber,
      'Seating Capacity': r.capacity,
      'Facility Type': r.type,
      'Building Name': r.building,
      'Floor Level': r.floor,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rooms');
    XLSX.writeFile(workbook, 'Campus_Rooms_Directory_2026.xlsx');
    toast.success('Exported campus rooms directory to Excel!');
  };

  const columns = [
    {
      key: 'roomNumber',
      label: 'Room & Location',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
            <Building2 size={20} />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white block">{row.roomNumber}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 block">{row.building || 'Main Block'} ({row.floor || '1st Floor'})</span>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Facility Type',
      render: (row) => (
        <Badge variant={row.type === 'Laboratory' || row.type === 'Computer Lab' ? 'warning' : 'info'}>
          {row.type || 'Classroom'}
        </Badge>
      ),
    },
    {
      key: 'capacity',
      label: 'Seating Capacity',
      render: (row) => (
        <Badge variant="success" size="sm">
          {row.capacity || 60} Seats
        </Badge>
      ),
    },
    {
      key: 'building',
      label: 'Building Block',
      render: (row) => <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{row.building || 'Main Block'}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setViewingRoom(row)}
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
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Campus Rooms & Infrastructure
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage lecture halls, science laboratories, computer labs, seminar auditoriums, and seating capacities.
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
              Add Room
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
        searchPlaceholder="Search rooms by number, building block, or type..."
        filters={[
          {
            key: 'type',
            label: 'Facility Type',
            value: selectedType,
            onChange: (val) => {
              setSelectedType(val);
              setPage(1);
            },
            options: [
              { value: 'Classroom', label: 'Classroom' },
              { value: 'Laboratory', label: 'Laboratory' },
              { value: 'Computer Lab', label: 'Computer Lab' },
              { value: 'Seminar Hall', label: 'Seminar Hall' },
              { value: 'Auditorium', label: 'Auditorium' },
            ],
          },
        ]}
        hasActiveFilters={Boolean(selectedType)}
        onResetFilters={() => setSelectedType('')}
      />

      {/* Main Data Display */}
      {viewMode === 'table' ? (
        <>
          <Table
            columns={columns}
            data={rooms}
            isLoading={isLoading}
            emptyMessage="No campus rooms found matching your search criteria."
            onRowClick={(row) => setViewingRoom(row)}
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
          ) : rooms.length === 0 ? (
            <div className="p-16 text-center text-slate-400 font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
              No campus rooms found matching your search criteria.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((r) => (
                <GlassCard
                  key={r._id}
                  hover
                  onClick={() => setViewingRoom(r)}
                  className="p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                          <Building2 size={22} />
                        </div>
                        <div>
                          <Badge variant="primary" size="sm" className="mb-1">{r.building || 'Main Block'}</Badge>
                          <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">{r.roomNumber}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                            {r.floor || '1st Floor'}
                          </p>
                        </div>
                      </div>

                      {user?.role === 'Admin' && (
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenModal(r)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(r, e)}
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
                        <span className="flex items-center gap-1.5"><Tag size={13} /> Facility Type:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-200">{r.type || 'Classroom'}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5"><Layers size={13} /> Floor Level:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-200">{r.floor || '1st Floor'}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5"><Users size={13} /> Max Capacity:</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{r.capacity || 60} Seats</span>
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
        isOpen={Boolean(viewingRoom)}
        onClose={() => setViewingRoom(null)}
        title="Room Infrastructure Profile"
        description="Physical location, building block, and maximum seating capacity."
        footer={
          user?.role === 'Admin' && viewingRoom ? (
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  const r = viewingRoom;
                  setViewingRoom(null);
                  handleOpenModal(r);
                }}
              >
                Edit Room
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={() => {
                  const r = viewingRoom;
                  setViewingRoom(null);
                  handleDeleteClick(r);
                }}
              >
                Delete Room
              </Button>
            </div>
          ) : null
        }
      >
        {viewingRoom && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                <Building2 size={28} />
              </div>
              <div>
                <Badge variant="primary" size="sm" className="mb-1">{viewingRoom.building || 'Main Block'}</Badge>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{viewingRoom.roomNumber}</h4>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {viewingRoom.floor || '1st Floor'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Location Specifications</h5>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Facility Type</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingRoom.type || 'Classroom'}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Floor Level</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingRoom.floor || '1st Floor'}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl col-span-2">
                  <span className="text-slate-400 block mb-0.5">Building Block Name</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingRoom.building || 'Main Block'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Seating & Accommodation</h5>
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-xs block">Maximum Seating Capacity</span>
                  <span className="text-xs font-medium text-slate-400">Available student chairs/desks</span>
                </div>
                <span className="font-black text-2xl text-indigo-600 dark:text-indigo-400">{viewingRoom.capacity || 60}</span>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Add / Edit Room Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRoom ? 'Edit Room Details' : 'Add New Campus Room'}
        description="Specify room numbers, building locations, floor levels, and seating capacities."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Room Number / Name"
              required
              value={formData.roomNumber}
              onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
              placeholder="Room 101 / CS Lab 1"
            />
            <Select
              label="Facility Type"
              value={formData.type}
              onChange={(val) => setFormData({ ...formData, type: val })}
              options={[
                { value: 'Classroom', label: 'Classroom' },
                { value: 'Laboratory', label: 'Laboratory' },
                { value: 'Computer Lab', label: 'Computer Lab' },
                { value: 'Seminar Hall', label: 'Seminar Hall' },
                { value: 'Auditorium', label: 'Auditorium' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Building Block"
              value={formData.building}
              onChange={(e) => setFormData({ ...formData, building: e.target.value })}
              placeholder="Main Block / Science Wing"
            />
            <Input
              label="Floor Level"
              value={formData.floor}
              onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
              placeholder="1st Floor / Ground Floor"
            />
          </div>

          <div>
            <Input
              label="Seating Capacity"
              type="number"
              required
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {editingRoom ? 'Update Room' : 'Save Campus Room'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Campus Room"
        message="Are you sure you want to delete this room facility? Any class schedules or exam seatings assigned to this room will be unassigned."
        itemName={roomToDelete?.roomNumber ? `${roomToDelete.roomNumber} (${roomToDelete.building || 'Main Block'})` : ''}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default RoomsPage;
