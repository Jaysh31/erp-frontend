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
  FaCheckCircle,
  FaCreditCard,
  FaCopy,
  FaClipboardList,
  FaExclamationCircle,
  FaQuestionCircle,
  FaFileAlt,
  FaFileInvoice
} from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import './CreateProformaInvoice.css';

// ===== INTERFACES (Same as Sales Bill) =====

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

interface ProformaItem {
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
  itemGroup?: string;
  incomeAccount?: string;
  costCenter?: string;
  weightPerUnit?: number;
  weightUom?: string;
  serialNo?: string;
  batchNo?: string;
  discountPercentage?: number;
  discountAmount?: number;
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

interface ProformaPayload {
  customer: string;
  company: string;
  modified_by: string;
  customer_name: string;
  transaction_date: string;
  delivery_date: string;
  currency: string;
  conversion_rate: number;
  selling_price_list: string;
  status: string;
  customer_address: string;
  contact_person: string;
  territory: string;
  notes: string;
  order_type: string;
  total_qty: number;
  total: number;
  net_total: number;
  grand_total: number;
  rounded_total: number;
  items: Array<{
    item_code: string;
    item_name: string;
    description: string;
    item_group: string;
    qty: number;
    rate: number;
    uom: string;
    stock_uom: string;
    warehouse: string;
    income_account: string;
    cost_center: string;
    discount_percentage: number;
    weight_per_unit: number;
    weight_uom: string;
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

// ===== API SERVICE =====

class ProformaAPI {
  private apiService: any;

  constructor() {
    this.apiService = api;
  }

  async get(endpoint: string, params?: Record<string, any>): Promise<any> {
    try {
      const response = await this.apiService.get(endpoint, { params });
      return response;
    } catch (error: any) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async post(endpoint: string, data: any): Promise<any> {
    try {
      const response = await this.apiService.post(endpoint, data);
      return response;
    } catch (error: any) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async getCustomers(params?: { page?: number; limit?: number; search?: string }): Promise<any> {
    return this.get('/customer', params);
  }

  async getItems(params?: { page?: number; limit?: number; search?: string }): Promise<any> {
    return this.get('/item?type=product', params);
  }

  async getWarehouses(params?: { page?: number; limit?: number; search?: string }): Promise<any> {
    return this.get('/warehouse', params);
  }

  async getTaxOptions(): Promise<any> {
    return this.get('/item/get-tax');
  }

  async createProforma(payload: ProformaPayload): Promise<any> {
    return this.post('/sales-order', payload);
  }
}

// ===== SUCCESS MODAL COMPONENT =====
interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewDetails: () => void;
  proformaNumber: string;
  totalItems: number;
  message: string;
  customerName?: string;
  totalAmount?: number;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  onViewDetails,
  proformaNumber,
  totalItems,
  message,
  customerName,
  totalAmount
}) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="npi-modal-overlay" onClick={onClose}>
      <div className="npi-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="npi-modal-success-icon">
          <FaCheckCircle size={48} />
        </div>
        
        <h2 className="npi-modal-title">✓ Proforma Created!</h2>
        
        <p className="npi-modal-message">{message}</p>
        
        <div className="npi-modal-details">
          <div className="npi-modal-detail-item">
            <span className="npi-modal-detail-label">Proforma Number</span>
            <span className="npi-modal-detail-value npi-modal-pi-number">{proformaNumber}</span>
          </div>
          
          {customerName && (
            <div className="npi-modal-detail-item">
              <span className="npi-modal-detail-label">Customer</span>
              <span className="npi-modal-detail-value">{customerName}</span>
            </div>
          )}
          
          <div className="npi-modal-detail-item">
            <span className="npi-modal-detail-label">Total Items</span>
            <span className="npi-modal-detail-value">{totalItems}</span>
          </div>
          
          {totalAmount !== undefined && (
            <div className="npi-modal-detail-item">
              <span className="npi-modal-detail-label">Total Amount</span>
              <span className="npi-modal-detail-value" style={{ color: 'var(--primary-color, #2563eb)', fontWeight: 700 }}>
                ₹{totalAmount.toFixed(2)}
              </span>
            </div>
          )}
        </div>
        
        <div className="npi-modal-actions">
          <button onClick={onViewDetails} className="npi-modal-btn npi-modal-btn-primary">
            View Proforma
          </button>
          <button onClick={onClose} className="npi-modal-btn npi-modal-btn-secondary">
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
      return <span className="npi-stock-indicator npi-stock-checking"><FaSpinner className="npi-spinning" size={8} /></span>;
    }
    if (stockInfo.status === 'available') {
      return <span className="npi-stock-indicator npi-stock-available"><FaCheckCircle size={8} /> {stockInfo.availableQty}</span>;
    }
    if (stockInfo.status === 'insufficient') {
      return <span className="npi-stock-indicator npi-stock-insufficient"><FaExclamationCircle size={8} /> {stockInfo.availableQty || 0}</span>;
    }
    return <span className="npi-stock-indicator npi-stock-unknown"><FaQuestionCircle size={8} /></span>;
  };

  const menu = isOpen ? (
    <div
      ref={menuRef}
      className="npi-custom-scroll"
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
          className="npi-table-input"
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
          <FaSpinner className="npi-spinning" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-color, #2563eb)', fontSize: '11px' }} />
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
  const proformaAPI = new ProformaAPI();
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
      const response = await proformaAPI.getCustomers({
        page: 1,
        limit: 50,
        search: search || undefined
      });

      if (response.data.success && response.data.data) {
        let customerList: any[] = [];

        if (response.data.data.data && Array.isArray(response.data.data.data.records)) {
          customerList = response.data.data.data.records;
        } else if (Array.isArray(response.data.data)) {
          customerList = response.data.data;
        } else if (response.data.data.data && Array.isArray(response.data.data.data)) {
          customerList = response.data.data.data;
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
      className="npi-custom-scroll"
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
          <FaSpinner className="npi-spinning" style={{ display: 'inline-block', marginRight: '8px' }} /> Loading...
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
          <FaSpinner className="npi-spinning" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-color, #2563eb)', fontSize: '12px' }} />
        ) : (
          <FaChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary, #64748b)', fontSize: '12px', pointerEvents: 'none' }} />
        )}
      </div>

      {menu && ReactDOM.createPortal(menu, document.body)}
    </div>
  );
};



// ===== MAIN COMPONENT =====

const CreateProformaInvoice: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { theme } = useAdminTheme();
  const [loadingExistingRecord, setLoadingExistingRecord] = useState<boolean>(false);
  const [recordLoaded, setRecordLoaded] = useState<boolean>(false);

  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [isService, setIsService] = useState<boolean>(false);
  const [proformaDate, setProformaDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState<string>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [warehouse, setWarehouse] = useState<string>('');
  const [proformaNumber] = useState<string>(`PI-${new Date().getFullYear()}-001`);
  const [proformaStatus, setProformaStatus] = useState<string>('Draft');
  const [remarks, setRemarks] = useState<string>('');
  const [items, setItems] = useState<ProformaItem[]>([]);
  const [customerData, setCustomerData] = useState<Customer | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading] = useState<boolean>(false);
  const [] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState<boolean>(false);
  const [roundOff, setRoundOff] = useState<number>(0);
  const [taxOptions, setTaxOptions] = useState<TaxOption[]>([]);
  const [loadingTaxOptions, setLoadingTaxOptions] = useState<boolean>(false);
  const [, setTaxOptionsLoaded] = useState<boolean>(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // Success Modal state
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [successData, setSuccessData] = useState<{
    proformaNumber: string;
    totalItems: number;
    message: string;
    customerName?: string;
    totalAmount?: number;
  }>({
    proformaNumber: '',
    totalItems: 0,
    message: ''
  });

  // Payment Schedule state
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleRow[]>([
    { id: '1', paymentTerm: 'On Delivery', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], durationDays: 7, invoicePortion: 100, paymentAmount: 0, paidAmount: 0, status: 'Pending' }
  ]);
  const [selectedPaymentTemplate, setSelectedPaymentTemplate] = useState<string>('');

  const proformaAPI = new ProformaAPI();

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
  ];

  // ─── Apply Payment Template ──────────────────────────
  const applyPaymentTemplate = (templateId: string) => {
    const template = paymentTermTemplates.find(t => t.id === templateId);
    if (!template) return;

    const grandTotal = getGrandTotalWithRound();
    const date = proformaDate || new Date().toISOString().split('T')[0];

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
    const duration = daysBetween(proformaDate, dueDate);
    updatePaymentRow(index, { dueDate, durationDays: duration });
  };

  const handlePaymentDurationChange = (index: number, durationDays: number) => {
    const dueDate = addDays(proformaDate, durationDays);
    updatePaymentRow(index, { durationDays, dueDate });
  };

  // ─── Fetch Tax Options ─────────────────────────────
  const fetchTaxOptions = async () => {
    setLoadingTaxOptions(true);
    try {
      const response = await proformaAPI.getTaxOptions();
      if (response.data.success && response.data.data) {
        let taxData: TaxOption[] = [];
        if (Array.isArray(response.data.data)) {
          taxData = response.data.data;
        } else {
          const nestedData = (response.data.data as any)?.data;
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

  // ─── Effects ───────────────────────────────────────
  useEffect(() => {
    fetchTaxOptions();
    fetchAllItems();
    fetchWarehouses();
  }, []);

  // ─── Load the Sales Order used as the Proforma Invoice source ───────────
  // The Proforma list is backed by /sales-order, so View must load the same
  // record instead of opening a fresh Create Proforma form.
  useEffect(() => {
    if (!id || recordLoaded) return;
    fetchExistingSalesOrder(id);
  }, [id, recordLoaded]);

  const normalizeDate = (value: any): string => {
    if (!value) return '';
    const raw = String(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
  };

  const fetchExistingSalesOrder = async (orderId: string) => {
    setLoadingExistingRecord(true);
    try {
      const response = await api.get(`/sales-order/${orderId}`);
      if (response.data?.success !== 1) {
        throw new Error(response.data?.message || 'Failed to load proforma invoice');
      }

      const raw = response.data?.data;
      const record = Array.isArray(raw) ? raw[0] : (raw?.record ?? raw);
      if (!record) throw new Error('Proforma invoice record not found');

      loadExistingSalesOrderIntoForm(record);
      setRecordLoaded(true);
    } catch (error: any) {
      console.error('Error loading proforma invoice:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to load proforma invoice');
    } finally {
      setLoadingExistingRecord(false);
    }
  };

  const loadExistingSalesOrderIntoForm = (record: any) => {
    const transactionDate = normalizeDate(record.transaction_date);
    const deliveryDate = normalizeDate(record.delivery_date || record.valid_till);

    // Keep the exact customer values from the source order so the dropdown
    // and the payload both retain the saved customer.
    const customerName = record.customer_name || record.party_name || '';
    const customerCode = record.party_name || record.customer_code || customerName;
    const fallbackCustomer: Customer = {
      id: String(record.customer_id ?? customerName),
      name: customerName,
      code: customerCode,
      email: record.contact_email || record.email || '',
      phone: record.contact_mobile || record.mobile_no || '',
      address: record.customer_address || record.address_display || '',
      shippingAddress: record.shipping_address || '',
      gstin: record.customer_gstin || record.gstin || '',
      contactPerson: record.contact_person || '',
      contactMobile: record.contact_mobile || ''
    };

    setCustomerData(fallbackCustomer);
    // CustomerDropdown resolves selected value by id/name. Prefer name when
    // available because customer_name is what the dropdown displays.
    setSelectedCustomer(customerName || String(record.customer_id || record.party_name || ''));

    setProformaDate(transactionDate || new Date().toISOString().split('T')[0]);
    setValidUntil(deliveryDate || transactionDate || new Date().toISOString().split('T')[0]);
    setRemarks(record.notes || record.remarks || '');
    setProformaStatus(record.status || 'Draft');
    setIsService(record.order_type === 'Service' || record.is_service === 1 || record.is_service === true);

    // Restore warehouse from the saved child row. The form stores the
    // warehouse id, while the API stores the warehouse name on each item.
    const sourceItems = Array.isArray(record.items) ? record.items : [];
    const firstWarehouseName = sourceItems.find((it: any) => it?.warehouse)?.warehouse || record.set_warehouse || '';
    if (firstWarehouseName) {
      const matchingWarehouse = warehouses.find((w) =>
        w.warehouse_name === firstWarehouseName ||
        w.warehouse_name.toLowerCase() === String(firstWarehouseName).toLowerCase()
      );
      if (matchingWarehouse) setWarehouse(String(matchingWarehouse.id));
    }

    const loadedItems: ProformaItem[] = sourceItems.map((it: any, index: number) => {
      const quantity = Number(it.qty ?? it.quantity ?? 0);
      const rate = Number(it.rate ?? 0);
      const amount = Number(it.amount ?? quantity * rate);
      const tax = Number(it.tax_rate ?? it.gst_rate ?? it.tax ?? 0);
      const taxAmount = Number(it.tax_amount ?? ((amount * tax) / 100));
      const itemCode = it.item_code || it.item_name || '';
      return {
        id: String(it.id ?? index + 1),
        itemCode,
        itemName: it.item_name || itemCode,
        hsn: it.hsn || it.hsn_code || it.gst_hsn_code || '',
        description: it.description || it.item_name || itemCode,
        quantity,
        unit: it.uom || it.stock_uom || 'pcs',
        rate,
        amount,
        tax,
        tax_id: it.item_tax_id ? Number(it.item_tax_id) : (it.tax_id ? Number(it.tax_id) : getTaxIdFromRate(tax, taxOptions)),
        taxAmount,
        totalAmount: Number(it.net_amount ?? (amount + taxAmount)),
        type: isService ? 'service' : 'product',
        itemGroup: it.item_group || 'Products',
        incomeAccount: it.income_account || 'Sales - A',
        costCenter: it.cost_center || 'Main - A',
        weightPerUnit: Number(it.weight_per_unit ?? 0),
        weightUom: it.weight_uom || 'kg',
        discountPercentage: Number(it.discount_percentage ?? 0),
        discountAmount: Number(it.discount_amount ?? 0),
        inventoryId: it.item_id ? Number(it.item_id) : undefined
      };
    });

    setItems(loadedItems.length > 0 ? loadedItems : [{
      id: '1', itemCode: '', itemName: '', hsn: '', description: '', quantity: 1,
      unit: 'pcs', rate: 0, amount: 0, tax: 0, tax_id: undefined, taxAmount: 0,
      totalAmount: 0, type: isService ? 'service' : 'product', itemGroup: 'Products',
      incomeAccount: 'Sales - A', costCenter: 'Main - A', weightPerUnit: 0, weightUom: 'kg'
    }]);

    const rawSchedule = Array.isArray(record.payment_schedule) ? record.payment_schedule : [];
    if (rawSchedule.length > 0) {
      setPaymentSchedule(rawSchedule.map((p: any, index: number) => ({
        id: String(p.id ?? index + 1),
        paymentTerm: p.payment_term || p.paymentTerm || 'On Delivery',
        dueDate: normalizeDate(p.due_date || p.dueDate) || transactionDate,
        durationDays: Number(p.due_days ?? p.durationDays ?? 0),
        invoicePortion: Number(p.invoice_portion ?? p.invoicePortion ?? 100),
        paymentAmount: Number(p.payment_amount ?? p.paymentAmount ?? 0),
        paidAmount: Number(p.paid_amount ?? p.paidAmount ?? 0),
        status: p.status || 'Pending'
      })));
    } else {
      const grandTotal = Number(record.rounded_total ?? record.grand_total ?? record.total ?? 0);
      setPaymentSchedule([{
        id: '1', paymentTerm: 'On Delivery', dueDate: deliveryDate || transactionDate,
        durationDays: transactionDate && deliveryDate ? daysBetween(transactionDate, deliveryDate) : 0,
        invoicePortion: 100, paymentAmount: grandTotal, paidAmount: 0, status: 'Pending'
      }]);
    }

    const savedGrandTotal = Number(record.rounded_total ?? record.grand_total ?? 0);
    const calculatedGrandTotal = loadedItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    setRoundOff(Number((savedGrandTotal - calculatedGrandTotal).toFixed(2)));
  };

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

  const fetchAllItems = async () => {
    setIsLoadingItems(true);
    try {
      const response = await proformaAPI.getItems({ page: 1, limit: 100 });
      if (response.data.success && response.data.data) {
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
      const response = await proformaAPI.getWarehouses({ page: 1, limit: 100 });
      if (response.data.success && response.data.data) {
        let whList: any[] = [];
        if (response.data.data.data?.records) {
          whList = response.data.data.data.records;
        } else if (Array.isArray(response.data.data.data)) {
          whList = response.data.data.data;
        } else if (Array.isArray(response.data.data)) {
          whList = response.data.data;
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
      const response = await proformaAPI.getItems({ page: 1, limit: 50, search: searchTerm });
      if (response.data.success && response.data.data) {
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

  const handleCustomerChange = (customerId: string, customerData?: Customer) => {
    setSelectedCustomer(customerId);
    if (customerId && customerData) {
      setCustomerData(customerData);
    } else {
      setCustomerData(null);
    }
  };

  const addItem = () => {
    const newItem: ProformaItem = {
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

  const updateItem = (id: string, field: keyof ProformaItem, value: any) => {
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
              updated.itemGroup = product.item_group || 'Products';
              updated.incomeAccount = product.income_account || 'Sales - A';
              updated.costCenter = product.cost_center || 'Main - A';
              updated.weightPerUnit = 0;
              updated.weightUom = 'kg';
            }
          }

          if (field === 'quantity') {
            const amount = (updated.quantity || 0) * (updated.rate || 0);
            const taxRate = updated.tax || 0;
            const taxAmount = (amount * taxRate) / 100;
            updated.amount = amount;
            updated.taxAmount = taxAmount;
            updated.totalAmount = amount + taxAmount;
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

  const buildPayload = (status: 'Draft' | 'Submitted'): ProformaPayload => {
    const selectedWarehouse = warehouses.find(w => w.id.toString() === warehouse);
    const warehouseName = selectedWarehouse?.warehouse_name || 'Finished Goods - A';

    return {
      customer: customerData?.code || '',
      company: 'ChandraTara Industries',
      modified_by: 'Administrator',
      customer_name: customerData?.name || '',
      transaction_date: proformaDate,
      delivery_date: validUntil || '',
      currency: 'INR',
      conversion_rate: 1,
      selling_price_list: 'Standard Selling',
      status: status === 'Submitted' ? 'Confirmed' : 'Draft',
      customer_address: customerData?.address || '',
      contact_person: customerData?.contactPerson || '',
      territory: 'Maharashtra',
      notes: remarks || '',
      order_type: 'Proforma',
      total_qty: getTotalQty(),
      total: getTotalAmount(),
      net_total: getTotalAmount(),
      grand_total: getGrandTotalWithRound(),
      rounded_total: getGrandTotalWithRound(),
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
          stock_uom: item.unit,
          warehouse: warehouseName,
          income_account: item.incomeAccount || 'Sales - A',
          cost_center: item.costCenter || 'Main - A',
          discount_percentage: item.discountPercentage || 0,
          weight_per_unit: item.weightPerUnit || 0,
          weight_uom: item.weightUom || 'kg',
        })),
      payment_schedule: paymentSchedule.map(p => ({
        payment_term: p.paymentTerm || 'On Delivery',
        due_date: p.dueDate || proformaDate,
        due_days: p.durationDays || daysBetween(proformaDate, p.dueDate || proformaDate),
        invoice_portion: p.invoicePortion || 100,
        payment_amount: p.paymentAmount || 0,
        paid_amount: p.paidAmount || 0,
        status: p.status || 'Pending',
      }))
    };
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!selectedCustomer) {
      newErrors.customer = 'Please select a Customer';
    }
    if (!proformaDate) newErrors.proformaDate = 'Proforma Date is required';
    if (!validUntil) newErrors.validUntil = 'Valid Until Date is required';
    if (!warehouse) newErrors.warehouse = 'Please select a Warehouse';
    const hasItems = items.some(item => item.itemCode && item.quantity > 0);
    if (!hasItems) newErrors.items = 'At least one item is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    const toastId = toast.loading('Creating proforma invoice...');
    try {
      const payload = buildPayload('Submitted');
      const response = await proformaAPI.createProforma(payload);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create proforma');
      }
      
      const responseData = response.data.data;
      const proformaName = responseData?.name || responseData?.id || proformaNumber;
      const totalItemsCount = items.filter(i => i.itemCode && i.quantity > 0).length;
      const message = responseData?.message || response.data.message || 'Proforma Invoice created successfully.';
      const totalAmount = getGrandTotalWithRound();

      toast.success('Proforma Created!', { id: toastId });

      setSuccessData({
        proformaNumber: proformaName,
        totalItems: totalItemsCount,
        message: message,
        customerName: customerData?.name,
        totalAmount: totalAmount
      });
      setShowSuccessModal(true);

    } catch (error: any) {
      toast.error(error.message || 'Failed to create proforma', { id: toastId });
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
      const response = await proformaAPI.createProforma(payload);
      if (!response.data.success) throw new Error(response.data.message || 'Failed to save');
      
      const responseData = response.data.data;
      const proformaName = responseData?.name || responseData?.id || proformaNumber;
      
      toast.success(`Draft saved: ${proformaName}`, { id: toastId });
      setTimeout(() => navigate('/proforma-invoice'), 1000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewProforma = () => {
    setShowSuccessModal(false);
    navigate('/proforma-invoice');
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    navigate('/proforma-invoice');
  };

  const handleCancel = () => {
    navigate('/proforma-invoice');
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

  if (loadingExistingRecord) {
    return (
      <div className={`npi-page ${theme}`} style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
          <FaSpinner className="npi-spinning" />
          Loading proforma invoice details...
        </div>
      </div>
    );
  }

  return (
    <div className={`npi-page ${theme}`}>
      <style>{`
        .npi-spinning { animation: npiSpin 1s linear infinite; }
        @keyframes npiSpin { to { transform: rotate(360deg); } }

        .npi-custom-scroll::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .npi-custom-scroll::-webkit-scrollbar-track {
          background: var(--border-color, #f1f5f9);
          border-radius: 2px;
        }
        .npi-custom-scroll::-webkit-scrollbar-thumb {
          background: var(--text-secondary, #cbd5e1);
          border-radius: 2px;
        }
        .npi-custom-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--text-secondary, #94a3b8);
        }
        .npi-custom-scroll {
          scrollbar-width: thin;
          scrollbar-color: var(--text-secondary, #cbd5e1) var(--border-color, #f1f5f9);
        }

        @media print {
          .npi-form-footer, button { display: none !important; }
          body { padding: 0; }
        }
      `}</style>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseModal}
        onViewDetails={handleViewProforma}
        proformaNumber={successData.proformaNumber}
        totalItems={successData.totalItems}
        message={successData.message}
        customerName={successData.customerName}
        totalAmount={successData.totalAmount}
      />

      {/* Header */}
      <div className="npi-header">
        <div className="npi-header-left">
          <button onClick={handleCancel} className="npi-back-btn">
            <FaArrowLeft size={13} /> Back
          </button>
          <div className="npi-header-divider" />
          <h1 className="npi-header-title">
            <FaFileInvoice className="npi-header-icon" /> Create Proforma Invoice
          </h1>
        </div>
        <div className="npi-header-right">
          <label className="npi-checkbox-label">
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
              className="npi-checkbox"
            />
            <span>IsService</span>
          </label>
        </div>
      </div>

      {/* MAIN BOX */}
      <div className="npi-main-box">
        {/* TWO COLUMN LAYOUT */}
        <div className="npi-compact-layout">
          {/* LEFT COLUMN */}
          <div className="npi-left-column">
            {/* Customer */}
            <div className="npi-section-header">
              <FaBuilding className="npi-section-icon" />
              <span>Customer Details</span>
            </div>

            <div className="npi-field-row">
              <div className="npi-field-full">
                <label className="npi-label">
                  Customer <span className="npi-required">*</span>
                </label>
                <CustomerDropdown
                  value={selectedCustomer}
                  onChange={handleCustomerChange}
                  placeholder="Search Customer..."
                  disabled={isLoading}
                  error={!!errors.customer}
                />
                {errors.customer && <span className="npi-error-text">{errors.customer}</span>}
              </div>
            </div>

            {/* Proforma Details */}
            <div className="npi-section-header" style={{ marginTop: '1rem' }}>
              <FaFileAlt className="npi-section-icon" />
              <span>Proforma Details</span>
            </div>

            <div className="npi-grid-3">
              <div className="npi-field">
                <label className="npi-label">Proforma Number</label>
                <div className="npi-proforma-number-display">{proformaNumber}</div>
              </div>

              <div className="npi-field">
                <label className="npi-label">
                  Proforma Date <span className="npi-required">*</span>
                </label>
                <div className="npi-date-field">
                  <input
                    type="date"
                    value={proformaDate}
                    onChange={(e) => setProformaDate(e.target.value)}
                    className={`npi-input ${errors.proformaDate ? 'npi-input-error' : ''}`}
                  />
                </div>
              </div>

              <div className="npi-field">
                <label className="npi-label">
                  Valid Until <span className="npi-required">*</span>
                </label>
                <div className="npi-date-field">
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className={`npi-input ${errors.validUntil ? 'npi-input-error' : ''}`}
                  />
                </div>
              </div>
            </div>

            <div className="npi-grid-3">
             

              <div className="npi-field">
                <label className="npi-label">Proforma Status</label>
                <select
                  value={proformaStatus}
                  onChange={(e) => setProformaStatus(e.target.value)}
                  className="npi-select"
                >
                  <option value="Draft">Draft</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="npi-field">
                <label className="npi-label">Currency</label>
                <select className="npi-select" defaultValue="INR">
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - CUSTOMER DETAIL CARD */}
          <div className="npi-right-column">
            {customerData ? (
              <div className="npi-detail-card">
                <div className="npi-card-header">
                  <FaBuilding size={14} />
                  <span>Customer Details</span>
                </div>
                <div className="npi-card-content">
                  <h3>{customerData.name}</h3>
                  <div className="npi-card-info">
                    {customerData.code && (
                      <div className="npi-info-item">
                        <span className="npi-info-label">Code</span>
                        <span className="npi-info-value">{customerData.code}</span>
                      </div>
                    )}
                    {customerData.contactPerson && (
                      <div className="npi-info-item">
                        <span className="npi-info-label">Contact</span>
                        <span className="npi-info-value"><FaUser size={10} /> {customerData.contactPerson}</span>
                      </div>
                    )}
                    {customerData.phone && (
                      <div className="npi-info-item">
                        <span className="npi-info-label">Phone</span>
                        <span className="npi-info-value"><FaPhone size={10} /> {customerData.phone}</span>
                      </div>
                    )}
                    {customerData.email && (
                      <div className="npi-info-item">
                        <span className="npi-info-label">Email</span>
                        <span className="npi-info-value"><FaEnvelope size={10} /> {customerData.email}</span>
                      </div>
                    )}
                    {customerData.gstin && (
                      <div className="npi-info-item">
                        <span className="npi-info-label">GST</span>
                        <span className="npi-info-value">{customerData.gstin}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="npi-detail-card npi-empty-card">
                <div className="npi-card-header">
                  <FaBuilding size={14} />
                  <span>Customer Details</span>
                </div>
                <div className="npi-card-content">
                  <div className="npi-empty-state">
                    <FaInfoCircle size={24} />
                    <p>Select a customer to view details</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FULL WIDTH - ITEMS SECTION */}
        <div className="npi-items-full">
          <div className="npi-items-header">
            <span className="npi-items-title">
              <FaClipboardList className="npi-items-icon" /> {isService ? 'Services' : 'Products'}
            </span>
            <button onClick={addItem} className="npi-add-btn">
              <FaPlus size={9} /> Add
            </button>
          </div>

          {errors.items && <div className="npi-items-error"><FaExclamationTriangle /> {errors.items}</div>}

          <div className="npi-table-wrap">
            <table className="npi-items-table">
              <thead>
                <tr>
                  <th className="npi-col-sno">#</th>
                  <th className="npi-col-code">Item Code <span className="npi-required">*</span></th>
                  <th className="npi-col-name">Item Name <span className="npi-required">*</span></th>
                  <th className="npi-col-hsn">HSN</th>
                  <th className="npi-col-qty">Qty <span className="npi-required">*</span></th>
                  <th className="npi-col-unit">UOM</th>
                  <th className="npi-col-rate">Rate</th>
                  <th className="npi-col-tax">Tax</th>
                  <th className="npi-col-tax-amount" style={{ textAlign: 'right' }}>Tax Amt</th>
                  <th className="npi-col-amount" style={{ textAlign: 'right' }}>Amount</th>
                  <th className="npi-col-action"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="npi-col-sno">{index + 1}</td>
                    <td className="npi-col-code">
                      <SearchableSelect
                        value={item.itemCode}
                        onChange={(value) => updateItem(item.id, 'itemCode', value)}
                        options={products}
                        placeholder="Search..."
                        onSearch={handleItemSearch}
                        loading={isLoadingItems}
                        error={!!errors[`item_${index}_code`]}
                      />
                    </td>
                    <td className="npi-col-name">
                      <input
                        type="text"
                        value={item.itemName}
                        onChange={(e) => updateItem(item.id, 'itemName', e.target.value)}
                        placeholder="Item Name"
                        className="npi-table-input npi-table-input-text"
                      />
                    </td>
                    <td className="npi-col-hsn">
                      <input
                        type="text"
                        value={item.hsn}
                        onChange={(e) => updateItem(item.id, 'hsn', e.target.value)}
                        placeholder="HSN"
                        className="npi-table-input npi-table-input-text"
                      />
                    </td>
                    <td className="npi-col-qty">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        min="1"
                        className="npi-table-input"
                      />
                    </td>
                    <td className="npi-col-unit">
                      <select
                        value={item.unit}
                        onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                        className="npi-table-input"
                      >
                        <option value="pcs">Pcs</option>
                        <option value="kg">Kg</option>
                        <option value="ltr">Ltr</option>
                        <option value="mtr">Mtr</option>
                        <option value="Nos">Nos</option>
                        <option value="Box">Box</option>
                      </select>
                    </td>
                    <td className="npi-col-rate">
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="npi-table-input"
                      />
                    </td>
                    <td className="npi-col-tax">
                      <select
                        value={item.tax}
                        onChange={(e) => updateItem(item.id, 'tax', parseFloat(e.target.value) || 0)}
                        className="npi-table-input"
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
                    <td className="npi-col-tax-amount" style={{ textAlign: 'right' }}>
                      <span className="npi-table-value">₹{item.taxAmount.toFixed(2)}</span>
                    </td>
                    <td className="npi-col-amount" style={{ textAlign: 'right' }}>
                      <span className="npi-table-value">₹{item.totalAmount.toFixed(2)}</span>
                    </td>
                    <td className="npi-col-action">
                      <button onClick={() => removeItem(item.id)} className="npi-remove-btn">
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
        <div className="npi-bottom-section">
          {/* LEFT COLUMN */}
          <div className="npi-bottom-left">
            {/* Payment Schedule Header */}
            <div className="npi-section-header">
              <FaCreditCard className="npi-section-icon" />
              <span>Payment Schedule</span>
            </div>

            {/* Payment Terms Template Dropdown */}
            <div className="npi-field" style={{ marginBottom: '0.5rem' }}>
              <div className="npi-field-row" style={{ gridTemplateColumns: '1fr auto' }}>
                <select
                  value={selectedPaymentTemplate}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedPaymentTemplate(value);
                    if (value) {
                      applyPaymentTemplate(value);
                    }
                  }}
                  className="npi-select"
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
                  className="npi-add-btn"
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
            <div className="npi-payment-table-wrap">
              <table className="npi-payment-table">
                <thead>
                  <tr>
                    <th className="npi-payment-col-no">#</th>
                    <th className="npi-payment-col-term">Payment Term</th>
                    <th className="npi-payment-col-date">Due Date</th>
                    <th className="npi-payment-col-duration">Days</th>
                    <th className="npi-payment-col-portion">%</th>
                    <th className="npi-payment-col-amount">Amount</th>
                    <th className="npi-payment-col-action"></th>
                  </tr>
                </thead>
                <tbody>
                  {paymentSchedule.map((schedule, index) => (
                    <tr key={schedule.id}>
                      <td className="npi-payment-col-no">{index + 1}</td>
                      <td className="npi-payment-col-term">
                        <input
                          type="text"
                          value={schedule.paymentTerm}
                          onChange={(e) => updatePaymentRow(index, { paymentTerm: e.target.value })}
                          placeholder="Term"
                          className="npi-table-input npi-table-input-text"
                        />
                      </td>
                      <td className="npi-payment-col-date">
                        <input
                          type="date"
                          value={schedule.dueDate}
                          onChange={(e) => handlePaymentDueDateChange(index, e.target.value)}
                          className="npi-table-input"
                        />
                      </td>
                      <td className="npi-payment-col-duration">
                        <input
                          type="number"
                          value={schedule.durationDays}
                          onChange={(e) => handlePaymentDurationChange(index, Number(e.target.value) || 0)}
                          min="0"
                          className="npi-table-input"
                        />
                      </td>
                      <td className="npi-payment-col-portion">
                        <input
                          type="number"
                          value={schedule.invoicePortion}
                          onChange={(e) => updatePaymentRow(index, { invoicePortion: Number(e.target.value) || 0 })}
                          min="0"
                          max="100"
                          className="npi-table-input"
                        />
                      </td>
                      <td className="npi-payment-col-amount">
                        <span className="npi-table-value">₹{schedule.paymentAmount.toFixed(2)}</span>
                      </td>
                      <td className="npi-payment-col-action">
                        {paymentSchedule.length > 1 && (
                          <button
                            type="button"
                            className="npi-remove-btn"
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

            <button type="button" className="npi-add-payment-btn" onClick={addPaymentSchedule}>
              <FaPlus size={9} /> Add Schedule
            </button>

            {/* Remarks */}
            <div className="npi-field" style={{ marginTop: '1rem' }}>
              <label className="npi-label">Remarks / Notes</label>
              <input
                type="text"
                placeholder="Add notes..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="npi-input"
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Financial Summary */}
          <div className="npi-bottom-right">
            <div className="npi-detail-card npi-summary-card">
              <div className="npi-card-header">
                <FaCalculator size={14} />
                <span>Financial Summary</span>
              </div>
              <div className="npi-card-content">
                <div className="npi-summary-grid">
                  <div className="npi-summary-item">
                    <span className="npi-summary-label">Total Items</span>
                    <span className="npi-summary-value">{totalItems}</span>
                  </div>
                  <div className="npi-summary-item">
                    <span className="npi-summary-label">Total Quantity</span>
                    <span className="npi-summary-value">{totalQuantity}</span>
                  </div>
                  <div className="npi-summary-item">
                    <span className="npi-summary-label">Sub Total</span>
                    <span className="npi-summary-value">₹{subTotal.toFixed(2)}</span>
                  </div>
                  <div className="npi-summary-item">
                    <span className="npi-summary-label">Total Tax</span>
                    <span className="npi-summary-value">₹{totalTax.toFixed(2)}</span>
                  </div>
                  <div className="npi-summary-item">
                    <span className="npi-summary-label">Round Off</span>
                    <div className="npi-roundoff-wrap">
                      <input
                        type="number"
                        value={roundOff.toFixed(2)}
                        onChange={(e) => setRoundOff(parseFloat(e.target.value) || 0)}
                        className="npi-roundoff-input"
                      />
                    </div>
                  </div>
                  <div className="npi-summary-grand">
                    <span className="npi-summary-grand-label">Grand Total</span>
                    <span className="npi-summary-grand-value">₹{grandTotalWithRound.toFixed(2)}</span>
                  </div>
                  <div className="npi-summary-item" style={{ borderTop: '1px solid var(--border-color, #e2e8f0)', marginTop: '4px', paddingTop: '6px' }}>
                    <span className="npi-summary-label" style={{ fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>Payment Schedule Total</span>
                    <span className="npi-summary-value" style={{ fontWeight: 600, color: 'var(--primary-color, #2563eb)' }}>
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
      <div className="npi-form-footer">
        <button onClick={() => window.print()} className="npi-btn npi-btn-print">
          <FaPrint size={11} /> Print
        </button>
        <button onClick={handleSaveDraft} disabled={isSubmitting} className="npi-btn npi-btn-draft">
          {isSubmitting ? <FaSpinner className="npi-spinning" size={11} /> : <FaSave size={11} />} Draft
        </button>
        <button onClick={handleSubmit} disabled={isSubmitting} className="npi-btn npi-btn-submit">
          {isSubmitting ? <FaSpinner className="npi-spinning" size={11} /> : <FaPaperPlane size={11} />} Create Proforma
        </button>
        <button onClick={handleCancel} className="npi-btn npi-btn-cancel">
          <FaTimes size={11} /> Cancel
        </button>
      </div>
    </div>
  );
};

export default CreateProformaInvoice;