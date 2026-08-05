import React, { useState, useEffect, useRef } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  FaArrowLeft, FaSave, FaSpinner, FaInfoCircle, FaExclamationTriangle,
  FaTimesCircle, FaClock,
  FaCalendarAlt, FaPlay, FaPause, FaCheck, FaUserPlus, FaTimes,
  FaBuilding, FaUser, FaUserCheck, FaExchangeAlt, FaWarehouse,
  FaTruck, FaShoppingCart, FaMoneyBillWave,
  FaClipboardList, FaBoxes, FaIndustry, FaPlus, FaTrash,
  FaFileAlt,
  FaTools, FaExclamationCircle
} from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./JobCardForm.css";
import api from "../../services/api";

// ─── DigitInput Component ─────────────────────────────────────────────

interface DigitInputProps {
  label?: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  min?: number;
  max?: number;
  allowDecimal?: boolean;
}

const DigitInput: React.FC<DigitInputProps> = ({
  label,
  value,
  onChange,
  placeholder = '',
  maxLength = 20,
  disabled = false,
  required = false,
  className = '',
  min,
  max,
  allowDecimal = false,
}) => {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value;
    
    let filtered = allowDecimal 
      ? rawValue.replace(/[^0-9.]/g, '') 
      : rawValue.replace(/\D/g, '');
    
    if (allowDecimal) {
      const parts = filtered.split('.');
      if (parts.length > 2) {
        filtered = parts[0] + '.' + parts.slice(1).join('');
      }
    }
    
    if (filtered.length > maxLength) {
      filtered = filtered.slice(0, maxLength);
    }
    
    // Apply max constraint
    if (filtered !== '' && max !== undefined) {
      const numValue = parseFloat(filtered);
      if (numValue > max) {
        filtered = String(max);
      }
    }
    
    if (filtered !== '' && min !== undefined) {
      const numValue = parseFloat(filtered);
      if (numValue < min) {
        filtered = String(min);
      }
    }
    
    onChange(filtered);
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.preventDefault();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const displayValue = value !== undefined && value !== null ? String(value) : '';

  return (
    <div className={`digit-input-wrapper ${className}`}>
      {label && <label className="digit-input-label">{label}</label>}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`digit-input ${focused ? 'digit-input-focused' : ''} ${disabled ? 'digit-input-disabled' : ''}`}
        autoComplete="off"
      />
    </div>
  );
};

// ─── date helpers ───────────────────────────────────────────────────────

const pad2 = (n: number) => String(n).padStart(2, "0");

const formatDateOnly = (d: Date | null): string | null => {
  if (!d) return null;
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const formatDateTime = (d: Date | null): string | null => {
  if (!d) return null;
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
};

const formatElapsed = (totalSeconds: number): string => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
};

interface WorkOrderOption {
  name: string;
  company?: string;
  qty?: number;
  qty_to_manufacture?: number;
  item_name?: string;
  [key: string]: any;
}

interface EmployeeOption {
  id: number;
  employee: string | null;
  employee_name: string;
  employee_number?: string | null;
  designation?: string | null;
  department?: string | null;
  first_name?: string;
  last_name?: string;
  [key: string]: any;
}

interface SubcontractingItem {
  id: string;
  item_code: string;
  item_name: string;
  quantity: number;
  uom: string;
  rate: number;
  amount: number;
  warehouse?: string;
}

interface JobCardFormData {
  work_order: string;
  qty_to_manufacture: number;
  posting_date: Date | null;
  pending_qty: number;
  total_completed_qty: number;
  process_loss_qty: number;
  quality_inspection_template: string;
  expected_start_date: Date | null;
  expected_end_date: Date | null;
  for_quantity: number;
  hour_rate: number;
  actual_start_date: Date | null;
  actual_end_date: Date | null;
  remarks: string;
  company: string;
  status: string;
  assigned_employees: string[];
  source_warehouse: string;
  wip_warehouse: string;
  target_warehouse: string;
  production_item: string;
  bom_no: string;
  finished_good: string;
  semi_fg_bom: string;
  operation: string;
  workstation_type: string;
  workstation: string;
  for_operation: string;
  item_name: string;
  project: string;
  operation_row_id: number;
  operation_row_number: number;
  operation_id: string;
  sequence_id: number;
  serial_no: string;
  // Subcontracting fields
  job_type: 'internal' | 'subcontracting';
  subcontractor_name: string;
  subcontractor_contact: string;
  subcontractor_address: string;
  subcontract_reason: string;
  material_sent_items: SubcontractingItem[];
  delivery_challan_no: string;
  service_charge: number;
  transport_cost: number;
  other_charges: number;
  expected_return_date: Date | null;
  actual_return_date: Date | null;
  received_qty: number;
  rejected_qty: number;
  return_invoice_no: string;
  receipt_status: 'Pending' | 'Partial' | 'Completed';
  po_number: string;
  po_created: boolean;
  subcontracting_notes: string;
}

interface ValidationError {
  field: string;
  label: string;
  message: string;
}

// ─── Completion Modal ────────────────────────────────────────────────

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (completedQty: number, lossQty: number, isPartial: boolean) => void;
  totalQty: number;
  currentCompletedQty: number;
  currentLossQty: number;
  remainingQty: number;
}

const CompletionModal: React.FC<CompletionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  totalQty,
  currentCompletedQty,
  currentLossQty,
  remainingQty,
}) => {
  const [completedQty, setCompletedQty] = useState<string>("");
  const [lossQty, setLossQty] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setCompletedQty(currentCompletedQty > 0 ? String(currentCompletedQty) : "");
      setLossQty(currentLossQty > 0 ? String(currentLossQty) : "");
      setError("");
    }
  }, [currentCompletedQty, currentLossQty, isOpen]);

  const handleConfirm = () => {
    const completed = parseFloat(completedQty) || 0;
    const loss = parseFloat(lossQty) || 0;
    
    if (completed < 0 || loss < 0) {
      setError("Quantities cannot be negative");
      return;
    }

    if (completed === 0 && loss === 0) {
      setError("At least one quantity must be greater than 0");
      return;
    }

    const totalToProcess = completed + loss;
    if (totalToProcess > remainingQty) {
      setError(`Total (Completed ${completed} + Loss ${loss} = ${totalToProcess}) cannot exceed remaining quantity (${remainingQty})`);
      return;
    }
    
    // Check if it's a partial completion (not using all remaining quantity)
    const isPartial = totalToProcess < remainingQty;
    
    onConfirm(completed, loss, isPartial);
    onClose();
  };

  if (!isOpen) return null;

  const totalToProcess = (parseFloat(completedQty) || 0) + (parseFloat(lossQty) || 0);
  const isValid = totalToProcess > 0 && totalToProcess <= remainingQty;
  const isPartial = totalToProcess < remainingQty && totalToProcess > 0;

  return (
    <div className="jcf-modal-overlay" onClick={onClose}>
      <div className="jcf-validation-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
        <div className="jcf-modal-header jcf-modal-header-success">
          <h2 className="jcf-modal-title-plain">
            <FaCheck style={{ color: "var(--success-color)", marginRight: "8px" }} />
            {isPartial ? 'Partial Job Completion' : 'Complete Job Card'}
          </h2>
          <button className="jcf-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="jcf-modal-body">
          <div className="jcf-completion-summary">
            <div className="jcf-summary-row">
              <span className="jcf-summary-label">Total Quantity to Manufacture:</span>
              <span className="jcf-summary-value">{totalQty}</span>
            </div>
            <div className="jcf-summary-row">
              <span className="jcf-summary-label">Already Completed:</span>
              <span className="jcf-summary-value">{currentCompletedQty}</span>
            </div>
            <div className="jcf-summary-row">
              <span className="jcf-summary-label">Already Lost/Scrapped:</span>
              <span className="jcf-summary-value">{currentLossQty}</span>
            </div>
            <div className="jcf-summary-row" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "8px" }}>
              <span className="jcf-summary-label" style={{ fontWeight: "bold" }}>Remaining to Process:</span>
              <span className="jcf-summary-value" style={{ color: "var(--info-color)", fontWeight: "bold" }}>{remainingQty}</span>
            </div>
            
            <div className="jcf-summary-row" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", marginTop: "8px" }}>
              <span className="jcf-summary-label">Process Now - Completed:</span>
              <div className="input-group">
                <DigitInput
                  value={completedQty}
                  onChange={setCompletedQty}
                  placeholder="Enter completed qty"
                  maxLength={10}
                  allowDecimal={false}
                  max={remainingQty}
                />
              </div>
            </div>
            <div className="jcf-summary-row">
              <span className="jcf-summary-label">Process Now - Loss/Scrap:</span>
              <div className="input-group">
                <DigitInput
                  value={lossQty}
                  onChange={setLossQty}
                  placeholder="Enter loss qty"
                  maxLength={10}
                  allowDecimal={false}
                  max={remainingQty}
                />
              </div>
            </div>
            
            <div className="jcf-summary-row" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", marginTop: "8px" }}>
              <span className="jcf-summary-label">This Session Total:</span>
              <span className="jcf-summary-value" style={{ color: isValid ? "var(--success-color)" : "var(--danger-color)" }}>
                {totalToProcess} / {remainingQty} remaining
                {isValid && totalToProcess > 0 && ` (${isPartial ? 'Partial - ' + (remainingQty - totalToProcess) + ' remaining' : 'Complete'})`}
              </span>
            </div>
            
            {isPartial && isValid && totalToProcess > 0 && (
              <div className="jcf-info-banner" style={{ 
                background: "#e3f2fd", 
                padding: "10px", 
                borderRadius: "6px", 
                marginTop: "8px", 
                fontSize: "13px", 
                color: "#0d47a1",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <FaInfoCircle size={14} />
                <span>Partial completion: {remainingQty - totalToProcess} units will remain for future processing. Job will stay in "Work In Progress" status.</span>
              </div>
            )}
            
            {!isPartial && isValid && totalToProcess === remainingQty && totalToProcess > 0 && (
              <div className="jcf-info-banner" style={{ 
                background: "#e8f5e9", 
                padding: "10px", 
                borderRadius: "6px", 
                marginTop: "8px", 
                fontSize: "13px", 
                color: "#1b5e20",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <FaCheck size={14} />
                <span>All remaining units will be processed. Job will be marked as "Completed".</span>
              </div>
            )}
            
            {error && (
              <div className="jcf-error-text" style={{ marginTop: "8px", textAlign: "center", color: "var(--danger-color)" }}>
                {error}
              </div>
            )}
          </div>
        </div>
        <div className="jcf-modal-footer">
          <button className="jcf-btn-cancel" onClick={onClose}>Cancel</button>
          <button 
            className="jcf-btn-primary" 
            onClick={handleConfirm}
            disabled={!isValid}
          >
            <FaCheck size={12} /> {isPartial ? 'Process Partial' : 'Complete Job'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Success Modal ────────────────────────────────────────────────────

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  title?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  message,
  title = "Success",
}) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => onClose(), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="jcf-modal-overlay" onClick={onClose}>
      <div className="jcf-validation-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "450px" }}>
        <div className="jcf-modal-header jcf-modal-header-success">
          <h2 className="jcf-modal-title-plain">
            <FaCheck style={{ color: "#28a745", marginRight: "8px" }} />{title}
          </h2>
          <button className="jcf-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="jcf-modal-body" style={{ textAlign: "center", padding: "30px 20px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}><FaCheck style={{ color: "#28a745" }} /></div>
          <p style={{ fontSize: "16px", margin: 0, color: "#333" }}>{message}</p>
        </div>
        <div className="jcf-modal-footer" style={{ justifyContent: "center" }}>
          <button className="jcf-btn-primary" onClick={onClose}><FaCheck size={12} /> OK</button>
        </div>
      </div>
    </div>
  );
};

const defaultFormData = (): JobCardFormData => ({
  work_order: "", qty_to_manufacture: 0, posting_date: new Date(),
  pending_qty: 0, total_completed_qty: 0, process_loss_qty: 0,
  quality_inspection_template: "", expected_start_date: null, expected_end_date: null,
  for_quantity: 0, hour_rate: 0, actual_start_date: null, actual_end_date: null,
  remarks: "", company: "", status: "Open", assigned_employees: [],
  source_warehouse: "", wip_warehouse: "", target_warehouse: "",
  production_item: "", bom_no: "", finished_good: "", semi_fg_bom: "",
  operation: "", workstation_type: "", workstation: "", for_operation: "",
  item_name: "", project: "", operation_row_id: 1, operation_row_number: 1,
  operation_id: "", sequence_id: 1, serial_no: "",
  // Subcontracting defaults
  job_type: 'internal',
  subcontractor_name: '',
  subcontractor_contact: '',
  subcontractor_address: '',
  subcontract_reason: '',
  material_sent_items: [],
  delivery_challan_no: '',
  service_charge: 0,
  transport_cost: 0,
  other_charges: 0,
  expected_return_date: null,
  actual_return_date: null,
  received_qty: 0,
  rejected_qty: 0,
  return_invoice_no: '',
  receipt_status: 'Pending',
  po_number: '',
  po_created: false,
  subcontracting_notes: '',
});

const JobCardForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = !!id && id !== "new";

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState<JobCardFormData>(defaultFormData());
  const [recordId, setRecordId] = useState<number | string | null>(null);
  const [, setJobCardDocName] = useState<string>("");
  const [workOrders, setWorkOrders] = useState<WorkOrderOption[]>([]);
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(false);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());
  const [assigningEmployees, setAssigningEmployees] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isStartingJob, setIsStartingJob] = useState(false);
  const [woDetails, setWoDetails] = useState<any>(null);
  const [, setLoadingWoDetails] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedJobType, setSelectedJobType] = useState<'internal' | 'subcontracting'>('internal');

  // Subcontracting step tracking
  const [subcontractingStep, setSubcontractingStep] = useState<1 | 2 | 3 | 4>(1);

  // Calculate remaining quantity
  const getRemainingQty = () => {
    return Math.max(0, (formData.qty_to_manufacture || formData.for_quantity || 0) - 
      (formData.total_completed_qty || 0) - (formData.process_loss_qty || 0));
  };

  useEffect(() => {
    const fetchWorkOrders = async () => {
      setLoadingWorkOrders(true);
      try {
        const response = await api.get("/work-order");
        const raw = response.data;
        let list: any = raw?.data?.records ?? raw?.data ?? raw?.work_orders ?? raw?.results ?? raw;
        if (!Array.isArray(list)) list = [];
        setWorkOrders(list);
      } catch (err) { console.error("Error fetching work orders:", err); setWorkOrders([]); }
      finally { setLoadingWorkOrders(false); }
    };
    fetchWorkOrders();
  }, []);

  const getEmployeeCode = (emp: EmployeeOption): string => {
    if (emp.employee && emp.employee.trim()) return emp.employee.trim();
    if (emp.employee_number && emp.employee_number.trim()) return emp.employee_number.trim();
    return `EMP-${String(emp.id).padStart(5, "0")}`;
  };

  const getEmployeeName = (emp: EmployeeOption): string => {
    return emp.employee_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || getEmployeeCode(emp);
  };

  const getEmployeeDisplayId = (emp: EmployeeOption): string => {
    return emp.employee_number || emp.employee || getEmployeeCode(emp);
  };

  const fetchEmployees = async (): Promise<EmployeeOption[]> => {
    try {
      const response = await api.get("/employee");
      const raw = response.data;
      let list: EmployeeOption[] = [];
      if (raw?.data?.records && Array.isArray(raw.data.records)) list = raw.data.records;
      else if (raw?.data && Array.isArray(raw.data)) list = raw.data;
      else if (Array.isArray(raw)) list = raw;
      return list;
    } catch (err) { console.error("Error fetching employees:", err); return []; }
  };

  const fetchWorkOrderDetails = async (woId: string) => {
    if (!woId) return;
    setLoadingWoDetails(true);
    try {
      const response = await api.get(`/work-order/${woId}`);
      if (response.data.success === 1) {
        const woData = response.data.data;
        setWoDetails(woData);
        setFormData(prev => ({
          ...prev,
          company: woData.company || prev.company,
          qty_to_manufacture: woData.qty || prev.qty_to_manufacture,
          for_quantity: woData.qty || prev.for_quantity,
          hour_rate: woData.planned_operating_cost || prev.hour_rate,
          expected_start_date: woData.planned_start_date ? new Date(woData.planned_start_date) : prev.expected_start_date,
          expected_end_date: woData.planned_end_date ? new Date(woData.planned_end_date) : prev.expected_end_date,
          source_warehouse: woData.source_warehouse || "", wip_warehouse: woData.wip_warehouse || "",
          target_warehouse: woData.fg_warehouse || "", item_name: woData.item_name || prev.item_name,
          production_item: woData.production_item || prev.production_item,
        }));
      }
    } catch (err) { console.error("Error fetching Work Order details:", err); }
    finally { setLoadingWoDetails(false); }
  };

  useEffect(() => {
    if (isEditMode && id) {
      const state = location.state as { jobCard?: any };
      if (state?.jobCard) loadJobCardIntoForm(state.jobCard);
      else fetchJobCardById(id);
    }
  }, [id]);

  const fetchJobCardById = async (jobCardId: string) => {
    try {
      const response = await api.get(`/job-card/${jobCardId}`);
      if (response.data.success === 1) await loadJobCardIntoForm(response.data.data);
      else setApiError("Failed to load job card details");
    } catch (err: any) { setApiError(err.response?.data?.message || "Failed to load job card"); }
  };

  const loadJobCardIntoForm = async (jc: any) => {
    setRecordId(jc.id ?? null);
    setJobCardDocName(jc.name || jc.job_card_id || "");
    setFormData((prev) => ({
      ...prev,
      work_order: jc.work_order || "", qty_to_manufacture: jc.requested_qty ?? jc.for_quantity ?? 0,
      company: jc.company || "", posting_date: jc.posting_date ? new Date(jc.posting_date) : new Date(),
      pending_qty: jc.pending_qty || 0, total_completed_qty: jc.total_completed_qty || 0,
      process_loss_qty: jc.process_loss_qty || 0, quality_inspection_template: jc.quality_inspection_template || "",
      expected_start_date: jc.expected_start_date ? new Date(jc.expected_start_date) : null,
      expected_end_date: jc.expected_end_date ? new Date(jc.expected_end_date) : null,
      for_quantity: jc.for_quantity || 0, hour_rate: jc.hour_rate || 0,
      actual_start_date: jc.actual_start_date ? new Date(jc.actual_start_date) : null,
      actual_end_date: jc.actual_end_date ? new Date(jc.actual_end_date) : null,
      remarks: jc.remarks || "", status: jc.status || "Open",
      source_warehouse: jc.source_warehouse || "", wip_warehouse: jc.wip_warehouse || "",
      target_warehouse: jc.target_warehouse || "", production_item: jc.production_item || "",
      bom_no: jc.bom_no || "", finished_good: jc.finished_good || "", semi_fg_bom: jc.semi_fg_bom || "",
      operation: jc.operation || "", workstation_type: jc.workstation_type || "",
      workstation: jc.workstation || "", for_operation: jc.for_operation || "",
      item_name: jc.item_name || "", project: jc.project || "",
      operation_row_id: jc.operation_row_id || 1,
      operation_row_number: parseInt(jc.operation_row_number) || 1,
      operation_id: jc.operation_id || "", sequence_id: jc.sequence_id || 1,
      serial_no: jc.serial_no || "", assigned_employees: [],
      // job_type: jc.job_type || 'internal',
    }));

    if (jc.assigned_emp_id) {
      try {
        const empList = await fetchEmployees();
        setEmployees(empList);
        const assignedEmp = empList.find((emp) => emp.id === jc.assigned_emp_id);
        if (assignedEmp) {
          setFormData((prev) => ({ ...prev, assigned_employees: [getEmployeeCode(assignedEmp)] }));
        }
      } catch (err) { console.error("Error loading assigned employee:", err); }
    }

    if (jc.work_order) fetchWorkOrderDetails(jc.work_order);
    if (jc.actual_start_date && !jc.actual_end_date) {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - new Date(jc.actual_start_date).getTime()) / 1000)));
      setTimerRunning(jc.status === "Work In Progress");
    }
  };

  const handleJobTypeChange = (type: 'internal' | 'subcontracting') => {
    setSelectedJobType(type);
    setFormData(prev => ({ ...prev, job_type: type }));
  };

  const getAllValidationErrors = (): ValidationError[] => {
    const allErrors: ValidationError[] = [];
    if (!formData.work_order.trim()) allErrors.push({ field: "work_order", label: "Work Order", message: "Work Order is required" });
    if (formData.expected_start_date && formData.expected_end_date && formData.expected_end_date < formData.expected_start_date)
      allErrors.push({ field: "expected_end_date", label: "Expected End Date", message: "End date cannot be before start date" });
    return allErrors;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "number" ? (value === "" ? 0 : parseFloat(value) || 0) : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleNumberChange = (field: keyof JobCardFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value === '' ? 0 : parseFloat(value) || 0 }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleDateChange = (field: keyof JobCardFormData, date: Date | null | [Date | null, Date | null]) => {
    setFormData((prev) => ({ ...prev, [field]: Array.isArray(date) ? date[0] : date }));
  };

  const handleWorkOrderSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "__create_new__") { navigate("/work-order/new"); return; }
    const wo = workOrders.find((w) => w.name === value);
    setFormData((prev) => ({ ...prev, work_order: value, company: wo?.company ?? prev.company, qty_to_manufacture: wo?.qty ?? prev.qty_to_manufacture, item_name: wo?.item_name || prev.item_name }));
    if (errors.work_order) setErrors((prev) => ({ ...prev, work_order: "" }));
    if (value) fetchWorkOrderDetails(value);
  };

  const openEmployeeModal = async () => {
    setSelectedEmployeeIds(new Set(formData.assigned_employees));
    setShowEmployeeModal(true);
    if (employees.length === 0) {
      setLoadingEmployees(true);
      const list = await fetchEmployees();
      setEmployees(list);
      setLoadingEmployees(false);
    }
  };

  const toggleEmployeeSelect = (empId: string) => {
    setSelectedEmployeeIds((prev) => { const next = new Set(prev); next.has(empId) ? next.delete(empId) : next.add(empId); return next; });
  };

  const confirmEmployeeAssignment = async () => {
    if (!recordId) {
      const selected = employees.filter((emp) => selectedEmployeeIds.has(String(emp.id)));
      setFormData((prev) => ({ ...prev, assigned_employees: selected.map((emp) => getEmployeeCode(emp)) }));
      setShowEmployeeModal(false);
      return;
    }
    setAssigningEmployees(true);
    setApiError(null);
    try {
      const selectedEmpIds = Array.from(selectedEmployeeIds);
      if (selectedEmpIds.length === 0) { setFormData((prev) => ({ ...prev, assigned_employees: [] })); setShowEmployeeModal(false); return; }
      for (const empId of selectedEmpIds) {
        const response = await api.put("/job-card/assign-employee", { id: Number(recordId), assigned_emp_id: Number(empId) });
        if (response.data.success !== 1) throw new Error(response.data?.message || "Failed to assign employee");
      }
      const selected = employees.filter((emp) => selectedEmployeeIds.has(String(emp.id)));
      setFormData((prev) => ({ ...prev, assigned_employees: selected.map((emp) => getEmployeeCode(emp)) }));
      setShowEmployeeModal(false);
      setSuccessMessage("Employee(s) assigned successfully!");
      setShowSuccessModal(true);
    } catch (err: any) { setApiError(err.response?.data?.message || "Failed to assign employee"); }
    finally { setAssigningEmployees(false); }
  };

  const removeEmployee = (employeeCode: string) => {
    setFormData((prev) => ({ ...prev, assigned_employees: prev.assigned_employees.filter(code => code !== employeeCode) }));
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (timerRunning) interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => { if (interval) clearInterval(interval); };
  }, [timerRunning]);

  const jobStarted = !!formData.actual_start_date;
  const jobCompleted = formData.status === "Completed";
  const hasAssignedEmployees = formData.assigned_employees.length > 0;
  const remainingQty = getRemainingQty();

  const handleStartJob = async () => {
    if (!hasAssignedEmployees) { openEmployeeModal(); return; }
    setIsStartingJob(true); setApiError(null);
    try {
      const payload = buildApiPayload();
      payload.status = "Work In Progress"; payload.actual_start_date = formatDateTime(new Date());
      let response;
      if (isEditMode && recordId) { payload.id = Number(recordId); response = await api.put("/job-card", payload); }
      else {
        response = await api.post("/job-card", payload);
        if (response.data.success === 1) {
          const newJobCard = response.data.data;
          setRecordId(newJobCard.id); setJobCardDocName(newJobCard.name);
          navigate(`/job-cards/${newJobCard.id}`, { replace: true, state: { jobCard: newJobCard } });
        }
      }
      if (response.data.success !== 1) throw new Error(response.data?.message || "Failed to start job");
      setFormData((prev) => ({ ...prev, actual_start_date: new Date(), status: "Work In Progress" }));
      setTimerRunning(true);
      if (isEditMode && recordId) fetchJobCardById(String(recordId));
    } catch (err: any) { setApiError(err.response?.data?.message || "Failed to start job"); }
    finally { setIsStartingJob(false); }
  };

  const handlePauseJob = async () => {
    setIsStartingJob(true); setApiError(null);
    try {
      const payload = buildApiPayload(); payload.status = "On Hold"; payload.is_paused = 1;
      if (isEditMode && recordId) { payload.id = Number(recordId); const response = await api.put("/job-card", payload); if (response.data.success !== 1) throw new Error(response.data?.message || "Failed to pause job"); }
      setTimerRunning(false); setFormData((prev) => ({ ...prev, status: "On Hold" }));
      if (isEditMode && recordId) fetchJobCardById(String(recordId));
    } catch (err: any) { setApiError(err.response?.data?.message || "Failed to pause job"); }
    finally { setIsStartingJob(false); }
  };

  const handleCompleteJobClick = () => setShowCompletionModal(true);

  const handleCompletionConfirm = async (completedQty: number, lossQty: number, isPartial: boolean) => {
    setIsStartingJob(true);
    setApiError(null);
    try {
      const payload = buildApiPayload();
      
      // Calculate new totals
      const newTotalCompleted = (formData.total_completed_qty || 0) + completedQty;
      const newTotalLoss = (formData.process_loss_qty || 0) + lossQty;
      const newPendingQty = Math.max(0, (formData.qty_to_manufacture || formData.for_quantity || 0) - newTotalCompleted - newTotalLoss);
      
      // If partial, keep status as "Work In Progress" or "On Hold"
      // If complete, set to "Completed"
      if (isPartial && newPendingQty > 0) {
        payload.status = "Work In Progress"; // Keep it in progress for more work
        // Don't set actual_end_date for partial completion
        payload.actual_end_date = null;
      } else {
        payload.status = "Completed";
        payload.actual_end_date = formatDateTime(new Date());
      }
      
      payload.total_completed_qty = newTotalCompleted;
      payload.process_loss_qty = newTotalLoss;
      payload.pending_qty = newPendingQty;
      
      if (isEditMode && recordId) {
        payload.id = Number(recordId);
        const response = await api.put("/job-card", payload);
        if (response.data.success !== 1) {
          throw new Error(response.data?.message || "Failed to update job card");
        }
      }
      
      setTimerRunning(false);
      setFormData((prev) => ({
        ...prev,
        total_completed_qty: newTotalCompleted,
        process_loss_qty: newTotalLoss,
        pending_qty: newPendingQty,
        status: isPartial ? "Work In Progress" : "Completed",
        ...(isPartial ? {} : { actual_end_date: new Date() })
      }));
      
      setShowCompletionModal(false);
      
      if (isPartial) {
        setSuccessMessage(`Processed ${completedQty} units (${lossQty} loss). ${newPendingQty} units remaining.`);
      } else {
        setSuccessMessage("Job Card completed successfully!");
      }
      setShowSuccessModal(true);
      
      if (isEditMode && recordId) {
        fetchJobCardById(String(recordId));
      }
    } catch (err: any) {
      setApiError(err.response?.data?.message || "Failed to process job");
    } finally {
      setIsStartingJob(false);
    }
  };

  const handleUpdate = async () => {
    const allErrors = getAllValidationErrors();
    if (allErrors.length > 0) { setValidationErrors(allErrors); setShowValidationSummary(true); return; }
    setSaving(true); setApiError(null);
    try {
      const payload = buildApiPayload();
      if (!isEditMode || !recordId) throw new Error("No job card to update");
      payload.id = Number(recordId);
      const response = await api.put("/job-card", payload);
      if (response.data.success !== 1) throw new Error(response.data?.message || "Failed to update job card");
      setSuccessMessage("Job Card updated successfully!"); setShowSuccessModal(true);
      fetchJobCardById(String(recordId));
    } catch (err: any) { setApiError(err.response?.data?.message || "Failed to update job card"); }
    finally { setSaving(false); }
  };

  const buildApiPayload = () => {
    const timeRequired = formData.expected_start_date && formData.expected_end_date
      ? Math.max(0, Math.round((formData.expected_end_date.getTime() - formData.expected_start_date.getTime()) / 60000)) : 0;
    const payload: any = {
      work_order: formData.work_order,
      production_item: formData.production_item || "",
      for_quantity: formData.for_quantity || formData.qty_to_manufacture, bom_no: formData.bom_no || "",
      company: formData.company, naming_series: "PO-JOB-.#####", posting_date: formatDateOnly(formData.posting_date),
      finished_good: formData.finished_good || "", 
      semi_fg_bom: formData.semi_fg_bom || "",
      pending_qty: formData.pending_qty,
      process_loss_qty: formData.process_loss_qty,
      total_completed_qty: formData.total_completed_qty, transferred_qty: 0, manufactured_qty: 0,
      operation: formData.operation || "", source_warehouse: formData.source_warehouse || "",
      wip_warehouse: formData.wip_warehouse || "", skip_material_transfer: 0, backflush_from_wip_warehouse: 0,
      workstation_type: formData.workstation_type || "", workstation: formData.workstation || "",
      target_warehouse: formData.target_warehouse || "", quality_inspection_template: formData.quality_inspection_template,
      quality_inspection: "", expected_start_date: formatDateTime(formData.expected_start_date),
      time_required: timeRequired, expected_end_date: formatDateTime(formData.expected_end_date),
      actual_start_date: formatDateTime(formData.actual_start_date), total_time_in_mins: 0,
      actual_end_date: formatDateTime(formData.actual_end_date), for_job_card: "", is_corrective_job_card: 0,
      hour_rate: formData.hour_rate, for_operation: formData.for_operation || "",
      item_name: formData.item_name || "", requested_qty: formData.qty_to_manufacture,
      is_paused: formData.status === "On Hold" ? 1 : 0, 
      track_semi_finished_goods: 0, project: formData.project || "", remarks: formData.remarks,
      status: formData.status, operation_row_id: formData.operation_row_id || 1,
      operation_row_number: formData.operation_row_number || 1, operation_id: formData.operation_id || "",
      sequence_id: formData.sequence_id || 1, serial_no: formData.serial_no || "",
      serial_and_batch_bundle: "", barcode: "", batch_no: "", modified_by: "Administrator",
    };
    if (isEditMode && recordId) payload.id = Number(recordId);
    return payload;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isEditMode) return;
    const allErrors = getAllValidationErrors();
    if (allErrors.length > 0) { setValidationErrors(allErrors); setShowValidationSummary(true); return; }
    setSaving(true); setApiError(null);
    try {
      const payload = buildApiPayload();
      const response = await api.post("/job-card", payload);
      if (response.data.success !== 1) throw new Error(response.data?.message || "Failed to save job card");
      navigate("/job-card");
    } catch (err: any) { setApiError(err.response?.data?.message || err.message || "Failed to save job card"); }
    finally { setSaving(false); }
  };

  const allValidationErrors = getAllValidationErrors();
  const hasAnyErrors = allValidationErrors.length > 0;

  const getSelectedEmployeeDetails = () => {
    return formData.assigned_employees.map(code => {
      const emp = employees.find(e => getEmployeeCode(e) === code || e.employee === code || e.employee_number === code);
      return emp ? { code, name: getEmployeeName(emp), id: getEmployeeDisplayId(emp) } : { code, name: code, id: code };
    });
  };

  // ─── Subcontracting Item Handlers ──────────────────────────────────

  const addSubcontractingItem = () => {
    const newItem: SubcontractingItem = {
      id: String(Date.now()),
      item_code: '',
      item_name: '',
      quantity: 1,
      uom: 'NOS',
      rate: 0,
      amount: 0,
      warehouse: ''
    };
    setFormData(prev => ({
      ...prev,
      material_sent_items: [...prev.material_sent_items, newItem]
    }));
  };

  const removeSubcontractingItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      material_sent_items: prev.material_sent_items.filter(item => item.id !== id)
    }));
  };

  const updateSubcontractingItem = (id: string, field: keyof SubcontractingItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      material_sent_items: prev.material_sent_items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'rate') {
            updated.amount = (updated.quantity || 0) * (updated.rate || 0);
          }
          return updated;
        }
        return item;
      })
    }));
  };

  const getMaterialTotal = () => {
    return formData.material_sent_items.reduce((sum, item) => sum + item.amount, 0);
  };

  const getGrandTotal = () => {
    return getMaterialTotal() + formData.service_charge + formData.transport_cost + formData.other_charges;
  };

  // ─── Render Subcontracting Section ──────────────────────────────────

  const renderSubcontractingSection = () => {
    if (selectedJobType !== 'subcontracting') return null;

    return (
      <div className="jcf-subcontracting-section">
        {/* Step Progress */}
        <div className="jcf-step-progress">
          <div className={`jcf-step-item ${subcontractingStep >= 1 ? 'active' : ''}`} onClick={() => setSubcontractingStep(1)}>
            <div className="jcf-step-number">1</div>
            <div className="jcf-step-label">Material Sent</div>
            {subcontractingStep > 1 && <FaCheck className="jcf-step-check" />}
          </div>
          <div className="jcf-step-line"></div>
          <div className={`jcf-step-item ${subcontractingStep >= 2 ? 'active' : ''}`} onClick={() => setSubcontractingStep(2)}>
            <div className="jcf-step-number">2</div>
            <div className="jcf-step-label">In Progress</div>
            {subcontractingStep > 2 && <FaCheck className="jcf-step-check" />}
          </div>
          <div className="jcf-step-line"></div>
          <div className={`jcf-step-item ${subcontractingStep >= 3 ? 'active' : ''}`} onClick={() => setSubcontractingStep(3)}>
            <div className="jcf-step-number">3</div>
            <div className="jcf-step-label">Received Back</div>
            {subcontractingStep > 3 && <FaCheck className="jcf-step-check" />}
          </div>
          <div className="jcf-step-line"></div>
          <div className={`jcf-step-item ${subcontractingStep >= 4 ? 'active' : ''}`} onClick={() => setSubcontractingStep(4)}>
            <div className="jcf-step-number">4</div>
            <div className="jcf-step-label">Completed</div>
          </div>
        </div>

        {/* Why Subcontracting? */}
        <div className="jcf-card jcf-reason-card">
          <div className="jcf-card-header">
            <FaExclamationCircle size={14} /> Why Subcontracting?
          </div>
          <div className="jcf-reason-grid">
            <button type="button" className={`jcf-reason-btn ${formData.subcontract_reason === 'machine_failure' ? 'selected' : ''}`} onClick={() => setFormData(prev => ({ ...prev, subcontract_reason: 'machine_failure' }))}>
              <FaTools size={20} /> Machine Failure
            </button>
            <button type="button" className={`jcf-reason-btn ${formData.subcontract_reason === 'no_machine' ? 'selected' : ''}`} onClick={() => setFormData(prev => ({ ...prev, subcontract_reason: 'no_machine' }))}>
              <FaTimesCircle size={20} /> No Machine Available
            </button>
            <button type="button" className={`jcf-reason-btn ${formData.subcontract_reason === 'capacity_overflow' ? 'selected' : ''}`} onClick={() => setFormData(prev => ({ ...prev, subcontract_reason: 'capacity_overflow' }))}>
              <FaBoxes size={20} /> Capacity Overflow
            </button>
            <button type="button" className={`jcf-reason-btn ${formData.subcontract_reason === 'specialized_process' ? 'selected' : ''}`} onClick={() => setFormData(prev => ({ ...prev, subcontract_reason: 'specialized_process' }))}>
              <FaIndustry size={20} /> Specialized Process
            </button>
            <button type="button" className={`jcf-reason-btn ${formData.subcontract_reason === 'other' ? 'selected' : ''}`} onClick={() => setFormData(prev => ({ ...prev, subcontract_reason: 'other' }))}>
              <FaFileAlt size={20} /> Other Reason
            </button>
          </div>
        </div>

        {/* Subcontractor / Vendor */}
        <div className="jcf-card jcf-vendor-card">
          <div className="jcf-card-header">
            <FaBuilding size={14} /> Subcontractor / Vendor
          </div>
          <div className="jcf-grid-3">
            <div>
              <label className="jcf-label">Vendor Name *</label>
              <input
                type="text"
                name="subcontractor_name"
                value={formData.subcontractor_name}
                onChange={handleInputChange}
                className="jcf-input"
                placeholder="e.g. Precision Works Pvt Ltd"
              />
            </div>
            <div>
              <label className="jcf-label">Contact</label>
              <input
                type="text"
                name="subcontractor_contact"
                value={formData.subcontractor_contact}
                onChange={handleInputChange}
                className="jcf-input"
                placeholder="+91 98XXXXXXXX"
              />
            </div>
            <div>
              <label className="jcf-label">Delivery Challan No.</label>
              <input
                type="text"
                name="delivery_challan_no"
                value={formData.delivery_challan_no}
                onChange={handleInputChange}
                className="jcf-input"
                placeholder="DC-2026-XXXX"
              />
            </div>
          </div>
          <div className="jcf-grid-1" style={{ marginTop: '12px' }}>
            <div>
              <label className="jcf-label">Vendor Address</label>
              <textarea
                name="subcontractor_address"
                value={formData.subcontractor_address}
                onChange={handleInputChange}
                className="jcf-input jcf-textarea"
                placeholder="Full address"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Materials Sent to Vendor */}
        <div className="jcf-card jcf-materials-card">
          <div className="jcf-card-header">
            <FaWarehouse size={14} /> Materials Sent to Vendor
          </div>
          <div className="jcf-table-wrap">
            <button type="button" className="jcf-add-item-btn" onClick={addSubcontractingItem}>
              <FaPlus size={12} /> Add Item
            </button>
            <table className="jcf-subcontracting-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Qty</th>
                  <th>UOM</th>
                  <th>Rate (₹)</th>
                  <th>Amount (₹)</th>
                  <th>From Warehouse</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {formData.material_sent_items.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                      No items added. Click "Add Item" to add materials.
                    </td>
                  </tr>
                ) : (
                  formData.material_sent_items.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>
                        <input
                          type="text"
                          value={item.item_code}
                          onChange={(e) => updateSubcontractingItem(item.id, 'item_code', e.target.value)}
                          className="jcf-cell-input"
                          placeholder="Item code"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.item_name}
                          onChange={(e) => updateSubcontractingItem(item.id, 'item_name', e.target.value)}
                          className="jcf-cell-input"
                          placeholder="Item name"
                        />
                      </td>
                      <td>
                        <DigitInput
                          value={String(item.quantity)}
                          onChange={(val) => updateSubcontractingItem(item.id, 'quantity', parseInt(val) || 0)}
                          placeholder="0"
                          maxLength={10}
                          className="jcf-cell-digit"
                        />
                      </td>
                      <td>
                        <select
                          value={item.uom}
                          onChange={(e) => updateSubcontractingItem(item.id, 'uom', e.target.value)}
                          className="jcf-cell-select"
                        >
                          <option value="NOS">NOS</option>
                          <option value="KG">KG</option>
                          <option value="LTR">LTR</option>
                          <option value="MTR">MTR</option>
                          <option value="BOX">BOX</option>
                          <option value="SET">SET</option>
                          <option value="DOZ">DOZ</option>
                        </select>
                      </td>
                      <td>
                        <DigitInput
                          value={String(item.rate)}
                          onChange={(val) => updateSubcontractingItem(item.id, 'rate', parseFloat(val) || 0)}
                          placeholder="0.00"
                          maxLength={15}
                          allowDecimal={true}
                          className="jcf-cell-digit"
                        />
                      </td>
                      <td className="jcf-cell-amount">₹{item.amount.toFixed(2)}</td>
                      <td>
                        <input
                          type="text"
                          value={item.warehouse || ''}
                          onChange={(e) => updateSubcontractingItem(item.id, 'warehouse', e.target.value)}
                          className="jcf-cell-input"
                          placeholder="Warehouse"
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="jcf-remove-row-btn"
                          onClick={() => removeSubcontractingItem(item.id)}
                        >
                          <FaTrash size={12} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6} style={{ textAlign: 'right', fontWeight: 'bold' }}>Material Total</td>
                  <td style={{ fontWeight: 'bold' }}>₹{getMaterialTotal().toFixed(2)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Service Charges */}
        <div className="jcf-card jcf-charges-card">
          <div className="jcf-card-header">
            <FaMoneyBillWave size={14} /> Service Charges
          </div>
          <div className="jcf-grid-4">
            <div>
              <label className="jcf-label">Service Charge (₹)</label>
              <DigitInput
                value={String(formData.service_charge)}
                onChange={(val) => handleNumberChange('service_charge', val)}
                placeholder="0.00"
                maxLength={15}
                allowDecimal={true}
                className="jcf-charge-input"
              />
            </div>
            <div>
              <label className="jcf-label">Transport Cost (₹)</label>
              <DigitInput
                value={String(formData.transport_cost)}
                onChange={(val) => handleNumberChange('transport_cost', val)}
                placeholder="0.00"
                maxLength={15}
                allowDecimal={true}
                className="jcf-charge-input"
              />
            </div>
            <div>
              <label className="jcf-label">Other Charges (₹)</label>
              <DigitInput
                value={String(formData.other_charges)}
                onChange={(val) => handleNumberChange('other_charges', val)}
                placeholder="0.00"
                maxLength={15}
                allowDecimal={true}
                className="jcf-charge-input"
              />
            </div>
            <div className="jcf-grand-total-box">
              <div className="jcf-grand-total-label">Grand Total</div>
              <div className="jcf-grand-total-value">₹{getGrandTotal().toFixed(2)}</div>
            </div>
          </div>
          <div className="jcf-charge-breakdown">
            <span>Material Value: ₹{getMaterialTotal().toFixed(2)}</span>
            <span>+</span>
            <span>Service + Transport + Other: ₹{(formData.service_charge + formData.transport_cost + formData.other_charges).toFixed(2)}</span>
            <span>=</span>
            <span className="jcf-breakdown-total">Grand Total: ₹{getGrandTotal().toFixed(2)}</span>
          </div>
        </div>

        {/* Schedule */}
        <div className="jcf-card jcf-schedule-card">
          <div className="jcf-card-header">
            <FaCalendarAlt size={14} /> Schedule
          </div>
          <div className="jcf-grid-3">
            <div>
              <label className="jcf-label">Expected Return Date</label>
              <DatePicker
                selected={formData.expected_return_date}
                onChange={(date: Date | null) => handleDateChange("expected_return_date", date)}
                dateFormat="dd-MM-yyyy"
                className="jcf-date-input"
                placeholderText="Select date"
              />
            </div>
            <div>
              <label className="jcf-label">Actual Return Date</label>
              <DatePicker
                selected={formData.actual_return_date}
                onChange={(date: Date | null) => handleDateChange("actual_return_date", date)}
                dateFormat="dd-MM-yyyy"
                className="jcf-date-input"
                placeholderText="Not yet returned"
              />
            </div>
            <div className="jcf-status-display">
              <span className="jcf-status-label">Current Status</span>
              <span className={`jcf-status-badge jcf-status-${formData.status.replace(/\s/g, '-').toLowerCase()}`}>
                {formData.status}
              </span>
            </div>
          </div>
        </div>

        {/* Purchase Order */}
        <div className="jcf-card jcf-po-card">
          <div className="jcf-card-header">
            <FaShoppingCart size={14} /> Purchase Order
            <span className="jcf-po-status">
              {formData.po_created ? 
                <span className="jcf-status-badge jcf-status-completed"><FaCheck size={10} /> Created</span> :
                <span className="jcf-status-badge jcf-status-pending">Not yet created</span>
              }
            </span>
          </div>
          <div className="jcf-grid-2">
            <div>
              <label className="jcf-label">PO Number (if exists)</label>
              <input
                type="text"
                name="po_number"
                value={formData.po_number}
                onChange={handleInputChange}
                className="jcf-input"
                placeholder="PO-2026-XXXX"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="button" className="jcf-btn-primary" onClick={() => setFormData(prev => ({ ...prev, po_created: !prev.po_created }))}>
                <FaPlus size={12} /> {formData.po_created ? 'Update Purchase Order' : 'Create Purchase Order'}
              </button>
            </div>
          </div>
        </div>

        {/* Material Return / Receipt */}
        <div className="jcf-card jcf-receipt-card">
          <div className="jcf-card-header">
            <FaTruck size={14} /> Material Return / Receipt
          </div>
          <div className="jcf-grid-4">
            <div>
              <label className="jcf-label">Received Qty</label>
              <DigitInput
                value={String(formData.received_qty)}
                onChange={(val) => handleNumberChange('received_qty', val)}
                placeholder="0"
                maxLength={10}
              />
            </div>
            <div>
              <label className="jcf-label">Rejected Qty (failed QA)</label>
              <DigitInput
                value={String(formData.rejected_qty)}
                onChange={(val) => handleNumberChange('rejected_qty', val)}
                placeholder="0"
                maxLength={10}
              />
            </div>
            <div>
              <label className="jcf-label">Return Invoice No.</label>
              <input
                type="text"
                name="return_invoice_no"
                value={formData.return_invoice_no}
                onChange={handleInputChange}
                className="jcf-input"
                placeholder="INV-2026-XXXX"
              />
            </div>
            <div>
              <label className="jcf-label">Receipt Status</label>
              <select
                name="receipt_status"
                value={formData.receipt_status}
                onChange={handleInputChange}
                className="jcf-input"
              >
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <button type="button" className="jcf-btn-success">
              <FaCheck size={12} /> Record Receipt (GRN)
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="jcf-card jcf-notes-card">
          <div className="jcf-card-header">
            <FaClipboardList size={14} /> Notes
          </div>
          <div>
            <textarea
              name="subcontracting_notes"
              value={formData.subcontracting_notes}
              onChange={handleInputChange}
              className="jcf-input jcf-textarea"
              placeholder="Any notes about this subcontracting job…"
              rows={3}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="jcf-page">
      <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} message={successMessage} />
      <CompletionModal 
        isOpen={showCompletionModal} 
        onClose={() => setShowCompletionModal(false)} 
        onConfirm={handleCompletionConfirm} 
        totalQty={formData.qty_to_manufacture || formData.for_quantity || 0} 
        currentCompletedQty={formData.total_completed_qty || 0} 
        currentLossQty={formData.process_loss_qty || 0}
        remainingQty={remainingQty}
      />

      {showValidationSummary && validationErrors.length > 0 && (
        <div className="jcf-modal-overlay" onClick={() => setShowValidationSummary(false)}>
          <div className="jcf-validation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="jcf-modal-header jcf-modal-header-warning"><h2 className="jcf-modal-title-warning"><FaExclamationTriangle /> Missing Required Fields</h2><button className="jcf-modal-close" onClick={() => setShowValidationSummary(false)}>×</button></div>
            <div className="jcf-modal-body">
              <p className="jcf-modal-intro">Please fill in the following required fields before submitting:</p>
              <div className="jcf-error-list">{validationErrors.map((error, idx) => (<div key={idx} className="jcf-validation-error-item"><div className="jcf-error-header"><FaTimesCircle className="jcf-error-icon" /><strong className="jcf-error-label">{error.label}</strong></div><div className="jcf-error-message">{error.message}</div></div>))}</div>
              <div className="jcf-hint-banner"><FaInfoCircle className="jcf-hint-icon" />Please fix the errors above before submitting</div>
            </div>
            <div className="jcf-modal-footer"><button className="jcf-btn-cancel" onClick={() => setShowValidationSummary(false)}>Close</button></div>
          </div>
        </div>
      )}

      {showEmployeeModal && (
        <div className="jcf-modal-overlay" onClick={() => !assigningEmployees && setShowEmployeeModal(false)}>
          <div className="jcf-validation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="jcf-modal-header"><h2 className="jcf-modal-title-plain">Assign Job to Employee</h2><button className="jcf-modal-close" onClick={() => setShowEmployeeModal(false)} disabled={assigningEmployees}><FaTimes size={16} /></button></div>
            <div className="jcf-modal-body">
              {loadingEmployees ? <p className="jcf-modal-intro">Loading employees...</p> : employees.length === 0 ? <p className="jcf-modal-intro">No employees found.</p> : (
                <div className="jcf-employee-list">
                  {employees.map((emp) => (
                    <label key={emp.id} className="jcf-employee-item">
                      <input type="checkbox" checked={selectedEmployeeIds.has(String(emp.id))} onChange={() => toggleEmployeeSelect(String(emp.id))} className="jcf-checkbox" />
                      <div><div className="jcf-employee-id">{getEmployeeDisplayId(emp)}</div><div className="jcf-employee-name">{getEmployeeName(emp)}</div>{emp.designation && <div className="jcf-employee-designation">{emp.designation}</div>}</div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="jcf-modal-footer">
              <button className="jcf-btn-cancel" onClick={() => setShowEmployeeModal(false)} disabled={assigningEmployees}>Cancel</button>
              <button className="jcf-btn-primary" onClick={confirmEmployeeAssignment} disabled={assigningEmployees || loadingEmployees}>{assigningEmployees ? <FaSpinner className="jcf-spinning" /> : null} Assign</button>
            </div>
          </div>
        </div>
      )}

      <div className="jcf-header-wrap">
        <div className="jcf-header-row">
          <button type="button" onClick={() => navigate("/job-card")} className="jcf-back-btn"><FaArrowLeft size={12} /> Back</button>
          <h1 className="jcf-title">{isEditMode ? "Edit Job Card" : "New Job Card"}</h1>
          {apiError && <div className="jcf-error-pill"><FaExclamationTriangle size={11} />{apiError}</div>}
          {hasAnyErrors && <div className="jcf-error-pill"><FaExclamationTriangle size={11} />{allValidationErrors.length} missing field(s)</div>}
        </div>
      </div>

      <div className="jcf-container">
        <form onSubmit={handleSubmit}>
          {/* Job Type Selector - Compact */}
          <div className="jcf-job-type-selector">
            <button
              type="button"
              className={`jcf-job-type-btn ${selectedJobType === 'internal' ? 'active' : ''}`}
              onClick={() => handleJobTypeChange('internal')}
            >
              <FaIndustry size={14} />
              <span>Internal</span>
            </button>
            <button
              type="button"
              className={`jcf-job-type-btn ${selectedJobType === 'subcontracting' ? 'active' : ''}`}
              onClick={() => handleJobTypeChange('subcontracting')}
            >
              <FaExchangeAlt size={14} />
              <span>Subcontracting</span>
            </button>
          </div>

          <div className="jcf-form-layout">
            <div className="jcf-main-col">
              <div className="jcf-card">
                <div className="jcf-grid-3">
                  <div><label className="jcf-label">Work Order *</label>
                    {isEditMode ? (
                      <div className="jcf-input" style={{ display: "flex", alignItems: "center", minHeight: "42px", background: "#f8f9fa", cursor: "not-allowed" }}>{formData.work_order}{woDetails?.item_name && ` — ${woDetails.item_name}`}{` (Qty: ${woDetails?.qty ?? formData.qty_to_manufacture ?? 0})`}</div>
                    ) : (
                      <>
                        <select name="work_order" value={formData.work_order || ""} onChange={handleWorkOrderSelect} className={`jcf-input ${errors.work_order ? "jcf-input-error" : ""}`}>
                          <option value="">{loadingWorkOrders ? "Loading..." : "Select Work Order"}</option>
                          {workOrders.map((wo) => (<option key={wo.name} value={wo.name}>{wo.name} — {wo.item_name || wo.production_item || ""}{wo.qty ? ` (Qty: ${wo.qty})` : ""}</option>))}
                          <option value="__create_new__">+ Create New Work Order</option>
                        </select>
                        {errors.work_order && <span className="jcf-error-text">{errors.work_order}</span>}
                      </>
                    )}
                  </div>
                  <div><label className="jcf-label">Qty To Manufacture</label><DigitInput value={String(formData.qty_to_manufacture)} onChange={(val) => handleNumberChange('qty_to_manufacture', val)} placeholder="0" maxLength={10} disabled={isEditMode} /></div>
                  <div><label className="jcf-label">Posting Date</label><DatePicker selected={formData.posting_date} onChange={(date: Date | null) => handleDateChange("posting_date", date)} dateFormat="dd-MM-yyyy" className="jcf-date-input" /></div>
                </div>
                <div className="jcf-grid-3 jcf-mb-20">
                  <div><label className="jcf-label">Pending Qty</label>
                    <div className="jcf-input" style={{ display: "flex", alignItems: "center", minHeight: "42px", background: "#f8f9fa", cursor: "not-allowed" }}>
                      {remainingQty}
                    </div>
                  </div>
                  <div><label className="jcf-label">Total Completed Qty</label>
                    <div className="jcf-input" style={{ display: "flex", alignItems: "center", minHeight: "42px", background: "#f8f9fa", cursor: "not-allowed" }}>
                      {formData.total_completed_qty || 0}
                    </div>
                  </div>
                  <div><label className="jcf-label">Loss</label>
                    <div className="jcf-input" style={{ display: "flex", alignItems: "center", minHeight: "42px", background: "#f8f9fa", cursor: "not-allowed" }}>
                      {formData.process_loss_qty || 0}
                    </div>
                  </div>
                </div>
                <div className="jcf-field-block"><label className="jcf-label">Quality Inspection Template</label><input type="text" name="quality_inspection_template" value={formData.quality_inspection_template} onChange={handleInputChange} placeholder="Optional" className="jcf-input" /></div>
                <div className="jcf-section-title"><FaCalendarAlt size={12} /> Scheduled Time</div>
                <div className="jcf-grid-4">
                  <div><label className="jcf-label">Expected Start Date</label><DatePicker selected={formData.expected_start_date} onChange={(date: Date | null) => handleDateChange("expected_start_date", date)} showTimeSelect dateFormat="dd-MM-yyyy HH:mm" placeholderText="Select start" className="jcf-date-input" /></div>
                  <div><label className="jcf-label">Expected End Date</label><DatePicker selected={formData.expected_end_date} onChange={(date: Date | null) => handleDateChange("expected_end_date", date)} showTimeSelect dateFormat="dd-MM-yyyy HH:mm" placeholderText="Select end" className="jcf-date-input" />{errors.expected_end_date && <span className="jcf-error-text">{errors.expected_end_date}</span>}</div>
                  <div><label className="jcf-label">For Quantity</label><DigitInput value={String(formData.for_quantity)} onChange={(val) => handleNumberChange('for_quantity', val)} placeholder="0" maxLength={10} /></div>
                  <div><label className="jcf-label">Hour Rate</label><DigitInput value={String(formData.hour_rate)} onChange={(val) => handleNumberChange('hour_rate', val)} placeholder="0.00" maxLength={15} allowDecimal={true} /></div>
                </div>
                <div className="jcf-section-title"><FaClock size={12} /> Actual Schedule</div>
                <div className="jcf-grid-2 jcf-mb-20">
                  <div><label className="jcf-label">Actual Start Date</label><DatePicker selected={formData.actual_start_date} onChange={(date: Date | null) => handleDateChange("actual_start_date", date)} showTimeSelect dateFormat="dd-MM-yyyy HH:mm" placeholderText="Not started" className="jcf-date-input" /></div>
                  <div><label className="jcf-label">Actual End Date</label><DatePicker selected={formData.actual_end_date} onChange={(date: Date | null) => handleDateChange("actual_end_date", date)} showTimeSelect dateFormat="dd-MM-yyyy HH:mm" placeholderText="Not completed" className="jcf-date-input" /></div>
                </div>
                <div className="jcf-section-title"><FaBuilding size={12} /> Warehouses</div>
                <div className="jcf-grid-3">
                  <div><label className="jcf-label">Source Warehouse</label><input type="text" name="source_warehouse" value={formData.source_warehouse} onChange={handleInputChange} placeholder="Source warehouse" className="jcf-input" disabled={isEditMode} /></div>
                  <div><label className="jcf-label">WIP Warehouse</label><input type="text" name="wip_warehouse" value={formData.wip_warehouse} onChange={handleInputChange} placeholder="WIP warehouse" className="jcf-input" disabled={isEditMode} /></div>
                  <div><label className="jcf-label">Target Warehouse</label><input type="text" name="target_warehouse" value={formData.target_warehouse} onChange={handleInputChange} placeholder="Target warehouse" className="jcf-input" disabled={isEditMode} /></div>
                </div>
                <div className="jcf-field-block jcf-mt-20"><label className="jcf-label">Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} className="jcf-input" disabled={formData.status === "Completed"}>
                    <option value="Open">Open</option>
                    <option value="Work In Progress">Work In Progress</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="jcf-field-block jcf-mt-20"><label className="jcf-label">Remarks</label><textarea name="remarks" value={formData.remarks} onChange={handleInputChange} rows={4} placeholder="Any additional notes for this job card..." className="jcf-input jcf-textarea" /></div>
              </div>

              {/* Subcontracting Section - Only render once */}
              {renderSubcontractingSection()}

              {!isEditMode && (
                <div className="jcf-footer-row"><button type="submit" disabled={saving} className="jcf-btn-primary jcf-btn-submit" style={{ opacity: saving ? 0.6 : 1 }}>{saving && <FaSpinner className="jcf-spinning" />}<FaSave /> Create Job Card</button></div>
              )}
            </div>

            <aside className="jcf-sidebar">
              <div className="jcf-sidebar-card">
                <div className="jcf-sidebar-timer"><span className="jcf-timer-label"><FaClock size={11} /> ELAPSED TIME</span><span className="jcf-timer-value">{formatElapsed(elapsedSeconds)}</span></div>
                <div className="jcf-sidebar-status"><span className="jcf-status-label">Status</span><span className={`jcf-status-badge jcf-status-${formData.status.replace(/\s/g, '-').toLowerCase()}`}>{formData.status}</span></div>
                <div className="jcf-sidebar-section">
                  <div className="jcf-sidebar-section-title"><FaUserCheck size={12} /> Assigned Employees{formData.assigned_employees.length > 0 && <span className="jcf-assigned-count">{formData.assigned_employees.length}</span>}</div>
                  {formData.assigned_employees.length > 0 ? (
                    <div className="jcf-assigned-list">{getSelectedEmployeeDetails().map((emp, idx) => (<div key={idx} className="jcf-assigned-employee-item"><span className="jcf-assigned-employee-tag"><FaUser size={10} /> {emp.name} ({emp.id})</span><button type="button" className="jcf-remove-employee-btn" onClick={() => removeEmployee(emp.code)} title="Remove employee" disabled={jobCompleted}><FaTimes size={10} /></button></div>))}</div>
                  ) : (<div className="jcf-sidebar-empty">No employees assigned</div>)}
                </div>
                <div className="jcf-sidebar-section">
                  <div className="jcf-sidebar-section-title"><FaBoxes size={12} /> Production Progress</div>
                  <div className="jcf-progress-stats">
                    <div className="jcf-progress-row">
                      <span>Total Qty:</span>
                      <span className="jcf-progress-value">{formData.qty_to_manufacture || formData.for_quantity || 0}</span>
                    </div>
                    <div className="jcf-progress-row">
                      <span>Completed:</span>
                      <span className="jcf-progress-value" style={{ color: "var(--success-color)" }}>{formData.total_completed_qty || 0}</span>
                    </div>
                    <div className="jcf-progress-row">
                      <span>Loss/Scrap:</span>
                      <span className="jcf-progress-value" style={{ color: "var(--danger-color)" }}>{formData.process_loss_qty || 0}</span>
                    </div>
                    <div className="jcf-progress-row" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "8px", fontWeight: "bold" }}>
                      <span>Remaining:</span>
                      <span className="jcf-progress-value" style={{ color: "var(--info-color)" }}>{remainingQty}</span>
                    </div>
                  </div>
                </div>
                <div className="jcf-sidebar-actions">
                  <button type="button" className="jcf-btn-secondary jcf-btn-block" onClick={openEmployeeModal} disabled={jobCompleted}>
                    <FaUserPlus size={12} /> {hasAssignedEmployees ? "Manage Employees" : "Assign Employee"}
                  </button>
                  {!jobStarted && !jobCompleted && (
                    <button type="button" className="jcf-btn-start jcf-btn-block" onClick={handleStartJob} disabled={!hasAssignedEmployees || isStartingJob}>
                      {isStartingJob ? <FaSpinner className="jcf-spinning" /> : <FaPlay size={11} />}
                      {isStartingJob ? "Starting..." : "Start Job"}
                    </button>
                  )}
                  {jobStarted && !jobCompleted && timerRunning && (
                    <>
                      <button type="button" className="jcf-btn-secondary jcf-btn-block" onClick={handlePauseJob} disabled={isStartingJob}>
                        {isStartingJob ? <FaSpinner className="jcf-spinning" /> : <FaPause size={11} />}
                        Pause Job
                      </button>
                      <button type="button" className="jcf-btn-complete jcf-btn-block" onClick={handleCompleteJobClick} disabled={isStartingJob || remainingQty === 0}>
                        <FaCheck size={11} /> Process Production
                      </button>
                    </>
                  )}
                  {jobStarted && !jobCompleted && !timerRunning && (
                    <>
                      <button type="button" className="jcf-btn-start jcf-btn-block" onClick={() => { if (!hasAssignedEmployees) openEmployeeModal(); else handleStartJob(); }} disabled={!hasAssignedEmployees || isStartingJob}>
                        {isStartingJob ? <FaSpinner className="jcf-spinning" /> : <FaPlay size={11} />}
                        Resume Job
                      </button>
                      <button type="button" className="jcf-btn-complete jcf-btn-block" onClick={handleCompleteJobClick} disabled={isStartingJob || remainingQty === 0}>
                        <FaCheck size={11} /> Process Production
                      </button>
                    </>
                  )}
                  {jobCompleted && (
                    <div className="jcf-status-done jcf-btn-block">
                      <FaCheck size={11} /> Completed
                    </div>
                  )}
                  {isEditMode && (
                    <button type="button" className="jcf-btn-primary jcf-btn-block" onClick={handleUpdate} disabled={saving}>
                      {saving ? <FaSpinner className="jcf-spinning" /> : <FaSave size={11} />}
                      Update Job Card
                    </button>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobCardForm;