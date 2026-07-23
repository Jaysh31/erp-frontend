import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  FaSave,
  FaTimes,
  FaPrint,
  FaPaperPlane,
  FaBox,
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
  FaTruck,
  FaClipboardList,
  FaCheckCircle,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import './CreateDeliveryChallan.css';

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
  description: string;
  unit: string;
  rate: number;
  tax: number;
  type: 'product' | 'service';
  stockUom?: string;
  standardRate?: number;
}

interface DeliveryChallanItem {
  id: string;
  itemCode: string;
  itemName: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  tax: number;
  taxAmount: number;
  totalAmount: number;
  type: 'product' | 'service';
}

interface DeliveryNotePayload {
  name: string;
  naming_series: string;
  customer: string;
  customer_name: string;
  posting_date: string;
  company: string;
  set_warehouse: string;
  transporter: string;
  vehicle_no: string;
  driver_name: string;
  lr_no: string;
  lr_date: string;
  po_no: string;
  po_date: string;
  sales_order: string;
  instructions: string;
  status: string;
  dc_type: string;
  quality_inspection: boolean;
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

  async submitDeliveryNote(name: string): Promise<ApiResponse<any>> {
    return this.apiService.post(`/delivery-note/${name}/submit`, {});
  }

  async getDeliveryNote(id: string): Promise<ApiResponse<any>> {
    return this.apiService.get(`/delivery-note/${id}`);
  }

  async getDeliveryNotes(params?: Record<string, any>): Promise<ApiResponse<any[]>> {
    return this.apiService.get('/delivery-notes', params);
  }

  async updateDeliveryNote(id: string, data: Partial<DeliveryNotePayload>): Promise<ApiResponse<any>> {
    return this.apiService.put(`/delivery-note/${id}`, data);
  }

  async deleteDeliveryNote(id: string): Promise<ApiResponse<any>> {
    return this.apiService.delete(`/delivery-note/${id}`);
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

  async getWarehouses(params?: { page?: number; limit?: number }): Promise<ApiResponse<any>> {
    return this.apiService.get('/warehouse', params);
  }
}

// ===== MOCK DATA =====
const MOCK_CUSTOMERS: Customer[] = [
  {
    id: '1',
    name: 'ABC Traders Pvt Ltd',
    code: 'CUST001',
    email: 'info@abctraders.com',
    phone: '+91 98765 43210',
    contactPerson: 'Rajesh Sharma',
    contactMobile: '+91 98765 43211',
    address: '123, Business Park, Mumbai - 400001',
    shippingAddress: '123, Business Park, Mumbai - 400001',
    gstin: '27AABCU1234D1Z1'
  },
  {
    id: '2',
    name: 'XYZ Enterprises',
    code: 'CUST002',
    email: 'contact@xyzent.com',
    phone: '+91 87654 32109',
    contactPerson: 'Priya Patel',
    contactMobile: '+91 87654 32110',
    address: '456, Industrial Estate, Pune - 411001',
    shippingAddress: '456, Industrial Estate, Pune - 411001',
    gstin: '27BXYZU5678D1Z1'
  },
  {
    id: '3',
    name: 'PQR Solutions Ltd',
    code: 'CUST003',
    email: 'info@pqrsolutions.com',
    phone: '+91 76543 21098',
    contactPerson: 'Amit Singh',
    contactMobile: '+91 76543 21099',
    address: '789, Tech Park, Bangalore - 560001',
    shippingAddress: '789, Tech Park, Bangalore - 560001',
    gstin: '27CPQRU9012D1Z1'
  }
];

const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', itemCode: 'PRD-P001', itemName: 'Industrial Pump - 5 HP', description: 'Industrial Pump - 5 HP', unit: 'pcs', rate: 1500, tax: 18, type: 'product' },
  { id: 'p2', itemCode: 'PRD-S001', itemName: 'Submersible Pump - 2 HP', description: 'Submersible Pump - 2 HP', unit: 'pcs', rate: 2000, tax: 18, type: 'product' },
  { id: 'p3', itemCode: 'PRD-C001', itemName: 'Centrifugal Pump - 3 HP', description: 'Centrifugal Pump - 3 HP', unit: 'pcs', rate: 2500, tax: 12, type: 'product' },
  { id: 'p4', itemCode: 'PRD-M001', itemName: 'Motor Assembly - 7.5 HP', description: 'Motor Assembly - 7.5 HP', unit: 'pcs', rate: 5000, tax: 18, type: 'product' },
  { id: 'p5', itemCode: 'PRD-G001', itemName: 'Gear Box - 10:1 Ratio', description: 'Gear Box - 10:1 Ratio', unit: 'pcs', rate: 3000, tax: 12, type: 'product' },
];

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
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Search...',
  disabled = false,
  error = false,
  onSearch,
  loading = false
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
              {option.itemName} | Tax: {option.tax}%
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
            minHeight: '30px'
          }}
        />
        {loading ? (
          <FaSpinner className="ndc-spinning" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-color, #2563eb)', fontSize: '11px' }} />
        ) : (
          <FaChevronDown style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary, #94a3b8)', fontSize: '11px', pointerEvents: 'none' }} />
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
}

const SalesOrderDropdown: React.FC<SalesOrderDropdownProps> = ({
  value,
  onChange,
  customerId,
  placeholder = 'Search Sales Order...',
  disabled = false,
  error = false
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
        customer: custId,
        page: 1,
        limit: 50
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
        setOrders(orderList);
        setFilteredOrders(orderList);
      }
    } catch (error) {
      console.error('Error fetching sales orders:', error);
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
    onChange(String(order.id), order);
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
            id: cust.id?.toString() || '',
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
          setCustomers(MOCK_CUSTOMERS);
          setFilteredCustomers(MOCK_CUSTOMERS);
        }
      } else {
        setCustomers(MOCK_CUSTOMERS);
        setFilteredCustomers(MOCK_CUSTOMERS);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers(MOCK_CUSTOMERS);
      setFilteredCustomers(MOCK_CUSTOMERS);
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

// ===== MAIN COMPONENT =====

const NewDeliveryChallan: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();

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
  const [dcNumber] = useState<string>(`DN-${new Date().getFullYear()}-001`);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState<boolean>(false);
  const [roundOff, setRoundOff] = useState<number>(0);
  
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

  useEffect(() => {
    fetchCustomers();
    fetchAllItems();
    fetchWarehouses();
  }, []);

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
        
        const finishedGoods = warehouseList.find(
          w => w.warehouse_name.toLowerCase() === 'finished goods'
        );
        
        if (finishedGoods) {
          setWarehouse(finishedGoods.warehouse_name);
        } else if (warehouseList.length > 0) {
          setWarehouse(warehouseList[0].warehouse_name);
        }
      } else {
        const mockWarehouses: Warehouse[] = [
          { id: 9, warehouse_name: 'Raw Material Store', company: 'ChandraTara', parent_warehouse: null, warehouse_type: null, city: 'Pune', state: 'Mh', email_id: null, phone_no: '08668584275', disabled: 0 },
          { id: 10, warehouse_name: 'Work In Progress', company: 'ChandraTara', parent_warehouse: null, warehouse_type: null, city: null, state: null, email_id: null, phone_no: null, disabled: 0 },
          { id: 11, warehouse_name: 'Finished Goods', company: 'ChandraTara', parent_warehouse: null, warehouse_type: null, city: null, state: null, email_id: null, phone_no: '08668584275', disabled: 0 },
          { id: 13, warehouse_name: 'Scrap Warehouse', company: 'ChandraTara', parent_warehouse: null, warehouse_type: null, city: null, state: null, email_id: null, phone_no: null, disabled: 0 }
        ];
        setWarehouses(mockWarehouses);
        const finishedGoods = mockWarehouses.find(
          w => w.warehouse_name.toLowerCase() === 'finished goods'
        );
        if (finishedGoods) {
          setWarehouse(finishedGoods.warehouse_name);
        } else if (mockWarehouses.length > 0) {
          setWarehouse(mockWarehouses[0].warehouse_name);
        }
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      const mockWarehouses: Warehouse[] = [
        { id: 9, warehouse_name: 'Raw Material Store', company: 'ChandraTara', parent_warehouse: null, warehouse_type: null, city: 'Pune', state: 'Mh', email_id: null, phone_no: '08668584275', disabled: 0 },
        { id: 10, warehouse_name: 'Work In Progress', company: 'ChandraTara', parent_warehouse: null, warehouse_type: null, city: null, state: null, email_id: null, phone_no: null, disabled: 0 },
        { id: 11, warehouse_name: 'Finished Goods', company: 'ChandraTara', parent_warehouse: null, warehouse_type: null, city: null, state: null, email_id: null, phone_no: '08668584275', disabled: 0 },
        { id: 13, warehouse_name: 'Scrap Warehouse', company: 'ChandraTara', parent_warehouse: null, warehouse_type: null, city: null, state: null, email_id: null, phone_no: null, disabled: 0 }
      ];
      setWarehouses(mockWarehouses);
      const finishedGoods = mockWarehouses.find(
        w => w.warehouse_name.toLowerCase() === 'finished goods'
      );
      if (finishedGoods) {
        setWarehouse(finishedGoods.warehouse_name);
      } else if (mockWarehouses.length > 0) {
        setWarehouse(mockWarehouses[0].warehouse_name);
      }
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
            id: cust.id?.toString() || '',
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
        } else {
          setCustomers(MOCK_CUSTOMERS);
        }
      } else {
        setCustomers(MOCK_CUSTOMERS);
      }
    } catch (error) {
      setCustomers(MOCK_CUSTOMERS);
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
          id: item.id.toString(),
          itemCode: item.item_code,
          itemName: item.item_name,
          description: item.description || item.item_name,
          unit: item.stock_uom || 'pcs',
          rate: item.standard_rate || 0,
          tax: item.gst_rate || item.tax_rate || 0,
          type: 'product' as 'product' | 'service',
          stockUom: item.stock_uom,
          standardRate: item.standard_rate
        }));
        setAllProducts(itemsData);
        setProducts(itemsData);
      } else {
        setAllProducts(MOCK_PRODUCTS);
        setProducts(MOCK_PRODUCTS);
      }
    } catch (error) {
      setAllProducts(MOCK_PRODUCTS);
      setProducts(MOCK_PRODUCTS);
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
          id: item.id.toString(),
          itemCode: item.item_code,
          itemName: item.item_name,
          description: item.description || item.item_name,
          unit: item.stock_uom || 'pcs',
          rate: item.standard_rate || 0,
          tax: item.gst_rate || item.tax_rate || 0,
          type: 'product' as 'product' | 'service'
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
      setItems([{
        id: '1',
        itemCode: '',
        itemName: '',
        description: '',
        quantity: 1,
        unit: 'pcs',
        rate: 0,
        amount: 0,
        tax: 0,
        taxAmount: 0,
        totalAmount: 0,
        type: isService ? 'service' : 'product'
      }]);
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

    if (orderData.items && orderData.items.length > 0) {
      const initialItems: DeliveryChallanItem[] = orderData.items.map((item, index) => {
        const product = allProducts.find(p => p.itemCode === item.item_code);
        const taxRate = product?.tax || 0;
        const amount = (item.qty || 0) * (item.rate || 0);
        const taxAmount = (amount * taxRate) / 100;
        
        return {
          id: `so-${index}`,
          itemCode: item.item_code || '',
          itemName: item.description || '',
          description: item.description || '',
          quantity: item.qty || 1,
          unit: item.uom || 'pcs',
          rate: item.rate || 0,
          amount: amount,
          tax: taxRate,
          taxAmount: taxAmount,
          totalAmount: amount + taxAmount,
          type: isService ? 'service' : 'product'
        };
      });
      setItems(initialItems);
    } else {
      setItems([{
        id: '1',
        itemCode: '',
        itemName: '',
        description: '',
        quantity: 1,
        unit: 'pcs',
        rate: 0,
        amount: 0,
        tax: 0,
        taxAmount: 0,
        totalAmount: 0,
        type: isService ? 'service' : 'product'
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
    setItems([...items, {
      id: Date.now().toString(),
      itemCode: '',
      itemName: '',
      description: '',
      quantity: 1,
      unit: 'pcs',
      rate: 0,
      amount: 0,
      tax: 0,
      taxAmount: 0,
      totalAmount: 0,
      type: isService ? 'service' : 'product'
    }]);
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
              updated.itemName = product.itemName;
              updated.unit = product.unit;
              updated.rate = product.rate;
              updated.tax = product.tax || 0;
              const amount = (updated.quantity || 0) * product.rate;
              updated.amount = amount;
              updated.taxAmount = (amount * updated.tax) / 100;
              updated.totalAmount = amount + updated.taxAmount;
            }
          }

          if (field === 'quantity') {
            const amount = (updated.quantity || 0) * (updated.rate || 0);
            updated.amount = amount;
            updated.taxAmount = (amount * (updated.tax || 0)) / 100;
            updated.totalAmount = amount + updated.taxAmount;
          }

          if (field === 'rate') {
            const amount = (updated.quantity || 0) * (updated.rate || 0);
            updated.amount = amount;
            updated.taxAmount = (amount * (updated.tax || 0)) / 100;
            updated.totalAmount = amount + updated.taxAmount;
          }

          if (field === 'tax') {
            const amount = (updated.quantity || 0) * (updated.rate || 0);
            updated.amount = amount;
            updated.taxAmount = (amount * (updated.tax || 0)) / 100;
            updated.totalAmount = amount + updated.taxAmount;
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

  const buildPayload = (status: 'Draft' | 'Submitted'): DeliveryNotePayload => {
    const selectedWarehouse = warehouses.find(w => w.warehouse_name === warehouse);
    
    return {
      name: dcNumber,
      naming_series: "DN-.YYYY.-",
      customer: customerData?.code || '',
      customer_name: customerData?.name || '',
      posting_date: dcDate,
      company: 'SculptERP Pvt Ltd',
      set_warehouse: selectedWarehouse?.warehouse_name || warehouse || '',
      transporter: transporter || '',
      vehicle_no: vehicleNumber || '',
      driver_name: transporter || '',
      lr_no: '',
      lr_date: '',
      po_no: '',
      po_date: '',
      sales_order: hasSalesOrder ? selectedSalesOrder : '',
      instructions: remarks || '',
      status: status,
      dc_type: isService ? 'Services' : 'Products',
      quality_inspection: qualityInspection,
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
          tax_amount: item.taxAmount || 0,
          total_amount: item.totalAmount || 0,
          warehouse: selectedWarehouse?.warehouse_name || warehouse || '',
          type: item.type
        }))
    };
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
    const toastId = toast.loading('Creating delivery challan...');
    try {
      const payload = buildPayload('Submitted');
      const createResponse = await deliveryChallanAPI.createDeliveryNote(payload);
      if (!createResponse.success) throw new Error(createResponse.message || 'Failed to create');
      
      const createdDC = createResponse.data;
      
      // FIX: Extract delivery_note from the nested data object
      const deliveryNote = createdDC?.data?.delivery_note || 
                          createdDC?.delivery_note || 
                          createdDC?.name || 
                          dcNumber;
      
      const totalItems = createdDC?.data?.total_items || 
                        createdDC?.total_items || 
                        items.filter(i => i.itemCode && i.quantity > 0).length;
      
      const message = createdDC?.data?.message || 
                     createdDC?.message || 
                     createResponse.message || 
                     'Delivery Note created successfully.';
      
      toast.success('Created!', { id: toastId });
      
      // Show success modal immediately after creation
      setSuccessData({
        deliveryNote: deliveryNote,
        totalItems: totalItems,
        message: message,
        customerName: customerData?.name
      });
      setShowSuccessModal(true);
      
      // Try to submit if we have a name
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
    } catch (error: any) {
      toast.error(error.message || 'Failed to create', { id: toastId });
      setIsSubmitting(false);
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
      const response = await deliveryChallanAPI.createDeliveryNote(payload);
      if (!response.success) throw new Error(response.message || 'Failed to save');
      
      const createdDC = response.data;
      const deliveryNote = createdDC?.data?.delivery_note || 
                          createdDC?.delivery_note || 
                          createdDC?.name || 
                          dcNumber;
      
      toast.success(`Draft saved: ${deliveryNote}`, { id: toastId });
      setTimeout(() => navigate('/delivery-challan'), 1000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save', { id: toastId });
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
    navigate(`/delivery-challan/${successData.deliveryNote}`);
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
        description: '',
        quantity: 1,
        unit: 'pcs',
        rate: 0,
        amount: 0,
        tax: 0,
        taxAmount: 0,
        totalAmount: 0,
        type: isService ? 'service' : 'product'
      }]);
    }
  }, [isService]);

  const totalItems = items.filter(i => i.itemCode && i.quantity > 0).length;
  const totalQuantity = getTotalQty();
  const subTotal = getTotalAmount();
  const totalTax = getTotalTax();
  const grandTotal = getGrandTotal();
  const grandTotalWithRound = grandTotal + roundOff;

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
          <h1 className="ndc-header-title">Create Delivery Challan</h1>
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
              />
              Without Sales Order
            </label>
          </div>
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
                    disabled={isLoading}
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
                    disabled={!selectedCustomer}
                    error={!!errors.salesOrder}
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
                    disabled={isLoading}
                    error={!!errors.customer}
                    fullWidth={true}
                  />
                  {errors.customer && <span className="ndc-error-text">{errors.customer}</span>}
                </div>
              </div>
            )}

            {/* Delivery Challan Details - 3 columns in one row */}
            <div className="ndc-section-header" style={{ marginTop: hasSalesOrder ? '0' : '0rem' }}>
              <FaBox className="ndc-section-icon" />
              <span>Challan Details</span>
            </div>

            <div className="ndc-grid-3">
              <div className="ndc-field">
                <label className="ndc-label">DC Number</label>
                <div className="ndc-dc-number-display">{dcNumber}</div>
              </div>

              <div className="ndc-field">
                <label className="ndc-label">
                  DC Date <span className="ndc-required">*</span>
                </label>
                <input
                  type="date"
                  value={dcDate}
                  onChange={(e) => setDcDate(e.target.value)}
                  className={`ndc-input ${errors.dcDate ? 'ndc-input-error' : ''}`}
                />
              </div>

              <div className="ndc-field">
                <label className="ndc-label">
                  Warehouse <span className="ndc-required">*</span>
                </label>
                <select
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                  className={`ndc-select ${errors.warehouse ? 'ndc-select-error' : ''}`}
                  disabled={isLoadingWarehouses}
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
                  <th className="ndc-col-code">Product Code</th>
                  <th className="ndc-col-name">Product Name</th>
                  <th className="ndc-col-qty">Qty</th>
                  <th className="ndc-col-unit">UOM</th>
                  <th className="ndc-col-rate">Rate</th>
                  <th className="ndc-col-amount">Amount</th>
                  <th className="ndc-col-gst">GST%</th>
                  <th className="ndc-col-tax">Tax</th>
                  <th className="ndc-col-total">Total</th>
                  <th className="ndc-col-action"></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="ndc-col-code">
                      <SearchableSelect
                        value={item.itemCode}
                        onChange={(value) => updateItem(item.id, 'itemCode', value)}
                        options={products}
                        placeholder="Search..."
                        onSearch={handleItemSearch}
                        loading={isLoadingItems}
                      />
                    </td>
                    <td className="ndc-col-name">
                      <input
                        type="text"
                        value={item.itemName}
                        disabled
                        className="ndc-table-input ndc-table-input-text"
                      />
                    </td>
                    <td className="ndc-col-qty">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
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
                      </select>
                    </td>
                    <td className="ndc-col-rate">
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        className="ndc-table-input"
                      />
                    </td>
                    <td className="ndc-col-amount">
                      <span className="ndc-table-value">₹{item.amount.toFixed(2)}</span>
                    </td>
                    <td className="ndc-col-gst">
                      <input
                        type="number"
                        value={item.tax || 0}
                        onChange={(e) => {
                          const taxRate = parseFloat(e.target.value) || 0;
                          updateItem(item.id, 'tax', taxRate);
                        }}
                        className="ndc-table-input"
                      />
                    </td>
                    <td className="ndc-col-tax">
                      <span className="ndc-table-value">₹{item.taxAmount.toFixed(2)}</span>
                    </td>
                    <td className="ndc-col-total">
                      <span className="ndc-table-value ndc-table-value-bold">₹{item.totalAmount.toFixed(2)}</span>
                    </td>
                    <td className="ndc-col-action">
                      <button onClick={() => removeItem(item.id)} className="ndc-remove-btn">
                        <FaTrash />
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
          {isSubmitting ? <FaSpinner className="ndc-spinning" size={11} /> : <FaSave size={11} />} Draft
        </button>
        <button onClick={handleSubmit} disabled={isSubmitting} className="ndc-btn ndc-btn-submit">
          {isSubmitting ? <FaSpinner className="ndc-spinning" size={11} /> : <FaPaperPlane size={11} />} Submit
        </button>
        <button onClick={handleCancel} className="ndc-btn ndc-btn-cancel">
          <FaTimes size={11} /> Cancel
        </button>
      </div>
    </div>
  );
};

export default NewDeliveryChallan;