import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  FaPlus,  FaSave, FaSpinner,  FaArrowLeft,
  FaExclamationCircle, FaExclamationTriangle, FaInfoCircle,
  FaTimesCircle, FaTag, FaBuilding, FaMoneyBillWave,
  FaCalendarAlt, FaFileAlt, FaBoxes, FaTruck, FaClipboardList,
  FaSearch
} from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import './PurchaseOrderForm.css';

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
const mockPurchaseOrders: PurchaseOrder[] = [
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
];

const statusOptions = ['Draft', 'Submitted', 'Partially Received', 'Fully Received', 'Cancelled', 'Closed'];
const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];
const paymentTerms = ['Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Due on Receipt', 'Cash on Delivery'];
const uomOptions = ['NOS', 'KG', 'LTR', 'MTR', 'BOX', 'SET', 'DOZ', 'ROL', 'SQM', 'CBM'];

export default function PurchaseOrderForm() {
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
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

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
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    currency: 'INR',
    paymentTerms: 'Net 30',
    shippingAddress: '',
    billingAddress: '',
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
        setSuppliers(supplierRecords);
        
        if (supplierRecords.length === 0) {
          console.log('No suppliers found');
        }
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

    if (isEdit && id) {
      const purchaseOrder = mockPurchaseOrders.find(po => po.id === id);
      if (purchaseOrder) {
        setFormData({
          poNumber: purchaseOrder.poNumber,
          title: purchaseOrder.title,
          supplier: purchaseOrder.supplier,
          supplierCode: purchaseOrder.supplierCode,
          status: purchaseOrder.status,
          orderDate: purchaseOrder.orderDate,
          deliveryDate: purchaseOrder.deliveryDate,
          currency: purchaseOrder.currency,
          paymentTerms: purchaseOrder.paymentTerms,
          shippingAddress: purchaseOrder.shippingAddress,
          billingAddress: purchaseOrder.billingAddress,
          notes: purchaseOrder.notes || '',
          items: purchaseOrder.items.map(item => ({ ...item }))
        });
      }
    } else {
      const nextNumber = mockPurchaseOrders.length + 1;
      setFormData(prev => ({
        ...prev,
        poNumber: `PO-2026-${String(nextNumber).padStart(3, '0')}`
      }));
    }

    // Cleanup timeouts on unmount
    return () => {
      Object.values(searchTimeoutRef.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, [id, isEdit]);

  const handleItemChange = (index: number, field: keyof PurchaseOrderItem, value: string | number) => {
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

    if (!formData.title.trim()) {
      errors.push({ field: 'title', label: 'Title', message: 'Title is required' });
    }
    if (!formData.supplier.trim()) {
      errors.push({ field: 'supplier', label: 'Supplier', message: 'Supplier is required' });
    }
    if (!formData.orderDate) {
      errors.push({ field: 'orderDate', label: 'Order Date', message: 'Order date is required' });
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
    
    const selectedSupplier = suppliers.find(s => s.supplier_name === formData.supplier);
    
    const payload: any = {
      name: formData.poNumber,
      naming_series: "PO-.YYYY.-",
      supplier: selectedSupplier?.id || formData.supplierCode || "SUP-00001",
      supplier_name: formData.supplier,
      order_confirmation_no: "",
      order_confirmation_date: "",
      transaction_date: formData.orderDate,
      transaction_time: "10:30:00",
      schedule_date: formData.deliveryDate || "",
      company: "My Company Pvt Ltd",
      is_subcontracted: 0,
      has_unit_price_items: 0,
      supplier_warehouse: "",
      cost_center: "Main - MC",
      project: "",
      currency: formData.currency,
      conversion_rate: 1,
      buying_price_list: "Standard Buying",
      price_list_currency: formData.currency,
      plc_conversion_rate: 1,
      ignore_pricing_rule: 0,
      scan_barcode: "",
      set_from_warehouse: "",
      set_warehouse: "",
      total_qty: totalQty,
      total_net_weight: 0,
      base_total: totalAmount,
      base_net_total: totalAmount,
      total: totalAmount,
      net_total: totalAmount,
      set_reserve_warehouse: "",
      tax_category: "",
      taxes_and_charges: "",
      shipping_rule: "",
      incoterm: "",
      named_place: "",
      base_taxes_and_charges_added: 0,
      base_taxes_and_charges_deducted: 0,
      base_total_taxes_and_charges: 0,
      taxes_and_charges_added: 0,
      taxes_and_charges_deducted: 0,
      total_taxes_and_charges: 0,
      grand_total: totalAmount,
      rounded_total: totalAmount,
      base_grand_total: totalAmount,
      base_rounded_total: totalAmount,
      disable_rounded_total: 0,
      rounding_adjustment: 0,
      base_rounding_adjustment: 0,
      advance_paid: 0,
      apply_discount_on: "Grand Total",
      base_discount_amount: 0,
      additional_discount_percentage: 0,
      discount_amount: 0,
      other_charges_calculation: "Net Total",
      supplier_address: "",
      address_display: formData.shippingAddress || "",
      supplier_group: "Local",
      contact_person: "",
      contact_display: "",
      contact_mobile: "",
      contact_email: "",
      dispatch_address: "",
      dispatch_address_display: "",
      shipping_address: "",
      shipping_address_display: formData.shippingAddress || "",
      billing_address: "",
      billing_address_display: formData.billingAddress || "",
      customer: "",
      customer_name: "",
      customer_contact_person: "",
      customer_contact_display: "",
      customer_contact_mobile: "",
      customer_contact_email: "",
      payment_terms_template: formData.paymentTerms,
      tc_name: "Purchase Terms",
      terms: formData.notes || "",
      status: formData.status,
      advance_payment_status: "Not Requested",
      per_billed: 0,
      per_received: 0,
      letter_head: "Standard",
      group_same_items: 0,
      select_print_heading: "Purchase Order",
      language: "en",
      from_date: null,
      to_date: null,
      auto_repeat: "",
      title: formData.title,
      party_account_currency: formData.currency,
      represents_company: "",
      ref_sq: "",
      amended_from: "",
      mps: 0,
      is_internal_supplier: 0,
      inter_company_order_reference: "",
      is_old_subcontracting_flow: 0,
      modified_by: "Administrator",
      owner: "Administrator",
      docstatus: 0,
      idx: 0,
      items: formData.items.map(item => ({
        item_code: item.itemCode,
        item_name: item.itemName,
        qty: item.quantity,
        uom: item.uom,
        rate: item.rate,
        amount: item.amount,
        received_qty: item.receivedQty || 0,
        balance_qty: item.balanceQty || item.quantity
      }))
    };

    if (isEdit && id) {
      payload.id = id;
    }

    try {
      let response;
      if (isEdit && id) {
        response = await api.put('/purchase-order', payload);
      } else {
        response = await api.post('/purchase-order', payload);
      }
      
      if (response.data && response.data.success === 1) {
        toast.success(isEdit ? 'Purchase Order updated successfully!' : 'Purchase Order created successfully!');
        navigate('/purchase-order');
      } else {
        setApiError(response.data?.message || 'Failed to save purchase order');
      }
    } catch (err: any) {
      console.error('Error saving purchase order:', err);
      if (err.response) {
        setApiError(err.response.data?.message || 'Failed to save purchase order');
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
    navigate('/purchase-order');
  };

  const hasErrors = getAllValidationErrors().length > 0;

  const getSupplierDisplayName = (supplier: any) => {
    if (supplier.supplier_name) {
      return `${supplier.supplier_name} ${supplier.supplier_type ? `(${supplier.supplier_type})` : ''}`;
    }
    return supplier.name || supplier.id || 'Unnamed Supplier';
  };

  // Render suggestions using portal
  const renderSuggestions = (index: number) => {
    if (!showSuggestions[index] || !itemSuggestions[index]?.length) return null;

    const position = dropdownPositions[index];
    if (!position) return null;

    const dropdownContent = (
      <div 
        className="pof-suggestions-dropdown-portal"
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
            className="pof-suggestion-item"
            onClick={() => handleSelectItem(index, suggestion)}
          >
            <div className="pof-suggestion-code">{suggestion.item_code}</div>
            <div className="pof-suggestion-name">{suggestion.item_name}</div>
            {suggestion.brand && (
              <div className="pof-suggestion-brand">{suggestion.brand}</div>
            )}
            {suggestion.standard_rate > 0 && (
              <div className="pof-suggestion-rate">
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
    <div className={`pof-page ${theme}`}>
      <div className="pof-inner">

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
          <div className="pof-api-error">
            <FaExclamationCircle className="error-icon" />
            <span>{apiError}</span>
            <button className="error-close" onClick={() => setApiError(null)}>×</button>
          </div>
        )}

        {/* ─── Header ────────────────────────────────────────────────── */}
        <div className="pof-header">
          <button onClick={handleCancel} className="back-btn">
            <FaArrowLeft size={9} /> Back
          </button>
          <div className="header-title">
            <h1>{isEdit ? 'Edit Purchase Order' : 'New Purchase Order'}</h1>
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
          <div className="pof-card">

            {/* PO Information */}
            <span className="pof-section-title">
              <FaFileAlt className="pof-section-icon" /> Purchase Order Information
            </span>

            <div className="pof-grid-2">
              <div className="pof-field">
                <label className="pof-label">
                  <FaTag className="pof-label-icon" />PO Number
                </label>
                <input
                  type="text"
                  value={formData.poNumber}
                  disabled
                  className="form-field"
                  style={{ background: 'var(--layout-bg, #f3f4f6)', cursor: 'not-allowed' }}
                />
              </div>
              <div className="pof-field">
                <label className="pof-label">
                  <FaClipboardList className="pof-label-icon" />Status
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

            <div className="pof-field">
              <label className="pof-label">
                <FaTag className="pof-label-icon" />Title <span className="pof-required">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className={`form-field ${validationErrors.some(e => e.field === 'title') ? 'field-error' : ''}`}
                placeholder="Enter PO title"
              />
              {validationErrors.some(e => e.field === 'title') && (
                <span className="pof-error-msg">
                  <FaExclamationCircle size={10} />Title is required
                </span>
              )}
            </div>

            <div className="pof-grid-2">
              <div className="pof-field">
                <label className="pof-label">
                  <FaBuilding className="pof-label-icon" />Supplier <span className="pof-required">*</span>
                </label>
                <select
                  value={formData.supplier}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    supplier: e.target.value,
                    supplierCode: e.target.value ? suppliers.find(s => s.supplier_name === e.target.value)?.id || '' : ''
                  }))}
                  className={`form-field ${validationErrors.some(e => e.field === 'supplier') ? 'field-error' : ''}`}
                  disabled={loadingSuppliers}
                >
                  <option value="">
                    {loadingSuppliers ? 'Loading suppliers...' : 'Select Supplier'}
                  </option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.supplier_name}>
                      {getSupplierDisplayName(supplier)}
                    </option>
                  ))}
                </select>
                {loadingSuppliers && (
                  <span className="pof-loading-msg">
                    <FaSpinner className="spinning" size={10} /> Loading suppliers...
                  </span>
                )}
                {!loadingSuppliers && suppliers.length === 0 && (
                  <span className="pof-warning-msg">
                    <FaExclamationCircle size={10} /> No suppliers found. Please add suppliers first.
                  </span>
                )}
                {validationErrors.some(e => e.field === 'supplier') && (
                  <span className="pof-error-msg">
                    <FaExclamationCircle size={10} />Supplier is required
                  </span>
                )}
              </div>
              <div className="pof-field">
                <label className="pof-label">
                  <FaTag className="pof-label-icon" />Supplier Code
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

            <div className="pof-grid-2">
              <div className="pof-field">
                <label className="pof-label">
                  <FaCalendarAlt className="pof-label-icon" />Order Date <span className="pof-required">*</span>
                </label>
                <input
                  type="date"
                  value={formData.orderDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, orderDate: e.target.value }))}
                  className={`form-field ${validationErrors.some(e => e.field === 'orderDate') ? 'field-error' : ''}`}
                />
                {validationErrors.some(e => e.field === 'orderDate') && (
                  <span className="pof-error-msg">
                    <FaExclamationCircle size={10} />Order date is required
                  </span>
                )}
              </div>
              <div className="pof-field">
                <label className="pof-label">
                  <FaCalendarAlt className="pof-label-icon" />Delivery Date                </label>
                <input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                  className="form-field"
                />
              </div>
            </div>

            <div className="pof-grid-2">
              <div className="pof-field">
                <label className="pof-label">
                  <FaMoneyBillWave className="pof-label-icon" />Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  className="form-field"
                >
                  {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="pof-field">
                <label className="pof-label">
                  <FaMoneyBillWave className="pof-label-icon" />Payment Terms
                </label>
                <select
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                  className="form-field"
                >
                  {paymentTerms.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="pof-divider" />

            {/* Addresses */}
            <span className="pof-section-title">
              <FaTruck className="pof-section-icon" />Addresses
            </span>

            <div className="pof-field">
              <label className="pof-label">Shipping Address</label>
              <input
                type="text"
                value={formData.shippingAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, shippingAddress: e.target.value }))}
                className="form-field"
                placeholder="Enter shipping address"
              />
            </div>

            <div className="pof-field">
              <label className="pof-label">Billing Address</label>
              <input
                type="text"
                value={formData.billingAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, billingAddress: e.target.value }))}
                className="form-field"
                placeholder="Enter billing address"
              />
            </div>

            <div className="pof-divider" />

            {/* Items Section */}
            <span className="pof-section-title">
              <FaBoxes className="pof-section-icon" />Items <span className="pof-required">*</span>
            </span>

            <div className="pof-field">
              <div className="pof-table-block">
                <table className="pof-inline-table">
                  <thead>
                    <tr>
                      <th className="pof-ith">No.</th>
                      <th className="pof-ith">Item Code <span className="pof-required">*</span></th>
                      <th className="pof-ith">Item Name <span className="pof-required">*</span></th>
                      <th className="pof-ith">Qty <span className="pof-required">*</span></th>
                      <th className="pof-ith">UOM</th>
                      <th className="pof-ith">Rate <span className="pof-required">*</span></th>
                      <th className="pof-ith">Amount</th>
                      <th className="pof-ith">Received</th>
                      <th className="pof-ith pof-ith-action"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={item.id} className="pof-itr">
                        <td className="pof-itd pof-itd-no">{index + 1}</td>
                        <td className="pof-itd" style={{ position: 'relative' }}>
                          <div className="pof-item-search-wrapper">
                            <input
                              ref={(el) => { inputRefs.current[index] = el; }}
                              className="pof-cell-input"
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
                              <FaSpinner className="spinning pof-search-spinner" size={14} />
                            )}
                            {item.itemCode && !loadingItems[index] && (
                              <FaSearch className="pof-search-icon" size={14} />
                            )}
                            
                            {/* Render suggestions using portal */}
                            {renderSuggestions(index)}
                            
                            {/* Show "No items found" message */}
                            {showSuggestions[index] && itemSuggestions[index]?.length === 0 && !loadingItems[index] && (
                              createPortal(
                                <div 
                                  className="pof-suggestions-dropdown-portal"
                                  style={{
                                    position: 'fixed',
                                    top: dropdownPositions[index]?.top || 0,
                                    left: dropdownPositions[index]?.left || 0,
                                    width: dropdownPositions[index]?.width || 'auto',
                                    zIndex: 9999
                                  }}
                                >
                                  <div className="pof-suggestion-empty">No items found</div>
                                </div>,
                                document.body
                              )
                            )}
                          </div>
                        </td>
                        <td className="pof-itd">
                          <input
                            className="pof-cell-input"
                            type="text"
                            value={item.itemName}
                            onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                            placeholder="Name"
                          />
                        </td>
                        <td className="pof-itd">
                          <input
                            className="pof-cell-input pof-cell-number"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                            min="1"
                          />
                        </td>
                        <td className="pof-itd">
                          <select
                            className="pof-cell-select"
                            value={item.uom}
                            onChange={(e) => handleItemChange(index, 'uom', e.target.value)}
                          >
                            {uomOptions.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </td>
                        <td className="pof-itd">
                          <input
                            className="pof-cell-input pof-cell-number"
                            type="number"
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="pof-itd pof-itd-amount">{formData.currency} {item.amount.toFixed(2)}</td>
                        <td className="pof-itd">
                          <input
                            className="pof-cell-input pof-cell-number"
                            type="number"
                            value={item.receivedQty}
                            onChange={(e) => handleItemChange(index, 'receivedQty', Number(e.target.value))}
                            min="0"
                            disabled={!isEdit}
                            style={!isEdit ? { background: 'var(--layout-bg, #f3f4f6)', cursor: 'not-allowed' } : {}}
                          />
                        </td>
                        <td className="pof-itd">
                          {formData.items.length > 1 && (
                            <button
                              className="pof-remove-row"
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
                      <td colSpan={6} className="pof-total-label">Total</td>
                      <td className="pof-total-amount">{formData.currency} {formData.items.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}</td>
                      <td></td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <button className="pof-add-row" onClick={addItemRow} type="button">
                <FaPlus size={10} /> Add row
              </button>
              {validationErrors.some(e => e.field === 'items') && (
                <span className="pof-error-msg" style={{ marginTop: '8px' }}>
                  <FaExclamationCircle size={10} />All items must have code, name, quantity {'>'} 0 and rate {'>'} 0
                </span>
              )}
            </div>

            <div className="pof-divider" />

            {/* Notes */}
            <div className="pof-field">
              <label className="pof-label">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="form-field pof-textarea"
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>

          {/* ─── Footer ────────────────────────────────────────────────── */}
          <div className="pof-footer">
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