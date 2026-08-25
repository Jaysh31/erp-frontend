// PurchaseOrderForm.tsx - Cleaner UI with Compact Layout, Customer Info on Right, Item Table with Order Rate, Editable Grand Total
// UPDATED: Added "Item Code" dropdown with "+ Add New Item" popup (sticky at bottom)
// UPDATED: Added item dropdown with "+ Add New Item" button in item search field
// UPDATED: Added Quantity field in "Add New Item" popup
// UPDATED: Removed HSN field from "Add New Item" popup

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  FaPlus, FaSave, FaSpinner, FaArrowLeft,
  FaExclamationCircle, FaExclamationTriangle, FaInfoCircle,
  FaTimesCircle,  FaBuilding,
  FaCalendarAlt, FaFileAlt, FaBoxes, FaClipboardList,
  FaSearch, FaFilter, FaPhone, FaEnvelope,  FaGlobeAsia,
  FaCheckCircle
} from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './PurchaseOrderForm.css';

// ─── DigitInput Component ──────────────────────────────────

interface DigitInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  allowDecimal?: boolean;
  min?: number;
  max?: number;
}

function DigitInput({ 
  label, 
  value, 
  onChange, 
  placeholder = '', 
  maxLength = 20,
  disabled = false,
  required = false,
  className = '',
  allowDecimal = false,
  min,
  max
}: DigitInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    
    if (allowDecimal) {
      // Allow digits and decimal point
      const decimalRegex = /^[0-9]*\.?[0-9]*$/;
      if (decimalRegex.test(inputValue) || inputValue === '') {
        // Check max length
        if (inputValue.replace('.', '').length <= maxLength) {
          onChange(inputValue);
        }
      }
    } else {
      // Only allow digits
      const digitsOnly = inputValue.replace(/\D/g, '');
      if (digitsOnly.length <= maxLength) {
        onChange(digitsOnly);
      }
    }
  };

  const handleBlur = () => {
    if (value) {
      let numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        if (min !== undefined && numValue < min) {
          onChange(String(min));
        }
        if (max !== undefined && numValue > max) {
          onChange(String(max));
        }
      }
    }
  };

  return (
    <div className={`digit-input-wrapper ${className}`}>
      {label && <label className="digit-input-label">{label}</label>}
      <input
        type="text"
        inputMode={allowDecimal ? "decimal" : "numeric"}
        pattern={allowDecimal ? "[0-9]*[.]?[0-9]*" : "[0-9]*"}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className="digit-input"
        maxLength={maxLength + (allowDecimal ? 1 : 0)}
      />
    </div>
  );
}

// ─── Types ──────────────────────────────────────────────────

interface PurchaseOrderItem {
  id: string;
  itemId: number;
  itemCode: string;
  itemName: string;
  quantity: number; // ✅ Supports decimals like 1.5
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
  primary_address?: string;
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

// ─── Item interface for dropdown ───────────────────────────
interface Item {
  id: number;
  item_code: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  standard_rate: number;
  valuation_rate: number;
  tax_id?: number;
  hsn?: string;
  description?: string;
  brand?: string;
}

const statusOptions = ['Draft', 'Submitted', 'Partially Received', 'Fully Received', 'Cancelled', 'Closed'];
const paymentTerms = ['Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Due on Receipt', 'Cash on Delivery'];

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

  // ─── State for "Add New Supplier" Popup ──────────────────
  const [showAddSupplierPopup, setShowAddSupplierPopup] = useState(false);
  const [addingSupplier, setAddingSupplier] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    supplier_name: '',
    supplier_type: 'Individual',
    supplier_group: '',
    country: 'India',
    mobile_no: '',
    email_id: '',
    primary_address: '',
  });

  // ─── State for "Add New Item" Popup ──────────────────────
  const [showAddItemPopup, setShowAddItemPopup] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [pendingItemSearch, setPendingItemSearch] = useState('');
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [newItem, setNewItem] = useState({
    item_name: '',
    item_code: '',
    item_group: '',
    stock_uom: 'NOS',
    standard_rate: '',
    valuation_rate: '',
    description: '',
    tax_id: '',
    quantity: '1',
  });

  // ─── State for Item Code dropdown ────────────────────────
  const [itemCodeSearchTerm, setItemCodeSearchTerm] = useState('');
  const [showItemCodeDropdown, setShowItemCodeDropdown] = useState(false);
  const [itemCodeOptions, setItemCodeOptions] = useState<Item[]>([]);
  const [loadingItemCode, setLoadingItemCode] = useState(false);
  const [selectedItemCode, setSelectedItemCode] = useState<Item | null>(null);
  const itemCodeInputRef = useRef<HTMLInputElement>(null);
  const itemCodeDropdownRef = useRef<HTMLDivElement>(null);

  // State for customers
  const [, setCustomers] = useState<Customer[]>([]);
  const [, setLoadingCustomers] = useState(false);
  const [, setShowCustomerDropdown] = useState(false);
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
  const [, setEditableGrandTotal] = useState<number>(0);
  const [grandTotalAdjustmentSign, setGrandTotalAdjustmentSign] = useState<string>('positive');
  const [grandTotalAdjustmentValue, setGrandTotalAdjustmentValue] = useState<string>('0');
  const [, setShowAdjustment] = useState<boolean>(false);

  // Date picker states
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [deliveryDate, setDeliveryDate] = useState<Date | null>(null);

  // ─── Digit Input Values ──────────────────────────────────
  const [digitValues, setDigitValues] = useState<{ [key: number]: { quantity: string; rate: string } }>({});

  // Refs for date fields to focus on validation error - only orderDate ref needed
  const orderDateRef = useRef<HTMLDivElement>(null);
  const deliveryDateRef = useRef<HTMLDivElement>(null);

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

  // ─── Handle Add New Supplier ──────────────────────────────
  const handleAddNewSupplier = async () => {
    if (!newSupplier.supplier_name.trim()) {
      toast.error('Supplier name is required');
      return;
    }
    if (!newSupplier.mobile_no.trim()) {
      toast.error('Phone number is required');
      return;
    }
    if (!newSupplier.email_id.trim()) {
      toast.error('Email is required');
      return;
    }

    setAddingSupplier(true);
    try {
      const payload = {
        supplier_name: newSupplier.supplier_name.trim(),
        supplier_type: newSupplier.supplier_type || 'Individual',
        supplier_group: newSupplier.supplier_group || 'Local',
        country: newSupplier.country || 'India',
        mobile_no: newSupplier.mobile_no.trim(),
        email_id: newSupplier.email_id.trim(),
        primary_address: newSupplier.primary_address || '',
      };

      const response = await api.post('/supplier', payload);
      
      if (response.data && response.data.success === 1) {
        toast.success('Supplier created successfully!');
        await fetchSuppliers();
        setShowAddSupplierPopup(false);
        resetNewSupplierForm();
        // Auto-select the newly created supplier
        const newSupplierData = response.data.data;
        if (newSupplierData) {
          const supplierName = newSupplierData.supplier_name || newSupplier.supplier_name.trim();
          setFormData(prev => ({ 
            ...prev, 
            supplier: supplierName,
            supplierCode: newSupplierData.id?.toString() || ''
          }));
          setSupplierSearchTerm(supplierName);
        }
      } else {
        toast.error(response.data?.message || 'Failed to create supplier');
      }
    } catch (err: any) {
      console.error('Error creating supplier:', err);
      toast.error(err.response?.data?.message || 'Failed to create supplier');
    } finally {
      setAddingSupplier(false);
    }
  };

  const resetNewSupplierForm = () => {
    setNewSupplier({
      supplier_name: '',
      supplier_type: 'Individual',
      supplier_group: '',
      country: 'India',
      mobile_no: '',
      email_id: '',
      primary_address: '',
    });
  };

  // ─── Handle Add New Item ──────────────────────────────────
  const handleAddNewItem = async () => {
    if (!newItem.item_name.trim()) {
      toast.error('Item name is required');
      return;
    }
    if (!newItem.item_group.trim()) {
      toast.error('Item group is required');
      return;
    }
    if (!newItem.stock_uom.trim()) {
      toast.error('UOM is required');
      return;
    }
    // Validate quantity
    const qtyNum = parseFloat(newItem.quantity) || 0;
    if (qtyNum <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    setAddingItem(true);
    try {
      const payload = {
        naming_series: "STO-ITEM-.YYYY.-",
        item_code: newItem.item_code.trim() || newItem.item_name.trim().toUpperCase().replace(/\s+/g, "-"),
        item_name: newItem.item_name.trim(),
        item_group: newItem.item_group.trim(),
        stock_uom: newItem.stock_uom.trim() || 'NOS',
        disabled: 0,
        tax_id: parseInt(newItem.tax_id) || 1,
        is_stock_item: 1,
        is_fixed_asset: 0,
        auto_create_assets: 0,
        is_grouped_asset: 0,
        asset_category: null,
        asset_naming_series: null,
        is_sales_item: 1,
        allow_alternative_item: 0,
        has_variants: 0,
        is_purchase_item: 1,
        is_customer_provided_item: 0,
        standard_rate: parseFloat(newItem.standard_rate) || 0,
        selling_price: parseFloat(newItem.valuation_rate) || parseFloat(newItem.standard_rate) || 0,
        opening_stock: 0,
        over_delivery_receipt_allowance: 0,
        over_billing_allowance: 0,
        brand: null,
        description: newItem.description || newItem.item_name,
        no_of_months: 0,
        purchase_tax_withholding_category: null,
        sales_tax_withholding_category: null,
        valuation_method: "FIFO",
        valuation_rate: parseFloat(newItem.valuation_rate) || parseFloat(newItem.standard_rate) || 0,
        end_of_life: "2099-12-31",
        default_material_request_type: "Purchase",
        warranty_period: null,
        weight_per_unit: 0,
        weight_uom: null,
        allow_negative_stock: 0,
        has_batch_no: 0,
        create_new_batch: 0,
        batch_number_series: null,
        has_expiry_date: 0,
        shelf_life_in_days: 0,
        retain_sample: 0,
        sample_quantity: 0,
        has_serial_no: 0,
        serial_no_series: null,
        variant_of: null,
        variant_based_on: "Item Attribute",
        purchase_uom: null,
        min_order_qty: 0,
        safety_stock: 0,
        lead_time_days: 0,
        last_purchase_rate: parseFloat(newItem.standard_rate) || 0,
        delivered_by_supplier: 0,
        country_of_origin: "India",
        customs_tariff_number: null,
        sales_uom: null,
        grant_commission: 1,
        max_discount: 0,
        include_item_in_manufacturing: 1,
        is_sub_contracted_item: 0,
        default_bom: null,
        production_capacity: 0,
        total_projected_qty: 0,
        default_manufacturer_part_no: null,
        default_item_manufacturer: null,
        customer_code: null,
        inspection_required_before_purchase: 0,
        inspection_required_before_delivery: 0,
        quality_inspection_template: null,
        HSN: null,
      };

      const response = await api.post('/item', payload);

      if (response.data && response.data.success === 1) {
        toast.success(`Item "${newItem.item_name}" created successfully!`);
        setShowAddItemPopup(false);
        
        // Refresh items list
        await fetchAllItems();
        await fetchItemCodeOptions();
        
        // Find the newly created item in the updated list and select it
        const newItemId = response.data.data?.insertId || response.data.data?.id;
        if (newItemId && activeRowIndex !== null) {
          const updatedItemsResponse = await api.get('/item?type=raw');
          if (updatedItemsResponse.data && updatedItemsResponse.data.success === 1) {
            const items = updatedItemsResponse.data.data || [];
            const newItemData = items.find((i: any) => i.id === newItemId || i.item_code === newItem.item_code);
            if (newItemData) {
              const mappedItem: ItemSuggestion = {
                id: newItemData.id,
                item_code: newItemData.item_code,
                item_name: newItemData.item_name,
                stock_uom: newItemData.stock_uom || 'NOS',
                standard_rate: newItemData.standard_rate || 0,
                valuation_rate: newItemData.valuation_rate || newItemData.standard_rate || 0,
                description: newItemData.description,
                brand: newItemData.brand,
                item_group: newItemData.item_group || 'Uncategorized',
                tax_id: newItemData.tax_id,
                hsn: newItemData.HSN || '',
              };
              setAllItems(prev => {
                const exists = prev.some(i => i.id === mappedItem.id);
                if (!exists) {
                  return [...prev, mappedItem];
                }
                return prev;
              });
              // Update filtered items for this row
              let filtered = [...allItems, mappedItem];
              if (itemGroupFilter !== 'all') {
                filtered = filtered.filter(item => item.item_group === itemGroupFilter);
              }
              setFilteredItems(prev => ({ 
                ...prev, 
                [activeRowIndex]: filtered 
              }));
              // Select the newly created item with the specified quantity
              // First update the selected item data
              const updatedItems = [...formData.items];
              const qtyNum = parseFloat(newItem.quantity) || 1;
              const rate = mappedItem.standard_rate || mappedItem.valuation_rate || 0;
              
              let rowTaxId = formData.taxId;
              let rowTaxRate = formData.taxRate;
              if (mappedItem.tax_id) {
                const matchedTax = taxOptions.find(t => t.tax_id === mappedItem.tax_id);
                if (matchedTax) {
                  rowTaxId = String(matchedTax.tax_id);
                  rowTaxRate = extractTaxInfo(matchedTax.tax_type).rate;
                }
              }

              updatedItems[activeRowIndex] = {
                ...updatedItems[activeRowIndex],
                itemId: mappedItem.id,
                itemCode: mappedItem.item_code,
                itemName: mappedItem.item_name,
                uom: mappedItem.stock_uom || 'NOS',
                rate: rate,
                orderRate: rate,
                quantity: qtyNum,
                amount: rate * qtyNum,
                balanceQty: qtyNum - updatedItems[activeRowIndex].receivedQty,
                itemGroup: mappedItem.item_group || '',
                brand: mappedItem.brand || '',
                description: mappedItem.description || '',
                taxId: rowTaxId,
                taxRate: rowTaxRate,
                hsn: mappedItem.hsn || '',
              };
              setFormData(prev => ({ ...prev, items: updatedItems }));
              
              // Update digit values
              setDigitValues(prev => ({
                ...prev,
                [activeRowIndex]: {
                  quantity: String(qtyNum),
                  rate: String(rate)
                }
              }));
              
              // Update search term
              setSearchTerms(prev => ({ ...prev, [activeRowIndex]: mappedItem.item_code }));
              setShowSuggestions(prev => ({ ...prev, [activeRowIndex]: false }));
            }
          }
        }
        resetNewItemForm();
        setPendingItemSearch('');
        setActiveRowIndex(null);
      } else {
        toast.error(response.data?.message || 'Failed to create item');
      }
    } catch (err: any) {
      console.error('Error creating item:', err);
      if (err.response?.status === 409) {
        toast.error('An item with this code already exists');
      } else {
        toast.error(err.response?.data?.message || 'Failed to create item');
      }
    } finally {
      setAddingItem(false);
    }
  };

  const resetNewItemForm = () => {
    setNewItem({
      item_name: '',
      item_code: '',
      item_group: '',
      stock_uom: 'NOS',
      standard_rate: '',
      valuation_rate: '',
      description: '',
      tax_id: '',
      quantity: '1',
    });
  };

  // ─── Fetch Item Code Options ─────────────────────────────
  const fetchItemCodeOptions = async () => {
    setLoadingItemCode(true);
    try {
      const response = await api.get('/item?page=1&limit=10');
      if (response.data && response.data.success === 1) {
        const items = response.data.data?.records || response.data.data || [];
        setItemCodeOptions(items);
      }
    } catch (err) {
      console.error('Error fetching item codes:', err);
    } finally {
      setLoadingItemCode(false);
    }
  };

  // ─── Handle Item Code Select ─────────────────────────────
  const handleItemCodeSelect = (item: Item) => {
    setSelectedItemCode(item);
    setItemCodeSearchTerm(`${item.item_code} - ${item.item_name}`);
    setShowItemCodeDropdown(false);
    
    // Pre-fill item details
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((row, idx) => {
        if (idx === 0) {
          return {
            ...row,
            itemId: item.id,
            itemCode: item.item_code,
            itemName: item.item_name,
            uom: item.stock_uom || 'NOS',
            rate: item.standard_rate || 0,
            orderRate: item.standard_rate || 0,
            hsn: item.hsn || '',
            taxId: item.tax_id ? String(item.tax_id) : prev.taxId,
          };
        }
        return row;
      })
    }));
  };

  // ─── Filtered Item Code Options ──────────────────────────
  const filteredItemCodeOptions = itemCodeOptions.filter(item =>
    item.item_code.toLowerCase().includes(itemCodeSearchTerm.toLowerCase()) ||
    item.item_name.toLowerCase().includes(itemCodeSearchTerm.toLowerCase())
  );

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

  // ─── Fetch all items from API (filtered by type=raw) ──────────────
  const fetchAllItems = async () => {
    setLoadingItems(true);
    try {
      const response = await api.get('/item?type=raw');
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

  const selectedSupplier = formData.supplier
    ? suppliers.find(s => s.supplier_name === formData.supplier)
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
            itemId: item.item_id || 0,
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
        setGrandTotalAdjustmentValue('0');
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
    
    // Apply group filter first
    if (itemGroupFilter !== 'all') {
      filtered = filtered.filter(item => item.item_group === itemGroupFilter);
    }
    
    // Apply search filter - search in multiple fields
    if (searchTerm && searchTerm.length >= 1) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.item_code.toLowerCase().includes(term) ||
        item.item_name.toLowerCase().includes(term) ||
        (item.item_group && item.item_group.toLowerCase().includes(term)) ||
        (item.description && item.description.toLowerCase().includes(term))
      );
    }
    
    setFilteredItems(prev => ({ ...prev, [index]: filtered }));
    setShowSuggestions(prev => ({ ...prev, [index]: filtered.length > 0 || searchTerm.trim().length > 0 }));
    
    if (inputRefs.current[index]) {
      updateDropdownPosition(index);
    }
  };

  // ─── Open the item dropdown ────────────────────────────────────────
  const openItemDropdown = (index: number) => {
    updateDropdownPosition(index);
    const currentItem = formData.items[index];

    // If a real item is already selected on this row, show the FULL list again
    // instead of filtering down to just that one selected item's code.
    if (currentItem.itemId) {
      filterItems(index, '');
    } else {
      const searchVal = searchTerms[index] || '';
      filterItems(index, searchVal);
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

    // Update the item code in form data immediately so you can see what you're typing
    const updatedItems = [...formData.items];
    updatedItems[index] = { 
      ...updatedItems[index], 
      itemCode: value 
    };
    setFormData(prev => ({ ...prev, items: updatedItems }));

    // If cleared, reset everything
    if (!value.trim()) {
      updatedItems[index] = {
        ...updatedItems[index],
        itemId: 0,
        itemName: '',
        uom: 'NOS',
        rate: 0,
        orderRate: 0,
        amount: 0,
        balanceQty: updatedItems[index].quantity,
        itemGroup: '',
        brand: '',
        description: '',
        hsn: '',
        taxId: '',
        taxRate: 0,
      };
      setFormData(prev => ({ ...prev, items: updatedItems }));
      setDigitValues(prev => ({
        ...prev,
        [index]: { quantity: prev[index]?.quantity || '1', rate: '0' }
      }));
      setShowSuggestions(prev => ({ ...prev, [index]: false }));
      // Reset filtered items to show all (respecting group filter)
      let filtered = allItems;
      if (itemGroupFilter !== 'all') {
        filtered = filtered.filter(item => item.item_group === itemGroupFilter);
      }
      setFilteredItems(prev => {
        const newFiltered = { ...prev };
        newFiltered[index] = filtered;
        return newFiltered;
      });
      return;
    }
    
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
      itemId: item.id,
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
    
    // Update digit values
    setDigitValues(prev => ({
      ...prev,
      [index]: {
        quantity: String(quantity),
        rate: String(rate)
      }
    }));
    
    // Update filtered items to show all items again (for next time)
    let filtered = allItems;
    if (itemGroupFilter !== 'all') {
      filtered = filtered.filter(i => i.item_group === itemGroupFilter);
    }
    setFilteredItems(prev => ({ ...prev, [index]: filtered }));
  };

  // ─── Handle clear item ──────────────────────────────────────────────
  const handleClearItem = (index: number) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      itemId: 0,
      itemCode: '',
      itemName: '',
      uom: 'NOS',
      rate: 0,
      orderRate: 0,
      amount: 0,
      balanceQty: updatedItems[index].quantity,
      itemGroup: '',
      brand: '',
      description: '',
      hsn: '',
      taxId: '',
      taxRate: 0,
    };
    setFormData(prev => ({ ...prev, items: updatedItems }));
    setSearchTerms(prev => ({ ...prev, [index]: '' }));
    setShowSuggestions(prev => ({ ...prev, [index]: false }));
    setDigitValues(prev => ({
      ...prev,
      [index]: { quantity: prev[index]?.quantity || '1', rate: '0' }
    }));
    // Reset filtered items to show all
    let filtered = allItems;
    if (itemGroupFilter !== 'all') {
      filtered = filtered.filter(item => item.item_group === itemGroupFilter);
    }
    setFilteredItems(prev => {
      const newFiltered = { ...prev };
      newFiltered[index] = filtered;
      return newFiltered;
    });
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
      if (
        itemCodeDropdownRef.current &&
        !itemCodeDropdownRef.current.contains(event.target as Node) &&
        itemCodeInputRef.current &&
        !itemCodeInputRef.current.contains(event.target as Node)
      ) {
        setShowItemCodeDropdown(false);
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
          fetchCustomers(),
          fetchItemCodeOptions()
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
      const searchTerm = searchTerms[index] || '';
      if (searchTerm) {
        filterItems(index, searchTerm);
      } else {
        // Show all items for this row (respecting group filter)
        let filtered = allItems;
        if (itemGroupFilter !== 'all') {
          filtered = filtered.filter(item => item.item_group === itemGroupFilter);
        }
        setFilteredItems(prev => ({ ...prev, [index]: filtered }));
      }
    });
  }, [itemGroupFilter, allItems]);

  // ─── Calculate totals ─────────────────────────────────────────────
  const calculateTotals = () => {
    const totalAmount = formData.items.reduce((sum, item) => sum + (item.orderRate || item.rate || 0) * item.quantity, 0);
    const taxAmount = formData.items.reduce((sum, item) => {
      const lineAmount = (item.orderRate || item.rate || 0) * item.quantity;
      const rate = (item.taxRate || 0) / 100;
      return sum + lineAmount * rate;
    }, 0);
    
    const adjustmentValue = grandTotalAdjustmentSign === 'positive' 
      ? parseFloat(grandTotalAdjustmentValue) || 0
      : -(parseFloat(grandTotalAdjustmentValue) || 0);
    
    const calculatedGrandTotal = totalAmount + taxAmount + adjustmentValue;
    
    return { totalAmount, taxAmount, grandTotal: calculatedGrandTotal, adjustmentValue };
  };

  const { totalAmount, taxAmount, grandTotal: calculatedGrandTotal, adjustmentValue } = calculateTotals();

  // ─── Handlers ──────────────────────────────────────────────────────
  const handleItemChange = (index: number, field: keyof PurchaseOrderItem, value: string | number) => {
    const updatedItems = [...formData.items];
    const previousItem = formData.items[index];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    if (field === 'itemCode') {
      const stringValue = (value as string) || '';
      // Don't call handleItemSearch here - it will be called from the input's onChange
      // Just update the item code in the form data
      updatedItems[index].itemCode = stringValue;
      
      // If the box is cleared, wipe the stale item details
      if (!stringValue.trim()) {
        updatedItems[index] = {
          ...updatedItems[index],
          itemId: 0,
          itemName: '',
          uom: 'NOS',
          rate: 0,
          orderRate: 0,
          amount: 0,
          itemGroup: '',
          brand: '',
          description: '',
          hsn: '',
          taxId: '',
          taxRate: 0,
          balanceQty: 0 - previousItem.receivedQty,
        };
        setDigitValues(prev => ({
          ...prev,
          [index]: { quantity: prev[index]?.quantity || String(previousItem.quantity), rate: '0' }
        }));
      }
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

  // ✅ FIXED: Handle Digit Input for Quantity - Now supports decimals
  const handleDigitQuantityChange = (index: number, value: string) => {
    setDigitValues(prev => ({
      ...prev,
      [index]: { ...prev[index], quantity: value }
    }));
    const numericValue = parseFloat(value) || 0; // ✅ Changed from parseInt to parseFloat
    if (numericValue >= 0) {
      handleItemChange(index, 'quantity', numericValue);
    }
  };

  // ✅ FIXED: Handle Digit Input for Rate - Already supports decimals
  const handleDigitRateChange = (index: number, value: string) => {
    setDigitValues(prev => ({
      ...prev,
      [index]: { ...prev[index], rate: value }
    }));
    const numericValue = parseFloat(value) || 0;
    if (numericValue >= 0) {
      handleItemChange(index, 'rate', numericValue);
    }
  };

  // ─── Handle Adjustment Change ─────────────────────────────────────
  const handleAdjustmentChange = (value: string) => {
    setGrandTotalAdjustmentValue(value);
  };

  const addItemRow = () => {
    const newId = String(formData.items.length + 1);
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { 
        id: newId, 
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
        taxId: prev.taxId, 
        taxRate: prev.taxRate 
      }]
    }));
    setDigitValues(prev => ({
      ...prev,
      [formData.items.length]: { quantity: '1', rate: '0' }
    }));
    let filtered = allItems;
    if (itemGroupFilter !== 'all') {
      filtered = filtered.filter(item => item.item_group === itemGroupFilter);
    }
    setFilteredItems(prev => ({ 
      ...prev, 
      [formData.items.length]: filtered 
    }));
  };

  const removeItemRow = (index: number) => {
    if (formData.items.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
    setDigitValues(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
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

  const getAllValidationErrors = (): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Title is no longer required - removed validation
    if (!formData.supplier.trim()) {
      errors.push({ field: 'supplier', label: 'Supplier', message: 'Supplier is required' });
    }
    if (!formData.orderDate) {
      errors.push({ field: 'orderDate', label: 'Order Date', message: 'Order date is required' });
    }
    // ✅ FIXED: Delivery Date validation - ONLY check for field error, don't show in popup
    // We check it but don't add to errors array - only visual red border will show
    const hasDeliveryDateError = !formData.deliveryDate;
    // Don't push to errors array - only use for visual validation
    
    // ✅ FIXED: Updated validation to work with decimal quantities
    if (formData.items.some(item => !item.itemCode.trim() || !item.itemName.trim() || item.quantity <= 0 || (item.orderRate || item.rate) <= 0)) {
      errors.push({ field: 'items', label: 'Items', message: 'All items must have code, name, quantity > 0 and rate > 0' });
    }

    return errors;
  };

  // ─── Submit Handler ────────────────────────────────────────────────
  const handleSubmit = async () => {
    setApiError(null);
    
    // ✅ FIXED: Check delivery date separately, don't add to validation errors
    const hasDeliveryDateError = !formData.deliveryDate;
    const validationErrorsList = getAllValidationErrors();
    
    if (validationErrorsList.length > 0 || hasDeliveryDateError) {
      // Show validation summary only for non-delivery date errors
      if (validationErrorsList.length > 0) {
        setValidationErrors(validationErrorsList);
        setShowValidationSummary(true);
      } else {
        setValidationErrors([]);
        setShowValidationSummary(false);
      }
      
      // Only scroll to the first error field (excluding deliveryDate)
      const firstError = validationErrorsList[0];
      if (firstError?.field === 'orderDate' && orderDateRef.current) {
        orderDateRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          const datePickerInput = orderDateRef.current?.querySelector('input');
          if (datePickerInput) {
            datePickerInput.focus();
          }
        }, 300);
      } else if (firstError?.field === 'supplier' && supplierInputRef.current) {
        supplierInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          supplierInputRef.current?.focus();
        }, 300);
      } else if (hasDeliveryDateError && deliveryDateRef.current) {
        // ✅ FIXED: Just scroll to delivery date field for visual red border
        deliveryDateRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          const datePickerInput = deliveryDateRef.current?.querySelector('input');
          if (datePickerInput) {
            datePickerInput.focus();
          }
        }, 300);
      }
      return;
    }

    setLoading(true);
    
    // ✅ FIXED: Calculate total quantity with decimals
    const totalQty = formData.items.reduce((sum, item) => sum + item.quantity, 0);
    const selectedSupplier = suppliers.find(s => s.supplier_name === formData.supplier);
    
    const taxAmountCalc = formData.items.reduce((sum, item) => {
      const lineAmount = (item.orderRate || item.rate || 0) * item.quantity;
      return sum + lineAmount * ((item.taxRate || 0) / 100);
    }, 0);
    const adjustmentValueNum = grandTotalAdjustmentSign === 'positive' 
      ? parseFloat(grandTotalAdjustmentValue) || 0
      : -(parseFloat(grandTotalAdjustmentValue) || 0);
    const grandTotalCalc = totalAmount + taxAmountCalc + adjustmentValueNum;
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
      rounding_adjustment: adjustmentValueNum,
      base_rounding_adjustment: adjustmentValueNum,
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
        item_id: item.itemId || 0,
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
        qty: item.quantity, // ✅ Decimal quantity preserved
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
        item_tax_id: String(item.taxId ?? 0),
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

  const hasErrors = getAllValidationErrors().length > 0 || !formData.deliveryDate;

  // ─── Render Add Supplier Popup ─────────────────────────────
  const renderAddSupplierPopup = () => {
    if (!showAddSupplierPopup) return null;

    const primaryColor = '#6366f1';

    return createPortal(
      <div 
        className="pof-modal-overlay" 
        onClick={() => setShowAddSupplierPopup(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
        }}
      >
        <div 
          className="pof-add-supplier-popup" 
          onClick={(e) => e.stopPropagation()}
          style={{
            background: theme === 'dark' ? '#1e1e2f' : '#ffffff',
            borderRadius: '12px',
            maxWidth: '700px',
            width: '95%',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}
        >
          <div 
            className="pof-modal-header" 
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: `2px solid ${primaryColor}`,
              flexShrink: 0,
            }}
          >
            <h2 style={{ 
              margin: 0, 
              fontSize: '18px', 
              fontWeight: 600,
              color: primaryColor,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaPlus style={{ color: primaryColor }} /> Add New Supplier
            </h2>
            <button 
              className="pof-modal-close" 
              onClick={() => setShowAddSupplierPopup(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: theme === 'dark' ? '#9ca3af' : '#6b7280',
              }}
            >
              ×
            </button>
          </div>
          <div className="pof-modal-body" style={{ 
            padding: '24px 20px',
            overflow: 'visible',
            maxHeight: 'calc(90vh - 140px)',
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              gap: '16px 20px',
            }}>
              <div className="pof-popup-field" style={{ marginBottom: '0' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: 500,
                  marginBottom: '4px',
                  color: theme === 'dark' ? '#e5e7eb' : '#374151'
                }}>
                  Supplier Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={newSupplier.supplier_name}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, supplier_name: e.target.value }))}
                  placeholder="Enter supplier name"
                  className="pof-form-field"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${theme === 'dark' ? '#3a3a4a' : '#d1d5db'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: theme === 'dark' ? '#2a2a3a' : '#ffffff',
                    color: theme === 'dark' ? '#e5e7eb' : '#111827',
                  }}
                />
              </div>
              <div className="pof-popup-field" style={{ marginBottom: '0' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: 500,
                  marginBottom: '4px',
                  color: theme === 'dark' ? '#e5e7eb' : '#374151'
                }}>
                  Supplier Type
                </label>
                <select
                  value={newSupplier.supplier_type}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, supplier_type: e.target.value }))}
                  className="pof-form-field"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${theme === 'dark' ? '#3a3a4a' : '#d1d5db'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: theme === 'dark' ? '#2a2a3a' : '#ffffff',
                    color: theme === 'dark' ? '#e5e7eb' : '#111827',
                  }}
                >
                  <option value="">Select type</option>
                  <option value="Individual">Individual</option>
                  <option value="Company">Company</option>
                  <option value="Partnership">Partnership</option>
                  <option value="LLP">LLP</option>
                  <option value="Trust">Trust</option>
                </select>
              </div>
              <div className="pof-popup-field" style={{ marginBottom: '0' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: 500,
                  marginBottom: '4px',
                  color: theme === 'dark' ? '#e5e7eb' : '#374151'
                }}>
                  Supplier Group
                </label>
                <input
                  type="text"
                  value={newSupplier.supplier_group}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, supplier_group: e.target.value }))}
                  placeholder="e.g. Local, International"
                  className="pof-form-field"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${theme === 'dark' ? '#3a3a4a' : '#d1d5db'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: theme === 'dark' ? '#2a2a3a' : '#ffffff',
                    color: theme === 'dark' ? '#e5e7eb' : '#111827',
                  }}
                />
              </div>
              <div className="pof-popup-field" style={{ marginBottom: '0' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: 500,
                  marginBottom: '4px',
                }}>
                  Country
                </label>
                <select
                  value={newSupplier.country}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, country: e.target.value }))}
                  className="pof-form-field"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${theme === 'dark' ? '#3a3a4a' : '#d1d5db'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: theme === 'dark' ? '#2a2a3a' : '#ffffff',
                    color: theme === 'dark' ? '#e5e7eb' : '#111827',
                  }}
                >
                  <option value="India">India</option>
                  <option value="UK">UK</option>
                  <option value="USA">USA</option>
                  <option value="Australia">Australia</option>
                  <option value="Canada">Canada</option>
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
                  <option value="Japan">Japan</option>
                  <option value="China">China</option>
                  <option value="UAE">UAE</option>
                  <option value="Singapore">Singapore</option>
                </select>
              </div>
              <div className="pof-popup-field" style={{ marginBottom: '0' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: 500,
                  marginBottom: '4px',
                  color: theme === 'dark' ? '#e5e7eb' : '#374151'
                }}>
                  Email <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  value={newSupplier.email_id}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, email_id: e.target.value }))}
                  placeholder="Enter email address"
                  className="pof-form-field"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${theme === 'dark' ? '#3a3a4a' : '#d1d5db'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: theme === 'dark' ? '#2a2a3a' : '#ffffff',
                    color: theme === 'dark' ? '#e5e7eb' : '#111827',
                  }}
                />
              </div>
              <div className="pof-popup-field" style={{ marginBottom: '0' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: 500,
                  marginBottom: '4px',
                  color: theme === 'dark' ? '#e5e7eb' : '#374151'
                }}>
                  Phone <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="tel"
                  value={newSupplier.mobile_no}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, mobile_no: e.target.value }))}
                  placeholder="Enter phone number"
                  className="pof-form-field"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${theme === 'dark' ? '#3a3a4a' : '#d1d5db'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: theme === 'dark' ? '#2a2a3a' : '#ffffff',
                    color: theme === 'dark' ? '#e5e7eb' : '#111827',
                  }}
                />
              </div>
              <div className="pof-popup-field" style={{ marginBottom: '0', gridColumn: '1 / -1' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: 500,
                  marginBottom: '4px',
                  color: theme === 'dark' ? '#e5e7eb' : '#374151'
                }}>
                  Address
                </label>
                <textarea
                  value={newSupplier.primary_address}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, primary_address: e.target.value }))}
                  placeholder="Enter address"
                  className="pof-form-field pof-textarea"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${theme === 'dark' ? '#3a3a4a' : '#d1d5db'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: theme === 'dark' ? '#2a2a3a' : '#ffffff',
                    color: theme === 'dark' ? '#e5e7eb' : '#111827',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
          </div>
          <div 
            className="pof-modal-footer" 
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              padding: '16px 20px',
              borderTop: `1px solid ${theme === 'dark' ? '#2a2a3a' : '#f3f4f6'}`,
              flexShrink: 0,
            }}
          >
            <button 
              className="pof-btn-cancel" 
              onClick={() => setShowAddSupplierPopup(false)}
              disabled={addingSupplier}
              style={{
                padding: '8px 20px',
                borderRadius: '6px',
                border: `1px solid ${theme === 'dark' ? '#3a3a4a' : '#d1d5db'}`,
                background: 'transparent',
                color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'background 0.15s',
              }}
            >
              Cancel
            </button>
            <button 
              className="pof-btn-submit" 
              onClick={handleAddNewSupplier}
              disabled={addingSupplier}
              style={{
                padding: '8px 20px',
                borderRadius: '6px',
                border: 'none',
                background: primaryColor,
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background 0.15s',
              }}
            >
              {addingSupplier && <FaSpinner className="pof-spinning" />}
              <FaPlus size={12} />
              Create Supplier
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // ─── Render Add Item Popup (HSN removed) ────────────────────────
  const renderAddItemPopup = () => {
    if (!showAddItemPopup) return null;

    const primaryColor = '#6366f1';

    return createPortal(
      <div 
        className="pof-modal-overlay" 
        onClick={() => setShowAddItemPopup(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
        }}
      >
        <div 
          className="pof-add-item-popup" 
          onClick={(e) => e.stopPropagation()}
          style={{
            background: theme === 'dark' ? '#1e1e2f' : '#ffffff',
            borderRadius: '12px',
            maxWidth: '800px',
            width: '95%',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}
        >
          <div 
            className="pof-modal-header" 
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: `2px solid ${primaryColor}`,
              flexShrink: 0,
            }}
          >
            <h2 style={{ 
              margin: 0, 
              fontSize: '18px', 
              fontWeight: 600,
              color: primaryColor,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaPlus style={{ color: primaryColor }} /> Add New Item
            </h2>
            <button 
              className="pof-modal-close" 
              onClick={() => setShowAddItemPopup(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: theme === 'dark' ? '#9ca3af' : '#6b7280',
              }}
            >
              ×
            </button>
          </div>
          <div className="pof-modal-body" style={{ 
            padding: '24px 20px',
            overflow: 'visible',
            maxHeight: 'calc(90vh - 140px)',
          }}>
            <p className="pof-modal-subtitle" style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>
              Fill in the item details below. Fields marked with <span style={{ color: '#ef4444' }}>*</span> are required.
            </p>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              gap: '16px 20px',
            }}>
              {/* Item Name - Required */}
              <div className="pof-popup-field" style={{ marginBottom: '0', gridColumn: '1 / -1' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: 500,
                  marginBottom: '4px',
                  color: theme === 'dark' ? '#e5e7eb' : '#374151'
                }}>
                  Item Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={newItem.item_name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, item_name: e.target.value }))}
                  placeholder="e.g. Cotton Yarn 40s"
                  className="pof-form-field"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${theme === 'dark' ? '#3a3a4a' : '#d1d5db'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: theme === 'dark' ? '#2a2a3a' : '#ffffff',
                    color: theme === 'dark' ? '#e5e7eb' : '#111827',
                  }}
                />
                <span style={{ fontSize: '11px', color: '#6b7280' }}>Alphabets, digits, and spaces are allowed</span>
              </div>

              {/* Item Code - Optional */}
              <div className="pof-popup-field" style={{ marginBottom: '0' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: 500,
                  marginBottom: '4px',
                  color: theme === 'dark' ? '#e5e7eb' : '#374151'
                }}>
                  Item Code
                </label>
                <input
                  type="text"
                  value={newItem.item_code}
                  onChange={(e) => setNewItem(prev => ({ ...prev, item_code: e.target.value.toUpperCase().replace(/[^a-zA-Z0-9\-]/g, "") }))}
                  placeholder="Auto-generated if left empty"
                  className="pof-form-field"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${theme === 'dark' ? '#3a3a4a' : '#d1d5db'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: theme === 'dark' ? '#2a2a3a' : '#ffffff',
                    color: theme === 'dark' ? '#e5e7eb' : '#111827',
                  }}
                />
                <span style={{ fontSize: '11px', color: '#6b7280' }}>Alphabets, digits, and hyphens are allowed. Auto-generated from name if empty.</span>
              </div>

              {/* Item Group - Required */}
              <div className="pof-popup-field" style={{ marginBottom: '0' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: 500,
                  marginBottom: '4px',
                  color: theme === 'dark' ? '#e5e7eb' : '#374151'
                }}>
                  Item Group <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={newItem.item_group}
                  onChange={(e) => setNewItem(prev => ({ ...prev, item_group: e.target.value }))}
                  placeholder="e.g. Raw Material, Finished Goods"
                  className="pof-form-field"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${theme === 'dark' ? '#3a3a4a' : '#d1d5db'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: theme === 'dark' ? '#2a2a3a' : '#ffffff',
                    color: theme === 'dark' ? '#e5e7eb' : '#111827',
                  }}
                />
                <span style={{ fontSize: '11px', color: '#6b7280' }}>Only alphabets and spaces are allowed</span>
              </div>

              {/* Default UOM - Required */}
              <div className="pof-popup-field" style={{ marginBottom: '0' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: 500,
                  marginBottom: '4px',
                  color: theme === 'dark' ? '#e5e7eb' : '#374151'
                }}>
                  Default UOM <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={newItem.stock_uom}
                  onChange={(e) => setNewItem(prev => ({ ...prev, stock_uom: e.target.value }))}
                  placeholder="e.g. NOS, Kg, Meter"
                  className="pof-form-field"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${theme === 'dark' ? '#3a3a4a' : '#d1d5db'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: theme === 'dark' ? '#2a2a3a' : '#ffffff',
                    color: theme === 'dark' ? '#e5e7eb' : '#111827',
                  }}
                />
                <span style={{ fontSize: '11px', color: '#6b7280' }}>Alphabets, digits, and spaces are allowed</span>
              </div>

              {/* Tax - Optional */}
              <div className="pof-popup-field" style={{ marginBottom: '0' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: 500,
                  marginBottom: '4px',
                  color: theme === 'dark' ? '#e5e7eb' : '#374151'
                }}>
                  Tax
                </label>
                <select
                  value={newItem.tax_id}
                  onChange={(e) => setNewItem(prev => ({ ...prev, tax_id: e.target.value }))}
                  className="pof-form-field"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${theme === 'dark' ? '#3a3a4a' : '#d1d5db'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: theme === 'dark' ? '#2a2a3a' : '#ffffff',
                    color: theme === 'dark' ? '#e5e7eb' : '#111827',
                  }}
                >
                  <option value="">Default Tax</option>
                  {taxOptions.map(tax => {
                    const { rate, category } = extractTaxInfo(tax.tax_type);
                    return (
                      <option key={tax.tax_id} value={String(tax.tax_id)}>
                        {category} {rate}%
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Quantity - NEW FIELD */}
              <div className="pof-popup-field" style={{ marginBottom: '0' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: 500,
                  marginBottom: '4px',
                  color: theme === 'dark' ? '#e5e7eb' : '#374151'
                }}>
                  Quantity <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*[.]?[0-9]*"
                  value={newItem.quantity}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, "");
                    setNewItem(prev => ({ ...prev, quantity: val }));
                  }}
                  placeholder="1"
                  className="pof-form-field"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${theme === 'dark' ? '#3a3a4a' : '#d1d5db'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: theme === 'dark' ? '#2a2a3a' : '#ffffff',
                    color: theme === 'dark' ? '#e5e7eb' : '#111827',
                  }}
                />
                <span style={{ fontSize: '11px', color: '#6b7280' }}>Quantity for this purchase order line item</span>
              </div>

              {/* Pricing - Two columns */}
              <div className="pof-popup-field" style={{ marginBottom: '0' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: 500,
                  marginBottom: '4px',
                  color: theme === 'dark' ? '#e5e7eb' : '#374151'
                }}>
                  Purchase Rate (base price)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*[.]?[0-9]*"
                  value={newItem.standard_rate}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, "");
                    setNewItem(prev => ({ ...prev, standard_rate: val }));
                  }}
                  placeholder="0.00"
                  className="pof-form-field"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${theme === 'dark' ? '#3a3a4a' : '#d1d5db'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: theme === 'dark' ? '#2a2a3a' : '#ffffff',
                    color: theme === 'dark' ? '#e5e7eb' : '#111827',
                  }}
                />
                <span style={{ fontSize: '11px', color: '#6b7280' }}>The cost at which you purchase this item.</span>
              </div>

              <div className="pof-popup-field" style={{ marginBottom: '0' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: 500,
                  marginBottom: '4px',
                  color: theme === 'dark' ? '#e5e7eb' : '#374151'
                }}>
                  Valuation Rate
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*[.]?[0-9]*"
                  value={newItem.valuation_rate}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, "");
                    setNewItem(prev => ({ ...prev, valuation_rate: val }));
                  }}
                  placeholder="0.00"
                  className="pof-form-field"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${theme === 'dark' ? '#3a3a4a' : '#d1d5db'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: theme === 'dark' ? '#2a2a3a' : '#ffffff',
                    color: theme === 'dark' ? '#e5e7eb' : '#111827',
                  }}
                />
                <span style={{ fontSize: '11px', color: '#6b7280' }}>The rate at which this item is valued. Used as Price Before Tax.</span>
              </div>

              {/* Description - Optional */}
              <div className="pof-popup-field" style={{ marginBottom: '0', gridColumn: '1 / -1' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: 500,
                  marginBottom: '4px',
                  color: theme === 'dark' ? '#e5e7eb' : '#374151'
                }}>
                  Description
                </label>
                <input
                  type="text"
                  value={newItem.description}
                  onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Item description"
                  className="pof-form-field"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${theme === 'dark' ? '#3a3a4a' : '#d1d5db'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: theme === 'dark' ? '#2a2a3a' : '#ffffff',
                    color: theme === 'dark' ? '#e5e7eb' : '#111827',
                  }}
                />
              </div>
            </div>
          </div>
          <div 
            className="pof-modal-footer" 
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              padding: '16px 20px',
              borderTop: `1px solid ${theme === 'dark' ? '#2a2a3a' : '#f3f4f6'}`,
              flexShrink: 0,
            }}
          >
            <button 
              className="pof-btn-cancel" 
              onClick={() => setShowAddItemPopup(false)}
              disabled={addingItem}
              style={{
                padding: '8px 20px',
                borderRadius: '6px',
                border: `1px solid ${theme === 'dark' ? '#3a3a4a' : '#d1d5db'}`,
                background: 'transparent',
                color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'background 0.15s',
              }}
            >
              Clear
            </button>
            <button 
              className="pof-btn-submit" 
              onClick={handleAddNewItem}
              disabled={addingItem}
              style={{
                padding: '8px 20px',
                borderRadius: '6px',
                border: 'none',
                background: primaryColor,
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background 0.15s',
              }}
            >
              {addingItem && <FaSpinner className="pof-spinning" />}
              <FaPlus size={12} />
              Add Item
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // ─── Render Supplier Dropdown with PINNED "+ Add New Supplier" ──
  const renderSupplierDropdown = () => {
    if (!showSupplierDropdown) return null;

    const primaryColor = '#6366f1';

    return (
      <div 
        ref={supplierDropdownRef} 
        className="pof-supplier-dropdown"
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          maxHeight: '260px',
          display: 'flex',
          flexDirection: 'column',
          background: theme === 'dark' ? '#1e1e2f' : '#ffffff',
          border: `1px solid ${theme === 'dark' ? '#3a3a4a' : '#d1d5db'}`,
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 100,
          marginTop: '4px',
          overflow: 'hidden',
        }}
      >
        {/* ─── Scrollable supplier list ─── */}
        <div
          className="pof-supplier-dropdown-list"
          style={{
            overflowY: 'auto',
            flex: '1 1 auto',
            minHeight: 0,
          }}
        >
          {filteredSuppliers.length > 0 ? (
            filteredSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="pof-supplier-item"
                onClick={() => handleSupplierSelect(supplier)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderBottom: `1px solid ${theme === 'dark' ? '#2a2a3a' : '#f3f4f6'}`,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme === 'dark' ? '#2a2a3a' : '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div className="pof-supplier-item-name" style={{ fontWeight: 500, fontSize: '13px', color: theme === 'dark' ? '#e5e7eb' : '#111827' }}>
                  <FaBuilding className="pof-supplier-item-icon" size={12} style={{ marginRight: '6px' }} />
                  {supplier.supplier_name}
                </div>
                <div className="pof-supplier-item-details" style={{ fontSize: '11px', color: theme === 'dark' ? '#6b7280' : '#9ca3af', marginTop: '2px' }}>
                  {supplier.supplier_type && <span>{supplier.supplier_type}</span>}
                  {supplier.mobile_no && <span style={{ marginLeft: '8px' }}><FaPhone size={10} /> {supplier.mobile_no}</span>}
                  {supplier.email_id && <span style={{ marginLeft: '8px' }}><FaEnvelope size={10} /> {supplier.email_id}</span>}
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '16px 12px', textAlign: 'center', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
              <FaInfoCircle size={14} style={{ marginBottom: '4px' }} />
              <div style={{ fontSize: '13px' }}>No suppliers found</div>
            </div>
          )}
        </div>

        {/* ─── PINNED "+ Add New Supplier" footer ─── */}
        <div 
          className="pof-supplier-dropdown-footer" 
          style={{
            padding: '8px 12px',
            borderTop: `1px solid ${theme === 'dark' ? '#2a2a3a' : '#f3f4f6'}`,
            display: 'flex',
            justifyContent: 'center',
            background: theme === 'dark' ? '#1a1a2e' : '#fafafa',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            className="pof-add-new-dropdown-btn"
            onClick={() => {
              setShowSupplierDropdown(false);
              setShowAddSupplierPopup(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              border: `1.5px dashed ${primaryColor}`,
              borderRadius: '6px',
              color: primaryColor,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              padding: '6px 16px',
              transition: 'all 0.15s',
              width: '100%',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${primaryColor}15`;
              e.currentTarget.style.borderStyle = 'solid';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderStyle = 'dashed';
            }}
          >
            <FaPlus size={12} style={{ color: primaryColor }} />
            Add New Supplier
          </button>
        </div>
      </div>
    );
  };

  // ─── Render Item Code Dropdown ──────────────────────────────
  const renderItemCodeDropdown = () => {
    if (!showItemCodeDropdown) return null;

    const primaryColor = '#6366f1';

    return (
      <div 
        ref={itemCodeDropdownRef}
        className="pof-item-code-dropdown"
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          maxHeight: '260px',
          display: 'flex',
          flexDirection: 'column',
          background: theme === 'dark' ? '#1e1e2f' : '#ffffff',
          border: `1px solid ${theme === 'dark' ? '#3a3a4a' : '#d1d5db'}`,
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 100,
          marginTop: '4px',
          overflow: 'hidden',
        }}
      >
        {/* ─── Scrollable item list ─── */}
        <div
          className="pof-item-code-dropdown-list"
          style={{
            overflowY: 'auto',
            flex: '1 1 auto',
            minHeight: 0,
          }}
        >
          {loadingItemCode ? (
            <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>
              <FaSpinner className="pof-spinning" size={14} /> Loading items...
            </div>
          ) : filteredItemCodeOptions.length > 0 ? (
            filteredItemCodeOptions.map((item) => (
              <div
                key={item.id}
                className="pof-item-code-item"
                onClick={() => handleItemCodeSelect(item)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderBottom: `1px solid ${theme === 'dark' ? '#2a2a3a' : '#f3f4f6'}`,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme === 'dark' ? '#2a2a3a' : '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ fontWeight: 500, fontSize: '13px', color: theme === 'dark' ? '#e5e7eb' : '#111827' }}>
                  {item.item_code}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {item.item_name}
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                  {item.item_group} • {item.stock_uom}
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '16px 12px', textAlign: 'center', color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
              <FaInfoCircle size={14} style={{ marginBottom: '4px' }} />
              <div style={{ fontSize: '13px' }}>No items found</div>
            </div>
          )}
        </div>

        {/* ─── PINNED "+ Add New Item" footer ─── */}
        <div 
          className="pof-item-code-dropdown-footer" 
          style={{
            padding: '8px 12px',
            borderTop: `1px solid ${theme === 'dark' ? '#2a2a3a' : '#f3f4f6'}`,
            display: 'flex',
            justifyContent: 'center',
            background: theme === 'dark' ? '#1a1a2e' : '#fafafa',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            className="pof-add-new-dropdown-btn"
            onClick={() => {
              setShowItemCodeDropdown(false);
              setPendingItemSearch(itemCodeSearchTerm);
              setActiveRowIndex(0);
              setNewItem(prev => ({ ...prev, item_name: itemCodeSearchTerm }));
              setShowAddItemPopup(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              border: `1.5px dashed ${primaryColor}`,
              borderRadius: '6px',
              color: primaryColor,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              padding: '6px 16px',
              transition: 'all 0.15s',
              width: '100%',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${primaryColor}15`;
              e.currentTarget.style.borderStyle = 'solid';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderStyle = 'dashed';
            }}
          >
            <FaPlus size={12} style={{ color: primaryColor }} />
            Add New Item
          </button>
        </div>
      </div>
    );
  };

  // ─── Render item search suggestions with "+ Add New Item" ──────────────
  const renderItemSearchSuggestions = (index: number) => {
    const items = filteredItems[index] || [];
    const searchTerm = searchTerms[index] || '';
    const trimmedSearch = searchTerm.trim();
    
    // Check if search term matches any item exactly
    const isExactMatch = items.some(item => 
      item.item_code.toLowerCase() === trimmedSearch.toLowerCase() ||
      item.item_name.toLowerCase() === trimmedSearch.toLowerCase()
    );
    
    // Show dropdown if there are items OR there's a search term (for "Add New" button)
    const showDropdown = showSuggestions[index] || trimmedSearch.length > 0;
    
    if (!showDropdown) return null;

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
          maxHeight: '280px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 9999,
          background: theme === 'dark' ? '#1e1e2f' : '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          border: `1px solid ${theme === 'dark' ? '#3a3a4a' : '#e5e7eb'}`,
        }}
      >
        {/* Scrollable items list */}
        <div style={{ 
          overflowY: 'auto', 
          flex: '1 1 auto',
          maxHeight: '200px',
        }}>
          {loadingItems ? (
            <div className="pof-suggestions-loading" style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>
              <FaSpinner className="pof-spinning" size={14} /> Loading items...
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
              No items found
            </div>
          ) : (
            items.map((suggestion) => (
              <div
                key={suggestion.id}
                className="pof-suggestion-item"
                onClick={() => handleSelectItem(index, suggestion)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderBottom: `1px solid ${theme === 'dark' ? '#2a2a3a' : '#f3f4f6'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme === 'dark' ? '#2a2a3a' : '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div>
                  <div className="pof-suggestion-code" style={{ fontWeight: 500, fontSize: '13px', color: theme === 'dark' ? '#e5e7eb' : '#111827' }}>
                    {suggestion.item_code}
                  </div>
                  <div className="pof-suggestion-name" style={{ fontSize: '12px', color: '#6b7280' }}>
                    {suggestion.item_name}
                  </div>
                  {suggestion.hsn && (
                    <div className="pof-suggestion-hsn" style={{ fontSize: '10px', color: '#9ca3af' }}>HSN: {suggestion.hsn}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="pof-suggestion-rate" style={{ fontSize: '13px', fontWeight: 500, color: '#6366f1' }}>
                    {formData.currency} {(suggestion.standard_rate || suggestion.valuation_rate || 0).toFixed(2)}
                  </div>
                  <div className="pof-suggestion-uom" style={{ fontSize: '10px', color: '#9ca3af' }}>
                    UOM: {suggestion.stock_uom || 'NOS'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ─── Sticky "Add New" button at the bottom ─── */}
        {!loadingItems && (
          <div 
            className="pof-suggestion-item pof-add-new-suggestion"
            onClick={() => {
              const searchVal = trimmedSearch || 'New Item';
              setPendingItemSearch(searchVal);
              setActiveRowIndex(index);
              setNewItem(prev => ({ ...prev, item_name: searchVal }));
              setShowAddItemPopup(true);
              setShowSuggestions(prev => ({ ...prev, [index]: false }));
            }}
            style={{
              flexShrink: 0,
              borderTop: `1px solid ${theme === 'dark' ? '#3a3a4a' : '#e5e7eb'}`,
              background: theme === 'dark' ? '#1e1e2f' : '#f8fafc',
              cursor: 'pointer',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#6366f1',
              fontWeight: 500,
              fontSize: '13px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme === 'dark' ? '#2a2a3a' : '#eef2ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme === 'dark' ? '#1e1e2f' : '#f8fafc';
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: '#6366f1',
                color: '#fff',
                flexShrink: 0,
              }}
            >
              <FaPlus size={10} />
            </span>
            {trimmedSearch ? `Add "${trimmedSearch}" as New Item` : 'Add New Item'}
          </div>
        )}
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

        {/* ─── Add Supplier Popup ──────────────────────────────────── */}
        {renderAddSupplierPopup()}

        {/* ─── Add Item Popup ──────────────────────────────────────── */}
        {renderAddItemPopup()}

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
              {getAllValidationErrors().length + (formData.deliveryDate ? 0 : 1)} missing field{getAllValidationErrors().length + (formData.deliveryDate ? 0 : 1) !== 1 ? 's' : ''}
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
                        <div className="pof-supplier-wrapper" style={{ position: 'relative' }}>
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
                          
                          {/* ─── Supplier Dropdown with PINNED "+ Add New" ─── */}
                          {renderSupplierDropdown()}
                          
                          {!loadingSuppliers && suppliers.length === 0 && !showSupplierDropdown && (
                            <span className="pof-warning-msg">
                              <FaExclamationCircle size={10} /> No suppliers found. Click "Add New Supplier" to create one.
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
                        <label>Title</label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          className="pof-form-field"
                          placeholder="Enter PO title (optional)"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pof-info-row">
                    <div className="pof-info-field" style={{ display: 'none' }}>
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
                    <div className="pof-info-field" ref={orderDateRef}>
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
                    <div className="pof-info-field" ref={deliveryDateRef}>
                      <label>Delivery Date <span className="pof-required">*</span></label>
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
                          className={`pof-form-field ${!formData.deliveryDate ? 'pof-field-error' : ''}`}
                          placeholderText="Select delivery date"
                          minDate={startDate || new Date()}
                          showMonthDropdown
                          showYearDropdown
                          dropdownMode="select"
                          isClearable
                        />
                        <FaCalendarAlt className="pof-calendar-icon" />
                      </div>
                      {!formData.deliveryDate && (
                        <span className="pof-error-msg">
                          <FaExclamationCircle size={10} />Delivery date is required
                        </span>
                      )}
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

                  {/* ─── Item Code Dropdown ─────────────────── */}
                  <div className="pof-info-row" style={{ marginTop: '12px' }}>
                    <div className="pof-info-field" style={{ gridColumn: '1 / -1' }}>
                      <label>Search Item Code</label>
                      <div className="pof-supplier-wrapper" style={{ position: 'relative' }}>
                        <input
                          ref={itemCodeInputRef}
                          type="text"
                          value={itemCodeSearchTerm}
                          onChange={(e) => {
                            setItemCodeSearchTerm(e.target.value);
                            setShowItemCodeDropdown(true);
                            setSelectedItemCode(null);
                          }}
                          onFocus={() => {
                            setShowItemCodeDropdown(true);
                            fetchItemCodeOptions();
                          }}
                          className="pof-form-field"
                          placeholder="Search item by code or name..."
                          autoComplete="off"
                        />
                        {loadingItemCode && <FaSpinner className="pof-supplier-spinner pof-spinning" size={14} />}
                        
                        {/* ─── Item Code Dropdown ─── */}
                        {renderItemCodeDropdown()}
                      </div>
                      {selectedItemCode && (
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#16a34a', 
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <FaCheckCircle size={10} />
                          Selected: {selectedItemCode.item_code} - {selectedItemCode.item_name}
                        </div>
                      )}
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
                      <th className="pof-ith">Rate <span className="pof-required">*</span></th>
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
                              onChange={(e) => {
                                const value = e.target.value;
                                // Directly update the item code so you can see what you type
                                handleItemSearch(index, value);
                              }}
                              placeholder="Search by item code or name"
                              onFocus={() => openItemDropdown(index)}
                              onClick={() => openItemDropdown(index)}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  setShowSuggestions(prev => ({ ...prev, [index]: false }));
                                }
                                if (e.key === 'Backspace' && !e.currentTarget.value) {
                                  handleClearItem(index);
                                }
                              }}
                            />
                            {loadingItems && (
                              <FaSpinner className="pof-spinning pof-search-spinner" size={14} />
                            )}
                            {item.itemCode && !loadingItems && (
                              <button 
                                className="pof-clear-item-btn"
                                onClick={() => handleClearItem(index)}
                                type="button"
                                title="Clear item"
                              >
                                <FaTimesCircle size={14} />
                              </button>
                            )}
                            {!item.itemCode && !loadingItems && (
                              <FaSearch className="pof-search-icon" size={14} />
                            )}
                            
                            {/* ─── Item Search Suggestions with "+ Add New Item" ─── */}
                            {renderItemSearchSuggestions(index)}
                          </div>
                        </td>
                        <td className="pof-itd">
                          <input
                            className="pof-cell-input"
                            type="text"
                            value={item.itemName}
                            onChange={(e) => {
                              const updatedItems = [...formData.items];
                              updatedItems[index] = { ...updatedItems[index], itemName: e.target.value };
                              setFormData(prev => ({ ...prev, items: updatedItems }));
                            }}
                            placeholder="Name"
                          />
                        </td>
                        <td className="pof-itd">
                          <input
                            className="pof-cell-input"
                            type="text"
                            value={item.hsn || ''}
                            onChange={(e) => {
                              const updatedItems = [...formData.items];
                              updatedItems[index] = { ...updatedItems[index], hsn: e.target.value };
                              setFormData(prev => ({ ...prev, items: updatedItems }));
                            }}
                            placeholder="HSN"
                          />
                        </td>
                        <td className="pof-itd">
                          {/* ✅ FIXED: Quantity input now allows decimals */}
                          <DigitInput
                            value={digitValues[index]?.quantity || String(item.quantity)}
                            onChange={(val) => handleDigitQuantityChange(index, val)}
                            placeholder="Qty"
                            maxLength={10}
                            className="pof-digit-input"
                            allowDecimal={true} // ✅ Added this to allow decimals
                            min={0}
                          />
                        </td>
                        <td className="pof-itd">
                          <span className="pof-uom-display">
                            {item.uom || 'NOS'}
                          </span>
                        </td>
                        <td className="pof-itd">
                          {/* ✅ Rate input already supports decimals */}
                          <DigitInput
                            value={digitValues[index]?.rate || String(item.rate)}
                            onChange={(val) => handleDigitRateChange(index, val)}
                            placeholder="Rate"
                            maxLength={15}
                            className="pof-digit-input pof-rate-input"
                            allowDecimal={true}
                            min={0}
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
                          <DigitInput
                            value={grandTotalAdjustmentValue}
                            onChange={handleAdjustmentChange}
                            placeholder="0.00"
                            maxLength={15}
                            className="pof-adjustment-digit-input"
                            allowDecimal={true}
                            min={0}
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