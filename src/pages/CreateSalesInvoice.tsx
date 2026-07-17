// CreateSalesBill.tsx - Updated with Delivery Challan and Bill Type in same row

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  FaSave,
  FaTimes,
  FaPrint,
  FaPaperPlane,
  FaUser,
  FaBox,
  FaPlus,
  FaTrash,
  FaSpinner,
  FaChevronDown,
  FaArrowLeft,
  FaInfoCircle,
  FaRupeeSign,
  FaListUl,
  FaTruck,
  FaCalendarAlt,
  FaFileInvoice,
  FaTags,
  FaWarehouse,
  FaMoneyBillWave,
  FaCalculator,
  FaFileAlt
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
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
  description: string;
  unit: string;
  rate: number;
  tax: number;
  type: 'product' | 'service';
  stockUom?: string;
  standardRate?: number;
}

interface SalesBillItem {
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

interface SalesBillPayload {
  name: string;
  naming_series: string;
  customer: string;
  customer_name: string;
  posting_date: string;
  company: string;
  set_warehouse: string;
  invoice_no: string;
  invoice_date: string;
  due_date: string;
  payment_terms: string;
  payment_mode: string;
  invoice_status: string;
  po_no: string;
  po_date: string;
  sales_order: string;
  delivery_challan: string;
  instructions: string;
  status: string;
  bill_type: string;
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

interface DeliveryChallanData {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_code: string;
  sales_order_id?: string;
  sales_order_number?: string;
  items?: Array<{
    item_code: string;
    description: string;
    qty: number;
    uom: string;
    rate: number;
    amount: number;
  }>;
  posting_date: string;
  total_qty: number;
  grand_total: number;
  po_no?: string;
  po_date?: string;
  warehouse?: string;
  remarks?: string;
}

interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
  success: boolean;
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

// ===== SALES BILL API =====

class SalesBillAPI {
  private apiService: ApiService;

  constructor() {
    this.apiService = ApiService.getInstance();
  }

  async createSalesBill(payload: SalesBillPayload): Promise<ApiResponse<any>> {
    return this.apiService.post('/sales-bill', payload);
  }

  async submitSalesBill(name: string): Promise<ApiResponse<any>> {
    return this.apiService.post(`/sales-bill/${name}/submit`, {});
  }

  async getSalesBill(id: string): Promise<ApiResponse<any>> {
    return this.apiService.get(`/sales-bill/${id}`);
  }

  async getSalesBills(params?: Record<string, any>): Promise<ApiResponse<any[]>> {
    return this.apiService.get('/sales-bills', params);
  }

  async updateSalesBill(id: string, data: Partial<SalesBillPayload>): Promise<ApiResponse<any>> {
    return this.apiService.put(`/sales-bill/${id}`, data);
  }

  async deleteSalesBill(id: string): Promise<ApiResponse<any>> {
    return this.apiService.delete(`/sales-bill/${id}`);
  }

  async getCustomers(): Promise<ApiResponse<any>> {
    return this.apiService.get('/customer');
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
    return this.apiService.get('/delivery-notes', params);
  }

  async getDeliveryChallanById(id: string): Promise<ApiResponse<any>> {
    return this.apiService.get(`/delivery-note/${id}`);
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

const MOCK_DELIVERY_CHALLANS: DeliveryChallanData[] = [
  {
    id: 'DC-2024-001',
    customer_id: '1',
    customer_name: 'ABC Traders Pvt Ltd',
    customer_code: 'CUST001',
    sales_order_id: '101',
    sales_order_number: 'SO-2024-001',
    posting_date: '2024-01-15',
    total_qty: 25,
    grand_total: 45000,
    po_no: 'PO-1001',
    po_date: '2024-01-10',
    warehouse: 'Main Warehouse',
    items: [
      { item_code: 'PRD-P001', description: 'Industrial Pump - 5 HP', qty: 10, uom: 'pcs', rate: 1500, amount: 15000 },
      { item_code: 'PRD-S001', description: 'Submersible Pump - 2 HP', qty: 15, uom: 'pcs', rate: 2000, amount: 30000 }
    ],
    remarks: 'Delivered on time'
  },
  {
    id: 'DC-2024-002',
    customer_id: '2',
    customer_name: 'XYZ Enterprises',
    customer_code: 'CUST002',
    sales_order_id: '102',
    sales_order_number: 'SO-2024-002',
    posting_date: '2024-01-18',
    total_qty: 12,
    grand_total: 32000,
    po_no: 'PO-1002',
    po_date: '2024-01-12',
    warehouse: 'Secondary Warehouse',
    items: [
      { item_code: 'PRD-C001', description: 'Centrifugal Pump - 3 HP', qty: 12, uom: 'pcs', rate: 2500, amount: 30000 }
    ],
    remarks: 'Urgent delivery'
  },
  {
    id: 'DC-2024-003',
    customer_id: '3',
    customer_name: 'PQR Solutions Ltd',
    customer_code: 'CUST003',
    sales_order_id: '103',
    sales_order_number: 'SO-2024-003',
    posting_date: '2024-01-20',
    total_qty: 8,
    grand_total: 28000,
    po_no: 'PO-1003',
    po_date: '2024-01-15',
    warehouse: 'Main Warehouse',
    items: [
      { item_code: 'PRD-M001', description: 'Motor Assembly - 7.5 HP', qty: 8, uom: 'pcs', rate: 3500, amount: 28000 }
    ],
    remarks: 'Express shipping'
  }
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
            minHeight: '30px'
          }}
        />
        {loading ? (
          <FaSpinner className="nsb-spinning" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-color, #2563eb)', fontSize: '11px' }} />
        ) : (
          <FaChevronDown style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary, #94a3b8)', fontSize: '11px', pointerEvents: 'none' }} />
        )}
      </div>

      {menu && ReactDOM.createPortal(menu, document.body)}
    </div>
  );
};

// ===== SEARCHABLE DELIVERY CHALLAN DROPDOWN =====
interface DeliveryChallanDropdownProps {
  value: string;
  onChange: (value: string, dcData?: DeliveryChallanData) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}

const DeliveryChallanDropdown: React.FC<DeliveryChallanDropdownProps> = ({
  value,
  onChange,
  placeholder = 'Search Delivery Challan...',
  disabled = false,
  error = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deliveryChallans, setDeliveryChallans] = useState<DeliveryChallanData[]>([]);
  const [filteredDCs, setFilteredDCs] = useState<DeliveryChallanData[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [selectedDC, setSelectedDC] = useState<DeliveryChallanData | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const salesBillAPI = new SalesBillAPI();

  const menuPos = useDropdownPosition(isOpen, wrapperRef);

  useEffect(() => {
    fetchDeliveryChallans();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredDCs(deliveryChallans);
      return;
    }

    const filtered = deliveryChallans.filter(dc =>
      dc.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dc.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dc.customer_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dc.sales_order_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDCs(filtered);
  }, [searchTerm, deliveryChallans]);

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
      const response = await salesBillAPI.getDeliveryChallans({
        page: 1,
        limit: 100
      });

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
            customer_id: dc.customer || '',
            customer_name: dc.customer_name || '',
            customer_code: dc.customer_code || '',
            sales_order_id: dc.sales_order || '',
            sales_order_number: dc.sales_order_number || '',
            posting_date: dc.posting_date || dc.date || '',
            total_qty: dc.total_qty || 0,
            grand_total: dc.grand_total || 0,
            po_no: dc.po_no || '',
            po_date: dc.po_date || '',
            warehouse: dc.set_warehouse || dc.warehouse || '',
            items: dc.items || [],
            remarks: dc.instructions || dc.remarks || ''
          }));
          setDeliveryChallans(mappedDCs);
          setFilteredDCs(mappedDCs);
        } else {
          setDeliveryChallans(MOCK_DELIVERY_CHALLANS);
          setFilteredDCs(MOCK_DELIVERY_CHALLANS);
        }
      } else {
        setDeliveryChallans(MOCK_DELIVERY_CHALLANS);
        setFilteredDCs(MOCK_DELIVERY_CHALLANS);
      }
    } catch (error) {
      console.error('Error fetching delivery challans:', error);
      setDeliveryChallans(MOCK_DELIVERY_CHALLANS);
      setFilteredDCs(MOCK_DELIVERY_CHALLANS);
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

  const handleSelect = (dc: DeliveryChallanData) => {
    setSelectedDC(dc);
    setSearchTerm('');
    setIsOpen(false);
    onChange(dc.id, dc);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const getDisplayValue = () => {
    if (selectedDC) {
      return `${selectedDC.id} - ${selectedDC.customer_name}`;
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
          <FaSpinner className="nsb-spinning" style={{ display: 'inline-block', marginRight: '8px' }} /> Loading...
        </div>
      ) : filteredDCs.length > 0 ? (
        filteredDCs.map((dc, index) => (
          <div
            key={dc.id}
            onMouseDown={(e) => {
              e.preventDefault();
              handleSelect(dc);
            }}
            style={{
              padding: '10px 14px',
              cursor: 'pointer',
              background: highlightedIndex === index ? 'var(--nav-hover, #eff6ff)' : 'transparent',
              borderLeft: String(value) === String(dc.id) ? '3px solid var(--primary-color, #2563eb)' : '3px solid transparent',
              transition: 'background 0.15s',
              borderBottom: index < filteredDCs.length - 1 ? '0.5px solid var(--border-color, #f1f5f9)' : 'none'
            }}
            onMouseEnter={() => setHighlightedIndex(index)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary, #0f172a)' }}>{dc.id}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary, #475569)', marginLeft: '8px' }}>{dc.customer_name}</span>
              </div>
              <span style={{
                fontSize: '11px',
                padding: '2px 10px',
                borderRadius: '12px',
                background: '#dbeafe',
                color: '#1e40af',
                fontWeight: 500
              }}>
                {dc.sales_order_number || 'No SO'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '4px', fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
              <span>Qty: {dc.total_qty}</span>
              <span>Total: ₹{dc.grand_total}</span>
              <span>Date: {new Date(dc.posting_date).toLocaleDateString()}</span>
            </div>
          </div>
        ))
      ) : (
        <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary, #94a3b8)', fontSize: '12px' }}>
          {searchTerm ? 'No matching delivery challans found' : 'No delivery challans available'}
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

      {menu && ReactDOM.createPortal(menu, document.body)}
    </div>
  );
};

const CreateSalesBill: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();

  const [selectedDeliveryChallan, setSelectedDeliveryChallan] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<string>('');
  const [selectedOrderData, setSelectedOrderData] = useState<SalesOrder | null>(null);
  const [billType, setBillType] = useState<string>('Products');
  const [billDate, setBillDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [warehouse, setWarehouse] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentTerms, setPaymentTerms] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<string>('');
  const [invoiceStatus, setInvoiceStatus] = useState<string>('Draft');
  const [poNumber, setPoNumber] = useState<string>('');
  const [poDate, setPoDate] = useState<string>('');
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

  const salesBillAPI = new SalesBillAPI();

  useEffect(() => {
    fetchCustomers();
    fetchAllItems();
  }, []);

  // Calculate round off whenever items change
  useEffect(() => {
    const total = getGrandTotal();
    const rounded = Math.round(total / 10) * 10;
    const diff = rounded - total;
    setRoundOff(diff);
  }, [items]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await salesBillAPI.getCustomers();
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
            code: cust.customer_code || cust.code || `CUST${cust.id}`,
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
      const response = await salesBillAPI.getItems({ page: 1, limit: 100 });
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
      const response = await salesBillAPI.getItems({ page: 1, limit: 50, search: searchTerm });
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

  const loadDeliveryChallanData = (dcData: DeliveryChallanData) => {
    // Find customer
    const customer = customers.find(c => c.id === dcData.customer_id || c.code === dcData.customer_code);
    if (customer) {
      setCustomerData(customer);
      setSelectedCustomer(customer.id);
      setIsCustomerDisabled(true);
    }

    // Set warehouse
    if (dcData.warehouse) {
      setWarehouse(dcData.warehouse);
    }

    // Set PO details
    if (dcData.po_no) {
      setPoNumber(dcData.po_no);
    }
    if (dcData.po_date) {
      setPoDate(dcData.po_date);
    }

    // Set remarks
    if (dcData.remarks) {
      setRemarks(dcData.remarks);
    }

    // Set items
    if (dcData.items && dcData.items.length > 0) {
      const initialItems: SalesBillItem[] = dcData.items.map((item, index) => {
        const product = allProducts.find(p => p.itemCode === item.item_code);
        const taxRate = product?.tax || 0;
        const amount = (item.qty || 0) * (item.rate || 0);
        const taxAmount = (amount * taxRate) / 100;
        
        return {
          id: `dc-${index}`,
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
          type: billType === 'Products' ? 'product' : 'service'
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
        type: billType === 'Products' ? 'product' : 'service'
      }]);
    }

    setErrors({});
    toast.success(`Loaded Delivery Challan: ${dcData.id}`);
  };

  const handleDeliveryChallanChange = (dcId: string, dcData?: DeliveryChallanData) => {
    setSelectedDeliveryChallan(dcId);
    if (dcId && dcData) {
      loadDeliveryChallanData(dcData);
    } else {
      // Reset if cleared
      setSelectedCustomer('');
      setCustomerData(null);
      setIsCustomerDisabled(false);
      setSelectedSalesOrder('');
      setSelectedOrderData(null);
      setWarehouse('');
      setPoNumber('');
      setPoDate('');
      setRemarks('');
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
        type: billType === 'Products' ? 'product' : 'service'
      }]);
    }
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const customerId = e.target.value;
    setSelectedCustomer(customerId);
    if (customerId) {
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        setCustomerData(customer);
      }
    } else {
      setCustomerData(null);
      setSelectedSalesOrder('');
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
      type: billType === 'Products' ? 'product' : 'service'
    }]);
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

          if (field === 'quantity' || field === 'rate') {
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

  const buildPayload = (status: 'Draft' | 'Submitted'): SalesBillPayload => {
    return {
      name: billNumber,
      naming_series: "SB-.YYYY.-",
      customer: customerData?.code || '',
      customer_name: customerData?.name || '',
      posting_date: billDate,
      company: 'SculptERP Pvt Ltd',
      set_warehouse: warehouse || '',
      invoice_no: invoiceNumber || '',
      invoice_date: invoiceDate || billDate,
      due_date: dueDate || '',
      payment_terms: paymentTerms || '',
      payment_mode: paymentMode || '',
      invoice_status: invoiceStatus || 'Draft',
      po_no: poNumber || '',
      po_date: poDate || '',
      sales_order: selectedSalesOrder || '',
      delivery_challan: selectedDeliveryChallan || '',
      instructions: remarks || '',
      status: status,
      bill_type: billType,
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
          warehouse: warehouse || '',
          type: item.type
        }))
    };
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!selectedDeliveryChallan && !selectedCustomer) {
      newErrors.customer = 'Please select a Delivery Challan or Customer';
    }
    if (!billDate) newErrors.billDate = 'Bill Date is required';
    if (!dueDate) newErrors.dueDate = 'Due Date is required';
    if (!warehouse) newErrors.warehouse = 'Warehouse is required';
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
      if (!createResponse.success) throw new Error(createResponse.message || 'Failed to create');
      const createdSB = createResponse.data;
      toast.success('Created!', { id: toastId });
      if (createdSB.name) {
        const submitResponse = await salesBillAPI.submitSalesBill(createdSB.name);
        if (!submitResponse.success) throw new Error(submitResponse.message || 'Failed to submit');
        toast.success(`Bill ${createdSB.name} submitted!`);
        setTimeout(() => navigate('/sales-bills'), 1500);
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
      toast.success('Saved as draft!', { id: toastId });
      setTimeout(() => navigate('/sales-bills'), 1000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure? Unsaved data will be lost.')) {
      navigate('/sales-bills');
    }
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
        type: billType === 'Products' ? 'product' : 'service'
      }]);
    }
  }, []);

  const totalItems = items.filter(i => i.itemCode && i.quantity > 0).length;
  const totalQuantity = getTotalQty();
  const subTotal = getTotalAmount();
  const totalTax = getTotalTax();
  const grandTotal = getGrandTotal();
  const grandTotalWithRound = grandTotal + roundOff;

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
        @media (max-width: 768px) {
          .nsb-two-column { grid-template-columns: 1fr !important; }
          .nsb-summary-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Header with Back Button */}
      <div className="nsb-header">
        <button onClick={handleCancel} className="nsb-back-btn">
          <FaArrowLeft size={13} /> Back
        </button>
        <div className="nsb-header-divider" />
        <h1 className="nsb-header-title">Create Sales Bill</h1>
      </div>

      {/* SINGLE UNIFIED BOX */}
      <div className="nsb-main-box">
        {/* Delivery Challan and Bill Type in same row */}
        <div className="nsb-row">
          <div className="nsb-field" style={{ flex: 1 }}>
            <label className="nsb-label">
              <FaFileAlt style={{ marginRight: '4px', color: 'var(--primary-color, #2563eb)' }} />
              Delivery Challan
            </label>
            <DeliveryChallanDropdown
              value={selectedDeliveryChallan}
              onChange={handleDeliveryChallanChange}
              placeholder="Search and select Delivery Challan..."
              error={!!errors.deliveryChallan}
            />
            {errors.deliveryChallan && <span className="nsb-error-text">{errors.deliveryChallan}</span>}
            {selectedDeliveryChallan && (
              <span className="nsb-field-hint">✓ Auto-populated Customer, Items, and details</span>
            )}
          </div>
          <div className="nsb-field" style={{ flex: '0 0 auto', minWidth: '300px' }}>
            <label className="nsb-label">Bill Type</label>
            <div className="nsb-type-buttons">
              <button
                onClick={() => setBillType('Products')}
                className={`nsb-type-btn ${billType === 'Products' ? 'nsb-type-btn-active' : 'nsb-type-btn-inactive'}`}
              >
                Products
              </button>
              <button
                onClick={() => setBillType('Services')}
                className={`nsb-type-btn ${billType === 'Services' ? 'nsb-type-btn-active' : 'nsb-type-btn-inactive'}`}
              >
                Services
              </button>
            </div>
          </div>
        </div>

        <hr className="nsb-divider" />

        {/* Two Column Layout */}
        <div className="nsb-two-column">
          {/* LEFT COLUMN */}
          <div>
            <div className="nsb-field">
              <label className="nsb-label">Customer *</label>
              <select
                value={selectedCustomer}
                onChange={handleCustomerChange}
                disabled={isLoading || isCustomerDisabled}
                className={`nsb-select ${errors.customer ? 'nsb-select-error' : ''}`}
              >
                <option value="">Select Customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.customer && <span className="nsb-error-text">{errors.customer}</span>}
              {isCustomerDisabled && (
                <span className="nsb-field-hint">Auto-selected from Delivery Challan</span>
              )}
            </div>

            <div className="nsb-field">
              <label className="nsb-label">Sales Order</label>
              <input
                type="text"
                value={selectedSalesOrder || (selectedDeliveryChallan ? 'Auto-loaded from DC' : '')}
                disabled
                className="nsb-input nsb-input-disabled"
                placeholder="Sales Order will be auto-loaded"
              />
            </div>

            <div className="nsb-row">
              <div className="nsb-field">
                <label className="nsb-label">Bill Number</label>
                <input type="text" value={billNumber} disabled className="nsb-input nsb-input-disabled" />
              </div>
              <div className="nsb-field">
                <label className="nsb-label">Bill Date *</label>
                <input
                  type="date"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className={`nsb-input ${errors.billDate ? 'nsb-input-error' : ''}`}
                />
              </div>
            </div>

            <div className="nsb-row">
              <div className="nsb-field">
                <label className="nsb-label">Due Date *</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={`nsb-input ${errors.dueDate ? 'nsb-input-error' : ''}`}
                />
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

            {/* Customer Details */}
            {customerData && (
              <div className="nsb-customer-details">
                <div className="nsb-customer-detail">
                  <span className="nsb-customer-detail-label">Code:</span>
                  <span className="nsb-customer-detail-value">{customerData.code}</span>
                </div>
                <div className="nsb-customer-detail">
                  <span className="nsb-customer-detail-label">Contact:</span>
                  <span className="nsb-customer-detail-value">{customerData.contactPerson || 'N/A'}</span>
                </div>
                <div className="nsb-customer-detail">
                  <span className="nsb-customer-detail-label">Phone:</span>
                  <span className="nsb-customer-detail-value">{customerData.phone}</span>
                </div>
                <div className="nsb-customer-detail">
                  <span className="nsb-customer-detail-label">GST:</span>
                  <span className="nsb-customer-detail-value">{customerData.gstin}</span>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div>
            <div className="nsb-field">
              <label className="nsb-label">Warehouse *</label>
              <select
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                className={`nsb-select ${errors.warehouse ? 'nsb-select-error' : ''}`}
              >
                <option value="">Select Warehouse</option>
                <option value="Main Warehouse">Main Warehouse</option>
                <option value="Secondary Warehouse">Secondary Warehouse</option>
              </select>
            </div>

            <div className="nsb-field">
              <label className="nsb-label">Invoice Number</label>
              <input
                type="text"
                placeholder="INV-2024-001"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="nsb-input"
              />
            </div>

            <div className="nsb-row">
              <div className="nsb-field">
                <label className="nsb-label">Invoice Date</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="nsb-input"
                />
              </div>
              <div className="nsb-field">
                <label className="nsb-label">Payment Terms</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="nsb-select"
                >
                  <option value="">Select Terms</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 45">Net 45</option>
                  <option value="Net 60">Net 60</option>
                  <option value="Due on Receipt">Due on Receipt</option>
                </select>
              </div>
            </div>

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
              </select>
            </div>
          </div>
        </div>

        <hr className="nsb-divider" />

        {/* PO Details */}
        <div className="nsb-row">
          <div className="nsb-field">
            <label className="nsb-label">PO Number</label>
            <input
              type="text"
              placeholder="PO-1001"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              className="nsb-input"
            />
          </div>
          <div className="nsb-field">
            <label className="nsb-label">PO Date</label>
            <input
              type="date"
              value={poDate}
              onChange={(e) => setPoDate(e.target.value)}
              className="nsb-input"
            />
          </div>
        </div>

        <hr className="nsb-divider" />

        {/* Items */}
        <div>
          <div className="nsb-items-header">
            <span className="nsb-items-title">
              <FaBox className="nsb-items-icon" /> {billType === 'Products' ? 'Products' : 'Services'}
            </span>
            <button onClick={addItem} className="nsb-add-btn">
              <FaPlus size={9} /> Add
            </button>
          </div>

          {errors.items && <div className="nsb-items-error">{errors.items}</div>}

          <div className="nsb-table-wrap">
            <table className="nsb-items-table">
              <thead>
                <tr>
                  <th className="nsb-col-code">Item Code</th>
                  <th className="nsb-col-name">Item Name</th>
                  <th className="nsb-col-qty">Qty</th>
                  <th className="nsb-col-rate">Rate</th>
                  <th className="nsb-col-amount">Amount</th>
                  <th className="nsb-col-gst">GST%</th>
                  <th className="nsb-col-tax">Tax</th>
                  <th className="nsb-col-total">Total</th>
                  <th className="nsb-col-action"></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="nsb-col-code">
                      <SearchableSelect
                        value={item.itemCode}
                        onChange={(value) => updateItem(item.id, 'itemCode', value)}
                        options={products}
                        placeholder="Search..."
                        onSearch={handleItemSearch}
                        loading={isLoadingItems}
                      />
                    </td>
                    <td className="nsb-col-name">
                      <input
                        type="text"
                        value={item.itemName}
                        disabled
                        className="nsb-table-input nsb-table-input-text"
                      />
                    </td>
                    <td className="nsb-col-qty">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="nsb-table-input"
                        style={{ maxWidth: '50px' }}
                      />
                    </td>
                    <td className="nsb-col-rate">
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        className="nsb-table-input"
                        style={{ maxWidth: '60px' }}
                      />
                    </td>
                    <td className="nsb-col-amount">
                      <span className="nsb-table-value">₹{item.amount.toFixed(2)}</span>
                    </td>
                    <td className="nsb-col-gst">
                      <input
                        type="number"
                        value={item.tax || 0}
                        onChange={(e) => {
                          const taxRate = parseFloat(e.target.value) || 0;
                          const amount = (item.quantity || 0) * (item.rate || 0);
                          const taxAmount = (amount * taxRate) / 100;
                          setItems(prevItems =>
                            prevItems.map(i => {
                              if (i.id === item.id) {
                                return {
                                  ...i,
                                  tax: taxRate,
                                  taxAmount: taxAmount,
                                  totalAmount: amount + taxAmount
                                };
                              }
                              return i;
                            })
                          );
                        }}
                        className="nsb-table-input"
                        style={{ maxWidth: '40px' }}
                      />
                    </td>
                    <td className="nsb-col-tax">
                      <span className="nsb-table-value">₹{item.taxAmount.toFixed(2)}</span>
                    </td>
                    <td className="nsb-col-total">
                      <span className="nsb-table-value nsb-table-value-bold">₹{item.totalAmount.toFixed(2)}</span>
                    </td>
                    <td className="nsb-col-action">
                      <button onClick={() => removeItem(item.id)} className="nsb-remove-btn">
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <hr className="nsb-divider" />

        {/* Remarks */}
        <div>
          <label className="nsb-label">Remarks</label>
          <textarea
            placeholder="Add any additional notes..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="nsb-textarea"
          />
        </div>

        <hr className="nsb-divider" />

        {/* Summary & Status */}
        <div className="nsb-summary-grid">
          {/* LEFT - Summary Values */}
          <div className="nsb-summary-left">
            <div className="nsb-summary-card">
              <div className="nsb-summary-item">
                <span className="nsb-summary-icon"><FaListUl /></span>
                <span className="nsb-summary-label-text">Total Items</span>
                <span className="nsb-summary-value-text">{totalItems}</span>
              </div>
              <div className="nsb-summary-item">
                <span className="nsb-summary-icon"><FaBox /></span>
                <span className="nsb-summary-label-text">Total Quantity</span>
                <span className="nsb-summary-value-text">{totalQuantity}</span>
              </div>
              <div className="nsb-summary-item">
                <span className="nsb-summary-icon"><FaMoneyBillWave /></span>
                <span className="nsb-summary-label-text">Sub Total</span>
                <span className="nsb-summary-value-text">₹{subTotal.toFixed(2)}</span>
              </div>
              <div className="nsb-summary-item">
                <span className="nsb-summary-icon"><FaTags /></span>
                <span className="nsb-summary-label-text">Total Tax</span>
                <span className="nsb-summary-value-text">₹{totalTax.toFixed(2)}</span>
              </div>
              <div className="nsb-summary-item">
                <span className="nsb-summary-icon"><FaCalculator /></span>
                <span className="nsb-summary-label-text">Round Off</span>
                <span className="nsb-summary-value-text">
                  <input
                    type="number"
                    value={roundOff.toFixed(2)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setRoundOff(val);
                    }}
                    className="nsb-roundoff-input"
                  />
                </span>
              </div>
              <div className="nsb-summary-total">
                <span className="nsb-summary-total-label">Grand Total</span>
                <span className="nsb-summary-total-value">₹{grandTotalWithRound.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* RIGHT - Status Information */}
          <div className="nsb-summary-right">
            <div className="nsb-status-card">
              <div className="nsb-status-header">
                <span className="nsb-status-icon"><FaInfoCircle /></span>
                <span className="nsb-status-title">Document Status</span>
              </div>
              <div className="nsb-status-item">
                <span className="nsb-status-label">Bill Status</span>
                <span className="nsb-status-value nsb-status-draft">{invoiceStatus}</span>
              </div>
              <div className="nsb-status-item">
                <span className="nsb-status-label">Bill Type</span>
                <span className="nsb-status-value">{billType}</span>
              </div>
              <div className="nsb-status-item">
                <span className="nsb-status-label">Delivery Challan</span>
                <span className="nsb-status-value">{selectedDeliveryChallan || 'Not selected'}</span>
              </div>
              <div className="nsb-status-item">
                <span className="nsb-status-label">Customer</span>
                <span className="nsb-status-value">{customerData?.name || 'Not selected'}</span>
              </div>
              <div className="nsb-status-item">
                <span className="nsb-status-label">Bill Number</span>
                <span className="nsb-status-value">{billNumber}</span>
              </div>
              <div className="nsb-status-item">
                <span className="nsb-status-label">Due Date</span>
                <span className="nsb-status-value">{new Date(dueDate).toLocaleDateString()}</span>
              </div>
              <div className="nsb-status-item">
                <span className="nsb-status-label">Payment Mode</span>
                <span className="nsb-status-value">{paymentMode || 'Not set'}</span>
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