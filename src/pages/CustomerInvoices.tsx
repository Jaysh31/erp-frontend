import React, { useState } from 'react';
import { 
  FaPlus, 
  FaSearch, 
  FaFilter, 
  FaDownload, 
  FaPrint,
  FaEye,
  FaEdit,
  FaPrint as FaPrintIcon,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaEllipsisV,
  FaUser,
  FaRupeeSign,
  FaFilePdf,
  FaFileExcel,
  FaEnvelope,
  FaBan,
  FaReceipt,
  FaPaperPlane,
  FaTruck,
  FaBox,
  FaWarehouse,
  FaRoad,
  FaUserTie,
  FaFileInvoice,
  FaBuilding,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaIdCard,
  FaHashtag,
  FaCopy,
  FaSave,
  FaExternalLinkAlt
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// ===== INTERFACES =====

interface Customer {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  contactPerson?: string;
  contactMobile?: string;
  contactEmail?: string;
  address: string;
  shippingAddress?: string;
  gstin?: string;
}

interface InvoiceItem {
  id: string;
  itemCode: string;
  description: string;
  quantity: number;
  deliveredQty: number;
  remainingQty: number;
  unit: string;
  rate: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  receiptNo: string;
  customer: Customer;
  invoiceDate: string;
  dueDate: string;
  salesOrderNo: string;
  salesPerson: string;
  paymentTerms: string;
  company: string;
  branch: string;
  poNo?: string;
  poDate?: string;
  grandTotal: number;
  subtotal: number;
  discount: number;
  tax: number;
  paidAmount: number;
  outstandingAmount: number;
  invoiceStatus: 'Draft' | 'Generated' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
  deliveryStatus: 'Pending' | 'Partial Dispatch' | 'Fully Dispatched';
  createdBy: string;
  createdAt: string;
  generatedBy?: string;
  generatedDate?: string;
  sentBy?: string;
  sentDate?: string;
  paidBy?: string;
  paidDate?: string;
  items: InvoiceItem[];
}

// ===== STATUS BADGE COMPONENT =====
const StatusBadge: React.FC<{ status: string; type?: 'invoice' | 'delivery' }> = ({ status, type = 'invoice' }) => {
  const configs: Record<string, { color: string; bg: string; label: string }> = {
    'Draft': { color: '#94a3b8', bg: '#f1f5f9', label: 'Draft' },
    'Generated': { color: '#3b82f6', bg: '#eff6ff', label: 'Generated' },
    'Sent': { color: '#8b5cf6', bg: '#f5f3ff', label: 'Sent' },
    'Paid': { color: '#10b981', bg: '#ecfdf5', label: 'Paid' },
    'Overdue': { color: '#ef4444', bg: '#fef2f2', label: 'Overdue' },
    'Cancelled': { color: '#f59e0b', bg: '#fffbeb', label: 'Cancelled' },
    'Pending': { color: '#f59e0b', bg: '#fffbeb', label: 'Pending' },
    'Partial Dispatch': { color: '#3b82f6', bg: '#eff6ff', label: 'Partial Dispatch' },
    'Fully Dispatched': { color: '#10b981', bg: '#ecfdf5', label: 'Fully Dispatched' }
  };
  const config = configs[status] || configs['Draft'];
  
  return (
    <span className="status-badge" style={{ color: config.color, background: config.bg }}>
      <span className="dot" style={{ background: config.color }} />
      {config.label}
    </span>
  );
};

// ===== SUMMARY CARD COMPONENT =====
const SummaryCard: React.FC<{ label: string; value: string | number; color: string; icon?: React.ReactNode }> = ({ 
  label, value, color, icon 
}) => {
  return (
    <div className="summary-card" style={{ borderLeftColor: color }}>
      <div className="summary-card-label">
        {icon && <span>{icon}</span>}
        {label}
      </div>
      <div className="summary-card-value">{value}</div>
    </div>
  );
};

const CustomerInvoices: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showMoreMenu, setShowMoreMenu] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Sample Data - In real app, this would come from API
  const invoices: Invoice[] = [
    {
      id: '1',
      invoiceNo: 'INV-2024-001',
      receiptNo: 'SR-2024-001',
      customer: {
        id: 'c1',
        name: 'ABC Traders Pvt Ltd',
        code: 'CUST001',
        email: 'info@abctraders.com',
        phone: '+91 98765 43210',
        contactPerson: 'Rajesh Sharma',
        contactMobile: '+91 98765 43211',
        contactEmail: 'rajesh@abctraders.com',
        address: '123, Business Park, Mumbai - 400001',
        shippingAddress: '123, Business Park, Mumbai - 400001',
        gstin: '27AABCU1234D1Z1'
      },
      invoiceDate: '2024-01-16',
      dueDate: '2024-02-15',
      salesOrderNo: 'SO-2024-001',
      salesPerson: 'Rajesh Kumar',
      paymentTerms: 'Net 30',
      company: 'SculptERP Pvt Ltd',
      branch: 'Mumbai',
      poNo: 'PO-2024-001',
      poDate: '2024-01-10',
      grandTotal: 150000,
      subtotal: 150000,
      discount: 0,
      tax: 0,
      paidAmount: 150000,
      outstandingAmount: 0,
      invoiceStatus: 'Paid',
      deliveryStatus: 'Fully Dispatched',
      createdBy: 'System',
      createdAt: '2024-01-16T10:30:00',
      generatedBy: 'System',
      generatedDate: '2024-01-16T10:30:00',
      paidBy: 'Admin User',
      paidDate: '2024-01-16T11:00:00',
      items: [
        { id: 'i1', itemCode: 'PRD-P001', description: 'Industrial Pump - 5 HP', quantity: 10, deliveredQty: 10, remainingQty: 0, unit: 'pcs', rate: 1500, amount: 150000 }
      ]
    },
    {
      id: '2',
      invoiceNo: 'INV-2024-002',
      receiptNo: 'SR-2024-002',
      customer: {
        id: 'c2',
        name: 'XYZ Enterprises',
        code: 'CUST002',
        email: 'contact@xyzent.com',
        phone: '+91 87654 32109',
        contactPerson: 'Priya Patel',
        contactMobile: '+91 87654 32110',
        contactEmail: 'priya@xyzent.com',
        address: '456, Industrial Estate, Pune - 411001',
        shippingAddress: '456, Industrial Estate, Pune - 411001',
        gstin: '27BXYZU5678D1Z1'
      },
      invoiceDate: '2024-02-15',
      dueDate: '2024-03-17',
      salesOrderNo: 'SO-2024-002',
      salesPerson: 'Priya Sharma',
      paymentTerms: 'Net 15',
      company: 'SculptERP Pvt Ltd',
      branch: 'Pune',
      poNo: 'PO-2024-002',
      poDate: '2024-02-12',
      grandTotal: 94400,
      subtotal: 80000,
      discount: 0,
      tax: 14400,
      paidAmount: 50000,
      outstandingAmount: 44400,
      invoiceStatus: 'Generated',
      deliveryStatus: 'Partial Dispatch',
      createdBy: 'System',
      createdAt: '2024-02-15T14:15:00',
      generatedBy: 'System',
      generatedDate: '2024-02-15T14:15:00',
      items: [
        { id: 'i2', itemCode: 'SVC-A001', description: 'Service A - Monthly Retainer', quantity: 1, deliveredQty: 0, remainingQty: 1, unit: 'month', rate: 50000, discount: 0, tax: 18, amount: 59000 },
        { id: 'i3', itemCode: 'SVC-C001', description: 'Consulting Hours - 20 hrs', quantity: 20, deliveredQty: 0, remainingQty: 20, unit: 'hrs', rate: 1500, discount: 0, tax: 18, amount: 35400 }
      ]
    },
    {
      id: '3',
      invoiceNo: 'INV-2024-003',
      receiptNo: 'SR-2024-003',
      customer: {
        id: 'c3',
        name: 'PQR Solutions Ltd',
        code: 'CUST003',
        email: 'info@pqrsolutions.com',
        phone: '+91 76543 21098',
        contactPerson: 'Amit Singh',
        contactMobile: '+91 76543 21099',
        contactEmail: 'amit@pqrsolutions.com',
        address: '789, Tech Park, Bangalore - 560001',
        shippingAddress: '789, Tech Park, Bangalore - 560001',
        gstin: '27CPQRU9012D1Z1'
      },
      invoiceDate: '2024-03-01',
      dueDate: '2024-03-31',
      salesOrderNo: 'SO-2024-003',
      salesPerson: 'Vikram Reddy',
      paymentTerms: 'Net 30',
      company: 'SculptERP Pvt Ltd',
      branch: 'Bangalore',
      poNo: 'PO-2024-003',
      poDate: '2024-02-25',
      grandTotal: 53100,
      subtotal: 45000,
      discount: 0,
      tax: 8100,
      paidAmount: 0,
      outstandingAmount: 53100,
      invoiceStatus: 'Sent',
      deliveryStatus: 'Pending',
      createdBy: 'System',
      createdAt: '2024-03-01T09:45:00',
      generatedBy: 'System',
      generatedDate: '2024-03-01T09:45:00',
      sentBy: 'Sales Manager',
      sentDate: '2024-03-01T10:00:00',
      items: [
        { id: 'i4', itemCode: 'LIC-A001', description: 'Software License - 10 users', quantity: 10, deliveredQty: 0, remainingQty: 10, unit: 'users', rate: 2000, discount: 0, tax: 18, amount: 23600 },
        { id: 'i5', itemCode: 'AMC-A001', description: 'Annual Maintenance', quantity: 1, deliveredQty: 0, remainingQty: 1, unit: 'year', rate: 25000, discount: 0, tax: 18, amount: 29500 }
      ]
    },
    {
      id: '4',
      invoiceNo: 'INV-2024-004',
      receiptNo: 'SR-2024-004',
      customer: {
        id: 'c4',
        name: 'LMN Group',
        code: 'CUST004',
        email: 'contact@lmngroup.com',
        phone: '+91 65432 10987',
        address: '321, Corporate Tower, Delhi - 110001',
        shippingAddress: '321, Corporate Tower, Delhi - 110001',
        gstin: '27DLMNU3456D1Z1'
      },
      invoiceDate: '2024-02-06',
      dueDate: '2024-03-08',
      salesOrderNo: 'SO-2024-004',
      salesPerson: 'Deepak Gupta',
      paymentTerms: 'Net 45',
      company: 'SculptERP Inc',
      branch: 'Delhi',
      grandTotal: 67200,
      subtotal: 60000,
      discount: 0,
      tax: 7200,
      paidAmount: 67200,
      outstandingAmount: 0,
      invoiceStatus: 'Paid',
      deliveryStatus: 'Fully Dispatched',
      createdBy: 'System',
      createdAt: '2024-02-06T11:20:00',
      generatedBy: 'System',
      generatedDate: '2024-02-06T11:20:00',
      paidBy: 'Admin User',
      paidDate: '2024-02-06T12:00:00',
      items: [
        { id: 'i6', itemCode: 'PRD-C001', description: 'Product C - 200 units', quantity: 200, deliveredQty: 200, remainingQty: 0, unit: 'pcs', rate: 300, discount: 0, tax: 12, amount: 67200 }
      ]
    },
    {
      id: '5',
      invoiceNo: 'INV-2024-005',
      receiptNo: 'SR-2024-005',
      customer: {
        id: 'c5',
        name: 'RST Industries',
        code: 'CUST005',
        email: 'info@rstind.com',
        phone: '+91 54321 09876',
        address: '654, Industrial Area, Chennai - 600001',
        shippingAddress: '654, Industrial Area, Chennai - 600001',
        gstin: '27ERSTU7890D1Z1'
      },
      invoiceDate: '2024-03-10',
      dueDate: '2024-04-09',
      salesOrderNo: 'SO-2024-005',
      salesPerson: 'Suresh Kumar',
      paymentTerms: 'Net 30',
      company: 'SculptERP Pvt Ltd',
      branch: 'Chennai',
      grandTotal: 76700,
      subtotal: 65000,
      discount: 0,
      tax: 11700,
      paidAmount: 0,
      outstandingAmount: 76700,
      invoiceStatus: 'Overdue',
      deliveryStatus: 'Pending',
      createdBy: 'System',
      createdAt: '2024-03-10T16:00:00',
      generatedBy: 'System',
      generatedDate: '2024-03-10T16:00:00',
      sentBy: 'Admin User',
      sentDate: '2024-03-10T16:30:00',
      items: [
        { id: 'i7', itemCode: 'PRD-M001', description: 'Machinery Parts - 50 units', quantity: 50, deliveredQty: 0, remainingQty: 50, unit: 'pcs', rate: 1000, discount: 0, tax: 18, amount: 59000 },
        { id: 'i8', itemCode: 'SVC-I001', description: 'Installation Services', quantity: 1, deliveredQty: 0, remainingQty: 1, unit: 'job', rate: 15000, discount: 0, tax: 18, amount: 17700 }
      ]
    },
    {
      id: '6',
      invoiceNo: 'INV-2024-006',
      receiptNo: 'SR-2024-006',
      customer: {
        id: 'c1',
        name: 'ABC Traders Pvt Ltd',
        code: 'CUST001',
        email: 'info@abctraders.com',
        phone: '+91 98765 43210',
        address: '123, Business Park, Mumbai - 400001',
        shippingAddress: '123, Business Park, Mumbai - 400001',
        gstin: '27AABCU1234D1Z1'
      },
      invoiceDate: '2024-02-16',
      dueDate: '2024-03-18',
      salesOrderNo: 'SO-2024-006',
      salesPerson: 'Rajesh Kumar',
      paymentTerms: 'Net 30',
      company: 'SculptERP Inc',
      branch: 'Hyderabad',
      grandTotal: 225000,
      subtotal: 225000,
      discount: 0,
      tax: 0,
      paidAmount: 225000,
      outstandingAmount: 0,
      invoiceStatus: 'Paid',
      deliveryStatus: 'Fully Dispatched',
      createdBy: 'System',
      createdAt: '2024-02-16T10:00:00',
      generatedBy: 'System',
      generatedDate: '2024-02-16T10:00:00',
      paidBy: 'Admin User',
      paidDate: '2024-02-16T10:30:00',
      items: [
        { id: 'i9', itemCode: 'PRD-D001', description: 'Product D - 150 units', quantity: 150, deliveredQty: 150, remainingQty: 0, unit: 'pcs', rate: 1500, discount: 0, tax: 0, amount: 225000 }
      ]
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

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter logic
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          invoice.receiptNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          invoice.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          invoice.customer.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || invoice.invoiceStatus === selectedStatus;
    const matchesCustomer = selectedCustomer === 'all' || invoice.customer.id === selectedCustomer;
    return matchesSearch && matchesStatus && matchesCustomer;
  });

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedData = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Summary statistics
  const summaryData = [
    { label: 'Total Invoices', value: filteredInvoices.length, color: '#2563eb', icon: <FaFileInvoice /> },
    { label: 'Total Amount', value: formatCurrency(filteredInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0)), color: '#10b981', icon: <FaRupeeSign /> },
    { label: 'Paid', value: filteredInvoices.filter(inv => inv.invoiceStatus === 'Paid').length, color: '#10b981', icon: <FaCheckCircle /> },
    { label: 'Overdue', value: filteredInvoices.filter(inv => inv.invoiceStatus === 'Overdue').length, color: '#ef4444', icon: <FaExclamationTriangle /> },
    { label: 'Pending', value: filteredInvoices.filter(inv => inv.invoiceStatus === 'Generated' || inv.invoiceStatus === 'Sent').length, color: '#f59e0b', icon: <FaClock /> },
    { label: 'Outstanding', value: formatCurrency(filteredInvoices.reduce((sum, inv) => sum + inv.outstandingAmount, 0)), color: '#8b5cf6', icon: <FaReceipt /> }
  ];

  const getCustomers = () => {
    const unique = new Map();
    invoices.forEach(inv => {
      if (!unique.has(inv.customer.id)) {
        unique.set(inv.customer.id, inv.customer);
      }
    });
    return Array.from(unique.values());
  };

  // Navigation handlers
  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailModal(true);
    setShowMoreMenu(null);
  };

  const handlePrintInvoice = () => {
    window.print();
    setShowMoreMenu(null);
  };

  const handleDownloadPDF = (invoiceId: string) => {
    console.log('Downloading PDF for invoice:', invoiceId);
    setShowMoreMenu(null);
  };

  const handleDownloadExcel = (invoiceId: string) => {
    console.log('Downloading Excel for invoice:', invoiceId);
    setShowMoreMenu(null);
  };

  const handleEmailInvoice = (invoiceId: string) => {
    console.log('Emailing invoice:', invoiceId);
    setShowMoreMenu(null);
  };

  const handleSendInvoice = (invoiceId: string) => {
    console.log('Marking invoice as sent:', invoiceId);
    setShowMoreMenu(null);
  };

  const handleCancelInvoice = (invoiceId: string) => {
    if (window.confirm('Are you sure you want to cancel this invoice?')) {
      console.log('Cancelling invoice:', invoiceId);
    }
    setShowMoreMenu(null);
  };

  const toggleMoreMenu = (invoiceId: string) => {
    setShowMoreMenu(showMoreMenu === invoiceId ? null : invoiceId);
  };

  const canCancel = (invoice: Invoice) => {
    return invoice.invoiceStatus !== 'Paid' && invoice.invoiceStatus !== 'Cancelled';
  };

  const canSend = (invoice: Invoice) => {
    return invoice.invoiceStatus === 'Generated';
  };

  const canEdit = (invoice: Invoice) => {
    return invoice.invoiceStatus === 'Draft';
  };

  const handleCreateDC = (invoiceNo: string) => {
    navigate(`/delivery-challans/new?invoice=${invoiceNo}`);
  };

  const handleViewPayments = (receiptNo: string) => {
    navigate(`/receivables/customer-payments?receipt=${receiptNo}`);
  };

  const handleViewDCs = (invoiceNo: string) => {
    navigate(`/delivery-challans?invoice=${invoiceNo}`);
  };

  return (
    <div className="invoice-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <span>Accounts</span>
            <span className="separator">/</span>
            <span>Receivables</span>
            <span className="separator">/</span>
            <span className="active">Customer Invoices</span>
          </div>
          <h1 className="page-title">
            <FaFileInvoice className="title-icon" />
            Customer Invoices
          </h1>
          <p className="page-subtitle">Manage customer invoices, track payments, and create delivery challans</p>
        </div>
        <div className="page-header-right">
          <button className="btn-secondary">
            <FaDownload /> Export
          </button>
          <button className="btn-secondary">
            <FaPrint /> Print
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        {summaryData.map((card, index) => (
          <SummaryCard 
            key={index}
            label={card.label}
            value={card.value}
            color={card.color}
            icon={card.icon}
          />
        ))}
      </div>

      {/* Filters */}
      <div className="filter-section">
        <div className="filter-section-top">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by Invoice, Receipt, Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm('')}>
                <FaTimes />
              </button>
            )}
          </div>
          <div className="filter-actions">
            <button 
              className={`filter-toggle ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter /> Filters
            </button>
            <div className="filter-selects">
              <select 
                className="filter-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Generated">Generated</option>
                <option value="Sent">Sent</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <select 
                className="filter-select"
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
              >
                <option value="all">All Customers</option>
                {getCustomers().map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Receipt No</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Due Date</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Outstanding</th>
              <th>Invoice Status</th>
              <th>Delivery Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map(invoice => (
                <tr key={invoice.id}>
                  <td className="invoice-number">{invoice.invoiceNo}</td>
                  <td className="receipt-link">{invoice.receiptNo}</td>
                  <td>
                    <div className="customer-info">
                      <span className="customer-name">{invoice.customer.name}</span>
                      <span className="customer-code">{invoice.customer.code}</span>
                    </div>
                  </td>
                  <td>{formatDate(invoice.invoiceDate)}</td>
                  <td className={invoice.invoiceStatus === 'Overdue' ? 'text-red' : ''}>
                    {formatDate(invoice.dueDate)}
                  </td>
                  <td className="amount">{formatCurrency(invoice.grandTotal)}</td>
                  <td className="amount text-green">{formatCurrency(invoice.paidAmount)}</td>
                  <td className={`amount ${invoice.outstandingAmount > 0 ? 'text-red' : 'text-green'}`}>
                    {formatCurrency(invoice.outstandingAmount)}
                  </td>
                  <td><StatusBadge status={invoice.invoiceStatus} type="invoice" /></td>
                  <td><StatusBadge status={invoice.deliveryStatus} type="delivery" /></td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn" onClick={() => handleViewInvoice(invoice)}>
                        <FaEye />
                      </button>
                      <button className="action-btn" onClick={handlePrintInvoice}>
                        <FaPrintIcon />
                      </button>
                      <button className="action-btn" onClick={() => handleDownloadPDF(invoice.id)}>
                        <FaFilePdf />
                      </button>
                      <div className="more-menu-container">
                        <button className="action-btn" onClick={() => toggleMoreMenu(invoice.id)}>
                          <FaEllipsisV />
                        </button>
                        {showMoreMenu === invoice.id && (
                          <div className="more-menu-dropdown">
                            <button onClick={() => handleViewInvoice(invoice)}>
                              <FaEye /> View Details
                            </button>
                            <button onClick={() => handleViewPayments(invoice.receiptNo)}>
                              <FaReceipt /> View Payments
                            </button>
                            <button onClick={() => handleViewDCs(invoice.invoiceNo)}>
                              <FaTruck /> View DCs
                            </button>
                            <button onClick={() => handleCreateDC(invoice.invoiceNo)}>
                              <FaTruck /> Create DC
                            </button>
                            <button onClick={() => handleDownloadPDF(invoice.id)}>
                              <FaFilePdf /> Download PDF
                            </button>
                            <button onClick={() => handleDownloadExcel(invoice.id)}>
                              <FaFileExcel /> Download Excel
                            </button>
                            <button onClick={() => handleEmailInvoice(invoice.id)}>
                              <FaEnvelope /> Email
                            </button>
                            {canSend(invoice) && (
                              <button onClick={() => handleSendInvoice(invoice.id)}>
                                <FaPaperPlane /> Mark as Sent
                              </button>
                            )}
                            {canEdit(invoice) && (
                              <button>
                                <FaEdit /> Edit Invoice
                              </button>
                            )}
                            {canCancel(invoice) && (
                              <button className="danger" onClick={() => handleCancelInvoice(invoice.id)}>
                                <FaBan /> Cancel
                              </button>
                            )}
                            <button onClick={handlePrintInvoice}>
                              <FaPrintIcon /> Print
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={11} className="empty-state">
                  <div className="empty-state-content">
                    <FaFileInvoice className="empty-icon" />
                    <h3>No invoices found</h3>
                    <p>Invoices are auto-generated after full payment</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {filteredInvoices.length > 0 && (
          <div className="table-footer">
            <div className="pagination-info">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} entries
            </div>
            <div className="pagination-controls">
              <button 
                className="pagination-btn"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <FaChevronLeft />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button 
                className="pagination-btn"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FaFileInvoice style={{ marginRight: '8px', color: '#2563eb' }} />
                Invoice: {selectedInvoice.invoiceNo}
              </h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {/* Invoice Header */}
              <div className="invoice-header-section">
                <div className="invoice-company">
                  <h2>{selectedInvoice.company}</h2>
                  <p>Branch: {selectedInvoice.branch}</p>
                </div>
                <div className="invoice-number-section">
                  <div className="invoice-number-display">
                    <span className="label">Invoice No</span>
                    <span className="value">{selectedInvoice.invoiceNo}</span>
                  </div>
                  <div className="invoice-number-display">
                    <span className="label">Receipt No</span>
                    <span className="value">{selectedInvoice.receiptNo}</span>
                  </div>
                  <div className="invoice-number-display">
                    <span className="label">Date</span>
                    <span className="value">{formatDate(selectedInvoice.invoiceDate)}</span>
                  </div>
                  <div className="invoice-number-display">
                    <span className="label">Due Date</span>
                    <span className="value">{formatDate(selectedInvoice.dueDate)}</span>
                  </div>
                </div>
              </div>

              {/* Customer & Payment Info */}
              <div className="info-grid">
                <div className="info-section">
                  <h4>Bill To</h4>
                  <p><strong>{selectedInvoice.customer.name}</strong></p>
                  <p>{selectedInvoice.customer.address}</p>
                  <p>GST: {selectedInvoice.customer.gstin}</p>
                  <p>Phone: {selectedInvoice.customer.phone}</p>
                  <p>Email: {selectedInvoice.customer.email}</p>
                  {selectedInvoice.customer.contactPerson && (
                    <p>Contact: {selectedInvoice.customer.contactPerson} ({selectedInvoice.customer.contactMobile})</p>
                  )}
                </div>
                <div className="info-section">
                  <h4>Payment & Delivery Information</h4>
                  <div className="payment-info-row">
                    <span>Grand Total</span>
                    <span className="amount">{formatCurrency(selectedInvoice.grandTotal)}</span>
                  </div>
                  <div className="payment-info-row">
                    <span>Paid Amount</span>
                    <span className="amount text-green">{formatCurrency(selectedInvoice.paidAmount)}</span>
                  </div>
                  <div className="payment-info-row">
                    <span>Outstanding</span>
                    <span className={`amount ${selectedInvoice.outstandingAmount > 0 ? 'text-red' : 'text-green'}`}>
                      {formatCurrency(selectedInvoice.outstandingAmount)}
                    </span>
                  </div>
                  <div className="payment-info-row">
                    <span>Payment Terms</span>
                    <span>{selectedInvoice.paymentTerms}</span>
                  </div>
                  <div className="payment-info-row">
                    <span>Delivery Status</span>
                    <span><StatusBadge status={selectedInvoice.deliveryStatus} type="delivery" /></span>
                  </div>
                  {selectedInvoice.poNo && (
                    <div className="payment-info-row">
                      <span>PO No</span>
                      <span>{selectedInvoice.poNo}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="items-section">
                <h4>Items</h4>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Item Code</th>
                      <th>Description</th>
                      <th style={{ textAlign: 'right' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Unit</th>
                      <th style={{ textAlign: 'right' }}>Rate</th>
                      <th style={{ textAlign: 'right' }}>Discount %</th>
                      <th style={{ textAlign: 'right' }}>Tax %</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.itemCode}</td>
                        <td>{item.description}</td>
                        <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right' }}>{item.unit}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
                        <td style={{ textAlign: 'right' }}>{item.discount}%</td>
                        <td style={{ textAlign: 'right' }}>{item.tax}%</td>
                        <td style={{ textAlign: 'right', fontWeight: '600' }}>
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'right', fontWeight: '600' }}>
                        Subtotal
                      </td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(selectedInvoice.subtotal)}</td>
                    </tr>
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'right', fontWeight: '600' }}>
                        Discount
                      </td>
                      <td style={{ textAlign: 'right' }}>-{formatCurrency(selectedInvoice.discount)}</td>
                    </tr>
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'right', fontWeight: '600' }}>
                        Tax
                      </td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(selectedInvoice.tax)}</td>
                    </tr>
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'right', fontWeight: '700', fontSize: '16px' }}>
                        Grand Total
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '700', fontSize: '16px', color: '#2563eb' }}>
                        {formatCurrency(selectedInvoice.grandTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Notes & Audit */}
              <div className="notes-section">
                {selectedInvoice.notes && (
                  <div className="notes">
                    <h4>Notes</h4>
                    <p>{selectedInvoice.notes}</p>
                  </div>
                )}
                <div className="audit-info">
                  <h4>Audit Information</h4>
                  <div className="audit-grid">
                    <div>
                      <span className="label">Created By</span>
                      <span>{selectedInvoice.createdBy}</span>
                    </div>
                    <div>
                      <span className="label">Created Date</span>
                      <span>{formatDateTime(selectedInvoice.createdAt)}</span>
                    </div>
                    {selectedInvoice.generatedBy && (
                      <div>
                        <span className="label">Generated By</span>
                        <span>{selectedInvoice.generatedBy}</span>
                      </div>
                    )}
                    {selectedInvoice.generatedDate && (
                      <div>
                        <span className="label">Generated Date</span>
                        <span>{formatDateTime(selectedInvoice.generatedDate)}</span>
                      </div>
                    )}
                    {selectedInvoice.sentBy && (
                      <div>
                        <span className="label">Sent By</span>
                        <span>{selectedInvoice.sentBy}</span>
                      </div>
                    )}
                    {selectedInvoice.sentDate && (
                      <div>
                        <span className="label">Sent Date</span>
                        <span>{formatDateTime(selectedInvoice.sentDate)}</span>
                      </div>
                    )}
                    {selectedInvoice.paidBy && (
                      <div>
                        <span className="label">Paid By</span>
                        <span>{selectedInvoice.paidBy}</span>
                      </div>
                    )}
                    {selectedInvoice.paidDate && (
                      <div>
                        <span className="label">Paid Date</span>
                        <span>{formatDateTime(selectedInvoice.paidDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={handlePrintInvoice}><FaPrintIcon /> Print</button>
              <button className="btn-secondary" onClick={() => handleDownloadPDF(selectedInvoice.id)}><FaFilePdf /> PDF</button>
              <button className="btn-secondary" onClick={() => handleEmailInvoice(selectedInvoice.id)}><FaEnvelope /> Email</button>
              <button className="btn-secondary" onClick={() => handleCreateDC(selectedInvoice.invoiceNo)}>
                <FaTruck /> Create DC
              </button>
              {canSend(selectedInvoice) && (
                <button className="btn-primary" onClick={() => handleSendInvoice(selectedInvoice.id)}>
                  <FaPaperPlane /> Mark as Sent
                </button>
              )}
              <button className="btn-secondary" onClick={() => setShowDetailModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .invoice-page {
          padding: 24px;
          background: #f8fafc;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
        }

        /* Header */
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          padding: 20px 24px;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .page-header-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #94a3b8;
        }
        .breadcrumb .separator { color: #e2e8f0; }
        .breadcrumb .active { color: #1e293b; font-weight: 500; }
        .page-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0;
        }
        .page-title .title-icon { color: #2c7a8a; }
        .page-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }
        .page-header-right {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        /* Buttons */
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37,99,235,0.3); }
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #fff;
          color: #64748b;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-secondary:hover { background: #f8fafc; border-color: #2563eb; color: #2563eb; }

        /* Summary Cards */
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .summary-card {
          background: #ffffff;
          padding: 16px 20px;
          border-radius: 10px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          border-left: 4px solid;
          transition: all 0.2s;
        }
        .summary-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .summary-card-label {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .summary-card-value {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin-top: 4px;
        }

        /* Filters */
        .filter-section {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          margin-bottom: 24px;
          overflow: hidden;
        }
        .filter-section-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .search-container {
          position: relative;
          flex: 1;
          min-width: 280px;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }
        .search-input {
          width: 100%;
          padding: 10px 40px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          background: #f8fafc;
          color: #1e293b;
          transition: all 0.2s;
        }
        .search-input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
          background: #ffffff;
        }
        .clear-search {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
        }
        .clear-search:hover { color: #1e293b; }
        .filter-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .filter-toggle {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #fff;
          color: #64748b;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .filter-toggle:hover { background: #f8fafc; border-color: #2563eb; color: #2563eb; }
        .filter-toggle.active { background: #eff6ff; border-color: #2563eb; color: #2563eb; }
        .filter-selects { display: flex; gap: 8px; }
        .filter-select {
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
          min-width: 160px;
        }
        .filter-select:focus { outline: none; border-color: #2563eb; }

        /* Table */
        .table-container {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          overflow: hidden;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
        }
        .data-table thead {
          background: #f8fafc;
        }
        .data-table th {
          padding: 12px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e2e8f0;
        }
        .data-table td {
          padding: 12px 16px;
          font-size: 14px;
          color: #1e293b;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        .data-table tbody tr:hover { background: #f8fafc; }
        .data-table tbody tr:last-child td { border-bottom: none; }

        .invoice-number { font-weight: 600; color: #2563eb; }
        .receipt-link { color: #64748b; font-family: 'Courier New', monospace; }
        .customer-info { display: flex; flex-direction: column; }
        .customer-name { font-weight: 500; }
        .customer-code { font-size: 12px; color: #94a3b8; }
        .amount { font-weight: 500; }
        .text-green { color: #10b981; }
        .text-red { color: #ef4444; }

        /* Status Badge */
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }
        .status-badge .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
        }

        /* Action Buttons */
        .action-buttons {
          display: flex;
          gap: 4px;
          align-items: center;
        }
        .action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }
        .action-btn:hover { background: #f1f5f9; color: #1e293b; }

        .more-menu-container { position: relative; }
        .more-menu-dropdown {
          position: absolute;
          right: 0;
          top: 100%;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          min-width: 200px;
          z-index: 100;
          padding: 4px 0;
          margin-top: 4px;
        }
        .more-menu-dropdown button {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 8px 16px;
          border: none;
          background: transparent;
          color: #1e293b;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }
        .more-menu-dropdown button:hover { background: #f8fafc; color: #2563eb; }
        .more-menu-dropdown button.danger { color: #ef4444; }
        .more-menu-dropdown button.danger:hover { background: #fef2f2; }

        /* Table Footer */
        .table-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          border-top: 1px solid #e2e8f0;
          flex-wrap: wrap;
          gap: 12px;
        }
        .pagination-info { font-size: 14px; color: #64748b; }
        .pagination-controls { display: flex; gap: 4px; }
        .pagination-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 36px;
          height: 36px;
          padding: 0 8px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: #fff;
          color: #64748b;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .pagination-btn:hover:not(:disabled) { background: #f8fafc; border-color: #2563eb; color: #2563eb; }
        .pagination-btn.active { background: #2563eb; border-color: #2563eb; color: #fff; }
        .pagination-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Empty State */
        .empty-state { padding: 60px 20px !important; text-align: center !important; }
        .empty-state-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .empty-icon { font-size: 48px; color: #94a3b8; }
        .empty-state-content h3 { font-size: 18px; color: #1e293b; margin: 0; }
        .empty-state-content p { color: #64748b; margin: 0; }

        /* Modal */
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
          backdrop-filter: blur(4px);
        }
        .modal-content {
          background: #fff;
          border-radius: 16px;
          width: 100%;
          max-width: 1000px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          padding: 24px;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 1px solid #e2e8f0;
        }
        .modal-header h2 { font-size: 20px; font-weight: 700; color: #1e293b; margin: 0; }
        .modal-close {
          background: none;
          border: none;
          font-size: 28px;
          color: #94a3b8;
          cursor: pointer;
        }
        .modal-close:hover { color: #1e293b; }

        .invoice-header-section {
          display: flex;
          justify-content: space-between;
          padding: 16px 20px;
          background: #f8fafc;
          border-radius: 8px;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .invoice-company h2 { font-size: 20px; font-weight: 700; color: #1e293b; margin: 0 0 4px 0; }
        .invoice-company p { font-size: 13px; color: #64748b; margin: 2px 0; }
        .invoice-number-section { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; }
        .invoice-number-display { display: flex; gap: 16px; }
        .invoice-number-display .label { font-size: 13px; color: #94a3b8; font-weight: 500; }
        .invoice-number-display .value { font-size: 14px; font-weight: 600; color: #1e293b; }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }
        .info-section h4 { font-size: 14px; font-weight: 600; color: #1e293b; margin: 0 0 8px 0; }
        .info-section p { font-size: 14px; color: #64748b; margin: 2px 0; }
        .payment-info-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
        .payment-info-row .amount { font-weight: 500; }

        .items-section { margin-top: 16px; }
        .items-section h4 { font-size: 14px; font-weight: 600; color: #1e293b; margin: 0 0 12px 0; }
        .items-table {
          width: 100%;
          border-collapse: collapse;
        }
        .items-table th {
          padding: 8px 12px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          border-bottom: 2px solid #e2e8f0;
        }
        .items-table td { padding: 8px 12px; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
        .items-table tfoot td { border-top: 2px solid #e2e8f0; padding-top: 12px; }

        .notes-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }
        .notes h4, .audit-info h4 { font-size: 13px; font-weight: 600; color: #1e293b; margin: 0 0 8px 0; }
        .notes p { font-size: 14px; color: #64748b; margin: 0; }
        .audit-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .audit-grid div { display: flex; flex-direction: column; }
        .audit-grid .label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
        .audit-grid span:not(.label) { font-size: 13px; color: #1e293b; }

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
          flex-wrap: wrap;
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .summary-cards { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 992px) {
          .info-grid { grid-template-columns: 1fr; }
          .notes-section { grid-template-columns: 1fr; }
          .invoice-header-section { flex-direction: column; }
          .invoice-number-section { align-items: flex-start; }
        }
        @media (max-width: 768px) {
          .invoice-page { padding: 16px; }
          .page-header { flex-direction: column; gap: 16px; }
          .page-header-right { width: 100%; }
          .summary-cards { grid-template-columns: 1fr 1fr; }
          .filter-section-top { flex-direction: column; align-items: stretch; }
          .filter-actions { width: 100%; flex-wrap: wrap; }
          .filter-selects { flex: 1; flex-wrap: wrap; }
          .filter-select { flex: 1; min-width: 120px; }
          .data-table { display: block; overflow-x: auto; white-space: nowrap; }
          .modal-content { margin: 16px; max-height: 95vh; }
          .modal-actions { flex-direction: column; }
          .modal-actions button { width: 100%; justify-content: center; }
          .audit-grid { grid-template-columns: 1fr; }
          .more-menu-dropdown { right: -80px; }
        }
        @media (max-width: 480px) {
          .summary-cards { grid-template-columns: 1fr; }
          .page-header-right .btn-primary,
          .page-header-right .btn-secondary { flex: 1; justify-content: center; font-size: 12px; padding: 8px 12px; }
        }
      `}</style>
    </div>
  );
};

export default CustomerInvoices;