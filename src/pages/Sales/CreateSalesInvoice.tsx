import React, { useState, useEffect, useRef, useCallback } from 'react';

import ReactDOM from 'react-dom';
import {
  FaSave,
  FaTimes,
  FaPrint,
  FaPaperPlane,
  FaPlus,
  FaTrash,
  FaSpinner,
  FaChevronDown,
  FaArrowLeft,
  FaInfoCircle,
  FaCalculator,
  FaBuilding,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaExclamationTriangle,
  FaCheck,
  FaCheckCircle,
  FaCreditCard,
  FaCopy,
  FaCalendarAlt,
  FaClipboardList,
  FaExclamationCircle,
  FaQuestionCircle,
  FaFileAlt,
} from 'react-icons/fa';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import './CreateSalesInvoice.css';

// ===== INTERFACES =====

interface Customer {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  shippingAddress: string;
  gstin: string;
  contactPerson?: string;
  contactMobile?: string;
}

interface SalesOrder {
  id: number;
  customer: string;
  customer_name: string;
  company: string;
  transaction_date: string;
  delivery_date: string;
  total_qty: number;
  grand_total: number;
  status: string;
  creation: string;
  po_no?: string;
  po_date?: string;
  items?: Array<{
    item_code: string;
    description: string;
    qty: number;
    uom: string;
    rate: number;
    amount: number;
  }>;
}

interface Product {
  id: string;
  itemCode: string;
  itemName: string;
  hsn: string;
  description: string;
  unit: string;
  rate: number;
  tax: number;
  type: 'product' | 'service';
  stockUom?: string;
  standardRate?: number;
  creation?: string;
  modified?: string;
  modified_by?: string;
  fg_item?: number;
  fg_item_qty?: number;
  item_id?: number;
  warehouse?: string;
  transaction_date?: string;
  uom?: string;
  net_rate?: number;
  net_amount?: number;
  item_group?: string;
  income_account?: string;
  cost_center?: string;
}

interface TaxOption {
  tax_id: number;
  tax_type: string;
}

interface SalesBillItem {
  id: string;
  itemCode: string;
  itemName: string;
  hsn: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  tax: number;
  tax_id?: number;
  taxAmount: number;
  totalAmount: number;
  type: 'product' | 'service';
  deliveryChallanId?: string;
  stockStatus?: 'checking' | 'available' | 'insufficient' | 'unknown';
  availableQty?: number;
  itemGroup?: string;
  incomeAccount?: string;
  costCenter?: string;
  weightPerUnit?: number;
  weightUom?: string;
  serialNo?: string;
  batchNo?: string;
  discountPercentage?: number;
  discountAmount?: number;
  creation?: string;
  modified?: string;
  modified_by?: string;
  fg_item?: number;
  fg_item_qty?: number;
  item_id?: number;
  uom?: string;
  net_rate?: number;
  net_amount?: number;
  warehouse?: string;
  transaction_date?: string;
  inventoryId?: number;
}

interface PaymentScheduleRow {
  id: string;
  paymentTerm: string;
  dueDate: string;
  durationDays: number;
  invoicePortion: number;
  paymentAmount: number;
  paidAmount?: number;
  status?: string;
}

interface PaymentTermTemplate {
  id: string;
  name: string;
  description: string;
  schedules: Array<{
    paymentTerm: string;
    dueDays: number;
    invoicePortion: number;
  }>;
}

interface DeliveryChallanPaymentSchedule {
  id: number;
  reference_id: number;
  payment_term: string;
  due_date: string;
  due_days: number;
  invoice_portion: number;
  payment_amount: number;
  paid_amount: number;
  pending_amount: number;
  status: string;
}

interface DeliveryChallanItem {
  id?: number;
  item_code: string;
  item_name?: string;
  description: string;
  qty: number;
  uom: string;
  rate: number;
  amount: number;
  tax_id?: number;
  tax_rate?: number;
}

interface DeliveryChallanData {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_code: string;
  sales_order_id?: string;
  sales_order_number?: string;
  items?: DeliveryChallanItem[];
  posting_date: string;
  total_qty: number;
  grand_total: number;
  po_no?: string;
  po_date?: string;
  warehouse?: string;
  remarks?: string;
  customer_details?: {
    id: number;
    customer_name: string;
    customer_type: string;
    customer_group: string;
    territory: string;
    mobile_no: string;
    email_id: string;
    primary_address?: string;
    tax_id?: string;
    default_currency?: string;
    payment_terms?: string;
    disabled: number;
  };
  payment_schedule?: DeliveryChallanPaymentSchedule[];
  currency?: string;
}

interface SalesBillPayload {
  id?: string | number;
  customer: string;
  company: string;
  modified_by: string;
  customer_name: string;
  posting_date: string;
  due_date: string;
  currency: string;
  conversion_rate: number;
  selling_price_list: string;
  status: string;
  customer_address: string;
  contact_person: string;
  territory: string;
  remarks: string;
  total_taxes_and_charges: number;
  paid_amount: number;
  update_stock: number;
  is_pos: number;
  is_return: number;
  invoice_number: string;
  invoice_date: string;
  mode_of_payment: string;
  invoice_status: string;
  items: Array<{
    item_code: string;
    item_name: string;
    description: string;
    item_group: string;
    qty: number;
    rate: number;
    uom: string;
    actual_batch_qty: number;
    stock_uom: string;
    warehouse: string;
    income_account: string;
    cost_center: string;
    discount_percentage: number;
    weight_per_unit: number;
    weight_uom: string;
    serial_no?: string;
    batch_no?: string;
  }>;
  payment_schedule?: Array<{
    payment_term: string;
    due_date: string;
    due_days: number;
    invoice_portion: number;
    payment_amount: number;
    paid_amount: number;
    status: string;
  }>;
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

interface InventoryApiRecord {
  planned_qty: number;
  indented_qty: number;
  ordered_qty: number;
  reserved_qty: number;
  reserved_qty_for_production: number;
  reserved_qty_for_sub_contract: number;
  reserved_qty_for_production_plan: number;
  id: number;
  name: string;
  item_code: string;
  item_Id?: number;
  warehouse_Id?: number;
  warehouse_name?: string;
  actual_qty: number;
  reserved_stock?: number;
  projected_qty?: number;
  stock_uom?: string;
  company?: string;
  valuation_rate?: number;
  stock_value?: number;
  type?: string;
}

interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
  success: boolean;
}

// ===== HELPER FUNCTIONS =====

const daysBetween = (from: string, to: string): number => {
  if (!from || !to) return 0;
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  if (isNaN(a) || isNaN(b)) return 0;
  return Math.max(0, Math.round((b - a) / 86400000));
};

const addDays = (date: string, days: number): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const extractTaxValue = (taxType: string): number => {
  if (!taxType) return 0;
  const match = taxType.match(/(\d+)/);
  return match ? parseInt(match[0], 10) : 0;
};

const getTaxIdFromRate = (taxRate: number, taxOpts: TaxOption[]): number | undefined => {
  const taxOption = taxOpts.find(t => extractTaxValue(t.tax_type) === taxRate);
  return taxOption?.tax_id;
};

// ===== COMPANY DETAILS =====
const companyDetails = {
  name: 'Sculptor Tech Pvt Ltd',
  address: 'c-1006, gc, Pune, Maharashtra 411028, India',
  website: 'sculptortechpvtltd@gmail.com',
  email: 'jayeshwakle@sculptortechpvtltd.com',
  contact: '8668584275',
  gstin: '',
  stateName: 'Maharashtra',
  stateCode: '27',
  panNo: '',
  bankName: '',
  bankAccountNo: '',
  bankBranchIfsc: '',
  jurisdiction: 'PUNE',
};

// ===== AMOUNT IN WORDS HELPER =====
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const twoDigitWords = (n: number): string => {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
};

const threeDigitWords = (n: number): string => {
  if (n >= 100) {
    return ONES[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + twoDigitWords(n % 100) : '');
  }
  return twoDigitWords(n);
};

const numberToIndianWords = (value: number): string => {
  let num = Math.round(Math.abs(value));
  if (num === 0) return 'Zero';

  const crore = Math.floor(num / 10000000); num %= 10000000;
  const lakh = Math.floor(num / 100000); num %= 100000;
  const thousand = Math.floor(num / 1000); num %= 1000;
  const hundred = num;

  let out = '';
  if (crore) out += threeDigitWords(crore) + ' Crore ';
  if (lakh) out += threeDigitWords(lakh) + ' Lakh ';
  if (thousand) out += threeDigitWords(thousand) + ' Thousand ';
  if (hundred) out += threeDigitWords(hundred);

  return out.trim();
};

const formatPrintDate = (date: string): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = String(d.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
};

const escapeHtml = (val: unknown): string => {
  const s = val === null || val === undefined ? '' : String(val);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

// ===== PRINT TEMPLATE DATA =====
interface SalesInvoicePrintData {
  id: string | number;
  customer: string;
  customer_name: string;
  company: string;
  posting_date: string;
  due_date: string;
  currency: string;
  total_qty: number;
  total: number;
  net_total: number;
  grand_total: number;
  outstanding_amount: number;
  paid_amount: number;
  status: string;
  total_taxes_and_charges: number;
  remarks: string | null;
  items?: Array<{
    id?: number;
    item_code: string;
    item_name: string;
    description: string;
    item_group: string;
    qty: number;
    uom: string;
    stock_uom?: string;
    rate: number;
    amount: number;
  }>;
  payment_schedule?: Array<{
    payment_term: string;
    due_date: string;
    due_days: number;
    invoice_portion: number;
    payment_amount: number;
    payment_status?: string;
  }>;
  displayInvoiceNumber?: string;
}

// Formats a raw numeric/string invoice id into the SINV-##### display format
// used across the app (list page, print view, etc.)
const formatInvoiceNumber = (idVal: string | number): string => {
  const numId = typeof idVal === 'string' ? parseInt(idVal, 10) : idVal;
  if (idVal === undefined || idVal === null || isNaN(numId as number)) return String(idVal ?? '');
  return `SINV-${String(numId).padStart(5, '0')}`;
};

// Normalizes all response shapes returned by GET /sales-invoice/:id.
// The endpoint may return:
//   { success: true, data: { ...invoice } }
//   { success: 1, data: [{ ...invoice }] }
//   { success: 1, data: { data: [{ ...invoice }] } }
//   { data: { record: { ...invoice } } }
//   or the invoice object directly.
const extractSalesInvoiceRecord = (raw: any): any | null => {
  if (!raw) return null;

  const isInvoice = (value: any): boolean =>
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    (
      value.id !== undefined ||
      value.customer !== undefined ||
      Array.isArray(value.items) ||
      Array.isArray(value.payment_schedule)
    );

  const unwrap = (value: any, depth = 0): any | null => {
    if (!value || depth > 8) return null;

    if (isInvoice(value)) return value;

    if (Array.isArray(value)) {
      const firstInvoice = value.find(isInvoice);
      if (firstInvoice) return firstInvoice;
      for (const item of value) {
        const found = unwrap(item, depth + 1);
        if (found) return found;
      }
      return null;
    }

    if (typeof value === 'object') {
      // Prefer common wrapper keys first.
      for (const key of ['record', 'data', 'result', 'invoice', 'sales_invoice', 'salesInvoice', 'records']) {
        if (value[key] !== undefined) {
          const found = unwrap(value[key], depth + 1);
          if (found) return found;
        }
      }

      // Last resort: inspect nested object values.
      for (const key of Object.keys(value)) {
        const child = value[key];
        if (child && typeof child === 'object') {
          const found = unwrap(child, depth + 1);
          if (found) return found;
        }
      }
    }

    return null;
  };

  return unwrap(raw);
};

const SALESBILL_DRAFT_PREFIX = 'cnv_salesbill_draft:';

interface SalesBillDraftPayload {
  selectedDeliveryChallans: DeliveryChallanData[];
  selectedCustomer: string;
  selectedSalesOrder: string;
  isService: boolean;
  hasDeliveryChallan: boolean;
  billDate: string;
  dueDate: string;
  warehouse: string;
  invoiceNumber: string;
  invoiceDate: string;
  paymentMode: string;
  invoiceStatus: string;
  remarks: string;
  items: SalesBillItem[];
  customerData: Customer | null;
  isCustomerDisabled: boolean;
  paymentSchedule: PaymentScheduleRow[];
  selectedPaymentTemplate: string;
}

// ===== API SERVICE =====

class ApiService {
  private static instance: ApiService;

  private constructor() { }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      const response = await api.get(endpoint, { params });
      return {
        data: response.data,
        status: response.status,
        success: true,
        message: response.data?.message || 'Operation successful'
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await api.post(endpoint, data);
      return {
        data: response.data,
        status: response.status,
        success: true,
        message: response.data?.message || 'Operation successful'
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await api.put(endpoint, data);
      return {
        data: response.data,
        status: response.status,
        success: true,
        message: response.data?.message || 'Operation successful'
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await api.delete(endpoint);
      return {
        data: response.data,
        status: response.status,
        success: true,
        message: response.data?.message || 'Deletion successful'
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async patch<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await api.patch(endpoint, data);
      return {
        data: response.data,
        status: response.status,
        success: true,
        message: response.data?.message || 'Operation successful'
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  private handleError(error: any): ApiResponse {
    console.error('API Error:', error);

    let errorMessage = 'An unexpected error occurred';
    let statusCode = 500;

    if (error.response) {
      statusCode = error.response.status;
      errorMessage = error.response.data?.message ||
        error.response.data?.error ||
        error.response.statusText ||
        'Server error occurred';
    } else if (error.request) {
      errorMessage = 'Network error. Please check your connection.';
    } else {
      errorMessage = error.message || 'An unexpected error occurred';
    }

    return {
      data: null as any,
      status: statusCode,
      success: false,
      message: errorMessage
    };
  }
}

// ===== SALES BILL API =====

class SalesBillAPI {
  private apiService: ApiService;

  constructor() {
    this.apiService = ApiService.getInstance();
  }

  async createSalesBill(payload: SalesBillPayload): Promise<ApiResponse<any>> {
    return this.apiService.post('/sales-invoice', payload);
  }

  async submitSalesBill(name: string): Promise<ApiResponse<any>> {
    return this.apiService.post(`/sales-invoice/${name}/submit`, {});
  }

  async getSalesBill(id: string): Promise<ApiResponse<any>> {
    return this.apiService.get(`/sales-invoice/${id}`);
  }

  async getSalesBills(params?: Record<string, any>): Promise<ApiResponse<any[]>> {
    return this.apiService.get('/sales-invoice', params);
  }

 async updateSalesBill(data: Partial<SalesBillPayload>): Promise<ApiResponse<any>> {
  return this.apiService.put('/sales-invoice', data);
}

  async deleteSalesBill(id: string): Promise<ApiResponse<any>> {
    return this.apiService.delete(`/sales-invoice/${id}`);
  }

  async getCustomers(params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<any>> {
    return this.apiService.get('/customer', params);
  }

  async getSalesOrders(params?: { customer?: string; page?: number; limit?: number; search?: string }): Promise<ApiResponse<any>> {
    return this.apiService.get('/sales-order', params);
  }

  async getSalesOrderById(id: string | number): Promise<ApiResponse<any>> {
    return this.apiService.get(`/sales-order/${id}`);
  }

  async getItems(params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<any>> {
    return this.apiService.get('/item?type=product', params);
  }

  async getDeliveryChallans(params?: { customer?: string; page?: number; limit?: number; search?: string }): Promise<ApiResponse<any>> {
    return this.apiService.get('/delivery-note', params);
  }

  async getDeliveryChallanById(id: string): Promise<ApiResponse<any>> {
    return this.apiService.get(`/delivery-note/${id}`);
  }

  async getWarehouses(params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<any>> {
    return this.apiService.get('/warehouse', params);
  }

  async getWarehouseById(id: number): Promise<ApiResponse<any>> {
    return this.apiService.get(`/warehouse/${id}`);
  }

  async getInventory(params?: { item_code?: string }): Promise<ApiResponse<any>> {
    return this.apiService.get('/inventory?limit=1000', params);
  }

  async updateInventory(_id: number, data: any): Promise<ApiResponse<any>> {
    return this.apiService.put(`/inventory`, data);
  }

  async getTaxOptions(): Promise<ApiResponse<TaxOption[]>> {
    return this.apiService.get('/item/get-tax');
  }
}

// ===== SUCCESS MODAL COMPONENT =====
interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewDetails: () => void;
  salesBill: string;
  totalItems: number;
  message: string;
  customerName?: string;
  totalAmount?: number;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  onViewDetails,
  salesBill,
  totalItems,
  message,
  customerName,
  totalAmount
}) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="nsb-modal-overlay" onClick={onClose}>
      <div className="nsb-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="nsb-modal-success-icon">
          <FaCheckCircle size={48} />
        </div>

        <h2 className="nsb-modal-title">✓ Success!</h2>

        <p className="nsb-modal-message">{message}</p>

        <div className="nsb-modal-details">
          <div className="nsb-modal-detail-item">
            <span className="nsb-modal-detail-label">Sales Invoice</span>
            <span className="nsb-modal-detail-value nsb-modal-sb-number">{salesBill}</span>
          </div>

          {customerName && (
            <div className="nsb-modal-detail-item">
              <span className="nsb-modal-detail-label">Customer</span>
              <span className="nsb-modal-detail-value">{customerName}</span>
            </div>
          )}

          <div className="nsb-modal-detail-item">
            <span className="nsb-modal-detail-label">Total Items</span>
            <span className="nsb-modal-detail-value">{totalItems}</span>
          </div>

          {totalAmount !== undefined && (
            <div className="nsb-modal-detail-item">
              <span className="nsb-modal-detail-label">Total Amount</span>
              <span className="nsb-modal-detail-value" style={{ color: 'var(--primary-color, #2563eb)', fontWeight: 700 }}>
                ₹{totalAmount.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        <div className="nsb-modal-actions">
          <button onClick={onViewDetails} className="nsb-modal-btn nsb-modal-btn-primary">
            View Sales Bill
          </button>
          <button onClick={onClose} className="nsb-modal-btn nsb-modal-btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ===== SHARED: portal-based dropdown menu position hook =====
function useDropdownPosition(isOpen: boolean, triggerRef: React.RefObject<HTMLDivElement | null>) {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const recalc = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    }
  }, [triggerRef]);

  useEffect(() => {
    if (!isOpen) return;
    recalc();
    window.addEventListener('scroll', recalc, true);
    window.addEventListener('resize', recalc);
    return () => {
      window.removeEventListener('scroll', recalc, true);
      window.removeEventListener('resize', recalc);
    };
  }, [isOpen, recalc]);

  return pos;
}

// ===== SEARCHABLE PRODUCT SELECT COMPONENT =====
interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Product[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  onSearch?: (searchTerm: string) => Promise<void>;
  loading?: boolean;
  stockInfo?: { status: 'checking' | 'available' | 'insufficient' | 'unknown'; availableQty?: number };
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Search...',
  disabled = false,
  error = false,
  onSearch,
  loading = false,
  stockInfo,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<Product[]>(options);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const menuPos = useDropdownPosition(isOpen, wrapperRef);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredOptions(options);
      return;
    }

    const filtered = options.filter(opt =>
      opt.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opt.itemName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [searchTerm, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedTrigger = wrapperRef.current?.contains(target);
      const clickedMenu = menuRef.current?.contains(target);
      if (!clickedTrigger && !clickedMenu) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    setHighlightedIndex(-1);

    if (!isOpen) {
      setIsOpen(true);
    }

    if (onSearch && term.length > 0) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        onSearch(term).catch(err => console.error('Search error:', err));
      }, 500);
    }
  };

  const handleSelect = (option: Product) => {
    onChange(option.itemCode);
    setSearchTerm('');
    setIsOpen(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const getSelectedLabel = () => {
    const selected = options.find(opt => opt.itemCode === value);
    return selected ? `${selected.itemCode}` : '';
  };

  const getStockDisplay = () => {
    if (!stockInfo || !value) return null;
    if (stockInfo.status === 'checking') {
      return <span className="nsb-stock-indicator nsb-stock-checking"><FaSpinner className="nsb-spinning" size={8} /></span>;
    }
    if (stockInfo.status === 'available') {
      return <span className="nsb-stock-indicator nsb-stock-available"><FaCheckCircle size={8} /> {stockInfo.availableQty}</span>;
    }
    if (stockInfo.status === 'insufficient') {
      return <span className="nsb-stock-indicator nsb-stock-insufficient"><FaExclamationCircle size={8} /> {stockInfo.availableQty || 0}</span>;
    }
    return <span className="nsb-stock-indicator nsb-stock-unknown"><FaQuestionCircle size={8} /></span>;
  };

  const menu = isOpen ? (
    <div
      ref={menuRef}
      className="nsb-custom-scroll"
      style={{
        position: 'fixed',
        top: menuPos.top,
        left: menuPos.left,
        width: menuPos.width,
        background: 'var(--card-bg, #ffffff)',
        border: '0.5px solid var(--border-color, #e2e8f0)',
        borderRadius: '6px',
        boxShadow: '0 4px 16px var(--shadow-color, rgba(0,0,0,0.15))',
        zIndex: 99999,
        maxHeight: '220px',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}
    >
      {filteredOptions.length > 0 ? (
        filteredOptions.map((option, index) => (
          <div
            key={option.id}
            onMouseDown={(e) => {
              e.preventDefault();
              handleSelect(option);
            }}
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              background: highlightedIndex === index ? 'var(--nav-hover, #eff6ff)' : 'transparent',
              borderLeft: value === option.itemCode ? '2px solid var(--primary-color, #2563eb)' : '2px solid transparent',
              transition: 'background 0.15s',
              borderBottom: index < filteredOptions.length - 1 ? '0.5px solid var(--border-color, #f1f5f9)' : 'none'
            }}
            onMouseEnter={() => setHighlightedIndex(index)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 500, fontSize: '13px', color: 'var(--text-primary, #0f172a)' }}>{option.itemCode}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', marginLeft: '8px', textAlign: 'right' }}>
                ₹{option.rate}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary, #94a3b8)', marginTop: '2px' }}>
              {option.itemName} | HSN: {option.hsn || '-'} | Tax: {option.tax || 0}%
            </div>
          </div>
        ))
      ) : (
        <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary, #94a3b8)', fontSize: '12px' }}>
          {loading ? 'Loading...' : 'No items found'}
        </div>
      )}
    </div>
  ) : null;

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={isOpen ? searchTerm : getSelectedLabel()}
          onChange={handleSearchChange}
          onFocus={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          autoComplete="off"
          className="nsb-table-input"
          style={{
            width: '100%',
            padding: '4px 8px',
            paddingRight: '30px',
            border: error ? '0.5px solid var(--danger-color, #ef4444)' : '0.5px solid var(--border-color, #e2e8f0)',
            borderRadius: '4px',
            background: disabled ? 'var(--input-bg, #f3f4f6)' : 'var(--input-bg, #f8fafc)',
            color: 'var(--text-primary, #0f172a)',
            fontSize: '12px',
            fontFamily: 'inherit',
            cursor: disabled ? 'not-allowed' : 'text',
            minHeight: '30px',
            textAlign: 'left'
          }}
        />
        {loading ? (
          <FaSpinner className="nsb-spinning" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-color, #2563eb)', fontSize: '11px' }} />
        ) : (
          <FaChevronDown style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary, #94a3b8)', fontSize: '11px', pointerEvents: 'none' }} />
        )}
        {value && stockInfo && (
          <div style={{ position: 'absolute', right: '28px', top: '50%', transform: 'translateY(-50%)' }}>
            {getStockDisplay()}
          </div>
        )}
      </div>

      {menu && ReactDOM.createPortal(menu, document.body)}
    </div>
  );
};

// ===== SEARCHABLE CUSTOMER DROPDOWN =====
interface CustomerDropdownProps {
  value: string;
  onChange: (value: string, customerData?: Customer) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  presetCustomer?: Customer | null;

  onAddNew: (searchTerm: string) => void;
}

const CustomerDropdown: React.FC<CustomerDropdownProps> = ({
  value,
  onChange,
  placeholder = 'Search Customer...',
  disabled = false,
  error = false,
  presetCustomer = null,
  onAddNew,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const salesBillAPI = new SalesBillAPI();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const menuPos = useDropdownPosition(isOpen, wrapperRef);

  useEffect(() => {
    fetchCustomers('');
  }, []);

  useEffect(() => {
    if (!value) {
      setSelectedCustomer(null);
      return;
    }
    if (presetCustomer && presetCustomer.id === value) {
      setSelectedCustomer(prev => (prev && prev.id === presetCustomer.id ? prev : presetCustomer));
    }
  }, [value, presetCustomer]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const filtered = customers.filter(customer =>
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.gstin?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedTrigger = wrapperRef.current?.contains(target);
      const clickedMenu = menuRef.current?.contains(target);
      if (!clickedTrigger && !clickedMenu) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCustomers = async (search: string) => {
    setLoading(true);
    try {
      const response = await salesBillAPI.getCustomers({
        page: 1,
        limit: 50,
        search: search || undefined
      });

      if (response.success && response.data) {
        let customerList: any[] = [];

        if (response.data.data && Array.isArray(response.data.data.records)) {
          customerList = response.data.data.records;
        } else if (Array.isArray(response.data)) {
          customerList = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          customerList = response.data.data;
        }

        if (customerList.length > 0) {
          const mappedCustomers: Customer[] = customerList.map((cust: any) => ({
            id: cust.id?.toString() || cust.customer_id?.toString() || '',
            name: cust.customer_name || cust.name || '',
            code: cust.customer_code || cust.code || '',
            email: cust.email_id || cust.email || '',
            phone: cust.mobile_no || cust.phone || '',
            address: cust.address || '',
            shippingAddress: cust.shipping_address || cust.address || '',
            gstin: cust.gstin || '',
            contactPerson: cust.contact_person || '',
            contactMobile: cust.contact_mobile || cust.mobile_no || ''
          }));
          setCustomers(mappedCustomers);
          setFilteredCustomers(mappedCustomers);
        } else {
          setCustomers([]);
          setFilteredCustomers([]);
        }
      } else {
        setCustomers([]);
        setFilteredCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    setHighlightedIndex(-1);

    if (!isOpen) {
      setIsOpen(true);
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (term.length > 0) {
        fetchCustomers(term);
      } else {
        fetchCustomers('');
      }
    }, 500);
  };

  const handleSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSearchTerm('');
    setIsOpen(false);
    onChange(customer.id, customer);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleAddNewClick = () => {
    setIsOpen(false);
    onAddNew(searchTerm.trim());
  };

  const getDisplayValue = () => {
    if (selectedCustomer) {
      return `${selectedCustomer.name}`;
    }
    return '';
  };



  const menu = isOpen ? (
    <div
      ref={menuRef}
      className="nsb-custom-scroll"
      style={{
        position: 'fixed',
        top: menuPos.top,
        left: menuPos.left,
        width: menuPos.width,
        background: 'var(--card-bg, #ffffff)',
        border: '0.5px solid var(--border-color, #e2e8f0)',
        borderRadius: '6px',
        boxShadow: '0 4px 16px var(--shadow-color, rgba(0,0,0,0.15))',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '320px',
        overflow: 'hidden'
      }}
    >
      <div
        className="nsb-custom-scroll"
        style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          maxHeight: '260px'
        }}
      >
        {loading ? (
          <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary, #94a3b8)', fontSize: '12px' }}>
            <FaSpinner className="nsb-spinning" style={{ display: 'inline-block', marginRight: '8px' }} /> Loading...
          </div>
        ) : filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer, index) => (
            <div
              key={customer.id}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(customer);
              }}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                background: highlightedIndex === index ? 'var(--nav-hover, #eff6ff)' : 'transparent',
                borderLeft: value === customer.id ? '3px solid var(--primary-color, #2563eb)' : '3px solid transparent',
                transition: 'background 0.15s',
                borderBottom: index < filteredCustomers.length - 1 ? '0.5px solid var(--border-color, #f1f5f9)' : 'none'
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary, #0f172a)' }}>{customer.name}</span>
                </div>
                {customer.gstin && (
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary, #94a3b8)', background: 'var(--layout-bg, #f1f5f9)', padding: '2px 8px', borderRadius: '4px' }}>
                    GST: {customer.gstin}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '4px', fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
                {customer.contactPerson && (
                  <span><FaUser size={10} style={{ marginRight: '4px' }} />{customer.contactPerson}</span>
                )}
                {customer.phone && (
                  <span><FaPhone size={10} style={{ marginRight: '4px' }} />{customer.phone}</span>
                )}
                {customer.email && (
                  <span><FaEnvelope size={10} style={{ marginRight: '4px' }} />{customer.email}</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '16px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary, #94a3b8)', marginBottom: '10px' }}>
              {searchTerm.trim() ? (
                <>No customer found for &quot;<strong>{searchTerm.trim()}</strong>&quot;</>
              ) : (
                'No customers available'
              )}
            </div>

          </div>
        )}
      </div>

      {/* Persistent footer action so "Add New Customer" is always reachable,
          even when there are matching results to scroll through. */}
      <div
        className="cq-dropdown-add-new"
        onMouseDown={(e) => {
          e.preventDefault();
          handleAddNewClick();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          cursor: 'pointer',
          borderTop: '0.5px solid var(--border-color, #e2e8f0)',
          color: 'var(--primary-color, #2563eb)',
          fontWeight: 600,
          fontSize: '12px',
          background: 'var(--layout-bg, #f8fafc)',
          flexShrink: 0,
          transition: 'background 0.15s, color 0.15s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--nav-hover, #eff6ff)';
          e.currentTarget.style.color = 'var(--primary-color, #2563eb)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--layout-bg, #f8fafc)';
          e.currentTarget.style.color = 'var(--primary-color, #2563eb)';
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FaPlus size={10} />
        </span>

        <span>
          {searchTerm.trim() && filteredCustomers.length === 0
            ? `Add "${searchTerm.trim()}" as New Customer`
            : 'Add New Customer'}
        </span>
      </div>
    </div>
  ) : null;

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={isOpen ? searchTerm : getDisplayValue()}
          onChange={handleSearchChange}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
          autoComplete="off"
          style={{
            width: '100%',
            padding: '6px 10px',
            paddingRight: '35px',
            border: error ? '0.5px solid var(--danger-color, #ef4444)' : '0.5px solid var(--border-color, #e2e8f0)',
            borderRadius: '6px',
            background: disabled ? 'var(--input-bg, #f3f4f6)' : 'var(--input-bg, #f8fafc)',
            color: 'var(--text-primary, #0f172a)',
            fontSize: '13px',
            fontFamily: 'inherit',
            cursor: disabled ? 'not-allowed' : 'text',
            minHeight: '32px'
          }}
        />
        {loading ? (
          <FaSpinner className="nsb-spinning" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-color, #2563eb)', fontSize: '12px' }} />
        ) : (
          <FaChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary, #64748b)', fontSize: '12px', pointerEvents: 'none' }} />
        )}
      </div>

      {menu && ReactDOM.createPortal(menu, document.body)}
    </div>
  );
};

interface QuickAddCustomerModalProps {
  isOpen: boolean;
  prefillName?: string;
  onClose: () => void;
  onCreated: (customer: Customer) => void;
  onOpenFullForm: () => void;
}

const QuickAddCustomerModal: React.FC<QuickAddCustomerModalProps> = ({
  isOpen,
  prefillName = '',
  onClose,
  onCreated,
  onOpenFullForm,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [emailId, setEmailId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});


  const DEFAULT_CUSTOMER_TYPE = 'Company';
  const DEFAULT_CUSTOMER_GROUP = 'Commercial';

  useEffect(() => {
    if (isOpen) {
      setCustomerName(prefillName || '');
      setMobileNo('');
      setEmailId('');
      setErrors({});
    }
  }, [isOpen, prefillName]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!customerName.trim()) errs.customerName = 'Customer name is required';
    if (!mobileNo.trim()) errs.mobileNo = 'Mobile number is required';
    if (!emailId.trim()) {
      errs.emailId = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(emailId)) {
      errs.emailId = 'Enter a valid email address';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      // No separate contact-person name is collected here, so the contact
      // record reuses the customer name/mobile/email.
      const contactPayload = {
        first_name: customerName.trim(),
        last_name: '',
        contact_name: customerName.trim(),
        mobile_no: mobileNo.trim(),
        alternate_mobile: '',
        email_id: emailId.trim(),
        telephone: '',
        extension: '',
        is_primary: 1,
        is_billing_contact: 0,
        is_saler_contact: 1,
        remarks: '',
      };

      const payload = {
        customer_name: customerName.trim(),
        customer_group: DEFAULT_CUSTOMER_GROUP,
        territory: '',
        customer_type: DEFAULT_CUSTOMER_TYPE,
        mobile_no: mobileNo.trim(),
        email_id: emailId.trim(),
        customer_primary_address: '',
        primary_address: '',
        contacts: [contactPayload],
      };

      const response = await api.post('/customer', payload);
      if (response.data && response.data.success === 0) {
        throw new Error(response.data?.message || 'Failed to add customer');
      }

      const apiData = response?.data?.data;

      const created: Customer = {
        id: apiData?.id?.toString() || apiData?.name?.toString() || '',
        name: apiData?.customer_name || payload.customer_name,
        code: apiData?.customer_code || (apiData?.id != null ? `CUST-${apiData.id}` : ''),
        email: apiData?.email_id || payload.email_id,
        phone: apiData?.mobile_no || payload.mobile_no,
        address: apiData?.customer_primary_address || '',
        shippingAddress: apiData?.primary_address || '',
        gstin: '',
        contactPerson: contactPayload.contact_name,
        contactMobile: contactPayload.mobile_no,
      };

      toast.success(`Customer "${created.name}" added and selected`);
      onCreated(created);
    } catch (err: any) {
      console.error('Error quick-adding customer:', err);
      const message =
        err.response?.data?.message || err.message || 'Failed to add customer';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-secondary, #64748b)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px',
    display: 'block',
  };

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '7px 10px',
    border: hasError
      ? '1.5px solid var(--danger-color, #ef4444)'
      : '1.5px solid var(--border-color, #e2e8f0)',
    borderRadius: '8px',
    background: 'var(--card-bg, #ffffff)',
    color: 'var(--text-primary, #0f172a)',
    fontSize: '13px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    minHeight: '34px',
  });

  const fieldWrapStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '2px' };
  const errorTextStyle: React.CSSProperties = { fontSize: '10px', color: 'var(--danger-color, #ef4444)' };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(17, 24, 39, 0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--card-bg, #ffffff)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.18)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaUser style={{ color: 'var(--primary-color, #2563eb)' }} />
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
              Quick Add Customer
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: 'none',
              background: 'none',
              fontSize: '18px',
              color: 'var(--text-secondary, #6b7280)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={fieldWrapStyle}>
              <label style={labelStyle}>
                Customer Name <span style={{ color: 'var(--danger-color, #ef4444)' }}>*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                style={inputStyle(!!errors.customerName)}
                autoFocus
              />
              {errors.customerName && <span style={errorTextStyle}>{errors.customerName}</span>}
            </div>

            <div style={fieldWrapStyle}>
              <label style={labelStyle}>
                Mobile Number <span style={{ color: 'var(--danger-color, #ef4444)' }}>*</span>
              </label>
              <input
                type="tel"
                value={mobileNo}
                onChange={(e) => setMobileNo(e.target.value)}
                placeholder="Mobile number"
                style={inputStyle(!!errors.mobileNo)}
              />
              {errors.mobileNo && <span style={errorTextStyle}>{errors.mobileNo}</span>}
            </div>

            <div style={fieldWrapStyle}>
              <label style={labelStyle}>
                Email <span style={{ color: 'var(--danger-color, #ef4444)' }}>*</span>
              </label>
              <input
                type="email"
                value={emailId}
                onChange={(e) => setEmailId(e.target.value)}
                placeholder="Email address"
                style={inputStyle(!!errors.emailId)}
              />
              {errors.emailId && <span style={errorTextStyle}>{errors.emailId}</span>}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--border-color, #e2e8f0)',
              background: 'var(--layout-bg, #f8fafc)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={onOpenFullForm}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                background: 'transparent',
                border: '1px solid var(--border-color, #e2e8f0)',
                color: 'var(--primary-color, #2563eb)',
              }}
              title="Fill in the full customer form instead (customer type/group, contact person, address, etc.)"
            >
              <FaBuilding size={11} /> Add All Details
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 18px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: 'var(--card-bg, #ffffff)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  color: 'var(--text-secondary, #64748b)',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                  background: 'var(--primary-gradient, linear-gradient(135deg, #2563eb 0%, #1e40af 100%))',
                  border: 'none',
                  color: '#ffffff',
                }}
              >
                {submitting && <FaSpinner className="nsb-spinning" size={11} />}
                Add Customer
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// ===== MULTI-SELECT DELIVERY CHALLAN COMPONENT =====
interface MultiDeliveryChallanSelectProps {
  selectedDCs: DeliveryChallanData[];
  onSelect: (dcs: DeliveryChallanData[]) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  customerFilter?: string;
}

const MultiDeliveryChallanSelect: React.FC<MultiDeliveryChallanSelectProps> = ({
  selectedDCs,
  onSelect,
  placeholder = 'Search and select Delivery Challans...',
  disabled = false,
  error = false,
  customerFilter
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deliveryChallans, setDeliveryChallans] = useState<DeliveryChallanData[]>([]);
  const [filteredDCs, setFilteredDCs] = useState<DeliveryChallanData[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const salesBillAPI = new SalesBillAPI();

  const menuPos = useDropdownPosition(isOpen, wrapperRef);

  useEffect(() => {
    fetchDeliveryChallans();
  }, [customerFilter]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      let filtered = deliveryChallans;
      if (customerFilter) {
        filtered = filtered.filter(dc => dc.customer_id === customerFilter);
      }
      setFilteredDCs(filtered);
      return;
    }

    let filtered = deliveryChallans.filter(dc =>
      dc.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dc.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dc.customer_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dc.sales_order_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (customerFilter) {
      filtered = filtered.filter(dc => dc.customer_id === customerFilter);
    }

    setFilteredDCs(filtered);
  }, [searchTerm, deliveryChallans, customerFilter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedTrigger = wrapperRef.current?.contains(target);
      const clickedMenu = menuRef.current?.contains(target);
      if (!clickedTrigger && !clickedMenu) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchDeliveryChallans = async () => {
    setLoading(true);
    try {
      const params: any = { page: 1, limit: 100 };
      if (customerFilter) {
        params.customer = customerFilter;
      }

      const response = await salesBillAPI.getDeliveryChallans(params);

      if (response.success && response.data) {
        let dcList: any[] = [];
        if (response.data.data?.records) {
          dcList = response.data.data.records;
        } else if (Array.isArray(response.data)) {
          dcList = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          dcList = response.data.data;
        }
        if (dcList.length > 0) {
          const mappedDCs: DeliveryChallanData[] = dcList.map((dc: any) => ({
            id: dc.name || dc.id || '',
            customer_id: dc.customer_id?.toString() || '',
            customer_name: dc.customer_name || '',
            customer_code: dc.customer_code || '',
            sales_order_id: dc.sales_order_id?.toString() || '',
            sales_order_number: dc.sales_order_number || '',
            posting_date: dc.posting_date || dc.date || '',
            total_qty: dc.total_qty || 0,
            grand_total: dc.grand_total || 0,
            po_no: dc.po_no || '',
            po_date: dc.po_date || '',
            warehouse: dc.set_warehouse || dc.warehouse || '',
            items: dc.items || [],
            remarks: dc.instructions || dc.remarks || '',
            customer_details: dc.customer_details || null,
            payment_schedule: dc.payment_schedule || [],
            currency: dc.currency || ''
          }));
          setDeliveryChallans(mappedDCs);
          setFilteredDCs(mappedDCs);
        }
      }
    } catch (error) {
      console.error('Error fetching delivery challans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleToggleDC = (dc: DeliveryChallanData) => {
    const isSelected = selectedDCs.some(s => s.id === dc.id);
    let newSelected: DeliveryChallanData[];

    if (isSelected) {
      newSelected = selectedDCs.filter(s => s.id !== dc.id);
    } else {
      if (selectedDCs.length > 0 && selectedDCs[0].customer_id !== dc.customer_id) {
        toast.error('All delivery challans must belong to the same customer');
        return;
      }
      newSelected = [...selectedDCs, dc];
    }

    onSelect(newSelected);
    setIsOpen(false);
    setSearchTerm('');
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleRemoveDC = (dcId: string) => {
    onSelect(selectedDCs.filter(s => s.id !== dcId));
  };

  const getDisplayValue = () => {
    if (selectedDCs.length === 0) return '';
    if (selectedDCs.length === 1) return `${selectedDCs[0].id} - ${selectedDCs[0].customer_name}`;
    return `${selectedDCs.length} Delivery Challans selected`;
  };

  const isDCSelected = (dcId: string) => {
    return selectedDCs.some(s => s.id === dcId);
  };

  const menu = (isOpen && !disabled) ? (
    <div
      ref={menuRef}
      className="nsb-custom-scroll"
      style={{
        position: 'fixed',
        top: menuPos.top,
        left: menuPos.left,
        width: menuPos.width,
        background: 'var(--card-bg, #ffffff)',
        border: '0.5px solid var(--border-color, #e2e8f0)',
        borderRadius: '6px',
        boxShadow: '0 4px 16px var(--shadow-color, rgba(0,0,0,0.15))',
        zIndex: 99999,
        maxHeight: '300px',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}
    >
      {loading ? (
        <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary, #94a3b8)', fontSize: '12px' }}>
          <FaSpinner className="nsb-spinning" style={{ display: 'inline-block', marginRight: '8px' }} /> Loading...
        </div>
      ) : filteredDCs.length > 0 ? (
        filteredDCs.map((dc) => {
          const selected = isDCSelected(dc.id);
          return (
            <div
              key={dc.id}
              onMouseDown={(e) => {
                e.preventDefault();
                handleToggleDC(dc);
              }}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                background: selected ? 'color-mix(in srgb, var(--primary-color, #2563eb) 10%, transparent)' : 'transparent',
                borderLeft: selected ? '3px solid var(--primary-color, #2563eb)' : '3px solid transparent',
                transition: 'background 0.15s',
                borderBottom: '0.5px solid var(--border-color, #f1f5f9)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {selected && <FaCheck style={{ color: 'var(--primary-color, #2563eb)', fontSize: '12px' }} />}
                  <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary, #0f172a)' }}>
                    {dc.id}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary, #475569)' }}>
                    {dc.customer_name}
                  </span>
                </div>
                <span style={{
                  fontSize: '11px',
                  padding: '2px 10px',
                  borderRadius: '12px',
                  background: selected ? 'var(--primary-color, #2563eb)' : '#dbeafe',
                  color: selected ? '#fff' : '#1e40af',
                  fontWeight: 500
                }}>
                  {selected ? 'Selected' : (dc.sales_order_number || 'No SO')}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '4px', fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
                <span>Qty: {dc.total_qty}</span>
                <span>Total: ₹{dc.grand_total}</span>
                <span>Date: {new Date(dc.posting_date).toLocaleDateString()}</span>
              </div>
              {dc.items && dc.items.length > 0 && (
                <div style={{ fontSize: '10px', color: 'var(--text-secondary, #94a3b8)', marginTop: '4px' }}>
                  Items: {dc.items.map(i => `${i.item_code}(${i.qty})`).join(', ')}
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary, #94a3b8)', fontSize: '12px' }}>
          {searchTerm ? 'No matching delivery challans found' : 'No delivery challans available'}
          {customerFilter && ' for this customer'}
        </div>
      )}
    </div>
  ) : null;

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={isOpen ? searchTerm : getDisplayValue()}
          onChange={handleSearchChange}
          onFocus={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          autoComplete="off"
          className="nsb-input"
          style={{
            width: '100%',
            padding: '6px 10px',
            paddingRight: '35px',
            border: error ? '0.5px solid var(--danger-color, #ef4444)' : '0.5px solid var(--border-color, #e2e8f0)',
            borderRadius: '6px',
            background: disabled ? 'var(--input-bg, #f3f4f6)' : 'var(--input-bg, #f8fafc)',
            color: 'var(--text-primary, #0f172a)',
            fontSize: '13px',
            fontFamily: 'inherit',
            cursor: disabled ? 'not-allowed' : 'text',
            minHeight: '32px'
          }}
        />
        {loading ? (
          <FaSpinner className="nsb-spinning" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-color, #2563eb)', fontSize: '12px' }} />
        ) : (
          <FaChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: disabled ? 'var(--text-secondary, #94a3b8)' : 'var(--text-secondary, #64748b)', fontSize: '12px', pointerEvents: 'none' }} />
        )}
      </div>

      {selectedDCs.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
          {selectedDCs.map(dc => (
            <span
              key={dc.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '10px',
                background: 'color-mix(in srgb, var(--primary-color, #2563eb) 12%, transparent)',
                color: 'var(--primary-color, #2563eb)',
                border: '1px solid color-mix(in srgb, var(--primary-color, #2563eb) 25%, transparent)'
              }}
            >
              <FaCheckCircle size={8} />
              {dc.id}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveDC(dc.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary, #94a3b8)',
                  cursor: 'pointer',
                  padding: '0 2px',
                  fontSize: '10px'
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {menu && ReactDOM.createPortal(menu, document.body)}
    </div>
  );
};

// ===== SEARCHABLE WAREHOUSE SELECT COMPONENT =====
interface WarehouseSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  required?: boolean;
}

const WarehouseSelect: React.FC<WarehouseSelectProps> = ({
  value,
  onChange,
  placeholder = 'Select Warehouse...',
  disabled = false,
  error = false,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [filteredWarehouses, setFilteredWarehouses] = useState<Warehouse[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const salesBillAPI = new SalesBillAPI();

  const menuPos = useDropdownPosition(isOpen, wrapperRef);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredWarehouses(warehouses);
      return;
    }

    const filtered = warehouses.filter(wh =>
      wh.warehouse_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wh.id?.toString().includes(searchTerm) ||
      wh.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wh.state?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredWarehouses(filtered);
  }, [searchTerm, warehouses]);

  useEffect(() => {
    if (value) {
      const found = warehouses.find(wh => wh.id.toString() === value);
      setSelectedWarehouse(found || null);
    } else {
      setSelectedWarehouse(null);
    }
  }, [value, warehouses]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedTrigger = wrapperRef.current?.contains(target);
      const clickedMenu = menuRef.current?.contains(target);
      if (!clickedTrigger && !clickedMenu) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchWarehouses = async (search?: string) => {
    setLoading(true);
    try {
      const params: { page: number; limit: number; search?: string } = {
        page: 1,
        limit: 100
      };
      if (search) {
        params.search = search;
      }

      const response = await salesBillAPI.getWarehouses(params);

      if (response.success && response.data) {
        let whList: any[] = [];

        if (response.data.data?.records) {
          whList = response.data.data.records;
        } else if (Array.isArray(response.data.data)) {
          whList = response.data.data;
        } else if (Array.isArray(response.data)) {
          whList = response.data;
        } else if (response.data.records) {
          whList = response.data.records;
        }

        if (whList.length > 0) {
          const mappedWarehouses: Warehouse[] = whList.map((wh: any) => ({
            id: wh.id || 0,
            warehouse_name: wh.warehouse_name || wh.name || '',
            company: wh.company || '',
            parent_warehouse: wh.parent_warehouse || null,
            warehouse_type: wh.warehouse_type || null,
            city: wh.city || null,
            state: wh.state || null,
            email_id: wh.email_id || null,
            phone_no: wh.phone_no || null,
            disabled: wh.disabled || 0
          }));
          setWarehouses(mappedWarehouses);
          setFilteredWarehouses(mappedWarehouses);
        }
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    setHighlightedIndex(-1);

    if (!isOpen) {
      setIsOpen(true);
    }

    if (term.length > 2) {
      const timer = setTimeout(() => {
        fetchWarehouses(term);
      }, 300);
      return () => clearTimeout(timer);
    } else if (term.length === 0) {
      fetchWarehouses();
    }
  };

  const handleSelect = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setSearchTerm('');
    setIsOpen(false);
    onChange(warehouse.id.toString());
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const getDisplayValue = () => {
    if (selectedWarehouse) {
      return `${selectedWarehouse.warehouse_name}`;
    }
    return '';
  };

  const menu = (isOpen && !disabled) ? (
    <div
      ref={menuRef}
      className="nsb-custom-scroll"
      style={{
        position: 'fixed',
        top: menuPos.top,
        left: menuPos.left,
        width: menuPos.width,
        background: 'var(--card-bg, #ffffff)',
        border: '0.5px solid var(--border-color, #e2e8f0)',
        borderRadius: '6px',
        boxShadow: '0 4px 16px var(--shadow-color, rgba(0,0,0,0.15))',
        zIndex: 99999,
        maxHeight: '260px',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}
    >
      {loading ? (
        <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary, #94a3b8)', fontSize: '12px' }}>
          <FaSpinner className="nsb-spinning" style={{ display: 'inline-block', marginRight: '8px' }} /> Loading warehouses...
        </div>
      ) : filteredWarehouses.length > 0 ? (
        filteredWarehouses.map((wh, index) => (
          <div
            key={wh.id}
            onMouseDown={(e) => {
              e.preventDefault();
              handleSelect(wh);
            }}
            style={{
              padding: '10px 14px',
              cursor: 'pointer',
              background: highlightedIndex === index ? 'var(--nav-hover, #eff6ff)' : 'transparent',
              borderLeft: value === wh.id.toString() ? '3px solid var(--primary-color, #2563eb)' : '3px solid transparent',
              transition: 'background 0.15s',
              borderBottom: index < filteredWarehouses.length - 1 ? '0.5px solid var(--border-color, #f1f5f9)' : 'none'
            }}
            onMouseEnter={() => setHighlightedIndex(index)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary, #0f172a)' }}>
                {wh.warehouse_name}
              </span>
              {wh.city && (
                <span style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
                  {wh.city}{wh.state ? `, ${wh.state}` : ''}
                </span>
              )}
            </div>
            {wh.id && (
              <div style={{ fontSize: '11px', color: 'var(--text-secondary, #94a3b8)', marginTop: '2px' }}>
                ID: {wh.id} {wh.company ? `| ${wh.company}` : ''}
              </div>
            )}
          </div>
        ))
      ) : (
        <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary, #94a3b8)', fontSize: '12px' }}>
          {searchTerm ? 'No matching warehouses found' : 'No warehouses available'}
        </div>
      )}
    </div>
  ) : null;

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={isOpen ? searchTerm : getDisplayValue()}
          onChange={handleSearchChange}
          onFocus={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          autoComplete="off"
          className="nsb-input"
          style={{
            width: '100%',
            padding: '6px 10px',
            paddingRight: '35px',
            border: error ? '0.5px solid var(--danger-color, #ef4444)' : '0.5px solid var(--border-color, #e2e8f0)',
            borderRadius: '6px',
            background: disabled ? 'var(--input-bg, #f3f4f6)' : 'var(--input-bg, #f8fafc)',
            color: 'var(--text-primary, #0f172a)',
            fontSize: '13px',
            fontFamily: 'inherit',
            cursor: disabled ? 'not-allowed' : 'text',
            minHeight: '32px'
          }}
        />
        {loading ? (
          <FaSpinner className="nsb-spinning" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-color, #2563eb)', fontSize: '12px' }} />
        ) : (
          <FaChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: disabled ? 'var(--text-secondary, #94a3b8)' : 'var(--text-secondary, #64748b)', fontSize: '12px', pointerEvents: 'none' }} />
        )}
        {required && !value && !disabled && (
          <span style={{ position: 'absolute', right: '35px', top: '50%', transform: 'translateY(-50%)', color: 'var(--danger-color, #ef4444)', fontSize: '12px' }}>*</span>
        )}
      </div>

      {menu && ReactDOM.createPortal(menu, document.body)}
    </div>
  );
};

// ===== MAIN COMPONENT =====

const CreateSalesBill: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useAdminTheme();

  // Route param: present when the form is opened from "Edit" / "View" on the
  // Sales Invoice list (/sales-bill/edit/:id or /sales-bill/view/:id). Absent
  // for "New Sales Bill" (/sales-bill/new).
  const { id: routeId } = useParams<{ id?: string }>();
  const stateInvoiceId = (location.state as any)?.invoiceId;
  const id = routeId || (stateInvoiceId ? String(stateInvoiceId) : undefined);
  const isEditMode = !!id && location.pathname.includes('/edit/');
  const isViewMode = !!id && location.pathname.includes('/view/');
  const isExistingRecord = isEditMode || isViewMode;

  const getDraftStorageKey = () => `${SALESBILL_DRAFT_PREFIX}new`;

  const [selectedDeliveryChallans, setSelectedDeliveryChallans] = useState<DeliveryChallanData[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<string>('');
  const [, setSelectedOrderData] = useState<SalesOrder | null>(null);
  const [isService, setIsService] = useState<boolean>(false);
  const [hasDeliveryChallan, setHasDeliveryChallan] = useState<boolean>(true);
  const [billDate, setBillDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [warehouse, setWarehouse] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<string>('');
  const [invoiceStatus, setInvoiceStatus] = useState<string>('Draft');
  const [remarks, setRemarks] = useState<string>('');
  const [items, setItems] = useState<SalesBillItem[]>([]);
  const [customerData, setCustomerData] = useState<Customer | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [billNumber] = useState<string>(`SB-${new Date().getFullYear()}-001`);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState<boolean>(false);
  const [roundOff, setRoundOff] = useState<number>(0);
  const [isCustomerDisabled, setIsCustomerDisabled] = useState<boolean>(false);
  const [taxOptions, setTaxOptions] = useState<TaxOption[]>([]);
  const [loadingTaxOptions, setLoadingTaxOptions] = useState<boolean>(false);
  const [, setTaxOptionsLoaded] = useState<boolean>(false);
  const [inventoryMap, setInventoryMap] = useState<{ [itemCode: string]: InventoryApiRecord[] }>({});
  const [, setLoadingInventory] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // ─── Edit / View mode state ─────────────────────────────────────
  const [loadingInvoice, setLoadingInvoice] = useState<boolean>(false);
  const [existingInvoiceNumber, setExistingInvoiceNumber] = useState<string>('');
  const [pendingWarehouseName, setPendingWarehouseName] = useState<string>('');

  // ─── Quick Add Customer modal state ─────────────────────────────
  const [showQuickAddModal, setShowQuickAddModal] = useState<boolean>(false);
  const [quickAddPrefillName, setQuickAddPrefillName] = useState<string>('');

  // Success Modal state
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showPrintConfirmModal, setShowPrintConfirmModal] = useState<boolean>(false);
  const [printInvoiceId, setPrintInvoiceId] = useState<string | number | null>(null);
  const [successData, setSuccessData] = useState<{
    salesBill: string;
    totalItems: number;
    message: string;
    customerName?: string;
    totalAmount?: number;
  }>({
    salesBill: '',
    totalItems: 0,
    message: ''
  });

  // Payment Schedule state
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleRow[]>([
    { id: '1', paymentTerm: 'On Delivery', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], durationDays: 7, invoicePortion: 100, paymentAmount: 0, paidAmount: 0, status: 'Pending' }
  ]);
  const [selectedPaymentTemplate, setSelectedPaymentTemplate] = useState<string>('');

  const salesBillAPI = new SalesBillAPI();

  // ─── Payment Term Templates ──────────────────────────
  const paymentTermTemplates: PaymentTermTemplate[] = [
    {
      id: 'on_delivery',
      name: 'On Delivery',
      description: 'Full payment upon delivery',
      schedules: [
        { paymentTerm: 'On Delivery', dueDays: 0, invoicePortion: 100 }
      ]
    },
    {
      id: 'net_15',
      name: 'Net 15',
      description: 'Payment due in 15 days',
      schedules: [
        { paymentTerm: 'Net 15', dueDays: 15, invoicePortion: 100 }
      ]
    },
    {
      id: 'net_30',
      name: 'Net 30',
      description: 'Payment due in 30 days',
      schedules: [
        { paymentTerm: 'Net 30', dueDays: 30, invoicePortion: 100 }
      ]
    },
    {
      id: 'net_60',
      name: 'Net 60',
      description: 'Payment due in 60 days',
      schedules: [
        { paymentTerm: 'Net 60', dueDays: 60, invoicePortion: 100 }
      ]
    },
    {
      id: '50_50',
      name: '50% Advance + 50% On Delivery',
      description: '50% advance, 50% on delivery',
      schedules: [
        { paymentTerm: '50% Advance', dueDays: 0, invoicePortion: 50 },
        { paymentTerm: '50% On Delivery', dueDays: 0, invoicePortion: 50 }
      ]
    },
    {
      id: '30_70',
      name: '30% Advance + 70% On Delivery',
      description: '30% advance, 70% on delivery',
      schedules: [
        { paymentTerm: '30% Advance', dueDays: 0, invoicePortion: 30 },
        { paymentTerm: '70% On Delivery', dueDays: 0, invoicePortion: 70 }
      ]
    },
    {
      id: 'advanced',
      name: 'Advance Payment',
      description: 'Full payment in advance',
      schedules: [
        { paymentTerm: 'Advance Payment', dueDays: 0, invoicePortion: 100 }
      ]
    },
    {
      id: 'letter_of_credit',
      name: 'Letter of Credit (LC)',
      description: 'Payment via Letter of Credit',
      schedules: [
        { paymentTerm: 'Letter of Credit', dueDays: 30, invoicePortion: 100 }
      ]
    },
    {
      id: 'cod',
      name: 'Cash on Delivery (COD)',
      description: 'Cash payment upon delivery',
      schedules: [
        { paymentTerm: 'Cash on Delivery', dueDays: 0, invoicePortion: 100 }
      ]
    },
    {
      id: 'eom',
      name: 'End of Month (EOM)',
      description: 'Payment at end of month',
      schedules: [
        { paymentTerm: 'End of Month', dueDays: 0, invoicePortion: 100 }
      ]
    },
  ];

  // ─── Apply Payment Template ──────────────────────────
  const applyPaymentTemplate = (templateId: string) => {
    const template = paymentTermTemplates.find(t => t.id === templateId);
    if (!template) return;

    const grandTotal = getGrandTotalWithRound();
    const date = billDate || new Date().toISOString().split('T')[0];

    const schedules: PaymentScheduleRow[] = template.schedules.map((s, idx) => {
      const dueDate = addDays(date, s.dueDays);
      const amount = (s.invoicePortion / 100) * grandTotal;
      return {
        id: String(idx + 1),
        paymentTerm: s.paymentTerm,
        dueDate: dueDate || date,
        durationDays: s.dueDays,
        invoicePortion: s.invoicePortion,
        paymentAmount: amount,
        paidAmount: 0,
        status: 'Pending',
      };
    });

    setPaymentSchedule(schedules.length > 0 ? schedules : paymentSchedule);
    setSelectedPaymentTemplate(templateId);

    toast.success(`Applied "${template.name}" payment terms`);
  };

  // ─── Payment Schedule CRUD ──────────────────────────
  const addPaymentSchedule = () => {
    const newId = String(paymentSchedule.length + 1);
    setPaymentSchedule([
      ...paymentSchedule,
      {
        id: newId,
        paymentTerm: '',
        dueDate: '',
        durationDays: 0,
        invoicePortion: 0,
        paymentAmount: 0,
        paidAmount: 0,
        status: 'Pending'
      }
    ]);
  };

  const removePaymentSchedule = (index: number) => {
    if (paymentSchedule.length <= 1) return;
    setPaymentSchedule(paymentSchedule.filter((_, i) => i !== index));
  };

  const updatePaymentRow = (index: number, patch: Partial<PaymentScheduleRow>) => {
    const updated = [...paymentSchedule];
    updated[index] = { ...updated[index], ...patch };

    if (patch.invoicePortion !== undefined) {
      const grandTotal = getGrandTotalWithRound();
      updated[index].paymentAmount = (patch.invoicePortion / 100) * grandTotal;
    }

    setPaymentSchedule(updated);
  };

  const handlePaymentDueDateChange = (index: number, dueDate: string) => {
    const duration = daysBetween(billDate, dueDate);
    updatePaymentRow(index, { dueDate, durationDays: duration });
  };

  const handlePaymentDurationChange = (index: number, durationDays: number) => {
    const dueDate = addDays(billDate, durationDays);
    updatePaymentRow(index, { durationDays, dueDate });
  };

  // ─── Fetch Tax Options ─────────────────────────────
  const fetchTaxOptions = async () => {
    setLoadingTaxOptions(true);
    try {
      const response = await salesBillAPI.getTaxOptions();
      if (response.success && response.data) {
        let taxData: TaxOption[] = [];
        if (Array.isArray(response.data)) {
          taxData = response.data;
        } else {
          const nestedData = (response.data as any)?.data;
          if (Array.isArray(nestedData)) {
            taxData = nestedData;
          }
        }
        setTaxOptions(taxData);
        setTaxOptionsLoaded(true);
      } else {
        setTaxOptions([]);
        setTaxOptionsLoaded(true);
      }
    } catch (error) {
      console.error('Error fetching tax options:', error);
      setTaxOptions([]);
      setTaxOptionsLoaded(true);
    } finally {
      setLoadingTaxOptions(false);
    }
  };

  // ─── Fetch Inventory ──────────────────────────────
  const fetchInventory = async () => {
    setLoadingInventory(true);
    try {
      const response = await salesBillAPI.getInventory();
      const records = response.data?.data?.records || response.data || [];
      const map: { [itemCode: string]: InventoryApiRecord[] } = {};
      records.forEach((r: any) => {
        if (r.item_code) {
          const key = r.item_code.toUpperCase();
          if (!map[key]) {
            map[key] = [];
          }
          map[key].push({
            id: r.id,
            name: r.name,
            item_code: r.item_code,
            item_Id: r.item_Id,
            warehouse_Id: r.warehouse_Id,
            warehouse_name: r.warehouse_name,
            actual_qty: r.actual_qty || 0,
            reserved_stock: r.reserved_stock || 0,
            projected_qty: r.projected_qty || 0,
            stock_uom: r.stock_uom,
            company: r.company,
            valuation_rate: r.valuation_rate,
            stock_value: r.stock_value,
            type: r.type,
            planned_qty: 0,
            indented_qty: 0,
            ordered_qty: 0,
            reserved_qty: 0,
            reserved_qty_for_production: 0,
            reserved_qty_for_sub_contract: 0,
            reserved_qty_for_production_plan: 0
          });
        }
      });
      setInventoryMap(map);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoadingInventory(false);
    }
  };

  // ─── Get Stock Status ─────────────────────────────
  const getStockStatus = (itemCode: string, quantity: number): { status: 'checking' | 'available' | 'insufficient' | 'unknown'; availableQty?: number; inventoryRecords?: InventoryApiRecord[] } => {
    if (!itemCode) return { status: 'unknown' };
    const records = inventoryMap[itemCode.toUpperCase()];
    if (!records || records.length === 0) return { status: 'unknown' };

    const sorted = [...records].sort((a, b) => b.actual_qty - a.actual_qty);
    const bestRecord = sorted[0];

    return {
      status: (bestRecord.actual_qty ?? 0) >= quantity ? 'available' : 'insufficient',
      availableQty: bestRecord.actual_qty,
      inventoryRecords: records,
    };
  };

  // ─── Update Inventory Function ─────────────────────
  const updateInventory = async (itemsToUpdate: SalesBillItem[]): Promise<string[]> => {
    const updatePromises: Promise<any>[] = [];
    const failedUpdates: string[] = [];

    for (const item of itemsToUpdate) {
      if (item.type === 'service') continue;
      if (!item.inventoryId) {
        console.warn(`No inventory ID found for item: ${item.itemCode}`);
        continue;
      }
      if (item.quantity <= 0) continue;

      const records = inventoryMap[item.itemCode.toUpperCase()];
      if (!records || records.length === 0) {
        console.warn(`No inventory records found for item: ${item.itemCode}`);
        continue;
      }

      const record = records.find(r => r.id === item.inventoryId);
      if (!record) {
        console.warn(`Inventory record with id ${item.inventoryId} not found for item: ${item.itemCode}`);
        continue;
      }

      const currentQty = record.actual_qty || 0;
      const newQty = Math.max(0, currentQty - item.quantity);

      const updatePayload = {
        id: item.inventoryId,
        name: record.name,
        item_Id: record.item_Id,
        item_code: item.itemCode,
        warehouse_Id: record.warehouse_Id,
        actual_qty: newQty,
        planned_qty: record.planned_qty || 0,
        indented_qty: record.indented_qty || 0,
        ordered_qty: record.ordered_qty || 0,
        reserved_qty: record.reserved_qty || 0,
        reserved_qty_for_production: record.reserved_qty_for_production || 0,
        reserved_qty_for_sub_contract: record.reserved_qty_for_sub_contract || 0,
        reserved_qty_for_production_plan: record.reserved_qty_for_production_plan || 0,
        reserved_stock: record.reserved_stock || 0,
        stock_uom: record.stock_uom || 'Nos',
        company: record.company || 'SculptorTech Pvt Ltd',
        valuation_rate: record.valuation_rate || 0,
        type: record.type || 'Internal',
      };

      updatePromises.push(
        salesBillAPI.updateInventory(item.inventoryId, updatePayload)
          .then(() => {
            console.log(`Inventory updated for ${item.itemCode}: ${currentQty} -> ${newQty}`);
          })
          .catch((err) => {
            console.error(`Failed to update inventory for ${item.itemCode}:`, err);
            failedUpdates.push(item.itemCode);
          })
      );
    }

    if (updatePromises.length > 0) {
      await Promise.allSettled(updatePromises);
    }

    return failedUpdates;
  };

  // ─── Fetch existing invoice (Edit / View mode) ─────
  // Populates every field from GET /sales-invoice/:id so the form opens
  // pre-filled instead of blank.
  const populateFormFromInvoice = (record: any) => {
    const recordId = record.id ?? id ?? '';
    setExistingInvoiceNumber(formatInvoiceNumber(recordId));

    if (record.posting_date) setBillDate(String(record.posting_date).split('T')[0]);
    if (record.due_date) setDueDate(String(record.due_date).split('T')[0]);
    setRemarks(record.remarks || '');
    setInvoiceStatus(record.status || 'Draft');
    setInvoiceNumber(record.invoice_number || '');
    setInvoiceDate(
      record.invoice_date
        ? String(record.invoice_date).split('T')[0]
        : (record.posting_date ? String(record.posting_date).split('T')[0] : invoiceDate)
    );
    setPaymentMode(record.mode_of_payment || '');

    // No delivery-challan concept once an invoice already exists on its own.
    setHasDeliveryChallan(false);
    setSelectedDeliveryChallans([]);

    const custId = String(record.customer ?? record.customer_id ?? '');
    const custCode = String(record.customer_code ?? record.customer ?? '');
    const custData: Customer = {
      id: custId,
      name: record.customer_name || record.customer || '',
      code: custCode,
      email: '',
      phone: '',
      address: '',
      shippingAddress: '',
      gstin: '',
      contactPerson: '',
      contactMobile: '',
    };
    setCustomerData(custData);
    setSelectedCustomer(custId);
    setIsCustomerDisabled(false);

    const rawItems: any[] = Array.isArray(record.items) ? record.items : [];
    if (rawItems.length > 0) {
      const mappedItems: SalesBillItem[] = rawItems.map((it: any, idx: number) => {
        const qty = Number(it.qty ?? 0);
        const rate = Number(it.rate ?? 0);
        const amount = Number(it.amount ?? (qty * rate));
        const discountPercentage = Number(it.discount_percentage ?? 0);
        const discountAmount = Number(it.discount_amount ?? 0);

        // The sample API response does not return a per-item tax rate.
        // If a tax rate is supplied, use it; otherwise keep tax at 0.
        const itemTaxRate = Number(it.tax_rate ?? it.gst_rate ?? 0);
        const taxAmount = Number(
          it.tax_amount ??
          (it.net_amount !== undefined && it.amount !== undefined
            ? Math.max(0, Number(it.net_amount) - Number(it.amount))
            : (amount * itemTaxRate) / 100)
        );

        return {
          id: (it.id ?? idx + 1).toString(),
          itemCode: it.item_code || '',
          itemName: it.item_name || '',
          hsn: it.hsn || '',
          description: it.description || it.item_name || '',
          quantity: qty,
          unit: it.uom || it.stock_uom || 'pcs',
          rate: rate,
          amount: amount,
          tax: itemTaxRate,
          tax_id: undefined,
          taxAmount: taxAmount,
          totalAmount: amount + taxAmount,
          type: 'product',
          itemGroup: it.item_group || 'Products',
          incomeAccount: it.income_account || 'Sales - A',
          costCenter: it.cost_center || 'Main - A',
          weightPerUnit: it.weight_per_unit || 0,
          weightUom: 'kg',
          discountPercentage,
          discountAmount,
          warehouse: it.warehouse || '',
          item_id: it.item_id ?? undefined,
          uom: it.uom || it.stock_uom || 'pcs',
          net_rate: it.net_rate ?? undefined,
          net_amount: it.net_amount ?? undefined,
          transaction_date: it.transaction_date ?? undefined,
          serialNo: it.serial_no || '',
          batchNo: it.batch_no || '',
        };
      });
      setItems(mappedItems);

      // Warehouse comes back on the API as a name (e.g. "Finished Goods"),
      // but the form stores the warehouse *id*. Resolve it once the
      // warehouses list has loaded (see effect below).
      if (rawItems[0]?.warehouse) {
        setPendingWarehouseName(rawItems[0].warehouse);
      }
    }

    const rawSchedule: any[] = Array.isArray(record.payment_schedule) ? record.payment_schedule : [];
    if (rawSchedule.length > 0) {
      const mappedSchedule: PaymentScheduleRow[] = rawSchedule.map((ps: any, idx: number) => ({
        id: (ps.payment_id ?? idx + 1).toString(),
        paymentTerm: ps.payment_term || '',
        dueDate: ps.due_date ? String(ps.due_date).split('T')[0] : '',
        durationDays: ps.due_days || 0,
        invoicePortion: ps.invoice_portion || 0,
        paymentAmount: ps.payment_amount || 0,
        paidAmount: ps.paid_amount || 0,
        status: ps.payment_status || ps.status || 'Pending',
      }));
      setPaymentSchedule(mappedSchedule);
    }

    if (record.rounding_adjustment !== undefined && record.rounding_adjustment !== null) {
      setRoundOff(Number(record.rounding_adjustment) || 0);
    }

    setErrors({});
  };

  const fetchInvoiceForEdit = async (invoiceId: string) => {
    setLoadingInvoice(true);
    try {
      // IMPORTANT: call the single-invoice endpoint directly.
      // This guarantees that clicking View/Edit for invoice 35 requests:
      // GET /sales-invoice/35
      const response = await api.get(`/sales-invoice/${invoiceId}`);
      const record = extractSalesInvoiceRecord(response.data);

      if (!record) {
        console.error('Unexpected GET /sales-invoice/:id response:', response.data);
        toast.error(`Sales Invoice ${invoiceId} not found`);
        return;
      }

      populateFormFromInvoice(record);
    } catch (err: any) {
      console.error(`Error loading sales invoice ${invoiceId}:`, err);
      toast.error(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load sales invoice'
      );
    } finally {
      setLoadingInvoice(false);
    }
  };

  // ─── Effects ───────────────────────────────────────
  useEffect(() => {
    fetchTaxOptions();
    fetchInventory();
    fetchAllItems();
    fetchCustomers();
    fetchWarehouses();
  }, []);

  useEffect(() => {
    // Editing / viewing an existing Sales Invoice: load it from the API and
    // skip the "new bill" draft-restore / new-customer-navigation flow below.
    if (id) {
      fetchInvoiceForEdit(id);
      return;
    }

    const draftKey = getDraftStorageKey();
    try {
      const raw = sessionStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw) as SalesBillDraftPayload;
        if (draft) {
          setSelectedDeliveryChallans(draft.selectedDeliveryChallans || []);
          setSelectedCustomer(draft.selectedCustomer || '');
          setSelectedSalesOrder(draft.selectedSalesOrder || '');
          setIsService(!!draft.isService);
          setHasDeliveryChallan(draft.hasDeliveryChallan !== undefined ? draft.hasDeliveryChallan : true);
          if (draft.billDate) setBillDate(draft.billDate);
          if (draft.dueDate) setDueDate(draft.dueDate);
          if (draft.warehouse) setWarehouse(draft.warehouse);
          setInvoiceNumber(draft.invoiceNumber || '');
          if (draft.invoiceDate) setInvoiceDate(draft.invoiceDate);
          setPaymentMode(draft.paymentMode || '');
          setInvoiceStatus(draft.invoiceStatus || 'Draft');
          setRemarks(draft.remarks || '');
          if (draft.items && draft.items.length > 0) setItems(draft.items);
          if (draft.customerData) setCustomerData(draft.customerData);
          setIsCustomerDisabled(!!draft.isCustomerDisabled);
          if (draft.paymentSchedule && draft.paymentSchedule.length > 0) setPaymentSchedule(draft.paymentSchedule);
          setSelectedPaymentTemplate(draft.selectedPaymentTemplate || '');
        }
        sessionStorage.removeItem(draftKey);
      }
    } catch (e) {
      console.error('Failed to restore sales bill draft:', e);
    }

    const newCustomer = (location.state as any)?.newCustomer as Customer | undefined;
    if (newCustomer) {
      setSelectedCustomer(newCustomer.id);
      setCustomerData(newCustomer);
      toast.success(`Customer "${newCustomer.name}" added and selected`);
      // Clear the navigation state so a refresh or back/forward navigation
      // doesn't re-trigger the selection.
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Resolve the warehouse *name* that came back from the invoice API into a
  // warehouse *id* once the warehouses list has finished loading.
  useEffect(() => {
    if (!pendingWarehouseName || warehouses.length === 0) return;
    const target = pendingWarehouseName.trim().toLowerCase();
    const found = warehouses.find(
      w => w.warehouse_name?.trim().toLowerCase() === target
    );
    if (found) {
      setWarehouse(found.id.toString());
    } else {
      // Some installations return "Finished Goods - A" while the dropdown
      // contains "Finished Goods", or vice versa.
      const partial = warehouses.find(
        w =>
          w.warehouse_name?.trim().toLowerCase().includes(target) ||
          target.includes(w.warehouse_name?.trim().toLowerCase())
      );
      if (partial) setWarehouse(partial.id.toString());
    }
    setPendingWarehouseName('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouses, pendingWarehouseName]);

  // Update stock status when inventory changes
  useEffect(() => {
    if (Object.keys(inventoryMap).length === 0) return;
    setItems((prev) =>
      prev.map((item) => {
        if (!item.itemCode) return item;
        const { status, availableQty, inventoryRecords } = getStockStatus(item.itemCode, item.quantity);
        let inventoryId: number | undefined;
        if (inventoryRecords && inventoryRecords.length > 0) {
          const sorted = [...inventoryRecords].sort((a, b) => b.actual_qty - a.actual_qty);
          inventoryId = sorted[0]?.id;
        }
        return {
          ...item,
          stockStatus: status,
          availableQty,
          inventoryId: inventoryId || item.inventoryId,
        };
      })
    );
  }, [inventoryMap]);

  useEffect(() => {
    const total = getGrandTotal();
    const rounded = Math.round(total / 10) * 10;
    const diff = rounded - total;
    setRoundOff(diff);
  }, [items]);

  // Update payment amounts when grand total changes
  useEffect(() => {
    const grandTotal = getGrandTotalWithRound();
    setPaymentSchedule(prev =>
      prev.map(p => ({
        ...p,
        paymentAmount: (p.invoicePortion / 100) * grandTotal
      }))
    );
  }, [items, roundOff]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await salesBillAPI.getCustomers({ page: 1, limit: 100 });
      if (response.success && response.data) {
        let customerList: any[] = [];

        if (response.data.data && Array.isArray(response.data.data.records)) {
          customerList = response.data.data.records;
        } else if (Array.isArray(response.data)) {
          customerList = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          customerList = response.data.data;
        }

        if (customerList.length > 0) {
          const mappedCustomers: Customer[] = customerList.map((cust: any) => ({
            id: cust.id?.toString() || cust.customer_id?.toString() || '',
            name: cust.customer_name || cust.name || '',
            code: cust.customer_code || cust.code || '',
            email: cust.email_id || cust.email || '',
            phone: cust.mobile_no || cust.phone || '',
            address: cust.address || '',
            shippingAddress: cust.shipping_address || cust.address || '',
            gstin: cust.gstin || '',
            contactPerson: cust.contact_person || '',
            contactMobile: cust.contact_mobile || cust.mobile_no || ''
          }));
          setCustomers(mappedCustomers);
        }
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllItems = async () => {
    setIsLoadingItems(true);
    try {
      const response = await salesBillAPI.getItems({ page: 1, limit: 100 });
      if (response.success && response.data?.data) {
        const itemsData = response.data.data.map((item: any) => ({
          id: item.id?.toString() || item.name || '',
          itemCode: item.item_code || item.name || '',
          itemName: item.item_name || '',
          hsn: item.HSN || item.hsn || '',
          description: item.description || item.item_name || '',
          unit: item.stock_uom || 'pcs',
          rate: item.selling_price || 0,
          tax: item.gst_rate || item.tax_rate || 0,
          type: 'product' as 'product' | 'service',
          stockUom: item.stock_uom,
          standardRate: item.standard_rate,
          creation: item.creation,
          modified: item.modified,
          modified_by: item.modified_by,
          fg_item: item.fg_item,
          fg_item_qty: item.fg_item_qty,
          item_id: item.id,
          warehouse: item.warehouse,
          transaction_date: item.transaction_date,
          uom: item.uom,
          net_rate: item.net_rate,
          net_amount: item.net_amount,
          item_group: item.item_group || 'Products',
          income_account: item.income_account || 'Sales - A',
          cost_center: item.cost_center || 'Main - A'
        }));
        setAllProducts(itemsData);
        setProducts(itemsData);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await salesBillAPI.getWarehouses({ page: 1, limit: 100 });
      if (response.success && response.data) {
        let whList: any[] = [];
        if (response.data.data?.records) {
          whList = response.data.data.records;
        } else if (Array.isArray(response.data.data)) {
          whList = response.data.data;
        } else if (Array.isArray(response.data)) {
          whList = response.data;
        }
        if (whList.length > 0) {
          const mapped: Warehouse[] = whList.map((wh: any) => ({
            id: wh.id || 0,
            warehouse_name: wh.warehouse_name || wh.name || '',
            company: wh.company || '',
            parent_warehouse: wh.parent_warehouse || null,
            warehouse_type: wh.warehouse_type || null,
            city: wh.city || null,
            state: wh.state || null,
            email_id: wh.email_id || null,
            phone_no: wh.phone_no || null,
            disabled: wh.disabled || 0
          }));
          setWarehouses(mapped);

          // Only auto-pick "Finished Goods" for a brand new bill. When
          // editing/viewing, the invoice's own warehouse is resolved by the
          // pendingWarehouseName effect above.
          if (!id) {
            const finishedGoods = mapped.find(w => w.warehouse_name.toLowerCase() === 'finished goods');
            if (finishedGoods) {
              setWarehouse(finishedGoods.id.toString());
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const handleItemSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setProducts(allProducts);
      return;
    }

    try {
      const response = await salesBillAPI.getItems({ page: 1, limit: 50, search: searchTerm });
      if (response.success && response.data?.data) {
        const itemsData = response.data.data.map((item: any) => ({
          id: item.id?.toString() || item.name || '',
          itemCode: item.item_code || item.name || '',
          itemName: item.item_name || '',
          hsn: item.HSN || item.hsn || '',
          description: item.description || item.item_name || '',
          unit: item.stock_uom || 'pcs',
          rate: item.selling_price || 0,
          tax: item.gst_rate || item.tax_rate || 0,
          type: 'product' as 'product' | 'service',
          stockUom: item.stock_uom,
          standardRate: item.standard_rate,
          creation: item.creation,
          modified: item.modified,
          modified_by: item.modified_by,
          fg_item: item.fg_item,
          fg_item_qty: item.fg_item_qty,
          item_id: item.id,
          warehouse: item.warehouse,
          transaction_date: item.transaction_date,
          uom: item.uom,
          net_rate: item.net_rate,
          net_amount: item.net_amount,
          item_group: item.item_group || 'Products',
          income_account: item.income_account || 'Sales - A',
          cost_center: item.cost_center || 'Main - A'
        }));
        setProducts(itemsData);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  }, [allProducts]);

  // ─── Load Delivery Challans Data ──────────────────────
  const loadDeliveryChallansData = useCallback((dcs: DeliveryChallanData[]) => {
    if (dcs.length === 0) {
      setSelectedCustomer('');
      setCustomerData(null);
      setIsCustomerDisabled(false);
      setSelectedSalesOrder('');
      setSelectedOrderData(null);
      setItems([{
        id: '1',
        itemCode: '',
        itemName: '',
        hsn: '',
        description: '',
        quantity: 1,
        unit: 'pcs',
        rate: 0,
        amount: 0,
        tax: 0,
        tax_id: undefined,
        taxAmount: 0,
        totalAmount: 0,
        type: isService ? 'service' : 'product'
      }]);
      return;
    }

    const firstCustomer = dcs[0];
    const allSameCustomer = dcs.every(dc => dc.customer_id === firstCustomer.customer_id);
    if (!allSameCustomer) {
      toast.error('All delivery challans must belong to the same customer');
      return;
    }

    let autoFilledCustomer: Customer | null = null;

    const customerInList = customers.find(c => c.id === firstCustomer.customer_id || c.code === firstCustomer.customer_code);

    if (customerInList) {
      autoFilledCustomer = customerInList;
    } else if (firstCustomer.customer_details) {
      autoFilledCustomer = {
        id: firstCustomer.customer_details.id?.toString() || firstCustomer.customer_id || '',
        name: firstCustomer.customer_details.customer_name || firstCustomer.customer_name || '',
        code: firstCustomer.customer_code || '',
        email: firstCustomer.customer_details.email_id || '',
        phone: firstCustomer.customer_details.mobile_no || '',
        address: firstCustomer.customer_details.primary_address || '',
        shippingAddress: firstCustomer.customer_details.primary_address || '',
        gstin: firstCustomer.customer_details.tax_id || '',
        contactPerson: '',
        contactMobile: firstCustomer.customer_details.mobile_no || ''
      };
    } else {
      autoFilledCustomer = {
        id: firstCustomer.customer_id || '',
        name: firstCustomer.customer_name || '',
        code: firstCustomer.customer_code || '',
        email: '',
        phone: '',
        address: '',
        shippingAddress: '',
        gstin: '',
        contactPerson: '',
        contactMobile: ''
      };
    }

    setCustomerData(autoFilledCustomer);
    setSelectedCustomer(autoFilledCustomer.id);
    setIsCustomerDisabled(true);

    const finishedGoods = warehouses.find(w => w.warehouse_name.toLowerCase() === 'finished goods');
    if (finishedGoods) {
      setWarehouse(finishedGoods.id.toString());
    } else if (firstCustomer.warehouse) {
      setWarehouse(firstCustomer.warehouse);
    }

    const allRemarks = dcs.map(dc => dc.remarks || '').filter(r => r);
    if (allRemarks.length > 0) {
      setRemarks(allRemarks.join(' | '));
    }

    const dcWithSO = dcs.find(dc => dc.sales_order_id);
    if (dcWithSO && dcWithSO.sales_order_id) {
      setSelectedSalesOrder(dcWithSO.sales_order_id);
    }

    const allItems: SalesBillItem[] = [];
    dcs.forEach(dc => {
      if (dc.items && dc.items.length > 0) {
        dc.items.forEach((item, index) => {
          const product = allProducts.find(p => p.itemCode === item.item_code);

          const taxIdFromDC = (item as any).tax_id;
          let taxRate = 0;
          let taxId = taxIdFromDC;

          if (taxIdFromDC) {
            const taxOption = taxOptions.find(t => t.tax_id === taxIdFromDC);
            if (taxOption) {
              taxRate = extractTaxValue(taxOption.tax_type);
            } else if (product?.tax) {
              taxRate = product.tax;
              taxId = getTaxIdFromRate(taxRate, taxOptions);
            }
          } else if (product?.tax) {
            taxRate = product.tax;
            taxId = getTaxIdFromRate(taxRate, taxOptions);
          }

          const amount = (item.qty || 0) * (item.rate || 0);
          const taxAmount = (amount * taxRate) / 100;
          const { status, availableQty, inventoryRecords } = getStockStatus(item.item_code || '', item.qty || 0);
          let inventoryId: number | undefined;
          if (inventoryRecords && inventoryRecords.length > 0) {
            const sorted = [...inventoryRecords].sort((a, b) => b.actual_qty - a.actual_qty);
            inventoryId = sorted[0]?.id;
          }

          allItems.push({
            id: `dc-${dc.id}-${index}`,
            itemCode: item.item_code || '',
            itemName: product?.itemName || item.item_name || item.description || '',
            hsn: product?.hsn || '',
            description: product?.description || item.description || '',
            quantity: item.qty || 1,
            unit: item.uom || 'pcs',
            rate: item.rate || 0,
            amount: amount,
            tax: taxRate,
            tax_id: taxId,
            taxAmount: taxAmount,
            totalAmount: amount + taxAmount,
            type: isService ? 'service' : 'product',
            deliveryChallanId: dc.id,
            stockStatus: status,
            availableQty: availableQty,
            inventoryId: inventoryId,
            itemGroup: product?.item_group || 'Products',
            incomeAccount: product?.income_account || 'Sales - A',
            costCenter: product?.cost_center || 'Main - A',
            weightPerUnit: 0,
            weightUom: 'kg',
            creation: product?.creation,
            modified: product?.modified,
            modified_by: product?.modified_by,
            fg_item: product?.fg_item,
            fg_item_qty: product?.fg_item_qty,
            item_id: product?.item_id,
            uom: product?.uom,
            net_rate: product?.net_rate,
            net_amount: product?.net_amount,
            warehouse: product?.warehouse,
            transaction_date: product?.transaction_date,
          });
        });
      }
    });

    if (allItems.length > 0) {
      setItems(allItems);
      toast.success(`Loaded ${allItems.length} items from ${dcs.length} delivery challans`);
    } else {
      setItems([{
        id: '1',
        itemCode: '',
        itemName: '',
        hsn: '',
        description: '',
        quantity: 1,
        unit: 'pcs',
        rate: 0,
        amount: 0,
        tax: 0,
        tax_id: undefined,
        taxAmount: 0,
        totalAmount: 0,
        type: isService ? 'service' : 'product'
      }]);
      toast('No items found in selected delivery challans');
    }

    const firstDCPaymentSchedule = dcs[0].payment_schedule;

    if (firstDCPaymentSchedule && firstDCPaymentSchedule.length > 0) {
      const autoPaymentSchedule: PaymentScheduleRow[] = firstDCPaymentSchedule.map((ps, idx) => ({
        id: String(idx + 1),
        paymentTerm: ps.payment_term || '',
        dueDate: ps.due_date ? ps.due_date.split('T')[0] : '',
        durationDays: ps.due_days || 0,
        invoicePortion: ps.invoice_portion || 0,
        paymentAmount: ps.payment_amount || 0,
        paidAmount: ps.paid_amount || 0,
        status: ps.status || 'Pending'
      }));

      if (autoPaymentSchedule.length > 0) {
        setPaymentSchedule(autoPaymentSchedule);
        toast.success(`Auto-filled payment schedule with ${autoPaymentSchedule.length} terms from Delivery Challan`);
      }
    }

    setErrors({});
  }, [customers, allProducts, isService, taxOptions, warehouses]);

  const handleDeliveryChallansChange = (dcs: DeliveryChallanData[]) => {
    setSelectedDeliveryChallans(dcs);
    loadDeliveryChallansData(dcs);
  };

  const handleCustomerChange = (customerId: string, customerData?: Customer) => {
    setSelectedCustomer(customerId);
    if (customerId && customerData) {
      setCustomerData(customerData);
      if (errors.customer) setErrors(prev => ({ ...prev, customer: '' }));
    } else {
      setCustomerData(null);
      setSelectedSalesOrder('');
      setSelectedOrderData(null);
    }
  };

  const handleAddNewCustomer = (prefillName: string) => {
    setQuickAddPrefillName(prefillName || '');
    setShowQuickAddModal(true);
  };

  const navigateToFullCustomerForm = (prefillName: string) => {
    try {
      const draftPayload: SalesBillDraftPayload = {
        selectedDeliveryChallans,
        selectedCustomer,
        selectedSalesOrder,
        isService,
        hasDeliveryChallan,
        billDate,
        dueDate,
        warehouse,
        invoiceNumber,
        invoiceDate,
        paymentMode,
        invoiceStatus,
        remarks,
        items,
        customerData,
        isCustomerDisabled,
        paymentSchedule,
        selectedPaymentTemplate,
      };
      sessionStorage.setItem(getDraftStorageKey(), JSON.stringify(draftPayload));
    } catch (e) {
      console.error('Failed to save sales bill draft before navigating to Add Customer:', e);
    }

    navigate('/customer/add', {
      state: {
        returnTo: location.pathname,
        prefillCustomerName: prefillName || '',
      },
    });
  };

  const addItem = () => {
    const newItem: SalesBillItem = {
      id: Date.now().toString(),
      itemCode: '',
      itemName: '',
      hsn: '',
      description: '',
      quantity: 1,
      unit: 'pcs',
      rate: 0,
      amount: 0,
      tax: 0,
      tax_id: undefined,
      taxAmount: 0,
      totalAmount: 0,
      type: isService ? 'service' : 'product',
      itemGroup: 'Products',
      incomeAccount: 'Sales - A',
      costCenter: 'Main - A',
      weightPerUnit: 0,
      weightUom: 'kg'
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) {
      toast.error('At least one item is required');
      return;
    }
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof SalesBillItem, value: any) => {
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };

          if (field === 'itemCode') {
            const product = allProducts.find(p => p.itemCode === value);
            if (product) {
              const taxRate = product.tax || 0;
              const tax_id = getTaxIdFromRate(taxRate, taxOptions);
              const amount = (updated.quantity || 0) * product.rate;
              const taxAmount = (amount * taxRate) / 100;
              const { status, availableQty, inventoryRecords } = getStockStatus(product.itemCode, updated.quantity || 0);
              let inventoryId: number | undefined;
              if (inventoryRecords && inventoryRecords.length > 0) {
                const sorted = [...inventoryRecords].sort((a, b) => b.actual_qty - a.actual_qty);
                inventoryId = sorted[0]?.id;
              }

              updated.itemName = product.itemName || '';
              updated.hsn = product.hsn || '';
              updated.description = product.description || '';
              updated.unit = product.unit;
              updated.rate = product.rate;
              updated.tax = taxRate;
              updated.tax_id = tax_id;
              updated.amount = amount;
              updated.taxAmount = taxAmount;
              updated.totalAmount = amount + taxAmount;
              updated.stockStatus = status;
              updated.availableQty = availableQty;
              updated.inventoryId = inventoryId;
              updated.itemGroup = product.item_group || 'Products';
              updated.incomeAccount = product.income_account || 'Sales - A';
              updated.costCenter = product.cost_center || 'Main - A';
              updated.weightPerUnit = 0;
              updated.weightUom = 'kg';
              updated.creation = product.creation;
              updated.modified = product.modified;
              updated.modified_by = product.modified_by;
              updated.fg_item = product.fg_item;
              updated.fg_item_qty = product.fg_item_qty;
              updated.item_id = product.item_id;
              updated.uom = product.uom;
              updated.net_rate = product.net_rate;
              updated.net_amount = product.net_amount;
              updated.warehouse = product.warehouse;
              updated.transaction_date = product.transaction_date;
            }
          }

          if (field === 'quantity') {
            const amount = (updated.quantity || 0) * (updated.rate || 0);
            const taxRate = updated.tax || 0;
            const taxAmount = (amount * taxRate) / 100;
            updated.amount = amount;
            updated.taxAmount = taxAmount;
            updated.totalAmount = amount + taxAmount;

            if (updated.itemCode) {
              const { status, availableQty, inventoryRecords } = getStockStatus(updated.itemCode, updated.quantity || 0);
              let inventoryId: number | undefined;
              if (inventoryRecords && inventoryRecords.length > 0) {
                const sorted = [...inventoryRecords].sort((a, b) => b.actual_qty - a.actual_qty);
                inventoryId = sorted[0]?.id;
              }
              updated.stockStatus = status;
              updated.availableQty = availableQty;
              updated.inventoryId = inventoryId || updated.inventoryId;
            }
          }

          if (field === 'rate') {
            const amount = (updated.quantity || 0) * (updated.rate || 0);
            const taxRate = updated.tax || 0;
            const taxAmount = (amount * taxRate) / 100;
            updated.amount = amount;
            updated.taxAmount = taxAmount;
            updated.totalAmount = amount + taxAmount;
          }

          if (field === 'tax') {
            const taxRate = Number(value) || 0;
            const tax_id = getTaxIdFromRate(taxRate, taxOptions);
            const amount = (updated.quantity || 0) * (updated.rate || 0);
            const taxAmount = (amount * taxRate) / 100;
            updated.tax = taxRate;
            updated.tax_id = tax_id;
            updated.taxAmount = taxAmount;
            updated.totalAmount = amount + taxAmount;
          }

          return updated;
        }
        return item;
      })
    );
  };

  const getTotalQty = () => items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const getTotalAmount = () => items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const getTotalTax = () => items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
  const getGrandTotal = () => items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
  const getGrandTotalWithRound = () => getGrandTotal() + roundOff;

  const buildPayload = (status: 'Draft' | 'Submitted'): SalesBillPayload => {
    const selectedWarehouse = warehouses.find(w => w.id.toString() === warehouse);
    const warehouseName = selectedWarehouse?.warehouse_name || 'Finished Goods - A';

    return {

      customer: customerData?.code || customerData?.id || '',
      company: 'SculptERP Pvt Ltd',
      modified_by: 'Administrator',
      customer_name: customerData?.name || '',
      posting_date: billDate,
      due_date: dueDate || '',
      currency: 'INR',
      conversion_rate: 1,
      selling_price_list: 'Standard Selling',
      status: status,
      customer_address: customerData?.address || '',
      contact_person: customerData?.contactPerson || '',
      territory: 'Maharashtra',
      remarks: remarks || '',
      total_taxes_and_charges: getTotalTax(),
      paid_amount: 0,
      update_stock: 1,
      is_pos: 0,
      is_return: 0,
      invoice_number: invoiceNumber || '',
      invoice_date: invoiceDate || '',
      mode_of_payment: paymentMode || '',
      invoice_status: invoiceStatus || 'Draft',
      items: items
        .filter(item => item.itemCode && item.quantity > 0)
        .map(item => ({
          item_code: item.itemCode,
          item_name: item.itemName || item.itemCode,
          description: item.description || item.itemName || item.itemCode,
          item_group: item.itemGroup || 'Products',
          qty: item.quantity,
          rate: item.rate,
          uom: item.unit,
          actual_batch_qty: item.quantity,
          stock_uom: item.unit,
          warehouse: warehouseName,
          income_account: item.incomeAccount || 'Sales - A',
          cost_center: item.costCenter || 'Main - A',
          discount_percentage: item.discountPercentage || 0,
          weight_per_unit: item.weightPerUnit || 0,
          weight_uom: item.weightUom || 'kg',
          ...(item.serialNo && { serial_no: item.serialNo }),
          ...(item.batchNo && { batch_no: item.batchNo })
        })),
      payment_schedule: paymentSchedule.map(p => ({
        payment_term: p.paymentTerm || 'On Delivery',
        due_date: p.dueDate || billDate,
        due_days: p.durationDays || daysBetween(billDate, p.dueDate || billDate),
        invoice_portion: p.invoicePortion || 100,
        payment_amount: p.paymentAmount || 0,
        paid_amount: p.paidAmount || 0,
        status: p.status || 'Pending',
      }))
    };
  };

  const buildUpdatePayload = (
  status: 'Draft' | 'Submitted',
  invoiceId: string
) => {
  const payload = buildPayload(status);

  return {
    id: invoiceId,

    customer: payload.customer,
    company: payload.company,
    modified_by: payload.modified_by,
    customer_name: payload.customer_name,

    posting_date: payload.posting_date,
    due_date: payload.due_date,

    currency: payload.currency,
    conversion_rate: payload.conversion_rate,
    selling_price_list: payload.selling_price_list,

    status: payload.status,

    customer_address: payload.customer_address,
    contact_person: payload.contact_person,
    territory: payload.territory,
    remarks: payload.remarks,

    total_taxes_and_charges: payload.total_taxes_and_charges,
    paid_amount: payload.paid_amount,

    update_stock: payload.update_stock,
    is_pos: payload.is_pos,
    is_return: payload.is_return,

  };
};

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (hasDeliveryChallan && selectedDeliveryChallans.length === 0) {
      newErrors.deliveryChallan = 'Please select at least one Delivery Challan';
    }
    if (!hasDeliveryChallan && !selectedCustomer) {
      newErrors.customer = 'Please select a Customer';
    }
    if (!billDate) newErrors.billDate = 'Bill Date is required';
    if (!dueDate) newErrors.dueDate = 'Due Date is required';
    if (!warehouse) newErrors.warehouse = 'Please select a Warehouse';
    const hasItems = items.some(item => item.itemCode && item.quantity > 0);
    if (!hasItems) newErrors.items = 'At least one item is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    const toastId = toast.loading(isEditMode ? 'Updating sales bill...' : 'Creating sales bill...');
    try {
      const payload = buildPayload('Submitted');

// EDIT EXISTING SALES INVOICE
if (isEditMode && id) {
  const updatePayload = buildUpdatePayload('Submitted', id);

  const updateResponse = await salesBillAPI.updateSalesBill(updatePayload);

  if (!updateResponse.success) {
    throw new Error(
      updateResponse.message || 'Failed to update sales invoice'
    );
  }

  const displayNumber =
    existingInvoiceNumber || formatInvoiceNumber(id);

  const updatedPrintId =
    getPrintInvoiceId(updateResponse.data) || id;

  setPrintInvoiceId(updatedPrintId);

  toast.success('Sales Bill updated successfully!', {
    id: toastId
  });

  setSuccessData({
    salesBill: displayNumber,
    totalItems: items.filter(
      i => i.itemCode && i.quantity > 0
    ).length,
    message: 'Sales Invoice updated successfully.',
    customerName: customerData?.name,
    totalAmount: getGrandTotalWithRound()
  });

  setShowSuccessModal(true);

  return;
}

      const createResponse = await salesBillAPI.createSalesBill(payload);

      if (!createResponse.success) {
        throw new Error(createResponse.message || 'Failed to create');
      }

      const responseData = createResponse.data;
      const salesBillName = responseData?.data?.name || responseData?.name || billNumber;
      const createdPrintId =
        getPrintInvoiceId(responseData) ||
        responseData?.data?.id ||
        responseData?.id ||
        salesBillName;
      setPrintInvoiceId(createdPrintId);
      const totalItemsCount = responseData?.data?.total_items || items.filter(i => i.itemCode && i.quantity > 0).length;
      const message = responseData?.data?.message || responseData?.message || createResponse.message || 'Sales Invoice created successfully.';
      const totalAmount = getGrandTotalWithRound();

      // ===== FIX: Only update inventory if NOT from Delivery Challan =====
      const isFromDeliveryChallan = selectedDeliveryChallans.length > 0;

      if (!isFromDeliveryChallan) {
        // Only update inventory if NOT from Delivery Challan
        const itemsToDispatch = items.filter(item => item.itemCode && item.quantity > 0 && item.type !== 'service');
        if (itemsToDispatch.length > 0) {
          toast.loading('Updating inventory...', { id: toastId });
          const failedUpdates = await updateInventory(itemsToDispatch);

          if (failedUpdates.length > 0) {
            toast(`Inventory updated with ${failedUpdates.length} failures: ${failedUpdates.join(', ')}`, { id: toastId });
          } else {
            toast.success('Inventory updated successfully!', { id: toastId });
          }
        }
      } else {
        // Skip inventory update when from Delivery Challan
        toast.success('Sales Bill created from Delivery Challan - Inventory not updated (already deducted at DC level)', { id: toastId });
      }

      toast.success('Created!', { id: toastId });

      if (salesBillName && salesBillName !== billNumber) {
        try {
          await salesBillAPI.submitSalesBill(salesBillName);
          toast.success(`Bill ${salesBillName} submitted!`);
        } catch (submitError) {
          console.warn('Submit failed but SB was created:', submitError);
          toast('SB created but submission failed. Please submit manually.');
        }
      }

      setSuccessData({
        salesBill: salesBillName,
        totalItems: totalItemsCount,
        message: message,
        customerName: customerData?.name,
        totalAmount: totalAmount
      });

      // Ask whether the newly-created Sales Bill should be printed.
      setShowPrintConfirmModal(true);
    } catch (error: any) {
      toast.error(error.message || (isEditMode ? 'Failed to update' : 'Failed to create'), { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    const toastId = toast.loading(isEditMode ? 'Updating draft...' : 'Saving draft...');
    try {
      const payload = buildPayload('Draft');

if (isEditMode && id) {
  const updatePayload = buildUpdatePayload('Draft', id);

  const response = await salesBillAPI.updateSalesBill(updatePayload);

  if (!response.success) {
    throw new Error(
      response.message || 'Failed to update draft'
    );
  }

  const displayNumber =
    existingInvoiceNumber || formatInvoiceNumber(id);

  toast.success(`Draft updated: ${displayNumber}`, {
    id: toastId
  });

  setTimeout(() => navigate('/sales-bill'), 1000);

  return;
}

      const response = await salesBillAPI.createSalesBill(payload);
      if (!response.success) throw new Error(response.message || 'Failed to save');

      const responseData = response.data;
      const salesBillName = responseData?.data?.name || responseData?.name || billNumber;

      toast.success(`Draft saved: ${salesBillName}`, { id: toastId });
      setTimeout(() => navigate('/sales-bill'), 1000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewSalesBill = () => {
    setShowSuccessModal(false);
    navigate('/sales-bill');
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    navigate('/sales-bill');
  };

  // ===== SHARED SALES INVOICE PRINT =====
  // This is the same print template used by SalesInvoice.tsx.
  // Both the confirmation modal and the form Print button use this function.
  const buildCurrentFormPrintData = (): SalesInvoicePrintData => {
    const validItems = items.filter(item => item.itemCode && item.quantity > 0);

    return {
      id: printInvoiceId || id || billNumber,
      displayInvoiceNumber:
        existingInvoiceNumber ||
        (id ? formatInvoiceNumber(id) : (printInvoiceId ? formatInvoiceNumber(printInvoiceId) : billNumber)),
      customer: selectedCustomer || '',
      customer_name: customerData?.name || '',
      company: (customerData as any)?.company || '',
      posting_date: billDate,
      due_date: dueDate,
      currency: 'INR',
      total_qty: getTotalQty(),
      total: getTotalAmount(),
      net_total: getTotalAmount(),
      grand_total: getGrandTotalWithRound(),
      outstanding_amount: getGrandTotalWithRound(),
      paid_amount: 0,
      status: invoiceStatus || 'Draft',
      total_taxes_and_charges: getTotalTax(),
      remarks: remarks || null,
      items: validItems.map((item) => ({
        id: Number(item.id) || undefined,
        item_code: item.itemCode || '',
        item_name: item.itemName || item.itemCode || '',
        description: item.description || '',
        item_group: item.itemGroup || item.hsn || '',
        qty: item.quantity || 0,
        uom: item.unit || item.uom || 'Nos',
        stock_uom: item.uom || item.unit || 'Nos',
        rate: item.rate || 0,
        amount: item.amount || 0,
      })),
      payment_schedule: paymentSchedule.map((ps) => ({
        payment_term: ps.paymentTerm || '',
        due_date: ps.dueDate || '',
        due_days: ps.durationDays || 0,
        invoice_portion: ps.invoicePortion || 0,
        payment_amount: ps.paymentAmount || 0,
        payment_status: ps.status || 'Pending',
      })),
    };
  };

  const getPrintInvoiceId = (raw: any): string | number | null => {
    const record = extractSalesInvoiceRecord(raw);
    if (record?.id !== undefined && record?.id !== null) return record.id;

    const candidate =
      record?.name ??
      raw?.data?.id ??
      raw?.data?.name ??
      raw?.id ??
      raw?.name ??
      null;

    if (candidate === null || candidate === undefined || candidate === '') return null;

    // If the backend returns the display name (e.g. SINV-00035),
    // use the numeric id because GET /sales-invoice/:id expects that id.
    const match = String(candidate).match(/(\d+)$/);
    return match ? Number(match[1]) : candidate;
  };

  const openSalesInvoicePrint = async (
    invoiceId?: string | number | null,
    fallbackData?: SalesInvoicePrintData
  ) => {
    const printWindow = window.open('', '_blank', 'width=900,height=1000');

    if (!printWindow) {
      toast.error('Please allow pop-ups to print this invoice');
      return;
    }

    printWindow.document.write(
      '<p style="font-family:sans-serif;padding:24px;color:#374151;">Loading invoice…</p>'
    );

    try {
      let printData = fallbackData || buildCurrentFormPrintData();

      if (invoiceId !== undefined && invoiceId !== null && invoiceId !== '') {
        try {
          const response = await salesBillAPI.getSalesBill(String(invoiceId));
          const record = extractSalesInvoiceRecord(response.data);

          if (record) {
            printData = {
              ...record,
              id: record.id ?? invoiceId,
              displayInvoiceNumber:
                record.displayInvoiceNumber ||
                formatInvoiceNumber(record.id ?? invoiceId),
            } as SalesInvoicePrintData;
          }
        } catch (fetchError) {
          console.warn('Could not fetch full invoice for printing. Using form data.', fetchError);
        }
      }

      printWindow.document.open();
      printWindow.document.write(buildSalesInvoicePrintHtml(printData));
      printWindow.document.close();
    } catch (error) {
      console.error('Error printing sales invoice:', error);

      try {
        printWindow.document.open();
        printWindow.document.write(
          buildSalesInvoicePrintHtml(fallbackData || buildCurrentFormPrintData())
        );
        printWindow.document.close();
      } catch (fallbackError) {
        console.error('Fallback print failed:', fallbackError);
        printWindow.close();
        toast.error('Unable to print sales invoice');
      }
    }
  };

  // ===== EXACT SAME PRINT TEMPLATE AS SALESINVOICE.TSX =====
  const buildSalesInvoicePrintHtml = (invoice: SalesInvoicePrintData): string => {
    const items = invoice.items || [];
    const totalQty = items.reduce((sum, item) => sum + (item.qty || 0), 0);
    const grandTotal = invoice.grand_total || invoice.total || 0;
    const totalTax = invoice.total_taxes_and_charges || 0;
    const netTotal = invoice.net_total || invoice.total || 0;

    // Calculate tax per item (simplified)
    const taxRate = totalTax > 0 && netTotal > 0 ? (totalTax / netTotal) * 100 : 0;
    const cgstRate = taxRate / 2;
    const sgstRate = taxRate / 2;

    const itemRows = items.map((item, idx) => `
      <tr>
        <td class="pq-col-sl">${idx + 1}</td>
        <td class="pq-col-desc">
          ${escapeHtml(item.item_name || item.item_code || '')}
          ${item.item_code ? `<div class="pq-item-sub">${escapeHtml(item.item_code)}</div>` : ''}
          ${item.description ? `<div class="pq-item-desc">${escapeHtml(item.description)}</div>` : ''}
        </td>
        <td class="pq-col-hsn">${escapeHtml(item.item_group || '')}</td>
        <td class="pq-col-qty">${item.qty || 0} ${escapeHtml(item.uom || item.stock_uom || 'Nos')}</td>
        <td class="pq-col-rate">${(item.rate || 0).toFixed(2)}</td>
        <td class="pq-col-cgst">${cgstRate > 0 ? cgstRate.toFixed(2) + '%' : ''}</td>
        <td class="pq-col-sgst">${sgstRate > 0 ? sgstRate.toFixed(2) + '%' : ''}</td>
        <td class="pq-col-amt">${(item.amount || 0).toFixed(2)}</td>
      </tr>
    `).join('');

    // Payment schedule rows
    const paymentRows = (invoice.payment_schedule || []).map((ps, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(ps.payment_term)}</td>
        <td>${escapeHtml(formatPrintDate(ps.due_date))}</td>
        <td>${ps.due_days}</td>
        <td>${ps.invoice_portion}%</td>
        <td>₹${(ps.payment_amount || 0).toFixed(2)}</td>
        <td>${escapeHtml(ps.payment_status || 'Pending')}</td>
      </tr>
    `).join('');

    const hasPaymentSchedule = invoice.payment_schedule && invoice.payment_schedule.length > 0;

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(invoice.displayInvoiceNumber || 'Sales Invoice')}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1a1a1a; margin: 0; padding: 24px; }
  .pq-outer { border: 1.5px solid #000; }
  .pq-title-row { display: flex; align-items: center; justify-content: center; position: relative; padding: 8px; border-bottom: 1.5px solid #000; }
  .pq-title { font-size: 18px; font-weight: bold; letter-spacing: 1px; }
  .pq-top { display: flex; border-bottom: 1px solid #000; }
  .pq-company-box { flex: 1.3; padding: 8px; border-right: 1px solid #000; }
  .pq-company-name { font-weight: bold; font-size: 14px; margin-bottom: 4px; }
  .pq-company-box div { margin: 1px 0; }
  .pq-meta-box { flex: 1.1; }
  .pq-meta-row { display: flex; border-bottom: 1px solid #000; }
  .pq-meta-row:last-child { border-bottom: none; }
  .pq-meta-cell { flex: 1; padding: 4px 8px; border-right: 1px solid #000; }
  .pq-meta-cell:last-child { border-right: none; }
  .pq-meta-label { font-size: 10px; color: #444; }
  .pq-meta-value { font-weight: 600; margin-top: 1px; min-height: 13px; }
  .pq-parties { display: flex; border-bottom: 1px solid #000; }
  .pq-party-box { flex: 1; padding: 8px; border-right: 1px solid #000; }
  .pq-party-box:last-child { border-right: none; }
  .pq-party-label { font-weight: bold; margin-bottom: 3px; }
  .pq-party-box div { margin: 1px 0; }
  table.pq-items { width: 100%; border-collapse: collapse; }
  table.pq-items th, table.pq-items td { border-right: 1px solid #000; padding: 5px 6px; }
  table.pq-items th:last-child, table.pq-items td:last-child { border-right: none; }
  table.pq-items thead th { border-bottom: 1px solid #000; border-top: none; font-size: 11px; text-align: left; }
  .pq-col-sl { width: 26px; text-align: center; }
  .pq-col-desc { min-width: 180px; }
  .pq-item-sub { font-size: 10px; color: #555; }
  .pq-item-desc { font-size: 10px; color: #666; margin-top: 2px; }
  .pq-col-hsn { width: 60px; }
  .pq-col-qty { width: 74px; text-align: right; }
  .pq-col-rate { width: 62px; text-align: right; }
  .pq-col-cgst { width: 54px; text-align: right; }
  .pq-col-sgst { width: 54px; text-align: right; }
  .pq-col-amt { width: 90px; text-align: right; }
  .pq-tax-label { text-align: right; font-style: italic; padding-right: 10px; }
  .pq-total-row td { border-top: 1px solid #000; font-weight: bold; padding: 6px; }
  .pq-words { display: flex; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px 8px; justify-content: space-between; align-items: flex-start; }
  .pq-words-label { font-size: 10px; color: #444; }
  .pq-eoe { font-size: 11px; font-style: italic; white-space: nowrap; }
  .pq-payment-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  .pq-payment-table th, .pq-payment-table td { border: 1px solid #000; padding: 4px 8px; font-size: 11px; text-align: left; }
  .pq-payment-table th { background: #f8f9fa; font-weight: 600; }
  .pq-payment-table td:last-child { text-align: right; }
  .pq-payment-title { font-weight: 600; font-size: 12px; padding: 6px 0; }
  .pq-bottom { display: flex; border-top: 1px solid #000; }
  .pq-decl-box { flex: 1; padding: 8px; border-right: 1px solid #000; }
  .pq-sign-box { flex: 1; padding: 8px; display: flex; flex-direction: column; justify-content: space-between; }
  .pq-signatory { text-align: right; margin-top: 24px; font-size: 11px; }
  .pq-footer { text-align: center; padding: 8px; font-size: 10px; color: #444; border-top: 1px solid #000; }
  .pq-footer div:first-child { font-weight: 600; letter-spacing: 0.5px; margin-bottom: 2px; }
  .pq-status-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 10px; font-weight: 600; }
  .pq-status-Submitted { background: #dbeafe; color: #1e40af; }
  .pq-status-Draft { background: #f3f4f6; color: #6b7280; }
  .pq-status-Cancelled { background: #fee2e2; color: #991b1b; }
  .pq-status-Paid { background: #d1fae5; color: #065f46; }
  .pq-status-Partially\\ Paid { background: #fef3c7; color: #92400e; }
  @media print {
    body { padding: 0; }
    @page { margin: 12mm; }
  }
</style>
</head>
<body>
  <div class="pq-outer">

    <div class="pq-title-row">
      <div class="pq-title">TAX INVOICE</div>
      <span style="position:absolute;right:12px;font-size:11px;color:#555;">
        <span class="pq-status-badge pq-status-${escapeHtml(invoice.status || 'Draft').replace(/ /g, '\\ ')}">${escapeHtml(invoice.status || 'Draft')}</span>
      </span>
    </div>

    <div class="pq-top">
      <div class="pq-company-box">
        <div class="pq-company-name">${escapeHtml(companyDetails.name)}</div>
        <div>${escapeHtml(companyDetails.address)}</div>
        <div>Phone: ${escapeHtml(companyDetails.contact)}</div>
        ${companyDetails.email ? `<div>Email: ${escapeHtml(companyDetails.email)}</div>` : ''}
        ${companyDetails.gstin ? `<div>GSTIN/UIN: ${escapeHtml(companyDetails.gstin)}</div>` : ''}
        <div>State Name : ${escapeHtml(companyDetails.stateName)}, Code : ${escapeHtml(companyDetails.stateCode)}</div>
      </div>
      <div class="pq-meta-box">
        <div class="pq-meta-row">
          <div class="pq-meta-cell">
            <div class="pq-meta-label">Invoice No.</div>
            <div class="pq-meta-value">${escapeHtml(invoice.displayInvoiceNumber || invoice.id || '')}</div>
          </div>
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Date</div>
            <div class="pq-meta-value">${escapeHtml(formatPrintDate(invoice.posting_date))}</div>
          </div>
        </div>
        <div class="pq-meta-row">
          <div class="pq-meta-cell">
            <div class="pq-meta-label">Due Date</div>
            <div class="pq-meta-value">${escapeHtml(formatPrintDate(invoice.due_date))}</div>
          </div>
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Currency</div>
            <div class="pq-meta-value">${escapeHtml(invoice.currency || 'INR')}</div>
          </div>
        </div>
        <div class="pq-meta-row">
          <div class="pq-meta-cell">
            <div class="pq-meta-label">Total Qty</div>
            <div class="pq-meta-value">${totalQty}</div>
          </div>
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Payment Status</div>
            <div class="pq-meta-value">${escapeHtml(invoice.status || 'Draft')}</div>
          </div>
        </div>
        ${invoice.remarks ? `
        <div class="pq-meta-row">
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Remarks</div>
            <div class="pq-meta-value">${escapeHtml(invoice.remarks)}</div>
          </div>
        </div>` : ''}
      </div>
    </div>

    <div class="pq-parties">
      <div class="pq-party-box">
        <div class="pq-party-label">Bill To</div>
        <div><strong>${escapeHtml(invoice.customer_name || '')}</strong></div>
        <div>Customer Code: ${escapeHtml(invoice.customer || '')}</div>
        ${invoice.company ? `<div>Company: ${escapeHtml(invoice.company)}</div>` : ''}
      </div>
      <div class="pq-party-box">
        <div class="pq-party-label">Invoice Details</div>
        <div>Total Amount: ₹${(grandTotal || 0).toFixed(2)}</div>
        <div>Paid Amount: ₹${(invoice.paid_amount || 0).toFixed(2)}</div>
        <div>Outstanding: ₹${(invoice.outstanding_amount || grandTotal || 0).toFixed(2)}</div>
      </div>
    </div>

    <table class="pq-items">
      <thead>
        <tr>
          <th class="pq-col-sl">#</th>
          <th class="pq-col-desc">Description</th>
          <th class="pq-col-hsn">Group</th>
          <th class="pq-col-qty">Qty</th>
          <th class="pq-col-rate">Rate</th>
          <th class="pq-col-cgst">CGST</th>
          <th class="pq-col-sgst">SGST</th>
          <th class="pq-col-amt">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        <tr class="pq-total-row">
          <td colspan="3">Total</td>
          <td class="pq-col-qty">${totalQty}</td>
          <td colspan="3"></td>
          <td class="pq-col-amt">${(grandTotal || 0).toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div class="pq-words">
      <div>
        <div class="pq-words-label">Amount Chargeable (in words)</div>
        <div><strong>${invoice.currency || 'INR'} ${numberToIndianWords(grandTotal)} Only</strong></div>
      </div>
      <div class="pq-eoe">E.&amp;O.E</div>
    </div>

    ${hasPaymentSchedule ? `
    <div style="padding: 8px 8px 0 8px;">
      <div class="pq-payment-title">Payment Schedule</div>
      <table class="pq-payment-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Payment Term</th>
            <th>Due Date</th>
            <th>Days</th>
            <th>Portion</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${paymentRows}
          <tr style="font-weight:600;border-top:2px solid #000;">
            <td colspan="5" style="text-align:right;">Total</td>
            <td>₹${(invoice.payment_schedule?.reduce((sum, p) => sum + p.payment_amount, 0) || 0).toFixed(2)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>` : ''}

    <div class="pq-bottom">
      <div class="pq-decl-box">
        <strong>Declaration</strong>
        <div style="margin-top:4px;">We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</div>
        ${companyDetails.panNo ? `<div style="margin-top:8px;">Company's PAN : ${escapeHtml(companyDetails.panNo)}</div>` : ''}
      </div>
      <div class="pq-sign-box">
        <div>
          <div><strong>Bank Details</strong></div>
          ${companyDetails.bankName ? `<div>Bank Name : ${escapeHtml(companyDetails.bankName)}</div>` : ''}
          ${companyDetails.bankAccountNo ? `<div>A/c No. : ${escapeHtml(companyDetails.bankAccountNo)}</div>` : ''}
          ${companyDetails.bankBranchIfsc ? `<div>Branch &amp; IFS Code : ${escapeHtml(companyDetails.bankBranchIfsc)}</div>` : ''}
        </div>
        <div class="pq-signatory">
          for ${escapeHtml(companyDetails.name)}<br /><br /><br />
          Authorised Signatory
        </div>
      </div>
    </div>

    <div class="pq-footer">
      ${companyDetails.jurisdiction ? `<div>SUBJECT TO ${escapeHtml(companyDetails.jurisdiction)} JURISDICTION</div>` : ''}
      <div>This is a computer generated sales invoice.</div>
    </div>
  </div>

  <script>
    window.onload = function () { window.print(); };
  </script>
</body>
</html>`;
  };

  const handlePrintSalesBill = async () => {
    setShowPrintConfirmModal(false);
    await openSalesInvoicePrint(
      printInvoiceId,
      buildCurrentFormPrintData()
    );
  };

  const handleCancelPrint = () => {
    setShowPrintConfirmModal(false);
    navigate('/sales-bill');
  };

  const handleCancel = () => {
    navigate('/sales-bill');
  };

  useEffect(() => {
    if (items.length === 0) {
      setItems([{
        id: '1',
        itemCode: '',
        itemName: '',
        hsn: '',
        description: '',
        quantity: 1,
        unit: 'pcs',
        rate: 0,
        amount: 0,
        tax: 0,
        tax_id: undefined,
        taxAmount: 0,
        totalAmount: 0,
        type: isService ? 'service' : 'product',
        itemGroup: 'Products',
        incomeAccount: 'Sales - A',
        costCenter: 'Main - A',
        weightPerUnit: 0,
        weightUom: 'kg'
      }]);
    }
  }, [isService]);

  const totalItems = items.filter(i => i.itemCode && i.quantity > 0).length;
  const totalQuantity = getTotalQty();
  const subTotal = getTotalAmount();
  const totalTax = getTotalTax();
  const grandTotalWithRound = getGrandTotalWithRound();

  const pageTitle = isViewMode ? 'View Sales Bill' : isEditMode ? 'Edit Sales Bill' : 'Create Sales Bill';
  const displayBillNumber = isExistingRecord ? (existingInvoiceNumber || billNumber) : billNumber;

  return (
    <div className={`nsb-page ${theme}`}>
      <style>{`
        .nsb-spinning { animation: nsbSpin 1s linear infinite; }
        @keyframes nsbSpin { to { transform: rotate(360deg); } }

        .nsb-custom-scroll::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .nsb-custom-scroll::-webkit-scrollbar-track {
          background: var(--border-color, #f1f5f9);
          border-radius: 2px;
        }
        .nsb-custom-scroll::-webkit-scrollbar-thumb {
          background: var(--text-secondary, #cbd5e1);
          border-radius: 2px;
        }
        .nsb-custom-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--text-secondary, #94a3b8);
        }
        .nsb-custom-scroll {
          scrollbar-width: thin;
          scrollbar-color: var(--text-secondary, #cbd5e1) var(--border-color, #f1f5f9);
        }

        @media print {
          .nsb-form-footer, button { display: none !important; }
          body { padding: 0; }
        }
      `}</style>

      {/* Loading overlay while fetching an existing invoice for Edit/View */}
      {loadingInvoice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(255,255,255,0.65)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            zIndex: 500
          }}
        >
          <FaSpinner className="nsb-spinning" size={32} style={{ color: 'var(--primary-color, #2563eb)' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary, #475569)', fontWeight: 600 }}>
            Loading Sales Invoice...
          </span>
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseModal}
        onViewDetails={handleViewSalesBill}
        salesBill={successData.salesBill}
        totalItems={successData.totalItems}
        message={successData.message}
        customerName={successData.customerName}
        totalAmount={successData.totalAmount}
      />

      {/* Print Confirmation Modal */}
      {showPrintConfirmModal && (
        <div
          className="nsb-print-confirm-overlay"
          onClick={handleCancelPrint}
        >
          <div
            className="nsb-print-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="nsb-print-confirm-icon">
              <FaPrint size={28} />
            </div>

            <h2 className="nsb-print-confirm-title">
              Sales Bill Created Successfully
            </h2>

            <p className="nsb-print-confirm-message">
              Sales Bill <strong>{successData.salesBill}</strong> has been created.
            </p>

            <p className="nsb-print-confirm-question">
              Do you want to print it now?
            </p>

            <div className="nsb-print-confirm-actions">
              <button
                type="button"
                className="nsb-print-confirm-btn nsb-print-confirm-yes"
                onClick={handlePrintSalesBill}
              >
                <FaPrint size={13} />
                Yes, Print
              </button>

              <button
                type="button"
                className="nsb-print-confirm-btn nsb-print-confirm-cancel"
                onClick={handleCancelPrint}
              >
                <FaTimes size={13} />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Customer Modal */}
      <QuickAddCustomerModal
        isOpen={showQuickAddModal}
        prefillName={quickAddPrefillName}
        onClose={() => setShowQuickAddModal(false)}
        onCreated={(customer) => {
          handleCustomerChange(customer.id, customer);
          setShowQuickAddModal(false);
        }}
        onOpenFullForm={() => {
          setShowQuickAddModal(false);
          navigateToFullCustomerForm(quickAddPrefillName);
        }}
      />

      {/* Header */}
      <div className="nsb-header">
        <div className="nsb-header-left">
          <button onClick={handleCancel} className="nsb-back-btn">
            <FaArrowLeft size={13} /> Back
          </button>
          <div className="nsb-header-divider" />
          <h1 className="nsb-header-title">{pageTitle}</h1>
          {selectedDeliveryChallans.length > 0 && (
            <span className="nsb-dc-count">
              ({selectedDeliveryChallans.length} DCs selected)
            </span>
          )}
        </div>
        <div className="nsb-header-right">
          <label className="nsb-checkbox-label">
            <input
              type="checkbox"
              checked={isService}
              disabled={isViewMode}
              onChange={(e) => {
                setIsService(e.target.checked);
                setItems(items.map(item => ({
                  ...item,
                  type: e.target.checked ? 'service' : 'product'
                })));
              }}
              className="nsb-checkbox"
            />
            <span>IsService</span>
          </label>
        </div>
      </div>

      {/* MAIN BOX */}
      {/* A native <fieldset disabled> automatically disables every nested
          input/select/button/textarea (including those inside the custom
          dropdown components below), which is the quickest reliable way to
          make the "View" mode read-only without touching every field. */}
      <fieldset disabled={isViewMode} style={{ border: 'none', padding: 0, margin: 0 }}>
        <div className="nsb-main-box">
          {/* Delivery Challan Toggle */}
          <div className="nsb-invoice-type-section">
            <label className="nsb-label" style={{ marginBottom: 8 }}>Create Bill From</label>
            <div className="nsb-radio-group">
              <label className="nsb-radio-label">
                <input
                  type="radio"
                  name="deliveryChallanSource"
                  value="with"
                  checked={hasDeliveryChallan === true}
                  onChange={() => setHasDeliveryChallan(true)}
                />
                With Delivery Challan(s)
              </label>
              <label className="nsb-radio-label">
                <input
                  type="radio"
                  name="deliveryChallanSource"
                  value="without"
                  checked={hasDeliveryChallan === false}
                  onChange={() => setHasDeliveryChallan(false)}
                />
                Without Delivery Challan
              </label>
            </div>
          </div>

          {/* TWO COLUMN LAYOUT */}
          <div className="nsb-compact-layout">
            {/* LEFT COLUMN */}
            <div className="nsb-left-column">
              {/* Delivery Challan - Only show when toggle is ON */}
              {hasDeliveryChallan && (
                <div className="nsb-dc-field-wrapper">
                  <div className="nsb-section-header">
                    <FaFileAlt className="nsb-section-icon" />
                    <span>Select Delivery Challans</span>
                    {selectedDeliveryChallans.length > 0 && (
                      <span style={{ fontSize: '10px', fontWeight: 'normal', color: 'var(--text-secondary, #64748b)', marginLeft: '8px' }}>
                        {selectedDeliveryChallans.length} selected
                      </span>
                    )}
                  </div>
                  <div className="nsb-field">
                    <MultiDeliveryChallanSelect
                      selectedDCs={selectedDeliveryChallans}
                      onSelect={handleDeliveryChallansChange}
                      placeholder="Search and select multiple Delivery Challans..."
                      error={!!errors.deliveryChallan}
                      customerFilter={selectedCustomer || undefined}
                    />
                    {errors.deliveryChallan && <span className="nsb-error-text">{errors.deliveryChallan}</span>}
                    {selectedDeliveryChallans.length > 0 && (
                      <span className="nsb-field-hint">
                        ✓ {selectedDeliveryChallans.length} Delivery Challans selected. Items, customer & payment terms will be auto-filled.
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Customer & Sales Order */}
              <div className="nsb-section-header">
                <FaBuilding className="nsb-section-icon" />
                <span>Customer & Order</span>
              </div>

              <div className="nsb-field-row">
                <div className="nsb-field-half">
                  <label className="nsb-label">
                    Customer <span className="nsb-required">*</span>
                  </label>
                  <CustomerDropdown
                    value={selectedCustomer}
                    onChange={handleCustomerChange}
                    placeholder="Search Customer..."
                    disabled={isLoading || (hasDeliveryChallan && isCustomerDisabled)}
                    error={!!errors.customer}
                    presetCustomer={customerData}
                    onAddNew={handleAddNewCustomer}
                  />
                  {errors.customer && <span className="nsb-error-text">{errors.customer}</span>}
                  {hasDeliveryChallan && isCustomerDisabled && (
                    <span className="nsb-field-hint">Auto-selected from Delivery Challans</span>
                  )}
                </div>

                <div className="nsb-field-half">
                  <label className="nsb-label">Sales Order</label>
                  <input
                    type="text"
                    value={selectedSalesOrder || (hasDeliveryChallan && selectedDeliveryChallans.length > 0 ? 'Auto-loaded from DCs' : '')}
                    disabled
                    className="nsb-input nsb-input-disabled"
                    placeholder="Sales Order will be auto-loaded"
                  />
                </div>
              </div>

              {/* Bill Details */}
              <div className="nsb-section-header">
                <FaFileAlt className="nsb-section-icon" />
                <span>Bill Details</span>
              </div>

              <div className="nsb-grid-3">
                <div className="nsb-field">
                  <label className="nsb-label">Bill Number</label>
                  <div className="nsb-bill-number-display">{displayBillNumber}</div>
                </div>

                <div className="nsb-field">
                  <label className="nsb-label">
                    Bill Date <span className="nsb-required">*</span>
                  </label>
                  <div className="nsb-date-field">
                    <input
                      type="date"
                      value={billDate}
                      onChange={(e) => setBillDate(e.target.value)}
                      className={`nsb-input ${errors.billDate ? 'nsb-input-error' : ''}`}
                    />
                    <button
                      type="button"
                      className="nsb-date-icon-btn"
                      onClick={() => {
                        const el = document.querySelector('input[type="date"]') as HTMLInputElement;
                        if (el) {
                          if (typeof (el as any).showPicker === 'function') {
                            (el as any).showPicker();
                          } else {
                            el.focus();
                          }
                        }
                      }}
                      tabIndex={-1}
                    >
                      <FaCalendarAlt size={13} />
                    </button>
                  </div>
                </div>

                <div className="nsb-field">
                  <label className="nsb-label">
                    Due Date <span className="nsb-required">*</span>
                  </label>
                  <div className="nsb-date-field">
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className={`nsb-input ${errors.dueDate ? 'nsb-input-error' : ''}`}
                    />
                    <button
                      type="button"
                      className="nsb-date-icon-btn"
                      onClick={() => {
                        const el = document.querySelector('input[type="date"]') as HTMLInputElement;
                        if (el) {
                          if (typeof (el as any).showPicker === 'function') {
                            (el as any).showPicker();
                          } else {
                            el.focus();
                          }
                        }
                      }}
                      tabIndex={-1}
                    >
                      <FaCalendarAlt size={13} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="nsb-grid-3">
                <div className="nsb-field">
                  <label className="nsb-label">
                    Warehouse <span className="nsb-required">*</span>
                  </label>
                  <WarehouseSelect
                    value={warehouse}
                    onChange={setWarehouse}
                    placeholder="Search and select Warehouse..."
                    error={!!errors.warehouse}
                    required={true}
                  />
                  {errors.warehouse && <span className="nsb-error-text">{errors.warehouse}</span>}
                </div>

                <div className="nsb-field">
                  <label className="nsb-label">Invoice Number</label>
                  <input
                    type="text"
                    placeholder="INV-2026-001"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="nsb-input"
                  />
                </div>

                <div className="nsb-field">
                  <label className="nsb-label">Invoice Date</label>
                  <div className="nsb-date-field">
                    <input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="nsb-input"
                    />
                    <button
                      type="button"
                      className="nsb-date-icon-btn"
                      onClick={() => {
                        const el = document.querySelector('input[type="date"]') as HTMLInputElement;
                        if (el) {
                          if (typeof (el as any).showPicker === 'function') {
                            (el as any).showPicker();
                          } else {
                            el.focus();
                          }
                        }
                      }}
                      tabIndex={-1}
                    >
                      <FaCalendarAlt size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - CUSTOMER DETAIL CARD */}
            <div className="nsb-right-column">
              {customerData ? (
                <div className="nsb-detail-card">
                  <div className="nsb-card-header">
                    <FaBuilding size={14} />
                    <span>Customer Details</span>
                  </div>
                  <div className="nsb-card-content">
                    <h3>{customerData.name}</h3>
                    <div className="nsb-card-info">
                      {customerData.code && (
                        <div className="nsb-info-item">
                          <span className="nsb-info-label">Code</span>
                          <span className="nsb-info-value">{customerData.code}</span>
                        </div>
                      )}
                      {customerData.contactPerson && (
                        <div className="nsb-info-item">
                          <span className="nsb-info-label">Contact</span>
                          <span className="nsb-info-value"><FaUser size={10} /> {customerData.contactPerson}</span>
                        </div>
                      )}
                      {customerData.phone && (
                        <div className="nsb-info-item">
                          <span className="nsb-info-label">Phone</span>
                          <span className="nsb-info-value"><FaPhone size={10} /> {customerData.phone}</span>
                        </div>
                      )}
                      {customerData.email && (
                        <div className="nsb-info-item">
                          <span className="nsb-info-label">Email</span>
                          <span className="nsb-info-value"><FaEnvelope size={10} /> {customerData.email}</span>
                        </div>
                      )}
                      {customerData.gstin && (
                        <div className="nsb-info-item">
                          <span className="nsb-info-label">GST</span>
                          <span className="nsb-info-value">{customerData.gstin}</span>
                        </div>
                      )}
                    </div>
                    {selectedDeliveryChallans.length > 0 && (
                      <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color, #e2e8f0)' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary, #64748b)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Associated DCs
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                          {selectedDeliveryChallans.map(dc => (
                            <span key={dc.id} style={{
                              fontSize: '10px',
                              padding: '1px 6px',
                              borderRadius: '10px',
                              background: 'color-mix(in srgb, var(--primary-color) 10%, transparent)',
                              color: 'var(--primary-color, #2563eb)',
                              border: '1px solid color-mix(in srgb, var(--primary-color) 20%, transparent)'
                            }}>
                              {dc.id}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="nsb-detail-card nsb-empty-card">
                  <div className="nsb-card-header">
                    <FaBuilding size={14} />
                    <span>Customer Details</span>
                  </div>
                  <div className="nsb-card-content">
                    <div className="nsb-empty-state">
                      <FaInfoCircle size={24} />
                      <p>Select a customer to view details</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* FULL WIDTH - ITEMS SECTION */}
          <div className="nsb-items-full">
            <div className="nsb-items-header">
              <span className="nsb-items-title">
                <FaClipboardList className="nsb-items-icon" /> {isService ? 'Services' : 'Products'}
                {selectedDeliveryChallans.length > 0 && (
                  <span style={{ fontSize: '10px', fontWeight: 'normal', color: 'var(--text-secondary, #64748b)' }}>
                    (from {selectedDeliveryChallans.length} DCs)
                  </span>
                )}
              </span>
              <button onClick={addItem} className="nsb-add-btn">
                <FaPlus size={9} /> Add
              </button>
            </div>

            {errors.items && <div className="nsb-items-error"><FaExclamationTriangle /> {errors.items}</div>}

            <div className="nsb-table-wrap">
              <table className="nsb-items-table">
                <thead>
                  <tr>
                    <th className="nsb-col-sno">#</th>
                    <th className="nsb-col-code">Item Code <span className="nsb-required">*</span></th>
                    <th className="nsb-col-name">Item Name <span className="nsb-required">*</span></th>
                    <th className="nsb-col-hsn">HSN</th>
                    <th className="nsb-col-qty">Qty <span className="nsb-required">*</span></th>
                    <th className="nsb-col-unit">UOM</th>
                    <th className="nsb-col-rate">Rate</th>
                    <th className="nsb-col-tax">Tax</th>
                    <th className="nsb-col-tax-amount" style={{ textAlign: 'right' }}>Tax Amt</th>
                    <th className="nsb-col-amount" style={{ textAlign: 'right' }}>Amount</th>
                    <th className="nsb-col-action"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id}>
                      <td className="nsb-col-sno">{index + 1}</td>
                      <td className="nsb-col-code">
                        <SearchableSelect
                          value={item.itemCode}
                          onChange={(value) => updateItem(item.id, 'itemCode', value)}
                          options={products}
                          placeholder="Search..."
                          onSearch={handleItemSearch}
                          loading={isLoadingItems}
                          error={!!errors[`item_${index}_code`]}
                          stockInfo={{ status: item.stockStatus || 'unknown', availableQty: item.availableQty }}
                        />
                      </td>
                      <td className="nsb-col-name">
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) => updateItem(item.id, 'itemName', e.target.value)}
                          placeholder="Item Name"
                          className="nsb-table-input nsb-table-input-text"
                        />
                      </td>
                      <td className="nsb-col-hsn">
                        <input
                          type="text"
                          value={item.hsn}
                          onChange={(e) => updateItem(item.id, 'hsn', e.target.value)}
                          placeholder="HSN"
                          className="nsb-table-input nsb-table-input-text"
                        />
                      </td>
                      <td className="nsb-col-qty">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          min="1"
                          className="nsb-table-input"
                        />
                      </td>
                      <td className="nsb-col-unit">
                        <select
                          value={item.unit}
                          onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                          className="nsb-table-input"
                        >
                          <option value="pcs">Pcs</option>
                          <option value="kg">Kg</option>
                          <option value="ltr">Ltr</option>
                          <option value="mtr">Mtr</option>
                          <option value="Nos">Nos</option>
                          <option value="Box">Box</option>
                        </select>
                      </td>
                      <td className="nsb-col-rate">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="nsb-table-input"
                        />
                      </td>
                      <td className="nsb-col-tax">
                        <select
                          value={item.tax}
                          onChange={(e) => updateItem(item.id, 'tax', parseFloat(e.target.value) || 0)}
                          className="nsb-table-input"
                          disabled={loadingTaxOptions}
                        >
                          <option value={0}>0%</option>
                          {taxOptions.map((tax) => (
                            <option key={tax.tax_id} value={extractTaxValue(tax.tax_type)}>
                              {tax.tax_type}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="nsb-col-tax-amount" style={{ textAlign: 'right' }}>
                        <span className="nsb-table-value">₹{item.taxAmount.toFixed(2)}</span>
                      </td>
                      <td className="nsb-col-amount" style={{ textAlign: 'right' }}>
                        <span className="nsb-table-value">₹{item.totalAmount.toFixed(2)}</span>
                      </td>
                      <td className="nsb-col-action">
                        <button onClick={() => removeItem(item.id)} className="nsb-remove-btn">
                          <FaTrash size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* BOTTOM SECTION - Payment Schedule */}
          <div className="nsb-bottom-section">
            {/* LEFT COLUMN */}
            <div className="nsb-bottom-left">
              {/* Payment Schedule Header */}
              <div className="nsb-section-header">
                <FaCreditCard className="nsb-section-icon" />
                <span>Payment Schedule</span>
              </div>

              {/* Payment Terms Template Dropdown */}
              <div className="nsb-field" style={{ marginBottom: '0.5rem' }}>
                <div className="nsb-field-row" style={{ gridTemplateColumns: '1fr auto' }}>
                  <select
                    value={selectedPaymentTemplate}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedPaymentTemplate(value);
                      if (value) {
                        applyPaymentTemplate(value);
                      }
                    }}
                    className="nsb-select"
                    style={{ minWidth: '200px' }}
                  >
                    <option value="">Select Payment Terms...</option>
                    {paymentTermTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} - {template.description}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="nsb-add-btn"
                    onClick={() => {
                      if (selectedPaymentTemplate) {
                        applyPaymentTemplate(selectedPaymentTemplate);
                      }
                    }}
                    style={{ whiteSpace: 'nowrap', padding: '5px 14px' }}
                  >
                    <FaCopy size={9} /> Apply
                  </button>
                </div>
              </div>

              {/* Payment Schedule Table */}
              <div className="nsb-payment-table-wrap">
                <table className="nsb-payment-table">
                  <thead>
                    <tr>
                      <th className="nsb-payment-col-no">#</th>
                      <th className="nsb-payment-col-term">Payment Term</th>
                      <th className="nsb-payment-col-date">Due Date</th>
                      <th className="nsb-payment-col-duration">Days</th>
                      <th className="nsb-payment-col-portion">%</th>
                      <th className="nsb-payment-col-amount">Amount</th>
                      <th className="nsb-payment-col-action"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentSchedule.map((schedule, index) => (
                      <tr key={schedule.id}>
                        <td className="nsb-payment-col-no">{index + 1}</td>
                        <td className="nsb-payment-col-term">
                          <input
                            type="text"
                            value={schedule.paymentTerm}
                            onChange={(e) => updatePaymentRow(index, { paymentTerm: e.target.value })}
                            placeholder="Term"
                            className="nsb-table-input nsb-table-input-text"
                          />
                        </td>
                        <td className="nsb-payment-col-date">
                          <input
                            type="date"
                            value={schedule.dueDate}
                            onChange={(e) => handlePaymentDueDateChange(index, e.target.value)}
                            className="nsb-table-input"
                          />
                        </td>
                        <td className="nsb-payment-col-duration">
                          <input
                            type="number"
                            value={schedule.durationDays}
                            onChange={(e) => handlePaymentDurationChange(index, Number(e.target.value) || 0)}
                            min="0"
                            className="nsb-table-input"
                          />
                        </td>
                        <td className="nsb-payment-col-portion">
                          <input
                            type="number"
                            value={schedule.invoicePortion}
                            onChange={(e) => updatePaymentRow(index, { invoicePortion: Number(e.target.value) || 0 })}
                            min="0"
                            max="100"
                            className="nsb-table-input"
                          />
                        </td>
                        <td className="nsb-payment-col-amount">
                          <span className="nsb-table-value">₹{schedule.paymentAmount.toFixed(2)}</span>
                        </td>
                        <td className="nsb-payment-col-action">
                          {paymentSchedule.length > 1 && (
                            <button
                              type="button"
                              className="nsb-remove-btn"
                              onClick={() => removePaymentSchedule(index)}
                            >
                              <FaTrash size={10} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button type="button" className="nsb-add-payment-btn" onClick={addPaymentSchedule}>
                <FaPlus size={9} /> Add Schedule
              </button>

              {/* Payment Mode, Status & Remarks in one row */}
              <div className="nsb-field" style={{ marginTop: '1rem' }}>
                <div className="nsb-grid-2">
                  <div className="nsb-field">
                    <label className="nsb-label">Payment Mode</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="nsb-select"
                    >
                      <option value="">Select Payment Mode</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="UPI">UPI</option>
                      <option value="NEFT">NEFT</option>
                      <option value="RTGS">RTGS</option>
                      <option value="IMPS">IMPS</option>
                    </select>
                  </div>

                  <div className="nsb-field">
                    <label className="nsb-label">Invoice Status</label>
                    <select
                      value={invoiceStatus}
                      onChange={(e) => setInvoiceStatus(e.target.value)}
                      className="nsb-select"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Submitted">Submitted</option>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="nsb-field">
                <label className="nsb-label">Remarks</label>
                <input
                  type="text"
                  placeholder="Add notes..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="nsb-input"
                />
              </div>
            </div>

            {/* RIGHT COLUMN: Financial Summary */}
            <div className="nsb-bottom-right">
              <div className="nsb-detail-card nsb-summary-card">
                <div className="nsb-card-header">
                  <FaCalculator size={14} />
                  <span>Financial Summary</span>
                </div>
                <div className="nsb-card-content">
                  <div className="nsb-summary-grid">
                    <div className="nsb-summary-item">
                      <span className="nsb-summary-label">Total Items</span>
                      <span className="nsb-summary-value">{totalItems}</span>
                    </div>
                    <div className="nsb-summary-item">
                      <span className="nsb-summary-label">Total Quantity</span>
                      <span className="nsb-summary-value">{totalQuantity}</span>
                    </div>
                    <div className="nsb-summary-item">
                      <span className="nsb-summary-label">Sub Total</span>
                      <span className="nsb-summary-value">₹{subTotal.toFixed(2)}</span>
                    </div>
                    <div className="nsb-summary-item">
                      <span className="nsb-summary-label">Total Tax</span>
                      <span className="nsb-summary-value">₹{totalTax.toFixed(2)}</span>
                    </div>
                    <div className="nsb-summary-item">
                      <span className="nsb-summary-label">Round Off</span>
                      <div className="nsb-roundoff-wrap">
                        <input
                          type="number"
                          value={roundOff.toFixed(2)}
                          onChange={(e) => setRoundOff(parseFloat(e.target.value) || 0)}
                          className="nsb-roundoff-input"
                        />
                      </div>
                    </div>
                    <div className="nsb-summary-grand">
                      <span className="nsb-summary-grand-label">Grand Total</span>
                      <span className="nsb-summary-grand-value">₹{grandTotalWithRound.toFixed(2)}</span>
                    </div>
                    <div className="nsb-summary-item" style={{ borderTop: '1px solid var(--border-color, #e2e8f0)', marginTop: '4px', paddingTop: '6px' }}>
                      <span className="nsb-summary-label" style={{ fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>Payment Schedule Total</span>
                      <span className="nsb-summary-value" style={{ fontWeight: 600, color: 'var(--primary-color, #2563eb)' }}>
                        ₹{paymentSchedule.reduce((sum, p) => sum + p.paymentAmount, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </fieldset>

      {/* Action Buttons */}
      <div className="nsb-form-footer">
        <button
          type="button"
          onClick={() => openSalesInvoicePrint(id || printInvoiceId, buildCurrentFormPrintData())}
          className="nsb-btn nsb-btn-print"
        >
          <FaPrint size={11} /> Print
        </button>
        {!isViewMode && (
          <>
            <button onClick={handleSaveDraft} disabled={isSubmitting} className="nsb-btn nsb-btn-draft">
              {isSubmitting ? <FaSpinner className="nsb-spinning" size={11} /> : <FaSave size={11} />} Draft
            </button>
            <button onClick={handleSubmit} disabled={isSubmitting} className="nsb-btn nsb-btn-submit">
              {isSubmitting ? <FaSpinner className="nsb-spinning" size={11} /> : <FaPaperPlane size={11} />} {isEditMode ? 'Update' : 'Submit'}
            </button>
          </>
        )}
        {isViewMode && id && (
          <button onClick={() => navigate(`/sales-bill/edit/${id}`)} className="nsb-btn nsb-btn-submit">
            <FaSave size={11} /> Edit
          </button>
        )}
        <button onClick={handleCancel} className="nsb-btn nsb-btn-cancel">
          <FaTimes size={11} /> Cancel
        </button>
      </div>
    </div>
  );
};

export default CreateSalesBill;