import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaSave, FaSpinner,  FaPlus, 
  FaTrash, FaKeyboard,  FaFileAlt,
  FaDollarSign,  FaBarcode, FaChevronDown, FaChevronUp, FaPrint,FaCopy,  FaTag,
   FaAddressCard, FaCreditCard,
  FaTimes
} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import './CreateQuotation.css';
import toast from 'react-hot-toast';

interface QuotationItem {
  id: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface TaxRow {
  id: string;
  type: string;
  accountHead: string;
  taxRate: number;
  netAmount: number;
  amount: number;
  total: number;
}

interface PaymentSchedule {
  id: string;
  paymentTerm: string;
  description: string;
  dueDate: string;
  invoicePortion: number;
  paymentAmount: number;
}

interface QuotationForm {
  // Basic Info
  namingSeries: string;
  quotationTo: string;
  customer: string;
  partyName: string;
  date: string;
  validTill: string;
  orderType: string;
  
  // Currency
  currency: string;
  priceList: string;
  
  // Items
  items: QuotationItem[];
  totalQuantity: number;
  baseTotal: number;
  baseNetTotal: number;
  total: number;
  netTotal: number;
  
  // Taxes
  taxCategory: string;
  taxesAndCharges: string;
  shippingRule: string;
  incoterm: string;
  taxes: TaxRow[];
  baseTotalTaxesAndCharges: number;
  totalTaxesAndCharges: number;
  
  // Totals
  baseGrandTotal: number;
  baseRoundingAdjustment: number;
  baseRoundedTotal: number;
  grandTotal: number;
  roundingAdjustment: number;
  roundedTotal: number;
  
  // Addresses
  customerAddress: string;
  placeOfSupply: string;
  contactPerson: string;
  shippingAddress: string;
  companyAddress: string;
  
  // Payment
  paymentTermsTemplate: string;
  paymentSchedule: PaymentSchedule[];
  
  // Terms
  tcName: string;
  termDetails: string;
}

export default function CreateQuotation() {
  const navigate = useNavigate();
  
  let theme = 'light';
  try {
    const context = useAdminTheme();
    theme = context.theme;
  } catch (error) {
    console.log('Using default light theme');
  }

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scanBarcode, setScanBarcode] = useState('');
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    items: true,
    taxes: false,
    totals: true,
    addresses: false,
    payment: false,
    terms: false
  });

  const inputRefs = useRef<{ [key: string]: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null }>({});
  const itemInputRefs = useRef<{ [key: string]: HTMLInputElement | HTMLSelectElement | null }>({});

  // Helper function to set refs properly (returns void)
  const setRef = (key: string) => (el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null) => {
    inputRefs.current[key] = el;
  };

  // Helper function for item refs
  const setItemRef = (key: string) => (el: HTMLInputElement | HTMLSelectElement | null) => {
    itemInputRefs.current[key] = el;
    inputRefs.current[key] = el;
  };

  // Sample data
  // const itemCategories = [
  //   'Raw Material', 'Finished Goods', 'Semi-Finished', 'Packaging',
  //   'Spare Parts', 'Consumables', 'Tools & Equipment', 'Electronics'
  // ];

  const taxTypes = ['Tax', 'Charge', 'Cess', 'Surcharge'];
  const accountHeads = ['GST - 18%', 'GST - 12%', 'GST - 5%', 'Service Tax', 'VAT', 'Customs Duty'];
  const paymentTerms = ['Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Due on Receipt', 'Cash on Delivery'];
  const taxCategories = ['Standard', 'Export', 'SEZ', 'GST', 'VAT'];
  const shippingRules = ['Free Shipping', 'Flat Rate', 'Weight Based', 'Price Based'];
  const incoterms = ['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'];
  const placeOfSupply = ['Maharashtra', 'Gujarat', 'Karnataka', 'Tamil Nadu', 'Delhi', 'Rajasthan'];
  const contactPersons = ['John Doe', 'Jane Smith', 'Robert Johnson', 'Mary Williams'];
  const customerAddresses = [
    '123, Business Park, Mumbai, Maharashtra - 400001',
    '456, Industrial Area, Pune, Maharashtra - 411001',
    '789, Commercial Complex, Delhi - 110001'
  ];
  const shippingAddresses = [
    'Warehouse 1, Industrial Zone, Mumbai - 400001',
    'Warehouse 2, Logistics Park, Pune - 411001'
  ];
  const companyAddresses = [
    'Corporate Office, 100, Main Street, Mumbai - 400001'
  ];
  const termsList = ['Standard Terms', 'Export Terms', 'Special Terms', 'Credit Terms'];

  const [formData, setFormData] = useState<QuotationForm>({
    namingSeries: 'SAL-QTN-.YYYY.-',
    quotationTo: 'Customer',
    customer: 'CUST-001',
    partyName: 'ABC Corporation',
    date: new Date().toISOString().split('T')[0],
    validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    orderType: 'Sales',
    currency: 'INR',
    priceList: 'Standard Selling',
    items: [
      { id: '1', itemCode: '', itemName: '', quantity: 1, rate: 0, amount: 0 }
    ],
    totalQuantity: 0,
    baseTotal: 0,
    baseNetTotal: 0,
    total: 0,
    netTotal: 0,
    taxCategory: '',
    taxesAndCharges: '',
    shippingRule: '',
    incoterm: '',
    taxes: [],
    baseTotalTaxesAndCharges: 0,
    totalTaxesAndCharges: 0,
    baseGrandTotal: 0,
    baseRoundingAdjustment: 0,
    baseRoundedTotal: 0,
    grandTotal: 0,
    roundingAdjustment: 0,
    roundedTotal: 0,
    customerAddress: '',
    placeOfSupply: '',
    contactPerson: '',
    shippingAddress: '',
    companyAddress: '',
    paymentTermsTemplate: 'Net 30',
    paymentSchedule: [
      { id: '1', paymentTerm: 'Net 30', description: 'Payment due within 30 days', dueDate: '', invoicePortion: 100, paymentAmount: 0 }
    ],
    tcName: '',
    termDetails: 'Payment due within 30 days. Late payment penalty of 2% per month applies.'
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit(e as any);
      }
      
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        addItemRow();
        toast.success('New item added');
        setTimeout(() => {
          const lastIndex = formData.items.length;
          const refKey = `item_${lastIndex}_itemCode`;
          if (itemInputRefs.current[refKey]) {
            itemInputRefs.current[refKey]?.focus();
          }
        }, 100);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setShowBarcodeScanner(!showBarcodeScanner);
      }
      
      if (e.key === 'Escape') {
        handleCancel();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [formData.items.length, showBarcodeScanner]);

  useEffect(() => {
    setTimeout(() => {
      inputRefs.current['partyName']?.focus();
    }, 300);
  }, []);

  // Auto-calculate totals
  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.currency]);

  const calculateTotals = () => {
    const totalQty = formData.items.reduce((sum, item) => sum + item.quantity, 0);
    const baseTotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
    const netTotal = baseTotal;
    
    // Calculate taxes
    const taxTotal = formData.taxes.reduce((sum, tax) => sum + tax.amount, 0);
    const totalTaxesAndCharges = taxTotal;
    
    // Calculate totals
    const grandTotal = netTotal + totalTaxesAndCharges;
    const roundingAdjustment = 0;
    const roundedTotal = Math.round(grandTotal);

    setFormData(prev => ({
      ...prev,
      totalQuantity: totalQty,
      baseTotal,
      baseNetTotal: baseTotal,
      total: grandTotal,
      netTotal,
      baseTotalTaxesAndCharges: totalTaxesAndCharges,
      totalTaxesAndCharges: totalTaxesAndCharges,
      baseGrandTotal: grandTotal,
      grandTotal,
      roundingAdjustment,
      roundedTotal,
      baseRoundedTotal: roundedTotal
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleItemChange = (index: number, field: keyof QuotationItem, value: string | number) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    if (field === 'quantity' || field === 'rate') {
      const quantity = field === 'quantity' ? Number(value) : updatedItems[index].quantity;
      const rate = field === 'rate' ? Number(value) : updatedItems[index].rate;
      updatedItems[index].amount = quantity * rate;
    }
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const handleItemKeyDown = (e: React.KeyboardEvent, index: number, field: keyof QuotationItem) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      const fields: (keyof QuotationItem)[] = ['itemCode', 'itemName', 'quantity', 'rate'];
      const currentIndex = fields.indexOf(field);
      
      if (currentIndex === fields.length - 1) {
        if (formData.items[index].rate > 0 && formData.items[index].itemCode) {
          addItemRow();
          setTimeout(() => {
            const newIndex = index + 1;
            const refKey = `item_${newIndex}_itemCode`;
            if (itemInputRefs.current[refKey]) {
              itemInputRefs.current[refKey]?.focus();
            }
          }, 100);
        }
      } else {
        const nextField = fields[currentIndex + 1];
        const refKey = `item_${index}_${nextField}`;
        if (itemInputRefs.current[refKey]) {
          itemInputRefs.current[refKey]?.focus();
        }
      }
    }
  };

  const addItemRow = () => {
    const newId = String(formData.items.length + 1);
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { id: newId, itemCode: '', itemName: '', quantity: 1, rate: 0, amount: 0 }
      ]
    }));
  };

  const removeItemRow = (index: number) => {
    if (formData.items.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const addTaxRow = () => {
    const newId = String(formData.taxes.length + 1);
    setFormData(prev => ({
      ...prev,
      taxes: [
        ...prev.taxes,
        { id: newId, type: 'Tax', accountHead: '', taxRate: 0, netAmount: 0, amount: 0, total: 0 }
      ]
    }));
  };

  const removeTaxRow = (index: number) => {
    setFormData(prev => ({
      ...prev,
      taxes: prev.taxes.filter((_, i) => i !== index)
    }));
  };

  const handleTaxChange = (index: number, field: keyof TaxRow, value: string | number) => {
    const updatedTaxes = [...formData.taxes];
    updatedTaxes[index] = {
      ...updatedTaxes[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      taxes: updatedTaxes
    }));
  };

  const addPaymentSchedule = () => {
    const newId = String(formData.paymentSchedule.length + 1);
    setFormData(prev => ({
      ...prev,
      paymentSchedule: [
        ...prev.paymentSchedule,
        { id: newId, paymentTerm: '', description: '', dueDate: '', invoicePortion: 0, paymentAmount: 0 }
      ]
    }));
  };

  const removePaymentSchedule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      paymentSchedule: prev.paymentSchedule.filter((_, i) => i !== index)
    }));
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.partyName) newErrors.partyName = 'Customer name is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.validTill) newErrors.validTill = 'Valid till date is required';
    
    let hasValidItem = false;
    formData.items.forEach((item, index) => {
      if (item.itemCode || item.itemName) {
        if (!item.itemCode) {
          newErrors[`item_${index}_code`] = 'Item code required';
        }
        if (item.quantity <= 0) {
          newErrors[`item_${index}_quantity`] = 'Quantity must be > 0';
        }
        if (item.rate <= 0) {
          newErrors[`item_${index}_rate`] = 'Rate must be > 0';
        }
        hasValidItem = true;
      }
    });
    if (!hasValidItem) {
      newErrors.items = 'At least one item is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      const firstError = Object.keys(errors)[0];
      if (firstError && inputRefs.current[firstError]) {
        inputRefs.current[firstError]?.focus();
      }
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Quotation Data:', formData);
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Quotation created successfully!');
      navigate('/quotation');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create quotation');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All unsaved data will be lost.')) {
      navigate('/quotation');
    }
  };

  return (
    <div className={`create-quotation-page ${theme}-theme`}>
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={handleCancel}>
            <FaArrowLeft size={16} />
          </button>
          <h1 className="page-title">Create Quotation</h1>
        </div>
        <div className="header-actions">
          <div className="shortcuts-hint">
            <FaKeyboard size={13} />
            <span>Ctrl+S | Ctrl+Shift+A | Ctrl+B | Esc</span>
          </div>
          <button className="btn-secondary" onClick={() => window.print()}>
            <FaPrint size={12} /> Print
          </button>
          <button className="btn-secondary" onClick={() => toast('Duplicating...')}>
            <FaCopy size={12} /> Duplicate
          </button>
          <button className="cancel-btn" onClick={handleCancel}>
            Cancel
          </button>
          <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
            {loading && <FaSpinner className="spinning" />}
            <FaSave /> Save
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="quotation-form">
        <div className="form-scrollable">
          {/* Basic Info Section */}
          <div className="form-section">
            <div className="section-header">
              <h3 className="section-title">Basic Information</h3>
              <div className="section-actions">
                <span className="section-shortcut">Series: {formData.namingSeries}</span>
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Series</label>
                <select
                  name="namingSeries"
                  value={formData.namingSeries}
                  onChange={handleInputChange}
                  ref={setRef('namingSeries')}
                >
                  <option value="SAL-QTN-.YYYY.-">SAL-QTN-.YYYY.-</option>
                  <option value="SAL-QTN-.YYYY.-">SAL-QTN-.YYYY.-</option>
                  <option value="SAL-QTN-.YY.-">SAL-QTN-.YY.-</option>
                </select>
              </div>
              <div className="form-group">
                <label>Quotation To</label>
                <select
                  name="quotationTo"
                  value={formData.quotationTo}
                  onChange={handleInputChange}
                  ref={setRef('quotationTo')}
                >
                  <option value="Customer">Customer</option>
                  <option value="Lead">Lead</option>
                  <option value="Prospect">Prospect</option>
                </select>
              </div>
              <div className="form-group">
                <label>Customer</label>
                <select
                  name="customer"
                  value={formData.customer}
                  onChange={handleInputChange}
                  ref={setRef('customer')}
                >
                  <option value="CUST-001">CUST-001 - ABC Corp</option>
                  <option value="CUST-002">CUST-002 - XYZ Ltd</option>
                  <option value="CUST-003">CUST-003 - PQR Inc</option>
                </select>
              </div>
              <div className="form-group">
                <label>Party Name *</label>
                <input
                  type="text"
                  name="partyName"
                  value={formData.partyName}
                  onChange={handleInputChange}
                  placeholder="Customer name"
                  className={errors.partyName ? 'error' : ''}
                  ref={setRef('partyName')}
                  onFocus={() => setFocusedField('partyName')}
                  onBlur={() => setFocusedField(null)}
                />
                {errors.partyName && <span className="error-text">{errors.partyName}</span>}
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className={errors.date ? 'error' : ''}
                  ref={setRef('date')}
                />
                {errors.date && <span className="error-text">{errors.date}</span>}
              </div>
              <div className="form-group">
                <label>Valid Till *</label>
                <input
                  type="date"
                  name="validTill"
                  value={formData.validTill}
                  onChange={handleInputChange}
                  className={errors.validTill ? 'error' : ''}
                  ref={setRef('validTill')}
                />
                {errors.validTill && <span className="error-text">{errors.validTill}</span>}
              </div>
              <div className="form-group">
                <label>Order Type</label>
                <select
                  name="orderType"
                  value={formData.orderType}
                  onChange={handleInputChange}
                  ref={setRef('orderType')}
                >
                  <option value="Sales">Sales</option>
                  <option value="Return">Return</option>
                  <option value="Credit Note">Credit Note</option>
                </select>
              </div>
            </div>
          </div>

          {/* Currency Section
          <div className="form-section">
            <div className="section-header">
              <h3 className="section-title"><FaDollarSign size={13} /> Currency and Price List</h3>
            </div>
            <div className="form-grid compact-grid">
              <div className="form-group">
                <label>Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  ref={setRef('currency')}
                >
                  {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Price List</label>
                <select
                  name="priceList"
                  value={formData.priceList}
                  onChange={handleInputChange}
                  ref={setRef('priceList')}
                >
                  {priceLists.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Exchange Rate</label>
                <input type="number" value="1.000000000" disabled className="disabled-input" />
              </div>
            </div>
          </div> */}

          {/* Items Section */}
          <div className="form-section">
            <div className="section-header">
              <h3 className="section-title"><FaFileAlt size={13} /> Items</h3>
              <div className="section-actions">
                <button 
                  type="button" 
                  className="barcode-btn"
                  onClick={() => setShowBarcodeScanner(!showBarcodeScanner)}
                  title="Ctrl+B"
                >
                  <FaBarcode size={14} /> Scan Barcode
                </button>
                <button type="button" className="add-item-btn" onClick={addItemRow}>
                  <FaPlus size={12} /> Add Item
                </button>
              </div>
            </div>

            {showBarcodeScanner && (
              <div className="barcode-scanner">
                <input
                  type="text"
                  placeholder="Scan or enter barcode..."
                  value={scanBarcode}
                  onChange={(e) => setScanBarcode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && toast.success(`Item ${scanBarcode} added`)}
                  autoFocus
                />
                <button onClick={() => setShowBarcodeScanner(false)}>
                  <FaTimes size={14} />
                </button>
              </div>
            )}

            {errors.items && <div className="error-text">{errors.items}</div>}
            
            <div className="items-table-wrapper">
              <table className="items-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>No.</th>
                    <th style={{ minWidth: '140px' }}>Item Code</th>
                    <th style={{ minWidth: '120px' }}>Item Name</th>
                    <th style={{ width: '80px' }}>Quantity</th>
                    <th style={{ width: '100px' }}>Rate</th>
                    <th style={{ width: '120px' }}>Amount</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={item.id} className={focusedField === `item_${index}` ? 'focused-row' : ''}>
                      <td className="text-center">{index + 1}</td>
                      <td>
                        <input
                          type="text"
                          value={item.itemCode}
                          onChange={(e) => handleItemChange(index, 'itemCode', e.target.value)}
                          placeholder="Code"
                          className={errors[`item_${index}_code`] ? 'error' : ''}
                          ref={setItemRef(`item_${index}_itemCode`)}
                          onFocus={() => setFocusedField(`item_${index}`)}
                          onBlur={() => setFocusedField(null)}
                          onKeyDown={(e) => handleItemKeyDown(e, index, 'itemCode')}
                        />
                        {errors[`item_${index}_code`] && <span className="error-text">{errors[`item_${index}_code`]}</span>}
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                          placeholder="Item name"
                          ref={setItemRef(`item_${index}_itemName`)}
                          onKeyDown={(e) => handleItemKeyDown(e, index, 'itemName')}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                          min="1"
                          className={errors[`item_${index}_quantity`] ? 'error' : ''}
                          ref={setItemRef(`item_${index}_quantity`)}
                          onKeyDown={(e) => handleItemKeyDown(e, index, 'quantity')}
                        />
                        {errors[`item_${index}_quantity`] && <span className="error-text">{errors[`item_${index}_quantity`]}</span>}
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                          min="0"
                          step="0.01"
                          className={errors[`item_${index}_rate`] ? 'error' : ''}
                          ref={setItemRef(`item_${index}_rate`)}
                          onKeyDown={(e) => handleItemKeyDown(e, index, 'rate')}
                        />
                        {errors[`item_${index}_rate`] && <span className="error-text">{errors[`item_${index}_rate`]}</span>}
                      </td>
                      <td className="amount-cell">
                        {formData.currency} {item.amount.toFixed(2)}
                      </td>
                      <td>
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            className="remove-item-btn"
                            onClick={() => removeItemRow(index)}
                            title="Delete item"
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
                    <td colSpan={3} className="total-label">Total Quantity</td>
                    <td className="total-value">{formData.totalQuantity}</td>
                    <td></td>
                    <td className="total-amount">{formData.currency} {formData.baseTotal.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="items-summary">
              <div className="summary-row">
                <span>Total Quantity</span>
                <strong>{formData.totalQuantity}</strong>
              </div>
              <div className="summary-row">
                <span>Net Total</span>
                <strong>{formData.currency} {formData.netTotal.toFixed(2)}</strong>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <strong>{formData.currency} {formData.total.toFixed(2)}</strong>
              </div>
            </div>

            <div className="keyboard-tips">
              <span><kbd>Enter</kbd> Next field</span>
              <span><kbd>Ctrl+Shift+A</kbd> Add item</span>
              <span><kbd>Ctrl+B</kbd> Scan barcode</span>
            </div>
          </div>

          {/* Taxes Section */}
          <div className="form-section collapsible">
            <div className="section-header clickable" onClick={() => toggleSection('taxes')}>
              <h3 className="section-title"><FaTag size={13} /> Taxes and Charges</h3>
              <div className="section-toggle">
                {expandedSections.taxes ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
              </div>
            </div>
            
            {expandedSections.taxes && (
              <>
                <div className="form-grid compact-grid">
                  <div className="form-group">
                    <label>Tax Category</label>
                    <select
                      name="taxCategory"
                      value={formData.taxCategory}
                      onChange={handleInputChange}
                      ref={setRef('taxCategory')}
                    >
                      <option value="">Select...</option>
                      {taxCategories.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Sales Taxes and Charges Template</label>
                    <select
                      name="taxesAndCharges"
                      value={formData.taxesAndCharges}
                      onChange={handleInputChange}
                      ref={setRef('taxesAndCharges')}
                    >
                      <option value="">Select...</option>
                      <option value="GST-18">GST 18%</option>
                      <option value="GST-12">GST 12%</option>
                      <option value="GST-5">GST 5%</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Shipping Rule</label>
                    <select
                      name="shippingRule"
                      value={formData.shippingRule}
                      onChange={handleInputChange}
                      ref={setRef('shippingRule')}
                    >
                      <option value="">Select...</option>
                      {shippingRules.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Incoterm</label>
                    <select
                      name="incoterm"
                      value={formData.incoterm}
                      onChange={handleInputChange}
                      ref={setRef('incoterm')}
                    >
                      <option value="">Select...</option>
                      {incoterms.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                </div>

                <div className="tax-table-wrapper">
                  <div className="tax-table-header">
                    <span>Sales Taxes and Charges</span>
                    <button type="button" className="add-tax-btn" onClick={addTaxRow}>
                      <FaPlus size={11} /> Add Tax
                    </button>
                  </div>
                  <table className="tax-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>No.</th>
                        <th>Type</th>
                        <th>Account Head</th>
                        <th style={{ width: '100px' }}>Tax Rate %</th>
                        <th style={{ width: '120px' }}>Net Amount</th>
                        <th style={{ width: '120px' }}>Amount</th>
                        <th style={{ width: '120px' }}>Total</th>
                        <th style={{ width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.taxes.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="empty-tax-row">No rows</td>
                        </tr>
                      ) : (
                        formData.taxes.map((tax, index) => (
                          <tr key={tax.id}>
                            <td className="text-center">{index + 1}</td>
                            <td>
                              <select
                                value={tax.type}
                                onChange={(e) => handleTaxChange(index, 'type', e.target.value)}
                              >
                                {taxTypes.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </td>
                            <td>
                              <select
                                value={tax.accountHead}
                                onChange={(e) => handleTaxChange(index, 'accountHead', e.target.value)}
                              >
                                <option value="">Select...</option>
                                {accountHeads.map(a => <option key={a} value={a}>{a}</option>)}
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                value={tax.taxRate}
                                onChange={(e) => handleTaxChange(index, 'taxRate', Number(e.target.value))}
                                min="0"
                                step="0.01"
                              />
                            </td>
                            <td>{formData.currency} 0.00</td>
                            <td>{formData.currency} 0.00</td>
                            <td>{formData.currency} 0.00</td>
                            <td>
                              <button
                                type="button"
                                className="remove-tax-btn"
                                onClick={() => removeTaxRow(index)}
                              >
                                <FaTrash size={10} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={6} className="total-label">Total Taxes and Charges</td>
                        <td className="total-amount">{formData.currency} {formData.totalTaxesAndCharges.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Totals Section */}
          <div className="form-section">
            <div className="section-header clickable" onClick={() => toggleSection('totals')}>
              <h3 className="section-title"><FaDollarSign size={13} /> Totals</h3>
              <div className="section-toggle">
                {expandedSections.totals ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
              </div>
            </div>
            
            {expandedSections.totals && (
              <div className="totals-grid">
                <div className="totals-left">
                  <div className="total-row">
                    <span>Grand Total</span>
                    <span className="total-amount">{formData.currency} {formData.grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="total-row">
                    <span>Rounding Adjustment</span>
                    <span>{formData.currency} {formData.roundingAdjustment.toFixed(2)}</span>
                  </div>
                  <div className="total-row highlighted">
                    <span>Rounded Total</span>
                    <span className="rounded-total">{formData.currency} {formData.roundedTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Addresses Section */}
          <div className="form-section collapsible">
            <div className="section-header clickable" onClick={() => toggleSection('addresses')}>
              <h3 className="section-title"><FaAddressCard size={13} /> Addresses</h3>
              <div className="section-toggle">
                {expandedSections.addresses ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
              </div>
            </div>
            
            {expandedSections.addresses && (
              <div className="form-grid">
                <div className="form-group">
                  <label>Billing Address</label>
                  <select
                    name="customerAddress"
                    value={formData.customerAddress}
                    onChange={handleInputChange}
                    ref={setRef('customerAddress')}
                  >
                    <option value="">Select...</option>
                    {customerAddresses.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Place of Supply</label>
                  <select
                    name="placeOfSupply"
                    value={formData.placeOfSupply}
                    onChange={handleInputChange}
                    ref={setRef('placeOfSupply')}
                  >
                    <option value="">Select...</option>
                    {placeOfSupply.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Contact Person</label>
                  <select
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    ref={setRef('contactPerson')}
                  >
                    <option value="">Select...</option>
                    {contactPersons.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Shipping Address</label>
                  <select
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleInputChange}
                    ref={setRef('shippingAddress')}
                  >
                    <option value="">Select...</option>
                    {shippingAddresses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Company Address</label>
                  <select
                    name="companyAddress"
                    value={formData.companyAddress}
                    onChange={handleInputChange}
                    ref={setRef('companyAddress')}
                  >
                    <option value="">Select...</option>
                    {companyAddresses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Payment Section */}
          <div className="form-section collapsible">
            <div className="section-header clickable" onClick={() => toggleSection('payment')}>
              <h3 className="section-title"><FaCreditCard size={13} /> Payment Terms</h3>
              <div className="section-toggle">
                {expandedSections.payment ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
              </div>
            </div>
            
            {expandedSections.payment && (
              <>
                <div className="form-grid compact-grid">
                  <div className="form-group">
                    <label>Payment Terms Template</label>
                    <select
                      name="paymentTermsTemplate"
                      value={formData.paymentTermsTemplate}
                      onChange={handleInputChange}
                      ref={setRef('paymentTermsTemplate')}
                    >
                      {paymentTerms.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <div className="payment-schedule-wrapper">
                  <div className="payment-schedule-header">
                    <span>Payment Schedule</span>
                    <button type="button" className="add-payment-btn" onClick={addPaymentSchedule}>
                      <FaPlus size={11} /> Add Schedule
                    </button>
                  </div>
                  <table className="payment-schedule-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>No.</th>
                        <th>Payment Term</th>
                        <th>Description</th>
                        <th style={{ width: '130px' }}>Due Date</th>
                        <th style={{ width: '100px' }}>Invoice Portion %</th>
                        <th style={{ width: '130px' }}>Payment Amount</th>
                        <th style={{ width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.paymentSchedule.map((schedule, index) => (
                        <tr key={schedule.id}>
                          <td className="text-center">{index + 1}</td>
                          <td>
                            <select
                              value={schedule.paymentTerm}
                              onChange={(e) => {
                                const updated = [...formData.paymentSchedule];
                                updated[index].paymentTerm = e.target.value;
                                setFormData(prev => ({ ...prev, paymentSchedule: updated }));
                              }}
                            >
                              <option value="">Select...</option>
                              {paymentTerms.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              value={schedule.description}
                              onChange={(e) => {
                                const updated = [...formData.paymentSchedule];
                                updated[index].description = e.target.value;
                                setFormData(prev => ({ ...prev, paymentSchedule: updated }));
                              }}
                              placeholder="Description"
                            />
                          </td>
                          <td>
                            <input
                              type="date"
                              value={schedule.dueDate}
                              onChange={(e) => {
                                const updated = [...formData.paymentSchedule];
                                updated[index].dueDate = e.target.value;
                                setFormData(prev => ({ ...prev, paymentSchedule: updated }));
                              }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={schedule.invoicePortion}
                              onChange={(e) => {
                                const updated = [...formData.paymentSchedule];
                                updated[index].invoicePortion = Number(e.target.value);
                                updated[index].paymentAmount = (formData.grandTotal * Number(e.target.value)) / 100;
                                setFormData(prev => ({ ...prev, paymentSchedule: updated }));
                              }}
                              min="0"
                              max="100"
                              step="0.1"
                            />
                          </td>
                          <td className="amount-cell">
                            {formData.currency} {schedule.paymentAmount.toFixed(2)}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="remove-payment-btn"
                              onClick={() => removePaymentSchedule(index)}
                            >
                              <FaTrash size={10} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Terms Section */}
          <div className="form-section collapsible">
            <div className="section-header clickable" onClick={() => toggleSection('terms')}>
              <h3 className="section-title"><FaFileAlt size={13} /> Terms and Conditions</h3>
              <div className="section-toggle">
                {expandedSections.terms ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
              </div>
            </div>
            
            {expandedSections.terms && (
              <div className="form-grid">
                <div className="form-group">
                  <label>Terms</label>
                  <select
                    name="tcName"
                    value={formData.tcName}
                    onChange={handleInputChange}
                    ref={setRef('tcName')}
                  >
                    <option value="">Select...</option>
                    {termsList.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Term Details</label>
                  <textarea
                    name="termDetails"
                    value={formData.termDetails}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Enter terms and conditions..."
                    ref={setRef('termDetails')}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <div className="action-left">
            <button type="button" className="cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
          </div>
          <div className="action-right">
            <button type="button" className="btn-secondary" onClick={() => toast('Converting to Sales Order...')}>
              <FaCopy size={12} /> Convert to Sales Order
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading && <FaSpinner className="spinning" />}
              <FaSave /> Create Quotation
            </button>
          </div>
        </div>
      </form>

      <style>{`
        .spinning { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        kbd {
          background: var(--layout-bg, #f3f4f6);
          border: 1px solid var(--border-color, #d1d5db);
          border-radius: 3px;
          padding: 1px 6px;
          font-size: 10px;
          font-family: monospace;
          color: var(--text-primary, #374151);
        }
        .clickable { cursor: pointer; }
        .clickable:hover { opacity: 0.8; }
      `}</style>
    </div>
  );
}