// GRNForm.tsx
import { useState, useEffect, type FormEvent, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  FaArrowLeft,
  FaSave,
  FaSpinner,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimesCircle,
  FaPlus,
  FaTrash,
  FaWarehouse,
  FaTruck,
  FaFileInvoice,
  FaUser,
  FaCalendar,
  FaHashtag,
  FaBuilding,
  FaBox,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaFileAlt,
  FaCheck,
  FaTimes,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaUserCircle,
  FaChevronDown,
} from 'react-icons/fa';
import "./GRNForm.css";
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import api from '../services/api';

interface GRNItem {
  id: string;
  itemCode: string;
  itemName: string;
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  uom: string;
  rate: number;
  batchNo: string;
  expiryDate: string;
  remarks: string;
  poItemId?: number;
  itemId?: number;
}

interface ValidationError {
  field: string;
  label: string;
  message: string;
}

interface GRNData {
  id?: string;
  grn_number: string;
  supplier_id: number;
  grnDate: string;
  supplier: string;
  supplierId?: number;
  purchaseOrder: string;
  purchaseOrderId?: number;
  warehouse: string;
  warehouseId?: number;
  receivedBy: string;
  receivedById?: number;
  vehicleNo: string;
  deliveryChallanNo: string;
  invoiceNo: string;
  status: 'draft' | 'submitted' | 'completed' | 'rejected';
  items: GRNItem[];
}

interface PurchaseOrder {
  id: number;
  name: string;
  supplier_name: string;
  supplier: string;
  company: string;
  transaction_date: string;
  schedule_date: string;
  currency: string;
  total_qty: number;
  total: number;
  net_total: number;
  grand_total: number;
  rounded_total: number;
  status: string;
  per_received: number;
  per_billed: number;
  title?: string;
}

interface PurchaseOrderDetail extends PurchaseOrder {
  items: POItem[];
  terms?: string;
  address_display?: string;
  contact_display?: string;
  contact_mobile?: string;
  contact_email?: string;
  cost_center?: string;
  set_warehouse?: string;
  tax_category?: string;
  shipping_rule?: string;
  incoterm?: string;
  named_place?: string;
  payment_terms_template?: string;
  tc_name?: string;
  conversion_rate?: number;
  price_list_currency?: string;
  plc_conversion_rate?: number;
  supplier_id?: number;
}

interface POItem {
  id: number;
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
  amount: number;
  received_qty: number;
  returned_qty: number;
  billed_amt: number;
  warehouse?: string;
  expense_account?: string;
  weight_per_unit?: number;
  weight_uom?: string;
  item_tax_rate?: number;
  item_tax_template?: string;
  cost_center?: string;
}

interface POApiResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: PurchaseOrder[];
  };
}

interface PODetailApiResponse {
  success: number;
  data: PurchaseOrderDetail;
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

interface WarehouseApiResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: Warehouse[];
  };
}

interface Employee {
  id: number;
  employee_name: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  designation: string;
  department: string;
  company_email: string;
  cell_number: string;
  status: string;
  user_id: string | null;
}

interface EmployeeApiResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: Employee[];
  };
}

export default function GRNForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useAdminTheme();
  const isNew = id === "new";
  const isEditMode = !isNew && Boolean(id);

  // ─── Form State ────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<GRNData>({
    grn_number: '',
    supplier_id:undefined,
    grnDate: new Date().toISOString().split('T')[0],
    supplier: '',
    supplierId: undefined,
    purchaseOrder: '',
    purchaseOrderId: undefined,
    warehouse: '',
    warehouseId: undefined,
    receivedBy: '',
    receivedById: undefined,
    vehicleNo: '',
    deliveryChallanNo: '',
    invoiceNo: '',
    status: 'draft',
    items: [],
  });

  const [, setIsDirty] = useState(isNew);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(isEditMode);

  // ─── PO Dropdown States ──────────────────────────────────────────────
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loadingPOs, setLoadingPOs] = useState(false);
  const [poSearchTerm, setPOSearchTerm] = useState('');
  const [showPODropdown, setShowPODropdown] = useState(false);
  const [poCurrentPage, setPOCurrentPage] = useState(1);
  const [poItemsPerPage] = useState(10);
  const [totalPOs, setTotalPOs] = useState(0);
  const [poDetailLoading, setPODetailLoading] = useState(false);
  const poInputRef = useRef<HTMLInputElement>(null);
  const poDropdownRef = useRef<HTMLDivElement>(null);

  // ─── Warehouse State ────────────────────────────────────────────────
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [warehouseSearchTerm, setWarehouseSearchTerm] = useState('');
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);
  const warehouseInputRef = useRef<HTMLInputElement>(null);
  const warehouseDropdownRef = useRef<HTMLDivElement>(null);

  // ─── Employee State ──────────────────────────────────────────────────
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const employeeInputRef = useRef<HTMLInputElement>(null);
  const employeeDropdownRef = useRef<HTMLDivElement>(null);

  // ─── Fetch Warehouses ──────────────────────────────────────────────
  const fetchWarehouses = async () => {
    setLoadingWarehouses(true);
    try {
      const response = await api.get<WarehouseApiResponse>('/warehouse');
      if (response.data.success === 1) {
        const records = response.data.data.records || [];
        setWarehouses(records);
      }
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    } finally {
      setLoadingWarehouses(false);
    }
  };

  // ─── Fetch Employees ────────────────────────────────────────────────
  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const response = await api.get<EmployeeApiResponse>('/employee');
      if (response.data.success === 1) {
        const records = response.data.data.records || [];
        setEmployees(records);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // ─── Fetch Purchase Orders ──────────────────────────────────────────
  const fetchPurchaseOrders = async () => {
    setLoadingPOs(true);
    try {
      const response = await api.get<POApiResponse>(`/purchase-order?page=${poCurrentPage}&limit=${poItemsPerPage}`);
      
      if (response.data.success === 1) {
        const records = response.data.data.records || [];
        setPurchaseOrders(records);
        setTotalPOs(response.data.data.total || records.length);
      }
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
    } finally {
      setLoadingPOs(false);
    }
  };

  // ─── Fetch Purchase Order Details ──────────────────────────────────
  const fetchPurchaseOrderDetail = async (poId: number) => {
    setPODetailLoading(true);
    try {
      const response = await api.get<PODetailApiResponse>(`/purchase-order/${poId}`);
      
      if (response.data.success === 1) {
        const poDetail = response.data.data;
        populateGRNFromPO(poDetail);
        setShowPODropdown(false);
      }
    } catch (err) {
      console.error('Error fetching purchase order details:', err);
      setApiError('Failed to fetch PO details');
    } finally {
      setPODetailLoading(false);
    }
  };

  // ─── Populate GRN from PO ──────────────────────────────────────────
  const populateGRNFromPO = (poDetail: PurchaseOrderDetail) => {
    const items: GRNItem[] = poDetail.items.map((item, index) => ({
      id: `po-${poDetail.id}-${index}-${Date.now()}`,
      itemCode: item.item_code || '',
      itemName: item.item_name || '',
      orderedQty: item.qty || 0,
      receivedQty: 0,
      acceptedQty: 0,
      rejectedQty: 0,
      uom: item.uom || '',
      rate: item.rate || 0,
      batchNo: '',
      expiryDate: '',
      remarks: '',
      poItemId: item.id,
      itemId: undefined,
    }));

    // Find warehouse ID from the warehouses list
    let warehouseId: number | undefined;
    if (poDetail.set_warehouse) {
      const found = warehouses.find(w => w.warehouse_name === poDetail.set_warehouse);
      if (found) {
        warehouseId = found.id;
      }
    }

    // Extract supplier ID from the PO detail
    let supplierId: number | undefined = poDetail.supplier_id;
    // If supplier_id is not directly available, try to extract from supplier field
    if (!supplierId && poDetail.supplier) {
      const supplierNum = parseInt(poDetail.supplier);
      if (!isNaN(supplierNum)) {
        supplierId = supplierNum;
      }
    }

    setFormData(prev => ({
      ...prev,
      supplier: poDetail.supplier_name || '',
      supplierId: supplierId,
      purchaseOrder: poDetail.name || '',
      purchaseOrderId: poDetail.id,
      warehouse: poDetail.set_warehouse || '',
      warehouseId: warehouseId,
      items: items,
    }));
    
    if (poDetail.set_warehouse) {
      setWarehouseSearchTerm(poDetail.set_warehouse);
    }
    
    setIsDirty(true);
  };

  // ─── Filtered Warehouses ──────────────────────────────────────────
  const filteredWarehouses = warehouses.filter(w => 
    w.warehouse_name.toLowerCase().includes(warehouseSearchTerm.toLowerCase()) ||
    (w.city && w.city.toLowerCase().includes(warehouseSearchTerm.toLowerCase()))
  );

  // ─── Filtered Employees ──────────────────────────────────────────
  const filteredEmployees = employees.filter(e => 
    e.employee_name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
    (e.designation && e.designation.toLowerCase().includes(employeeSearchTerm.toLowerCase())) ||
    (e.department && e.department.toLowerCase().includes(employeeSearchTerm.toLowerCase()))
  );

  // ─── Filtered POs ─────────────────────────────────────────────────
  const filteredPOs = purchaseOrders.filter(po => {
    const searchLower = poSearchTerm.toLowerCase();
    return po.name.toLowerCase().includes(searchLower) ||
           po.supplier_name.toLowerCase().includes(searchLower) ||
           po.id.toString().includes(searchLower);
  });

  // ─── Click outside handlers ──────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        warehouseDropdownRef.current && 
        !warehouseDropdownRef.current.contains(event.target as Node) &&
        warehouseInputRef.current &&
        !warehouseInputRef.current.contains(event.target as Node)
      ) {
        setShowWarehouseDropdown(false);
      }
      if (
        employeeDropdownRef.current && 
        !employeeDropdownRef.current.contains(event.target as Node) &&
        employeeInputRef.current &&
        !employeeInputRef.current.contains(event.target as Node)
      ) {
        setShowEmployeeDropdown(false);
      }
      if (
        poDropdownRef.current && 
        !poDropdownRef.current.contains(event.target as Node) &&
        poInputRef.current &&
        !poInputRef.current.contains(event.target as Node)
      ) {
        setShowPODropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Fetch GRN data for edit mode ────────────────────────────────────
  useEffect(() => {
    if (isEditMode && id) {
      fetchGRNData(id);
    }
    if (location.state?.poData) {
      const poData = location.state.poData as PurchaseOrderDetail;
      populateGRNFromPO(poData);
    }
    fetchWarehouses();
    fetchEmployees();
    fetchPurchaseOrders();
  }, [id, isEditMode, location.state]);

  // ─── Fetch POs when search changes ─────────────────────────────────
  useEffect(() => {
    if (showPODropdown) {
      fetchPurchaseOrders();
    }
  }, [showPODropdown, poCurrentPage]);

  const fetchGRNData = async (grnId: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/grn/${grnId}`);
      if (response.data.success === 1) {
        const data = response.data.data;
        setFormData({
          grn_number: data.grn_no || '',
          grnDate: data.grn_date || new Date().toISOString().split('T')[0],
           supplier_id:data.id,
          supplier: data.supplier_name || data.supplier || '',
          supplierId: data.id,
          purchaseOrder: data.purchase_order_name || data.purchase_order || '',
          purchaseOrderId: data.purchase_order_id,
          warehouse: data.warehouse_name || data.warehouse || '',
          warehouseId: data.warehouse_id,
          receivedBy: data.received_by_name || data.received_by || '',
          receivedById: data.received_by_id,
          vehicleNo: data.vehicle_no || '',
          deliveryChallanNo: data.delivery_challan_no || '',
          invoiceNo: data.invoice_no || '',
          status: data.status || 'draft',
          items: data.items || [],
        });
        setWarehouseSearchTerm(data.warehouse_name || data.warehouse || '');
        setEmployeeSearchTerm(data.received_by_name || data.received_by || '');
        setPOSearchTerm(data.purchase_order_name || data.purchase_order || '');
      }
    } catch (err) {
      console.error('Error fetching GRN:', err);
      setApiError('Failed to load GRN data');
    } finally {
      setLoading(false);
    }
  };

  // ─── Validation ──────────────────────────────────────────────────────
  const getAllValidationErrors = (): ValidationError[] => {
    const allErrors: ValidationError[] = [];

    if (!formData.supplier.trim()) {
      allErrors.push({ field: 'supplier', label: 'Supplier', message: 'Supplier is required' });
    }
    if (!formData.purchaseOrder.trim()) {
      allErrors.push({ field: 'purchaseOrder', label: 'Purchase Order', message: 'Purchase Order is required' });
    }
    if (!formData.warehouse.trim()) {
      allErrors.push({ field: 'warehouse', label: 'Warehouse', message: 'Warehouse is required' });
    }
    if (!formData.receivedBy.trim()) {
      allErrors.push({ field: 'receivedBy', label: 'Received By', message: 'Received By is required' });
    }
    if (formData.items.length === 0) {
      allErrors.push({ field: 'items', label: 'Items', message: 'At least one item is required' });
    }

    formData.items.forEach((item, index) => {
      if (!item.itemCode.trim()) {
        allErrors.push({ field: `items[${index}].itemCode`, label: `Item ${index + 1} Code`, message: 'Item code is required' });
      }
      if (!item.itemName.trim()) {
        allErrors.push({ field: `items[${index}].itemName`, label: `Item ${index + 1} Name`, message: 'Item name is required' });
      }
      if (item.receivedQty <= 0) {
        allErrors.push({ field: `items[${index}].receivedQty`, label: `Item ${index + 1} Received Qty`, message: 'Received quantity must be greater than 0' });
      }
      if (item.acceptedQty < 0) {
        allErrors.push({ field: `items[${index}].acceptedQty`, label: `Item ${index + 1} Accepted Qty`, message: 'Accepted quantity cannot be negative' });
      }
      if (item.rejectedQty < 0) {
        allErrors.push({ field: `items[${index}].rejectedQty`, label: `Item ${index + 1} Rejected Qty`, message: 'Rejected quantity cannot be negative' });
      }
      if (item.acceptedQty + item.rejectedQty > item.receivedQty) {
        allErrors.push({ field: `items[${index}].acceptedQty`, label: `Item ${index + 1} Quantities`, message: 'Accepted + Rejected cannot exceed Received quantity' });
      }
    });

    return allErrors;
  };

  // ─── Handlers ────────────────────────────────────────────────────────
  const handleFieldChange = (field: keyof GRNData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleWarehouseSelect = (warehouse: Warehouse) => {
    setFormData(prev => ({ 
      ...prev, 
      warehouse: warehouse.warehouse_name,
      warehouseId: warehouse.id
    }));
    setWarehouseSearchTerm(warehouse.warehouse_name);
    setShowWarehouseDropdown(false);
    setIsDirty(true);
  };

  const handleEmployeeSelect = (employee: Employee) => {
    setFormData(prev => ({ 
      ...prev, 
      receivedBy: employee.employee_name,
      receivedById: employee.id
    }));
    setEmployeeSearchTerm(employee.employee_name);
    setShowEmployeeDropdown(false);
    setIsDirty(true);
  };

  const handlePOSelect = (po: PurchaseOrder) => {
    setPOSearchTerm(po.name);
    setFormData(prev => ({
      ...prev,
      purchaseOrder: po.name,
      purchaseOrderId: po.id,
      supplier: po.supplier_name,
      // Extract supplier ID from the supplier field
      supplierId: po.supplier ? parseInt(po.supplier) || undefined : undefined,
    }));
    setShowPODropdown(false);
    // Fetch PO details to get items
    fetchPurchaseOrderDetail(po.id);
  };

  const handleItemChange = (index: number, field: keyof GRNItem, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    if (field === 'receivedQty' || field === 'acceptedQty' || field === 'rejectedQty') {
      const item = updatedItems[index];
      if (item.acceptedQty + item.rejectedQty > item.receivedQty) {
        // Validation will catch this
      }
    }

    setFormData(prev => ({ ...prev, items: updatedItems }));
    setIsDirty(true);
  };

  const addItem = () => {
    const newItem: GRNItem = {
      id: Date.now().toString(),
      itemCode: '',
      itemName: '',
      orderedQty: 0,
      receivedQty: 0,
      acceptedQty: 0,
      rejectedQty: 0,
      uom: '',
      rate: 0,
      batchNo: '',
      expiryDate: '',
      remarks: '',
    };
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    setIsDirty(true);
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
    setIsDirty(true);
  };

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError(null);

    const validationErrorsList = getAllValidationErrors();
    if (validationErrorsList.length > 0) {
      setValidationErrors(validationErrorsList);
      setShowValidationSummary(true);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        grn_number: formData.grn_number || `GRN-${Date.now()}`,
        grn_date: formData.grnDate,
        supplier: formData.supplier,
        supplier_id: formData.purchaseOrderId,
        purchase_order: formData.purchaseOrder,
        purchase_order_id: formData.purchaseOrderId,
        warehouse: formData.warehouse,
        warehouse_id: formData.warehouseId,
        received_by: formData.receivedBy,
        received_by_id: formData.receivedById,
        vehicle_no: formData.vehicleNo,
        delivery_challan_no: formData.deliveryChallanNo,
        invoice_no: formData.invoiceNo,
        status: formData.status,
        items: formData.items.map(item => ({
          item_code: item.itemCode,
          item_name: item.itemName,
          item_id: item.poItemId,
          po_item_id: item.poItemId,
          ordered_qty: item.orderedQty,
          received_qty: item.receivedQty,
          accepted_qty: item.acceptedQty,
          rejected_qty: item.rejectedQty,
          uom: item.uom,
          rate: item.rate,
          batch_no: item.batchNo,
          expiry_date: item.expiryDate,
          remarks: item.remarks,
        })),
      };

      let response;
      if (isEditMode && id) {
        response = await api.put(`/grn/${id}`, payload);
      } else {
        response = await api.post('/grn', payload);
      }

      if (response.data && response.data.success === 1) {
        console.log('GRN saved successfully:', response.data);
        setIsDirty(false);
        navigate('/grn');
      } else {
        setApiError(response.data?.message || 'Failed to save GRN');
      }
    } catch (err: any) {
      console.error('Error saving GRN:', err);

      if (err.response) {
        if (err.response.status === 409) {
          setApiError('A GRN with this number already exists');
        } else if (err.response.status === 400) {
          setApiError(err.response.data?.message || 'Invalid data provided');
        } else {
          setApiError(err.response.data?.message || 'Failed to save GRN');
        }
      } else if (err.request) {
        setApiError('Network error. Please check your connection.');
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const hasErrors = getAllValidationErrors().length > 0;

  const getPOStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Draft': return 'grn-status-draft';
      case 'Submitted': return 'grn-status-submitted';
      case 'Partially Received': return 'grn-status-partial';
      case 'Fully Received': return 'grn-status-completed';
      case 'Cancelled': return 'grn-status-rejected';
      case 'Closed': return 'grn-status-closed';
      default: return 'grn-status-draft';
    }
  };

  if (loading) {
    return (
      <div className="grnf-page">
        <div className="grnf-inner">
          <div className="grnf-loading">Loading GRN data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`grnf-page ${theme}`}>
      <div className="grnf-inner">

        {/* ─── Validation Summary Modal ────────────────────────────── */}
        {showValidationSummary && validationErrors.length > 0 && (
          <div className="grnf-modal-overlay" onClick={() => setShowValidationSummary(false)}>
            <div className="grnf-validation-modal" onClick={(e) => e.stopPropagation()}>
              <div className="grnf-modal-header">
                <h2>
                  <FaExclamationTriangle /> Missing Required Fields
                </h2>
                <button className="grnf-modal-close" onClick={() => setShowValidationSummary(false)}>×</button>
              </div>
              <div className="grnf-modal-body">
                <p className="grnf-modal-description">
                  Please fill in the following required fields before submitting:
                </p>
                <div className="grnf-validation-errors-list">
                  {validationErrors.map((error, idx) => (
                    <div key={idx} className="grnf-validation-error-item">
                      <div className="grnf-error-header">
                        <FaTimesCircle className="grnf-error-icon" />
                        <strong>{error.label}</strong>
                      </div>
                      <div className="grnf-error-message">{error.message}</div>
                    </div>
                  ))}
                </div>
                <div className="grnf-validation-tip">
                  <FaInfoCircle className="grnf-tip-icon" />
                  Please fix the errors above before submitting
                </div>
              </div>
              <div className="grnf-modal-footer">
                <button className="grnf-btn-cancel" onClick={() => setShowValidationSummary(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── API Error Display ────────────────────────────────────── */}
        {apiError && (
          <div className="grnf-api-error">
            <FaExclamationCircle className="grnf-error-icon" />
            <span>{apiError}</span>
            <button className="grnf-error-close" onClick={() => setApiError(null)}>×</button>
          </div>
        )}

        {/* ─── Header ────────────────────────────────────────────────── */}
        <div className="grnf-header">
          <button onClick={() => navigate('/grn')} className="grnf-back-btn">
            <FaArrowLeft size={9} /> Back
          </button>
          <div className="grnf-header-title">
            <h1>{isNew ? 'New Goods Receipt Note' : `Edit: ${formData.grn_number}`}</h1>
          </div>
          {hasErrors && (
            <div className="grnf-error-badge">
              <FaExclamationTriangle size={12} />
              {getAllValidationErrors().length} missing field{getAllValidationErrors().length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <form onSubmit={handleSave}>

          {/* ─── Main Form Card ────────────────────────────────────────── */}
          <div className="grnf-card">

            {/* Header Info */}
            <span className="grnf-section-title">Receipt Information</span>

            <div className="grnf-grid-3">
              <div className="grnf-field">
                <label className="grnf-label">
                  <FaHashtag className="grnf-label-icon" />GRN Number
                </label>
                <input
                  type="text"
                  value={formData.grn_number}
                  onChange={(e) => handleFieldChange('grn_number', e.target.value)}
                  className="grnf-form-field"
                  placeholder="Auto-generated"
                  disabled={!isNew || submitting}
                />
                {isNew && <p className="grnf-field-hint">Auto-generated on save</p>}
              </div>

              <div className="grnf-field">
                <label className="grnf-label">
                  <FaCalendar className="grnf-label-icon" />GRN Date <span className="grnf-required">*</span>
                </label>
                <input
                  type="date"
                  value={formData.grnDate}
                  onChange={(e) => handleFieldChange('grnDate', e.target.value)}
                  className={`grnf-form-field${errors.grnDate ? ' grnf-field-error' : ''}`}
                  disabled={submitting}
                />
              </div>

              <div className="grnf-field">
                <label className="grnf-label">
                  <FaUserCircle className="grnf-label-icon" />Received By <span className="grnf-required">*</span>
                </label>
                <div className="grnf-warehouse-wrapper">
                  <input
                    ref={employeeInputRef}
                    type="text"
                    value={employeeSearchTerm}
                    onChange={(e) => {
                      setEmployeeSearchTerm(e.target.value);
                      setShowEmployeeDropdown(true);
                      setFormData(prev => ({ ...prev, receivedBy: e.target.value, receivedById: undefined }));
                      setIsDirty(true);
                    }}
                    onFocus={() => setShowEmployeeDropdown(true)}
                    className={`grnf-form-field${errors.receivedBy ? ' grnf-field-error' : ''}`}
                    placeholder="Search or select employee"
                    disabled={submitting}
                    autoComplete="off"
                  />
                  {loadingEmployees && (
                    <FaSpinner className="grnf-warehouse-spinner grnf-spinning" size={14} />
                  )}
                  {showEmployeeDropdown && filteredEmployees.length > 0 && (
                    <div ref={employeeDropdownRef} className="grnf-warehouse-dropdown grnf-dropdown-large">
                      {filteredEmployees.map((employee) => (
                        <div
                          key={employee.id}
                          className="grnf-warehouse-item"
                          onClick={() => handleEmployeeSelect(employee)}
                        >
                          <div className="grnf-warehouse-item-name">
                            <FaUserCircle className="grnf-warehouse-item-icon" size={12} />
                            {employee.employee_name}
                          </div>
                          <div className="grnf-warehouse-item-details">
                            {employee.designation && (
                              <span>{employee.designation}</span>
                            )}
                            {employee.department && (
                              <span>• {employee.department}</span>
                            )}
                            {employee.company_email && (
                              <span>• {employee.company_email}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showEmployeeDropdown && filteredEmployees.length === 0 && employeeSearchTerm && (
                    <div className="grnf-warehouse-dropdown">
                      <div className="grnf-warehouse-no-results">
                        <FaExclamationCircle size={14} />
                        No employees found matching "{employeeSearchTerm}"
                      </div>
                    </div>
                  )}
                </div>
                {errors.receivedBy && (
                  <span className="grnf-error-msg">
                    <FaExclamationCircle size={10} />Received By is required
                  </span>
                )}
              </div>
            </div>

            <div className="grnf-grid-3">
              <div className="grnf-field">
                <label className="grnf-label">
                  <FaBuilding className="grnf-label-icon" />Supplier <span className="grnf-required">*</span>
                </label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => handleFieldChange('supplier', e.target.value)}
                  className={`grnf-form-field${errors.supplier ? ' grnf-field-error' : ''}`}
                  placeholder="Enter supplier name"
                  disabled={submitting}
                />
                {formData.supplierId && (
                  <p className="grnf-field-hint">Supplier ID: {formData.supplierId}</p>
                )}
              </div>

              <div className="grnf-field">
                <label className="grnf-label">
                  <FaHashtag className="grnf-label-icon" />Purchase Order <span className="grnf-required">*</span>
                </label>
                <div className="grnf-warehouse-wrapper">
                  <input
                    ref={poInputRef}
                    type="text"
                    value={poSearchTerm}
                    onChange={(e) => {
                      setPOSearchTerm(e.target.value);
                      setShowPODropdown(true);
                      setFormData(prev => ({ ...prev, purchaseOrder: e.target.value, purchaseOrderId: undefined }));
                      setIsDirty(true);
                    }}
                    onFocus={() => {
                      setShowPODropdown(true);
                      fetchPurchaseOrders();
                    }}
                    className={`grnf-form-field${errors.purchaseOrder ? ' grnf-field-error' : ''}`}
                    placeholder="Search PO by number or supplier..."
                    disabled={submitting}
                    autoComplete="off"
                  />
                  <FaChevronDown 
                    className="grnf-dropdown-arrow" 
                    onClick={() => {
                      setShowPODropdown(!showPODropdown);
                      if (!showPODropdown) fetchPurchaseOrders();
                    }}
                  />
                  {loadingPOs && (
                    <FaSpinner className="grnf-warehouse-spinner grnf-spinning" size={14} />
                  )}
                  {showPODropdown && (
                    <div ref={poDropdownRef} className="grnf-warehouse-dropdown grnf-po-dropdown-large">
                      {filteredPOs.length > 0 ? (
                        <>
                          {filteredPOs.map((po) => (
                            <div
                              key={po.id}
                              className={`grnf-warehouse-item ${formData.purchaseOrderId === po.id ? 'grnf-warehouse-item-selected' : ''}`}
                              onClick={() => handlePOSelect(po)}
                            >
                              <div className="grnf-warehouse-item-name">
                                <FaFileInvoice className="grnf-warehouse-item-icon" size={12} />
                                <span className="grnf-po-number">{po.name}</span>
                                <span className={`grnf-po-status-badge ${getPOStatusBadgeClass(po.status)}`}>
                                  {po.status}
                                </span>
                              </div>
                              <div className="grnf-warehouse-item-details">
                                <span><strong>Supplier:</strong> {po.supplier_name}</span>
                                <span><strong>Date:</strong> {new Date(po.transaction_date).toLocaleDateString()}</span>
                                <span><strong>Total:</strong> {po.currency} {po.grand_total?.toFixed(2)}</span>
                                <span><strong>Items:</strong> {po.total_qty}</span>
                                <span><strong>Received:</strong> {po.per_received || 0}%</span>
                              </div>
                              <div className="grnf-po-progress-bar">
                                <div 
                                  className="grnf-po-progress-fill" 
                                  style={{ width: `${Math.min(po.per_received || 0, 100)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                          {totalPOs > poItemsPerPage && (
                            <div className="grnf-po-pagination">
                              <button 
                                onClick={() => setPOCurrentPage(Math.max(1, poCurrentPage - 1))}
                                disabled={poCurrentPage === 1}
                                className="grnf-page-btn"
                              >
                                <FaChevronLeft size={12} />
                              </button>
                              <span className="grnf-page-info">
                                Page {poCurrentPage} of {Math.ceil(totalPOs / poItemsPerPage)}
                              </span>
                              <button 
                                onClick={() => setPOCurrentPage(Math.min(Math.ceil(totalPOs / poItemsPerPage), poCurrentPage + 1))}
                                disabled={poCurrentPage >= Math.ceil(totalPOs / poItemsPerPage)}
                                className="grnf-page-btn"
                              >
                                <FaChevronRight size={12} />
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="grnf-warehouse-no-results">
                          <FaExclamationCircle size={14} />
                          {poSearchTerm ? `No POs found matching "${poSearchTerm}"` : 'No purchase orders available'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {errors.purchaseOrder && (
                  <span className="grnf-error-msg">
                    <FaExclamationCircle size={10} />Purchase Order is required
                  </span>
                )}
              </div>

              <div className="grnf-field">
                <label className="grnf-label">
                  <FaWarehouse className="grnf-label-icon" />Warehouse <span className="grnf-required">*</span>
                </label>
                <div className="grnf-warehouse-wrapper">
                  <input
                    ref={warehouseInputRef}
                    type="text"
                    value={warehouseSearchTerm}
                    onChange={(e) => {
                      setWarehouseSearchTerm(e.target.value);
                      setShowWarehouseDropdown(true);
                      setFormData(prev => ({ ...prev, warehouse: e.target.value, warehouseId: undefined }));
                      setIsDirty(true);
                    }}
                    onFocus={() => setShowWarehouseDropdown(true)}
                    className={`grnf-form-field${errors.warehouse ? ' grnf-field-error' : ''}`}
                    placeholder="Search or select warehouse"
                    disabled={submitting}
                    autoComplete="off"
                  />
                  {loadingWarehouses && (
                    <FaSpinner className="grnf-warehouse-spinner grnf-spinning" size={14} />
                  )}
                  {showWarehouseDropdown && filteredWarehouses.length > 0 && (
                    <div ref={warehouseDropdownRef} className="grnf-warehouse-dropdown">
                      {filteredWarehouses.map((warehouse) => (
                        <div
                          key={warehouse.id}
                          className="grnf-warehouse-item"
                          onClick={() => handleWarehouseSelect(warehouse)}
                        >
                          <div className="grnf-warehouse-item-name">
                            <FaWarehouse className="grnf-warehouse-item-icon" size={12} />
                            {warehouse.warehouse_name}
                          </div>
                          <div className="grnf-warehouse-item-details">
                            {warehouse.city && (
                              <span>
                                <FaMapMarkerAlt size={10} /> {warehouse.city}
                                {warehouse.state && `, ${warehouse.state}`}
                              </span>
                            )}
                            {warehouse.phone_no && (
                              <span>
                                <FaPhone size={10} /> {warehouse.phone_no}
                              </span>
                            )}
                            {warehouse.email_id && (
                              <span>
                                <FaEnvelope size={10} /> {warehouse.email_id}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showWarehouseDropdown && filteredWarehouses.length === 0 && warehouseSearchTerm && (
                    <div className="grnf-warehouse-dropdown">
                      <div className="grnf-warehouse-no-results">
                        <FaExclamationCircle size={14} />
                        No warehouses found matching "{warehouseSearchTerm}"
                      </div>
                    </div>
                  )}
                </div>
                {errors.warehouse && (
                  <span className="grnf-error-msg">
                    <FaExclamationCircle size={10} />Warehouse is required
                  </span>
                )}
              </div>
            </div>

            <div className="grnf-divider" />

            {/* Delivery Details */}
            <span className="grnf-section-title">Delivery Details</span>

            <div className="grnf-grid-3">
              <div className="grnf-field">
                <label className="grnf-label">
                  <FaTruck className="grnf-label-icon" />Vehicle Number
                </label>
                <input
                  type="text"
                  value={formData.vehicleNo}
                  onChange={(e) => handleFieldChange('vehicleNo', e.target.value)}
                  className="grnf-form-field"
                  placeholder="Enter vehicle number"
                  disabled={submitting}
                />
              </div>

              <div className="grnf-field">
                <label className="grnf-label">
                  <FaHashtag className="grnf-label-icon" />Delivery Challan No.
                </label>
                <input
                  type="text"
                  value={formData.deliveryChallanNo}
                  onChange={(e) => handleFieldChange('deliveryChallanNo', e.target.value)}
                  className="grnf-form-field"
                  placeholder="Enter delivery challan number"
                  disabled={submitting}
                />
              </div>

              <div className="grnf-field">
                <label className="grnf-label">
                  <FaFileInvoice className="grnf-label-icon" />Invoice Number
                </label>
                <input
                  type="text"
                  value={formData.invoiceNo}
                  onChange={(e) => handleFieldChange('invoiceNo', e.target.value)}
                  className="grnf-form-field"
                  placeholder="Enter supplier invoice number"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="grnf-divider" />

            {/* Status */}
            <div className="grnf-field">
              <label className="grnf-label">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleFieldChange('status', e.target.value as any)}
                className="grnf-form-field"
                disabled={submitting}
              >
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="grnf-divider" />

            {/* Items Table */}
            <div className="grnf-items-section">
              <div className="grnf-items-header">
                <span className="grnf-section-title" style={{ marginBottom: 0, borderBottom: 'none' }}>Items</span>
                <div className="grnf-items-actions">
                  <button type="button" className="grnf-add-item-btn" onClick={addItem} disabled={submitting}>
                    <FaPlus size={12} /> Add Item
                  </button>
                </div>
              </div>

              {formData.items.length === 0 ? (
                <div className="grnf-empty-items">
                  <FaBox size={32} />
                  <p>No items added</p>
                  <span>Select a Purchase Order above to fetch items</span>
                </div>
              ) : (
                <div className="grnf-table-block">
                  <table className="grnf-items-table">
                    <thead>
                      <tr>
                        <th className="grnf-ith">#</th>
                        <th className="grnf-ith">Item Code <span className="grnf-required">*</span></th>
                        <th className="grnf-ith">Item Name <span className="grnf-required">*</span></th>
                        <th className="grnf-ith">Ordered</th>
                        <th className="grnf-ith">Received <span className="grnf-required">*</span></th>
                        <th className="grnf-ith">Accepted</th>
                        <th className="grnf-ith">Rejected</th>
                        <th className="grnf-ith">UOM</th>
                        <th className="grnf-ith">Rate</th>
                        <th className="grnf-ith">Batch</th>
                        <th className="grnf-ith">Expiry</th>
                        <th className="grnf-ith">Remarks</th>
                        <th className="grnf-ith grnf-ith-action">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, index) => (
                        <tr key={item.id} className="grnf-itr">
                          <td className="grnf-itd grnf-itd-no">{index + 1}</td>
                          <td className="grnf-itd">
                            <input
                              className="grnf-cell-input"
                              value={item.itemCode}
                              onChange={(e) => handleItemChange(index, 'itemCode', e.target.value)}
                              placeholder="Code"
                              disabled={submitting}
                            />
                          </td>
                          <td className="grnf-itd">
                            <input
                              className="grnf-cell-input"
                              value={item.itemName}
                              onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                              placeholder="Name"
                              disabled={submitting}
                            />
                          </td>
                          <td className="grnf-itd">
                            <input
                              type="number"
                              className="grnf-cell-input"
                              value={item.orderedQty}
                              onChange={(e) => handleItemChange(index, 'orderedQty', parseFloat(e.target.value) || 0)}
                              disabled
                            />
                          </td>
                          <td className="grnf-itd">
                            <input
                              type="number"
                              className="grnf-cell-input"
                              value={item.receivedQty}
                              onChange={(e) => handleItemChange(index, 'receivedQty', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              disabled={submitting}
                            />
                          </td>
                          <td className="grnf-itd">
                            <input
                              type="number"
                              className="grnf-cell-input"
                              value={item.acceptedQty}
                              onChange={(e) => handleItemChange(index, 'acceptedQty', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              disabled={submitting}
                            />
                          </td>
                          <td className="grnf-itd">
                            <input
                              type="number"
                              className="grnf-cell-input"
                              value={item.rejectedQty}
                              onChange={(e) => handleItemChange(index, 'rejectedQty', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              disabled={submitting}
                            />
                          </td>
                          <td className="grnf-itd">
                            <input
                              className="grnf-cell-input"
                              value={item.uom}
                              onChange={(e) => handleItemChange(index, 'uom', e.target.value)}
                              placeholder="UOM"
                              disabled={submitting}
                            />
                          </td>
                          <td className="grnf-itd">
                            <input
                              type="number"
                              className="grnf-cell-input"
                              value={item.rate}
                              onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              disabled={submitting}
                            />
                          </td>
                          <td className="grnf-itd">
                            <input
                              className="grnf-cell-input"
                              value={item.batchNo}
                              onChange={(e) => handleItemChange(index, 'batchNo', e.target.value)}
                              placeholder="Batch"
                              disabled={submitting}
                            />
                          </td>
                          <td className="grnf-itd">
                            <input
                              type="date"
                              className="grnf-cell-input"
                              value={item.expiryDate}
                              onChange={(e) => handleItemChange(index, 'expiryDate', e.target.value)}
                              disabled={submitting}
                            />
                          </td>
                          <td className="grnf-itd">
                            <input
                              className="grnf-cell-input"
                              value={item.remarks}
                              onChange={(e) => handleItemChange(index, 'remarks', e.target.value)}
                              placeholder="Remarks"
                              disabled={submitting}
                            />
                          </td>
                          <td className="grnf-itd">
                            <button
                              className="grnf-remove-item"
                              onClick={() => removeItem(index)}
                              type="button"
                              disabled={submitting || formData.items.length <= 1}
                            >
                              <FaTrash size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ─── Footer ────────────────────────────────────────────────── */}
          <div className="grnf-footer">
            <button
              type="button"
              onClick={() => navigate('/grn')}
              className="grnf-cancel-btn"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="grnf-submit-btn"
            >
              {submitting && <FaSpinner className="grnf-spinning" />}
              <FaSave size={12} />
              {isEditMode ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}