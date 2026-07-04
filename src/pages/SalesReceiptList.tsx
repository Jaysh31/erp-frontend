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
  address: string;
  shippingAddress?: string;
  gstin?: string;
}

interface InvoiceItem {
  id: string;
  itemCode: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  customer: Customer;
  invoiceDate: string;
  salesOrderNo?: string;
  salesPerson?: string;
  paymentTerms: string;
  grandTotal: number;
  company: string;
  branch: string;
  items: InvoiceItem[];
  deliveryStatus: 'Pending' | 'Partial Dispatch' | 'Fully Dispatched';
  status: 'Approved' | 'Draft' | 'Cancelled';
}

interface DeliveryChallanItem {
  id: string;
  itemId: string;
  itemCode: string;
  description: string;
  invoiceQty: number;
  deliveredQty: number;
  remainingQty: number;
  dispatchQty: number;
  unit: string;
}

interface DeliveryChallan {
  id: string;
  dcNo: string;
  dcDate: string;
  invoiceNo: string;
  customer: Customer;
  warehouse: string;
  transporter: string;
  vehicleNumber: string;
  driverName: string;
  lrNumber: string;
  eWayBillNumber: string;
  remarks: string;
  items: DeliveryChallanItem[];
  totalDispatchQty: number;
  deliveryStatus: 'Pending' | 'Partial Dispatch' | 'Fully Dispatched';
  dcStatus: 'Draft' | 'Submitted' | 'Cancelled';
  createdBy: string;
  createdAt: string;
  submittedBy?: string;
  submittedDate?: string;
  cancelledBy?: string;
  cancelledDate?: string;
}

// ===== STATUS BADGE COMPONENT =====
const StatusBadge: React.FC<{ status: string; type?: 'delivery' | 'dc' }> = ({ status, type = 'dc' }) => {
  const configs: Record<string, { color: string; bg: string; label: string }> = {
    'Draft': { color: '#94a3b8', bg: '#f1f5f9', label: 'Draft' },
    'Submitted': { color: '#3b82f6', bg: '#eff6ff', label: 'Submitted' },
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

const DeliveryChallans: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeliveryStatus, setSelectedDeliveryStatus] = useState<string>('all');
  const [selectedDCStatus, setSelectedDCStatus] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<DeliveryChallan | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showMoreMenu, setShowMoreMenu] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Sample Data - In real app, this would come from API
  const deliveryChallans: DeliveryChallan[] = [
    {
      id: '1',
      dcNo: 'DC-2024-001',
      dcDate: '2024-01-18',
      invoiceNo: 'INV-2024-001',
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
      warehouse: 'Main Warehouse',
      transporter: 'ABC Transport',
      vehicleNumber: 'MH-01-AB-1234',
      driverName: 'Rajesh Kumar',
      lrNumber: 'LR-2024-001',
      eWayBillNumber: 'EWB-2024-001',
      remarks: 'First dispatch - 3 pumps',
      items: [
        {
          id: 'i1',
          itemId: 'inv1',
          itemCode: 'PRD-P001',
          description: 'Industrial Pump - 5 HP',
          invoiceQty: 10,
          deliveredQty: 0,
          remainingQty: 10,
          dispatchQty: 3,
          unit: 'pcs'
        }
      ],
      totalDispatchQty: 3,
      deliveryStatus: 'Partial Dispatch',
      dcStatus: 'Submitted',
      createdBy: 'Admin User',
      createdAt: '2024-01-18T10:30:00',
      submittedBy: 'Admin User',
      submittedDate: '2024-01-18T10:30:00'
    },
    {
      id: '2',
      dcNo: 'DC-2024-002',
      dcDate: '2024-01-25',
      invoiceNo: 'INV-2024-001',
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
      warehouse: 'Main Warehouse',
      transporter: 'XYZ Logistics',
      vehicleNumber: 'MH-02-CD-5678',
      driverName: 'Amit Singh',
      lrNumber: 'LR-2024-002',
      eWayBillNumber: 'EWB-2024-002',
      remarks: 'Second dispatch - 4 pumps',
      items: [
        {
          id: 'i2',
          itemId: 'inv1',
          itemCode: 'PRD-P001',
          description: 'Industrial Pump - 5 HP',
          invoiceQty: 10,
          deliveredQty: 3,
          remainingQty: 7,
          dispatchQty: 4,
          unit: 'pcs'
        }
      ],
      totalDispatchQty: 4,
      deliveryStatus: 'Partial Dispatch',
      dcStatus: 'Draft',
      createdBy: 'Admin User',
      createdAt: '2024-01-25T14:15:00'
    },
    {
      id: '3',
      dcNo: 'DC-2024-003',
      dcDate: '2024-02-01',
      invoiceNo: 'INV-2024-002',
      customer: {
        id: 'c2',
        name: 'XYZ Enterprises',
        code: 'CUST002',
        email: 'contact@xyzent.com',
        phone: '+91 87654 32109',
        address: '456, Industrial Estate, Pune - 411001',
        shippingAddress: '456, Industrial Estate, Pune - 411001',
        gstin: '27BXYZU5678D1Z1'
      },
      warehouse: 'Secondary Warehouse',
      transporter: 'PQR Couriers',
      vehicleNumber: 'MH-03-EF-9012',
      driverName: 'Suresh Patil',
      lrNumber: 'LR-2024-003',
      eWayBillNumber: 'EWB-2024-003',
      remarks: 'Full dispatch',
      items: [
        {
          id: 'i3',
          itemId: 'inv2',
          itemCode: 'PRD-S001',
          description: 'Submersible Pump - 2 HP',
          invoiceQty: 5,
          deliveredQty: 0,
          remainingQty: 5,
          dispatchQty: 5,
          unit: 'pcs'
        }
      ],
      totalDispatchQty: 5,
      deliveryStatus: 'Fully Dispatched',
      dcStatus: 'Submitted',
      createdBy: 'Sales Manager',
      createdAt: '2024-02-01T09:45:00',
      submittedBy: 'Sales Manager',
      submittedDate: '2024-02-01T09:45:00'
    },
    {
      id: '4',
      dcNo: 'DC-2024-004',
      dcDate: '2024-02-10',
      invoiceNo: 'INV-2024-001',
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
      warehouse: 'Main Warehouse',
      transporter: 'ABC Transport',
      vehicleNumber: 'MH-01-AB-1234',
      driverName: 'Rajesh Kumar',
      lrNumber: 'LR-2024-004',
      eWayBillNumber: 'EWB-2024-004',
      remarks: 'Final dispatch - remaining 3 pumps',
      items: [
        {
          id: 'i4',
          itemId: 'inv1',
          itemCode: 'PRD-P001',
          description: 'Industrial Pump - 5 HP',
          invoiceQty: 10,
          deliveredQty: 7,
          remainingQty: 3,
          dispatchQty: 3,
          unit: 'pcs'
        }
      ],
      totalDispatchQty: 3,
      deliveryStatus: 'Fully Dispatched',
      dcStatus: 'Submitted',
      createdBy: 'Admin User',
      createdAt: '2024-02-10T11:20:00',
      submittedBy: 'Admin User',
      submittedDate: '2024-02-10T11:20:00'
    },
    {
      id: '5',
      dcNo: 'DC-2024-005',
      dcDate: '2024-02-15',
      invoiceNo: 'INV-2024-003',
      customer: {
        id: 'c3',
        name: 'PQR Solutions Ltd',
        code: 'CUST003',
        email: 'info@pqrsolutions.com',
        phone: '+91 76543 21098',
        address: '789, Tech Park, Bangalore - 560001',
        shippingAddress: '789, Tech Park, Bangalore - 560001',
        gstin: '27CPQRU9012D1Z1'
      },
      warehouse: 'Main Warehouse',
      transporter: 'XYZ Logistics',
      vehicleNumber: 'KA-01-GH-3456',
      driverName: 'Manoj Reddy',
      lrNumber: 'LR-2024-005',
      eWayBillNumber: 'EWB-2024-005',
      remarks: 'Dispatch completed',
      items: [
        {
          id: 'i5',
          itemId: 'inv3',
          itemCode: 'PRD-G001',
          description: 'Motor Assembly - 7.5 HP',
          invoiceQty: 3,
          deliveredQty: 0,
          remainingQty: 3,
          dispatchQty: 3,
          unit: 'pcs'
        }
      ],
      totalDispatchQty: 3,
      deliveryStatus: 'Fully Dispatched',
      dcStatus: 'Cancelled',
      createdBy: 'Admin User',
      createdAt: '2024-02-15T16:00:00',
      cancelledBy: 'Admin User',
      cancelledDate: '2024-02-16T10:00:00'
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
  const filteredChallans = deliveryChallans.filter(challan => {
    const matchesSearch = challan.dcNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          challan.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          challan.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          challan.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDeliveryStatus = selectedDeliveryStatus === 'all' || challan.deliveryStatus === selectedDeliveryStatus;
    const matchesDCStatus = selectedDCStatus === 'all' || challan.dcStatus === selectedDCStatus;
    const matchesCustomer = selectedCustomer === 'all' || challan.customer.id === selectedCustomer;
    return matchesSearch && matchesDeliveryStatus && matchesDCStatus && matchesCustomer;
  });

  // Pagination
  const totalPages = Math.ceil(filteredChallans.length / itemsPerPage);
  const paginatedData = filteredChallans.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Summary statistics
  const summaryData = [
    { label: 'Total DCs', value: filteredChallans.length, color: '#2563eb', icon: <FaTruck /> },
    { label: 'Draft', value: filteredChallans.filter(d => d.dcStatus === 'Draft').length, color: '#94a3b8', icon: <FaFileInvoice /> },
    { label: 'Submitted', value: filteredChallans.filter(d => d.dcStatus === 'Submitted').length, color: '#3b82f6', icon: <FaPaperPlane /> },
    { label: 'Cancelled', value: filteredChallans.filter(d => d.dcStatus === 'Cancelled').length, color: '#f59e0b', icon: <FaBan /> },
    { label: 'Pending Dispatch', value: filteredChallans.filter(d => d.deliveryStatus === 'Pending' || d.deliveryStatus === 'Partial Dispatch').length, color: '#f59e0b', icon: <FaClock /> },
    { label: 'Fully Dispatched', value: filteredChallans.filter(d => d.deliveryStatus === 'Fully Dispatched').length, color: '#10b981', icon: <FaCheckCircle /> }
  ];

  const getCustomers = () => {
    const unique = new Map();
    deliveryChallans.forEach(d => {
      if (!unique.has(d.customer.id)) {
        unique.set(d.customer.id, d.customer);
      }
    });
    return Array.from(unique.values());
  };

  // ===== NAVIGATION HANDLERS =====
  
  // Navigate to New Delivery Challan page
  const handleCreateChallan = () => {
    navigate('/sales-receipts/new');
  };

  // Navigate to Edit page (only for Draft)
  const handleEditChallan = (dcId: string) => {
    navigate(`/delivery-challans/edit/${dcId}`);
    setShowMoreMenu(null);
  };

  // Navigate to View/Detail page
  const handleViewChallan = (challan: DeliveryChallan) => {
    navigate(`/delivery-challans/view/${challan.id}`);
    setShowMoreMenu(null);
  };

  // Navigate to View Invoice
  const handleViewInvoice = (invoiceNo: string) => {
    navigate(`/customer-invoices?invoice=${invoiceNo}`);
    setShowMoreMenu(null);
  };

  // Navigate to Duplicate
  const handleDuplicateChallan = (dcId: string) => {
    navigate(`/delivery-challans/duplicate/${dcId}`);
    setShowMoreMenu(null);
  };

  // Print handler
  const handlePrintChallan = () => {
    window.print();
    setShowMoreMenu(null);
  };

  // Download handlers
  const handleDownloadPDF = (dcId: string) => {
    console.log('Downloading PDF for DC:', dcId);
    setShowMoreMenu(null);
  };

  const handleDownloadExcel = (dcId: string) => {
    console.log('Downloading Excel for DC:', dcId);
    setShowMoreMenu(null);
  };

  // Email handler
  const handleEmailChallan = (dcId: string) => {
    console.log('Emailing DC:', dcId);
    setShowMoreMenu(null);
  };

  // Cancel handler
  const handleCancelChallan = (dcId: string) => {
    if (window.confirm('Are you sure you want to cancel this Delivery Challan?')) {
      console.log('Cancelling DC:', dcId);
    }
    setShowMoreMenu(null);
  };

  // More menu toggle
  const toggleMoreMenu = (dcId: string) => {
    setShowMoreMenu(showMoreMenu === dcId ? null : dcId);
  };

  // Business rules
  const canCancel = (challan: DeliveryChallan) => {
    return challan.dcStatus !== 'Cancelled';
  };

  const canEdit = (challan: DeliveryChallan) => {
    return challan.dcStatus === 'Draft';
  };

  const canViewInvoice = (challan: DeliveryChallan) => {
    return true;
  };

  return (
    <div className="delivery-challan-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <span>Accounts</span>
            <span className="separator">/</span>
            <span>Receivables</span>
            <span className="separator">/</span>
            <span className="active">Delivery Challans</span>
          </div>
          <h1 className="page-title">
            <FaTruck className="title-icon" />
            Delivery Challans
          </h1>
          <p className="page-subtitle">Create and manage delivery challans against customer invoices</p>
        </div>
        <div className="page-header-right">
          <button className="btn-primary" onClick={handleCreateChallan}>
            <FaPlus /> New DC
          </button>
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
              placeholder="Search by DC No, Invoice No, Customer, Vehicle..."
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
                value={selectedDeliveryStatus}
                onChange={(e) => setSelectedDeliveryStatus(e.target.value)}
              >
                <option value="all">All Delivery</option>
                <option value="Pending">Pending</option>
                <option value="Partial Dispatch">Partial Dispatch</option>
                <option value="Fully Dispatched">Fully Dispatched</option>
              </select>
              <select 
                className="filter-select"
                value={selectedDCStatus}
                onChange={(e) => setSelectedDCStatus(e.target.value)}
              >
                <option value="all">All DC Status</option>
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="Cancelled">Cancelled</option>
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
              <th>DC No</th>
              <th>DC Date</th>
              <th>Invoice No</th>
              <th>Customer</th>
              <th>Warehouse</th>
              <th>Items</th>
              <th>Dispatch Qty</th>
              <th>Delivery Status</th>
              <th>DC Status</th>
              <th>Created By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map(challan => (
                <tr key={challan.id}>
                  <td className="dc-number">{challan.dcNo}</td>
                  <td>{formatDate(challan.dcDate)}</td>
                  <td className="invoice-link">{challan.invoiceNo}</td>
                  <td>
                    <div className="customer-info">
                      <span className="customer-name">{challan.customer.name}</span>
                      <span className="customer-code">{challan.customer.code}</span>
                    </div>
                  </td>
                  <td>{challan.warehouse}</td>
                  <td>{challan.items.length}</td>
                  <td className="amount">{challan.totalDispatchQty}</td>
                  <td>
                    <StatusBadge status={challan.deliveryStatus} type="delivery" />
                  </td>
                  <td>
                    <StatusBadge status={challan.dcStatus} />
                  </td>
                  <td>{challan.createdBy}</td>
                  <td>
                    <div className="action-buttons">
                      {/* View - Navigates to detail page */}
                      <button 
                        className="action-btn" 
                        title="View Details"
                        onClick={() => handleViewChallan(challan)}
                      >
                        <FaEye />
                      </button>
                      
                      {/* Edit - Only for Draft */}
                      {canEdit(challan) && (
                        <button 
                          className="action-btn" 
                          title="Edit"
                          onClick={() => handleEditChallan(challan.id)}
                        >
                          <FaEdit />
                        </button>
                      )}
                      
                      {/* Print */}
                      <button 
                        className="action-btn" 
                        title="Print"
                        onClick={handlePrintChallan}
                      >
                        <FaPrintIcon />
                      </button>
                      
                      {/* More Menu */}
                      <div className="more-menu-container">
                        <button 
                          className="action-btn" 
                          title="More"
                          onClick={() => toggleMoreMenu(challan.id)}
                        >
                          <FaEllipsisV />
                        </button>
                        {showMoreMenu === challan.id && (
                          <div className="more-menu-dropdown">
                            <button onClick={() => handleViewChallan(challan)}>
                              <FaEye /> View Details
                            </button>
                            
                            {canEdit(challan) && (
                              <button onClick={() => handleEditChallan(challan.id)}>
                                <FaEdit /> Edit DC
                              </button>
                            )}
                            
                            <button onClick={() => handleDuplicateChallan(challan.id)}>
                              <FaCopy /> Duplicate
                            </button>
                            
                            <button onClick={() => handleDownloadPDF(challan.id)}>
                              <FaFilePdf /> Download PDF
                            </button>
                            
                            <button onClick={() => handleDownloadExcel(challan.id)}>
                              <FaFileExcel /> Download Excel
                            </button>
                            
                            <button onClick={() => handleEmailChallan(challan.id)}>
                              <FaEnvelope /> Email DC
                            </button>
                            
                            {canViewInvoice(challan) && (
                              <button onClick={() => handleViewInvoice(challan.invoiceNo)}>
                                <FaExternalLinkAlt /> View Invoice
                              </button>
                            )}
                            
                            {canCancel(challan) && (
                              <button className="danger" onClick={() => handleCancelChallan(challan.id)}>
                                <FaBan /> Cancel DC
                              </button>
                            )}
                            
                            <button onClick={handlePrintChallan}>
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
                    <FaTruck className="empty-icon" />
                    <h3>No Delivery Challans found</h3>
                    <p>Create your first delivery challan to get started</p>
                    <button className="btn-primary" onClick={handleCreateChallan}>
                      <FaPlus /> New DC
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {filteredChallans.length > 0 && (
          <div className="table-footer">
            <div className="pagination-info">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredChallans.length)} of {filteredChallans.length} entries
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

      <style>{`
        .delivery-challan-page {
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

        .dc-number { font-weight: 600; color: #2563eb; }
        .invoice-link { color: #8b5cf6; font-family: 'Courier New', monospace; }
        .customer-info { display: flex; flex-direction: column; }
        .customer-name { font-weight: 500; }
        .customer-code { font-size: 12px; color: #94a3b8; }
        .amount { font-weight: 500; }

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

        /* Responsive */
        @media (max-width: 1200px) {
          .summary-cards { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 992px) {
          .data-table { display: block; overflow-x: auto; white-space: nowrap; }
        }
        @media (max-width: 768px) {
          .delivery-challan-page { padding: 16px; }
          .page-header { flex-direction: column; gap: 16px; }
          .page-header-right { width: 100%; }
          .summary-cards { grid-template-columns: 1fr 1fr; }
          .filter-section-top { flex-direction: column; align-items: stretch; }
          .filter-actions { width: 100%; flex-wrap: wrap; }
          .filter-selects { flex: 1; flex-wrap: wrap; }
          .filter-select { flex: 1; min-width: 120px; }
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

export default DeliveryChallans;