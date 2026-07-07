import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  FaPlus, FaSave, FaSpinner, FaArrowLeft,
  FaExclamationCircle, FaExclamationTriangle, FaInfoCircle,
  FaTimesCircle, FaTag, FaBuilding, FaMoneyBillWave,
  FaCalendarAlt, FaFileAlt, FaBoxes, FaClipboardList,
  FaReceipt, FaClock, FaSearch
} from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import './PurchaseInvoiceForm.css';

interface PurchaseInvoiceItem {
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

interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  supplier: string;
  supplierCode: string;
  purchaseOrder: string;
  status: 'Draft' | 'Submitted' | 'Partially Paid' | 'Fully Paid' | 'Overdue' | 'Cancelled';
  date: string;
  dueDate: string;
  currency: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  itemsCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  items: PurchaseInvoiceItem[];
  notes: string;
}

interface ValidationError {
  field: string;
  label: string;
  message: string;
}

interface ItemSuggestion {
  id: number;
  item_code: string;
  item_name: string;
  stock_uom: string;
  standard_rate: number;
  description?: string;
  brand?: string;
  item_group?: string;
}

// Mock data for demo - in real app, this would come from an API
const mockPurchaseInvoices: PurchaseInvoice[] = [
  {
    id: '1',
    invoiceNumber: 'PI-2026-001',
    supplier: 'ABC Manufacturing Co.',
    supplierCode: 'SUP-001',
    purchaseOrder: 'PO-2026-001',
    status: 'Partially Paid',
    date: '2026-06-20',
    dueDate: '2026-07-20',
    currency: 'INR',
    totalAmount: 175000,
    paidAmount: 75000,
    balanceAmount: 100000,
    itemsCount: 2,
    createdBy: 'Tejas Tarte',
    createdAt: '2026-06-20T10:00:00Z',
    updatedAt: '2026-06-20T10:00:00Z',
    items: [
      { id: '1', itemCode: 'RM-001', itemName: 'Steel Sheets 2mm', quantity: 500, uom: 'NOS', rate: 350, amount: 175000, receivedQty: 200, balanceQty: 300 },
      { id: '2', itemCode: 'RM-002', itemName: 'Aluminum Bars', quantity: 300, uom: 'KG', rate: 250, amount: 75000, receivedQty: 100, balanceQty: 200 }
    ],
    notes: 'Urgent payment required'
  },
  {
    id: '2',
    invoiceNumber: 'PI-2026-002',
    supplier: 'XYZ Electronics Ltd.',
    supplierCode: 'SUP-002',
    purchaseOrder: 'PO-2026-002',
    status: 'Fully Paid',
    date: '2026-06-18',
    dueDate: '2026-07-18',
    currency: 'USD',
    totalAmount: 45000,
    paidAmount: 45000,
    balanceAmount: 0,
    itemsCount: 3,
    createdBy: 'Nirjala Bagal',
    createdAt: '2026-06-18T10:00:00Z',
    updatedAt: '2026-06-18T10:00:00Z',
    items: [
      { id: '1', itemCode: 'EC-001', itemName: 'Resistor Pack 100k', quantity: 1000, uom: 'NOS', rate: 15, amount: 15000, receivedQty: 1000, balanceQty: 0 },
      { id: '2', itemCode: 'EC-002', itemName: 'Capacitor 100uF', quantity: 500, uom: 'NOS', rate: 60, amount: 30000, receivedQty: 500, balanceQty: 0 }
    ],
    notes: 'Quality check required'
  },
  {
    id: '3',
    invoiceNumber: 'PI-2026-003',
    supplier: 'PQR Packaging Solutions',
    supplierCode: 'SUP-003',
    purchaseOrder: 'PO-2026-003',
    status: 'Draft',
    date: '2026-06-22',
    dueDate: '2026-07-22',
    currency: 'INR',
    totalAmount: 120000,
    paidAmount: 0,
    balanceAmount: 120000,
    itemsCount: 2,
    createdBy: 'P S Kamthe',
    createdAt: '2026-06-22T10:00:00Z',
    updatedAt: '2026-06-22T10:00:00Z',
    items: [
      { id: '1', itemCode: 'PKG-001', itemName: 'Carton Boxes Large', quantity: 200, uom: 'NOS', rate: 300, amount: 60000, receivedQty: 0, balanceQty: 200 },
      { id: '2', itemCode: 'PKG-002', itemName: 'Packing Tape', quantity: 150, uom: 'ROL', rate: 400, amount: 60000, receivedQty: 0, balanceQty: 150 }
    ],
    notes: 'Pending approval'
  }
];

const statusOptions = ['Draft', 'Submitted', 'Partially Paid', 'Fully Paid', 'Overdue', 'Cancelled'];
const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];
const uomOptions = ['NOS', 'KG', 'LTR', 'MTR', 'BOX', 'SET', 'DOZ', 'ROL', 'SQM', 'CBM'];

export default function PurchaseInvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  
  let theme = 'light';
  try {
    const context = useAdminTheme();
    theme = context.theme;
  } catch (error) {
    console.log('Using default light theme');
  }

  const [loading, setLoading] = useState(false);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // State for suppliers
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  // State for purchase orders
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loadingPOs, setLoadingPOs] = useState(false);

  // State for item suggestions
  const [itemSuggestions, setItemSuggestions] = useState<{ [key: number]: ItemSuggestion[] }>({});
  const [loadingItems, setLoadingItems] = useState<{ [key: number]: boolean }>({});
  const [showSuggestions, setShowSuggestions] = useState<{ [key: number]: boolean }>({});
  const [, setSearchTerms] = useState<{ [key: number]: string }>({});
  
  // Refs for positioning the dropdown
  const inputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const suggestionRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const searchTimeoutRef = useRef<{ [key: number]: ReturnType<typeof setTimeout> }>({});
  
  // State for dropdown position
  const [dropdownPositions, setDropdownPositions] = useState<{ [key: number]: { top: number; left: number; width: number } }>({});

  const [formData, setFormData] = useState<{
    invoiceNumber: string;
    supplier: string;
    supplierCode: string;
    purchaseOrder: string;
    status: PurchaseInvoice['status'];
    date: string;
    dueDate: string;
    currency: string;
    notes: string;
    items: PurchaseInvoiceItem[];
  }>({
    invoiceNumber: '',
    supplier: '',
    supplierCode: '',
    purchaseOrder: '',
    status: 'Draft',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    currency: 'INR',
    notes: '',
    items: [{ id: '1', itemCode: '', itemName: '', quantity: 1, uom: 'NOS', rate: 0, amount: 0, receivedQty: 0, balanceQty: 0 }]
  });

  // Fetch suppliers from API
  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const response = await api.get('/supplier');
      if (response.data && response.data.success === 1) {
        const supplierRecords = response.data.data?.records || [];
        setSuppliersList(supplierRecords);
      } else {
        console.error('Failed to fetch suppliers:', response.data?.message || 'Unknown error');
        toast.error('Failed to load suppliers');
      }
    } catch (err: any) {
      console.error('Error fetching suppliers:', err);
      toast.error('Failed to load suppliers. Please try again.');
    } finally {
      setLoadingSuppliers(false);
    }
  };

  // Fetch purchase orders from API
  const fetchPurchaseOrders = async () => {
    setLoadingPOs(true);
    try {
      const response = await api.get('/purchase-order');
      if (response.data && response.data.success === 1) {
        const poRecords = response.data.data?.records || [];
        setPurchaseOrders(poRecords);
      } else {
        console.error('Failed to fetch purchase orders:', response.data?.message || 'Unknown error');
        toast.error('Failed to load purchase orders');
      }
    } catch (err: any) {
      console.error('Error fetching purchase orders:', err);
      toast.error('Failed to load purchase orders. Please try again.');
    } finally {
      setLoadingPOs(false);
    }
  };

  // Fetch item suggestions from API
  const fetchItemSuggestions = async (index: number, searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 1) {
      setItemSuggestions(prev => ({ ...prev, [index]: [] }));
      setShowSuggestions(prev => ({ ...prev, [index]: false }));
      return;
    }

    setLoadingItems(prev => ({ ...prev, [index]: true }));
    
    try {
      const response = await api.get(`/item?page=1&limit=10&search=${encodeURIComponent(searchTerm)}`);
      
      if (response.data && response.data.success === 1) {
        const items = response.data.data || [];
        setItemSuggestions(prev => ({ ...prev, [index]: items }));
        setShowSuggestions(prev => ({ ...prev, [index]: items.length > 0 }));
        
        // Update dropdown position when suggestions appear
        if (items.length > 0 && inputRefs.current[index]) {
          updateDropdownPosition(index);
        }
      } else {
        setItemSuggestions(prev => ({ ...prev, [index]: [] }));
        setShowSuggestions(prev => ({ ...prev, [index]: false }));
      }
    } catch (err: any) {
      console.error('Error fetching items:', err);
      setItemSuggestions(prev => ({ ...prev, [index]: [] }));
      setShowSuggestions(prev => ({ ...prev, [index]: false }));
    } finally {
      setLoadingItems(prev => ({ ...prev, [index]: false }));
    }
  };

  // Update dropdown position
  const updateDropdownPosition = (index: number) => {
    const input = inputRefs.current[index];
    if (input) {
      const rect = input.getBoundingClientRect();
      setDropdownPositions(prev => ({
        ...prev,
        [index]: {
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width
        }
      }));
    }
  };

  // Handle item search with debounce
  const handleItemSearch = (index: number, value: string) => {
    // Clear previous timeout
    if (searchTimeoutRef.current[index]) {
      clearTimeout(searchTimeoutRef.current[index]);
    }

    // Update search term
    setSearchTerms(prev => ({ ...prev, [index]: value }));

    // Debounce the API call
    searchTimeoutRef.current[index] = setTimeout(() => {
      fetchItemSuggestions(index, value);
    }, 300);
  };

  // Handle item selection from suggestions
  const handleSelectItem = (index: number, item: ItemSuggestion) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      itemCode: item.item_code,
      itemName: item.item_name,
      uom: item.stock_uom || 'NOS',
      rate: item.standard_rate || 0,
      amount: (item.standard_rate || 0) * updatedItems[index].quantity,
      balanceQty: updatedItems[index].quantity - updatedItems[index].receivedQty
    };
    
    setFormData(prev => ({ ...prev, items: updatedItems }));
    setShowSuggestions(prev => ({ ...prev, [index]: false }));
    setSearchTerms(prev => ({ ...prev, [index]: item.item_code }));
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.keys(suggestionRefs.current).forEach((key) => {
        const index = parseInt(key);
        const suggestionEl = suggestionRefs.current[index];
        const inputEl = inputRefs.current[index];
        
        if (suggestionEl && !suggestionEl.contains(event.target as Node) && 
            inputEl && !inputEl.contains(event.target as Node)) {
          setShowSuggestions(prev => ({ ...prev, [index]: false }));
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update dropdown position on scroll or resize
  useEffect(() => {
    const handleScrollOrResize = () => {
      Object.keys(showSuggestions).forEach((key) => {
        const index = parseInt(key);
        if (showSuggestions[index]) {
          updateDropdownPosition(index);
        }
      });
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [showSuggestions]);

  // Load data if editing
  useEffect(() => {
    fetchSuppliers();
    fetchPurchaseOrders();

    if (isEdit && id) {
      const purchaseInvoice = mockPurchaseInvoices.find(inv => inv.id === id);
      if (purchaseInvoice) {
        setFormData({
          invoiceNumber: purchaseInvoice.invoiceNumber,
          supplier: purchaseInvoice.supplier,
          supplierCode: purchaseInvoice.supplierCode,
          purchaseOrder: purchaseInvoice.purchaseOrder,
          status: purchaseInvoice.status,
          date: purchaseInvoice.date,
          dueDate: purchaseInvoice.dueDate,
          currency: purchaseInvoice.currency,
          notes: purchaseInvoice.notes || '',
          items: purchaseInvoice.items.map(item => ({ ...item }))
        });
      }
    } else {
      // Generate new invoice number for create mode
      const nextNumber = mockPurchaseInvoices.length + 1;
      setFormData(prev => ({
        ...prev,
        invoiceNumber: `PI-2026-${String(nextNumber).padStart(3, '0')}`
      }));
    }

    // Cleanup timeouts on unmount
    return () => {
      Object.values(searchTimeoutRef.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, [id, isEdit]);

  const handleItemChange = (index: number, field: keyof PurchaseInvoiceItem, value: string | number) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // If itemCode changes, trigger search
    if (field === 'itemCode') {
      const stringValue = value as string;
      handleItemSearch(index, stringValue);
      // Clear other fields if user types manually
      if (stringValue !== updatedItems[index].itemCode) {
        updatedItems[index].itemName = '';
        updatedItems[index].rate = 0;
        updatedItems[index].amount = 0;
      }
    }
    
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
    // Clean up suggestion state for removed row
    setItemSuggestions(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
    setShowSuggestions(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
    setLoadingItems(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
    setDropdownPositions(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
    delete inputRefs.current[index];
  };

  const getAllValidationErrors = (): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!formData.supplier.trim()) {
      errors.push({ field: 'supplier', label: 'Supplier', message: 'Supplier is required' });
    }
    if (!formData.purchaseOrder.trim()) {
      errors.push({ field: 'purchaseOrder', label: 'Purchase Order', message: 'Purchase Order is required' });
    }
    if (!formData.date) {
      errors.push({ field: 'date', label: 'Invoice Date', message: 'Invoice date is required' });
    }
    if (!formData.dueDate) {
      errors.push({ field: 'dueDate', label: 'Due Date', message: 'Due date is required' });
    }
    if (formData.items.some(item => !item.itemCode.trim() || !item.itemName.trim() || item.quantity <= 0 || item.rate <= 0)) {
      errors.push({ field: 'items', label: 'Items', message: 'All items must have code, name, quantity > 0 and rate > 0' });
    }

    return errors;
  };

  const handleSubmit = async () => {
    setApiError(null);
    
    const validationErrorsList = getAllValidationErrors();
    if (validationErrorsList.length > 0) {
      setValidationErrors(validationErrorsList);
      setShowValidationSummary(true);
      return;
    }

    setLoading(true);
    
    const totalAmount = formData.items.reduce((sum, item) => sum + item.amount, 0);
    const totalQty = formData.items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Find selected supplier and purchase order
    const selectedSupplier = suppliersList.find(s => s.supplier_name === formData.supplier);
    const selectedPO = purchaseOrders.find(po => po.name === formData.purchaseOrder);

    // Build payload with only fields that are present in the form
    const payload: any = {
      // Core fields from form
      name: formData.invoiceNumber,
      supplier: selectedSupplier?.id || formData.supplierCode || "SUP-00001",
      supplier_name: formData.supplier,
      purchase_order: selectedPO?.id || formData.purchaseOrder,
      posting_date: formData.date,
      due_date: formData.dueDate,
      currency: formData.currency,
      status: formData.status,
      remarks: formData.notes || "",
      
      // Calculated fields
      total_qty: totalQty,
      total: totalAmount,
      net_total: totalAmount,
      grand_total: totalAmount,
      rounded_total: totalAmount,
      base_total: totalAmount,
      base_net_total: totalAmount,
      base_grand_total: totalAmount,
      base_rounded_total: totalAmount,
      outstanding_amount: totalAmount,
      
      // Items array
      items: formData.items.map(item => ({
        item_code: item.itemCode,
        item_name: item.itemName,
        qty: item.quantity,
        uom: item.uom,
        rate: item.rate,
        amount: item.amount,
        received_qty: item.receivedQty || 0,
        balance_qty: item.balanceQty || item.quantity
      })),
      
      // Default required fields
      naming_series: "PINV-.YYYY.-",
      company: "My Company",
      modified_by: "Administrator",
      owner: "Administrator",
      docstatus: 0,
      idx: 1,
      set_posting_time: 1,
      is_paid: 0,
      is_return: 0,
      update_outstanding_for_self: 1,
      update_billed_amount_in_purchase_order: 1,
      update_billed_amount_in_purchase_receipt: 1,
      apply_tds: 0,
      conversion_rate: 1,
      use_transaction_date_exchange_rate: 0,
      buying_price_list: "Standard Buying",
      price_list_currency: formData.currency,
      plc_conversion_rate: 1,
      ignore_pricing_rule: 0,
      update_stock: 1,
      is_subcontracted: 0,
      total_net_weight: 0,
      claimed_landed_cost_amount: 0,
      base_taxes_and_charges_added: 0,
      base_taxes_and_charges_deducted: 0,
      base_total_taxes_and_charges: 0,
      taxes_and_charges_added: 0,
      taxes_and_charges_deducted: 0,
      total_taxes_and_charges: 0,
      use_company_roundoff_cost_center: 0,
      disable_rounded_total: 0,
      rounding_adjustment: 0,
      base_rounding_adjustment: 0,
      total_advance: 0,
      apply_discount_on: "Grand Total",
      base_discount_amount: 0,
      additional_discount_percentage: 0,
      discount_amount: 0,
      other_charges_calculation: null,
      base_paid_amount: 0,
      paid_amount: 0,
      allocate_advances_automatically: 0,
      only_include_allocated_payments: 0,
      write_off_amount: 0,
      base_write_off_amount: 0,
      per_received: 0,
      per_billed: 0,
      is_opening: "No",
      group_same_items: 0,
      language: "en",
      on_hold: 0,
      is_old_subcontracting_flow: 0,
    };

    // If editing, add id
    if (isEdit && id) {
      payload.id = id;
      payload.amended_from = null;
    }

    try {
      let response;
      if (isEdit && id) {
        response = await api.put('/purchase-invoice', payload);
      } else {
        response = await api.post('/purchase-invoice', payload);
      }
      
      if (response.data && response.data.success === 1) {
        toast.success(isEdit ? 'Purchase Invoice updated successfully!' : 'Purchase Invoice created successfully!');
        navigate('/purchase-invoice');
      } else {
        setApiError(response.data?.message || 'Failed to save purchase invoice');
      }
    } catch (err: any) {
      console.error('Error saving purchase invoice:', err);
      if (err.response) {
        setApiError(err.response.data?.message || 'Failed to save purchase invoice');
      } else if (err.request) {
        setApiError('Network error. Please check your connection.');
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/purchase-invoice');
  };

  const hasErrors = getAllValidationErrors().length > 0;

  const getSupplierDisplayName = (supplier: any) => {
    if (supplier.supplier_name) {
      return `${supplier.supplier_name} ${supplier.supplier_type ? `(${supplier.supplier_type})` : ''}`;
    }
    return supplier.name || supplier.id || 'Unnamed Supplier';
  };

  const getPODisplayName = (po: any) => {
    if (po.name) {
      return `${po.name} - ${po.title || ''}`;
    }
    return po.name || po.id || 'Unnamed PO';
  };

  // Render suggestions using portal
  const renderSuggestions = (index: number) => {
    if (!showSuggestions[index] || !itemSuggestions[index]?.length) return null;

    const position = dropdownPositions[index];
    if (!position) return null;

    const dropdownContent = (
      <div 
        className="pif-suggestions-dropdown-portal"
        ref={(el) => { suggestionRefs.current[index] = el; }}
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          width: position.width,
          maxHeight: '250px',
          overflowY: 'auto',
          zIndex: 9999
        }}
      >
        {itemSuggestions[index].map((suggestion) => (
          <div
            key={suggestion.id}
            className="pif-suggestion-item"
            onClick={() => handleSelectItem(index, suggestion)}
          >
            <div className="pif-suggestion-code">{suggestion.item_code}</div>
            <div className="pif-suggestion-name">{suggestion.item_name}</div>
            {suggestion.brand && (
              <div className="pif-suggestion-brand">{suggestion.brand}</div>
            )}
            {suggestion.standard_rate > 0 && (
              <div className="pif-suggestion-rate">
                {formData.currency} {suggestion.standard_rate.toFixed(2)}
              </div>
            )}
          </div>
        ))}
      </div>
    );

    return createPortal(dropdownContent, document.body);
  };

  return (
    <div className={`pif-page ${theme}`}>
      <div className="pif-inner">

        {/* ─── Validation Summary Modal ────────────────────────────── */}
        {showValidationSummary && validationErrors.length > 0 && (
          <div className="modal-overlay" onClick={() => setShowValidationSummary(false)}>
            <div className="validation-summary-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  <FaExclamationTriangle /> Missing Required Fields
                </h2>
                <button className="modal-close" onClick={() => setShowValidationSummary(false)}>×</button>
              </div>
              <div className="modal-body">
                <p className="modal-description">
                  Please fill in the following required fields before submitting:
                </p>
                <div className="validation-errors-list">
                  {validationErrors.map((error, idx) => (
                    <div key={idx} className="validation-error-item">
                      <div className="error-header">
                        <FaTimesCircle className="error-icon" />
                        <strong>{error.label}</strong>
                      </div>
                      <div className="error-message">{error.message}</div>
                    </div>
                  ))}
                </div>
                <div className="validation-tip">
                  <FaInfoCircle className="tip-icon" />
                  Please fix the errors above before submitting
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowValidationSummary(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── API Error Display ────────────────────────────────────── */}
        {apiError && (
          <div className="pif-api-error">
            <FaExclamationCircle className="error-icon" />
            <span>{apiError}</span>
            <button className="error-close" onClick={() => setApiError(null)}>×</button>
          </div>
        )}

        {/* ─── Header ────────────────────────────────────────────────── */}
        <div className="pif-header">
          <button onClick={handleCancel} className="back-btn">
            <FaArrowLeft size={9} /> Back
          </button>
          <div className="header-title">
            <h1>{isEdit ? 'Edit Purchase Invoice' : 'New Purchase Invoice'}</h1>
          </div>
          {hasErrors && (
            <div className="error-badge">
              <FaExclamationTriangle size={12} />
              {getAllValidationErrors().length} missing field{getAllValidationErrors().length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>

          {/* ─── Main Form Card ────────────────────────────────────────── */}
          <div className="pif-card">

            {/* Invoice Information */}
            <span className="pif-section-title">
              <FaReceipt className="pif-section-icon" /> Purchase Invoice Information
            </span>

            <div className="pif-grid-2">
              <div className="pif-field">
                <label className="pif-label">
                  <FaTag className="pif-label-icon" />Invoice Number
                </label>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  disabled
                  className="form-field"
                  style={{ background: 'var(--layout-bg, #f3f4f6)', cursor: 'not-allowed' }}
                />
              </div>
              <div className="pif-field">
                <label className="pif-label">
                  <FaClipboardList className="pif-label-icon" />Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="form-field"
                >
                  {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="pif-grid-2">
              <div className="pif-field">
                <label className="pif-label">
                  <FaBuilding className="pif-label-icon" />Supplier <span className="pif-required">*</span>
                </label>
                <select
                  value={formData.supplier}
                  onChange={(e) => {
                    const selectedSupplier = suppliersList.find(s => s.supplier_name === e.target.value);
                    setFormData(prev => ({ 
                      ...prev, 
                      supplier: e.target.value,
                      supplierCode: selectedSupplier?.id || ''
                    }));
                  }}
                  className={`form-field ${validationErrors.some(e => e.field === 'supplier') ? 'field-error' : ''}`}
                  disabled={loadingSuppliers}
                >
                  <option value="">
                    {loadingSuppliers ? 'Loading suppliers...' : 'Select Supplier'}
                  </option>
                  {suppliersList.map((supplier) => (
                    <option key={supplier.id} value={supplier.supplier_name}>
                      {getSupplierDisplayName(supplier)}
                    </option>
                  ))}
                </select>
                {loadingSuppliers && (
                  <span className="pif-loading-msg">
                    <FaSpinner className="spinning" size={10} /> Loading suppliers...
                  </span>
                )}
                {!loadingSuppliers && suppliersList.length === 0 && (
                  <span className="pif-warning-msg">
                    <FaExclamationCircle size={10} /> No suppliers found. Please add suppliers first.
                  </span>
                )}
                {validationErrors.some(e => e.field === 'supplier') && (
                  <span className="pif-error-msg">
                    <FaExclamationCircle size={10} />Supplier is required
                  </span>
                )}
              </div>
              <div className="pif-field">
                <label className="pif-label">
                  <FaTag className="pif-label-icon" />Supplier Code
                </label>
                <input
                  type="text"
                  value={formData.supplierCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplierCode: e.target.value }))}
                  className="form-field"
                  placeholder="SUP-001"
                />
              </div>
            </div>

            <div className="pif-grid-2">
              <div className="pif-field">
                <label className="pif-label">
                  <FaFileAlt className="pif-label-icon" />Purchase Order <span className="pif-required">*</span>
                </label>
                <select
                  value={formData.purchaseOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchaseOrder: e.target.value }))}
                  className={`form-field ${validationErrors.some(e => e.field === 'purchaseOrder') ? 'field-error' : ''}`}
                  disabled={loadingPOs}
                >
                  <option value="">
                    {loadingPOs ? 'Loading purchase orders...' : 'Select PO'}
                  </option>
                  {purchaseOrders.map((po) => (
                    <option key={po.id || po.name} value={po.name}>
                      {getPODisplayName(po)}
                    </option>
                  ))}
                </select>
                {loadingPOs && (
                  <span className="pif-loading-msg">
                    <FaSpinner className="spinning" size={10} /> Loading purchase orders...
                  </span>
                )}
                {!loadingPOs && purchaseOrders.length === 0 && (
                  <span className="pif-warning-msg">
                    <FaExclamationCircle size={10} /> No purchase orders found. Please create a purchase order first.
                  </span>
                )}
                {validationErrors.some(e => e.field === 'purchaseOrder') && (
                  <span className="pif-error-msg">
                    <FaExclamationCircle size={10} />Purchase Order is required
                  </span>
                )}
              </div>
              <div className="pif-field">
                <label className="pif-label">
                  <FaMoneyBillWave className="pif-label-icon" />Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  className="form-field"
                >
                  {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="pif-grid-2">
              <div className="pif-field">
                <label className="pif-label">
                  <FaCalendarAlt className="pif-label-icon" />Invoice Date <span className="pif-required">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className={`form-field ${validationErrors.some(e => e.field === 'date') ? 'field-error' : ''}`}
                />
                {validationErrors.some(e => e.field === 'date') && (
                  <span className="pif-error-msg">
                    <FaExclamationCircle size={10} />Invoice date is required
                  </span>
                )}
              </div>
              <div className="pif-field">
                <label className="pif-label">
                  <FaClock className="pif-label-icon" />Due Date <span className="pif-required">*</span>
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className={`form-field ${validationErrors.some(e => e.field === 'dueDate') ? 'field-error' : ''}`}
                />
                {validationErrors.some(e => e.field === 'dueDate') && (
                  <span className="pif-error-msg">
                    <FaExclamationCircle size={10} />Due date is required
                  </span>
                )}
              </div>
            </div>

            <div className="pif-divider" />

            {/* Items Section */}
            <span className="pif-section-title">
              <FaBoxes className="pif-section-icon" />Items <span className="pif-required">*</span>
            </span>

            <div className="pif-field">
              <div className="pif-table-block">
                <table className="pif-inline-table">
                  <thead>
                    <tr>
                      <th className="pif-ith">No.</th>
                      <th className="pif-ith">Item Code <span className="pif-required">*</span></th>
                      <th className="pif-ith">Item Name <span className="pif-required">*</span></th>
                      <th className="pif-ith">Qty <span className="pif-required">*</span></th>
                      <th className="pif-ith">UOM</th>
                      <th className="pif-ith">Rate <span className="pif-required">*</span></th>
                      <th className="pif-ith">Amount</th>
                      <th className="pif-ith">Received</th>
                      <th className="pif-ith pif-ith-action"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={item.id} className="pif-itr">
                        <td className="pif-itd pif-itd-no">{index + 1}</td>
                        <td className="pif-itd" style={{ position: 'relative' }}>
                          <div className="pif-item-search-wrapper">
                            <input
                              ref={(el) => { inputRefs.current[index] = el; }}
                              className="pif-cell-input"
                              type="text"
                              value={item.itemCode}
                              onChange={(e) => handleItemChange(index, 'itemCode', e.target.value)}
                              placeholder="Search item code"
                              onFocus={() => {
                                if (item.itemCode && itemSuggestions[index]?.length > 0) {
                                  updateDropdownPosition(index);
                                  setShowSuggestions(prev => ({ ...prev, [index]: true }));
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  setShowSuggestions(prev => ({ ...prev, [index]: false }));
                                }
                              }}
                            />
                            {loadingItems[index] && (
                              <FaSpinner className="spinning pif-search-spinner" size={14} />
                            )}
                            {item.itemCode && !loadingItems[index] && (
                              <FaSearch className="pif-search-icon" size={14} />
                            )}
                            
                            {/* Render suggestions using portal */}
                            {renderSuggestions(index)}
                            
                            {/* Show "No items found" message */}
                            {showSuggestions[index] && itemSuggestions[index]?.length === 0 && !loadingItems[index] && (
                              createPortal(
                                <div 
                                  className="pif-suggestions-dropdown-portal"
                                  style={{
                                    position: 'fixed',
                                    top: dropdownPositions[index]?.top || 0,
                                    left: dropdownPositions[index]?.left || 0,
                                    width: dropdownPositions[index]?.width || 'auto',
                                    zIndex: 9999
                                  }}
                                >
                                  <div className="pif-suggestion-empty">No items found</div>
                                </div>,
                                document.body
                              )
                            )}
                          </div>
                        </td>
                        <td className="pif-itd">
                          <input
                            className="pif-cell-input"
                            type="text"
                            value={item.itemName}
                            onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                            placeholder="Name"
                          />
                        </td>
                        <td className="pif-itd">
                          <input
                            className="pif-cell-input pif-cell-number"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                            min="1"
                          />
                        </td>
                        <td className="pif-itd">
                          <select
                            className="pif-cell-select"
                            value={item.uom}
                            onChange={(e) => handleItemChange(index, 'uom', e.target.value)}
                          >
                            {uomOptions.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </td>
                        <td className="pif-itd">
                          <input
                            className="pif-cell-input pif-cell-number"
                            type="number"
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="pif-itd pif-itd-amount">{formData.currency} {item.amount.toFixed(2)}</td>
                        <td className="pif-itd">
                          <input
                            className="pif-cell-input pif-cell-number"
                            type="number"
                            value={item.receivedQty}
                            onChange={(e) => handleItemChange(index, 'receivedQty', Number(e.target.value))}
                            min="0"
                            disabled={!isEdit}
                            style={!isEdit ? { background: 'var(--layout-bg, #f3f4f6)', cursor: 'not-allowed' } : {}}
                          />
                        </td>
                        <td className="pif-itd">
                          {formData.items.length > 1 && (
                            <button
                              className="pif-remove-row"
                              onClick={() => removeItemRow(index)}
                              type="button"
                            >
                              ×
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={6} className="pif-total-label">Total</td>
                      <td className="pif-total-amount">{formData.currency} {formData.items.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}</td>
                      <td></td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <button className="pif-add-row" onClick={addItemRow} type="button">
                <FaPlus size={10} /> Add row
              </button>
              {validationErrors.some(e => e.field === 'items') && (
                <span className="pif-error-msg" style={{ marginTop: '8px' }}>
                  <FaExclamationCircle size={10} />All items must have code, name, quantity {'>'} 0 and rate {'>'} 0
                </span>
              )}
            </div>

            <div className="pif-divider" />

            {/* Notes */}
            <div className="pif-field">
              <label className="pif-label">
                <FaFileAlt className="pif-label-icon" />Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="form-field pif-textarea"
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>

          {/* ─── Footer ────────────────────────────────────────────────── */}
          <div className="pif-footer">
            <button
              type="button"
              onClick={handleCancel}
              className="cancel-btn"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="submit-btn"
            >
              {loading && <FaSpinner className="spinning" />}
              <FaSave size={12} />
              {isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}