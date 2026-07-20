// PurchaseOrderForm.tsx - Cleaner UI with Compact Layout, Customer Info on Right, Item Table with Order Rate, Editable Grand Total
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  FaPlus, FaSave, FaSpinner, FaArrowLeft,
  FaExclamationCircle, FaExclamationTriangle, FaInfoCircle,
  FaTimesCircle, FaTag, FaBuilding,
  FaCalendarAlt, FaFileAlt, FaBoxes, FaClipboardList,
  FaSearch, FaFilter, FaPhone, FaEnvelope, FaMapMarkerAlt,
  FaUserCircle, FaChevronDown, FaWarehouse, FaTruck,
  FaReceipt, FaPercentage, FaGlobeAsia
} from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './PurchaseOrderForm.css';

interface PurchaseOrderItem {
  id: string;
  itemId: number; // Actual item ID from the API
  itemCode: string;
  itemName: string;
  quantity: number;
  uom: string;
  rate: number;
  orderRate: number;
  amount: number;
  receivedQty: number;
  balanceQty: number;
  itemGroup?: string;
  brand?: string;
  description?: string;
  taxId?: string;
  taxRate?: number;
  hsn?: string;
  discount?: number;
  discountAmount?: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  title: string;
  supplier: string;
  supplierCode: string;
  status: 'Draft' | 'Submitted' | 'Open' | 'Started' | 'Cancelled' | 'Closed';
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
  hsn?: string;
}

interface Supplier {
  id: number;
  supplier_name: string;
  supplier_type: string;
  supplier_group: string;
  country: string;
  mobile_no: string;
  email_id: string;
  address?: string;
  disabled: number;
}

interface TaxOption {
  tax_id: number;
  tax_type: string;
}

interface Customer {
  id: number;
  customer_name: string;
  customer_type: string;
  customer_group: string;
  territory: string;
  mobile_no: string;
  email_id: string;
  default_currency: string;
  disabled: number;
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
  const [masterDataLoaded, setMasterDataLoaded] = useState(false);
  
  // State for suppliers
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const supplierInputRef = useRef<HTMLInputElement>(null);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);

  // State for customers
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerInputRef = useRef<HTMLInputElement>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

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

  // State for editable grand total
  const [editableGrandTotal, setEditableGrandTotal] = useState<number>(0);
  const [grandTotalAdjustmentSign, setGrandTotalAdjustmentSign] = useState<string>('positive');
  const [grandTotalAdjustmentValue, setGrandTotalAdjustmentValue] = useState<number>(0);
  const [showAdjustment, setShowAdjustment] = useState<boolean>(false);

  // Date picker states
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [deliveryDate, setDeliveryDate] = useState<Date | null>(null);

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
    customer: string;
    customerId?: number;
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
    items: [
      {
        id: "1",
        itemId: 0,
        itemCode: "",
        itemName: "",
        quantity: 1,
        uom: "NOS",
        rate: 0,
        orderRate: 0,
        amount: 0,
        receivedQty: 0,
        balanceQty: 0,
        taxId: "",
        taxRate: 18,
      },
    ],
    taxRate: 18,
    taxCategory: 'GST',
    taxId: '',
    customer: '',
    customerId: undefined,
  });

  // ─── Helper to extract tax info from tax_type ──────────────────────
  const extractTaxInfo = (taxType: string) => {
    const rateMatch = taxType.match(/(\d+)/);
    const rate = rateMatch ? parseInt(rateMatch[1]) : 0;
    const category = taxType.includes('GST') ? 'GST' : 
                     taxType.includes('VAT') ? 'VAT' : 'Tax';
    return { rate, category };
  };

  // ─── Fetch Customers ─────────────────────────────────────────────────
  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const response = await api.get('/customer');
      if (response.data && response.data.success === 1) {
        const records = response.data.data?.records || response.data.data || [];
        setCustomers(records);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  // ─── Fetch Tax Options ──────────────────────────────────────────────
  const fetchTaxOptions = async () => {
    setLoadingTaxes(true);
    try {
      const response = await api.get('/item/get-tax');
      if (response.data && response.data.success === 1) {
        const taxData = response.data.data || [];
        setTaxOptions(taxData);
        
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
          hsn: item.HSN || '',
        }));
        
        setAllItems(mappedItems);
        
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
        const supplierRecords = response.data.data?.records || response.data.data || [];
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

  // ─── Filtered suppliers ────────────────────────────────────────────
  const filteredSuppliers = suppliers.filter(s =>
    s.supplier_name.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
    (s.email_id && s.email_id.toLowerCase().includes(supplierSearchTerm.toLowerCase())) ||
    (s.mobile_no && s.mobile_no.includes(supplierSearchTerm))
  );

  const filteredCustomers = customers.filter(c =>
    c.customer_name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    (c.email_id && c.email_id.toLowerCase().includes(customerSearchTerm.toLowerCase())) ||
    (c.mobile_no && c.mobile_no.includes(customerSearchTerm))
  );

  const selectedSupplier = formData.supplier
    ? suppliers.find(s => s.supplier_name === formData.supplier)
    : undefined;

  const selectedCustomer = formData.customerId
    ? customers.find(c => c.id === formData.customerId)
    : undefined;

  // ─── Fetch single purchase order ──────────────────────────────────
  const fetchPurchaseOrder = async (poId: string) => {
    setLoadingData(true);
    try {
      const response = await api.get(`/purchase-order/${poId}`);
      if (response.data && response.data.success === 1) {
        const data = response.data.data;
        
        const items = data.items?.map((item: any, index: number) => {
          const itemTaxRate = item.item_tax_rate ? parseFloat(item.item_tax_rate) : 0;
          
          let matchedTax = null;
          if (taxOptions.length > 0 && itemTaxRate > 0) {
            matchedTax = taxOptions.find(t => {
              const { rate } = extractTaxInfo(t.tax_type);
              return rate === itemTaxRate;
            });
          }
          
          if (!matchedTax && item.item_tax_template && taxOptions.length > 0) {
            const templateMatch = item.item_tax_template.match(/(\d+)/);
            if (templateMatch) {
              const templateRate = parseInt(templateMatch[1]);
              matchedTax = taxOptions.find(t => {
                const { rate } = extractTaxInfo(t.tax_type);
                return rate === templateRate;
              });
            }
          }
          
          return {
            id: String(index + 1),
            itemId: item.item_id || 0, // Store the actual item ID
            itemCode: item.item_code || '',
            itemName: item.item_name || '',
            quantity: item.qty || 0,
            uom: item.uom || 'NOS',
            rate: item.rate || 0,
            orderRate: item.rate || 0,
            amount: item.amount || 0,
            receivedQty: item.received_qty || 0,
            balanceQty: item.balance_qty || item.qty || 0,
            itemGroup: item.item_group || '',
            brand: item.brand || '',
            description: item.description || '',
            taxId: matchedTax ? String(matchedTax.tax_id) : '',
            taxRate: matchedTax ? itemTaxRate : 0,
            hsn: item.hsn || '',
          };
        }) || [{ 
          id: '1', 
          itemId: 0,
          itemCode: '', 
          itemName: '', 
          quantity: 1, 
          uom: 'NOS', 
          rate: 0, 
          orderRate: 0, 
          amount: 0, 
          receivedQty: 0, 
          balanceQty: 0, 
          taxId: '', 
          taxRate: 0 
        }];

        let taxRate = 18;
        let taxCategory = 'GST';
        let taxId = '';
        
        if (items.length > 0 && items[0].taxRate && items[0].taxRate > 0) {
          taxRate = items[0].taxRate;
          const matchedTax = taxOptions.find(t => {
            const { rate } = extractTaxInfo(t.tax_type);
            return rate === taxRate;
          });
          if (matchedTax) {
            taxId = String(matchedTax.tax_id);
            const { rate, category } = extractTaxInfo(matchedTax.tax_type);
            taxRate = rate;
            taxCategory = category;
          }
        }
        
        if (!taxId && data.taxes_and_charges) {
          const taxString = data.taxes_and_charges;
          const percentMatch = taxString.match(/(\d+)%/);
          if (percentMatch) {
            taxRate = parseInt(percentMatch[1]);
          } else {
            const numberMatch = taxString.match(/(\d+)/);
            if (numberMatch) {
              taxRate = parseInt(numberMatch[1]);
            }
          }
          
          if (taxString.includes('GST')) {
            taxCategory = 'GST';
          } else if (taxString.includes('VAT')) {
            taxCategory = 'VAT';
          } else if (taxString.includes('Tax')) {
            taxCategory = 'Tax';
          }
          
          const matchedTax = taxOptions.find(t => {
            const { rate, category } = extractTaxInfo(t.tax_type);
            return rate === taxRate && category === taxCategory;
          });
          
          if (matchedTax) {
            taxId = String(matchedTax.tax_id);
            const { rate, category } = extractTaxInfo(matchedTax.tax_type);
            taxRate = rate;
            taxCategory = category;
          }
        }
        
        if (!taxId && taxOptions.length > 0) {
          const firstTax = taxOptions[0];
          taxId = String(firstTax.tax_id);
          const { rate, category } = extractTaxInfo(firstTax.tax_type);
          taxRate = rate;
          taxCategory = category;
        }

        const totalAmount = items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
        const taxAmount = items.reduce((sum: number, item: any) => {
          const lineAmount = (item.orderRate || item.rate || 0) * item.quantity;
          const rate = (item.taxRate || 0) / 100;
          return sum + lineAmount * rate;
        }, 0);
        const grandTotal = totalAmount + taxAmount;

        const orderDateStr = data.transaction_date ? data.transaction_date.split('T')[0] : new Date().toISOString().split('T')[0];
        const deliveryDateStr = data.schedule_date ? data.schedule_date.split('T')[0] : '';

        setFormData({
          poNumber: data.name || data.po_number || '',
          title: data.title || '',
          supplier: data.supplier_name || data.supplier || '',
          supplierCode: data.supplier || '',
          status: data.status || 'Draft',
          orderDate: orderDateStr,
          deliveryDate: deliveryDateStr,
          currency: data.currency || 'INR',
          paymentTerms: data.payment_terms_template || 'Net 30',
          shippingAddress: data.shipping_address_display || data.shipping_address || '',
          billingAddress: data.billing_address_display || data.billing_address || '',
          notes: data.terms || data.notes || '',
          items: items,
          taxRate: taxRate,
          taxCategory: taxCategory,
          taxId: taxId,
          customer: data.customer_name || '',
          customerId: data.customer_id,
        });

        setStartDate(new Date(orderDateStr));
        setDeliveryDate(deliveryDateStr ? new Date(deliveryDateStr) : null);

        setEditableGrandTotal(grandTotal);
        setGrandTotalAdjustmentSign('positive');
        setGrandTotalAdjustmentValue(0);
        setShowAdjustment(false);
        setSupplierSearchTerm(data.supplier_name || data.supplier || '');
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
    setShowSuggestions(prev => ({ ...prev, [index]: filtered.length > 0 }));
    
    if (inputRefs.current[index]) {
      updateDropdownPosition(index);
    }
  };

  // ─── Open the item dropdown ────────────────────────────────────────
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

  // ─── Handle per-row tax selection ──────────────────────────────────
  const handleItemTaxChange = (index: number, taxId: string) => {
    const updatedItems = [...formData.items];
    if (!taxId) {
      updatedItems[index] = { ...updatedItems[index], taxId: '', taxRate: 0 };
    } else {
      const selectedTax = taxOptions.find(t => t.tax_id.toString() === taxId);
      const { rate } = selectedTax ? extractTaxInfo(selectedTax.tax_type) : { rate: 0 };
      updatedItems[index] = { ...updatedItems[index], taxId, taxRate: rate };
    }
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  // ─── Handle item search ─────────────────────────────────────────────
  const handleItemSearch = (index: number, value: string) => {
    setSearchTerms(prev => ({ ...prev, [index]: value }));
    filterItems(index, value);
  };

  // ─── Handle item selection from suggestions ──────────────────────
  const handleSelectItem = (index: number, item: ItemSuggestion) => {
    const updatedItems = [...formData.items];
    const rate = item.standard_rate || item.valuation_rate || 0;
    const quantity = updatedItems[index].quantity || 1;

    let rowTaxId = formData.taxId;
    let rowTaxRate = formData.taxRate;
    if (item.tax_id) {
      const matchedTax = taxOptions.find(t => t.tax_id === item.tax_id);
      if (matchedTax) {
        rowTaxId = String(matchedTax.tax_id);
        rowTaxRate = extractTaxInfo(matchedTax.tax_type).rate;
      }
    }

    updatedItems[index] = {
      ...updatedItems[index],
      itemId: item.id, // Store the actual item ID from the API
      itemCode: item.item_code,
      itemName: item.item_name,
      uom: item.stock_uom || 'NOS',
      rate: rate,
      orderRate: rate,
      amount: rate * quantity,
      balanceQty: quantity - updatedItems[index].receivedQty,
      itemGroup: item.item_group || '',
      brand: item.brand || '',
      description: item.description || '',
      taxId: rowTaxId,
      taxRate: rowTaxRate,
      hsn: item.hsn || '',
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

  // ─── Click outside for supplier dropdown ──────────────────────────
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        supplierDropdownRef.current &&
        !supplierDropdownRef.current.contains(event.target as Node) &&
        supplierInputRef.current &&
        !supplierInputRef.current.contains(event.target as Node)
      ) {
        setShowSupplierDropdown(false);
      }
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target as Node) &&
        customerInputRef.current &&
        !customerInputRef.current.contains(event.target as Node)
      ) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  // ─── Load master data ─────────────────────────────────────────────
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        await Promise.all([
          fetchSuppliers(),
          fetchAllItems(),
          fetchTaxOptions(),
          fetchCustomers()
        ]);
        setMasterDataLoaded(true);
      } catch (err) {
        console.error('Error loading master data:', err);
        toast.error('Failed to load required data');
      }
    };
    loadMasterData();
  }, []);

  // ─── Load PO data or generate new PO number after master data is ready ──
  useEffect(() => {
    if (masterDataLoaded) {
      if (isEdit && id) {
        setTimeout(() => {
          fetchPurchaseOrder(id);
        }, 100);
      } else {
        const today = new Date();
        const year = today.getFullYear();
        const nextNumber = Math.floor(Math.random() * 1000) + 1;
        setFormData(prev => ({
          ...prev,
          poNumber: `PO-${year}-${String(nextNumber).padStart(3, '0')}`
        }));
      }
    }
  }, [masterDataLoaded, isEdit, id]);

  // ─── Re-filter items when group filter changes ────────────────────
  useEffect(() => {
    Object.keys(searchTerms).forEach(key => {
      const index = parseInt(key);
      filterItems(index, searchTerms[index] || '');
    });
  }, [itemGroupFilter]);

  // ─── Calculate totals ─────────────────────────────────────────────
  const calculateTotals = () => {
    const totalAmount = formData.items.reduce((sum, item) => sum + (item.orderRate || item.rate || 0) * item.quantity, 0);
    const taxAmount = formData.items.reduce((sum, item) => {
      const lineAmount = (item.orderRate || item.rate || 0) * item.quantity;
      const rate = (item.taxRate || 0) / 100;
      return sum + lineAmount * rate;
    }, 0);
    
    const adjustmentValue = grandTotalAdjustmentSign === 'positive' 
      ? grandTotalAdjustmentValue 
      : -grandTotalAdjustmentValue;
    
    const calculatedGrandTotal = totalAmount + taxAmount + adjustmentValue;
    
    return { totalAmount, taxAmount, grandTotal: calculatedGrandTotal, adjustmentValue };
  };

  const { totalAmount, taxAmount, grandTotal: calculatedGrandTotal, adjustmentValue } = calculateTotals();

  // ─── Handlers ──────────────────────────────────────────────────────
  const handleItemChange = (index: number, field: keyof PurchaseOrderItem, value: string | number) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'itemCode') {
      const stringValue = value as string;
      handleItemSearch(index, stringValue);
    }
    
    if (field === 'quantity' || field === 'orderRate' || field === 'rate') {
      const quantity = field === 'quantity' ? Number(value) : updatedItems[index].quantity;
      const rate = field === 'orderRate' ? Number(value) : 
                   field === 'rate' ? Number(value) : updatedItems[index].orderRate;
      updatedItems[index].amount = quantity * rate;
      updatedItems[index].balanceQty = quantity - updatedItems[index].receivedQty;
      
      if (field === 'rate') {
        updatedItems[index].orderRate = Number(value);
      }
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
      items: [...prev.items, { 
        id: newId, 
        itemId: 0, // Initialize with 0
        itemCode: '', 
        itemName: '', 
        quantity: 1, 
        uom: 'NOS', 
        rate: 0, 
        orderRate: 0, 
        amount: 0, 
        receivedQty: 0, 
        balanceQty: 0, 
        taxId: prev.taxId, 
        taxRate: prev.taxRate 
      }]
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

  // ─── Handle supplier selection ─────────────────────────────────────
  const handleSupplierSelect = (supplier: Supplier) => {
    setFormData(prev => ({
      ...prev,
      supplier: supplier.supplier_name,
      supplierCode: supplier.id?.toString() || '',
    }));
    setSupplierSearchTerm(supplier.supplier_name);
    setShowSupplierDropdown(false);
  };

  // ─── Handle customer selection ─────────────────────────────────────
  const handleCustomerSelect = (customer: Customer) => {
    setFormData(prev => ({
      ...prev,
      customer: customer.customer_name,
      customerId: customer.id,
    }));
    setCustomerSearchTerm(customer.customer_name);
    setShowCustomerDropdown(false);
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
    if (formData.items.some(item => !item.itemCode.trim() || !item.itemName.trim() || item.quantity <= 0 || (item.orderRate || item.rate) <= 0)) {
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
    
    const taxAmountCalc = formData.items.reduce((sum, item) => {
      const lineAmount = (item.orderRate || item.rate || 0) * item.quantity;
      return sum + lineAmount * ((item.taxRate || 0) / 100);
    }, 0);
    const grandTotalCalc = totalAmount + taxAmountCalc + adjustmentValue;
    const distinctRates = [...new Set(formData.items.map(item => item.taxRate || 0))];
    const taxesAndChargesLabel = distinctRates.length <= 1
      ? `${formData.taxCategory} ${distinctRates[0] ?? 0}%`
      : 'Mixed';

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
      set_from_warehouse: "",
      total_qty: totalQty,
      total_net_weight: 0,
      base_total: totalAmount,
      base_net_total: totalAmount,
      total: totalAmount,
      net_total: totalAmount,
      set_reserve_warehouse: "",
      tax_category: formData.taxCategory,
      taxes_and_charges: taxesAndChargesLabel,
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
      rounding_adjustment: adjustmentValue,
      base_rounding_adjustment: adjustmentValue,
      advance_paid: 0,
      base_discount_amount: 0,
      additional_discount_percentage: 0,
      discount_amount: 0,
      other_charges_calculation: "Net Total",
      supplier_address: selectedSupplier?.address || "",
      address_display: formData.shippingAddress || "",
      supplier_group: selectedSupplier?.supplier_group || "Local",
      payment_terms_template: formData.paymentTerms,
      terms: formData.notes || "",
      status: formData.status,
      per_billed: 0,
      per_received: 0,
      group_same_items: 0,
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
      
      items: formData.items.map((item, idx) => ({
        item_id: item.itemId || 0, // Use the actual item ID from the API, not hardcoded
        fg_item_qty: item.quantity || 0,
        item_code: item.itemCode,
        supplier_part_no: `SP-${String(idx + 1).padStart(3, '0')}`,
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
        price_list_rate: item.orderRate || item.rate,
        last_purchase_rate: (item.orderRate || item.rate) * 0.98,
        base_price_list_rate: item.orderRate || item.rate,
        margin_type: "Percentage",
        margin_rate_or_amount: 0,
        rate_with_margin: item.orderRate || item.rate,
        discount_percentage: 0,
        distributed_discount_amount: 0,
        base_rate_with_margin: item.orderRate || item.rate,
        rate: item.orderRate || item.rate,
        item_tax_template: item.taxRate && item.taxRate > 0 ? `${formData.taxCategory} ${item.taxRate}%` : '',
        pricing_rules: "",
        is_free_item: 0,
        from_warehouse: "",
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
        item_tax_rate: String(item.taxRate ?? 0),
        production_plan: "",
        production_plan_item: "",
        production_plan_sub_assembly_item: "",
        page_break: 0,
        job_card: "",
        hsn: item.hsn || "",
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
              {suggestion.hsn && (
                <div className="pof-suggestion-hsn">HSN: {suggestion.hsn}</div>
              )}
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
                {formData.currency} {(suggestion.standard_rate || suggestion.valuation_rate || 0).toFixed(2)}
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
          <div className="pof-modal-overlay" onClick={() => setShowValidationSummary(false)}>
            <div className="pof-validation-modal" onClick={(e) => e.stopPropagation()}>
              <div className="pof-modal-header">
                <h2>
                  <FaExclamationTriangle /> Missing Required Fields
                </h2>
                <button className="pof-modal-close" onClick={() => setShowValidationSummary(false)}>×</button>
              </div>
              <div className="pof-modal-body">
                <p className="pof-modal-description">
                  Please fill in the following required fields before submitting:
                </p>
                <div className="pof-validation-errors-list">
                  {validationErrors.map((error, idx) => (
                    <div key={idx} className="pof-validation-error-item">
                      <div className="pof-error-header">
                        <FaTimesCircle className="pof-error-icon" />
                        <strong>{error.label}</strong>
                      </div>
                      <div className="pof-error-message">{error.message}</div>
                    </div>
                  ))}
                </div>
                <div className="pof-validation-tip">
                  <FaInfoCircle className="pof-tip-icon" />
                  Please fix the errors above before submitting
                </div>
              </div>
              <div className="pof-modal-footer">
                <button className="pof-btn-cancel" onClick={() => setShowValidationSummary(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── API Error Display ────────────────────────────────────── */}
        {apiError && (
          <div className="pof-api-error">
            <FaExclamationCircle className="pof-error-icon" />
            <span>{apiError}</span>
            <button className="pof-error-close" onClick={() => setApiError(null)}>×</button>
          </div>
        )}

        {/* ─── Header ────────────────────────────────────────────────── */}
        <div className="pof-header">
          <button onClick={handleCancel} className="pof-back-btn">
            <FaArrowLeft size={9} /> Back
          </button>
          <div className="pof-header-title">
            <h1>{isEdit ? 'Edit Purchase Order' : 'New Purchase Order'}</h1>
            {isEdit && <span className="pof-status-badge">{formData.status}</span>}
          </div>
          {hasErrors && (
            <div className="pof-error-badge">
              <FaExclamationTriangle size={12} />
              {getAllValidationErrors().length} missing field{getAllValidationErrors().length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>

          {/* ─── Main Form Card ────────────────────────────────────────── */}
          <div className="pof-card">

            {/* ─── Compact Two-Column Layout ────────────────────────── */}
            <div className="pof-compact-layout">
              
              {/* Left Column - PO Information */}
              <div className="pof-left-column">
                
                {/* PO Information Section */}
                <div className="pof-info-section">
                  <div className="pof-section-label">
                    <FaFileAlt className="pof-section-icon" /> Purchase Order Information
                  </div>
                  
                  {/* Supplier Selection Section */}
                  <div className="pof-info-section">
                    <div className="pof-info-row">
                      <div className="pof-info-field">
                        <label>Supplier <span className="pof-required">*</span></label>
                        <div className="pof-supplier-wrapper">
                          <input
                            ref={supplierInputRef}
                            type="text"
                            value={supplierSearchTerm}
                            onChange={(e) => {
                              setSupplierSearchTerm(e.target.value);
                              setShowSupplierDropdown(true);
                              setFormData(prev => ({ ...prev, supplier: e.target.value, supplierCode: '' }));
                            }}
                            onFocus={() => setShowSupplierDropdown(true)}
                            className={`pof-form-field ${validationErrors.some(e => e.field === 'supplier') ? 'pof-field-error' : ''}`}
                            placeholder="Search supplier..."
                            disabled={loadingSuppliers}
                            autoComplete="off"
                          />
                          {loadingSuppliers && <FaSpinner className="pof-supplier-spinner pof-spinning" size={14} />}
                          {showSupplierDropdown && filteredSuppliers.length > 0 && (
                            <div ref={supplierDropdownRef} className="pof-supplier-dropdown">
                              {filteredSuppliers.map((supplier) => (
                                <div
                                  key={supplier.id}
                                  className="pof-supplier-item"
                                  onClick={() => handleSupplierSelect(supplier)}
                                >
                                  <div className="pof-supplier-item-name">
                                    <FaBuilding className="pof-supplier-item-icon" size={12} />
                                    {supplier.supplier_name}
                                  </div>
                                  <div className="pof-supplier-item-details">
                                    {supplier.supplier_type && <span>{supplier.supplier_type}</span>}
                                    {supplier.mobile_no && <span><FaPhone size={10} /> {supplier.mobile_no}</span>}
                                    {supplier.email_id && <span><FaEnvelope size={10} /> {supplier.email_id}</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
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
                      </div>
                      <div className="pof-info-field">
                      <label>Title <span className="pof-required">*</span></label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className={`pof-form-field ${validationErrors.some(e => e.field === 'title') ? 'pof-field-error' : ''}`}
                        placeholder="Enter PO title"
                      />
                      {validationErrors.some(e => e.field === 'title') && (
                        <span className="pof-error-msg">
                          <FaExclamationCircle size={10} />Title is required
                        </span>
                      )}
                    </div>
                    
                    </div>
                  </div>
                  
                  <div className="pof-info-row">
                    <div className="pof-info-field">
                      <label>PO Number</label>
                      <input
                        type="text"
                        value={formData.poNumber}
                        disabled
                        className="pof-form-field pof-field-disabled"
                      />
                    </div>
                    <div className="pof-info-field">
                      <label>Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                        className="pof-form-field"
                      >
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  <div className="pof-info-row">
                    <div className="pof-info-field">
                      <label>Order Date <span className="pof-required">*</span></label>
                      <div className="pof-date-picker-wrapper">
                        <DatePicker
                          selected={startDate}
                          onChange={(date: Date | null) => {
                            if (date) {
                              setStartDate(date);
                              const formattedDate = date.toISOString().split('T')[0];
                              setFormData(prev => ({ ...prev, orderDate: formattedDate }));
                            }
                          }}
                          dateFormat="dd/MM/yyyy"
                          className={`pof-form-field ${validationErrors.some(e => e.field === 'orderDate') ? 'pof-field-error' : ''}`}
                          placeholderText="Select order date"
                          maxDate={new Date()}
                          showMonthDropdown
                          showYearDropdown
                          dropdownMode="select"
                        />
                        <FaCalendarAlt className="pof-calendar-icon" />
                      </div>
                      {validationErrors.some(e => e.field === 'orderDate') && (
                        <span className="pof-error-msg">
                          <FaExclamationCircle size={10} />Order date is required
                        </span>
                      )}
                    </div>
                    <div className="pof-info-field">
                      <label>Delivery Date</label>
                      <div className="pof-date-picker-wrapper">
                        <DatePicker
                          selected={deliveryDate}
                          onChange={(date: Date | null) => {
                            if (date) {
                              setDeliveryDate(date);
                              const formattedDate = date.toISOString().split('T')[0];
                              setFormData(prev => ({ ...prev, deliveryDate: formattedDate }));
                            } else {
                              setDeliveryDate(null);
                              setFormData(prev => ({ ...prev, deliveryDate: '' }));
                            }
                          }}
                          dateFormat="dd/MM/yyyy"
                          className="pof-form-field"
                          placeholderText="Select delivery date"
                          minDate={startDate || new Date()}
                          showMonthDropdown
                          showYearDropdown
                          dropdownMode="select"
                          isClearable
                        />
                        <FaCalendarAlt className="pof-calendar-icon" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pof-info-row">
                    <div className="pof-info-field">
                      <label>Payment Terms</label>
                      <select
                        value={formData.paymentTerms}
                        onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                        className="pof-form-field"
                      >
                        {paymentTerms.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>

                </div>
              </div>

              {/* Right Column - Customer/Supplier Details Card */}
              <div className="pof-right-column">
                
                {/* Supplier Details Card */}
                <div className="pof-party-detail-card">
                  <div className="pof-party-card-header">
                    <FaBuilding size={16} />
                    <span>Supplier Details</span>
                  </div>
                  <div className="pof-party-card-content">
                    {selectedSupplier ? (
                      <div className="pof-party-info">
                        <h3>{selectedSupplier.supplier_name}</h3>
                        <div className="pof-party-info-item">
                          <span className="pof-party-info-label">Type</span>
                          <span className="pof-party-info-value">{selectedSupplier.supplier_type || 'N/A'}</span>
                        </div>
                        <div className="pof-party-info-item">
                          <span className="pof-party-info-label">Group</span>
                          <span className="pof-party-info-value">{selectedSupplier.supplier_group || 'N/A'}</span>
                        </div>
                        <div className="pof-party-info-item">
                          <span className="pof-party-info-label">Country</span>
                          <span className="pof-party-info-value">
                            <FaGlobeAsia size={10} /> {selectedSupplier.country || 'N/A'}
                          </span>
                        </div>
                        <div className="pof-party-info-item">
                          <span className="pof-party-info-label">Mobile</span>
                          <span className="pof-party-info-value">
                            <FaPhone size={10} /> {selectedSupplier.mobile_no || 'N/A'}
                          </span>
                        </div>
                        <div className="pof-party-info-item">
                          <span className="pof-party-info-label">Email</span>
                          <span className="pof-party-info-value">
                            <FaEnvelope size={10} /> {selectedSupplier.email_id || 'N/A'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="pof-party-empty-state">
                        <FaInfoCircle size={24} />
                        <p>Select a supplier to view details</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            <div className="pof-divider" />

            {/* ─── Items Section ────────────────────────────────────── */}
            <div className="pof-items-section">
              <div className="pof-items-header">
                <span className="pof-section-title">
                  <FaBoxes className="pof-section-icon" /> Items <span className="pof-required">*</span>
                </span>
                <div className="pof-items-actions">
                  <button type="button" className="pof-add-item-btn" onClick={addItemRow}>
                    <FaPlus size={10} /> Add Item
                  </button>
                </div>
              </div>

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

              <div className="pof-table-block">
                <table className="pof-inline-table">
                  <thead>
                    <tr>
                      <th className="pof-ith">#</th>
                      <th className="pof-ith">Item Code <span className="pof-required">*</span></th>
                      <th className="pof-ith">Item Name <span className="pof-required">*</span></th>
                      <th className="pof-ith">HSN</th>
                      <th className="pof-ith">Qty <span className="pof-required">*</span></th>
                      <th className="pof-ith">UOM</th>
                      <th className="pof-ith">Rate</th>
                      <th className="pof-ith">Tax</th>
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
                              placeholder="Search by item code or name"
                              onFocus={() => openItemDropdown(index)}
                              onClick={() => openItemDropdown(index)}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  setShowSuggestions(prev => ({ ...prev, [index]: false }));
                                }
                              }}
                            />
                            {loadingItems && (
                              <FaSpinner className="pof-spinning pof-search-spinner" size={14} />
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
                            className="pof-cell-input"
                            type="text"
                            value={item.hsn || ''}
                            onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
                            placeholder="HSN"
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
                       
                        <td className="pof-itd">
                          <select
                            className="pof-cell-select pof-tax-select"
                            value={item.taxId || ''}
                            onChange={(e) => handleItemTaxChange(index, e.target.value)}
                            disabled={loadingTaxes}
                          >
                            <option value="">No Tax</option>
                            {taxOptions.map(tax => {
                              const { rate, category } = extractTaxInfo(tax.tax_type);
                              return (
                                <option key={tax.tax_id} value={String(tax.tax_id)}>
                                  {category} {rate}%
                                </option>
                              );
                            })}
                          </select>
                        </td>
                        <td className="pof-itd pof-itd-amount">
                          {formData.currency} {((item.orderRate || item.rate || 0) * item.quantity).toFixed(2)}
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
                      <td colSpan={8} className="pof-total-label">Subtotal</td>
                      <td colSpan={3} className="pof-total-amount">{formData.currency} {totalAmount.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan={8} className="pof-total-label">
                        <span>Tax</span>
                      </td>
                      <td colSpan={3} className="pof-total-amount">{formData.currency} {taxAmount.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan={6} className="pof-total-label pof-adjustment-label">
                        <span>Adjustment</span>
                      </td>
                      <td colSpan={5} className="pof-total-amount pof-adjustment-cell">
                        <div className="pof-adjustment-controls">
                          <select
                            className="pof-adjustment-sign-select"
                            value={grandTotalAdjustmentSign}
                            onChange={(e) => setGrandTotalAdjustmentSign(e.target.value)}
                          >
                            <option value="positive">+ Add</option>
                            <option value="negative">- Deduct</option>
                          </select>
                          <input
                            type="number"
                            className="pof-adjustment-input"
                            value={grandTotalAdjustmentValue}
                            onChange={(e) => setGrandTotalAdjustmentValue(parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                          />
                          <span className="pof-adjustment-result">
                            = {formData.currency} {adjustmentValue.toFixed(2)}
                          </span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={8} className="pof-total-label pof-total-grand">Grand Total</td>
                      <td colSpan={3} className="pof-total-amount pof-total-grand-amount">
                        {formData.currency} {calculatedGrandTotal.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              {validationErrors.some(e => e.field === 'items') && (
                <span className="pof-error-msg" style={{ marginTop: '8px' }}>
                  <FaExclamationCircle size={10} />All items must have code, name, quantity {'>'} 0 and rate {'>'} 0
                </span>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div className="pof-info-section" style={{ marginTop: '16px' }}>
            <div className="pof-section-label">
              <FaClipboardList className="pof-section-icon" /> Notes
            </div>
            <div className="pof-info-row">
              <div className="pof-info-field" style={{ gridColumn: '1 / -1' }}>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="pof-form-field pof-textarea"
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* ─── Footer ────────────────────────────────────────────────── */}
          <div className="pof-footer">
            <button
              type="button"
              onClick={handleCancel}
              className="pof-cancel-btn"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="pof-submit-btn"
            >
              {loading && <FaSpinner className="pof-spinning" />}
              <FaSave size={12} />
              {isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}