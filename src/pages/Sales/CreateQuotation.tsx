import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  FaArrowLeft, FaSpinner, FaPlus,
  FaTrash, FaFileAlt,
  FaBarcode,
  FaTimes, FaExclamationTriangle, FaInfoCircle,
  FaUser, FaCreditCard, FaCalendarAlt,
  FaBuilding, FaPhone, FaEnvelope,
  FaClipboardList, FaCalculator, FaChevronDown,
  FaPrint, FaPaperPlane,
  FaCopy
} from 'react-icons/fa';
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import './CreateQuotation.css';
import toast from 'react-hot-toast';
import api from '../../services/api';

/* ─────────────────────────── Types ─────────────────────────── */

interface QuotationItem {
  id: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  rate: number;
  cgst: number; // percentage
  sgst: number; // percentage
  amount: number;
  hsn: string;
  description: string;
  unit: string;
  tax: number; // total tax percentage (cgst + sgst)
  taxAmount: number;
  totalAmount: number;
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

interface QuotationForm {
  isService: boolean;
  date: string;
  validTill: string;
  customer: string;
  customerName: string;
  status: string;
  items: QuotationItem[];
  totalQuantity: number;
  baseTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  grandTotal: number;
  roundedTotal: number;
  paymentTermsTemplate: string;
  paymentSchedule: PaymentScheduleRow[];
  tcName: string;
  termDetails: string;
  company: string;
}

interface ValidationError {
  field: string;
  label: string;
  message: string;
}

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
  customerType?: string;
  customerGroup?: string;
  territory?: string;
  contacts?: Array<{
    id: number;
    customer_id: number;
    first_name: string;
    last_name: string;
    contact_name: string;
    mobile_no: string;
    alternate_mobile: string;
    email_id: string;
    telephone: string;
    extension: string;
    is_primary: number;
    is_billing_contact: number;
    is_saler_contact: number;
    remarks: string;
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
  cgst_rate?: number;
  sgst_rate?: number;
}

interface TaxOption {
  tax_id: number;
  tax_type: string;
}

/** Shape returned by GET /quotation/:id (matches the POST/PUT /quotation payload). */
interface QuotationApiRecord {
  id?: number;
  name: string;
  naming_series?: string;
  party_name?: string;
  customer_name?: string;
  transaction_date?: string;
  valid_till?: string;
  status?: string;
  payment_terms_template?: string;
  tc_name?: string;
  terms?: string;
  grand_total?: number;
  total?: number;
  items?: Array<{
    item_code?: string;
    item_name?: string;
    qty?: number;
    rate?: number;
    cgst_rate?: number;
    sgst_rate?: number;
    amount?: number;
    hsn?: string;
    description?: string;
    uom?: string;
    item_tax_id?: number;
  }>;
  payment_schedule?: any[];
}

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

const QUOTATION_LINE_CACHE_PREFIX = 'quotation_line_data:';

interface CachedQuotationLineData {
  items?: QuotationItem[];
  paymentSchedule?: PaymentScheduleRow[];
}

const cacheQuotationLineData = (name: string, data: CachedQuotationLineData) => {
  try {
    localStorage.setItem(QUOTATION_LINE_CACHE_PREFIX + name, JSON.stringify(data));
  } catch {
    // ignore
  }
};

const readCachedQuotationLineData = (name: string): CachedQuotationLineData | null => {
  try {
    const raw = localStorage.getItem(QUOTATION_LINE_CACHE_PREFIX + name);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const QUOTATION_DRAFT_PREFIX = 'cq_quotation_draft:';

interface QuotationDraftPayload {
  formData: QuotationForm;
  recordName: string | null;
  recordId: number | null;
  customerData: Customer | null;
}
const extractRecords = (payload: any): any[] => {
  if (!payload) return [];
  const data = payload.success === 1 || payload.success === 0 ? payload.data : payload;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data)) return data;
  return [];
};


const blurOnWheel = (e: React.WheelEvent<HTMLInputElement>) => {
  (e.target as HTMLInputElement).blur();
};

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
  onChange: (value: string, itemData?: any) => void;
  options: Product[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  onSearch?: (searchTerm: string) => Promise<void>;
  loading?: boolean;
  taxOptions?: TaxOption[];
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

  const getTaxRate = (option: Product): number => {
    if (option.tax) return option.tax;
    if (option.cgst_rate && option.sgst_rate) return option.cgst_rate + option.sgst_rate;
    return 0;
  };

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
    const selected = options.find(opt => opt.itemCode === value);
    return selected ? `${selected.itemCode}` : '';
  };

  const menu = isOpen ? (
    <div
      ref={menuRef}
      className="cq-custom-scroll"
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
              {option.itemName} | HSN: {option.hsn || '-'} | Tax: {getTaxRate(option)}%
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
          className="cq-table-input"
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
          <FaSpinner className="cq-spinning" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-color, #2563eb)', fontSize: '11px' }} />
        ) : (
          <FaChevronDown style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary, #94a3b8)', fontSize: '11px', pointerEvents: 'none' }} />
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
      const response = await api.get('/customer', {
        params: {
          page: 1,
          limit: 50,
          search: search || undefined
        }
      });

      const payload = response.data;
      const records = extractRecords(payload);

      if (records.length > 0) {
        const mappedCustomers: Customer[] = records.map((cust: any) => {
          const contacts = cust.contacts || [];

          const contactsWithInfo = contacts.filter(
            (c: any) => c.mobile_no || c.email_id || c.contact_name || c.telephone
          );
          const bestContact =
            contactsWithInfo.find((c: any) => c.is_primary === 1) ||
            contactsWithInfo[0] ||
            contacts[0];

          return {
            id: cust.id?.toString() || cust.customer_id?.toString() || '',
            name: cust.customer_name || cust.name || '',
            code: cust.customer_code || cust.code || (cust.id != null ? `CUST-${cust.id}` : ''),
            email: cust.email_id || cust.email || bestContact?.email_id || '',
            phone: cust.mobile_no || cust.phone || bestContact?.mobile_no || bestContact?.telephone || '',
            address: cust.address || '',
            shippingAddress: cust.shipping_address || cust.address || '',
            gstin: cust.gstin || '',
            contactPerson: cust.contact_person || bestContact?.contact_name || '',
            contactMobile: cust.contact_mobile || bestContact?.mobile_no || cust.mobile_no || '',
            customerType: cust.customer_type || '',
            customerGroup: cust.customer_group || '',
            territory: cust.territory || '',
            contacts,
          };
        });
        setCustomers(mappedCustomers);
        setFilteredCustomers(mappedCustomers);
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
      style={{
        position: 'fixed',
        top: menuPos.top,
        left: menuPos.left,
        width: `${Math.max(menuPos.width, 230)}px`,
        background: 'var(--card-bg, #ffffff)',
        border: '0.5px solid var(--border-color, #e2e8f0)',
        borderRadius: '6px',
        boxShadow: '0 4px 16px var(--shadow-color, rgba(0,0,0,0.15))',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '360px',
        overflow: 'hidden'
      }}
    >
      <div
        className="cq-custom-scroll"
        style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          maxHeight: '260px'
        }}
      >
        {loading ? (
          <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary, #94a3b8)', fontSize: '12px' }}>
            <FaSpinner className="cq-spinning" style={{ display: 'inline-block', marginRight: '8px' }} /> Loading...
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
                {(customer.gstin || customer.customerType) && (
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary, #94a3b8)', background: 'var(--layout-bg, #f1f5f9)', padding: '2px 8px', borderRadius: '4px' }}>
                    {customer.gstin ? `GST: ${customer.gstin}` : customer.customerType}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '4px', fontSize: '11px', color: 'var(--text-secondary, #64748b)', flexWrap: 'wrap' }}>
                {customer.contactPerson && (
                  <span><FaUser size={10} style={{ marginRight: '4px' }} />{customer.contactPerson}</span>
                )}
                {customer.phone && (
                  <span><FaPhone size={10} style={{ marginRight: '4px' }} />{customer.phone}</span>
                )}
                {customer.email && (
                  <span><FaEnvelope size={10} style={{ marginRight: '4px' }} />{customer.email}</span>
                )}
                {customer.territory && (
                  <span>{customer.territory}</span>
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
          <FaSpinner className="cq-spinning" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-color, #2563eb)', fontSize: '12px' }} />
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
        customerType: apiData?.customer_type || payload.customer_type,
        customerGroup: apiData?.customer_group || payload.customer_group,
        territory: apiData?.territory || '',
        contacts: apiData?.contacts || (payload.contacts as any),
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
                {submitting && <FaSpinner className="cq-spinning" size={11} />}
                Add Customer
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─────────────────────────── Main Component ─────────────────────────── */

export default function CreateQuotation() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const isEditMode = !!id && id !== 'new';

  // ===== ADD CUSTOMER FLOW: stable per-record key for the draft this

  const getDraftStorageKey = () => `${QUOTATION_DRAFT_PREFIX}${id || 'new'}`;

  let theme = 'light';
  try {
    const context = useAdminTheme();
    theme = context.theme;
  } catch (error) {
    console.log('Using default light theme');
  }

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [focusedField,] = useState<string | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scanBarcode, setScanBarcode] = useState('');
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  const [recordName, setRecordName] = useState<string | null>(null);
  const [recordId, setRecordId] = useState<number | null>(null);

  // ─── Customer state ────────────────────────────────────────────
  const [, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerData, setCustomerData] = useState<Customer | null>(null);

  // ─── Quick Add Customer modal state ─────────────────────────────
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickAddPrefillName, setQuickAddPrefillName] = useState('');

  // ─── Item lookup ────────────────────────────────────────────────
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [taxOptions, setTaxOptions] = useState<TaxOption[]>([]);
  const [loadingTaxOptions, setLoadingTaxOptions] = useState(false);

  const [taxOptionsLoaded, setTaxOptionsLoaded] = useState(false);
  const [recordFetched, setRecordFetched] = useState(false);

  const statusOptions = ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Converted'];

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

  const defaultFormData = (): QuotationForm => ({
    isService: false,
    date: new Date().toISOString().split('T')[0],
    validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    customer: '',
    customerName: '',
    status: 'Draft',
    items: [
      { id: '1', itemCode: '', itemName: '', quantity: 1, rate: 0, cgst: 0, sgst: 0, amount: 0, hsn: '', description: '', unit: 'pcs', tax: 0, taxAmount: 0, totalAmount: 0 }
    ],
    totalQuantity: 0,
    baseTotal: 0,
    cgstTotal: 0,
    sgstTotal: 0,
    grandTotal: 0,
    roundedTotal: 0,
    paymentTermsTemplate: 'on_delivery',
    paymentSchedule: [
      { id: '1', paymentTerm: 'On Delivery', dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], durationDays: 30, invoicePortion: 100, paymentAmount: 0, paidAmount: 0, status: 'Pending' }
    ],
    tcName: '',
    termDetails: '',
    company: 'ChandraTara Industries'
  });

  const [formData, setFormData] = useState<QuotationForm>(defaultFormData());

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

  // ─── Get today's date for validation ────────────────────────────
  const getTodayDate = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // ─── Fetch Tax Options ──────────────────────────────────────────
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
    } catch (error) {
      console.error('Error fetching tax options:', error);
      setTaxOptions([]);
    } finally {
      setLoadingTaxOptions(false);
      setTaxOptionsLoaded(true);
    }
  };

  const extractTaxValue = (taxType: string): number => {
    if (!taxType) return 0;
    const match = taxType.match(/(\d+)/);
    return match ? parseInt(match[0], 10) : 0;
  };

  // ─── Fetch Items ──────────────────────────────────────────────
  const fetchAllItems = async () => {
    setIsLoadingItems(true);
    try {
      // const typeFilter = formData.isService ? 'service' : 'item';
      const response = await api.get(`/item?type=product&page=1&limit=100`);
      const records = extractRecords(response.data);
      const mappedProducts: Product[] = records.map((item: any) => ({
        id: item.id?.toString() || item.name || '',
        itemCode: item.item_code || item.name || '',
        itemName: item.item_name || '',
        hsn: item.HSN || item.hsn || '',
        description: item.description || item.item_name || '',
        unit: item.stock_uom || 'pcs',
        rate: item.selling_price || item.rate || 0,
        tax: item.gst_rate || item.tax_rate || 0,
        type: formData.isService ? 'service' : 'product',
        stockUom: item.stock_uom,
        standardRate: item.standard_rate,
        cgst_rate: item.cgst_rate || item.cgst || 0,
        sgst_rate: item.sgst_rate || item.sgst || 0,
      }));
      setAllProducts(mappedProducts);
      setProducts(mappedProducts);
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

    // const typeFilter = formData.isService ? 'service' : 'item';
    try {
      const response = await api.get(`/item?type=product&page=1&limit=50&search=${encodeURIComponent(searchTerm)}`);
      const records = extractRecords(response.data);
      const mappedProducts: Product[] = records.map((item: any) => ({
        id: item.id?.toString() || item.name || '',
        itemCode: item.item_code || item.name || '',
        itemName: item.item_name || '',
        hsn: item.HSN || item.hsn || '',
        description: item.description || item.item_name || '',
        unit: item.stock_uom || 'pcs',
        rate: item.selling_price || item.rate || 0,
        tax: item.gst_rate || item.tax_rate || 0,
        type: formData.isService ? 'service' : 'product',
        stockUom: item.stock_uom,
        standardRate: item.standard_rate,
        cgst_rate: item.cgst_rate || item.cgst || 0,
        sgst_rate: item.sgst_rate || item.sgst || 0,
      }));
      setProducts(mappedProducts);
    } catch (error) {
      console.error('Search error:', error);
    }
  }, [allProducts, formData.isService]);


  useEffect(() => {
    fetchTaxOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAllItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.isService]);


  useEffect(() => {
    const draftKey = getDraftStorageKey();
    try {
      const raw = sessionStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw) as QuotationDraftPayload;
        if (draft.formData) {
          setFormData(prev => ({ ...prev, ...draft.formData }));
        }
        if (draft.recordName) setRecordName(draft.recordName);
        if (draft.recordId != null) setRecordId(draft.recordId);
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
      console.error('Failed to restore quotation draft:', e);
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

      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Handle Customer Change ────────────────────────────────────
  const handleCustomerChange = (customerId: string, customerData?: Customer) => {
    if (customerId && customerData) {
      setSelectedCustomer(customerData);
      setCustomerData(customerData);
      setFormData((prev) => ({
        ...prev,
        customer: customerId,
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

  // ===== ADD CUSTOMER FLOW: instead of navigating straight to the full

  const handleAddNewCustomer = (prefillName: string) => {
    setQuickAddPrefillName(prefillName || '');
    setShowQuickAddModal(true);
  };

  const navigateToFullCustomerForm = (prefillName: string) => {
    try {
      const draftPayload: QuotationDraftPayload = {
        formData,
        recordName,
        recordId,
        customerData,
      };
      sessionStorage.setItem(getDraftStorageKey(), JSON.stringify(draftPayload));
    } catch (e) {
      console.error('Failed to save quotation draft before navigating to Add Customer:', e);
    }

    navigate('/customer/add', {
      state: {
        returnTo: location.pathname,
        prefillCustomerName: prefillName || '',
      },
    });
  };

  // ─── Handle IsService Change ──────────────────────────────────
  const handleIsServiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.checked;

    setFormData((prev) => ({
      ...prev,
      isService: value,
      items: [
        { id: '1', itemCode: '', itemName: '', quantity: 1, rate: 0, cgst: 0, sgst: 0, amount: 0, hsn: '', description: '', unit: 'pcs', tax: 0, taxAmount: 0, totalAmount: 0 }
      ],
      totalQuantity: 0,
      baseTotal: 0,
      cgstTotal: 0,
      sgstTotal: 0,
      grandTotal: 0,
      roundedTotal: 0
    }));

    setProducts([]);
    setAllProducts([]);
    fetchAllItems();

    toast.success(value ? 'Switched to Services' : 'Switched to Items');
  };

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

  // ─── load existing quotation when editing ────────────────────────


  useEffect(() => {
    if (isEditMode && id && taxOptionsLoaded && !recordFetched) {
      fetchQuotationById(id);
    }
  }, [id, taxOptionsLoaded, recordFetched]);

  const QUOTATION_PAGE_SIZE = 50;

  const findQuotationRecord = async (quotationId: string): Promise<QuotationApiRecord | null> => {
    const MAX_PAGES = 50;
    let page = 1;

    while (page <= MAX_PAGES) {
      const response = await api.get("/quotation");
      const payload = response.data;
      if (payload && payload.success === 0) return null;

      const data = payload && payload.success === 1 ? payload.data : payload;
      const records: any[] = Array.isArray(data?.records)
        ? data.records
        : Array.isArray(data)
          ? data
          : [];

      // Try to find by numeric id first, then by name
      const found = records.find(
        (r) => r && (String(r.id) === String(quotationId) || r.name === quotationId)
      );
      if (found) return found;

      const total = data?.total ?? records.length;
      const fetchedSoFar = page * QUOTATION_PAGE_SIZE;
      if (records.length === 0 || fetchedSoFar >= total) {
        return null;
      }
      page += 1;
    }
    return null;
  };

  const fetchQuotationById = async (quotationId: string) => {
    setLoadingRecord(true);
    setApiError(null);
    try {
      const record = await findQuotationRecord(quotationId);
      if (record) {
        loadQuotationIntoForm(record);
        setRecordFetched(true);
      } else {
        setApiError('Quotation not found');
      }
    } catch (err: any) {
      console.error('Error fetching quotation:', err);
      setApiError(err.response?.data?.message || 'Failed to load quotation');
    } finally {
      setLoadingRecord(false);
    }
  };

  const loadQuotationIntoForm = (record: QuotationApiRecord) => {
    setRecordName(record.name ?? null);
    setRecordId(record.id ?? null);

    const cached = readCachedQuotationLineData(record.name);

    const items: QuotationItem[] =
      Array.isArray(record.items) && record.items.length > 0
        ? record.items.map((it, idx) => {
          const quantity = it.qty ?? 0;
          const rate = it.rate ?? 0;
          // If item_tax_id exists, get tax rate from it, otherwise use cgst_rate + sgst_rate
          let cgst = it.cgst_rate ?? 0;
          let sgst = it.sgst_rate ?? 0;
          let tax = cgst + sgst;


          if (it.item_tax_id) {
            const taxOption = taxOptions.find(t => t.tax_id === it.item_tax_id);
            if (taxOption) {
              const taxRate = extractTaxValue(taxOption.tax_type);
              tax = taxRate;
              cgst = taxRate / 2;
              sgst = taxRate / 2;
            }
          }

          const amount = it.amount ?? quantity * rate;
          const taxAmount = (amount * tax) / 100;
          return {
            id: String(idx + 1),
            itemCode: it.item_code || '',
            itemName: it.item_name || '',
            quantity,
            rate,
            cgst,
            sgst,
            amount,
            hsn: it.hsn || '',
            description: it.description || '',
            unit: it.uom || 'pcs',
            tax,
            taxAmount,
            totalAmount: amount + taxAmount,
          };
        })
        : cached?.items && cached.items.length > 0
          ? cached.items
          : [{ id: '1', itemCode: '', itemName: '', quantity: 1, rate: 0, cgst: 0, sgst: 0, amount: 0, hsn: '', description: '', unit: 'pcs', tax: 0, taxAmount: 0, totalAmount: 0 }];

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
          dueDate: unwrapDate(record.valid_till) || unwrapDate(record.transaction_date),
          durationDays: daysBetween(unwrapDate(record.transaction_date), unwrapDate(record.valid_till)),
          invoicePortion: 100,
          paymentAmount: record.grand_total ?? record.total ?? 0,
          paidAmount: 0,
          status: 'Pending',
        }];
      }
    }

    let isService = false;
    if (record.naming_series) {
      if (record.naming_series.includes('SVC')) {
        isService = true;
      } else if (record.naming_series.includes('SAL')) {
        isService = false;
      }
    }

    setFormData((prev) => ({
      ...prev,
      isService: isService,
      customer: record.party_name || prev.customer,
      customerName: record.customer_name || prev.customerName,
      date: unwrapDate(record.transaction_date) || prev.date,
      validTill: unwrapDate(record.valid_till) || prev.validTill,
      status: record.status || prev.status,
      paymentTermsTemplate: record.payment_terms_template || prev.paymentTermsTemplate,
      tcName: record.tc_name || prev.tcName,
      termDetails: record.terms || prev.termDetails,
      items,
      paymentSchedule: paymentSchedule.length > 0 ? paymentSchedule : prev.paymentSchedule,
    }));

    if (record.party_name) {
      setCustomerData({
        id: record.party_name,
        name: record.customer_name || record.party_name,
        code: '',
        email: '',
        phone: '',
        address: '',
        shippingAddress: '',
        gstin: '',
        contacts: [],
      });
    }
  };

  /* ─── validation ─────────────────────────────────────────────── */

  const getAllValidationErrors = (): ValidationError[] => {
    const allErrors: ValidationError[] = [];

    if (!formData.customer.trim())
      allErrors.push({ field: 'customer', label: 'Customer', message: 'Customer is required' });
    if (!formData.date)
      allErrors.push({ field: 'date', label: 'Date', message: 'Date is required' });
    if (!formData.validTill)
      allErrors.push({ field: 'validTill', label: 'Valid Till', message: 'Valid till date is required' });

    // ─── Validate Valid Till is not in the past ──────────────────
    if (formData.validTill) {
      const selectedDate = new Date(formData.validTill);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        allErrors.push({ field: 'validTill', label: 'Valid Till', message: 'Valid Till date cannot be in the past. Please select today or a future date.' });
      }
    }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.items.length, showBarcodeScanner]);

  useEffect(() => {
    calculateTotals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.items]);

  const calculateTotals = () => {
    const totalQty = formData.items.reduce((sum, item) => sum + item.quantity, 0);
    const baseTotal = formData.items.reduce((sum, item) => sum + item.amount, 0);
    const cgstTotal = formData.items.reduce((sum, item) => sum + (item.amount * (item.cgst || 0)) / 100, 0);
    const sgstTotal = formData.items.reduce((sum, item) => sum + (item.amount * (item.sgst || 0)) / 100, 0);
    const grandTotal = baseTotal + cgstTotal + sgstTotal;
    const roundedTotal = Math.round(grandTotal);

    setFormData(prev => ({
      ...prev,
      totalQuantity: totalQty,
      baseTotal,
      cgstTotal,
      sgstTotal,
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
    const { name, value } = e.target;
    
    // ─── Validate Valid Till date ──────────────────────────────────
    if (name === 'validTill') {
      if (value) {
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
          setErrors(prev => ({ ...prev, validTill: 'Valid Till date cannot be in the past. Please select today or a future date.' }));
        } else {
          setErrors(prev => ({ ...prev, validTill: '' }));
        }
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleItemChange = (index: number, field: keyof QuotationItem, value: string | number) => {
    const updatedItems = [...formData.items];

    if (field === 'tax') {
      const taxRate = Number(value);
      const half = taxRate / 2;
      updatedItems[index] = {
        ...updatedItems[index],
        tax: taxRate,
        cgst: half,
        sgst: half,
      };

      // Recalculate taxAmount and totalAmount
      const amount = updatedItems[index].amount;
      const taxAmount = (amount * taxRate) / 100;
      updatedItems[index].taxAmount = taxAmount;
      updatedItems[index].totalAmount = amount + taxAmount;
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value
      };
    }

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

    if (field === 'cgst' || field === 'sgst') {
      const amount = updatedItems[index].amount;
      const tax = updatedItems[index].cgst + updatedItems[index].sgst;
      const taxAmount = (amount * tax) / 100;
      updatedItems[index].tax = tax;
      updatedItems[index].taxAmount = taxAmount;
      updatedItems[index].totalAmount = amount + taxAmount;
    }

    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const handleItemSelect = (index: number, itemCode: string, record?: Product) => {
    if (record) {
      const updatedItems = [...formData.items];
      const quantity = updatedItems[index].quantity || 1;
      const rate = record.rate || 0;
      const cgst = record.cgst_rate || 0;
      const sgst = record.sgst_rate || 0;
      const tax = cgst + sgst;
      const amount = quantity * rate;
      const taxAmount = (amount * tax) / 100;

      updatedItems[index] = {
        ...updatedItems[index],
        itemCode: itemCode,
        itemName: record.itemName || '',
        rate: rate,
        cgst: cgst,
        sgst: sgst,
        tax: tax,
        amount: amount,
        hsn: record.hsn || '',
        description: record.description || '',
        unit: record.unit || 'pcs',
        taxAmount: taxAmount,
        totalAmount: amount + taxAmount,
      };
      setFormData(prev => ({ ...prev, items: updatedItems }));
    }
  };

  const handleItemKeyDown = (e: React.KeyboardEvent, index: number, field: keyof QuotationItem) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      const fields: (keyof QuotationItem)[] = ['itemCode', 'itemName', 'hsn', 'description', 'quantity', 'rate', 'tax'];
      const currentIndex = fields.indexOf(field);

      if (currentIndex === fields.length - 1) {
        if (formData.items[index].rate > 0 && formData.items[index].itemCode) {
          addItemRow();
          setTimeout(() => {
            const newIndex = index + 1;
            const refKey = `item_${newIndex}_itemCode`;
            if (itemInputRefs.current[refKey]) {
              itemInputRefs.current[refKey]?.focus();
            }
          }, 100);
        }
      } else {
        const nextField = fields[currentIndex + 1];
        const refKey = `item_${index}_${nextField}`;
        if (itemInputRefs.current[refKey]) {
          itemInputRefs.current[refKey]?.focus();
        }
      }
    }
  };

  const addItemRow = () => {
    const newId = String(formData.items.length + 1);
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { id: newId, itemCode: '', itemName: '', quantity: 1, rate: 0, cgst: 0, sgst: 0, amount: 0, hsn: '', description: '', unit: 'pcs', tax: 0, taxAmount: 0, totalAmount: 0 }
      ]
    }));
  };

  const removeItemRow = (index: number) => {
    if (formData.items.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  /* ─── payment schedule ───────────────────────────────────────── */

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

  /* ─── submit ─────────────────────────────────────────────────── */

  const validateForm = (): boolean => {
    const allErrors = getAllValidationErrors();
    if (allErrors.length > 0) {
      setValidationErrors(allErrors);
      setShowValidationSummary(true);
      return false;
    }
    return true;
  };

  const generateQuotationName = (): string => {
    const year = new Date().getFullYear();
    const prefix = formData.isService ? 'SVC-QTN' : 'SAL-QTN';
    const suffix = Date.now().toString(36).toUpperCase().slice(-6);
    return `${prefix}-${year}-${suffix}`;
  };

  const formatDate = (date: string) => {
    if (!date) return "";
    return date.split("T")[0];
  };

  const buildApiPayload = () => {
    // Find the tax_id for the selected tax rate
    const getTaxIdFromRate = (taxRate: number): number | null => {
      if (taxRate === 0) return null;
      const taxOption = taxOptions.find(t => extractTaxValue(t.tax_type) === taxRate);
      return taxOption ? taxOption.tax_id : null;
    };

    const payload: any = {};

    // ✅ Add id first for edit mode
    if (isEditMode && recordId) {
      payload.id = recordId;
    }

    payload.name = isEditMode && recordName ? recordName : generateQuotationName();
    payload.naming_series = formData.isService ? 'SVC-QTN-.YYYY.-' : 'SAL-QTN-.YYYY.-';
    payload.type = formData.isService ? 'service' : 'item';
    payload.party_name = formData.customer;
    payload.customer_name = formData.customerName;
    payload.transaction_date = formatDate(formData.date);
    payload.valid_till = formatDate(formData.validTill);
    payload.currency = 'INR';
    payload.conversion_rate = 1;
    payload.selling_price_list = 'Standard Selling';
    payload.total_qty = formData.totalQuantity;
    payload.base_total = formData.baseTotal;
    payload.base_net_total = formData.baseTotal;
    payload.total = formData.baseTotal;
    payload.net_total = formData.baseTotal;
    payload.total_taxes_and_charges = formData.cgstTotal + formData.sgstTotal;
    payload.base_grand_total = formData.grandTotal;
    payload.grand_total = formData.grandTotal;
    payload.rounded_total = formData.roundedTotal;
    payload.base_rounded_total = formData.roundedTotal;
    payload.in_words = `INR ${formData.roundedTotal} Only`;
    payload.base_in_words = `INR ${formData.roundedTotal} Only`;
    payload.status = formData.status;
    payload.title = `Quotation for ${formData.customerName}`;
    payload.payment_terms_template = formData.paymentTermsTemplate;
    payload.tc_name = formData.tcName;
    payload.terms = formData.termDetails;

    payload.items = formData.items
      .filter((item) => item.itemCode || item.itemName)
      .map((item) => {
        const itemTaxId = getTaxIdFromRate(item.tax);
        const itemObj: any = {
          item_code: item.itemCode,
          item_name: item.itemName,
          qty: item.quantity,
          rate: item.rate,
          amount: item.amount,
          hsn: item.hsn || '',
          description: item.description || '',
          uom: item.unit || 'Number',
        };
        // Only add item_tax_id if it exists (not null)
        if (itemTaxId !== null) {
          itemObj.item_tax_id = itemTaxId;
        }
        return itemObj;
      });

    payload.payment_schedule = formData.paymentSchedule.map((p) => ({
      payment_term: p.paymentTerm,
      due_date: p.dueDate,
      due_days: p.durationDays,
      invoice_portion: p.invoicePortion,
      payment_amount: p.paymentAmount,
      paid_amount: p.paidAmount || 0,
      status: p.status || 'Pending',
    }));

    return payload;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setSaving(true);
    setApiError(null);

    try {
      const payload = buildApiPayload();

      console.log('Saving quotation with payload:', payload);

      let response;
      if (isEditMode && recordName) {
        response = await api.put('/quotation', payload);
      } else {
        response = await api.post('/quotation', payload);
      }

      console.log('Quotation save response:', response.data);

      if (response.data.success !== 1) {
        throw new Error(response.data?.message || 'Failed to save quotation');
      }

      cacheQuotationLineData(payload.name, {
        items: formData.items,
        paymentSchedule: formData.paymentSchedule,
      });

      toast.success(isEditMode ? 'Quotation updated successfully!' : 'Quotation created successfully!');
      navigate('/quotation');
    } catch (error: any) {
      console.error('Error saving quotation:', error);
      let message = 'Failed to save quotation';
      if (error.response) {
        message = error.response.data?.message || `Server error: ${error.response.status}`;
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

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All unsaved data will be lost.')) {
      navigate('/quotation');
    }
  };

  const allValidationErrors = getAllValidationErrors();
  const hasAnyErrors = allValidationErrors.length > 0;

  const getTotalQty = () => formData.items.reduce((sum, item) => sum + item.quantity, 0);
  const getTotalAmount = () => formData.items.reduce((sum, item) => sum + item.amount, 0);
  const getTotalTax = () => formData.items.reduce((sum, item) => sum + item.taxAmount, 0);
  const getGrandTotal = () => formData.items.reduce((sum, item) => sum + item.totalAmount, 0);

  return (
    <div className={`cq-page ${theme}-theme`}>
      {/* Validation Summary Modal */}
      {showValidationSummary && validationErrors.length > 0 && (
        <div className="cq-modal-overlay" onClick={() => setShowValidationSummary(false)}>
          <div className="cq-validation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cq-modal-header cq-modal-header-warning">
              <h2 className="cq-modal-title-warning">
                <FaExclamationTriangle /> Missing Required Fields
              </h2>
              <button className="cq-modal-close" onClick={() => setShowValidationSummary(false)}>×</button>
            </div>
            <div className="cq-modal-body">
              <p className="cq-modal-intro">
                Please fill in the following required fields before submitting:
              </p>
              <div className="cq-error-list">
                {validationErrors.map((error, idx) => (
                  <div key={idx} className="cq-validation-error-item" onClick={() => jumpToField(error.field)}>
                    <div className="cq-error-header">
                      <FaTimes className="cq-error-icon" />
                      <strong className="cq-error-label">{error.label}</strong>
                    </div>
                    <div className="cq-error-message">{error.message}</div>
                  </div>
                ))}
              </div>
              <div className="cq-hint-banner">
                <FaInfoCircle className="cq-hint-icon" />
                Click on any error to jump to that field
              </div>
            </div>
            <div className="cq-modal-footer">
              <button className="cq-btn-cancel" onClick={() => setShowValidationSummary(false)}>Close</button>
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
      <div className="cq-header">
        <div className="cq-header-left">
          <button
            type="button"
            className="cq-back-btn"
            onClick={() => navigate("/quotation")}
          >
            <FaArrowLeft size={13} /> Back
          </button>
          <div className="cq-header-divider" />
          <h1 className="cq-header-title">
            {isEditMode ? 'Edit Quotation' : 'Create Quotation'}
          </h1>
          {isEditMode && id && (
            <span className="cq-header-id">#{id}</span>
          )}
        </div>
        <div className="cq-header-right">
          <label className="cq-checkbox-label">
            <input
              type="checkbox"
              checked={formData.isService}
              onChange={handleIsServiceChange}
              className="cq-checkbox"
            />
            <span>IsService</span>
          </label>
          {apiError && (
            <span className="cq-error-pill">
              <FaExclamationTriangle size={11} />
              {apiError}
            </span>
          )}
          {hasAnyErrors && (
            <span className="cq-error-pill">
              <FaExclamationTriangle size={11} />
              {allValidationErrors.length} issue{allValidationErrors.length > 1 ? "s" : ""}
            </span>
          )}
          {loadingRecord && (
            <span className="cq-loading-pill">
              <FaSpinner className="cq-spinning" size={11} />
              Loading...
            </span>
          )}
        </div>
      </div>

      {/* Main Box */}
      <div className="cq-main-box">
        <form onSubmit={handleSubmit} className="cq-form">
          {/* ── TWO COLUMN LAYOUT ────────────────────────────── */}
          <div className="cq-compact-layout">
            {/* LEFT COLUMN */}
            <div className="cq-left-column">
              {/* Customer & Status in one row */}
              <div className="cq-section-header">
                <FaBuilding className="cq-section-icon" />
                <span>Customer &amp; Status</span>
              </div>

              <div className="cq-field-row">
                <div className="cq-field-half">
                  <label className="cq-label">
                    Customer <span className="cq-required">*</span>
                  </label>
                  <CustomerDropdown
                    value={formData.customer}
                    onChange={handleCustomerChange}
                    placeholder="Search Customer..."
                    disabled={isEditMode}
                    error={!!errors.customer}
                    presetCustomer={customerData}
                    onAddNew={handleAddNewCustomer}
                  />
                  {errors.customer && <span className="cq-error-text">{errors.customer}</span>}
                </div>

                <div className="cq-field-half">
                  <label className="cq-label">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="cq-select"
                    ref={setRef('status')}
                  >
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Quotation Details - Date fields in a single row with decreased length */}
              <div className="cq-section-header" style={{ marginTop: '12px' }}>
                <FaFileAlt className="cq-section-icon" />
                <span>Quotation Details</span>
              </div>

              {/* ─── DATE ROW - Two date fields in same row ─── */}
              <div className="cq-date-row">
                <div className="cq-date-field-small">
                  <label className="cq-label">
                    Date <span className="cq-required">*</span>
                  </label>
                  <div className="cq-date-wrapper">
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className={`cq-input-date ${errors.date ? 'cq-input-error' : ''}`}
                      ref={setRef('date')}
                    />
                    <button
                      type="button"
                      className="cq-date-icon-btn-small"
                      onClick={() => openDatePicker('date')}
                      tabIndex={-1}
                      aria-label="Open calendar"
                    >
                      <FaCalendarAlt size={12} />
                    </button>
                  </div>
                  {errors.date && <span className="cq-error-text">{errors.date}</span>}
                </div>

                <div className="cq-date-field-small">
                  <label className="cq-label">
                    Valid Till <span className="cq-required">*</span>
                  </label>
                  <div className="cq-date-wrapper">
                    <input
                      type="date"
                      name="validTill"
                      value={formData.validTill}
                      onChange={handleInputChange}
                      min={getTodayDate()}
                      className={`cq-input-date ${errors.validTill ? 'cq-input-error' : ''}`}
                      ref={setRef('validTill')}
                    />
                    <button
                      type="button"
                      className="cq-date-icon-btn-small"
                      onClick={() => openDatePicker('validTill')}
                      tabIndex={-1}
                      aria-label="Open calendar"
                    >
                      <FaCalendarAlt size={12} />
                    </button>
                  </div>
                  {errors.validTill && <span className="cq-error-text">{errors.validTill}</span>}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - Customer Details */}
            <div className="cq-right-column">
              {customerData ? (
                <div className="cq-detail-card">
                  <div className="cq-card-header">
                    <FaBuilding size={14} />
                    <span>Customer Details</span>
                  </div>
                  <div className="cq-card-content">
                    <h3>{customerData.name}</h3>
                    <div className="cq-card-info">
                      {customerData.contactPerson && (
                        <div className="cq-info-item">
                          <span className="cq-info-label">Contact</span>
                          <span className="cq-info-value"><FaUser size={10} /> {customerData.contactPerson}</span>
                        </div>
                      )}
                      {customerData.phone && (
                        <div className="cq-info-item">
                          <span className="cq-info-label">Phone</span>
                          <span className="cq-info-value"><FaPhone size={10} /> {customerData.phone}</span>
                        </div>
                      )}
                      {customerData.email && (
                        <div className="cq-info-item">
                          <span className="cq-info-label">Email</span>
                          <span className="cq-info-value"><FaEnvelope size={10} /> {customerData.email}</span>
                        </div>
                      )}
                      {customerData.gstin && (
                        <div className="cq-info-item">
                          <span className="cq-info-label">GST</span>
                          <span className="cq-info-value">{customerData.gstin}</span>
                        </div>
                      )}
                      {customerData.address && (
                        <div className="cq-info-item">
                          <span className="cq-info-label">Address</span>
                          <span className="cq-info-value">{customerData.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="cq-detail-card cq-empty-card">
                  <div className="cq-card-header">
                    <FaBuilding size={14} />
                    <span>Customer Details</span>
                  </div>
                  <div className="cq-card-content">
                    <div className="cq-empty-state">
                      <FaInfoCircle size={24} />
                      <p>Select a customer to view details</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── FULL WIDTH - ITEMS SECTION (DC Style Table) ── */}
          <div className="cq-items-full">
            <div className="cq-items-header">
              <span className="cq-items-title">
                <FaClipboardList className="cq-items-icon" /> {formData.isService ? 'Services' : 'Items'}
              </span>
              <div className="cq-section-actions">
                <button
                  type="button"
                  className="cq-barcode-btn"
                  onClick={() => setShowBarcodeScanner(!showBarcodeScanner)}
                  title="Ctrl+B"
                >
                  <FaBarcode size={13} /> Scan
                </button>
                <button type="button" className="cq-add-btn" onClick={addItemRow}>
                  <FaPlus size={9} /> Add
                </button>
              </div>
            </div>

            {showBarcodeScanner && (
              <div className="cq-barcode-scanner">
                <input
                  type="text"
                  placeholder="Scan or enter barcode..."
                  value={scanBarcode}
                  onChange={(e) => setScanBarcode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && toast.success(`Item ${scanBarcode} added`)}
                  autoFocus
                />
                <button onClick={() => setShowBarcodeScanner(false)}>
                  <FaTimes size={14} />
                </button>
              </div>
            )}

            {errors.items && <div className="cq-items-error"><FaExclamationTriangle /> {errors.items}</div>}

            <div className="cq-table-wrap">
              <table className="cq-items-table">
                <thead>
                  <tr>
                    <th className="cq-col-sno">#</th>
                    <th className="cq-col-code">Item Code <span className="cq-required">*</span></th>
                    <th className="cq-col-name">Item Name</th>
                    <th className="cq-col-hsn">HSN</th>
                    <th className="cq-col-qty">Qty <span className="cq-required">*</span></th>
                    <th className="cq-col-unit">UOM</th>
                    <th className="cq-col-rate">Rate</th>
                    <th className="cq-col-tax">Tax</th>
                    <th className="cq-col-tax-amount" style={{ textAlign: 'right' }}>Tax Amt</th>
                    <th className="cq-col-amount" style={{ textAlign: 'right' }}>Amount</th>
                    <th className="cq-col-action"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={item.id} className={focusedField === `item_${index}` ? 'cq-focused-row' : ''}>
                      <td className="cq-col-sno">{index + 1}</td>
                      <td className="cq-col-code">
                        <SearchableSelect
                          value={item.itemCode}
                          onChange={(code, record) => handleItemSelect(index, code, record)}
                          options={products}
                          placeholder="Search..."
                          onSearch={handleItemSearch}
                          loading={isLoadingItems}
                          error={!!errors[`item_${index}_code`]}
                          taxOptions={taxOptions}
                        />
                        {errors[`item_${index}_code`] && <span className="cq-error-text">{errors[`item_${index}_code`]}</span>}
                      </td>
                      <td className="cq-col-name">
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                          placeholder="Item Name"
                          className="cq-table-input cq-table-input-text"
                          ref={setItemRef(`item_${index}_itemName`)}
                          onKeyDown={(e) => handleItemKeyDown(e, index, 'itemName')}
                        />
                      </td>
                      <td className="cq-col-hsn">
                        <input
                          type="text"
                          value={item.hsn}
                          onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
                          placeholder="HSN"
                          className="cq-table-input cq-table-input-text"
                          ref={setItemRef(`item_${index}_hsn`)}
                          onKeyDown={(e) => handleItemKeyDown(e, index, 'hsn')}
                        />
                      </td>
                      <td className="cq-col-qty">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                          onWheel={blurOnWheel}
                          min="1"
                          className={`cq-table-input ${errors[`item_${index}_quantity`] ? 'cq-input-error' : ''}`}
                          ref={setItemRef(`item_${index}_quantity`)}
                          onKeyDown={(e) => handleItemKeyDown(e, index, 'quantity')}
                        />
                        {errors[`item_${index}_quantity`] && <span className="cq-error-text">{errors[`item_${index}_quantity`]}</span>}
                      </td>
                      <td className="cq-col-unit">
                        <select
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                          className="cq-table-input"
                          ref={setItemRef(`item_${index}_unit`)}
                          onKeyDown={(e) => handleItemKeyDown(e, index, 'unit')}
                        >
                          <option value="pcs">Pcs</option>
                          <option value="kg">Kg</option>
                          <option value="ltr">Ltr</option>
                          <option value="mtr">Mtr</option>
                          <option value="Nos">Nos</option>
                          <option value="Box">Box</option>
                        </select>
                      </td>
                      <td className="cq-col-rate">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                          onWheel={blurOnWheel}
                          min="0"
                          step="0.01"
                          className={`cq-table-input ${errors[`item_${index}_rate`] ? 'cq-input-error' : ''}`}
                          ref={setItemRef(`item_${index}_rate`)}
                          onKeyDown={(e) => handleItemKeyDown(e, index, 'rate')}
                        />
                        {errors[`item_${index}_rate`] && <span className="cq-error-text">{errors[`item_${index}_rate`]}</span>}
                      </td>
                      <td className="cq-col-tax">
                        <select
                          value={item.tax}
                          onChange={(e) => handleItemChange(index, 'tax', Number(e.target.value))}
                          className="cq-table-input"
                          disabled={loadingTaxOptions}
                          ref={setItemRef(`item_${index}_tax`)}
                          onKeyDown={(e) => handleItemKeyDown(e, index, 'tax')}
                        >
                          <option value={0}>0%</option>
                          {taxOptions.map((tax) => {
                            const taxValue = extractTaxValue(tax.tax_type);
                            return (
                              <option key={tax.tax_id} value={taxValue}>
                                {tax.tax_type}
                              </option>
                            );
                          })}
                        </select>
                      </td>
                      <td className="cq-col-tax-amount" style={{ textAlign: 'right' }}>
                        <span className="cq-table-value">₹{item.taxAmount.toFixed(2)}</span>
                      </td>
                      <td className="cq-col-amount" style={{ textAlign: 'right' }}>
                        <span className="cq-table-value">₹{item.totalAmount.toFixed(2)}</span>
                      </td>
                      <td className="cq-col-action">
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            className="cq-remove-btn"
                            onClick={() => removeItemRow(index)}
                            title="Delete item"
                          >
                            <FaTrash size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── BOTTOM SECTION (DC Style) ────────────────────── */}
          <div className="cq-bottom-section">
            <div className="cq-bottom-left">
              {/* Payment Schedule - Updated to match Sales Order style */}
              <div className="cq-section">
                <div className="cq-section-header">
                  <FaCreditCard className="cq-section-icon" />
                  <span>Payment Schedule</span>
                </div>

                {/* Payment Terms Template Dropdown */}
                <div className="cq-field" style={{ marginBottom: '0.5rem' }}>
                  <div className="cq-field-row" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      value={formData.paymentTermsTemplate}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData(prev => ({ ...prev, paymentTermsTemplate: value }));
                        if (value) {
                          applyPaymentTemplate(value);
                        }
                      }}
                      className="cq-select"
                      style={{ flex: 1, minWidth: '200px' }}
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
                      className="cq-add-btn"
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

                <div className="cq-table-wrap">
                  <table className="cq-payment-table">
                    <thead>
                      <tr>
                        <th className="cq-payment-col-no">#</th>
                        <th className="cq-payment-col-term">Payment Term</th>
                        <th className="cq-payment-col-date">Due Date</th>
                        <th className="cq-payment-col-duration">Days</th>
                        <th className="cq-payment-col-portion">%</th>
                        <th className="cq-payment-col-amount">Amount</th>
                        <th className="cq-payment-col-action"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.paymentSchedule.map((schedule, index) => (
                        <tr key={schedule.id}>
                          <td className="cq-payment-col-no">{index + 1}</td>
                          <td className="cq-payment-col-term">
                            <input
                              type="text"
                              value={schedule.paymentTerm}
                              onChange={(e) => updatePaymentRow(index, { paymentTerm: e.target.value })}
                              placeholder="Term"
                              className="cq-table-input cq-table-input-text"
                              ref={setRef(`payment_${index}_term`)}
                            />
                          </td>
                          <td className="cq-payment-col-date">
                            <div className="cq-date-field">
                              <input
                                type="date"
                                value={schedule.dueDate}
                                onChange={(e) => handlePaymentDueDateChange(index, e.target.value)}
                                className="cq-table-input"
                                ref={setRef(`payment_${index}_dueDate`)}
                              />
                              <button
                                type="button"
                                className="cq-date-icon-btn"
                                onClick={() => openDatePicker(`payment_${index}_dueDate`)}
                                tabIndex={-1}
                                aria-label="Open calendar"
                              >
                                <FaCalendarAlt size={11} />
                              </button>
                            </div>
                          </td>
                          <td className="cq-payment-col-duration">
                            <input
                              type="number"
                              value={schedule.durationDays}
                              onChange={(e) => handlePaymentDurationChange(index, Number(e.target.value))}
                              onWheel={blurOnWheel}
                              min="0"
                              className="cq-table-input"
                              ref={setRef(`payment_${index}_duration`)}
                            />
                          </td>
                          <td className="cq-payment-col-portion">
                            <input
                              type="number"
                              value={schedule.invoicePortion}
                              onChange={(e) => updatePaymentRow(index, { invoicePortion: Number(e.target.value) })}
                              onWheel={blurOnWheel}
                              min="0"
                              max="100"
                              className="cq-table-input"
                              ref={setRef(`payment_${index}_portion`)}
                            />
                          </td>
                          <td className="cq-payment-col-amount">
                            <span className="cq-table-value">₹{schedule.paymentAmount.toFixed(2)}</span>
                          </td>
                          <td className="cq-payment-col-action">
                            {formData.paymentSchedule.length > 1 && (
                              <button
                                type="button"
                                className="cq-remove-btn"
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

                <button type="button" className="cq-add-btn" onClick={addPaymentSchedule} style={{ marginTop: '8px' }}>
                  <FaPlus size={9} /> Add Schedule
                </button>
              </div>

              {/* Terms and Conditions */}
              <div className="cq-section" style={{ borderBottom: 'none' }}>
                <div className="cq-section-header">
                  <FaFileAlt className="cq-section-icon" />
                  <span>Terms and Conditions</span>
                </div>
                <div className="cq-field-full">
                  <label className="cq-label">Term Details</label>
                  <textarea
                    name="termDetails"
                    value={formData.termDetails}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Enter terms and conditions..."
                    className="cq-textarea"
                    ref={setRef('termDetails')}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT - Financial Summary (DC Style) */}
            <div className="cq-bottom-right">
              <div className="cq-detail-card cq-summary-card">
                <div className="cq-card-header">
                  <FaCalculator size={14} />
                  <span>Financial Summary</span>
                </div>
                <div className="cq-card-content">
                  <div className="cq-summary-grid">
                    <div className="cq-summary-item">
                      <span className="cq-summary-label">Total Items</span>
                      <span className="cq-summary-value">{formData.items.filter(i => i.itemCode).length}</span>
                    </div>
                    <div className="cq-summary-item">
                      <span className="cq-summary-label">Total Quantity</span>
                      <span className="cq-summary-value">{getTotalQty()}</span>
                    </div>
                    <div className="cq-summary-item">
                      <span className="cq-summary-label">Sub Total</span>
                      <span className="cq-summary-value">₹{getTotalAmount().toFixed(2)}</span>
                    </div>
                    <div className="cq-summary-item">
                      <span className="cq-summary-label">Total Tax</span>
                      <span className="cq-summary-value">₹{getTotalTax().toFixed(2)}</span>
                    </div>
                    <div className="cq-summary-grand">
                      <span className="cq-summary-grand-label">Grand Total</span>
                      <span className="cq-summary-grand-value">₹{getGrandTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Form Actions ──────────────────────────────────── */}
          <div className="cq-form-footer">
            <button type="button" className="cq-btn cq-btn-cancel" onClick={handleCancel}>
              <FaTimes size={11} /> Cancel
            </button>
            <button type="button" className="cq-btn cq-btn-print" onClick={() => window.print()}>
              <FaPrint size={11} /> Print
            </button>
            <button type="submit" className="cq-btn cq-btn-submit" disabled={saving}>
              {saving && <FaSpinner className="cq-spinning" size={11} />}
              <FaPaperPlane size={11} /> {isEditMode ? 'Update' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}