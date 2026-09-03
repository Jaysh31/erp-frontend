import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  FaSave,
  FaTimes,
  FaPrint,
  FaPaperPlane,
  FaBox,
  FaPlus,
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
  FaTruck,
  FaClipboardList,
  FaCheckCircle,
  FaExclamationCircle,
  FaQuestionCircle,
  FaCalendarAlt,
  FaClipboardCheck,
  FaEye,
} from 'react-icons/fa';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import { useFormState } from '../../context/FormStateContext';
import { useFormNavigation } from '../../hooks/useFormNavigation';
import './CreateDeliveryChallan.css';
import { FaTrash } from 'react-icons/fa6';

// ===== SHARED DELIVERY CHALLAN PRINT HELPERS =====
const printCompanyDetails = {
  name: 'Sculptor Tech Pvt Ltd',
  address: 'c-1006, gc, Pune, Maharashtra 411028, India',
  email: 'jayeshwakle@sculptortechpvtltd.com',
  contact: '8668584275',
  gstin: '',
  stateName: 'Maharashtra',
  stateCode: '27',
  panNo: '',
  jurisdiction: 'PUNE',
};

const printFormatDcNumber = (id: string | number): string => {
  const numId = typeof id === 'string' ? parseInt(id, 10) : id;
  if (!Number.isFinite(numId)) return String(id || '');
  return `DC-${String(numId).padStart(5, '0')}`;
};

const printFormatDate = (date: string): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = String(d.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
};

const printEscapeHtml = (val: unknown): string => {
  const s = val === null || val === undefined ? '' : String(val);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

const PRINT_ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const PRINT_TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const printTwoDigitWords = (n: number): string => {
  if (n < 20) return PRINT_ONES[n];
  return PRINT_TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + PRINT_ONES[n % 10] : '');
};

const printThreeDigitWords = (n: number): string => {
  if (n >= 100) {
    return PRINT_ONES[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + printTwoDigitWords(n % 100) : '');
  }
  return printTwoDigitWords(n);
};

const printNumberToIndianWords = (value: number): string => {
  let num = Math.round(Math.abs(value));
  if (num === 0) return 'Zero';

  const crore = Math.floor(num / 10000000); num %= 10000000;
  const lakh = Math.floor(num / 100000); num %= 100000;
  const thousand = Math.floor(num / 1000); num %= 1000;
  const hundred = num;

  let out = '';
  if (crore) out += printThreeDigitWords(crore) + ' Crore ';
  if (lakh) out += printThreeDigitWords(lakh) + ' Lakh ';
  if (thousand) out += printThreeDigitWords(thousand) + ' Thousand ';
  if (hundred) out += printThreeDigitWords(hundred);

  return out.trim();
};

interface DeliveryChallanPrintData {
  id: string | number;
  name: string;
  customer_id: number | string;
  customer_name: string;
  posting_date: string;
  status: string;
  grand_total: number;
  set_warehouse?: string;
  transporter?: string;
  vehicle_no?: string;
  driver_name?: string;
  instructions?: string;
  sales_order_id?: number | string | null;
  displayDcNumber?: string;
  items?: Array<{
    id?: number | string;
    item_code: string;
    item_name?: string;
    description?: string;
    qty: number;
    stock_uom?: string;
    uom?: string;
    rate: number;
    amount: number;
  }>;
  customer_details?: {
    primary_address?: string;
    mobile_no?: string;
    email_id?: string;
    gstin?: string;
    state?: string;
    state_code?: string;
  };
};

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
  tax_id?: string;
  items?: Array<{
    item_code: string;
    description: string;
    qty: number;
    uom: string;
    rate: number;
    amount: number;
    tax_id?: number;
    tax?: number;
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
  tax_id?: number;
  tax_type?: string;
  rawTaxId?: any;
  rawTaxType?: any;
  rawTaxRate?: any;
  rawItem?: any;
  type: 'product' | 'service';
  stockUom?: string;
  standardRate?: number;
  sellingPrice?: number;
  mrp?: number;
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
}

interface TaxOption {
  tax_id: number;
  tax_type: string;
}

interface DeliveryChallanItem {
  id: string;
  itemCode: string;
  itemName: string;
  hsn: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  standardRate?: number;
  sellingPrice?: number;
  amount: number;
  tax: number;
  tax_id?: number;
  taxAmount: number;
  totalAmount: number;
  type: 'product' | 'service';
  stockStatus?: 'checking' | 'available' | 'insufficient' | 'unknown';
  availableQty?: number;
  inventoryId?: number;
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

interface DeliveryNotePayload {
  id?: string | number;
  naming_series: string;
  customer_id: number;
  customer_name: string;
  posting_date: string;
  company: string;
  set_warehouse: string;
  transporter: string;
  vehicle_no: string;
  driver_name: string;
  lr_no: string | null;
  lr_date: string | null;
  sales_order_id: number | null;
  grand_total: number;
  instructions: string;
  status: string;
  type: string;
  quality_inspection_id?: number | null;
  items: Array<{
    name: string;
    item_code: string;
    item_name: string;
    description: string;
    qty: number;
    uom: string;
    rate: number;
    amount: number;
    tax: number;
    tax_rate: number;
    tax_id: number | null;
    item_tax_id: number | null;
    tax_amount: number;
    total_amount: number;
    warehouse: string;
    type: string;
  }>;
}

interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
  success: boolean;
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

// ===== DELIVERY CHALLAN API =====

class DeliveryChallanAPI {
  private apiService: ApiService;

  constructor() {
    this.apiService = ApiService.getInstance();
  }

  async createDeliveryNote(payload: DeliveryNotePayload): Promise<ApiResponse<any>> {
    return this.apiService.post('/delivery-note', payload);
  }

  async updateDeliveryNote(payload: DeliveryNotePayload): Promise<ApiResponse<any>> {
    return this.apiService.put('/delivery-note', payload);
  }

  async getDeliveryNote(id: string): Promise<ApiResponse<any>> {
    return this.apiService.get(`/delivery-note/${id}`);
  }

  async getDeliveryNotes(params?: Record<string, any>): Promise<ApiResponse<any[]>> {
    return this.apiService.get('/delivery-notes', params);
  }

  async deleteDeliveryNote(id: string): Promise<ApiResponse<any>> {
    return this.apiService.delete(`/delivery-note/${id}`);
  }

  async getCustomers(params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<any>> {
    return this.apiService.get('/customer', params);
  }

  async getSalesOrders(params?: { customer_id?: string; page?: number; limit?: number }): Promise<ApiResponse<any>> {
    return this.apiService.get('/sales-order', params);
  }

  async getSalesOrderById(id: string | number): Promise<ApiResponse<any>> {
    return this.apiService.get(`/sales-order/${id}`);
  }

  async getItems(params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<any>> {
    return this.apiService.get('/item?type=product', params);
  }

  async getWarehouses(params?: { page?: number; limit?: number }): Promise<ApiResponse<any>> {
    return this.apiService.get('/warehouse', params);
  }

  async getInventory(params?: { item_code?: string }): Promise<ApiResponse<any>> {
    return this.apiService.get('/inventory?limit=100', params);
  }

  async updateInventory(_id: number, data: any): Promise<ApiResponse<any>> {
    return this.apiService.put(`/inventory`, data);
  }

  async getQualityInspectionByDC(dcId: string | number): Promise<ApiResponse<any>> {
    return this.apiService.get(`/quality-inspection/delivery-challan/${dcId}`);
  }
}

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
  onChange: (value: string, productOption?: Product) => void;
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
    onChange(option.itemCode, option);
    setSearchTerm('');
    setIsOpen(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const getSelectedLabel = () => {
    const selected = options.find(opt => opt.itemCode === value || opt.id === value || opt.itemName === value);
    return selected ? `${selected.itemCode}` : '';
  };

  const getStockDisplay = () => {
    if (!stockInfo || !value) return null;
    if (stockInfo.status === 'checking') {
      return <span className="ndc-stock-indicator ndc-stock-checking"><FaSpinner className="ndc-spinning" size={8} /></span>;
    }
    if (stockInfo.status === 'available') {
      return <span className="ndc-stock-indicator ndc-stock-available"><FaCheckCircle size={8} /> {stockInfo.availableQty}</span>;
    }
    if (stockInfo.status === 'insufficient') {
      return <span className="ndc-stock-indicator ndc-stock-insufficient"><FaExclamationCircle size={8} /> {stockInfo.availableQty || 0}</span>;
    }
    return <span className="ndc-stock-indicator ndc-stock-unknown"><FaQuestionCircle size={8} /></span>;
  };

  const menu = isOpen ? (
    <div
      ref={menuRef}
      className="ndc-custom-scroll"
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
                ₹{(option.standardRate !== undefined && option.standardRate > 0) ? option.standardRate : option.rate}
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
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={isOpen ? searchTerm : getSelectedLabel()}
          onChange={handleSearchChange}
          onFocus={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          autoComplete="off"
          className="ndc-table-input"
          style={{
            flex: 1,
            padding: '4px 8px',
            paddingRight: '30px',
            border: error ? '1.5px solid #ef4444' : '0.5px solid var(--border-color, #e2e8f0)',
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
          <FaSpinner className="ndc-spinning" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-color, #2563eb)', fontSize: '11px' }} />
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

// ===== SEARCHABLE SALES ORDER DROPDOWN =====
interface SalesOrderDropdownProps {
  value: string;
  onChange: (value: string, orderData?: SalesOrder) => void;
  customerId?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  taxOptions?: TaxOption[];
}

const SalesOrderDropdown: React.FC<SalesOrderDropdownProps> = ({
  value,
  onChange,
  customerId,
  placeholder = 'Search Sales Order...',
  disabled = false,
  error = false,
  taxOptions = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<SalesOrder[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const deliveryChallanAPI = new DeliveryChallanAPI();

  const menuPos = useDropdownPosition(isOpen, wrapperRef);

  const extractTaxValue = (taxType: string): number => {
    if (!taxType) return 0;
    const match = taxType.match(/(\d+)/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const getTaxRateFromId = (taxId: number | string | undefined): number => {
    if (!taxId) return 0;
    const id = typeof taxId === 'string' ? parseInt(taxId, 10) : taxId;
    const taxOption = taxOptions.find(t => t.tax_id === id);
    return taxOption ? extractTaxValue(taxOption.tax_type) : 0;
  };

  useEffect(() => {
    if (customerId) {
      fetchOrders(customerId);
    } else {
      setOrders([]);
      setFilteredOrders([]);
      setSelectedOrder(null);
    }
  }, [customerId]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOrders(orders);
      return;
    }

    const filtered = orders.filter(order =>
      String(order.id).includes(searchTerm) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(order.total_qty).includes(searchTerm)
    );
    setFilteredOrders(filtered);
  }, [searchTerm, orders]);

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

  const fetchOrders = async (custId: string) => {
    setLoading(true);
    try {
      const response = await deliveryChallanAPI.getSalesOrders({
        customer_id: custId
      });

      if (response.success && response.data) {
        let orderList: SalesOrder[] = [];
        
        if (response.data.data?.records) {
          orderList = response.data.data.records;
        } else if (Array.isArray(response.data)) {
          orderList = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          orderList = response.data.data;
        }
        
        const mappedOrders: SalesOrder[] = orderList.map((record: any) => ({
          id: record.id || record.sales_order_Id || 0,
          customer: record.customer_id || '',
          customer_name: record.customer_name || '',
          company: record.company || '',
          transaction_date: record.transaction_date || '',
          delivery_date: record.delivery_date || '',
          total_qty: record.total_qty || 0,
          grand_total: record.grand_total || 0,
          status: record.status || 'Draft',
          creation: record.creation || '',
          po_no: record.po_no || '',
          po_date: record.po_date || '',
          tax_id: record.tax_id || '',
          items: (record.sales_items || []).map((item: any) => {
            const lineTaxId = item.item_tax_id
              ? Number(item.item_tax_id)
              : (item.tax_id ? Number(item.tax_id) : (record.tax_id ? Number(record.tax_id) : null));
            return {
              item_code: item.item_code || '',
              description: item.description || '',
              qty: item.qty || 0,
              uom: item.uom || item.stock_uom || 'pcs',
              rate: item.rate || 0,
              amount: item.amount || 0,
              tax_id: lineTaxId,
              tax: item.tax_rate || item.tax || 0,
            };
          })
        }));
        
        setOrders(mappedOrders);
        setFilteredOrders(mappedOrders);
      }
    } catch (error) {
      console.error('Error fetching sales orders:', error);
      toast.error('Failed to fetch sales orders');
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
  };

  const handleSelect = (order: SalesOrder) => {
    setSelectedOrder(order);
    setSearchTerm('');
    setIsOpen(false);
    
    const processedOrder = {
      ...order,
      items: order.items?.map(item => ({
        ...item,
        tax: item.tax_id ? getTaxRateFromId(item.tax_id) : item.tax || 0
      }))
    };
    
    onChange(String(order.id), processedOrder);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const getDisplayValue = () => {
    if (selectedOrder) {
      return `#${selectedOrder.id} - ${selectedOrder.customer_name}`;
    }
    return '';
  };

  const isDisabled = disabled || !customerId;

  const menu = (isOpen && !isDisabled) ? (
    <div
      ref={menuRef}
      className="ndc-custom-scroll"
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
          <FaSpinner className="ndc-spinning" style={{ display: 'inline-block', marginRight: '8px' }} /> Loading...
        </div>
      ) : filteredOrders.length > 0 ? (
        filteredOrders.map((order, index) => (
          <div
            key={order.id}
            onMouseDown={(e) => {
              e.preventDefault();
              handleSelect(order);
            }}
            style={{
              padding: '10px 14px',
              cursor: 'pointer',
              background: highlightedIndex === index ? 'var(--nav-hover, #eff6ff)' : 'transparent',
              borderLeft: String(value) === String(order.id) ? '3px solid var(--primary-color, #2563eb)' : '3px solid transparent',
              transition: 'background 0.15s',
              borderBottom: index < filteredOrders.length - 1 ? '0.5px solid var(--border-color, #f1f5f9)' : 'none'
            }}
            onMouseEnter={() => setHighlightedIndex(index)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary, #0f172a)' }}>#{order.id}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary, #475569)', marginLeft: '8px' }}>{order.customer_name}</span>
              </div>
              <span style={{
                fontSize: '11px',
                padding: '2px 10px',
                borderRadius: '12px',
                background: order.status === 'Draft' ? '#fef3c7' : '#dbeafe',
                color: order.status === 'Draft' ? '#92400e' : '#1e40af',
                fontWeight: 500
              }}>
                {order.status}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '4px', fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
              <span>Qty: {order.total_qty}</span>
              <span>Total: ₹{order.grand_total}</span>
              <span>Date: {new Date(order.transaction_date).toLocaleDateString()}</span>
            </div>
          </div>
        ))
      ) : (
        <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary, #94a3b8)', fontSize: '12px' }}>
          {searchTerm ? 'No matching orders found' : 'No sales orders available'}
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
          placeholder={isDisabled ? 'Select a customer first' : placeholder}
          value={isOpen ? searchTerm : getDisplayValue()}
          onChange={handleSearchChange}
          onFocus={() => !isDisabled && setIsOpen(true)}
          disabled={isDisabled}
          autoComplete="off"
          title={isDisabled ? 'Please select a customer first' : ''}
          style={{
            width: '100%',
            padding: '6px 10px',
            paddingRight: '35px',
            border: error ? '1.5px solid #ef4444' : '0.5px solid var(--border-color, #e2e8f0)',
            borderRadius: '6px',
            background: isDisabled ? 'var(--input-bg, #f3f4f6)' : 'var(--input-bg, #f8fafc)',
            color: 'var(--text-primary, #0f172a)',
            fontSize: '13px',
            fontFamily: 'inherit',
            cursor: isDisabled ? 'not-allowed' : 'text',
            minHeight: '32px'
          }}
        />
        {loading ? (
          <FaSpinner className="ndc-spinning" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-color, #2563eb)', fontSize: '12px' }} />
        ) : (
          <FaChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: isDisabled ? 'var(--text-secondary, #94a3b8)' : 'var(--text-secondary, #64748b)', fontSize: '12px', pointerEvents: 'none' }} />
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
  fullWidth?: boolean;
  onAddNewCustomer?: (searchTerm: string) => void;
  presetCustomer?: Customer | null;
}

const CustomerDropdown: React.FC<CustomerDropdownProps> = ({
  value,
  onChange,
  placeholder = 'Search Customer...',
  disabled = false,
  error = false,
  onAddNewCustomer,
  presetCustomer = null,
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
  const deliveryChallanAPI = new DeliveryChallanAPI();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

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
      const response = await deliveryChallanAPI.getCustomers({
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

  const handleAddNewCustomer = () => {
    setIsOpen(false);
    if (onAddNewCustomer) {
      onAddNewCustomer(searchTerm.trim());
    } else {
      navigate('/customer/add');
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
      className="ndc-custom-scroll"
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
        maxHeight: '320px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <div className="ndc-custom-scroll" style={{ overflowY: 'auto', overflowX: 'hidden', flex: '1 1 auto' }}>
        {loading ? (
          <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary, #94a3b8)', fontSize: '12px' }}>
            <FaSpinner className="ndc-spinning" style={{ display: 'inline-block', marginRight: '8px' }} /> Loading...
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
          <div className="ndc-dropdown-no-results">
            <FaInfoCircle size={13} />
            <span>
              {searchTerm ? `No customer found for "${searchTerm}"` : 'No customers available'}
            </span>
          </div>
        )}
      </div>

      <div
        className="ndc-dropdown-add-new"
        onMouseDown={(e) => {
          e.preventDefault();
          handleAddNewCustomer();
        }}
      >
        <span className="ndc-dropdown-add-new-icon">
          <FaPlus size={10} />
        </span>
        <span>
          {searchTerm && filteredCustomers.length === 0
            ? `Add "${searchTerm}" as New Customer`
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
            border: error ? '1.5px solid #ef4444' : '0.5px solid var(--border-color, #e2e8f0)',
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
          <FaSpinner className="ndc-spinning" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-color, #2563eb)', fontSize: '12px' }} />
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
              title="Fill in the full customer form instead (address, contact person, etc.)"
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
                {submitting && <FaSpinner className="ndc-spinning" size={11} />}
                Add Customer
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// ===== SUCCESS / PRINT CONFIRMATION MODAL COMPONENT =====
interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveryNote: string;
  totalItems: number;
  message: string;
  customerName?: string;
  onViewDetails?: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  deliveryNote,
  totalItems,
  message,
  customerName,
  onViewDetails
}) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="ndc-modal-overlay" onClick={onClose}>
      <div className="ndc-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="ndc-modal-success-icon">
          <FaCheckCircle size={48} />
        </div>

        <h2 className="ndc-modal-title">✓ Success!</h2>

        <p className="ndc-modal-message">{message}</p>

        <div className="ndc-modal-details">
          <div className="ndc-modal-detail-item">
            <span className="ndc-modal-detail-label">Delivery Note</span>
            <span className="ndc-modal-detail-value ndc-modal-dn-number">{deliveryNote}</span>
          </div>

          {customerName && (
            <div className="ndc-modal-detail-item">
              <span className="ndc-modal-detail-label">Customer</span>
              <span className="ndc-modal-detail-value">{customerName}</span>
            </div>
          )}

          <div className="ndc-modal-detail-item">
            <span className="ndc-modal-detail-label">Total Items</span>
            <span className="ndc-modal-detail-value">{totalItems}</span>
          </div>
        </div>

        <div className="ndc-modal-actions">
          <button onClick={onViewDetails || onClose} className="ndc-modal-btn ndc-modal-btn-primary">
            View Delivery Note
          </button>
          <button onClick={onClose} className="ndc-modal-btn ndc-modal-btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ===== INSPECTION VIEW MODAL =====
interface InspectionViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspectionData: any;
}

const InspectionViewModal: React.FC<InspectionViewModalProps> = ({
  isOpen,
  onClose,
  inspectionData,
}) => {
  if (!isOpen || !inspectionData) return null;

  const details = inspectionData.details || [];
  const hasObservations = details.some((d: any) => d.observations && d.observations.length > 0);
  const sampleCount = hasObservations ? details[0].observations.length : 0;

  return ReactDOM.createPortal(
    <div className="ndc-modal-overlay" onClick={onClose}>
      <div className="ndc-modal-container ndc-inspection-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ndc-modal-header">
          <h2 className="ndc-modal-title">
            <FaClipboardCheck size={20} style={{ marginRight: '8px' }} />
            Quality Inspection Details
          </h2>
          <button onClick={onClose} className="ndc-modal-close-btn">
            <FaTimes size={18} />
          </button>
        </div>

        <div className="ndc-inspection-summary">
          <div className="ndc-inspection-summary-grid">
            <div className="ndc-inspection-summary-item">
              <span className="ndc-inspection-summary-label">Inspection No</span>
              <span className="ndc-inspection-summary-value">{inspectionData.inspection_no || '-'}</span>
            </div>
            <div className="ndc-inspection-summary-item">
              <span className="ndc-inspection-summary-label">Status</span>
              <span className={`ndc-inspection-status ${inspectionData.status?.toLowerCase() || ''}`}>
                {inspectionData.status || '-'}
              </span>
            </div>
            <div className="ndc-inspection-summary-item">
              <span className="ndc-inspection-summary-label">Overall Result</span>
              <span className={`ndc-inspection-result ${inspectionData.overall_result?.toLowerCase() || ''}`}>
                {inspectionData.overall_result || '-'}
              </span>
            </div>
            <div className="ndc-inspection-summary-item">
              <span className="ndc-inspection-summary-label">Date</span>
              <span className="ndc-inspection-summary-value">
                {inspectionData.inspection_date ? new Date(inspectionData.inspection_date).toLocaleDateString() : '-'}
              </span>
            </div>
            <div className="ndc-inspection-summary-item">
              <span className="ndc-inspection-summary-label">Item</span>
              <span className="ndc-inspection-summary-value">
                {inspectionData.part_product_name || inspectionData.item_name || '-'}
              </span>
            </div>
            <div className="ndc-inspection-summary-item">
              <span className="ndc-inspection-summary-label">Customer</span>
              <span className="ndc-inspection-summary-value">
                {inspectionData.customer_name || '-'}
              </span>
            </div>
          </div>
        </div>

        <div className="ndc-inspection-details">
          <div className="ndc-inspection-details-header">
            <span>Parameters & Observations</span>
            {inspectionData.rejected_qty > 0 && (
              <span className="ndc-inspection-rejected-badge">
                <FaExclamationTriangle size={12} /> {inspectionData.rejected_qty} Rejected
              </span>
            )}
          </div>

          <div className="ndc-inspection-table-wrap">
            <table className="ndc-inspection-table">
              <thead>
                <tr>
                  <th className="ndc-inspection-col-sr">#</th>
                  <th className="ndc-inspection-col-param">Parameter</th>
                  <th className="ndc-inspection-col-spec">Specification</th>
                  <th className="ndc-inspection-col-method">Inspection Method</th>
                  {Array.from({ length: sampleCount }, (_, i) => (
                    <th key={i} className="ndc-inspection-col-obs">Obs {i + 1}</th>
                  ))}
                  <th className="ndc-inspection-col-result">Result</th>
                </tr>
              </thead>
              <tbody>
                {details.length === 0 ? (
                  <tr>
                    <td colSpan={sampleCount + 5} className="ndc-inspection-empty">
                      No inspection details available
                    </td>
                  </tr>
                ) : (
                  details.map((detail: any, index: number) => {
                    const observations = detail.observations || [];
                    const isFail = detail.result === 'Fail';
                    return (
                      <tr key={detail.id || index} className={isFail ? 'ndc-inspection-row-fail' : ''}>
                        <td className="ndc-inspection-col-sr">{index + 1}</td>
                        <td className="ndc-inspection-col-param">{detail.parameter_name || '-'}</td>
                        <td className="ndc-inspection-col-spec">{detail.specification || '-'}</td>
                        <td className="ndc-inspection-col-method">{detail.inspection_method_name || '-'}</td>
                        {observations.map((obs: any, obsIndex: number) => (
                          <td key={obsIndex} className="ndc-inspection-col-obs">
                            <span className={obs.result === 'Fail' ? 'ndc-inspection-obs-fail' : ''}>
                              {obs.observed_value || '-'}
                            </span>
                          </td>
                        ))}
                        {observations.length < sampleCount && (
                          Array.from({ length: sampleCount - observations.length }, (_, i) => (
                            <td key={`empty-${i}`} className="ndc-inspection-col-obs">-</td>
                          ))
                        )}
                        <td className="ndc-inspection-col-result">
                          <span className={`ndc-inspection-badge ${detail.result?.toLowerCase() || ''}`}>
                            {detail.result || '-'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {inspectionData.remarks && (
            <div className="ndc-inspection-remarks">
              <span className="ndc-inspection-remarks-label">Remarks:</span>
              <span>{inspectionData.remarks}</span>
            </div>
          )}
        </div>

        <div className="ndc-modal-footer">
          <button onClick={onClose} className="ndc-modal-btn ndc-modal-btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ===== MAIN COMPONENT =====

const NewDeliveryChallan: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { theme } = useAdminTheme();
  const formState = useFormState();
  const formNav = useFormNavigation('delivery_challan');

  const isEditMode = !!id;
  const isViewMode = location.pathname.includes('/view/');
  
  const [hasSalesOrder, setHasSalesOrder] = useState<boolean>(true);
  
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<string>('');
  const [, setSelectedOrderData] = useState<SalesOrder | null>(null);
  const [isService, setIsService] = useState<boolean>(false);
  const [dcDate, setDcDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [warehouse, setWarehouse] = useState<string>('');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState<boolean>(false);
  const [transporter, setTransporter] = useState<string>('');
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [qualityInspection, setQualityInspection] = useState<boolean>(false);
  const [pendingQualityInspection, setPendingQualityInspection] = useState<any | null>(null);
  const [items, setItems] = useState<DeliveryChallanItem[]>([]);
  const [customerData, setCustomerData] = useState<Customer | null>(null);

  const itemsRestoredRef = useRef(false);

  const [showQuickAddModal, setShowQuickAddModal] = useState<boolean>(false);
  const [quickAddPrefillName, setQuickAddPrefillName] = useState<string>('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dcNumber, setDcNumber] = useState<string>(`DN-${new Date().getFullYear()}-001`);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState<boolean>(false);
  const [roundOff, setRoundOff] = useState<number>(0);
  const [taxOptions, setTaxOptions] = useState<TaxOption[]>([
    { tax_id: 1, tax_type: 'GST 0%' },
    { tax_id: 2, tax_type: 'GST 5%' },
    { tax_id: 3, tax_type: 'GST 12%' },
    { tax_id: 4, tax_type: 'GST 18%' },
    { tax_id: 5, tax_type: 'GST 28%' },
  ]);
  const [loadingTaxOptions, setLoadingTaxOptions] = useState<boolean>(false);
  const [, setTaxOptionsLoaded] = useState<boolean>(false);
  const [inventoryMap, setInventoryMap] = useState<{ [itemCode: string]: InventoryApiRecord[] }>({});
  const [, setLoadingInventory] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showPrintConfirmModal, setShowPrintConfirmModal] = useState<boolean>(false);
  const [printDeliveryChallanId, setPrintDeliveryChallanId] = useState<string | number | null>(null);
  const [successData, setSuccessData] = useState<{
    deliveryNote: string;
    totalItems: number;
    message: string;
    customerName?: string;
  }>({
    deliveryNote: '',
    totalItems: 0,
    message: ''
  });

  // NEW: Quality Inspection ID to pass to DC
  const [qualityInspectionId, setQualityInspectionId] = useState<number | null>(null);

  // View Inspection state
  const [viewInspectionData, setViewInspectionData] = useState<any>(null);
  const [showViewInspectionModal, setShowViewInspectionModal] = useState<boolean>(false);
  const [isLoadingInspection, setIsLoadingInspection] = useState<boolean>(false);

  const deliveryChallanAPI = new DeliveryChallanAPI();

  // ===== HELPER FUNCTIONS =====
  const DEFAULT_TAX_OPTIONS: TaxOption[] = [
    { tax_id: 1, tax_type: 'GST 0%' },
    { tax_id: 2, tax_type: 'GST 5%' },
    { tax_id: 3, tax_type: 'GST 12%' },
    { tax_id: 4, tax_type: 'GST 18%' },
    { tax_id: 5, tax_type: 'GST 28%' },
  ];

  const extractTaxValue = (taxType: string): number => {
    if (!taxType) return 0;
    const match = taxType.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[0]) : 0;
  };

  const getTaxIdFromRate = (taxRate: number, taxOpts: TaxOption[] = []): number | undefined => {
    const opts = taxOpts && taxOpts.length > 0 ? taxOpts : DEFAULT_TAX_OPTIONS;
    const taxOption = opts.find(t => extractTaxValue(t.tax_type) === taxRate);
    return taxOption?.tax_id;
  };

  const getTaxRateFromId = (taxId: number | string | undefined, taxOpts: TaxOption[] = []): number => {
    if (!taxId) return 0;
    const opts = taxOpts && taxOpts.length > 0 ? taxOpts : DEFAULT_TAX_OPTIONS;
    const id = typeof taxId === 'string' ? parseInt(taxId, 10) : taxId;
    const taxOption = opts.find(t => t.tax_id === id);
    return taxOption ? extractTaxValue(taxOption.tax_type) : 0;
  };

  const getTaxRateFromItem = (item: any, taxOpts: TaxOption[] = []): { rate: number; tax_id?: number; tax_type?: string } => {
    const opts = taxOpts && taxOpts.length > 0 ? taxOpts : DEFAULT_TAX_OPTIONS;
    if (!item) return { rate: 0, tax_id: opts[0]?.tax_id || 1, tax_type: opts[0]?.tax_type || 'GST 0%' };

    const rawTaxId = item.tax_id ?? item.taxId ?? item.tax_type_id ?? item.rawTaxId;
    if (rawTaxId !== undefined && rawTaxId !== null && rawTaxId !== '') {
      const numTaxId = Number(rawTaxId);
      const match = opts.find(t => t.tax_id === numTaxId || String(t.tax_id) === String(rawTaxId));
      if (match) {
        return { rate: extractTaxValue(match.tax_type), tax_id: match.tax_id, tax_type: match.tax_type };
      }
    }

    const rawTaxType = item.tax_type ?? item.taxType ?? item.tax_name ?? item.rawTaxType;
    if (rawTaxType) {
      const strType = String(rawTaxType).trim();
      let match = opts.find(t => t.tax_type.toLowerCase() === strType.toLowerCase());
      if (match) {
        return { rate: extractTaxValue(match.tax_type), tax_id: match.tax_id, tax_type: match.tax_type };
      }
      const rateFromType = extractTaxValue(strType);
      if (rateFromType > 0) {
        match = opts.find(t => extractTaxValue(t.tax_type) === rateFromType);
        if (match) {
          return { rate: rateFromType, tax_id: match.tax_id, tax_type: match.tax_type };
        }
        return { rate: rateFromType, tax_id: getTaxIdFromRate(rateFromType, opts), tax_type: `GST ${rateFromType}%` };
      }
    }

    const directRateRaw = item.tax ?? item.tax_rate ?? item.gst_rate ?? item.gst ?? item.tax_percent ?? item.taxPercentage ?? item.rawTaxRate;
    if (directRateRaw !== undefined && directRateRaw !== null && directRateRaw !== '') {
      const directRate = Number(directRateRaw);
      if (!isNaN(directRate) && directRate >= 0) {
        const match = opts.find(t => extractTaxValue(t.tax_type) === directRate);
        if (match) {
          return { rate: directRate, tax_id: match.tax_id, tax_type: match.tax_type };
        }
        if (directRate > 0) {
          return { rate: directRate, tax_id: getTaxIdFromRate(directRate, opts), tax_type: `GST ${directRate}%` };
        }
      }
    }

    return { rate: 0, tax_id: opts[0]?.tax_id || 1, tax_type: opts[0]?.tax_type || 'GST 0%' };
  };

  // ===== FETCH TAX OPTIONS =====
  const fetchTaxOptions = async () => {
    setLoadingTaxOptions(true);
    try {
      const response = await api.get('/item/get-tax');
      const data = response.data;
      if (data.success === 1 && Array.isArray(data.data)) {
        setTaxOptions(data.data);
      } else {
        setTaxOptions(DEFAULT_TAX_OPTIONS);
      }
      setTaxOptionsLoaded(true);
    } catch (error) {
      console.error('Error fetching tax options:', error);
      setTaxOptions(DEFAULT_TAX_OPTIONS);
      setTaxOptionsLoaded(true);
    } finally {
      setLoadingTaxOptions(false);
    }
  };

  // ===== FETCH INVENTORY =====
  const fetchInventory = async () => {
    setLoadingInventory(true);
    try {
      const response = await deliveryChallanAPI.getInventory();
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

  // ===== GET STOCK STATUS =====
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

  // ===== FETCH DELIVERY CHALLAN FOR EDIT/VIEW =====
  const fetchDeliveryChallanForEdit = async (challanId: string) => {
    setIsLoadingData(true);
    try {
      const response = await deliveryChallanAPI.getDeliveryNote(challanId);
      
      if (response.success && response.data) {
        const data = response.data.data || response.data;
        
        if (data.customer_id) {
          setSelectedCustomer(String(data.customer_id));
          const customer = customers.find(c => c.id === String(data.customer_id));
          if (customer) {
            setCustomerData(customer);
          } else {
            if (data.customer_name) {
              setCustomerData({
                id: String(data.customer_id),
                name: data.customer_name,
                code: data.customer_code || '',
                email: data.customer_email || '',
                phone: data.customer_phone || '',
                address: data.customer_address || '',
                shippingAddress: data.shipping_address || '',
                gstin: data.gstin || '',
              });
            }
          }
        }
        
        if (data.posting_date) {
          setDcDate(data.posting_date.split('T')[0]);
        }
        
        if (data.set_warehouse) {
          setWarehouse(data.set_warehouse);
        }
        
        if (data.transporter) {
          setTransporter(data.transporter);
        }
        
        if (data.vehicle_no) {
          setVehicleNumber(data.vehicle_no);
        }
        
        if (data.instructions) {
          setRemarks(data.instructions);
        }
        
        if (data.name) {
          setDcNumber(data.name);
        }
        
        if (data.sales_order_id) {
          setHasSalesOrder(true);
          setSelectedSalesOrder(String(data.sales_order_id));
        } else {
          setHasSalesOrder(false);
        }
        
        if (data.quality_inspection_id) {
          setQualityInspectionId(data.quality_inspection_id);
        }
        
        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
          const mappedItems: DeliveryChallanItem[] = data.items.map((item: any, index: number) => {
            const product = allProducts.find(p => p.itemCode === item.item_code);

            let taxId: number | undefined =
              item.item_tax_id ? Number(item.item_tax_id) :
              item.tax_id ? Number(item.tax_id) : undefined;
            let taxRate: number = item.tax_rate ?? item.tax ?? 0;

            if (taxId) {
              if (!taxRate || taxRate <= 0) {
                taxRate = getTaxRateFromId(taxId, taxOptions);
              }
            } else if (taxRate > 0) {
              taxId = getTaxIdFromRate(taxRate, taxOptions);
            } else if (product?.tax) {
              taxRate = product.tax;
              taxId = getTaxIdFromRate(taxRate, taxOptions);
            }

            const amount = (item.qty || 0) * (item.rate || 0);
            const taxAmount = (amount * taxRate) / 100;
            const { status: stockStatus, availableQty, inventoryRecords } = getStockStatus(item.item_code || '', item.qty || 0);
            let inventoryId: number | undefined;
            if (inventoryRecords && inventoryRecords.length > 0) {
              const sorted = [...inventoryRecords].sort((a, b) => b.actual_qty - a.actual_qty);
              inventoryId = sorted[0]?.id;
            }
            
            return {
              id: `existing-${index}`,
              itemCode: item.item_code || '',
              itemName: item.item_name || item.description || '',
              hsn: product?.hsn || item.hsn || '',
              description: item.description || '',
              quantity: item.qty || 1,
              unit: item.uom || item.stock_uom || 'pcs',
              rate: item.rate || 0,
              amount: amount,
              tax: taxRate,
              tax_id: taxId,
              taxAmount: taxAmount,
              totalAmount: item.total_amount || (amount + taxAmount),
              type: item.type === 'Services' ? 'service' : 'product',
              stockStatus: stockStatus,
              availableQty: availableQty,
              inventoryId: inventoryId,
            };
          });
          setItems(mappedItems);
        }
        
        toast.success(isViewMode ? 'Delivery Challan loaded' : 'Delivery Challan loaded for editing');
      } else {
        toast.error('Failed to load delivery challan');
        navigate('/delivery-challan');
      }
    } catch (error) {
      console.error('Error fetching delivery challan:', error);
      toast.error('Failed to load delivery challan');
      navigate('/delivery-challan');
    } finally {
      setIsLoadingData(false);
    }
  };

  // ===== VIEW QUALITY INSPECTION =====
  const handleViewQualityInspection = async () => {
    if (!id) {
      toast.error('No Delivery Challan ID found');
      return;
    }

    setIsLoadingInspection(true);
    try {
      const response = await deliveryChallanAPI.getQualityInspectionByDC(id);
      
      if (response.success && response.data) {
        const inspectionData = response.data.data || response.data;
        setViewInspectionData(inspectionData);
        setShowViewInspectionModal(true);
      } else {
        toast.error('No Quality Inspection found for this Delivery Challan');
      }
    } catch (error: any) {
      console.error('Error fetching inspection:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch Quality Inspection');
    } finally {
      setIsLoadingInspection(false);
    }
  };

  // ===== RESTORE STATE FROM QUALITY INSPECTION =====
  const restoreStateFromQI = useCallback(() => {
    if (isViewMode) return;

    const searchParams = new URLSearchParams(location.search);
    const returnFromQI = searchParams.get('returnFromQI');
    if (returnFromQI !== '1') return;

    const savedState = formNav.returnFromQualityInspection();
    if (!savedState) return;

    if (savedState.selectedCustomer) {
      setSelectedCustomer(savedState.selectedCustomer);
      const customer = customers.find(c => c.id === savedState.selectedCustomer);
      if (customer) {
        setCustomerData(customer);
      } else if (savedState.customerData) {
        setCustomerData(savedState.customerData);
      }
    }
    if (savedState.selectedSalesOrder !== undefined) {
      setSelectedSalesOrder(savedState.selectedSalesOrder);
    }
    if (savedState.isService !== undefined) {
      setIsService(savedState.isService);
    }
    if (savedState.dcDate) {
      setDcDate(savedState.dcDate);
    }
    if (savedState.warehouse) {
      setWarehouse(savedState.warehouse);
    }
    if (savedState.transporter) {
      setTransporter(savedState.transporter);
    }
    if (savedState.vehicleNumber) {
      setVehicleNumber(savedState.vehicleNumber);
    }
    if (savedState.remarks) {
      setRemarks(savedState.remarks);
    }
    if (savedState.items && Array.isArray(savedState.items) && savedState.items.length > 0) {
      itemsRestoredRef.current = true;
      setItems(savedState.items);
    }
    if (savedState.dcNumber) {
      setDcNumber(savedState.dcNumber);
    }
    if (savedState.hasSalesOrder !== undefined) {
      setHasSalesOrder(savedState.hasSalesOrder);
    }
    if (savedState.roundOff !== undefined) {
      setRoundOff(savedState.roundOff);
    }
    if (savedState.pendingQualityInspection) {
      setPendingQualityInspection(savedState.pendingQualityInspection);
      setQualityInspection(true);
    } else if (savedState.qualityInspection) {
      setQualityInspection(true);
    }
    if (savedState.qualityInspectionId) {
      setQualityInspectionId(savedState.qualityInspectionId);
    }

    toast.success('Delivery Challan data restored from Quality Inspection');

    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }, [formNav, customers, isViewMode, location.search]);

  useEffect(() => {
    restoreStateFromQI();
  }, []);

  useEffect(() => {
    if (selectedCustomer && !customerData && customers.length > 0) {
      const customer = customers.find(c => c.id === selectedCustomer);
      if (customer) {
        setCustomerData(customer);
      }
    }
  }, [customers, selectedCustomer, customerData]);

  const handleAddNewCustomer = useCallback((searchTerm: string) => {
    setQuickAddPrefillName(searchTerm || '');
    setShowQuickAddModal(true);
  }, []);

  const navigateToFullCustomerForm = useCallback((searchTerm: string) => {
    const formDataToSave = {
      selectedCustomer,
      selectedSalesOrder,
      isService,
      dcDate,
      warehouse,
      transporter,
      vehicleNumber,
      remarks,
      items,
      customerData,
      dcNumber,
      hasSalesOrder,
      roundOff,
      pendingQualityInspection,
      qualityInspection: !!pendingQualityInspection || qualityInspection,
      qualityInspectionId,
    };
    formState.saveFormState('delivery_challan', formDataToSave, id);

    const returnUrl = `${location.pathname}?returnFromCustomerAdd=1`;
    const params = new URLSearchParams();
    params.set('returnUrl', returnUrl);
    if (searchTerm) {
      params.set('name', searchTerm);
    }

    toast('Add the new customer, and you\'ll be brought back here automatically.', { icon: 'ℹ️' });
    navigate(`/customer/add?${params.toString()}`);
  }, [
    selectedCustomer, selectedSalesOrder, isService, dcDate, warehouse,
    transporter, vehicleNumber, remarks, items, customerData, dcNumber,
    hasSalesOrder, roundOff, qualityInspectionId, formState, id, location.pathname, navigate
  ]);

  // ===== RESTORE STATE AFTER ADDING A NEW CUSTOMER =====
  const restoreStateFromCustomerAdd = useCallback(async () => {
    const searchParams = new URLSearchParams(location.search);
    const returnFlag = searchParams.get('returnFromCustomerAdd');

    if (returnFlag !== '1' || isEditMode || isViewMode) {
      return;
    }

    const newCustomerId = searchParams.get('newCustomerId') || searchParams.get('customerId');

    const savedState = formState.restoreFormState('delivery_challan');
    if (savedState) {
      if (savedState.selectedSalesOrder !== undefined) setSelectedSalesOrder(savedState.selectedSalesOrder);
      if (savedState.isService !== undefined) setIsService(savedState.isService);
      if (savedState.dcDate) setDcDate(savedState.dcDate);
      if (savedState.warehouse) setWarehouse(savedState.warehouse);
      if (savedState.transporter) setTransporter(savedState.transporter);
      if (savedState.vehicleNumber) setVehicleNumber(savedState.vehicleNumber);
      if (savedState.remarks) setRemarks(savedState.remarks);
      if (savedState.items && Array.isArray(savedState.items)) {
        itemsRestoredRef.current = true;
        setItems(savedState.items);
      }
      if (savedState.dcNumber) setDcNumber(savedState.dcNumber);
      if (savedState.hasSalesOrder !== undefined) setHasSalesOrder(savedState.hasSalesOrder);
      if (savedState.roundOff !== undefined) setRoundOff(savedState.roundOff);
      if (savedState.qualityInspectionId) setQualityInspectionId(savedState.qualityInspectionId);
      if (!newCustomerId && savedState.selectedCustomer) {
        setSelectedCustomer(savedState.selectedCustomer);
        const customer = (customers.length > 0 ? customers : []).find(c => c.id === savedState.selectedCustomer);
        if (customer) setCustomerData(customer);
      }
    }

    if (newCustomerId) {
      setIsLoading(true);
      try {
        const response = await deliveryChallanAPI.getCustomers({ page: 1, limit: 100 });
        if (response.success && response.data) {
          let customerList: any[] = [];
          if (response.data.data && Array.isArray(response.data.data.records)) {
            customerList = response.data.data.records;
          } else if (Array.isArray(response.data)) {
            customerList = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            customerList = response.data.data;
          }

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

          const newCustomer = mappedCustomers.find(c => c.id === String(newCustomerId));
          if (newCustomer) {
            setSelectedCustomer(newCustomer.id);
            setCustomerData(newCustomer);
            setSelectedSalesOrder('');
            setSelectedOrderData(null);
            toast.success(`New customer "${newCustomer.name}" added and selected`);
          } else {
            toast.error('Customer was added, but could not be auto-selected. Please select it manually.');
          }
        }
      } catch (error) {
        console.error('Error refreshing customers after add:', error);
        toast.error('Failed to refresh customer list');
      } finally {
        setIsLoading(false);
      }
    }

    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }, [location.search, formState, isEditMode, isViewMode, customers]);

  useEffect(() => {
    restoreStateFromCustomerAdd();
  }, [location.search]);

  useEffect(() => {
    fetchTaxOptions();
    fetchInventory();
    fetchCustomers();
    fetchAllItems();
    fetchWarehouses();
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const isReturningFromQI = searchParams.get('returnFromQI') === '1';

    if (isReturningFromQI) return;

    if (
      (isEditMode || isViewMode) &&
      id &&
      customers.length > 0 &&
      allProducts.length > 0 &&
      taxOptions.length > 0
    ) {
      fetchDeliveryChallanForEdit(id);
    }
  }, [
    isEditMode,
    isViewMode,
    id,
    customers.length,
    allProducts.length,
    taxOptions.length,
    location.search
  ]);

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

  const fetchWarehouses = async () => {
    setIsLoadingWarehouses(true);
    try {
      const response = await deliveryChallanAPI.getWarehouses({ page: 1, limit: 10 });
      if (response.success && response.data?.data?.records) {
        const warehouseList: Warehouse[] = response.data.data.records;
        setWarehouses(warehouseList);
        
        if (!isEditMode && !isViewMode) {
          const finishedGoods = warehouseList.find(
            w => w.warehouse_name.toLowerCase() === 'finished goods'
          );

          setWarehouse(prev => {
            if (prev) return prev;
            if (finishedGoods) return finishedGoods.warehouse_name;
            return warehouseList.length > 0 ? warehouseList[0].warehouse_name : prev;
          });
        }
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      toast.error('Failed to fetch warehouses');
    } finally {
      setIsLoadingWarehouses(false);
    }
  };

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await deliveryChallanAPI.getCustomers({ page: 1, limit: 100 });
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
      toast.error('Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (taxOptions.length > 0 && allProducts.length > 0) {
      setAllProducts(prev => prev.map(p => {
        const taxInfo = getTaxRateFromItem(p.rawItem || p, taxOptions);
        return {
          ...p,
          tax: taxInfo.rate,
          tax_id: taxInfo.tax_id,
          tax_type: taxInfo.tax_type,
        };
      }));
      setProducts(prev => prev.map(p => {
        const taxInfo = getTaxRateFromItem(p.rawItem || p, taxOptions);
        return {
          ...p,
          tax: taxInfo.rate,
          tax_id: taxInfo.tax_id,
          tax_type: taxInfo.tax_type,
        };
      }));
    }
  }, [taxOptions]);

  const fetchAllItems = async () => {
    setIsLoadingItems(true);
    try {
      const response = await deliveryChallanAPI.getItems({ page: 1, limit: 100 });
      if (response.success && response.data?.data) {
        const itemsData = response.data.data.map((item: any) => {
          const rawSellingPrice = item.selling_price ?? item.sellingPrice ?? item.mrp;
          const sellingPriceNum = rawSellingPrice !== undefined && rawSellingPrice !== null && rawSellingPrice !== '' ? Number(rawSellingPrice) : 0;
          const rawBasePrice = item.standard_rate ?? item.standardRate ?? item.base_price ?? item.basePrice;
          const basePriceNum = rawBasePrice !== undefined && rawBasePrice !== null && rawBasePrice !== '' ? Number(rawBasePrice) : 0;
          const fallbackRate = Number(item.rate) || 0;
          const baseRateVal = basePriceNum > 0 ? basePriceNum : (sellingPriceNum > 0 ? sellingPriceNum : fallbackRate);
          const finalSellingPriceVal = sellingPriceNum > 0 ? sellingPriceNum : (basePriceNum > 0 ? basePriceNum : fallbackRate);

          const taxInfo = getTaxRateFromItem(item, taxOptions);

          return {
            id: item.id?.toString() || item.name || '',
            itemCode: item.item_code || item.name || '',
            itemName: item.item_name || '',
            hsn: item.HSN || item.hsn || '',
            description: item.description || item.item_name || '',
            unit: item.stock_uom || 'pcs',
            rate: baseRateVal,
            tax: taxInfo.rate,
            tax_id: taxInfo.tax_id,
            tax_type: taxInfo.tax_type,
            rawTaxId: item.tax_id ?? item.taxId ?? item.tax_type_id,
            rawTaxType: item.tax_type ?? item.taxType ?? item.tax_name,
            rawTaxRate: item.tax ?? item.tax_rate ?? item.gst_rate ?? item.gst ?? item.tax_percent,
            rawItem: item,
            type: 'product' as 'product' | 'service',
            stockUom: item.stock_uom,
            standardRate: basePriceNum,
            sellingPrice: finalSellingPriceVal,
            mrp: finalSellingPriceVal,
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
          };
        });
        setAllProducts(itemsData);
        setProducts(itemsData);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Failed to fetch items');
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleItemSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setProducts(allProducts);
      return;
    }

    try {
      const response = await deliveryChallanAPI.getItems({ page: 1, limit: 50, search: searchTerm });
      if (response.success && response.data?.data) {
        const itemsData = response.data.data.map((item: any) => {
          const rawSellingPrice = item.selling_price ?? item.sellingPrice ?? item.mrp;
          const sellingPriceNum = rawSellingPrice !== undefined && rawSellingPrice !== null && rawSellingPrice !== '' ? Number(rawSellingPrice) : 0;
          const rawBasePrice = item.standard_rate ?? item.standardRate ?? item.base_price ?? item.basePrice;
          const basePriceNum = rawBasePrice !== undefined && rawBasePrice !== null && rawBasePrice !== '' ? Number(rawBasePrice) : 0;
          const fallbackRate = Number(item.rate) || 0;
          const baseRateVal = basePriceNum > 0 ? basePriceNum : (sellingPriceNum > 0 ? sellingPriceNum : fallbackRate);
          const finalSellingPriceVal = sellingPriceNum > 0 ? sellingPriceNum : (basePriceNum > 0 ? basePriceNum : fallbackRate);

          const taxInfo = getTaxRateFromItem(item, taxOptions);

          return {
            id: item.id?.toString() || item.name || '',
            itemCode: item.item_code || item.name || '',
            itemName: item.item_name || '',
            hsn: item.HSN || item.hsn || '',
            description: item.description || item.item_name || '',
            unit: item.stock_uom || 'pcs',
            rate: baseRateVal,
            tax: taxInfo.rate,
            tax_id: taxInfo.tax_id,
            tax_type: taxInfo.tax_type,
            rawTaxId: item.tax_id ?? item.taxId ?? item.tax_type_id,
            rawTaxType: item.tax_type ?? item.taxType ?? item.tax_name,
            rawTaxRate: item.tax ?? item.tax_rate ?? item.gst_rate ?? item.gst ?? item.tax_percent,
            rawItem: item,
            type: 'product' as 'product' | 'service',
            stockUom: item.stock_uom,
            standardRate: basePriceNum,
            sellingPrice: finalSellingPriceVal,
            mrp: finalSellingPriceVal,
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
          };
        });
        setProducts(itemsData);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  }, [allProducts, taxOptions]);

  const loadCustomerData = (customerId: string, customer?: Customer) => {
    const customerData = customer || customers.find(c => c.id === customerId);
    if (customerData) {
      setCustomerData(customerData);
      setSelectedSalesOrder('');
      setSelectedOrderData(null);
      if (!isEditMode && !isViewMode || items.length === 0) {
        itemsRestoredRef.current = true;
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
          inventoryId: undefined,
        }]);
      }
      toast.success(`Selected ${customerData.name}`);
    }
  };

  const handleCustomerChange = (customerId: string, customerData?: Customer) => {
    if (isViewMode) return;
    setSelectedCustomer(customerId);
    if (customerId && customerData) {
      loadCustomerData(customerId, customerData);
    } else {
      setCustomerData(null);
      setSelectedSalesOrder('');
      setSelectedOrderData(null);
    }
  };

  const loadSalesOrder = (_soId: string, orderData?: SalesOrder) => {
    if (!orderData) return;

    setSelectedOrderData(orderData);

    const orderTaxId = orderData.tax_id ? parseInt(orderData.tax_id, 10) : undefined;
    const orderTaxRate = orderTaxId ? getTaxRateFromId(orderTaxId, taxOptions) : 0;

    if (orderData.items && orderData.items.length > 0) {
      const initialItems: DeliveryChallanItem[] = orderData.items.map((item, index) => {
        const product = allProducts.find(p => p.itemCode === item.item_code);
        
        let taxRate = 0;
        let tax_id: number | undefined = undefined;
        
        if (item.tax_id) {
          tax_id = typeof item.tax_id === 'string' ? parseInt(item.tax_id, 10) : item.tax_id;
          taxRate = getTaxRateFromId(tax_id, taxOptions);
        } else if (orderTaxId) {
          tax_id = orderTaxId;
          taxRate = orderTaxRate;
        } else if (product?.tax) {
          taxRate = product.tax;
          tax_id = getTaxIdFromRate(taxRate, taxOptions);
        }
        
        if (taxRate === 0 && tax_id) {
          taxRate = getTaxRateFromId(tax_id, taxOptions);
        }
        
        if (taxRate === 0 && item.tax) {
          taxRate = item.tax;
          tax_id = getTaxIdFromRate(taxRate, taxOptions);
        }
        
        const amount = (item.qty || 0) * (item.rate || 0);
        const taxAmount = (amount * taxRate) / 100;
        const { status, availableQty, inventoryRecords } = getStockStatus(item.item_code || '', item.qty || 0);
        let inventoryId: number | undefined;
        if (inventoryRecords && inventoryRecords.length > 0) {
          const sorted = [...inventoryRecords].sort((a, b) => b.actual_qty - a.actual_qty);
          inventoryId = sorted[0]?.id;
        }
        
        return {
          id: `so-${index}`,
          itemCode: item.item_code || '',
          itemName: item.description || '',
          hsn: product?.hsn || '',
          description: item.description || '',
          quantity: item.qty || 1,
          unit: item.uom || 'pcs',
          rate: item.rate || 0,
          amount: amount,
          tax: taxRate,
          tax_id: tax_id,
          taxAmount: taxAmount,
          totalAmount: amount + taxAmount,
          type: isService ? 'service' : 'product',
          stockStatus: status,
          availableQty: availableQty,
          inventoryId: inventoryId,
        };
      });
      itemsRestoredRef.current = true;
      setItems(initialItems);
    } else {
      itemsRestoredRef.current = true;
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
        inventoryId: undefined,
      }]);
    }

    setErrors({});
    toast.success(`Loaded order #${orderData.id}`);
  };

  const handleSalesOrderChange = (soId: string, orderData?: SalesOrder) => {
    if (isViewMode) return;
    setSelectedSalesOrder(soId);
    if (soId && orderData) {
      loadSalesOrder(soId, orderData);
    } else {
      setSelectedOrderData(null);
    }
  };

  const addItem = () => {
    if (isViewMode) return;
    const newItem: DeliveryChallanItem = {
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
      inventoryId: undefined,
    };
    itemsRestoredRef.current = true;
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (isViewMode) return;
    if (items.length <= 1) {
      toast.error('At least one item is required');
      return;
    }
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof DeliveryChallanItem, value: any, productOption?: Product) => {
    if (isViewMode) return;
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };

          if (field === 'itemCode') {
            const product = productOption
              || allProducts.find(p => p.itemCode === value || p.id === value || p.itemName === value)
              || products.find(p => p.itemCode === value || p.id === value || p.itemName === value);
            if (product) {
              const rawBasePrice = product.rawItem?.standard_rate ?? product.rawItem?.standardRate ?? product.rawItem?.base_price ?? product.rawItem?.basePrice ?? product.standardRate;
              const parsedBasePrice = rawBasePrice !== undefined && rawBasePrice !== null && rawBasePrice !== '' ? Number(rawBasePrice) : 0;
              const basePrice = parsedBasePrice > 0 ? parsedBasePrice : (product.rate || 0);

              const taxInfo = getTaxRateFromItem(
                product.rawItem || {
                  tax_id: product.rawTaxId ?? product.tax_id,
                  tax_type: product.rawTaxType ?? product.tax_type,
                  tax: product.tax ?? product.rawTaxRate,
                },
                taxOptions
              );
              const taxRate = taxInfo.rate;
              const tax_id = taxInfo.tax_id;

              const qty = updated.quantity || 1;
              const baseAmount = qty * basePrice;
              const taxAmount = (baseAmount * taxRate) / 100;
              const totalAmount = baseAmount + taxAmount;

              const { status, availableQty, inventoryRecords } = getStockStatus(product.itemCode, qty);
              let inventoryId: number | undefined;
              if (inventoryRecords && inventoryRecords.length > 0) {
                const sorted = [...inventoryRecords].sort((a, b) => b.actual_qty - a.actual_qty);
                inventoryId = sorted[0]?.id;
              }

              updated.itemCode = product.itemCode || value;
              updated.itemName = product.itemName || '';
              updated.hsn = product.hsn || '';
              updated.description = product.description || '';
              updated.unit = product.unit || 'pcs';
              updated.quantity = qty;
              updated.rate = basePrice;
              updated.standardRate = basePrice;
              updated.sellingPrice = totalAmount;
              updated.tax = taxRate;
              updated.tax_id = tax_id;
              updated.amount = baseAmount;
              updated.taxAmount = taxAmount;
              updated.totalAmount = totalAmount;
              updated.stockStatus = status;
              updated.availableQty = availableQty;
              updated.inventoryId = inventoryId;
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
            const qty = parseFloat(value) || 0;
            const baseRate = updated.rate || 0;
            const baseAmount = qty * baseRate;
            const taxRate = updated.tax || 0;
            const taxAmount = (baseAmount * taxRate) / 100;
            const totalAmount = baseAmount + taxAmount;

            updated.quantity = qty;
            updated.amount = baseAmount;
            updated.taxAmount = taxAmount;
            updated.totalAmount = totalAmount;

            if (updated.itemCode) {
              const { status, availableQty, inventoryRecords } = getStockStatus(updated.itemCode, qty);
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
            const newBaseRate = parseFloat(value) || 0;
            const qty = updated.quantity || 0;
            const baseAmount = qty * newBaseRate;
            const taxRate = updated.tax || 0;
            const taxAmount = (baseAmount * taxRate) / 100;
            const totalAmount = baseAmount + taxAmount;

            updated.rate = newBaseRate;
            updated.standardRate = newBaseRate;
            updated.amount = baseAmount;
            updated.taxAmount = taxAmount;
            updated.totalAmount = totalAmount;
          }

          if (field === 'tax') {
            const taxRate = Number(value) || 0;
            const tax_id = getTaxIdFromRate(taxRate, taxOptions);
            const qty = updated.quantity || 0;
            const baseRate = updated.rate || 0;
            const baseAmount = qty * baseRate;
            const taxAmount = (baseAmount * taxRate) / 100;
            const totalAmount = baseAmount + taxAmount;

            updated.tax = taxRate;
            updated.tax_id = tax_id;
            updated.amount = baseAmount;
            updated.taxAmount = taxAmount;
            updated.totalAmount = totalAmount;
          }

          if (field === 'tax_id') {
            const tax_id = Number(value) || undefined;
            const taxRate = getTaxRateFromId(tax_id, taxOptions);
            const qty = updated.quantity || 0;
            const baseRate = updated.rate || 0;
            const baseAmount = qty * baseRate;
            const taxAmount = (baseAmount * taxRate) / 100;
            const totalAmount = baseAmount + taxAmount;

            updated.tax = taxRate;
            updated.tax_id = tax_id;
            updated.amount = baseAmount;
            updated.taxAmount = taxAmount;
            updated.totalAmount = totalAmount;
          }

          return updated;
        }
        return item;
      })
    );
  };

  // ===== NAVIGATE TO QUALITY INSPECTION =====
  const navigateToQualityInspection = () => {
    const hasItems = items.some(item => item.itemCode && item.quantity > 0);
    if (!hasItems) {
      toast.error('Please add at least one item before creating a Quality Inspection');
      return;
    }

    const formDataToSave = {
      selectedCustomer,
      selectedSalesOrder,
      isService,
      dcDate,
      warehouse,
      transporter,
      vehicleNumber,
      remarks,
      items,
      customerData,
      dcNumber,
      hasSalesOrder,
      roundOff,
      pendingQualityInspection: pendingQualityInspection
        ? JSON.parse(JSON.stringify(pendingQualityInspection))
        : null,
      qualityInspection: !!pendingQualityInspection || qualityInspection,
      qualityInspectionId,
    };

    const firstItem = items.find(item => item.itemCode && item.quantity > 0);

    setQualityInspection(true);

    formNav.navigateToQualityInspection(
      formDataToSave,
      {
        docNo: dcNumber || '',
        sourceId: id,
        partProductName: firstItem?.itemName || firstItem?.itemCode || '',
        partNo: firstItem?.itemCode || '',
        customerName: customerData?.name || '',
        challanNoDate: dcNumber || '',
        invoiceQty: getTotalQty(),
        reportNo: `QIR-${dcNumber || Date.now()}`,
      },
      id
    );

    toast.success('Opening Quality Inspection for this delivery challan');
  };

  const handleNavigateToExistingQI = () => {
    if (!pendingQualityInspection?.formData) {
      toast.error('No Quality Inspection is attached to this Delivery Challan');
      return;
    }

    const formDataToSave = {
      selectedCustomer,
      selectedSalesOrder,
      isService,
      dcDate,
      warehouse,
      transporter,
      vehicleNumber,
      remarks,
      items,
      customerData,
      dcNumber,
      hasSalesOrder,
      roundOff,
      pendingQualityInspection,
      qualityInspection: true,
      qualityInspectionId,
    };

    formNav.navigateToQualityInspectionView(
      formDataToSave,
      {
        docNo: dcNumber || pendingQualityInspection.formData.docNo || '',
        sourceId: id,
        partProductName: pendingQualityInspection.formData.partProductName || '',
        partNo: pendingQualityInspection.formData.partNo || '',
        customerName: pendingQualityInspection.formData.customerName || customerData?.name || '',
        challanNoDate: pendingQualityInspection.formData.challanNoDate || dcNumber || '',
        invoiceQty: pendingQualityInspection.formData.invoiceQty || getTotalQty(),
        reportNo: pendingQualityInspection.formData.reportNo || '',
      },
      id
    );
  };

  const getTotalQty = () => items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const getTotalAmount = () => items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const getTotalTax = () => items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
  const getGrandTotal = () => items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);

  // ===== UPDATE INVENTORY FUNCTION =====
  const updateInventory = async (itemsToUpdate: DeliveryChallanItem[]) => {
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
        company: record.company || 'ChandraTara Industries',
        valuation_rate: record.valuation_rate || 0,
        type: record.type || 'Internal',
      };

      updatePromises.push(
        deliveryChallanAPI.updateInventory(item.inventoryId, updatePayload)
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

  // ===== BUILD PAYLOAD WITH QUALITY INSPECTION ID =====
  const buildPayload = (): DeliveryNotePayload => {
    const selectedWarehouse = warehouses.find(w => w.warehouse_name === warehouse);
    
    const payload: DeliveryNotePayload = {
      naming_series: "DN-.YYYY.-",
      customer_id: customerData?.id ? parseInt(customerData.id, 10) : 0,
      customer_name: customerData?.name || '',
      posting_date: dcDate,
      company: 'ChandraTara Industries',
      set_warehouse: selectedWarehouse?.warehouse_name || warehouse || '',
      transporter: transporter || '',
      vehicle_no: vehicleNumber || '',
      driver_name: transporter || '',
      lr_no: null,
      lr_date: null,
      sales_order_id: hasSalesOrder && selectedSalesOrder ? parseInt(selectedSalesOrder, 10) : null,
      grand_total: getGrandTotal(),
      instructions: remarks || '',
      status: 'Submitted',
      type: isService ? 'Services' : 'Products',
      quality_inspection_id: qualityInspectionId || null,
      items: items
        .filter(item => item.itemCode && item.quantity > 0)
        .map(item => {
          const itemTaxId = item.tax_id ?? getTaxIdFromRate(item.tax || 0, taxOptions) ?? null;
          return {
            name: item.itemName || item.itemCode,
            item_code: item.itemCode,
            item_name: item.itemName || item.itemCode,
            description: item.description || item.itemName || item.itemCode,
            qty: item.quantity,
            uom: item.unit,
            rate: item.rate,
            amount: item.amount,
            tax: item.tax || 0,
            tax_rate: item.tax || 0,
            tax_id: itemTaxId,
            item_tax_id: itemTaxId,
            tax_amount: item.taxAmount || 0,
            total_amount: item.totalAmount || 0,
            warehouse: selectedWarehouse?.warehouse_name || warehouse || '',
            type: item.type
          };
        })
    };

    if (isEditMode && id) {
      payload.id = id;
    }

    return payload;
  };

  // ===== SAVE PENDING QUALITY INSPECTION =====
  const savePendingQualityInspection = async (createdDC: any, responseData: any): Promise<any> => {
    if (!pendingQualityInspection?.payload) {
      // If there's already a qualityInspectionId, use it
      if (qualityInspectionId) {
        return { data: { headerId: qualityInspectionId } };
      }
      return null;
    }

    const pending = pendingQualityInspection;
    const payload = JSON.parse(JSON.stringify(pending.payload));
    const inspectionForm = pending.formData || {};
    const parameters = Array.isArray(inspectionForm.parameters) ? inspectionForm.parameters : [];

    const savedParameters: Record<string, number> = {};
    const savedMethods: Record<string, number> = {};

    // Create masters that don't have IDs
    for (const row of parameters) {
      const name = String(row?.parameter || '').trim();
      if (!name || row?.parameterId) continue;
      const r = await api.post('/quality-parameter', {
        parameter_name: name,
        parameter_code: name.substring(0, 10).toUpperCase().replace(/\s+/g, '_'),
        parameter_group_id: 1,
        default_method_id: null,
        unit: null,
        description: 'Auto-created from inspection form',
        is_mandatory: 0,
        is_active: 1
      });
      if (r.data?.success !== 1 || !r.data?.data) {
        throw new Error(r.data?.message || `Failed to save parameter: ${name}`);
      }
      const id = r.data.data.id || r.data.data.parameter_id || r.data.data.insertId;
      if (!id) throw new Error(`No ID returned for parameter: ${name}`);
      savedParameters[name] = Number(id);
    }

    for (const row of parameters) {
      const name = String(row?.inspectionMethod || '').trim();
      if (!name || row?.inspectionMethodId) continue;
      const r = await api.post('/inspection-method', {
        method_name: name,
        description: 'Auto-created from inspection form',
        is_active: 1
      });
      if (r.data?.success !== 1 || !r.data?.data) {
        throw new Error(r.data?.message || `Failed to save inspection method: ${name}`);
      }
      const id = r.data.data.id || r.data.data.method_id || r.data.data.insertId;
      if (!id) throw new Error(`No ID returned for inspection method: ${name}`);
      savedMethods[name] = Number(id);
    }

    payload.details = (payload.details || []).map((detail: any, index: number) => {
      const row = parameters[index] || {};
      const parameterName = String(row.parameter || '').trim();
      const methodName = String(row.inspectionMethod || '').trim();
      return {
        ...detail,
        parameter_id: Number(row.parameterId || savedParameters[parameterName] || detail.parameter_id || 0),
        inspection_method_id: Number(row.inspectionMethodId || savedMethods[methodName] || detail.inspection_method_id || 0)
      };
    });

    // Set reference info if we have a DC
    if (createdDC) {
      const dcId = getPrintDeliveryChallanId(createdDC) ?? getPrintDeliveryChallanId(responseData) ?? null;
      const dcName = createdDC?.data?.delivery_note || createdDC?.delivery_note || createdDC?.name || dcNumber;
      
      payload.reference_type = 'Delivery Challan';
      payload.reference_id = dcId && /^\d+$/.test(String(dcId)) ? Number(dcId) : 0;
      payload.source_type = 'delivery_challan';
      payload.source_id = payload.reference_id || undefined;
      payload.doc_no = dcName || payload.doc_no || dcNumber;
      payload.challan_no_date = dcName || payload.challan_no_date || dcNumber;
    } else {
      // If no DC yet, set source info
      payload.source_type = 'delivery_challan';
      payload.source_id = id ? Number(id) : undefined;
    }

    const qiResponse = await api.post('/quality-inspection', payload);
    if (qiResponse.data?.success !== 1) {
      throw new Error(qiResponse.data?.message || 'Failed to save Quality Inspection');
    }

    const headerId = qiResponse.data?.data?.headerId;
    if (headerId) {
      setQualityInspectionId(headerId);
    }

    return qiResponse.data;
  };

  // ===== VALIDATE FORM =====
  const validateForm = (): boolean => {
    if (isViewMode) return true;
    const newErrors: { [key: string]: string } = {};
    
    if (!selectedCustomer) {
      newErrors.customer = 'Please select a customer';
    }
    
    if (hasSalesOrder && !selectedSalesOrder) {
      newErrors.salesOrder = 'Please select a sales order';
    }
    
    if (!dcDate) {
      newErrors.dcDate = 'DC Date is required';
    }
    
    if (!warehouse) {
      newErrors.warehouse = 'Warehouse is required';
    }
    
    const hasItems = items.some(item => item.itemCode && item.quantity > 0);
    if (!hasItems) {
      newErrors.items = 'At least one item is required';
    }
    
    items.forEach((item, index) => {
      if (!item.itemCode) {
        newErrors[`item_${index}_code`] = 'Item code is required';
      }
      if (!item.itemName) {
        newErrors[`item_${index}_name`] = 'Item name is required';
      }
      if (item.quantity <= 0) {
        newErrors[`item_${index}_qty`] = 'Quantity must be greater than 0';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const scrollToFirstError = () => {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length === 0) return;
    
    const priorityOrder = ['customer', 'salesOrder', 'dcDate', 'warehouse', 'items'];
    
    const sortedErrorKeys = errorKeys.sort((a, b) => {
      const indexA = priorityOrder.indexOf(a);
      const indexB = priorityOrder.indexOf(b);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });
    
    const firstErrorKey = sortedErrorKeys[0];
    if (!firstErrorKey) return;
    
    let element: Element | null = null;
    element = document.querySelector(`[data-error-key="${firstErrorKey}"]`);
    
    if (!element && firstErrorKey.startsWith('item_')) {
      const match = firstErrorKey.match(/item_(\d+)_(code|name|qty)/);
      if (match) {
        const index = parseInt(match[1]);
        const field = match[2];
        const rows = document.querySelectorAll('.ndc-items-table tbody tr');
        if (rows[index]) {
          element = rows[index];
          if (field === 'code') {
            const input = rows[index].querySelector('.ndc-col-code input');
            if (input) element = input;
          } else if (field === 'name') {
            const input = rows[index].querySelector('.ndc-col-name input');
            if (input) element = input;
          } else if (field === 'qty') {
            const input = rows[index].querySelector('.ndc-col-qty input');
            if (input) element = input;
          }
        }
      }
    }
    
    if (!element) {
      const errorElements = document.querySelectorAll('.ndc-input-error, .ndc-select-error, .ndc-table-input.ndc-input-error');
      if (errorElements.length > 0) {
        element = errorElements[0];
      }
    }
    
    if (!element) {
      const errorTexts = document.querySelectorAll('.ndc-error-text');
      if (errorTexts.length > 0) {
        const parent = errorTexts[0].closest('.ndc-field, .ndc-field-half, .ndc-field-full, .ndc-col-code, .ndc-col-name, .ndc-col-qty');
        if (parent) {
          element = parent;
        }
      }
    }
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = element.querySelector('input, select, textarea') || element;
      if (input && typeof (input as HTMLElement).focus === 'function') {
        setTimeout(() => {
          (input as HTMLElement).focus();
          if ((input as HTMLInputElement).select) {
            (input as HTMLInputElement).select();
          }
        }, 350);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ===== SHARED DELIVERY CHALLAN PRINT =====
  const buildDeliveryChallanPrintHtml = (challan: DeliveryChallanPrintData): string => {
    const printItems = challan.items || [];
    const totalQty = printItems.reduce((sum, item) => sum + (item.qty || 0), 0);
    const grandTotal = challan.grand_total || 0;

    const itemRows = printItems.map((item, idx) => `
      <tr>
        <td class="pq-col-sl">${idx + 1}</td>
        <td class="pq-col-desc">
          ${printEscapeHtml(item.item_name || item.item_code || '')}
          ${item.item_code ? `<div class="pq-item-sub">${printEscapeHtml(item.item_code)}</div>` : ''}
          ${item.description ? `<div class="pq-item-desc">${printEscapeHtml(item.description)}</div>` : ''}
        </td>
        <td class="pq-col-qty">${item.qty || 0} ${printEscapeHtml(item.stock_uom || item.uom || 'Nos')}</td>
        <td class="pq-col-rate">${(item.rate || 0).toFixed(2)}</td>
        <td class="pq-col-amt">${(item.amount || 0).toFixed(2)}</td>
      </tr>
    `).join('');

    const customer = challan.customer_details;

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>${printEscapeHtml(challan.displayDcNumber || challan.name || 'Delivery Challan')}</title>
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
  .pq-col-desc { min-width: 200px; }
  .pq-item-sub { font-size: 10px; color: #555; }
  .pq-item-desc { font-size: 10px; color: #666; margin-top: 2px; }
  .pq-col-qty { width: 80px; text-align: right; }
  .pq-col-rate { width: 70px; text-align: right; }
  .pq-col-amt { width: 90px; text-align: right; }
  .pq-total-row td { border-top: 1px solid #000; font-weight: bold; padding: 6px; }
  .pq-words { display: flex; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px 8px; justify-content: space-between; align-items: flex-start; }
  .pq-words-label { font-size: 10px; color: #444; }
  .pq-eoe { font-size: 11px; font-style: italic; white-space: nowrap; }
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
  @media print {
    body { padding: 0; }
    @page { margin: 12mm; }
  }
</style>
</head>
<body>
  <div class="pq-outer">
    <div class="pq-title-row">
      <div class="pq-title">DELIVERY CHALLAN</div>
      <span style="position:absolute;right:12px;font-size:11px;color:#555;">
        <span class="pq-status-badge pq-status-${printEscapeHtml(challan.status || 'Draft')}">${printEscapeHtml(challan.status || 'Draft')}</span>
      </span>
    </div>

    <div class="pq-top">
      <div class="pq-company-box">
        <div class="pq-company-name">${printEscapeHtml(printCompanyDetails.name)}</div>
        <div>${printEscapeHtml(printCompanyDetails.address)}</div>
        <div>Phone: ${printEscapeHtml(printCompanyDetails.contact)}</div>
        ${printCompanyDetails.email ? `<div>Email: ${printEscapeHtml(printCompanyDetails.email)}</div>` : ''}
        ${printCompanyDetails.gstin ? `<div>GSTIN/UIN: ${printEscapeHtml(printCompanyDetails.gstin)}</div>` : ''}
        <div>State Name : ${printEscapeHtml(printCompanyDetails.stateName)}, Code : ${printEscapeHtml(printCompanyDetails.stateCode)}</div>
      </div>
      <div class="pq-meta-box">
        <div class="pq-meta-row">
          <div class="pq-meta-cell">
            <div class="pq-meta-label">DC No.</div>
            <div class="pq-meta-value">${printEscapeHtml(challan.displayDcNumber || challan.name || '')}</div>
          </div>
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Date</div>
            <div class="pq-meta-value">${printEscapeHtml(printFormatDate(challan.posting_date))}</div>
          </div>
        </div>
        <div class="pq-meta-row">
          <div class="pq-meta-cell">
            <div class="pq-meta-label">Warehouse</div>
            <div class="pq-meta-value">${printEscapeHtml(challan.set_warehouse || '')}</div>
          </div>
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Transporter</div>
            <div class="pq-meta-value">${printEscapeHtml(challan.transporter || challan.driver_name || '')}</div>
          </div>
        </div>
        <div class="pq-meta-row">
          <div class="pq-meta-cell">
            <div class="pq-meta-label">Vehicle No.</div>
            <div class="pq-meta-value">${printEscapeHtml(challan.vehicle_no || '')}</div>
          </div>
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Sales Order</div>
            <div class="pq-meta-value">${challan.sales_order_id ? `#${printEscapeHtml(String(challan.sales_order_id))}` : 'N/A'}</div>
          </div>
        </div>
        ${challan.instructions ? `
        <div class="pq-meta-row">
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Instructions</div>
            <div class="pq-meta-value">${printEscapeHtml(challan.instructions)}</div>
          </div>
        </div>` : ''}
      </div>
    </div>

    <div class="pq-parties">
      <div class="pq-party-box">
        <div class="pq-party-label">Consignee (Ship to)</div>
        <div><strong>${printEscapeHtml(challan.customer_name || '')}</strong></div>
        ${customer?.primary_address ? `<div>${printEscapeHtml(customer.primary_address)}</div>` : ''}
        ${customer?.mobile_no ? `<div>Phone: ${printEscapeHtml(customer.mobile_no)}</div>` : ''}
        ${customer?.email_id ? `<div>Email: ${printEscapeHtml(customer.email_id)}</div>` : ''}
        ${customer?.gstin ? `<div>GSTIN/UIN : ${printEscapeHtml(customer.gstin)}</div>` : ''}
        ${customer?.state ? `<div>State: ${printEscapeHtml(customer.state)}${customer?.state_code ? ` (${printEscapeHtml(customer.state_code)})` : ''}</div>` : ''}
      </div>
      <div class="pq-party-box">
        <div class="pq-party-label">Buyer (Bill to)</div>
        <div><strong>${printEscapeHtml(challan.customer_name || '')}</strong></div>
        ${customer?.primary_address ? `<div>${printEscapeHtml(customer.primary_address)}</div>` : ''}
        ${customer?.mobile_no ? `<div>Phone: ${printEscapeHtml(customer.mobile_no)}</div>` : ''}
        ${customer?.email_id ? `<div>Email: ${printEscapeHtml(customer.email_id)}</div>` : ''}
        ${customer?.gstin ? `<div>GSTIN/UIN : ${printEscapeHtml(customer.gstin)}</div>` : ''}
        ${customer?.state ? `<div>State: ${printEscapeHtml(customer.state)}${customer?.state_code ? ` (${printEscapeHtml(customer.state_code)})` : ''}</div>` : ''}
      </div>
    </div>

    <table class="pq-items">
      <thead>
        <tr>
          <th class="pq-col-sl">#</th>
          <th class="pq-col-desc">Description of Goods</th>
          <th class="pq-col-qty">Quantity</th>
          <th class="pq-col-rate">Rate</th>
          <th class="pq-col-amt">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        <tr class="pq-total-row">
          <td colspan="2">Total</td>
          <td class="pq-col-qty">${totalQty} ${printItems.length > 0 ? printEscapeHtml(printItems[0]?.stock_uom || printItems[0]?.uom || 'Nos') : 'Nos'}</td>
          <td class="pq-col-rate"></td>
          <td class="pq-col-amt">${grandTotal.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div class="pq-words">
      <div>
        <div class="pq-words-label">Amount Chargeable (in words)</div>
        <div><strong>INR ${printNumberToIndianWords(grandTotal)} Only</strong></div>
      </div>
      <div class="pq-eoe">E.&amp;O.E</div>
    </div>

    <div class="pq-bottom">
      <div class="pq-decl-box">
        <strong>Declaration</strong>
        <div style="margin-top:4px;">We declare that the goods described above are as per the delivery challan and all particulars are true and correct.</div>
        ${printCompanyDetails.panNo ? `<div style="margin-top:8px;">Company's PAN : ${printEscapeHtml(printCompanyDetails.panNo)}</div>` : ''}
      </div>
      <div class="pq-sign-box">
        <div>
          <div><strong>Delivery Details</strong></div>
          ${challan.transporter ? `<div>Transporter: ${printEscapeHtml(challan.transporter)}</div>` : ''}
          ${challan.vehicle_no ? `<div>Vehicle No: ${printEscapeHtml(challan.vehicle_no)}</div>` : ''}
          ${challan.driver_name ? `<div>Driver: ${printEscapeHtml(challan.driver_name)}</div>` : ''}
        </div>
        <div class="pq-signatory">
          for ${printEscapeHtml(printCompanyDetails.name)}<br /><br /><br />
          Authorised Signatory
        </div>
      </div>
    </div>

    <div class="pq-footer">
      ${printCompanyDetails.jurisdiction ? `<div>SUBJECT TO ${printEscapeHtml(printCompanyDetails.jurisdiction)} JURISDICTION</div>` : ''}
      <div>This is a computer generated delivery challan. ${challan.status === 'Submitted' ? '✓ Submitted' : ''}</div>
    </div>
  </div>

  <script>
    window.onload = function () { window.print(); };
  </script>
</body>
</html>`;
  };

  const buildCurrentDeliveryChallanPrintData = (): DeliveryChallanPrintData => {
    const validItems = items.filter(item => item.itemCode && item.quantity > 0);
    const numericId = id && /^\d+$/.test(String(id)) ? Number(id) : undefined;
    const fallbackDisplayNumber = numericId !== undefined
      ? printFormatDcNumber(numericId)
      : dcNumber;

    return {
      id: numericId ?? id ?? dcNumber,
      name: dcNumber || String(id || ''),
      customer_id: selectedCustomer || '',
      customer_name: customerData?.name || '',
      posting_date: dcDate,
      status: isViewMode ? 'Submitted' : 'Draft',
      grand_total: getGrandTotal(),
      set_warehouse: warehouse || '',
      transporter: transporter || '',
      vehicle_no: vehicleNumber || '',
      driver_name: transporter || '',
      instructions: remarks || '',
      sales_order_id: selectedSalesOrder ? Number(selectedSalesOrder) || selectedSalesOrder : null,
      displayDcNumber: fallbackDisplayNumber,
      items: validItems.map(item => ({
        id: Number(item.id) || undefined,
        item_code: item.itemCode || '',
        item_name: item.itemName || item.itemCode || '',
        description: item.description || '',
        qty: item.quantity || 0,
        stock_uom: item.unit || 'Nos',
        uom: item.unit || 'Nos',
        rate: item.rate || 0,
        amount: item.amount || 0,
      })),
      customer_details: {
        primary_address: customerData?.address || customerData?.shippingAddress || '',
        mobile_no: customerData?.phone || customerData?.contactMobile || '',
        email_id: customerData?.email || '',
        gstin: customerData?.gstin || '',
      },
    };
  };

  const extractPrintRecord = (raw: any): any => {
    const data = raw?.data ?? raw;
    if (Array.isArray(data)) return data[0] || null;
    return data?.record ?? data?.data ?? data;
  };

  const getPrintDeliveryChallanId = (raw: any): string | number | null => {
    const record = extractPrintRecord(raw);
    const candidate =
      record?.id ??
      raw?.data?.id ??
      raw?.id ??
      record?.name ??
      raw?.data?.name ??
      raw?.name ??
      null;

    if (candidate === null || candidate === undefined || candidate === '') return null;

    const numericMatch = String(candidate).match(/(\d+)$/);
    return numericMatch ? Number(numericMatch[1]) : candidate;
  };

  const normalizeDeliveryChallanPrintData = (raw: any, fallback?: DeliveryChallanPrintData): DeliveryChallanPrintData | null => {
    const record = extractPrintRecord(raw);
    if (!record) return fallback || null;

    const recordId = record.id ?? fallback?.id ?? id ?? dcNumber;
    const displayNumber =
      record.displayDcNumber ||
      (record.id !== undefined && record.id !== null
        ? printFormatDcNumber(record.id)
        : record.name || fallback?.displayDcNumber || dcNumber);

    return {
      ...(fallback || {}),
      ...record,
      id: recordId,
      name: record.name || fallback?.name || String(recordId),
      customer_id: record.customer_id ?? record.customer ?? fallback?.customer_id ?? '',
      customer_name: record.customer_name || record.customer || fallback?.customer_name || '',
      posting_date: record.posting_date || record.transaction_date || fallback?.posting_date || '',
      status: record.status || fallback?.status || 'Submitted',
      grand_total: Number(record.grand_total ?? record.total ?? fallback?.grand_total ?? 0),
      set_warehouse: record.set_warehouse || record.warehouse || fallback?.set_warehouse || '',
      transporter: record.transporter || fallback?.transporter || '',
      vehicle_no: record.vehicle_no || fallback?.vehicle_no || '',
      driver_name: record.driver_name || fallback?.driver_name || '',
      instructions: record.instructions || record.remarks || fallback?.instructions || '',
      sales_order_id: record.sales_order_id ?? fallback?.sales_order_id ?? null,
      displayDcNumber: displayNumber,
      items: (Array.isArray(record.items) ? record.items : (fallback?.items || [])).map((item: any) => ({
        id: item.id,
        item_code: item.item_code || item.itemCode || '',
        item_name: item.item_name || item.itemName || item.description || '',
        description: item.description || '',
        qty: Number(item.qty ?? item.quantity ?? 0),
        stock_uom: item.stock_uom || item.uom || item.unit || 'Nos',
        uom: item.uom || item.unit || item.stock_uom || 'Nos',
        rate: Number(item.rate ?? 0),
        amount: Number(item.amount ?? ((item.qty ?? item.quantity ?? 0) * (item.rate ?? 0))),
      })),
      customer_details: record.customer_details
        ? {
            primary_address: record.customer_details.primary_address || record.customer_details.address || '',
            mobile_no: record.customer_details.mobile_no || record.customer_details.phone || '',
            email_id: record.customer_details.email_id || record.customer_details.email || '',
            gstin: record.customer_details.gstin || record.customer_details.tax_id || '',
            state: record.customer_details.state || '',
            state_code: record.customer_details.state_code || '',
          }
        : fallback?.customer_details,
    };
  };

  const openDeliveryChallanPrint = async (
    challanId?: string | number | null,
    fallbackData?: DeliveryChallanPrintData
  ) => {
    const printWindow = window.open('', '_blank', 'width=900,height=1000');

    if (!printWindow) {
      toast.error('Please allow pop-ups to print this delivery challan');
      return;
    }

    printWindow.document.write(
      '<p style="font-family:sans-serif;padding:24px;color:#374151;">Loading delivery challan…</p>'
    );

    try {
      let printData = fallbackData || buildCurrentDeliveryChallanPrintData();

      if (challanId !== undefined && challanId !== null && challanId !== '') {
        try {
          const response = await deliveryChallanAPI.getDeliveryNote(String(challanId));
          const fetched = normalizeDeliveryChallanPrintData(response.data, printData);
          if (fetched) printData = fetched;
        } catch (fetchError) {
          console.warn('Could not fetch full delivery challan for printing. Using form data.', fetchError);
        }
      }

      printWindow.document.open();
      printWindow.document.write(buildDeliveryChallanPrintHtml(printData));
      printWindow.document.close();
    } catch (error) {
      console.error('Error printing delivery challan:', error);
      try {
        printWindow.document.open();
        printWindow.document.write(
          buildDeliveryChallanPrintHtml(fallbackData || buildCurrentDeliveryChallanPrintData())
        );
        printWindow.document.close();
      } catch (fallbackError) {
        console.error('Fallback print failed:', fallbackError);
        printWindow.close();
        toast.error('Unable to print delivery challan');
      }
    }
  };

  const handlePrintDeliveryChallan = async () => {
    setShowPrintConfirmModal(false);

    const fallbackData = buildCurrentDeliveryChallanPrintData();
    const printId = printDeliveryChallanId || getPrintDeliveryChallanId({
      id: id,
      name: successData.deliveryNote,
      data: { name: successData.deliveryNote }
    });

    await openDeliveryChallanPrint(printId, fallbackData);
  };

  const handleCancelPrint = () => {
    setShowPrintConfirmModal(false);
    navigate('/delivery-challan');
  };

  // ===== HANDLE SUBMIT =====
  const handleSubmit = async () => {
    if (isViewMode) return;
    if (!validateForm()) {
      scrollToFirstError();
      return;
    }
    setIsSubmitting(true);
    const toastId = toast.loading(isEditMode ? 'Updating delivery challan...' : 'Creating delivery challan...');
    
    try {
      // STEP 1: Save Quality Inspection first if pending
      let savedQiHeaderId: number | null = qualityInspectionId;
      
      if (pendingQualityInspection) {
        try {
          toast.loading('Saving Quality Inspection...', { id: toastId });
          const qiResult = await savePendingQualityInspection(null, null);
          if (qiResult?.data?.headerId) {
            savedQiHeaderId = qiResult.data.headerId;
            setQualityInspectionId(savedQiHeaderId);
            toast.success('Quality Inspection saved!', { id: toastId });
          }
        } catch (qiError: any) {
          console.error('Error saving quality inspection:', qiError);
          toast.error(qiError.message || 'Failed to save Quality Inspection', { id: toastId });
          setIsSubmitting(false);
          return;
        }
      }

      // STEP 2: Build payload with quality_inspection_id
      const payload = buildPayload();
      if (savedQiHeaderId) {
        payload.quality_inspection_id = savedQiHeaderId;
      }

      // STEP 3: Create/Update Delivery Challan
      let response;
      if (isEditMode && id) {
        response = await deliveryChallanAPI.updateDeliveryNote(payload);
      } else {
        response = await deliveryChallanAPI.createDeliveryNote(payload);
      }
      
      if (!response.success) throw new Error(response.message || (isEditMode ? 'Failed to update' : 'Failed to create'));
      
      const createdDC = response.data;
      
      const deliveryNote = createdDC?.data?.delivery_note || 
                          createdDC?.delivery_note || 
                          createdDC?.name || 
                          dcNumber;
      
      const totalItems = createdDC?.data?.total_items || 
                        createdDC?.total_items || 
                        items.filter(i => i.itemCode && i.quantity > 0).length;
      
      const message = createdDC?.data?.message || 
                     createdDC?.message || 
                     response.message || 
                     (isEditMode ? 'Delivery Note updated successfully.' : 'Delivery Note created successfully.');
      
      // STEP 4: Link Quality Inspection with DC if needed
      if (savedQiHeaderId && createdDC) {
        const dcId = getPrintDeliveryChallanId(createdDC) ?? getPrintDeliveryChallanId(response.data) ?? null;
        if (dcId) {
          try {
            await api.put('/quality-inspection', {
              id: savedQiHeaderId,
              reference_type: 'Delivery Challan',
              reference_id: Number(dcId),
              doc_no: deliveryNote,
              challan_no_date: deliveryNote
            });
          } catch (linkError) {
            console.warn('Could not link inspection with DC:', linkError);
          }
        }
      }
      
      // STEP 5: Update inventory
      if (!isEditMode) {
        const itemsToDispatch = items.filter(item => item.itemCode && item.quantity > 0);
        if (itemsToDispatch.length > 0) {
          toast.loading('Updating inventory...', { id: toastId });
          const failedUpdates = await updateInventory(itemsToDispatch);
          
          if (failedUpdates.length > 0) {
            toast(`Inventory updated with ${failedUpdates.length} failures: ${failedUpdates.join(', ')}`, { id: toastId });
          } else {
            toast.success('Inventory updated successfully!', { id: toastId });
          }
        }
      }
      
      toast.success(isEditMode ? 'Delivery Challan saved!' : 'Delivery Challan created!', { id: toastId });
      
      setSuccessData({
        deliveryNote: deliveryNote,
        totalItems: totalItems,
        message: message,
        customerName: customerData?.name
      });

      setPrintDeliveryChallanId(
        getPrintDeliveryChallanId(createdDC) ??
        getPrintDeliveryChallanId(response.data) ??
        (id || null)
      );

      if (!isEditMode) {
        setShowPrintConfirmModal(true);
      } else {
        setShowSuccessModal(true);
      }

      const finalDcName = createdDC?.data?.delivery_note || createdDC?.delivery_note || createdDC?.name || dcNumber;
      if (!isEditMode && finalDcName) {
        toast.success(`DC ${finalDcName} submitted!`, { id: toastId });
      }

      formState.clearFormState('delivery_challan');
      setPendingQualityInspection(null);
      setQualityInspection(true);
      
    } catch (error: any) {
      toast.error(error.message || (isEditMode ? 'Failed to update' : 'Failed to create'), { id: toastId });
      if (pendingQualityInspection) {
        toast('Your inspection is still attached to this Delivery Challan. Fix the issue and submit again.', { icon: 'ℹ️' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===== HANDLE SAVE DRAFT =====
  const handleSaveDraft = async () => {
    if (isViewMode) return;
    if (!validateForm()) {
      scrollToFirstError();
      return;
    }
    setIsSubmitting(true);
    const toastId = toast.loading(isEditMode ? 'Updating draft...' : 'Saving draft...');
    
    try {
      // Save quality inspection if pending
      let savedQiHeaderId: number | null = qualityInspectionId;
      
      if (pendingQualityInspection) {
        try {
          const qiResult = await savePendingQualityInspection(null, null);
          if (qiResult?.data?.headerId) {
            savedQiHeaderId = qiResult.data.headerId;
            setQualityInspectionId(savedQiHeaderId);
            toast.success('Quality Inspection saved!', { id: toastId });
          }
        } catch (qiError: any) {
          console.error('Error saving quality inspection:', qiError);
          toast.error(qiError.message || 'Failed to save Quality Inspection', { id: toastId });
          setIsSubmitting(false);
          return;
        }
      }

      const payload = buildPayload();
      if (savedQiHeaderId) {
        payload.quality_inspection_id = savedQiHeaderId;
      }
      
      let response;
      if (isEditMode && id) {
        response = await deliveryChallanAPI.updateDeliveryNote(payload);
      } else {
        response = await deliveryChallanAPI.createDeliveryNote(payload);
      }
      
      if (!response.success) throw new Error(response.message || (isEditMode ? 'Failed to update' : 'Failed to save'));
      
      const createdDC = response.data;
      const deliveryNote = createdDC?.data?.delivery_note || 
                          createdDC?.delivery_note || 
                          createdDC?.name || 
                          dcNumber;
      
      // Link inspection with DC if needed
      if (savedQiHeaderId && createdDC) {
        const dcId = getPrintDeliveryChallanId(createdDC) ?? getPrintDeliveryChallanId(response.data) ?? null;
        if (dcId) {
          try {
            await api.put('/quality-inspection', {
              id: savedQiHeaderId,
              reference_type: 'Delivery Challan',
              reference_id: Number(dcId),
              doc_no: deliveryNote,
              challan_no_date: deliveryNote
            });
          } catch (linkError) {
            console.warn('Could not link inspection with DC:', linkError);
          }
        }
      }
      
      formState.clearFormState('delivery_challan');
      
      toast.success(`${isEditMode ? 'Draft updated' : 'Draft saved'}: ${deliveryNote}`, { id: toastId });
      setTimeout(() => navigate('/delivery-challan'), 1000);
    } catch (error: any) {
      toast.error(error.message || (isEditMode ? 'Failed to update' : 'Failed to save'), { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isViewMode) {
      navigate('/delivery-challan');
      return;
    }
    if (window.confirm('Are you sure? Unsaved data will be lost.')) {
      formState.clearFormState('delivery_challan');
      navigate('/delivery-challan');
    }
  };

  const handleViewDeliveryNote = () => {
    setShowSuccessModal(false);
    navigate('/delivery-challan');
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    navigate('/delivery-challan');
  };

  useEffect(() => {
    if (isViewMode) return;
    if (itemsRestoredRef.current) return;
    setItems(prev => {
      if (prev.length > 0) return prev;
      return [{
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
        inventoryId: undefined,
      }];
    });
  }, [isService, isViewMode]);

  const totalItems = items.filter(i => i.itemCode && i.quantity > 0).length;
  const totalQuantity = getTotalQty();
  const subTotal = getTotalAmount();
  const totalTax = getTotalTax();
  const grandTotal = getGrandTotal();
  const grandTotalWithRound = grandTotal + roundOff;

  if (isLoadingData) {
    return (
      <div className="ndc-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <div style={{ textAlign: 'center' }}>
          <FaSpinner className="ndc-spinning" size={40} style={{ color: 'var(--primary-color)' }} />
          <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading delivery challan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`ndc-page ${theme}`}>
      <style>{`
        .ndc-spinning { animation: ndcSpin 1s linear infinite; }
        @keyframes ndcSpin { to { transform: rotate(360deg); } }

        .ndc-custom-scroll::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .ndc-custom-scroll::-webkit-scrollbar-track {
          background: var(--border-color, #f1f5f9);
          border-radius: 2px;
        }
        .ndc-custom-scroll::-webkit-scrollbar-thumb {
          background: var(--text-secondary, #cbd5e1);
          border-radius: 2px;
        }
        .ndc-custom-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--text-secondary, #94a3b8);
        }
        .ndc-custom-scroll {
          scrollbar-width: thin;
          scrollbar-color: var(--text-secondary, #cbd5e1) var(--border-color, #f1f5f9);
        }

        .ndc-grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
          width: 100%;
        }

        .ndc-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .ndc-view-badge {
          background: var(--primary-color, #2563eb);
          color: white;
          padding: 2px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          margin-left: 12px;
        }

        .ndc-required-star {
          color: #ef4444 !important;
          font-weight: 700 !important;
          margin-left: 2px;
          font-size: 14px;
        }

        .ndc-input-error,
        .ndc-select-error,
        .ndc-table-input.ndc-input-error {
          border-color: #ef4444 !important;
          border-width: 1.5px !important;
        }

        .ndc-error-text {
          color: #ef4444 !important;
          font-size: 11px;
          margin-top: 2px;
          display: block;
        }

        .ndc-qi-action-btn {
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
          background: var(--primary-color, #2563eb) !important;
          color: #fff !important;
          border: none !important;
          border-radius: 6px !important;
          padding: 6px 14px !important;
          cursor: pointer !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          transition: all 0.2s !important;
          min-height: 32px !important;
          text-decoration: none !important;
          white-space: nowrap !important;
        }

        .ndc-qi-action-btn:hover {
          background: color-mix(in srgb, var(--primary-color, #2563eb) 85%, #000) !important;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px color-mix(in srgb, var(--primary-color) 30%, transparent);
        }

        .ndc-qi-action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
        }

        .dark-theme .ndc-qi-action-btn {
          background: var(--primary-color, #3b82f6) !important;
        }

        .dark-theme .ndc-qi-action-btn:hover {
          background: color-mix(in srgb, var(--primary-color, #3b82f6) 85%, #000) !important;
        }

        .ndc-qi-section {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          padding: 8px 0 4px 0;
          border-top: 1px solid var(--border-color, #e2e8f0);
          margin-top: 4px;
        }

        .ndc-qi-label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary, #64748b);
        }

        .ndc-qi-view-btn {
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
          background: var(--success-color, #10b981) !important;
          color: #fff !important;
          border: none !important;
          border-radius: 6px !important;
          padding: 6px 14px !important;
          cursor: pointer !important;
          font-size: 12px !important;
          font-weight: 500 !important;
          transition: all 0.2s !important;
          min-height: 32px !important;
          text-decoration: none !important;
          white-space: nowrap !important;
        }

        .ndc-qi-view-btn:hover {
          background: color-mix(in srgb, var(--success-color, #10b981) 85%, #000) !important;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px color-mix(in srgb, var(--success-color) 30%, transparent);
        }

        .ndc-qi-view-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
        }

        .ndc-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(2px);
        }

        .ndc-modal-container {
          width: min(95vw, 1200px);
          max-height: 90vh;
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.22);
        }

        .ndc-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          flex-shrink: 0;
        }

        .ndc-modal-title {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary, #0f172a);
          display: flex;
          align-items: center;
        }

        .ndc-modal-close-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-secondary, #64748b);
          transition: background 0.2s;
        }

        .ndc-modal-close-btn:hover {
          background: var(--layout-bg, #f1f5f9);
        }

        .ndc-inspection-summary {
          padding: 16px 24px;
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          flex-shrink: 0;
        }

        .ndc-inspection-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px 24px;
        }

        .ndc-inspection-summary-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .ndc-inspection-summary-label {
          font-size: 10px;
          font-weight: 600;
          color: var(--text-secondary, #64748b);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .ndc-inspection-summary-value {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary, #0f172a);
        }

        .ndc-inspection-status {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        .ndc-inspection-status.accepted {
          background: #d1fae5;
          color: #065f46;
        }

        .ndc-inspection-status.rejected {
          background: #fee2e2;
          color: #991b1b;
        }

        .ndc-inspection-result {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        .ndc-inspection-result.pass {
          background: #d1fae5;
          color: #065f46;
        }

        .ndc-inspection-result.fail {
          background: #fee2e2;
          color: #991b1b;
        }

        .ndc-inspection-details {
          padding: 16px 24px;
          overflow-y: auto;
          flex: 1;
        }

        .ndc-inspection-details-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-weight: 600;
          font-size: 13px;
          color: var(--text-primary, #0f172a);
        }

        .ndc-inspection-rejected-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          background: #fee2e2;
          color: #991b1b;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        .ndc-inspection-table-wrap {
          overflow-x: auto;
        }

        .ndc-inspection-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        .ndc-inspection-table th {
          background: var(--layout-bg, #f8fafc);
          padding: 8px 10px;
          text-align: left;
          font-weight: 600;
          color: var(--text-secondary, #475569);
          border-bottom: 2px solid var(--border-color, #e2e8f0);
          white-space: nowrap;
        }

        .ndc-inspection-table td {
          padding: 6px 10px;
          border-bottom: 1px solid var(--border-color, #f1f5f9);
          vertical-align: middle;
        }

        .ndc-inspection-col-sr {
          width: 40px;
          text-align: center;
        }

        .ndc-inspection-col-param {
          min-width: 150px;
        }

        .ndc-inspection-col-spec {
          min-width: 100px;
        }

        .ndc-inspection-col-method {
          min-width: 120px;
        }

        .ndc-inspection-col-obs {
          min-width: 50px;
          text-align: center;
        }

        .ndc-inspection-col-result {
          min-width: 80px;
          text-align: center;
        }

        .ndc-inspection-row-fail {
          background: #fef2f2;
        }

        .ndc-inspection-obs-fail {
          color: #dc2626;
          font-weight: 600;
        }

        .ndc-inspection-badge {
          display: inline-block;
          padding: 1px 10px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 600;
        }

        .ndc-inspection-badge.pass {
          background: #d1fae5;
          color: #065f46;
        }

        .ndc-inspection-badge.fail {
          background: #fee2e2;
          color: #991b1b;
        }

        .ndc-inspection-empty {
          text-align: center;
          padding: 20px;
          color: var(--text-secondary, #94a3b8);
        }

        .ndc-inspection-remarks {
          margin-top: 12px;
          padding: 10px 14px;
          background: var(--layout-bg, #f8fafc);
          border-radius: 6px;
          font-size: 12px;
        }

        .ndc-inspection-remarks-label {
          font-weight: 600;
          color: var(--text-secondary, #475569);
          margin-right: 8px;
        }

        .ndc-modal-footer {
          padding: 12px 24px;
          border-top: 1px solid var(--border-color, #e2e8f0);
          display: flex;
          justify-content: flex-end;
          flex-shrink: 0;
        }

        .ndc-modal-btn {
          padding: 8px 20px;
          border-radius: 8px;
          border: 1px solid var(--border-color, #e2e8f0);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ndc-modal-btn-secondary {
          background: var(--card-bg, #ffffff);
          color: var(--text-primary, #0f172a);
        }

        .ndc-modal-btn-secondary:hover {
          background: var(--layout-bg, #f8fafc);
        }

        .ndc-print-confirm-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(2px);
        }

        .ndc-print-confirm-modal {
          width: min(420px, 100%);
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 16px;
          padding: 28px 24px 22px;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.22);
          text-align: center;
        }

        .ndc-print-confirm-icon {
          width: 56px;
          height: 56px;
          margin: 0 auto 14px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary-color, #2563eb);
          background: color-mix(in srgb, var(--primary-color, #2563eb) 10%, transparent);
        }

        .ndc-print-confirm-title {
          margin: 0 0 10px;
          color: var(--text-primary, #0f172a);
          font-size: 20px;
          font-weight: 700;
        }

        .ndc-print-confirm-message {
          margin: 0;
          color: var(--text-secondary, #64748b);
          font-size: 13px;
          line-height: 1.55;
        }

        .ndc-print-confirm-message strong {
          color: var(--text-primary, #0f172a);
        }

        .ndc-print-confirm-question {
          margin: 8px 0 20px;
          color: var(--text-primary, #334155);
          font-size: 14px;
          font-weight: 600;
        }

        .ndc-print-confirm-actions {
          display: flex;
          justify-content: center;
          gap: 10px;
        }

        .ndc-print-confirm-btn {
          min-width: 120px;
          height: 38px;
          border-radius: 9px;
          border: 1px solid transparent;
          padding: 0 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .ndc-print-confirm-yes {
          background: var(--primary-color, #2563eb);
          color: #fff;
          border-color: var(--primary-color, #2563eb);
        }

        .ndc-print-confirm-yes:hover {
          filter: brightness(0.94);
          transform: translateY(-1px);
        }

        .ndc-print-confirm-cancel {
          background: var(--card-bg, #fff);
          color: var(--text-primary, #334155);
          border-color: var(--border-color, #cbd5e1);
        }

        .ndc-print-confirm-cancel:hover {
          background: var(--layout-bg, #f8fafc);
        }

        @media (max-width: 480px) {
          .ndc-print-confirm-modal {
            padding: 24px 18px 20px;
          }

          .ndc-print-confirm-actions {
            flex-direction: column;
          }

          .ndc-print-confirm-btn {
            width: 100%;
          }

          .ndc-inspection-summary-grid {
            grid-template-columns: 1fr 1fr;
          }

          .ndc-modal-container {
            width: 98vw;
          }
        }

        @media print {
          .ndc-form-footer, button { display: none !important; }
          body { padding: 0; }
        }
      `}</style>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseModal}
        deliveryNote={successData.deliveryNote}
        totalItems={successData.totalItems}
        message={successData.message}
        customerName={successData.customerName}
        onViewDetails={handleViewDeliveryNote}
      />

      {/* Print Confirmation Modal */}
      {showPrintConfirmModal && (
        <div
          className="ndc-print-confirm-overlay"
          onClick={handleCancelPrint}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ndc-print-confirm-title"
        >
          <div
            className="ndc-print-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ndc-print-confirm-icon">
              <FaPrint size={28} />
            </div>

            <h2 id="ndc-print-confirm-title" className="ndc-print-confirm-title">
              Delivery Challan Created Successfully
            </h2>

            <p className="ndc-print-confirm-message">
              Delivery Challan <strong>{successData.deliveryNote}</strong> has been created.
            </p>

            <p className="ndc-print-confirm-question">
              Do you want to print it now?
            </p>

            <div className="ndc-print-confirm-actions">
              <button
                type="button"
                className="ndc-print-confirm-btn ndc-print-confirm-yes"
                onClick={handlePrintDeliveryChallan}
              >
                <FaPrint size={13} />
                Yes, Print
              </button>

              <button
                type="button"
                className="ndc-print-confirm-btn ndc-print-confirm-cancel"
                onClick={handleCancelPrint}
              >
                <FaTimes size={13} />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspection View Modal */}
      <InspectionViewModal
        isOpen={showViewInspectionModal}
        onClose={() => setShowViewInspectionModal(false)}
        inspectionData={viewInspectionData}
      />

      {/* Quick Add Customer Modal */}
      <QuickAddCustomerModal
        isOpen={showQuickAddModal}
        prefillName={quickAddPrefillName}
        onClose={() => setShowQuickAddModal(false)}
        onCreated={(customer) => {
          setCustomers(prev => [customer, ...prev.filter(c => c.id !== customer.id)]);
          setSelectedCustomer(customer.id);
          loadCustomerData(customer.id, customer);
          setShowQuickAddModal(false);
        }}
        onOpenFullForm={() => {
          setShowQuickAddModal(false);
          navigateToFullCustomerForm(quickAddPrefillName);
        }}
      />

      {/* Header */}
      <div className="ndc-header">
        <div className="ndc-header-left">
          <button onClick={handleCancel} className="ndc-back-btn">
            <FaArrowLeft size={13} /> Back
          </button>
          <div className="ndc-header-divider" />
          <h1 className="ndc-header-title">
            {isViewMode ? 'View Delivery Challan' : isEditMode ? 'Edit Delivery Challan' : 'Create Delivery Challan'}
          </h1>
          {isViewMode && (
            <span className="ndc-view-badge">View Only</span>
          )}
          {id && (
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
              #{id}
            </span>
          )}
        </div>
        <div className="ndc-header-right">
          <label className="ndc-checkbox-label">
            <input
              type="checkbox"
              checked={isService}
              onChange={(e) => {
                if (isViewMode) return;
                setIsService(e.target.checked);
                setItems(items.map(item => ({
                  ...item,
                  type: e.target.checked ? 'service' : 'product'
                })));
              }}
              className="ndc-checkbox"
              disabled={isViewMode}
            />
            <span>IsService</span>
          </label>
        </div>
      </div>

      {/* MAIN BOX */}
      <div className="ndc-main-box">
        {/* Sales Order Toggle */}
        <div className="ndc-invoice-type-section">
          <label className="ndc-label" style={{ marginBottom: 8 }}>Create From</label>
          <div className="ndc-radio-group">
            <label className="ndc-radio-label">
              <input
                type="radio"
                name="salesOrderSource"
                value="with"
                checked={hasSalesOrder === true}
                onChange={() => setHasSalesOrder(true)}
                disabled={isEditMode || isViewMode}
              />
              With Sales Order
            </label>
            <label className="ndc-radio-label">
              <input
                type="radio"
                name="salesOrderSource"
                value="without"
                checked={hasSalesOrder === false}
                onChange={() => setHasSalesOrder(false)}
                disabled={isEditMode || isViewMode}
              />
              Without Sales Order
            </label>
          </div>
          {(isEditMode || isViewMode) && (
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
              (Source type cannot be changed in {isViewMode ? 'view' : 'edit'} mode)
            </span>
          )}
        </div>

        {/* TWO COLUMN LAYOUT */}
        <div className="ndc-compact-layout">
          {/* LEFT COLUMN */}
          <div className="ndc-left-column">
            {/* Customer & Sales Order */}
            <div className="ndc-section-header">
              <FaBuilding className="ndc-section-icon" />
              <span>Customer & Order</span>
            </div>

            {hasSalesOrder ? (
              <div className="ndc-field-row">
                <div className="ndc-field-half" data-error-key="customer">
                  <label className="ndc-label">
                    Customer <span className="ndc-required-star">*</span>
                  </label>
                  <CustomerDropdown
                    value={selectedCustomer}
                    onChange={handleCustomerChange}
                    placeholder="Search Customer..."
                    disabled={isLoading || isEditMode || isViewMode}
                    error={!!errors.customer}
                    presetCustomer={customerData}
                    onAddNewCustomer={handleAddNewCustomer}
                  />
                  {errors.customer && <span className="ndc-error-text">{errors.customer}</span>}
                </div>

                <div className="ndc-field-half" data-error-key="salesOrder">
                  <label className="ndc-label">
                    Sales Order <span className="ndc-required-star">*</span>
                  </label>
                  <SalesOrderDropdown
                    value={selectedSalesOrder}
                    onChange={handleSalesOrderChange}
                    customerId={selectedCustomer}
                    placeholder="Search or select sales order..."
                    disabled={!selectedCustomer || isEditMode || isViewMode}
                    error={!!errors.salesOrder}
                    taxOptions={taxOptions}
                  />
                  {errors.salesOrder && <span className="ndc-error-text">{errors.salesOrder}</span>}
                </div>
              </div>
            ) : (
              <div className="ndc-field-full" data-error-key="customer">
                <div className="ndc-field-full-width">
                  <label className="ndc-label">
                    Customer <span className="ndc-required-star">*</span>
                  </label>
                  <CustomerDropdown
                    value={selectedCustomer}
                    onChange={handleCustomerChange}
                    placeholder="Search Customer..."
                    disabled={isLoading || isEditMode || isViewMode}
                    error={!!errors.customer}
                    fullWidth={true}
                    presetCustomer={customerData}
                    onAddNewCustomer={handleAddNewCustomer}
                  />
                  {errors.customer && <span className="ndc-error-text">{errors.customer}</span>}
                </div>
              </div>
            )}

            {/* Delivery Challan Details */}
            <div className="ndc-section-header" style={{ marginTop: hasSalesOrder ? '0' : '0rem' }}>
              <FaBox className="ndc-section-icon" />
              <span>Challan Details</span>
            </div>

            <div className="ndc-grid-3">
              <div className="ndc-field">
                <label className="ndc-label">DC Number</label>
                <div className="ndc-dc-number-display">{dcNumber}</div>
              </div>

              <div className="ndc-field" data-error-key="dcDate">
                <label className="ndc-label">
                  DC Date <span className="ndc-required-star">*</span>
                </label>
                <div className="ndc-date-field">
                  <input
                    type="date"
                    value={dcDate}
                    onChange={(e) => setDcDate(e.target.value)}
                    className={`ndc-input ${errors.dcDate ? 'ndc-input-error' : ''}`}
                    disabled={isEditMode || isViewMode}
                  />
                  <button
                    type="button"
                    className="ndc-date-icon-btn"
                    onClick={() => {
                      if (isViewMode) return;
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
                    disabled={isViewMode}
                  >
                    <FaCalendarAlt size={13} />
                  </button>
                </div>
                {errors.dcDate && <span className="ndc-error-text">{errors.dcDate}</span>}
              </div>

              <div className="ndc-field" data-error-key="warehouse">
                <label className="ndc-label">
                  Warehouse <span className="ndc-required-star">*</span>
                </label>
                <select
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                  className={`ndc-select ${errors.warehouse ? 'ndc-select-error' : ''}`}
                  disabled={isLoadingWarehouses || isEditMode || isViewMode}
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.warehouse_name}>
                      {w.warehouse_name}
                      {w.city && ` (${w.city})`}
                    </option>
                  ))}
                </select>
                {errors.warehouse && <span className="ndc-error-text">{errors.warehouse}</span>}
                {isLoadingWarehouses && <span className="ndc-loading-text">Loading warehouses...</span>}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="ndc-right-column">
            {customerData ? (
              <div className="ndc-detail-card">
                <div className="ndc-card-header">
                  <FaBuilding size={14} />
                  <span>Customer Details</span>
                </div>
                <div className="ndc-card-content">
                  <h3>{customerData.name}</h3>
                  <div className="ndc-card-info">
                    {customerData.code && (
                      <div className="ndc-info-item">
                        <span className="ndc-info-label">Code</span>
                        <span className="ndc-info-value">{customerData.code}</span>
                      </div>
                    )}
                    {customerData.contactPerson && (
                      <div className="ndc-info-item">
                        <span className="ndc-info-label">Contact</span>
                        <span className="ndc-info-value"><FaUser size={10} /> {customerData.contactPerson}</span>
                      </div>
                    )}
                    {customerData.phone && (
                      <div className="ndc-info-item">
                        <span className="ndc-info-label">Phone</span>
                        <span className="ndc-info-value"><FaPhone size={10} /> {customerData.phone}</span>
                      </div>
                    )}
                    {customerData.email && (
                      <div className="ndc-info-item">
                        <span className="ndc-info-label">Email</span>
                        <span className="ndc-info-value"><FaEnvelope size={10} /> {customerData.email}</span>
                      </div>
                    )}
                    {customerData.gstin && (
                      <div className="ndc-info-item">
                        <span className="ndc-info-label">GST</span>
                        <span className="ndc-info-value">{customerData.gstin}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="ndc-detail-card ndc-empty-card">
                <div className="ndc-card-header">
                  <FaBuilding size={14} />
                  <span>Customer Details</span>
                </div>
                <div className="ndc-card-content">
                  <div className="ndc-empty-state">
                    <FaInfoCircle size={24} />
                    <p>Select a customer to view details</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ITEMS SECTION */}
        <div className="ndc-items-full">
          <div className="ndc-items-header">
            <span className="ndc-items-title">
              <FaClipboardList className="ndc-items-icon" /> {isService ? 'Services' : 'Products'}
            </span>
            <button onClick={addItem} className="ndc-add-btn" disabled={isViewMode}>
              <FaPlus size={9} /> Add
            </button>
          </div>

          {errors.items && <div className="ndc-items-error"><FaExclamationTriangle /> {errors.items}</div>}

          <div className="ndc-table-wrap">
            <table className="ndc-items-table">
              <thead>
                <tr>
                  <th className="ndc-col-sno">#</th>
                  <th className="ndc-col-code">Item Code <span className="ndc-required-star">*</span></th>
                  <th className="ndc-col-name">Item Name <span className="ndc-required-star">*</span></th>
                  <th className="ndc-col-hsn">HSN</th>
                  <th className="ndc-col-qty">Qty <span className="ndc-required-star">*</span></th>
                  <th className="ndc-col-unit">UOM</th>
                  <th className="ndc-col-rate">Rate</th>
                  <th className="ndc-col-tax">Tax</th>
                  <th className="ndc-col-tax-amount" style={{ textAlign: 'right' }}>Tax Amt</th>
                  <th className="ndc-col-amount" style={{ textAlign: 'right' }}>Amount</th>
                  <th className="ndc-col-action"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} data-item-index={index}>
                    <td className="ndc-col-sno">{index + 1}</td>
                    <td className="ndc-col-code" data-error-key={`item_${index}_code`}>
                      <SearchableSelect
                        value={item.itemCode}
                        onChange={(value, productOption) => updateItem(item.id, 'itemCode', value, productOption)}
                        options={products}
                        placeholder="Search..."
                        onSearch={handleItemSearch}
                        loading={isLoadingItems}
                        error={!!errors[`item_${index}_code`]}
                        stockInfo={{ status: item.stockStatus || 'unknown', availableQty: item.availableQty }}
                        disabled={isViewMode}
                      />
                      {errors[`item_${index}_code`] && <span className="ndc-error-text">{errors[`item_${index}_code`]}</span>}
                    </td>
                    <td className="ndc-col-name" data-error-key={`item_${index}_name`}>
                      <input
                        type="text"
                        value={item.itemName}
                        onChange={(e) => updateItem(item.id, 'itemName', e.target.value)}
                        placeholder="Item Name"
                        className={`ndc-table-input ndc-table-input-text ${errors[`item_${index}_name`] ? 'ndc-input-error' : ''}`}
                        disabled={isViewMode}
                      />
                      {errors[`item_${index}_name`] && <span className="ndc-error-text">{errors[`item_${index}_name`]}</span>}
                    </td>
                    <td className="ndc-col-hsn">
                      <input
                        type="text"
                        value={item.hsn}
                        onChange={(e) => updateItem(item.id, 'hsn', e.target.value)}
                        placeholder="HSN"
                        className="ndc-table-input ndc-table-input-text"
                        disabled={isViewMode}
                      />
                    </td>
                    <td className="ndc-col-qty" data-error-key={`item_${index}_qty`}>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        min="1"
                        className={`ndc-table-input ${errors[`item_${index}_qty`] ? 'ndc-input-error' : ''}`}
                        disabled={isViewMode}
                      />
                      {errors[`item_${index}_qty`] && <span className="ndc-error-text">{errors[`item_${index}_qty`]}</span>}
                    </td>
                    <td className="ndc-col-unit">
                      <select
                        value={item.unit}
                        onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                        className="ndc-table-input"
                        disabled={isViewMode}
                      >
                        <option value="pcs">Pcs</option>
                        <option value="kg">Kg</option>
                        <option value="ltr">Ltr</option>
                        <option value="mtr">Mtr</option>
                        <option value="Nos">Nos</option>
                        <option value="Box">Box</option>
                      </select>
                    </td>
                    <td className="ndc-col-rate">
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="ndc-table-input"
                        disabled={isViewMode}
                      />
                    </td>
                    <td className="ndc-col-tax">
                      <select
                        value={item.tax}
                        onChange={(e) => updateItem(item.id, 'tax', parseFloat(e.target.value) || 0)}
                        className="ndc-table-input"
                        disabled={loadingTaxOptions || isViewMode}
                      >
                        {taxOptions.map((tax) => {
                          const val = extractTaxValue(tax.tax_type);
                          return (
                            <option key={tax.tax_id} value={val}>
                              {tax.tax_type}
                            </option>
                          );
                        })}
                        {!taxOptions.some(t => extractTaxValue(t.tax_type) === item.tax) && item.tax > 0 && (
                          <option value={item.tax}>GST {item.tax}%</option>
                        )}
                      </select>
                    </td>
                    <td className="ndc-col-tax-amount" style={{ textAlign: 'right' }}>
                      <span className="ndc-table-value nsb-table-value">₹{item.taxAmount.toFixed(2)}</span>
                    </td>
                    <td className="ndc-col-amount" style={{ textAlign: 'right' }}>
                      <span className="ndc-table-value nsb-table-value">₹{item.totalAmount.toFixed(2)}</span>
                    </td>
                    <td className="ndc-col-action">
                      <button onClick={() => removeItem(item.id)} className="ndc-remove-btn" disabled={isViewMode}>
                        <FaTrash size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div className="ndc-bottom-section">
          <div className="ndc-bottom-left">
            <div className="ndc-shipping-bottom">
              <div className="ndc-section-header">
                <FaTruck className="ndc-section-icon" />
                <span>Shipping Details</span>
              </div>

              <div className="ndc-shipping-bottom-row">
                <div className="ndc-shipping-bottom-field">
                  <label className="ndc-label">Transporter Name / Driver Name</label>
                  <input
                    type="text"
                    placeholder="Transporter or driver name"
                    value={transporter}
                    onChange={(e) => setTransporter(e.target.value)}
                    className="ndc-input"
                    disabled={isViewMode}
                  />
                </div>

                <div className="ndc-shipping-bottom-field">
                  <label className="ndc-label">Vehicle Number</label>
                  <input
                    type="text"
                    placeholder="MH-01-AB-1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="ndc-input"
                    disabled={isViewMode}
                  />
                </div>
              </div>
            </div>

            <div className="ndc-field ndc-remarks-bottom">
              <label className="ndc-label">Remarks</label>
              <textarea
                placeholder="Add any additional notes..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="ndc-textarea ndc-textarea-large"
                rows={2}
                disabled={isViewMode}
              />
            </div>

            {/* Quality Inspection Section */}
            <div className="ndc-qi-section ndc-qi-section-enhanced">
              <div className="ndc-qi-section-header">
                <div>
                  <span className="ndc-qi-label">
                    <FaClipboardCheck size={14} style={{ marginRight: '6px' }} />
                    Quality Inspection
                  </span>
                  <span className="ndc-qi-help">
                    {qualityInspectionId ? `Inspection #${qualityInspectionId} attached` : 
                     pendingQualityInspection ? 'Inspection is attached to this Delivery Challan and will be saved on Submit.' : 
                     'Create an inspection before submitting this Delivery Challan.'}
                  </span>
                </div>
                <div className="ndc-qi-header-actions">
                  {qualityInspection && (
                    <span className="ndc-qi-status">
                      <FaCheckCircle size={12} /> Inspection ready
                    </span>
                  )}
                  {isViewMode ? (
                    <button
                      type="button"
                      onClick={handleViewQualityInspection}
                      className="ndc-qi-view-btn"
                      disabled={isLoadingInspection}
                    >
                      {isLoadingInspection ? (
                        <FaSpinner className="ndc-spinning" size={14} />
                      ) : (
                        <FaEye size={14} />
                      )}
                      {isLoadingInspection ? 'Loading...' : 'View Inspection'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={navigateToQualityInspection}
                      className="ndc-qi-action-btn"
                      disabled={items.every(item => !item.itemCode || item.quantity <= 0)}
                      title={items.every(item => !item.itemCode || item.quantity <= 0) ? 'Add at least one item first' : 'Create Quality Inspection'}
                    >
                      <FaClipboardCheck size={14} />
                      {pendingQualityInspection || qualityInspectionId ? 'Edit Inspection' : 'Create Inspection'}
                    </button>
                  )}
                </div>
              </div>

              {(pendingQualityInspection?.formData || qualityInspectionId) && !isViewMode && (
                <div className="ndc-qi-report-actions">
                  <button
                    type="button"
                    className="ndc-qi-view-btn"
                    onClick={qualityInspectionId ? handleViewQualityInspection : handleNavigateToExistingQI}
                  >
                    <FaClipboardCheck size={14} />
                    View Inspection
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="ndc-bottom-right">
            <div className="ndc-detail-card ndc-summary-card">
              <div className="ndc-card-header">
                <FaCalculator size={14} />
                <span>Financial Summary</span>
              </div>
              <div className="ndc-card-content">
                <div className="ndc-summary-grid">
                  <div className="ndc-summary-item">
                    <span className="ndc-summary-label">Total Items</span>
                    <span className="ndc-summary-value">{totalItems}</span>
                  </div>
                  <div className="ndc-summary-item">
                    <span className="ndc-summary-label">Total Quantity</span>
                    <span className="ndc-summary-value">{totalQuantity}</span>
                  </div>
                  <div className="ndc-summary-item">
                    <span className="ndc-summary-label">Sub Total</span>
                    <span className="ndc-summary-value">₹{subTotal.toFixed(2)}</span>
                  </div>
                  <div className="ndc-summary-item">
                    <span className="ndc-summary-label">Total Tax</span>
                    <span className="ndc-summary-value">₹{totalTax.toFixed(2)}</span>
                  </div>
                  <div className="ndc-summary-item">
                    <span className="ndc-summary-label">Round Off</span>
                    <div className="ndc-roundoff-wrap">
                      <input
                        type="number"
                        value={roundOff.toFixed(2)}
                        onChange={(e) => setRoundOff(parseFloat(e.target.value) || 0)}
                        className="ndc-roundoff-input"
                        disabled={isViewMode}
                      />
                    </div>
                  </div>
                  <div className="ndc-summary-grand">
                    <span className="ndc-summary-grand-label">Grand Total</span>
                    <span className="ndc-summary-grand-value">₹{grandTotalWithRound.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="ndc-form-footer">
        <button
          onClick={() => openDeliveryChallanPrint(id || null, buildCurrentDeliveryChallanPrintData())}
          className="ndc-btn ndc-btn-print"
        >
          <FaPrint size={11} /> Print
        </button>
        {!isViewMode && (
          <>
            <button onClick={handleSaveDraft} disabled={isSubmitting} className="ndc-btn ndc-btn-draft">
              {isSubmitting ? <FaSpinner className="ndc-spinning" size={11} /> : <FaSave size={11} />} {isEditMode ? 'Update Draft' : 'Draft'}
            </button>
            <button onClick={handleSubmit} disabled={isSubmitting} className="ndc-btn ndc-btn-submit">
              {isSubmitting ? <FaSpinner className="ndc-spinning" size={11} /> : <FaPaperPlane size={11} />} {isEditMode ? 'Update' : 'Submit'}
            </button>
          </>
        )}
        <button onClick={handleCancel} className="ndc-btn ndc-btn-cancel">
          <FaTimes size={11} /> {isViewMode ? 'Back' : 'Cancel'}
        </button>
      </div>
    </div>
  );
};

export default NewDeliveryChallan;