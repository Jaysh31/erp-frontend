// GRNForm.tsx - Service/Customer + Supplier/Manual item entry + GST billing + Print + Success modal
// Status is always set to "submitted" - removed from UI
import { useState, useEffect, type FormEvent, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getUserRole } from '../utils/storage';
import {
  FaArrowLeft,
  FaSave,
  FaSpinner,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimesCircle,
  FaCheckCircle,
  FaPlus,
  FaTrash,
  FaWarehouse,
  FaFileInvoice,
  FaBox,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaUserCircle,
  FaUsers,
  FaPercentage,
  
  FaReceipt,
  FaSearch,
  FaPrint,
  FaMoneyBillWave,
  FaGlobeAsia,
  FaBuilding,
} from 'react-icons/fa';
import "./GRNForm.css";
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import api from '../services/api';

// ─── DigitInput Component ──────────────────────────────────────────────
interface DigitInputProps {
  label?: string;
  value: number | string;
  onChange: (value: number) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  min?: number;
  max?: number;
}

const DigitInput: React.FC<DigitInputProps> = ({
  label,
  value,
  onChange,
  placeholder = "Enter number",
  maxLength = 10,
  disabled = false,
  className = "",
  required = false,
  min,
  max,
}) => {
  const [displayValue, setDisplayValue] = useState<string>(String(value || ''));

  useEffect(() => {
    setDisplayValue(String(value || ''));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      setDisplayValue('');
      onChange(0);
      return;
    }
    const digits = raw.replace(/[^0-9]/g, '');
    if (digits.length <= maxLength) {
      setDisplayValue(digits);
      const numValue = parseInt(digits, 10);
      if (!isNaN(numValue)) {
        if (min !== undefined && numValue < min) {
          onChange(min);
          setDisplayValue(String(min));
          return;
        }
        if (max !== undefined && numValue > max) {
          onChange(max);
          setDisplayValue(String(max));
          return;
        }
        onChange(numValue);
      }
    }
  };

  const handleBlur = () => {
    if (displayValue === '') {
      onChange(0);
      setDisplayValue('0');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
    }
  };

  return (
    <div className={`digit-input-wrapper ${className}`}>
      {label && <label className="digit-input-label">{label}{required && <span className="grnf-required">*</span>}</label>}
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        className={`digit-input ${disabled ? 'digit-input-disabled' : ''}`}
      />
    </div>
  );
};

// ─── Entry Mode ─────────────────────────────────────────────────────────
type EntryMode = 'supplier' | 'manual';

interface GRNItem {
  id: string;
  itemCode: string;
  itemName: string;
  orderedQty: number;
  receivedQty: number;
  rejectedQty: number;
  uom: string;
  rate: number;
  remarks: string;
  poItemId?: number;
  itemId?: number;
  taxId?: number;
  taxType?: string;
  taxRate?: number;
  hsn?: string;
  isDraft?: boolean;
}

interface ValidationError {
  field: string;
  label: string;
  message: string;
}

interface GRNData {
  id?: string;
  grn_number: string;
  grnDate: string;
  isService: boolean;
  entryMode: EntryMode;
  supplier: string;
  supplierId?: number;
  purchaseOrder: string;
  purchaseOrderId?: number;
  warehouse: string;
  warehouseId?: number;
  customer: string;
  customerId?: number;
  receivedBy: string;
  receivedById?: number;
  vehicleNo: string;
  deliveryChallanNo: string;
  invoiceNo: string;
  freeDelivery: boolean;
  deliveryCharge: number;
  items: GRNItem[];
}

interface PurchaseOrder {
  id: number;
  name: string;
  supplier_name: string;
  supplier: string;
  company: string;
  transaction_date: string;
  schedule_date: string;
  currency: string;
  total_qty: number;
  total: number;
  net_total: number;
  grand_total: number;
  rounded_total: number;
  status: string;
  per_received: number;
  per_billed: number;
  title?: string;
}

interface PurchaseOrderDetail extends PurchaseOrder {
  items: POItem[];
  terms?: string;
  address_display?: string;
  contact_display?: string;
  contact_mobile?: string;
  contact_email?: string;
  cost_center?: string;
  set_warehouse?: string;
  tax_category?: string;
  shipping_rule?: string;
  incoterm?: string;
  named_place?: string;
  payment_terms_template?: string;
  tc_name?: string;
  conversion_rate?: number;
  price_list_currency?: string;
  plc_conversion_rate?: number;
  supplier_id?: number;
}

interface POItem {
  id: number;
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
  amount: number;
  received_qty: number;
  returned_qty: number;
  billed_amt: number;
  warehouse?: string;
  expense_account?: string;
  weight_per_unit?: number;
  weight_uom?: string;
  item_tax_rate?: number;
  item_tax_template?: string;
  cost_center?: string;
  hsn?: string;
  tax_id?: number;
  tax_type?: string;
}

interface POApiResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: PurchaseOrder[];
  };
}

interface PODetailApiResponse {
  success: number;
  data: PurchaseOrderDetail;
}

interface Warehouse {
  id: number;
  warehouse_name: string;
  company: string;
  parent_warehouse: string | null;
  warehouse_type: string | null;
  city: string | null;
  state: string | null;
  email_id: string | null;
  phone_no: string | null;
  disabled: number;
}

interface WarehouseApiResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: Warehouse[];
  };
}

interface Employee {
  id: number;
  employee_name: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  designation: string;
  department: string;
  company_email: string;
  cell_number: string;
  status: string;
  user_id: string | null;
}

interface EmployeeApiResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: Employee[];
  };
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
  is_frozen: number;
  creation: string;
}

interface CustomerApiResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: Customer[];
  };
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
}

interface SupplierApiResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: Supplier[];
  };
}

interface ItemMaster {
  id: number;
  item_code: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  standard_rate: number;
  tax_id: number | null;
  disabled: number;
  HSN?: string;
}

interface ItemMasterApiResponse {
  success: number;
  data: ItemMaster[];
}

interface TaxType {
  tax_id: number;
  tax_type: string;
}

interface TaxApiResponse {
  success: number;
  data: TaxType[];
}

interface GRNApiResponse {
  success: number;
  data: {
    id: number;
    grn_number: string;
    grn_date: string;
    is_service?: number;
    entry_mode?: EntryMode;
    supplier_id: number | null;
    supplier_name: string | null;
    customer_id: number | null;
    purchase_order_id: number | null;
    warehouse_id: number;
    warehouse_name: string;
    customer_name?: string;
    received_by: string;
    received_by_id?: number;
    vehicle_number: string | null;
    delivery_challan_no: string;
    invoice_number: string | null;
    is_free_delivery?: number;
    delivery_charge?: number;
    status: 'draft' | 'submitted' | 'completed' | 'rejected';
    total_ordered_qty: number;
    total_received_qty: number;
    total_accepted_qty: number;
    total_rejected_qty: number;
    remarks: string | null;
    total_items: number;
    items?: GRNApiItem[];
  };
}

interface GRNApiItem {
  id: number;
  item_code: string;
  item_name: string;
  ordered_qty: number;
  received_qty: number;
  rejected_qty: number;
  uom: string;
  rate: number;
  remarks: string;
  po_item_id?: number;
  item_id?: number;
  tax_id?: number;
  tax_type?: string;
  item_tax_template?: string;
  hsn?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────
const parseGstPercent = (taxType?: string): number => {
  if (!taxType) return 0;
  const match = taxType.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
};

const extractTaxInfo = (taxType?: string, taxTemplate?: string): { rate: number; type: string } => {
  let taxString = taxType || taxTemplate || '';
  if (!taxString) return { rate: 0, type: '' };
  
  const rateMatch = taxString.match(/(\d+(\.\d+)?)/);
  const rate = rateMatch ? parseFloat(rateMatch[1]) : 0;
  
  let type = '';
  if (taxString.includes('GST')) type = 'GST';
  else if (taxString.includes('VAT')) type = 'VAT';
  else if (taxString.includes('Tax')) type = 'Tax';
  
  return { rate, type };
};

const computeItemAmounts = (item: GRNItem) => {
  const qty = item.receivedQty || 0;
  const amount = qty * (item.rate || 0);
  const gstPercent = item.taxRate || parseGstPercent(item.taxType) || 0;
  const sgst = (amount * gstPercent) / 2 / 100;
  const cgst = (amount * gstPercent) / 2 / 100;
  const total = amount + sgst + cgst;
  return { amount, sgst, cgst, total, gstPercent };
};

const escapeHtml = (value: string | number | undefined | null): string => {
  const str = value === undefined || value === null ? '' : String(value);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────

export default function GRNForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useAdminTheme();
  const isNew = id === "new";
  const isEditMode = !isNew && Boolean(id);

  // ─── Form State ────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<GRNData>({
    grn_number: '',
    grnDate: new Date().toISOString().split('T')[0],
    isService: false,
    entryMode: 'supplier',
    supplier: '',
    supplierId: undefined,
    purchaseOrder: '',
    purchaseOrderId: undefined,
    warehouse: '',
    warehouseId: undefined,
    customer: '',
    customerId: undefined,
    receivedBy: '',
    receivedById: undefined,
    vehicleNo: '',
    deliveryChallanNo: '',
    invoiceNo: '',
    freeDelivery: true,
    deliveryCharge: 0,
    items: [],
  });

  const [, setIsDirty] = useState(isNew);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(isEditMode);

  // ─── Company ───────────────────────────────────────────────────────────
  const [company, setCompany] = useState<string>('SculptorTech Pvt Ltd');

  // ─── Success Modal ───────────────────────────────────────────────────
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedGrnNumber, setSavedGrnNumber] = useState<string>('');
  const [isUpdateMode, setIsUpdateMode] = useState<boolean>(false);

  // ─── Service Toggle Confirmation ─────────────────────────────────────
  const [showServiceToggleConfirm, setShowServiceToggleConfirm] = useState(false);
  const [pendingServiceToggle, setPendingServiceToggle] = useState(false);

  // ─── PO Dropdown States ──────────────────────────────────────────────
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loadingPOs, setLoadingPOs] = useState(false);
  const [poSearchTerm, setPOSearchTerm] = useState('');
  const [showPODropdown, setShowPODropdown] = useState(false);
  const [poCurrentPage, setPOCurrentPage] = useState(1);
  const [poItemsPerPage] = useState(10);
  const [, setTotalPOs] = useState(0);
  const [, setPODetailLoading] = useState(false);
  const poInputRef = useRef<HTMLInputElement>(null);
  const poDropdownRef = useRef<HTMLDivElement>(null);

  // ─── Warehouse State ────────────────────────────────────────────────
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [warehouseSearchTerm, setWarehouseSearchTerm] = useState('');
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);
  const warehouseInputRef = useRef<HTMLInputElement>(null);
  const warehouseDropdownRef = useRef<HTMLDivElement>(null);

  // ─── Employee State ──────────────────────────────────────────────────
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const employeeInputRef = useRef<HTMLInputElement>(null);
  const employeeDropdownRef = useRef<HTMLDivElement>(null);

  // ─── Customer State ───────────────────────────────────────────────────
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerInputRef = useRef<HTMLInputElement>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // ─── Supplier State ──────────────────────────────────────────────────
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const supplierInputRef = useRef<HTMLInputElement>(null);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);

  // ─── Item Master State ──────────────────────────────────────────────
  const [itemsMaster, setItemsMaster] = useState<ItemMaster[]>([]);
  const [loadingItemsMaster, setLoadingItemsMaster] = useState(false);
  const [activeItemSearchIndex, setActiveItemSearchIndex] = useState<number | null>(null);
  const itemSearchDropdownRef = useRef<HTMLDivElement>(null);

  // ─── Tax Types State ───────────────────────────────────────────────
  const [taxTypes, setTaxTypes] = useState<TaxType[]>([]);
  const [loadingTaxTypes, setLoadingTaxTypes] = useState(false);

  // ─── PO Items Cache ─────────────────────────────────────────────────
  const [poItemsCache, setPoItemsCache] = useState<{ [poId: number]: POItem[] }>({});
  const [loadingPOItems, setLoadingPOItems] = useState<{ [poId: number]: boolean }>({});

  // ─── Fetch Warehouses ──────────────────────────────────────────────
  const fetchWarehouses = async () => {
    setLoadingWarehouses(true);
    try {
      const response = await api.get<WarehouseApiResponse>('/warehouse');
      if (response.data.success === 1) {
        const records = response.data.data.records || [];
        setWarehouses(records);
      }
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    } finally {
      setLoadingWarehouses(false);
    }
  };

  // ─── Fetch Employees ────────────────────────────────────────────────
  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const response = await api.get<EmployeeApiResponse>('/employee');
      if (response.data.success === 1) {
        const records = response.data.data.records || [];
        setEmployees(records);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // ─── Fetch Customers ─────────────────────────────────────────────────
  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const response = await api.get<CustomerApiResponse>('/customer');
      if (response.data.success === 1) {
        const records = response.data.data.records || [];
        setCustomers(records);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  // ─── Fetch Suppliers ──────────────────────────────────────────────────
  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const response = await api.get<SupplierApiResponse>('/supplier');
      if (response.data.success === 1) {
        const records = response.data.data.records || [];
        setSuppliers(records);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  // ─── Fetch Item Master ──────────────────────────────────────────────
  // FIX: returns the fetched array so callers that run immediately after
  // (e.g. the mount-time fetchGRNData) don't rely on the `itemsMaster`
  // state variable, which won't have updated yet inside the same closure.
  const fetchItemsMaster = async (): Promise<ItemMaster[]> => {
    setLoadingItemsMaster(true);
    try {
      const response = await api.get<ItemMasterApiResponse>('/item');
      if (response.data.success === 1) {
        const records = response.data.data || [];
        setItemsMaster(records);
        return records;
      }
      return [];
    } catch (err) {
      console.error('Error fetching items:', err);
      return [];
    } finally {
      setLoadingItemsMaster(false);
    }
  };

  // ─── Fetch Tax Types ────────────────────────────────────────────────
  // FIX: same pattern as fetchItemsMaster — return the fetched array
  // directly instead of only writing it to state. This is the root fix
  // for the "Select GST" not binding on load: the mount effect awaits
  // this call and then immediately calls fetchGRNData(), but `taxTypes`
  // state wouldn't be updated yet inside that same closure — only the
  // returned value is guaranteed fresh at that point.
  const fetchTaxTypes = async (): Promise<TaxType[]> => {
    setLoadingTaxTypes(true);
    try {
      const response = await api.get<TaxApiResponse>('/item/get-tax');
      if (response.data.success === 1) {
        const records = response.data.data || [];
        setTaxTypes(records);
        return records;
      }
      return [];
    } catch (err) {
      console.error('Error fetching tax types:', err);
      return [];
    } finally {
      setLoadingTaxTypes(false);
    }
  };

  // ─── Fetch Purchase Orders ──────────────────────────────────────────
  const fetchPurchaseOrders = async (supplierIdOverride?: number) => {
    setLoadingPOs(true);
    try {
      const effectiveSupplierId = supplierIdOverride !== undefined ? supplierIdOverride : formData.supplierId;
      const supplierQuery = effectiveSupplierId ? `&supplier_id=${effectiveSupplierId}` : '';
      const response = await api.get<POApiResponse>(
        `/purchase-order?page=${poCurrentPage}&limit=${poItemsPerPage}${supplierQuery}`
      );

      if (response.data.success === 1) {
        const records = response.data.data.records || [];
        setPurchaseOrders(records);
        setTotalPOs(response.data.data.total || records.length);
      }
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
    } finally {
      setLoadingPOs(false);
    }
  };

  // ─── Fetch Purchase Order Details ──────────────────────────────────
  const fetchPurchaseOrderDetail = async (poId: number) => {
    setPODetailLoading(true);
    try {
      const response = await api.get<PODetailApiResponse>(`/purchase-order/${poId}`);
      
      if (response.data.success === 1) {
        const poDetail = response.data.data;
        if (poDetail.items) {
          setPoItemsCache(prev => ({
            ...prev,
            [poId]: poDetail.items
          }));
        }
        populateGRNFromPO(poDetail);
        setShowPODropdown(false);
      }
    } catch (err) {
      console.error('Error fetching purchase order details:', err);
      setApiError('Failed to fetch PO details');
    } finally {
      setPODetailLoading(false);
    }
  };

  // ─── Resolve tax info from various sources ──────────────────────────
  // FIX: accepts an optional `taxTypesOverride` so callers that just
  // fetched a fresh tax list (before React has committed it to state)
  // can pass it in directly, instead of this function silently reading
  // the stale closed-over `taxTypes` state variable.
  const resolveTaxInfo = (item: any, taxTypesOverride?: TaxType[]): { taxId?: number; taxType?: string; taxRate?: number } => {
    const taxList = taxTypesOverride ?? taxTypes;

    // First check if we have tax_id directly
    if (item.tax_id) {
      const tax = taxList.find(t => t.tax_id === item.tax_id);
      if (tax) {
        const { rate } = extractTaxInfo(tax.tax_type);
        return { taxId: item.tax_id, taxType: tax.tax_type, taxRate: rate };
      }
    }

    // Check for item_tax_template
    if (item.item_tax_template) {
      const { rate } = extractTaxInfo(undefined, item.item_tax_template);

      // Try multiple matching strategies
      let matchingTax: TaxType | undefined = undefined;

      // Strategy 1: Find by exact rate
      matchingTax = taxList.find(t => {
        const { rate: tRate } = extractTaxInfo(t.tax_type);
        return tRate === rate;
      });

      // Strategy 2: Find by string matching
      if (!matchingTax) {
        const templateClean = item.item_tax_template.replace(/\s/g, '').toLowerCase();
        matchingTax = taxList.find(t => {
          const taxClean = t.tax_type.replace(/\s/g, '').toLowerCase();
          return taxClean.includes(templateClean) || templateClean.includes(taxClean);
        });
      }

      if (matchingTax) {
        return {
          taxId: matchingTax.tax_id,
          taxType: matchingTax.tax_type,
          taxRate: rate
        };
      }
      return { taxType: item.item_tax_template, taxRate: rate };
    }

    // Check for tax_type
    if (item.tax_type) {
      const { rate } = extractTaxInfo(item.tax_type);
      const matchingTax = taxList.find(t => {
        const { rate: tRate } = extractTaxInfo(t.tax_type);
        return tRate === rate;
      });
      if (matchingTax) {
        return { taxId: matchingTax.tax_id, taxType: matchingTax.tax_type, taxRate: rate };
      }
      return { taxType: item.tax_type, taxRate: rate };
    }

    return {};
  };

  // ─── Resolve the actual Item Master id for a GRN item ────────────────
  const resolveItemMasterId = (item: GRNItem): number | undefined => {
    if (item.itemCode) {
      const matchByCode = itemsMaster.find(
        im => (im.item_code || '').trim().toLowerCase() === item.itemCode.trim().toLowerCase()
      );
      if (matchByCode) return matchByCode.id;
    }
    if (item.itemId) {
      const matchById = itemsMaster.find(im => im.id === item.itemId);
      if (matchById) return matchById.id;
    }
    return item.itemId;
  };

  // ─── Populate GRN from PO ──────────────────────────────────────────
  const populateGRNFromPO = (poDetail: PurchaseOrderDetail) => {
    const items: GRNItem[] = (poDetail.items || []).map((item, index) => {
      const taxInfo = resolveTaxInfo(item);

      const masterMatch = itemsMaster.find(
        im => (im.item_code || '').toLowerCase() === (item.item_code || '').toLowerCase()
      );

      return {
        id: `po-${poDetail.id}-${index}-${Date.now()}`,
        itemCode: item.item_code || '',
        itemName: item.item_name || '',
        orderedQty: item.qty || 0,
        receivedQty: 0,
        rejectedQty: 0,
        uom: item.uom || '',
        rate: item.rate || 0,
        remarks: '',
        poItemId: item.id,
        itemId: masterMatch?.id,
        taxId: taxInfo.taxId,
        taxType: taxInfo.taxType,
        taxRate: taxInfo.taxRate || 0,
        hsn: item.hsn || '',
        isDraft: false,
      };
    });

    let warehouseId: number | undefined;
    if (poDetail.set_warehouse) {
      const found = warehouses.find(w => w.warehouse_name === poDetail.set_warehouse);
      if (found) {
        warehouseId = found.id;
      }
    }

    let supplierId: number | undefined = poDetail.supplier_id;
    if (!supplierId && poDetail.supplier) {
      const supplierNum = parseInt(poDetail.supplier);
      if (!isNaN(supplierNum)) {
        supplierId = supplierNum;
      }
    }

    const poName = poDetail.name || `PO-${String(poDetail.id).padStart(5, '0')}`;

    setFormData(prev => ({
      ...prev,
      supplier: poDetail.supplier_name || '',
      supplierId: supplierId,
      purchaseOrder: poName,
      purchaseOrderId: poDetail.id,
      warehouse: poDetail.set_warehouse || '',
      warehouseId: warehouseId,
      items: items,
    }));

    setPOSearchTerm(poName);
    if (poDetail.supplier_name) {
      setSupplierSearchTerm(poDetail.supplier_name);
    }
    if (poDetail.set_warehouse) {
      setWarehouseSearchTerm(poDetail.set_warehouse);
    }
    if (poDetail.company) {
      setCompany(poDetail.company);
    }
    
    setIsDirty(true);
  };

  // ─── Filtered lists ──────────────────────────────────────────────────
  const filteredWarehouses = warehouses.filter(w =>
    (w.warehouse_name?.toLowerCase() || '').includes((warehouseSearchTerm || '').toLowerCase())
  );

  const filteredEmployees = employees.filter(e => {
    const name = (e.employee_name || '').toLowerCase();
    const designation = (e.designation || '').toLowerCase();
    const department = (e.department || '').toLowerCase();
    const search = (employeeSearchTerm || '').toLowerCase();
    return name.includes(search) || designation.includes(search) || department.includes(search);
  });

  const filteredCustomers = customers.filter(c => {
    const name = (c.customer_name || '').toLowerCase();
    const email = (c.email_id || '').toLowerCase();
    const mobile = (c.mobile_no || '');
    const search = (customerSearchTerm || '').toLowerCase();
    return name.includes(search) || email.includes(search) || mobile.includes(search);
  });

  const filteredSuppliers = suppliers.filter(s => {
    const name = (s.supplier_name || '').toLowerCase();
    const email = (s.email_id || '').toLowerCase();
    const mobile = (s.mobile_no || '');
    const search = (supplierSearchTerm || '').toLowerCase();
    return name.includes(search) || email.includes(search) || mobile.includes(search);
  });

  const selectedSupplier = formData.supplierId
    ? suppliers.find(s => s.id === formData.supplierId)
    : undefined;

  const selectedCustomer = formData.customerId
    ? customers.find(c => c.id === formData.customerId)
    : undefined;

  // ─── Fetch PO items on hover ──────────────────────────────────────────
  const fetchPOItems = async (poId: number) => {
    if (poItemsCache[poId]) return;
    setLoadingPOItems(prev => ({ ...prev, [poId]: true }));
    try {
      const response = await api.get<PODetailApiResponse>(`/purchase-order/${poId}`);
      if (response.data.success === 1) {
        setPoItemsCache(prev => ({
          ...prev,
          [poId]: response.data.data.items || []
        }));
      }
    } catch (err) {
      console.error('Error fetching PO items:', err);
    } finally {
      setLoadingPOItems(prev => ({ ...prev, [poId]: false }));
    }
  };

  // ─── Get display name for PO ──────────────────────────────────────────
  const getPODisplayName = (po: PurchaseOrder): string => {
    if (po.name && po.name !== 'N/A' && po.name !== 'Draft') {
      return po.name;
    }
    return `PO-${String(po.id).padStart(5, '0')}`;
  };

  const filteredPOs = purchaseOrders.filter(po => {
    const searchLower = (poSearchTerm || '').toLowerCase();
    const poDisplayName = getPODisplayName(po).toLowerCase();
    const supplierName = (po.supplier_name || '').toLowerCase();
    const poIdString = (po.id?.toString() || '');
    
    const matchesSearch = poDisplayName.includes(searchLower) || 
                          supplierName.includes(searchLower) || 
                          poIdString.includes(searchLower);
    
    const matchesSupplier = !formData.supplierId ||
      supplierName === (formData.supplier?.toLowerCase() || '') ||
      (po.supplier || '') === String(formData.supplierId);
      
    return matchesSearch && matchesSupplier;
  });

  const activeItemSearchTerm = activeItemSearchIndex !== null
    ? (formData.items[activeItemSearchIndex]?.itemName || '')
    : '';

  const filteredItemsMaster = itemsMaster.filter(im => {
    if (im.disabled) return false;
    const searchLower = (activeItemSearchTerm || '').toLowerCase();
    if (!searchLower) return true;
    const itemName = (im.item_name || '').toLowerCase();
    const itemCode = (im.item_code || '').toLowerCase();
    return itemName.includes(searchLower) || itemCode.includes(searchLower);
  });

  // ─── Click outside handlers ──────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        warehouseDropdownRef.current && 
        !warehouseDropdownRef.current.contains(event.target as Node) &&
        warehouseInputRef.current &&
        !warehouseInputRef.current.contains(event.target as Node)
      ) {
        setShowWarehouseDropdown(false);
      }
      if (
        employeeDropdownRef.current && 
        !employeeDropdownRef.current.contains(event.target as Node) &&
        employeeInputRef.current &&
        !employeeInputRef.current.contains(event.target as Node)
      ) {
        setShowEmployeeDropdown(false);
      }
      if (
        poDropdownRef.current && 
        !poDropdownRef.current.contains(event.target as Node) &&
        poInputRef.current &&
        !poInputRef.current.contains(event.target as Node)
      ) {
        setShowPODropdown(false);
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
        supplierDropdownRef.current &&
        !supplierDropdownRef.current.contains(event.target as Node) &&
        supplierInputRef.current &&
        !supplierInputRef.current.contains(event.target as Node)
      ) {
        setShowSupplierDropdown(false);
      }
      if (
        itemSearchDropdownRef.current &&
        !itemSearchDropdownRef.current.contains(event.target as Node)
      ) {
        setActiveItemSearchIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Fetch data on mount ────────────────────────────────────────────
  // FIX: Promise.all's resolved values are captured directly here and
  // passed straight into fetchGRNData, instead of letting fetchGRNData
  // read `taxTypes` / `itemsMaster` state (which is not guaranteed to be
  // updated yet at this point in the same render/closure).
  useEffect(() => {
    const loadData = async () => {
      // Load all master data first
      const [, , , , fetchedItemsMaster, fetchedTaxTypes] = await Promise.all([
        fetchWarehouses(),
        fetchEmployees(),
        fetchCustomers(),
        fetchSuppliers(),
        fetchItemsMaster(),
        fetchTaxTypes(),
      ]);

      // Then load GRN data if in edit mode — pass the freshly-fetched
      // arrays directly so tax/item lookups inside fetchGRNData don't
      // race the state update.
      if (isEditMode && id) {
        await fetchGRNData(id, fetchedTaxTypes, fetchedItemsMaster);
      }

      if (location.state?.poData) {
        const poData = location.state.poData as PurchaseOrderDetail;
        populateGRNFromPO(poData);
      }

      if (showPODropdown) {
        await fetchPurchaseOrders();
      }
    };

    loadData();
  }, [id, isEditMode, location.state]);

  useEffect(() => {
    if (showPODropdown) {
      fetchPurchaseOrders();
    }
  }, [showPODropdown, poCurrentPage, formData.supplierId]);

  // ─── Once Item Master finishes loading, backfill itemId on any items ──
  useEffect(() => {
    if (itemsMaster.length === 0) return;
    setFormData(prev => {
      let changed = false;
      const items = prev.items.map(it => {
        const codeMatch = itemsMaster.find(
          im => (im.item_code || '').trim().toLowerCase() === (it.itemCode || '').trim().toLowerCase()
        );
        if (codeMatch) {
          if (codeMatch.id !== it.itemId) {
            changed = true;
            return { ...it, itemId: codeMatch.id };
          }
          return it;
        }
        return it;
      });
      return changed ? { ...prev, items } : prev;
    });
  }, [itemsMaster]);

  // ─── Helper to find tax by rate ──────────────────────────────────────

  // ─── Fetch GRN Data for Edit ──────────────────────────────────────
  // FIX: accepts optional `taxTypesOverride` / `itemsMasterOverride` so the
  // mount effect can hand this function the arrays it JUST fetched, rather
  // than this function reading the `taxTypes` / `itemsMaster` state
  // variables — which, at mount time, are still their initial empty arrays
  // inside this closure even though the fetches have already resolved.
  // This is what was causing "Select GST" to never bind on load, since
  // every taxTypes.find(...) below was searching an empty list.
  const fetchGRNData = async (
    grnId: string,
    taxTypesOverride?: TaxType[],
    itemsMasterOverride?: ItemMaster[]
  ) => {
    setLoading(true);
    const taxList = taxTypesOverride ?? taxTypes;
    const itemMasterList = itemsMasterOverride ?? itemsMaster;

    try {
      const response = await api.get<GRNApiResponse>(`/grn/${grnId}`);
      if (response.data.success === 1) {
        const data = response.data.data;
        
        const isService = data.customer_id !== null && data.customer_id !== undefined && data.supplier_id === null;
        
        let entryMode: EntryMode = 'manual';
        if (data.purchase_order_id !== null && data.purchase_order_id !== undefined && data.purchase_order_id > 0) {
          entryMode = 'supplier';
        } else if (data.supplier_id !== null && data.supplier_id !== undefined) {
          entryMode = 'manual';
        } else {
          entryMode = 'manual';
        }
        
        const items: GRNItem[] = (data.items || []).map((item, index) => {
          // Try to find tax from item_tax_template first
          let taxId: number | undefined = item.tax_id || undefined;
          let taxType: string | undefined = item.tax_type || undefined;
          let taxRate: number = 0;
          
          // Check if we have item_tax_template (e.g., "GST18 18%")
          if (item.item_tax_template) {
            // Extract the rate from the template
            const rateMatch = item.item_tax_template.match(/(\d+(\.\d+)?)/);
            const rate = rateMatch ? parseFloat(rateMatch[1]) : 0;
            taxRate = rate;
            
            // Try to find matching tax in taxList (freshly-fetched, not stale state)
            let matchingTax: TaxType | undefined = undefined;
            
            // Strategy 1: Find by exact rate match
            matchingTax = taxList.find(t => {
              const tRateMatch = t.tax_type.match(/(\d+(\.\d+)?)/);
              const tRate = tRateMatch ? parseFloat(tRateMatch[1]) : 0;
              return tRate === rate;
            });
            
            // Strategy 2: If no match, try to find by string matching (remove spaces)
            if (!matchingTax) {
              const templateClean = item.item_tax_template.replace(/\s/g, '').toLowerCase();
              matchingTax = taxList.find(t => {
                const taxClean = t.tax_type.replace(/\s/g, '').toLowerCase();
                return taxClean.includes(templateClean) || templateClean.includes(taxClean);
              });
            }
            
            // Strategy 3: Try to find by tax_type that contains the rate
            if (!matchingTax && rate > 0) {
              matchingTax = taxList.find(t => {
                const taxLower = t.tax_type.toLowerCase();
                return taxLower.includes(rate.toString()) && taxLower.includes('gst');
              });
            }
            
            // Strategy 4: Try to find by exact rate with any GST variant
            if (!matchingTax && rate > 0) {
              matchingTax = taxList.find(t => {
                const tRateMatch = t.tax_type.match(/(\d+(\.\d+)?)/);
                const tRate = tRateMatch ? parseFloat(tRateMatch[1]) : 0;
                return tRate === rate;
              });
            }
            
            if (matchingTax) {
              taxId = matchingTax.tax_id;
              taxType = matchingTax.tax_type;
            } else {
              // If no matching tax found, store the template as taxType
              taxType = item.item_tax_template;
              // Try to find by creating a new tax entry in the dropdown options
              // by searching for any tax with the same rate
              const taxByRate = taxList.find(t => {
                const tRateMatch = t.tax_type.match(/(\d+(\.\d+)?)/);
                const tRate = tRateMatch ? parseFloat(tRateMatch[1]) : 0;
                return tRate === rate;
              });
              if (taxByRate) {
                taxId = taxByRate.tax_id;
                taxType = taxByRate.tax_type;
              }
            }
          }
          
          // If no tax found from item_tax_template, use resolveTaxInfo
          // (passing taxList through so it doesn't fall back to stale state)
          if (!taxId && !taxType) {
            const resolved = resolveTaxInfo(item, taxList);
            taxId = resolved.taxId;
            taxType = resolved.taxType;
            taxRate = resolved.taxRate || 0;
          }

          const masterMatch = itemMasterList.find(
            im => (im.item_code || '').toLowerCase() === (item.item_code || '').toLowerCase()
          );

          return {
            id: item.id?.toString() || `item-${index}-${Date.now()}`,
            itemCode: item.item_code || '',
            itemName: item.item_name || '',
            orderedQty: item.ordered_qty || 0,
            receivedQty: item.received_qty || 0,
            rejectedQty: item.rejected_qty || 0,
            uom: item.uom || '',
            rate: item.rate || 0,
            remarks: item.remarks || '',
            poItemId: item.po_item_id || item.id,
            itemId: masterMatch?.id || item.item_id,
            taxId: taxId,
            taxType: taxType,
            taxRate: taxRate,
            hsn: item.hsn || '',
            isDraft: false,
          };
        }) || [];

        let customerName = data.customer_name || '';
        let customerId = data.customer_id || undefined;
        
        if (customerId && !customerName) {
          const foundCustomer = customers.find(c => c.id === customerId);
          if (foundCustomer) {
            customerName = foundCustomer.customer_name;
          }
        }

        let supplierName = data.supplier_name || '';
        let supplierId = data.supplier_id || undefined;

        setFormData({
          id: data.id?.toString(),
          grn_number: data.grn_number || '',
          grnDate: data.grn_date ? new Date(data.grn_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          isService: isService,
          entryMode: entryMode,
          supplier: isService ? '' : (supplierName || ''),
          supplierId: isService ? undefined : (supplierId || undefined),
          purchaseOrder: data.purchase_order_id ? `PO-${String(data.purchase_order_id).padStart(5, '0')}` : '',
          purchaseOrderId: data.purchase_order_id || undefined,
          warehouse: data.warehouse_name || '',
          warehouseId: data.warehouse_id || undefined,
          customer: isService ? customerName : '',
          customerId: isService ? customerId : undefined,
          receivedBy: data.received_by || '',
          receivedById: data.received_by_id,
          vehicleNo: data.vehicle_number || '',
          deliveryChallanNo: data.delivery_challan_no || '',
          invoiceNo: data.invoice_number || '',
          freeDelivery: data.is_free_delivery === undefined ? true : data.is_free_delivery === 1,
          deliveryCharge: data.delivery_charge || 0,
          items: items,
        });

        setWarehouseSearchTerm(data.warehouse_name || '');
        setEmployeeSearchTerm(data.received_by || '');
        
        if (data.purchase_order_id) {
          setPOSearchTerm(`PO-${String(data.purchase_order_id).padStart(5, '0')}`);
        } else {
          setPOSearchTerm('');
        }
        
        if (isService && customerName) {
          setCustomerSearchTerm(customerName);
        } else {
          setCustomerSearchTerm('');
        }
        
        if (!isService && supplierName) {
          setSupplierSearchTerm(supplierName);
        } else {
          setSupplierSearchTerm('');
        }
      }
    } catch (err) {
      console.error('Error fetching GRN:', err);
      setApiError('Failed to load GRN data');
    } finally {
      setLoading(false);
    }
  };

  // ─── Validation ──────────────────────────────────────────────────────
  const getAllValidationErrors = (): ValidationError[] => {
    const allErrors: ValidationError[] = [];

    if (formData.isService) {
      if (!(formData.customer || '').trim()) {
        allErrors.push({ field: 'customer', label: 'Customer', message: 'Customer is required' });
      }
    } else {
      if (!(formData.supplier || '').trim()) {
        allErrors.push({ field: 'supplier', label: 'Supplier', message: 'Supplier is required' });
      }
      if (formData.entryMode === 'supplier' && !(formData.purchaseOrder || '').trim()) {
        allErrors.push({ field: 'purchaseOrder', label: 'Purchase Order', message: 'Purchase Order is required' });
      }
    }

    if (!formData.warehouseId) {
      allErrors.push({ field: 'warehouse', label: 'Warehouse', message: 'Warehouse is required' });
    }

    if (!(formData.receivedBy || '').trim()) {
      allErrors.push({ field: 'receivedBy', label: 'Received By', message: 'Received By is required' });
    }

    if (!formData.freeDelivery && (!formData.deliveryCharge || formData.deliveryCharge <= 0)) {
      allErrors.push({ field: 'deliveryCharge', label: 'Delivery Charge', message: 'Enter the amount paid for delivery, or mark delivery as free' });
    }

    if (formData.items.length === 0) {
      allErrors.push({ field: 'items', label: 'Items', message: 'At least one item is required' });
    }

    formData.items.forEach((item, index) => {
      if (!(item.itemCode || '').trim()) {
        allErrors.push({ field: `items[${index}].itemCode`, label: `Item ${index + 1} Code`, message: 'Item code is required' });
      }
      if (!(item.itemName || '').trim()) {
        allErrors.push({ field: `items[${index}].itemName`, label: `Item ${index + 1} Name`, message: 'Item name is required' });
      }
      if (!Number.isFinite(item.receivedQty) || item.receivedQty <= 0) {
        allErrors.push({
          field: `items[${index}].receivedQty`,
          label: `Item ${index + 1} Received Qty`,
          message: 'Received quantity must be greater than 0'
        });
      }
      if (item.rejectedQty < 0) {
        allErrors.push({ field: `items[${index}].rejectedQty`, label: `Item ${index + 1} Rejected Qty`, message: 'Rejected quantity cannot be negative' });
      }
      if (item.rejectedQty > item.receivedQty) {
        allErrors.push({ field: `items[${index}].rejectedQty`, label: `Item ${index + 1} Quantities`, message: 'Rejected cannot exceed Received quantity' });
      }
      if (!item.taxId) {
        allErrors.push({ field: `items[${index}].taxId`, label: `Item ${index + 1} GST`, message: 'GST/Tax type is required' });
      }
    });

    return allErrors;
  };

  // ─── Handlers ────────────────────────────────────────────────────────
  const handleFieldChange = (field: keyof GRNData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleServiceToggle = (checked: boolean) => {
    if (formData.items.length > 0 || formData.supplier || formData.customer || formData.purchaseOrder) {
      setPendingServiceToggle(checked);
      setShowServiceToggleConfirm(true);
    } else {
      applyServiceToggle(checked);
    }
  };

  const applyServiceToggle = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      isService: checked,
      entryMode: checked ? 'manual' : 'supplier',
      supplier: '',
      supplierId: undefined,
      purchaseOrder: '',
      purchaseOrderId: undefined,
      customer: '',
      customerId: undefined,
      items: [],
    }));
    if (checked) {
      setPOSearchTerm('');
      setSupplierSearchTerm('');
    } else {
      setCustomerSearchTerm('');
    }
    setIsDirty(true);
    setShowServiceToggleConfirm(false);
  };

  const handleEntryModeChange = (mode: EntryMode) => {
    setFormData(prev => ({
      ...prev,
      entryMode: mode,
      items: [],
      purchaseOrder: mode === 'supplier' ? prev.purchaseOrder : '',
      purchaseOrderId: mode === 'supplier' ? prev.purchaseOrderId : undefined,
    }));
    if (mode !== 'supplier') {
      setPOSearchTerm('');
    }
    setIsDirty(true);
  };

  const handleWarehouseSelect = (warehouse: Warehouse) => {
    setFormData(prev => ({ 
      ...prev, 
      warehouse: warehouse.warehouse_name,
      warehouseId: warehouse.id
    }));
    setWarehouseSearchTerm(warehouse.warehouse_name);
    setShowWarehouseDropdown(false);
    setIsDirty(true);
  };

  const handleEmployeeSelect = (employee: Employee) => {
    setFormData(prev => ({ 
      ...prev, 
      receivedBy: employee.employee_name,
      receivedById: employee.id
    }));
    setEmployeeSearchTerm(employee.employee_name);
    setShowEmployeeDropdown(false);
    setIsDirty(true);
  };

  const handleCustomerSelect = (customer: Customer) => {
    setFormData(prev => ({
      ...prev,
      customer: customer.customer_name,
      customerId: customer.id,
    }));
    setCustomerSearchTerm(customer.customer_name);
    setShowCustomerDropdown(false);
    setIsDirty(true);
  };

  const handleSupplierSelect = (supplier: Supplier) => {
    setFormData(prev => ({
      ...prev,
      supplier: supplier.supplier_name,
      supplierId: supplier.id,
      purchaseOrder: '',
      purchaseOrderId: undefined,
    }));
    setSupplierSearchTerm(supplier.supplier_name);
    setShowSupplierDropdown(false);
    setPOSearchTerm('');
    setPOCurrentPage(1);
    setIsDirty(true);
    if (formData.entryMode === 'supplier') {
      fetchPurchaseOrders(supplier.id);
    }
  };

  const handlePOSelect = (po: PurchaseOrder) => {
    const poName = getPODisplayName(po);
    setPOSearchTerm(poName);
    setFormData(prev => ({
      ...prev,
      purchaseOrder: poName,
      purchaseOrderId: po.id,
      supplier: po.supplier_name || '',
      supplierId: po.supplier ? parseInt(po.supplier) || prev.supplierId : prev.supplierId,
    }));
    setSupplierSearchTerm(po.supplier_name || '');
    setShowPODropdown(false);
    fetchPurchaseOrderDetail(po.id);
  };

  const handleItemChange = (index: number, field: keyof GRNItem, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: updatedItems }));
    setIsDirty(true);
  };

  const handleItemMasterSelect = (index: number, master: ItemMaster) => {
    const updatedItems = [...formData.items];
    const taxInfo = resolveTaxInfo(master);
    updatedItems[index] = {
      ...updatedItems[index],
      itemCode: master.item_code,
      itemName: master.item_name,
      uom: master.stock_uom || '',
      rate: master.standard_rate || 0,
      itemId: master.id,
      taxId: taxInfo.taxId || master.tax_id || undefined,
      taxType: taxInfo.taxType,
      taxRate: taxInfo.taxRate || 0,
      hsn: master.HSN || '',
      isDraft: true,
    };
    setFormData(prev => ({ ...prev, items: updatedItems }));
    setActiveItemSearchIndex(null);
    setIsDirty(true);
  };

  const handleItemTaxChange = (index: number, taxId: number) => {
    const tax = taxTypes.find(t => t.tax_id === taxId);
    const { rate } = extractTaxInfo(tax?.tax_type);
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      taxId: taxId,
      taxType: tax?.tax_type,
      taxRate: rate,
    };
    setFormData(prev => ({ ...prev, items: updatedItems }));
    setIsDirty(true);
  };

  const addItem = () => {
    const newItem: GRNItem = {
      id: Date.now().toString(),
      itemCode: '',
      itemName: '',
      orderedQty: 0,
      receivedQty: 0,
      rejectedQty: 0,
      uom: '',
      rate: 0,
      remarks: '',
      taxRate: 0,
      hsn: '',
      isDraft: true,
    };
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    setIsDirty(true);
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
    setIsDirty(true);
  };

  // ─── Bill Totals ──────────────────────────────────────────────────────
  const billTotals = formData.items.reduce(
    (acc, item) => {
      const { amount, sgst, cgst, total } = computeItemAmounts(item);
      acc.subtotal += amount;
      acc.sgst += sgst;
      acc.cgst += cgst;
      acc.itemsTotal += total;
      return acc;
    },
    { subtotal: 0, sgst: 0, cgst: 0, itemsTotal: 0 }
  );
  const deliveryChargeAmount = formData.freeDelivery ? 0 : (formData.deliveryCharge || 0);
  const grandTotal = billTotals.itemsTotal + deliveryChargeAmount;

  // ─── Get draft items ──────────────────────────────────────────────────
  const draftItems = formData.items.filter(item => item.isDraft === true);

  // ─── Inventory Sync ───────────────────────────────────────────────────
  const postInventoryForItems = async (items: GRNItem[]) => {
    const inventoryType = formData.isService ? 'External' : 'Internal';
    const role = getUserRole();

    const grnId = isEditMode && id ? parseInt(id) : undefined;
    const grnNumber = isEditMode ? formData.grn_number : undefined;

    const results = await Promise.allSettled(
      items.map((item) => {
        const resolvedItemId = resolveItemMasterId(item);

        const payload = {
          item_Id: resolvedItemId,
          item_code: item.itemCode,
          warehouse_Id: formData.warehouseId,
          actual_qty: item.receivedQty || 0,
          ordered_qty: item.orderedQty || item.receivedQty || 0,
          stock_uom: item.uom,
          company: company,
          valuation_rate: item.rate || 0,
          modified_by: role?.name,
          type: inventoryType,
          grn_id: grnId,
          grn_number: grnNumber,
        };

        if (!resolvedItemId) {
          console.warn(
            `Could not resolve Item Master id for item_code "${item.itemCode}" — sending inventory entry without item_Id.`
          );
        }

        return api.post('/inventory', payload);
      })
    );

    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      console.error(`Failed to post ${failed.length} of ${items.length} inventory entries`, failed);
    }
  };

  // ─── Print ────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) {
      setApiError('Please allow pop-ups to print this document.');
      return;
    }

    const partyRows = formData.isService
      ? `
        <tr><td class="label">Customer</td><td>${escapeHtml(formData.customer || '-')}</td></tr>
        <tr><td class="label">Mobile</td><td>${escapeHtml(selectedCustomer?.mobile_no || '-')}</td></tr>
        <tr><td class="label">Email</td><td>${escapeHtml(selectedCustomer?.email_id || '-')}</td></tr>
        <tr><td class="label">Warehouse</td><td>${escapeHtml(formData.warehouse || '-')}</td></tr>
      `
      : `
        <tr><td class="label">Supplier</td><td>${escapeHtml(formData.supplier || '-')}</td></tr>
        <tr><td class="label">Mobile</td><td>${escapeHtml(selectedSupplier?.mobile_no || '-')}</td></tr>
        <tr><td class="label">Email</td><td>${escapeHtml(selectedSupplier?.email_id || '-')}</td></tr>
        <tr><td class="label">Country</td><td>${escapeHtml(selectedSupplier?.country || '-')}</td></tr>
        <tr><td class="label">Purchase Order</td><td>${escapeHtml(formData.entryMode === 'supplier' ? (formData.purchaseOrder || '-') : 'Manual Entry')}</td></tr>
        <tr><td class="label">Warehouse</td><td>${escapeHtml(formData.warehouse || '-')}</td></tr>
      `;

    const itemRows = formData.items.map((item, idx) => {
      const { sgst, cgst, total, gstPercent } = computeItemAmounts(item);
      return `
        <tr>
          <td>${idx + 1}</td>
          <td>${escapeHtml(item.itemCode)}</td>
          <td>${escapeHtml(item.itemName)}</td>
          <td>${escapeHtml(item.hsn || '-')}</td>
          <td class="num">${item.receivedQty}</td>
          <td>${escapeHtml(item.uom)}</td>
          <td class="num">${item.rate.toFixed(2)}</td>
          <td class="num">${gstPercent}%</td>
          <td class="num">${sgst.toFixed(2)}</td>
          <td class="num">${cgst.toFixed(2)}</td>
          <td class="num">${total.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(formData.grn_number || 'GRN')}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, Helvetica, sans-serif; color: #111827; padding: 32px; }
          h1 { font-size: 20px; margin: 0 0 4px; }
          .subtitle { color: #6b7280; font-size: 12px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
          .meta-table td { padding: 4px 8px; font-size: 12.5px; border: none; }
          .meta-table td.label { color: #6b7280; width: 140px; }
          .items-table th, .items-table td { border: 1px solid #d1d5db; padding: 6px 8px; font-size: 12px; }
          .items-table th { background: #f3f4f6; text-align: left; }
          .items-table td.num, .items-table th.num { text-align: right; }
          .totals { width: 320px; margin-left: auto; }
          .totals td { padding: 4px 8px; font-size: 12.5px; }
          .totals td:last-child { text-align: right; }
          .totals .grand td { font-weight: 700; font-size: 14px; border-top: 1px solid #111827; padding-top: 8px; }
          .note { margin-top: 20px; font-size: 11.5px; color: #6b7280; }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>${formData.isService ? 'Service Bill' : 'Goods Receipt Note'}</h1>
        <div class="subtitle">GRN Number: ${escapeHtml(formData.grn_number || '(will be generated on save)')} &nbsp;|&nbsp; Date: ${escapeHtml(formData.grnDate)} &nbsp;|&nbsp; Received By: ${escapeHtml(formData.receivedBy || '-')}</div>

        <table class="meta-table">${partyRows}</table>

        <table class="items-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Code</th>
              <th>Item</th>
              <th>HSN</th>
              <th class="num">Qty</th>
              <th>UOM</th>
              <th class="num">Rate</th>
              <th class="num">GST</th>
              <th class="num">SGST</th>
              <th class="num">CGST</th>
              <th class="num">Amount</th>
            </tr>
          </thead>
          <tbody>${itemRows || '<tr><td colspan="11">No items</td></tr>'}</tbody>
        </table>

        <table class="totals">
          <tr><td>Subtotal</td><td>${billTotals.subtotal.toFixed(2)}</td></tr>
          <tr><td>Total SGST</td><td>${billTotals.sgst.toFixed(2)}</td></tr>
          <tr><td>Total CGST</td><td>${billTotals.cgst.toFixed(2)}</td></tr>
          <tr><td>Delivery Charges${formData.freeDelivery ? ' (Free)' : ''}</td><td>${deliveryChargeAmount.toFixed(2)}</td></tr>
          <tr class="grand"><td>Grand Total</td><td>${grandTotal.toFixed(2)}</td></tr>
        </table>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  // ─── Save Handler ──────────────────────────────────────────────────
  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError(null);

    const validationErrorsList = getAllValidationErrors();
    if (validationErrorsList.length > 0) {
      setValidationErrors(validationErrorsList);
      setShowValidationSummary(true);
      return;
    }

    setSubmitting(true);
    try {
      let grnType = 'Internal';
      if (formData.isService) {
        grnType = 'External';
      } else if (formData.entryMode === 'supplier') {
        grnType = 'Internal';
      } else {
        grnType = 'Internal';
      }

      const payload: any = {
        grn_number: formData.grn_number || `GRN-${Date.now()}`,
        grn_date: formData.grnDate,
        is_service: formData.isService ? 1 : 0,
        entry_mode: formData.entryMode,
        type: grnType,
        status: 'submitted',
        received_by: formData.receivedBy,
        received_by_id: formData.receivedById,
        warehouse_id: formData.warehouseId,
        warehouse_name: formData.warehouse,
        vehicle_number: formData.vehicleNo || null,
        delivery_challan_no: formData.deliveryChallanNo || '',
        invoice_number: formData.invoiceNo || null,
        is_free_delivery: formData.freeDelivery ? 1 : 0,
        delivery_charge: deliveryChargeAmount,
        items: formData.items.map(item => {
          const { amount, sgst, cgst, total } = computeItemAmounts(item);
          return {
            item_code: item.itemCode,
            item_name: item.itemName,
            ordered_qty: item.orderedQty || 0,
            received_qty: item.receivedQty || 0,
            rejected_qty: item.rejectedQty || 0,
            uom: item.uom || '',
            rate: item.rate || 0,
            purchase_rate: item.rate,
            remarks: item.remarks || null,
            item_id: resolveItemMasterId(item),
            tax_id: item.taxId,
            tax_type: item.taxType,
            item_tax_template: item.taxType || item.taxRate ? `${item.taxType || 'GST'} ${item.taxRate || 0}%` : '',
            hsn: item.hsn || '',
            amount: amount,
            sgst_amount: sgst,
            cgst_amount: cgst,
            item_total: total,
          };
        }),
        subtotal: billTotals.subtotal,
        total_sgst: billTotals.sgst,
        total_cgst: billTotals.cgst,
        grand_total: grandTotal,
      };

      if (formData.isService) {
        payload.customer_id = formData.customerId;
        payload.customer_name = formData.customer;
      } else {
        payload.supplier_id = formData.supplierId;
        payload.supplier_name = formData.supplier;
        payload.purchase_order_id = formData.entryMode === 'supplier' ? formData.purchaseOrderId : undefined;
      }

      let response;
      let isUpdate = false;
      
      const editId = id && id !== 'new' && id !== 'view' ? parseInt(id) : null;

      if (editId && !isNaN(editId) && isEditMode) {
        payload.id = editId;
        console.log('🔄 Updating GRN with ID:', editId);
        response = await api.put(`/grn`, payload);
        isUpdate = true;
      } else {
        console.log('✨ Creating new GRN');
        response = await api.post('/grn', payload);
        isUpdate = false;
      }

      if (response.data && response.data.success === 1) {
        console.log('GRN saved successfully:', response.data);
        setIsDirty(false);
        const generatedNumber = response.data?.data?.grn_number || payload.grn_number;
        setSavedGrnNumber(generatedNumber);
        setIsUpdateMode(isUpdate);

        await postInventoryForItems(formData.items);

        setShowSuccessModal(true);
      } else {
        setApiError(response.data?.message || 'Failed to save GRN');
      }
    } catch (err: any) {
      console.error('Error saving GRN:', err);

      if (err.response) {
        if (err.response.status === 409) {
          setApiError('A GRN with this number already exists');
        } else if (err.response.status === 400) {
          setApiError(err.response.data?.message || 'Invalid data provided');
        } else {
          setApiError(err.response.data?.message || 'Failed to save GRN');
        }
      } else if (err.request) {
        setApiError('Network error. Please check your connection.');
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessModalOk = () => {
    setShowSuccessModal(false);
    navigate('/grn');
  };

  const hasErrors = getAllValidationErrors().length > 0;

  const getPOStatusBadgeClass = (status: string) => {
    const safeStatus = (status || '').toLowerCase();
    switch (safeStatus) {
      case 'draft': return 'grn-status-draft';
      case 'submitted': return 'grn-status-submitted';
      case 'partially received': return 'grn-status-partial';
      case 'fully received': return 'grn-status-completed';
      case 'cancelled': return 'grn-status-rejected';
      case 'closed': return 'grn-status-closed';
      default: return 'grn-status-draft';
    }
  };

  if (loading) {
    return (
      <div className="grnf-page">
        <div className="grnf-inner">
          <div className="grnf-loading"><FaSpinner className="grnf-spinning" /> Loading GRN data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`grnf-page ${theme}`}>
      <div className="grnf-inner">

        {/* ─── Success Modal ──────────────────────────────────────────── */}
        {showSuccessModal && (
          <div className="grnf-modal-overlay" onClick={() => setShowSuccessModal(false)}>
            <div className="grnf-success-modal" onClick={(e) => e.stopPropagation()}>
              <div className="grnf-success-icon-circle">
                <FaCheckCircle size={48} />
              </div>
              <h2>{isUpdateMode ? 'GRN Updated Successfully!' : 'GRN Created Successfully!'}</h2>
              <p className="grnf-success-message">
                {isUpdateMode 
                  ? 'Your Goods Receipt Note has been updated successfully.'
                  : 'Your Goods Receipt Note has been saved successfully.'}
              </p>
              <div className="grnf-success-grn-box">
                <span className="grnf-success-label">GRN Number</span>
                <span className="grnf-success-number">{savedGrnNumber}</span>
              </div>
              <div className="grnf-success-actions">
                <button 
                  className="grnf-success-btn grnf-success-btn-primary" 
                  onClick={handleSuccessModalOk}
                >
                  View All GRNs
                </button>
                <button 
                  className="grnf-success-btn grnf-success-btn-secondary" 
                  onClick={() => setShowSuccessModal(false)}
                >
                  Continue Editing
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Service Toggle Confirmation Dialog ────────────────────── */}
        {showServiceToggleConfirm && (
          <div className="grnf-modal-overlay" onClick={() => setShowServiceToggleConfirm(false)}>
            <div className="grnf-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="grnf-confirm-icon">
                <FaExclamationTriangle size={32} />
              </div>
              <h3>Confirm Mode Change</h3>
              <p className="grnf-confirm-message">
                Switching to <strong>{pendingServiceToggle ? 'Service' : 'Supplier'}</strong> mode will clear all current items and selections. 
                This action cannot be undone.
              </p>
              <p className="grnf-confirm-warning">Are you sure you want to continue?</p>
              <div className="grnf-confirm-actions">
                <button 
                  className="grnf-confirm-btn grnf-confirm-btn-cancel" 
                  onClick={() => setShowServiceToggleConfirm(false)}
                >
                  No, Keep Current
                </button>
                <button 
                  className="grnf-confirm-btn grnf-confirm-btn-proceed" 
                  onClick={() => applyServiceToggle(pendingServiceToggle)}
                >
                  Yes, Switch Mode
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Validation Summary Modal ────────────────────────────── */}
        {showValidationSummary && validationErrors.length > 0 && (
          <div className="grnf-modal-overlay" onClick={() => setShowValidationSummary(false)}>
            <div className="grnf-validation-modal" onClick={(e) => e.stopPropagation()}>
              <div className="grnf-modal-header">
                <h2>
                  <FaExclamationTriangle /> Missing Required Fields
                </h2>
                <button className="grnf-modal-close" onClick={() => setShowValidationSummary(false)}>×</button>
              </div>
              <div className="grnf-modal-body">
                <p className="grnf-modal-description">
                  Please fill in the following required fields before submitting:
                </p>
                <div className="grnf-validation-errors-list">
                  {validationErrors.map((error, idx) => (
                    <div key={idx} className="grnf-validation-error-item">
                      <div className="grnf-error-header">
                        <FaTimesCircle className="grnf-error-icon" />
                        <strong>{error.label}</strong>
                      </div>
                      <div className="grnf-error-message">{error.message}</div>
                    </div>
                  ))}
                </div>
                <div className="grnf-validation-tip">
                  <FaInfoCircle className="grnf-tip-icon" />
                  Please fix the errors above before submitting
                </div>
              </div>
              <div className="grnf-modal-footer">
                <button className="grnf-btn-cancel" onClick={() => setShowValidationSummary(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── API Error Display ────────────────────────────────────── */}
        {apiError && (
          <div className="grnf-api-error">
            <FaExclamationCircle className="grnf-error-icon" />
            <span>{apiError}</span>
            <button className="grnf-error-close" onClick={() => setApiError(null)}>×</button>
          </div>
        )}

        {/* ─── Header ────────────────────────────────────────────────── */}
        <div className="grnf-header">
          <button onClick={() => navigate('/grn')} className="grnf-back-btn">
            <FaArrowLeft size={9} /> Back
          </button>
          <div className="grnf-header-title">
            <h1>{isNew ? 'New Goods Receipt Note' : `${formData.grn_number}`}</h1>
          </div>
          <button type="button" onClick={handlePrint} className="grnf-print-btn">
            <FaPrint size={12} /> Print
          </button>
          {hasErrors && (
            <div className="grnf-error-badge">
              <FaExclamationTriangle size={12} />
              {getAllValidationErrors().length} missing field{getAllValidationErrors().length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <form onSubmit={handleSave}>

          {/* ─── Main Form Card ────────────────────────────────────────── */}
          <div className="grnf-card">

            {/* ─── Service Toggle ─────────────────────────────────────── */}
            <div className="grnf-service-toggle-row">
              <label className="grnf-checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isService}
                  onChange={(e) => handleServiceToggle(e.target.checked)}
                  disabled={submitting}
                  className="grnf-checkbox"
                />
                <span>Is Service Bill</span>
              </label>
            </div>

            {!formData.isService && (
              <div className="grnf-entry-mode-section">
                <div className="grnf-entry-mode-toggle">
                  <button
                    type="button"
                    className={`grnf-mode-btn${formData.entryMode === 'supplier' ? ' grnf-mode-btn-active' : ''}`}
                    onClick={() => handleEntryModeChange('supplier')}
                    disabled={submitting}
                  >
                    <FaFileInvoice size={12} /> By Purchase Order
                  </button>
                  <button
                    type="button"
                    className={`grnf-mode-btn${formData.entryMode === 'manual' ? ' grnf-mode-btn-active' : ''}`}
                    onClick={() => handleEntryModeChange('manual')}
                    disabled={submitting}
                  >
                    <FaSearch size={12} /> Direct Entry
                  </button>
                </div>
              </div>
            )}

            {/* ─── Compact Two-Column Layout ──────────────────────────── */}
            <div className="grnf-compact-layout">
              
              {/* Left Column - Receipt Information & Delivery Details */}
              <div className="grnf-left-column">
                {/* Party Selection (Customer/Supplier) */}
                <div className="grnf-info-section">
                  <div className="grnf-section-label">
                    {formData.isService ? 'Customer Details' : 'Supplier & Order Details'}
                  </div>
                  {formData.isService ? (
                    <div className="grnf-info-row">
                      <div className="grnf-info-field">
                        <label>Customer <span className="grnf-required">*</span></label>
                        <div className="grnf-warehouse-wrapper">
                          <input
                            ref={customerInputRef}
                            type="text"
                            value={customerSearchTerm}
                            onChange={(e) => {
                              setCustomerSearchTerm(e.target.value);
                              setShowCustomerDropdown(true);
                              setFormData(prev => ({ ...prev, customer: e.target.value, customerId: undefined }));
                              setIsDirty(true);
                            }}
                            onFocus={() => setShowCustomerDropdown(true)}
                            className={`grnf-form-field${errors.customer ? ' grnf-field-error' : ''}`}
                            placeholder="Search customer..."
                            disabled={submitting}
                            autoComplete="off"
                          />
                          {loadingCustomers && <FaSpinner className="grnf-warehouse-spinner grnf-spinning" size={14} />}
                          {showCustomerDropdown && filteredCustomers.length > 0 && (
                            <div ref={customerDropdownRef} className="grnf-warehouse-dropdown grnf-dropdown-large">
                              {filteredCustomers.map((customer) => (
                                <div
                                  key={customer.id}
                                  className="grnf-warehouse-item"
                                  onClick={() => handleCustomerSelect(customer)}
                                >
                                  <div className="grnf-warehouse-item-name">
                                    <FaUsers className="grnf-warehouse-item-icon" size={12} />
                                    {customer.customer_name}
                                  </div>
                                  <div className="grnf-warehouse-item-details">
                                    {customer.customer_group && <span>{customer.customer_group}</span>}
                                    {customer.mobile_no && <span><FaPhone size={10} /> {customer.mobile_no}</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grnf-info-field">
                        <label>Warehouse <span className="grnf-required">*</span></label>
                        <div className="grnf-warehouse-wrapper">
                          <input
                            ref={warehouseInputRef}
                            type="text"
                            value={warehouseSearchTerm}
                            onChange={(e) => {
                              setWarehouseSearchTerm(e.target.value);
                              setShowWarehouseDropdown(true);
                              setFormData(prev => ({ ...prev, warehouse: e.target.value, warehouseId: undefined }));
                              setIsDirty(true);
                            }}
                            onFocus={() => setShowWarehouseDropdown(true)}
                            className={`grnf-form-field${errors.warehouse ? ' grnf-field-error' : ''}`}
                            placeholder="Search warehouse..."
                            disabled={submitting}
                            autoComplete="off"
                          />
                          {loadingWarehouses && <FaSpinner className="grnf-warehouse-spinner grnf-spinning" size={14} />}
                          {showWarehouseDropdown && filteredWarehouses.length > 0 && (
                            <div ref={warehouseDropdownRef} className="grnf-warehouse-dropdown">
                              {filteredWarehouses.map((warehouse) => (
                                <div
                                  key={warehouse.id}
                                  className="grnf-warehouse-item"
                                  onClick={() => handleWarehouseSelect(warehouse)}
                                >
                                  <div className="grnf-warehouse-item-name">
                                    <FaWarehouse className="grnf-warehouse-item-icon" size={12} />
                                    {warehouse.warehouse_name}
                                  </div>
                                  <div className="grnf-warehouse-item-details">
                                    {warehouse.city && <span><FaMapMarkerAlt size={10} /> {warehouse.city}</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grnf-info-row">
                        <div className="grnf-info-field">
                          <label>Supplier <span className="grnf-required">*</span></label>
                          <div className="grnf-warehouse-wrapper">
                            <input
                              ref={supplierInputRef}
                              type="text"
                              value={supplierSearchTerm}
                              onChange={(e) => {
                                setSupplierSearchTerm(e.target.value);
                                setShowSupplierDropdown(true);
                                setFormData(prev => ({ ...prev, supplier: e.target.value, supplierId: undefined }));
                                setIsDirty(true);
                              }}
                              onFocus={() => setShowSupplierDropdown(true)}
                              className={`grnf-form-field${errors.supplier ? ' grnf-field-error' : ''}`}
                              placeholder="Search supplier..."
                              disabled={submitting}
                              autoComplete="off"
                            />
                            {loadingSuppliers && <FaSpinner className="grnf-warehouse-spinner grnf-spinning" size={14} />}
                            {showSupplierDropdown && filteredSuppliers.length > 0 && (
                              <div ref={supplierDropdownRef} className="grnf-warehouse-dropdown grnf-dropdown-large">
                                {filteredSuppliers.map((supplier) => (
                                  <div
                                    key={supplier.id}
                                    className="grnf-warehouse-item"
                                    onClick={() => handleSupplierSelect(supplier)}
                                  >
                                    <div className="grnf-warehouse-item-name">
                                      <FaBuilding className="grnf-warehouse-item-icon" size={12} />
                                      {supplier.supplier_name}
                                    </div>
                                    <div className="grnf-warehouse-item-details">
                                      {supplier.supplier_type && <span>{supplier.supplier_type}</span>}
                                      {supplier.mobile_no && <span><FaPhone size={10} /> {supplier.mobile_no}</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="grnf-info-field">
                          <label>Warehouse <span className="grnf-required">*</span></label>
                          <div className="grnf-warehouse-wrapper">
                            <input
                              ref={warehouseInputRef}
                              type="text"
                              value={warehouseSearchTerm}
                              onChange={(e) => {
                                setWarehouseSearchTerm(e.target.value);
                                setShowWarehouseDropdown(true);
                                setFormData(prev => ({ ...prev, warehouse: e.target.value, warehouseId: undefined }));
                                setIsDirty(true);
                              }}
                              onFocus={() => setShowWarehouseDropdown(true)}
                              className={`grnf-form-field${errors.warehouse ? ' grnf-field-error' : ''}`}
                              placeholder="Search warehouse..."
                              disabled={submitting}
                              autoComplete="off"
                            />
                            {loadingWarehouses && <FaSpinner className="grnf-warehouse-spinner grnf-spinning" size={14} />}
                            {showWarehouseDropdown && filteredWarehouses.length > 0 && (
                              <div ref={warehouseDropdownRef} className="grnf-warehouse-dropdown">
                                {filteredWarehouses.map((warehouse) => (
                                  <div
                                    key={warehouse.id}
                                    className="grnf-warehouse-item"
                                    onClick={() => handleWarehouseSelect(warehouse)}
                                  >
                                    <div className="grnf-warehouse-item-name">
                                      <FaWarehouse className="grnf-warehouse-item-icon" size={12} />
                                      {warehouse.warehouse_name}
                                    </div>
                                    <div className="grnf-warehouse-item-details">
                                      {warehouse.city && <span><FaMapMarkerAlt size={10} /> {warehouse.city}</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {formData.entryMode === 'supplier' && (
                        <div className="grnf-info-row">
                          <div className="grnf-info-field">
                            <label>Purchase Order <span className="grnf-required">*</span></label>
                            <div className="grnf-warehouse-wrapper">
                              <input
                                ref={poInputRef}
                                type="text"
                                value={poSearchTerm}
                                onChange={(e) => {
                                  setPOSearchTerm(e.target.value);
                                  setShowPODropdown(true);
                                  if (e.target.value !== formData.purchaseOrder) {
                                    setFormData(prev => ({ ...prev, purchaseOrder: '', purchaseOrderId: undefined }));
                                  }
                                  setIsDirty(true);
                                }}
                                onFocus={() => {
                                  setShowPODropdown(true);
                                  fetchPurchaseOrders();
                                }}
                                className={`grnf-form-field${errors.purchaseOrder ? ' grnf-field-error' : ''}`}
                                placeholder="Search PO..."
                                disabled={submitting}
                                autoComplete="off"
                              />
                              {loadingPOs && <FaSpinner className="grnf-warehouse-spinner grnf-spinning" size={14} />}
                              {showPODropdown && (
                                <div ref={poDropdownRef} className="grnf-warehouse-dropdown grnf-po-dropdown">
                                  {filteredPOs.length > 0 ? (
                                    filteredPOs.map(po => {
                                      const poItems = poItemsCache[po.id] || [];
                                      const isLoadingItems = loadingPOItems[po.id];
                                      const poDisplayName = getPODisplayName(po);
                                      
                                      const uniqueItems = poItems.reduce((acc, current) => {
                                        const exists = acc.find(item => item.item_code === current.item_code);
                                        if (!exists) {
                                          acc.push(current);
                                        }
                                        return acc;
                                      }, [] as POItem[]);
                                      
                                      return (
                                        <div
                                          key={po.id}
                                          className={`grnf-warehouse-item ${formData.purchaseOrderId === po.id ? 'grnf-warehouse-item-selected' : ''}`}
                                          onClick={() => handlePOSelect(po)}
                                          onMouseEnter={() => {
                                            if (!poItemsCache[po.id] && !loadingPOItems[po.id]) {
                                              fetchPOItems(po.id);
                                            }
                                          }}
                                        >
                                          <div className="grnf-warehouse-item-name" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                                            <FaFileInvoice className="grnf-warehouse-item-icon" size={12} />
                                            <span className="grnf-po-display-name">{poDisplayName}</span>
                                            <span className={`grnf-po-status-badge ${getPOStatusBadgeClass(po.status || '')}`}>
                                              {po.status || 'Unknown'}
                                            </span>
                                            {uniqueItems.length > 0 && (
                                              <>
                                                <span className="grnf-po-item-count" style={{ marginLeft: '4px' }}>
                                                  <FaBox size={10} /> {uniqueItems.length} item{uniqueItems.length !== 1 ? 's' : ''}
                                                </span>
                                                <div className="grnf-po-items-preview" style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px', alignItems: 'center' }}>
                                                  {uniqueItems.map((item, idx) => (
                                                    <div key={idx} className="grnf-po-item-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', background: '#f9fafb', padding: '1px 6px', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                                                      <span className="grnf-po-item-name" style={{ color: '#6b7280' }}>{item.item_name}</span>
                                                      <span className="grnf-po-item-qty" style={{ color: '#3b82f6', fontWeight: 500 }}>×{item.qty}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              </>
                                            )}
                                          </div>
                                          <div className="grnf-warehouse-item-details">
                                            <span>{po.supplier_name || 'N/A'}</span>
                                            <span>• {po.currency || 'INR'} {(po.grand_total || 0).toFixed(2)}</span>
                                            <span>• Received: {(po.per_received || 0)}%</span>
                                          </div>
                                          
                                          {isLoadingItems && (
                                            <div className="grnf-po-items-loading">
                                              <FaSpinner className="grnf-spinning" size={10} /> Loading items...
                                            </div>
                                          )}
                                          {!isLoadingItems && uniqueItems.length === 0 && (
                                            <div className="grnf-po-items-empty">
                                              <FaInfoCircle size={10} /> No items in this PO
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <div className="grnf-warehouse-no-results">No POs found</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="grnf-info-field"></div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Receipt Information Section */}
                <div className="grnf-info-section">
                  <div className="grnf-section-label">Receipt Information</div>
                  <div className="grnf-info-row">
                    <div className="grnf-info-field">
                      <label>GRN Date <span className="grnf-required">*</span></label>
                      <input
                        type="date"
                        value={formData.grnDate}
                        onChange={(e) => handleFieldChange('grnDate', e.target.value)}
                        className={`grnf-form-field${errors.grnDate ? ' grnf-field-error' : ''}`}
                        disabled={submitting}
                      />
                    </div>
                    <div className="grnf-info-field">
                      <label>Received By <span className="grnf-required">*</span></label>
                      <div className="grnf-warehouse-wrapper">
                        <input
                          ref={employeeInputRef}
                          type="text"
                          value={employeeSearchTerm}
                          onChange={(e) => {
                            setEmployeeSearchTerm(e.target.value);
                            setShowEmployeeDropdown(true);
                            setFormData(prev => ({ ...prev, receivedBy: e.target.value, receivedById: undefined }));
                            setIsDirty(true);
                          }}
                          onFocus={() => setShowEmployeeDropdown(true)}
                          className={`grnf-form-field${errors.receivedBy ? ' grnf-field-error' : ''}`}
                          placeholder="Search employee..."
                          disabled={submitting}
                          autoComplete="off"
                        />
                        {loadingEmployees && <FaSpinner className="grnf-warehouse-spinner grnf-spinning" size={14} />}
                        {showEmployeeDropdown && filteredEmployees.length > 0 && (
                          <div ref={employeeDropdownRef} className="grnf-warehouse-dropdown">
                            {filteredEmployees.map((employee) => (
                              <div
                                key={employee.id}
                                className="grnf-warehouse-item"
                                onClick={() => handleEmployeeSelect(employee)}
                              >
                                <div className="grnf-warehouse-item-name">
                                  <FaUserCircle className="grnf-warehouse-item-icon" size={12} />
                                  {employee.employee_name}
                                </div>
                                <div className="grnf-warehouse-item-details">
                                  {employee.designation && <span>{employee.designation}</span>}
                                  {employee.department && <span>• {employee.department}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Details Section */}
                <div className="grnf-info-section">
                  <div className="grnf-section-label">Delivery Details</div>
                  <div className="grnf-info-row">
                    <div className="grnf-info-field">
                      <label>Vehicle Number</label>
                      <input
                        type="text"
                        value={formData.vehicleNo}
                        onChange={(e) => handleFieldChange('vehicleNo', e.target.value)}
                        className="grnf-form-field"
                        placeholder="Enter vehicle number"
                        disabled={submitting}
                      />
                    </div>
                    <div className="grnf-info-field">
                      <label>Delivery Challan No.</label>
                      <input
                        type="text"
                        value={formData.deliveryChallanNo}
                        onChange={(e) => handleFieldChange('deliveryChallanNo', e.target.value)}
                        className="grnf-form-field"
                        placeholder="Enter challan number"
                        disabled={submitting}
                      />
                    </div>
                  </div>
                  <div className="grnf-info-row">
                    <div className="grnf-info-field">
                      <label>Invoice Number</label>
                      <input
                        type="text"
                        value={formData.invoiceNo}
                        onChange={(e) => handleFieldChange('invoiceNo', e.target.value)}
                        className="grnf-form-field"
                        placeholder="Enter invoice number"
                        disabled={submitting}
                      />
                    </div>
                    <div className="grnf-info-field"></div>
                  </div>
                </div>
              </div>

              {/* Right Column - Customer/Supplier Details Card */}
              <div className="grnf-right-column">
                {formData.isService && selectedCustomer ? (
                  <div className="grnf-party-detail-card">
                    <div className="grnf-party-card-header">
                      <FaUsers size={16} />
                      <span>Customer Details</span>
                    </div>
                    <div className="grnf-party-card-content">
                      <h3>{selectedCustomer.customer_name}</h3>
                      <div className="grnf-party-card-info">
                        {selectedCustomer.customer_type && (
                          <div className="grnf-party-info-item">
                            <span className="grnf-party-info-label">Type</span>
                            <span className="grnf-party-info-value">{selectedCustomer.customer_type}</span>
                          </div>
                        )}
                        {selectedCustomer.customer_group && (
                          <div className="grnf-party-info-item">
                            <span className="grnf-party-info-label">Group</span>
                            <span className="grnf-party-info-value">{selectedCustomer.customer_group}</span>
                          </div>
                        )}
                        {selectedCustomer.territory && (
                          <div className="grnf-party-info-item">
                            <span className="grnf-party-info-label">Territory</span>
                            <span className="grnf-party-info-value">{selectedCustomer.territory}</span>
                          </div>
                        )}
                        {selectedCustomer.mobile_no && (
                          <div className="grnf-party-info-item">
                            <span className="grnf-party-info-label">Mobile</span>
                            <span className="grnf-party-info-value">
                              <FaPhone size={10} /> {selectedCustomer.mobile_no}
                            </span>
                          </div>
                        )}
                        {selectedCustomer.email_id && (
                          <div className="grnf-party-info-item">
                            <span className="grnf-party-info-label">Email</span>
                            <span className="grnf-party-info-value">
                              <FaEnvelope size={10} /> {selectedCustomer.email_id}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : !formData.isService && selectedSupplier ? (
                  <div className="grnf-party-detail-card">
                    <div className="grnf-party-card-header">
                      <FaBuilding size={16} />
                      <span>Supplier Details</span>
                    </div>
                    <div className="grnf-party-card-content">
                      <h3>{selectedSupplier.supplier_name}</h3>
                      <div className="grnf-party-card-info">
                        {selectedSupplier.supplier_type && (
                          <div className="grnf-party-info-item">
                            <span className="grnf-party-info-label">Type</span>
                            <span className="grnf-party-info-value">{selectedSupplier.supplier_type}</span>
                          </div>
                        )}
                        {selectedSupplier.supplier_group && (
                          <div className="grnf-party-info-item">
                            <span className="grnf-party-info-label">Group</span>
                            <span className="grnf-party-info-value">{selectedSupplier.supplier_group}</span>
                          </div>
                        )}
                        {selectedSupplier.country && (
                          <div className="grnf-party-info-item">
                            <span className="grnf-party-info-label">Country</span>
                            <span className="grnf-party-info-value">
                              <FaGlobeAsia size={10} /> {selectedSupplier.country}
                            </span>
                          </div>
                        )}
                        {selectedSupplier.mobile_no && (
                          <div className="grnf-party-info-item">
                            <span className="grnf-party-info-label">Mobile</span>
                            <span className="grnf-party-info-value">
                              <FaPhone size={10} /> {selectedSupplier.mobile_no}
                            </span>
                          </div>
                        )}
                        {selectedSupplier.email_id && (
                          <div className="grnf-party-info-item">
                            <span className="grnf-party-info-label">Email</span>
                            <span className="grnf-party-info-value">
                              <FaEnvelope size={10} /> {selectedSupplier.email_id}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grnf-party-detail-card grnf-party-empty-card">
                    <div className="grnf-party-card-header">
                      {formData.isService ? (
                        <><FaUsers size={16} /><span>Customer Details</span></>
                      ) : (
                        <><FaBuilding size={16} /><span>Supplier Details</span></>
                      )}
                    </div>
                    <div className="grnf-party-card-content">
                      <div className="grnf-party-empty-state">
                        <FaInfoCircle size={24} />
                        <p>Select a {formData.isService ? 'customer' : 'supplier'} to view details</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delivery Charge Section */}
                <div className="grnf-party-detail-card">
                  <div className="grnf-party-card-header">
                    <FaMoneyBillWave size={16} />
                    <span>Delivery Charges</span>
                  </div>
                  <div className="grnf-party-card-content">
                    <div className="grnf-delivery-toggle">
                      <button
                        type="button"
                        className={`grnf-mode-btn${formData.freeDelivery ? ' grnf-mode-btn-active' : ''}`}
                        onClick={() => handleFieldChange('freeDelivery', true)}
                        disabled={submitting}
                      >
                        Free
                      </button>
                      <button
                        type="button"
                        className={`grnf-mode-btn${!formData.freeDelivery ? ' grnf-mode-btn-active' : ''}`}
                        onClick={() => handleFieldChange('freeDelivery', false)}
                        disabled={submitting}
                      >
                        Paid
                      </button>
                    </div>
                    {!formData.freeDelivery && (
                      <div className="grnf-delivery-amount">
                        <label>Amount <span className="grnf-required">*</span></label>
                        <DigitInput
                          value={formData.deliveryCharge}
                          onChange={(val) => handleFieldChange('deliveryCharge', val)}
                          placeholder="0"
                          maxLength={10}
                          disabled={submitting}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* ─── STATUS SECTION REMOVED ─────────────────────────── */}
                {/* The status dropdown has been removed from the UI */}

              </div>
            </div>

            {/* ─── Items Section ────────────────────────────────────────── */}
            <div className="grnf-items-section">
              <div className="grnf-items-header">
                <span className="grnf-section-title" style={{ marginBottom: 0, borderBottom: 'none' }}>Items</span>
                <div className="grnf-items-actions">
                  <button type="button" className="grnf-add-item-btn" onClick={addItem} disabled={submitting}>
                    <FaPlus size={12} /> Add Item
                  </button>
                </div>
              </div>

              {formData.items.length === 0 ? (
                <div className="grnf-empty-items">
                  <FaBox size={32} />
                  <p>No items added</p>
                  <span>
                    {formData.isService || formData.entryMode !== 'supplier'
                      ? 'Click "Add Item" and search the item master to add items.'
                      : 'Select a Supplier and Purchase Order above to fetch items'}
                  </span>
                </div>
              ) : (
                <div className="grnf-table-block">
                  <table className="grnf-items-table">
                    <thead>
                      <tr>
                        <th className="grnf-ith">#</th>
                        <th className="grnf-ith">Item Code <span className="grnf-required">*</span></th>
                        <th className="grnf-ith">Item Name <span className="grnf-required">*</span></th>
                        <th className="grnf-ith">HSN</th>
                        <th className="grnf-ith">Ordered QTY</th>
                        <th className="grnf-ith">Received QTY<span className="grnf-required">*</span></th>
                        <th className="grnf-ith">Rejected</th>
                        <th className="grnf-ith">UOM</th>
                        <th className="grnf-ith">Rate</th>
                        <th className="grnf-ith">GST <span className="grnf-required">*</span></th>
                        <th className="grnf-ith">SGST</th>
                        <th className="grnf-ith">CGST</th>
                        <th className="grnf-ith">Amount</th>
                        <th className="grnf-ith">Remarks</th>
                        <th className="grnf-ith grnf-ith-action">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, index) => {
                        const useItemSearch = formData.isService || formData.entryMode !== 'supplier';
                        const { sgst, cgst, total } = computeItemAmounts(item);
                        return (
                        <tr key={item.id} className="grnf-itr">
                          <td className="grnf-itd grnf-itd-no">{index + 1}</td>
                          <td className="grnf-itd">
                            <input
                              className="grnf-cell-input"
                              value={item.itemCode}
                              onChange={(e) => handleItemChange(index, 'itemCode', e.target.value)}
                              placeholder="Code"
                              disabled={submitting}
                            />
                          </td>
                          <td className="grnf-itd grnf-itd-relative">
                            <input
                              className="grnf-cell-input"
                              value={item.itemName}
                              onChange={(e) => {
                                handleItemChange(index, 'itemName', e.target.value);
                                if (useItemSearch) setActiveItemSearchIndex(index);
                              }}
                              onFocus={() => { if (useItemSearch) setActiveItemSearchIndex(index); }}
                              placeholder={useItemSearch ? 'Search item master...' : 'Name'}
                              disabled={submitting}
                              autoComplete="off"
                            />
                            {useItemSearch && activeItemSearchIndex === index && (
                              <div ref={itemSearchDropdownRef} className="grnf-item-search-dropdown">
                                {loadingItemsMaster && (
                                  <div className="grnf-warehouse-no-results">
                                    <FaSpinner className="grnf-spinning" size={12} /> Loading items...
                                  </div>
                                )}
                                {!loadingItemsMaster && filteredItemsMaster.length === 0 && (
                                  <div className="grnf-warehouse-no-results">
                                    <FaExclamationCircle size={12} /> No items found
                                  </div>
                                )}
                                {!loadingItemsMaster && filteredItemsMaster.slice(0, 15).map((master) => (
                                  <div
                                    key={master.id}
                                    className="grnf-warehouse-item"
                                    onClick={() => handleItemMasterSelect(index, master)}
                                  >
                                    <div className="grnf-warehouse-item-name">
                                      <FaBox className="grnf-warehouse-item-icon" size={12} />
                                      {master.item_name}
                                      {master.HSN && <span className="grnf-hsn-badge">HSN: {master.HSN}</span>}
                                    </div>
                                    <div className="grnf-warehouse-item-details">
                                      <span>{master.item_code}</span>
                                      <span>• {master.stock_uom}</span>
                                      <span>• Rate: {master.standard_rate}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="grnf-itd">
                            <input
                              className="grnf-cell-input"
                              value={item.hsn || ''}
                              onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
                              placeholder="HSN"
                              disabled={submitting}
                            />
                          </td>
                          <td className="grnf-itd">
                            <DigitInput
                              value={item.orderedQty}
                              onChange={(val) => handleItemChange(index, 'orderedQty', val)}
                              placeholder="0"
                              maxLength={10}
                              disabled={true}
                            />
                          </td>
                          <td className="grnf-itd">
                            <DigitInput
                              value={item.receivedQty}
                              onChange={(val) => handleItemChange(index, 'receivedQty', val)}
                              placeholder="0"
                              maxLength={10}
                              disabled={submitting}
                              required={true}
                            />
                          </td>
                          <td className="grnf-itd">
                            <DigitInput
                              value={item.rejectedQty}
                              onChange={(val) => handleItemChange(index, 'rejectedQty', val)}
                              placeholder="0"
                              maxLength={10}
                              disabled={submitting}
                            />
                          </td>
                          <td className="grnf-itd">
                            <input
                              className="grnf-cell-input"
                              value={item.uom}
                              onChange={(e) => handleItemChange(index, 'uom', e.target.value)}
                              placeholder="UOM"
                              disabled={submitting}
                            />
                          </td>
                          <td className="grnf-itd">
                            <DigitInput
                              value={item.rate}
                              onChange={(val) => handleItemChange(index, 'rate', val)}
                              placeholder="0"
                              maxLength={10}
                              disabled={submitting}
                            />
                          </td>
                          <td className="grnf-itd">
                            <select
                              className="grnf-cell-input"
                              value={item.taxId ?? ''}
                              onChange={(e) => handleItemTaxChange(index, parseInt(e.target.value))}
                              disabled={submitting || loadingTaxTypes}
                            >
                              <option value="" disabled>
                                {loadingTaxTypes ? 'Loading...' : 'Select GST'}
                              </option>
                              {taxTypes.map((tax) => (
                                <option key={tax.tax_id} value={tax.tax_id}>
                                  {tax.tax_type}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="grnf-itd grnf-itd-readonly">{sgst.toFixed(2)}</td>
                          <td className="grnf-itd grnf-itd-readonly">{cgst.toFixed(2)}</td>
                          <td className="grnf-itd grnf-itd-readonly grnf-itd-amount">{total.toFixed(2)}</td>
                          <td className="grnf-itd">
                            <input
                              className="grnf-cell-input"
                              value={item.remarks}
                              onChange={(e) => handleItemChange(index, 'remarks', e.target.value)}
                              placeholder="Remarks"
                              disabled={submitting}
                            />
                          </td>
                          <td className="grnf-itd">
                            <button
                              className="grnf-remove-item"
                              onClick={() => removeItem(index)}
                              type="button"
                              disabled={submitting || formData.items.length <= 1}
                            >
                              <FaTrash size={12} />
                            </button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* ─── Draft Items Section ───────────────────────────── */}
                  {draftItems.length > 0 && (
                    <div className="grnf-draft-items-section">
                      <div className="grnf-draft-items-header">
                        <h3>Draft Items</h3>
                        <span className="grnf-draft-badge">
                          <FaBox size={10} /> {draftItems.length} item{draftItems.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="grnf-draft-items-list">
                        {draftItems.map((item, index) => (
                          <div key={item.id} className="grnf-draft-item">
                            <div className="grnf-draft-item-left">
                              <span className="grnf-draft-item-index">#{index + 1}</span>
                              <span className="grnf-draft-item-name">{item.itemName || 'Unnamed Item'}</span>
                              <div className="grnf-draft-item-details">
                                <span>Code: {item.itemCode || 'N/A'}</span>
                                <span>Qty: <span className="grnf-draft-item-qty">{item.receivedQty}</span></span>
                                <span>UOM: {item.uom || 'N/A'}</span>
                                <span>Rate: {item.rate || 0}</span>
                              </div>
                            </div>
                            <div className="grnf-draft-item-right">
                              <span className="grnf-draft-item-status">Draft</span>
                              <button
                                className="grnf-draft-item-remove"
                                onClick={() => removeItem(formData.items.indexOf(item))}
                                type="button"
                                disabled={submitting}
                              >
                                <FaTrash size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ─── Bill Summary ─────────────────────────────────── */}
                  <div className="grnf-bill-summary">
                    <div className="grnf-bill-summary-title">
                      <FaReceipt size={14} /> Bill Summary
                    </div>
                    <div className="grnf-bill-summary-row">
                      <span>Subtotal</span>
                      <span>{billTotals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="grnf-bill-summary-row">
                      <span><FaPercentage size={10} /> Total SGST</span>
                      <span>{billTotals.sgst.toFixed(2)}</span>
                    </div>
                    <div className="grnf-bill-summary-row">
                      <span><FaPercentage size={10} /> Total CGST</span>
                      <span>{billTotals.cgst.toFixed(2)}</span>
                    </div>
                    <div className="grnf-bill-summary-row">
                      <span><FaMoneyBillWave size={10} /> Delivery Charges{formData.freeDelivery ? ' (Free)' : ''}</span>
                      <span>{deliveryChargeAmount.toFixed(2)}</span>
                    </div>
                    <div className="grnf-bill-summary-row grnf-bill-summary-total">
                      <span>Grand Total</span>
                      <span>{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* ─── Footer ────────────────────────────────────────────────── */}
          <div className="grnf-footer">
            <button
              type="button"
              onClick={() => navigate('/grn')}
              className="grnf-cancel-btn"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="grnf-print-footer-btn"
              disabled={submitting}
            >
              <FaPrint size={12} /> Print
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="grnf-submit-btn"
            >
              {submitting && <FaSpinner className="grnf-spinning" />}
              <FaSave size={12} />
              {isEditMode ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}