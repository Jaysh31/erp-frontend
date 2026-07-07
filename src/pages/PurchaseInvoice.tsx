import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaSearch, FaPlus, FaEdit, FaTrash, FaFilter, 
  FaTimes, FaSpinner, FaCopy, FaEye,
  FaFileAlt, FaCheckCircle,
  FaTimesCircle, FaClock, FaExclamationTriangle,
  FaPaperPlane, FaReceipt, FaBuilding, FaUser, 
  FaCalendarAlt, FaRupeeSign, FaGlobe, FaTag,
  FaBox, FaTruck, FaFileInvoice, FaPhone, FaEnvelope,
  FaMapMarkerAlt, FaHashtag, FaPercent, FaInfoCircle
} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';

// ===== INTERFACES BASED ON PAYLOAD =====

interface PurchaseInvoice {
  // Core Fields
  name: string;
  supplier: string;
  supplier_name: string;
  company: string;
  posting_date: string;
  due_date: string;
  status: 'Draft' | 'Submitted' | 'Partially Paid' | 'Fully Paid' | 'Overdue' | 'Cancelled';
  
  // Amounts
  grand_total: number;
  base_grand_total: number;
  total: number;
  net_total: number;
  paid_amount: number;
  base_paid_amount: number;
  outstanding_amount: number;
  total_advance: number;
  write_off_amount: number;
  
  // Currency
  currency: string;
  price_list_currency: string;
  conversion_rate: number;
  
  // Taxes
  total_taxes_and_charges: number;
  taxes_and_charges_added: number;
  tax_category: string;
  taxes_and_charges: string;
  
  // Supplier Details
  supplier_address: string;
  address_display: string;
  contact_person: string;
  contact_display: string;
  contact_mobile: string;
  contact_email: string;
  supplier_group: string;
  tax_id: string;
  
  // Reference
  bill_no: string;
  bill_date: string;
  naming_series: string;
  purchase_order: string;
  
  // Status Flags
  docstatus: 0 | 1 | 2;
  is_paid: 0 | 1;
  is_return: 0 | 1;
  on_hold: 0 | 1;
  
  // Quantities
  total_qty: number;
  total_net_weight: number;
  
  // Misc
  cost_center: string;
  project: string;
  payment_terms_template: string;
  terms: string;
  remarks: string;
  in_words: string;
  title: string;
  language: string;
  letter_head: string;
  
  // Audit
  owner: string;
  modified_by: string;
  created_by: string;
  createdAt: string;
  updatedAt: string;
  modified: string;
  creation: string;
  
  // Additional
  mode_of_payment: string;
  cash_bank_account: string;
  set_warehouse: string;
  incoterm: string;
  named_place: string;
  buyer: string;
  tax_withholding_group: string;
  is_subcontracted: 0 | 1;
  update_stock: 1 | 0;
}

// ===== MOCK DATA =====
const mockInvoices: PurchaseInvoice[] = [
  {
    name: 'PINV-2026-001',
    supplier: 'SUP-0001',
    supplier_name: 'ABC Suppliers',
    company: 'My Company',
    posting_date: '2026-07-05',
    due_date: '2026-08-05',
    status: 'Draft',
    grand_total: 59000,
    base_grand_total: 59000,
    total: 50000,
    net_total: 50000,
    paid_amount: 0,
    base_paid_amount: 0,
    outstanding_amount: 59000,
    total_advance: 0,
    write_off_amount: 0,
    currency: 'INR',
    price_list_currency: 'INR',
    conversion_rate: 1,
    total_taxes_and_charges: 9000,
    taxes_and_charges_added: 9000,
    tax_category: 'In-State',
    taxes_and_charges: 'GST 18%',
    supplier_address: 'SUP-ADDR-0001',
    address_display: 'Pune, Maharashtra',
    contact_person: 'John Doe',
    contact_display: 'John Doe',
    contact_mobile: '9876543210',
    contact_email: 'john@example.com',
    supplier_group: 'Local',
    tax_id: 'GSTIN123456789',
    bill_no: 'INV-2026-001',
    bill_date: '2026-07-05',
    naming_series: 'PINV-.YYYY.-',
    purchase_order: 'PO-2026-001',
    docstatus: 0,
    is_paid: 0,
    is_return: 0,
    on_hold: 0,
    total_qty: 100,
    total_net_weight: 250,
    cost_center: 'Main - MC',
    project: 'PRJ-0001',
    payment_terms_template: '30 Days',
    terms: 'Payment due within 30 days.',
    remarks: 'Purchase invoice created via API.',
    in_words: 'INR Fifty Nine Thousand Only',
    title: 'Purchase Invoice for ABC Suppliers',
    language: 'en',
    letter_head: 'Standard',
    owner: 'Administrator',
    modified_by: 'Administrator',
    created_by: 'Administrator',
    createdAt: '2026-07-05T10:30:00Z',
    updatedAt: '2026-07-05T10:30:00Z',
    modified: '2026-07-05T10:30:00Z',
    creation: '2026-07-05T10:30:00Z',
    mode_of_payment: 'Bank',
    cash_bank_account: 'Bank - MC',
    set_warehouse: 'Stores - MC',
    incoterm: 'FOB',
    named_place: 'Pune',
    buyer: 'My Company',
    tax_withholding_group: 'None',
    is_subcontracted: 0,
    update_stock: 1
  },
  {
    name: 'PINV-2026-002',
    supplier: 'SUP-0002',
    supplier_name: 'XYZ Electronics Ltd',
    company: 'My Company',
    posting_date: '2026-06-18',
    due_date: '2026-07-18',
    status: 'Fully Paid',
    grand_total: 45000,
    base_grand_total: 45000,
    total: 45000,
    net_total: 45000,
    paid_amount: 45000,
    base_paid_amount: 45000,
    outstanding_amount: 0,
    total_advance: 0,
    write_off_amount: 0,
    currency: 'USD',
    price_list_currency: 'USD',
    conversion_rate: 83.5,
    total_taxes_and_charges: 0,
    taxes_and_charges_added: 0,
    tax_category: 'No Tax',
    taxes_and_charges: '',
    supplier_address: 'SUP-ADDR-0002',
    address_display: 'Mumbai, Maharashtra',
    contact_person: 'Jane Smith',
    contact_display: 'Jane Smith',
    contact_mobile: '8765432109',
    contact_email: 'jane@xyz.com',
    supplier_group: 'International',
    tax_id: 'GSTIN987654321',
    bill_no: 'INV-2026-002',
    bill_date: '2026-06-18',
    naming_series: 'PINV-.YYYY.-',
    purchase_order: 'PO-2026-002',
    docstatus: 1,
    is_paid: 1,
    is_return: 0,
    on_hold: 0,
    total_qty: 50,
    total_net_weight: 120,
    cost_center: 'Main - MC',
    project: 'PRJ-0002',
    payment_terms_template: '15 Days',
    terms: 'Payment due within 15 days.',
    remarks: 'Fully paid',
    in_words: 'USD Forty Five Thousand Only',
    title: 'Purchase Invoice for XYZ Electronics',
    language: 'en',
    letter_head: 'Standard',
    owner: 'Administrator',
    modified_by: 'Administrator',
    created_by: 'Administrator',
    createdAt: '2026-06-18T10:00:00Z',
    updatedAt: '2026-06-20T14:00:00Z',
    modified: '2026-06-20T14:00:00Z',
    creation: '2026-06-18T10:00:00Z',
    mode_of_payment: 'Wire Transfer',
    cash_bank_account: 'Bank - MC',
    set_warehouse: 'Stores - MC',
    incoterm: 'CIF',
    named_place: 'Mumbai Port',
    buyer: 'My Company',
    tax_withholding_group: 'None',
    is_subcontracted: 0,
    update_stock: 1
  },
  {
    name: 'PINV-2026-003',
    supplier: 'SUP-0003',
    supplier_name: 'PQR Packaging Solutions',
    company: 'My Company',
    posting_date: '2026-06-22',
    due_date: '2026-07-22',
    status: 'Partially Paid',
    grand_total: 120000,
    base_grand_total: 120000,
    total: 101695,
    net_total: 101695,
    paid_amount: 50000,
    base_paid_amount: 50000,
    outstanding_amount: 70000,
    total_advance: 0,
    write_off_amount: 0,
    currency: 'INR',
    price_list_currency: 'INR',
    conversion_rate: 1,
    total_taxes_and_charges: 18305,
    taxes_and_charges_added: 18305,
    tax_category: 'In-State',
    taxes_and_charges: 'GST 18%',
    supplier_address: 'SUP-ADDR-0003',
    address_display: 'Bangalore, Karnataka',
    contact_person: 'Raj Kumar',
    contact_display: 'Raj Kumar',
    contact_mobile: '7654321098',
    contact_email: 'raj@pqr.com',
    supplier_group: 'Local',
    tax_id: 'GSTIN456789123',
    bill_no: 'INV-2026-003',
    bill_date: '2026-06-22',
    naming_series: 'PINV-.YYYY.-',
    purchase_order: 'PO-2026-003',
    docstatus: 1,
    is_paid: 0,
    is_return: 0,
    on_hold: 0,
    total_qty: 75,
    total_net_weight: 180,
    cost_center: 'Main - MC',
    project: 'PRJ-0003',
    payment_terms_template: '30 Days',
    terms: 'Payment due within 30 days.',
    remarks: 'Partial payment received',
    in_words: 'INR One Lakh Twenty Thousand Only',
    title: 'Purchase Invoice for PQR Packaging',
    language: 'en',
    letter_head: 'Standard',
    owner: 'Administrator',
    modified_by: 'Administrator',
    created_by: 'Administrator',
    createdAt: '2026-06-22T10:00:00Z',
    updatedAt: '2026-06-25T09:00:00Z',
    modified: '2026-06-25T09:00:00Z',
    creation: '2026-06-22T10:00:00Z',
    mode_of_payment: 'Bank',
    cash_bank_account: 'Bank - MC',
    set_warehouse: 'Stores - MC',
    incoterm: 'FOB',
    named_place: 'Bangalore',
    buyer: 'My Company',
    tax_withholding_group: 'None',
    is_subcontracted: 0,
    update_stock: 1
  }
];

export default function PurchaseInvoice() {
  const navigate = useNavigate();
  
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const [loading, setLoading] = useState(false);

  const [invoices, setInvoices] = useState<PurchaseInvoice[]>(mockInvoices);

  const suppliers = [...new Set(invoices.map(inv => inv.supplier_name))];
  const statusOptions = ['Draft', 'Submitted', 'Partially Paid', 'Fully Paid', 'Overdue', 'Cancelled'];

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.name.toLowerCase().includes(filterText.toLowerCase()) ||
                         inv.supplier_name.toLowerCase().includes(filterText.toLowerCase()) ||
                         inv.purchase_order.toLowerCase().includes(filterText.toLowerCase()) ||
                         inv.bill_no.toLowerCase().includes(filterText.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || inv.status === selectedStatus;
    const matchesSupplier = selectedSupplier === 'All' || inv.supplier_name === selectedSupplier;
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'status-draft';
      case 'Submitted': return 'status-submitted';
      case 'Partially Paid': return 'status-partial';
      case 'Fully Paid': return 'status-paid';
      case 'Overdue': return 'status-overdue';
      case 'Cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Draft': return <FaFileAlt size={10} />;
      case 'Submitted': return <FaPaperPlane size={10} />;
      case 'Partially Paid': return <FaClock size={10} />;
      case 'Fully Paid': return <FaCheckCircle size={10} />;
      case 'Overdue': return <FaExclamationTriangle size={10} />;
      case 'Cancelled': return <FaTimesCircle size={10} />;
      default: return null;
    }
  };

  const handleCreate = () => {
    navigate('/purchase-invoice/new');
  };

  const handleEdit = (invoice: PurchaseInvoice) => {
    navigate(`/purchase-invoice/edit/${invoice.name}`);
  };

  const handleView = (invoice: PurchaseInvoice) => {
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  };

  const handleDelete = (invoice: PurchaseInvoice) => {
    setSelectedInvoice(invoice);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (!selectedInvoice) return;
    setLoading(true);
    
    setTimeout(() => {
      setInvoices(prev => prev.filter(inv => inv.name !== selectedInvoice.name));
      setShowDeleteModal(false);
      setLoading(false);
      toast.success('Purchase Invoice deleted successfully!');
    }, 1000);
  };

  const handleDuplicate = (invoice: PurchaseInvoice) => {
    const newInvoice: PurchaseInvoice = {
      ...invoice,
      name: `PINV-2026-${String(invoices.length + 1).padStart(3, '0')}`,
      status: 'Draft',
      docstatus: 0,
      is_paid: 0,
      paid_amount: 0,
      base_paid_amount: 0,
      outstanding_amount: invoice.grand_total,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setInvoices(prev => [...prev, newInvoice]);
    toast.success('Purchase Invoice duplicated successfully!');
  };

  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(inv => inv.status === 'Fully Paid').length;
  const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue').length;
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.grand_total, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.outstanding_amount, 0);

  return (
    <div className={`purchase-invoice-page ${theme}-theme`}>
      <style>{`
        .purchase-invoice-page {
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

        .purchase-invoice-page::-webkit-scrollbar { width: 4px; }
        .purchase-invoice-page::-webkit-scrollbar-track { background: transparent; }
        .purchase-invoice-page::-webkit-scrollbar-thumb { background: var(--border-color, #e5e7eb); border-radius: 2px; }

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

        .compact-stats {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 10px 16px;
          background: var(--card-bg, #ffffff);
          border-radius: 8px;
          border: 1px solid var(--border-color, #e5e7eb);
          flex-shrink: 0;
          flex-wrap: wrap;
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

        .stat-paid {
          color: #10b981;
        }

        .stat-overdue {
          color: #ef4444;
        }

        .stat-outstanding {
          color: #f59e0b;
        }

        .stat-divider {
          width: 1px;
          height: 20px;
          background: var(--border-color, #e5e7eb);
        }

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
          flex-wrap: wrap;
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

        .invoice-container {
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

        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 1200px;
        }

        .invoice-table thead {
          background: var(--layout-bg, #f8f9fa);
          border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .invoice-table th {
          padding: 10px 14px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary, #6b7280);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .invoice-table td {
          padding: 10px 14px;
          border-bottom: 1px solid var(--border-color, #f3f4f6);
          color: var(--text-primary, #374151);
        }

        .invoice-row {
          transition: background 0.15s ease;
        }

        .invoice-row:hover {
          background: var(--nav-hover, #f9fafb);
        }

        .number-cell {
          font-weight: 600;
          color: var(--primary-color, #6366f1);
          font-size: 12px;
        }

        .supplier-cell {
          font-weight: 500;
          color: var(--text-primary, #1f2433);
        }

        .po-cell {
          font-size: 12px;
          color: var(--text-secondary, #6b7280);
        }

        .date-cell {
          font-size: 12px;
          color: var(--text-secondary, #6b7280);
        }

        .amount-cell {
          font-weight: 600;
          color: var(--text-primary, #1f2433);
        }

        .paid-cell {
          font-weight: 500;
          color: #10b981;
        }

        .balance-cell {
          font-weight: 600;
          color: #f59e0b;
        }

        .balance-cell.overdue {
          color: #ef4444;
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

        .status-paid {
          background: #d1fae5;
          color: #065f46;
        }

        .status-overdue {
          background: #fee2e2;
          color: #991b1b;
        }

        .status-cancelled {
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
          max-width: 750px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        }

        .view-modal { max-width: 800px; }
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
          min-width: 120px;
        }

        .view-row span {
          color: var(--text-primary, #1f2433);
        }

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

        @media (max-width: 768px) {
          .purchase-invoice-page { padding: 12px 16px; }
          .page-header { flex-direction: column; align-items: stretch; }
          .header-actions { flex-wrap: wrap; justify-content: flex-end; }
          .search-bar { flex-direction: column; align-items: stretch; }
          .filter-wrapper { justify-content: space-between; }
          .invoice-table { min-width: 800px; }
          .modal-container { max-width: 100%; margin: 10px; }
          .modal-footer { flex-direction: column; }
          .modal-footer button { width: 100%; justify-content: center; }
          .view-grid { grid-template-columns: 1fr; }
          .compact-stats { flex-wrap: wrap; gap: 8px; padding: 8px 12px; }
          .stat-divider { display: none; }
        }

        @media (max-width: 480px) {
          .purchase-invoice-page { padding: 8px 12px; }
          .invoice-table { font-size: 12px; min-width: 700px; }
          .invoice-table th, .invoice-table td { padding: 6px 10px; }
          .action-group { gap: 0; }
          .action-btn { width: 24px; height: 24px; }
        }

        .dark-theme .purchase-invoice-page { background: var(--layout-bg, #0f172a); }
        .dark-theme .page-title { color: var(--text-primary, #f8fafc); }
        .dark-theme .badge { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); color: var(--text-secondary, #94a3b8); }
        .dark-theme .search-wrapper { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); }
        .dark-theme .search-input { color: var(--text-primary, #f8fafc); }
        .dark-theme .search-input::placeholder { color: var(--text-secondary, #64748b); }
        .dark-theme .filter-toggle { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); color: var(--text-secondary, #94a3b8); }
        .dark-theme .filter-toggle:hover { background: var(--nav-hover, rgba(255,255,255,0.05)); }
        .dark-theme .expandable-filters { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); }
        .dark-theme .filter-group select { background: var(--input-bg, #0f172a); border-color: var(--border-color, #334155); color: var(--text-primary, #f8fafc); }
        .dark-theme .invoice-container { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); }
        .dark-theme .invoice-table thead { background: var(--layout-bg, #0f172a); }
        .dark-theme .invoice-table th { color: var(--text-secondary, #94a3b8); border-bottom-color: var(--border-color, #334155); }
        .dark-theme .invoice-table td { border-bottom-color: var(--border-color, #334155); color: var(--text-primary, #f8fafc); }
        .dark-theme .invoice-row:hover { background: var(--nav-hover, rgba(255,255,255,0.05)); }
        .dark-theme .number-cell { color: var(--primary-color, #818cf8); }
        .dark-theme .supplier-cell { color: var(--text-primary, #f8fafc); }
        .dark-theme .po-cell { color: var(--text-secondary, #94a3b8); }
        .dark-theme .date-cell { color: var(--text-secondary, #94a3b8); }
        .dark-theme .amount-cell { color: var(--text-primary, #f8fafc); }
        .dark-theme .paid-cell { color: #34d399; }
        .dark-theme .balance-cell { color: #fbbf24; }
        .dark-theme .balance-cell.overdue { color: #f87171; }
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
        .dark-theme .status-draft { background: rgba(107,114,128,0.2); color: #9ca3af; }
        .dark-theme .status-submitted { background: rgba(59,130,246,0.2); color: #60a5fa; }
        .dark-theme .status-partial { background: rgba(251,191,36,0.2); color: #fbbf24; }
        .dark-theme .status-paid { background: rgba(16,185,129,0.2); color: #34d399; }
        .dark-theme .status-overdue { background: rgba(239,68,68,0.2); color: #f87171; }
        .dark-theme .status-cancelled { background: rgba(107,114,128,0.2); color: #9ca3af; }
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
      `}</style>

      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Purchase Invoices</h1>
          <span className="badge">{invoices.length}</span>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={handleCreate}>
            <FaPlus size={12} /> New Invoice
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="compact-stats">
        <div className="stat-item">
          <span className="stat-label">Total</span>
          <span className="stat-value">{totalInvoices}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-label">Paid</span>
          <span className="stat-value stat-paid">{paidInvoices}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-label">Overdue</span>
          <span className="stat-value stat-overdue">{overdueInvoices}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-label">Outstanding</span>
          <span className="stat-value stat-outstanding">{totalOutstanding.toLocaleString()}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-label">Total Amount</span>
          <span className="stat-value">₹{totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="search-bar">
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by invoice #, supplier, PO or bill no..."
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
          <span className="result-count">{filteredInvoices.length} of {invoices.length}</span>
        </div>
      </div>

      {/* Filters */}
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
            <select defaultValue="all">
              <option value="all">All Currencies</option>
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <button className="apply-filters">Apply</button>
        </div>
      )}

      {/* Invoice List */}
      <div className="invoice-container">
        {filteredInvoices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FaReceipt size={48} />
            </div>
            <h3>No purchase invoices found</h3>
            <p>Create your first purchase invoice to get started</p>
            <button className="btn-primary" onClick={handleCreate}>
              <FaPlus size={12} /> New Invoice
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Supplier</th>
                  <th>PO #</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Outstanding</th>
                  <th>Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.name} className="invoice-row">
                    <td className="number-cell">{inv.name}</td>
                    <td className="supplier-cell">{inv.supplier_name}</td>
                    <td className="po-cell">{inv.purchase_order}</td>
                    <td className="date-cell">{new Date(inv.posting_date).toLocaleDateString()}</td>
                    <td className="date-cell">{new Date(inv.due_date).toLocaleDateString()}</td>
                    <td className="amount-cell">{inv.currency} {inv.grand_total.toLocaleString()}</td>
                    <td className="paid-cell">{inv.currency} {inv.paid_amount.toLocaleString()}</td>
                    <td className={`balance-cell ${inv.outstanding_amount > 0 && new Date(inv.due_date) < new Date() ? 'overdue' : ''}`}>
                      {inv.currency} {inv.outstanding_amount.toLocaleString()}
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusColor(inv.status)}`}>
                        {getStatusIcon(inv.status)}
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-group">
                        <button className="action-btn view" title="View" onClick={() => handleView(inv)}>
                          <FaEye size={12} />
                        </button>
                        <button className="action-btn edit" title="Edit" onClick={() => handleEdit(inv)}>
                          <FaEdit size={12} />
                        </button>
                        <button className="action-btn copy" title="Duplicate" onClick={() => handleDuplicate(inv)}>
                          <FaCopy size={12} />
                        </button>
                        <button className="action-btn delete" title="Delete" onClick={() => handleDelete(inv)}>
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
        <span>{filteredInvoices.length} of {invoices.length} invoices</span>
        <div className="footer-actions">
          <span className="conversion-badge">
            <FaCheckCircle size={11} /> {paidInvoices} paid
          </span>
        </div>
      </div>

      {/* View Modal */}
      {showViewModal && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-container view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedInvoice.name}</h2>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="view-grid">
                <div className="view-section">
                  <h4><FaFileInvoice /> Invoice Details</h4>
                  <div className="view-row"><label>Number:</label><span>{selectedInvoice.name}</span></div>
                  <div className="view-row"><label>Status:</label><span className={`status-badge ${getStatusColor(selectedInvoice.status)}`}>{selectedInvoice.status}</span></div>
                  <div className="view-row"><label>Date:</label><span>{new Date(selectedInvoice.posting_date).toLocaleDateString()}</span></div>
                  <div className="view-row"><label>Due Date:</label><span>{new Date(selectedInvoice.due_date).toLocaleDateString()}</span></div>
                  <div className="view-row"><label>Bill No:</label><span>{selectedInvoice.bill_no || 'N/A'}</span></div>
                </div>
                <div className="view-section">
                  <h4><FaUser /> Supplier Details</h4>
                  <div className="view-row"><label>Supplier:</label><span>{selectedInvoice.supplier_name}</span></div>
                  <div className="view-row"><label>Code:</label><span>{selectedInvoice.supplier}</span></div>
                  <div className="view-row"><label>Contact:</label><span>{selectedInvoice.contact_person}</span></div>
                  <div className="view-row"><label>Phone:</label><span>{selectedInvoice.contact_mobile}</span></div>
                  <div className="view-row"><label>Email:</label><span>{selectedInvoice.contact_email}</span></div>
                </div>
                <div className="view-section">
                  <h4><FaRupeeSign /> Financial Summary</h4>
                  <div className="view-row"><label>Total:</label><span className="amount-cell">{selectedInvoice.currency} {selectedInvoice.grand_total.toLocaleString()}</span></div>
                  <div className="view-row"><label>Net Total:</label><span>{selectedInvoice.currency} {selectedInvoice.net_total.toLocaleString()}</span></div>
                  <div className="view-row"><label>Tax:</label><span>{selectedInvoice.currency} {selectedInvoice.total_taxes_and_charges.toLocaleString()}</span></div>
                  <div className="view-row"><label>Paid:</label><span className="paid-cell">{selectedInvoice.currency} {selectedInvoice.paid_amount.toLocaleString()}</span></div>
                  <div className="view-row"><label>Outstanding:</label><span className="balance-cell">{selectedInvoice.currency} {selectedInvoice.outstanding_amount.toLocaleString()}</span></div>
                </div>
                <div className="view-section">
                  <h4><FaBox /> Item Details</h4>
                  <div className="view-row"><label>Total Qty:</label><span>{selectedInvoice.total_qty}</span></div>
                  <div className="view-row"><label>Net Weight:</label><span>{selectedInvoice.total_net_weight}</span></div>
                  <div className="view-row"><label>Warehouse:</label><span>{selectedInvoice.set_warehouse}</span></div>
                  <div className="view-row"><label>Incoterm:</label><span>{selectedInvoice.incoterm}</span></div>
                </div>
                <div className="view-section full-width">
                  <h4><FaInfoCircle /> Additional Information</h4>
                  <div className="view-row"><label>Company:</label><span>{selectedInvoice.company}</span></div>
                  <div className="view-row"><label>Project:</label><span>{selectedInvoice.project || 'N/A'}</span></div>
                  <div className="view-row"><label>Cost Center:</label><span>{selectedInvoice.cost_center}</span></div>
                  <div className="view-row"><label>Payment Terms:</label><span>{selectedInvoice.payment_terms_template}</span></div>
                  <div className="view-row"><label>Remarks:</label><span>{selectedInvoice.remarks}</span></div>
                  <div className="view-row"><label>Terms:</label><span>{selectedInvoice.terms}</span></div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
              <button className="btn-primary" onClick={() => handleEdit(selectedInvoice)}>
                <FaEdit size={12} /> Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-container delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Purchase Invoice</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body delete-body">
              <div className="delete-icon">
                <FaTrash size={48} />
              </div>
              <h3>Are you sure?</h3>
              <p>You are about to delete <strong>{selectedInvoice.name}</strong></p>
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