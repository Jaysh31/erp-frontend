import  { useState } from 'react';
import { 
  FaSearch, FaPlus, FaEdit, FaTrash, FaFilter, 
  FaTimes, FaSave, FaSpinner, FaCopy, FaEye,
  FaFileAlt,  FaCheckCircle,
  FaTimesCircle, FaClock, FaExclamationTriangle,
  FaTruck, 
} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';

interface PurchaseOrderItem {
  id: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  uom: string;
  rate: number;
  amount: number;
  receivedQty: number;
  balanceQty: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  title: string;
  supplier: string;
  supplierCode: string;
  status: 'Draft' | 'Submitted' | 'Partially Received' | 'Fully Received' | 'Cancelled' | 'Closed';
  orderDate: string;
  deliveryDate: string;
  currency: string;
  totalAmount: number;
  receivedAmount: number;
  balanceAmount: number;
  paymentTerms: string;
  shippingAddress: string;
  billingAddress: string;
  notes: string;
  items: PurchaseOrderItem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function PurchaseOrder() {
  
  let theme = 'light';
  try {
    const context = useAdminTheme();
    theme = context.theme;
  } catch (error) {
    console.log('Using default light theme');
  }

  const [filterText, setFilterText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedSupplier, setSelectedSupplier] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(false);

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([
    {
      id: '1',
      poNumber: 'PO-2026-001',
      title: 'Raw Material Purchase',
      supplier: 'ABC Manufacturing Co.',
      supplierCode: 'SUP-001',
      status: 'Partially Received',
      orderDate: '2026-06-20',
      deliveryDate: '2026-07-05',
      currency: 'INR',
      totalAmount: 250000,
      receivedAmount: 100000,
      balanceAmount: 150000,
      paymentTerms: 'Net 30',
      shippingAddress: '123, Business Park, Mumbai - 400001',
      billingAddress: '123, Business Park, Mumbai - 400001',
      notes: 'Urgent delivery required',
      createdBy: 'Tejas Tarte',
      createdAt: '2026-06-20T10:00:00Z',
      updatedAt: '2026-06-20T10:00:00Z',
      items: [
        { id: '1', itemCode: 'RM-001', itemName: 'Steel Sheets 2mm', quantity: 500, uom: 'NOS', rate: 350, amount: 175000, receivedQty: 200, balanceQty: 300 },
        { id: '2', itemCode: 'RM-002', itemName: 'Aluminum Bars', quantity: 300, uom: 'KG', rate: 250, amount: 75000, receivedQty: 100, balanceQty: 200 }
      ]
    },
    {
      id: '2',
      poNumber: 'PO-2026-002',
      title: 'Electronic Components',
      supplier: 'XYZ Electronics Ltd.',
      supplierCode: 'SUP-002',
      status: 'Fully Received',
      orderDate: '2026-06-18',
      deliveryDate: '2026-06-28',
      currency: 'USD',
      totalAmount: 45000,
      receivedAmount: 45000,
      balanceAmount: 0,
      paymentTerms: 'Net 15',
      shippingAddress: '456, Tech Park, Bangalore - 560100',
      billingAddress: '456, Tech Park, Bangalore - 560100',
      notes: 'Quality check required upon receipt',
      createdBy: 'Nirjala Bagal',
      createdAt: '2026-06-18T10:00:00Z',
      updatedAt: '2026-06-18T10:00:00Z',
      items: [
        { id: '1', itemCode: 'EC-001', itemName: 'Resistor Pack 100k', quantity: 1000, uom: 'NOS', rate: 15, amount: 15000, receivedQty: 1000, balanceQty: 0 },
        { id: '2', itemCode: 'EC-002', itemName: 'Capacitor 100uF', quantity: 500, uom: 'NOS', rate: 60, amount: 30000, receivedQty: 500, balanceQty: 0 }
      ]
    },
    {
      id: '3',
      poNumber: 'PO-2026-003',
      title: 'Packaging Materials',
      supplier: 'PQR Packaging Solutions',
      supplierCode: 'SUP-003',
      status: 'Draft',
      orderDate: '2026-06-22',
      deliveryDate: '2026-07-10',
      currency: 'INR',
      totalAmount: 120000,
      receivedAmount: 0,
      balanceAmount: 120000,
      paymentTerms: 'Net 45',
      shippingAddress: '789, Packaging Park, Pune - 411001',
      billingAddress: '789, Packaging Park, Pune - 411001',
      notes: 'Pending approval',
      createdBy: 'P S Kamthe',
      createdAt: '2026-06-22T10:00:00Z',
      updatedAt: '2026-06-22T10:00:00Z',
      items: [
        { id: '1', itemCode: 'PKG-001', itemName: 'Carton Boxes Large', quantity: 200, uom: 'NOS', rate: 300, amount: 60000, receivedQty: 0, balanceQty: 200 },
        { id: '2', itemCode: 'PKG-002', itemName: 'Packing Tape', quantity: 150, uom: 'ROL', rate: 400, amount: 60000, receivedQty: 0, balanceQty: 150 }
      ]
    }
  ]);

  const [formData, setFormData] = useState<{
    poNumber: string;
    title: string;
    supplier: string;
    supplierCode: string;
    status: PurchaseOrder['status'];
    orderDate: string;
    deliveryDate: string;
    currency: string;
    paymentTerms: string;
    shippingAddress: string;
    billingAddress: string;
    notes: string;
    items: PurchaseOrderItem[];
  }>({
    poNumber: '',
    title: '',
    supplier: '',
    supplierCode: '',
    status: 'Draft',
    orderDate: '',
    deliveryDate: '',
    currency: 'INR',
    paymentTerms: 'Net 30',
    shippingAddress: '',
    billingAddress: '',
    notes: '',
    items: [{ id: '1', itemCode: '', itemName: '', quantity: 1, uom: 'NOS', rate: 0, amount: 0, receivedQty: 0, balanceQty: 0 }]
  });

  const statusOptions = ['Draft', 'Submitted', 'Partially Received', 'Fully Received', 'Cancelled', 'Closed'];
  const suppliers = ['ABC Manufacturing Co.', 'XYZ Electronics Ltd.', 'PQR Packaging Solutions'];
  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];
  const paymentTerms = ['Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Due on Receipt', 'Cash on Delivery'];
  const uomOptions = ['NOS', 'KG', 'LTR', 'MTR', 'BOX', 'SET', 'DOZ', 'ROL', 'SQM', 'CBM'];

  const filteredOrders = purchaseOrders.filter(po => {
    const matchesSearch = po.poNumber.toLowerCase().includes(filterText.toLowerCase()) ||
                         po.title.toLowerCase().includes(filterText.toLowerCase()) ||
                         po.supplier.toLowerCase().includes(filterText.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || po.status === selectedStatus;
    const matchesSupplier = selectedSupplier === 'All' || po.supplier === selectedSupplier;
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'status-draft';
      case 'Submitted': return 'status-submitted';
      case 'Partially Received': return 'status-partial';
      case 'Fully Received': return 'status-completed';
      case 'Cancelled': return 'status-cancelled';
      case 'Closed': return 'status-closed';
      default: return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Draft': return <FaFileAlt size={10} />;
      case 'Submitted': return <FaClock size={10} />;
      case 'Partially Received': return <FaExclamationTriangle size={10} />;
      case 'Fully Received': return <FaCheckCircle size={10} />;
      case 'Cancelled': return <FaTimesCircle size={10} />;
      case 'Closed': return <FaCheckCircle size={10} />;
      default: return null;
    }
  };

  const handleCreate = () => {
    setFormData({
      poNumber: `PO-2026-${String(purchaseOrders.length + 1).padStart(3, '0')}`,
      title: '',
      supplier: '',
      supplierCode: '',
      status: 'Draft',
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: '',
      currency: 'INR',
      paymentTerms: 'Net 30',
      shippingAddress: '',
      billingAddress: '',
      notes: '',
      items: [{ id: '1', itemCode: '', itemName: '', quantity: 1, uom: 'NOS', rate: 0, amount: 0, receivedQty: 0, balanceQty: 0 }]
    });
    setShowCreateModal(true);
  };

  const handleEdit = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setFormData({
      poNumber: po.poNumber,
      title: po.title,
      supplier: po.supplier,
      supplierCode: po.supplierCode,
      status: po.status,
      orderDate: po.orderDate,
      deliveryDate: po.deliveryDate,
      currency: po.currency,
      paymentTerms: po.paymentTerms,
      shippingAddress: po.shippingAddress,
      billingAddress: po.billingAddress,
      notes: po.notes || '',
      items: po.items.map(item => ({ ...item }))
    });
    setShowEditModal(true);
  };

  const handleView = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setShowViewModal(true);
  };

  const handleDelete = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setShowDeleteModal(true);
  };

  const handleItemChange = (index: number, field: keyof PurchaseOrderItem, value: string | number) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'rate') {
      const quantity = field === 'quantity' ? Number(value) : updatedItems[index].quantity;
      const rate = field === 'rate' ? Number(value) : updatedItems[index].rate;
      updatedItems[index].amount = quantity * rate;
      updatedItems[index].balanceQty = quantity - updatedItems[index].receivedQty;
    }
    
    if (field === 'receivedQty') {
      updatedItems[index].balanceQty = updatedItems[index].quantity - Number(value);
    }
    
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const addItemRow = () => {
    const newId = String(formData.items.length + 1);
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: newId, itemCode: '', itemName: '', quantity: 1, uom: 'NOS', rate: 0, amount: 0, receivedQty: 0, balanceQty: 0 }]
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
    if (!formData.supplier.trim()) {
      toast.error('Supplier is required');
      setLoading(false);
      return;
    }
    
    const totalAmount = formData.items.reduce((sum, item) => sum + item.amount, 0);
    const receivedAmount = formData.items.reduce((sum, item) => sum + (item.receivedQty * item.rate), 0);
    const balanceAmount = totalAmount - receivedAmount;
    
    setTimeout(() => {
      if (showEditModal && selectedPO) {
        setPurchaseOrders(prev => 
          prev.map(po => po.id === selectedPO.id 
            ? { 
                ...po, 
                ...formData,
                totalAmount,
                receivedAmount,
                balanceAmount,
                updatedAt: new Date().toISOString() 
              }
            : po
          )
        );
        toast.success('Purchase Order updated successfully!');
      } else {
        const newPO: PurchaseOrder = {
          id: String(purchaseOrders.length + 1),
          poNumber: formData.poNumber,
          title: formData.title,
          supplier: formData.supplier,
          supplierCode: formData.supplierCode || `SUP-${String(purchaseOrders.length + 1).padStart(3, '0')}`,
          status: formData.status,
          orderDate: formData.orderDate,
          deliveryDate: formData.deliveryDate,
          currency: formData.currency,
          totalAmount,
          receivedAmount,
          balanceAmount,
          paymentTerms: formData.paymentTerms,
          shippingAddress: formData.shippingAddress,
          billingAddress: formData.billingAddress,
          notes: formData.notes || '',
          items: formData.items,
          createdBy: 'Current User',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setPurchaseOrders(prev => [...prev, newPO]);
        toast.success('Purchase Order created successfully!');
      }
      setShowCreateModal(false);
      setShowEditModal(false);
      setLoading(false);
    }, 1000);
  };

  const handleDeleteConfirm = () => {
    if (!selectedPO) return;
    setLoading(true);
    
    setTimeout(() => {
      setPurchaseOrders(prev => prev.filter(po => po.id !== selectedPO.id));
      setShowDeleteModal(false);
      setLoading(false);
      toast.success('Purchase Order deleted successfully!');
    }, 1000);
  };

  const handleDuplicate = (po: PurchaseOrder) => {
    const newPO: PurchaseOrder = {
      ...po,
      id: String(purchaseOrders.length + 1),
      poNumber: `PO-2026-${String(purchaseOrders.length + 1).padStart(3, '0')}`,
      title: `${po.title} (Copy)`,
      status: 'Draft',
      receivedAmount: 0,
      balanceAmount: po.totalAmount,
      items: po.items.map(item => ({ ...item, receivedQty: 0, balanceQty: item.quantity })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setPurchaseOrders(prev => [...prev, newPO]);
    toast.success('Purchase Order duplicated successfully!');
  };

  const totalOrders = purchaseOrders.length;
  const totalAmount = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);
  const pendingOrders = purchaseOrders.filter(po => po.status === 'Draft' || po.status === 'Submitted').length;
  const partiallyReceived = purchaseOrders.filter(po => po.status === 'Partially Received').length;

  return (
    <div className={`purchase-order-page ${theme}-theme`}>
      <style>{`
        /* ── Page Container ─────────────────────────────────────── */
        .purchase-order-page {
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

        .purchase-order-page::-webkit-scrollbar { width: 4px; }
        .purchase-order-page::-webkit-scrollbar-track { background: transparent; }
        .purchase-order-page::-webkit-scrollbar-thumb { background: var(--border-color, #e5e7eb); border-radius: 2px; }

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

        .stat-partial {
          color: #8b5cf6;
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

        /* ── Purchase Order Table ──────────────────────────────────── */
        .po-container {
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

        .po-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 1000px;
        }

        .po-table thead {
          background: var(--layout-bg, #f8f9fa);
          border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .po-table th {
          padding: 10px 14px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary, #6b7280);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .po-table td {
          padding: 10px 14px;
          border-bottom: 1px solid var(--border-color, #f3f4f6);
          color: var(--text-primary, #374151);
        }

        .po-row {
          transition: background 0.15s ease;
        }

        .po-row:hover {
          background: var(--nav-hover, #f9fafb);
        }

        .po-number-cell {
          font-weight: 600;
          color: var(--primary-color, #6366f1);
          font-size: 12px;
        }

        .title-cell {
          font-weight: 500;
          color: var(--text-primary, #1f2433);
        }

        .supplier-cell {
          color: var(--text-secondary, #6b7280);
          font-size: 12px;
        }

        .amount-cell {
          font-weight: 600;
          color: var(--text-primary, #1f2433);
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

        .status-draft {
          background: #f3f4f6;
          color: #6b7280;
        }

        .status-submitted {
          background: #dbeafe;
          color: #1e40af;
        }

        .status-partial {
          background: #fef3c7;
          color: #92400e;
        }

        .status-completed {
          background: #d1fae5;
          color: #065f46;
        }

        .status-cancelled {
          background: #fee2e2;
          color: #991b1b;
        }

        .status-closed {
          background: #e0e7ff;
          color: #3730a3;
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
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        }

        .view-modal { max-width: 850px; }
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

        .view-items-table .received-cell {
          color: #10b981;
        }

        .view-items-table .balance-cell {
          color: #f59e0b;
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
          .purchase-order-page { padding: 12px 16px; }
          .page-header { flex-direction: column; align-items: stretch; }
          .header-actions { flex-wrap: wrap; justify-content: flex-end; }
          .search-bar { flex-direction: column; align-items: stretch; }
          .filter-wrapper { justify-content: space-between; }
          .po-table { min-width: 700px; }
          .modal-container { max-width: 100%; margin: 10px; }
          .modal-footer { flex-direction: column; }
          .modal-footer button { width: 100%; justify-content: center; }
          .view-grid { grid-template-columns: 1fr; }
          .compact-stats { flex-wrap: wrap; gap: 8px; padding: 8px 12px; }
          .stat-divider { display: none; }
          .form-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 480px) {
          .purchase-order-page { padding: 8px 12px; }
          .po-table { font-size: 12px; min-width: 600px; }
          .po-table th, .po-table td { padding: 6px 10px; }
          .action-group { gap: 0; }
          .action-btn { width: 24px; height: 24px; }
        }

        /* ─── Dark Theme ─────────────────────────────────────────── */
        .dark-theme .purchase-order-page { background: var(--layout-bg, #0f172a); }
        .dark-theme .page-title { color: var(--text-primary, #f8fafc); }
        .dark-theme .badge { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); color: var(--text-secondary, #94a3b8); }
        .dark-theme .search-wrapper { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); }
        .dark-theme .search-input { color: var(--text-primary, #f8fafc); }
        .dark-theme .search-input::placeholder { color: var(--text-secondary, #64748b); }
        .dark-theme .filter-toggle { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); color: var(--text-secondary, #94a3b8); }
        .dark-theme .filter-toggle:hover { background: var(--nav-hover, rgba(255,255,255,0.05)); }
        .dark-theme .expandable-filters { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); }
        .dark-theme .filter-group select { background: var(--input-bg, #0f172a); border-color: var(--border-color, #334155); color: var(--text-primary, #f8fafc); }
        .dark-theme .po-container { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); }
        .dark-theme .po-table thead { background: var(--layout-bg, #0f172a); }
        .dark-theme .po-table th { color: var(--text-secondary, #94a3b8); border-bottom-color: var(--border-color, #334155); }
        .dark-theme .po-table td { border-bottom-color: var(--border-color, #334155); color: var(--text-primary, #f8fafc); }
        .dark-theme .po-row:hover { background: var(--nav-hover, rgba(255,255,255,0.05)); }
        .dark-theme .po-number-cell { color: var(--primary-color, #818cf8); }
        .dark-theme .title-cell { color: var(--text-primary, #f8fafc); }
        .dark-theme .supplier-cell { color: var(--text-secondary, #94a3b8); }
        .dark-theme .amount-cell { color: var(--text-primary, #f8fafc); }
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
        .dark-theme .view-items-table .received-cell { color: #34d399; }
        .dark-theme .view-items-table .balance-cell { color: #fbbf24; }
        .dark-theme .btn-secondary { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); color: var(--text-primary, #f8fafc); }
        .dark-theme .btn-secondary:hover { background: var(--layout-bg, #0f172a); }
        .dark-theme .btn-primary { background: var(--primary-color, #3b82f6); }
        .dark-theme .btn-primary:hover { background: var(--primary-hover, #2563eb); }
        .dark-theme .status-draft { background: rgba(107,114,128,0.2); color: #9ca3af; }
        .dark-theme .status-submitted { background: rgba(59,130,246,0.2); color: #60a5fa; }
        .dark-theme .status-partial { background: rgba(251,191,36,0.2); color: #fbbf24; }
        .dark-theme .status-completed { background: rgba(16,185,129,0.2); color: #34d399; }
        .dark-theme .status-cancelled { background: rgba(239,68,68,0.2); color: #f87171; }
        .dark-theme .status-closed { background: rgba(99,102,241,0.2); color: var(--primary-color, #818cf8); }
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
      `}</style>

      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Purchase Orders</h1>
          <span className="badge">{purchaseOrders.length}</span>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={handleCreate}>
            <FaPlus size={12} /> Add PO
          </button>
        </div>
      </div>

      {/* Compact Stats */}
      <div className="compact-stats">
        <div className="stat-item">
          <span className="stat-label">Total</span>
          <span className="stat-value">{totalOrders}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-label">Pending</span>
          <span className="stat-value stat-pending">{pendingOrders}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-label">Partially Received</span>
          <span className="stat-value stat-partial">{partiallyReceived}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-label">Total Amount</span>
          <span className="stat-value">₹{totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="search-bar">
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by PO #, title or supplier..."
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
          <span className="result-count">{filteredOrders.length} of {purchaseOrders.length}</span>
        </div>
      </div>

      {/* Expandable Filters */}
      {showFilters && (
        <div className="expandable-filters">
          <div className="filter-group">
            <label>Supplier</label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
            >
              <option value="All">All Suppliers</option>
              {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Currency</label>
            <select>
              <option value="all">All Currencies</option>
              {currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Payment Terms</label>
            <select>
              <option value="all">All Terms</option>
              {paymentTerms.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button className="apply-filters">Apply</button>
        </div>
      )}

      {/* Purchase Order List */}
      <div className="po-container">
        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FaFileAlt size={48} />
            </div>
            <h3>No purchase orders found</h3>
            <p>Create your first purchase order to get started</p>
            <button className="btn-primary" onClick={handleCreate}>
              <FaPlus size={12} /> Add PO
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="po-table">
              <thead>
                <tr>
                  <th>PO #</th>
                  <th>Title</th>
                  <th>Supplier</th>
                  <th>Order Date</th>
                  <th>Delivery Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((po) => (
                  <tr key={po.id} className="po-row">
                    <td className="po-number-cell">{po.poNumber}</td>
                    <td className="title-cell">{po.title}</td>
                    <td className="supplier-cell">{po.supplier}</td>
                    <td className="date-cell">{new Date(po.orderDate).toLocaleDateString()}</td>
                    <td className="date-cell">{new Date(po.deliveryDate).toLocaleDateString()}</td>
                    <td className="amount-cell">{po.currency} {po.totalAmount.toLocaleString()}</td>
                    <td>
                      <span className={`status-badge ${getStatusColor(po.status)}`}>
                        {getStatusIcon(po.status)}
                        {po.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-group">
                        <button 
                          className="action-btn view" 
                          title="View"
                          onClick={() => handleView(po)}
                        >
                          <FaEye size={12} />
                        </button>
                        <button 
                          className="action-btn edit" 
                          title="Edit"
                          onClick={() => handleEdit(po)}
                        >
                          <FaEdit size={12} />
                        </button>
                        <button 
                          className="action-btn copy" 
                          title="Duplicate"
                          onClick={() => handleDuplicate(po)}
                        >
                          <FaCopy size={12} />
                        </button>
                        <button 
                          className="action-btn delete" 
                          title="Delete"
                          onClick={() => handleDelete(po)}
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
        <span>{filteredOrders.length} of {purchaseOrders.length} orders</span>
        <div className="footer-actions">
          <span className="conversion-badge">
            <FaTruck size={11} /> {partiallyReceived} partial
          </span>
        </div>
      </div>

      {/* ====== VIEW MODAL ====== */}
      {showViewModal && selectedPO && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-container view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedPO.poNumber} - {selectedPO.title}</h2>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="view-grid">
                <div className="view-section">
                  <h4>Order Information</h4>
                  <div className="view-row"><label>PO Number:</label><span>{selectedPO.poNumber}</span></div>
                  <div className="view-row"><label>Title:</label><span>{selectedPO.title}</span></div>
                  <div className="view-row"><label>Status:</label><span className={`status-badge ${getStatusColor(selectedPO.status)}`}>{selectedPO.status}</span></div>
                  <div className="view-row"><label>Currency:</label><span>{selectedPO.currency}</span></div>
                </div>
                <div className="view-section">
                  <h4>Supplier Details</h4>
                  <div className="view-row"><label>Supplier:</label><span>{selectedPO.supplier}</span></div>
                  <div className="view-row"><label>Supplier Code:</label><span>{selectedPO.supplierCode}</span></div>
                  <div className="view-row"><label>Payment Terms:</label><span>{selectedPO.paymentTerms}</span></div>
                </div>
                <div className="view-section">
                  <h4>Dates</h4>
                  <div className="view-row"><label>Order Date:</label><span>{new Date(selectedPO.orderDate).toLocaleDateString()}</span></div>
                  <div className="view-row"><label>Delivery Date:</label><span>{new Date(selectedPO.deliveryDate).toLocaleDateString()}</span></div>
                  <div className="view-row"><label>Created By:</label><span>{selectedPO.createdBy}</span></div>
                </div>
                <div className="view-section">
                  <h4>Financial Summary</h4>
                  <div className="view-row"><label>Total Amount:</label><span>{selectedPO.currency} {selectedPO.totalAmount.toLocaleString()}</span></div>
                  <div className="view-row"><label>Received:</label><span className="received-cell">{selectedPO.currency} {selectedPO.receivedAmount.toLocaleString()}</span></div>
                  <div className="view-row"><label>Balance:</label><span className="balance-cell">{selectedPO.currency} {selectedPO.balanceAmount.toLocaleString()}</span></div>
                </div>
                <div className="view-section full-width">
                  <h4>Addresses</h4>
                  <div className="view-row"><label>Shipping:</label><span>{selectedPO.shippingAddress}</span></div>
                  <div className="view-row"><label>Billing:</label><span>{selectedPO.billingAddress}</span></div>
                </div>
                <div className="view-section full-width">
                  <h4>Items</h4>
                  <table className="view-items-table">
                    <thead>
                      <tr><th>Item Code</th><th>Item Name</th><th>Qty</th><th>UOM</th><th>Rate</th><th>Amount</th><th>Received</th><th>Balance</th></tr>
                    </thead>
                    <tbody>
                      {selectedPO.items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.itemCode}</td>
                          <td>{item.itemName}</td>
                          <td>{item.quantity}</td>
                          <td>{item.uom}</td>
                          <td>{selectedPO.currency} {item.rate}</td>
                          <td>{selectedPO.currency} {item.amount}</td>
                          <td className="received-cell">{item.receivedQty}</td>
                          <td className="balance-cell">{item.balanceQty}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr><td colSpan={7} className="total-label">Total</td><td className="total-amount">{selectedPO.currency} {selectedPO.totalAmount}</td></tr>
                    </tfoot>
                  </table>
                </div>
                {selectedPO.notes && (
                  <div className="view-section full-width">
                    <h4>Notes</h4>
                    <div className="view-row"><span>{selectedPO.notes}</span></div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
              <button className="btn-primary" onClick={() => handleEdit(selectedPO)}>
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
              <h2>{showEditModal ? 'Edit Purchase Order' : 'New Purchase Order'}</h2>
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
                  <label>PO Number</label>
                  <input
                    type="text"
                    value={formData.poNumber}
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
                    placeholder="Enter PO title"
                  />
                </div>
                <div className="form-group">
                  <label>Supplier *</label>
                  <select
                    value={formData.supplier}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Supplier Code</label>
                  <input
                    type="text"
                    value={formData.supplierCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplierCode: e.target.value }))}
                    placeholder="SUP-001"
                  />
                </div>
                <div className="form-group">
                  <label>Order Date</label>
                  <input
                    type="date"
                    value={formData.orderDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, orderDate: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Delivery Date</label>
                  <input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  >
                    {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment Terms</label>
                  <select
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                  >
                    {paymentTerms.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Shipping Address</label>
                  <input
                    type="text"
                    value={formData.shippingAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, shippingAddress: e.target.value }))}
                    placeholder="Enter shipping address"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Billing Address</label>
                  <input
                    type="text"
                    value={formData.billingAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, billingAddress: e.target.value }))}
                    placeholder="Enter billing address"
                  />
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
                      <th>Received</th>
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
                        <td className="amount-cell">{formData.currency} {item.amount.toFixed(2)}</td>
                        <td>
                          <input
                            type="number"
                            value={item.receivedQty}
                            onChange={(e) => handleItemChange(index, 'receivedQty', Number(e.target.value))}
                            min="0"
                            disabled={!showEditModal}
                            style={!showEditModal ? { background: 'var(--layout-bg, #f3f4f6)', cursor: 'not-allowed' } : {}}
                          />
                        </td>
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
                      <td className="total-amount">{formData.currency} {formData.items.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}</td>
                      <td></td>
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
      {showDeleteModal && selectedPO && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-container delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Purchase Order</h2>
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
                You are about to delete <strong>{selectedPO.poNumber}</strong>
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