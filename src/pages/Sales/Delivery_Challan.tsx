import React, { useState, useEffect, useRef } from 'react';
import { 
  FaPlus, 
  FaSearch, 
  FaFilter, 
  FaPrint,
  FaEye,
  FaEdit,
  FaPrint as FaPrintIcon,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaExclamationTriangle,
  FaEllipsisV,
  FaFilePdf,
  FaFileExcel,
  FaBan,
  FaPaperPlane,
  FaTruck,
  FaSpinner,
  FaSync,
  FaTimes,
  FaCalendarAlt
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

// ===== INTERFACES =====

interface DeliveryChallanItem {
  id: number;
  item_code: string;
  item_name: string;
  description: string;
  qty: number;
  stock_uom: string;
  uom: string;
  rate: number;
  amount: number;
  tax_id: number | null;
  net_rate: number;
  net_amount: number;
  warehouse: string;
  serial_no?: string;
  batch_no?: string;
}

// ===== CUSTOMER DETAILS INTERFACE =====
interface CustomerDetails {
  id: number;
  customer_name: string;
  customer_type: string;
  customer_group: string;
  territory: string;
  mobile_no: string;
  email_id: string;
  primary_address: string;
  tax_id: string | null;
  default_currency: string | null;
  payment_terms: string | null;
  disabled: number;
  gstin?: string;
  address?: string;
  shipping_address?: string;
  state?: string;
  state_code?: string;
  phone_no?: string;
  email?: string;
}

interface DeliveryChallan {
  id: string | number;
  name: string;
  customer_id: number;
  customer_name: string;
  posting_date: string;
  status: string;
  grand_total: number;
  currency: string | null;
  modified: string;
  modified_by: string | null;
  creation: string;
  set_warehouse?: string;
  transporter?: string;
  vehicle_no?: string;
  driver_name?: string;
  instructions?: string;
  sales_order_id?: number | null;
  items?: DeliveryChallanItem[];
  customer_details?: CustomerDetails;
  payment_schedule?: any[];
  displayDcNumber?: string;
}

interface ApiResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: DeliveryChallan[];
  };
}

// ===== COMPANY INTERFACE =====
interface Company {
  id: number;
  company_name: string;
  abbr: string;
  default_currency: string;
  country: string;
  tax_id?: string;
  email?: string;
  phone_no?: string;
  website?: string;
  bank_details?: BankDetail[];
}

interface BankDetail {
  id: number;
  bank_name: string;
  branch_name: string;
  account_number: string;
  ifsc_code: string;
  account_holder_name: string;
  account_type: string;
  currency: string;
  is_primary: number;
}

// ===== COMPANY DETAILS (will be updated from API) =====
let companyDetails = {
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

// ===== FORMAT DC NUMBER =====
const formatDcNumber = (id: string | number): string => {
  const numId = typeof id === 'string' ? parseInt(id, 10) : id;
  const paddedId = String(numId).padStart(5, '0');
  return `DC-${paddedId}`;
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

const escapeHtml = (val: unknown): string => {
  const s = val === null || val === undefined ? '' : String(val);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

// ===== STATUS BADGE =====
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const configs: Record<string, { color: string; bg: string; label: string }> = {
    'Draft': { color: '#6b7280', bg: '#f3f4f6', label: 'Draft' },
    'Submitted': { color: '#1e40af', bg: '#dbeafe', label: 'Submitted' },
    'Cancelled': { color: '#991b1b', bg: '#fee2e2', label: 'Cancelled' },
    'Pending': { color: '#92400e', bg: '#fef3c7', label: 'Pending' },
    'Partial Dispatch': { color: '#1e40af', bg: '#dbeafe', label: 'Partial Dispatch' },
    'Fully Dispatched': { color: '#065f46', bg: '#d1fae5', label: 'Fully Dispatched' }
  };
  const config = configs[status] || configs['Draft'];
  
  return (
    <span className="qt-status-badge" style={{ color: config.color, background: config.bg }}>
      <span className="qt-dot" style={{ background: config.color }} />
      {config.label}
    </span>
  );
};

// ===== DEBOUNCE HOOK =====
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// ===== MAIN COMPONENT =====
const DeliveryChallans: React.FC = () => {
  const navigate = useNavigate();
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const printWindowRef = useRef<Window | null>(null);
  
  const { theme, formatDate, getApiDateFormat } = useAdminTheme();
  
  // ===== STATE =====
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showMoreMenu, setShowMoreMenu] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Date range filter states
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [tempStartDate, setTempStartDate] = useState<string>('');
  const [tempEndDate, setTempEndDate] = useState<string>('');
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<string>('');

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const [challans, setChallans] = useState<DeliveryChallan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printLoadingId, setPrintLoadingId] = useState<string | null>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [companyData, setCompanyData] = useState<Company | null>(null);

  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    return formatDate(dateString);
  };

  const toApiDateFormat = (date: Date) => {
    return getApiDateFormat(date);
  };

  // ─── Fetch Company Details ──────────────────────────────
  const fetchCompanyDetails = async () => {
    try {
      const response = await api.get('/company');
      console.log('Company API Response:', response.data);
      
      if (response.data.success === 1) {
        const companies = response.data.data || [];
        console.log('Companies:', companies);
        
        const chandratara = companies.find((c: Company) => 
          c.company_name.includes('ChandraTara') || 
          c.abbr === 'CT_IND' ||
          c.company_name.toLowerCase().includes('chandratara')
        );
        
        if (chandratara) {
          setCompanyData(chandratara);
          companyDetails = {
            ...companyDetails,
            name: chandratara.company_name || companyDetails.name,
            address: chandratara.country || companyDetails.address,
            contact: chandratara.phone_no || companyDetails.contact,
            email: chandratara.email || companyDetails.email,
            gstin: chandratara.tax_id || companyDetails.gstin,
          };
          
          if (chandratara.bank_details && chandratara.bank_details.length > 0) {
            const primaryBank = chandratara.bank_details.find((b: BankDetail) => b.is_primary === 1) || chandratara.bank_details[0];
            if (primaryBank) {
              companyDetails.bankName = primaryBank.bank_name || companyDetails.bankName;
              companyDetails.bankAccountNo = primaryBank.account_number || companyDetails.bankAccountNo;
              companyDetails.bankBranchIfsc = primaryBank.ifsc_code || companyDetails.bankBranchIfsc;
            }
          }
          
          console.log('Company loaded:', chandratara.company_name);
        } else {
          console.warn('ChandraTara Industries not found, using default company details');
          if (companies.length > 0) {
            const firstCompany = companies[0];
            companyDetails = {
              ...companyDetails,
              name: firstCompany.company_name || companyDetails.name,
              address: firstCompany.country || companyDetails.address,
              contact: firstCompany.phone_no || companyDetails.contact,
              email: firstCompany.email || companyDetails.email,
              gstin: firstCompany.tax_id || companyDetails.gstin,
            };
          }
        }
      } else {
        console.warn('API returned success !== 1');
      }
    } catch (err) {
      console.error('Error fetching company details:', err);
    }
  };

  // ─── close date picker on outside click ──────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const datePickerContainer = document.querySelector('.qt-date-picker-container');
      if (datePickerContainer && !datePickerContainer.contains(target)) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ─── Date helper functions ─────────────────────────────────────────────
  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return '';
    return formatDate(dateStr);
  };

  const getTodayDate = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getDateDaysAgo = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  };

  const getFirstDayOfMonth = (): string => {
    const date = new Date(currentYear, currentMonth, 1);
    return date.toISOString().split('T')[0];
  };

  const getLastDayOfMonth = (): string => {
    const date = new Date(currentYear, currentMonth + 1, 0);
    return date.toISOString().split('T')[0];
  };

  // ─── Quick filter handlers ─────────────────────────────────────────────
  const applyQuickFilter = (filter: string) => {
    setSelectedQuickFilter(filter);
    let start = '';
    let end = getTodayDate();

    switch (filter) {
      case 'today':
        start = getTodayDate();
        break;
      case 'last7':
        start = getDateDaysAgo(7);
        break;
      case 'last30':
        start = getDateDaysAgo(30);
        break;
      case 'thisMonth':
        start = getFirstDayOfMonth();
        end = getLastDayOfMonth();
        break;
      default:
        return;
    }

    setTempStartDate(start);
    setTempEndDate(end);
  };

  // ===== CLOSE MENU ON CLICK OUTSIDE =====
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMoreMenu === null) return;
      
      const target = event.target as Node;
      const menuContainer = menuRefs.current[showMoreMenu];
      
      if (menuContainer && !menuContainer.contains(target)) {
        setShowMoreMenu(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreMenu]);

  // ===== FETCH FULL DC DETAILS =====
  const fetchFullDeliveryChallan = async (id: string | number): Promise<DeliveryChallan | null> => {
    try {
      const response = await api.get(`/delivery-note/${id}`);
      console.log('Full DC Response:', response.data);
      
      if (response.data && response.data.success !== 0) {
        const data = response.data.success === 1 ? response.data.data : response.data;
        const record = Array.isArray(data) ? data[0] : (data?.record ?? data);
        if (record && (record.name || record.id)) {
          console.log('Vehicle No from API:', record.vehicle_no);
          console.log('Transporter from API:', record.transporter);
          console.log('Driver Name from API:', record.driver_name);
          return {
            ...record,
            displayDcNumber: formatDcNumber(record.id || record.name)
          } as DeliveryChallan;
        }
      }
    } catch (err) {
      console.warn('Direct fetch failed:', err);
    }
    return null;
  };

  // ===== FETCH DATA WITH SERVER-SIDE PAGINATION =====
  const fetchChallans = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      
      params.append('page', String(currentPage));
      params.append('limit', String(itemsPerPage));
      
      if (debouncedSearchTerm.trim()) {
        params.append('search', debouncedSearchTerm.trim());
        params.append('search_by', 'all');
      }
      
      if (selectedStatus !== 'All') {
        params.append('status', selectedStatus);
      }
      
      if (startDate) {
        params.append('from_date', startDate);
      }
      if (endDate) {
        params.append('to_date', endDate);
      }
      
      const query = params.toString() ? `?${params.toString()}` : '';
      const url = `/delivery-note${query}`;
      console.log('API Call URL:', url);
      
      const response = await api.get<ApiResponse>(url);
      
      if (response.data?.data?.records) {
        const recordsWithDisplayNumber = response.data.data.records.map((record) => ({
          ...record,
          displayDcNumber: formatDcNumber(record.id)
        }));
        setChallans(recordsWithDisplayNumber);
        setTotalRecords(response.data.data.total || recordsWithDisplayNumber.length);
      } else {
        setChallans([]);
        setTotalRecords(0);
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Failed to load delivery challans');
      toast.error('Failed to load delivery challans');
    } finally {
      setLoading(false);
    }
  };

  // ===== EFFECTS =====
  useEffect(() => {
    fetchCompanyDetails();
  }, []);

  // Fetch when filters or pagination changes
  useEffect(() => {
    fetchChallans();
  }, [debouncedSearchTerm, selectedStatus, currentPage, itemsPerPage, startDate, endDate]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, startDate, endDate]);

  // ===== PAGINATION =====
  const totalFilteredItems = totalRecords;
  const totalPages = Math.ceil(totalFilteredItems / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages || 1);
  
  if (validCurrentPage !== currentPage && currentPage > 0) {
    setCurrentPage(validCurrentPage);
  }

  const getStartIndex = () => {
    if (totalFilteredItems === 0) return 0;
    return (validCurrentPage - 1) * itemsPerPage + 1;
  };

  const getEndIndex = () => {
    if (totalFilteredItems === 0) return 0;
    return Math.min(validCurrentPage * itemsPerPage, totalFilteredItems);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToNextPage = () => goToPage(currentPage + 1);
  const goToPrevPage = () => goToPage(currentPage - 1);

  const handlePageSizeChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  // ===== GENERATE EXCEL DATA =====
  const generateDCExcelData = (challan: DeliveryChallan) => {
    const items = challan.items || [];
    const totalQty = items.reduce((sum, item) => sum + (item.qty || 0), 0);
    const grandTotal = challan.grand_total || 0;
    const customer = challan.customer_details || {} as CustomerDetails;
    const subTotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalTax = items.reduce((sum, item) => sum + ((item.amount || 0) * 0.18), 0);
    
    const data: any[][] = [];
    
    data.push(['DELIVERY CHALLAN']);
    data.push([`Status: ${challan.status || 'Draft'}`]);
    data.push([]);
    data.push([companyDetails.name]);
    data.push([companyDetails.address]);
    data.push([`Phone: ${companyDetails.contact}`]);
    data.push([`Email: ${companyDetails.email}`]);
    data.push([`GSTIN: ${companyDetails.gstin || ''}`]);
    data.push([`State Name: ${companyDetails.stateName}, Code: ${companyDetails.stateCode}`]);
    data.push([]);
    data.push(['DC No.', challan.displayDcNumber || challan.name || '', 'Date', formatDisplayDate(challan.posting_date)]);
    data.push(['Warehouse', challan.set_warehouse || 'Finished Goods', 'Transporter', challan.transporter || challan.driver_name || '']);
    data.push(['Vehicle No.', challan.vehicle_no || '', 'Sales Order', challan.sales_order_id ? `#${challan.sales_order_id}` : 'N/A']);
    data.push([]);
    data.push(['Consignee (Ship to)']);
    data.push([challan.customer_name || '']);
    data.push([customer?.primary_address || customer?.address || '']);
    data.push([`Phone: ${customer?.mobile_no || customer?.phone_no || ''}`]);
    data.push([`Email: ${customer?.email_id || customer?.email || ''}`]);
    data.push([`GSTIN/UIN: ${customer?.gstin || customer?.tax_id || ''}`]);
    data.push([`State: ${customer?.state || ''}${customer?.state_code ? ` (${customer.state_code})` : ''}`]);
    data.push([]);
    data.push(['#', 'Description of Goods', 'HSN', 'Qty', 'UOM', 'Rate', 'Tax', 'Tax Amt', 'Amount']);
    
    items.forEach((item, idx) => {
      data.push([
        idx + 1,
        item.item_name || item.item_code || '',
        item.item_code || '',
        item.qty || 0,
        item.stock_uom || item.uom || 'Nos',
        (item.rate || 0).toFixed(2),
        'GST18%',
        ((item.amount || 0) * 0.18).toFixed(2),
        (item.amount || 0).toFixed(2)
      ]);
    });
    
    const uom = items.length > 0 ? (items[0]?.stock_uom || items[0]?.uom || 'Nos') : 'Nos';
    data.push(['Total', '', '', totalQty, uom, '', '', totalTax.toFixed(2), subTotal.toFixed(2)]);
    data.push([]);
    data.push(['Financial Summary']);
    data.push([`Total Items: ${items.length}`]);
    data.push([`Total Quantity: ${totalQty}`]);
    data.push([`Sub Total: ₹${subTotal.toFixed(2)}`]);
    data.push([`Total Tax: ₹${totalTax.toFixed(2)}`]);
    data.push([`Grand Total: ₹${grandTotal.toFixed(2)}`]);
    data.push([]);
    data.push(['Amount Chargeable (in words)']);
    data.push([`INR ${numberToIndianWords(grandTotal)} Only`]);
    data.push([]);
    data.push(['Delivery Details']);
    if (challan.transporter) data.push([`Transporter: ${challan.transporter}`]);
    if (challan.vehicle_no) data.push([`Vehicle No: ${challan.vehicle_no}`]);
    if (challan.driver_name) data.push([`Driver: ${challan.driver_name}`]);
    if (challan.instructions) data.push([`Remarks: ${challan.instructions}`]);
    data.push([]);
    data.push(['Declaration']);
    data.push(['We declare that the goods described above are as per the delivery challan and all particulars are true and correct.']);
    data.push([]);
    data.push([`for ${companyDetails.name}`]);
    data.push([]);
    data.push([]);
    data.push([]);
    data.push(['Authorised Signatory']);
    data.push([]);
    data.push([`SUBJECT TO ${companyDetails.jurisdiction} JURISDICTION`]);
    data.push(['This is a computer generated delivery challan.']);
    
    return data;
  };

  // ===== BUILD PRINT HTML =====
  const buildDeliveryChallanPrintHtml = (challan: DeliveryChallan): string => {
    const items = challan.items || [];
    const totalQty = items.reduce((sum, item) => sum + (item.qty || 0), 0);
    const grandTotal = challan.grand_total || 0;
    // ✅ FIX: Properly type the customer object with a fallback to empty object
    const customer: CustomerDetails = challan.customer_details || {} as CustomerDetails;

    const formatPrintDateLocal = (dateStr: string) => {
      if (!dateStr) return '';
      return formatDisplayDate(dateStr);
    };

    // Calculate financial details
    const subTotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalTax = items.reduce((sum, item) => sum + ((item.amount || 0) * 0.18), 0);
    const roundOff = Math.round((subTotal + totalTax) - grandTotal);

    // ✅ FIX: SAFE DATA EXTRACTION - with proper fallbacks using the typed customer object
    const customerName = challan.customer_name || customer?.customer_name || '';
    const customerPhone = customer?.mobile_no || customer?.phone_no || '';
    const customerEmail = customer?.email_id || customer?.email || '';
    const customerAddress = customer?.primary_address || customer?.address || '';
    const customerGstin = customer?.gstin || customer?.tax_id || '';
    const customerState = customer?.state || '';
    const customerStateCode = customer?.state_code || '';

    // Transporter details - with fallbacks - Only show if data exists
    const transporter = challan.transporter || '';
    const vehicleNo = challan.vehicle_no || '';
    const driverName = challan.driver_name || '';
    const warehouse = challan.set_warehouse || 'Finished Goods';
    const instructions = challan.instructions || '';

    // Check if we have any delivery details to show
    const hasDeliveryDetails = transporter || vehicleNo || driverName || instructions;

    const itemRows = items.map((item, idx) => `
      <tr>
        <td class="pq-col-sl">${idx + 1}</td>
        <td class="pq-col-desc">
          ${escapeHtml(item.item_name || item.item_code || '')}
          ${item.item_code ? `<div class="pq-item-sub">Code: ${escapeHtml(item.item_code)}</div>` : ''}
          ${item.description ? `<div class="pq-item-desc">${escapeHtml(item.description)}</div>` : ''}
        </td>
        <td class="pq-col-hsn">${escapeHtml(item.item_code || '')}</td>
        <td class="pq-col-qty">${item.qty || 0}</td>
        <td class="pq-col-uom">${escapeHtml(item.stock_uom || item.uom || 'Nos')}</td>
        <td class="pq-col-rate">${(item.rate || 0).toFixed(2)}</td>
        <td class="pq-col-tax">GST18%</td>
        <td class="pq-col-taxamt">${((item.amount || 0) * 0.18).toFixed(2)}</td>
        <td class="pq-col-amt">${(item.amount || 0).toFixed(2)}</td>
      </tr>
    `).join('');

    // Build delivery details HTML only if there are details
    const deliveryDetailsHtml = hasDeliveryDetails ? `
      <div style="font-weight:700;font-size:13px;margin-bottom:4px;color:#000000;">Delivery Details</div>
      ${transporter ? `<div>🚚 Transporter: ${escapeHtml(transporter)}</div>` : ''}
      ${vehicleNo ? `<div>🚗 Vehicle No: ${escapeHtml(vehicleNo)}</div>` : ''}
      ${driverName ? `<div>👤 Driver: ${escapeHtml(driverName)}</div>` : ''}
      ${instructions ? `<div style="margin-top:4px;"><strong>Remarks:</strong> ${escapeHtml(instructions)}</div>` : ''}
    ` : '';

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(challan.displayDcNumber || challan.name || 'Delivery Challan')}</title>
<style>
  * { 
    box-sizing: border-box; 
    margin: 0;
    padding: 0;
  }
  
  body { 
    font-family: 'Arial', 'Helvetica', sans-serif; 
    font-size: 12px; 
    color: #1a1a1a; 
    margin: 0; 
    padding: 15px; 
    background: #ffffff;
  }
  
  .pq-outer { 
    border: 2px solid #000000; 
    max-width: 1000px;
    margin: 0 auto;
    background: #ffffff;
  }
  
  .pq-title-row { 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    position: relative; 
    padding: 12px; 
    border-bottom: 2px solid #000000; 
    background: #f0f0f0;
  }
  .pq-title { 
    font-size: 22px; 
    font-weight: bold; 
    letter-spacing: 3px; 
    color: #000000;
  }
  .pq-title-status {
    position: absolute;
    right: 15px;
    font-size: 12px;
  }
  .pq-status-badge { 
    display: inline-block; 
    padding: 3px 14px; 
    border-radius: 12px; 
    font-size: 11px; 
    font-weight: 700;
    border: 1px solid #000000;
  }
  .pq-status-Submitted { 
    background: #dbeafe; 
    color: #1e40af; 
    border-color: #1e40af;
  }
  .pq-status-Draft { 
    background: #f3f4f6; 
    color: #6b7280; 
    border-color: #6b7280;
  }
  .pq-status-Cancelled { 
    background: #fee2e2; 
    color: #991b1b; 
    border-color: #991b1b;
  }
  .pq-status-Pending { 
    background: #fef3c7; 
    color: #92400e; 
    border-color: #92400e;
  }

  .pq-top { 
    display: flex; 
    border-bottom: 1.5px solid #000000; 
  }
  
  .pq-company-box { 
    flex: 1.3; 
    padding: 10px 12px; 
    border-right: 1.5px solid #000000; 
  }
  .pq-company-name { 
    font-weight: bold; 
    font-size: 16px; 
    margin-bottom: 4px; 
    color: #000000;
  }
  .pq-company-box div { 
    margin: 2px 0; 
    line-height: 1.5;
    font-size: 12px;
  }
  
  .pq-meta-box { 
    flex: 1.1; 
  }
  .pq-meta-row { 
    display: flex; 
    border-bottom: 1px solid #000000; 
  }
  .pq-meta-row:last-child { 
    border-bottom: none; 
  }
  .pq-meta-cell { 
    flex: 1; 
    padding: 6px 10px; 
    border-right: 1px solid #000000; 
  }
  .pq-meta-cell:last-child { 
    border-right: none; 
  }
  .pq-meta-label { 
    font-size: 10px; 
    color: #555555; 
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .pq-meta-value { 
    font-weight: 600; 
    margin-top: 2px; 
    min-height: 18px; 
    font-size: 13px;
    color: #000000;
  }

  .pq-parties { 
    display: flex; 
    border-bottom: 1.5px solid #000000; 
  }
  .pq-party-box { 
    flex: 1; 
    padding: 10px 12px; 
    border-right: 1.5px solid #000000; 
  }
  .pq-party-box:last-child { 
    border-right: none; 
  }
  .pq-party-label { 
    font-weight: 700; 
    margin-bottom: 4px; 
    font-size: 13px;
    color: #000000;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .pq-party-box div { 
    margin: 2px 0; 
    line-height: 1.5;
    font-size: 12px;
  }
  .pq-party-box strong {
    font-size: 14px;
    color: #000000;
  }

  table.pq-items { 
    width: 100%; 
    border-collapse: collapse; 
    font-size: 12px;
  }
  table.pq-items th, 
  table.pq-items td { 
    border: 1px solid #000000; 
    padding: 6px 8px; 
    text-align: left;
  }
  table.pq-items thead th { 
    font-size: 11px; 
    font-weight: 700;
    background: #e8e8e8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #000000;
    text-align: center;
  }
  
  .pq-col-sl { 
    width: 30px; 
    text-align: center; 
  }
  .pq-col-desc { 
    min-width: 180px; 
  }
  .pq-col-hsn { 
    width: 60px; 
    text-align: center; 
  }
  .pq-col-qty { 
    width: 45px; 
    text-align: center; 
  }
  .pq-col-uom { 
    width: 45px; 
    text-align: center; 
  }
  .pq-col-rate { 
    width: 70px; 
    text-align: right; 
  }
  .pq-col-tax { 
    width: 60px; 
    text-align: center; 
  }
  .pq-col-taxamt { 
    width: 75px; 
    text-align: right; 
  }
  .pq-col-amt { 
    width: 85px; 
    text-align: right; 
  }
  
  .pq-item-sub { 
    font-size: 10px; 
    color: #666666; 
  }
  .pq-item-desc { 
    font-size: 10px; 
    color: #777777; 
    margin-top: 2px; 
  }
  
  .pq-total-row td { 
    border-top: 2px solid #000000; 
    font-weight: 700; 
    padding: 8px; 
    background: #f5f5f5;
    color: #000000;
  }

  .pq-summary { 
    display: flex; 
    border-top: 1.5px solid #000000; 
    border-bottom: 1.5px solid #000000; 
  }
  .pq-summary-left { 
    flex: 1; 
    padding: 8px 12px; 
    border-right: 1.5px solid #000000; 
  }
  .pq-summary-right { 
    flex: 0 0 280px; 
    padding: 8px 12px; 
  }
  .pq-summary-row { 
    display: flex; 
    justify-content: space-between; 
    padding: 3px 0; 
    font-size: 12px;
    border-bottom: 1px dashed #dddddd;
  }
  .pq-summary-row:last-child {
    border-bottom: none;
  }
  .pq-summary-row.total { 
    font-weight: 700; 
    font-size: 14px; 
    border-top: 2px solid #000000; 
    padding-top: 6px; 
    margin-top: 4px;
    border-bottom: none;
  }

  .pq-words { 
    display: flex; 
    padding: 8px 12px; 
    justify-content: space-between; 
    align-items: flex-start; 
    border-bottom: 1.5px solid #000000;
    background: #f5f5f5;
  }
  .pq-words-label { 
    font-size: 10px; 
    color: #555555; 
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .pq-words-amount {
    font-weight: 700;
    font-size: 14px;
    margin-top: 2px;
    color: #000000;
  }
  .pq-eoe { 
    font-size: 12px; 
    font-style: italic; 
    white-space: nowrap; 
    color: #666666;
    font-weight: 600;
  }

  .pq-bottom { 
    display: flex; 
    border-top: 1.5px solid #000000; 
  }
  .pq-decl-box { 
    flex: 1; 
    padding: 10px 12px; 
    border-right: 1.5px solid #000000; 
  }
  .pq-decl-box strong {
    font-size: 13px;
    color: #000000;
  }
  .pq-decl-box div {
    font-size: 11px;
    line-height: 1.6;
    color: #333333;
  }
  
  .pq-sign-box { 
    flex: 1; 
    padding: 10px 12px; 
    display: flex; 
    flex-direction: column; 
    justify-content: space-between; 
  }
  .pq-sign-box strong {
    font-size: 13px;
    color: #000000;
  }
  .pq-sign-box div {
    font-size: 11px;
    color: #333333;
  }
  
  .pq-signatory { 
    text-align: right; 
    margin-top: 20px; 
    font-size: 12px; 
    color: #000000;
  }
  .pq-signatory .signature-line {
    margin-top: 25px;
    padding-top: 8px;
    border-top: 1.5px solid #000000;
    width: 200px;
    margin-left: auto;
    text-align: center;
    font-weight: 600;
  }
  
  .pq-receiver-signature {
    display: inline-block;
    margin-top: 20px;
    border-bottom: 1.5px solid #000000;
    width: 180px;
    text-align: center;
    padding-top: 4px;
    font-size: 11px;
    color: #555555;
  }

  .pq-footer { 
    text-align: center; 
    padding: 8px; 
    font-size: 10px; 
    color: #555555; 
    border-top: 1.5px solid #000000; 
    background: #f0f0f0;
  }
  .pq-footer .pq-footer-text {
    margin-top: 2px;
  }
  .pq-footer .pq-jurisdiction {
    font-weight: 700; 
    letter-spacing: 0.5px; 
    color: #000000;
  }

  @media print {
    body { 
      padding: 0; 
      margin: 0;
    }
    @page { 
      margin: 10mm 12mm; 
      size: A4;
    }
    .pq-outer { 
      border-color: #000000 !important; 
    }
    .pq-title-row { 
      background: #f0f0f0 !important; 
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    table.pq-items thead th { 
      background: #e8e8e8 !important; 
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .pq-total-row td { 
      background: #f5f5f5 !important; 
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .pq-words { 
      background: #f5f5f5 !important; 
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .pq-footer { 
      background: #f0f0f0 !important; 
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .pq-status-badge {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }

  @media screen and (max-width: 768px) {
    body { padding: 8px; }
    .pq-top { flex-direction: column; }
    .pq-company-box { border-right: none; border-bottom: 1.5px solid #000000; }
    .pq-parties { flex-direction: column; }
    .pq-party-box { border-right: none; border-bottom: 1.5px solid #000000; }
    .pq-party-box:last-child { border-bottom: none; }
    .pq-bottom { flex-direction: column; }
    .pq-decl-box { border-right: none; border-bottom: 1.5px solid #000000; }
    table.pq-items { font-size: 10px; }
    table.pq-items th, table.pq-items td { padding: 4px 5px; }
    .pq-summary { flex-direction: column; }
    .pq-summary-left { border-right: none; border-bottom: 1.5px solid #000000; }
    .pq-summary-right { flex: 1; }
    .pq-col-hsn, .pq-col-tax { display: none; }
    .pq-title { font-size: 18px; }
  }

  @media screen and (max-width: 480px) {
    table.pq-items { font-size: 9px; }
    table.pq-items th, table.pq-items td { padding: 3px 4px; }
    .pq-col-rate, .pq-col-taxamt, .pq-col-amt { font-size: 10px; }
    .pq-col-desc { min-width: 100px; }
    .pq-title { font-size: 16px; }
    .pq-meta-value { font-size: 11px; }
  }
</style>
</head>
<body>
  <div class="pq-outer">

    <!-- TITLE -->
    <div class="pq-title-row">
      <div class="pq-title">DELIVERY CHALLAN</div>
      <div class="pq-title-status">
        <span class="pq-status-badge pq-status-${escapeHtml(challan.status || 'Draft')}">${escapeHtml(challan.status || 'Draft')}</span>
      </div>
    </div>

    <!-- TOP: Company & Meta -->
    <div class="pq-top">
      <div class="pq-company-box">
        <div class="pq-company-name">${escapeHtml(companyDetails.name)}</div>
        <div>${escapeHtml(companyDetails.address)}</div>
        <div>📞 Phone: ${escapeHtml(companyDetails.contact)}</div>
        ${companyDetails.email ? `<div>✉️ Email: ${escapeHtml(companyDetails.email)}</div>` : ''}
        ${companyDetails.gstin ? `<div>GSTIN/UIN: ${escapeHtml(companyDetails.gstin)}</div>` : ''}
        <div>State: ${escapeHtml(companyDetails.stateName)} (Code: ${escapeHtml(companyDetails.stateCode)})</div>
      </div>
      <div class="pq-meta-box">
        <div class="pq-meta-row">
          <div class="pq-meta-cell">
            <div class="pq-meta-label">DC No.</div>
            <div class="pq-meta-value">${escapeHtml(challan.displayDcNumber || challan.name || '')}</div>
          </div>
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Date</div>
            <div class="pq-meta-value">${escapeHtml(formatPrintDateLocal(challan.posting_date))}</div>
          </div>
        </div>
        <div class="pq-meta-row">
          <div class="pq-meta-cell">
            <div class="pq-meta-label">Warehouse</div>
            <div class="pq-meta-value">${escapeHtml(warehouse)}</div>
          </div>
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Transporter</div>
            <div class="pq-meta-value">${escapeHtml(transporter || 'N/A')}</div>
          </div>
        </div>
        <div class="pq-meta-row">
          <div class="pq-meta-cell">
            <div class="pq-meta-label">Vehicle No.</div>
            <div class="pq-meta-value">${escapeHtml(vehicleNo || 'N/A')}</div>
          </div>
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Sales Order</div>
            <div class="pq-meta-value">${challan.sales_order_id ? `#${escapeHtml(String(challan.sales_order_id))}` : 'N/A'}</div>
          </div>
        </div>
        ${instructions ? `
        <div class="pq-meta-row">
          <div class="pq-meta-cell" style="border-right:none;">
            <div class="pq-meta-label">Remarks</div>
            <div class="pq-meta-value">${escapeHtml(instructions)}</div>
          </div>
        </div>` : ''}
      </div>
    </div>

    <!-- PARTIES: Consignee & Buyer -->
    <div class="pq-parties">
      <div class="pq-party-box">
        <div class="pq-party-label">📦 Consignee (Ship to)</div>
        <div><strong>${escapeHtml(customerName)}</strong></div>
        ${customerAddress ? `<div>${escapeHtml(customerAddress)}</div>` : ''}
        ${customerPhone ? `<div>📞 Phone: ${escapeHtml(customerPhone)}</div>` : ''}
        ${customerEmail ? `<div>✉️ Email: ${escapeHtml(customerEmail)}</div>` : ''}
        ${customerGstin ? `<div>GSTIN/UIN: ${escapeHtml(customerGstin)}</div>` : ''}
        ${customerState ? `<div>State: ${escapeHtml(customerState)}${customerStateCode ? ` (${escapeHtml(customerStateCode)})` : ''}</div>` : ''}
      </div>
      <div class="pq-party-box">
        <div class="pq-party-label">🏢 Buyer (Bill to)</div>
        <div><strong>${escapeHtml(customerName)}</strong></div>
        ${customerAddress ? `<div>${escapeHtml(customerAddress)}</div>` : ''}
        ${customerPhone ? `<div>📞 Phone: ${escapeHtml(customerPhone)}</div>` : ''}
        ${customerEmail ? `<div>✉️ Email: ${escapeHtml(customerEmail)}</div>` : ''}
        ${customerGstin ? `<div>GSTIN/UIN: ${escapeHtml(customerGstin)}</div>` : ''}
        ${customerState ? `<div>State: ${escapeHtml(customerState)}${customerStateCode ? ` (${escapeHtml(customerStateCode)})` : ''}</div>` : ''}
      </div>
    </div>

    <!-- ITEMS TABLE -->
    <table class="pq-items">
      <thead>
        <tr>
          <th class="pq-col-sl">#</th>
          <th class="pq-col-desc">Description of Goods</th>
          <th class="pq-col-hsn">HSN</th>
          <th class="pq-col-qty">Qty</th>
          <th class="pq-col-uom">UOM</th>
          <th class="pq-col-rate">Rate</th>
          <th class="pq-col-tax">Tax</th>
          <th class="pq-col-taxamt">Tax Amt</th>
          <th class="pq-col-amt">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        <tr class="pq-total-row">
          <td colspan="2" style="text-align:right;">TOTAL</td>
          <td class="pq-col-hsn"></td>
          <td class="pq-col-qty">${totalQty}</td>
          <td class="pq-col-uom">${items.length > 0 ? escapeHtml(items[0]?.stock_uom || items[0]?.uom || 'Nos') : 'Nos'}</td>
          <td class="pq-col-rate"></td>
          <td class="pq-col-tax"></td>
          <td class="pq-col-taxamt">${totalTax.toFixed(2)}</td>
          <td class="pq-col-amt">${subTotal.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <!-- SUMMARY -->
    <div class="pq-summary">
      <div class="pq-summary-left">
        ${deliveryDetailsHtml}
        ${!hasDeliveryDetails ? '<div style="color:#999;font-size:11px;">No delivery details available</div>' : ''}
      </div>
      <div class="pq-summary-right">
        <div class="pq-summary-row">
          <span>Total Items</span>
          <span>${items.length}</span>
        </div>
        <div class="pq-summary-row">
          <span>Total Quantity</span>
          <span>${totalQty}</span>
        </div>
        <div class="pq-summary-row">
          <span>Sub Total</span>
          <span>₹${subTotal.toFixed(2)}</span>
        </div>
        <div class="pq-summary-row">
          <span>Total Tax</span>
          <span>₹${totalTax.toFixed(2)}</span>
        </div>
        <div class="pq-summary-row">
          <span>Round Off</span>
          <span>₹${roundOff.toFixed(2)}</span>
        </div>
        <div class="pq-summary-row total">
          <span>Grand Total</span>
          <span>₹${grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <!-- AMOUNT IN WORDS -->
    <div class="pq-words">
      <div>
        <div class="pq-words-label">Amount Chargeable (in words)</div>
        <div class="pq-words-amount">INR ${numberToIndianWords(grandTotal)} Only</div>
      </div>
      <div class="pq-eoe">E. &amp; O. E</div>
    </div>

    <!-- DECLARATION & SIGNATORY -->
    <div class="pq-bottom">
      <div class="pq-decl-box">
        <strong>Declaration</strong>
        <div style="margin-top:4px;">We declare that the goods described above are as per the delivery challan and all particulars are true and correct.</div>
        ${companyDetails.panNo ? `<div style="margin-top:6px;">Company's PAN: ${escapeHtml(companyDetails.panNo)}</div>` : ''}
        ${companyDetails.bankName ? `<div style="margin-top:4px;">🏦 Bank: ${escapeHtml(companyDetails.bankName)}</div>` : ''}
        ${companyDetails.bankAccountNo ? `<div>A/C: ${escapeHtml(companyDetails.bankAccountNo)}</div>` : ''}
        ${companyDetails.bankBranchIfsc ? `<div>IFSC: ${escapeHtml(companyDetails.bankBranchIfsc)}</div>` : ''}
      </div>
      <div class="pq-sign-box">
        <div>
          <div><strong>Delivery Receipt</strong></div>
          <div style="margin-top:4px;line-height:1.8;">
            Received the above goods in good condition.<br />
            <span class="pq-receiver-signature">Receiver's Signature</span>
          </div>
        </div>
        <div class="pq-signatory">
          for ${escapeHtml(companyDetails.name)}<br />
          <div class="signature-line">Authorised Signatory</div>
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="pq-footer">
      ${companyDetails.jurisdiction ? `<div class="pq-jurisdiction">SUBJECT TO ${escapeHtml(companyDetails.jurisdiction)} JURISDICTION</div>` : ''}
      <div class="pq-footer-text">This is a computer generated delivery challan. ${challan.status === 'Submitted' ? '✓ Submitted' : ''}</div>
    </div>

  </div>

  <script>
    (function() {
      window.onload = function() {
        setTimeout(function() {
          window.print();
        }, 600);
      };
    })();
  </script>
</body>
</html>`;
  };

  // ===== EXCEL DOWNLOAD HANDLER =====
  const handleExcelDownload = async () => {
    setDownloadLoading(true);
    try {
      const challansToDownload = challans.length > 0 ? challans : [];
      
      if (challansToDownload.length === 0) {
        toast.error('No delivery challans to download');
        setDownloadLoading(false);
        return;
      }

      const fullChallans = await Promise.all(
        challansToDownload.map(async (ch) => {
          if (ch.items && ch.items.length > 0) return ch;
          const fullData = await fetchFullDeliveryChallan(ch.id);
          return fullData || ch;
        })
      );

      const wb = XLSX.utils.book_new();
      
      fullChallans.forEach((challan, index) => {
        const challanData = generateDCExcelData(challan);
        const ws = XLSX.utils.aoa_to_sheet(challanData);
        
        ws['!cols'] = [
          { wch: 8 },   // # 
          { wch: 30 },  // Description
          { wch: 12 },  // HSN
          { wch: 8 },   // Qty
          { wch: 8 },   // UOM
          { wch: 12 },  // Rate
          { wch: 10 },  // Tax
          { wch: 12 },  // Tax Amt
          { wch: 15 },  // Amount
        ];
        
        ws['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
          { s: { r: 3, c: 0 }, e: { r: 3, c: 8 } },
          { s: { r: 4, c: 0 }, e: { r: 4, c: 8 } },
          { s: { r: 5, c: 0 }, e: { r: 5, c: 8 } },
          { s: { r: 6, c: 0 }, e: { r: 6, c: 8 } },
          { s: { r: 7, c: 0 }, e: { r: 7, c: 8 } },
          { s: { r: 8, c: 0 }, e: { r: 8, c: 8 } },
          { s: { r: 14, c: 0 }, e: { r: 14, c: 8 } },
          { s: { r: 15, c: 0 }, e: { r: 15, c: 8 } },
          { s: { r: 16, c: 0 }, e: { r: 16, c: 8 } },
          { s: { r: 17, c: 0 }, e: { r: 17, c: 8 } },
          { s: { r: 18, c: 0 }, e: { r: 18, c: 8 } },
          { s: { r: 19, c: 0 }, e: { r: 19, c: 8 } },
          { s: { r: 20, c: 0 }, e: { r: 20, c: 8 } },
        ];
        
        const wordsRow = challanData.findIndex(row => row && row[0] === 'Amount Chargeable (in words)');
        if (wordsRow !== -1) {
          ws['!merges'].push({ s: { r: wordsRow, c: 0 }, e: { r: wordsRow, c: 8 } });
          ws['!merges'].push({ s: { r: wordsRow + 1, c: 0 }, e: { r: wordsRow + 1, c: 8 } });
        }
        
        const sheetName = challan.displayDcNumber || challan.name || `DC_${index + 1}`;
        XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
      });
      
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Delivery_Challans_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Excel file downloaded successfully');
      
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download');
    } finally {
      setDownloadLoading(false);
    }
  };

  // ===== PDF DOWNLOAD HANDLER =====
  const handlePDFDownload = async () => {
    setDownloadLoading(true);
    try {
      const challansToDownload = challans.length > 0 ? challans : [];
      
      if (challansToDownload.length === 0) {
        toast.error('No delivery challans to download');
        setDownloadLoading(false);
        return;
      }

      const fullChallans = await Promise.all(
        challansToDownload.map(async (ch) => {
          if (ch.items && ch.items.length > 0) return ch;
          const fullData = await fetchFullDeliveryChallan(ch.id);
          return fullData || ch;
        })
      );

      const allHtmlContent = fullChallans.map(ch => buildDeliveryChallanPrintHtml(ch)).join('<div style="page-break-after: always;"></div>');
      
      // ✅ FIX: Properly handle the print window with a unique name
      const printWindowName = `pdf_download_${Date.now()}`;
      const printWindow = window.open('', printWindowName, 'width=1000,height=900');
      if (!printWindow) {
        toast.error('Please allow pop-ups to download PDF');
        setDownloadLoading(false);
        return;
      }
      
      // ✅ FIX: Clear the window content and write HTML
      printWindow.document.open();
      printWindow.document.write(allHtmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      // ✅ FIX: Add a small delay before printing to ensure content is loaded
      setTimeout(() => {
        printWindow.print();
      }, 1000);
      
      // ✅ FIX: Clean up the window reference after printing
      setTimeout(() => {
        if (printWindow && !printWindow.closed) {
          printWindow.close();
        }
      }, 5000);
      
    } catch (err) {
      console.error('PDF download error:', err);
      toast.error('Failed to download PDF');
    } finally {
      setDownloadLoading(false);
    }
  };

  // ===== ACTIONS =====
  const handleCreate = () => navigate('/delivery-challan/new');
  const handleRefresh = () => fetchChallans();
  const handleView = (id: string | number) => navigate(`/delivery-challan/view/${id}`);
  const handleEdit = (id: string | number) => {
    setShowMoreMenu(null);
    navigate(`/delivery-challan/edit/${id}`);
  };

  const handlePrint = (challan: DeliveryChallan) => {
    // ✅ FIX: Check if print window is already open and close it
    if (printWindowRef.current && !printWindowRef.current.closed) {
      printWindowRef.current.close();
      printWindowRef.current = null;
    }
    
    const printWindowName = `dc_print_${challan.id}_${Date.now()}`;
    const printWindow = window.open('', printWindowName, 'width=1000,height=900');
    printWindowRef.current = printWindow;
    
    if (!printWindow) {
      toast.error('Please allow pop-ups to print this delivery challan');
      return;
    }
    printWindow.document.write('<p style="font-family:sans-serif;padding:24px;color:#374151;">Loading delivery challan…</p>');

    setPrintLoadingId(String(challan.id));
    
    const loadAndPrint = async () => {
      try {
        let printData = challan;
        if (!challan.items || challan.items.length === 0) {
          const fullData = await fetchFullDeliveryChallan(challan.id);
          if (fullData) {
            printData = fullData;
          }
        }
        printWindow.document.open();
        printWindow.document.write(buildDeliveryChallanPrintHtml(printData));
        printWindow.document.close();
        printWindow.focus();
        
        // ✅ FIX: Add delay before printing
        setTimeout(() => {
          printWindow.print();
        }, 800);
      } catch (err) {
        console.error('Error printing delivery challan:', err);
        printWindow.document.open();
        printWindow.document.write(buildDeliveryChallanPrintHtml(challan));
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 800);
      } finally {
        setPrintLoadingId(null);
        // ✅ FIX: Clear reference after print is done
        setTimeout(() => {
          if (printWindowRef.current && !printWindowRef.current.closed) {
            printWindowRef.current.close();
            printWindowRef.current = null;
          }
        }, 5000);
      }
    };
    
    loadAndPrint();
  };

  const handleCancel = async (id: string | number) => {
    if (!window.confirm('Are you sure you want to cancel this Delivery Challan?')) return;
    try {
      await api.post(`/delivery-note/${id}/cancel`, {});
      toast.success('Delivery Challan cancelled successfully');
      fetchChallans();
    } catch (err) {
      toast.error('Failed to cancel');
    }
    setShowMoreMenu(null);
  };

  const handleSubmit = async (id: string | number) => {
    if (!window.confirm('Submit this Delivery Challan?')) return;
    try {
      await api.post(`/delivery-note/${id}/submit`, {});
      toast.success('Submitted successfully');
      fetchChallans();
    } catch (err) {
      toast.error('Failed to submit');
    }
    setShowMoreMenu(null);
  };

  const toggleMenu = (id: string | number) => {
    setShowMoreMenu(showMoreMenu === String(id) ? null : String(id));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('All');
    setStartDate('');
    setEndDate('');
    setTempStartDate('');
    setTempEndDate('');
    setSelectedQuickFilter('');
    setCurrentPage(1);
    setShowDatePicker(false);
  };

  const openDatePicker = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setShowDatePicker(true);
  };

  const applyDateFilter = () => {
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setShowDatePicker(false);
    if (tempStartDate || tempEndDate) {
      toast.success('Date range applied');
    }
  };

  const clearDateFilters = () => {
    setTempStartDate('');
    setTempEndDate('');
    setSelectedQuickFilter('');
    setStartDate('');
    setEndDate('');
    setShowDatePicker(false);
  };

  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonthIndex = (year: number, month: number): number => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = (): (number | null)[] => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayIndex = getFirstDayOfMonthIndex(currentYear, currentMonth);
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const isDateInRange = (day: number): boolean => {
    if (!tempStartDate && !tempEndDate) return false;
    const date = new Date(currentYear, currentMonth, day);
    const dateStr = date.toISOString().split('T')[0];
    
    if (tempStartDate && tempEndDate) {
      return dateStr >= tempStartDate && dateStr <= tempEndDate;
    }
    if (tempStartDate) {
      return dateStr >= tempStartDate;
    }
    if (tempEndDate) {
      return dateStr <= tempEndDate;
    }
    return false;
  };

  const isDateSelected = (day: number): boolean => {
    const date = new Date(currentYear, currentMonth, day);
    const dateStr = date.toISOString().split('T')[0];
    return dateStr === tempStartDate || dateStr === tempEndDate;
  };

  const handleDateClick = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    const dateStr = date.toISOString().split('T')[0];
    
    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      setTempStartDate(dateStr);
      setTempEndDate('');
      setSelectedQuickFilter('');
    } else if (tempStartDate && !tempEndDate) {
      if (dateStr < tempStartDate) {
        setTempStartDate(dateStr);
        setTempEndDate('');
      } else {
        setTempEndDate(dateStr);
        setSelectedQuickFilter('');
      }
    }
  };

  const changeMonth = (delta: number) => {
    const newMonth = currentMonth + delta;
    if (newMonth < 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else if (newMonth > 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(newMonth);
    }
  };

  const getMonthName = (month: number): string => {
    return new Date(currentYear, month).toLocaleString('en-US', { month: 'long' });
  };

  // ===== RENDER =====
  return (
    <div className="quotation-page">
      <style>{`
        .quotation-page {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #f5f7fb;
          border-radius: 8px;
          padding: 20px;
          gap: 16px;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .quotation-page::-webkit-scrollbar {
          width: 6px;
        }
        .quotation-page::-webkit-scrollbar-track {
          background: #f9fafb;
          border-radius: 3px;
        }
        .quotation-page::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 3px;
        }
        .quotation-page::-webkit-scrollbar-thumb:hover {
          background: #6366f1;
        }

        .qt-filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          flex-shrink: 0;
        }

        .qt-filter-left {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 200px;
          gap: 8px;
        }

        .qt-search-wrapper {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .qt-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          font-size: 14px;
        }

        .qt-search-input {
          width: 100%;
          padding: 8px 36px 8px 36px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 13px;
          background: #ffffff;
          color: #374151;
          outline: none;
          transition: border-color 0.2s;
          height: 38px;
        }

        .qt-search-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .qt-search-input::placeholder {
          color: #9ca3af;
        }

        .qt-search-clear {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          padding: 4px;
          display: flex;
          align-items: center;
        }

        .qt-filter-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .qt-filter-select {
          padding: 7px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 13px;
          background: #ffffff;
          color: #374151;
          cursor: pointer;
          outline: none;
          height: 38px;
        }

        .qt-filter-select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .qt-btn-new {
          display: flex;
          align-items: center;
          gap: 6px;
          height: 38px;
          padding: 0 16px;
          border: none;
          border-radius: 8px;
          background: #6366f1;
          color: white;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }

        .qt-btn-new:hover {
          background: #4f46e5;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .qt-btn-secondary {
          display: flex;
          align-items: center;
          gap: 6px;
          height: 38px;
          padding: 0 14px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #ffffff;
          font-size: 13px;
          color: #374151;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }

        .qt-btn-secondary:hover {
          background: #f9fafb;
        }

        .qt-date-picker-container {
          position: relative;
          display: inline-block;
        }

        .qt-date-picker-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px 14px;
          cursor: pointer;
          transition: all 0.2s;
          color: #1e293b;
          font-size: 13px;
          min-height: 38px;
        }

        .qt-date-picker-trigger:hover {
          border-color: #2563eb;
          background: #f8fafc;
        }

        .qt-date-picker-trigger.active {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .qt-date-picker-trigger .qt-calendar-icon {
          color: #2563eb;
          font-size: 16px;
        }

        .qt-date-picker-trigger .qt-date-label {
          font-weight: 500;
        }

        .qt-date-picker-trigger .qt-date-label.placeholder {
          color: #6b7280;
          font-weight: 400;
        }

        .qt-date-picker-trigger .qt-date-range-display {
          color: #2563eb;
          font-weight: 500;
        }

        .qt-date-picker-popup {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          padding: 20px;
          z-index: 1000;
          min-width: 340px;
          width: 340px;
        }

        .qt-date-picker-popup .qt-popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .qt-date-picker-popup .qt-popup-header .qt-popup-title {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }

        .qt-date-picker-popup .qt-popup-header .qt-popup-close {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          font-size: 16px;
          padding: 4px;
        }

        .qt-date-picker-popup .qt-popup-header .qt-popup-close:hover {
          color: #1e293b;
        }

        .qt-date-picker-popup .qt-quick-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .qt-date-picker-popup .qt-quick-filter-btn {
          padding: 4px 14px;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          background: #ffffff;
          color: #6b7280;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .qt-date-picker-popup .qt-quick-filter-btn:hover {
          border-color: #2563eb;
          color: #2563eb;
        }

        .qt-date-picker-popup .qt-quick-filter-btn.active {
          background: #2563eb;
          border-color: #2563eb;
          color: #fff;
        }

        .qt-date-picker-popup .qt-calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .qt-date-picker-popup .qt-calendar-header .qt-month-year {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }

        .qt-date-picker-popup .qt-calendar-header .qt-nav-btn {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 4px 8px;
          font-size: 14px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .qt-date-picker-popup .qt-calendar-header .qt-nav-btn:hover {
          background: #f3f4f6;
        }

        .qt-date-picker-popup .qt-calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
          margin-bottom: 12px;
        }

        .qt-date-picker-popup .qt-calendar-grid .qt-day-header {
          text-align: center;
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          padding: 4px 0;
        }

        .qt-date-picker-popup .qt-calendar-grid .qt-day-cell {
          text-align: center;
          padding: 6px 4px;
          font-size: 13px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          color: #1e293b;
          position: relative;
        }

        .qt-date-picker-popup .qt-calendar-grid .qt-day-cell.empty {
          cursor: default;
        }

        .qt-date-picker-popup .qt-calendar-grid .qt-day-cell:hover:not(.empty):not(.in-range) {
          background: #f3f4f6;
        }

        .qt-date-picker-popup .qt-calendar-grid .qt-day-cell.in-range {
          background: rgba(37, 99, 235, 0.1);
        }

        .qt-date-picker-popup .qt-calendar-grid .qt-day-cell.selected {
          background: #2563eb;
          color: #fff;
          font-weight: 600;
        }

        .qt-date-picker-popup .qt-calendar-grid .qt-day-cell.selected-start {
          background: #2563eb;
          color: #fff;
          font-weight: 600;
          border-radius: 6px 0 0 6px;
        }

        .qt-date-picker-popup .qt-calendar-grid .qt-day-cell.selected-end {
          background: #2563eb;
          color: #fff;
          font-weight: 600;
          border-radius: 0 6px 6px 0;
        }

        .qt-date-picker-popup .qt-calendar-grid .qt-day-cell.range-middle {
          background: rgba(37, 99, 235, 0.15);
        }

        .qt-date-picker-popup .qt-calendar-grid .qt-day-cell.today {
          border: 1px solid #2563eb;
        }

        .qt-date-picker-popup .qt-popup-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }

        .qt-date-picker-popup .qt-popup-actions button {
          padding: 6px 16px;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .qt-date-picker-popup .qt-popup-actions .qt-btn-apply {
          background: #2563eb;
          color: #fff;
        }

        .qt-date-picker-popup .qt-popup-actions .qt-btn-apply:hover {
          background: #1d4ed8;
        }

        .qt-date-picker-popup .qt-popup-actions .qt-btn-clear {
          background: transparent;
          color: #6b7280;
        }

        .qt-date-picker-popup .qt-popup-actions .qt-btn-clear:hover {
          background: #f3f4f6;
        }

        .qt-date-picker-popup .qt-popup-actions .qt-btn-cancel {
          background: transparent;
          color: #6b7280;
        }

        .qt-date-picker-popup .qt-popup-actions .qt-btn-cancel:hover {
          background: #f3f4f6;
        }

        .qt-active-filters {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px;
          background: rgba(99, 102, 241, 0.08);
          border-radius: 8px;
          font-size: 12px;
          flex-wrap: wrap;
          border: 1px solid #e5e7eb;
          flex-shrink: 0;
        }

        .qt-active-filters span {
          color: #111827;
        }

        .qt-clear-filters {
          margin-left: auto;
          padding: 4px 12px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 4px;
          color: #6b7280;
          transition: all 0.15s;
        }

        .qt-clear-filters:hover {
          background: #f3f4f6;
        }

        .qt-table-wrap {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          border: 1px solid #e5e7eb;
          overflow-x: auto;
          overflow-y: visible;
          flex: 0 0 auto;
        }

        .qt-table-wrap::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .qt-table-wrap::-webkit-scrollbar-track {
          background: #f9fafb;
          border-radius: 3px;
        }
        .qt-table-wrap::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 3px;
        }
        .qt-table-wrap::-webkit-scrollbar-thumb:hover {
          background: #6366f1;
        }

        .qt-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 700px;
        }

        .qt-th {
          padding: 12px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .qt-tr {
          cursor: default;
          transition: background 0.15s;
        }

        .qt-tr:hover {
          background: #f9fafb;
        }

        .qt-tr+.qt-tr td {
          border-top: 1px solid #f3f4f6;
        }

        .qt-td {
          padding: 12px 16px;
          color: #374151;
          vertical-align: middle;
          text-align: left;
        }

        .qt-td-dcno {
          font-weight: 600;
          color: #111827;
          font-family: monospace;
        }

        .qt-td-customer {
          font-weight: 500;
          color: #6366f1;
          cursor: pointer;
        }

        .qt-td-customer:hover {
          text-decoration: underline;
        }

        .qt-td-amount {
          font-weight: 600;
          font-size: 14px;
          color: #1f2433;
        }

        .qt-status-badge {
          display: inline-flex;
          align-items: center;
          height: 24px;
          padding: 0 12px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 600;
          gap: 4px;
        }

        .qt-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
        }

        .qt-action-buttons {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .qt-action-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          background: transparent;
          color: #6b7280;
        }

        .qt-action-btn:hover {
          background: #f3f4f6;
        }

        .qt-action-more {
          color: #6b7280;
        }

        .qt-action-more:hover {
          background: #f3f4f6;
        }

        .qt-more-menu-container {
          position: relative;
          display: inline-block;
        }

        .qt-more-menu-dropdown {
          position: absolute;
          right: 0;
          top: 100%;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          min-width: 180px;
          z-index: 100;
          padding: 4px 0;
          margin-top: 4px;
        }

        .qt-more-menu-dropdown button {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 8px 16px;
          border: none;
          background: transparent;
          color: #1e293b;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .qt-more-menu-dropdown button:hover {
          background: #f8fafc;
          color: #2563eb;
        }

        .qt-more-menu-dropdown button.danger {
          color: #ef4444;
        }

        .qt-more-menu-dropdown button.danger:hover {
          background: #fef2f2;
        }

        .qt-more-menu-dropdown .menu-divider {
          height: 1px;
          background: #e5e7eb;
          margin: 4px 0;
        }

        .qt-empty-state {
          padding: 60px 20px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .qt-empty-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .qt-empty-content svg {
          color: #9ca3af;
        }

        .qt-empty-content p {
          font-size: 18px;
          font-weight: 500;
          color: #111827;
          margin: 0;
        }

        .qt-empty-content span {
          font-size: 14px;
          color: #6b7280;
        }

        .qt-loading {
          padding: 40px;
          text-align: center;
          color: #6b7280;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .qt-error {
          padding: 40px;
          text-align: center;
          color: #ef4444;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .qt-retry-btn {
          margin-top: 12px;
          padding: 8px 20px;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .qt-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0 0 0;
          flex-wrap: wrap;
          gap: 12px;
          background: transparent;
          flex-shrink: 0;
          border-top: 1px solid #e5e7eb;
          margin-top: 4px;
        }

        .qt-pagination-left,
        .qt-pagination-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .qt-pagination-center {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .qt-pagination-label {
          font-size: 13px;
          color: #6b7280;
        }

        .qt-page-size-select {
          padding: 6px 10px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 13px;
          background: #ffffff;
          color: #374151;
          cursor: pointer;
          height: 34px;
        }

        .qt-page-size-select:focus {
          border-color: #6366f1;
          outline: none;
        }

        .qt-page-btn {
          height: 34px;
          min-width: 34px;
          padding: 0 10px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: #ffffff;
          font-size: 13px;
          color: #374151;
          cursor: pointer;
          transition: all 0.15s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .qt-page-btn:hover:not(:disabled) {
          background: #f3f4f6;
          border-color: #6366f1;
        }

        .qt-page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .qt-page-btn-active {
          background: #6366f1;
          color: white;
          border-color: #6366f1;
        }

        .qt-page-btn-active:hover {
          background: #4f46e5;
        }

        .qt-pagination-info {
          font-size: 13px;
          color: #6b7280;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .quotation-page {
            padding: 12px;
            gap: 12px;
          }

          .qt-filter-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .qt-filter-left {
            width: 100%;
            flex-wrap: wrap;
          }

          .qt-search-wrapper {
            max-width: 100%;
          }

          .qt-filter-right {
            justify-content: flex-start;
            flex-wrap: wrap;
          }

          .qt-date-picker-popup {
            left: -50px;
            min-width: 280px;
            width: 280px;
          }

          .qt-table {
            min-width: 600px;
          }

          .qt-pagination {
            flex-direction: column;
            align-items: center;
          }

          .qt-pagination-center {
            order: 2;
          }

          .qt-pagination-left,
          .qt-pagination-right {
            order: 1;
          }

          .qt-td {
            padding: 10px 12px;
            font-size: 12px;
          }

          .qt-th {
            padding: 10px 12px;
            font-size: 11px;
          }
        }

        @media (max-width: 480px) {
          .qt-filter-right {
            flex-direction: column;
            width: 100%;
          }

          .qt-filter-right > * {
            width: 100%;
          }

          .qt-btn-new {
            justify-content: center;
          }

          .qt-pagination {
            padding: 8px 0 0 0;
          }

          .qt-pagination-center {
            flex-wrap: wrap;
            justify-content: center;
          }
        }
      `}</style>

      {/* ===== FILTER BAR ===== */}
      <div className="qt-filter-bar">
        <div className="qt-filter-left">
          <div className="qt-search-wrapper">
            <FaSearch className="qt-search-icon" />
            <input
              type="text"
              placeholder="Search by DC No, Customer Name, or Customer Code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="qt-search-input"
            />
            {searchTerm && (
              <button className="qt-search-clear" onClick={() => setSearchTerm("")}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="qt-filter-right">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="qt-filter-select"
          >
            <option value="All">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          
          <div className="qt-date-picker-container">
            <div 
              className={`qt-date-picker-trigger ${showDatePicker ? 'active' : ''}`}
              onClick={openDatePicker}
            >
              <FaCalendarAlt className="qt-calendar-icon" />
              <span className={`qt-date-label ${!startDate && !endDate ? 'placeholder' : ''}`}>
                {startDate || endDate ? (
                  <span className="qt-date-range-display">
                    {startDate ? formatDateForDisplay(startDate) : 'Start'} – {endDate ? formatDateForDisplay(endDate) : 'End'}
                  </span>
                ) : (
                  'Filter by Date'
                )}
              </span>
            </div>
            
            {showDatePicker && (
              <div className="qt-date-picker-popup">
                <div className="qt-popup-header">
                  <span className="qt-popup-title">Filter by Date</span>
                  <button className="qt-popup-close" onClick={() => setShowDatePicker(false)}>
                    <FaTimes size={14} />
                  </button>
                </div>
                
                <div className="qt-quick-filters">
                  <button 
                    className={`qt-quick-filter-btn ${selectedQuickFilter === 'today' ? 'active' : ''}`}
                    onClick={() => applyQuickFilter('today')}
                  >
                    Today
                  </button>
                  <button 
                    className={`qt-quick-filter-btn ${selectedQuickFilter === 'last7' ? 'active' : ''}`}
                    onClick={() => applyQuickFilter('last7')}
                  >
                    Last 7 Days
                  </button>
                  <button 
                    className={`qt-quick-filter-btn ${selectedQuickFilter === 'last30' ? 'active' : ''}`}
                    onClick={() => applyQuickFilter('last30')}
                  >
                    Last 30 Days
                  </button>
                  <button 
                    className={`qt-quick-filter-btn ${selectedQuickFilter === 'thisMonth' ? 'active' : ''}`}
                    onClick={() => applyQuickFilter('thisMonth')}
                  >
                    This Month
                  </button>
                </div>
                
                <div className="qt-calendar-header">
                  <button className="qt-nav-btn" onClick={() => changeMonth(-1)}>
                    <FaChevronLeft size={12} />
                  </button>
                  <span className="qt-month-year">
                    {getMonthName(currentMonth)} {currentYear}
                  </span>
                  <button className="qt-nav-btn" onClick={() => changeMonth(1)}>
                    <FaChevronRight size={12} />
                  </button>
                </div>
                
                <div className="qt-calendar-grid">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="qt-day-header">{day}</div>
                  ))}
                  {generateCalendarDays().map((day, index) => {
                    if (day === null) {
                      return <div key={`empty-${index}`} className="qt-day-cell empty"></div>;
                    }
                    
                    const dateObj = new Date(currentYear, currentMonth, day);
                    const dateStr = dateObj.toISOString().split('T')[0];
                    const isToday = dateStr === getTodayDate();
                    const isInRange = isDateInRange(day);
                    const isSelected = isDateSelected(day);
                    const isStart = dateStr === tempStartDate;
                    const isEnd = dateStr === tempEndDate;
                    
                    let className = 'qt-day-cell';
                    if (isToday) className += ' today';
                    if (isInRange && !isSelected) className += ' in-range';
                    if (isSelected) className += ' selected';
                    if (isStart && tempEndDate) className += ' selected-start';
                    if (isEnd && tempStartDate) className += ' selected-end';
                    if (isInRange && !isSelected && !isStart && !isEnd) className += ' range-middle';
                    
                    return (
                      <div 
                        key={day} 
                        className={className}
                        onClick={() => handleDateClick(day)}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
                
                <div className="qt-popup-actions">
                  <button className="qt-btn-clear" onClick={clearDateFilters}>
                    Clear
                  </button>
                  <button className="qt-btn-cancel" onClick={() => setShowDatePicker(false)}>
                    Cancel
                  </button>
                  <button className="qt-btn-apply" onClick={applyDateFilter}>
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button className="qt-btn-secondary" onClick={handleRefresh}>
            <FaSync size={12} /> Refresh
          </button>
          
          <button className="qt-btn-new" onClick={handleCreate}>
            <FaPlus size={12} /> New DC
          </button>
        </div>
      </div>

      {/* ===== ACTIVE FILTERS ===== */}
      {(searchTerm || selectedStatus !== "All" || startDate || endDate) && (
        <div className="qt-active-filters">
          <FaFilter size={12} style={{ color: "#6366f1" }} />
          <span>Active filters:</span>
          {searchTerm && (
            <span>
              <strong>Search:</strong> "{searchTerm}"
            </span>
          )}
          {selectedStatus !== "All" && (
            <span>
              <strong>Status:</strong> {selectedStatus}
            </span>
          )}
          {(startDate || endDate) && (
            <span>
              <strong>Date:</strong> {startDate ? formatDateForDisplay(startDate) : 'Any'} – {endDate ? formatDateForDisplay(endDate) : 'Any'}
            </span>
          )}
          <button onClick={clearFilters} className="qt-clear-filters">
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* ===== TABLE ===== */}
      <div className="qt-table-wrap">
        {loading && challans.length === 0 ? (
          <div className="qt-loading">
            <FaSpinner className="spinning" size={30} style={{ display: 'block', margin: '0 auto 12px' }} />
            <p>Loading delivery challans...</p>
          </div>
        ) : error ? (
          <div className="qt-error">
            <FaExclamationTriangle size={30} style={{ display: 'block', margin: '0 auto 12px' }} />
            <p>{error}</p>
            <button onClick={handleRefresh} className="qt-retry-btn">
              <FaSync size={12} style={{ marginRight: '6px' }} /> Retry
            </button>
          </div>
        ) : challans.length === 0 ? (
          <div className="qt-empty-state">
            <div className="qt-empty-content">
              <FaTruck size={48} />
              <p>No delivery challans found</p>
              <span>Try adjusting your search criteria or create a new one</span>
              <button className="qt-btn-new" onClick={handleCreate} style={{ marginTop: '12px' }}>
                <FaPlus size={12} /> New DC
              </button>
            </div>
          </div>
        ) : (
          <table className="qt-table">
            <thead>
              <tr>
                <th className="qt-th">DC No</th>
                <th className="qt-th">Customer</th>
                <th className="qt-th">Date</th>
                <th className="qt-th">Amount</th>
                <th className="qt-th">Status</th>
                <th className="qt-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {challans.map((item) => (
                <tr key={item.id} className="qt-tr">
                  <td className="qt-td qt-td-dcno">
                    {item.displayDcNumber || item.name || '-'}
                  </td>
                  <td className="qt-td">
                    <span className="qt-td-customer" onClick={() => handleView(item.id)}>
                      {item.customer_name || '-'}
                    </span>
                  </td>
                  <td className="qt-td">{formatDisplayDate(item.posting_date)}</td>
                  <td className="qt-td qt-td-amount">
                    ₹{item.grand_total?.toLocaleString() || '0'}
                  </td>
                  <td className="qt-td">
                    <StatusBadge status={item.status || 'Draft'} />
                  </td>
                  <td className="qt-td">
                    <div className="qt-action-buttons">
                      <button 
                        className="qt-action-btn" 
                        onClick={() => handlePrint(item)} 
                        title="Print"
                        disabled={printLoadingId === String(item.id)}
                      >
                        {printLoadingId === String(item.id) ? <FaSpinner className="spinning" size={12} /> : <FaPrintIcon size={12} />}
                      </button>
                      <div 
                        className="qt-more-menu-container" 
                        ref={(el) => { menuRefs.current[String(item.id)] = el }}
                      >
                        <button 
                          className="qt-action-btn qt-action-more" 
                          onClick={() => toggleMenu(item.id)} 
                          title="More"
                        >
                          <FaEllipsisV size={14} />
                        </button>
                        {showMoreMenu === String(item.id) && (
                          <div className="qt-more-menu-dropdown">
                            <button onClick={() => handleView(item.id)}>
                              <FaEye size={12} /> View
                            </button>
                            {item.status === 'Draft' && (
                              <>
                                <button onClick={() => handleEdit(item.id)}>
                                  <FaEdit size={12} /> Edit
                                </button>
                                <button onClick={() => handleSubmit(item.id)}>
                                  <FaPaperPlane size={12} /> Submit
                                </button>
                              </>
                            )}
                            <button onClick={() => handlePrint(item)} disabled={printLoadingId === String(item.id)}>
                              <FaPrintIcon size={12} /> Print
                            </button>
                            <button onClick={handlePDFDownload}>
                              <FaFilePdf size={12} /> Download PDF
                            </button>
                            <button onClick={handleExcelDownload}>
                              <FaFileExcel size={12} /> Download Excel
                            </button>
                            {item.status !== 'Cancelled' && item.status !== 'Submitted' && (
                              <button className="danger" onClick={() => handleCancel(item.id)}>
                                <FaBan size={12} /> Cancel
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ===== PAGINATION ===== */}
      {!loading && !error && (
        <div className="qt-pagination">
          <div className="qt-pagination-left">
            <span className="qt-pagination-label">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="qt-page-size-select"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="qt-pagination-info">
              {totalRecords > 0 ? (
                `Showing ${getStartIndex()} to ${getEndIndex()} of ${totalRecords} entries`
              ) : (
                'No entries to show'
              )}
            </span>
          </div>
          <div className="qt-pagination-center">
            <button
              onClick={goToFirstPage}
              disabled={currentPage === 1 || totalRecords === 0}
              className="qt-page-btn"
            >
              <FaAngleDoubleLeft size={12} />
            </button>
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 1 || totalRecords === 0}
              className="qt-page-btn"
            >
              <FaChevronLeft size={12} />
            </button>
            {totalRecords > 0 && getPageNumbers().map(page => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`qt-page-btn ${currentPage === page ? 'qt-page-btn-active' : ''}`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages || totalRecords === 0}
              className="qt-page-btn"
            >
              <FaChevronRight size={12} />
            </button>
            <button
              onClick={goToLastPage}
              disabled={currentPage === totalPages || totalRecords === 0}
              className="qt-page-btn"
            >
              <FaAngleDoubleRight size={12} />
            </button>
          </div>
          <div className="qt-pagination-right">
            <span className="qt-pagination-info">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryChallans;