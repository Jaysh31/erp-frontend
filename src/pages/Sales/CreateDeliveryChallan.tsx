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
} from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import './CreateDeliveryChallan.css';
import { FaTrash } from 'react-icons/fa6';

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
  instructions: string;
  status: string;
  type: string;
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
    tax_id: number | null;
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
    // ID is inside payload, not in URL
    return this.apiService.put('/delivery-note', payload);
  }

  async submitDeliveryNote(name: string): Promise<ApiResponse<any>> {
    return this.apiService.post(`/delivery-note/${name}/submit`, {});
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
    return this.apiService.get('/inventory', params);
  }

  async updateInventory(id: number, data: any): Promise<ApiResponse<any>> {
    return this.apiService.put(`/inventory`, data);
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
          className="ndc-table-input"
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

  // Helper to extract tax rate from tax_type string (e.g., "GST18" -> 18)
  const extractTaxValue = (taxType: string): number => {
    if (!taxType) return 0;
    const match = taxType.match(/(\d+)/);
    return match ? parseInt(match[0], 10) : 0;
  };

  // Get tax rate from tax_id using taxOptions
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
          items: (record.sales_items || []).map((item: any) => ({
            item_code: item.item_code || '',
            description: item.description || '',
            qty: item.qty || 0,
            uom: item.uom || item.stock_uom || 'pcs',
            rate: item.rate || 0,
            amount: item.amount || 0,
            tax_id: item.tax_id || record.tax_id || null,
            tax: item.tax || 0,
          }))
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
    
    // Process items with tax from taxOptions
    const processedOrder = {
      ...order,
      items: order.items?.map(item => ({
        ...item,
        // If item has tax_id, get tax rate from it
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
            border: error ? '0.5px solid var(--danger-color, #ef4444)' : '0.5px solid var(--border-color, #e2e8f0)',
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
  const deliveryChallanAPI = new DeliveryChallanAPI();
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
        maxHeight: '280px',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}
    >
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
          <FaSpinner className="ndc-spinning" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-color, #2563eb)', fontSize: '12px' }} />
        ) : (
          <FaChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary, #64748b)', fontSize: '12px', pointerEvents: 'none' }} />
        )}
      </div>

      {menu && ReactDOM.createPortal(menu, document.body)}
    </div>
  );
};

// ===== SUCCESS MODAL COMPONENT =====
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

// ===== MAIN COMPONENT =====

const NewDeliveryChallan: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { theme } = useAdminTheme();

  // Determine if we're in edit mode
  const isEditMode = !!id;
  
  // State for toggle
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
  const [items, setItems] = useState<DeliveryChallanItem[]>([]);
  const [customerData, setCustomerData] = useState<Customer | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dcNumber, setDcNumber] = useState<string>(`DN-${new Date().getFullYear()}-001`);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState<boolean>(false);
  const [roundOff, setRoundOff] = useState<number>(0);
  const [taxOptions, setTaxOptions] = useState<TaxOption[]>([]);
  const [loadingTaxOptions, setLoadingTaxOptions] = useState<boolean>(false);
  const [, setTaxOptionsLoaded] = useState<boolean>(false);
  const [inventoryMap, setInventoryMap] = useState<{ [itemCode: string]: InventoryApiRecord[] }>({});
  const [, setLoadingInventory] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  
  // Status State
  const [status, setStatus] = useState<string>('Draft');

  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
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

  const deliveryChallanAPI = new DeliveryChallanAPI();

  // ===== HELPER FUNCTIONS =====
  const extractTaxValue = (taxType: string): number => {
    if (!taxType) return 0;
    const match = taxType.match(/(\d+)/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const getTaxIdFromRate = (taxRate: number, taxOpts: TaxOption[]): number | undefined => {
    const taxOption = taxOpts.find(t => extractTaxValue(t.tax_type) === taxRate);
    return taxOption?.tax_id;
  };

  const getTaxRateFromId = (taxId: number | string | undefined, taxOpts: TaxOption[]): number => {
    if (!taxId) return 0;
    const id = typeof taxId === 'string' ? parseInt(taxId, 10) : taxId;
    const taxOption = taxOpts.find(t => t.tax_id === id);
    return taxOption ? extractTaxValue(taxOption.tax_type) : 0;
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
        setTaxOptions([]);
      }
      setTaxOptionsLoaded(true);
    } catch (error) {
      console.error('Error fetching tax options:', error);
      setTaxOptions([]);
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

  // ===== FETCH DELIVERY CHALLAN FOR EDIT =====
  const fetchDeliveryChallanForEdit = async (challanId: string) => {
    setIsLoadingData(true);
    try {
      const response = await deliveryChallanAPI.getDeliveryNote(challanId);
      
      if (response.success && response.data) {
        const data = response.data.data || response.data;
        
        // Set form fields
        if (data.customer_id) {
          setSelectedCustomer(String(data.customer_id));
          // Fetch customer details
          const customer = customers.find(c => c.id === String(data.customer_id));
          if (customer) {
            setCustomerData(customer);
          } else {
            // Try to find customer from the data
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
        
        if (data.status) {
          setStatus(data.status);
        }
        
        if (data.type === 'Services') {
          setIsService(true);
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
        
        // Set items
        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
          const mappedItems: DeliveryChallanItem[] = data.items.map((item: any, index: number) => {
            const product = allProducts.find(p => p.itemCode === item.item_code);
            const taxRate = item.tax || 0;
            const taxId = item.tax_id || getTaxIdFromRate(taxRate, taxOptions);
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
        
        toast.success('Delivery Challan loaded for editing');
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

  useEffect(() => {
    fetchTaxOptions();
    fetchInventory();
    fetchCustomers();
    fetchAllItems();
    fetchWarehouses();
  }, []);

  // Load edit data after initial data is fetched
  useEffect(() => {
    if (isEditMode && id && customers.length > 0 && allProducts.length > 0 && taxOptions.length > 0) {
      fetchDeliveryChallanForEdit(id);
    }
  }, [isEditMode, id, customers.length, allProducts.length, taxOptions.length]);

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

  const fetchWarehouses = async () => {
    setIsLoadingWarehouses(true);
    try {
      const response = await deliveryChallanAPI.getWarehouses({ page: 1, limit: 10 });
      if (response.success && response.data?.data?.records) {
        const warehouseList: Warehouse[] = response.data.data.records;
        setWarehouses(warehouseList);
        
        // Set "Finished Goods" as default only if not in edit mode
        if (!isEditMode) {
          const finishedGoods = warehouseList.find(
            w => w.warehouse_name.toLowerCase() === 'finished goods'
          );
          
          if (finishedGoods) {
            setWarehouse(finishedGoods.warehouse_name);
          } else if (warehouseList.length > 0) {
            setWarehouse(warehouseList[0].warehouse_name);
          }
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

  const fetchAllItems = async () => {
    setIsLoadingItems(true);
    try {
      const response = await deliveryChallanAPI.getItems({ page: 1, limit: 100 });
      if (response.success && response.data?.data) {
        const itemsData = response.data.data.map((item: any) => ({
          id: item.id?.toString() || item.name || '',
          itemCode: item.item_code || item.name || '',
          itemName: item.item_name || '',
          hsn: item.HSN || item.hsn || '',
          description: item.description || item.item_name || '',
          unit: item.stock_uom || 'pcs',
          rate: item.standard_rate || 0,
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
        }));
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
        const itemsData = response.data.data.map((item: any) => ({
          id: item.id?.toString() || item.name || '',
          itemCode: item.item_code || item.name || '',
          itemName: item.item_name || '',
          hsn: item.HSN || item.hsn || '',
          description: item.description || item.item_name || '',
          unit: item.stock_uom || 'pcs',
          rate: item.standard_rate || 0,
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
        }));
        setProducts(itemsData);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  }, [allProducts]);

  const loadCustomerData = (customerId: string, customer?: Customer) => {
    const customerData = customer || customers.find(c => c.id === customerId);
    if (customerData) {
      setCustomerData(customerData);
      setSelectedSalesOrder('');
      setSelectedOrderData(null);
      // Only reset items if not in edit mode or if items are empty
      if (!isEditMode || items.length === 0) {
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
      setItems(initialItems);
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
        type: isService ? 'service' : 'product',
        inventoryId: undefined,
      }]);
    }

    setErrors({});
    toast.success(`Loaded order #${orderData.id}`);
  };

  const handleSalesOrderChange = (soId: string, orderData?: SalesOrder) => {
    setSelectedSalesOrder(soId);
    if (soId && orderData) {
      loadSalesOrder(soId, orderData);
    } else {
      setSelectedOrderData(null);
    }
  };

  const addItem = () => {
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
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) {
      toast.error('At least one item is required');
      return;
    }
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof DeliveryChallanItem, value: any) => {
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
            const taxAmount = (amount * (updated.tax || 0)) / 100;
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
            const taxAmount = (amount * (updated.tax || 0)) / 100;
            updated.amount = amount;
            updated.taxAmount = taxAmount;
            updated.totalAmount = amount + taxAmount;
          }

          if (field === 'tax') {
            const amount = (updated.quantity || 0) * (updated.rate || 0);
            const taxRate = Number(value) || 0;
            const tax_id = getTaxIdFromRate(taxRate, taxOptions);
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
        company: record.company || 'SculptorTech Pvt Ltd',
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

  const buildPayload = (): DeliveryNotePayload => {
    const selectedWarehouse = warehouses.find(w => w.warehouse_name === warehouse);
    
    const payload: DeliveryNotePayload = {
      naming_series: "DN-.YYYY.-",
      customer_id: customerData?.id ? parseInt(customerData.id, 10) : 0,
      customer_name: customerData?.name || '',
      posting_date: dcDate,
      company: 'SculptERP Pvt Ltd',
      set_warehouse: selectedWarehouse?.warehouse_name || warehouse || '',
      transporter: transporter || '',
      vehicle_no: vehicleNumber || '',
      driver_name: transporter || '',
      lr_no: null,
      lr_date: null,
      sales_order_id: hasSalesOrder && selectedSalesOrder ? parseInt(selectedSalesOrder, 10) : null,
      instructions: remarks || '',
      status: status,
      type: isService ? 'Services' : 'Products',
      items: items
        .filter(item => item.itemCode && item.quantity > 0)
        .map(item => ({
          name: item.itemName || item.itemCode,
          item_code: item.itemCode,
          item_name: item.itemName || item.itemCode,
          description: item.description || item.itemName || item.itemCode,
          qty: item.quantity,
          uom: item.unit,
          rate: item.rate,
          amount: item.amount,
          tax: item.tax || 0,
          tax_id: item.tax_id ?? null,
          tax_amount: item.taxAmount || 0,
          total_amount: item.totalAmount || 0,
          warehouse: selectedWarehouse?.warehouse_name || warehouse || '',
          type: item.type
        }))
    };

    // If in edit mode, add the id to payload
    if (isEditMode && id) {
      payload.id = id;
    }

    return payload;
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!selectedCustomer) newErrors.customer = 'Please select a customer';
    if (hasSalesOrder && !selectedSalesOrder) newErrors.salesOrder = 'Please select a sales order';
    if (!dcDate) newErrors.dcDate = 'DC Date is required';
    if (!warehouse) newErrors.warehouse = 'Warehouse is required';
    const hasItems = items.some(item => item.itemCode && item.quantity > 0);
    if (!hasItems) newErrors.items = 'At least one item is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    const toastId = toast.loading(isEditMode ? 'Updating delivery challan...' : 'Creating delivery challan...');
    try {
      const payload = buildPayload();
      
      let response;
      if (isEditMode && id) {
        // UPDATE: Use PUT with payload containing id
        response = await deliveryChallanAPI.updateDeliveryNote(payload);
      } else {
        // CREATE: Use POST
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
      
      // Only update inventory for new DCs, not for edits
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
      
      toast.success(isEditMode ? 'Updated!' : 'Created!', { id: toastId });
      
      setSuccessData({
        deliveryNote: deliveryNote,
        totalItems: totalItems,
        message: message,
        customerName: customerData?.name
      });
      setShowSuccessModal(true);
      
      // Only auto-submit for new DCs
      if (!isEditMode && (status === 'Submitted' || status === 'Pending')) {
        if (createdDC?.data?.delivery_note || createdDC?.name) {
          const dcName = createdDC?.data?.delivery_note || createdDC?.name;
          try {
            await deliveryChallanAPI.submitDeliveryNote(dcName);
            toast.success(`DC ${dcName} submitted!`);
          } catch (submitError) {
            console.warn('Submit failed but DC was created:', submitError);
            toast('DC created but submission failed. Please submit manually.');
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || (isEditMode ? 'Failed to update' : 'Failed to create'), { id: toastId });
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    const toastId = toast.loading(isEditMode ? 'Updating draft...' : 'Saving draft...');
    try {
      const payload = buildPayload();
      
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
      
      toast.success(`${isEditMode ? 'Draft updated' : 'Draft saved'}: ${deliveryNote}`, { id: toastId });
      setTimeout(() => navigate('/delivery-challan'), 1000);
    } catch (error: any) {
      toast.error(error.message || (isEditMode ? 'Failed to update' : 'Failed to save'), { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure? Unsaved data will be lost.')) {
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
        inventoryId: undefined,
      }]);
    }
  }, [isService]);

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

      {/* Header with IsService on right */}
      <div className="ndc-header">
        <div className="ndc-header-left">
          <button onClick={handleCancel} className="ndc-back-btn">
            <FaArrowLeft size={13} /> Back
          </button>
          <div className="ndc-header-divider" />
          <h1 className="ndc-header-title">
            {isEditMode ? 'Edit Delivery Challan' : 'Create Delivery Challan'}
          </h1>
          {isEditMode && id && (
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
                setIsService(e.target.checked);
                setItems(items.map(item => ({
                  ...item,
                  type: e.target.checked ? 'service' : 'product'
                })));
              }}
              className="ndc-checkbox"
            />
            <span>IsService</span>
          </label>
        </div>
      </div>

      {/* MAIN BOX */}
      <div className="ndc-main-box">
        {/* Sales Order Toggle - GRN-style radio toggle */}
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
                disabled={isEditMode}
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
                disabled={isEditMode}
              />
              Without Sales Order
            </label>
          </div>
          {isEditMode && (
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
              (Source type cannot be changed in edit mode)
            </span>
          )}
        </div>

        {/* TWO COLUMN LAYOUT */}
        <div className="ndc-compact-layout">
          {/* LEFT COLUMN */}
          <div className="ndc-left-column">
            {/* Customer & Sales Order - Conditional Layout */}
            <div className="ndc-section-header">
              <FaBuilding className="ndc-section-icon" />
              <span>Customer & Order</span>
            </div>

            {hasSalesOrder ? (
              // With Sales Order - 2 columns
              <div className="ndc-field-row">
                <div className="ndc-field-half">
                  <label className="ndc-label">
                    Customer <span className="ndc-required">*</span>
                  </label>
                  <CustomerDropdown
                    value={selectedCustomer}
                    onChange={handleCustomerChange}
                    placeholder="Search Customer..."
                    disabled={isLoading || isEditMode}
                    error={!!errors.customer}
                  />
                  {errors.customer && <span className="ndc-error-text">{errors.customer}</span>}
                </div>

                <div className="ndc-field-half">
                  <label className="ndc-label">
                    Sales Order <span className="ndc-required">*</span>
                  </label>
                  <SalesOrderDropdown
                    value={selectedSalesOrder}
                    onChange={handleSalesOrderChange}
                    customerId={selectedCustomer}
                    placeholder="Search or select sales order..."
                    disabled={!selectedCustomer || isEditMode}
                    error={!!errors.salesOrder}
                    taxOptions={taxOptions}
                  />
                  {errors.salesOrder && <span className="ndc-error-text">{errors.salesOrder}</span>}
                </div>
              </div>
            ) : (
              // Without Sales Order - Customer full width
              <div className="ndc-field-full">
                <div className="ndc-field-full-width">
                  <label className="ndc-label">
                    Customer <span className="ndc-required">*</span>
                  </label>
                  <CustomerDropdown
                    value={selectedCustomer}
                    onChange={handleCustomerChange}
                    placeholder="Search Customer..."
                    disabled={isLoading || isEditMode}
                    error={!!errors.customer}
                    fullWidth={true}
                  />
                  {errors.customer && <span className="ndc-error-text">{errors.customer}</span>}
                </div>
              </div>
            )}

            {/* Delivery Challan Details - 4 columns in one row (added Status) */}
            <div className="ndc-section-header" style={{ marginTop: hasSalesOrder ? '0' : '0rem' }}>
              <FaBox className="ndc-section-icon" />
              <span>Challan Details</span>
            </div>

            <div className="ndc-grid-4">
              <div className="ndc-field">
                <label className="ndc-label">DC Number</label>
                <div className="ndc-dc-number-display">{dcNumber}</div>
              </div>

              <div className="ndc-field">
                <label className="ndc-label">
                  DC Date <span className="ndc-required">*</span>
                </label>
                <div className="ndc-date-field">
                  <input
                    type="date"
                    value={dcDate}
                    onChange={(e) => setDcDate(e.target.value)}
                    className={`ndc-input ${errors.dcDate ? 'ndc-input-error' : ''}`}
                    disabled={isEditMode}
                  />
                  <button
                    type="button"
                    className="ndc-date-icon-btn"
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

              <div className="ndc-field">
                <label className="ndc-label">
                  Warehouse <span className="ndc-required">*</span>
                </label>
                <select
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                  className={`ndc-select ${errors.warehouse ? 'ndc-select-error' : ''}`}
                  disabled={isLoadingWarehouses || isEditMode}
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

              {/* Status Dropdown */}
              <div className="ndc-field">
                <label className="ndc-label">
                  Status <span className="ndc-required">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="ndc-select"
                >
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="ndc-right-column">
            {/* Customer Detail Card */}
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

        {/* FULL WIDTH - ITEMS SECTION */}
        <div className="ndc-items-full">
          <div className="ndc-items-header">
            <span className="ndc-items-title">
              <FaClipboardList className="ndc-items-icon" /> {isService ? 'Services' : 'Products'}
            </span>
            <button onClick={addItem} className="ndc-add-btn">
              <FaPlus size={9} /> Add
            </button>
          </div>

          {errors.items && <div className="ndc-items-error"><FaExclamationTriangle /> {errors.items}</div>}

          <div className="ndc-table-wrap">
            <table className="ndc-items-table">
              <thead>
                <tr>
                  <th className="ndc-col-sno">#</th>
                  <th className="ndc-col-code">Item Code <span className="ndc-required">*</span></th>
                  <th className="ndc-col-name">Item Name <span className="ndc-required">*</span></th>
                  <th className="ndc-col-hsn">HSN</th>
                  <th className="ndc-col-qty">Qty <span className="ndc-required">*</span></th>
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
                  <tr key={item.id}>
                    <td className="ndc-col-sno">{index + 1}</td>
                    <td className="ndc-col-code">
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
                    <td className="ndc-col-name">
                      <input
                        type="text"
                        value={item.itemName}
                        onChange={(e) => updateItem(item.id, 'itemName', e.target.value)}
                        placeholder="Item Name"
                        className="ndc-table-input ndc-table-input-text"
                      />
                    </td>
                    <td className="ndc-col-hsn">
                      <input
                        type="text"
                        value={item.hsn}
                        onChange={(e) => updateItem(item.id, 'hsn', e.target.value)}
                        placeholder="HSN"
                        className="ndc-table-input ndc-table-input-text"
                      />
                    </td>
                    <td className="ndc-col-qty">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        min="1"
                        className="ndc-table-input"
                      />
                    </td>
                    <td className="ndc-col-unit">
                      <select
                        value={item.unit}
                        onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                        className="ndc-table-input"
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
                      />
                    </td>
                    <td className="ndc-col-tax">
                      <select
                        value={item.tax}
                        onChange={(e) => updateItem(item.id, 'tax', parseFloat(e.target.value) || 0)}
                        className="ndc-table-input"
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
                    <td className="ndc-col-tax-amount" style={{ textAlign: 'right' }}>
                      <span className="ndc-table-value">₹{item.taxAmount.toFixed(2)}</span>
                    </td>
                    <td className="ndc-col-amount" style={{ textAlign: 'right' }}>
                      <span className="ndc-table-value">₹{item.totalAmount.toFixed(2)}</span>
                    </td>
                    <td className="ndc-col-action">
                      <button onClick={() => removeItem(item.id)} className="ndc-remove-btn">
                        <FaTrash size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BOTTOM SECTION: Shipping + Remarks + Quality Inspection (Left) | Summary (Right) */}
        <div className="ndc-bottom-section">
          {/* LEFT COLUMN: Shipping Details + Remarks + Quality Inspection */}
          <div className="ndc-bottom-left">
            {/* Shipping Details */}
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
                  />
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className="ndc-field ndc-remarks-bottom">
              <label className="ndc-label">Remarks</label>
              <textarea
                placeholder="Add any additional notes..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="ndc-textarea ndc-textarea-large"
                rows={2}
              />
            </div>

            {/* Quality Inspection Checkbox */}
            <div className="ndc-field ndc-quality-inspection-bottom">
              <label className="ndc-label ndc-checkbox-label-inline">
                <input
                  type="checkbox"
                  checked={qualityInspection}
                  onChange={(e) => setQualityInspection(e.target.checked)}
                  className="ndc-checkbox ndc-quality-checkbox"
                />
                <span className="ndc-checkbox-text">
                  Quality Inspection Required
                </span>
              </label>
            </div>
          </div>

          {/* RIGHT COLUMN: Financial Summary */}
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
        <button onClick={() => window.print()} className="ndc-btn ndc-btn-print">
          <FaPrint size={11} /> Print
        </button>
        <button onClick={handleSaveDraft} disabled={isSubmitting} className="ndc-btn ndc-btn-draft">
          {isSubmitting ? <FaSpinner className="ndc-spinning" size={11} /> : <FaSave size={11} />} {isEditMode ? 'Update Draft' : 'Draft'}
        </button>
        <button onClick={handleSubmit} disabled={isSubmitting} className="ndc-btn ndc-btn-submit">
          {isSubmitting ? <FaSpinner className="ndc-spinning" size={11} /> : <FaPaperPlane size={11} />} {isEditMode ? 'Update' : 'Submit'}
        </button>
        <button onClick={handleCancel} className="ndc-btn ndc-btn-cancel">
          <FaTimes size={11} /> Cancel
        </button>
      </div>
    </div>
  );
};

export default NewDeliveryChallan;