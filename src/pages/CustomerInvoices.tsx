import React, { useState } from 'react';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch, 
  FaFilter, 
  FaDownload, 
  FaPrint,
  FaFileAlt,
  FaExclamationTriangle,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaFileInvoice,
  FaUser,
  FaFilePdf,
  FaFileExcel,
  FaPaperPlane
} from 'react-icons/fa';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gstin?: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

interface CustomerInvoice {
  id: string;
  invoiceNumber: string;
  customer: Customer;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
  paymentTerms: string;
  notes?: string;
  createdAt: string;
}

const CustomerInvoices: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<CustomerInvoice | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Sample data - In real app, this would come from API
  const invoices: CustomerInvoice[] = [
    {
      id: '1',
      invoiceNumber: 'INV-2024-001',
      customer: {
        id: 'c1',
        name: 'ABC Traders',
        email: 'info@abctraders.com',
        phone: '+91 98765 43210',
        address: '123, Business Park, Mumbai - 400001',
        gstin: '27AABCU1234D1Z1'
      },
      date: '2024-01-15',
      dueDate: '2024-02-14',
      items: [
        {
          id: 'i1',
          description: 'Product A - 100 units',
          quantity: 100,
          rate: 500,
          amount: 50000,
          taxRate: 18,
          taxAmount: 9000,
          total: 59000
        },
        {
          id: 'i2',
          description: 'Product B - 50 units',
          quantity: 50,
          rate: 750,
          amount: 37500,
          taxRate: 12,
          taxAmount: 4500,
          total: 42000
        }
      ],
      subtotal: 87500,
      taxTotal: 13500,
      total: 101000,
      status: 'Paid',
      paymentTerms: 'Net 30',
      notes: 'Payment received via bank transfer',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      invoiceNumber: 'INV-2024-002',
      customer: {
        id: 'c2',
        name: 'XYZ Enterprises',
        email: 'contact@xyzent.com',
        phone: '+91 87654 32109',
        address: '456, Industrial Estate, Pune - 411001',
        gstin: '27BXYZU5678D1Z1'
      },
      date: '2024-01-20',
      dueDate: '2024-02-19',
      items: [
        {
          id: 'i3',
          description: 'Service A - Monthly Retainer',
          quantity: 1,
          rate: 50000,
          amount: 50000,
          taxRate: 18,
          taxAmount: 9000,
          total: 59000
        },
        {
          id: 'i4',
          description: 'Consulting Hours - 20 hrs',
          quantity: 20,
          rate: 1500,
          amount: 30000,
          taxRate: 18,
          taxAmount: 5400,
          total: 35400
        }
      ],
      subtotal: 80000,
      taxTotal: 14400,
      total: 94400,
      status: 'Sent',
      paymentTerms: 'Net 15',
      notes: 'Follow up on payment',
      createdAt: '2024-01-20'
    },
    {
      id: '3',
      invoiceNumber: 'INV-2024-003',
      customer: {
        id: 'c3',
        name: 'PQR Solutions',
        email: 'info@pqrsolutions.com',
        phone: '+91 76543 21098',
        address: '789, Tech Park, Bangalore - 560001',
        gstin: '27CPQRU9012D1Z1'
      },
      date: '2024-02-01',
      dueDate: '2024-03-02',
      items: [
        {
          id: 'i5',
          description: 'Software License - 10 users',
          quantity: 10,
          rate: 2000,
          amount: 20000,
          taxRate: 18,
          taxAmount: 3600,
          total: 23600
        },
        {
          id: 'i6',
          description: 'Annual Maintenance',
          quantity: 1,
          rate: 25000,
          amount: 25000,
          taxRate: 18,
          taxAmount: 4500,
          total: 29500
        }
      ],
      subtotal: 45000,
      taxTotal: 8100,
      total: 53100,
      status: 'Overdue',
      paymentTerms: 'Net 30',
      notes: 'Payment overdue - follow up immediately',
      createdAt: '2024-02-01'
    },
    {
      id: '4',
      invoiceNumber: 'INV-2024-004',
      customer: {
        id: 'c4',
        name: 'LMN Group',
        email: 'contact@lmngroup.com',
        phone: '+91 65432 10987',
        address: '321, Corporate Tower, Delhi - 110001',
        gstin: '27DLMNU3456D1Z1'
      },
      date: '2024-02-05',
      dueDate: '2024-03-06',
      items: [
        {
          id: 'i7',
          description: 'Product C - 200 units',
          quantity: 200,
          rate: 300,
          amount: 60000,
          taxRate: 12,
          taxAmount: 7200,
          total: 67200
        }
      ],
      subtotal: 60000,
      taxTotal: 7200,
      total: 67200,
      status: 'Draft',
      paymentTerms: 'Net 45',
      notes: 'Awaiting approval from customer',
      createdAt: '2024-02-05'
    },
    {
      id: '5',
      invoiceNumber: 'INV-2024-005',
      customer: {
        id: 'c5',
        name: 'RST Industries',
        email: 'info@rstind.com',
        phone: '+91 54321 09876',
        address: '654, Industrial Area, Chennai - 600001',
        gstin: '27ERSTU7890D1Z1'
      },
      date: '2024-02-10',
      dueDate: '2024-03-11',
      items: [
        {
          id: 'i8',
          description: 'Machinery Parts - 50 units',
          quantity: 50,
          rate: 1000,
          amount: 50000,
          taxRate: 18,
          taxAmount: 9000,
          total: 59000
        },
        {
          id: 'i9',
          description: 'Installation Services',
          quantity: 1,
          rate: 15000,
          amount: 15000,
          taxRate: 18,
          taxAmount: 2700,
          total: 17700
        }
      ],
      subtotal: 65000,
      taxTotal: 11700,
      total: 76700,
      status: 'Cancelled',
      paymentTerms: 'Net 30',
      notes: 'Order cancelled by customer',
      createdAt: '2024-02-10'
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Paid':
        return <span className="status-badge paid"><FaCheckCircle /> Paid</span>;
      case 'Sent':
        return <span className="status-badge sent"><FaPaperPlane /> Sent</span>;
      case 'Draft':
        return <span className="status-badge draft"><FaFileAlt /> Draft</span>;
      case 'Overdue':
        return <span className="status-badge overdue"><FaExclamationTriangle /> Overdue</span>;
      case 'Cancelled':
        return <span className="status-badge cancelled"><FaTimesCircle /> Cancelled</span>;
      default:
        return <span className="status-badge draft">Unknown</span>;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Paid': return '#10b981';
      case 'Sent': return '#3b82f6';
      case 'Draft': return '#94a3b8';
      case 'Overdue': return '#ef4444';
      case 'Cancelled': return '#f59e0b';
      default: return '#94a3b8';
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          invoice.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || invoice.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getTotalInvoices = () => filteredInvoices.length;
  const getTotalAmount = () => filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const getPaidAmount = () => filteredInvoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.total, 0);
  const getOverdueCount = () => filteredInvoices.filter(inv => inv.status === 'Overdue').length;

  const renderListView = () => {
    return (
      <div className="invoice-list-view">
        <table className="invoice-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Due Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map(invoice => (
              <tr 
                key={invoice.id}
                className={selectedInvoice?.id === invoice.id ? 'selected' : ''}
                onClick={() => setSelectedInvoice(invoice)}
              >
                <td className="invoice-number">{invoice.invoiceNumber}</td>
                <td>
                  <div className="customer-info">
                    <span className="customer-name">{invoice.customer.name}</span>
                    <span className="customer-phone">{invoice.customer.phone}</span>
                  </div>
                </td>
                <td>{formatDate(invoice.date)}</td>
                <td>{formatDate(invoice.dueDate)}</td>
                <td className="amount-cell">{formatCurrency(invoice.total)}</td>
                <td>{getStatusBadge(invoice.status)}</td>
                <td>
                  <div className="table-actions">
                    <button className="action-btn-small" title="View Invoice" onClick={(e) => {
                      e.stopPropagation();
                      setSelectedInvoice(invoice);
                      setShowInvoiceModal(true);
                    }}>
                      <FaEye />
                    </button>
                    <button className="action-btn-small" title="Edit" onClick={(e) => e.stopPropagation()}>
                      <FaEdit />
                    </button>
                    <button className="action-btn-small" title="Delete" onClick={(e) => e.stopPropagation()}>
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderCardView = () => {
    return (
      <div className="invoice-card-view">
        <div className="invoice-card-grid">
          {filteredInvoices.map(invoice => (
            <div 
              key={invoice.id}
              className={`invoice-card ${selectedInvoice?.id === invoice.id ? 'selected' : ''}`}
              onClick={() => setSelectedInvoice(invoice)}
            >
              <div className="invoice-card-header" style={{ borderLeftColor: getStatusColor(invoice.status) }}>
                <div className="invoice-card-title">
                  <span className="invoice-card-number">{invoice.invoiceNumber}</span>
                  <span className="invoice-card-status">{getStatusBadge(invoice.status)}</span>
                </div>
                <div className="invoice-card-customer">
                  <FaUser className="customer-icon" />
                  <span>{invoice.customer.name}</span>
                </div>
              </div>
              <div className="invoice-card-body">
                <div className="invoice-card-detail">
                  <span className="detail-label">Date</span>
                  <span className="detail-value">{formatDate(invoice.date)}</span>
                </div>
                <div className="invoice-card-detail">
                  <span className="detail-label">Due Date</span>
                  <span className="detail-value">{formatDate(invoice.dueDate)}</span>
                </div>
                <div className="invoice-card-detail">
                  <span className="detail-label">Items</span>
                  <span className="detail-value">{invoice.items.length} items</span>
                </div>
                <div className="invoice-card-detail">
                  <span className="detail-label">Total</span>
                  <span className="detail-value total">{formatCurrency(invoice.total)}</span>
                </div>
              </div>
              <div className="invoice-card-footer">
                <button className="card-action-btn" onClick={(e) => {
                  e.stopPropagation();
                  setSelectedInvoice(invoice);
                  setShowInvoiceModal(true);
                }}>
                  <FaEye /> View
                </button>
                <button className="card-action-btn" onClick={(e) => e.stopPropagation()}>
                  <FaFilePdf /> PDF
                </button>
                <button className="card-action-btn" onClick={(e) => e.stopPropagation()}>
                  <FaPaperPlane /> Send
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        /* ===== CUSTOMER INVOICES PAGE ===== */
        .invoice-page {
          padding: 24px;
          background: #f8fafc;
          min-height: 100vh;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* ===== HEADER ===== */
        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          padding: 20px 24px;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        }

        .invoice-header-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .invoice-page-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0;
        }

        .invoice-page-title .title-icon {
          color: #2c7a8a;
        }

        .invoice-page-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .invoice-header-right {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        /* ===== BUTTONS ===== */
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #2c7a8a;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          background: #1f5f6b;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(44, 122, 138, 0.3);
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #ffffff;
          color: #64748b;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: #f1f5f9;
          border-color: #2c7a8a;
          color: #2c7a8a;
        }

        .btn-success {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #10b981;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-success:hover {
          background: #059669;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .btn-danger {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #ef4444;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-danger:hover {
          background: #dc2626;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        /* ===== STATS BAR ===== */
        .invoice-stats-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .invoice-stat-item {
          background: #ffffff;
          padding: 16px 20px;
          border-radius: 10px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .invoice-stat-label {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }

        .invoice-stat-value {
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
        }

        .invoice-stat-value.text-green {
          color: #10b981;
        }
        .invoice-stat-value.text-red {
          color: #ef4444;
        }
        .invoice-stat-value.text-blue {
          color: #3b82f6;
        }
        .invoice-stat-value.text-purple {
          color: #8b5cf6;
        }

        /* ===== TOOLBAR ===== */
        .invoice-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .invoice-toolbar-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
          flex-wrap: wrap;
        }

        .invoice-search-box {
          position: relative;
          flex: 1;
          min-width: 280px;
        }

        .invoice-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .invoice-search-input {
          width: 100%;
          padding: 10px 40px 10px 40px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          background: #f8fafc;
          color: #1e293b;
          transition: all 0.2s;
        }

        .invoice-search-input:focus {
          outline: none;
          border-color: #2c7a8a;
          box-shadow: 0 0 0 3px rgba(44, 122, 138, 0.1);
          background: #ffffff;
        }

        .invoice-clear-search {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 18px;
          color: #94a3b8;
          cursor: pointer;
          padding: 0 4px;
        }

        .invoice-clear-search:hover {
          color: #1e293b;
        }

        .invoice-filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .invoice-filter-select {
          padding: 10px 36px 10px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          background: #f8fafc;
          color: #1e293b;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M6 8L1 3h10z' fill='%2364748b'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
        }

        .invoice-filter-select:focus {
          outline: none;
          border-color: #2c7a8a;
        }

        .invoice-toolbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .invoice-view-toggle {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: #f1f5f9;
          border-radius: 8px;
        }

        .invoice-view-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px 12px;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .invoice-view-btn:hover {
          color: #64748b;
        }

        .invoice-view-btn.active {
          background: #ffffff;
          color: #2c7a8a;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        /* ===== CONTENT ===== */
        .invoice-content {
          display: flex;
          gap: 24px;
        }

        .invoice-main {
          flex: 1;
          min-width: 0;
        }

        /* ===== LIST VIEW ===== */
        .invoice-list-view {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
          overflow: hidden;
        }

        .invoice-table {
          width: 100%;
          border-collapse: collapse;
        }

        .invoice-table thead {
          background: #f8fafc;
        }

        .invoice-table th {
          padding: 12px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e2e8f0;
        }

        .invoice-table td {
          padding: 12px 16px;
          font-size: 14px;
          color: #1e293b;
          border-bottom: 1px solid #f1f5f9;
        }

        .invoice-table tbody tr {
          cursor: pointer;
          transition: background 0.15s;
        }

        .invoice-table tbody tr:hover {
          background: #f8fafc;
        }

        .invoice-table tbody tr.selected {
          background: #f0f9ff;
        }

        .invoice-number {
          font-weight: 600;
          color: #2c7a8a;
        }

        .customer-info {
          display: flex;
          flex-direction: column;
        }

        .customer-name {
          font-weight: 500;
        }

        .customer-phone {
          font-size: 12px;
          color: #94a3b8;
        }

        .amount-cell {
          font-weight: 600;
        }

        .table-actions {
          display: flex;
          gap: 4px;
        }

        .action-btn-small {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 4px;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 12px;
        }

        .action-btn-small:hover {
          background: #f1f5f9;
          color: #1e293b;
        }

        /* ===== STATUS BADGES ===== */
        .status-badge {
          font-size: 12px;
          padding: 4px 12px;
          border-radius: 12px;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .status-badge.paid {
          color: #10b981;
          background: #ecfdf5;
        }

        .status-badge.sent {
          color: #3b82f6;
          background: #eff6ff;
        }

        .status-badge.draft {
          color: #94a3b8;
          background: #f1f5f9;
        }

        .status-badge.overdue {
          color: #ef4444;
          background: #fef2f2;
        }

        .status-badge.cancelled {
          color: #f59e0b;
          background: #fffbeb;
        }

        /* ===== CARD VIEW ===== */
        .invoice-card-view {
          display: flex;
          flex-direction: column;
        }

        .invoice-card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }

        .invoice-card {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;
        }

        .invoice-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        .invoice-card.selected {
          border: 2px solid #2c7a8a;
        }

        .invoice-card-header {
          padding: 16px 20px;
          border-left: 4px solid;
          background: #f8fafc;
        }

        .invoice-card-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .invoice-card-number {
          font-size: 16px;
          font-weight: 600;
          color: #2c7a8a;
        }

        .invoice-card-customer {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #1e293b;
        }

        .invoice-card-customer .customer-icon {
          color: #94a3b8;
        }

        .invoice-card-body {
          padding: 16px 20px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .invoice-card-detail {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .invoice-card-detail .detail-label {
          font-size: 11px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .invoice-card-detail .detail-value {
          font-size: 14px;
          color: #1e293b;
        }

        .invoice-card-detail .detail-value.total {
          font-size: 18px;
          font-weight: 700;
          color: #2c7a8a;
        }

        .invoice-card-footer {
          padding: 12px 20px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          gap: 8px;
        }

        .card-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: #ffffff;
          color: #64748b;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .card-action-btn:hover {
          background: #f1f5f9;
          border-color: #2c7a8a;
          color: #2c7a8a;
        }

        /* ===== SIDEBAR ===== */
        .invoice-sidebar {
          width: 340px;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
          padding: 0;
          max-height: calc(100vh - 320px);
          position: sticky;
          top: 24px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .invoice-sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e2e8f0;
        }

        .invoice-sidebar-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .invoice-close-sidebar {
          background: none;
          border: none;
          font-size: 24px;
          color: #94a3b8;
          cursor: pointer;
          padding: 0 4px;
        }

        .invoice-close-sidebar:hover {
          color: #1e293b;
        }

        .invoice-sidebar-content {
          padding: 20px;
          overflow-y: auto;
          flex: 1;
        }

        .invoice-detail-field {
          margin-bottom: 16px;
        }

        .invoice-detail-field label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .invoice-detail-value {
          font-size: 14px;
          color: #1e293b;
          display: block;
        }

        .invoice-detail-value.total-large {
          font-size: 24px;
          font-weight: 700;
          color: #2c7a8a;
        }

        .invoice-sidebar-actions {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .full-width {
          width: 100%;
          justify-content: center;
        }

        /* ===== INVOICE DETAIL MODAL ===== */
        .invoice-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .invoice-modal-content {
          background: #ffffff;
          border-radius: 16px;
          width: 100%;
          max-width: 900px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        }

        .invoice-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .invoice-modal-header h2 {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .invoice-modal-close {
          background: none;
          border: none;
          font-size: 28px;
          color: #94a3b8;
          cursor: pointer;
          padding: 0 4px;
        }

        .invoice-modal-close:hover {
          color: #1e293b;
        }

        .invoice-modal-body {
          padding: 24px;
        }

        .invoice-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .invoice-detail-grid-item label {
          display: block;
          font-size: 12px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .invoice-detail-grid-item .value {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin-top: 4px;
        }

        .invoice-items-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
        }

        .invoice-items-table th {
          padding: 10px 12px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          border-bottom: 2px solid #e2e8f0;
        }

        .invoice-items-table td {
          padding: 10px 12px;
          font-size: 14px;
          border-bottom: 1px solid #f1f5f9;
        }

        .invoice-items-table .amount {
          font-weight: 500;
          text-align: right;
        }

        .invoice-totals {
          margin-top: 16px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .invoice-totals .total-row {
          display: flex;
          justify-content: space-between;
          width: 300px;
          padding: 4px 0;
        }

        .invoice-totals .total-row.grand-total {
          font-weight: 700;
          font-size: 18px;
          border-top: 2px solid #e2e8f0;
          padding-top: 8px;
          margin-top: 4px;
          color: #2c7a8a;
        }

        /* ===== MODAL ===== */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .modal-content {
          background: #ffffff;
          border-radius: 16px;
          width: 100%;
          max-width: 700px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h2 {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 28px;
          color: #94a3b8;
          cursor: pointer;
          padding: 0 4px;
        }

        .modal-close:hover {
          color: #1e293b;
        }

        .modal-body {
          padding: 24px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          margin-bottom: 6px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          color: #1e293b;
          background: #f8fafc;
          transition: all 0.2s;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #2c7a8a;
          box-shadow: 0 0 0 3px rgba(44, 122, 138, 0.1);
          background: #ffffff;
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid #e2e8f0;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 1200px) {
          .invoice-sidebar {
            width: 280px;
          }
        }

        @media (max-width: 992px) {
          .invoice-content {
            flex-direction: column;
          }
          
          .invoice-sidebar {
            width: 100%;
            max-height: 400px;
            position: relative;
            top: 0;
          }
          
          .invoice-stats-bar {
            grid-template-columns: repeat(2, 1fr);
          }

          .invoice-detail-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 768px) {
          .invoice-page {
            padding: 16px;
          }
          
          .invoice-header {
            flex-direction: column;
            gap: 16px;
          }
          
          .invoice-header-right {
            width: 100%;
            flex-wrap: wrap;
          }
          
          .invoice-header-right .btn-primary,
          .invoice-header-right .btn-secondary {
            flex: 1;
            justify-content: center;
          }
          
          .invoice-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          
          .invoice-toolbar-left {
            flex-direction: column;
            align-items: stretch;
          }
          
          .invoice-search-box {
            min-width: auto;
          }
          
          .invoice-filter-group {
            flex-wrap: wrap;
          }
          
          .invoice-filter-select {
            flex: 1;
          }
          
          .invoice-toolbar-right {
            justify-content: center;
          }
          
          .invoice-stats-bar {
            grid-template-columns: 1fr 1fr;
          }
          
          .invoice-table {
            font-size: 13px;
          }
          
          .invoice-table th,
          .invoice-table td {
            padding: 8px 10px;
          }
          
          .invoice-card-grid {
            grid-template-columns: 1fr;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .modal-content,
          .invoice-modal-content {
            margin: 16px;
            max-height: 95vh;
          }

          .invoice-detail-grid {
            grid-template-columns: 1fr;
          }

          .invoice-totals .total-row {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .invoice-stats-bar {
            grid-template-columns: 1fr;
          }
          
          .invoice-table {
            display: block;
            overflow-x: auto;
          }
          
          .invoice-header-right .btn-primary,
          .invoice-header-right .btn-secondary {
            font-size: 12px;
            padding: 8px 12px;
          }
        }
      `}</style>

      <div className="invoice-page">
        {/* Page Header */}
        <div className="invoice-header">
          <div className="invoice-header-left">
            <h1 className="invoice-page-title">
              <FaFileInvoice className="title-icon" />
              Customer Invoices
            </h1>
            <p className="invoice-page-subtitle">Manage all customer invoices and track payments</p>
          </div>
          <div className="invoice-header-right">
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              <FaPlus /> New Invoice
            </button>
            <button className="btn-secondary">
              <FaDownload /> Export
            </button>
            <button className="btn-secondary">
              <FaPrint /> Print
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="invoice-stats-bar">
          <div className="invoice-stat-item">
            <span className="invoice-stat-label">Total Invoices</span>
            <span className="invoice-stat-value">{getTotalInvoices()}</span>
          </div>
          <div className="invoice-stat-item">
            <span className="invoice-stat-label">Total Amount</span>
            <span className="invoice-stat-value text-blue">{formatCurrency(getTotalAmount())}</span>
          </div>
          <div className="invoice-stat-item">
            <span className="invoice-stat-label">Paid Amount</span>
            <span className="invoice-stat-value text-green">{formatCurrency(getPaidAmount())}</span>
          </div>
          <div className="invoice-stat-item">
            <span className="invoice-stat-label">Overdue</span>
            <span className="invoice-stat-value text-red">{getOverdueCount()}</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="invoice-toolbar">
          <div className="invoice-toolbar-left">
            <div className="invoice-search-box">
              <FaSearch className="invoice-search-icon" />
              <input
                type="text"
                placeholder="Search by invoice number or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="invoice-search-input"
              />
              {searchTerm && (
                <button 
                  className="invoice-clear-search"
                  onClick={() => setSearchTerm('')}
                >
                  ×
                </button>
              )}
            </div>
            <div className="invoice-filter-group">
              <select 
                className="invoice-filter-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <button className="btn-secondary">
                <FaFilter /> More Filters
              </button>
            </div>
          </div>
          <div className="invoice-toolbar-right">
            <div className="invoice-view-toggle">
              <button 
                className={`invoice-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <FaFileAlt />
              </button>
              <button 
                className={`invoice-view-btn ${viewMode === 'card' ? 'active' : ''}`}
                onClick={() => setViewMode('card')}
                title="Card View"
              >
                <FaFileInvoice />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="invoice-content">
          <div className="invoice-main">
            {viewMode === 'list' && renderListView()}
            {viewMode === 'card' && renderCardView()}
          </div>

          {/* Sidebar - Invoice Details */}
          {selectedInvoice && !showInvoiceModal && (
            <div className="invoice-sidebar">
              <div className="invoice-sidebar-header">
                <h3>Invoice Details</h3>
                <button 
                  className="invoice-close-sidebar"
                  onClick={() => setSelectedInvoice(null)}
                >
                  ×
                </button>
              </div>
              <div className="invoice-sidebar-content">
                <div className="invoice-detail-field">
                  <label>Invoice Number</label>
                  <span className="invoice-detail-value">{selectedInvoice.invoiceNumber}</span>
                </div>
                <div className="invoice-detail-field">
                  <label>Customer</label>
                  <span className="invoice-detail-value">{selectedInvoice.customer.name}</span>
                  <span className="invoice-detail-value" style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {selectedInvoice.customer.phone} • {selectedInvoice.customer.email}
                  </span>
                </div>
                <div className="invoice-detail-field">
                  <label>Date</label>
                  <span className="invoice-detail-value">{formatDate(selectedInvoice.date)}</span>
                </div>
                <div className="invoice-detail-field">
                  <label>Due Date</label>
                  <span className="invoice-detail-value">{formatDate(selectedInvoice.dueDate)}</span>
                </div>
                <div className="invoice-detail-field">
                  <label>Status</label>
                  <span className="invoice-detail-value">{getStatusBadge(selectedInvoice.status)}</span>
                </div>
                <div className="invoice-detail-field">
                  <label>Total Amount</label>
                  <span className="invoice-detail-value total-large">{formatCurrency(selectedInvoice.total)}</span>
                </div>
                <div className="invoice-detail-field">
                  <label>Payment Terms</label>
                  <span className="invoice-detail-value">{selectedInvoice.paymentTerms}</span>
                </div>
                {selectedInvoice.notes && (
                  <div className="invoice-detail-field">
                    <label>Notes</label>
                    <span className="invoice-detail-value">{selectedInvoice.notes}</span>
                  </div>
                )}
                <div className="invoice-sidebar-actions">
                  <button className="btn-primary full-width" onClick={() => setShowInvoiceModal(true)}>
                    <FaEye /> View Full Invoice
                  </button>
                  <button className="btn-success full-width">
                    <FaPaperPlane /> Send Email
                  </button>
                  <button className="btn-secondary full-width">
                    <FaFilePdf /> Download PDF
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Create Invoice Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create New Invoice</h2>
                <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Customer *</label>
                    <select className="form-select">
                      <option value="">Select Customer</option>
                      <option value="c1">ABC Traders</option>
                      <option value="c2">XYZ Enterprises</option>
                      <option value="c3">PQR Solutions</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Invoice Date *</label>
                    <input type="date" className="form-input" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Due Date *</label>
                    <input type="date" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label>Payment Terms</label>
                    <select className="form-select">
                      <option value="Net 15">Net 15</option>
                      <option value="Net 30">Net 30</option>
                      <option value="Net 45">Net 45</option>
                      <option value="Due on Receipt">Due on Receipt</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Items</label>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>Description</span>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>Qty</span>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>Rate</span>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>Tax %</span>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>Amount</span>
                      <span></span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: '8px' }}>
                      <input type="text" className="form-input" placeholder="Item description" style={{ padding: '6px 10px' }} />
                      <input type="number" className="form-input" placeholder="0" style={{ padding: '6px 10px' }} />
                      <input type="number" className="form-input" placeholder="0" style={{ padding: '6px 10px' }} />
                      <select className="form-select" style={{ padding: '6px 10px' }}>
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                      <input type="text" className="form-input" placeholder="0" style={{ padding: '6px 10px', fontWeight: '600' }} />
                      <button className="btn-secondary" style={{ padding: '6px 10px' }}>×</button>
                    </div>
                    <button className="btn-secondary" style={{ marginTop: '8px', padding: '6px 12px', fontSize: '12px' }}>
                      <FaPlus /> Add Item
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea className="form-textarea" rows={3} placeholder="Enter any notes or special instructions" />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button className="btn-success">
                  <FaPlus /> Create Invoice
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Detail Modal */}
        {showInvoiceModal && selectedInvoice && (
          <div className="invoice-modal-overlay" onClick={() => setShowInvoiceModal(false)}>
            <div className="invoice-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="invoice-modal-header">
                <h2>
                  <FaFileInvoice style={{ marginRight: '8px', color: '#2c7a8a' }} />
                  Invoice: {selectedInvoice.invoiceNumber}
                </h2>
                <button className="invoice-modal-close" onClick={() => setShowInvoiceModal(false)}>×</button>
              </div>
              <div className="invoice-modal-body">
                <div className="invoice-detail-grid">
                  <div className="invoice-detail-grid-item">
                    <label>Customer</label>
                    <div className="value">{selectedInvoice.customer.name}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{selectedInvoice.customer.phone}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{selectedInvoice.customer.email}</div>
                  </div>
                  <div className="invoice-detail-grid-item">
                    <label>Invoice Date</label>
                    <div className="value">{formatDate(selectedInvoice.date)}</div>
                    <label style={{ marginTop: '8px' }}>Due Date</label>
                    <div className="value">{formatDate(selectedInvoice.dueDate)}</div>
                  </div>
                  <div className="invoice-detail-grid-item">
                    <label>Status</label>
                    <div className="value">{getStatusBadge(selectedInvoice.status)}</div>
                    <label style={{ marginTop: '8px' }}>Payment Terms</label>
                    <div className="value">{selectedInvoice.paymentTerms}</div>
                  </div>
                </div>

                <h4 style={{ margin: '16px 0 8px', color: '#1e293b' }}>Invoice Items</h4>
                <table className="invoice-items-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Description</th>
                      <th style={{ textAlign: 'right' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Rate</th>
                      <th style={{ textAlign: 'right' }}>Tax</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map((item, index) => (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        <td>{item.description}</td>
                        <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
                        <td style={{ textAlign: 'right' }}>{item.taxRate}%</td>
                        <td style={{ textAlign: 'right', fontWeight: '500' }}>{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="invoice-totals">
                  <div className="total-row">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                  </div>
                  <div className="total-row">
                    <span>Tax Total</span>
                    <span>{formatCurrency(selectedInvoice.taxTotal)}</span>
                  </div>
                  <div className="total-row grand-total">
                    <span>Grand Total</span>
                    <span>{formatCurrency(selectedInvoice.total)}</span>
                  </div>
                </div>

                {selectedInvoice.notes && (
                  <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Notes</span>
                    <div style={{ marginTop: '4px', color: '#1e293b' }}>{selectedInvoice.notes}</div>
                  </div>
                )}

                <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button className="btn-secondary">
                    <FaFilePdf /> PDF
                  </button>
                  <button className="btn-secondary">
                    <FaFileExcel /> Excel
                  </button>
                  <button className="btn-success">
                    <FaPaperPlane /> Send Email
                  </button>
                  {selectedInvoice.status === 'Draft' && (
                    <button className="btn-primary">
                      <FaCheckCircle /> Mark as Sent
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CustomerInvoices;