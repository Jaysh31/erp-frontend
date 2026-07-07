import React, { useState, useEffect } from 'react';
import { 
  FaSave, 
  FaTimes, 
  FaPrint,
  FaPaperPlane,
  FaWarehouse,

  FaTruck,
  FaRoad,
  FaUserTie,
  FaFileInvoice,
  FaCalendarAlt,
  FaIdCard,
  FaHashtag,
  FaBox,
  FaInfoCircle,
  FaFileContract,
  FaPhone,
} from 'react-icons/fa';
import { useNavigate,  } from 'react-router-dom';

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
  shippingAddress: string;
  gstin: string;
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
  customer: Customer;
  invoiceDate: string;
  dueDate: string;
  salesOrderNo: string;
  salesPerson: string;
  paymentTerms: string;
  company: string;
  branch: string;
  grandTotal: number;
  poNo?: string;
  poDate?: string;
  items: InvoiceItem[];
  deliveryStatus: 'Pending' | 'Partial Dispatch' | 'Fully Dispatched';
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

const NewDeliveryChallan: React.FC = () => {
  const navigate = useNavigate();
  // const location = useLocation();
  
  // State
  const [selectedInvoice, setSelectedInvoice] = useState<string>('');
  const [dcDate, setDcDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [warehouse, setWarehouse] = useState<string>('');
  const [transporter, setTransporter] = useState<string>('');
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [lrNumber, setLrNumber] = useState<string>('');
  const [lrDate, setLrDate] = useState<string>('');
  const [eWayBillNumber, setEWayBillNumber] = useState<string>('');
  const [poNumber, setPoNumber] = useState<string>('');
  const [poDate, setPoDate] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [items, setItems] = useState<DeliveryChallanItem[]>([]);
  const [invoiceData, setInvoiceData] = useState<Invoice | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dcNumber, ] = useState<string>('DC-2024-007');

  // Sample invoices for dropdown - Only invoices with pending dispatch
  const availableInvoices: Invoice[] = [
    {
      id: '1',
      invoiceNo: 'INV-2024-001',
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
      invoiceDate: '2024-01-15',
      dueDate: '2024-02-14',
      salesOrderNo: 'SO-2024-001',
      salesPerson: 'Rajesh Kumar',
      paymentTerms: 'Net 30',
      company: 'SculptERP Pvt Ltd',
      branch: 'Mumbai',
      grandTotal: 150000,
      poNo: 'PO-2024-001',
      poDate: '2024-01-10',
      deliveryStatus: 'Partial Dispatch',
      items: [
        {
          id: 'i1',
          itemCode: 'PRD-P001',
          description: 'Industrial Pump - 5 HP',
          quantity: 10,
          deliveredQty: 7,
          remainingQty: 3,
          unit: 'pcs',
          rate: 1500,
          amount: 15000
        }
      ]
    },
    {
      id: '2',
      invoiceNo: 'INV-2024-002',
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
      grandTotal: 94400,
      poNo: 'PO-2024-002',
      poDate: '2024-02-12',
      deliveryStatus: 'Pending',
      items: [
        {
          id: 'i2',
          itemCode: 'PRD-S001',
          description: 'Submersible Pump - 2 HP',
          quantity: 5,
          deliveredQty: 0,
          remainingQty: 5,
          unit: 'pcs',
          rate: 2000,
          amount: 10000
        }
      ]
    }
  ];

  // Load invoice data when selected
  useEffect(() => {
    if (selectedInvoice) {
      const invoice = availableInvoices.find(inv => inv.id === selectedInvoice);
      if (invoice) {
        setInvoiceData(invoice);
        // Auto-populate PO details
        setPoNumber(invoice.poNo || '');
        setPoDate(invoice.poDate || '');
        // Initialize items with remaining quantities
        const initialItems: DeliveryChallanItem[] = invoice.items.map(item => ({
          id: `dc-${item.id}`,
          itemId: item.id,
          itemCode: item.itemCode,
          description: item.description,
          invoiceQty: item.quantity,
          deliveredQty: item.deliveredQty,
          remainingQty: item.remainingQty,
          dispatchQty: 0,
          unit: item.unit
        }));
        setItems(initialItems);
        setErrors({});
      }
    } else {
      setInvoiceData(null);
      setItems([]);
      setPoNumber('');
      setPoDate('');
    }
  }, [selectedInvoice]);

  // Format currency
  // const formatCurrency = (amount: number) => {
  //   return new Intl.NumberFormat('en-IN', {
  //     style: 'currency',
  //     currency: 'INR',
  //     minimumFractionDigits: 2,
  //     maximumFractionDigits: 2
  //   }).format(amount);
  // };

  // Update dispatch quantity
  const updateDispatchQty = (itemId: string, value: number) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const maxQty = item.remainingQty;
        const newQty = Math.min(Math.max(0, value), maxQty);
        return { ...item, dispatchQty: newQty };
      }
      return item;
    }));
  };

  // Calculate totals
  const getTotalDispatchQty = () => {
    return items.reduce((sum, item) => sum + item.dispatchQty, 0);
  };

  const getTotalRemaining = () => {
    return items.reduce((sum, item) => sum + (item.remainingQty - item.dispatchQty), 0);
  };

  const getTotalInvoiceQty = () => {
    return items.reduce((sum, item) => sum + item.invoiceQty, 0);
  };

  const getTotalDeliveredQty = () => {
    return items.reduce((sum, item) => sum + item.deliveredQty, 0);
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedInvoice) {
      newErrors.invoice = 'Please select an invoice';
    }

    if (!dcDate) {
      newErrors.dcDate = 'DC Date is required';
    }

    if (!warehouse) {
      newErrors.warehouse = 'Warehouse is required';
    }

    const hasDispatch = items.some(item => item.dispatchQty > 0);
    if (!hasDispatch) {
      newErrors.items = 'At least one item must have dispatch quantity > 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handlers
  const handleSubmit = () => {
    if (validateForm()) {
      setIsSubmitting(true);
      
      const dcData = {
        dcNumber,
        dcDate,
        invoiceNo: invoiceData?.invoiceNo,
        customer: invoiceData?.customer,
        warehouse,
        transporter,
        vehicleNumber,
        driverName,
        lrNumber,
        lrDate,
        eWayBillNumber,
        poNumber,
        poDate,
        remarks,
        items,
        totalDispatchQty: getTotalDispatchQty(),
        deliveryStatus: getTotalRemaining() === 0 ? 'Fully Dispatched' : 'Partial Dispatch'
      };
      
      console.log('Submitting DC:', dcData);
      
      setIsSubmitting(false);
      
      // Navigate back to DC list
      navigate('/delivery-challans');
    }
  };

  const handleSaveDraft = () => {
    console.log('Saving draft DC');
    navigate('/delivery-challans');
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Unsaved data will be lost.')) {
      navigate('/delivery-challans');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="new-dc-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <span>Accounts</span>
            <span className="separator">/</span>
            <span>Receivables</span>
            <span className="separator">/</span>
            <span className="active">New Delivery Challan</span>
          </div>
          <h1 className="page-title">
            <FaTruck className="title-icon" />
            Create Delivery Challan
          </h1>
          <p className="page-subtitle">Create a new delivery challan against a customer invoice</p>
        </div>
        <div className="page-header-right">
          <button className="btn-secondary" onClick={handlePrint}>
            <FaPrint /> Print
          </button>
          <button className="btn-secondary" onClick={handleSaveDraft}>
            <FaSave /> Save Draft
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
            <FaPaperPlane /> {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
          <button className="btn-secondary" onClick={handleCancel}>
            <FaTimes /> Cancel
          </button>
        </div>
      </div>

      {/* Form Body */}
      <div className="form-body">
        {/* Invoice Selection Section */}
        <div className="form-section">
          <div className="form-section-header">
            <h3>Invoice Information</h3>
            <span className="required-label">* Required fields</span>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Invoice No *</label>
              <div className="input-with-icon">
                <FaFileInvoice className="input-icon" />
                <select 
                  className={`form-select ${errors.invoice ? 'error' : ''}`}
                  value={selectedInvoice}
                  onChange={(e) => setSelectedInvoice(e.target.value)}
                >
                  <option value="">Select Invoice</option>
                  {availableInvoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNo} - {inv.customer.name} (Pending: {inv.items.reduce((sum, i) => sum + i.remainingQty, 0)})
                    </option>
                  ))}
                </select>
              </div>
              {errors.invoice && <span className="error-text">{errors.invoice}</span>}
            </div>

            <div className="form-group">
              <label>DC Number</label>
              <input 
                type="text" 
                className="form-input"
                value={dcNumber}
                disabled
              />
            </div>

            <div className="form-group">
              <label>DC Date *</label>
              <div className="input-with-icon">
                <FaCalendarAlt className="input-icon" />
                <input 
                  type="date" 
                  className={`form-input ${errors.dcDate ? 'error' : ''}`}
                  value={dcDate}
                  onChange={(e) => setDcDate(e.target.value)}
                />
              </div>
              {errors.dcDate && <span className="error-text">{errors.dcDate}</span>}
            </div>
          </div>
        </div>

        {/* Auto-populated Invoice Details */}
        {invoiceData && (
          <div className="form-section invoice-details">
            <div className="form-section-header">
              <h3>Invoice Details</h3>
              <span className="readonly-badge"><FaInfoCircle /> Auto-populated</span>
            </div>
            <div className="invoice-info-grid">
              <div className="info-group">
                <label>Customer</label>
                <div className="info-value">
                  <strong>{invoiceData.customer.name}</strong>
                  <span className="sub">{invoiceData.customer.code}</span>
                </div>
              </div>
              <div className="info-group">
                <label>Contact Person</label>
                <div className="info-value">
                  {invoiceData.customer.contactPerson || 'N/A'}
                  {invoiceData.customer.contactMobile && (
                    <span className="sub"><FaPhone className="inline-icon" /> {invoiceData.customer.contactMobile}</span>
                  )}
                </div>
              </div>
              <div className="info-group">
                <label>Billing Address</label>
                <div className="info-value">{invoiceData.customer.address}</div>
              </div>
              <div className="info-group">
                <label>Shipping Address</label>
                <div className="info-value">{invoiceData.customer.shippingAddress}</div>
              </div>
              <div className="info-group">
                <label>Invoice Date</label>
                <div className="info-value">{new Date(invoiceData.invoiceDate).toLocaleDateString('en-IN')}</div>
              </div>
              <div className="info-group">
                <label>Sales Order No</label>
                <div className="info-value">{invoiceData.salesOrderNo}</div>
              </div>
              <div className="info-group">
                <label>Sales Person</label>
                <div className="info-value">{invoiceData.salesPerson}</div>
              </div>
              <div className="info-group">
                <label>Payment Terms</label>
                <div className="info-value">{invoiceData.paymentTerms}</div>
              </div>
              <div className="info-group">
                <label>GST Number</label>
                <div className="info-value">{invoiceData.customer.gstin}</div>
              </div>
              <div className="info-group">
                <label>Company</label>
                <div className="info-value">{invoiceData.company}</div>
              </div>
              <div className="info-group">
                <label>Branch</label>
                <div className="info-value">{invoiceData.branch}</div>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Order Details */}
        {invoiceData && (
          <div className="form-section">
            <div className="form-section-header">
              <h3>Purchase Order Details</h3>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>PO Number</label>
                <div className="input-with-icon">
                  <FaFileContract className="input-icon" />
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="Customer PO Number"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>PO Date</label>
                <div className="input-with-icon">
                  <FaCalendarAlt className="input-icon" />
                  <input 
                    type="date" 
                    className="form-input"
                    value={poDate}
                    onChange={(e) => setPoDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dispatch Information */}
        <div className="form-section">
          <div className="form-section-header">
            <h3>Dispatch Information</h3>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Warehouse *</label>
              <div className="input-with-icon">
                <FaWarehouse className="input-icon" />
                <select 
                  className={`form-select ${errors.warehouse ? 'error' : ''}`}
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                >
                  <option value="">Select Warehouse</option>
                  <option value="Main Warehouse">Main Warehouse</option>
                  <option value="Secondary Warehouse">Secondary Warehouse</option>
                  <option value="Store Front">Store Front</option>
                </select>
              </div>
              {errors.warehouse && <span className="error-text">{errors.warehouse}</span>}
            </div>

            <div className="form-group">
              <label>Transporter</label>
              <div className="input-with-icon">
                <FaTruck className="input-icon" />
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Enter transporter name"
                  value={transporter}
                  onChange={(e) => setTransporter(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Vehicle Number</label>
              <div className="input-with-icon">
                <FaHashtag className="input-icon" />
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Enter vehicle number"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Driver Name</label>
              <div className="input-with-icon">
                <FaUserTie className="input-icon" />
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Enter driver name"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>LR Number</label>
              <div className="input-with-icon">
                <FaIdCard className="input-icon" />
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Enter LR number"
                  value={lrNumber}
                  onChange={(e) => setLrNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>LR Date</label>
              <div className="input-with-icon">
                <FaCalendarAlt className="input-icon" />
                <input 
                  type="date" 
                  className="form-input"
                  value={lrDate}
                  onChange={(e) => setLrDate(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>E-Way Bill Number</label>
              <div className="input-with-icon">
                <FaRoad className="input-icon" />
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Enter E-Way bill number"
                  value={eWayBillNumber}
                  onChange={(e) => setEWayBillNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label>Remarks / Instructions</label>
              <textarea 
                className="form-textarea"
                rows={2}
                placeholder="Enter any additional notes or special instructions..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="form-section">
          <div className="form-section-header">
            <h3>Products</h3>
            <span className="items-count">{items.length} items</span>
          </div>
          {errors.items && (
            <div className="error-banner">{errors.items}</div>
          )}
          <div className="items-table-container">
            <table className="items-table">
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Invoice Qty</th>
                  <th style={{ textAlign: 'right' }}>Delivered Qty</th>
                  <th style={{ textAlign: 'right' }}>Remaining Qty</th>
                  <th style={{ textAlign: 'right' }}>Dispatch Qty *</th>
                  <th style={{ textAlign: 'right' }}>UOM</th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? (
                  items.map(item => (
                    <tr key={item.id}>
                      <td>{item.itemCode}</td>
                      <td>{item.description}</td>
                      <td style={{ textAlign: 'right' }}>{item.invoiceQty}</td>
                      <td style={{ textAlign: 'right' }}>{item.deliveredQty}</td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>{item.remainingQty}</td>
                      <td style={{ textAlign: 'right' }}>
                        <input 
                          type="number" 
                          className={`form-input dispatch-input ${item.remainingQty === 0 ? 'disabled' : ''}`}
                          value={item.dispatchQty}
                          onChange={(e) => updateDispatchQty(item.id, parseFloat(e.target.value) || 0)}
                          min="0"
                          max={item.remainingQty}
                          disabled={item.remainingQty === 0}
                          style={{ width: '80px', textAlign: 'right' }}
                        />
                        {item.remainingQty === 0 && (
                          <span className="disabled-label">Fully Dispatched</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>{item.unit}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="empty-items">
                      <div className="empty-items-content">
                        <FaBox className="empty-icon-small" />
                        <span>Select an invoice to load products</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dispatch Summary */}
        {items.length > 0 && (
          <div className="form-section summary-section">
            <div className="summary-grid">
              <div className="summary-left">
                <h4>Dispatch Summary</h4>
                <div className="summary-row">
                  <span>Total Invoice Quantity</span>
                  <span>{getTotalInvoiceQty()}</span>
                </div>
                <div className="summary-row">
                  <span>Already Delivered</span>
                  <span>{getTotalDeliveredQty()}</span>
                </div>
                <div className="summary-row">
                  <span>Current Dispatch</span>
                  <span className="text-blue">{getTotalDispatchQty()}</span>
                </div>
                <div className="summary-row grand-total">
                  <span>Balance After Dispatch</span>
                  <span className={getTotalRemaining() > 0 ? 'text-red' : 'text-green'}>
                    {getTotalRemaining()}
                  </span>
                </div>
              </div>
              <div className="summary-right">
                <div className="status-card">
                  <div className="status-row">
                    <span className="status-label">Delivery Status</span>
                    <span className={`status-value ${getTotalRemaining() === 0 ? 'fully-dispatched' : 'partial'}`}>
                      {getTotalRemaining() === 0 ? '✅ Fully Dispatched' : '⚠️ Partial Dispatch'}
                    </span>
                  </div>
                  <div className="status-row">
                    <span className="status-label">Total Items</span>
                    <span className="status-value">{items.length}</span>
                  </div>
                  <div className="status-row">
                    <span className="status-label">DC Status</span>
                    <span className="status-value draft">Draft</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Footer */}
        <div className="form-footer">
          <div className="form-footer-left">
            <button className="btn-secondary" onClick={handlePrint}>
              <FaPrint /> Print
            </button>
          </div>
          <div className="form-footer-right">
            <button className="btn-secondary" onClick={handleSaveDraft}>
              <FaSave /> Save Draft
            </button>
            <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
              <FaPaperPlane /> {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
            <button className="btn-secondary" onClick={handleCancel}>
              <FaTimes /> Cancel
            </button>
          </div>
        </div>
      </div>

      <style>{`
        /* ===== NEW DELIVERY CHALLAN PAGE ===== */
        .new-dc-page {
          padding: 24px;
          background: #f8fafc;
          min-height: 100vh;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* ===== PAGE HEADER ===== */
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          padding: 20px 24px;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
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

        .breadcrumb .separator {
          color: #e2e8f0;
        }

        .breadcrumb .active {
          color: #1e293b;
          font-weight: 500;
        }

        .page-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0;
        }

        .page-title .title-icon {
          color: #2c7a8a;
        }

        .page-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .page-header-right {
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
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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
          background: #f8fafc;
          border-color: #2563eb;
          color: #2563eb;
        }

        /* ===== FORM BODY ===== */
        .form-body {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-section {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
          padding: 20px 24px;
        }

        .form-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .form-section-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .required-label {
          font-size: 12px;
          color: #94a3b8;
        }

        .readonly-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          background: #f3f4f6;
          color: #6b7280;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .items-count {
          font-size: 13px;
          color: #94a3b8;
        }

        /* ===== FORM GRID ===== */
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        }

        .form-grid .full-width {
          grid-column: 1 / -1;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .form-group label {
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
        }

        .input-with-icon {
          position: relative;
        }

        .input-with-icon .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 14px;
        }

        .input-with-icon .form-input,
        .input-with-icon .form-select {
          padding-left: 36px;
        }

        .form-input,
        .form-select,
        .form-textarea {
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          background: #f8fafc;
          color: #1e293b;
          transition: all 0.2s;
          width: 100%;
          font-family: inherit;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
          background: #ffffff;
        }

        .form-input:disabled {
          background: #f3f4f6;
          cursor: not-allowed;
          opacity: 0.8;
        }

        .form-input.error,
        .form-select.error {
          border-color: #ef4444;
        }

        .form-textarea {
          resize: vertical;
          min-height: 60px;
        }

        .form-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M6 8L1 3h10z' fill='%2364748b'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
        }

        .error-text {
          font-size: 12px;
          color: #ef4444;
          margin-top: 4px;
        }

        .error-banner {
          padding: 10px 16px;
          background: #fef2f2;
          border: 1px solid #ef4444;
          border-radius: 8px;
          color: #ef4444;
          font-size: 14px;
          margin-bottom: 12px;
        }

        .inline-icon {
          font-size: 11px;
          margin-right: 4px;
        }

        /* ===== INVOICE DETAILS ===== */
        .invoice-details {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .invoice-info-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .info-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .info-group label {
          font-size: 11px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-group .info-value {
          font-size: 13px;
          color: #1e293b;
        }

        .info-group .info-value .sub {
          display: block;
          font-size: 12px;
          color: #94a3b8;
        }

        /* ===== ITEMS TABLE ===== */
        .items-table-container {
          overflow-x: auto;
        }

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
          letter-spacing: 0.5px;
          border-bottom: 2px solid #e2e8f0;
        }

        .items-table td {
          padding: 8px 12px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .items-table .form-input {
          padding: 6px 8px;
          font-size: 13px;
        }

        .items-table .dispatch-input {
          width: 80px;
          text-align: right;
        }

        .items-table .dispatch-input.disabled {
          background: #f3f4f6;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .items-table .disabled-label {
          font-size: 11px;
          color: #10b981;
          font-weight: 500;
          margin-left: 6px;
        }

        .empty-items {
          padding: 40px 20px !important;
          text-align: center !important;
        }

        .empty-items-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #94a3b8;
          font-size: 14px;
        }

        .empty-icon-small {
          font-size: 24px;
        }

        /* ===== SUMMARY SECTION ===== */
        .summary-section {
          padding: 20px 24px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }

        .summary-left h4 {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 12px 0;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 14px;
          color: #1e293b;
        }

        .summary-row.grand-total {
          font-size: 16px;
          font-weight: 700;
          border-top: 2px solid #e2e8f0;
          padding-top: 12px;
          margin-top: 4px;
        }

        .text-blue {
          color: #2563eb;
        }

        .text-red {
          color: #ef4444;
        }

        .text-green {
          color: #10b981;
        }

        .summary-right {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .status-card {
          padding: 16px 20px;
          background: #f8fafc;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        }

        .status-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .status-row:last-child {
          border-bottom: none;
        }

        .status-label {
          font-size: 13px;
          color: #64748b;
        }

        .status-value {
          font-size: 14px;
          font-weight: 500;
          color: #1e293b;
        }

        .status-value.fully-dispatched {
          color: #10b981;
        }

        .status-value.partial {
          color: #f59e0b;
        }

        .status-value.draft {
          color: #94a3b8;
        }

        /* ===== FORM FOOTER ===== */
        .form-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          border-top: 1px solid #e2e8f0;
          margin-top: 8px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .form-footer-right {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .form-footer-right button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 1200px) {
          .invoice-info-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 992px) {
          .form-grid {
            grid-template-columns: 1fr 1fr;
          }

          .summary-grid {
            grid-template-columns: 1fr;
          }

          .invoice-info-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 768px) {
          .new-dc-page {
            padding: 16px;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .page-header {
            flex-direction: column;
            gap: 16px;
          }

          .page-header-right {
            width: 100%;
            flex-wrap: wrap;
          }

          .page-header-right button {
            flex: 1;
            justify-content: center;
            font-size: 13px;
            padding: 8px 12px;
          }

          .invoice-info-grid {
            grid-template-columns: 1fr;
          }

          .form-footer {
            flex-direction: column;
          }

          .form-footer-right {
            width: 100%;
            flex-wrap: wrap;
          }

          .form-footer-right button {
            flex: 1;
            justify-content: center;
          }

          .items-table {
            font-size: 13px;
          }

          .items-table th,
          .items-table td {
            padding: 6px 8px;
          }

          .items-table .form-input {
            font-size: 12px;
            padding: 4px 6px;
          }

          .items-table .dispatch-input {
            width: 60px;
          }
        }

        @media (max-width: 480px) {
          .page-title {
            font-size: 20px;
          }

          .page-header-right button {
            font-size: 12px;
            padding: 6px 10px;
          }

          .summary-row.grand-total {
            font-size: 14px;
          }

          .items-table .dispatch-input {
            width: 50px;
          }
        }

        /* ===== PRINT STYLES ===== */
        @media print {
          .page-header-right,
          .form-footer,
          .btn-secondary,
          .btn-primary {
            display: none !important;
          }

          .new-dc-page {
            padding: 0 !important;
            background: #ffffff !important;
          }

          .form-section {
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
            break-inside: avoid;
          }

          .page-header {
            box-shadow: none !important;
            border-bottom: 2px solid #e2e8f0;
          }

          .form-input:disabled,
          .form-select:disabled,
          .form-textarea:disabled {
            background: transparent !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default NewDeliveryChallan;