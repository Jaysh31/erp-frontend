import React, { useState,  } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaSearch, FaPlus, FaEye, FaEdit, FaTrash, FaFilePdf, 
  FaFilter, FaCheckCircle, FaClock, FaTimesCircle,
  FaPrint, FaFileAlt, FaExternalLinkAlt, FaDollarSign,
  FaChartLine, FaTimes, FaArrowLeft, FaSave, FaSpinner,
  FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendarAlt,
  FaUpload, FaImage, FaBuilding
} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';
import './QuotationPage.css';

interface QuotationItem {
  id: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Quotation {
  id: string;
  quotationNumber: string;
  customer: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  date: string;
  validTill: string;
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired' | 'Converted';
  currency: string;
  items: QuotationItem[];
  notes: string;
  termsConditions: string;
}

export default function Quotation() {
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Add this ref
  
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
  const [selectedCurrency, setSelectedCurrency] = useState('All');
  
  // Letterhead state
  const [letterHead, setLetterHead] = useState<string | null>(() => {
    return localStorage.getItem('quotationLetterhead') || null;
  });
  const [letterHeadName, setLetterHeadName] = useState<string>(() => {
    return localStorage.getItem('quotationLetterheadName') || 'Letterhead';
  });
  
  // Company details from letterhead template
  const [companyDetails, setCompanyDetails] = useState({
    name: localStorage.getItem('companyName') || 'Sculptor Tech Pvt Ltd',
    address: localStorage.getItem('companyAddress') || 'c-1006, gc, Pune, Maharashtra 411028, India',
    website: localStorage.getItem('companyWebsite') || 'sculptortechpvtltd@gmail.com',
    email: localStorage.getItem('companyEmail') || 'jayeshwakle@sculptortechpvtltd.com',
    contact: localStorage.getItem('companyContact') || '8668584275',
    gst: localStorage.getItem('companyGST') || '',
    pan: localStorage.getItem('companyPAN') || ''
  });
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const [quotations, setQuotations] = useState<Quotation[]>([
    {
      id: '1',
      quotationNumber: 'QT-2026-001',
      customer: 'CUST-001',
      customerName: 'ABC Corporation',
      customerEmail: 'info@abccorp.com',
      customerPhone: '+91-9876543210',
      customerAddress: '123, Business Park, Mumbai, Maharashtra - 400001',
      date: '2026-06-19',
      validTill: '2026-07-19',
      totalAmount: 25000,
      status: 'Sent',
      currency: 'INR',
      notes: 'Urgent delivery required',
      termsConditions: 'Payment within 30 days',
      items: [
        { id: '1', itemCode: 'ITEM-001', itemName: 'Product A', quantity: 10, rate: 1000, amount: 10000 },
        { id: '2', itemCode: 'ITEM-002', itemName: 'Product B', quantity: 5, rate: 3000, amount: 15000 }
      ]
    },
    {
      id: '2',
      quotationNumber: 'QT-2026-002',
      customer: 'CUST-002',
      customerName: 'XYZ Industries',
      customerEmail: 'contact@xyzind.com',
      customerPhone: '+91-8765432109',
      customerAddress: '456, Industrial Area, Pune, Maharashtra - 411001',
      date: '2026-06-18',
      validTill: '2026-07-18',
      totalAmount: 45000,
      status: 'Accepted',
      currency: 'USD',
      notes: '',
      termsConditions: 'Standard terms apply',
      items: [
        { id: '1', itemCode: 'ITEM-003', itemName: 'Product C', quantity: 3, rate: 15000, amount: 45000 }
      ]
    },
    {
      id: '3',
      quotationNumber: 'QT-2026-003',
      customer: 'CUST-003',
      customerName: 'PQR Enterprises',
      customerEmail: 'info@pqr.com',
      customerPhone: '+91-7654321098',
      customerAddress: '789, Commercial Complex, Delhi - 110001',
      date: '2026-06-15',
      validTill: '2026-07-15',
      totalAmount: 12000,
      status: 'Draft',
      currency: 'INR',
      notes: 'Draft quote - pending review',
      termsConditions: 'Subject to management approval',
      items: [
        { id: '1', itemCode: 'ITEM-004', itemName: 'Product D', quantity: 12, rate: 1000, amount: 12000 }
      ]
    }
  ]);

  // Letterhead functions
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const uploadLetterHead = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, WEBP)');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLetterHead(base64);
      setLetterHeadName(file.name);
      localStorage.setItem('quotationLetterhead', base64);
      localStorage.setItem('quotationLetterheadName', file.name);
      toast.success('Letterhead uploaded successfully!');
      
      // Reset the input value so the same file can be uploaded again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      toast.error('Failed to upload letterhead');
    };
    reader.readAsDataURL(file);
  };

  const removeLetterHead = () => {
    setLetterHead(null);
    setLetterHeadName('Letterhead');
    localStorage.removeItem('quotationLetterhead');
    localStorage.removeItem('quotationLetterheadName');
    toast.success('Letterhead removed');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'status-draft';
      case 'Sent': return 'status-sent';
      case 'Accepted': return 'status-accepted';
      case 'Rejected': return 'status-rejected';
      case 'Expired': return 'status-expired';
      case 'Converted': return 'status-converted';
      default: return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Draft': return <FaFileAlt size={10} />;
      case 'Sent': return <FaEnvelope size={10} />;
      case 'Accepted': return <FaCheckCircle size={10} />;
      case 'Rejected': return <FaTimesCircle size={10} />;
      case 'Expired': return <FaClock size={10} />;
      case 'Converted': return <FaExternalLinkAlt size={10} />;
      default: return null;
    }
  };

  const filteredQuotations = quotations.filter(q => {
    const matchesSearch = q.quotationNumber.toLowerCase().includes(filterText.toLowerCase()) ||
                         q.customerName.toLowerCase().includes(filterText.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || q.status === selectedStatus;
    const matchesCurrency = selectedCurrency === 'All' || q.currency === selectedCurrency;
    return matchesSearch && matchesStatus && matchesCurrency;
  });

  const getStatusCount = (status: string) => {
    return quotations.filter(q => q.status === status).length;
  };

  const totalAmount = quotations.reduce((sum, q) => sum + q.totalAmount, 0);
  const acceptedAmount = quotations.filter(q => q.status === 'Accepted').reduce((sum, q) => sum + q.totalAmount, 0);
  const conversionRate = totalAmount > 0 ? Math.round((acceptedAmount / totalAmount) * 100) : 0;

  // View Quotation
  const handleView = (quote: Quotation) => {
    setSelectedQuote(quote);
    setShowViewModal(true);
  };

  // Edit Quotation
  const handleEdit = (quote: Quotation) => {
    setSelectedQuote(quote);
    setShowEditModal(true);
  };

  // Update Quotation
  const handleUpdate = () => {
    if (!selectedQuote) return;
    setLoading(true);
    
    setTimeout(() => {
      setQuotations(prev => 
        prev.map(q => q.id === selectedQuote.id ? selectedQuote : q)
      );
      setShowEditModal(false);
      setLoading(false);
      toast.success('Quotation updated successfully!');
    }, 1000);
  };

  // Delete Quotation
  const handleDelete = () => {
    if (!selectedQuote) return;
    setLoading(true);
    
    setTimeout(() => {
      setQuotations(prev => prev.filter(q => q.id !== selectedQuote.id));
      setShowDeleteModal(false);
      setLoading(false);
      toast.success('Quotation deleted successfully!');
    }, 1000);
  };

  // PDF View for single quotation
  const handlePdfView = (quote: Quotation) => {
    setSelectedQuote(quote);
    setShowPdfModal(true);
  };

  // Handle edit form changes
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!selectedQuote) return;
    const { name, value } = e.target;
    setSelectedQuote(prev => prev ? { ...prev, [name]: value } : null);
  };

  // Handle edit item changes
  const handleEditItemChange = (index: number, field: keyof QuotationItem, value: string | number) => {
    if (!selectedQuote) return;
    const updatedItems = [...selectedQuote.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'rate') {
      const qty = field === 'quantity' ? Number(value) : updatedItems[index].quantity;
      const rate = field === 'rate' ? Number(value) : updatedItems[index].rate;
      updatedItems[index].amount = qty * rate;
    }
    
    const total = updatedItems.reduce((sum, item) => sum + item.amount, 0);
    setSelectedQuote({ ...selectedQuote, items: updatedItems, totalAmount: total });
  };

  const statusOptions = [
    { value: 'All', label: 'All' },
    { value: 'Draft', label: 'Draft' },
    { value: 'Sent', label: 'Sent' },
    { value: 'Accepted', label: 'Accepted' },
    { value: 'Converted', label: 'Converted' },
    { value: 'Expired', label: 'Expired' }
  ];

  // Get company details with fallback
  const getCompanyDetails = () => {
    return {
      name: companyDetails.name || 'Manufacturing ERP',
      address: companyDetails.address || '123, Business Park, Mumbai, Maharashtra - 400001',
      website: companyDetails.website || 'www.manufacturingerp.com',
      email: companyDetails.email || 'info@manufacturingerp.com',
      phone: companyDetails.contact || '+91-9876543210',
      gst: companyDetails.gst || '',
      pan: companyDetails.pan || ''
    };
  };

  // Generate HTML for printing the list on letterhead
  const generatePrintHtml = (data: Quotation[]) => {
    const company = getCompanyDetails();
    const total = data.reduce((sum, q) => sum + q.totalAmount, 0);
    const acceptedTotal = data.filter(q => q.status === 'Accepted').reduce((sum, q) => sum + q.totalAmount, 0);
    const conversion = total > 0 ? Math.round((acceptedTotal / total) * 100) : 0;

    const tableRows = data.map(q => `
      <tr>
        <td><strong>${q.quotationNumber}</strong></td>
        <td>${q.customerName}<br/><span class="sub-text">${q.customer}</span></td>
        <td>${new Date(q.date).toLocaleDateString()}</td>
        <td><span class="status-badge ${q.status.toLowerCase()}">${q.status}</span></td>
        <td class="amount">${q.currency} ${q.totalAmount.toLocaleString()}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Quotations Report</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              background: #f0f0f0;
              padding: 20px;
            }
            .letterhead-wrapper {
              position: relative;
              max-width: 1100px;
              margin: 0 auto;
              background: white;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              page-break-after: avoid;
            }
            .letterhead-bg {
              width: 100%;
              display: block;
              opacity: 0.15;
            }
            .content-overlay {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              padding: 100px 50px 50px 50px;
              overflow: hidden;
            }
            .company-header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #1f2937;
              padding-bottom: 15px;
            }
            .company-header h1 {
              font-size: 24px;
              color: #1f2937;
              margin: 0;
              letter-spacing: 2px;
            }
            .company-header .company-details {
              font-size: 12px;
              color: #6b7280;
              margin-top: 5px;
              line-height: 1.6;
            }
            .company-header .company-details span {
              margin: 0 8px;
            }
            .report-header {
              text-align: center;
              margin: 20px 0 30px 0;
            }
            .report-title {
              font-size: 28px;
              font-weight: 700;
              color: #1f2937;
              letter-spacing: 3px;
              border-bottom: 3px solid #1f2937;
              padding-bottom: 10px;
              display: inline-block;
            }
            .report-meta {
              display: flex;
              justify-content: space-between;
              margin: 15px 0 25px 0;
              font-size: 13px;
              color: #6b7280;
              flex-wrap: wrap;
              gap: 10px;
            }
            .report-meta .stats {
              display: flex;
              gap: 20px;
            }
            .report-meta .stats span {
              background: #f3f4f6;
              padding: 4px 12px;
              border-radius: 12px;
            }
            .report-meta .stats span strong {
              color: #1f2937;
            }
            .report-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 13px;
            }
            .report-table thead {
              background: #f8f9fa;
            }
            .report-table th {
              padding: 10px 14px;
              text-align: left;
              font-weight: 600;
              color: #374151;
              border-bottom: 2px solid #e5e7eb;
              text-transform: uppercase;
              font-size: 11px;
              letter-spacing: 0.5px;
            }
            .report-table td {
              padding: 10px 14px;
              border-bottom: 1px solid #f3f4f6;
            }
            .report-table tr:hover {
              background: #f9fafb;
            }
            .report-table .amount {
              font-weight: 600;
              text-align: right;
            }
            .report-table .sub-text {
              font-size: 11px;
              color: #9ca3af;
            }
            .report-table .status-badge {
              display: inline-block;
              padding: 3px 12px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 500;
            }
            .report-table .status-badge.draft { background: #f3f4f6; color: #6b7280; }
            .report-table .status-badge.sent { background: #dbeafe; color: #1e40af; }
            .report-table .status-badge.accepted { background: #d1fae5; color: #065f46; }
            .report-table .status-badge.rejected { background: #fee2e2; color: #991b1b; }
            .report-table .status-badge.expired { background: #fef3c7; color: #92400e; }
            .report-table .status-badge.converted { background: #e0e7ff; color: #3730a3; }
            .report-footer {
              margin-top: 30px;
              padding-top: 16px;
              border-top: 1px solid #e5e7eb;
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              color: #6b7280;
            }
            .report-footer .footer-details {
              line-height: 1.8;
            }
            .report-footer .total-amount {
              font-weight: 700;
              font-size: 16px;
              color: #1f2937;
            }
            .report-footer .total-amount span {
              color: #6366f1;
            }
            .print-watermark {
              position: absolute;
              bottom: 20px;
              right: 30px;
              font-size: 10px;
              color: #9ca3af;
              opacity: 0.5;
            }
            @media print {
              body { background: white; padding: 0; }
              .letterhead-wrapper { box-shadow: none; max-width: 100%; }
              .content-overlay { padding: 80px 40px 40px 40px; }
              .report-table tr:hover { background: transparent; }
              .letterhead-bg { opacity: 0.1; }
            }
            @media (max-width: 768px) {
              .content-overlay { padding: 40px 20px 20px 20px; }
              .report-meta { flex-direction: column; }
              .report-table { font-size: 12px; }
              .report-table th, .report-table td { padding: 6px 10px; }
              .report-title { font-size: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="letterhead-wrapper">
            ${letterHead ? `<img src="${letterHead}" alt="Letterhead" class="letterhead-bg" />` : ''}
            <div class="content-overlay">
              <!-- Company Header with dynamic details -->
              <div class="company-header">
                <h1>${company.name}</h1>
                <div class="company-details">
                  ${company.address}
                  ${company.phone ? `<span>|</span> Phone: ${company.phone}` : ''}
                  ${company.email ? `<span>|</span> Email: ${company.email}` : ''}
                  ${company.website ? `<span>|</span> Website: ${company.website}` : ''}
                  ${company.gst ? `<span>|</span> GST: ${company.gst}` : ''}
                  ${company.pan ? `<span>|</span> PAN: ${company.pan}` : ''}
                </div>
              </div>

              <div class="report-header">
                <div class="report-title">QUOTATIONS REPORT</div>
              </div>
              
              <div class="report-meta">
                <div>
                  <strong>Generated:</strong> ${new Date().toLocaleString()}
                </div>
                <div class="stats">
                  <span>📋 Total: <strong>${data.length}</strong></span>
                  <span>💰 Total Amount: <strong>${data[0]?.currency || 'INR'} ${total.toLocaleString()}</strong></span>
                  <span>📊 Conversion: <strong>${conversion}%</strong></span>
                </div>
              </div>

              <table class="report-table">
                <thead>
                  <tr>
                    <th>Quote #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th style="text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>

              <div class="report-footer">
                <div class="footer-details">
                  <strong>${company.name}</strong><br/>
                  ${company.address}
                  ${company.phone ? `<br/>📞 ${company.phone}` : ''}
                  ${company.email ? `<br/>✉️ ${company.email}` : ''}
                  ${company.website ? `<br/>🌐 ${company.website}` : ''}
                </div>
                <div class="total-amount">
                  Grand Total: <span>${data[0]?.currency || 'INR'} ${total.toLocaleString()}</span>
                </div>
              </div>
              <div class="print-watermark">
                Generated on ${new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  // Handle Print All
  const handlePrintAll = () => {
    setIsPrinting(true);
    
    const dataToPrint = filteredQuotations.length > 0 ? filteredQuotations : quotations;
    const printHtml = generatePrintHtml(dataToPrint);
    
    // Open print window
    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (printWindow) {
      printWindow.document.write(printHtml);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for images to load, then print
      setTimeout(() => {
        printWindow.print();
        setIsPrinting(false);
      }, 1000);
    } else {
      toast.error('Please allow popups for printing');
      setIsPrinting(false);
    }
  };

  // Save company details
  const saveCompanyDetails = () => {
    Object.entries(companyDetails).forEach(([key, value]) => {
      const storageKey = `company${key.charAt(0).toUpperCase() + key.slice(1)}`;
      localStorage.setItem(storageKey, value);
    });
    toast.success('Company details saved successfully!');
    setShowCompanyForm(false);
  };

  return (
    <div className={`quotation-page ${theme}-theme`}>
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Quotations</h1>
          <span className="badge">{quotations.length}</span>
        </div>
        <div className="header-actions">
          {/* Company Details Button */}
          <button 
            className="btn-secondary" 
            onClick={() => setShowCompanyForm(true)}
            title="Update company details for letterhead"
          >
            <FaBuilding size={12} /> Company Details
          </button>
          
          {/* Letterhead Upload */}
          <div className="letterhead-actions">
            {letterHead ? (
              <>
                <button 
                  className="btn-icon" 
                  onClick={removeLetterHead}
                  title="Remove Letterhead"
                  style={{ color: '#ef4444' }}
                >
                  <FaTimes size={14} />
                </button>
                <span className="letterhead-indicator" title={letterHeadName}>
                  <FaImage size={12} /> {letterHeadName.length > 20 ? letterHeadName.substring(0, 20) + '...' : letterHeadName}
                </span>
              </>
            ) : (
              <>
                <button 
                  className="btn-secondary" 
                  onClick={handleUploadClick}
                  style={{ cursor: 'pointer' }}
                >
                  <FaUpload size={12} /> Upload Letterhead
                </button>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={uploadLetterHead} 
                  style={{ display: 'none' }} 
                />
              </>
            )}
          </div>
          
          {/* Print All Button */}
          <button 
            className="btn-primary" 
            onClick={handlePrintAll}
            disabled={isPrinting}
            title="Print all quotations on letterhead"
          >
            <FaPrint size={14} /> {isPrinting ? 'Printing...' : 'Print All'}
          </button>
          
          <button className="btn-primary" onClick={() => navigate('/quotation/new')}>
            <FaPlus size={12} /> New Quote
          </button>
        </div>
      </div>

      {/* Compact Stats */}
      <div className="compact-stats">
        <div className="stat-item">
          <span className="stat-label">Total</span>
          <span className="stat-value">₹{totalAmount.toLocaleString()}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-label">Accepted</span>
          <span className="stat-value stat-accepted">₹{acceptedAmount.toLocaleString()}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-label">Conversion</span>
          <span className="stat-value stat-rate">{conversionRate}%</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-label">Pending</span>
          <span className="stat-value stat-pending">{getStatusCount('Sent') + getStatusCount('Draft')}</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="search-bar">
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search quotes or customers..."
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
            className="status-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label} ({getStatusCount(opt.value === 'All' ? 'All' : opt.value)})
              </option>
            ))}
          </select>
          <button 
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter size={12} />
          </button>
        </div>
      </div>

      {/* Expandable Filters */}
      {showFilters && (
        <div className="expandable-filters">
          <div className="filter-group">
            <label>Currency</label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
            >
              <option value="All">All Currencies</option>
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Date Range</label>
            <div className="date-range">
              <input type="date" placeholder="From" />
              <span>to</span>
              <input type="date" placeholder="To" />
            </div>
          </div>
          <button className="apply-filters">Apply</button>
        </div>
      )}

      {/* Quotations List */}
      <div className="quotes-list">
        {filteredQuotations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FaFileAlt size={40} />
            </div>
            <h3>No quotations yet</h3>
            <p>Create your first quotation</p>
            <button className="btn-primary" onClick={() => navigate('/quotation/new')}>
              <FaPlus size={12} /> New Quotation
            </button>
          </div>
        ) : (
          <div className="quotes-table-wrapper">
            <table className="quotes-table">
              <thead>
                <tr>
                  <th>Quote</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-right">Amount</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotations.map((quote) => (
                  <tr key={quote.id} className="quote-row">
                    <td>
                      <span className="quote-number">{quote.quotationNumber}</span>
                    </td>
                    <td>
                      <div className="customer-cell">
                        <span className="customer-name">{quote.customerName}</span>
                        <span className="customer-code">{quote.customer}</span>
                      </div>
                    </td>
                    <td>
                      <span className="date-cell">
                        {new Date(quote.date).toLocaleDateString()}
                      </span>
                      <span className="valid-cell">
                        Valid: {new Date(quote.validTill).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusColor(quote.status)}`}>
                        {getStatusIcon(quote.status)}
                        {quote.status}
                      </span>
                    </td>
                    <td className="text-right amount-cell">
                      <span className="currency">{quote.currency}</span>
                      {quote.totalAmount.toLocaleString()}
                    </td>
                    <td>
                      <div className="action-group">
                        <button 
                          className="action-btn view" 
                          title="View"
                          onClick={() => handleView(quote)}
                        >
                          <FaEye size={12} />
                        </button>
                        <button 
                          className="action-btn pdf" 
                          title="PDF"
                          onClick={() => handlePdfView(quote)}
                        >
                          <FaFilePdf size={12} />
                        </button>
                        <button 
                          className="action-btn edit" 
                          title="Edit"
                          onClick={() => handleEdit(quote)}
                        >
                          <FaEdit size={12} />
                        </button>
                        <button 
                          className="action-btn delete" 
                          title="Delete"
                          onClick={() => {
                            setSelectedQuote(quote);
                            setShowDeleteModal(true);
                          }}
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
        <span>{filteredQuotations.length} of {quotations.length} quotes</span>
        <div className="footer-actions">
          <span className="conversion-badge">
            <FaChartLine size={11} /> {conversionRate}% conversion
          </span>
        </div>
      </div>

      {/* ====== VIEW MODAL ====== */}
      {showViewModal && selectedQuote && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedQuote.quotationNumber}</h2>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body view-body">
              <div className="view-grid">
                <div className="view-section">
                  <h4>Customer Details</h4>
                  <div className="view-row"><label>Name:</label><span>{selectedQuote.customerName}</span></div>
                  <div className="view-row"><label>Code:</label><span>{selectedQuote.customer}</span></div>
                  <div className="view-row"><label>Email:</label><span>{selectedQuote.customerEmail || 'N/A'}</span></div>
                  <div className="view-row"><label>Phone:</label><span>{selectedQuote.customerPhone || 'N/A'}</span></div>
                  <div className="view-row"><label>Address:</label><span>{selectedQuote.customerAddress || 'N/A'}</span></div>
                </div>
                <div className="view-section">
                  <h4>Quote Details</h4>
                  <div className="view-row"><label>Status:</label><span className={`status-badge ${getStatusColor(selectedQuote.status)}`}>{selectedQuote.status}</span></div>
                  <div className="view-row"><label>Date:</label><span>{new Date(selectedQuote.date).toLocaleDateString()}</span></div>
                  <div className="view-row"><label>Valid Till:</label><span>{new Date(selectedQuote.validTill).toLocaleDateString()}</span></div>
                  <div className="view-row"><label>Currency:</label><span>{selectedQuote.currency}</span></div>
                  <div className="view-row"><label>Total:</label><span className="view-total">{selectedQuote.currency} {selectedQuote.totalAmount.toLocaleString()}</span></div>
                </div>
              </div>
              <div className="view-section full-width">
                <h4>Items</h4>
                <table className="view-items-table">
                  <thead>
                    <tr><th>Code</th><th>Name</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
                  </thead>
                  <tbody>
                    {selectedQuote.items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.itemCode}</td>
                        <td>{item.itemName}</td>
                        <td>{item.quantity}</td>
                        <td>{selectedQuote.currency} {item.rate}</td>
                        <td>{selectedQuote.currency} {item.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr><td colSpan={4} className="total-label">Total</td><td className="total-amount">{selectedQuote.currency} {selectedQuote.totalAmount}</td></tr>
                  </tfoot>
                </table>
              </div>
              {selectedQuote.notes && (
                <div className="view-section full-width">
                  <h4>Notes</h4>
                  <p>{selectedQuote.notes}</p>
                </div>
              )}
              {selectedQuote.termsConditions && (
                <div className="view-section full-width">
                  <h4>Terms & Conditions</h4>
                  <p>{selectedQuote.termsConditions}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
              <button className="btn-primary" onClick={() => handlePdfView(selectedQuote)}>
                <FaFilePdf size={12} /> PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== EDIT MODAL ====== */}
      {showEditModal && selectedQuote && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-container edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit {selectedQuote.quotationNumber}</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body edit-body">
              <div className="edit-form">
                <div className="edit-grid">
                  <div className="form-group">
                    <label>Customer Name *</label>
                    <input
                      type="text"
                      name="customerName"
                      value={selectedQuote.customerName}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Customer Code</label>
                    <input
                      type="text"
                      name="customer"
                      value={selectedQuote.customer}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="customerEmail"
                      value={selectedQuote.customerEmail}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="text"
                      name="customerPhone"
                      value={selectedQuote.customerPhone}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Address</label>
                    <input
                      type="text"
                      name="customerAddress"
                      value={selectedQuote.customerAddress}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      name="date"
                      value={selectedQuote.date}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Valid Till</label>
                    <input
                      type="date"
                      name="validTill"
                      value={selectedQuote.validTill}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      name="status"
                      value={selectedQuote.status}
                      onChange={handleEditChange}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Sent">Sent</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Expired">Expired</option>
                      <option value="Converted">Converted</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Currency</label>
                    <select
                      name="currency"
                      value={selectedQuote.currency}
                      onChange={handleEditChange}
                    >
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>

                <h4>Items</h4>
                <div className="edit-items-table-wrapper">
                  <table className="edit-items-table">
                    <thead>
                      <tr><th>Code</th><th>Name</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
                    </thead>
                    <tbody>
                      {selectedQuote.items.map((item, index) => (
                        <tr key={item.id}>
                          <td>
                            <input
                              type="text"
                              value={item.itemCode}
                              onChange={(e) => handleEditItemChange(index, 'itemCode', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={item.itemName}
                              onChange={(e) => handleEditItemChange(index, 'itemName', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleEditItemChange(index, 'quantity', Number(e.target.value))}
                              min="1"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={item.rate}
                              onChange={(e) => handleEditItemChange(index, 'rate', Number(e.target.value))}
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className="amount-cell">{selectedQuote.currency} {item.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr><td colSpan={4} className="total-label">Total</td><td className="total-amount">{selectedQuote.currency} {selectedQuote.totalAmount.toFixed(2)}</td></tr>
                    </tfoot>
                  </table>
                </div>

                <div className="edit-grid">
                  <div className="form-group full-width">
                    <label>Notes</label>
                    <textarea
                      name="notes"
                      value={selectedQuote.notes}
                      onChange={handleEditChange}
                      rows={2}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Terms & Conditions</label>
                    <textarea
                      name="termsConditions"
                      value={selectedQuote.termsConditions}
                      onChange={handleEditChange}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleUpdate} disabled={loading}>
                {loading && <FaSpinner className="spinning" />}
                <FaSave size={12} /> Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== DELETE MODAL ====== */}
      {showDeleteModal && selectedQuote && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-container delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Quotation</h2>
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
                You are about to delete <strong>{selectedQuote.quotationNumber}</strong> for 
                <strong> {selectedQuote.customerName}</strong>.
              </p>
              <p className="delete-warning">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn-danger" onClick={handleDelete} disabled={loading}>
                {loading && <FaSpinner className="spinning" />}
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== PDF MODAL ====== */}
      {showPdfModal && selectedQuote && (
        <div className="modal-overlay" onClick={() => setShowPdfModal(false)}>
          <div className="modal-container pdf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedQuote.quotationNumber} - PDF Preview</h2>
              <button className="modal-close" onClick={() => setShowPdfModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body pdf-body">
              {/* PDF Content - Single Quotation with Letterhead */}
              <div className="pdf-content">
                {letterHead && (
                  <div className="letterhead-container">
                    <img 
                      src={letterHead} 
                      alt="Letterhead" 
                      className="letterhead-image" 
                    />
                    <hr className="letterhead-divider" />
                  </div>
                )}

                <div className="pdf-header">
                  <div className="pdf-title">QUOTATION</div>
                  <div className="pdf-number">{selectedQuote.quotationNumber}</div>
                </div>
                
                <div className="pdf-company">
                  <h2>{getCompanyDetails().name}</h2>
                  <p>{getCompanyDetails().address}</p>
                  <p>Phone: {getCompanyDetails().phone} | Email: {getCompanyDetails().email}</p>
                </div>

                <div className="pdf-customer">
                  <div className="pdf-section-title">Customer Details</div>
                  <div className="pdf-row"><strong>Name:</strong> {selectedQuote.customerName}</div>
                  <div className="pdf-row"><strong>Code:</strong> {selectedQuote.customer}</div>
                  <div className="pdf-row"><strong>Email:</strong> {selectedQuote.customerEmail || 'N/A'}</div>
                  <div className="pdf-row"><strong>Phone:</strong> {selectedQuote.customerPhone || 'N/A'}</div>
                  <div className="pdf-row"><strong>Address:</strong> {selectedQuote.customerAddress || 'N/A'}</div>
                </div>

                <div className="pdf-dates">
                  <div className="pdf-row"><strong>Date:</strong> {new Date(selectedQuote.date).toLocaleDateString()}</div>
                  <div className="pdf-row"><strong>Valid Till:</strong> {new Date(selectedQuote.validTill).toLocaleDateString()}</div>
                  <div className="pdf-row"><strong>Status:</strong> {selectedQuote.status}</div>
                  <div className="pdf-row"><strong>Currency:</strong> {selectedQuote.currency}</div>
                </div>

                <table className="pdf-items-table">
                  <thead>
                    <tr><th>Item Code</th><th>Item Name</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
                  </thead>
                  <tbody>
                    {selectedQuote.items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.itemCode}</td>
                        <td>{item.itemName}</td>
                        <td>{item.quantity}</td>
                        <td>{selectedQuote.currency} {item.rate}</td>
                        <td>{selectedQuote.currency} {item.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr><td colSpan={4} className="pdf-total-label">Total Amount</td><td className="pdf-total-amount">{selectedQuote.currency} {selectedQuote.totalAmount}</td></tr>
                  </tfoot>
                </table>

                {selectedQuote.notes && (
                  <div className="pdf-notes">
                    <div className="pdf-section-title">Notes</div>
                    <p>{selectedQuote.notes}</p>
                  </div>
                )}

                {selectedQuote.termsConditions && (
                  <div className="pdf-terms">
                    <div className="pdf-section-title">Terms & Conditions</div>
                    <p>{selectedQuote.termsConditions}</p>
                  </div>
                )}

                <div className="pdf-footer">
                  <p>This is a computer-generated quotation. No signature required.</p>
                  <p>Thank you for your business!</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowPdfModal(false)}>Close</button>
              <button className="btn-primary" onClick={() => {
                toast.success('PDF downloaded successfully!');
                setShowPdfModal(false);
              }}>
                <FaFilePdf size={12} /> Download PDF
              </button>
              <button className="btn-primary" onClick={() => {
                toast.success('PDF sent to email!');
                setShowPdfModal(false);
              }}>
                <FaEnvelope size={12} /> Email PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== COMPANY DETAILS MODAL ====== */}
      {showCompanyForm && (
        <div className="modal-overlay" onClick={() => setShowCompanyForm(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Company Details</h2>
              <button className="modal-close" onClick={() => setShowCompanyForm(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="edit-form">
                <div className="edit-grid">
                  <div className="form-group full-width">
                    <label>Company Name *</label>
                    <input
                      type="text"
                      value={companyDetails.name}
                      onChange={(e) => setCompanyDetails(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Address *</label>
                    <input
                      type="text"
                      value={companyDetails.address}
                      onChange={(e) => setCompanyDetails(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Enter company address"
                    />
                  </div>
                  <div className="form-group">
                    <label>Website</label>
                    <input
                      type="text"
                      value={companyDetails.website}
                      onChange={(e) => setCompanyDetails(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="Enter website URL"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={companyDetails.email}
                      onChange={(e) => setCompanyDetails(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter company email"
                    />
                  </div>
                  <div className="form-group">
                    <label>Contact Number</label>
                    <input
                      type="text"
                      value={companyDetails.contact}
                      onChange={(e) => setCompanyDetails(prev => ({ ...prev, contact: e.target.value }))}
                      placeholder="Enter contact number"
                    />
                  </div>
                  <div className="form-group">
                    <label>GST Number</label>
                    <input
                      type="text"
                      value={companyDetails.gst}
                      onChange={(e) => setCompanyDetails(prev => ({ ...prev, gst: e.target.value }))}
                      placeholder="Enter GST number"
                    />
                  </div>
                  <div className="form-group">
                    <label>PAN Number</label>
                    <input
                      type="text"
                      value={companyDetails.pan}
                      onChange={(e) => setCompanyDetails(prev => ({ ...prev, pan: e.target.value }))}
                      placeholder="Enter PAN number"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCompanyForm(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveCompanyDetails}>
                <FaSave size={12} /> Save Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}