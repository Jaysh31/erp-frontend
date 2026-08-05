import React, { useState, useEffect, useCallback } from "react";
import {
  Home,
  ChevronRight,
  X,
  Trash2,
  AlertTriangle,

  InfoIcon,
  Save,
  Plus,
  CheckCircle,
  Box,
  Clock,
  TrendingUp,
  GripVertical,
} from "lucide-react";
import "./Newbompage.css";
import api from '../../../src/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ComponentRow {
  id: number;
  itemCode: string;
  itemName: string;
  qty: string;
  uom: string;
  rate: string;
  amount: string;
  stockUom?: string;
  conversionFactor?: string;
  itemGroup?: string;
  valuationRate?: number;
  standardRate?: number;
  isNew?: boolean;
}

interface OperationRow {
  id: number;
  operation: string;
  operationId?: number;
  sequenceId: string;
  workstation: string;
  workstationId?: number;
  workstationType: string;
  timeInMins: string;
  hourRate: string;
  operatingCost: string;
  qualityInspectionRequired: boolean;
  isNew?: boolean;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

interface DeleteModal {
  isOpen: boolean;
  type: 'component' | 'operation';
  rowId: number;
  name: string;
  dbRowId?: number;
}

interface BOMItemData {
  item_Id?: number;
  item_code: string;
  item_name: string;
  bom_no: string | number;
  qty: number;
  uom: string;
  stock_qty: number;
  stock_uom: string;
  conversion_factor: number;
  rate: number;
  amount: number;
  parent: string | number;
  parentfield: string;
  parenttype: string;
  owner: string;
  modified_by: string;
}

interface BOMOperationData {
  operation: string;
  sequence_id: number;
  bom_no: string | number;
  finished_good: string;
  finished_good_qty: number;
  workstation: string;
  workstation_type: string;
  time_in_mins: number;
  hour_rate: number;
  operating_cost: number;
  quality_inspection_required: number;
  parent: string | number;
  parentfield: string;
  parenttype: string;
  owner: string;
  modified_by: string;
}

interface Operation {
  id: number;
  name: string;
  workstation?: string;
  workstation_name?: string;
  workstationId?: number;
  hour_rate?: number;
  total_operation_time: number;
  description: string;
}

interface Workstation {
  id: number;
  workstation_name: string;
  workstation_type: string;
  status: string;
  is_deleted: number;
  hour_rate: number;
}

interface Warehouse {
  id: number;
  warehouse_name: string;
  warehouse_type: string;
  disabled: number;
}

interface Item {
  id: number;
  item_code: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  valuation_rate: number;
  standard_rate: number;
}

// ─── DigitInput Component ─────────────────────────────────────────────────────

interface DigitInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
}

const DigitInput: React.FC<DigitInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  disabled = false,
  className = "",
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.]/g, '');
    if (maxLength && val.length > maxLength) return;
    onChange(val);
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.preventDefault();
  };

  return (
    <div className={`digit-input-wrapper ${className}`}>
      {label && <label className="digit-input-label">{label}</label>}
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onWheel={handleWheel}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className="digit-input"
        inputMode="numeric"
        pattern="[0-9.]*"
      />
    </div>
  );
};

// ─── Shared atoms ─────────────────────────────────────────────────────────────

const Label: React.FC<{ text: string; required?: boolean; info?: boolean }> = ({ text, required, info }) => (
  <span className="nbom-label">
    {text}
    {required && <span className="nbom-label__req">*</span>}
    {info && <span className="nbom-label__info">?</span>}
  </span>
);

const Checkbox: React.FC<{ label: string; hint?: string; checked?: boolean; onChange?: () => void }> = ({
  label, hint, checked = false, onChange,
}) => (
  <div className="nbom-check-row">
    <input type="checkbox" checked={checked} onChange={onChange ?? (() => {})} />
    <div>
      <div className="nbom-check-row__label">{label}</div>
      {hint && <div className="nbom-check-row__hint">{hint}</div>}
    </div>
  </div>
);

// ─── Toast Component ─────────────────────────────────────────────────────────

const ToastContainer: React.FC<{ toasts: Toast[]; removeToast: (id: string) => void }> = ({ toasts, removeToast }) => (
  <div className="nbom-toast-container">
    {toasts.map(toast => (
      <div key={toast.id} className={`nbom-toast nbom-toast--${toast.type}`}>
        <div className="nbom-toast-icon">
          {toast.type === 'success' && <CheckCircle size={16} />}
          {toast.type === 'error' && <AlertTriangle size={16} />}
          {toast.type === 'info' && <InfoIcon size={16} />}
        </div>
        <div className="nbom-toast-content">
          <p className="nbom-toast-title">{toast.title}</p>
          <p className="nbom-toast-message">{toast.message}</p>
        </div>
        <button className="nbom-toast-close" onClick={() => removeToast(toast.id)}>
          <X size={14} />
        </button>
      </div>
    ))}
  </div>
);

// ─── Delete Confirmation Modal ──────────────────────────────────────────────

const DeleteConfirmModal: React.FC<{
  isOpen: boolean;
  type: string;
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}> = ({ isOpen, type, name, onConfirm, onCancel, deleting }) => {
  if (!isOpen) return null;

  return (
    <div className="nbom-modal-overlay" onClick={onCancel}>
      <div className="nbom-delete-modal" onClick={e => e.stopPropagation()}>
        <div className="nbom-delete-modal-header">
          <div className="nbom-delete-modal-icon">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="nbom-delete-modal-title">Delete {type}</h3>
            <p className="nbom-delete-modal-subtitle">
              Are you sure you want to delete "{name}"? This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="nbom-delete-modal-footer">
          <button className="nbom-btn-cancel" onClick={onCancel} disabled={deleting}>
            Cancel
          </button>
          <button className="nbom-btn-delete" onClick={onConfirm} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

interface NewBOMPageProps {
  onBack?: () => void;
  editData?: {
    bom: any;
    items: any[];
    operations: any[];
  } | null;
}

const NewBOMPage: React.FC<NewBOMPageProps> = ({ onBack, editData }) => {
  const [opsPanelOpen, setOpsPanelOpen] = useState(true);
  const [withOperations, setWithOperations] = useState(false);
  const [itemToManufacture, setItemToManufacture] = useState("");
  const [quantity, setQuantity] = useState<string>("1"); // Changed to "1"
  const [, setBomNo] = useState("");
  const [bomId, setBomId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [defaultSourceWarehouse, setDefaultSourceWarehouse] = useState("");
  const [defaultTargetWarehouse, setDefaultTargetWarehouse] = useState("");
  const [bomType, setBomType] = useState<"Internal" | "External">("Internal");

  const [compRows, setCompRows] = useState<ComponentRow[]>([
    { id: Date.now(), itemCode: "", itemName: "", qty: "", uom: "", rate: "0", amount: "₹ 0.00", itemGroup: "", valuationRate: 0, standardRate: 0, isNew: true },
  ]);

  const [opRows, setOpRows] = useState<OperationRow[]>([
    {
      id: Date.now(),
      operation: "",
      operationId: undefined,
      sequenceId: "1",
      workstation: "",
      workstationId: undefined,
      workstationType: "",
      timeInMins: "",
      hourRate: "",
      operatingCost: "",
      qualityInspectionRequired: false,
      isNew: true
    }
  ]);

  // Drag and Drop state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // ─── Validation state ──────────────────────────────────────────────────────
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [deleteModal, setDeleteModal] = useState<DeleteModal>({
    isOpen: false,
    type: 'component',
    rowId: 0,
    name: '',
    dbRowId: undefined,
  });
  const [deleting, setDeleting] = useState(false);

  // Data
  const [items, setItems] = useState<Item[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [rawItems, setRawItems] = useState<Item[]>([]);
  const [rawItemsLoading, setRawItemsLoading] = useState(false);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [operationsLoading, setOperationsLoading] = useState(false);
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [workstationsLoading, setWorkstationsLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // ─── Toast helper functions ──────────────────────────────────────────────────

  const addToast = useCallback((type: Toast['type'], title: string, message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ─── Drag and Drop Handlers ─────────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    setOpRows(prevRows => {
      const newRows = [...prevRows];
      const draggedRow = newRows[dragIndex];
      newRows.splice(dragIndex, 1);
      newRows.splice(dropIndex, 0, draggedRow);
      return newRows.map((row, idx) => ({
        ...row,
        sequenceId: String(idx + 1)
      }));
    });

    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  // ─── Load edit data ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (editData) {
      const { bom, items, operations } = editData;

      setItemToManufacture(bom.item);
      setBomNo(bom.id);
      setBomId(bom.id);
      setQuantity(String(bom.quantity || ""));
      setDefaultSourceWarehouse(bom.default_source_warehouse || "");
      setDefaultTargetWarehouse(bom.default_target_warehouse || "");
      setBomType(bom.type === "External" ? "External" : "Internal");

      if (items && items.length > 0) {
        const comps = items.map((item: any) => ({
          id: item.id || Date.now() + Math.random(),
          itemCode: item.item_code,
          itemName: item.item_name,
          qty: String(item.qty),
          uom: item.uom,
          rate: String(item.rate || item.standard_rate || item.valuation_rate || 0),
          amount: `₹ ${(item.rate || item.standard_rate || item.valuation_rate || 0) * (item.qty || 0)}`,
          itemGroup: item.item_group || '',
          valuationRate: item.valuation_rate || 0,
          standardRate: item.standard_rate || 0,
          isNew: false,
        }));
        setCompRows(comps);
      }

      if (operations && operations.length > 0) {
        setWithOperations(true);
        const ops = operations.map((op: any, idx: number) => ({
          id: op.id || Date.now() + idx,
          operation: op.operation,
          operationId: op.operation_id || op.id,
          sequenceId: String(op.sequence_id || idx + 1),
          workstation: op.workstation,
          workstationId: op.workstation_id,
          workstationType: op.workstation_type || '',
          timeInMins: String(op.time_in_mins || 0),
          hourRate: String(op.hour_rate || 0),
          operatingCost: String(op.operating_cost || 0),
          qualityInspectionRequired: op.quality_inspection_required === 1,
          isNew: false,
        }));
        setOpRows(ops);
      }
    }
  }, [editData]);

  // ─── Fetch data ──────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchItems();
    fetchRawItems();
    fetchOperations();
    fetchWorkstations();
    fetchWarehouses();
  }, []);

  const fetchItems = async () => {
    try {
      setItemsLoading(true);
      const response = await api.get('/item?type=product');
      if (response.data.success === 1) {
        setItems(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching items:', err);
      addToast('error', 'Error', 'Failed to fetch items');
    } finally {
      setItemsLoading(false);
    }
  };

  const fetchRawItems = async () => {
    try {
      setRawItemsLoading(true);
      const response = await api.get('/item?type=raw');
      if (response.data.success === 1) {
        setRawItems(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching raw items:', err);
      addToast('error', 'Error', 'Failed to fetch raw materials');
    } finally {
      setRawItemsLoading(false);
    }
  };

  const fetchOperations = async () => {
    try {
      setOperationsLoading(true);
      const response = await api.get('/operation');
      if (response.data.success === 1) {
        setOperations(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching operations:', err);
      addToast('error', 'Error', 'Failed to fetch operations');
    } finally {
      setOperationsLoading(false);
    }
  };

  const fetchWorkstations = async () => {
    try {
      setWorkstationsLoading(true);
      const response = await api.get('/workstation');
      if (response.data.success === 1) {
        const data = response.data.data;
        let workstationList: Workstation[] = [];
        if (Array.isArray(data)) {
          workstationList = data;
        } else if (data && 'records' in data) {
          workstationList = data.records || [];
        }
        setWorkstations(
          workstationList.filter(w => w.is_deleted === 0 && w.status === 'Active')
        );
      }
    } catch (err: any) {
      console.error('Error fetching workstations:', err);
    } finally {
      setWorkstationsLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/warehouse');
      if (response.data.success === 1) {
        const data = response.data.data;
        let warehouseList: Warehouse[] = [];
        if (Array.isArray(data)) {
          warehouseList = data;
        } else if (data && 'records' in data) {
          warehouseList = data.records || [];
        }
        setWarehouses(warehouseList.filter(w => w.disabled === 0));
      }
    } catch (err: any) {
      console.error('Error fetching warehouses:', err);
    }
  };

  // ─── Delete Functions ──────────────────────────────────────────────────────

  const openDeleteModal = (type: 'component' | 'operation', rowId: number, name: string, dbRowId?: number) => {
    setDeleteModal({ isOpen: true, type, rowId, name, dbRowId });
  };

  const closeDeleteModal = () => {
    if (!deleting) {
      setDeleteModal({ isOpen: false, type: 'component', rowId: 0, name: '', dbRowId: undefined });
    }
  };

  const confirmDelete = async () => {
    const { type, rowId, name, dbRowId } = deleteModal;

    if (type === 'component') {
      const row = compRows.find(r => r.id === rowId);
      if (row?.isNew) {
        setCompRows(r => r.filter(row => row.id !== rowId));
        addToast('success', 'Deleted', `Component "${name}" removed`);
        closeDeleteModal();
        return;
      }

      const deleteId = dbRowId || rowId;

      try {
        setDeleting(true);
        const response = await api.delete(`/bom-item/${deleteId}`);
        if (response.data.success === 1) {
          setCompRows(r => r.filter(row => row.id !== rowId));
          addToast('success', 'Deleted', `Component "${name}" deleted successfully`);
        } else {
          addToast('error', 'Error', response.data.message || 'Failed to delete component');
        }
      } catch (err: any) {
        addToast('error', 'Error', err.response?.data?.message || 'Failed to delete component');
      } finally {
        setDeleting(false);
        closeDeleteModal();
      }
    } else if (type === 'operation') {
      const row = opRows.find(r => r.id === rowId);
      if (row?.isNew) {
        setOpRows(r => {
          const filtered = r.filter(row => row.id !== rowId);
          return filtered.map((row, idx) => ({ ...row, sequenceId: String(idx + 1) }));
        });
        addToast('success', 'Deleted', `Operation "${name}" removed`);
        closeDeleteModal();
        return;
      }

      const deleteId = dbRowId || row?.operationId || rowId;

      try {
        setDeleting(true);
        const response = await api.delete(`/bom-operation/${deleteId}`);
        if (response.data.success === 1) {
          setOpRows(r => {
            const filtered = r.filter(row => row.id !== rowId);
            return filtered.map((row, idx) => ({ ...row, sequenceId: String(idx + 1) }));
          });
          addToast('success', 'Deleted', `Operation "${name}" deleted successfully`);
        } else {
          addToast('error', 'Error', response.data.message || 'Failed to delete operation');
        }
      } catch (err: any) {
        addToast('error', 'Error', err.response?.data?.message || 'Failed to delete operation');
      } finally {
        setDeleting(false);
        closeDeleteModal();
      }
    }
  };

  // ─── Row Operations ──────────────────────────────────────────────────────────

  const addCompRow = () =>
    setCompRows(r => [...r, {
      id: Date.now(),
      itemCode: "",
      itemName: "",
      qty: "",
      uom: "",
      rate: "0",
      amount: "₹ 0.00",
      itemGroup: "",
      valuationRate: 0,
      standardRate: 0,
      isNew: true
    }]);

  const addOpRow = () =>
    setOpRows(r => [...r, {
      id: Date.now(),
      operation: "",
      operationId: undefined,
      sequenceId: String(r.length + 1),
      workstation: "",
      workstationId: undefined,
      workstationType: "",
      timeInMins: "",
      hourRate: "",
      operatingCost: "",
      qualityInspectionRequired: false,
      isNew: true
    }]);

  const handleOperationSelect = (idx: number, operationName: string) => {
    const selectedOp = operations.find(op => op.name === operationName);
    if (selectedOp) {
      const workstationDetails = workstations.find(w => w.id === selectedOp.workstationId);
      const workstationName = workstationDetails?.workstation_name || selectedOp.workstation_name || selectedOp.workstation || '';
      const hourRate = (workstationDetails?.hour_rate ?? selectedOp.hour_rate ?? 0).toString();
      const timeInMins = selectedOp.total_operation_time?.toString() || '0';
      const operatingCost = ((parseFloat(hourRate) || 0) * (parseFloat(timeInMins) || 0) / 60).toFixed(2);

      setOpRows(rs => rs.map((r, i) =>
        i === idx ? {
          ...r,
          operation: operationName,
          operationId: selectedOp.id,
          workstation: workstationName,
          workstationId: selectedOp.workstationId,
          timeInMins,
          workstationType: workstationDetails?.workstation_type || '',
          hourRate,
          operatingCost,
        } : r
      ));
    }
  };

  const handleWorkstationSelect = (idx: number, workstationName: string) => {
    const selectedWorkstation = workstations.find(w => w.workstation_name === workstationName);
    if (selectedWorkstation) {
      setOpRows(rs => rs.map((r, i) =>
        i === idx ? {
          ...r,
          workstation: workstationName,
          workstationId: selectedWorkstation.id,
          workstationType: selectedWorkstation.workstation_type || '',
          hourRate: selectedWorkstation.hour_rate?.toString() || r.hourRate || '0',
          operatingCost: selectedWorkstation.hour_rate
            ? ((selectedWorkstation.hour_rate * (parseFloat(r.timeInMins) || 0)) / 60).toFixed(2)
            : r.operatingCost || '0',
        } : r
      ));
    }
  };

  const handleTimeChange = (idx: number, timeInMins: string) => {
    const row = opRows[idx];
    const hourRate = parseFloat(row.hourRate) || 0;
    const time = parseFloat(timeInMins) || 0;
    const operatingCost = (hourRate * time) / 60;

    setOpRows(rs => rs.map((r, i) =>
      i === idx ? {
        ...r,
        timeInMins: timeInMins,
        operatingCost: operatingCost.toFixed(2)
      } : r
    ));
  };

  const handleHourRateChange = (idx: number, hourRate: string) => {
    const row = opRows[idx];
    const time = parseFloat(row.timeInMins) || 0;
    const rate = parseFloat(hourRate) || 0;
    const operatingCost = (rate * time) / 60;

    setOpRows(rs => rs.map((r, i) =>
      i === idx ? {
        ...r,
        hourRate: hourRate,
        operatingCost: operatingCost.toFixed(2)
      } : r
    ));
  };

  const calculateTotalCost = () => {
    let totalComponentCost = 0;
    compRows.forEach(row => {
      if (row.rate && row.qty) {
        const rate = parseFloat(row.rate ?? '0') || 0;
        const qty = parseFloat(row.qty ?? '0') || 0;
        totalComponentCost += rate * qty;
      }
    });

    let totalOperationCost = 0;
    opRows.forEach(row => {
      if (row.operatingCost) {
        totalOperationCost += parseFloat(row.operatingCost) || 0;
      }
    });

    return {
      totalComponentCost: totalComponentCost.toFixed(2),
      totalOperationCost: totalOperationCost.toFixed(2),
      totalCost: (totalComponentCost + totalOperationCost).toFixed(2)
    };
  };

  // ─── Validation Functions ──────────────────────────────────────────────────

  const validateForm = (): { isValid: boolean; errors: { [key: string]: string } } => {
    const errors: { [key: string]: string } = {};

    // Validate Item to Manufacture
    if (!itemToManufacture.trim()) {
      errors.itemToManufacture = "Item to Manufacture is required";
    }

    // Validate Components (only for Internal BOM)
    if (bomType === "Internal") {
      const filledComps = compRows.filter(r => r.itemCode.trim());
      if (filledComps.length === 0) {
        errors.components = "At least one component with an Item Code is required";
      }

      compRows.forEach((r, i) => {
        if (r.itemCode && !r.uom.trim()) {
          errors[`comp_uom_${i}`] = `UOM is required for component "${r.itemCode}"`;
        }
        if (r.itemCode && (!r.qty || parseFloat(r.qty) <= 0)) {
          errors[`comp_qty_${i}`] = `Valid quantity is required for component "${r.itemCode}"`;
        }
      });
    }

    // Validate Operations for External BOM
    if (bomType === "External" && !withOperations) {
      errors.operations = "Operations are required for External/Service BOM";
    }

    // Validate operation rows
    if (withOperations || bomType === "External") {
      opRows.forEach((r, i) => {
        if (!r.operation.trim()) {
          errors[`op_${i}`] = `Operation name is required for row ${i + 1}`;
        }
        if (!r.workstation.trim()) {
          errors[`op_workstation_${i}`] = `Workstation is required for operation "${r.operation || i + 1}"`;
        }
        if (!r.timeInMins || parseFloat(r.timeInMins) <= 0) {
          errors[`op_time_${i}`] = `Valid time is required for operation "${r.operation || i + 1}"`;
        }
      });
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const getFieldError = (field: string): string | undefined => {
    if (!showValidationErrors) return undefined;
    return fieldErrors[field];
  };

  const handleSave = async () => {
    const { isValid, errors } = validateForm();
    setFieldErrors(errors);
    setShowValidationErrors(true);

    if (!isValid) {
      // Scroll to the first error
      const firstErrorField = Object.keys(errors)[0];
      const element = document.querySelector(`[data-field="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSaving(true);
    setApiError(null);

    try {
      const selectedItem = items.find(i => i.item_code === itemToManufacture);

      const totalComponentCost = compRows.reduce((sum, row) => {
        const rate = parseFloat(row.rate || "0") || 0;
        const qty = parseFloat(row.qty || "0") || 0;
        return sum + (rate * qty);
      }, 0);

      const totalOperationCost = opRows.reduce((sum, row) => {
        return sum + (parseFloat(row.operatingCost || "0") || 0);
      }, 0);

      const totalCost = totalComponentCost + totalOperationCost;

      let bomResponse;
      const bomPayload = {
        item_Id: selectedItem?.id,
        item: itemToManufacture,
        item_name: selectedItem?.item_name || "",
        company: "SculptorTech",
        quantity: parseFloat(quantity) || 0,
        uom: selectedItem?.stock_uom || "Nos",
        is_active: 1,
        is_default: 1,
        type: bomType,
        description: `${itemToManufacture} BOM`,
        modified_by: "Administrator",
        default_source_warehouse: defaultSourceWarehouse,
        default_target_warehouse: defaultTargetWarehouse,
        operating_cost: totalOperationCost,
        raw_material_cost: totalComponentCost,
        base_operating_cost: totalOperationCost,
        base_raw_material_cost: totalComponentCost,
        total_cost: totalCost,
        base_total_cost: totalCost,
      };

      if (editData && editData.bom && editData.bom.id) {
        bomResponse = await api.put('/bom', {
          id: editData.bom.id,
          ...bomPayload
        });
        setBomId(editData.bom.id);
      } else {
        bomResponse = await api.post('/bom', bomPayload);
      }

      if (bomResponse.data.success !== 1) {
        throw new Error(bomResponse.data?.message || 'Failed to save BOM');
      }

      const insertId = bomResponse.data?.data?.insertId || bomId || editData?.bom?.id || Date.now();
      setBomId(insertId);
      const parentRef = insertId;

      // ─── Handle Components (only for Internal BOM) ────────────────────────────
      if (bomType === "Internal") {
        const existingComponentIds = editData?.items?.map((item: any) => item.id) || [];
        const currentComponentIds = compRows
          .filter(row => !row.isNew && row.id)
          .map(row => row.id);

        const componentsToDelete = existingComponentIds.filter(
          id => !currentComponentIds.includes(id)
        );

        for (const deleteId of componentsToDelete) {
          try {
            await api.delete(`/bom-item/${deleteId}`);
          } catch (err) {
            console.error('Error deleting component:', err);
          }
        }

        for (const comp of compRows) {
          if (!comp.itemCode.trim()) continue;

          const compItem = rawItems.find(i => i.item_code === comp.itemCode);
          const qty = parseFloat(comp.qty) || 0;
          const rate = parseFloat(comp.rate) || compItem?.standard_rate || compItem?.valuation_rate || 0;
          const amount = qty * rate;

          const itemPayload: BOMItemData = {
            item_Id: compItem?.id,
            item_code: comp.itemCode,
            item_name: compItem?.item_name || comp.itemCode,
            bom_no: parentRef,
            qty: qty,
            uom: comp.uom || compItem?.stock_uom || "Nos",
            stock_qty: qty,
            stock_uom: comp.uom || compItem?.stock_uom || "Nos",
            conversion_factor: 1,
            rate: rate,
            amount: amount,
            parent: parentRef,
            parentfield: "items",
            parenttype: "BOM",
            owner: "Administrator",
            modified_by: "Administrator"
          };

          if (comp.isNew) {
            await api.post('/bom-item', itemPayload);
          } else {
            await api.put(`/bom-item`, {
              id: comp.id,
              ...itemPayload
            });
          }
        }
      }

      // ─── Handle Operations ─────────────────────────────────────────────────────

      const existingOperationIds = editData?.operations?.map((op: any) => op.id) || [];
      const currentOperationIds = opRows
        .filter(row => !row.isNew && row.id)
        .map(row => row.id);

      const operationsToDelete = existingOperationIds.filter(
        id => !currentOperationIds.includes(id)
      );

      for (const deleteId of operationsToDelete) {
        try {
          await api.delete(`/bom-operation/${deleteId}`);
        } catch (err) {
          console.error('Error deleting operation:', err);
        }
      }

      for (const op of opRows) {
        if (!op.operation.trim()) continue;

        const hourRate = parseFloat(op.hourRate) || 0;
        const timeInMins = parseFloat(op.timeInMins) || 0;
        const operatingCost = (hourRate * timeInMins) / 60;

        const opPayload: BOMOperationData = {
          operation: op.operation,
          sequence_id: parseInt(op.sequenceId) || 0,
          bom_no: parentRef,
          finished_good: itemToManufacture,
          finished_good_qty: parseFloat(quantity) || 0,
          workstation: op.workstation,
          workstation_type: op.workstationType || "Machine",
          time_in_mins: timeInMins,
          hour_rate: hourRate,
          operating_cost: operatingCost,
          quality_inspection_required: op.qualityInspectionRequired ? 1 : 0,
          parent: parentRef,
          parentfield: "operations",
          parenttype: "BOM",
          owner: "Administrator",
          modified_by: "Administrator"
        };

        if (op.isNew) {
          await api.post('/bom-operation', opPayload);
        } else {
          await api.put(`/bom-operation`, {
            id: op.id,
            ...opPayload
          });
        }
      }

      addToast('success', 'Success', `BOM ${editData ? 'updated' : 'created'} successfully! BOM ID: ${parentRef}`);

      setTimeout(() => {
        if (onBack) onBack();
      }, 1000);

    } catch (err: any) {
      console.error('Error saving BOM:', err);
      addToast('error', 'Error', err.response?.data?.message || 'Failed to save BOM');
    } finally {
      setSaving(false);
    }
  };

  // Auto-enable operations for External BOM
  useEffect(() => {
    if (bomType === "External") {
      setWithOperations(true);
    }
  }, [bomType]);

  return (
    <div className="nbom-page">

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        type={deleteModal.type === 'component' ? 'Component' : 'Operation'}
        name={deleteModal.name}
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
        deleting={deleting}
      />

      {/* Topbar */}
      <div className="nbom-topbar">
        <nav className="nbom-breadcrumb" aria-label="Breadcrumb">
          <ol className="nbom-breadcrumb__list">
            <li className="nbom-breadcrumb__item nbom-breadcrumb__item--home">
              <button className="nbom-breadcrumb__home-btn" title="Home" onClick={onBack}>
                <Home size={13} />
              </button>
            </li>
            <li className="nbom-breadcrumb__sep" aria-hidden><ChevronRight size={12} /></li>
            <li className="nbom-breadcrumb__item">
              <button className="nbom-breadcrumb__link" onClick={onBack}>
                Manufacturing
              </button>
            </li>
            <li className="nbom-breadcrumb__sep" aria-hidden><ChevronRight size={12} /></li>
            <li className="nbom-breadcrumb__item">
              <button className="nbom-breadcrumb__link" onClick={onBack}>
                Bill of Materials
              </button>
            </li>
            <li className="nbom-breadcrumb__sep" aria-hidden><ChevronRight size={12} /></li>
            <li className="nbom-breadcrumb__item nbom-breadcrumb__item--active" aria-current="page">
              <span className="nbom-breadcrumb__current">
                <span className="nbom-breadcrumb__current-dot" />
                {editData ? 'Edit' : 'New'} BOM
              </span>
            </li>
          </ol>
        </nav>
        <div className="nbom-topbar__right">
          {apiError && (
            <div className="nbom-error-pill">
              <AlertTriangle size={11} />
              {apiError}
            </div>
          )}
          <button className="nbom-btn-save" onClick={handleSave} disabled={saving}>
            <Save size={13} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Body - Single Page Layout */}
      <div className="nbom-body">

        {/* BOM Type Radio */}
        <div className="nbom-card">
          <div className="nbom-card__body">
            <div className="nbom-bom-type-row">
              <label className="nbom-bom-type-title">
                BOM Type
              </label>
              <div className="nbom-radio-options">
                <label className="nbom-radio-option">
                  <input
                    type="radio"
                    name="bomType"
                    value="Internal"
                    checked={bomType === "Internal"}
                    onChange={() => setBomType("Internal")}
                  />
                  <span className="nbom-radio-option-label">Product</span>
                </label>
                <label className="nbom-radio-option">
                  <input
                    type="radio"
                    name="bomType"
                    value="External"
                    checked={bomType === "External"}
                    onChange={() => setBomType("External")}
                  />
                  <span className="nbom-radio-option-label">Service</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Item to Manufacture with Quantity */}
        <div className="nbom-card">
          <div className="nbom-card__body nbom-two-column">
            {/* Item */}
            <div className="nbom-field nbom-flex-item" data-field="itemToManufacture">
              <Label text="Item to Manufacture" required info />
              <select
                className="nbom-input"
                value={itemToManufacture}
                onChange={e => {
                  setItemToManufacture(e.target.value);
                  // Clear error when user selects
                  if (fieldErrors.itemToManufacture) {
                    setFieldErrors(prev => ({ ...prev, itemToManufacture: '' }));
                  }
                }}
                disabled={itemsLoading}
              >
                <option value="">
                  {itemsLoading ? 'Loading items...' : 'Select an item...'}
                </option>
                {items.map(item => (
                  <option key={item.id} value={item.item_code}>
                    {item.item_code} - {item.item_name} ({item.item_group})
                  </option>
                ))}
              </select>
              {getFieldError('itemToManufacture') && (
                <div style={{ color: '#dc2626', fontSize: '13px', fontWeight: '500', marginTop: '6px' }}>
                  {getFieldError('itemToManufacture')}
                </div>
              )}
            </div>

            {/* Quantity */}
            <div className="nbom-field nbom-qty-field">
              <Label text="Quantity" required />
              <DigitInput
                value={quantity}
                onChange={(val) => setQuantity(val)}
                placeholder="Enter quantity"
                maxLength={10}
                className="nbom-digit-input"
              />
            </div>
          </div>
        </div>

        {/* Components - Only show for Internal BOM */}
        {bomType === "Internal" && (
          <div className="nbom-card">
            <div className="nbom-card__body">
              <div className="nbom-card__title" style={{ marginBottom: 14 }}>
                <span className="nbom-card__title-dot" />Components
              </div>
              {getFieldError('components') && (
                <div style={{ marginBottom: 12, color: '#dc2626', fontSize: '13px', fontWeight: '500' }}>
                  {getFieldError('components')}
                </div>
              )}
              <div className="nbom-table-wrap">
                <table className="nbom-table">
                  <thead>
                    <tr>
                      <th className="nbom-table-no">No.</th>
                      <th>Item Code <span style={{ color: "#dc2626" }}>*</span></th>
                      <th>Item Name</th>
                      <th>Item Group</th>
                      <th>Qty <span style={{ color: "#dc2626" }}>*</span></th>
                      <th>UOM <span style={{ color: "#dc2626" }}>*</span></th>
                      <th>Rate</th>
                      <th>Amount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {compRows.map((row, idx) => (
                      <tr key={row.id}>
                        <td className="nbom-table-no">{idx + 1}</td>
                        <td>
                          <select
                            className="nbom-table-select"
                            value={row.itemCode}
                            onChange={e => {
                              const selectedItem = rawItems.find(i => i.item_code === e.target.value);
                              const rate = selectedItem?.standard_rate ?? selectedItem?.valuation_rate ?? 0;
                              setCompRows(rs => rs.map((r, i) => i === idx ? {
                                ...r,
                                itemCode: e.target.value,
                                itemName: selectedItem?.item_name || '',
                                itemGroup: selectedItem?.item_group || '',
                                uom: selectedItem?.stock_uom || r.uom,
                                rate: String(rate),
                                valuationRate: selectedItem?.valuation_rate || 0,
                                standardRate: selectedItem?.standard_rate || 0,
                                amount: `₹ ${(rate * (parseFloat(r.qty) || 0)).toFixed(2)}`
                              } : r));
                            }}
                            disabled={rawItemsLoading}
                          >
                            <option value="">
                              {rawItemsLoading ? 'Loading...' : 'Select item...'}
                            </option>
                            {rawItems.map(item => (
                              <option key={item.id} value={item.item_code}>
                                {item.item_code} - {item.item_name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            className="nbom-table-input"
                            value={row.itemName}
                            readOnly
                            style={{ background: "var(--c-bg-muted)" }}
                          />
                        </td>
                        <td>
                          <input
                            className="nbom-table-input"
                            value={row.itemGroup}
                            readOnly
                            style={{ background: "var(--c-bg-muted)", width: 120 }}
                          />
                        </td>
                        <td>
                          <DigitInput
                            value={row.qty}
                            onChange={(val) => {
                              const qty = parseFloat(val) || 0;
                              const rate = parseFloat(row.rate) || 0;
                              setCompRows(rs => rs.map((r, i) => i === idx ? {
                                ...r,
                                qty: val,
                                amount: `₹ ${(rate * qty).toFixed(2)}`
                              } : r));
                              if (fieldErrors[`comp_qty_${idx}`]) {
                                setFieldErrors(prev => ({ ...prev, [`comp_qty_${idx}`]: '' }));
                              }
                            }}
                            placeholder="0"
                            maxLength={10}
                            className="nbom-digit-input"
                          />
                          {getFieldError(`comp_qty_${idx}`) && (
                            <div style={{ marginTop: 4, color: '#dc2626', fontSize: '12px' }}>
                              {getFieldError(`comp_qty_${idx}`)}
                            </div>
                          )}
                        </td>
                        <td>
                          <input
                            className="nbom-table-input"
                            value={row.uom}
                            onChange={e => {
                              setCompRows(rs => rs.map((r, i) => i === idx ? { ...r, uom: e.target.value } : r));
                              if (fieldErrors[`comp_uom_${idx}`]) {
                                setFieldErrors(prev => ({ ...prev, [`comp_uom_${idx}`]: '' }));
                              }
                            }}
                            style={{ width: 80 }}
                          />
                          {getFieldError(`comp_uom_${idx}`) && (
                            <div style={{ marginTop: 4, color: '#dc2626', fontSize: '12px' }}>
                              {getFieldError(`comp_uom_${idx}`)}
                            </div>
                          )}
                        </td>
                        <td>
                          <DigitInput
                            value={row.rate}
                            onChange={(val) => {
                              const rate = parseFloat(val) || 0;
                              const qty = parseFloat(row.qty) || 0;
                              setCompRows(rs => rs.map((r, i) => i === idx ? {
                                ...r,
                                rate: val,
                                amount: `₹ ${(rate * qty).toFixed(2)}`
                              } : r));
                            }}
                            placeholder="0"
                            maxLength={10}
                            className="nbom-digit-input"
                          />
                        </td>
                        <td className="nbom-table-val">{row.amount}</td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            className="nbom-edit-btn nbom-edit-btn--delete"
                            onClick={() => openDeleteModal('component', row.id, row.itemCode || `Row ${idx + 1}`, row.id)}
                            title="Delete row"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="nbom-table-footer">
                <div className="nbom-table-footer__left">
                  <button className="nbom-btn-link" onClick={addCompRow}>
                    <Plus size={12} /> Add Component
                  </button>
                </div>
                <div className="nbom-table-footer__right">
                  <button className="nbom-btn-ghost">Download</button>
                  <button className="nbom-btn-ghost">Upload</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Operations with Drag & Drop */}
        <div className="nbom-card">
          <div className="nbom-card__header" onClick={() => bomType === "Internal" && setOpsPanelOpen(o => !o)}>
            <span className="nbom-card__title">
              <span className="nbom-card__title-dot" />Operations
            </span>
            {bomType === "Internal" && (
              <ChevronRight size={15} className={`nbom-card__chev ${opsPanelOpen ? "nbom-card__chev--open" : ""}`} />
            )}
          </div>
          {((bomType === "External") || (bomType === "Internal" && opsPanelOpen)) && (
            <div className="nbom-card__body">
              {bomType === "Internal" && (
                <Checkbox
                  label="With Operations"
                  hint="Manage cost of operations. Drag rows to reorder."
                  checked={withOperations}
                  onChange={() => setWithOperations(v => !v)}
                />
              )}

              {(bomType === "External" || withOperations) && (
                <div style={{ marginTop: bomType === "Internal" ? 16 : 0 }}>
                  {bomType === "External" && (
                    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#eff6ff', borderRadius: '6px', color: '#1e40af', fontSize: '13px' }}>
                      <InfoIcon size={14} />
                      <span>External/Service BOM requires operations to define the service workflow.</span>
                    </div>
                  )}
                  {getFieldError('operations') && (
                    <div style={{ marginBottom: 12, color: '#dc2626', fontSize: '13px', fontWeight: '500' }}>
                      {getFieldError('operations')}
                    </div>
                  )}
                  <div className="nbom-table-wrap">
                    <table className="nbom-table">
                      <thead>
                        <tr>
                          <th className="nbom-table-drag-col"></th>
                          <th className="nbom-table-no">No.</th>
                          <th>Operation <span style={{ color: "#dc2626" }}>*</span></th>
                          <th>Seq ID</th>
                          <th>Workstation <span style={{ color: "#dc2626" }}>*</span></th>
                          <th>WS Type</th>
                          <th>Time (mins) <span style={{ color: "#dc2626" }}>*</span></th>
                          <th>Hour Rate (₹)</th>
                          <th>Operating Cost</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {opRows.map((row, idx) => (
                          <tr
                            key={row.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, idx)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, idx)}
                            onDragEnd={handleDragEnd}
                            className={`nbom-draggable-row ${
                              dragOverIndex === idx ? 'nbom-drag-over' : ''
                            } ${dragIndex === idx ? 'nbom-dragging' : ''}`}
                          >
                            <td className="nbom-table-drag-handle">
                              <GripVertical size={14} />
                            </td>
                            <td className="nbom-table-no">{idx + 1}</td>
                            <td>
                              <select
                                className="nbom-table-select"
                                value={row.operation}
                                onChange={e => {
                                  handleOperationSelect(idx, e.target.value);
                                  if (fieldErrors[`op_${idx}`]) {
                                    setFieldErrors(prev => ({ ...prev, [`op_${idx}`]: '' }));
                                  }
                                }}
                                disabled={operationsLoading || workstationsLoading}
                              >
                                <option value="">{operationsLoading ? 'Loading...' : 'Select operation...'}</option>
                                {operations.map(op => (
                                  <option key={op.id} value={op.name}>{op.name}</option>
                                ))}
                              </select>
                              {getFieldError(`op_${idx}`) && (
                                <div style={{ marginTop: 4, color: '#dc2626', fontSize: '12px' }}>
                                  {getFieldError(`op_${idx}`)}
                                </div>
                              )}
                            </td>
                            <td>
                              <DigitInput
                                value={row.sequenceId}
                                onChange={(val) => setOpRows(rs => rs.map((r, i) => i === idx ? { ...r, sequenceId: val } : r))}
                                placeholder="Seq"
                                maxLength={10}
                                className="nbom-digit-input"
                              />
                            </td>
                            <td>
                              <select
                                className="nbom-table-select"
                                value={row.workstation}
                                onChange={e => {
                                  handleWorkstationSelect(idx, e.target.value);
                                  if (fieldErrors[`op_workstation_${idx}`]) {
                                    setFieldErrors(prev => ({ ...prev, [`op_workstation_${idx}`]: '' }));
                                  }
                                }}
                                disabled={workstationsLoading}
                              >
                                <option value="">{workstationsLoading ? 'Loading...' : 'Select workstation...'}</option>
                                {workstations.map(w => (
                                  <option key={w.id} value={w.workstation_name}>{w.workstation_name}</option>
                                ))}
                              </select>
                              {getFieldError(`op_workstation_${idx}`) && (
                                <div style={{ marginTop: 4, color: '#dc2626', fontSize: '12px' }}>
                                  {getFieldError(`op_workstation_${idx}`)}
                                </div>
                              )}
                            </td>
                            <td>
                              <input
                                className="nbom-table-input"
                                value={row.workstationType}
                                onChange={e => setOpRows(rs => rs.map((r, i) => i === idx ? { ...r, workstationType: e.target.value } : r))}
                                placeholder="WS Type"
                              />
                            </td>
                            <td>
                              <DigitInput
                                value={row.timeInMins}
                                onChange={(val) => {
                                  handleTimeChange(idx, val);
                                  if (fieldErrors[`op_time_${idx}`]) {
                                    setFieldErrors(prev => ({ ...prev, [`op_time_${idx}`]: '' }));
                                  }
                                }}
                                placeholder="0"
                                maxLength={10}
                                className="nbom-digit-input"
                              />
                              {getFieldError(`op_time_${idx}`) && (
                                <div style={{ marginTop: 4, color: '#dc2626', fontSize: '12px' }}>
                                  {getFieldError(`op_time_${idx}`)}
                                </div>
                              )}
                            </td>
                            <td>
                              <DigitInput
                                value={row.hourRate}
                                onChange={(val) => handleHourRateChange(idx, val)}
                                placeholder="0"
                                maxLength={10}
                                className="nbom-digit-input"
                              />
                            </td>
                            <td>
                              <input
                                className="nbom-table-input"
                                value={row.operatingCost}
                                readOnly
                                style={{ width: 80, background: "var(--c-bg-muted)" }}
                              />
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <button
                                className="nbom-edit-btn nbom-edit-btn--delete"
                                onClick={() => openDeleteModal('operation', row.id, row.operation || `Row ${idx + 1}`, row.operationId)}
                                title="Delete row"
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="nbom-table-footer">
                    <div className="nbom-table-footer__left">
                      <button className="nbom-btn-link" onClick={addOpRow}>
                        <Plus size={12} /> Add Operation
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Default Warehouse */}
        <div className="nbom-card">
          <div className="nbom-card__body">
            <div className="nbom-config-section">
              <div className="nbom-config-section__title">Default Warehouse</div>
              <div className="nbom-form-grid">
                <div className="nbom-field">
                  <Label text="Default Source Warehouse" />
                  <select
                    className="nbom-input"
                    value={defaultSourceWarehouse || ''}
                    onChange={(e) => setDefaultSourceWarehouse(e.target.value)}
                  >
                    <option value="">Select Source Warehouse...</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.warehouse_name}>
                        {w.warehouse_name} {w.warehouse_type ? `(${w.warehouse_type})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="nbom-field">
                  <Label text="Default Target Warehouse" />
                  <select
                    className="nbom-input"
                    value={defaultTargetWarehouse || ''}
                    onChange={(e) => setDefaultTargetWarehouse(e.target.value)}
                  >
                    <option value="">Select Target Warehouse...</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.warehouse_name}>
                        {w.warehouse_name} {w.warehouse_type ? `(${w.warehouse_type})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Summary */}
        <div className="nbom-cost-summary">
          {bomType === "Internal" && (
            <div className="nbom-cost-card nbom-cost-card--material">
              <div className="nbom-cost-card__icon">
                <Box size={18} />
              </div>
              <div className="nbom-cost-card__label">Raw Material Cost</div>
              <div className="nbom-cost-card__value">₹{calculateTotalCost().totalComponentCost}</div>
              <div className="nbom-cost-card__subtitle">Total component cost</div>
            </div>
          )}

          <div className="nbom-cost-card nbom-cost-card--operation">
            <div className="nbom-cost-card__icon">
              <Clock size={18} />
            </div>
            <div className="nbom-cost-card__label">Operation Cost</div>
            <div className="nbom-cost-card__value">₹{calculateTotalCost().totalOperationCost}</div>
            <div className="nbom-cost-card__subtitle">Total operations cost</div>
          </div>

          <div className="nbom-cost-card nbom-cost-card--total">
            <div className="nbom-cost-card__icon">
              <TrendingUp size={18} />
            </div>
            <div className="nbom-cost-card__label">Total BOM Cost</div>
            <div className="nbom-cost-card__value">₹{calculateTotalCost().totalCost}</div>
            <div className="nbom-cost-card__subtitle">
              {bomType === "Internal" ? "Material + Operations" : "Operations Cost"}
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Single Save Button */}
      <div className="nbom-footer-row" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="nbom-footer-btn nbom-footer-btn--primary nbom-footer-btn--submit" onClick={handleSave} disabled={saving}>
          <Save size={14} /> {saving ? 'Saving...' : (editData ? 'Update BOM' : 'Save BOM')}
        </button>
      </div>
    </div>
  );
};

export default NewBOMPage;