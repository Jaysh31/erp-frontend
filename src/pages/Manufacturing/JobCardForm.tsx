import React, { useState, useEffect, useRef } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  FaArrowLeft, FaSave, FaSpinner, FaInfoCircle, FaExclamationTriangle,
  FaTimesCircle, FaClock,
   FaPlay, FaPause, FaCheck, FaUserPlus, FaTimes,
  FaBuilding, FaUser, FaUserCheck, FaExchangeAlt, FaWarehouse,
  FaTruck, FaMoneyBillWave,
  FaClipboardList, FaBoxes, FaIndustry, FaPlus,
  FaFileAlt,
  FaExclamationCircle
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

const formatTimestamp = (d: Date): string => d.toLocaleString('en-IN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true
});

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

interface SupplierContact {
  id: number;
  supplier_id: number;
  first_name?: string;
  last_name?: string;
  contact_name?: string;
  mobile_no?: string;
  email_id?: string;
  is_primary?: number;
  [key: string]: any;
}

interface SupplierOption {
  id: number;
  name: string;
  supplier_name: string;
  supplier_type?: string;
  supplier_group?: string;
  primary_address?: string;
  mobile_no?: string;
  email_id?: string;
  default_currency?: string;
  contacts?: SupplierContact[];
  [key: string]: any;
}

// ── Subcontracting Order (SCO) item, as returned inside `items` by
//    GET /subcontracting-order/job-card/:jobCardId. ─────────────────────
interface SubcontractingOrderApiItem {
  id: number;
  name?: string;
  subcontracting_order_id?: number;
  item_code: string;
  item_name: string;
  bom?: string | null;
  include_exploded_items?: number;
  schedule_date?: string | null;
  expected_delivery_date?: string | null;
  description?: string | null;
  image?: string | null;
  qty: number;
  received_qty?: number;
  returned_qty?: number;
  stock_uom?: string;
  uom?: string;
  conversion_factor?: number;
  rate?: number;
  amount?: number;
  rm_cost_per_qty?: number;
  service_cost_per_qty?: number;
  additional_cost_per_qty?: number;
  warehouse?: string | null;
  expense_account?: string | null;
  manufacturer?: string | null;
  manufacturer_part_no?: string | null;
  material_request?: string | null;
  material_request_item?: string | null;
  cost_center?: string | null;
  project?: string | null;
  job_card?: string | number | null;
  purchase_order_item?: string | null;
  [key: string]: any;
}

// ── Subcontracting Order (SCO), as returned by
//    GET /subcontracting-order/job-card/:jobCardId. This is the SCO
//    already linked to a job card whose `is_subcontracted` flag is 1 —
//    used to prefill the Subcontracting tab instead of starting blank. ──
interface SubcontractingOrderApi {
  id: number;
  name: string;
  title?: string;
  work_order_id?: string | number | null;
  job_card_id?: string | number | null;
  supplier_id?: number | string | null;
  supplier_name?: string;
  supplier_warehouse?: string;
  supplier_currency?: string;
  company?: string;
  transaction_date?: string | null;
  schedule_date?: string | null;
  cost_center?: string | null;
  set_warehouse?: string | null;
  set_reserve_warehouse?: string | null;
  total_qty?: number;
  total?: number;
  total_additional_costs?: number;
  status?: string;
  per_received?: number;
  remark?: string | null;
  items?: SubcontractingOrderApiItem[];
  [key: string]: any;
}

// ── Raw material line as it comes back on the job card record (from
//    /job-card and /job-card/:id) — this is the source data we prefill
//    the "Materials Sent to Vendor" table from. ─────────────────────────
interface JobCardRawItem {
  id?: number;
  item_code: string;
  item_name: string;
  uom?: string;
  stock_uom?: string;
  description?: string | null;
  required_qty?: number;
  consumed_qty?: number;
  transferred_qty?: number;
  source_warehouse?: string | null;
  allow_alternative_item?: number;
  [key: string]: any;
}

// ── Materials Sent to Vendor row — extended with all fields the
//    Subcontracting Order (SCO) API expects per item, so nothing is lost
//    when buildSubcontractingOrderPayload() runs. ───────────────────────
interface SubcontractingItem {
  id: string;
  item_code: string;
  item_name: string;
  quantity: number;
  uom: string;
  stock_uom?: string;
  rate: number;
  amount: number;
  warehouse?: string;
  bom?: string | null;
  description?: string;
  conversion_factor?: number;
  material_request?: string | null;
  material_request_item?: string | null;
  cost_center?: string;
  expense_account?: string;
  manufacturer?: string | null;
  manufacturer_part_no?: string | null;
  rm_cost_per_qty?: number;
  service_cost_per_qty?: number;
  additional_cost_per_qty?: number;
  expected_delivery_date?: string | null;
  // Links back to the originating job-card item row, if it came from there
  job_card_item_id?: number | string;
}

// ── A single GRN (Goods Receipt) entry recorded against the subcontracted
//    job card. Multiple entries can be logged over time (partial receipts)
//    until the full sent quantity has been accounted for. ────────────────
interface GrnEntry {
  id: string;
  received_qty: number;
  rejected_qty: number;
  remarks?: string;
  timestamp: string;
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
  job_type: 'internal' | 'subcontracting';
  supplier_id: string;
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
  grn_entries: GrnEntry[];
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
  onConfirm: (completedQty: number, lossQty: number, isPartial: boolean, remarks?: string) => void;
  totalQty: number;
  currentCompletedQty: number;
  currentLossQty: number;
  remainingQty: number;
  existingRemarks?: string;
}

const CompletionModal: React.FC<CompletionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  totalQty,
  currentCompletedQty,
  remainingQty,
  existingRemarks = "",
}) => {
  const [completedQty, setCompletedQty] = useState<string>("");
  const [lossQty, setLossQty] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [remarkHistory, setRemarkHistory] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setCompletedQty("");
      setLossQty("");
      setRemarks("");
      setError("");

      if (existingRemarks) {
        const lines = existingRemarks.split('\n').filter(line => line.trim());
        setRemarkHistory(lines);
      } else {
        setRemarkHistory([]);
      }
    }
  }, [isOpen, existingRemarks]);

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

    const isPartial = totalToProcess < remainingQty;

    let finalRemarks = remarkHistory.length > 0 ? remarkHistory.join('\n') : "";

    if (remarks.trim()) {
      const newRemark = `[${formatTimestamp(new Date())}] ${remarks.trim()}`;
      finalRemarks = finalRemarks ? `${finalRemarks}\n${newRemark}` : newRemark;
    }

    onConfirm(completed, loss, isPartial, finalRemarks || undefined);
    onClose();
  };

  const deleteRemark = (index: number) => {
    const updatedHistory = remarkHistory.filter((_, i) => i !== index);
    setRemarkHistory(updatedHistory);
  };

  const addRemark = () => {
    if (remarks.trim()) {
      const newRemark = `[${formatTimestamp(new Date())}] ${remarks.trim()}`;
      setRemarkHistory(prev => [...prev, newRemark]);
      setRemarks("");
    }
  };

  const handleRemarkKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addRemark();
    }
  };

  if (!isOpen) return null;

  const totalToProcess = (parseFloat(completedQty) || 0) + (parseFloat(lossQty) || 0);
  const isValid = totalToProcess > 0 && totalToProcess <= remainingQty;
  const isPartial = totalToProcess < remainingQty && totalToProcess > 0;

  return (
    <div className="jcf-modal-overlay" onClick={onClose}>
      <div className="jcf-validation-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "650px" }}>
        <div className="jcf-modal-header jcf-modal-header-success">
          <h2 className="jcf-modal-title-plain">
            <FaCheck style={{ color: "var(--success-color)", marginRight: "8px" }} />
            {isPartial ? 'Partial Job Completion' : 'Complete Job Card'}
          </h2>
          <button className="jcf-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="jcf-modal-body">
          <div className="jcf-completion-summary">
            {/* Three summary boxes at top */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                background: '#e3f2fd',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid #bbdefb'
              }}>
                <div style={{ fontSize: '12px', color: '#1565c0', fontWeight: '600' }}>Total Quantity</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0d47a1' }}>{totalQty}</div>
              </div>
              <div style={{
                background: '#e8f5e9',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid #c8e6c9'
              }}>
                <div style={{ fontSize: '12px', color: '#2e7d32', fontWeight: '600' }}>Already Completed</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1b5e20' }}>{currentCompletedQty}</div>
              </div>
              <div style={{
                background: '#fff3e0',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid #ffe0b2'
              }}>
                <div style={{ fontSize: '12px', color: '#e65100', fontWeight: '600' }}>Remaining to Process</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#bf360c' }}>{remainingQty}</div>
              </div>
            </div>

            {/* Process Now fields - Fixed to remove double box */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#333', display: 'block', marginBottom: '4px' }}>
                  Process Now - Completed:
                </label>
                <DigitInput
                  value={completedQty}
                  onChange={setCompletedQty}
                  placeholder="Enter completed qty"
                  maxLength={10}
                  allowDecimal={false}
                  max={remainingQty}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#333', display: 'block', marginBottom: '4px' }}>
                  Process Now - Loss/Scrap:
                </label>
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

            {/* Remarks Field with Add Button */}
            <div style={{
              borderTop: "1px solid var(--border-color)",
              paddingTop: "12px",
              marginTop: "8px"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: "500", color: "#333" }}>
                  <FaFileAlt size={12} style={{ marginRight: "4px" }} />
                  Add Remark
                </span>
                <button
                  type="button"
                  onClick={addRemark}
                  disabled={!remarks.trim()}
                  style={{
                    padding: "6px 12px",
                    background: remarks.trim() ? "var(--primary-color)" : "#ccc",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: remarks.trim() ? "pointer" : "not-allowed",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <FaPlus size={10} /> Add Remark
                </button>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  onKeyDown={handleRemarkKeyDown}
                  placeholder="Add a remark (e.g., quality issue, machine downtime...) - Press Enter to add"
                  className="jcf-input jcf-textarea"
                  rows={2}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: "1px solid var(--border-color)",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    resize: "vertical"
                  }}
                />
              </div>
            </div>

            {/* Remark History */}
            {remarkHistory.length > 0 && (
              <div style={{
                borderTop: "1px solid var(--border-color)",
                paddingTop: "12px",
                marginTop: "8px"
              }}>
                <span style={{ fontSize: "13px", fontWeight: "500", color: "#333", marginBottom: "8px", display: "block" }}>
                  <FaClipboardList size={12} style={{ marginRight: "4px" }} />
                  Remark History ({remarkHistory.length})
                </span>
                <div style={{
                  maxHeight: "120px",
                  overflowY: "auto",
                  border: "1px solid var(--border-color)",
                  borderRadius: "4px",
                  padding: "4px"
                }}>
                  {remarkHistory.map((remark, index) => (
                    <div key={index} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "6px 8px",
                      borderBottom: index < remarkHistory.length - 1 ? "1px solid var(--border-color)" : "none",
                      fontSize: "13px",
                      gap: "8px"
                    }}>
                      <span style={{ flex: 1, color: "#333", wordBreak: "break-word" }}>{remark}</span>
                      <button
                        type="button"
                        onClick={() => deleteRemark(index)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#dc3545",
                          cursor: "pointer",
                          padding: "2px 6px",
                          borderRadius: "3px",
                          fontSize: "12px",
                          display: "flex",
                          alignItems: "center"
                        }}
                        title="Delete this remark"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{
              borderTop: "1px solid var(--border-color)",
              paddingTop: "12px",
              marginTop: "8px",
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: "14px", fontWeight: "500", color: "#333" }}>This Session Total:</span>
              <span style={{
                fontSize: "16px",
                fontWeight: "bold",
                color: isValid ? "var(--success-color)" : "var(--danger-color)"
              }}>
                {totalToProcess > 0 ? totalToProcess : '0'} / {remainingQty} remaining
                {isValid && totalToProcess > 0 && ` (${isPartial ? 'Partial - ' + (remainingQty - totalToProcess) + ' remaining' : 'Complete'})`}
              </span>
            </div>

            {isPartial && isValid && totalToProcess > 0 && (
              <div style={{
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
              <div style={{
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
              <div style={{ marginTop: "8px", textAlign: "center", color: "var(--danger-color)", fontSize: "13px" }}>
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

// ─── Subcontracting GRN Modal ──────────────────────────────────────────
//    Mirrors the internal CompletionModal (totals + qty + notes) but for
//    logging a goods-receipt against a subcontracted job card. Several of
//    these can be recorded over time until the full quantity sent to the
//    vendor has been received back / rejected. ─────────────────────────
//
//    NOTE: `totalQty` here represents the Job Card's Qty To Manufacture
//    (not the sum of the materials sent to vendor) — the label reflects
//    that explicitly.

interface SubcontractGrnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (receivedQty: number, rejectedQty: number, remarks?: string) => void;
  totalQty: number;
  alreadyReceived: number;
  alreadyRejected: number;
  remainingQty: number;
  loading?: boolean;
}

const SubcontractGrnModal: React.FC<SubcontractGrnModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  totalQty,
  alreadyReceived,
  alreadyRejected,
  remainingQty,
  loading = false,
}) => {
  const [receivedQty, setReceivedQty] = useState<string>("");
  const [rejectedQty, setRejectedQty] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setReceivedQty("");
      setRejectedQty("");
      setRemarks("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalThisEntry = (parseFloat(receivedQty) || 0) + (parseFloat(rejectedQty) || 0);
  // NOTE: entries are no longer capped at remainingQty — extra/over-received
  // quantity (e.g. vendor sends back more good units than originally
  // planned) is allowed through. remainingQty is still shown for reference.
  const isValid = totalThisEntry > 0;
  const isPartial = totalThisEntry < remainingQty && totalThisEntry > 0;
  const isOverage = totalThisEntry > remainingQty;

  const handleConfirm = () => {
    const received = parseFloat(receivedQty) || 0;
    const rejected = parseFloat(rejectedQty) || 0;

    if (received < 0 || rejected < 0) {
      setError("Quantities cannot be negative");
      return;
    }
    if (received === 0 && rejected === 0) {
      setError("Enter a received or rejected quantity");
      return;
    }

    onConfirm(received, rejected, remarks.trim() || undefined);
  };

  return (
    <div className="jcf-modal-overlay" onClick={() => !loading && onClose()}>
      <div className="jcf-validation-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
        <div className="jcf-modal-header jcf-modal-header-success">
          <h2 className="jcf-modal-title-plain">
            <FaTruck style={{ color: "var(--success-color)", marginRight: "8px" }} />
            {isPartial ? 'Partial GRN Entry' : 'Record GRN Entry'}
          </h2>
          <button className="jcf-modal-close" onClick={onClose} disabled={loading}>×</button>
        </div>
        <div className="jcf-modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: '#e3f2fd', padding: '12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #bbdefb' }}>
              <div style={{ fontSize: '12px', color: '#1565c0', fontWeight: 600 }}>Qty To Manufacture</div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#0d47a1' }}>{totalQty}</div>
            </div>
            <div style={{ background: '#e8f5e9', padding: '12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #c8e6c9' }}>
              <div style={{ fontSize: '12px', color: '#2e7d32', fontWeight: 600 }}>Received So Far</div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1b5e20' }}>{alreadyReceived + alreadyRejected}</div>
            </div>
            <div style={{ background: '#fff3e0', padding: '12px', borderRadius: '8px', textAlign: 'center', border: '1px solid #ffe0b2' }}>
              <div style={{ fontSize: '12px', color: '#e65100', fontWeight: 600 }}>Remaining</div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#bf360c' }}>{remainingQty}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#333', display: 'block', marginBottom: '4px' }}>
                Received Qty (Good):
              </label>
              <DigitInput value={receivedQty} onChange={setReceivedQty} placeholder="0" maxLength={10} />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#333', display: 'block', marginBottom: '4px' }}>
                Rejected / Scrap Qty:
              </label>
              <DigitInput value={rejectedQty} onChange={setRejectedQty} placeholder="0" maxLength={10} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: '#333', display: 'block', marginBottom: '4px' }}>
              <FaFileAlt size={12} style={{ marginRight: '4px' }} /> Notes (optional)
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. inspection result, packaging condition..."
              className="jcf-input jcf-textarea"
              rows={2}
            />
          </div>

          <div style={{
            borderTop: "1px solid var(--border-color)",
            paddingTop: "12px",
            marginTop: "12px",
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: "14px", fontWeight: 500, color: "#333" }}>This Entry:</span>
            <span style={{ fontSize: "16px", fontWeight: 'bold', color: isValid ? "var(--success-color)" : "var(--danger-color)" }}>
              {totalThisEntry > 0 ? totalThisEntry : '0'} / {remainingQty} remaining
            </span>
          </div>

          {isOverage && (
            <div style={{ marginTop: "8px", background: "#fff3e0", padding: "8px 10px", borderRadius: "6px", color: "#e65100", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaInfoCircle size={14} /> This entry is more than the remaining quantity — the extra will be recorded as an overage.
            </div>
          )}

          {error && (
            <div style={{ marginTop: "8px", textAlign: "center", color: "var(--danger-color)", fontSize: "13px" }}>{error}</div>
          )}
        </div>
        <div className="jcf-modal-footer">
          <button className="jcf-btn-cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="jcf-btn-primary" onClick={handleConfirm} disabled={!isValid || loading}>
            {loading ? <FaSpinner className="jcf-spinning" /> : <FaCheck size={12} />} Save GRN Entry
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

// ─── Subcontract reasons (used inline on the page, not in a popup) ─────

const SUBCONTRACT_REASON_OPTIONS: { key: string; label: string }[] = [
  { key: 'machine_failure', label: 'Machine Failure' },
  { key: 'no_machine', label: 'No Machine Available' },
  { key: 'capacity_overflow', label: 'Capacity Overflow' },
  { key: 'specialized_process', label: 'Specialized Process' },
  { key: 'other', label: 'Other Reason' },
];

// Look up the human-readable label for a stored reason key (falls back to
// the raw key/string if it isn't one of the predefined options).
const getSubcontractReasonLabel = (key: string): string => {
  if (!key) return "Not specified";
  const found = SUBCONTRACT_REASON_OPTIONS.find((r) => r.key === key);
  return found ? found.label : key;
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
  job_type: 'internal',
  supplier_id: '',
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
  grn_entries: [],
});

// ── Map a job card's raw `items` (raw materials) array into
//    SubcontractingItem rows used by the "Materials Sent to Vendor" table. ──
const mapJobCardItemsToSubcontractingItems = (rawItems: JobCardRawItem[] | undefined | null): SubcontractingItem[] => {
  if (!Array.isArray(rawItems) || rawItems.length === 0) return [];
  return rawItems.map((it, idx) => ({
    id: it.id !== undefined && it.id !== null ? String(it.id) : `jc-item-${idx}-${Date.now()}`,
    item_code: it.item_code || "",
    item_name: it.item_name || "",
    quantity: it.required_qty ?? 0,
    uom: it.uom || it.stock_uom || "NOS",
    stock_uom: it.stock_uom || it.uom || "NOS",
    rate: 0,
    amount: 0,
    warehouse: it.source_warehouse || "",
    description: it.description || "",
    conversion_factor: 1,
    job_card_item_id: it.id,
  }));
};

// ── Map a Subcontracting Order's `items` array (from
//    GET /subcontracting-order/job-card/:jobCardId) into SubcontractingItem
//    rows used by the "Materials Sent to Vendor" table. When an SCO
//    already exists for this job card, this takes priority over the raw
//    job-card items so the form reflects what was actually sent/priced,
//    not just what's required. ──────────────────────────────────────────
const mapSCOItemsToSubcontractingItems = (scoItems: SubcontractingOrderApiItem[] | undefined | null): SubcontractingItem[] => {
  if (!Array.isArray(scoItems) || scoItems.length === 0) return [];
  return scoItems.map((it, idx) => ({
    id: it.id !== undefined && it.id !== null ? String(it.id) : `sco-item-${idx}-${Date.now()}`,
    item_code: it.item_code || "",
    item_name: it.item_name || "",
    quantity: it.qty ?? 0,
    uom: it.uom || it.stock_uom || "NOS",
    stock_uom: it.stock_uom || it.uom || "NOS",
    rate: it.rate ?? 0,
    amount: it.amount ?? ((it.qty ?? 0) * (it.rate ?? 0)),
    warehouse: it.warehouse || "",
    bom: it.bom ?? null,
    description: it.description || "",
    conversion_factor: it.conversion_factor ?? 1,
    material_request: it.material_request ?? null,
    material_request_item: it.material_request_item ?? null,
    cost_center: it.cost_center || "",
    expense_account: it.expense_account || "",
    manufacturer: it.manufacturer ?? null,
    manufacturer_part_no: it.manufacturer_part_no ?? null,
    rm_cost_per_qty: it.rm_cost_per_qty ?? it.rate ?? 0,
    service_cost_per_qty: it.service_cost_per_qty ?? 0,
    additional_cost_per_qty: it.additional_cost_per_qty ?? 0,
    expected_delivery_date: it.expected_delivery_date ?? null,
  }));
};

const JobCardForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = !!id && id !== "new";

  const [recordId, setRecordId] = useState<number | string | null>(null);
  const currentJobCardId: number | null = isEditMode && id
    ? (isNaN(Number(id)) ? null : Number(id))
    : (recordId !== null ? Number(recordId) : null);

  // ── Raw materials this job card uses/has, exactly as returned by the
  //    API's `items` array. Shown read-only in a "Raw Materials" card so
  //    the user can see what's required / consumed / transferred / left
  //    for this job card, regardless of Internal vs Subcontracting tab. ──
  const [rawMaterialItems, setRawMaterialItems] = useState<JobCardRawItem[]>([]);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState<JobCardFormData>(defaultFormData());
  const [, setJobCardDocName] = useState<string>("");
  const [workOrders] = useState<WorkOrderOption[]>([]);
  const [loadingWorkOrders] = useState(false);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());
  const [assigningEmployees, setAssigningEmployees] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isStartingJob, setIsStartingJob] = useState(false);
  const [woDetails] = useState<any>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedJobType, setSelectedJobType] = useState<'internal' | 'subcontracting'>('internal');

  // ── Subcontracting flag ─────────────────────────────────────────────
  const [isSubcontracted, setIsSubcontracted] = useState(false);

  // ── Suppliers (vendors for subcontracting) ──────────────────────────
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  // ── Subcontracting Order (SCO) already linked to this job card,
  //    fetched from GET /subcontracting-order/job-card/:jobCardId
  //    whenever is_subcontracted = 1. Tracks the SCO's own id/name so a
  //    second "Create" click updates it (PUT) instead of duplicating it. ──
  const [scoRecordId, setScoRecordId] = useState<number | null>(null);
  const [scoName, setScoName] = useState<string>("");
  const [loadingSCO, setLoadingSCO] = useState(false);

  // ── GRN (goods receipt) entry modal for subcontracting ──────────────
  const [showGrnModal, setShowGrnModal] = useState(false);
  const [recordingGrn, setRecordingGrn] = useState(false);

  // ── Job card's serial_and_batch_bundle, captured on load. Per the
  //    Subcontracting Receipt API, this only needs to be sent on the
  //    FIRST GRN entry recorded for a job card. ────────────────────────
  const [jcSerialAndBatchBundle, setJcSerialAndBatchBundle] = useState<string>("");

  const getRemainingQty = () => {
    return Math.max(0, (formData.qty_to_manufacture || formData.for_quantity || 0) -
      (formData.total_completed_qty || 0) - (formData.process_loss_qty || 0));
  };

  // Balance still to be consumed for a given raw material line
  // (required - consumed), floored at 0.
  const getRawMaterialBalance = (it: JobCardRawItem): number => {
    const required = it.required_qty ?? 0;
    const consumed = it.consumed_qty ?? 0;
    return Math.max(0, required - consumed);
  };

  // Total quantity sent to the vendor (sum of the Materials Sent table) —
  // used for the Materials Sent to Vendor table's own totals row.
  const getTotalSentQty = (): number => {
    return formData.material_sent_items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  // GRN receipts are tracked against the job card's overall Qty To
  // Manufacture, NOT the sum of raw materials sent to the vendor — the
  // vendor is expected to return that many finished/processed units.
  const getGrnBaseQty = (): number => {
    return formData.qty_to_manufacture || formData.for_quantity || 0;
  };

  const getGrnRemainingQty = (): number => {
    const total = getGrnBaseQty();
    return Math.max(0, total - (formData.received_qty || 0) - (formData.rejected_qty || 0));
  };

  // ── Fetch suppliers list (for the subcontracting Vendor dropdown) ──────
  const fetchSuppliers = async (): Promise<SupplierOption[]> => {
    try {
      const response = await api.get("/supplier");
      const raw = response.data;
      let list: SupplierOption[] = [];
      if (raw?.data?.records && Array.isArray(raw.data.records)) list = raw.data.records;
      else if (raw?.data && Array.isArray(raw.data)) list = raw.data;
      else if (Array.isArray(raw)) list = raw;
      return list;
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      return [];
    }
  };

  useEffect(() => {
    // Load suppliers once the Subcontracting tab is opened (lazy load)
    if (selectedJobType === 'subcontracting' && suppliers.length === 0 && !loadingSuppliers) {
      setLoadingSuppliers(true);
      fetchSuppliers().then((list) => {
        setSuppliers(list);
        setLoadingSuppliers(false);
      });
    }
  }, [selectedJobType]);

  // ── Auto-generate the Delivery Challan No. from the Job Card ID
  //    (e.g. Job Card #2555 -> "2555-01") instead of requiring manual
  //    entry. Only fills it in if it's not already set, so it never
  //    overwrites a value that came back from a saved job card / SCO. ──
  useEffect(() => {
    if (selectedJobType === 'subcontracting' && currentJobCardId && !formData.delivery_challan_no) {
      setFormData(prev => ({ ...prev, delivery_challan_no: `${currentJobCardId}-01` }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJobType, currentJobCardId]);

  // ── Fetch the Subcontracting Order (SCO) linked to this job card ──────
  //    GET /subcontracting-order/job-card/:jobCardId
  //    Called whenever the job card comes back with is_subcontracted = 1,
  //    so the Subcontracting tab is prefilled with the vendor, materials,
  //    and charges that were already sent, instead of showing a blank form.
  const fetchSubcontractingOrderByJobCard = async (jobCardId: number | string): Promise<SubcontractingOrderApi | null> => {
    try {
      const response = await api.get(`/subcontracting-order/job-card/${jobCardId}`);
      if (response.data?.success === 1 && response.data?.data) {
        const raw = response.data.data;
        // API may return either a single SCO object or an array with one record
        const sco: SubcontractingOrderApi = Array.isArray(raw) ? raw[0] : raw;
        return sco || null;
      }
      return null;
    } catch (err) {
      console.error("Error fetching subcontracting order for job card:", err);
      return null;
    }
  };

  // ── Populate the Subcontracting tab (vendor, materials, charges, PO)
  //    from an already-created Subcontracting Order tied to this job card.
  //    Also rolls up the SCO's own received/returned quantities (per
  //    item) into formData.received_qty/rejected_qty so the GRN stat
  //    chips reflect the server's real state after a reload, instead of
  //    resetting to 0 until a new GRN is logged in this session. ─────────
  const applySubcontractingOrderToForm = (sco: SubcontractingOrderApi) => {
    setScoRecordId(sco.id ?? null);
    setScoName(sco.name || "");

    const mappedItems = mapSCOItemsToSubcontractingItems(sco.items);

    const items = Array.isArray(sco.items) ? sco.items : [];
    const totalReceivedFromSCO = items.reduce((sum, it) => sum + (it.received_qty ?? 0), 0);
    // The SCO item schema doesn't carry a dedicated "rejected" quantity —
    // `returned_qty` is the closest equivalent (material sent back to us
    // after inspection) so it's used as the Rejected total here.
    const totalRejectedFromSCO = items.reduce((sum, it) => sum + (it.returned_qty ?? 0), 0);

    let mappedReceiptStatus: 'Pending' | 'Partial' | 'Completed' = 'Pending';
    if (sco.status === 'Completed' || (sco.per_received ?? 0) >= 100) mappedReceiptStatus = 'Completed';
    else if ((sco.per_received ?? 0) > 0 || totalReceivedFromSCO > 0 || totalRejectedFromSCO > 0) mappedReceiptStatus = 'Partial';

    setFormData((prev) => ({
      ...prev,
      supplier_id: sco.supplier_id !== undefined && sco.supplier_id !== null ? String(sco.supplier_id) : prev.supplier_id,
      subcontractor_name: sco.supplier_name || prev.subcontractor_name,
      subcontractor_address: sco.supplier_warehouse || prev.subcontractor_address,
      // The SCO's own item lines (with real vendor rates) take priority
      // over the raw job-card items prefill once an SCO exists.
      material_sent_items: mappedItems.length > 0 ? mappedItems : prev.material_sent_items,
      other_charges: sco.total_additional_costs ?? prev.other_charges,
      expected_return_date: sco.schedule_date ? new Date(sco.schedule_date) : prev.expected_return_date,
      subcontracting_notes: sco.remark || prev.subcontracting_notes,
      po_number: sco.name || prev.po_number,
      po_created: true,
      // Bind the GRN stat chips (Qty To Mfg / Received / Rejected) from
      // the Subcontracting Order's own data rather than only local state.
      received_qty: totalReceivedFromSCO,
      rejected_qty: totalRejectedFromSCO,
      receipt_status: mappedReceiptStatus,
    }));
  };

  const getSupplierPrimaryContact = (supplier: SupplierOption): SupplierContact | undefined => {
    if (!supplier.contacts || supplier.contacts.length === 0) return undefined;
    return supplier.contacts.find((c) => c.is_primary === 1) || supplier.contacts[0];
  };

  const handleSupplierSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const supplierId = e.target.value;
    if (!supplierId) {
      setFormData((prev) => ({
        ...prev,
        supplier_id: '',
        subcontractor_name: '',
        subcontractor_contact: '',
        subcontractor_address: '',
      }));
      return;
    }
    const supplier = suppliers.find((s) => String(s.id) === supplierId);
    if (!supplier) return;
    const primaryContact = getSupplierPrimaryContact(supplier);
    const contactNumber = primaryContact?.mobile_no || supplier.mobile_no || '';
    setFormData((prev) => ({
      ...prev,
      supplier_id: String(supplier.id),
      subcontractor_name: supplier.supplier_name || supplier.name || '',
      subcontractor_contact: contactNumber,
      subcontractor_address: supplier.primary_address || '',
    }));
  };

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
      if (response.data.success === 1) {
        const raw = response.data.data;
        const jc = Array.isArray(raw) ? raw[0] : raw;
        if (jc) await loadJobCardIntoForm(jc);
        else setApiError("Job card not found");
      } else setApiError("Failed to load job card details");
    } catch (err: any) { setApiError(err.response?.data?.message || "Failed to load job card"); }
  };

  const loadJobCardIntoForm = async (jc: any) => {
    setRecordId(jc.id ?? null);
    setJobCardDocName(jc.name || jc.job_card_id || "");

    // ── Determine subcontracted flag from API (is_subcontracted: 0 | 1) ──
    const subcontractedFlag = jc.is_subcontracted === 1 || jc.is_subcontracted === true;
    setIsSubcontracted(subcontractedFlag);
    setSelectedJobType(subcontractedFlag ? 'subcontracting' : 'internal');

    // ── Keep the job card's raw `items` (raw materials) as-is for the
    //    read-only "Raw Materials" display card. ──────────────────────
    setRawMaterialItems(Array.isArray(jc.items) ? jc.items : []);

    // ── Keep the job card's serial_and_batch_bundle for use on the first
    //    Subcontracting Receipt (GRN) entry. ──────────────────────────
    setJcSerialAndBatchBundle(jc.serial_and_batch_bundle || "");

    // ── Prefill "Materials Sent to Vendor" from the job card's own raw
    //    material `items` array (e.g. from /job-card or /job-card/:id). ──
    const materialItemsFromJobCard = mapJobCardItemsToSubcontractingItems(jc.items);

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
      remarks: jc.remarks || "",
      status: jc.status || "Open",
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
      job_type: subcontractedFlag ? 'subcontracting' : 'internal',
      // Auto-generate the delivery challan number from the job card id if
      // one hasn't already been set on this job card.
      delivery_challan_no: prev.delivery_challan_no || jc.delivery_challan_no || (jc.id ? `${jc.id}-01` : ""),
      // Only auto-fill if the user hasn't already built/edited a materials
      // list in this session — avoids clobbering edits on a re-fetch.
      material_sent_items: prev.material_sent_items.length > 0
        ? prev.material_sent_items
        : materialItemsFromJobCard,
    }));

    // ── If this job card is subcontracted, fetch its Subcontracting Order
    //    (GET /subcontracting-order/job-card/:jobCardId) and use it to
    //    prefill the vendor, priced materials, charges, and PO number —
    //    this takes priority over the raw job-card items prefill above. ──
    if (subcontractedFlag) {
      const jobCardIdForSCO = jc.id ?? currentJobCardId;
      if (jobCardIdForSCO) {
        setLoadingSCO(true);
        try {
          const sco = await fetchSubcontractingOrderByJobCard(jobCardIdForSCO);
          if (sco) applySubcontractingOrderToForm(sco);
        } finally {
          setLoadingSCO(false);
        }
      }
    }

    const employeeListFromJc: any[] = Array.isArray(jc.employees)
      ? jc.employees
      : Array.isArray(jc.assigned_employees)
        ? jc.assigned_employees
        : [];
    const assignedIdsFromJc: number[] = employeeListFromJc.length > 0
      ? employeeListFromJc.map((e: any) => (typeof e === "object" ? e.id : e)).filter((v: any) => v !== undefined && v !== null)
      : jc.assigned_emp_id
        ? [jc.assigned_emp_id]
        : [];

    if (assignedIdsFromJc.length > 0) {
      try {
        const empList = await fetchEmployees();
        setEmployees(empList);
        const assignedEmps = empList.filter((emp) => assignedIdsFromJc.includes(emp.id));
        if (assignedEmps.length > 0) {
          setFormData((prev) => ({ ...prev, assigned_employees: assignedEmps.map((emp) => getEmployeeCode(emp)) }));
        }
      } catch (err) { console.error("Error loading assigned employee(s):", err); }
    }

    if (jc.actual_start_date && !jc.actual_end_date) {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - new Date(jc.actual_start_date).getTime()) / 1000)));
      setTimerRunning(jc.status === "Work In Progress");
    }
  };

  // ── Job type tab switching: switches immediately, no confirmation
  //    popup. The reason for subcontracting (if any) is picked inline on
  //    the page inside the Subcontracting section. ─────────────────────
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
    if (!currentJobCardId) {
      const selected = employees.filter((emp) => selectedEmployeeIds.has(String(emp.id)));
      setFormData((prev) => ({ ...prev, assigned_employees: selected.map((emp) => getEmployeeCode(emp)) }));
      setShowEmployeeModal(false);
      return;
    }
    setAssigningEmployees(true);
    setApiError(null);
    try {
      const employeeIds = Array.from(selectedEmployeeIds)
        .map((empId) => Number(empId))
        .filter((n) => !isNaN(n));

      if (employeeIds.length === 0) {
        setFormData((prev) => ({ ...prev, assigned_employees: [] }));
        setShowEmployeeModal(false);
        return;
      }

      const response = await api.put("/job-card/assign-employee", {
        id: currentJobCardId,
        employee_ids: employeeIds,
      });
      if (response.data.success !== 1) throw new Error(response.data?.message || "Failed to assign employees");

      const selected = employees.filter((emp) => selectedEmployeeIds.has(String(emp.id)));
      setFormData((prev) => ({ ...prev, assigned_employees: selected.map((emp) => getEmployeeCode(emp)) }));
      setShowEmployeeModal(false);
      setSuccessMessage("Employee(s) assigned successfully!");
      setShowSuccessModal(true);
    } catch (err: any) { setApiError(err.response?.data?.message || "Failed to assign employees"); }
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
      if (isEditMode && currentJobCardId) {
        payload.id = currentJobCardId;
        response = await api.put("/job-card", payload);
      } else {
        response = await api.put("/job-card", payload);
        if (response.data.success === 1) {
          const newJobCard = response.data.data;
          setRecordId(newJobCard.id); setJobCardDocName(newJobCard.name);
          navigate(`/job-cards/${newJobCard.id}`, { replace: true, state: { jobCard: newJobCard } });
        }
      }
      if (response.data.success !== 1) throw new Error(response.data?.message || "Failed to start job");
      setFormData((prev) => ({ ...prev, actual_start_date: new Date(), status: "Work In Progress" }));
      setTimerRunning(true);
      if (isEditMode && id) fetchJobCardById(id);
    } catch (err: any) { setApiError(err.response?.data?.message || "Failed to start job"); }
    finally { setIsStartingJob(false); }
  };

  const handlePauseJob = async () => {
    setIsStartingJob(true); setApiError(null);
    try {
      const payload = buildApiPayload(); payload.status = "On Hold"; payload.is_paused = 1;
      if (isEditMode && currentJobCardId) {
        payload.id = currentJobCardId;
        const response = await api.put("/job-card", payload);
        if (response.data.success !== 1) throw new Error(response.data?.message || "Failed to pause job");
      }
      setTimerRunning(false); setFormData((prev) => ({ ...prev, status: "On Hold" }));
      if (isEditMode && id) fetchJobCardById(id);
    } catch (err: any) { setApiError(err.response?.data?.message || "Failed to pause job"); }
    finally { setIsStartingJob(false); }
  };

  const handleCompleteJobClick = () => setShowCompletionModal(true);

  const handleCompletionConfirm = async (completedQty: number, lossQty: number, isPartial: boolean, remarks?: string) => {
    setIsStartingJob(true);
    setApiError(null);
    try {
      const payload = buildApiPayload();

      const newTotalCompleted = (formData.total_completed_qty || 0) + completedQty;
      const newTotalLoss = (formData.process_loss_qty || 0) + lossQty;
      const newPendingQty = Math.max(0, (formData.qty_to_manufacture || formData.for_quantity || 0) - newTotalCompleted - newTotalLoss);

      if (remarks && remarks.trim()) {
        payload.remarks = remarks;
      } else if (formData.remarks && formData.remarks.trim()) {
        payload.remarks = formData.remarks;
      } else {
        payload.remarks = "";
      }

      if (isPartial && newPendingQty > 0) {
        payload.status = "Work In Progress";
        payload.actual_end_date = null;
      } else {
        payload.status = "Completed";
        payload.actual_end_date = formatDateTime(new Date());
      }

      payload.total_completed_qty = newTotalCompleted;
      payload.process_loss_qty = newTotalLoss;
      payload.pending_qty = newPendingQty;

      if (isEditMode && currentJobCardId) {
        payload.id = currentJobCardId;
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
        ...(isPartial ? {} : { actual_end_date: new Date() }),
        remarks: payload.remarks || prev.remarks
      }));

      setShowCompletionModal(false);

      if (isPartial) {
        setSuccessMessage(`Processed ${completedQty} units (${lossQty} loss). ${newPendingQty} units remaining.`);
      } else {
        setSuccessMessage("Job Card completed successfully!");
      }
      setShowSuccessModal(true);

      if (isEditMode && id) {
        fetchJobCardById(id);
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
      if (!isEditMode || !currentJobCardId) throw new Error("No job card to update");
      payload.id = currentJobCardId;
      payload.remarks = formData.remarks || "";

      const response = await api.put("/job-card", payload);
      if (response.data.success !== 1) throw new Error(response.data?.message || "Failed to update job card");
      setSuccessMessage("Job Card updated successfully!"); setShowSuccessModal(true);
      if (id) fetchJobCardById(id);
    } catch (err: any) { setApiError(err.response?.data?.message || "Failed to update job card"); }
    finally { setSaving(false); }
  };

  const buildApiPayload = () => {
    const timeRequired = formData.expected_start_date && formData.expected_end_date
      ? Math.max(0, Math.round((formData.expected_end_date.getTime() - formData.expected_start_date.getTime()) / 60000)) : 0;
    const payload: any = {
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
      // ── manufactured_qty mirrors total_completed_qty (units actually
      //    produced/manufactured so far equal what's been marked completed). ──
      manufactured_qty: formData.total_completed_qty,
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
      is_subcontracted: selectedJobType === 'subcontracting' ? 1 : 0,
      track_semi_finished_goods: 0,
      project: formData.project || "",
      remarks: formData.remarks || "",
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

    if (isEditMode && currentJobCardId) {
      payload.id = currentJobCardId;
    } else if (currentJobCardId) {
      payload.id = currentJobCardId;
    }
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
      payload.remarks = formData.remarks || "";

      const response = await api.put("/job-card", payload);
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

  // ── Build & submit the /api/subcontracting-order payload, including the
  //    full `items` array carried over from the job card / materials table.
  //    When an SCO already exists for this job card (scoRecordId set), the
  //    payload carries its id so the caller can PUT an update instead of
  //    POSTing a duplicate order. ─────────────────────────────────────────
  const buildSubcontractingOrderPayload = () => {
    const scheduleDate = formatDateOnly(formData.expected_return_date) || formatDateOnly(formData.expected_end_date);

    const payload: any = {
      title: `Subcontracting Order - ${formData.subcontractor_name || formData.item_name || 'Job Card'}`,
      work_order_id: formData.work_order || null,
      job_card_id: currentJobCardId,
      naming_series: "SCO-.YYYY.-",
      purchase_order: null,
      supplier_id: formData.supplier_id ? Number(formData.supplier_id) : null,
      supplier_name: formData.subcontractor_name || "",
      supplier_warehouse: formData.subcontractor_address || "",
      supplier_currency: "INR",
      company: formData.company || "",
      transaction_date: formatDateOnly(new Date()),
      schedule_date: scheduleDate,
      amended_from: null,
      cost_center: "",
      set_warehouse: formData.source_warehouse || "",
      set_reserve_warehouse: formData.wip_warehouse || "",
      reserve_stock: 1,
      distribute_additional_costs_based_on: "Qty",
      total_additional_costs: (formData.transport_cost || 0) + (formData.other_charges || 0),
      status: "Draft",
      per_received: 0,
      letter_head: null,
      remark: formData.subcontracting_notes && formData.subcontracting_notes.trim()
        ? formData.subcontracting_notes
        : `Subcontracting for job card ${currentJobCardId ?? ""}${formData.subcontract_reason ? ` - Reason: ${getSubcontractReasonLabel(formData.subcontract_reason)}` : ""}`,
      modified_by: "Administrator",
      // ── The materials table (prefilled from the job card's own `items`
      //    array, or from an existing SCO) is sent as the SCO's item lines. ──
      items: formData.material_sent_items.map((item) => ({
        item_code: item.item_code,
        item_name: item.item_name,
        bom: item.bom ?? null,
        include_exploded_items: 0,
        schedule_date: scheduleDate,
        description: item.description || "",
        image: null,
        qty: item.quantity,
        received_qty: 0,
        returned_qty: 0,
        stock_uom: item.stock_uom || item.uom,
        uom: item.uom,
        conversion_factor: item.conversion_factor ?? 1,
        rate: item.rate,
        amount: item.amount,
        rm_cost_per_qty: item.rm_cost_per_qty ?? item.rate,
        service_cost_per_qty: item.service_cost_per_qty ?? 0,
        additional_cost_per_qty: item.additional_cost_per_qty ?? 0,
        warehouse: item.warehouse || formData.source_warehouse || "",
        expense_account: item.expense_account || "",
        manufacturer: item.manufacturer ?? null,
        manufacturer_part_no: item.manufacturer_part_no ?? null,
        material_request: item.material_request ?? null,
        material_request_item: item.material_request_item ?? null,
        cost_center: item.cost_center || "",
        job_card: currentJobCardId,
        purchase_order_item: null,
      })),
    };

    // ── If an SCO already exists for this job card, include its id so a
    //    PUT call updates it in place instead of creating a duplicate. ──
    if (scoRecordId) {
      payload.id = scoRecordId;
      payload.name = scoName || undefined;
    }

    return payload;
  };

  // ── Build & submit the /api/subcontracting-receipt (GRN) payload. This
  //    records material received back from the vendor against the
  //    finished/production item of this job card (NOT the raw materials
  //    sent out — those are tracked separately via the SCO's own items).
  //
  //    Field sourcing:
  //      - item_code / item_name  -> job card's production_item / item_name
  //      - bom                    -> job card's bom_no
  //      - job_card                -> current job card id
  //      - subcontracting_order    -> id of the SCO created for this job card
  //      - subcontracting_order_item -> id of the first line item on that
  //        SCO (formData.material_sent_items[0].id, which holds the SCO
  //        item's own id once the order has been submitted and re-fetched)
  //      - rm_cost_per_qty / service_cost_per_qty / additional_cost_per_qty
  //        -> derived by spreading the Materials total / Service Charge /
  //        (Transport + Other Charges) evenly across the Qty To Manufacture
  //      - rm_supp_cost            -> rm_cost_per_qty * this entry's received_qty
  //      - serial_and_batch_bundle -> only sent on the FIRST GRN entry for
  //        this job card, taken from the job card's own value
  //    Adjust these mappings if your backend expects different sourcing
  //    (e.g. real warehouse/cost-center IDs instead of names). ───────────
  const buildSubcontractingReceiptPayload = (receivedQty: number, rejectedQty: number, remarksNote?: string) => {
    const now = new Date();
    const grnBaseQty = getGrnBaseQty();

    const materialTotal = getMaterialTotal();
    const rmCostPerQty = grnBaseQty > 0 ? materialTotal / grnBaseQty : 0;
    const serviceCostPerQty = grnBaseQty > 0 ? (formData.service_charge || 0) / grnBaseQty : 0;
    const additionalCostPerQty = grnBaseQty > 0 ? ((formData.transport_cost || 0) + (formData.other_charges || 0)) / grnBaseQty : 0;
    const rate = rmCostPerQty + serviceCostPerQty + additionalCostPerQty;
    const amount = rate * grnBaseQty;
    const rmSuppCost = rmCostPerQty * receivedQty;

    const primarySentItem = formData.material_sent_items[0];
    const subcontractingOrderItemId = primarySentItem?.id && !isNaN(Number(primarySentItem.id))
      ? Number(primarySentItem.id)
      : null;

    const isFirstGrnEntry = formData.grn_entries.length === 0;

    const receiptItem: any = {
      item_code: formData.production_item || formData.item_name || "",
      item_name: formData.item_name || formData.production_item || "",
      type: "Finished Goods",
      received_qty: receivedQty,
      qty: grnBaseQty,
      rejected_qty: rejectedQty,
      returned_qty: 0,
      process_loss_qty: 0,
      stock_uom: "Nos",
      conversion_factor: 1,
      rate: Number(rate.toFixed(2)),
      amount: Number(amount.toFixed(2)),
      landed_cost_voucher_amount: 0,
      rm_cost_per_qty: Number(rmCostPerQty.toFixed(2)),
      service_cost_per_qty: Number(serviceCostPerQty.toFixed(2)),
      additional_cost_per_qty: Number(additionalCostPerQty.toFixed(2)),
      secondary_items_cost_per_qty: 0,
      rm_supp_cost: Number(rmSuppCost.toFixed(2)),
      warehouse: formData.target_warehouse || formData.source_warehouse || "",
      rejected_warehouse: formData.source_warehouse || "",
      subcontracting_order: scoRecordId,
      subcontracting_order_item: subcontractingOrderItemId,
      job_card: currentJobCardId,
      bom: formData.bom_no || null,
      include_exploded_items: 0,
      quality_inspection: null,
      schedule_date: formatDateOnly(formData.expected_return_date) || formatDateOnly(now),
      reference_name: null,
      serial_and_batch_bundle: isFirstGrnEntry ? (jcSerialAndBatchBundle || null) : null,
      use_serial_batch_fields: 0,
      rejected_serial_and_batch_bundle: null,
      serial_no: null,
      rejected_serial_no: null,
      batch_no: null,
      manufacturer: null,
      manufacturer_part_no: null,
      expense_account: null,
      service_expense_account: null,
      cost_center: null,
      project: formData.project || null,
    };

    const totalDoneAfterThis = (formData.received_qty || 0) + (formData.rejected_qty || 0) + receivedQty + rejectedQty;

    const payload: any = {
      modified_by: "Administrator",
      title: `Subcontracting Receipt - ${formData.subcontractor_name || "Vendor"}`,
      naming_series: "SCR-.YYYY.-",
      supplier: formData.supplier_id ? Number(formData.supplier_id) : null,
      supplier_name: formData.subcontractor_name || "",
      supplier_delivery_note: formData.delivery_challan_no || null,
      company: formData.company || "",
      posting_date: formatDateOnly(now),
      posting_time: `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`,
      set_posting_time: 1,
      is_return: 0,
      return_against: null,
      cost_center: null,
      project: formData.project || null,
      set_warehouse: formData.target_warehouse || formData.source_warehouse || null,
      rejected_warehouse: formData.source_warehouse || null,
      supplier_warehouse: formData.subcontractor_address || null,
      in_words: null,
      bill_no: null,
      bill_date: null,
      supplier_address: formData.subcontractor_address || null,
      contact_person: null,
      address_display: null,
      contact_display: null,
      contact_mobile: formData.subcontractor_contact || null,
      contact_email: null,
      shipping_address: null,
      shipping_address_display: null,
      billing_address: null,
      billing_address_display: null,
      distribute_additional_costs_based_on: "Qty",
      total_additional_costs: (formData.transport_cost || 0) + (formData.other_charges || 0),
      // ── Individual charge fields, straight from the Service Charges UI. ──
      service_charges: formData.service_charge || 0,
      transport_charges: formData.transport_cost || 0,
      other_charges: formData.other_charges || 0,
      // ── The Subcontracting Order this receipt is against (its own id,
      //    e.g. 19 from POST /subcontracting-order's response, held in
      //    scoRecordId once the order has been submitted to the vendor). ──
      subcontracting_order_id: scoRecordId,
      amended_from: null,
      range: null,
      represents_company: null,
      status: grnBaseQty > 0 && totalDoneAfterThis >= grnBaseQty ? "Completed" : "Draft",
      per_returned: 0,
      remarks: remarksNote || "Material received back from vendor.",
      transporter_name: null,
      lr_no: null,
      lr_date: null,
      items: [receiptItem],
    };

    return payload;
  };

  // ── Combined submit: updates the Job Card (marks it subcontracted, with
  //    the selected reason recorded in remarks) AND creates/updates its
  //    linked Subcontracting Order in one action. ─────────────────────
  const handleSubmitSubcontracting = async () => {
    if (!formData.supplier_id || !formData.subcontractor_name.trim()) {
      setApiError("Please select a Vendor / Supplier before submitting");
      return;
    }
    if (!formData.subcontract_reason) {
      setApiError("Please select a reason for subcontracting before submitting");
      return;
    }
    if (formData.material_sent_items.length === 0) {
      setApiError("No materials found to send — this job card has no raw material items");
      return;
    }

    setSaving(true);
    setApiError(null);
    try {
      const reasonLabel = getSubcontractReasonLabel(formData.subcontract_reason);
      const remarkLine = `[${formatTimestamp(new Date())}] Subcontracted - Reason: ${reasonLabel}`;
      const updatedRemarks = formData.remarks ? `${formData.remarks}\n${remarkLine}` : remarkLine;

      // 1. Update the job card itself (marks is_subcontracted = 1)
      if (isEditMode && currentJobCardId) {
        const jcPayload = buildApiPayload();
        jcPayload.id = currentJobCardId;
        jcPayload.is_subcontracted = 1;
        jcPayload.remarks = updatedRemarks;
        const jcResponse = await api.put("/job-card", jcPayload);
        if (jcResponse.data.success !== 1) {
          throw new Error(jcResponse.data?.message || "Failed to update job card");
        }
      }

      // 2. Create/update the linked Subcontracting Order
      const scoPayload = buildSubcontractingOrderPayload();
      const scoResponse = scoRecordId
        ? await api.put("/subcontracting-order", scoPayload)
        : await api.post("/subcontracting-order", scoPayload);

      if (scoResponse.data?.success === 0) {
        throw new Error(scoResponse.data?.message || `Failed to ${scoRecordId ? "update" : "create"} Subcontracting Order`);
      }

      const scoNameFromResponse = scoResponse.data?.data?.name || scoResponse.data?.name;
      const scoIdFromResponse = scoResponse.data?.data?.id;
      setScoRecordId(scoIdFromResponse ?? scoRecordId);
      setScoName(scoNameFromResponse || scoName);
      setIsSubcontracted(true);
      setFormData((prev) => ({
        ...prev,
        po_created: true,
        po_number: scoNameFromResponse || prev.po_number,
        remarks: updatedRemarks,
      }));

      setSuccessMessage("Subcontract submitted. You can now record GRN entries as materials come back.");
      setShowSuccessModal(true);

      if (isEditMode && id) fetchJobCardById(id);
    } catch (err: any) {
      setApiError(err.response?.data?.message || err.message || "Failed to submit subcontracting");
    } finally {
      setSaving(false);
    }
  };

  // ── Record a GRN entry: opens from the "Record GRN Entry" button and,
  //    on confirm, (1) submits a Subcontracting Receipt to the vendor-side
  //    API, then (2) rolls the received/rejected quantities up onto the
  //    job card itself (as total_completed_qty / process_loss_qty /
  //    pending_qty — the same fields the internal completion flow uses,
  //    since job-card has no dedicated received_qty/rejected_qty columns),
  //    then (3) appends the entry locally so the GRN history table shows
  //    it. Multiple entries can be added over time until the full
  //    quantity is accounted for. ─────────────────────────────────────
  const handleGrnConfirm = async (receivedQty: number, rejectedQty: number, remarksNote?: string) => {
    const timestamp = formatTimestamp(new Date());
    const newEntry: GrnEntry = {
      id: String(Date.now()),
      received_qty: receivedQty,
      rejected_qty: rejectedQty,
      remarks: remarksNote,
      timestamp,
    };

    const newReceivedTotal = (formData.received_qty || 0) + receivedQty;
    const newRejectedTotal = (formData.rejected_qty || 0) + rejectedQty;
    const grnBaseQty = getGrnBaseQty();
    const doneSoFar = newReceivedTotal + newRejectedTotal;
    const newStatus: 'Pending' | 'Partial' | 'Completed' =
      grnBaseQty > 0 && doneSoFar >= grnBaseQty ? 'Completed' : doneSoFar > 0 ? 'Partial' : 'Pending';

    // Received units count as production output completed; rejected units
    // count as process loss — mirrors the internal "Process Production"
    // flow so the job card's own progress numbers stay in sync with GRN.
    const newTotalCompleted = newReceivedTotal;
    const newProcessLoss = newRejectedTotal;
    const newPendingQty = Math.max(0, grnBaseQty - newTotalCompleted - newProcessLoss);
    const newJcStatus = grnBaseQty > 0 && (newTotalCompleted + newProcessLoss) >= grnBaseQty ? "Completed" : "Work In Progress";

    setRecordingGrn(true);
    setApiError(null);
    try {
      const grnNote = `[${timestamp}] GRN: Received ${receivedQty}, Rejected ${rejectedQty}${remarksNote ? ` - ${remarksNote}` : ""}`;
      const updatedRemarks = formData.remarks ? `${formData.remarks}\n${grnNote}` : grnNote;

      // 1. Submit the Subcontracting Receipt (GRN) to the vendor-side API
      const receiptPayload = buildSubcontractingReceiptPayload(receivedQty, rejectedQty, remarksNote);
      const receiptResponse = await api.post("/subcontracting-receipt", receiptPayload);
      if (receiptResponse.data?.success === 0) {
        throw new Error(receiptResponse.data?.message || "Failed to record Subcontracting Receipt");
      }

      // 2. Reflect the running totals onto the job card itself. Only the
      //    job-card table's own columns are sent here (total_completed_qty
      //    / process_loss_qty / pending_qty / status) — received_qty /
      //    rejected_qty / receipt_status are NOT job-card columns and are
      //    tracked in local state + the Subcontracting Order instead.
      if (isEditMode && currentJobCardId) {
        const payload = buildApiPayload();
        payload.id = currentJobCardId;
        payload.total_completed_qty = newTotalCompleted;
        payload.process_loss_qty = newProcessLoss;
        payload.pending_qty = newPendingQty;
        payload.status = newJcStatus;
        payload.remarks = updatedRemarks;
        if (newJcStatus === "Completed") {
          payload.actual_end_date = formatDateTime(new Date());
        }

        const jcResponse = await api.put("/job-card", payload);
        if (jcResponse.data.success !== 1) {
          throw new Error(jcResponse.data?.message || "Failed to update job card with GRN totals");
        }
      }

      setFormData((prev) => ({
        ...prev,
        grn_entries: [...prev.grn_entries, newEntry],
        received_qty: newReceivedTotal,
        rejected_qty: newRejectedTotal,
        receipt_status: newStatus,
        total_completed_qty: newTotalCompleted,
        process_loss_qty: newProcessLoss,
        pending_qty: newPendingQty,
        status: newJcStatus,
        remarks: updatedRemarks,
      }));

      setShowGrnModal(false);
      setSuccessMessage(`GRN recorded: ${receivedQty} received, ${rejectedQty} rejected.`);
      setShowSuccessModal(true);

      if (isEditMode && id) fetchJobCardById(id);
    } catch (err: any) {
      setApiError(err.response?.data?.message || err.message || "Failed to record GRN entry");
    } finally {
      setRecordingGrn(false);
    }
  };

  // ── Read-only "Raw Materials" card: shows exactly what raw materials
  //    this job card uses/has, straight from the API's `items` array —
  //    required qty, consumed so far, transferred, balance left, and
  //    which warehouse they're sourced from. ─────────────────────────
  const renderRawMaterialsSection = () => {
    if (rawMaterialItems.length === 0) return null;

    const totals = rawMaterialItems.reduce(
      (acc, it) => {
        acc.required += it.required_qty ?? 0;
        acc.consumed += it.consumed_qty ?? 0;
        acc.transferred += it.transferred_qty ?? 0;
        acc.balance += getRawMaterialBalance(it);
        return acc;
      },
      { required: 0, consumed: 0, transferred: 0, balance: 0 }
    );

    return (
      <div className="jcf-card jcf-raw-materials-card">
        <div className="jcf-card-header">
          <FaBoxes size={14} /> Raw Materials Assigned
          <span
            className="jcf-status-badge jcf-status-open"
            style={{ marginLeft: "8px" }}
          >
            {rawMaterialItems.length} item{rawMaterialItems.length > 1 ? "s" : ""}
          </span>
        </div>
        <div className="jcf-table-wrap">
          <table className="jcf-subcontracting-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item Code</th>
                <th>Item Name</th>
                <th>UOM</th>
                <th>Required Qty</th>
                <th>Transferred Qty</th>
                <th>Balance</th>
                <th>Source Warehouse</th>
              </tr>
            </thead>
            <tbody>
              {rawMaterialItems.map((it, index) => {
                const balance = getRawMaterialBalance(it);
                const fullyConsumed = (it.required_qty ?? 0) > 0 && balance === 0;
                return (
                  <tr key={it.id ?? `${it.item_code}-${index}`}>
                    <td>{index + 1}</td>
                    <td>{it.item_code}</td>
                    <td>{it.item_name}</td>
                    <td>{it.uom || it.stock_uom || "-"}</td>
                    <td className="jcf-cell-amount">{it.required_qty ?? 0}</td>
                    <td className="jcf-cell-amount">{it.transferred_qty ?? 0}</td>
                    <td className="jcf-cell-amount">
                      <span
                        style={{
                          color: fullyConsumed ? "var(--success-color)" : "var(--info-color)",
                          fontWeight: 600,
                        }}
                      >
                        {balance}
                      </span>
                    </td>
                    <td>{it.source_warehouse || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ textAlign: "right", fontWeight: "bold" }}>
                  Totals
                </td>
                <td style={{ fontWeight: "bold" }}>{totals.required}</td>
                <td style={{ fontWeight: "bold" }}>{totals.consumed}</td>
                <td style={{ fontWeight: "bold" }}>{totals.transferred}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  // ── Subcontracting workflow: Time Schedule + Reason (combined, single
  //    row) -> Vendor (single row) -> Materials (read-only, auto-filled)
  //    -> Submit Subcontract -> Charges + GRN receipts (only once the
  //    subcontract order has actually been submitted to the vendor). ────
  const renderSubcontractingSection = () => {
    if (selectedJobType !== 'subcontracting') return null;

    const grnRemaining = getGrnRemainingQty();
    const grnBaseQty = getGrnBaseQty();
    const totalSentQty = getTotalSentQty();

    return (
      <div className="jcf-subcontracting-section">
        {/* Time Schedule + Reason for Subcontracting — combined into one
            compact single row to save vertical space. Delivery Challan
            No. is auto-generated from the Job Card ID and read-only. */}
        <div className="jcf-card" style={{ padding: '12px 16px' }}>
          <div className="jcf-card-header" style={{ marginBottom: '10px' }}>
            <FaClock size={14} /> Time Schedule &amp; Reason
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <div>
              <label className="jcf-label">Reason *</label>
              <select
                value={formData.subcontract_reason}
                onChange={(e) => setFormData(prev => ({ ...prev, subcontract_reason: e.target.value }))}
                className="jcf-input"
              >
                <option value="">Select a reason</option>
                {SUBCONTRACT_REASON_OPTIONS.map((r) => (
                  <option key={r.key} value={r.key}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="jcf-label">Start Date</label>
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
              <label className="jcf-label">End Date</label>
              <DatePicker
                selected={formData.actual_end_date}
                onChange={(date: Date | null) => handleDateChange("actual_end_date", date)}
                showTimeSelect
                dateFormat="dd-MM-yyyy HH:mm"
                placeholderText="Not completed"
                className="jcf-date-input"
              />
            </div>
            <div>
              <label className="jcf-label">Delivery Challan No.</label>
              <input
                type="text"
                value={formData.delivery_challan_no}
                readOnly
                className="jcf-input"
                style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
                title="Auto-generated from Job Card ID"
              />
            </div>
          </div>
        </div>

        {/* Vendor / Supplier + Contact + Address — combined into one row */}
        <div className="jcf-card jcf-vendor-card" style={{ padding: '12px 16px' }}>
          <div className="jcf-card-header" style={{ marginBottom: '10px' }}>
            <FaBuilding size={14} /> Subcontractor / Vendor
            {loadingSCO && (
              <span className="jcf-status-badge jcf-status-pending" style={{ marginLeft: "8px" }}>
                <FaSpinner className="jcf-spinning" size={10} /> Loading vendor details...
              </span>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1.6fr', gap: '12px' }}>
            <div>
              <label className="jcf-label">Vendor / Supplier *</label>
              <select
                value={formData.supplier_id}
                onChange={handleSupplierSelect}
                className="jcf-input"
              >
                <option value="">{loadingSuppliers ? "Loading suppliers..." : "Select Supplier"}</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.supplier_name || s.name}{s.supplier_group ? ` (${s.supplier_group})` : ""}
                  </option>
                ))}
              </select>
              {!loadingSuppliers && suppliers.length === 0 && (
                <span className="jcf-error-text">No suppliers found. Please add one in Suppliers first.</span>
              )}
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
              <label className="jcf-label">Vendor Address</label>
              <input
                type="text"
                name="subcontractor_address"
                value={formData.subcontractor_address}
                onChange={handleInputChange}
                className="jcf-input"
                placeholder="Full address"
              />
            </div>
          </div>
        </div>

        <div className="jcf-card jcf-materials-card">
          <div className="jcf-card-header">
            <FaWarehouse size={14} /> Materials Sent to Vendor
            <span className="jcf-status-badge jcf-status-open" style={{ marginLeft: "8px" }}>
              {formData.material_sent_items.length} item{formData.material_sent_items.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="jcf-table-wrap">
            <table className="jcf-subcontracting-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Qty</th>
                  <th>UOM</th>
                  <th>Amount (₹)</th>
                  <th>From Warehouse</th>
                </tr>
              </thead>
              <tbody>
                {formData.material_sent_items.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                      No raw material items found on this job card.
                    </td>
                  </tr>
                ) : (
                  formData.material_sent_items.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.item_code || "-"}</td>
                      <td>{item.item_name || "-"}</td>
                      <td className="jcf-cell-amount">{item.quantity}</td>
                      <td>{item.uom}</td>
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
                    </tr>
                  ))
                )}
              </tbody>
              {formData.material_sent_items.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total</td>
                    <td style={{ fontWeight: 'bold' }}>{totalSentQty}</td>
                    <td></td>
                    <td style={{ fontWeight: 'bold' }}>₹{getMaterialTotal().toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Service Charges — hidden until the Subcontracting Order has
            actually been submitted to the vendor (formData.po_created).
            Once submitted, this card (and the GRN card below it) appear
            so charges/receipts can be recorded against the live order. */}
        {formData.po_created && (
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
        )}

        {/* GRN / Material Receipt — only shown once the subcontract has
            actually been submitted (PO / SCO created). Tracked against the
            Job Card's Qty To Manufacture. Multiple entries can be logged
            over time until the full quantity is accounted for. ────────── */}
        {formData.po_created && (
          <div className="jcf-card jcf-receipt-card">
            <div className="jcf-card-header">
              <FaTruck size={14} /> Material Receipt (GRN)
              <span className={`jcf-status-badge jcf-status-${formData.receipt_status.toLowerCase()}`} style={{ marginLeft: "8px" }}>
                {formData.receipt_status}
              </span>
            </div>

            <div className="jcf-grn-stats">
              <div className="jcf-stat-chip">
                <span className="jcf-stat-label">Qty To Mfg</span>
                <span className="jcf-stat-value">{grnBaseQty}</span>
              </div>
              <div className="jcf-stat-chip">
                <span className="jcf-stat-label">Received</span>
                <span className="jcf-stat-value" style={{ color: "var(--success-color)" }}>{formData.received_qty || 0}</span>
              </div>
              <div className="jcf-stat-chip">
                <span className="jcf-stat-label">Rejected</span>
                <span className="jcf-stat-value" style={{ color: "var(--danger-color)" }}>{formData.rejected_qty || 0}</span>
              </div>
              <div className="jcf-stat-chip">
                <span className="jcf-stat-label">Remaining</span>
                <span className="jcf-stat-value" style={{ color: "var(--info-color)" }}>{grnRemaining}</span>
              </div>
            </div>

            {formData.grn_entries.length > 0 && (
              <div className="jcf-table-wrap" style={{ marginTop: '12px' }}>
                <table className="jcf-subcontracting-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Received</th>
                      <th>Rejected</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.grn_entries.map((g, idx) => (
                      <tr key={g.id}>
                        <td>{idx + 1}</td>
                        <td>{g.timestamp}</td>
                        <td className="jcf-cell-amount" style={{ color: "var(--success-color)" }}>{g.received_qty}</td>
                        <td className="jcf-cell-amount" style={{ color: "var(--danger-color)" }}>{g.rejected_qty}</td>
                        <td>{g.remarks || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ marginTop: '14px' }}>
              {grnRemaining > 0 ? (
                <button type="button" className="jcf-btn-success" onClick={() => setShowGrnModal(true)}>
                  <FaPlus size={12} /> Record GRN Entry
                </button>
              ) : (
                <div className="jcf-info-banner">
                  <FaCheck size={14} /> All quantity has been received back from the vendor.
                </div>
              )}
            </div>
          </div>
        )}
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
        existingRemarks={formData.remarks}
      />
      <SubcontractGrnModal
        isOpen={showGrnModal}
        onClose={() => setShowGrnModal(false)}
        onConfirm={handleGrnConfirm}
        totalQty={getGrnBaseQty()}
        alreadyReceived={formData.received_qty || 0}
        alreadyRejected={formData.rejected_qty || 0}
        remainingQty={getGrnRemainingQty()}
        loading={recordingGrn}
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
          {isSubcontracted && (
            <span className="jcf-status-badge jcf-status-completed" style={{ marginLeft: "8px" }}>
              <FaExchangeAlt size={10} /> Subcontracted
            </span>
          )}
          {apiError && <div className="jcf-error-pill"><FaExclamationTriangle size={11} />{apiError}</div>}
          {hasAnyErrors && <div className="jcf-error-pill"><FaExclamationTriangle size={11} />{allValidationErrors.length} missing field(s)</div>}
        </div>
      </div>

      <div className="jcf-container">
        <form onSubmit={handleSubmit}>
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
                {/* Compact single-row summary: Work Order / Qty / Posting Date
                    plus the Pending / Completed / Loss stats — replaces the
                    two full-width grids that used to take up a lot of space. */}
                <div className="jcf-quick-info-row">
                  <div className="jcf-quick-info-item" style={{ flexBasis: '0px' }}>
                    <label className="jcf-label">Work Order *</label>
                    {isEditMode ? (
                      <div className="jcf-quick-static">{formData.work_order}{woDetails?.item_name && ` — ${woDetails.item_name}`}</div>
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
                  <div className="jcf-quick-info-item">
                    <label className="jcf-label">Qty To Mfg</label>
                    <DigitInput value={String(formData.qty_to_manufacture)} onChange={(val) => handleNumberChange('qty_to_manufacture', val)} placeholder="0" maxLength={10} disabled={isEditMode} />
                  </div>
                  <div className="jcf-quick-info-item">
                    <label className="jcf-label">Posting Date</label>
                    <DatePicker selected={formData.posting_date} onChange={(date: Date | null) => handleDateChange("posting_date", date)} dateFormat="dd-MM-yyyy" className="jcf-date-input" />
                  </div>
                  <div className="jcf-quick-info-divider" />
                  <div className="jcf-quick-info-item jcf-quick-info-stat">
                    <label className="jcf-label">Pending Qty</label>
                    <div className="jcf-quick-static">{remainingQty}</div>
                  </div>
                  <div className="jcf-quick-info-item jcf-quick-info-stat">
                    <label className="jcf-label">Completed</label>
                    <div className="jcf-quick-static" style={{ color: "var(--success-color)" }}>{formData.total_completed_qty || 0}</div>
                  </div>
                  <div className="jcf-quick-info-item jcf-quick-info-stat">
                    <label className="jcf-label">Loss</label>
                    <div className="jcf-quick-static" style={{ color: "var(--danger-color)" }}>{formData.process_loss_qty || 0}</div>
                  </div>
                </div>

                {/* Time Schedule — for Internal jobs only. For Subcontracting
                    jobs, this is merged into the "Time Schedule & Reason"
                    single row above the Vendor card instead. */}
                {selectedJobType !== 'subcontracting' && (
                  <>
                    <div className="jcf-section-title"><FaClock size={12} /> Time Schedule</div>
                    <div className="jcf-grid-2 jcf-mb-20">
                      <div><label className="jcf-label"> Start Date</label><DatePicker selected={formData.actual_start_date} onChange={(date: Date | null) => handleDateChange("actual_start_date", date)} showTimeSelect dateFormat="dd-MM-yyyy HH:mm" placeholderText="Not started" className="jcf-date-input" /></div>
                      <div><label className="jcf-label"> End Date</label><DatePicker selected={formData.actual_end_date} onChange={(date: Date | null) => handleDateChange("actual_end_date", date)} showTimeSelect dateFormat="dd-MM-yyyy HH:mm" placeholderText="Not completed" className="jcf-date-input" /></div>
                    </div>
                  </>
                )}
              </div>

              {/* Conditionally render raw materials only for internal jobs */}
              {selectedJobType !== 'subcontracting' && renderRawMaterialsSection()}

              {renderSubcontractingSection()}

              {/* Remarks — moved to the end of the page */}
              <div className="jcf-card">
                <div className="jcf-card-header"><FaFileAlt size={14} /> Remarks</div>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Any additional notes for this job card..."
                  className="jcf-input jcf-textarea"
                />
              </div>

              {!isEditMode && (
                <div className="jcf-footer-row"><button type="submit" disabled={saving} className="jcf-btn-primary jcf-btn-submit" style={{ opacity: saving ? 0.6 : 1 }}>{saving && <FaSpinner className="jcf-spinning" />}<FaSave /> Create Job Card</button></div>
              )}
            </div>

            <aside className="jcf-sidebar">
              <div className="jcf-sidebar-card">
                <div className="jcf-sidebar-timer"><span className="jcf-timer-label"><FaClock size={11} /> ELAPSED TIME</span><span className="jcf-timer-value">{formatElapsed(elapsedSeconds)}</span></div>
                <div className="jcf-sidebar-status"><span className="jcf-status-label">Status</span><span className={`jcf-status-badge jcf-status-${formData.status.replace(/\s/g, '-').toLowerCase()}`}>{formData.status}</span></div>

                {/* Subcontract Details — reason (picked inline on the page)
                    + selected vendor. Read-only summary, subcontracting only. */}
                {selectedJobType === 'subcontracting' && (
                  <div className="jcf-sidebar-section">
                    <div className="jcf-sidebar-section-title"><FaExclamationCircle size={12} /> Subcontract Details</div>
                    <div className="jcf-progress-stats">
                      <div className="jcf-progress-row">
                        <span>Reason:</span>
                        <span className="jcf-progress-value">{getSubcontractReasonLabel(formData.subcontract_reason)}</span>
                      </div>
                      <div className="jcf-progress-row">
                        <span>Vendor:</span>
                        <span className="jcf-progress-value">{formData.subcontractor_name || "Not selected"}</span>
                      </div>
                      <div className="jcf-progress-row">
                        <span>PO / SCO:</span>
                        <span className="jcf-progress-value">{formData.po_number || "Not submitted"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedJobType !== 'subcontracting' && (
                  <div className="jcf-sidebar-section">
                    <div className="jcf-sidebar-section-title"><FaUserCheck size={12} /> Assigned Employees{formData.assigned_employees.length > 0 && <span className="jcf-assigned-count">{formData.assigned_employees.length}</span>}</div>
                    {formData.assigned_employees.length > 0 ? (
                      <div className="jcf-assigned-list">{getSelectedEmployeeDetails().map((emp, idx) => (<div key={idx} className="jcf-assigned-employee-item"><span className="jcf-assigned-employee-tag"><FaUser size={10} /> {emp.name} ({emp.id})</span><button type="button" className="jcf-remove-employee-btn" onClick={() => removeEmployee(emp.code)} title="Remove employee" disabled={jobCompleted}><FaTimes size={10} /></button></div>))}</div>
                    ) : (<div className="jcf-sidebar-empty">No employees assigned</div>)}
                  </div>
                )}

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
                  {selectedJobType !== 'subcontracting' && (
                    <>
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
                    </>
                  )}
                  {isEditMode && selectedJobType === 'subcontracting' && !formData.po_created && (
                    <button type="button" className="jcf-btn-primary jcf-btn-block" onClick={handleSubmitSubcontracting} disabled={saving}>
                      {saving ? <FaSpinner className="jcf-spinning" /> : <FaSave size={11} />}
                      Submit Subcontract
                    </button>
                  )}
                  {isEditMode && selectedJobType === 'subcontracting' && formData.po_created && (
                    <>
                      <div className="jcf-status-done jcf-btn-block">
                        <FaCheck size={11} /> Subcontract Submitted
                      </div>
                      <button type="button" className="jcf-btn-secondary jcf-btn-block" onClick={handleSubmitSubcontracting} disabled={saving}>
                        {saving ? <FaSpinner className="jcf-spinning" /> : <FaSave size={11} />}
                        Update Subcontract
                      </button>
                    </>
                  )}
                  {isEditMode && selectedJobType !== 'subcontracting' && (
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