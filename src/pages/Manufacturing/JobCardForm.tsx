import React, { useState, useEffect, useRef } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  FaArrowLeft, FaSave, FaSpinner, FaInfoCircle, FaExclamationTriangle,
  FaTimesCircle, FaClock,
  FaCalendarAlt, FaPlay, FaPause, FaCheck, FaUserPlus, FaTimes,
  FaBuilding, FaUser, FaUserCheck,
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
    
    // Remove any non-digit characters (allow decimal if enabled)
    let filtered = allowDecimal 
      ? rawValue.replace(/[^0-9.]/g, '') 
      : rawValue.replace(/\D/g, '');
    
    // Ensure only one decimal point
    if (allowDecimal) {
      const parts = filtered.split('.');
      if (parts.length > 2) {
        filtered = parts[0] + '.' + parts.slice(1).join('');
      }
    }
    
    // Apply max length
    if (filtered.length > maxLength) {
      filtered = filtered.slice(0, maxLength);
    }
    
    // Apply min/max constraints
    if (filtered !== '') {
      const numValue = parseFloat(filtered);
      if (min !== undefined && numValue < min) {
        filtered = String(min);
      }
      if (max !== undefined && numValue > max) {
        filtered = String(max);
      }
    }
    
    onChange(filtered);
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.preventDefault();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent 'e', 'E', '+', '-' characters
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

/** "YYYY-MM-DD" */
const formatDateOnly = (d: Date | null): string | null => {
  if (!d) return null;
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

/** "YYYY-MM-DD HH:mm:ss" */
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

/** Shape returned by GET /employee (paginated, records array). */
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

interface JobCardFormData {
  // Core fields
  work_order: string;
  qty_to_manufacture: number;
  posting_date: Date | null;
  pending_qty: number;
  total_completed_qty: number;
  process_loss_qty: number;
  quality_inspection_template: string;

  // Scheduled fields
  expected_start_date: Date | null;
  expected_end_date: Date | null;
  for_quantity: number;
  hour_rate: number;

  // Actual fields
  actual_start_date: Date | null;
  actual_end_date: Date | null;
  remarks: string;

  // Internal / not directly editable in UI
  company: string;
  status: string;
  assigned_employees: string[];
  
  // Warehouse fields
  source_warehouse: string;
  wip_warehouse: string;
  target_warehouse: string;
  
  // Additional fields needed for API
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
}

interface ValidationError {
  field: string;
  label: string;
  message: string;
}

// ─── Completion Modal Props ─────────────────────────────────────────────

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (completedQty: number, lossQty: number) => void;
  totalQty: number;
  currentCompletedQty: number;
  currentLossQty: number;
}

const CompletionModal: React.FC<CompletionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  totalQty,
  currentCompletedQty,
  currentLossQty,
}) => {
  const [completedQty, setCompletedQty] = useState<string>(String(currentCompletedQty || 0));
  const [lossQty, setLossQty] = useState<string>(String(currentLossQty || 0));
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setCompletedQty(String(currentCompletedQty || 0));
    setLossQty(String(currentLossQty || 0));
    setError("");
  }, [currentCompletedQty, currentLossQty, isOpen]);

  const handleConfirm = () => {
    const completed = parseFloat(completedQty) || 0;
    const loss = parseFloat(lossQty) || 0;
    const total = completed + loss;
    if (total > totalQty) {
      setError(`Total (${total}) cannot exceed ${totalQty}`);
      return;
    }
    if (completed < 0 || loss < 0) {
      setError("Quantities cannot be negative");
      return;
    }
    onConfirm(completed, loss);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="jcf-modal-overlay" onClick={onClose}>
      <div className="jcf-validation-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
        <div className="jcf-modal-header jcf-modal-header-success">
          <h2 className="jcf-modal-title-plain">
            <FaCheck style={{ color: "var(--success-color)", marginRight: "8px" }} />
            Complete Job Card
          </h2>
          <button className="jcf-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="jcf-modal-body">
          <div className="jcf-completion-summary">
            <div className="jcf-summary-row">
              <span className="jcf-summary-label">Total Quantity to Manufacture:</span>
              <span className="jcf-summary-value">{totalQty}</span>
            </div>
            <div className="jcf-summary-row" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
              <span className="jcf-summary-label">Completed Quantity:</span>
              <div className="input-group">
                <DigitInput
                  value={completedQty}
                  onChange={setCompletedQty}
                  placeholder="0"
                  maxLength={10}
                  allowDecimal={false}
                />
                <span className="hint">Only numbers allowed</span>
              </div>
            </div>
            <div className="jcf-summary-row">
              <span className="jcf-summary-label">Loss / Scrap Quantity:</span>
              <div className="input-group">
                <DigitInput
                  value={lossQty}
                  onChange={setLossQty}
                  placeholder="0"
                  maxLength={10}
                  allowDecimal={false}
                />
                <span className="hint">Only numbers allowed</span>
              </div>
            </div>
            <div className="jcf-summary-row" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", fontWeight: "bold" }}>
              <span className="jcf-summary-label">Total (Completed + Loss):</span>
              <span className="jcf-summary-value" style={{ color: (parseFloat(completedQty) + parseFloat(lossQty)) > totalQty ? "var(--danger-color)" : "var(--success-color)" }}>
                {parseFloat(completedQty) + parseFloat(lossQty)}
              </span>
            </div>
            {error && (
              <div className="jcf-error-text" style={{ marginTop: "8px", textAlign: "center" }}>
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
            disabled={(parseFloat(completedQty) + parseFloat(lossQty)) > totalQty || parseFloat(completedQty) < 0 || parseFloat(lossQty) < 0}
          >
            <FaCheck size={12} /> Complete Job
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Success Modal Props ─────────────────────────────────────────────

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
      // Auto-close after 3 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="jcf-modal-overlay" onClick={onClose}>
      <div className="jcf-validation-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "450px" }}>
        <div className="jcf-modal-header jcf-modal-header-success">
          <h2 className="jcf-modal-title-plain">
            <FaCheck style={{ color: "#28a745", marginRight: "8px" }} />
            {title}
          </h2>
          <button className="jcf-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="jcf-modal-body" style={{ textAlign: "center", padding: "30px 20px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>
            <FaCheck style={{ color: "#28a745" }} />
          </div>
          <p style={{ fontSize: "16px", margin: 0, color: "#333" }}>
            {message}
          </p>
        </div>
        <div className="jcf-modal-footer" style={{ justifyContent: "center" }}>
          <button className="jcf-btn-primary" onClick={onClose}>
            <FaCheck size={12} /> OK
          </button>
        </div>
      </div>
    </div>
  );
};

const defaultFormData = (): JobCardFormData => ({
  work_order: "",
  qty_to_manufacture: 0,
  posting_date: new Date(),
  pending_qty: 0,
  total_completed_qty: 0,
  process_loss_qty: 0,
  quality_inspection_template: "",

  expected_start_date: null,
  expected_end_date: null,
  for_quantity: 0,
  hour_rate: 0,

  actual_start_date: null,
  actual_end_date: null,
  remarks: "",

  company: "",
  status: "Open",
  assigned_employees: [],
  
  source_warehouse: "",
  wip_warehouse: "",
  target_warehouse: "",
  
  production_item: "",
  bom_no: "",
  finished_good: "",
  semi_fg_bom: "",
  operation: "",
  workstation_type: "",
  workstation: "",
  for_operation: "",
  item_name: "",
  project: "",
  operation_row_id: 1,
  operation_row_number: 1,
  operation_id: "",
  sequence_id: 1,
  serial_no: "",
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

  // The real numeric primary key from the backend
  const [recordId, setRecordId] = useState<number | string | null>(null);
  // The Job Card's own docname (e.g. "JC-00001")
  const [, setJobCardDocName] = useState<string>("");

  // ─── work order dropdown ────────────────────────────────────────────
  const [workOrders, setWorkOrders] = useState<WorkOrderOption[]>([]);
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(false);

  // ─── employee assignment ────────────────────────────────────────────
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());
  const [assigningEmployees] = useState(false);

  // ─── job timer ───────────────────────────────────────────────────────
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isStartingJob, setIsStartingJob] = useState(false);

  // ─── Work Order details ─────────────────────────────────────────────
  const [woDetails, setWoDetails] = useState<any>(null);
  const [loadingWoDetails, setLoadingWoDetails] = useState(false);

  // ─── Completion Modal ──────────────────────────────────────────────
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // ─── load work orders for dropdown ─────────────────────────────────
  useEffect(() => {
    const fetchWorkOrders = async () => {
      setLoadingWorkOrders(true);
      try {
        const response = await api.get("/work-order");
        console.log("GET /work-order raw response:", response.data);

        const raw = response.data;
        let list: any =
          raw?.data?.records ??
          raw?.data ??
          raw?.work_orders ??
          raw?.results ??
          raw;

        if (!Array.isArray(list)) {
          console.warn("Unexpected /work-order response shape, defaulting to empty list:", raw);
          list = [];
        }

        setWorkOrders(list);
      } catch (err) {
        console.error("Error fetching work orders:", err);
        setWorkOrders([]);
      } finally {
        setLoadingWorkOrders(false);
      }
    };
    fetchWorkOrders();
  }, []);

  // ─── fetch Work Order details ──────────────────────────────────────
  const fetchWorkOrderDetails = async (woId: string) => {
    if (!woId) return;
    setLoadingWoDetails(true);
    try {
      const response = await api.get(`/work-order/${woId}`);
      console.log("Work Order details response:", response.data);
      
      if (response.data.success === 1) {
        const woData = response.data.data;
        setWoDetails(woData);
        
        // Auto-fill form fields from Work Order
        setFormData(prev => ({
          ...prev,
          company: woData.company || prev.company,
          qty_to_manufacture: woData.qty || prev.qty_to_manufacture,
          for_quantity: woData.qty || prev.for_quantity,
          hour_rate: woData.planned_operating_cost || prev.hour_rate,
          expected_start_date: woData.planned_start_date ? new Date(woData.planned_start_date) : prev.expected_start_date,
          expected_end_date: woData.planned_end_date ? new Date(woData.planned_end_date) : prev.expected_end_date,
          source_warehouse: woData.source_warehouse || "",
          wip_warehouse: woData.wip_warehouse || "",
          target_warehouse: woData.fg_warehouse || "",
          item_name: woData.item_name || prev.item_name,
          production_item: woData.production_item || prev.production_item,
        }));
      }
    } catch (err) {
      console.error("Error fetching Work Order details:", err);
      setApiError("Failed to load Work Order details");
    } finally {
      setLoadingWoDetails(false);
    }
  };

  // ─── load existing job card when editing ──────────────────────────
  useEffect(() => {
    if (isEditMode && id) {
      const state = location.state as { jobCard?: any };
      if (state?.jobCard) {
        loadJobCardIntoForm(state.jobCard);
      } else {
        fetchJobCardById(id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchJobCardById = async (jobCardId: string) => {
    try {
      const response = await api.get(`/job-card/${jobCardId}`);
      console.log("Job Card details response:", response.data);
      
      if (response.data.success === 1) {
        const jc = response.data.data;
        loadJobCardIntoForm(jc);
      } else {
        setApiError("Failed to load job card details");
      }
    } catch (err: any) {
      console.error("Error fetching job card:", err);
      setApiError(err.response?.data?.message || "Failed to load job card");
    }
  };

  const loadJobCardIntoForm = (jc: any) => {
    setRecordId(jc.id ?? null);
    setJobCardDocName(jc.name || jc.job_card_id || "");

    setFormData((prev) => ({
      ...prev,
      work_order: jc.work_order || "",
      qty_to_manufacture: jc.requested_qty ?? jc.for_quantity ?? 0,
      company: jc.company || "",
      posting_date: jc.posting_date ? new Date(jc.posting_date) : new Date(),
      pending_qty: jc.pending_qty || 0,
      total_completed_qty: jc.total_completed_qty || 0,
      process_loss_qty: jc.process_loss_qty || 0,
      quality_inspection_template: jc.quality_inspection_template || "",
      expected_start_date: jc.expected_start_date ? new Date(jc.expected_start_date) : null,
      expected_end_date: jc.expected_end_date ? new Date(jc.expected_end_date) : null,
      for_quantity: jc.for_quantity || 0,
      hour_rate: jc.hour_rate || 0,
      actual_start_date: jc.actual_start_date ? new Date(jc.actual_start_date) : null,
      actual_end_date: jc.actual_end_date ? new Date(jc.actual_end_date) : null,
      remarks: jc.remarks || "",
      status: jc.status || "Open",
      source_warehouse: jc.source_warehouse || "",
      wip_warehouse: jc.wip_warehouse || "",
      target_warehouse: jc.target_warehouse || "",
      production_item: jc.production_item || "",
      bom_no: jc.bom_no || "",
      finished_good: jc.finished_good || "",
      semi_fg_bom: jc.semi_fg_bom || "",
      operation: jc.operation || "",
      workstation_type: jc.workstation_type || "",
      workstation: jc.workstation || "",
      for_operation: jc.for_operation || "",
      item_name: jc.item_name || "",
      project: jc.project || "",
      operation_row_id: jc.operation_row_id || 1,
      operation_row_number: parseInt(jc.operation_row_number) || 1,
      operation_id: jc.operation_id || "",
      sequence_id: jc.sequence_id || 1,
      serial_no: jc.serial_no || "",
    }));

    // If we have a work order ID, fetch its details
    if (jc.work_order) {
      fetchWorkOrderDetails(jc.work_order);
    }

    // Resume timer state if job was already in progress when loaded
    if (jc.actual_start_date && !jc.actual_end_date) {
      const startMs = new Date(jc.actual_start_date).getTime();
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
      setTimerRunning(jc.status === "Work In Progress");
    }
  };

  // ─── validation ────────────────────────────────────────────────────────

  const getAllValidationErrors = (): ValidationError[] => {
    const allErrors: ValidationError[] = [];

    if (!formData.work_order.trim())
      allErrors.push({ field: "work_order", label: "Work Order", message: "Work Order is required" });

    if (formData.expected_start_date && formData.expected_end_date) {
      if (formData.expected_end_date < formData.expected_start_date) {
        allErrors.push({ field: "expected_end_date", label: "Expected End Date", message: "End date cannot be before start date" });
      }
    }

    return allErrors;
  };

  // ─── field handlers ────────────────────────────────────────────────────

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | boolean = value;
    if (type === "number") {
      processedValue = value === "" ? 0 : parseFloat(value) || 0;
    }
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleNumberChange = (field: keyof JobCardFormData, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value) || 0;
    setFormData((prev) => ({ ...prev, [field]: numValue }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleDateChange = (
    field: keyof JobCardFormData,
    date: Date | null | [Date | null, Date | null]
  ) => {
    const value = Array.isArray(date) ? date[0] : date;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ─── work order select ──────────────────────────────────────────────

  const handleWorkOrderSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "__create_new__") {
      navigate("/work-order/new");
      return;
    }
    
    const wo = workOrders.find((w) => w.name === value);
    setFormData((prev) => ({
      ...prev,
      work_order: value,
      company: wo?.company ?? prev.company,
      qty_to_manufacture: wo?.qty ?? prev.qty_to_manufacture,
      item_name: wo?.item_name || prev.item_name,
    }));
    
    if (errors.work_order) setErrors((prev) => ({ ...prev, work_order: "" }));
    
    if (value) {
      fetchWorkOrderDetails(value);
    }
  };

  // ─── employee assignment ────────────────────────────────────────────

  /** Resolve the employee "code" (docname) used as the employee/name field in payloads. */
  const getEmployeeCode = (emp: EmployeeOption): string => {
    if (emp.employee) return emp.employee;
    if (emp.employee_number) return emp.employee_number;
    return `EMP-${String(emp.id).padStart(5, "0")}`;
  };

  const getEmployeeName = (emp: EmployeeOption): string => {
    return emp.employee_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || getEmployeeCode(emp);
  };

  const getEmployeeDisplayId = (emp: EmployeeOption): string => {
    return emp.employee_number || emp.employee || getEmployeeCode(emp);
  };

  const openEmployeeModal = async () => {
    setSelectedEmployeeIds(new Set(formData.assigned_employees));
    setShowEmployeeModal(true);
    if (employees.length === 0) {
      setLoadingEmployees(true);
      try {
        const response = await api.get("/employee");
        console.log("GET /employee raw response:", response.data);

        const raw = response.data;
        let list: any[] = [];
        
        if (raw?.data?.records && Array.isArray(raw.data.records)) {
          list = raw.data.records;
        } else if (raw?.data && Array.isArray(raw.data)) {
          list = raw.data;
        } else if (raw?.records && Array.isArray(raw.records)) {
          list = raw.records;
        } else if (Array.isArray(raw)) {
          list = raw;
        }

        console.log("Processed employee list:", list);
        setEmployees(list);
      } catch (err) {
        console.error("Error fetching employees:", err);
        setEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    }
  };

  const toggleEmployeeSelect = (empId: string) => {
    setSelectedEmployeeIds((prev) => {
      const next = new Set(prev);
      next.has(empId) ? next.delete(empId) : next.add(empId);
      return next;
    });
  };

  const confirmEmployeeAssignment = () => {
    const selected = employees.filter((emp) => selectedEmployeeIds.has(String(emp.id)));

    setFormData((prev) => ({
      ...prev,
      assigned_employees: selected.map((emp) => getEmployeeCode(emp)),
    }));
    setShowEmployeeModal(false);
  };

  // ─── Remove employee ────────────────────────────────────────────────
  const removeEmployee = (employeeCode: string) => {
    setFormData((prev) => ({
      ...prev,
      assigned_employees: prev.assigned_employees.filter(code => code !== employeeCode),
    }));
  };

  // ─── job timer controls ─────────────────────────────────────────────

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (timerRunning) {
      interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning]);

  const jobStarted = !!formData.actual_start_date;
  const jobCompleted = formData.status === "Completed";
  const hasAssignedEmployees = formData.assigned_employees.length > 0;

  // ─── handleStartJob function ─────────────────────────────────────
  const handleStartJob = async () => {
    // If no employees assigned, open the assignment modal first
    if (!hasAssignedEmployees) {
      openEmployeeModal();
      return;
    }
    
    setIsStartingJob(true);
    setApiError(null);

    try {
      // Update the job card status via API
      const payload = buildApiPayload();
      payload.status = "Work In Progress";
      payload.actual_start_date = formatDateTime(new Date());

      let response;
      if (isEditMode && recordId) {
        // Update existing job card
        payload.id = Number(recordId);
        response = await api.put("/job-card", payload);
      } else {
        // Create new job card first
        response = await api.post("/job-card", payload);
        if (response.data.success === 1) {
          const newJobCard = response.data.data;
          setRecordId(newJobCard.id);
          setJobCardDocName(newJobCard.name);
          navigate(`/job-cards/${newJobCard.id}`, { 
            replace: true,
            state: { jobCard: newJobCard }
          });
        }
      }

      if (response.data.success !== 1) {
        throw new Error(response.data?.message || "Failed to start job");
      }

      // Update local state
      setFormData((prev) => ({
        ...prev,
        actual_start_date: new Date(),
        status: "Work In Progress",
      }));
      setTimerRunning(true);
      
      if (isEditMode && recordId) {
        fetchJobCardById(String(recordId));
      }
    } catch (err: any) {
      console.error("Error starting job:", err);
      setApiError(err.response?.data?.message || "Failed to start job");
    } finally {
      setIsStartingJob(false);
    }
  };

  const handlePauseJob = async () => {
    setIsStartingJob(true);
    setApiError(null);

    try {
      const payload = buildApiPayload();
      payload.status = "On Hold";
      payload.is_paused = 1;

      if (isEditMode && recordId) {
        payload.id = Number(recordId);
        const response = await api.put("/job-card", payload);
        if (response.data.success !== 1) {
          throw new Error(response.data?.message || "Failed to pause job");
        }
      }

      setTimerRunning(false);
      setFormData((prev) => ({ ...prev, status: "On Hold" }));
      
      if (isEditMode && recordId) {
        fetchJobCardById(String(recordId));
      }
    } catch (err: any) {
      console.error("Error pausing job:", err);
      setApiError(err.response?.data?.message || "Failed to pause job");
    } finally {
      setIsStartingJob(false);
    }
  };

  // ─── Handle Complete Job with Modal ──────────────────────────────────

  const handleCompleteJobClick = () => {
    setShowCompletionModal(true);
  };

  const handleCompletionConfirm = async (completedQty: number, lossQty: number) => {
    setIsStartingJob(true);
    setApiError(null);

    try {
      const payload = buildApiPayload();
      payload.status = "Completed";
      payload.actual_end_date = formatDateTime(new Date());
      payload.total_completed_qty = completedQty;
      payload.process_loss_qty = lossQty;
      payload.pending_qty = Math.max(0, formData.qty_to_manufacture - completedQty - lossQty);
      
      // CRITICAL FIX: Update produced_qty and process_loss_qty for the Work Order
      const workOrderPayload = {
        produced_qty: completedQty,
        process_loss_qty: lossQty,
        status: "Completed"
      };

      if (isEditMode && recordId) {
        // Update job card
        payload.id = Number(recordId);
        const response = await api.put("/job-card", payload);
        if (response.data.success !== 1) {
          throw new Error(response.data?.message || "Failed to complete job");
        }
        
        // Update the associated work order with produced quantity and process loss
       
        
      }

      setTimerRunning(false);
      setFormData((prev) => ({
        ...prev,
        actual_end_date: new Date(),
        status: "Completed",
        total_completed_qty: completedQty,
        process_loss_qty: lossQty,
        pending_qty: Math.max(0, prev.qty_to_manufacture - completedQty - lossQty),
      }));
      setShowCompletionModal(false);
      
      // Show success message for job completion
      setSuccessMessage("Job Card completed successfully!");
      setShowSuccessModal(true);
      
      if (isEditMode && recordId) {
        fetchJobCardById(String(recordId));
      }
    } catch (err: any) {
      console.error("Error completing job:", err);
      setApiError(err.response?.data?.message || "Failed to complete job");
    } finally {
      setIsStartingJob(false);
    }
  };

  // ─── handleUpdate function ──────────────────────────────────────────
  const handleUpdate = async () => {
    const allErrors = getAllValidationErrors();
    if (allErrors.length > 0) {
      setValidationErrors(allErrors);
      setShowValidationSummary(true);
      return;
    }

    setSaving(true);
    setApiError(null);

    try {
      const payload = buildApiPayload();
      console.log("Updating job card with payload:", payload);

      if (!isEditMode || !recordId) {
        throw new Error("No job card to update");
      }

      payload.id = Number(recordId);
      const response = await api.put("/job-card", payload);

      if (response.data.success !== 1) {
        throw new Error(response.data?.message || "Failed to update job card");
      }

      // Show success modal
      setSuccessMessage("Job Card updated successfully!");
      setShowSuccessModal(true);

      fetchJobCardById(String(recordId));
      console.log("Job card updated successfully");
    } catch (err: any) {
      console.error("Error updating job card:", err);
      setApiError(err.response?.data?.message || "Failed to update job card");
    } finally {
      setSaving(false);
    }
  };

  // ─── build API payload ─────────────────────────────────────────────────

  const buildApiPayload = () => {
    const timeRequired =
      formData.expected_start_date && formData.expected_end_date
        ? Math.max(
          0,
          Math.round(
            (formData.expected_end_date.getTime() - formData.expected_start_date.getTime()) / 60000
          )
        )
        : 0;

    const payload: any = {
      work_order: formData.work_order,
      production_item: formData.production_item || "",
      for_quantity: formData.for_quantity || formData.qty_to_manufacture,
      bom_no: formData.bom_no || "",
      company: formData.company,
      naming_series: "PO-JOB-.#####",
      posting_date: formatDateOnly(formData.posting_date),
      finished_good: formData.finished_good || "",
      semi_fg_bom: formData.semi_fg_bom || "",
      pending_qty: formData.pending_qty,
      process_loss_qty: formData.process_loss_qty,
      total_completed_qty: formData.total_completed_qty,
      transferred_qty: 0,
      manufactured_qty: 0,
      operation: formData.operation || "",
      source_warehouse: formData.source_warehouse || "",
      wip_warehouse: formData.wip_warehouse || "",
      skip_material_transfer: 0,
      backflush_from_wip_warehouse: 0,
      workstation_type: formData.workstation_type || "",
      workstation: formData.workstation || "",
      target_warehouse: formData.target_warehouse || "",
      quality_inspection_template: formData.quality_inspection_template,
      quality_inspection: "",
      expected_start_date: formatDateTime(formData.expected_start_date),
      time_required: timeRequired,
      expected_end_date: formatDateTime(formData.expected_end_date),
      actual_start_date: formatDateTime(formData.actual_start_date),
      total_time_in_mins: 0,
      actual_end_date: formatDateTime(formData.actual_end_date),
      for_job_card: "",
      is_corrective_job_card: 0,
      hour_rate: formData.hour_rate,
      for_operation: formData.for_operation || "",
      item_name: formData.item_name || "",
      requested_qty: formData.qty_to_manufacture,
      is_paused: formData.status === "On Hold" ? 1 : 0,
      is_subcontracted: 0,
      track_semi_finished_goods: 0,
      project: formData.project || "",
      remarks: formData.remarks,
      status: formData.status,
      operation_row_id: formData.operation_row_id || 1,
      operation_row_number: formData.operation_row_number || 1,
      operation_id: formData.operation_id || "",
      sequence_id: formData.sequence_id || 1,
      serial_no: formData.serial_no || "",
      serial_and_batch_bundle: "",
      barcode: "",
      batch_no: "",
      modified_by: "Administrator",
    };

    if (isEditMode && recordId) {
      payload.id = Number(recordId);
    }

    return payload;
  };

  // ─── submit — POST /job-card (only for new) ─────────────────────────

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Only allow submit for new job cards
    if (isEditMode) {
      return;
    }

    const allErrors = getAllValidationErrors();
    if (allErrors.length > 0) {
      setValidationErrors(allErrors);
      setShowValidationSummary(true);
      return;
    }

    setSaving(true);
    setApiError(null);

    try {
      const payload = buildApiPayload();
      console.log("Creating job card with payload:", payload);

      const response = await api.post("/job-card", payload);
      console.log("Job card save response:", response.data);

      if (response.data.success !== 1) {
        throw new Error(response.data?.message || "Failed to save job card");
      }

      navigate("/job-card");
    } catch (err: any) {
      console.error("Error saving job card:", err);
      if (err.response) {
        setApiError(err.response.data?.message || `Server error: ${err.response.status}`);
      } else if (err.request) {
        setApiError("Network error. Please check your connection.");
      } else {
        setApiError(err.message || "Failed to save job card");
      }
    } finally {
      setSaving(false);
    }
  };

  const allValidationErrors = getAllValidationErrors();
  const hasAnyErrors = allValidationErrors.length > 0;

  // Get selected employee details for display
  const getSelectedEmployeeDetails = () => {
    return formData.assigned_employees.map(code => {
      const emp = employees.find(e => 
        getEmployeeCode(e) === code || 
        e.employee === code || 
        e.employee_number === code
      );
      return emp ? { code, name: getEmployeeName(emp), id: getEmployeeDisplayId(emp) } : { code, name: code, id: code };
    });
  };

  return (
    <div className="jcf-page">

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message={successMessage}
        title="Success"
      />

      {/* Completion Modal */}
      <CompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        onConfirm={handleCompletionConfirm}
        totalQty={formData.qty_to_manufacture || formData.for_quantity || 0}
        currentCompletedQty={formData.total_completed_qty || 0}
        currentLossQty={formData.process_loss_qty || 0}
      />

      {/* Validation Summary Modal */}
      {showValidationSummary && validationErrors.length > 0 && (
        <div className="jcf-modal-overlay" onClick={() => setShowValidationSummary(false)}>
          <div className="jcf-validation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="jcf-modal-header jcf-modal-header-warning">
              <h2 className="jcf-modal-title-warning">
                <FaExclamationTriangle /> Missing Required Fields
              </h2>
              <button className="jcf-modal-close" onClick={() => setShowValidationSummary(false)}>×</button>
            </div>
            <div className="jcf-modal-body">
              <p className="jcf-modal-intro">
                Please fill in the following required fields before submitting:
              </p>
              <div className="jcf-error-list">
                {validationErrors.map((error, idx) => (
                  <div key={idx} className="jcf-validation-error-item">
                    <div className="jcf-error-header">
                      <FaTimesCircle className="jcf-error-icon" />
                      <strong className="jcf-error-label">{error.label}</strong>
                    </div>
                    <div className="jcf-error-message">{error.message}</div>
                  </div>
                ))}
              </div>
              <div className="jcf-hint-banner">
                <FaInfoCircle className="jcf-hint-icon" />
                Please fix the errors above before submitting
              </div>
            </div>
            <div className="jcf-modal-footer">
              <button className="jcf-btn-cancel" onClick={() => setShowValidationSummary(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Employee Modal */}
      {showEmployeeModal && (
        <div className="jcf-modal-overlay" onClick={() => !assigningEmployees && setShowEmployeeModal(false)}>
          <div className="jcf-validation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="jcf-modal-header">
              <h2 className="jcf-modal-title-plain">Assign Job to Employee</h2>
              <button className="jcf-modal-close" onClick={() => setShowEmployeeModal(false)} disabled={assigningEmployees}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="jcf-modal-body">
              {loadingEmployees ? (
                <p className="jcf-modal-intro">Loading employees...</p>
              ) : employees.length === 0 ? (
                <p className="jcf-modal-intro">No employees found.</p>
              ) : (
                <>
                  {!isEditMode && (
                    <div className="jcf-hint-banner" style={{ marginBottom: "12px" }}>
                      <FaInfoCircle className="jcf-hint-icon" />
                      <span>Employees will be assigned when you save this job card.</span>
                    </div>
                  )}
                  <div className="jcf-employee-list">
                    {employees.map((emp) => {
                      const displayName = getEmployeeName(emp);
                      const displayId = getEmployeeDisplayId(emp);
                      
                      return (
                        <label key={emp.id} className="jcf-employee-item">
                          <input
                            type="checkbox"
                            checked={selectedEmployeeIds.has(String(emp.id))}
                            onChange={() => toggleEmployeeSelect(String(emp.id))}
                            className="jcf-checkbox"
                          />
                          <div>
                            <div className="jcf-employee-id">{displayId}</div>
                            <div className="jcf-employee-name">{displayName}</div>
                            {emp.designation && (
                              <div className="jcf-employee-designation">
                                {emp.designation}
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            <div className="jcf-modal-footer">
              <button className="jcf-btn-cancel" onClick={() => setShowEmployeeModal(false)} disabled={assigningEmployees}>
                Cancel
              </button>
              <button
                className="jcf-btn-primary"
                onClick={confirmEmployeeAssignment}
                disabled={assigningEmployees || loadingEmployees}
              >
                {assigningEmployees ? <FaSpinner className="jcf-spinning" /> : null} Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="jcf-header-wrap">
        <div className="jcf-header-row">
          <button type="button" onClick={() => navigate("/job-card")} className="jcf-back-btn">
            <FaArrowLeft size={12} /> Back
          </button>
          <h1 className="jcf-title">
            {isEditMode ? "Edit Job Card" : "New Job Card"}
          </h1>

          {apiError && (
            <div className="jcf-error-pill">
              <FaExclamationTriangle size={11} />
              {apiError}
            </div>
          )}

          {hasAnyErrors && (
            <div className="jcf-error-pill">
              <FaExclamationTriangle size={11} />
              {allValidationErrors.length} missing field(s)
            </div>
          )}
        </div>
      </div>

      <div className="jcf-container">
        <form onSubmit={handleSubmit}>

          {/* Two-column layout: main fields + sidebar */}
          <div className="jcf-form-layout">

            {/* ── LEFT COLUMN: all form fields ── */}
            <div className="jcf-main-col">
              <div className="jcf-card">

                {/* Row 1: Work Order, Qty, Posting Date */}
                <div className="jcf-grid-3">
                <div>
  <label className="jcf-label">Work Order *</label>

  {isEditMode ? (
    <div
      className="jcf-input"
      style={{
        display: "flex",
        alignItems: "center",
        minHeight: "42px",
        background: "#f8f9fa",
        cursor: "not-allowed",
      }}
    >
      {formData.work_order}
      {woDetails?.item_name && ` - ${woDetails.item_name}`}
      {` (Qty: ${woDetails?.qty ?? formData.qty_to_manufacture ?? 0})`}
    </div>
  ) : (
    <>
      <select
        name="work_order"
        value={formData.work_order || ""}
        onChange={handleWorkOrderSelect}
        className={`jcf-input ${errors.work_order ? "jcf-input-error" : ""}`}
      >
        <option value="">
          {loadingWorkOrders ? "Loading..." : "Select Work Order"}
        </option>

        {workOrders.map((wo) => (
          <option key={wo.name} value={wo.name}>
            {wo.name} - {wo.item_name || wo.production_item || ""}
            {wo.qty ? ` (Qty: ${wo.qty})` : ""}
          </option>
        ))}

        <option value="__create_new__">+ Create New Work Order</option>
      </select>

      {errors.work_order && (
        <span className="jcf-error-text">{errors.work_order}</span>
      )}

      {loadingWoDetails && (
        <span className="jcf-hint-text">Loading...</span>
      )}

      {woDetails && !loadingWoDetails && formData.work_order && (
        <span
          className="jcf-hint-text"
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.75rem",
          }}
        >
          {woDetails.item_name || formData.item_name} · Qty:{" "}
          {woDetails.qty || formData.qty_to_manufacture}
        </span>
      )}
    </>
  )}
</div>
                  <div>
                    <label className="jcf-label">Qty To Manufacture</label>
                    <div className="input-group">
                      <DigitInput
                        value={String(formData.qty_to_manufacture)}
                        onChange={(val) => handleNumberChange('qty_to_manufacture', val)}
                        placeholder="0"
                        maxLength={10}
                        disabled={isEditMode}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="jcf-label">Posting Date</label>
                    <DatePicker
                      selected={formData.posting_date}
                      onChange={(date: Date | null) => handleDateChange("posting_date", date)}
                      dateFormat="dd-MM-yyyy"
                      className="jcf-date-input"
                    />
                  </div>
                </div>

                {/* Row 2: Pending Qty, Total Completed, Loss */}
                <div className="jcf-grid-3 jcf-mb-20">
                  <div>
                    <label className="jcf-label">Pending Qty</label>
                    <div className="input-group">
                      <DigitInput
                        value={String(formData.pending_qty)}
                        onChange={(val) => handleNumberChange('pending_qty', val)}
                        placeholder="0"
                        maxLength={10}
                        disabled={!(formData.status === "On Hold" || formData.status === "Completed")}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="jcf-label">Total Completed Qty</label>
                    <div className="input-group">
                      <DigitInput
                        value={String(formData.total_completed_qty)}
                        onChange={(val) => handleNumberChange('total_completed_qty', val)}
                        placeholder="0"
                        maxLength={10}
                        disabled={!(formData.status === "On Hold" || formData.status === "Completed")}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="jcf-label">Loss</label>
                    <div className="input-group">
                      <DigitInput
                        value={String(formData.process_loss_qty)}
                        onChange={(val) => handleNumberChange('process_loss_qty', val)}
                        placeholder="0"
                        maxLength={10}
                        disabled={!(formData.status === "On Hold" || formData.status === "Completed")}
                      />
                    </div>
                  </div>
                </div>

                {/* Quality Inspection Template */}
                <div className="jcf-field-block">
                  <label className="jcf-label">Quality Inspection Template</label>
                  <input
                    type="text"
                    name="quality_inspection_template"
                    value={formData.quality_inspection_template}
                    onChange={handleInputChange}
                    placeholder="Optional"
                    className="jcf-input"
                  />
                </div>

                <div className="jcf-section-title"><FaCalendarAlt size={12} /> Scheduled Time</div>

                <div className="jcf-grid-4">
                  <div>
                    <label className="jcf-label">Expected Start Date</label>
                    <DatePicker
                      selected={formData.expected_start_date}
                      onChange={(date: Date | null) => handleDateChange("expected_start_date", date)}
                      showTimeSelect
                      dateFormat="dd-MM-yyyy HH:mm"
                      placeholderText="Select start"
                      className="jcf-date-input"
                    />
                  </div>
                  <div>
                    <label className="jcf-label">Expected End Date</label>
                    <DatePicker
                      selected={formData.expected_end_date}
                      onChange={(date: Date | null) => handleDateChange("expected_end_date", date)}
                      showTimeSelect
                      dateFormat="dd-MM-yyyy HH:mm"
                      placeholderText="Select end"
                      className="jcf-date-input"
                    />
                    {errors.expected_end_date && <span className="jcf-error-text">{errors.expected_end_date}</span>}
                  </div>
                  <div>
                    <label className="jcf-label">For Quantity</label>
                    <div className="input-group">
                      <DigitInput
                        value={String(formData.for_quantity)}
                        onChange={(val) => handleNumberChange('for_quantity', val)}
                        placeholder="0"
                        maxLength={10}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="jcf-label">Hour Rate</label>
                    <div className="input-group">
                      <DigitInput
                        value={String(formData.hour_rate)}
                        onChange={(val) => handleNumberChange('hour_rate', val)}
                        placeholder="0.00"
                        maxLength={10}
                        allowDecimal={true}
                      />
                    </div>
                  </div>
                </div>

                <div className="jcf-section-title"><FaClock size={12} /> Actual Schedule</div>

                <div className="jcf-grid-2 jcf-mb-20">
                  <div>
                    <label className="jcf-label">Actual Start Date</label>
                    <DatePicker
                      selected={formData.actual_start_date}
                      onChange={(date: Date | null) => handleDateChange("actual_start_date", date)}
                      showTimeSelect
                      dateFormat="dd-MM-yyyy HH:mm"
                      placeholderText="Not started"
                      className="jcf-date-input"
                    />
                  </div>
                  <div>
                    <label className="jcf-label">Actual End Date</label>
                    <DatePicker
                      selected={formData.actual_end_date}
                      onChange={(date: Date | null) => handleDateChange("actual_end_date", date)}
                      showTimeSelect
                      dateFormat="dd-MM-yyyy HH:mm"
                      placeholderText="Not completed"
                      className="jcf-date-input"
                    />
                  </div>
                </div>

                <div className="jcf-section-title"><FaBuilding size={12} /> Warehouses</div>

                <div className="jcf-grid-3">
                  <div>
                    <label className="jcf-label">Source Warehouse</label>
                    <input
                      type="text"
                      name="source_warehouse"
                      value={formData.source_warehouse}
                      onChange={handleInputChange}
                      placeholder="Source warehouse"
                      className="jcf-input"
                      disabled={isEditMode}
                    />
                  </div>
                  <div>
                    <label className="jcf-label">WIP Warehouse</label>
                    <input
                      type="text"
                      name="wip_warehouse"
                      value={formData.wip_warehouse}
                      onChange={handleInputChange}
                      placeholder="WIP warehouse"
                      className="jcf-input"
                      disabled={isEditMode}
                    />
                  </div>
                  <div>
                    <label className="jcf-label">Target Warehouse</label>
                    <input
                      type="text"
                      name="target_warehouse"
                      value={formData.target_warehouse}
                      onChange={handleInputChange}
                      placeholder="Target warehouse"
                      className="jcf-input"
                      disabled={isEditMode}
                    />
                  </div>
                </div>

                {/* Status selector */}
                <div className="jcf-field-block jcf-mt-20">
                  <label className="jcf-label">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="jcf-input"
                    disabled={formData.status === "Completed"}
                  >
                    <option value="Open">Open</option>
                    <option value="Work In Progress">Work In Progress</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Remarks */}
                <div className="jcf-field-block jcf-mt-20">
                  <label className="jcf-label">Remarks</label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Any additional notes for this job card..."
                    className="jcf-input jcf-textarea"
                  />
                </div>
              </div> {/* end .jcf-card */}

              {/* Footer - only for new job cards */}
              {!isEditMode && (
                <div className="jcf-footer-row">
                  <button 
                    type="submit" 
                    disabled={saving} 
                    className="jcf-btn-primary jcf-btn-submit"
                    style={{ opacity: saving ? 0.6 : 1 }}
                  >
                    {saving && <FaSpinner className="jcf-spinning" />}
                    <FaSave /> Create Job Card
                  </button>
                </div>
              )}
            </div> {/* end .jcf-main-col */}

            {/* ── RIGHT SIDEBAR ── */}
            <aside className="jcf-sidebar">
              <div className="jcf-sidebar-card">

                {/* Timer display */}
                <div className="jcf-sidebar-timer">
                  <span className="jcf-timer-label"><FaClock size={11} /> ELAPSED TIME</span>
                  <span className="jcf-timer-value">{formatElapsed(elapsedSeconds)}</span>
                </div>

                {/* Status indicator */}
                <div className="jcf-sidebar-status">
                  <span className="jcf-status-label">Status</span>
                  <span className={`jcf-status-badge jcf-status-${formData.status.replace(/\s/g, '-').toLowerCase()}`}>
                    {formData.status}
                  </span>
                </div>

                {/* Assigned employees */}
                <div className="jcf-sidebar-section">
                  <div className="jcf-sidebar-section-title">
                    <FaUserCheck size={12} /> Assigned Employees
                    {formData.assigned_employees.length > 0 && (
                      <span className="jcf-assigned-count">{formData.assigned_employees.length}</span>
                    )}
                  </div>
                  {formData.assigned_employees.length > 0 ? (
                    <div className="jcf-assigned-list">
                      {getSelectedEmployeeDetails().map((emp, idx) => (
                        <div key={idx} className="jcf-assigned-employee-item">
                          <span className="jcf-assigned-employee-tag">
                            <FaUser size={10} /> {emp.name} ({emp.id})
                          </span>
                          <button
                            type="button"
                            className="jcf-remove-employee-btn"
                            onClick={() => removeEmployee(emp.code)}
                            title="Remove employee"
                            disabled={jobStarted || jobCompleted}
                          >
                            <FaTimes size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="jcf-sidebar-empty">No employees assigned</div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="jcf-sidebar-actions">
                  <button
                    type="button"
                    className="jcf-btn-secondary jcf-btn-block"
                    onClick={openEmployeeModal}
                    disabled={jobStarted || jobCompleted}
                  >
                    <FaUserPlus size={12} /> {hasAssignedEmployees ? "Manage Employees" : "Assign Employee"}
                  </button>

                  {/* Update button – only for edit mode */}
                  {isEditMode && (
                    <button
                      type="button"
                      className="jcf-btn-primary jcf-btn-block"
                      onClick={handleUpdate}
                      disabled={saving}
                    >
                      {saving ? <FaSpinner className="jcf-spinning" /> : <FaSave size={11} />}
                      Update Job Card
                    </button>
                  )}

                  {/* Start / Resume / Pause / Complete buttons */}
                  {!jobStarted && !jobCompleted && (
                    <button
                      type="button"
                      className="jcf-btn-start jcf-btn-block"
                      onClick={handleStartJob}
                      disabled={!hasAssignedEmployees || isStartingJob}
                      title={!hasAssignedEmployees ? "Assign at least one employee before starting" : ""}
                    >
                      {isStartingJob ? <FaSpinner className="jcf-spinning" /> : <FaPlay size={11} />}
                      {isStartingJob ? "Starting..." : "Start Job"}
                    </button>
                  )}

                  {jobStarted && !jobCompleted && timerRunning && (
                    <>
                      <button
                        type="button"
                        className="jcf-btn-secondary jcf-btn-block"
                        onClick={handlePauseJob}
                        disabled={isStartingJob}
                      >
                        {isStartingJob ? <FaSpinner className="jcf-spinning" /> : <FaPause size={11} />}
                        Pause Job
                      </button>
                      <button
                        type="button"
                        className="jcf-btn-complete jcf-btn-block"
                        onClick={handleCompleteJobClick}
                        disabled={isStartingJob}
                      >
                        <FaCheck size={11} /> Complete Job
                      </button>
                    </>
                  )}

                  {jobStarted && !jobCompleted && !timerRunning && (
                    <>
                      <button
                        type="button"
                        className="jcf-btn-start jcf-btn-block"
                        onClick={() => {
                          if (!hasAssignedEmployees) openEmployeeModal();
                          else handleStartJob();
                        }}
                        disabled={!hasAssignedEmployees || isStartingJob}
                      >
                        {isStartingJob ? <FaSpinner className="jcf-spinning" /> : <FaPlay size={11} />}
                        Resume Job
                      </button>
                      <button
                        type="button"
                        className="jcf-btn-complete jcf-btn-block"
                        onClick={handleCompleteJobClick}
                        disabled={isStartingJob}
                      >
                        <FaCheck size={11} /> Complete Job
                      </button>
                    </>
                  )}

                  {jobCompleted && (
                    <div className="jcf-status-done jcf-btn-block">
                      <FaCheck size={11} /> Completed
                    </div>
                  )}
                </div>
              </div> {/* end .jcf-sidebar-card */}
            </aside>

          </div> {/* end .jcf-form-layout */}
        </form>
      </div>
    </div>
  );
};

export default JobCardForm;