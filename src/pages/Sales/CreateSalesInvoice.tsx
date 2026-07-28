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
import { useNavigate } from 'react-router-dom';
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
  name: string;
  item_code: string;
  warehouse_Id?: number;
  actual_qty: number;
  reserved_stock?: number;
  projected_qty?: number;
  stock_uom?: string;
  company?: string;
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

const getTaxRateFromId = (taxId: number | undefined, taxOpts: TaxOption[]): number => {
  if (!taxId) return 0;
  const taxOption = taxOpts.find(t => t.tax_id === taxId);
  return taxOption ? extractTaxValue(taxOption.tax_type) : 0;
};

// ===== API SERVICE =====

class ApiService {
  private static instance: ApiService;

  private constructor() {}

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

  async updateSalesBill(id: string, data: Partial<SalesBillPayload>): Promise<ApiResponse<any>> {
    return this.apiService.put(`/sales-invoice/${id}`, data);
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
    return this.apiService.get('/item', params);
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
    return this.apiService.get('/inventory', params);
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
}

const CustomerDropdown: React.FC<CustomerDropdownProps> = ({
  value,
  onChange,
  placeholder = 'Search Customer...',
  disabled = false,
  error = false,
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
        }
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
        maxHeight: '280px',
        overflowY: 'auto',
        overflowX: 'hidden'
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
        <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary, #94a3b8)', fontSize: '12px' }}>
          {searchTerm ? 'No matching customers found' : 'No customers available'}
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
  const { theme } = useAdminTheme();

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
  const [inventoryMap, setInventoryMap] = useState<{ [itemCode: string]: InventoryApiRecord }>({});
  const [, setLoadingInventory] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // Success Modal state
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
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
      const map: { [itemCode: string]: InventoryApiRecord } = {};
      records.forEach((r: any) => {
        if (r.item_code) {
          const key = r.item_code.toUpperCase();
          if (!map[key] || (r.actual_qty ?? 0) > (map[key].actual_qty ?? 0)) {
            map[key] = r;
          }
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
  const getStockStatus = (itemCode: string, quantity: number): { status: 'checking' | 'available' | 'insufficient' | 'unknown'; availableQty?: number } => {
    if (!itemCode) return { status: 'unknown' };
    const inv = inventoryMap[itemCode.toUpperCase()];
    if (!inv) return { status: 'unknown' };
    return {
      status: (inv.actual_qty ?? 0) >= quantity ? 'available' : 'insufficient',
      availableQty: inv.actual_qty,
    };
  };

  // ─── Effects ───────────────────────────────────────
  useEffect(() => {
    fetchTaxOptions();
    fetchInventory();
    fetchAllItems();
    fetchCustomers();
    fetchWarehouses();
  }, []);

  // Update stock status when inventory changes
  useEffect(() => {
    if (Object.keys(inventoryMap).length === 0) return;
    setItems((prev) =>
      prev.map((item) => {
        if (!item.itemCode) return item;
        const { status, availableQty } = getStockStatus(item.itemCode, item.quantity);
        return { ...item, stockStatus: status, availableQty };
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
          rate: item.standard_rate || 0,
          tax: 0,
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
          
          const finishedGoods = mapped.find(w => w.warehouse_name.toLowerCase() === 'finished goods');
          if (finishedGoods) {
            setWarehouse(finishedGoods.id.toString());
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
          rate: item.standard_rate || 0,
          tax: 0,
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
          const { status, availableQty } = getStockStatus(item.item_code || '', item.qty || 0);
          
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
    } else {
      setCustomerData(null);
      setSelectedSalesOrder('');
      setSelectedOrderData(null);
    }
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
              const { status, availableQty } = getStockStatus(product.itemCode, updated.quantity || 0);
              
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
              const { status, availableQty } = getStockStatus(updated.itemCode, updated.quantity || 0);
              updated.stockStatus = status;
              updated.availableQty = availableQty;
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
    const template = paymentTermTemplates.find(t => t.id === selectedPaymentTemplate);
    const paymentTermsValue = template?.name || '';

    // Get warehouse name from ID
    const selectedWarehouse = warehouses.find(w => w.id.toString() === warehouse);
    const warehouseName = selectedWarehouse?.warehouse_name || 'Finished Goods - A';

    return {
      customer: customerData?.code || '',
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
    const toastId = toast.loading('Creating sales bill...');
    try {
      const payload = buildPayload('Submitted');
      const createResponse = await salesBillAPI.createSalesBill(payload);
      
      if (!createResponse.success) {
        throw new Error(createResponse.message || 'Failed to create');
      }
      
      const responseData = createResponse.data;
      const salesBillName = responseData?.data?.name || responseData?.name || billNumber;
      const totalItemsCount = responseData?.data?.total_items || items.filter(i => i.itemCode && i.quantity > 0).length;
      const message = responseData?.data?.message || responseData?.message || createResponse.message || 'Sales Invoice created successfully.';
      const totalAmount = getGrandTotalWithRound();

      toast.success('Created!', { id: toastId });

      setSuccessData({
        salesBill: salesBillName,
        totalItems: totalItemsCount,
        message: message,
        customerName: customerData?.name,
        totalAmount: totalAmount
      });
      setShowSuccessModal(true);

      if (salesBillName && salesBillName !== billNumber) {
        try {
          await salesBillAPI.submitSalesBill(salesBillName);
          toast.success(`Bill ${salesBillName} submitted!`);
        } catch (submitError) {
          console.warn('Submit failed but SB was created:', submitError);
          toast('SB created but submission failed. Please submit manually.');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    const toastId = toast.loading('Saving draft...');
    try {
      const payload = buildPayload('Draft');
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

      {/* Header */}
      <div className="nsb-header">
        <div className="nsb-header-left">
          <button onClick={handleCancel} className="nsb-back-btn">
            <FaArrowLeft size={13} /> Back
          </button>
          <div className="nsb-header-divider" />
          <h1 className="nsb-header-title">Create Sales Bill</h1>
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
                <div className="nsb-bill-number-display">{billNumber}</div>
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

      {/* Action Buttons */}
      <div className="nsb-form-footer">
        <button onClick={() => window.print()} className="nsb-btn nsb-btn-print">
          <FaPrint size={11} /> Print
        </button>
        <button onClick={handleSaveDraft} disabled={isSubmitting} className="nsb-btn nsb-btn-draft">
          {isSubmitting ? <FaSpinner className="nsb-spinning" size={11} /> : <FaSave size={11} />} Draft
        </button>
        <button onClick={handleSubmit} disabled={isSubmitting} className="nsb-btn nsb-btn-submit">
          {isSubmitting ? <FaSpinner className="nsb-spinning" size={11} /> : <FaPaperPlane size={11} />} Submit
        </button>
        <button onClick={handleCancel} className="nsb-btn nsb-btn-cancel">
          <FaTimes size={11} /> Cancel
        </button>
      </div>
    </div>
  );
};

export default CreateSalesBill;