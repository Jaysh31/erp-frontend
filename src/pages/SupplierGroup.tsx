import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import { 
  FaSearch, FaPlus, FaEdit, FaTrash, FaFilter, 
  FaTimes, FaSave, FaSpinner, FaCopy, FaEye,
   FaUsers,  FaCheckCircle,
  FaTimesCircle, 
} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';

interface SupplierGroup {
  id: string;
  groupCode: string;
  groupName: string;
  description: string;
  parentGroup: string;
  supplierCount: number;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

type SupplierGroupFormData = {
  groupCode: string;
  groupName: string;
  description: string;
  parentGroup: string;
  status: 'Active' | 'Inactive';
};

export default function SupplierGroup() {
  // const navigate = useNavigate();
  
  let theme = 'light';
  try {
    const context = useAdminTheme();
    theme = context.theme;
  } catch (error) {
    console.log('Using default light theme');
  }

  const [filterText, setFilterText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<SupplierGroup | null>(null);
  const [loading, setLoading] = useState(false);

  const [supplierGroups, setSupplierGroups] = useState<SupplierGroup[]>([
    {
      id: '1',
      groupCode: 'GRP-001',
      groupName: 'Raw Material',
      description: 'Raw material suppliers for manufacturing',
      parentGroup: '',
      supplierCount: 12,
      status: 'Active',
      createdAt: '2026-06-20T10:00:00Z',
      updatedAt: '2026-06-20T10:00:00Z'
    },
    {
      id: '2',
      groupCode: 'GRP-002',
      groupName: 'Distributor',
      description: 'Distributors and channel partners',
      parentGroup: '',
      supplierCount: 8,
      status: 'Active',
      createdAt: '2026-06-19T10:00:00Z',
      updatedAt: '2026-06-19T10:00:00Z'
    },
    {
      id: '3',
      groupCode: 'GRP-003',
      groupName: 'Electrical',
      description: 'Electrical components and equipment suppliers',
      parentGroup: 'Hardware',
      supplierCount: 5,
      status: 'Active',
      createdAt: '2026-06-18T10:00:00Z',
      updatedAt: '2026-06-18T10:00:00Z'
    },
    {
      id: '4',
      groupCode: 'GRP-004',
      groupName: 'Hardware',
      description: 'Hardware and tools suppliers',
      parentGroup: '',
      supplierCount: 7,
      status: 'Active',
      createdAt: '2026-06-17T10:00:00Z',
      updatedAt: '2026-06-17T10:00:00Z'
    },
    {
      id: '5',
      groupCode: 'GRP-005',
      groupName: 'Local',
      description: 'Local suppliers and vendors',
      parentGroup: '',
      supplierCount: 15,
      status: 'Active',
      createdAt: '2026-06-16T10:00:00Z',
      updatedAt: '2026-06-16T10:00:00Z'
    },
    {
      id: '6',
      groupCode: 'GRP-006',
      groupName: 'Pharmaceutical',
      description: 'Pharmaceutical and chemical suppliers',
      parentGroup: '',
      supplierCount: 4,
      status: 'Inactive',
      createdAt: '2026-06-15T10:00:00Z',
      updatedAt: '2026-06-15T10:00:00Z'
    },
    {
      id: '7',
      groupCode: 'GRP-007',
      groupName: 'Services',
      description: 'Service providers and consultants',
      parentGroup: '',
      supplierCount: 6,
      status: 'Active',
      createdAt: '2026-06-14T10:00:00Z',
      updatedAt: '2026-06-14T10:00:00Z'
    }
  ]);

  const [formData, setFormData] = useState<SupplierGroupFormData>({
    groupCode: '',
    groupName: '',
    description: '',
    parentGroup: '',
    status: 'Active'
  });

  const parentGroups = ['Raw Material', 'Distributor', 'Electrical', 'Hardware', 'Local', 'Pharmaceutical', 'Services'];
  const statusOptions = ['Active', 'Inactive'];

  const filteredGroups = supplierGroups.filter(g => {
    const matchesSearch = g.groupCode.toLowerCase().includes(filterText.toLowerCase()) ||
                         g.groupName.toLowerCase().includes(filterText.toLowerCase()) ||
                         g.description.toLowerCase().includes(filterText.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || g.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    return status === 'Active' ? 'status-active' : 'status-inactive';
  };

  const getStatusIcon = (status: string) => {
    return status === 'Active' ? <FaCheckCircle size={10} /> : <FaTimesCircle size={10} />;
  };

  const handleCreate = () => {
    setFormData({
      groupCode: `GRP-${String(supplierGroups.length + 1).padStart(3, '0')}`,
      groupName: '',
      description: '',
      parentGroup: '',
      status: 'Active'
    });
    setShowCreateModal(true);
  };

  const handleEdit = (group: SupplierGroup) => {
    setSelectedGroup(group);
    setFormData({
      groupCode: group.groupCode,
      groupName: group.groupName,
      description: group.description || '',
      parentGroup: group.parentGroup || '',
      status: group.status
    });
    setShowEditModal(true);
  };

  const handleView = (group: SupplierGroup) => {
    setSelectedGroup(group);
    setShowViewModal(true);
  };

  const handleDelete = (group: SupplierGroup) => {
    setSelectedGroup(group);
    setShowDeleteModal(true);
  };

  const handleSubmit = () => {
    setLoading(true);
    
    if (!formData.groupName.trim()) {
      toast.error('Group name is required');
      setLoading(false);
      return;
    }
    
    setTimeout(() => {
      if (showEditModal && selectedGroup) {
        setSupplierGroups(prev => 
          prev.map(g => g.id === selectedGroup.id 
            ? { ...g, ...formData, updatedAt: new Date().toISOString() }
            : g
          )
        );
        toast.success('Supplier Group updated successfully!');
      } else {
        const newGroup: SupplierGroup = {
          id: String(supplierGroups.length + 1),
          groupCode: formData.groupCode,
          groupName: formData.groupName,
          description: formData.description,
          parentGroup: formData.parentGroup,
          supplierCount: 0,
          status: formData.status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setSupplierGroups(prev => [...prev, newGroup]);
        toast.success('Supplier Group created successfully!');
      }
      setShowCreateModal(false);
      setShowEditModal(false);
      setLoading(false);
    }, 1000);
  };

  const handleDeleteConfirm = () => {
    if (!selectedGroup) return;
    setLoading(true);
    
    setTimeout(() => {
      setSupplierGroups(prev => prev.filter(g => g.id !== selectedGroup.id));
      setShowDeleteModal(false);
      setLoading(false);
      toast.success('Supplier Group deleted successfully!');
    }, 1000);
  };

  const handleDuplicate = (group: SupplierGroup) => {
    const newGroup: SupplierGroup = {
      ...group,
      id: String(supplierGroups.length + 1),
      groupCode: `GRP-${String(supplierGroups.length + 1).padStart(3, '0')}`,
      groupName: `${group.groupName} (Copy)`,
      supplierCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setSupplierGroups(prev => [...prev, newGroup]);
    toast.success('Supplier Group duplicated successfully!');
  };

  const totalGroups = supplierGroups.length;
  const activeGroups = supplierGroups.filter(g => g.status === 'Active').length;
  const totalSuppliers = supplierGroups.reduce((sum, g) => sum + g.supplierCount, 0);

  return (
    <div className={`supplier-group-page ${theme}-theme`}>
      <style>{`
        /* ── Page Container ─────────────────────────────────────── */
        .supplier-group-page {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--layout-bg, #f5f7fb);
          padding: 16px 24px;
          gap: 12px;
          overflow-y: auto;
          font-family: -apple-system, "Inter", "Segoe UI", Roboto, sans-serif;
          color: var(--text-primary, #1f2433);
        }

        .supplier-group-page::-webkit-scrollbar { width: 4px; }
        .supplier-group-page::-webkit-scrollbar-track { background: transparent; }
        .supplier-group-page::-webkit-scrollbar-thumb { background: var(--border-color, #e5e7eb); border-radius: 2px; }

        /* ── Header ──────────────────────────────────────────────── */
        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          flex-shrink: 0;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .page-title {
          font-size: 20px;
          font-weight: 600;
          color: var(--text-primary, #1f2433);
          margin: 0;
        }

        .badge {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-secondary, #6b7280);
          background: var(--card-bg, #ffffff);
          padding: 1px 10px;
          border-radius: 12px;
          border: 1px solid var(--border-color, #e5e7eb);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 16px;
          background: var(--primary-color, #6366f1);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-primary:hover {
          background: var(--primary-hover, #4f46e5);
          transform: translateY(-1px);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 14px;
          background: var(--card-bg, #ffffff);
          color: var(--text-primary, #1f2433);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-secondary:hover {
          background: var(--layout-bg, #f3f4f6);
        }

        .btn-danger {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 14px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-danger:hover {
          background: #dc2626;
        }

        /* ── Compact Stats ────────────────────────────────────────── */
        .compact-stats {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 10px 16px;
          background: var(--card-bg, #ffffff);
          border-radius: 8px;
          border: 1px solid var(--border-color, #e5e7eb);
          flex-shrink: 0;
        }

        .stat-item {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .stat-label {
          font-size: 11px;
          color: var(--text-secondary, #6b7280);
          font-weight: 500;
        }

        .stat-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #1f2433);
        }

        .stat-active {
          color: #10b981;
        }

        .stat-inactive {
          color: #6b7280;
        }

        .stat-divider {
          width: 1px;
          height: 20px;
          background: var(--border-color, #e5e7eb);
        }

        /* ── Search Bar ───────────────────────────────────────────── */
        .search-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .search-wrapper {
          display: flex;
          align-items: center;
          flex: 1;
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          padding: 0 12px;
          transition: all 0.15s ease;
          height: 34px;
        }

        .search-wrapper:focus-within {
          border-color: var(--primary-color, #6366f1);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
        }

        .search-icon {
          color: var(--text-secondary, #9ca3af);
          font-size: 13px;
          flex-shrink: 0;
        }

        .search-input {
          border: none;
          background: transparent;
          padding: 6px 10px;
          font-size: 13px;
          color: var(--text-primary, #374151);
          outline: none;
          flex: 1;
          min-width: 120px;
        }

        .search-input::placeholder {
          color: var(--text-secondary, #9ca3af);
        }

        .clear-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border: none;
          border-radius: 50%;
          background: var(--border-color, #e5e7eb);
          color: var(--text-secondary, #6b7280);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .clear-btn:hover {
          background: var(--text-secondary, #6b7280);
          color: white;
        }

        .filter-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-toggle {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 6px;
          background: var(--card-bg, #ffffff);
          color: var(--text-secondary, #6b7280);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
          height: 34px;
        }

        .filter-toggle:hover {
          background: var(--nav-hover, #f3f4f6);
        }

        .filter-toggle.active {
          border-color: var(--primary-color, #6366f1);
          color: var(--primary-color, #6366f1);
          background: color-mix(in srgb, var(--primary-color) 8%, transparent);
        }

        .result-count {
          font-size: 12px;
          color: var(--text-secondary, #6b7280);
        }

        /* ── Supplier Group Table ──────────────────────────────────── */
        .group-container {
          flex: 1;
          min-height: 0;
          background: var(--card-bg, #ffffff);
          border-radius: 8px;
          border: 1px solid var(--border-color, #e5e7eb);
          overflow: hidden;
        }

        .table-wrapper {
          overflow-x: auto;
          height: 100%;
        }

        .group-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 800px;
        }

        .group-table thead {
          background: var(--layout-bg, #f8f9fa);
          border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .group-table th {
          padding: 10px 14px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary, #6b7280);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .group-table td {
          padding: 10px 14px;
          border-bottom: 1px solid var(--border-color, #f3f4f6);
          color: var(--text-primary, #374151);
        }

        .group-row {
          transition: background 0.15s ease;
        }

        .group-row:hover {
          background: var(--nav-hover, #f9fafb);
        }

        .code-cell {
          font-weight: 600;
          color: var(--primary-color, #6366f1);
          font-size: 12px;
        }

        .name-cell {
          font-weight: 500;
          color: var(--text-primary, #1f2433);
        }

        .desc-cell {
          color: var(--text-secondary, #6b7280);
          font-size: 12px;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .parent-cell {
          color: var(--text-secondary, #6b7280);
          font-size: 12px;
        }

        .count-cell {
          font-weight: 600;
          color: var(--primary-color, #6366f1);
          text-align: center;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 10px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 500;
        }

        .status-active {
          background: #d1fae5;
          color: #065f46;
        }

        .status-inactive {
          background: #f3f4f6;
          color: #6b7280;
        }

        .action-group {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
          background: transparent;
          color: var(--text-secondary, #6b7280);
        }

        .action-btn:hover {
          background: var(--nav-hover, #f3f4f6);
        }

        .action-btn.view:hover { color: var(--primary-color, #6366f1); }
        .action-btn.edit:hover { color: #f59e0b; }
        .action-btn.copy:hover { color: #8b5cf6; }
        .action-btn.delete:hover { color: #ef4444; background: #fef2f2; }

        /* ── Empty State ───────────────────────────────────────────── */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 20px;
          text-align: center;
        }

        .empty-icon {
          color: var(--text-secondary, #9ca3af);
          margin-bottom: 12px;
        }

        .empty-state h3 {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary, #1f2433);
          margin: 0 0 4px 0;
        }

        .empty-state p {
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
          margin: 0 0 16px 0;
        }

        /* ── Footer ────────────────────────────────────────────────── */
        .list-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 4px 0 4px;
          font-size: 12px;
          color: var(--text-secondary, #6b7280);
          flex-shrink: 0;
        }

        .conversion-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 10px;
          background: color-mix(in srgb, var(--primary-color) 10%, transparent);
          color: var(--primary-color, #6366f1);
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }

        /* ── MODALS ────────────────────────────────────────────────── */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-container {
          background: var(--card-bg, #ffffff);
          border-radius: 12px;
          max-width: 550px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        }

        .view-modal { max-width: 600px; }
        .delete-modal { max-width: 420px; }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color, #e5e7eb);
          flex-shrink: 0;
        }

        .modal-header h2 {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary, #1f2433);
          margin: 0;
        }

        .modal-close {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: var(--text-secondary, #6b7280);
          cursor: pointer;
          font-size: 20px;
          transition: all 0.15s ease;
        }

        .modal-close:hover {
          background: var(--nav-hover, #f3f4f6);
        }

        .modal-body {
          padding: 20px;
          overflow-y: auto;
          flex: 1;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 12px 20px;
          border-top: 1px solid var(--border-color, #e5e7eb);
          flex-shrink: 0;
        }

        /* ── View Modal ────────────────────────────────────────────── */
        .view-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .view-section {
          padding: 12px;
          background: var(--layout-bg, #f8f9fa);
          border-radius: 8px;
        }

        .view-section.full-width {
          grid-column: 1 / -1;
        }

        .view-section h4 {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary, #6b7280);
          margin: 0 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .view-row {
          display: flex;
          padding: 3px 0;
          font-size: 13px;
        }

        .view-row label {
          font-weight: 500;
          color: var(--text-secondary, #6b7280);
          min-width: 100px;
        }

        .view-row span {
          color: var(--text-primary, #1f2433);
        }

        /* ── Edit/Create Modal ─────────────────────────────────────── */
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary, #6b7280);
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 8px 12px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 6px;
          font-size: 13px;
          color: var(--text-primary, #374151);
          transition: all 0.2s ease;
          background: var(--input-bg, #ffffff);
          font-family: inherit;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--primary-color, #6366f1);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 60px;
        }

        /* ── Delete Modal ──────────────────────────────────────────── */
        .delete-body {
          text-align: center;
          padding: 32px 20px;
        }

        .delete-icon {
          color: #ef4444;
          margin-bottom: 16px;
        }

        .delete-body h3 {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary, #1f2433);
          margin: 0 0 8px 0;
        }

        .delete-body p {
          font-size: 14px;
          color: var(--text-secondary, #6b7280);
          margin: 4px 0;
        }

        .delete-warning {
          color: #ef4444 !important;
          font-weight: 500;
          margin-top: 12px !important;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ── Responsive ───────────────────────────────────────────── */
        @media (max-width: 768px) {
          .supplier-group-page { padding: 12px 16px; }
          .page-header { flex-direction: column; align-items: stretch; }
          .header-actions { flex-wrap: wrap; justify-content: flex-end; }
          .search-bar { flex-direction: column; align-items: stretch; }
          .filter-wrapper { justify-content: space-between; }
          .group-table { min-width: 600px; }
          .modal-container { max-width: 100%; margin: 10px; }
          .modal-footer { flex-direction: column; }
          .modal-footer button { width: 100%; justify-content: center; }
          .view-grid { grid-template-columns: 1fr; }
          .compact-stats { flex-wrap: wrap; gap: 8px; padding: 8px 12px; }
          .stat-divider { display: none; }
          .form-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 480px) {
          .supplier-group-page { padding: 8px 12px; }
          .group-table { font-size: 12px; min-width: 500px; }
          .group-table th, .group-table td { padding: 6px 10px; }
          .action-group { gap: 0; }
          .action-btn { width: 24px; height: 24px; }
          .desc-cell { max-width: 120px; }
        }

        /* ─── Dark Theme ─────────────────────────────────────────── */
        .dark-theme .supplier-group-page { background: var(--layout-bg, #0f172a); }
        .dark-theme .page-title { color: var(--text-primary, #f8fafc); }
        .dark-theme .badge { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); color: var(--text-secondary, #94a3b8); }
        .dark-theme .search-wrapper { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); }
        .dark-theme .search-input { color: var(--text-primary, #f8fafc); }
        .dark-theme .search-input::placeholder { color: var(--text-secondary, #64748b); }
        .dark-theme .filter-toggle { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); color: var(--text-secondary, #94a3b8); }
        .dark-theme .filter-toggle:hover { background: var(--nav-hover, rgba(255,255,255,0.05)); }
        .dark-theme .group-container { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); }
        .dark-theme .group-table thead { background: var(--layout-bg, #0f172a); }
        .dark-theme .group-table th { color: var(--text-secondary, #94a3b8); border-bottom-color: var(--border-color, #334155); }
        .dark-theme .group-table td { border-bottom-color: var(--border-color, #334155); color: var(--text-primary, #f8fafc); }
        .dark-theme .group-row:hover { background: var(--nav-hover, rgba(255,255,255,0.05)); }
        .dark-theme .code-cell { color: var(--primary-color, #818cf8); }
        .dark-theme .name-cell { color: var(--text-primary, #f8fafc); }
        .dark-theme .desc-cell { color: var(--text-secondary, #94a3b8); }
        .dark-theme .parent-cell { color: var(--text-secondary, #94a3b8); }
        .dark-theme .count-cell { color: var(--primary-color, #818cf8); }
        .dark-theme .action-btn { color: var(--text-secondary, #64748b); }
        .dark-theme .action-btn:hover { background: var(--nav-hover, rgba(255,255,255,0.05)); }
        .dark-theme .modal-container { background: var(--card-bg, #1e293b); }
        .dark-theme .modal-header { border-bottom-color: var(--border-color, #334155); }
        .dark-theme .modal-header h2 { color: var(--text-primary, #f8fafc); }
        .dark-theme .modal-close { color: var(--text-secondary, #94a3b8); }
        .dark-theme .modal-close:hover { background: var(--nav-hover, rgba(255,255,255,0.05)); }
        .dark-theme .modal-footer { border-top-color: var(--border-color, #334155); }
        .dark-theme .view-section { background: var(--layout-bg, #0f172a); }
        .dark-theme .view-row span { color: var(--text-primary, #f8fafc); }
        .dark-theme .btn-secondary { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); color: var(--text-primary, #f8fafc); }
        .dark-theme .btn-secondary:hover { background: var(--layout-bg, #0f172a); }
        .dark-theme .btn-primary { background: var(--primary-color, #3b82f6); }
        .dark-theme .btn-primary:hover { background: var(--primary-hover, #2563eb); }
        .dark-theme .status-active { background: rgba(16,185,129,0.2); color: #34d399; }
        .dark-theme .status-inactive { background: rgba(107,114,128,0.2); color: #9ca3af; }
        .dark-theme .compact-stats { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); }
        .dark-theme .stat-value { color: var(--text-primary, #f8fafc); }
        .dark-theme .stat-divider { background: var(--border-color, #334155); }
        .dark-theme .empty-state h3 { color: var(--text-primary, #f8fafc); }
        .dark-theme .empty-state p { color: var(--text-secondary, #94a3b8); }
        .dark-theme .conversion-badge { background: rgba(99,102,241,0.15); color: var(--primary-color, #818cf8); }
        .dark-theme .result-count { color: var(--text-secondary, #94a3b8); }
        .dark-theme .list-footer { color: var(--text-secondary, #94a3b8); }
        .dark-theme .delete-body h3 { color: var(--text-primary, #f8fafc); }
        .dark-theme .delete-body p { color: var(--text-secondary, #94a3b8); }
        .dark-theme .form-group label { color: var(--text-primary, #e2e8f0); }
        .dark-theme .form-group input, .dark-theme .form-group select, .dark-theme .form-group textarea { background: var(--input-bg, #0f172a); border-color: var(--border-color, #334155); color: var(--text-primary, #f8fafc); }
        .dark-theme .form-group input:focus, .dark-theme .form-group select:focus, .dark-theme .form-group textarea:focus { border-color: var(--primary-color, #818cf8); }
      `}</style>

      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Supplier Groups</h1>
          <span className="badge">{supplierGroups.length}</span>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={handleCreate}>
            <FaPlus size={12} /> Add Group
          </button>
        </div>
      </div>

      {/* Compact Stats */}
      <div className="compact-stats">
        <div className="stat-item">
          <span className="stat-label">Total</span>
          <span className="stat-value">{totalGroups}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-label">Active</span>
          <span className="stat-value stat-active">{activeGroups}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-label">Suppliers</span>
          <span className="stat-value">{totalSuppliers}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-label">Inactive</span>
          <span className="stat-value stat-inactive">{totalGroups - activeGroups}</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="search-bar">
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by code, name or description..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="search-input"
          />
          {filterText && (
            <button className="clear-btn" onClick={() => setFilterText('')}>×</button>
          )}
        </div>
        <div className="filter-wrapper">
          <select 
            className="filter-toggle"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ width: '120px' }}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <button 
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter size={12} /> Filter
          </button>
          <span className="result-count">{filteredGroups.length} of {supplierGroups.length}</span>
        </div>
      </div>

      {/* Supplier Groups List */}
      <div className="group-container">
        {filteredGroups.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FaUsers size={48} />
            </div>
            <h3>No supplier groups found</h3>
            <p>Create your first supplier group to get started</p>
            <button className="btn-primary" onClick={handleCreate}>
              <FaPlus size={12} /> Add Group
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="group-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Group Name</th>
                  <th>Description</th>
                  <th>Parent Group</th>
                  <th>Suppliers</th>
                  <th>Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGroups.map((group) => (
                  <tr key={group.id} className="group-row">
                    <td className="code-cell">{group.groupCode}</td>
                    <td className="name-cell">{group.groupName}</td>
                    <td className="desc-cell" title={group.description}>{group.description || '-'}</td>
                    <td className="parent-cell">{group.parentGroup || '-'}</td>
                    <td className="count-cell">{group.supplierCount}</td>
                    <td>
                      <span className={`status-badge ${getStatusColor(group.status)}`}>
                        {getStatusIcon(group.status)}
                        {group.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-group">
                        <button 
                          className="action-btn view" 
                          title="View"
                          onClick={() => handleView(group)}
                        >
                          <FaEye size={12} />
                        </button>
                        <button 
                          className="action-btn edit" 
                          title="Edit"
                          onClick={() => handleEdit(group)}
                        >
                          <FaEdit size={12} />
                        </button>
                        <button 
                          className="action-btn copy" 
                          title="Duplicate"
                          onClick={() => handleDuplicate(group)}
                        >
                          <FaCopy size={12} />
                        </button>
                        <button 
                          className="action-btn delete" 
                          title="Delete"
                          onClick={() => handleDelete(group)}
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="list-footer">
        <span>{filteredGroups.length} of {supplierGroups.length} groups</span>
        <div className="footer-actions">
          <span className="conversion-badge">
            <FaUsers size={11} /> {activeGroups} active
          </span>
        </div>
      </div>

      {/* ====== VIEW MODAL ====== */}
      {showViewModal && selectedGroup && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-container view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedGroup.groupCode} - {selectedGroup.groupName}</h2>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="view-grid">
                <div className="view-section">
                  <h4>Basic Information</h4>
                  <div className="view-row"><label>Code:</label><span>{selectedGroup.groupCode}</span></div>
                  <div className="view-row"><label>Name:</label><span>{selectedGroup.groupName}</span></div>
                  <div className="view-row"><label>Status:</label><span className={`status-badge ${getStatusColor(selectedGroup.status)}`}>{selectedGroup.status}</span></div>
                </div>
                <div className="view-section">
                  <h4>Statistics</h4>
                  <div className="view-row"><label>Suppliers:</label><span>{selectedGroup.supplierCount}</span></div>
                  <div className="view-row"><label>Parent Group:</label><span>{selectedGroup.parentGroup || 'None'}</span></div>
                </div>
                <div className="view-section full-width">
                  <h4>Description</h4>
                  <div className="view-row"><span>{selectedGroup.description || 'No description available'}</span></div>
                </div>
                <div className="view-section full-width">
                  <h4>Audit Information</h4>
                  <div className="view-row"><label>Created:</label><span>{new Date(selectedGroup.createdAt).toLocaleString()}</span></div>
                  <div className="view-row"><label>Updated:</label><span>{new Date(selectedGroup.updatedAt).toLocaleString()}</span></div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
              <button className="btn-primary" onClick={() => handleEdit(selectedGroup)}>
                <FaEdit size={12} /> Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== CREATE/EDIT MODAL ====== */}
      {(showCreateModal || showEditModal) && (
        <div className="modal-overlay" onClick={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
        }}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{showEditModal ? 'Edit Supplier Group' : 'Add Supplier Group'}</h2>
              <button className="modal-close" onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
              }}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Group Code</label>
                  <input
                    type="text"
                    value={formData.groupCode}
                    disabled
                    style={{ background: 'var(--layout-bg, #f3f4f6)', cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group">
                  <label>Group Name *</label>
                  <input
                    type="text"
                    value={formData.groupName}
                    onChange={(e) => setFormData(prev => ({ ...prev, groupName: e.target.value }))}
                    placeholder="Enter group name"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter description (optional)"
                    rows={2}
                  />
                </div>
                <div className="form-group">
                  <label>Parent Group</label>
                  <select
                    value={formData.parentGroup}
                    onChange={(e) => setFormData(prev => ({ ...prev, parentGroup: e.target.value }))}
                  >
                    <option value="">None</option>
                    {parentGroups.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  >
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
              }}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading && <FaSpinner className="spinning" />}
                <FaSave size={12} /> {showEditModal ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== DELETE MODAL ====== */}
      {showDeleteModal && selectedGroup && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-container delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Supplier Group</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body delete-body">
              <div className="delete-icon">
                <FaTrash size={48} />
              </div>
              <h3>Are you sure?</h3>
              <p>
                You are about to delete <strong>{selectedGroup.groupName}</strong>
              </p>
              <p className="delete-warning">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn-danger" onClick={handleDeleteConfirm} disabled={loading}>
                {loading && <FaSpinner className="spinning" />}
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}