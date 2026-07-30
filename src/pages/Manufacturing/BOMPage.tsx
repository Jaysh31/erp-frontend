import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  ChevronDown,
  Plus,
  Filter as FilterIcon,
  X,
  ArrowUpDown,
  FileStack,
  Check,
  Search,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  Box,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";
import "./BOMPage.css";
import NewBOMPage from "./Newbompage";
import { useAdminTheme } from "../../admin-theme/AdminThemeContext";
import api from '../../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const SORT_FIELDS = ["Created On", "Last Updated On", "ID", "Item to Manufacture"];

// ─── Types ────────────────────────────────────────────────────────────────────

interface BOMRecord {
  id: number;
  item: string;
  item_name: string;
  quantity: number;
  uom: string;
  company: string;
  is_active: number;
  is_default: number;
  total_cost: number;
  creation: string;
  type: string;
  is_deleted?: number;
  item_Id?: number;
  cost_allocation_per?: number;
  process_loss_percentage?: number;
  with_operations?: number;
  track_semi_finished_goods?: number;
  is_phantom_bom?: number;
  allow_alternative_item?: number;
  inspection_required?: number;
}

interface BOMListResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: BOMRecord[];
  };
}

interface BOMDetailResponse {
  success: number;
  data: {
    bom: any;
    items: any[];
    operations: any[];
  };
}

interface BOMRow {
  id: string;
  status: "Draft" | "Active" | "Disabled";
  itemToManufacture: string;
  totalCost: string;
  createdOn: string;
  comments: number;
  quantity: number;
  uom: string;
  type: string;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface DeleteModal {
  isOpen: boolean;
  bomId: string;
  bomItem: string;
  bomType: string;
}

// ─── Validation Functions ────────────────────────────────────────────────────

const VALIDATION_RULES = {
  // BOM Validation Rules
  BOM: {
    item: {
      required: true,
      minLength: 1,
      maxLength: 140,
      message: 'Item name is required and must be between 1-140 characters'
    },
    quantity: {
      required: true,
      minValue: 0.000000001,
      maxValue: 999999999.999999999,
      message: 'Quantity must be greater than 0 and less than 1 billion'
    },
    totalCost: {
      required: false,
      minValue: 0,
      maxValue: 999999999999.999999999,
      message: 'Total cost must be between 0 and 999,999,999,999.99'
    },
    uom: {
      required: true,
      maxLength: 140,
      message: 'Unit of Measurement is required and must be less than 140 characters'
    },
    type: {
      required: true,
      allowedValues: ['Internal', 'External'],
      message: 'Type must be either Internal or External'
    },
    company: {
      required: true,
      maxLength: 140,
      message: 'Company is required and must be less than 140 characters'
    },
    costAllocationPer: {
      required: false,
      minValue: 0,
      maxValue: 100,
      message: 'Cost allocation percentage must be between 0 and 100'
    },
    processLossPercentage: {
      required: false,
      minValue: 0,
      maxValue: 100,
      message: 'Process loss percentage must be between 0 and 100'
    },
    operatingCost: {
      required: false,
      minValue: 0,
      maxValue: 999999999.999999999,
      message: 'Operating cost must be between 0 and 999,999,999.99'
    }
  }
};

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// ─── Main component ───────────────────────────────────────────────────────────

const BOMPage: React.FC = () => {
  const { theme } = useAdminTheme();
  const [showNewBOM, setShowNewBOM] = useState(false);
  const [showViewBOM, setShowViewBOM] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"all" | "internal" | "external">("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editBOMData, setEditBOMData] = useState<any>(null);
  const [viewBOMData, setViewBOMData] = useState<any>(null);

  // Data state
  const [allBomData, setAllBomData] = useState<BOMRecord[]>([]);
  const [bomData, setBomData] = useState<BOMRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);

  // Sort
  const [sortOpen, setSortOpen] = useState(false);
  const [sortField, setSortField] = useState("Created On");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<DeleteModal>({
    isOpen: false,
    bomId: '',
    bomItem: '',
    bomType: '',
  });
  const [deleting, setDeleting] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  const rootRef = useRef<HTMLDivElement>(null);

  // ─── Validation Helpers ──────────────────────────────────────────────────

  const validateBOMRecord = (record: Partial<BOMRecord>): ValidationResult => {
    const errors: Record<string, string> = {};
    const rules = VALIDATION_RULES.BOM;

    // Validate item
    if (rules.item.required && !record.item?.trim()) {
      errors.item = rules.item.message;
    } else if (record.item && (record.item.length < rules.item.minLength || record.item.length > rules.item.maxLength)) {
      errors.item = rules.item.message;
    }

    // Validate item_name
    if (rules.item.required && !record.item_name?.trim()) {
      errors.item_name = 'Item name is required';
    } else if (record.item_name && record.item_name.length > rules.item.maxLength) {
      errors.item_name = `Item name must be less than ${rules.item.maxLength} characters`;
    }

    // Validate quantity
    if (rules.quantity.required) {
      const qty = Number(record.quantity);
      if (isNaN(qty) || qty <= 0) {
        errors.quantity = 'Quantity must be greater than 0';
      } else if (qty < rules.quantity.minValue || qty > rules.quantity.maxValue) {
        errors.quantity = `Quantity must be between ${rules.quantity.minValue} and ${rules.quantity.maxValue}`;
      }
    }

    // Validate total_cost
    const totalCost = Number(record.total_cost);
    if (!isNaN(totalCost) && totalCost > 0) {
      if (totalCost < (rules.totalCost.minValue || 0) || totalCost > (rules.totalCost.maxValue || Infinity)) {
        errors.totalCost = rules.totalCost.message;
      }
    }

    // Validate UOM
    if (rules.uom.required && !record.uom?.trim()) {
      errors.uom = rules.uom.message;
    } else if (record.uom && record.uom.length > rules.uom.maxLength) {
      errors.uom = `UOM must be less than ${rules.uom.maxLength} characters`;
    }

    // Validate type
    if (rules.type.required && !record.type) {
      errors.type = rules.type.message;
    } else if (record.type && !rules.type.allowedValues.includes(record.type)) {
      errors.type = `Type must be either ${rules.type.allowedValues.join(' or ')}`;
    }

    // Validate company
    if (rules.company.required && !record.company?.trim()) {
      errors.company = rules.company.message;
    } else if (record.company && record.company.length > rules.company.maxLength) {
      errors.company = `Company must be less than ${rules.company.maxLength} characters`;
    }

    // Validate cost_allocation_per
    const costAlloc = Number(record.cost_allocation_per);
    if (!isNaN(costAlloc) && costAlloc > 0) {
      if (costAlloc < (rules.costAllocationPer.minValue || 0) || costAlloc > (rules.costAllocationPer.maxValue || 100)) {
        errors.cost_allocation_per = rules.costAllocationPer.message;
      }
    }

    // Validate process_loss_percentage
    const processLoss = Number(record.process_loss_percentage);
    if (!isNaN(processLoss) && processLoss > 0) {
      if (processLoss < (rules.processLossPercentage.minValue || 0) || processLoss > (rules.processLossPercentage.maxValue || 100)) {
        errors.process_loss_percentage = rules.processLossPercentage.message;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  const validateBOMData = (bomData: any): ValidationResult => {
    const errors: Record<string, string> = {};
    
    // Validate BOM header
    const headerValidation = validateBOMRecord(bomData);
    Object.assign(errors, headerValidation.errors);

    // Validate items if present
    if (bomData.items && Array.isArray(bomData.items)) {
      bomData.items.forEach((item: any, index: number) => {
        const itemValidation = validateBOMRecord({
          item: item.item,
          item_name: item.item_name,
          quantity: item.quantity,
          uom: item.uom,
          type: bomData.type,
          company: bomData.company
        });
        Object.keys(itemValidation.errors).forEach(key => {
          errors[`item_${index}_${key}`] = itemValidation.errors[key];
        });
      });
    }

    // Validate operations if present
    if (bomData.operations && Array.isArray(bomData.operations)) {
      bomData.operations.forEach((op: any, index: number) => {
        if (!op.operation?.trim()) {
          errors[`operation_${index}_name`] = `Operation ${index + 1} name is required`;
        }
        if (op.operating_cost && isNaN(Number(op.operating_cost))) {
          errors[`operation_${index}_cost`] = `Operation ${index + 1} cost must be a valid number`;
        }
      });
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  const validateSearchParams = (searchTerm: string, statusFilter: string): ValidationResult => {
    const errors: Record<string, string> = {};

    // Validate search term length
    if (searchTerm && searchTerm.length > 255) {
      errors.search = 'Search term must be less than 255 characters';
    }

    // Validate status filter
    if (statusFilter && !['all', 'active', 'disabled'].includes(statusFilter)) {
      errors.status = 'Invalid status filter';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  // ─── Toast helper functions ──────────────────────────────────────────────────

  const addToast = useCallback((type: Toast['type'], title: string, message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, title, message }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ─── Fetch all BOMs from API ──────────────────────────────────────────────────

  const fetchAllBOMs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate search parameters
      const searchValidation = validateSearchParams(searchTerm, statusFilter);
      if (!searchValidation.isValid) {
        const errorMessages = Object.values(searchValidation.errors).join(', ');
        addToast('warning', 'Validation Warning', errorMessages);
        setError(errorMessages);
        return;
      }

      const params = new URLSearchParams({
        page: String(1),
        limit: String(1000),
      });

      if (searchTerm.trim()) {
        // Sanitize search term - remove any potentially dangerous characters
        const sanitizedSearch = searchTerm.trim().replace(/[<>{}]/g, '');
        params.append('search', sanitizedSearch);
      }

      if (statusFilter !== 'all') {
        // Validate status filter value
        const validStatuses = ['active', 'disabled'];
        if (validStatuses.includes(statusFilter)) {
          params.append('status', statusFilter === 'active' ? '1' : '0');
        }
      }

      const sortMap: Record<string, string> = {
        'Created On': 'creation',
        'Last Updated On': 'modified',
        'ID': 'id',
        'Item to Manufacture': 'item_name'
      };
      if (sortField in sortMap) {
        params.append('sort_by', sortMap[sortField]);
        params.append('sort_order', 'desc');
      }

      const response = await api.get<BOMListResponse>(`/bom?${params.toString()}`);
      
      if (response.data.success === 1) {
        // Validate and filter records
        const validRecords = response.data.data.records.filter(record => {
          // Filter out soft-deleted records if they exist
          if (record.is_deleted === 1) return false;
          
          // Validate record data
          const validation = validateBOMRecord(record);
          if (!validation.isValid) {
            console.warn(`BOM record ${record.id} failed validation:`, validation.errors);
            return false;
          }
          return true;
        });
        
        setAllBomData(validRecords);
        
        if (validRecords.length < response.data.data.records.length) {
          addToast('info', 'Data Filtered', `${response.data.data.records.length - validRecords.length} records were filtered out due to validation errors.`);
        }
      } else {
        setError('Failed to load BOMs');
        addToast('error', 'Error', 'Failed to load BOMs');
      }
    } catch (err: any) {
      console.error('Error fetching BOMs:', err);
      let errorMessage = 'An unexpected error occurred.';
      if (err.response) {
        errorMessage = err.response.data?.message || `Server error: ${err.response.status}`;
      } else if (err.request) {
        errorMessage = 'Network error. Please check your connection.';
      }
      setError(errorMessage);
      addToast('error', 'Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ─── Filter BOMs based on active tab and paginate ─────────────────────────

  useEffect(() => {
    let filtered = [...allBomData];

    // Filter by type based on active tab
    if (activeTab === 'internal') {
      filtered = filtered.filter(bom => bom.type === 'Internal');
    } else if (activeTab === 'external') {
      filtered = filtered.filter(bom => bom.type === 'External');
    }

    // Update total records count
    setTotalRecords(filtered.length);

    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage);
    
    setBomData(paginatedData);
  }, [allBomData, activeTab, currentPage, itemsPerPage]);

  // ─── Fetch single BOM for viewing ────────────────────────────────────────

  const fetchBOMForView = async (bomId: number) => {
    try {
      setLoading(true);
      setError(null);

      // Validate BOM ID
      if (!bomId || bomId <= 0) {
        throw new Error('Invalid BOM ID');
      }

      const response = await api.get<BOMDetailResponse>(`/bom/${bomId}`);
      
      if (response.data.success === 1) {
        // Validate BOM data before displaying
        const validation = validateBOMData(response.data.data);
        if (!validation.isValid) {
          addToast('warning', 'Data Validation Warning', 'Some BOM data may be incomplete or invalid. Please review the details.');
          console.warn('BOM validation errors:', validation.errors);
        }
        
        setViewBOMData(response.data.data);
        setShowViewBOM(true);
      } else {
        addToast('error', 'Error', 'Failed to load BOM data');
      }
    } catch (err: any) {
      console.error('Error fetching BOM:', err);
      addToast('error', 'Error', err.response?.data?.message || err.message || 'Failed to load BOM data');
    } finally {
      setLoading(false);
    }
  };

  // ─── Fetch single BOM for editing ────────────────────────────────────────

  const fetchBOMForEdit = async (bomId: number) => {
    try {
      setLoading(true);
      setError(null);

      // Validate BOM ID
      if (!bomId || bomId <= 0) {
        throw new Error('Invalid BOM ID');
      }

      const response = await api.get<BOMDetailResponse>(`/bom/${bomId}`);
      
      if (response.data.success === 1) {
        // Validate BOM data before editing
        const validation = validateBOMData(response.data.data);
        if (!validation.isValid) {
          addToast('warning', 'Data Validation Warning', 'Some BOM data may be incomplete. Please review and correct before saving.');
          console.warn('BOM validation errors:', validation.errors);
        }
        
        setEditBOMData(response.data.data);
        setShowNewBOM(true);
      } else {
        addToast('error', 'Error', 'Failed to load BOM data for editing');
      }
    } catch (err: any) {
      console.error('Error fetching BOM:', err);
      addToast('error', 'Error', err.response?.data?.message || err.message || 'Failed to load BOM data');
    } finally {
      setLoading(false);
    }
  };

  // ─── Calculate counts for tabs ────────────────────────────────────────────

  const tabCounts = useMemo(() => {
    const internal = allBomData.filter(b => b.type === 'Internal').length;
    const external = allBomData.filter(b => b.type === 'External').length;
    return { internal, external, total: allBomData.length };
  }, [allBomData]);

  // ─── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchAllBOMs();
  }, [sortField, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchAllBOMs();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        closeAll();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const closeAll = () => {
    setSortOpen(false);
  };

  const toggle = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    current: boolean
  ) => {
    closeAll();
    setter(!current);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setActiveTab("all");
    setCurrentPage(1);
  };

  // ─── Transform API data to table rows ────────────────────────────────────

  const transformToRows = (records: BOMRecord[]): BOMRow[] => {
    return records.map(record => ({
      id: String(record.id),
      status: record.is_active === 1 ? "Active" : "Disabled",
      itemToManufacture: record.item_name || record.item || 'Unnamed Item',
      totalCost: `₹ ${(record.total_cost || 0).toFixed(2)}`,
      createdOn: new Date(record.creation).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      comments: 0,
      quantity: record.quantity || 0,
      uom: record.uom || 'Nos',
      type: record.type || 'Internal',
    }));
  };

  const tableData = transformToRows(bomData);

  // ─── Pagination ────────────────────────────────────────────────────────────

  const totalPages = Math.ceil(totalRecords / itemsPerPage);
  const validCurrentPage = Math.min(currentPage, totalPages || 1);

  const getStartIndex = () => (validCurrentPage - 1) * itemsPerPage + 1;
  const getEndIndex = () => Math.min(validCurrentPage * itemsPerPage, totalRecords);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, validCurrentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToNextPage = () => goToPage(validCurrentPage + 1);
  const goToPrevPage = () => goToPage(validCurrentPage - 1);

  const handlePageSizeChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };

  // ─── Handle Tab Change ────────────────────────────────────────────────────

  const handleTabChange = (tab: "all" | "internal" | "external") => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // ─── Delete Modal Handlers ────────────────────────────────────────────────

  const openDeleteModal = (row: BOMRow) => {
    // Validate row data before opening delete modal
    if (!row.id || !row.itemToManufacture) {
      addToast('error', 'Error', 'Invalid BOM data for deletion');
      return;
    }
    
    setDeleteModal({
      isOpen: true,
      bomId: row.id,
      bomItem: row.itemToManufacture,
      bomType: row.type,
    });
  };

  const closeDeleteModal = () => {
    if (!deleting) {
      setDeleteModal({
        isOpen: false,
        bomId: '',
        bomItem: '',
        bomType: '',
      });
    }
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      
      // Validate delete data
      if (!deleteModal.bomId || isNaN(Number(deleteModal.bomId))) {
        throw new Error('Invalid BOM ID for deletion');
      }

      const response = await api.delete(`/bom/${deleteModal.bomId}`);
      
      if (response.data.success === 1) {
        addToast('success', 'Deleted Successfully', `BOM "${deleteModal.bomItem}" has been deleted.`);
        closeDeleteModal();
        await fetchAllBOMs();
      } else {
        addToast('error', 'Delete Failed', 'Failed to delete BOM. Please try again.');
      }
    } catch (err: any) {
      console.error('Error deleting BOM:', err);
      addToast('error', 'Delete Failed', err.response?.data?.message || err.message || 'Failed to delete BOM');
    } finally {
      setDeleting(false);
    }
  };

  // ─── Actions ──────────────────────────────────────────────────────────────

  const handleView = (row: BOMRow) => {
    if (!row.id || isNaN(Number(row.id))) {
      addToast('error', 'Error', 'Invalid BOM ID');
      return;
    }
    fetchBOMForView(Number(row.id));
  };

  const handleEdit = (row: BOMRow) => {
    if (!row.id || isNaN(Number(row.id))) {
      addToast('error', 'Error', 'Invalid BOM ID');
      return;
    }
    fetchBOMForEdit(Number(row.id));
  };

  const handleDelete = (row: BOMRow) => {
    if (!row.id || !row.itemToManufacture) {
      addToast('error', 'Error', 'Invalid BOM data');
      return;
    }
    openDeleteModal(row);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {showNewBOM && (
        <NewBOMPage 
          onBack={() => {
            setShowNewBOM(false);
            setEditBOMData(null);
            fetchAllBOMs();
          }} 
          editData={editBOMData}
        />
      )}
      
      {showViewBOM && viewBOMData && (
        <NewBOMPage 
          onBack={() => {
            setShowViewBOM(false);
            setViewBOMData(null);
            fetchAllBOMs();
          }} 
          editData={viewBOMData}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="bom-modal-overlay" onClick={closeDeleteModal}>
          <div className="bom-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bom-modal-header">
              <div className="bom-modal-icon">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="bom-modal-title">Delete Bill of Materials</h3>
                <p className="bom-modal-subtitle">
                  Are you sure you want to delete this BOM? This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="bom-modal-body">
              <div className="bom-modal-info">
                <div className="bom-modal-info-row">
                  <span className="bom-modal-info-label">BOM ID</span>
                  <span className="bom-modal-info-value">{deleteModal.bomId}</span>
                </div>
                <div className="bom-modal-info-row">
                  <span className="bom-modal-info-label">Item</span>
                  <span className="bom-modal-info-value">{deleteModal.bomItem}</span>
                </div>
                <div className="bom-modal-info-row">
                  <span className="bom-modal-info-label">Type</span>
                  <span className="bom-modal-info-value">
                    {deleteModal.bomType === 'Internal' ? 'Product (Internal)' : 'Service (External)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bom-modal-footer">
              <button 
                className="bom-btn-secondary" 
                onClick={closeDeleteModal}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="bom-btn-danger" 
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <div className="bom-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Delete BOM
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="bom-toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`bom-toast bom-toast--${toast.type}`}>
            <div className="bom-toast-icon">
              {toast.type === 'success' && <CheckCircle size={16} />}
              {toast.type === 'error' && <AlertCircle size={16} />}
              {toast.type === 'warning' && <AlertTriangle size={16} />}
              {toast.type === 'info' && <Info size={16} />}
            </div>
            <div className="bom-toast-content">
              <p className="bom-toast-title">{toast.title}</p>
              <p className="bom-toast-message">{toast.message}</p>
            </div>
            <button className="bom-toast-close" onClick={() => removeToast(toast.id)}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {!showNewBOM && !showViewBOM && (
        <div className={`bom-page ${theme}`} ref={rootRef}>
          

          {/* ── Tabs ──────────────────────────────────────────────────────── */}
          <div className="bom-tabs">
            <button
              className={`bom-tab ${activeTab === 'all' ? 'bom-tab--active' : ''}`}
              onClick={() => handleTabChange('all')}
            >
              <FileStack size={14} />
              All BOMs
              <span className="bom-tab-count">{tabCounts.total}</span>
            </button>
            <button
              className={`bom-tab ${activeTab === 'internal' ? 'bom-tab--active' : ''}`}
              onClick={() => handleTabChange('internal')}
            >
              <Box size={14} />
              Products 
              <span className="bom-tab-count">{tabCounts.internal}</span>
            </button>
            <button
              className={`bom-tab ${activeTab === 'external' ? 'bom-tab--active' : ''}`}
              onClick={() => handleTabChange('external')}
            >
              <Wrench size={14} />
              Services
              <span className="bom-tab-count">{tabCounts.external}</span>
            </button>
          </div>

          {/* ── Error message ────────────────────────────────────────────── */}
          {error && (
            <div className="bom-error-banner">
              <AlertCircle size={14} />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="bom-error-close">
                <X size={14} />
              </button>
            </div>
          )}

          {/* ── Search and Filter Bar ─────────────────────────────────────── */}
          <div className="bom-filter-bar">
            <div className="bom-filter-left">
              <div className="bom-search-wrapper">
                <Search className="bom-search-icon" size={14} />
                <input
                  type="text"
                  placeholder={`Search ${activeTab !== 'all' ? activeTab + ' ' : ''}BOMs by ID or Item...`}
                  value={searchTerm}
                  onChange={(e) => {
                    // Sanitize input - prevent XSS and special characters
                    const value = e.target.value.replace(/[<>{}]/g, '');
                    setSearchTerm(value);
                  }}
                  className="bom-search-input"
                  maxLength={255}
                />
                {searchTerm && (
                  <button className="bom-search-clear" onClick={() => setSearchTerm('')}>
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
            <div className="bom-filter-right">
              <select 
                value={statusFilter} 
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bom-filter-select"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
              <button className="bom-sort-btn" onClick={() => toggle(setSortOpen, sortOpen)}>
                <ArrowUpDown size={12} />
                {sortField}
                <ChevronDown size={12} />
                {sortOpen && (
                  <div className="bom-menu bom-menu--list bom-menu--narrow bom-menu--right">
                    {SORT_FIELDS.map((f) => (
                      <div
                        key={f}
                        className={`bom-menu__item ${sortField === f ? "bom-menu__item--active" : ""}`}
                        onClick={() => {
                          setSortField(f);
                          setSortOpen(false);
                        }}
                      >
                        {sortField === f ? (
                          <Check size={14} className="bom-menu__check" />
                        ) : (
                          <span style={{ width: 14 }} />
                        )}
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                )}
              </button>
              <button className="bom-btn-primary" onClick={() => {
                setEditBOMData(null);
                setShowNewBOM(true);
              }}>
                <Plus size={12} />
                Add BOM
              </button>
            </div>
          </div>

          {/* ── Active filters indicator ──────────────────────────────────── */}
          {(searchTerm || statusFilter !== 'all' || activeTab !== 'all') && (
            <div className="bom-active-filters">
              <FilterIcon size={12} style={{ color: 'var(--primary-color)' }} />
              <span>Active filters:</span>
              {activeTab !== 'all' && (
                <span><strong>Type:</strong> {activeTab === 'internal' ? 'Internal (Products)' : 'External (Services)'}</span>
              )}
              {searchTerm && (
                <span><strong>Search:</strong> "{searchTerm}"</span>
              )}
              {statusFilter !== 'all' && (
                <span><strong>Status:</strong> {statusFilter === 'active' ? 'Active' : 'Disabled'}</span>
              )}
              <button 
                onClick={clearFilters}
                className="bom-clear-filters"
              >
                <X size={10} /> Clear All
              </button>
            </div>
          )}

          {/* ── Table ──────────────────────────────────────────────────────── */}
          <div className="bom-table-wrap">
            {loading ? (
              <div className="bom-loading-state">
                <div className="bom-spinner"></div>
                <p>Loading BOMs...</p>
              </div>
            ) : (
              <table className="bom-table">
                <thead>
                  <tr>
                    <th className="bom-th">BOM ID</th>
                    <th className="bom-th">Type</th>
                    <th className="bom-th">Status</th>
                    <th className="bom-th">Item to Manufacture</th>
                    <th className="bom-th">Quantity</th>
                    <th className="bom-th">UOM</th>
                    <th className="bom-th">Total Cost</th>
                    <th className="bom-th bom-th-meta">
                      <span className="bom-count-label">{totalRecords} total</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="bom-empty-state">
                        <div className="bom-empty-content">
                          <FileStack size={48} />
                          <p>No {activeTab !== 'all' ? activeTab + ' ' : ''}BOMs found</p>
                          <span>
                            {searchTerm || statusFilter !== 'all' 
                              ? 'Try adjusting your search criteria' 
                              : `Create your first ${activeTab !== 'all' ? activeTab + ' ' : ''}BOM by clicking "Add BOM"`}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    tableData.map((row) => (
                      <tr
                        key={row.id}
                        className="bom-tr"
                      >
                        <td className="bom-td bom-td-id">
                          <a
                            className="bom-id-link"
                            href={`/bom/${row.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              handleView(row);
                            }}
                          >
                            {row.id}
                          </a>
                        </td>
                        <td className="bom-td">
                          <span className={`bom-type-badge ${row.type === 'Internal' ? 'bom-type--internal' : 'bom-type--external'}`}>
                            {row.type === 'Internal' ? (
                              <><Box size={12} /> Product</>
                            ) : (
                              <><Wrench size={12} /> Service</>
                            )}
                          </span>
                        </td>
                        <td className="bom-td">
                          <span className={`bom-status-pill ${row.status === 'Active' ? 'bom-status--active' : 'bom-status--disabled'}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="bom-td" style={{ fontWeight: 500 }}>{row.itemToManufacture}</td>
                        <td className="bom-td">
                          {row.quantity > 0 ? row.quantity.toLocaleString() : '0'}
                        </td>
                        <td className="bom-td">{row.uom}</td>
                        <td className="bom-td bom-cost">{row.totalCost}</td>
                        <td className="bom-td bom-td-meta">
                          <span className="bom-ago">{row.createdOn}</span>
                          <span className="bom-dot">·</span>
                          <div className="bom-action-buttons">
                            <button 
                              className="bom-action-btn bom-action-view" 
                              onClick={(e) => { e.stopPropagation(); handleView(row); }}
                              title="View"
                            >
                              <Eye size={12} />
                            </button>
                            <button 
                              className="bom-action-btn bom-action-edit" 
                              onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
                              title="Edit"
                            >
                              <Edit size={12} />
                            </button>
                            <button 
                              className="bom-action-btn bom-action-delete" 
                              onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Pagination ─────────────────────────────────────────────────── */}
          {!loading && totalRecords > 0 && (
            <div className="bom-pagination">
              <div className="bom-pagination-left">
                <span className="bom-pagination-label">Show:</span>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="bom-page-size-select"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="bom-pagination-label">entries</span>
              </div>
              <div className="bom-pagination-center">
                <button 
                  onClick={goToFirstPage} 
                  disabled={validCurrentPage === 1 || totalRecords === 0} 
                  className="bom-page-btn"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="11 17 6 12 11 7"/>
                    <polyline points="18 17 13 12 18 7"/>
                  </svg>
                </button>
                <button 
                  onClick={goToPrevPage} 
                  disabled={validCurrentPage === 1 || totalRecords === 0} 
                  className="bom-page-btn"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>
                {getPageNumbers().map(page => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`bom-page-btn ${validCurrentPage === page ? 'bom-page-btn-active' : ''}`}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  onClick={goToNextPage} 
                  disabled={validCurrentPage === totalPages || totalRecords === 0} 
                  className="bom-page-btn"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
                <button 
                  onClick={goToLastPage} 
                  disabled={validCurrentPage === totalPages || totalRecords === 0} 
                  className="bom-page-btn"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="13 17 18 12 13 7"/>
                    <polyline points="6 17 11 12 6 7"/>
                  </svg>
                </button>
              </div>
              <div className="bom-pagination-right">
                <span className="bom-pagination-info">
                  Showing {getStartIndex()} to {getEndIndex()} of {totalRecords} entries
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default BOMPage;