import  { useState } from 'react';
import { 
  FaSearch, FaPlus, FaEdit, FaTrash, FaFilter, 
  FaTimes, FaSave, FaSpinner, FaCopy, FaEye,
  FaBox, FaCheckCircle,
  FaTimesCircle, FaClock, FaExclamationTriangle,

} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';

interface MaterialRequestItem {
  id: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  uom: string;
  rate: number;
  amount: number;
}

interface MaterialRequest {
  id: string;
  requestNumber: string;
  title: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Partially Approved' | 'Completed';
  purpose: 'Purchase' | 'Transfer' | 'Issue' | 'Return';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  transactionDate: string;
  requiredBy: string;
  requestedBy: string;
  department: string;
  warehouse: string;
  totalQuantity: number;
  totalAmount: number;
  items: MaterialRequestItem[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

type MaterialRequestFormData = Omit<MaterialRequest, 'id' | 'totalQuantity' | 'totalAmount' | 'createdAt' | 'updatedAt'>;

export default function MaterialRequest() {

  
  let theme = 'light';
  try {
    const context = useAdminTheme();
    theme = context.theme;
  } catch (error) {
    console.log('Using default light theme');
  }

  const [filterText, setFilterText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedPurpose, setSelectedPurpose] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);
  const [loading, setLoading] = useState(false);

  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([
    {
      id: '1',
      requestNumber: 'MAT-MR-2026-00001',
      title: 'Purchase Request for Screws',
      status: 'Pending',
      purpose: 'Purchase',
      priority: 'Medium',
      transactionDate: '2026-06-25',
      requiredBy: '2026-06-25',
      requestedBy: 'Tejas Tarte',
      department: 'Production',
      warehouse: 'Main Warehouse',
      totalQuantity: 1000,
      totalAmount: 25000,
      notes: 'Urgent requirement for production line',
      items: [
        { id: '1', itemCode: 'SCR-001', itemName: 'Machine Screws M4x20', quantity: 500, uom: 'NOS', rate: 15, amount: 7500 },
        { id: '2', itemCode: 'SCR-002', itemName: 'Machine Screws M6x30', quantity: 500, uom: 'NOS', rate: 35, amount: 17500 }
      ],
      createdAt: '2026-06-25T10:00:00Z',
      updatedAt: '2026-06-25T10:00:00Z'
    },
    {
      id: '2',
      requestNumber: 'MAT-MR-2026-00002',
      title: 'Raw Material for Production',
      status: 'Approved',
      purpose: 'Purchase',
      priority: 'High',
      transactionDate: '2026-06-24',
      requiredBy: '2026-06-28',
      requestedBy: 'Nirjala Bagal',
      department: 'Manufacturing',
      warehouse: 'Raw Material Store',
      totalQuantity: 500,
      totalAmount: 45000,
      notes: 'Approved for immediate purchase',
      items: [
        { id: '1', itemCode: 'RM-001', itemName: 'Steel Sheets 2mm', quantity: 250, uom: 'NOS', rate: 120, amount: 30000 },
        { id: '2', itemCode: 'RM-002', itemName: 'Aluminum Bars', quantity: 250, uom: 'KG', rate: 60, amount: 15000 }
      ],
      createdAt: '2026-06-24T10:00:00Z',
      updatedAt: '2026-06-24T10:00:00Z'
    },
    {
      id: '3',
      requestNumber: 'MAT-MR-2026-00003',
      title: 'Packaging Material Request',
      status: 'Partially Approved',
      purpose: 'Purchase',
      priority: 'Medium',
      transactionDate: '2026-06-23',
      requiredBy: '2026-06-30',
      requestedBy: 'P S Kamthe',
      department: 'Warehouse',
      warehouse: 'Packaging Store',
      totalQuantity: 300,
      totalAmount: 12000,
      notes: 'Partially approved due to budget constraints',
      items: [
        { id: '1', itemCode: 'PKG-001', itemName: 'Carton Boxes Large', quantity: 200, uom: 'NOS', rate: 30, amount: 6000 },
        { id: '2', itemCode: 'PKG-002', itemName: 'Packing Tape', quantity: 100, uom: 'ROL', rate: 60, amount: 6000 }
      ],
      createdAt: '2026-06-23T10:00:00Z',
      updatedAt: '2026-06-23T10:00:00Z'
    }
  ]);

  const [formData, setFormData] = useState<MaterialRequestFormData>({
    requestNumber: '',
    title: '',
    status: 'Pending',
    purpose: 'Purchase',
    priority: 'Medium',
    transactionDate: '',
    requiredBy: '',
    requestedBy: '',
    department: '',
    warehouse: '',
    notes: '',
    items: [{ id: '1', itemCode: '', itemName: '', quantity: 1, uom: 'NOS', rate: 0, amount: 0 }]
  });

  const statusOptions = ['Pending', 'Approved', 'Rejected', 'Partially Approved', 'Completed'];
  const purposeOptions = ['Purchase', 'Transfer', 'Issue', 'Return'];
  const priorityOptions = ['Low', 'Medium', 'High', 'Urgent'];
  const departments = ['Production', 'Manufacturing', 'Warehouse', 'Quality', 'Maintenance', 'R&D'];
  const warehouses = ['Main Warehouse', 'Raw Material Store', 'Packaging Store', 'Finished Goods Store', 'Consumables Store'];
  const uomOptions = ['NOS', 'KG', 'LTR', 'MTR', 'BOX', 'SET', 'DOZ', 'ROL', 'SQM', 'CBM'];

  const filteredRequests = materialRequests.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(filterText.toLowerCase()) ||
                         r.requestNumber.toLowerCase().includes(filterText.toLowerCase()) ||
                         r.requestedBy.toLowerCase().includes(filterText.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || r.status === selectedStatus;
    const matchesPurpose = selectedPurpose === 'All' || r.purpose === selectedPurpose;
    return matchesSearch && matchesStatus && matchesPurpose;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'status-pending';
      case 'Approved': return 'status-approved';
      case 'Rejected': return 'status-rejected';
      case 'Partially Approved': return 'status-partial';
      case 'Completed': return 'status-completed';
      default: return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <FaClock size={10} />;
      case 'Approved': return <FaCheckCircle size={10} />;
      case 'Rejected': return <FaTimesCircle size={10} />;
      case 'Partially Approved': return <FaExclamationTriangle size={10} />;
      case 'Completed': return <FaCheckCircle size={10} />;
      default: return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low': return 'priority-low';
      case 'Medium': return 'priority-medium';
      case 'High': return 'priority-high';
      case 'Urgent': return 'priority-urgent';
      default: return '';
    }
  };

  const handleCreate = () => {
    setFormData({
      requestNumber: `MAT-MR-2026-${String(materialRequests.length + 1).padStart(5, '0')}`,
      title: '',
      status: 'Pending',
      purpose: 'Purchase',
      priority: 'Medium',
      transactionDate: new Date().toISOString().split('T')[0],
      requiredBy: '',
      requestedBy: '',
      department: '',
      warehouse: '',
      notes: '',
      items: [{ id: '1', itemCode: '', itemName: '', quantity: 1, uom: 'NOS', rate: 0, amount: 0 }]
    });
    setShowCreateModal(true);
  };

  const handleEdit = (request: MaterialRequest) => {
    setSelectedRequest(request);
    setFormData({
      requestNumber: request.requestNumber,
      title: request.title,
      status: request.status,
      purpose: request.purpose,
      priority: request.priority,
      transactionDate: request.transactionDate,
      requiredBy: request.requiredBy,
      requestedBy: request.requestedBy,
      department: request.department,
      warehouse: request.warehouse,
      notes: request.notes || '',
      items: request.items.map(item => ({ ...item }))
    });
    setShowEditModal(true);
  };

  const handleView = (request: MaterialRequest) => {
    setSelectedRequest(request);
    setShowViewModal(true);
  };

  const handleDelete = (request: MaterialRequest) => {
    setSelectedRequest(request);
    setShowDeleteModal(true);
  };

  const handleItemChange = (index: number, field: keyof MaterialRequestItem, value: string | number) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'rate') {
      const quantity = field === 'quantity' ? Number(value) : updatedItems[index].quantity;
      const rate = field === 'rate' ? Number(value) : updatedItems[index].rate;
      updatedItems[index].amount = quantity * rate;
    }
    
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const addItemRow = () => {
    const newId = String(formData.items.length + 1);
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: newId, itemCode: '', itemName: '', quantity: 1, uom: 'NOS', rate: 0, amount: 0 }]
    }));
  };

  const removeItemRow = (index: number) => {
    if (formData.items.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    setLoading(true);
    
    if (!formData.title.trim()) {
      toast.error('Title is required');
      setLoading(false);
      return;
    }
    if (!formData.requestedBy.trim()) {
      toast.error('Requested By is required');
      setLoading(false);
      return;
    }
    
    const totalQuantity = formData.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = formData.items.reduce((sum, item) => sum + item.amount, 0);
    
    setTimeout(() => {
      if (showEditModal && selectedRequest) {
        setMaterialRequests(prev => 
          prev.map(r => r.id === selectedRequest.id 
            ? { 
                ...r, 
                ...formData,
                totalQuantity,
                totalAmount,
                updatedAt: new Date().toISOString() 
              }
            : r
          )
        );
        toast.success('Material Request updated successfully!');
      } else {
        const newRequest: MaterialRequest = {
          id: String(materialRequests.length + 1),
          requestNumber: formData.requestNumber,
          title: formData.title,
          status: formData.status,
          purpose: formData.purpose,
          priority: formData.priority,
          transactionDate: formData.transactionDate,
          requiredBy: formData.requiredBy,
          requestedBy: formData.requestedBy,
          department: formData.department,
          warehouse: formData.warehouse,
          totalQuantity,
          totalAmount,
          items: formData.items,
          notes: formData.notes || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setMaterialRequests(prev => [...prev, newRequest]);
        toast.success('Material Request created successfully!');
      }
      setShowCreateModal(false);
      setShowEditModal(false);
      setLoading(false);
    }, 1000);
  };

  const handleDeleteConfirm = () => {
    if (!selectedRequest) return;
    setLoading(true);
    
    setTimeout(() => {
      setMaterialRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
      setShowDeleteModal(false);
      setLoading(false);
      toast.success('Material Request deleted successfully!');
    }, 1000);
  };

  const handleDuplicate = (request: MaterialRequest) => {
    const newRequest: MaterialRequest = {
      ...request,
      id: String(materialRequests.length + 1),
      requestNumber: `MAT-MR-2026-${String(materialRequests.length + 1).padStart(5, '0')}`,
      title: `${request.title} (Copy)`,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setMaterialRequests(prev => [...prev, newRequest]);
    toast.success('Material Request duplicated successfully!');
  };

  const totalRequests = materialRequests.length;
  const pendingRequests = materialRequests.filter(r => r.status === 'Pending').length;
  const totalQuantity = materialRequests.reduce((sum, r) => sum + r.totalQuantity, 0);
  const totalAmount = materialRequests.reduce((sum, r) => sum + r.totalAmount, 0);

  return (
    <div className={`material-request-page ${theme}-theme`}>
      <style>{`
        /* ── Page Container ─────────────────────────────────────── */
        .material-request-page {
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

        .material-request-page::-webkit-scrollbar { width: 4px; }
        .material-request-page::-webkit-scrollbar-track { background: transparent; }
        .material-request-page::-webkit-scrollbar-thumb { background: var(--border-color, #e5e7eb); border-radius: 2px; }

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

        .stat-pending {
          color: #f59e0b;
        }

        .stat-approved {
          color: #10b981;
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

        /* ── Expandable Filters ───────────────────────────────────── */
        .expandable-filters {
          display: flex;
          align-items: flex-end;
          gap: 16px;
          padding: 12px 16px;
          background: var(--card-bg, #ffffff);
          border-radius: 8px;
          border: 1px solid var(--border-color, #e5e7eb);
          animation: slideDown 0.2s ease;
          flex-wrap: wrap;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .filter-group label {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-secondary, #6b7280);
        }

        .filter-group select {
          padding: 4px 10px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 6px;
          font-size: 12px;
          background: var(--input-bg, #ffffff);
          color: var(--text-primary, #374151);
          outline: none;
          height: 30px;
        }

        .filter-group select:focus {
          border-color: var(--primary-color, #6366f1);
        }

        .apply-filters {
          padding: 4px 16px;
          background: var(--primary-color, #6366f1);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          height: 30px;
          transition: all 0.15s ease;
        }

        .apply-filters:hover {
          background: var(--primary-hover, #4f46e5);
        }

        /* ── Material Request Table ───────────────────────────────── */
        .request-container {
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

        .request-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 900px;
        }

        .request-table thead {
          background: var(--layout-bg, #f8f9fa);
          border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .request-table th {
          padding: 10px 14px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary, #6b7280);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .request-table td {
          padding: 10px 14px;
          border-bottom: 1px solid var(--border-color, #f3f4f6);
          color: var(--text-primary, #374151);
        }

        .request-row {
          transition: background 0.15s ease;
        }

        .request-row:hover {
          background: var(--nav-hover, #f9fafb);
        }

        .id-cell {
          font-weight: 600;
          color: var(--primary-color, #6366f1);
          font-size: 12px;
        }

        .title-cell {
          font-weight: 500;
          color: var(--text-primary, #1f2433);
        }

        .purpose-badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 500;
          background: #e0e7ff;
          color: #3730a3;
        }

        .priority-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 500;
        }

        .priority-low {
          background: #d1fae5;
          color: #065f46;
        }

        .priority-medium {
          background: #dbeafe;
          color: #1e40af;
        }

        .priority-high {
          background: #fef3c7;
          color: #92400e;
        }

        .priority-urgent {
          background: #fee2e2;
          color: #991b1b;
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

        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }

        .status-approved {
          background: #d1fae5;
          color: #065f46;
        }

        .status-rejected {
          background: #fee2e2;
          color: #991b1b;
        }

        .status-partial {
          background: #fef3c7;
          color: #92400e;
        }

        .status-completed {
          background: #d1fae5;
          color: #065f46;
        }

        .date-cell {
          font-size: 12px;
          color: var(--text-secondary, #6b7280);
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
          max-width: 700px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        }

        .view-modal { max-width: 750px; }
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
          min-width: 110px;
        }

        .view-row span {
          color: var(--text-primary, #1f2433);
        }

        .view-items-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          margin-top: 8px;
        }

        .view-items-table th {
          padding: 6px 10px;
          text-align: left;
          font-weight: 500;
          color: var(--text-secondary, #6b7280);
          border-bottom: 1px solid var(--border-color, #e5e7eb);
          background: var(--layout-bg, #f8f9fa);
        }

        .view-items-table td {
          padding: 6px 10px;
          border-bottom: 1px solid var(--border-color, #f3f4f6);
        }

        .view-items-table tfoot {
          background: var(--layout-bg, #f8f9fa);
        }

        .view-items-table .total-label {
          text-align: right;
          font-weight: 600;
          padding: 8px 10px;
        }

        .view-items-table .total-amount {
          font-weight: 700;
          color: var(--primary-color, #6366f1);
          padding: 8px 10px;
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

        /* ── Items Table in Modal ──────────────────────────────────── */
        .modal-items-table-wrapper {
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 6px;
          overflow: hidden;
          margin-top: 4px;
        }

        .modal-items-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        .modal-items-table thead {
          background: var(--layout-bg, #f8f9fa);
        }

        .modal-items-table th {
          padding: 6px 10px;
          text-align: left;
          font-weight: 500;
          color: var(--text-secondary, #6b7280);
          border-bottom: 1px solid var(--border-color, #e5e7eb);
          font-size: 10px;
          text-transform: uppercase;
        }

        .modal-items-table td {
          padding: 4px 8px;
          border-bottom: 1px solid var(--border-color, #f3f4f6);
          vertical-align: middle;
        }

        .modal-items-table input,
        .modal-items-table select {
          width: 100%;
          padding: 4px 6px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 4px;
          font-size: 12px;
          background: var(--input-bg, #ffffff);
          color: var(--text-primary, #374151);
          height: 28px;
        }

        .modal-items-table input:focus,
        .modal-items-table select:focus {
          outline: none;
          border-color: var(--primary-color, #6366f1);
        }

        .modal-items-table input[type="number"] {
          width: 70px;
        }

        .modal-items-table .amount-cell {
          font-weight: 500;
          color: var(--text-primary, #1f2433);
        }

        .modal-items-table tfoot {
          background: var(--layout-bg, #f8f9fa);
        }

        .modal-items-table .total-label {
          text-align: right;
          font-weight: 600;
          padding: 6px 10px;
        }

        .modal-items-table .total-amount {
          font-weight: 700;
          color: var(--primary-color, #6366f1);
          padding: 6px 10px;
        }

        .remove-item-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: rgba(239,68,68,0.08);
          color: var(--danger-color, #ef4444);
          border: none;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .remove-item-btn:hover {
          background: rgba(239,68,68,0.2);
        }

        .add-item-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          background: color-mix(in srgb, var(--primary-color) 12%, transparent);
          color: var(--primary-color, #6366f1);
          border: none;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .add-item-btn:hover {
          background: color-mix(in srgb, var(--primary-color) 25%, transparent);
        }

        .items-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 8px 0 4px 0;
        }

        .items-header label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary, #6b7280);
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
          .material-request-page { padding: 12px 16px; }
          .page-header { flex-direction: column; align-items: stretch; }
          .header-actions { flex-wrap: wrap; justify-content: flex-end; }
          .search-bar { flex-direction: column; align-items: stretch; }
          .filter-wrapper { justify-content: space-between; }
          .request-table { min-width: 700px; }
          .modal-container { max-width: 100%; margin: 10px; }
          .modal-footer { flex-direction: column; }
          .modal-footer button { width: 100%; justify-content: center; }
          .view-grid { grid-template-columns: 1fr; }
          .compact-stats { flex-wrap: wrap; gap: 8px; padding: 8px 12px; }
          .stat-divider { display: none; }
          .form-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 480px) {
          .material-request-page { padding: 8px 12px; }
          .request-table { font-size: 12px; min-width: 600px; }
          .request-table th, .request-table td { padding: 6px 10px; }
          .action-group { gap: 0; }
          .action-btn { width: 24px; height: 24px; }
        }

        /* ─── Dark Theme ─────────────────────────────────────────── */
        .dark-theme .material-request-page { background: var(--layout-bg, #0f172a); }
        .dark-theme .page-title { color: var(--text-primary, #f8fafc); }
        .dark-theme .badge { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); color: var(--text-secondary, #94a3b8); }
        .dark-theme .search-wrapper { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); }
        .dark-theme .search-input { color: var(--text-primary, #f8fafc); }
        .dark-theme .search-input::placeholder { color: var(--text-secondary, #64748b); }
        .dark-theme .filter-toggle { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); color: var(--text-secondary, #94a3b8); }
        .dark-theme .filter-toggle:hover { background: var(--nav-hover, rgba(255,255,255,0.05)); }
        .dark-theme .expandable-filters { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); }
        .dark-theme .filter-group select { background: var(--input-bg, #0f172a); border-color: var(--border-color, #334155); color: var(--text-primary, #f8fafc); }
        .dark-theme .request-container { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); }
        .dark-theme .request-table thead { background: var(--layout-bg, #0f172a); }
        .dark-theme .request-table th { color: var(--text-secondary, #94a3b8); border-bottom-color: var(--border-color, #334155); }
        .dark-theme .request-table td { border-bottom-color: var(--border-color, #334155); color: var(--text-primary, #f8fafc); }
        .dark-theme .request-row:hover { background: var(--nav-hover, rgba(255,255,255,0.05)); }
        .dark-theme .id-cell { color: var(--primary-color, #818cf8); }
        .dark-theme .title-cell { color: var(--text-primary, #f8fafc); }
        .dark-theme .date-cell { color: var(--text-secondary, #94a3b8); }
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
        .dark-theme .view-items-table th { background: var(--layout-bg, #0f172a); color: var(--text-secondary, #94a3b8); }
        .dark-theme .view-items-table td { color: var(--text-primary, #f8fafc); }
        .dark-theme .btn-secondary { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); color: var(--text-primary, #f8fafc); }
        .dark-theme .btn-secondary:hover { background: var(--layout-bg, #0f172a); }
        .dark-theme .btn-primary { background: var(--primary-color, #3b82f6); }
        .dark-theme .btn-primary:hover { background: var(--primary-hover, #2563eb); }
        .dark-theme .status-pending { background: rgba(251,191,36,0.2); color: #fbbf24; }
        .dark-theme .status-approved { background: rgba(16,185,129,0.2); color: #34d399; }
        .dark-theme .status-rejected { background: rgba(239,68,68,0.2); color: #f87171; }
        .dark-theme .status-partial { background: rgba(251,191,36,0.2); color: #fbbf24; }
        .dark-theme .status-completed { background: rgba(16,185,129,0.2); color: #34d399; }
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
        .dark-theme .modal-items-table thead { background: var(--layout-bg, #0f172a); }
        .dark-theme .modal-items-table th { color: var(--text-secondary, #94a3b8); }
        .dark-theme .modal-items-table td { color: var(--text-primary, #f8fafc); }
        .dark-theme .modal-items-table input, .dark-theme .modal-items-table select { background: var(--input-bg, #0f172a); border-color: var(--border-color, #334155); color: var(--text-primary, #f8fafc); }
        .dark-theme .modal-items-table tfoot { background: var(--layout-bg, #0f172a); }
        .dark-theme .add-item-btn { background: rgba(99,102,241,0.2); color: var(--primary-color, #818cf8); }
        .dark-theme .add-item-btn:hover { background: rgba(99,102,241,0.3); }
        .dark-theme .remove-item-btn { background: rgba(239,68,68,0.15); color: #f87171; }
        .dark-theme .remove-item-btn:hover { background: rgba(239,68,68,0.25); }
        .dark-theme .purpose-badge { background: rgba(99,102,241,0.2); color: var(--primary-color, #818cf8); }
        .dark-theme .priority-low { background: rgba(16,185,129,0.2); color: #34d399; }
        .dark-theme .priority-medium { background: rgba(59,130,246,0.2); color: #60a5fa; }
        .dark-theme .priority-high { background: rgba(251,191,36,0.2); color: #fbbf24; }
        .dark-theme .priority-urgent { background: rgba(239,68,68,0.2); color: #f87171; }
      `}</style>

      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Material Request</h1>
          <span className="badge">{materialRequests.length}</span>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={handleCreate}>
            <FaPlus size={12} /> Add Request
          </button>
        </div>
      </div>

      {/* Compact Stats */}
      <div className="compact-stats">
        <div className="stat-item">
          <span className="stat-label">Total</span>
          <span className="stat-value">{totalRequests}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-label">Pending</span>
          <span className="stat-value stat-pending">{pendingRequests}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-label">Quantity</span>
          <span className="stat-value">{totalQuantity.toLocaleString()}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-label">Amount</span>
          <span className="stat-value">₹{totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="search-bar">
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by title, ID or requester..."
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
            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button 
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter size={12} /> Filter
          </button>
          <span className="result-count">{filteredRequests.length} of {materialRequests.length}</span>
        </div>
      </div>

      {/* Expandable Filters */}
      {showFilters && (
        <div className="expandable-filters">
          <div className="filter-group">
            <label>Purpose</label>
            <select
              value={selectedPurpose}
              onChange={(e) => setSelectedPurpose(e.target.value)}
            >
              <option value="All">All Purposes</option>
              {purposeOptions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Priority</label>
            <select>
              <option value="all">All Priorities</option>
              {priorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Department</label>
            <select>
              <option value="all">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button className="apply-filters">Apply</button>
        </div>
      )}

      {/* Material Request List */}
      <div className="request-container">
        {filteredRequests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FaBox size={48} />
            </div>
            <h3>No material requests found</h3>
            <p>Create your first material request to get started</p>
            <button className="btn-primary" onClick={handleCreate}>
              <FaPlus size={12} /> Add Request
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="request-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Purpose</th>
                  <th>Priority</th>
                  <th>Transaction Date</th>
                  <th>Required By</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="request-row">
                    <td className="id-cell">{request.requestNumber}</td>
                    <td className="title-cell">{request.title}</td>
                    <td>
                      <span className={`status-badge ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        {request.status}
                      </span>
                    </td>
                    <td>
                      <span className="purpose-badge">{request.purpose}</span>
                    </td>
                    <td>
                      <span className={`priority-badge ${getPriorityColor(request.priority)}`}>
                        {request.priority}
                      </span>
                    </td>
                    <td className="date-cell">
                      {new Date(request.transactionDate).toLocaleDateString()}
                    </td>
                    <td className="date-cell">
                      {new Date(request.requiredBy).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="action-group">
                        <button 
                          className="action-btn view" 
                          title="View"
                          onClick={() => handleView(request)}
                        >
                          <FaEye size={12} />
                        </button>
                        <button 
                          className="action-btn edit" 
                          title="Edit"
                          onClick={() => handleEdit(request)}
                        >
                          <FaEdit size={12} />
                        </button>
                        <button 
                          className="action-btn copy" 
                          title="Duplicate"
                          onClick={() => handleDuplicate(request)}
                        >
                          <FaCopy size={12} />
                        </button>
                        <button 
                          className="action-btn delete" 
                          title="Delete"
                          onClick={() => handleDelete(request)}
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
        <span>{filteredRequests.length} of {materialRequests.length} requests</span>
        <div className="footer-actions">
          <span className="conversion-badge">
            <FaBox size={11} /> {pendingRequests} pending
          </span>
        </div>
      </div>

      {/* ====== VIEW MODAL ====== */}
      {showViewModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-container view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedRequest.requestNumber}</h2>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="view-grid">
                <div className="view-section">
                  <h4>Basic Information</h4>
                  <div className="view-row"><label>Title:</label><span>{selectedRequest.title}</span></div>
                  <div className="view-row"><label>Status:</label><span className={`status-badge ${getStatusColor(selectedRequest.status)}`}>{selectedRequest.status}</span></div>
                  <div className="view-row"><label>Purpose:</label><span>{selectedRequest.purpose}</span></div>
                  <div className="view-row"><label>Priority:</label><span className={`priority-badge ${getPriorityColor(selectedRequest.priority)}`}>{selectedRequest.priority}</span></div>
                </div>
                <div className="view-section">
                  <h4>Dates</h4>
                  <div className="view-row"><label>Transaction Date:</label><span>{new Date(selectedRequest.transactionDate).toLocaleDateString()}</span></div>
                  <div className="view-row"><label>Required By:</label><span>{new Date(selectedRequest.requiredBy).toLocaleDateString()}</span></div>
                </div>
                <div className="view-section">
                  <h4>Requestor Details</h4>
                  <div className="view-row"><label>Requested By:</label><span>{selectedRequest.requestedBy}</span></div>
                  <div className="view-row"><label>Department:</label><span>{selectedRequest.department}</span></div>
                  <div className="view-row"><label>Warehouse:</label><span>{selectedRequest.warehouse}</span></div>
                </div>
                <div className="view-section">
                  <h4>Summary</h4>
                  <div className="view-row"><label>Total Quantity:</label><span>{selectedRequest.totalQuantity.toLocaleString()}</span></div>
                  <div className="view-row"><label>Total Amount:</label><span>₹{selectedRequest.totalAmount.toLocaleString()}</span></div>
                </div>
                <div className="view-section full-width">
                  <h4>Items</h4>
                  <table className="view-items-table">
                    <thead>
                      <tr><th>Item Code</th><th>Item Name</th><th>Qty</th><th>UOM</th><th>Rate</th><th>Amount</th></tr>
                    </thead>
                    <tbody>
                      {selectedRequest.items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.itemCode}</td>
                          <td>{item.itemName}</td>
                          <td>{item.quantity}</td>
                          <td>{item.uom}</td>
                          <td>₹{item.rate}</td>
                          <td>₹{item.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr><td colSpan={5} className="total-label">Total</td><td className="total-amount">₹{selectedRequest.totalAmount}</td></tr>
                    </tfoot>
                  </table>
                </div>
                {selectedRequest.notes && (
                  <div className="view-section full-width">
                    <h4>Notes</h4>
                    <div className="view-row"><span>{selectedRequest.notes}</span></div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
              <button className="btn-primary" onClick={() => handleEdit(selectedRequest)}>
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
              <h2>{showEditModal ? 'Edit Material Request' : 'New Material Request'}</h2>
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
                  <label>Request ID</label>
                  <input
                    type="text"
                    value={formData.requestNumber}
                    disabled
                    style={{ background: 'var(--layout-bg, #f3f4f6)', cursor: 'not-allowed' }}
                  />
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
                <div className="form-group full-width">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter request title"
                  />
                </div>
                <div className="form-group">
                  <label>Purpose</label>
                  <select
                    value={formData.purpose}
                    onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value as any }))}
                  >
                    {purposeOptions.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  >
                    {priorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Transaction Date</label>
                  <input
                    type="date"
                    value={formData.transactionDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, transactionDate: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Required By</label>
                  <input
                    type="date"
                    value={formData.requiredBy}
                    onChange={(e) => setFormData(prev => ({ ...prev, requiredBy: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Requested By *</label>
                  <input
                    type="text"
                    value={formData.requestedBy}
                    onChange={(e) => setFormData(prev => ({ ...prev, requestedBy: e.target.value }))}
                    placeholder="Enter requester name"
                  />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Warehouse</label>
                  <select
                    value={formData.warehouse}
                    onChange={(e) => setFormData(prev => ({ ...prev, warehouse: e.target.value }))}
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              </div>

              {/* Items Section */}
              <div className="items-header">
                <label>Items</label>
                <button type="button" className="add-item-btn" onClick={addItemRow}>
                  <FaPlus size={11} /> Add Item
                </button>
              </div>
              <div className="modal-items-table-wrapper">
                <table className="modal-items-table">
                  <thead>
                    <tr>
                      <th>Item Code</th>
                      <th>Item Name</th>
                      <th>Qty</th>
                      <th>UOM</th>
                      <th>Rate</th>
                      <th>Amount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={item.id}>
                        <td>
                          <input
                            type="text"
                            value={item.itemCode}
                            onChange={(e) => handleItemChange(index, 'itemCode', e.target.value)}
                            placeholder="Code"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={item.itemName}
                            onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                            placeholder="Name"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                            min="1"
                          />
                        </td>
                        <td>
                          <select
                            value={item.uom}
                            onChange={(e) => handleItemChange(index, 'uom', e.target.value)}
                          >
                            {uomOptions.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="amount-cell">₹{item.amount.toFixed(2)}</td>
                        <td>
                          {formData.items.length > 1 && (
                            <button
                              type="button"
                              className="remove-item-btn"
                              onClick={() => removeItemRow(index)}
                            >
                              <FaTrash size={11} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={5} className="total-label">Total</td>
                      <td className="total-amount">
                        ₹{formData.items.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="form-group full-width" style={{ marginTop: '12px' }}>
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  rows={2}
                />
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
      {showDeleteModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-container delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Material Request</h2>
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
                You are about to delete <strong>{selectedRequest.title}</strong>
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