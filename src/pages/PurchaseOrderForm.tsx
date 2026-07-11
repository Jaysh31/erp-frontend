// PurchaseOrderForm.tsx - Cleaner UI (no addresses, no supplier code, compact grid, better item table, auto-dropdown)
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  FaPlus,  FaSave, FaSpinner,  FaArrowLeft,
  FaExclamationCircle, FaExclamationTriangle, FaInfoCircle,
  FaTimesCircle, FaTag, FaBuilding, FaMoneyBillWave,
  FaCalendarAlt, FaFileAlt, FaBoxes, FaClipboardList,
  FaSearch, FaFilter
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
  itemGroup?: string;
  brand?: string;
  description?: string;
  taxRate?: number;
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
  valuation_rate: number;
  description?: string;
  brand?: string;
  item_group?: string;
  tax_id?: number;
}

interface Supplier {
  id: number;
  supplier_name: string;
  supplier_type: string;
  supplier_group: string;
  country: string;
  mobile_no: string;
  email_id: string;
  disabled: number;
  address?: string;
}

interface TaxOption {
  tax_id: number;
  tax_type: string;
}

const statusOptions = ['Draft', 'Submitted', 'Partially Received', 'Fully Received', 'Cancelled', 'Closed'];
const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];
const paymentTerms = ['Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Due on Receipt', 'Cash on Delivery'];
const uomOptions = ['NOS', 'KG', 'LTR', 'MTR', 'BOX', 'SET', 'DOZ', 'ROL', 'SQM', 'CBM'];

export default function PurchaseOrderForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id) && id !== 'new';
  
  let theme = 'light';
  try {
    const context = useAdminTheme();
    theme = context.theme;
  } catch (error) {
    console.log('Using default light theme');
  }

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // State for suppliers
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  // State for tax options
  const [taxOptions, setTaxOptions] = useState<TaxOption[]>([]);
  const [loadingTaxes, setLoadingTaxes] = useState(false);

  // State for items (all items loaded once)
  const [allItems, setAllItems] = useState<ItemSuggestion[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemGroupFilter, setItemGroupFilter] = useState<string>('all');
  
  // Get unique item groups from all items
  const itemGroups = [...new Set(allItems.map(item => item.item_group).filter(Boolean))];
  
  // State for filtered items per row
  const [filteredItems, setFilteredItems] = useState<{ [key: number]: ItemSuggestion[] }>({});
  const [showSuggestions, setShowSuggestions] = useState<{ [key: number]: boolean }>({});
  const [searchTerms, setSearchTerms] = useState<{ [key: number]: string }>({});
  
  // Refs for positioning the dropdown
  const inputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const suggestionRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  
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
    taxRate: number;
    taxCategory: string;
    taxId: string;
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
    items: [{ id: '1', itemCode: '', itemName: '', quantity: 1, uom: 'NOS', rate: 0, amount: 0, receivedQty: 0, balanceQty: 0 }],
    taxRate: 18,
    taxCategory: 'GST',
    taxId: '',
  });

  // ─── Helper to extract tax info from tax_type ──────────────────────
  const extractTaxInfo = (taxType: string) => {
    const rateMatch = taxType.match(/(\d+)/);
    const rate = rateMatch ? parseInt(rateMatch[1]) : 0;
    const category = taxType.includes('GST') ? 'GST' : 
                     taxType.includes('VAT') ? 'VAT' : 'Tax';
    return { rate, category };
  };

  // ─── Fetch Tax Options ──────────────────────────────────────────────
  const fetchTaxOptions = async () => {
    setLoadingTaxes(true);
    try {
      const response = await api.get('/item/get-tax');
      if (response.data && response.data.success === 1) {
        const taxData = response.data.data || [];
        setTaxOptions(taxData);
        
        // Set default tax if available and not in edit mode
        if (taxData.length > 0 && !isEdit) {
          const defaultTax = taxData[0];
          const { rate, category } = extractTaxInfo(defaultTax.tax_type);
          
          setFormData(prev => ({
            ...prev,
            taxId: String(defaultTax.tax_id),
            taxRate: rate || 18,
            taxCategory: category,
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching tax options:', err);
      toast.error('Failed to load tax options');
    } finally {
      setLoadingTaxes(false);
    }
  };

  // ─── Fetch all items from API ──────────────────────────────────────
  const fetchAllItems = async () => {
    setLoadingItems(true);
    try {
      const response = await api.get('/item');
      if (response.data && response.data.success === 1) {
        const items = response.data.data || [];
        const mappedItems = items.map((item: any) => ({
          id: item.id,
          item_code: item.item_code,
          item_name: item.item_name,
          stock_uom: item.stock_uom || 'NOS',
          standard_rate: item.standard_rate || 0,
          valuation_rate: item.valuation_rate || item.standard_rate || 0,
          description: item.description,
          brand: item.brand,
          item_group: item.item_group || 'Uncategorized',
          tax_id: item.tax_id,
        }));
        
        setAllItems(mappedItems);
        
        // Initialize filtered items for all rows
        setFilteredItems(prev => {
          const newFiltered = { ...prev };
          formData.items.forEach((_, index) => {
            newFiltered[index] = mappedItems;
          });
          return newFiltered;
        });
      } else {
        console.error('Failed to fetch items:', response.data?.message || 'Unknown error');
        toast.error('Failed to load items');
      }
    } catch (err: any) {
      console.error('Error fetching items:', err);
      toast.error('Failed to load items. Please try again.');
    } finally {
      setLoadingItems(false);
    }
  };

  // ─── Fetch suppliers from API ──────────────────────────────────────
  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const response = await api.get('/supplier');
      if (response.data && response.data.success === 1) {
        const supplierRecords = response.data.data?.records || [];
        setSuppliers(supplierRecords);
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

  // ─── Fetch single purchase order ──────────────────────────────────
  const fetchPurchaseOrder = async (poId: string) => {
    setLoadingData(true);
    try {
      const response = await api.get(`/purchase-order/${poId}`);
      if (response.data && response.data.success === 1) {
        const data = response.data.data;
        
        const items = data.items?.map((item: any, index: number) => ({
          id: String(index + 1),
          itemCode: item.item_code || '',
          itemName: item.item_name || '',
          quantity: item.qty || 0,
          uom: item.uom || 'NOS',
          rate: item.rate || 0,
          amount: item.amount || 0,
          receivedQty: item.received_qty || 0,
          balanceQty: item.balance_qty || item.qty || 0,
          itemGroup: item.item_group || '',
          brand: item.brand || '',
          description: item.description || '',
          taxRate: item.item_tax_rate ? parseFloat(item.item_tax_rate) : 18,
        })) || [{ id: '1', itemCode: '', itemName: '', quantity: 1, uom: 'NOS', rate: 0, amount: 0, receivedQty: 0, balanceQty: 0 }];

        // --- Extract tax info from response ---
        let taxRate = 18;
        let taxCategory = 'GST';
        let taxId = '';
        
        if (data.taxes_and_charges) {
          const taxString = data.taxes_and_charges;
          // Extract percentage
          const percentMatch = taxString.match(/(\d+)%/);
          if (percentMatch) {
            taxRate = parseInt(percentMatch[1]);
          } else {
            const numberMatch = taxString.match(/(\d+)/);
            if (numberMatch) {
              taxRate = parseInt(numberMatch[1]);
            }
          }
          
          // Check category
          if (taxString.includes('GST')) {
            taxCategory = 'GST';
          } else if (taxString.includes('VAT')) {
            taxCategory = 'VAT';
          } else if (taxString.includes('Tax')) {
            taxCategory = 'Tax';
          }
        }
        
        // Find matching tax ID from taxOptions
        if (taxOptions.length > 0) {
          // Try to find tax by rate and category
          let foundTax = taxOptions.find(t => {
            const { rate, category } = extractTaxInfo(t.tax_type);
            return rate === taxRate && category === taxCategory;
          });
          
          // If not found, try just by rate
          if (!foundTax) {
            foundTax = taxOptions.find(t => {
              const { rate } = extractTaxInfo(t.tax_type);
              return rate === taxRate;
            });
          }
          
          // If still not found, use first available
          if (foundTax) {
            taxId = String(foundTax.tax_id);
            const { rate, category } = extractTaxInfo(foundTax.tax_type);
            taxRate = rate;
            taxCategory = category;
          } else if (taxOptions.length > 0) {
            const firstTax = taxOptions[0];
            taxId = String(firstTax.tax_id);
            const { rate, category } = extractTaxInfo(firstTax.tax_type);
            taxRate = rate;
            taxCategory = category;
          }
        }

        setFormData({
          poNumber: data.name || data.po_number || '',
          title: data.title || '',
          supplier: data.supplier_name || data.supplier || '',
          supplierCode: data.supplier || '',
          status: data.status || 'Draft',
          orderDate: data.transaction_date ? data.transaction_date.split('T')[0] : new Date().toISOString().split('T')[0],
          deliveryDate: data.schedule_date ? data.schedule_date.split('T')[0] : '',
          currency: data.currency || 'INR',
          paymentTerms: data.payment_terms_template || 'Net 30',
          shippingAddress: data.shipping_address_display || data.shipping_address || '',
          billingAddress: data.billing_address_display || data.billing_address || '',
          notes: data.terms || data.notes || '',
          items: items,
          taxRate: taxRate,
          taxCategory: taxCategory,
          taxId: taxId,
        });
      } else {
        toast.error('Failed to load purchase order');
        navigate('/purchase-order');
      }
    } catch (err: any) {
      console.error('Error fetching purchase order:', err);
      toast.error('Failed to load purchase order');
      navigate('/purchase-order');
    } finally {
      setLoadingData(false);
    }
  };

  // ─── Update dropdown position ─────────────────────────────────────
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

  // ─── Filter items based on search term and group filter ──────────
  const filterItems = (index: number, searchTerm: string) => {
    let filtered = allItems;
    
    if (itemGroupFilter !== 'all') {
      filtered = filtered.filter(item => item.item_group === itemGroupFilter);
    }
    
    if (searchTerm && searchTerm.length >= 1) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.item_code.toLowerCase().includes(term) ||
        item.item_name.toLowerCase().includes(term) ||
        (item.item_group && item.item_group.toLowerCase().includes(term))
      );
    }
    
    setFilteredItems(prev => ({ ...prev, [index]: filtered }));
    // Show the dropdown whenever there are matching items — even with an empty
    // search term — so clicking into the field immediately reveals the list.
    setShowSuggestions(prev => ({ ...prev, [index]: filtered.length > 0 }));
    
    if (inputRefs.current[index]) {
      updateDropdownPosition(index);
    }
  };

  // ─── Open the item dropdown (used on focus/click) ─────────────────
  const openItemDropdown = (index: number) => {
    updateDropdownPosition(index);
    const searchVal = searchTerms[index] || '';
    filterItems(index, searchVal);
  };

  // ─── Handle tax selection ──────────────────────────────────────────
  const handleTaxChange = (taxId: string) => {
    const selectedTax = taxOptions.find(t => t.tax_id.toString() === taxId);
    if (selectedTax) {
      const { rate, category } = extractTaxInfo(selectedTax.tax_type);
      
      setFormData(prev => ({
        ...prev,
        taxId: taxId,
        taxRate: rate || 0,
        taxCategory: category,
      }));
    }
  };

  // ─── Handle item search (client-side) ─────────────────────────────
  const handleItemSearch = (index: number, value: string) => {
    setSearchTerms(prev => ({ ...prev, [index]: value }));
    filterItems(index, value);
  };

  // ─── Handle item selection from suggestions ──────────────────────
  const handleSelectItem = (index: number, item: ItemSuggestion) => {
    const updatedItems = [...formData.items];
    const rate = item.standard_rate || item.valuation_rate || 0;
    updatedItems[index] = {
      ...updatedItems[index],
      itemCode: item.item_code,
      itemName: item.item_name,
      uom: item.stock_uom || 'NOS',
      rate: rate,
      amount: rate * updatedItems[index].quantity,
      balanceQty: updatedItems[index].quantity - updatedItems[index].receivedQty,
      itemGroup: item.item_group || '',
      brand: item.brand || '',
      description: item.description || '',
      taxRate: formData.taxRate,
    };
    
    setFormData(prev => ({ ...prev, items: updatedItems }));
    setShowSuggestions(prev => ({ ...prev, [index]: false }));
    setSearchTerms(prev => ({ ...prev, [index]: item.item_code }));
  };

  // ─── Close suggestions when clicking outside ─────────────────────
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

  // ─── Update dropdown position on scroll or resize ────────────────
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

  // ─── Load data ─────────────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      await fetchSuppliers();
      await fetchAllItems();
      await fetchTaxOptions();
      
      // Now tax options are loaded, fetch the purchase order
      if (isEdit && id) {
        // Small delay to ensure taxOptions state is updated
        setTimeout(() => {
          fetchPurchaseOrder(id);
        }, 150);
      } else {
        const today = new Date();
        const year = today.getFullYear();
        const nextNumber = Math.floor(Math.random() * 1000) + 1;
        setFormData(prev => ({
          ...prev,
          poNumber: `PO-${year}-${String(nextNumber).padStart(3, '0')}`
        }));
      }
    };
    
    loadData();
  }, [id, isEdit]);

  // ─── Re-filter items when group filter changes ────────────────────
  useEffect(() => {
    Object.keys(searchTerms).forEach(key => {
      const index = parseInt(key);
      filterItems(index, searchTerms[index] || '');
    });
  }, [itemGroupFilter]);

  // ─── Calculate totals ─────────────────────────────────────────────
  const calculateTotals = () => {
    const totalAmount = formData.items.reduce((sum, item) => sum + item.amount, 0);
    const taxRate = formData.taxRate / 100;
    const taxAmount = totalAmount * taxRate;
    const grandTotal = totalAmount + taxAmount;
    
    return { totalAmount, taxAmount, grandTotal };
  };

  const { totalAmount, taxAmount, grandTotal } = calculateTotals();

  // ─── Handlers ──────────────────────────────────────────────────────
  const handleItemChange = (index: number, field: keyof PurchaseOrderItem, value: string | number) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'itemCode') {
      const stringValue = value as string;
      handleItemSearch(index, stringValue);
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
    const filtered = allItems;
    if (itemGroupFilter !== 'all') {
      setFilteredItems(prev => ({ 
        ...prev, 
        [formData.items.length]: filtered.filter(item => item.item_group === itemGroupFilter) 
      }));
    } else {
      setFilteredItems(prev => ({ ...prev, [formData.items.length]: filtered }));
    }
  };

  const removeItemRow = (index: number) => {
    if (formData.items.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
    setFilteredItems(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
    setShowSuggestions(prev => {
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

  // ─── Submit Handler ────────────────────────────────────────────────
  const handleSubmit = async () => {
    setApiError(null);
    
    const validationErrorsList = getAllValidationErrors();
    if (validationErrorsList.length > 0) {
      setValidationErrors(validationErrorsList);
      setShowValidationSummary(true);
      return;
    }

    setLoading(true);
    
    const totalQty = formData.items.reduce((sum, item) => sum + item.quantity, 0);
    const selectedSupplier = suppliers.find(s => s.supplier_name === formData.supplier);
    
    const taxRate = formData.taxRate / 100;
    const taxAmountCalc = totalAmount * taxRate;
    const grandTotalCalc = totalAmount + taxAmountCalc;

    const payload: any = {
      name: formData.poNumber,
      naming_series: "PO-.YYYY.-",
      supplier: selectedSupplier?.id?.toString() || formData.supplierCode || "SUP-00001",
      supplier_name: formData.supplier,
      order_confirmation_no: "",
      order_confirmation_date: null,
      transaction_date: formData.orderDate,
      transaction_time: "10:30:00",
      schedule_date: formData.deliveryDate || "",
      company: "SculptorTech Pvt Ltd",
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
      set_warehouse: "Main Warehouse",
      total_qty: totalQty,
      total_net_weight: 0,
      base_total: totalAmount,
      base_net_total: totalAmount,
      total: totalAmount,
      net_total: totalAmount,
      set_reserve_warehouse: "",
      tax_category: formData.taxCategory,
      taxes_and_charges: `${formData.taxCategory} ${formData.taxRate}%`,
      shipping_rule: "",
      incoterm: "",
      named_place: "",
      base_taxes_and_charges_added: taxAmountCalc,
      base_taxes_and_charges_deducted: 0,
      base_total_taxes_and_charges: taxAmountCalc,
      taxes_and_charges_added: taxAmountCalc,
      taxes_and_charges_deducted: 0,
      total_taxes_and_charges: taxAmountCalc,
      grand_total: grandTotalCalc,
      rounded_total: Math.round(grandTotalCalc),
      base_grand_total: grandTotalCalc,
      base_rounded_total: Math.round(grandTotalCalc),
      disable_rounded_total: 0,
      rounding_adjustment: 0,
      base_rounding_adjustment: 0,
      advance_paid: 0,
      apply_discount_on: "Grand Total",
      base_discount_amount: 0,
      additional_discount_percentage: 0,
      discount_amount: 0,
      other_charges_calculation: "Net Total",
      supplier_address: selectedSupplier?.address || "",
      address_display: formData.shippingAddress || "",
      supplier_group: selectedSupplier?.supplier_group || "Local",
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
        fg_item: "FG-0001",
        fg_item_qty: item.quantity || 0,
        item_code: item.itemCode,
        supplier_part_no: `SP-${String(formData.items.indexOf(item) + 1).padStart(3, '0')}`,
        item_name: item.itemName,
        brand: item.brand || "",
        product_bundle: "",
        schedule_date: formData.deliveryDate || "",
        expected_delivery_date: formData.deliveryDate || "",
        item_group: item.itemGroup || "Raw Material",
        description: item.description || item.itemName || "",
        image: "",
        qty: item.quantity,
        stock_uom: item.uom || "Nos",
        subcontracted_qty: 0,
        uom: item.uom || "Nos",
        conversion_factor: 1,
        price_list_rate: item.rate,
        last_purchase_rate: item.rate * 0.98,
        base_price_list_rate: item.rate,
        margin_type: "Percentage",
        margin_rate_or_amount: 0,
        rate_with_margin: item.rate,
        discount_percentage: 0,
        distributed_discount_amount: 0,
        base_rate_with_margin: item.rate,
        rate: item.rate,
        item_tax_template: `${formData.taxCategory} ${formData.taxRate}%`,
        pricing_rules: "",
        is_free_item: 0,
        from_warehouse: "",
        warehouse: "Main Warehouse",
        actual_qty: 0,
        company_total_stock: 0,
        material_request: "",
        material_request_item: "",
        sales_order: "",
        sales_order_item: "",
        sales_order_packed_item: "",
        supplier_quotation: "",
        supplier_quotation_item: "",
        delivered_by_supplier: 0,
        against_blanket_order: 0,
        blanket_order: "",
        blanket_order_rate: 0,
        received_qty: item.receivedQty || 0,
        returned_qty: 0,
        billed_amt: 0,
        expense_account: "Stock In Hand",
        wip_composite_asset: "",
        manufacturer: "",
        manufacturer_part_no: "",
        bom: "",
        include_exploded_items: 0,
        weight_per_unit: 0,
        weight_uom: "Kg",
        project: "",
        cost_center: "Main - STPL",
        is_fixed_asset: 0,
        item_tax_rate: String(formData.taxRate),
        production_plan: "",
        production_plan_item: "",
        production_plan_sub_assembly_item: "",
        page_break: 0,
        job_card: ""
      }))
    };

    if (isEdit && id) {
      payload.id = parseInt(id);
    }

    try {
      const response = isEdit && id
        ? await api.put('/purchase-order', payload)
        : await api.post('/purchase-order', payload);

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

  const getSupplierDisplayName = (supplier: Supplier) => {
    if (supplier.supplier_name) {
      return `${supplier.supplier_name} ${supplier.supplier_type ? `(${supplier.supplier_type})` : ''}`;
    }
    return supplier.supplier_name || supplier.id?.toString() || 'Unnamed Supplier';
  };

  // ─── Render suggestions using portal ──────────────────────────────
  const renderSuggestions = (index: number) => {
    const items = filteredItems[index] || [];
    if (!showSuggestions[index] || items.length === 0) return null;

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
          zIndex: 9999,
        }}
      >
        {items.map((suggestion) => (
          <div
            key={suggestion.id}
            className="pof-suggestion-item"
            onClick={() => handleSelectItem(index, suggestion)}
          >
            <div>
              <div className="pof-suggestion-code">
                {suggestion.item_code}
              </div>
              <div className="pof-suggestion-name">
                {suggestion.item_name}
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                {suggestion.item_group && (
                  <span className="pof-suggestion-chip">
                    {suggestion.item_group}
                  </span>
                )}
                {suggestion.brand && (
                  <span className="pof-suggestion-chip pof-suggestion-chip-brand">
                    {suggestion.brand}
                  </span>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="pof-suggestion-rate">
                {formData.currency} {suggestion.standard_rate?.toFixed(2) || suggestion.valuation_rate?.toFixed(2) || '0.00'}
              </div>
              <div className="pof-suggestion-uom">
                UOM: {suggestion.stock_uom || 'NOS'}
              </div>
            </div>
          </div>
        ))}
      </div>
    );

    return createPortal(dropdownContent, document.body);
  };

  if (loadingData) {
    return (
      <div className={`pof-page ${theme}`}>
        <div className="pof-inner">
          <div className="pof-loading">
            <FaSpinner className="spinning" size={24} />
            <span>Loading purchase order...</span>
          </div>
        </div>
      </div>
    );
  }

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
            {isEdit && <span className="pof-status-badge">{formData.status}</span>}
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

            {/* Row 1: PO Number / Status / Title */}
            <div className="pof-grid-3">
              <div className="pof-field">
                <label className="pof-label">
                  <FaTag className="pof-label-icon" />PO Number
                </label>
                <input
                  type="text"
                  value={formData.poNumber}
                  disabled
                  className="form-field form-field-disabled"
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
            </div>

            {/* Row 2: Supplier / Order Date / Delivery Date */}
            <div className="pof-grid-3">
              <div className="pof-field">
                <label className="pof-label">
                  <FaBuilding className="pof-label-icon" />Supplier <span className="pof-required">*</span>
                </label>
                <select
                  value={formData.supplier}
                  onChange={(e) => {
                    const selectedSupplier = suppliers.find(s => s.supplier_name === e.target.value);
                    setFormData(prev => ({ 
                      ...prev, 
                      supplier: e.target.value,
                      supplierCode: selectedSupplier?.id?.toString() || '',
                    }));
                  }}
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
                  <FaCalendarAlt className="pof-label-icon" />Delivery Date
                </label>
                <input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                  className="form-field"
                />
              </div>
            </div>

            {/* Row 3: Currency / Payment Terms */}
            <div className="pof-grid-3">
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

            {/* Items Section */}
            <span className="pof-section-title">
              <FaBoxes className="pof-section-icon" />Items <span className="pof-required">*</span>
            </span>

            {/* Item Group Filter */}
            <div className="pof-item-filter">
              <FaFilter className="pof-filter-icon" />
              <span className="pof-filter-label">Filter by Group:</span>
              <select
                value={itemGroupFilter}
                onChange={(e) => setItemGroupFilter(e.target.value)}
                className="pof-filter-select"
              >
                <option value="all">All Groups</option>
                {itemGroups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
              <span className="pof-filter-count">
                {allItems.length} items available
              </span>
            </div>

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
                              onChange={(e) => handleItemSearch(index, e.target.value)}
                              placeholder="Search or click to browse items"
                              onFocus={() => openItemDropdown(index)}
                              onClick={() => openItemDropdown(index)}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  setShowSuggestions(prev => ({ ...prev, [index]: false }));
                                }
                              }}
                            />
                            {loadingItems && (
                              <FaSpinner className="spinning pof-search-spinner" size={14} />
                            )}
                            {item.itemCode && !loadingItems && (
                              <FaSearch className="pof-search-icon" size={14} />
                            )}
                            
                            {renderSuggestions(index)}
                            
                            {showSuggestions[index] && filteredItems[index]?.length === 0 && !loadingItems && (
                              createPortal(
                                <div 
                                  className="pof-suggestions-dropdown-portal pof-suggestions-empty-state"
                                  style={{
                                    position: 'fixed',
                                    top: dropdownPositions[index]?.top || 0,
                                    left: dropdownPositions[index]?.left || 0,
                                    width: dropdownPositions[index]?.width || 'auto',
                                    zIndex: 9999,
                                  }}
                                >
                                  No items found
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
                            disabled
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
                      <td colSpan={5} className="pof-total-label">Subtotal</td>
                      <td colSpan={2} className="pof-total-amount">{formData.currency} {totalAmount.toFixed(2)}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td colSpan={5} className="pof-total-label">
                        <div className="pof-tax-selector-wrapper">
                          <span>Tax</span>
                          <select
                            value={formData.taxId}
                            onChange={(e) => handleTaxChange(e.target.value)}
                            className="pof-tax-select"
                            disabled={loadingTaxes}
                          >
                            <option value="">
                              {loadingTaxes ? 'Loading...' : 'Select Tax'}
                            </option>
                            {taxOptions.map(tax => {
                              const { rate, category } = extractTaxInfo(tax.tax_type);
                              const displayText = `${category} ${rate}%`;
                              return (
                                <option key={tax.tax_id} value={String(tax.tax_id)}>
                                  {displayText}
                                </option>
                              );
                            })}
                          </select>
                          <span className="pof-tax-rate-display">
                            ({formData.taxRate}% {formData.taxCategory})
                          </span>
                        </div>
                      </td>
                      <td colSpan={2} className="pof-total-amount">{formData.currency} {taxAmount.toFixed(2)}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td colSpan={5} className="pof-total-label pof-total-grand">Grand Total</td>
                      <td colSpan={2} className="pof-total-amount pof-total-grand-amount">{formData.currency} {grandTotal.toFixed(2)}</td>
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

            {/* Notes */}
            <div className="pof-divider" />
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