import React, { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  FaArrowLeft, FaSave, FaSpinner, FaInfoCircle, FaExclamationTriangle,
  FaTimesCircle, FaClock, FaListUl, FaFileAlt, FaPlus, FaTrash,
  FaCalendarAlt, FaPlay, FaPause, FaCheck, FaUserPlus, FaTimes,
  FaBuilding,
} from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./JobCardForm.css";
import api from "../../src/services/api";

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

// ─── interfaces ───────────────────────────────────────────────────────────

interface TimeLog {
  id: string;
  employee: string;
  from_time: Date | null;
  to_time: Date | null;
  completed_qty?: number;
}

interface WorkOrderOption {
  name: string;
  company?: string;
  qty?: number;
  qty_to_manufacture?: number;
  item_name?: string;
  [key: string]: any;
}

interface EmployeeOption {
  id: string;
  name: string;
}

interface JobCardFormData {
  // Tab 0 — Details
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

  // Tab 1 — Actual Time
  actual_start_date: Date | null;
  actual_end_date: Date | null;
  time_logs: TimeLog[];
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
  tabIndex: number;
}

interface TabWarning {
  [key: number]: boolean;
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
  const [completedQty, setCompletedQty] = useState<number>(currentCompletedQty || 0);
  const [lossQty, setLossQty] = useState<number>(currentLossQty || 0);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setCompletedQty(currentCompletedQty || 0);
    setLossQty(currentLossQty || 0);
    setError("");
  }, [currentCompletedQty, currentLossQty, isOpen]);

  const handleConfirm = () => {
    const total = completedQty + lossQty;
    if (total > totalQty) {
      setError(`Total (${total}) cannot exceed ${totalQty}`);
      return;
    }
    if (completedQty < 0 || lossQty < 0) {
      setError("Quantities cannot be negative");
      return;
    }
    onConfirm(completedQty, lossQty);
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
              <input
                type="number"
                value={completedQty}
                onChange={(e) => {
                  setCompletedQty(Number(e.target.value));
                  setError("");
                }}
                min="0"
                max={totalQty}
                className="jcf-input jcf-summary-input"
                style={{ width: "120px" }}
              />
            </div>
            <div className="jcf-summary-row">
              <span className="jcf-summary-label">Loss / Scrap Quantity:</span>
              <input
                type="number"
                value={lossQty}
                onChange={(e) => {
                  setLossQty(Number(e.target.value));
                  setError("");
                }}
                min="0"
                max={totalQty}
                className="jcf-input jcf-summary-input"
                style={{ width: "120px" }}
              />
            </div>
            <div className="jcf-summary-row" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", fontWeight: "bold" }}>
              <span className="jcf-summary-label">Total (Completed + Loss):</span>
              <span className="jcf-summary-value" style={{ color: (completedQty + lossQty) > totalQty ? "var(--danger-color)" : "var(--success-color)" }}>
                {completedQty + lossQty}
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
            disabled={completedQty + lossQty > totalQty || completedQty < 0 || lossQty < 0}
          >
            <FaCheck size={12} /> Complete Job
          </button>
        </div>
      </div>
    </div>
  );
};

const emptyTimeLog = (): TimeLog => ({
  id: Math.random().toString(36).slice(2),
  employee: "",
  from_time: null,
  to_time: null,
});

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
  time_logs: [],
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

  const [activeTab, setActiveTab] = useState(0);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [warnings, setWarnings] = useState<TabWarning>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const [formData, setFormData] = useState<JobCardFormData>(defaultFormData());

  // The real numeric primary key from the backend
  const [recordId, setRecordId] = useState<number | string | null>(null);

  // ─── work order dropdown ────────────────────────────────────────────
  const [workOrders, setWorkOrders] = useState<WorkOrderOption[]>([]);
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(false);

  // ─── employee assignment ────────────────────────────────────────────
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());

  // ─── job timer ───────────────────────────────────────────────────────
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // ─── Work Order details ─────────────────────────────────────────────
  const [woDetails, setWoDetails] = useState<any>(null);
  const [loadingWoDetails, setLoadingWoDetails] = useState(false);

  // ─── Completion Modal ──────────────────────────────────────────────
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const tabs = [
    { id: 0, name: "Details", icon: <FaFileAlt size={14} /> },
    { id: 1, name: "Actual Time", icon: <FaClock size={14} /> },
  ];

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

  const getValidationErrors = (step: number): { [key: string]: string } => {
    const newErrors: { [key: string]: string } = {};
    if (step === 0) {
      if (!formData.work_order.trim()) newErrors.work_order = "Work Order is required";
    }
    return newErrors;
  };

  const getAllValidationErrors = (): ValidationError[] => {
    const allErrors: ValidationError[] = [];

    if (!formData.work_order.trim())
      allErrors.push({ field: "work_order", label: "Work Order", message: "Work Order is required", tabIndex: 0 });

    if (formData.expected_start_date && formData.expected_end_date) {
      if (formData.expected_end_date < formData.expected_start_date) {
        allErrors.push({ field: "expected_end_date", label: "Expected End Date", message: "End date cannot be before start date", tabIndex: 0 });
      }
    }

    formData.time_logs.forEach((log, i) => {
      if (log.from_time && log.to_time && log.to_time < log.from_time) {
        allErrors.push({ field: `time_log_${i}`, label: `Time Log ${i + 1}`, message: "To time cannot be before From time", tabIndex: 1 });
      }
    });

    return allErrors;
  };

  const getTabErrorCount = (tabId: number): number => {
    return getAllValidationErrors().filter((e) => e.tabIndex === tabId).length;
  };

  const jumpToTab = (tabIndex: number) => {
    setActiveTab(tabIndex);
    setShowValidationSummary(false);
    setErrors({});
  };

  const checkTabWarnings = (step: number): boolean => {
    const stepErrors = getValidationErrors(step);
    const hasWarnings = Object.keys(stepErrors).length > 0;
    setWarnings((prev) => ({ ...prev, [step]: hasWarnings }));
    return hasWarnings;
  };

  const getTabStatus = (tabId: number) => {
    return warnings[tabId] ? "warning" : "ok";
  };

  const handleTabChange = (tabId: number) => {
    checkTabWarnings(tabId);
    setActiveTab(tabId);
    setErrors({});
    setShowValidationSummary(false);
  };

  const handleNext = () => {
    const nextTab = activeTab + 1;
    if (nextTab <= 1) {
      checkTabWarnings(nextTab);
      setActiveTab(nextTab);
      setErrors({});
      setShowValidationSummary(false);
    }
  };

  const handlePrevious = () => {
    setActiveTab(activeTab - 1);
    setErrors({});
    setShowValidationSummary(false);
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
    checkTabWarnings(activeTab);
  };

  const handleDateChange = (
    field: keyof JobCardFormData,
    date: Date | null | [Date | null, Date | null]
  ) => {
    const value = Array.isArray(date) ? date[0] : date;
    setFormData((prev) => ({ ...prev, [field]: value }));
    checkTabWarnings(activeTab);
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
    checkTabWarnings(activeTab);
    
    if (value) {
      fetchWorkOrderDetails(value);
    }
  };

  // ─── time logs (Tab 1) ────────────────────────────────────────────────

  const addTimeLog = () => {
    setFormData((prev) => ({ ...prev, time_logs: [...prev.time_logs, emptyTimeLog()] }));
  };

  const removeTimeLog = (logId: string) => {
    setFormData((prev) => ({ ...prev, time_logs: prev.time_logs.filter((l) => l.id !== logId) }));
  };

  const updateTimeLog = (logId: string, field: keyof TimeLog, value: TimeLog[keyof TimeLog]) => {
    setFormData((prev) => ({
      ...prev,
      time_logs: prev.time_logs.map((l) => (l.id === logId ? { ...l, [field]: value } : l)),
    }));
  };

  // ─── employee assignment ────────────────────────────────────────────

  const openEmployeeModal = async () => {
    setSelectedEmployeeIds(new Set(formData.assigned_employees));
    setShowEmployeeModal(true);
    if (employees.length === 0) {
      setLoadingEmployees(true);
      try {
        const response = await api.get("/employee");
        if (response.data.success === 1) {
          setEmployees(response.data.data || []);
        }
      } catch (err) {
        console.error("Error fetching employees:", err);
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
    setFormData((prev) => ({ ...prev, assigned_employees: Array.from(selectedEmployeeIds) }));
    setShowEmployeeModal(false);
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

  const handleStartJob = () => {
    setFormData((prev) => ({
      ...prev,
      actual_start_date: prev.actual_start_date ?? new Date(),
      status: "Work In Progress",
    }));
    setTimerRunning(true);
  };

  const handlePauseJob = () => {
    setTimerRunning(false);
    setFormData((prev) => ({ ...prev, status: "On Hold" }));
  };

  // ─── Handle Complete Job with Modal ──────────────────────────────────

  const handleCompleteJobClick = () => {
    setShowCompletionModal(true);
  };

  const handleCompletionConfirm = (completedQty: number, lossQty: number) => {
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

    const totalTimeInMins = formData.time_logs.reduce((sum, log) => {
      if (log.from_time && log.to_time) {
        return sum + Math.max(0, Math.round((log.to_time.getTime() - log.from_time.getTime()) / 60000));
      }
      return sum;
    }, 0);

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
      total_time_in_mins: totalTimeInMins,
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
      owner: "Administrator",
      docstatus: 0,
      idx: 0,
    };

    if (isEditMode && recordId) {
      payload.id = Number(recordId);
    }

    return payload;
  };

  // ─── submit — POST/PUT /job-card ───────────────────────────────────────

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

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
      console.log("Saving job card with payload:", payload);

      let response;
      if (isEditMode && recordId) {
        response = await api.put("/job-card", payload);
      } else {
        response = await api.post("/job-card", payload);
      }

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

  return (
    <div className="jcf-page">

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
                  <div key={idx} className="jcf-validation-error-item" onClick={() => jumpToTab(error.tabIndex)}>
                    <div className="jcf-error-header">
                      <FaTimesCircle className="jcf-error-icon" />
                      <strong className="jcf-error-label">{error.label}</strong>
                      <span className="jcf-error-tab">
                        Tab {error.tabIndex + 1}: {tabs[error.tabIndex].name}
                      </span>
                    </div>
                    <div className="jcf-error-message">{error.message}</div>
                  </div>
                ))}
              </div>
              <div className="jcf-hint-banner">
                <FaInfoCircle className="jcf-hint-icon" />
                Click on any error to jump to that section
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
        <div className="jcf-modal-overlay" onClick={() => setShowEmployeeModal(false)}>
          <div className="jcf-validation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="jcf-modal-header">
              <h2 className="jcf-modal-title-plain">Assign Job to Employee</h2>
              <button className="jcf-modal-close" onClick={() => setShowEmployeeModal(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="jcf-modal-body">
              {loadingEmployees ? (
                <p className="jcf-modal-intro">Loading employees...</p>
              ) : employees.length === 0 ? (
                <p className="jcf-modal-intro">No employees found.</p>
              ) : (
                <div className="jcf-employee-list">
                  {employees.map((emp) => (
                    <label key={emp.id} className="jcf-employee-item">
                      <input
                        type="checkbox"
                        checked={selectedEmployeeIds.has(emp.id)}
                        onChange={() => toggleEmployeeSelect(emp.id)}
                        className="jcf-checkbox"
                      />
                      <div>
                        <div className="jcf-employee-id">{emp.id}</div>
                        <div className="jcf-employee-name">{emp.name}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="jcf-modal-footer">
              <button className="jcf-btn-cancel" onClick={() => setShowEmployeeModal(false)}>Cancel</button>
              <button className="jcf-btn-primary" onClick={confirmEmployeeAssignment}>Assign</button>
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

          {/* Timer / Job actions bar */}
          <div className="jcf-timer-bar">
            <div className="jcf-timer-display">
              <span className="jcf-timer-label"><FaClock size={11} /> ELAPSED TIME</span>
              <span className="jcf-timer-value">{formatElapsed(elapsedSeconds)}</span>
            </div>
            <div className="jcf-timer-actions">
              <button type="button" className="jcf-btn-secondary" onClick={openEmployeeModal}>
                <FaUserPlus size={12} /> Assign Employee
                {formData.assigned_employees.length > 0 ? ` (${formData.assigned_employees.length})` : ""}
              </button>

              {!jobStarted && !jobCompleted && (
                <button type="button" className="jcf-btn-start" onClick={handleStartJob}>
                  <FaPlay size={11} /> Start Job
                </button>
              )}

              {jobStarted && !jobCompleted && timerRunning && (
                <>
                  <button type="button" className="jcf-btn-secondary" onClick={handlePauseJob}>
                    <FaPause size={11} /> Pause Job
                  </button>
                  <button type="button" className="jcf-btn-complete" onClick={handleCompleteJobClick}>
                    <FaCheck size={11} /> Complete Job
                  </button>
                </>
              )}

              {jobStarted && !jobCompleted && !timerRunning && (
                <>
                  <button type="button" className="jcf-btn-start" onClick={handleStartJob}>
                    <FaPlay size={11} /> Resume Job
                  </button>
                  <button type="button" className="jcf-btn-complete" onClick={handleCompleteJobClick}>
                    <FaCheck size={11} /> Complete Job
                  </button>
                </>
              )}

              {jobCompleted && <span className="jcf-status-done"><FaCheck size={11} /> Completed</span>}
            </div>
          </div>

          {/* Tabs */}
          <div className="jcf-tabs-wrap">
            <div className="jcf-tabs-row">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const tabStatus = getTabStatus(tab.id);
                const errorCount = getTabErrorCount(tab.id);

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={`jcf-tab-btn ${isActive ? "jcf-tab-btn-active" : ""}`}
                  >
                    <div
                      className={`jcf-tab-circle ${isActive ? "jcf-tab-circle-active" : ""} ${tabStatus === "warning" && !isActive ? "jcf-tab-circle-warning" : ""
                        }`}
                    >
                      {tabStatus === "warning" && !isActive ? <FaExclamationTriangle size={14} /> : tab.id + 1}

                      {errorCount > 0 && !isActive && (
                        <div className="jcf-tab-error-badge">{errorCount}</div>
                      )}
                    </div>

                    <div className="jcf-tab-label-wrap">
                      <div className={`jcf-tab-step ${isActive ? "jcf-tab-step-active" : ""} ${tabStatus === "warning" && !isActive ? "jcf-tab-step-warning" : ""
                        }`}>
                        Step {tab.id + 1}
                      </div>
                      <div className={`jcf-tab-name ${isActive ? "jcf-tab-name-active" : ""}`}>
                        {tab.name}
                      </div>
                    </div>

                    {isActive && <div className="jcf-tab-underline" />}
                  </button>
                );
              })}
            </div>
          </div>

          {warnings[activeTab] && (
            <div className="jcf-tab-warning-banner">
              <FaExclamationTriangle size={12} />
              <span>This tab has incomplete or missing information. You can proceed but please review before submitting.</span>
            </div>
          )}

          <div>

            {/* Tab 0 — Details */}
            {activeTab === 0 && (
              <div className="jcf-fade-in">
                <div className="jcf-card">
                  <div className="jcf-grid-3">
                    <div>
                      <label className="jcf-label">Work Order *</label>
                      <select
                        name="work_order"
                        value={formData.work_order}
                        onChange={handleWorkOrderSelect}
                        className={`jcf-input ${errors.work_order ? "jcf-input-error" : ""}`}
                        disabled={isEditMode}
                      >
                        <option value="">{loadingWorkOrders ? "Loading..." : "Select Work Order"}</option>
                        {workOrders.map((wo) => (
                          <option key={wo.name} value={wo.name}>
                            {wo.name} {wo.item_name ? `- ${wo.item_name}` : ""}
                          </option>
                        ))}
                        <option value="__create_new__">+ Create New Work Order</option>
                      </select>
                      {errors.work_order && <span className="jcf-error-text">{errors.work_order}</span>}
                      {loadingWoDetails && <span className="jcf-hint-text">Loading...</span>}
                      {woDetails && !loadingWoDetails && formData.work_order && (
                        <span className="jcf-hint-text" style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                          {woDetails.item_name || formData.item_name} · Qty: {woDetails.qty || formData.qty_to_manufacture}
                        </span>
                      )}
                    </div>
                    <div>
                      <label className="jcf-label">Qty To Manufacture</label>
                      <input
                        type="number"
                        name="qty_to_manufacture"
                        value={formData.qty_to_manufacture || ""}
                        onChange={handleInputChange}
                        placeholder="0"
                        className="jcf-input"
                        disabled={isEditMode}
                      />
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

                  <div className="jcf-grid-3 jcf-mb-20">
                    <div>
                      <label className="jcf-label">Pending Qty</label>
                      <input
                        type="number"
                        name="pending_qty"
                        value={formData.pending_qty || ""}
                        onChange={handleInputChange}
                        placeholder="0"
                        className="jcf-input"
                        disabled={!(formData.status === "On Hold" || formData.status === "Completed")}
                      />
                    </div>
                    <div>
                      <label className="jcf-label">Total Completed Qty</label>
                      <input
                        type="number"
                        name="total_completed_qty"
                        value={formData.total_completed_qty || 0}
                        onChange={handleInputChange}
                        placeholder="0"
                        className="jcf-input"
                        disabled={!(formData.status === "On Hold" || formData.status === "Completed")}
                      />
                    </div>
                    <div>
                      <label className="jcf-label">Loss</label>
                      <input
                        type="number"
                        name="process_loss_qty"
                        value={formData.process_loss_qty || ""}
                        onChange={handleInputChange}
                        placeholder="0"
                        className="jcf-input"
                        disabled={!(formData.status === "On Hold" || formData.status === "Completed")}
                      />
                    </div>
                  </div>

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
                      <input
                        type="number"
                        name="for_quantity"
                        value={formData.for_quantity || ""}
                        onChange={handleInputChange}
                        placeholder="0"
                        className="jcf-input"
                      />
                    </div>
                    <div>
                      <label className="jcf-label">Hour Rate</label>
                      <input
                        type="number"
                        name="hour_rate"
                        value={formData.hour_rate || ""}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        className="jcf-input"
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
                </div>
              </div>
            )}

            {/* Tab 1 — Actual Time */}
            {activeTab === 1 && (
              <div className="jcf-fade-in">
                <div className="jcf-card">
                  <div className="jcf-section-title jcf-section-title-first"><FaClock size={12} /> Actual Schedule</div>

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

                  <div className="jcf-section-title"><FaListUl size={12} /> Time Logs</div>

                  <div className="jcf-table-wrap">
                    <table className="jcf-table">
                      <colgroup>
                        <col style={{ width: "24%" }} />
                        <col style={{ width: "26%" }} />
                        <col style={{ width: "26%" }} />
                        <col style={{ width: "16%" }} />
                        <col style={{ width: "8%" }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>From Time</th>
                          <th>To Time</th>
                          <th>Completed Qty</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.time_logs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="jcf-table-empty">No rows</td>
                          </tr>
                        ) : (
                          formData.time_logs.map((log, i) => (
                            <tr key={log.id}>
                              <td>
                                <input
                                  type="text"
                                  value={log.employee}
                                  onChange={(e) => updateTimeLog(log.id, "employee", e.target.value)}
                                  placeholder="Employee"
                                  className="jcf-cell-input"
                                />
                              </td>
                              <td>
                                <DatePicker
                                  selected={log.from_time}
                                  onChange={(date: Date | null) => updateTimeLog(log.id, "from_time", date)}
                                  showTimeSelect
                                  dateFormat="dd-MM HH:mm"
                                  className="jcf-cell-date-input"
                                  placeholderText="From"
                                />
                              </td>
                              <td>
                                <DatePicker
                                  selected={log.to_time}
                                  onChange={(date: Date | null) => updateTimeLog(log.id, "to_time", date)}
                                  showTimeSelect
                                  dateFormat="dd-MM HH:mm"
                                  className="jcf-cell-date-input"
                                  placeholderText="To"
                                />
                                {errors[`time_log_${i}`] && <span className="jcf-error-text">{errors[`time_log_${i}`]}</span>}
                              </td>
                              <td>
                                <input
                                  type="number"
                                  value={log.completed_qty || ""}
                                  onChange={(e) => updateTimeLog(log.id, "completed_qty", parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                  className="jcf-cell-input"
                                />
                              </td>
                              <td className="jcf-cell-center">
                                <button type="button" onClick={() => removeTimeLog(log.id)} className="jcf-row-remove">
                                  <FaTrash size={11} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <button type="button" onClick={addTimeLog} className="jcf-add-row-btn">
                    <FaPlus size={10} /> Add Time Log
                  </button>

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
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="jcf-footer-row">
            {activeTab > 0 && (
              <button type="button" onClick={handlePrevious} className="jcf-btn-secondary">
                ← Previous
              </button>
            )}
            {activeTab < 1 && (
              <button type="button" onClick={handleNext} className="jcf-btn-primary">
                Next →
              </button>
            )}
            {activeTab === 1 && (
              <button type="submit" disabled={saving} className="jcf-btn-primary jcf-btn-submit" style={{ opacity: saving ? 0.6 : 1 }}>
                {saving && <FaSpinner className="jcf-spinning" />}
                <FaSave /> {isEditMode ? "Update Job Card" : "Create Job Card"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobCardForm;