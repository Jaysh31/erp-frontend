import React, { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  FaArrowLeft, FaSave, FaSpinner, FaInfoCircle, FaExclamationTriangle,
  FaTimesCircle, FaClock, FaCogs, FaListUl, FaFileAlt, FaPlus, FaTrash,
  FaCalendarAlt, FaBoxes,
} from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./JobCardForm.css";

// ─── local storage (no API) ────────────────────────────────────────────

const JOB_CARDS_STORAGE_KEY = "job_cards";
const JOB_CARDS_UPDATE_EVENT = "job-cards-updated";

const readAllJobCards = (): any[] => {
  try {
    const raw = localStorage.getItem(JOB_CARDS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to read job cards from local storage:", err);
    return [];
  }
};

const writeAllJobCards = (cards: any[]) => {
  localStorage.setItem(JOB_CARDS_STORAGE_KEY, JSON.stringify(cards));
  window.dispatchEvent(new Event(JOB_CARDS_UPDATE_EVENT));
};

const generateJobCardId = (existing: any[]): string => {
  let n = existing.length + 1;
  let candidate = `JC-${String(n).padStart(5, "0")}`;
  const ids = new Set(existing.map((c) => c.job_card_id));
  while (ids.has(candidate)) {
    n += 1;
    candidate = `JC-${String(n).padStart(5, "0")}`;
  }
  return candidate;
};

/** Create a new job card, or update an existing one when `id` is provided. */
const saveJobCardLocally = (data: any, id?: string): any => {
  const all = readAllJobCards();

  if (id) {
    const idx = all.findIndex((c) => c.id === id);
    if (idx !== -1) {
      const updated = { ...all[idx], ...data };
      all[idx] = updated;
      writeAllJobCards(all);
      return updated;
    }
  }

  const newCard = {
    ...data,
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    job_card_id: generateJobCardId(all),
    created_on: new Date().toISOString(),
  };
  all.push(newCard);
  writeAllJobCards(all);
  return newCard;
};

const getJobCardByIdLocally = (id: string): any | undefined =>
  readAllJobCards().find((c) => c.id === id);

// ─── interfaces ───────────────────────────────────────────────────────────

interface RawMaterialItem {
  id: string;
  item_code: string;
  source_warehouse: string;
  required_qty: number;
}

interface TimeLog {
  id: string;
  employee: string;
  from_time: Date | null;
  to_time: Date | null;
  completed_qty?: number;
}

interface SecondaryItem {
  id: string;
  item_code: string;
  source_warehouse: string;
  required_qty: number;
}

interface JobCardFormData {
  // Tab 0 — Details
  work_order: string;
  qty_to_manufacture: number;
  company: string;
  posting_date: Date | null;
  naming_series: string;
  pending_qty: number;
  total_completed_qty: number;
  operation: string;
  workstation_type: string;
  source_warehouse: string;
  workstation: string;
  wip_warehouse: string;
  items: RawMaterialItem[];
  quality_inspection_template: string;

  // Tab 1 — Scheduled Time
  expected_start_date: Date | null;
  expected_end_date: Date | null;
  for_quantity: number;
  hour_rate: number;

  // Tab 2 — Actual Time
  actual_start_date: Date | null;
  actual_end_date: Date | null;
  time_logs: TimeLog[];

  // Tab 3 — Secondary Items
  secondary_items: SecondaryItem[];

  // Tab 4 — More Info
  remarks: string;
  project: string;
  sequence_id: string;
  status: string;
  is_corrective_job_card: boolean;
  barcode: string;
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

const STATUS_OPTIONS = ["Open", "Work In Progress", "Completed", "On Hold", "Cancelled"];

const emptyMaterialItem = (): RawMaterialItem => ({
  id: Math.random().toString(36).slice(2),
  item_code: "",
  source_warehouse: "",
  required_qty: 0,
});

const emptyTimeLog = (): TimeLog => ({
  id: Math.random().toString(36).slice(2),
  employee: "",
  from_time: null,
  to_time: null,
});

const emptySecondaryItem = (): SecondaryItem => ({
  id: Math.random().toString(36).slice(2),
  item_code: "",
  source_warehouse: "",
  required_qty: 0,
});

const defaultFormData = (): JobCardFormData => ({
  work_order: "",
  qty_to_manufacture: 0,
  company: "",
  posting_date: new Date(),
  naming_series: "PO-JOB-.#####",
  pending_qty: 0,
  total_completed_qty: 0,
  operation: "",
  workstation_type: "",
  source_warehouse: "",
  workstation: "",
  wip_warehouse: "",
  items: [],
  quality_inspection_template: "",

  expected_start_date: null,
  expected_end_date: null,
  for_quantity: 0,
  hour_rate: 0,

  actual_start_date: null,
  actual_end_date: null,
  time_logs: [],

  secondary_items: [],

  remarks: "",
  project: "",
  sequence_id: "",
  status: "Open",
  is_corrective_job_card: false,
  barcode: "",
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

  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const [formData, setFormData] = useState<JobCardFormData>(defaultFormData());

  const tabs = [
    { id: 0, name: "Details", icon: <FaFileAlt size={14} /> },
    { id: 1, name: "Scheduled Time", icon: <FaCalendarAlt size={14} /> },
    { id: 2, name: "Actual Time", icon: <FaClock size={14} /> },
    { id: 3, name: "Secondary Items", icon: <FaBoxes size={14} /> },
    { id: 4, name: "More Info", icon: <FaListUl size={14} /> },
  ];

  // ─── load existing job card when editing ──────────────────────────────
  // Prefer data passed via navigation state (fast path from the list's row
  // click); fall back to local storage directly by id (e.g. deep link or
  // page refresh) since there is no API to re-fetch from.
  useEffect(() => {
    if (isEditMode && id) {
      const state = location.state as { jobCard?: any };
      if (state?.jobCard) {
        loadJobCardIntoForm(state.jobCard);
      } else {
        const stored = getJobCardByIdLocally(id);
        if (stored) loadJobCardIntoForm(stored);
      }
    }
  }, [id]);

  const loadJobCardIntoForm = (jc: any) => {
    setFormData((prev) => ({
      ...prev,
      work_order: jc.work_order || "",
      qty_to_manufacture: jc.qty_to_manufacture || 0,
      company: jc.company || "",
      posting_date: jc.posting_date ? new Date(jc.posting_date) : new Date(),
      naming_series: jc.naming_series || prev.naming_series,
      pending_qty: jc.pending_qty || 0,
      total_completed_qty: jc.total_completed_qty || 0,
      operation: jc.operation || "",
      workstation_type: jc.workstation_type || "",
      source_warehouse: jc.source_warehouse || "",
      workstation: jc.workstation || "",
      wip_warehouse: jc.wip_warehouse || "",
      items: jc.items || [],
      quality_inspection_template: jc.quality_inspection_template || "",
      expected_start_date: jc.expected_start_date ? new Date(jc.expected_start_date) : null,
      expected_end_date: jc.expected_end_date ? new Date(jc.expected_end_date) : null,
      for_quantity: jc.for_quantity || 0,
      hour_rate: jc.hour_rate || 0,
      actual_start_date: jc.actual_start_date ? new Date(jc.actual_start_date) : null,
      actual_end_date: jc.actual_end_date ? new Date(jc.actual_end_date) : null,
      time_logs: (jc.time_logs || []).map((l: any) => ({
        ...l,
        from_time: l.from_time ? new Date(l.from_time) : null,
        to_time: l.to_time ? new Date(l.to_time) : null,
      })),
      secondary_items: jc.secondary_items || [],
      remarks: jc.remarks || "",
      project: jc.project || "",
      sequence_id: jc.sequence_id || "",
      status: jc.status || "Open",
      is_corrective_job_card: !!jc.is_corrective_job_card,
      barcode: jc.barcode || "",
    }));
  };

  // ─── validation ────────────────────────────────────────────────────────

  const getValidationErrors = (step: number): { [key: string]: string } => {
    const newErrors: { [key: string]: string } = {};

    if (step === 0) {
      if (!formData.work_order.trim()) newErrors.work_order = "Work Order is required";
      if (!formData.company.trim()) newErrors.company = "Company is required";
      if (!formData.naming_series.trim()) newErrors.naming_series = "Naming Series is required";
      if (!formData.operation.trim()) newErrors.operation = "Operation is required";
      if (!formData.workstation.trim()) newErrors.workstation = "Workstation is required";
      if (!formData.wip_warehouse.trim()) newErrors.wip_warehouse = "WIP Warehouse is required";
    }

    return newErrors;
  };

  const getAllValidationErrors = (): ValidationError[] => {
    const allErrors: ValidationError[] = [];

    // Tab 0 — Details
    if (!formData.work_order.trim())
      allErrors.push({ field: "work_order", label: "Work Order", message: "Work Order is required", tabIndex: 0 });
    if (!formData.company.trim())
      allErrors.push({ field: "company", label: "Company", message: "Company is required", tabIndex: 0 });
    if (!formData.naming_series.trim())
      allErrors.push({ field: "naming_series", label: "Naming Series", message: "Naming Series is required", tabIndex: 0 });
    if (!formData.operation.trim())
      allErrors.push({ field: "operation", label: "Operation", message: "Operation is required", tabIndex: 0 });
    if (!formData.workstation.trim())
      allErrors.push({ field: "workstation", label: "Workstation", message: "Workstation is required", tabIndex: 0 });
    if (!formData.wip_warehouse.trim())
      allErrors.push({ field: "wip_warehouse", label: "WIP Warehouse", message: "WIP Warehouse is required", tabIndex: 0 });

    // Tab 1 — Scheduled Time
    if (formData.expected_start_date && formData.expected_end_date) {
      if (formData.expected_end_date < formData.expected_start_date) {
        allErrors.push({ field: "expected_end_date", label: "Expected End Date", message: "End date cannot be before start date", tabIndex: 1 });
      }
    }

    // Tab 2 — Actual Time
    formData.time_logs.forEach((log, i) => {
      if (log.from_time && log.to_time && log.to_time < log.from_time) {
        allErrors.push({ field: `time_log_${i}`, label: `Time Log ${i + 1}`, message: "To time cannot be before From time", tabIndex: 2 });
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
    if (nextTab <= 4) {
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
    if (type === "checkbox") {
      processedValue = (e.target as HTMLInputElement).checked;
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

  // ─── raw material items (Tab 0) ───────────────────────────────────────

  const addItem = () => {
    setFormData((prev) => ({ ...prev, items: [...prev.items, emptyMaterialItem()] }));
  };

  const removeItem = (itemId: string) => {
    setFormData((prev) => ({ ...prev, items: prev.items.filter((it) => it.id !== itemId) }));
  };

  const updateItem = (itemId: string, field: keyof RawMaterialItem, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === itemId ? { ...it, [field]: value } : it)),
    }));
  };

  // ─── time logs (Tab 2) ────────────────────────────────────────────────

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

  // ─── secondary items (Tab 3) ──────────────────────────────────────────

  const addSecondaryItem = () => {
    setFormData((prev) => ({ ...prev, secondary_items: [...prev.secondary_items, emptySecondaryItem()] }));
  };

  const removeSecondaryItem = (itemId: string) => {
    setFormData((prev) => ({
      ...prev,
      secondary_items: prev.secondary_items.filter((it) => it.id !== itemId),
    }));
  };

  const updateSecondaryItem = (itemId: string, field: keyof SecondaryItem, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      secondary_items: prev.secondary_items.map((it) =>
        it.id === itemId ? { ...it, [field]: value } : it
      ),
    }));
  };

  // ─── submit — saved to localStorage, no API ───────────────────────────

  const buildLocalPayload = () => ({
    work_order: formData.work_order,
    qty_to_manufacture: formData.qty_to_manufacture,
    company: formData.company,
    posting_date: formData.posting_date ? formData.posting_date.toISOString() : null,
    naming_series: formData.naming_series,
    pending_qty: formData.pending_qty,
    total_completed_qty: formData.total_completed_qty,
    operation: formData.operation,
    workstation_type: formData.workstation_type,
    source_warehouse: formData.source_warehouse,
    workstation: formData.workstation,
    wip_warehouse: formData.wip_warehouse,
    items: formData.items,
    quality_inspection_template: formData.quality_inspection_template,

    expected_start_date: formData.expected_start_date ? formData.expected_start_date.toISOString() : null,
    expected_end_date: formData.expected_end_date ? formData.expected_end_date.toISOString() : null,
    for_quantity: formData.for_quantity,
    hour_rate: formData.hour_rate,

    actual_start_date: formData.actual_start_date ? formData.actual_start_date.toISOString() : null,
    actual_end_date: formData.actual_end_date ? formData.actual_end_date.toISOString() : null,
    time_logs: formData.time_logs.map((log) => ({
      ...log,
      from_time: log.from_time ? log.from_time.toISOString() : null,
      to_time: log.to_time ? log.to_time.toISOString() : null,
    })),

    secondary_items: formData.secondary_items,

    remarks: formData.remarks,
    project: formData.project,
    sequence_id: formData.sequence_id,
    status: formData.status,
    is_corrective_job_card: formData.is_corrective_job_card,
    barcode: formData.barcode,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const allErrors = getAllValidationErrors();
    if (allErrors.length > 0) {
      setValidationErrors(allErrors);
      setShowValidationSummary(true);
      return;
    }

    setSaving(true);
    try {
      const payload = buildLocalPayload();
      saveJobCardLocally(payload, isEditMode ? id : undefined);
      navigate("/job-card");
    } catch (err) {
      console.error("Error saving job card locally:", err);
      alert("Failed to save job card");
    } finally {
      setSaving(false);
    }
  };

  const allValidationErrors = getAllValidationErrors();
  const hasAnyErrors = allValidationErrors.length > 0;

  return (
    <div className="jcf-page">

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

      {/* Header */}
      <div className="jcf-header-wrap">
        <div className="jcf-header-row">
          <button type="button" onClick={() => navigate("/job-card")} className="jcf-back-btn">
            <FaArrowLeft size={12} /> Back
          </button>
          <h1 className="jcf-title">
            {isEditMode ? "Edit Job Card" : "New Job Card"}
          </h1>

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
                      className={`jcf-tab-circle ${isActive ? "jcf-tab-circle-active" : ""} ${
                        tabStatus === "warning" && !isActive ? "jcf-tab-circle-warning" : ""
                      }`}
                    >
                      {tabStatus === "warning" && !isActive ? <FaExclamationTriangle size={14} /> : tab.id + 1}

                      {errorCount > 0 && !isActive && (
                        <div className="jcf-tab-error-badge">{errorCount}</div>
                      )}
                    </div>

                    <div className="jcf-tab-label-wrap">
                      <div className={`jcf-tab-step ${isActive ? "jcf-tab-step-active" : ""} ${
                        tabStatus === "warning" && !isActive ? "jcf-tab-step-warning" : ""
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
                  <div className="jcf-grid-2">
                    <div>
                      <label className="jcf-label">Work Order *</label>
                      <input
                        type="text"
                        name="work_order"
                        value={formData.work_order}
                        onChange={handleInputChange}
                        placeholder="e.g. WO-00012"
                        className={`jcf-input ${errors.work_order ? "jcf-input-error" : ""}`}
                      />
                      {errors.work_order && <span className="jcf-error-text">{errors.work_order}</span>}
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
                      />
                    </div>
                  </div>

                  <div className="jcf-grid-2">
                    <div>
                      <label className="jcf-label">Company *</label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        placeholder="Company name"
                        className={`jcf-input ${errors.company ? "jcf-input-error" : ""}`}
                      />
                      {errors.company && <span className="jcf-error-text">{errors.company}</span>}
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

                  <div className="jcf-field-block">
                    <label className="jcf-label">Naming Series *</label>
                    <select
                      name="naming_series"
                      value={formData.naming_series}
                      onChange={handleInputChange}
                      className={`jcf-input ${errors.naming_series ? "jcf-input-error" : ""}`}
                    >
                      <option value="PO-JOB-.#####">PO-JOB-.#####</option>
                    </select>
                    {errors.naming_series && <span className="jcf-error-text">{errors.naming_series}</span>}
                  </div>

                  <div className="jcf-grid-2 jcf-mb-20">
                    <div>
                      <label className="jcf-label">Pending Qty</label>
                      <input type="number" name="pending_qty" value={formData.pending_qty || ""} onChange={handleInputChange} placeholder="0" className="jcf-input" disabled />
                    </div>
                    <div>
                      <label className="jcf-label">Total Completed Qty</label>
                      <input type="number" name="total_completed_qty" value={formData.total_completed_qty || 0} onChange={handleInputChange} className="jcf-input" disabled />
                    </div>
                  </div>

                  <div className="jcf-section-title jcf-section-title-first"><FaCogs size={12} /> Operation & Materials</div>

                  <div className="jcf-grid-2">
                    <div>
                      <label className="jcf-label">Operation *</label>
                      <input
                        type="text"
                        name="operation"
                        value={formData.operation}
                        onChange={handleInputChange}
                        placeholder="e.g. Assembly"
                        className={`jcf-input ${errors.operation ? "jcf-input-error" : ""}`}
                      />
                      {errors.operation && <span className="jcf-error-text">{errors.operation}</span>}
                    </div>
                    <div>
                      <label className="jcf-label">Workstation Type</label>
                      <input
                        type="text"
                        name="workstation_type"
                        value={formData.workstation_type}
                        onChange={handleInputChange}
                        placeholder="Optional"
                        className="jcf-input"
                      />
                    </div>
                  </div>

                  <div className="jcf-grid-2">
                    <div>
                      <label className="jcf-label">Source Warehouse</label>
                      <input
                        type="text"
                        name="source_warehouse"
                        value={formData.source_warehouse}
                        onChange={handleInputChange}
                        placeholder="Optional"
                        className="jcf-input"
                      />
                    </div>
                    <div>
                      <label className="jcf-label">Workstation *</label>
                      <input
                        type="text"
                        name="workstation"
                        value={formData.workstation}
                        onChange={handleInputChange}
                        placeholder="e.g. Line 1"
                        className={`jcf-input ${errors.workstation ? "jcf-input-error" : ""}`}
                      />
                      {errors.workstation && <span className="jcf-error-text">{errors.workstation}</span>}
                    </div>
                  </div>

                  <div className="jcf-field-block jcf-mb-20">
                    <label className="jcf-label">WIP Warehouse *</label>
                    <input
                      type="text"
                      name="wip_warehouse"
                      value={formData.wip_warehouse}
                      onChange={handleInputChange}
                      placeholder="Work-in-progress warehouse"
                      className={`jcf-input ${errors.wip_warehouse ? "jcf-input-error" : ""}`}
                    />
                    {errors.wip_warehouse && <span className="jcf-error-text">{errors.wip_warehouse}</span>}
                  </div>

                  <div className="jcf-section-title"><FaBoxes size={12} /> Raw Materials</div>

                  <div className="jcf-table-wrap">
                    <table className="jcf-table">
                      <colgroup>
                        <col style={{ width: "36%" }} />
                        <col style={{ width: "32%" }} />
                        <col style={{ width: "20%" }} />
                        <col style={{ width: "12%" }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th>Item Code</th>
                          <th>Source Warehouse</th>
                          <th>Required Qty</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="jcf-table-empty">No rows</td>
                          </tr>
                        ) : (
                          formData.items.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <input
                                  type="text"
                                  value={item.item_code}
                                  onChange={(e) => updateItem(item.id, "item_code", e.target.value)}
                                  placeholder="Item code"
                                  className="jcf-cell-input"
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  value={item.source_warehouse}
                                  onChange={(e) => updateItem(item.id, "source_warehouse", e.target.value)}
                                  placeholder="Warehouse"
                                  className="jcf-cell-input"
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  value={item.required_qty || ""}
                                  onChange={(e) => updateItem(item.id, "required_qty", parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                  className="jcf-cell-input"
                                />
                              </td>
                              <td className="jcf-cell-center">
                                <button type="button" onClick={() => removeItem(item.id)} className="jcf-row-remove">
                                  <FaTrash size={11} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <button type="button" onClick={addItem} className="jcf-add-row-btn">
                    <FaPlus size={10} /> Add Row
                  </button>

                  <div className="jcf-field-block jcf-mt-20">
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
                </div>
              </div>
            )}

            {/* Tab 1 — Scheduled Time */}
            {activeTab === 1 && (
              <div className="jcf-fade-in">
                <div className="jcf-card">
                  <div className="jcf-section-title jcf-section-title-first"><FaCalendarAlt size={12} /> Expected Schedule</div>

                  <div className="jcf-grid-2">
                    <div>
                      <label className="jcf-label">Expected Start Date</label>
                      <DatePicker
                        selected={formData.expected_start_date}
                        onChange={(date: Date | null) => handleDateChange("expected_start_date", date)}
                        showTimeSelect
                        dateFormat="dd-MM-yyyy HH:mm"
                        placeholderText="Select start date & time"
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
                        placeholderText="Select end date & time"
                        className="jcf-date-input"
                      />
                      {errors.expected_end_date && <span className="jcf-error-text">{errors.expected_end_date}</span>}
                    </div>
                  </div>

                  <div className="jcf-grid-2">
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

                  {formData.expected_start_date && formData.expected_end_date && (
                    <div className="jcf-info-banner">
                      Scheduled from {formData.expected_start_date.toLocaleString()} to {formData.expected_end_date.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2 — Actual Time */}
            {activeTab === 2 && (
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
                </div>
              </div>
            )}

            {/* Tab 3 — Secondary Items */}
            {activeTab === 3 && (
              <div className="jcf-fade-in">
                <div className="jcf-card">
                  <div className="jcf-section-title jcf-section-title-first"><FaBoxes size={12} /> Secondary Items</div>
                  <p className="jcf-helper-text">
                    Items consumed as secondary/transfer materials for this operation, separate from the primary raw materials.
                  </p>

                  <div className="jcf-table-wrap">
                    <table className="jcf-table">
                      <colgroup>
                        <col style={{ width: "36%" }} />
                        <col style={{ width: "32%" }} />
                        <col style={{ width: "20%" }} />
                        <col style={{ width: "12%" }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th>Item Code</th>
                          <th>Source Warehouse</th>
                          <th>Required Qty</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.secondary_items.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="jcf-table-empty">No rows</td>
                          </tr>
                        ) : (
                          formData.secondary_items.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <input
                                  type="text"
                                  value={item.item_code}
                                  onChange={(e) => updateSecondaryItem(item.id, "item_code", e.target.value)}
                                  placeholder="Item code"
                                  className="jcf-cell-input"
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  value={item.source_warehouse}
                                  onChange={(e) => updateSecondaryItem(item.id, "source_warehouse", e.target.value)}
                                  placeholder="Warehouse"
                                  className="jcf-cell-input"
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  value={item.required_qty || ""}
                                  onChange={(e) => updateSecondaryItem(item.id, "required_qty", parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                  className="jcf-cell-input"
                                />
                              </td>
                              <td className="jcf-cell-center">
                                <button type="button" onClick={() => removeSecondaryItem(item.id)} className="jcf-row-remove">
                                  <FaTrash size={11} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <button type="button" onClick={addSecondaryItem} className="jcf-add-row-btn">
                    <FaPlus size={10} /> Add Row
                  </button>
                </div>
              </div>
            )}

            {/* Tab 4 — More Info */}
            {activeTab === 4 && (
              <div className="jcf-fade-in">
                <div className="jcf-card">
                  <div className="jcf-grid-2">
                    <div>
                      <label className="jcf-label">Status</label>
                      <select name="status" value={formData.status} onChange={handleInputChange} className="jcf-input">
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="jcf-label">Project</label>
                      <input
                        type="text"
                        name="project"
                        value={formData.project}
                        onChange={handleInputChange}
                        placeholder="Optional"
                        className="jcf-input"
                      />
                    </div>
                  </div>

                  <div className="jcf-grid-2">
                    <div>
                      <label className="jcf-label">Sequence ID</label>
                      <input
                        type="text"
                        name="sequence_id"
                        value={formData.sequence_id}
                        onChange={handleInputChange}
                        placeholder="Optional"
                        className="jcf-input"
                      />
                    </div>
                    <div>
                      <label className="jcf-label">Barcode</label>
                      <input
                        type="text"
                        name="barcode"
                        value={formData.barcode}
                        onChange={handleInputChange}
                        placeholder="Optional"
                        className="jcf-input"
                      />
                    </div>
                  </div>

                  <div className="jcf-field-block">
                    <label className="jcf-checkbox-label">
                      <input
                        type="checkbox"
                        name="is_corrective_job_card"
                        checked={formData.is_corrective_job_card}
                        onChange={handleInputChange}
                        className="jcf-checkbox"
                      />
                      Is Corrective Job Card
                    </label>
                  </div>

                  <div>
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
            {activeTab < 4 && (
              <button type="button" onClick={handleNext} className="jcf-btn-primary">
                Next →
              </button>
            )}
            {activeTab === 4 && (
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