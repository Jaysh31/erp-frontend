import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  FaArrowLeft, FaSave, FaSpinner, FaPlus,
  FaTrash, FaFileAlt,
  FaTimes, FaExclamationTriangle, FaInfoCircle,
  FaUser, FaCreditCard, FaCalendarAlt,
  FaFileImport, FaCheckCircle, FaExclamationCircle, FaQuestionCircle,
  FaBuilding, FaPhone, FaEnvelope, FaBox, FaCalculator, FaClipboardList,
  FaChevronDown, FaCopy,
} from 'react-icons/fa';
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import './CreateSalesOrder.css';
import toast from 'react-hot-toast';
import api from '../../services/api';
import ReactDOM from 'react-dom';

/* ─────────────────────────── Types ─────────────────────────── */

type StockStatus = 'checking' | 'available' | 'insufficient' | 'unknown' | undefined;

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

interface TaxOption {
  tax_id: number;
  tax_type: string;
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
  stockUom?: string;
  standardRate?: number;
  creation?: string;
  modified?: string;
  modified_by?: string;
  fg_item?: number;
  fg_item_qty?: number;
  item_id?: number;
  transaction_date?: string;
  warehouse?: string;
  uom?: string;
  net_rate?: number;
  net_amount?: number;
}

interface SalesOrderItem {
  id: string;
  itemCode: string;
  itemName: string;
  hsn: string;
  quantity: number;
  rate: number;
  stockUom: string;
  tax: number;
  tax_id?: number;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  stockStatus?: StockStatus;
  availableQty?: number;
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

// Payment Term Template
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

interface SalesOrderForm {
  namingSeries: string;
  orderType: string;
  isSubcontracted: boolean;
  company: string;
  warehouse: string;
  date: string;
  deliveryDate: string;
  customer: string;
  customerName: string;
  status: string;
  items: SalesOrderItem[];
  totalQuantity: number;
  baseTotal: number;
  taxTotal: number;
  grandTotal: number;
  roundedTotal: number;
  paymentTermsTemplate: string;
  paymentSchedule: PaymentScheduleRow[];
  tcName: string;
  termDetails: string;
}

interface ValidationError {
  field: string;
  label: string;
  message: string;
}

interface SalesOrderApiRecord {
  id?: number;
  name: string;
  naming_series?: string;
  order_type?: string;
  is_subcontracted?: number | boolean;
  company?: string;
  set_warehouse?: string;
  customer_id?: number;
  party_name?: string;
  customer_name?: string;
  transaction_date?: string;
  delivery_date?: string;
  status?: string;
  payment_terms_template?: string;
  tc_name?: string;
  terms?: string;
  grand_total?: number;
  total?: number;
  total_qty?: number;
  net_total?: number;
  base_total?: number;
  currency?: string;
  tax_id?: number;
  items?: Array<{
    id?: number;
    item_code?: string;
    item_name?: string;
    hsn?: string;
    qty?: number;
    rate?: number;
    stock_uom?: string;
    tax_rate?: number;
    tax_id?: number;
    item_tax_id?: number;
    amount?: number;
    creation?: string;
    modified?: string;
    modified_by?: string;
    fg_item?: number | string;
    fg_item_qty?: number | string;
    item_id?: number | string;
    uom?: string;
    net_rate?: number;
    net_amount?: number;
    warehouse?: string;
    transaction_date?: string;
    description?: string;
  }>;
  payment_schedule?: any[];
  rounded_total?: number;
  base_grand_total?: number;
  apply_discount_on?: string;
  discount_amount?: number;
  additional_discount_percentage?: number;
  billing_status?: string;
  delivery_status?: string;
  per_delivered?: number;
  per_billed?: number;
}

interface QuotationApiRecord {
  name: string;
  party_name?: string;
  customer_name?: string;
  transaction_date?: string;
  valid_till?: string;
  company?: string | null;
  currency?: string;
  total_qty?: number;
  total?: number;
  net_total?: number;
  grand_total?: number;
  rounded_total?: number;
  payment_terms_template?: string | null;
  tc_name?: string | null;
  terms?: string | null;
  payment_schedule?: any[];
  items?: Array<{
    id?: number;
    item_code?: string;
    item_name?: string;
    hsn?: string;
    qty?: number;
    rate?: number;
    stock_uom?: string;
    tax_rate?: number;
    tax_id?: number;
    item_tax_id?: number;  // Added this field to match the API response
    amount?: number;
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
  }>;
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


const preventWheelChange = (e: React.WheelEvent<HTMLInputElement>) => {
  e.currentTarget.blur();
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
  stockInfo?: { status: StockStatus; availableQty?: number };
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
      return <span className="so-stock-indicator so-stock-checking"><FaSpinner className="so-spinning" size={8} /></span>;
    }
    if (stockInfo.status === 'available') {
      return <span className="so-stock-indicator so-stock-available"><FaCheckCircle size={8} /> {stockInfo.availableQty}</span>;
    }
    if (stockInfo.status === 'insufficient') {
      return <span className="so-stock-indicator so-stock-insufficient"><FaExclamationCircle size={8} /> {stockInfo.availableQty || 0}</span>;
    }
    return <span className="so-stock-indicator so-stock-unknown"><FaQuestionCircle size={8} /></span>;
  };

  const menu = isOpen ? (
    <div
      ref={menuRef}
      className="so-custom-scroll"
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
          className="so-table-input"
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
          <FaSpinner className="so-spinning" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-color, #2563eb)', fontSize: '11px' }} />
        ) : (
          <FaChevronDown style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary, #94a3b8)', fontSize: '11px', pointerEvents: 'none' }} />
        )}
        {/* Stock indicator inside the input */}
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
  customerList?: Customer[];
  selectedCustomer?: Customer | null;

  onAddNew: (searchTerm: string) => void;
}

const CustomerDropdown: React.FC<CustomerDropdownProps> = ({
  value,
  onChange,
  placeholder = 'Search Customer...',
  disabled = false,
  error = false,
  customerList = [],
  selectedCustomer: propSelectedCustomer,
  onAddNew,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(propSelectedCustomer || null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const menuPos = useDropdownPosition(isOpen, wrapperRef);

  // Use customerList prop if provided, otherwise fetch
  useEffect(() => {
    if (customerList.length > 0) {
      setCustomers(customerList);
      setFilteredCustomers(customerList);
    } else {
      fetchCustomers('');
    }
  }, [customerList]);

  // Update selected customer when prop changes
  useEffect(() => {
    if (propSelectedCustomer) {
      setSelectedCustomer(propSelectedCustomer);
    } else if (value) {
      const match = customers.find(c => c.id === value || c.name === value);
      if (match) {
        setSelectedCustomer(match);
      }
    } else {
      setSelectedCustomer(null);
    }
  }, [propSelectedCustomer, value, customers]);

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
      const response = await api.get(`/customer?page=1&limit=50&search=${encodeURIComponent(search)}`);
      const records = extractRecords(response.data);

      const mappedCustomers: Customer[] = records.map((cust: any) => ({
        id: cust.id?.toString() || cust.name || '',
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
    } catch (error) {
      console.error('Error fetching customers:', error);
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
      if (term.length > 0 && customerList.length === 0) {
        fetchCustomers(term);
      } else if (term.length === 0 && customerList.length === 0) {
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
        className="so-custom-scroll"
        style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          maxHeight: '260px'
        }}
      >
        {loading ? (
          <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary, #94a3b8)', fontSize: '12px' }}>
            <FaSpinner className="so-spinning" style={{ display: 'inline-block', marginRight: '8px' }} /> Loading...
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
          <FaSpinner className="so-spinning" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-color, #2563eb)', fontSize: '12px' }} />
        ) : (
          <FaChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary, #64748b)', fontSize: '12px', pointerEvents: 'none' }} />
        )}
      </div>

      {menu && ReactDOM.createPortal(menu, document.body)}
    </div>
  );
};

// ===== QUICK ADD CUSTOMER MODAL =====

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
                {submitting && <FaSpinner className="so-spinning" size={11} />}
                Add Customer
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// ===== SEARCHABLE QUOTATION DROPDOWN =====
interface QuotationDropdownProps {
  value: string;
  onChange: (value: string, quotationData?: QuotationApiRecord) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}

const QuotationDropdown: React.FC<QuotationDropdownProps> = ({
  value,
  onChange,
  placeholder = 'Search Quotation...',
  disabled = false,
  error = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [quotations, setQuotations] = useState<QuotationApiRecord[]>([]);
  const [filteredQuotations, setFilteredQuotations] = useState<QuotationApiRecord[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<QuotationApiRecord | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const menuPos = useDropdownPosition(isOpen, wrapperRef);

  useEffect(() => {
    fetchQuotations('');
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredQuotations(quotations);
      return;
    }

    const filtered = quotations.filter(q =>
      q.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.party_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(q.grand_total).includes(searchTerm)
    );
    setFilteredQuotations(filtered);
  }, [searchTerm, quotations]);

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

  const fetchQuotations = async (search: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/quotation?page=1&limit=50&search=${encodeURIComponent(search)}`);
      const records = extractRecords(response.data);

      const mappedQuotations: QuotationApiRecord[] = records.map((q: any) => ({
        name: q.name || '',
        party_name: q.party_name || '',
        customer_name: q.customer_name || '',
        transaction_date: q.transaction_date || '',
        valid_till: q.valid_till || '',
        company: q.company || null,
        currency: q.currency || 'INR',
        total_qty: q.total_qty || 0,
        total: q.total || 0,
        net_total: q.net_total || 0,
        grand_total: q.grand_total || 0,
        rounded_total: q.rounded_total || 0,
        payment_terms_template: q.payment_terms_template || null,
        tc_name: q.tc_name || null,
        terms: q.terms || null,
        payment_schedule: q.payment_schedule || [],
        items: q.items || [],
      }));

      setQuotations(mappedQuotations);
      setFilteredQuotations(mappedQuotations);
    } catch (error) {
      console.error('Error fetching quotations:', error);
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
        fetchQuotations(term);
      } else {
        fetchQuotations('');
      }
    }, 500);
  };

  const handleSelect = (quotation: QuotationApiRecord) => {
    setSelectedQuotation(quotation);
    setSearchTerm('');
    setIsOpen(false);
    onChange(quotation.name, quotation);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const getDisplayValue = () => {
    if (selectedQuotation) {
      return `${selectedQuotation.name} — ${selectedQuotation.customer_name || selectedQuotation.party_name || ''}`;
    }
    return '';
  };

  const menu = isOpen ? (
    <div
      ref={menuRef}
      className="so-custom-scroll"
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
          <FaSpinner className="so-spinning" style={{ display: 'inline-block', marginRight: '8px' }} /> Loading...
        </div>
      ) : filteredQuotations.length > 0 ? (
        filteredQuotations.map((q, index) => (
          <div
            key={q.name}
            onMouseDown={(e) => {
              e.preventDefault();
              handleSelect(q);
            }}
            style={{
              padding: '10px 14px',
              cursor: 'pointer',
              background: highlightedIndex === index ? 'var(--nav-hover, #eff6ff)' : 'transparent',
              borderLeft: value === q.name ? '3px solid var(--primary-color, #2563eb)' : '3px solid transparent',
              transition: 'background 0.15s',
              borderBottom: index < filteredQuotations.length - 1 ? '0.5px solid var(--border-color, #f1f5f9)' : 'none'
            }}
            onMouseEnter={() => setHighlightedIndex(index)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary, #0f172a)' }}>{q.name}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary, #475569)', marginLeft: '8px' }}>{q.customer_name || q.party_name || ''}</span>
              </div>
              <span style={{
                fontSize: '11px',
                padding: '2px 10px',
                borderRadius: '12px',
                background: '#dbeafe',
                color: '#1e40af',
                fontWeight: 500
              }}>
                ₹{q.grand_total || 0}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '4px', fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
              <span>Items: {q.items?.length || 0}</span>
              <span>Date: {q.transaction_date ? new Date(q.transaction_date).toLocaleDateString() : ''}</span>
            </div>
          </div>
        ))
      ) : (
        <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary, #94a3b8)', fontSize: '12px' }}>
          {searchTerm ? 'No matching quotations found' : 'No quotations available'}
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
          <FaSpinner className="so-spinning" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-color, #2563eb)', fontSize: '12px' }} />
        ) : (
          <FaChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: disabled ? 'var(--text-secondary, #94a3b8)' : 'var(--text-secondary, #64748b)', fontSize: '12px', pointerEvents: 'none' }} />
        )}
      </div>

      {menu && ReactDOM.createPortal(menu, document.body)}
    </div>
  );
};

const unwrapDate = (value?: string | null): string => {
  if (!value) return '';
  return value.split('T')[0];
};

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

const SALES_ORDER_LINE_CACHE_PREFIX = 'sales_order_line_data:';

interface CachedSalesOrderLineData {
  items?: SalesOrderItem[];
  paymentSchedule?: PaymentScheduleRow[];
}

const cacheSalesOrderLineData = (name: string, data: CachedSalesOrderLineData) => {
  try {
    localStorage.setItem(SALES_ORDER_LINE_CACHE_PREFIX + name, JSON.stringify(data));
  } catch {
    // ignore
  }
};

const readCachedSalesOrderLineData = (name: string): CachedSalesOrderLineData | null => {
  try {
    const raw = localStorage.getItem(SALES_ORDER_LINE_CACHE_PREFIX + name);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};


const SALES_ORDER_DRAFT_PREFIX = 'cso_sales_order_draft:';

interface SalesOrderDraftPayload {
  formData: SalesOrderForm;
  recordName: string | null;
  customerData: Customer | null;
}

const extractRecords = (payload: any): any[] => {
  if (!payload) return [];
  const data = payload.success === 1 || payload.success === 0 ? payload.data : payload;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data)) return data;
  return [];
};

const generateSalesOrderName = (): string => {
  const year = new Date().getFullYear();
  const suffix = Date.now().toString(36).toUpperCase().slice(-6);
  return `SAL-ORD-${year}-${suffix}`;
};

// Helper to get tax value from tax_id
const getTaxValueFromId = (taxId: number | string | undefined, taxOptions: TaxOption[]): number => {
  if (!taxId) return 0;
  const id = typeof taxId === 'string' ? parseInt(taxId, 10) : taxId;
  const taxOption = taxOptions.find(t => t.tax_id === id);
  return taxOption ? extractTaxValue(taxOption.tax_type) : 0;
};

// Helper to extract numeric tax value from tax_type
const extractTaxValue = (taxType: string): number => {
  if (!taxType) return 0;
  const match = taxType.match(/(\d+)/);
  return match ? parseInt(match[0], 10) : 0;
};

// Helper to get tax_id from tax rate value
const getTaxIdFromRate = (taxRate: number, taxOptions: TaxOption[]): number | undefined => {
  const taxOption = taxOptions.find(t => extractTaxValue(t.tax_type) === taxRate);
  return taxOption?.tax_id;
};

/* ═════ SUCCESS MODAL COMPONENT ═════ */
interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesOrder: string;
  totalItems: number;
  message: string;
  customerName?: string;
  onViewDetails?: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  salesOrder,
  totalItems,
  message,
  customerName,
  onViewDetails
}) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="so-modal-overlay" onClick={onClose}>
      <div className="so-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="so-modal-success-icon">
          <FaCheckCircle size={48} />
        </div>

        <h2 className="so-modal-title">✓ Success!</h2>

        <p className="so-modal-message">{message}</p>

        <div className="so-modal-details">
          <div className="so-modal-detail-item">
            <span className="so-modal-detail-label">Sales Order</span>
            <span className="so-modal-detail-value so-modal-so-number">{salesOrder}</span>
          </div>

          {customerName && (
            <div className="so-modal-detail-item">
              <span className="so-modal-detail-label">Customer</span>
              <span className="so-modal-detail-value">{customerName}</span>
            </div>
          )}

          <div className="so-modal-detail-item">
            <span className="so-modal-detail-label">Total Items</span>
            <span className="so-modal-detail-value">{totalItems}</span>
          </div>
        </div>

        <div className="so-modal-actions">
          <button onClick={onViewDetails || onClose} className="so-modal-btn so-modal-btn-primary">
            View Sales Order
          </button>
          <button onClick={onClose} className="so-modal-btn so-modal-btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

/* ═════ MAIN COMPONENT ═════ */

export default function CreateSalesOrder() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const isEditMode = !!id && id !== 'new';

  const getDraftStorageKey = () => `${SALES_ORDER_DRAFT_PREFIX}${id || 'new'}`;

  let theme = 'light';
  try {
    const context = useAdminTheme();
    theme = context.theme;
  } catch (error) {
    console.log('Using default light theme');
  }

  // ===== NEW: Toggle state for With/Without Quotation =====
  const [hasQuotation, setHasQuotation] = useState<boolean>(true);
  const [selectedQuotation, setSelectedQuotation] = useState<string>('');
  const [applyingQuotation, setApplyingQuotation] = useState(false);

  // ===== Tax options state =====
  const [taxOptions, setTaxOptions] = useState<TaxOption[]>([]);
  const [loadingTaxOptions, setLoadingTaxOptions] = useState<boolean>(false);
  const [taxOptionsLoaded, setTaxOptionsLoaded] = useState<boolean>(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showStockWarningModal, setShowStockWarningModal] = useState(false);
  const [stockWarningItems, setStockWarningItems] = useState<SalesOrderItem[]>([]);
  const [recordName, setRecordName] = useState<string | null>(null);
  const [recordFetched, setRecordFetched] = useState<boolean>(false);

  // Success Modal
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [successData, setSuccessData] = useState<{
    salesOrder: string;
    totalItems: number;
    message: string;
    customerName?: string;
  }>({
    salesOrder: '',
    totalItems: 0,
    message: ''
  });

  // Customer data
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerData, setCustomerData] = useState<Customer | null>(null);

  // ─── Quick Add Customer modal state ─────────────────────────────
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickAddPrefillName, setQuickAddPrefillName] = useState('');

  // Product data
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState<boolean>(false);

  // Quotation lookup
  const [, setQuotations] = useState<QuotationApiRecord[]>([]);
  const [loadingQuotations, setLoadingQuotations] = useState(false);

  // Inventory / stock check
  const [inventoryMap, setInventoryMap] = useState<{ [itemCode: string]: InventoryApiRecord }>({});
  const [loadingInventory, setLoadingInventory] = useState(false);

  // Item master catalog
  const [itemMasterMap, setItemMasterMap] = useState<{ [itemCode: string]: any }>({});
  const [loadingItemMaster, setLoadingItemMaster] = useState(false);

  const statusOptions = ['Draft', 'Confirmed', 'On Hold', 'Completed', 'Cancelled', 'Closed'];

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

  const defaultFormData = (): SalesOrderForm => ({
    namingSeries: 'SAL-ORD-.YYYY.-',
    orderType: 'Sales',
    isSubcontracted: false,
    company: 'SculptorTech Pvt Ltd',
    warehouse: 'Finished Goods',
    date: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    customer: '',
    customerName: '',
    status: 'Draft',
    items: [
      { id: '1', itemCode: '', itemName: '', hsn: '', quantity: 1, rate: 0, stockUom: 'Nos', tax: 0, tax_id: undefined, amount: 0, taxAmount: 0, totalAmount: 0 }
    ],
    totalQuantity: 0,
    baseTotal: 0,
    taxTotal: 0,
    grandTotal: 0,
    roundedTotal: 0,
    paymentTermsTemplate: 'on_delivery',
    paymentSchedule: [
      { id: '1', paymentTerm: 'On Delivery', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], durationDays: 7, invoicePortion: 100, paymentAmount: 0, paidAmount: 0, status: 'Pending' }
    ],
    tcName: '',
    termDetails: ''
  });

  const [formData, setFormData] = useState<SalesOrderForm>(defaultFormData());

  const inputRefs = React.useRef<{ [key: string]: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null }>({});
  const itemInputRefs = React.useRef<{ [key: string]: HTMLInputElement | HTMLSelectElement | null }>({});

  const setRef = (key: string) => (el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null) => {
    inputRefs.current[key] = el;
  };

  const setItemRef = (key: string) => (el: HTMLInputElement | HTMLSelectElement | null) => {
    itemInputRefs.current[key] = el;
    inputRefs.current[key] = el;
  };

  const openDatePicker = (key: string) => {
    const el = inputRefs.current[key] as HTMLInputElement | null;
    if (!el) return;
    if (typeof (el as any).showPicker === 'function') {
      try {
        (el as any).showPicker();
        return;
      } catch {
      }
    }
    el.focus();
  };

  // ─── fetch tax options ──────────────────────────
  const fetchTaxOptions = async () => {
    setLoadingTaxOptions(true);
    try {
      const response = await api.get('/item/get-tax');
      const data = response.data;
      if (data.success === 1 && Array.isArray(data.data)) {
        setTaxOptions(data.data);
      } else {
        setTaxOptions([
          { tax_id: 1, tax_type: 'GST18' },
          { tax_id: 2, tax_type: 'GST12' },
          { tax_id: 3, tax_type: 'GST5' },
          { tax_id: 4, tax_type: 'GST0' },
          { tax_id: 5, tax_type: 'IGST18' },
        ]);
      }
      setTaxOptionsLoaded(true);
    } catch (error) {
      console.error('Error fetching tax options:', error);
      setTaxOptions([
        { tax_id: 1, tax_type: 'GST18' },
        { tax_id: 2, tax_type: 'GST12' },
        { tax_id: 3, tax_type: 'GST5' },
        { tax_id: 4, tax_type: 'GST0' },
        { tax_id: 5, tax_type: 'IGST18' },
      ]);
      setTaxOptionsLoaded(true);
    } finally {
      setLoadingTaxOptions(false);
    }
  };

  useEffect(() => {
    fetchTaxOptions();
  }, []);

  // ─── load quotations ──────────────────────────
  const fetchQuotations = async () => {
    setLoadingQuotations(true);
    try {
      const response = await api.get('/quotation');
      const records = extractRecords(response.data);
      setQuotations(records);
    } catch (err) {
      console.error('Error fetching quotations:', err);
    } finally {
      setLoadingQuotations(false);
    }
  };

  useEffect(() => {
    if (!isEditMode) {
      fetchQuotations();
    }
  }, []);

  // ─── fetch items ──────────────────────────
  const fetchAllItems = async () => {
    setIsLoadingItems(true);
    try {
      const response = await api.get('/item?type=product&page=1&limit=100');
      const records = extractRecords(response.data);

      const itemsData: Product[] = records.map((item: any) => ({
        id: item.id?.toString() || item.name || '',
        itemCode: item.item_code || item.name || '',
        itemName: item.item_name || '',
        hsn: item.HSN || item.hsn || '',
        description: item.description || item.item_name || '',
        unit: item.stock_uom || 'Nos',
        rate: item.selling_price || 0,
        tax: item.tax_rate || 0,
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
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setIsLoadingItems(false);
    }
  };

  useEffect(() => {
    fetchAllItems();
  }, []);

  const handleItemSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setProducts(allProducts);
      return;
    }

    try {
      const response = await api.get(`/item?type=product&page=1&limit=50&search=${encodeURIComponent(searchTerm)}`);
      const records = extractRecords(response.data);

      const itemsData: Product[] = records.map((item: any) => ({
        id: item.id?.toString() || item.name || '',
        itemCode: item.item_code || item.name || '',
        itemName: item.item_name || '',
        hsn: item.HSN || item.hsn || '',
        description: item.description || item.item_name || '',
        unit: item.stock_uom || 'Nos',
        rate: item.selling_price || 0,
        tax: item.tax_rate || 0,
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
    } catch (error) {
      console.error('Search error:', error);
    }
  }, [allProducts]);

  // ─── load inventory ──────────────────────────
  const fetchInventory = async () => {
    setLoadingInventory(true);
    try {
      const response = await api.get('/inventory?limit=1000');
      const records: InventoryApiRecord[] = extractRecords(response.data);
      const map: { [itemCode: string]: InventoryApiRecord } = {};
      records.forEach((r) => {
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

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchItemMaster = async () => {
    setLoadingItemMaster(true);
    try {
      const map: { [itemCode: string]: any } = {};
      const limit = 100;
      let page = 1;
      while (page <= 20) {
        const response = await api.get(`/item?type=product&page=${page}&limit=${limit}`);
        const records = extractRecords(response.data);
        records.forEach((r: any) => {
          if (r.item_code) map[String(r.item_code).toUpperCase()] = r;
        });
        const total = response.data?.data?.total ?? records.length;
        if (records.length === 0 || page * limit >= total) break;
        page += 1;
      }
      setItemMasterMap(map);
    } catch (err) {
      console.error('Error fetching item master catalog:', err);
    } finally {
      setLoadingItemMaster(false);
    }
  };

  useEffect(() => {
    fetchItemMaster();
  }, []);

  const getStockStatus = (itemCode: string, quantity: number): { status: StockStatus; availableQty?: number } => {
    if (!itemCode) return { status: undefined };
    const inv = inventoryMap[itemCode.toUpperCase()];
    if (!inv) return { status: 'unknown' };
    return {
      status: (inv.actual_qty ?? 0) >= quantity ? 'available' : 'insufficient',
      availableQty: inv.actual_qty,
    };
  };

  useEffect(() => {
    if (Object.keys(inventoryMap).length === 0) return;
    setFormData((prev) => {
      const updatedItems = prev.items.map((item) => {
        if (!item.itemCode) return item;
        const { status, availableQty } = getStockStatus(item.itemCode, item.quantity);
        return { ...item, stockStatus: status, availableQty };
      });
      return { ...prev, items: updatedItems };
    });
  }, [inventoryMap]);

  // ─── Customer Change Handler ──────────────────────────
  const handleCustomerChange = (customerId: string, customer?: Customer) => {
    const customerData = customer || customers.find(c => c.id === customerId);
    if (customerData) {
      setSelectedCustomer(customerData);
      setCustomerData(customerData);
      setFormData((prev) => ({
        ...prev,
        customer: customerData.id,
        customerName: customerData.name,
      }));
      if (errors.customer) setErrors((prev) => ({ ...prev, customer: '' }));
    } else {
      setSelectedCustomer(null);
      setCustomerData(null);
      setFormData((prev) => ({
        ...prev,
        customer: '',
        customerName: '',
      }));
    }
  };

  const handleAddNewCustomer = (prefillName: string) => {
    setQuickAddPrefillName(prefillName || '');
    setShowQuickAddModal(true);
  };

  const navigateToFullCustomerForm = (prefillName: string) => {
    try {
      const draftPayload: SalesOrderDraftPayload = {
        formData,
        recordName,
        customerData,
      };
      sessionStorage.setItem(getDraftStorageKey(), JSON.stringify(draftPayload));
    } catch (e) {
      console.error('Failed to save sales order draft before navigating to Add Customer:', e);
    }

    navigate('/customer/add', {
      state: {
        returnTo: location.pathname,
        prefillCustomerName: prefillName || '',
      },
    });
  };

  // ─── customers state for dropdown ──────────────────────────
  const [customers, setCustomers] = useState<Customer[]>([]);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customer?page=1&limit=100');
      const records = extractRecords(response.data);

      const mappedCustomers: Customer[] = records.map((cust: any) => ({
        id: cust.id?.toString() || cust.name || '',
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
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);


  useEffect(() => {
    const draftKey = getDraftStorageKey();
    try {
      const raw = sessionStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw) as SalesOrderDraftPayload;
        if (draft.formData) {
          setFormData(prev => ({ ...prev, ...draft.formData }));
        }
        if (draft.recordName) setRecordName(draft.recordName);
        if (draft.customerData) {
          setCustomerData(draft.customerData);
          setSelectedCustomer(draft.customerData);
        }

        if (isEditMode) {
          setRecordFetched(true);
        }
        sessionStorage.removeItem(draftKey);
      }
    } catch (e) {
      console.error('Failed to restore sales order draft:', e);
    }

    const newCustomer = (location.state as any)?.newCustomer as Customer | undefined;
    if (newCustomer) {
      setSelectedCustomer(newCustomer);
      setCustomerData(newCustomer);
      setFormData(prev => ({
        ...prev,
        customer: newCustomer.id,
        customerName: newCustomer.name,
      }));
      toast.success(`Customer "${newCustomer.name}" added and selected`);
      // Clear the navigation state so a refresh or back/forward navigation
      // doesn't re-trigger the selection.
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── load quotation ──────────────────────────
  const handleQuotationChange = async (quotationName: string, quotationData?: QuotationApiRecord) => {
    setSelectedQuotation(quotationName);
    if (!quotationName || !quotationData) return;

    setApplyingQuotation(true);
    try {
      applyQuotationToForm(quotationData);
    } catch (err) {
      console.error('Error loading quotation detail:', err);
      toast.error('Failed to load quotation details');
    } finally {
      setApplyingQuotation(false);
    }
  };

  const getItemMasterRecord = (itemCode: string): any | undefined =>
    itemCode ? itemMasterMap[itemCode.toUpperCase()] : undefined;

  const findLikelyCatalogMatch = (rate: number, quantity: number): any | undefined => {
    const candidates = Object.values(itemMasterMap).filter((m: any) => {
      if (m.is_sales_item === 0) return false;
      const masterRate = Number(m.standard_rate ?? m.selling_price ?? NaN);
      return !isNaN(masterRate) && Math.abs(masterRate - rate) < 0.01;
    });
    if (candidates.length === 0) return undefined;
    if (candidates.length === 1) return candidates[0];
    const withEnoughStock = candidates.find((m: any) => {
      const inv = inventoryMap[String(m.item_code).toUpperCase()];
      return inv && (inv.actual_qty ?? 0) >= quantity;
    });
    return withEnoughStock || candidates[0];
  };

  const applyQuotationToForm = (record: QuotationApiRecord) => {
    const rawItems = Array.isArray(record.items) ? record.items : [];

    let items: SalesOrderItem[];
    let itemsAreGuessed = false;
    let itemsNeedManualPick = false;

    if (rawItems.length > 0) {
      items = rawItems.map((it, idx) => {
        const itemCode = it.item_code || '';
        const master = getItemMasterRecord(itemCode);
        const quantity = it.qty ?? 1;
        const rate = it.rate ?? master?.standard_rate ?? 0;
        const itemName = it.item_name || master?.item_name || '';
        const hsn = it.hsn || master?.HSN || master?.hsn || '';
        const stockUom = it.stock_uom || master?.stock_uom || 'Nos';

        // ===== FIX: Properly bind item_tax_id to tax field =====
        // Check for both tax_id and item_tax_id from the API response
        let tax_id: number | undefined = it.tax_id ? Number(it.tax_id) : undefined;
        if (!tax_id && it.item_tax_id) {
          tax_id = Number(it.item_tax_id);
        }
        let tax = 0;

        // If tax_id is provided, get the tax rate from tax options
        if (tax_id) {
          tax = getTaxValueFromId(tax_id, taxOptions);
        }
        // If only tax_rate is provided but no tax_id, try to find matching tax_id
        else if (it.tax_rate && it.tax_rate > 0) {
          tax = it.tax_rate;
          tax_id = getTaxIdFromRate(tax, taxOptions);
        }
        // If no tax info at all, check master item
        else if (master) {
          const masterTax = master.tax_rate || 0;
          if (masterTax > 0) {
            tax = masterTax;
            tax_id = getTaxIdFromRate(masterTax, taxOptions);
          }
        }

        const amount = it.amount ?? quantity * rate;
        const taxAmount = (amount * tax) / 100;
        const { status, availableQty } = getStockStatus(itemCode, quantity);

        console.log(`Item ${itemCode}: tax_id=${tax_id}, tax=${tax}`); // Debug log

        return {
          id: String(idx + 1),
          itemCode,
          itemName,
          hsn,
          quantity,
          rate,
          stockUom,
          tax,
          tax_id,
          amount,
          taxAmount,
          totalAmount: amount + taxAmount,
          stockStatus: status,
          availableQty,
          creation: it.creation,
          modified: it.modified,
          modified_by: it.modified_by,
          fg_item: it.fg_item,
          fg_item_qty: it.fg_item_qty,
          item_id: it.item_id,
          uom: it.uom,
          net_rate: it.net_rate,
          net_amount: it.net_amount,
          warehouse: it.warehouse,
          transaction_date: it.transaction_date,
        };
      });
    } else {
      const quantity = record.total_qty && record.total_qty > 0 ? record.total_qty : 0;
      const baseAmount = record.total ?? record.net_total ?? 0;

      if (quantity > 0 && baseAmount > 0) {
        const rate = Number((baseAmount / quantity).toFixed(2));
        const grand = record.grand_total ?? record.rounded_total ?? baseAmount;
        const taxAmount = Math.max(0, grand - baseAmount);
        const taxPercent = baseAmount > 0 ? (taxAmount / baseAmount) * 100 : 0;
        const tax_id = getTaxIdFromRate(taxPercent, taxOptions);

        const match = findLikelyCatalogMatch(rate, quantity);

        if (match) {
          const itemCode = match.item_code;
          const { status, availableQty } = getStockStatus(itemCode, quantity);
          const amount = quantity * Number(match.standard_rate ?? rate);
          const taxAmt = (amount * taxPercent) / 100;
          items = [{
            id: '1',
            itemCode,
            itemName: match.item_name || '',
            hsn: match.HSN || match.hsn || '',
            quantity,
            rate: Number(match.standard_rate ?? rate),
            stockUom: match.stock_uom || 'Nos',
            tax: taxPercent,
            tax_id,
            amount,
            taxAmount: taxAmt,
            totalAmount: amount + taxAmt,
            stockStatus: status,
            availableQty,
            creation: match.creation,
            modified: match.modified,
            modified_by: match.modified_by,
            fg_item: match.fg_item,
            fg_item_qty: match.fg_item_qty,
            item_id: match.id,
            uom: match.uom,
            net_rate: match.net_rate,
            net_amount: match.net_amount,
            warehouse: match.warehouse,
            transaction_date: match.transaction_date,
          }];
          itemsAreGuessed = true;
        } else {
          items = [{
            id: '1',
            itemCode: '',
            itemName: `Select item — no catalog match for ${record.name} totals`,
            hsn: '',
            quantity,
            rate,
            stockUom: 'Nos',
            tax: taxPercent,
            tax_id,
            amount: baseAmount,
            taxAmount: taxAmount,
            totalAmount: grand,
          }];
          itemsNeedManualPick = true;
        }
      } else {
        items = [{ id: '1', itemCode: '', itemName: '', hsn: '', quantity: 1, rate: 0, stockUom: 'Nos', tax: 0, tax_id: undefined, amount: 0, taxAmount: 0, totalAmount: 0 }];
      }
    }

    let paymentSchedule: PaymentScheduleRow[] = [];
    if (Array.isArray(record.payment_schedule) && record.payment_schedule.length > 0) {
      paymentSchedule = record.payment_schedule.map((p: any, idx: number) => ({
        id: String(idx + 1),
        paymentTerm: p.payment_term || '',
        dueDate: unwrapDate(p.due_date),
        durationDays: p.due_days ?? daysBetween(unwrapDate(record.transaction_date), unwrapDate(p.due_date)),
        invoicePortion: p.invoice_portion || 0,
        paymentAmount: p.payment_amount || 0,
        paidAmount: p.paid_amount || 0,
        status: p.status || 'Pending',
      }));
    } else {
      const txnDate = unwrapDate(record.transaction_date);
      const dueDate = unwrapDate(record.valid_till);
      if (dueDate) {
        paymentSchedule = [{
          id: '1',
          paymentTerm: record.payment_terms_template || 'Full payment on or before valid till date',
          dueDate,
          durationDays: daysBetween(txnDate, dueDate),
          invoicePortion: 100,
          paymentAmount: record.grand_total ?? record.total ?? 0,
          paidAmount: 0,
          status: 'Pending',
        }];
      }
    }

    // Find customer match
    let customerMatch: Customer | undefined;
    if (record.party_name) {
      customerMatch = customers.find((c) => c.id === record.party_name || c.name === record.party_name);
      if (customerMatch) {
        setSelectedCustomer(customerMatch);
        setCustomerData(customerMatch);
      }
    }

    setFormData((prev) => ({
      ...prev,
      company: record.company || prev.company,
      customer: customerMatch?.id || record.party_name || prev.customer,
      customerName: customerMatch?.name || record.customer_name || prev.customerName,
      date: unwrapDate(record.transaction_date) || prev.date,
      deliveryDate: unwrapDate(record.valid_till) || prev.deliveryDate,
      paymentTermsTemplate: record.payment_terms_template || prev.paymentTermsTemplate,
      tcName: record.tc_name || prev.tcName,
      termDetails: record.terms || prev.termDetails,
      items,
      paymentSchedule: paymentSchedule.length > 0 ? paymentSchedule : prev.paymentSchedule,
    }));

    if (itemsAreGuessed) {
      toast(
        `${record.name} had no saved item lines, so "${items[0].itemName}" (${items[0].itemCode}) was matched by rate — please verify it's correct before saving.`,
        { icon: '⚠️' }
      );
    } else if (itemsNeedManualPick) {
      toast(
        `${record.name} has no saved item lines and no catalog item matches its rate — please pick the actual item code.`,
        { icon: '⚠️' }
      );
    } else if (rawItems.length === 0) {
      toast(`Loaded ${record.name}, but it has no item lines — add items manually.`);
    } else {
      toast.success(`Loaded fields from ${record.name}`);
    }
  };

  // ─── load existing sales order ───────────────────
  useEffect(() => {
    if (isEditMode && id && taxOptionsLoaded && !recordFetched) {
      fetchSalesOrderById(id);
    }
  }, [id, taxOptionsLoaded, recordFetched]);

  const fetchSalesOrderById = async (orderId: string) => {
    setLoadingRecord(true);
    setApiError(null);
    try {
      const response = await api.get(`/sales-order/${orderId}`);

      if (response.data.success !== 1) {
        throw new Error(response.data?.message || 'Failed to fetch sales order');
      }

      const record = response.data.data;

      if (record) {
        loadSalesOrderIntoForm(record);
        setRecordFetched(true);
      } else {
        setApiError('Sales order not found');
      }
    } catch (err: any) {
      console.error('Error fetching sales order:', err);
      setApiError(err.response?.data?.message || 'Failed to load sales order');
    } finally {
      setLoadingRecord(false);
    }
  };

  const loadSalesOrderIntoForm = (record: SalesOrderApiRecord) => {
    setRecordName(record.name ?? null);

    const cached = readCachedSalesOrderLineData(record.name);

    let customerMatch: Customer | undefined;
    if (record.customer_name) {
      customerMatch = customers.find((c) =>
        c.name === record.customer_name ||
        c.id === String(record.customer_id)
      );
      if (customerMatch) {
        setSelectedCustomer(customerMatch);
        setCustomerData(customerMatch);
      }
    }

    const parentTaxId = record.tax_id ? Number(record.tax_id) : undefined;

    const items: SalesOrderItem[] =
      Array.isArray(record.items) && record.items.length > 0
        ? record.items.map((it, idx) => {
          const quantity = it.qty ?? 0;
          const rate = it.rate ?? 0;
          const itemCode = it.item_code || '';

          let tax = it.tax_rate ?? 0;

          let tax_id: number | undefined =
            it.item_tax_id ? Number(it.item_tax_id) :
              it.tax_id ? Number(it.tax_id) : undefined;

          if (tax_id) {

            if (!tax || tax <= 0) {
              tax = getTaxValueFromId(tax_id, taxOptions);
            }
          } else if (tax > 0) {

            tax_id = getTaxIdFromRate(tax, taxOptions);
          } else if (parentTaxId) {
            tax_id = parentTaxId;
            tax = getTaxValueFromId(parentTaxId, taxOptions);
          }

          const amount = it.amount ?? quantity * rate;
          const taxAmount = (amount * tax) / 100;
          const { status, availableQty } = getStockStatus(itemCode, quantity);
          return {
            id: String(idx + 1),
            itemCode,
            itemName: it.item_name || '',
            hsn: it.hsn || '',
            quantity,
            rate,
            stockUom: it.stock_uom || 'Nos',
            tax,
            tax_id,
            amount,
            taxAmount,
            totalAmount: amount + taxAmount,
            stockStatus: status,
            availableQty,
            creation: it.creation,
            modified: it.modified,
            modified_by: it.modified_by,
            fg_item: it.fg_item ? parseInt(String(it.fg_item)) : 0,
            fg_item_qty: it.fg_item_qty ? parseFloat(String(it.fg_item_qty)) : 0,
            item_id: it.item_id ? parseInt(String(it.item_id)) : 0,
            uom: it.uom || it.stock_uom || 'Nos',
            net_rate: it.net_rate || rate,
            net_amount: it.net_amount || amount,
            warehouse: it.warehouse || formData.warehouse || 'Finished Goods',
            transaction_date: it.transaction_date || record.transaction_date,
          };
        })
        : cached?.items && cached.items.length > 0
          ? cached.items
          : [{ id: '1', itemCode: '', itemName: '', hsn: '', quantity: 1, rate: 0, stockUom: 'Nos', tax: 0, tax_id: undefined, amount: 0, taxAmount: 0, totalAmount: 0 }];

    let paymentSchedule: PaymentScheduleRow[] = [];
    if (Array.isArray(record.payment_schedule) && record.payment_schedule.length > 0) {
      paymentSchedule = record.payment_schedule.map((p: any, idx: number) => ({
        id: String(idx + 1),
        paymentTerm: p.payment_term || '',
        dueDate: unwrapDate(p.due_date),
        durationDays: p.due_days ?? daysBetween(unwrapDate(record.transaction_date), unwrapDate(p.due_date)),
        invoicePortion: p.invoice_portion || 0,
        paymentAmount: p.payment_amount || 0,
        paidAmount: p.paid_amount || 0,
        status: p.status || 'Pending',
      }));
    } else if (cached?.paymentSchedule && cached.paymentSchedule.length > 0) {
      paymentSchedule = cached.paymentSchedule;
    } else if (record.payment_terms_template) {
      const template = paymentTermTemplates.find(t => t.name === record.payment_terms_template || t.id === record.payment_terms_template);
      if (template) {
        applyPaymentTemplate(template.id);
        paymentSchedule = formData.paymentSchedule;
      } else {
        paymentSchedule = [{
          id: '1',
          paymentTerm: record.payment_terms_template,
          dueDate: unwrapDate(record.delivery_date) || unwrapDate(record.transaction_date),
          durationDays: daysBetween(unwrapDate(record.transaction_date), unwrapDate(record.delivery_date)),
          invoicePortion: 100,
          paymentAmount: record.grand_total ?? record.total ?? 0,
          paidAmount: 0,
          status: 'Pending',
        }];
      }
    }

    setFormData((prev) => ({
      ...prev,
      namingSeries: record.naming_series || prev.namingSeries,
      orderType: record.order_type || prev.orderType,
      isSubcontracted: Boolean(record.is_subcontracted),
      company: record.company || prev.company,
      warehouse: record.set_warehouse || prev.warehouse,
      customer: customerMatch?.id || String(record.customer_id) || prev.customer,
      customerName: customerMatch?.name || record.customer_name || prev.customerName,
      date: unwrapDate(record.transaction_date) || prev.date,
      deliveryDate: unwrapDate(record.delivery_date) || prev.deliveryDate,
      status: record.status || prev.status,
      paymentTermsTemplate: record.payment_terms_template || prev.paymentTermsTemplate,
      tcName: record.tc_name || prev.tcName,
      termDetails: record.terms || prev.termDetails,
      items,
      paymentSchedule: paymentSchedule.length > 0 ? paymentSchedule : prev.paymentSchedule,
    }));
  };

  // Update selected customer when formData.customer changes and customers are loaded
  useEffect(() => {
    if (formData.customer && customers.length > 0) {
      const match = customers.find((c) => c.id === formData.customer || c.name === formData.customer);
      if (match) {
        setSelectedCustomer(match);
        setCustomerData(match);
      }
    }
  }, [customers, formData.customer]);

  // ─── Apply Payment Template ──────────────────────────
  const applyPaymentTemplate = (templateId: string) => {
    const template = paymentTermTemplates.find(t => t.id === templateId);
    if (!template) return;

    const grandTotal = formData.roundedTotal || 0;
    const date = formData.date || new Date().toISOString().split('T')[0];

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

    setFormData(prev => ({
      ...prev,
      paymentTermsTemplate: templateId,
      paymentSchedule: schedules.length > 0 ? schedules : prev.paymentSchedule,
    }));

    toast.success(`Applied "${template.name}" payment terms`);
  };

  // ─── validation ──────────────────────────────
  const getAllValidationErrors = (): ValidationError[] => {
    const allErrors: ValidationError[] = [];

    if (!formData.customer.trim())
      allErrors.push({ field: 'customer', label: 'Customer', message: 'Customer is required' });
    if (!formData.date)
      allErrors.push({ field: 'date', label: 'Date', message: 'Date is required' });
    if (!formData.deliveryDate)
      allErrors.push({ field: 'deliveryDate', label: 'Delivery Date', message: 'Delivery date is required' });

    let hasValidItem = false;
    formData.items.forEach((item, index) => {
      if (item.itemCode || item.itemName) {
        hasValidItem = true;
        if (!item.itemCode) {
          allErrors.push({ field: `item_${index}_code`, label: `Item ${index + 1} Code`, message: 'Item code required' });
        }
        if (item.quantity <= 0) {
          allErrors.push({ field: `item_${index}_quantity`, label: `Item ${index + 1} Quantity`, message: 'Quantity must be > 0' });
        }
        if (item.rate <= 0) {
          allErrors.push({ field: `item_${index}_rate`, label: `Item ${index + 1} Rate`, message: 'Rate must be > 0' });
        }
      }
    });
    if (!hasValidItem) {
      allErrors.push({ field: 'items', label: 'Items', message: 'At least one item is required' });
    }

    return allErrors;
  };

  const jumpToField = (field: string) => {
    setShowValidationSummary(false);
    setErrors({});
    setTimeout(() => {
      const el = inputRefs.current[field];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }, 50);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit(e as any);
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        addItemRow();
        toast.success('New item added');
        setTimeout(() => {
          const lastIndex = formData.items.length;
          const refKey = `item_${lastIndex}_itemCode`;
          if (itemInputRefs.current[refKey]) {
            itemInputRefs.current[refKey]?.focus();
          }
        }, 100);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setShowBarcodeScanner(!showBarcodeScanner);
      }

      if (e.key === 'Escape') {
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [formData.items.length, showBarcodeScanner]);

  useEffect(() => {
    setTimeout(() => {
      inputRefs.current['orderType']?.focus();
    }, 300);
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [formData.items]);

  const calculateTotals = () => {
    const totalQty = formData.items.reduce((sum, item) => sum + item.quantity, 0);
    const baseTotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
    const taxTotal = formData.items.reduce((sum, item) => sum + item.taxAmount, 0);
    const grandTotal = baseTotal + taxTotal;
    const roundedTotal = Math.round(grandTotal);

    setFormData(prev => ({
      ...prev,
      totalQuantity: totalQty,
      baseTotal,
      taxTotal,
      grandTotal,
      roundedTotal
    }));

    // Update payment amounts based on grand total
    setFormData(prev => ({
      ...prev,
      paymentSchedule: prev.paymentSchedule.map(p => ({
        ...p,
        paymentAmount: (p.invoicePortion / 100) * roundedTotal
      }))
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleItemChange = (index: number, field: keyof SalesOrderItem, value: string | number) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };

    if (field === 'quantity' || field === 'rate') {
      const quantity = field === 'quantity' ? Number(value) : updatedItems[index].quantity;
      const rate = field === 'rate' ? Number(value) : updatedItems[index].rate;
      const amount = quantity * rate;
      const tax = updatedItems[index].tax || 0;
      const taxAmount = (amount * tax) / 100;
      updatedItems[index].amount = amount;
      updatedItems[index].taxAmount = taxAmount;
      updatedItems[index].totalAmount = amount + taxAmount;
    }

    if (field === 'itemCode') {
      const product = allProducts.find(p => p.itemCode === value);
      if (product) {
        const quantity = updatedItems[index].quantity || 1;
        const rate = product.rate || 0;
        const amount = quantity * rate;
        const tax = product.tax || 0;
        const tax_id = getTaxIdFromRate(tax, taxOptions);
        const taxAmount = (amount * tax) / 100;

        updatedItems[index].itemName = product.itemName || '';
        updatedItems[index].hsn = product.hsn || '';
        updatedItems[index].rate = rate;
        updatedItems[index].stockUom = product.unit || 'Nos';
        updatedItems[index].tax = tax;
        updatedItems[index].tax_id = tax_id;
        updatedItems[index].amount = amount;
        updatedItems[index].taxAmount = taxAmount;
        updatedItems[index].totalAmount = amount + taxAmount;
        updatedItems[index].creation = product.creation;
        updatedItems[index].modified = product.modified;
        updatedItems[index].modified_by = product.modified_by;
        updatedItems[index].fg_item = product.fg_item;
        updatedItems[index].fg_item_qty = product.fg_item_qty;
        updatedItems[index].item_id = product.item_id;
        updatedItems[index].uom = product.uom;
        updatedItems[index].net_rate = product.net_rate;
        updatedItems[index].net_amount = product.net_amount;
        updatedItems[index].warehouse = product.warehouse;
        updatedItems[index].transaction_date = product.transaction_date;

        const { status, availableQty } = getStockStatus(String(value), quantity);
        updatedItems[index].stockStatus = status;
        updatedItems[index].availableQty = availableQty;
      }
    }

    if (field === 'quantity') {
      const itemCode = updatedItems[index].itemCode;
      const quantity = Number(value);
      const rate = updatedItems[index].rate || 0;
      const amount = quantity * rate;
      const tax = updatedItems[index].tax || 0;
      const taxAmount = (amount * tax) / 100;

      updatedItems[index].amount = amount;
      updatedItems[index].taxAmount = taxAmount;
      updatedItems[index].totalAmount = amount + taxAmount;

      const { status, availableQty } = getStockStatus(itemCode, quantity);
      updatedItems[index].stockStatus = status;
      updatedItems[index].availableQty = availableQty;
    }

    if (field === 'tax_id') {
      const amount = updatedItems[index].amount || 0;
      const taxIdValue = value === '' || value === undefined || value === null ? undefined : Number(value);
      const tax = taxIdValue ? getTaxValueFromId(taxIdValue, taxOptions) : 0;
      const taxAmount = (amount * tax) / 100;
      updatedItems[index].tax_id = taxIdValue;
      updatedItems[index].tax = tax;
      updatedItems[index].taxAmount = taxAmount;
      updatedItems[index].totalAmount = amount + taxAmount;
    }

    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const addItemRow = () => {
    const newId = String(formData.items.length + 1);
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { id: newId, itemCode: '', itemName: '', hsn: '', quantity: 1, rate: 0, stockUom: 'Nos', tax: 0, tax_id: undefined, amount: 0, taxAmount: 0, totalAmount: 0 }
      ]
    }));
  };

  // ─── payment schedule ─────────────────────────
  const addPaymentSchedule = () => {
    const newId = String(formData.paymentSchedule.length + 1);
    // const grandTotal = formData.roundedTotal || 0;
    setFormData(prev => ({
      ...prev,
      paymentSchedule: [
        ...prev.paymentSchedule,
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
      ]
    }));
  };

  const removePaymentSchedule = (index: number) => {
    if (formData.paymentSchedule.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      paymentSchedule: prev.paymentSchedule.filter((_, i) => i !== index)
    }));
  };

  const updatePaymentRow = (index: number, patch: Partial<PaymentScheduleRow>) => {
    setFormData(prev => {
      const updated = [...prev.paymentSchedule];
      updated[index] = { ...updated[index], ...patch };

      if (patch.invoicePortion !== undefined) {
        const grandTotal = prev.roundedTotal || 0;
        updated[index].paymentAmount = (patch.invoicePortion / 100) * grandTotal;
      }

      return { ...prev, paymentSchedule: updated };
    });
  };

  const handlePaymentDueDateChange = (index: number, dueDate: string) => {
    const duration = daysBetween(formData.date, dueDate);
    updatePaymentRow(index, { dueDate, durationDays: duration });
  };

  const handlePaymentDurationChange = (index: number, durationDays: number) => {
    const dueDate = addDays(formData.date, durationDays);
    updatePaymentRow(index, { durationDays, dueDate });
  };

  // ─── submit ──────────────────────────────────
  const validateForm = (): boolean => {
    const allErrors = getAllValidationErrors();
    if (allErrors.length > 0) {
      setValidationErrors(allErrors);
      setShowValidationSummary(true);
      return false;
    }
    return true;
  };

  const formatDate = (date: string) => {
    if (!date) return '';
    return date.split('T')[0];
  };

  // ─── build API payload ────────────────────────
  // NOTE: When editing, the record identifier (`name`) MUST be included in
  // the payload so the backend/PUT endpoint knows which sales order to
  // update instead of inserting a brand-new one (which was causing
  // duplicate entries on edit/update).
  const buildApiPayload = () => {
    const validItems = formData.items.filter((item) => item.itemCode || item.itemName);

    const customerId = customerData?.id || selectedCustomer?.id || formData.customer || '';

    const firstItemWithTax = validItems.find((item) => item.tax_id);
    const taxId = firstItemWithTax?.tax_id
      ?? (taxOptions.length > 0 ? taxOptions[0].tax_id : null);

    const payload: any = {
      // Include the record identifier only in edit mode, so PUT updates the
      // existing sales order instead of the backend creating a new one.
      ...(isEditMode && recordName ? { name: recordName } : {}),
      company: 1,
      modified_by: "Administrator",
      customer_id: parseInt(customerId) || customerId,
      customer_name: formData.customerName,
      transaction_date: formatDate(formData.date),
      delivery_date: formatDate(formData.deliveryDate),
      currency: 'INR',
      selling_price_list: 'Standard Selling',
      set_warehouse: 1,
      reserve_stock: 1,
      tax_id: taxId,
      total_qty: formData.totalQuantity,
      total: formData.baseTotal,
      net_total: formData.baseTotal,
      grand_total: formData.grandTotal,
      rounded_total: formData.roundedTotal,
      status: formData.status,
      items: validItems.map((item) => {

        const itemTaxId = item.tax_id || getTaxIdFromRate(item.tax, taxOptions) || taxId;

        return {
          fg_item: item.fg_item || 0,
          fg_item_qty: item.fg_item_qty || 0,
          item_id: item.item_id || null,
          item_code: item.itemCode,
          item_name: item.itemName,
          description: item.itemName || '',
          qty: item.quantity,
          stock_uom: item.stockUom || 'Nos',
          uom: item.uom || item.stockUom || 'Nos',
          rate: item.rate,
          amount: item.amount,
          net_rate: item.net_rate || item.rate,
          net_amount: item.net_amount || item.amount,
          item_tax_id: itemTaxId,
          tax_id: itemTaxId,
          tax_rate: item.tax || 0,
          warehouse: 1,
        };
      }),
      payment_schedule: formData.paymentSchedule.map((p) => ({
        payment_term: p.paymentTerm || 'On Delivery',
        due_date: p.dueDate || formData.deliveryDate,
        due_days: p.durationDays || daysBetween(formData.date, p.dueDate || formData.deliveryDate),
        invoice_portion: p.invoicePortion || 100,
        payment_amount: p.paymentAmount || 0,
        paid_amount: p.paidAmount || 0,
        status: p.status || 'Pending',
      })),
    };

    return payload;
  };

  const saveSalesOrder = async () => {
    setSaving(true);
    setApiError(null);

    try {
      const payload = buildApiPayload();

      // In edit mode, backend requires the Sales Order ID
      if (isEditMode) {
        const salesOrderId = id || recordName;

        if (!salesOrderId) {
          throw new Error('Sales Order ID is missing');
        }

        payload.id = Number(salesOrderId);
      }

      console.log('Sales Order PUT payload:', payload);

      const response = isEditMode
        ? await api.put('/sales-order', payload)
        : await api.post('/sales-order', payload);

      if (response.data.success !== 1) {
        throw new Error(
          response.data?.message ||
          (isEditMode
            ? 'Failed to update sales order'
            : 'Failed to create sales order')
        );
      }

      const savedName =
        response.data?.data?.name ||
        recordName ||
        payload.name ||
        generateSalesOrderName();

      cacheSalesOrderLineData(savedName, {
        items: formData.items,
        paymentSchedule: formData.paymentSchedule,
      });

      const totalItems = formData.items.filter(
        i => i.itemCode && i.quantity > 0
      ).length;

      setSuccessData({
        salesOrder: savedName,
        totalItems,
        message: isEditMode
          ? 'Sales order updated successfully!'
          : 'Sales order created successfully!',
        customerName: formData.customerName
      });

      setShowSuccessModal(true);

      toast.success(
        isEditMode
          ? 'Sales order updated successfully!'
          : 'Sales order created successfully!'
      );

    } catch (error: any) {
      console.error('Error saving sales order:', error);

      let message = 'Failed to save sales order';

      if (error.response) {
        message =
          error.response.data?.message ||
          `Server error: ${error.response.status}`;
      } else if (error.request) {
        message = 'Network error. Please check your connection.';
      } else if (error.message) {
        message = error.message;
      }

      setApiError(message);
      toast.error(message);

    } finally {
      setSaving(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Do not allow an edit submission while the existing record is still
    // being loaded. Once loaded, saveSalesOrder uses the URL id as a fallback
    // so the PUT request is guaranteed to target the existing record.
    if (isEditMode && loadingRecord) {
      toast.error('Please wait until the sales order finishes loading.');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    const insufficientItems = formData.items.filter((item) => item.itemCode && item.stockStatus === 'insufficient');
    if (insufficientItems.length > 0) {
      setStockWarningItems(insufficientItems);
      setShowStockWarningModal(true);
      return;
    }

    await saveSalesOrder();
  };

  const confirmSaveDespiteStock = async () => {
    setShowStockWarningModal(false);
    await saveSalesOrder();
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All unsaved data will be lost.')) {
      navigate('/sales-order');
    }
  };

  const handleViewSalesOrder = () => {
    setShowSuccessModal(false);
    navigate(`/sales-order/${successData.salesOrder}`);
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    navigate('/sales-order');
  };

  return (
    <div className={`so-page ${theme}`}>
      <style>{`
        .so-spinning { animation: soSpin 1s linear infinite; }
        @keyframes soSpin { to { transform: rotate(360deg); } }

        .so-custom-scroll::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .so-custom-scroll::-webkit-scrollbar-track {
          background: var(--border-color, #f1f5f9);
          border-radius: 2px;
        }
        .so-custom-scroll::-webkit-scrollbar-thumb {
          background: var(--text-secondary, #cbd5e1);
          border-radius: 2px;
        }
        .so-custom-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--text-secondary, #94a3b8);
        }
      `}</style>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseModal}
        salesOrder={successData.salesOrder}
        totalItems={successData.totalItems}
        message={successData.message}
        customerName={successData.customerName}
        onViewDetails={handleViewSalesOrder}
      />

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

      {/* Validation Summary Modal */}
      {showValidationSummary && validationErrors.length > 0 && (
        <div className="so-modal-overlay" onClick={() => setShowValidationSummary(false)}>
          <div className="so-validation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="so-modal-header so-modal-header-warning">
              <h2 className="so-modal-title-warning">
                <FaExclamationTriangle /> Missing Required Fields
              </h2>
              <button className="so-modal-close" onClick={() => setShowValidationSummary(false)}>×</button>
            </div>
            <div className="so-modal-body">
              <p className="so-modal-intro">
                Please fill in the following required fields before submitting:
              </p>
              <div className="so-error-list">
                {validationErrors.map((error, idx) => (
                  <div key={idx} className="so-validation-error-item" onClick={() => jumpToField(error.field)}>
                    <div className="so-error-header">
                      <FaTimes className="so-error-icon" />
                      <strong className="so-error-label">{error.label}</strong>
                    </div>
                    <div className="so-error-message">{error.message}</div>
                  </div>
                ))}
              </div>
              <div className="so-hint-banner">
                <FaInfoCircle className="so-hint-icon" />
                Click on any error to jump to that field
              </div>
            </div>
            <div className="so-modal-footer">
              <button className="so-btn-cancel" onClick={() => setShowValidationSummary(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Warning Modal */}
      {showStockWarningModal && (
        <div className="so-modal-overlay" onClick={() => setShowStockWarningModal(false)}>
          <div className="so-validation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="so-modal-header so-modal-header-warning">
              <h2 className="so-modal-title-warning">
                <FaExclamationTriangle /> Insufficient Stock
              </h2>
              <button className="so-modal-close" onClick={() => setShowStockWarningModal(false)}>×</button>
            </div>
            <div className="so-modal-body">
              <p className="so-modal-intro">
                The following item{stockWarningItems.length > 1 ? 's do' : ' does'} not have enough stock available.
                You can still create this sales order, or go back and adjust the quantities.
              </p>
              <div className="so-error-list">
                {stockWarningItems.map((item, idx) => (
                  <div key={idx} className="so-validation-error-item" style={{ cursor: 'default' }}>
                    <div className="so-error-header">
                      <FaExclamationCircle className="so-error-icon" />
                      <strong className="so-error-label">
                        {item.itemName || item.itemCode} ({item.itemCode})
                      </strong>
                    </div>
                    <div className="so-error-message">
                      Requested {item.quantity}, only {item.availableQty ?? 0} in stock
                    </div>
                  </div>
                ))}
              </div>
              <div className="so-hint-banner">
                <FaInfoCircle className="so-hint-icon" />
                You can create the order anyway and adjust stock later, or go back to change quantities.
              </div>
            </div>
            <div className="so-modal-footer" style={{ justifyContent: 'space-between' }}>
              <button className="so-btn-cancel" onClick={() => setShowStockWarningModal(false)}>
                Go Back
              </button>
              <button className="so-btn so-btn-submit" onClick={confirmSaveDespiteStock} disabled={saving}>
                {saving && <FaSpinner className="so-spinning" />}
                <FaSave /> Create Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="so-header">
        <div className="so-header-left">
          <button onClick={() => navigate('/sales-order')} className="so-back-btn">
            <FaArrowLeft size={13} /> Back
          </button>
          <div className="so-header-divider" />
          <h1 className="so-header-title">
            {isEditMode ? 'Edit Sales Order' : 'Create Sales Order'}
          </h1>
        </div>
        <div className="so-header-right">
          <label className="so-checkbox-label">
            <input
              type="checkbox"
              name="isSubcontracted"
              checked={formData.isSubcontracted}
              onChange={handleInputChange}
              className="so-checkbox"
            />
            <span>Subcontracted</span>
          </label>
        </div>
      </div>

      {/* API Error Pill */}
      {apiError && (
        <div className="so-error-pill">
          <FaExclamationTriangle size={11} />
          {apiError}
        </div>
      )}

      {/* Main Box */}
      <div className="so-main-box">
        {/* ===== NEW: Quotation Toggle (GRN-style) ===== */}
        {!isEditMode && (
          <div className="so-invoice-type-section">
            <label className="so-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>
              Create From
            </label>
            <div className="so-radio-group">
              <label className="so-radio-label">
                <input
                  type="radio"
                  name="quotationSource"
                  value="with"
                  checked={hasQuotation === true}
                  onChange={() => setHasQuotation(true)}
                />
                With Quotation
              </label>
              <label className="so-radio-label">
                <input
                  type="radio"
                  name="quotationSource"
                  value="without"
                  checked={hasQuotation === false}
                  onChange={() => setHasQuotation(false)}
                />
                Without Quotation
              </label>
            </div>
          </div>
        )}

        {/* Two-Column Compact Layout */}
        <div className="so-compact-layout">
          {/* Left Column */}
          <div className="so-left-column">
            {/* Load from Quotation - Conditional */}
            {!isEditMode && hasQuotation && (
              <>
                <div className="so-section-header">
                  <FaFileImport className="so-section-icon" />
                  <span>Load from Quotation</span>
                </div>
                <div className="so-field">
                  <label className="so-label">Select Quotation</label>
                  <QuotationDropdown
                    value={selectedQuotation}
                    onChange={handleQuotationChange}
                    placeholder="Search or select quotation..."
                    disabled={loadingQuotations || applyingQuotation || loadingItemMaster}
                    error={!!errors.quotation}
                  />
                  {applyingQuotation && (
                    <span className="so-loading-text">
                      <FaSpinner className="so-spinning" size={10} /> Loading quotation details...
                    </span>
                  )}
                </div>
              </>
            )}

            {/* Basic Information */}
            <div className="so-section-header" style={{ marginTop: (!isEditMode && hasQuotation) ? '0.5rem' : '0' }}>
              <FaBox className="so-section-icon" />
              <span>Basic Information</span>
            </div>

            {/* Customer & Date in one row */}
            <div className="so-field-row">
              <div className="so-field-half">
                <label className="so-label"><FaUser size={11} style={{ marginRight: 4 }} />Customer <span className="so-required">*</span></label>
                <CustomerDropdown
                  value={formData.customer}
                  onChange={handleCustomerChange}
                  placeholder="Search Customer..."
                  disabled={loadingItemMaster}
                  error={!!errors.customer}
                  customerList={customers}
                  selectedCustomer={selectedCustomer}
                  onAddNew={handleAddNewCustomer}
                />
                {errors.customer && <span className="so-error-text">{errors.customer}</span>}
              </div>

              <div className="so-field-half">
                <label className="so-label">Date <span className="so-required">*</span></label>
                <div className="so-date-field">
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className={`so-input ${errors.date ? 'so-input-error' : ''}`}
                    ref={setRef('date')}
                  />
                  <button
                    type="button"
                    className="so-date-icon-btn"
                    onClick={() => openDatePicker('date')}
                    tabIndex={-1}
                  >
                    <FaCalendarAlt size={13} />
                  </button>
                </div>
                {errors.date && <span className="so-error-text">{errors.date}</span>}
              </div>
            </div>

            {/* Delivery Date and Status in grid-3 */}
            <div className="so-grid-3">
              <div className="so-field">
                <label className="so-label">Delivery Date <span className="so-required">*</span></label>
                <div className="so-date-field">
                  <input
                    type="date"
                    name="deliveryDate"
                    value={formData.deliveryDate}
                    onChange={handleInputChange}
                    className={`so-input ${errors.deliveryDate ? 'so-input-error' : ''}`}
                    ref={setRef('deliveryDate')}
                  />
                  <button
                    type="button"
                    className="so-date-icon-btn"
                    onClick={() => openDatePicker('deliveryDate')}
                    tabIndex={-1}
                  >
                    <FaCalendarAlt size={13} />
                  </button>
                </div>
                {errors.deliveryDate && <span className="so-error-text">{errors.deliveryDate}</span>}
              </div>

              <div className="so-field">
                <label className="so-label">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="so-select"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="so-field">
                <label className="so-label">Order Type</label>
                <select
                  name="orderType"
                  value={formData.orderType}
                  onChange={handleInputChange}
                  className="so-select"
                  ref={setRef('orderType')}
                >
                  <option value="Sales">Sales</option>
                  <option value="Credit Note">Credit Note</option>
                  <option value="Debit Note">Debit Note</option>
                  <option value="Quotation">Quotation</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Column - Customer Detail Card */}
          <div className="so-right-column">
            {customerData ? (
              <div className="so-detail-card">
                <div className="so-card-header">
                  <FaBuilding size={14} />
                  <span>Customer Details</span>
                </div>
                <div className="so-card-content">
                  <h3>{customerData.name}</h3>
                  <div className="so-card-info">
                    {customerData.code && (
                      <div className="so-info-item">
                        <span className="so-info-label">Code</span>
                        <span className="so-info-value">{customerData.code}</span>
                      </div>
                    )}
                    {customerData.contactPerson && (
                      <div className="so-info-item">
                        <span className="so-info-label">Contact</span>
                        <span className="so-info-value"><FaUser size={10} /> {customerData.contactPerson}</span>
                      </div>
                    )}
                    {customerData.phone && (
                      <div className="so-info-item">
                        <span className="so-info-label">Phone</span>
                        <span className="so-info-value"><FaPhone size={10} /> {customerData.phone}</span>
                      </div>
                    )}
                    {customerData.email && (
                      <div className="so-info-item">
                        <span className="so-info-label">Email</span>
                        <span className="so-info-value"><FaEnvelope size={10} /> {customerData.email}</span>
                      </div>
                    )}
                    {customerData.gstin && (
                      <div className="so-info-item">
                        <span className="so-info-label">GST</span>
                        <span className="so-info-value">{customerData.gstin}</span>
                      </div>
                    )}
                    {customerData.address && (
                      <div className="so-info-item">
                        <span className="so-info-label">Address</span>
                        <span className="so-info-value">{customerData.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="so-detail-card so-empty-card">
                <div className="so-card-header">
                  <FaBuilding size={14} />
                  <span>Customer Details</span>
                </div>
                <div className="so-card-content">
                  <div className="so-empty-state">
                    <FaInfoCircle size={24} />
                    <p>Select a customer to view details</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Full Width - Items Section */}
        <div className="so-items-full">
          <div className="so-items-header">
            <span className="so-items-title">
              <FaClipboardList className="so-items-icon" /> Products
            </span>
            <button type="button" className="so-add-btn" onClick={addItemRow}>
              <FaPlus size={9} /> Add
            </button>
          </div>

          {errors.items && <div className="so-items-error"><FaExclamationTriangle /> {errors.items}</div>}

          <div className="so-table-wrap">
            <table className="so-items-table">
              <thead>
                <tr>
                  <th className="so-col-sno">#</th>
                  <th className="so-col-code">Item Code <span className="so-required">*</span></th>
                  <th className="so-col-name">Item Name <span className="so-required">*</span></th>
                  <th className="so-col-hsn">HSN</th>
                  <th className="so-col-qty">Qty <span className="so-required">*</span></th>
                  <th className="so-col-uom">UOM</th>
                  <th className="so-col-rate">Rate</th>
                  <th className="so-col-tax">Tax</th>
                  <th className="so-col-amount">Amount</th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="so-col-sno">{index + 1}</td>
                    <td className="so-col-code">
                      <SearchableSelect
                        value={item.itemCode}
                        onChange={(value) => handleItemChange(index, 'itemCode', value)}
                        options={products}
                        placeholder="Search..."
                        onSearch={handleItemSearch}
                        loading={isLoadingItems}
                        error={!!errors[`item_${index}_code`]}
                        stockInfo={{ status: item.stockStatus, availableQty: item.availableQty }}
                      />
                    </td>
                    <td className="so-col-name">
                      <input
                        type="text"
                        value={item.itemName}
                        onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                        placeholder="Item Name"
                        className="so-table-input so-table-input-text"
                        ref={setItemRef(`item_${index}_itemName`)}
                      />
                    </td>
                    <td className="so-col-hsn">
                      <input
                        type="text"
                        value={item.hsn}
                        onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
                        placeholder="HSN"
                        className="so-table-input so-table-input-text"
                        ref={setItemRef(`item_${index}_hsn`)}
                      />
                    </td>
                    <td className="so-col-qty">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value) || 0)}
                        onWheel={preventWheelChange}
                        min="1"
                        className={`so-table-input ${errors[`item_${index}_quantity`] ? 'so-input-error' : ''}`}
                        ref={setItemRef(`item_${index}_quantity`)}
                      />
                    </td>
                    <td className="so-col-uom">
                      <select
                        value={item.stockUom}
                        onChange={(e) => handleItemChange(index, 'stockUom', e.target.value)}
                        className="so-table-input"
                        ref={setItemRef(`item_${index}_stockUom`)}
                      >
                        <option value="Nos">Nos</option>
                        <option value="Kg">Kg</option>
                        <option value="Ltr">Ltr</option>
                        <option value="Mtr">Mtr</option>
                        <option value="Pcs">Pcs</option>
                        <option value="Box">Box</option>
                      </select>
                    </td>
                    <td className="so-col-rate">
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value) || 0)}
                        onWheel={preventWheelChange}
                        min="0"
                        step="0.01"
                        className={`so-table-input ${errors[`item_${index}_rate`] ? 'so-input-error' : ''}`}
                        ref={setItemRef(`item_${index}_rate`)}
                      />
                    </td>
                    <td className="so-col-tax">
                      <select
                        value={item.tax_id ?? ''}
                        onChange={(e) => handleItemChange(index, 'tax_id', e.target.value)}
                        className="so-table-input"
                        ref={setItemRef(`item_${index}_tax`)}
                        disabled={loadingTaxOptions}
                      >
                        <option value="">0%</option>
                        {taxOptions.map((tax) => (
                          <option key={tax.tax_id} value={tax.tax_id}>
                            {tax.tax_type}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="so-col-amount">
                      <span className="so-table-value">₹{item.totalAmount.toFixed(2)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="so-bottom-section">
          {/* Left Column - Payment Schedule & Terms */}
          <div className="so-bottom-left">
            {/* Payment Schedule */}
            <div className="so-section-header">
              <FaCreditCard className="so-section-icon" />
              <span>Payment Schedule</span>
            </div>

            {/* Payment Terms Template Dropdown - MOVED HERE */}
            <div className="so-field" style={{ marginBottom: '0.5rem' }}>
              <div className="so-field-row" style={{ gridTemplateColumns: '1fr auto' }}>
                <select
                  value={formData.paymentTermsTemplate}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({ ...prev, paymentTermsTemplate: value }));
                    if (value) {
                      applyPaymentTemplate(value);
                    }
                  }}
                  className="so-select"
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
                  className="so-add-btn"
                  onClick={() => {
                    if (formData.paymentTermsTemplate) {
                      applyPaymentTemplate(formData.paymentTermsTemplate);
                    }
                  }}
                  style={{ whiteSpace: 'nowrap', padding: '5px 14px' }}
                >
                  <FaCopy size={9} /> Apply
                </button>
              </div>
            </div>

            <div className="so-payment-table-wrap">
              <table className="so-payment-table">
                <thead>
                  <tr>
                    <th className="so-payment-col-no">#</th>
                    <th className="so-payment-col-term">Payment Term</th>
                    <th className="so-payment-col-date">Due Date</th>
                    <th className="so-payment-col-duration">Days</th>
                    <th className="so-payment-col-portion">%</th>
                    <th className="so-payment-col-amount">Amount</th>
                    <th className="so-payment-col-action"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.paymentSchedule.map((schedule, index) => (
                    <tr key={schedule.id}>
                      <td className="so-payment-col-no">{index + 1}</td>
                      <td className="so-payment-col-term">
                        <input
                          type="text"
                          value={schedule.paymentTerm}
                          onChange={(e) => updatePaymentRow(index, { paymentTerm: e.target.value })}
                          placeholder="Term"
                          className="so-table-input so-table-input-text"
                        />
                      </td>
                      <td className="so-payment-col-date">
                        <div className="so-date-field">
                          <input
                            type="date"
                            value={schedule.dueDate}
                            onChange={(e) => handlePaymentDueDateChange(index, e.target.value)}
                            className="so-table-input"
                            ref={setRef(`payment_${index}_dueDate`)}
                          />
                          <button
                            type="button"
                            className="so-date-icon-btn"
                            onClick={() => openDatePicker(`payment_${index}_dueDate`)}
                            tabIndex={-1}
                          >
                            <FaCalendarAlt size={11} />
                          </button>
                        </div>
                      </td>
                      <td className="so-payment-col-duration">
                        <input
                          type="number"
                          value={schedule.durationDays}
                          onChange={(e) => handlePaymentDurationChange(index, Number(e.target.value))}
                          onWheel={preventWheelChange}
                          min="0"
                          className="so-table-input"
                        />
                      </td>
                      <td className="so-payment-col-portion">
                        <input
                          type="number"
                          value={schedule.invoicePortion}
                          onChange={(e) => updatePaymentRow(index, { invoicePortion: Number(e.target.value) })}
                          onWheel={preventWheelChange}
                          min="0"
                          max="100"
                          className="so-table-input"
                        />
                      </td>
                      <td className="so-payment-col-amount">
                        <span className="so-table-value">₹{schedule.paymentAmount.toFixed(2)}</span>
                      </td>
                      <td className="so-payment-col-action">
                        {formData.paymentSchedule.length > 1 && (
                          <button
                            type="button"
                            className="so-remove-btn"
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

            <button type="button" className="so-add-payment-btn" onClick={addPaymentSchedule}>
              <FaPlus size={9} /> Add Schedule
            </button>

            {/* Terms and Conditions */}
            <div className="so-section-header" style={{ marginTop: '1rem' }}>
              <FaFileAlt className="so-section-icon" />
              <span>Terms and Conditions</span>
            </div>
            <div className="so-field">
              <label className="so-label">Term Details</label>
              <textarea
                name="termDetails"
                value={formData.termDetails}
                onChange={handleInputChange}
                rows={3}
                placeholder="Enter terms and conditions..."
                className="so-textarea"
                ref={setRef('termDetails')}
              />
            </div>
          </div>

          {/* Right Column - Summary Card */}
          <div className="so-bottom-right">
            <div className="so-detail-card so-summary-card">
              <div className="so-card-header">
                <FaCalculator size={14} />
                <span>Financial Summary</span>
              </div>
              <div className="so-card-content">
                <div className="so-summary-grid">
                  <div className="so-summary-item">
                    <span className="so-summary-label">Total Qty</span>
                    <span className="so-summary-value">{formData.totalQuantity}</span>
                  </div>
                  <div className="so-summary-item">
                    <span className="so-summary-label">Base Total</span>
                    <span className="so-summary-value">₹{formData.baseTotal.toFixed(2)}</span>
                  </div>
                  <div className="so-summary-item">
                    <span className="so-summary-label">Tax</span>
                    <span className="so-summary-value">₹{formData.taxTotal.toFixed(2)}</span>
                  </div>
                  <div className="so-summary-grand">
                    <span className="so-summary-grand-label">Grand Total</span>
                    <span className="so-summary-grand-value">₹{formData.roundedTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="so-form-footer">
        <button type="button" className="so-btn so-btn-secondary" onClick={handleCancel}>
          <FaTimes size={11} /> Cancel
        </button>
        <button
          type="button"
          className="so-btn so-btn-submit"
          onClick={handleSubmit}
          disabled={saving || (isEditMode && loadingRecord)}
        >
          {saving && <FaSpinner className="so-spinning" />}
          <FaSave /> {isEditMode ? 'Update Sales Order' : 'Create Sales Order'}
        </button>
      </div>
    </div>
  );
}