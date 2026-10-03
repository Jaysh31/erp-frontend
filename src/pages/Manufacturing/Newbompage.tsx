import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { fetchBOMDetailPageData } from "../../services/erpApi";
import {
  ArrowLeft,
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
  ExternalLink,
  DollarSign,
  Eye, // 🆕 Added for Success Modal "View" button
} from "lucide-react";
import "./Newbompage.css";
import api from "../../../src/services/api";

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
  type: "success" | "error" | "info";
  title: string;
  message: string;
}

interface DeleteModal {
  isOpen: boolean;
  type: "component" | "operation";
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

// 🆕 Metadata about the currently selected "Item to Manufacture" so the field
//    can always render its label even if that item is missing from the
//    (group-filtered) dropdown list.
interface ManufactureItemMeta {
  item_code: string;
  item_name: string;
  item_group: string;
  stock_uom?: string;
}

// 🆕 State shape for the success modal shown after a successful save.
interface SuccessModalState {
  isOpen: boolean;
  title: string;
  message: string;
  details: { label: string; value: string | number }[];
}

// Reads the UOM from whatever field the API happens to return
const getItemUom = (item: any): string =>
  item?.stock_uom || item?.uom || item?.stockUom || "";

// 🆕 Normalizes an item group string for fuzzy, case-insensitive compare
const normalizeGroup = (s: any): string =>
  String(s || "").trim().toLowerCase().replace(/[\s_-]+/g, "");

// 🆕 Extracts an item array from any of the common API response shapes.
const extractItems = (payload: any): Item[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.records)) return payload.records;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

// ─── SearchableSelect Component (portal-based, never clipped) ────────────────

interface SearchableSelectProps {
  options: any[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  getOptionLabel: (option: any) => string;
  getOptionValue: (option: any) => string;
  filterKeys?: string[];
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  loading = false,
  className = "",
  getOptionLabel,
  getOptionValue,
  filterKeys = ["item_code", "item_name"],
}) => {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => getOptionValue(opt) === value);
  // 🆕 Fall back to the raw value when no matching option exists, so the field
  //    is never blank (e.g. the item is missing from the filtered list).
  const displayValue = isFocused
    ? search
    : selectedOption
    ? getOptionLabel(selectedOption)
    : value || "";

  const filteredOptions = search
    ? options.filter((opt) =>
        filterKeys.some((key) =>
          String(opt[key] ?? "").toLowerCase().includes(search.toLowerCase())
        )
      )
    : options;

  // 🆕 Always blur the input when closing the menu so the next click reliably
  //    re-triggers onFocus (which resets the search and shows all options).
  const closeMenu = () => {
    setIsOpen(false);
    setIsFocused(false);
    setSearch("");
    setHighlightIndex(-1);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const updatePosition = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < 240 && spaceAbove > spaceBelow;
    const width = Math.max(rect.width, 240);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));

    const cs = getComputedStyle(el);
    const v = (name: string, fallback: string) =>
      cs.getPropertyValue(name).trim() || fallback;

    const style: any = {
      position: "fixed",
      left,
      width,
      "--ss-bg": v("--card-bg", "#ffffff"),
      "--ss-border": v("--border-color", "#e5e7eb"),
      "--ss-text": v("--text-primary", "#111827"),
      "--ss-muted": v("--text-secondary", "#6b7280"),
      "--ss-primary": v("--primary-color", "#2563eb"),
    };

    if (openUp) {
      style.bottom = window.innerHeight - rect.top + 4;
      style.maxHeight = Math.max(120, Math.min(260, spaceAbove - 12));
    } else {
      style.top = rect.bottom + 4;
      style.maxHeight = Math.max(120, Math.min(260, spaceBelow - 12));
    }
    setMenuStyle(style as React.CSSProperties);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      )
        return;
      closeMenu();
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!isOpen || highlightIndex < 0) return;
    dropdownRef.current
      ?.querySelector<HTMLElement>(`[data-idx="${highlightIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex, isOpen]);

  const handleSelect = (option: any) => {
    onChange(getOptionValue(option));
    closeMenu();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && filteredOptions[highlightIndex]) {
        handleSelect(filteredOptions[highlightIndex]);
      }
    } else if (e.key === "Escape" || e.key === "Tab") {
      closeMenu();
    }
  };

  return (
    <div ref={containerRef} className={`nbom-searchable-select ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={(e) => {
          // 🆕 Defensive: if the input was showing the label (i.e. `isFocused`
          //    was false) and the browser prepended the selected label to the
          //    typed characters, strip the label so the user starts fresh.
          const rawVal = e.target.value;
          const selectedLabel = selectedOption ? getOptionLabel(selectedOption) : "";
          let cleanVal = rawVal;
          if (!isFocused && selectedLabel && rawVal.startsWith(selectedLabel)) {
            cleanVal = rawVal.slice(selectedLabel.length);
          }
          setSearch(cleanVal);
          setIsFocused(true);
          setIsOpen(true);
          setHighlightIndex(0);
        }}
        onFocus={() => {
          setIsFocused(true);
          setIsOpen(true);
          setSearch("");
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Search..."}
        disabled={disabled}
        autoComplete="off"
      />
      {isOpen &&
        !disabled &&
        createPortal(
          <div ref={dropdownRef} className="nbom-ss-dropdown" style={menuStyle}>
            {loading ? (
              <div className="nbom-ss-empty">Loading...</div>
            ) : filteredOptions.length === 0 ? (
              <div className="nbom-ss-empty">No results found</div>
            ) : (
              filteredOptions.map((option, idx) => {
                const isHighlighted = idx === highlightIndex;
                const isSelected = getOptionValue(option) === value;
                return (
                  <div
                    key={getOptionValue(option)}
                    data-idx={idx}
                    className={`nbom-ss-item ${isSelected ? "is-selected" : ""} ${
                      isHighlighted ? "is-highlighted" : ""
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setHighlightIndex(idx)}
                  >
                    {getOptionLabel(option)}
                  </div>
                );
              })
            )}
          </div>,
          document.body
        )}
    </div>
  );
};

// ─── DigitInput Component ────────────────────────────────────────────────────

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
    const val = e.target.value.replace(/[^0-9.]/g, "");
    if (maxLength && val.length > maxLength) return;
    onChange(val);
  };

  return (
    <div className={`nbom-num ${disabled ? "nbom-num--disabled" : ""} ${className}`}>
      {label && <label className="nbom-num__label">{label}</label>}
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onWheel={(e) => e.currentTarget.blur()}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className="nbom-num__field"
        inputMode="decimal"
        autoComplete="off"
      />
    </div>
  );
};

// ─── Shared atoms ─────────────────────────────────────────────────────────────

const Label: React.FC<{ text: string; required?: boolean; info?: boolean }> = ({
  text,
  required,
  info,
}) => (
  <span className="nbom-label">
    {text}
    {required && <span className="nbom-label__req">*</span>}
    {info && <span className="nbom-label__info">?</span>}
  </span>
);

const Checkbox: React.FC<{
  label: string;
  hint?: string;
  checked?: boolean;
  onChange?: () => void;
}> = ({ label, hint, checked = false, onChange }) => (
  <div className="nbom-check-row">
    <input type="checkbox" checked={checked} onChange={onChange ?? (() => {})} />
    <div>
      <div className="nbom-check-row__label">{label}</div>
      {hint && <div className="nbom-check-row__hint">{hint}</div>}
    </div>
  </div>
);

// ─── Toast Component ─────────────────────────────────────────────────────────

const ToastContainer: React.FC<{
  toasts: Toast[];
  removeToast: (id: string) => void;
}> = ({ toasts, removeToast }) => (
  <div className="nbom-toast-container">
    {toasts.map((toast) => (
      <div key={toast.id} className={`nbom-toast nbom-toast--${toast.type}`}>
        <div className="nbom-toast-icon">
          {toast.type === "success" && <CheckCircle size={16} />}
          {toast.type === "error" && <AlertTriangle size={16} />}
          {toast.type === "info" && <InfoIcon size={16} />}
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
      <div className="nbom-delete-modal" onClick={(e) => e.stopPropagation()}>
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
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── 🆕 Full-Screen Loader Overlay ─────────────────────────────────────────
//  A centered modal-style loader used during create/update/delete operations.

const LoaderOverlay: React.FC<{
  isOpen: boolean;
  message?: string;
  subtitle?: string;
}> = ({ isOpen, message = "Please wait...", subtitle }) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="nbom-loader-overlay"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 20000,
        padding: "20px",
      }}
    >
      <div
        className="nbom-loader-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "32px 40px",
          minWidth: "280px",
          maxWidth: "360px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.25)",
          textAlign: "center",
        }}
      >
        <div
          className="nbom-loader-spinner"
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            border: "4px solid #e5e7eb",
            borderTopColor: "#6366f1",
            animation: "nbom-spin 0.9s linear infinite",
          }}
        />
        <div
          className="nbom-loader-message"
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "#111827",
          }}
        >
          {message}
        </div>
        {subtitle && (
          <div
            className="nbom-loader-subtitle"
            style={{
              fontSize: "13px",
              color: "#6b7280",
              marginTop: "-8px",
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      <style>{`
        @keyframes nbom-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>,
    document.body
  );
};

// ─── 🆕 Success Modal ─────────────────────────────────────────────────────
//  Shown after a successful BOM create/update. Matches the UI pattern used
//  in the Purchase Order and GRN forms.

const SuccessModal: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  details: { label: string; value: string | number }[];
  onClose: () => void;
  onView: () => void;
}> = ({ isOpen, title, message, details, onClose, onView }) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="nbom-modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 30000,
      }}
    >
      <div
        className="nbom-success-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          maxWidth: "480px",
          width: "90%",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          textAlign: "center",
          padding: "32px 24px",
        }}
      >
        {/* Green check icon */}
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "#d1fae5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <CheckCircle size={32} style={{ color: "#10b981" }} />
        </div>

        {/* Title */}
        <h2
          style={{
            margin: "0 0 8px",
            fontSize: "20px",
            fontWeight: 700,
            color: "#111827",
          }}
        >
          {title}
        </h2>

        {/* Message */}
        <p
          style={{
            margin: "0 0 24px",
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          {message}
        </p>

        {/* Details box */}
        {details.length > 0 && (
          <div
            style={{
              background: "#f9fafb",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              padding: "16px",
              marginBottom: "24px",
              textAlign: "left",
            }}
          >
            {details.map((detail, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: idx < details.length - 1 ? "12px" : "0",
                }}
              >
                <span style={{ fontSize: "13px", color: "#6b7280" }}>
                  {detail.label}
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  {detail.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              background: "transparent",
              color: "#6b7280",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f3f4f6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            Close
          </button>
          <button
            onClick={onView}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: "6px",
              border: "none",
              background: "#2563eb",
              color: "#ffffff",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#1d4ed8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#2563eb";
            }}
          >
            <Eye size={14} />
            View
          </button>
        </div>
      </div>
    </div>,
    document.body
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
  const { id: urlId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [opsPanelOpen, setOpsPanelOpen] = useState(true);
  const [withOperations, setWithOperations] = useState(false);
  const [itemToManufacture, setItemToManufacture] = useState("");
  const [quantity, setQuantity] = useState<string>("1");
  const [, setBomNo] = useState("");
  const [bomId, setBomId] = useState<string | number | null>(null);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [defaultSourceWarehouse, setDefaultSourceWarehouse] = useState("");
  const [defaultTargetWarehouse, setDefaultTargetWarehouse] = useState("");
  const [bomType, setBomType] = useState<"Internal" | "External">("Internal");

  const handoffApplied = useRef(false);
  const dataLoadedRef = useRef(false);

  // 🆕 Guards against stale responses overwriting the item list.
  const itemsRequestRef = useRef(0);

  const [compRows, setCompRows] = useState<ComponentRow[]>([
    {
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
      isNew: true,
    },
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
      isNew: true,
    },
  ]);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [deleteModal, setDeleteModal] = useState<DeleteModal>({
    isOpen: false,
    type: "component",
    rowId: 0,
    name: "",
    dbRowId: undefined,
  });
  const [deleting, setDeleting] = useState(false);

  const [items, setItems] = useState<Item[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [rawItems, setRawItems] = useState<Item[]>([]);
  const [rawItemsLoading, setRawItemsLoading] = useState(false);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [operationsLoading, setOperationsLoading] = useState(false);
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [workstationsLoading, setWorkstationsLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [selectedItemDetails, setSelectedItemDetails] = useState<Item | null>(null);
  const [showProfitWarning, setShowProfitWarning] = useState(false);

  // 🆕 Remembers the name/group of the saved "Item to Manufacture" so the
  //    edit page always renders a readable label (fixes blank Service BOM edit).
  const [manufactureItemMeta, setManufactureItemMeta] =
    useState<ManufactureItemMeta | null>(null);

  // 🆕 Success modal state (shown after successful BOM save).
  const [successModal, setSuccessModal] = useState<SuccessModalState>({
    isOpen: false,
    title: "",
    message: "",
    details: [],
  });

  const addToast = useCallback(
    (type: Toast["type"], title: string, message: string) => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 🆕 Options for the "Item to Manufacture" dropdown.
  //    If the saved item is not present in the group-filtered list we inject a
  //    synthetic option so the field shows "CODE - Name (Group)" instead of
  //    being blank, and so it stays selectable.
  const manufactureItemOptions = useMemo<Item[]>(() => {
    const code = (itemToManufacture || "").trim();
    if (!code) return items;
    if (items.some((i) => i.item_code === code)) return items;

    const fallback: Item = {
      id: -1,
      item_code: code,
      item_name: manufactureItemMeta?.item_name || "",
      item_group: manufactureItemMeta?.item_group || "",
      stock_uom: manufactureItemMeta?.stock_uom || "",
      valuation_rate: 0,
      standard_rate: 0,
    };
    return [fallback, ...items];
  }, [items, itemToManufacture, manufactureItemMeta]);

  // 🆕 Safe label for the manufacture item (avoids "CODE -  ()" when the
  //    name/group is unknown).
  const getManufactureItemLabel = useCallback((item: any): string => {
    const code = item?.item_code ?? "";
    const name = item?.item_name ?? "";
    const group = item?.item_group ?? "";
    const base = [code, name].filter(Boolean).join(" - ");
    return group ? `${base} (${group})` : base || String(code);
  }, []);

  // ─── Drag and Drop ─────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
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

    setOpRows((prevRows) => {
      const newRows = [...prevRows];
      const draggedRow = newRows[dragIndex];
      newRows.splice(dragIndex, 1);
      newRows.splice(dropIndex, 0, draggedRow);
      return newRows.map((row, idx) => ({
        ...row,
        sequenceId: String(idx + 1),
      }));
    });

    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  // ─── Hydrate from prop editData ────────────────────────────────
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

      // 🆕 Remember the item's display info for the dropdown.
      setManufactureItemMeta({
        item_code: bom.item || "",
        item_name: bom.item_name || bom.itemName || "",
        item_group: bom.item_group || bom.itemGroup || "",
        stock_uom: bom.stock_uom || bom.uom || "",
      });

      if (bom.standard_rate) {
        setSellingPrice(bom.standard_rate);
        setSelectedItemDetails({ ...bom, standard_rate: bom.standard_rate });
      }

      if (items && items.length > 0) {
        const comps = items.map((item: any) => ({
          id: item.id || Date.now() + Math.random(),
          itemCode: item.item_code,
          itemName: item.item_name,
          qty: String(item.qty),
          uom: getItemUom(item),
          rate: String(item.rate || item.standard_rate || item.valuation_rate || 0),
          amount: `₹ ${(
            (item.rate || item.standard_rate || item.valuation_rate || 0) *
            (item.qty || 0)
          ).toFixed(2)}`,
          itemGroup: item.item_group || "",
          valuationRate: item.valuation_rate || 0,
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
          workstationType: op.workstation_type || "",
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

  // ─── Chatbot handoff ───────────────────────────────────────────
  useEffect(() => {
    if (!urlId || editData) return;
    if (handoffApplied.current) return;

    const raw = sessionStorage.getItem("erp-detail-handoff");
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (
        parsed?.endpointKey === "bom" &&
        String(parsed.id) === String(urlId) &&
        parsed.master
      ) {
        const wrapper = parsed.master;
        const master = wrapper.bom ?? wrapper;
        const itemsFromWrapper: any[] = Array.isArray(wrapper.items) ? wrapper.items : [];
        const opsFromWrapper: any[] = Array.isArray(wrapper.operations)
          ? wrapper.operations
          : [];
        const related = parsed.related || {};

        setItemToManufacture(master.item || "");
        setBomNo(master.id);
        setBomId(master.id);
        setQuantity(String(master.quantity ?? 1));
        setDefaultSourceWarehouse(master.default_source_warehouse || "");
        setDefaultTargetWarehouse(master.default_target_warehouse || "");
        setBomType(master.type === "External" ? "External" : "Internal");

        // 🆕 Remember the item's display info for the dropdown.
        setManufactureItemMeta({
          item_code: master.item || "",
          item_name: master.item_name || master.itemName || "",
          item_group: master.item_group || master.itemGroup || "",
          stock_uom: master.stock_uom || master.uom || "",
        });

        if (master.standard_rate) {
          setSellingPrice(master.standard_rate);
          setSelectedItemDetails({ ...master, standard_rate: master.standard_rate });
        }

        const componentsFromRelated: any[] = Array.isArray(related.itemsRaw)
          ? related.itemsRaw
          : Array.isArray(related.itemsProduct)
          ? related.itemsProduct
          : [];
        const compSource = itemsFromWrapper.length ? itemsFromWrapper : componentsFromRelated;

        if (compSource.length > 0) {
          setCompRows(
            compSource.map((item: any) => {
              const qty = Number(item.qty) || 0;
              const rate = Number(item.rate ?? item.standard_rate ?? item.valuation_rate ?? 0);
              return {
                id: item.id || Date.now() + Math.random(),
                itemCode: item.item_code || "",
                itemName: item.item_name || "",
                qty: String(qty),
                uom: getItemUom(item),
                rate: String(rate),
                amount: `₹ ${(rate * qty).toFixed(2)}`,
                itemGroup: item.item_group || "",
                valuationRate: item.valuation_rate || 0,
                standardRate: item.standard_rate || 0,
                isNew: false,
              };
            })
          );
        }

        const opsFromRelated: any[] = Array.isArray(related.operations) ? related.operations : [];
        const opSource = opsFromWrapper.length ? opsFromWrapper : opsFromRelated;

        if (opSource.length > 0) {
          setWithOperations(true);
          setOpRows(
            opSource.map((op: any, idx: number) => ({
              id: op.id || Date.now() + idx,
              operation: op.operation || "",
              operationId: op.operation_id || op.id,
              sequenceId: String(op.sequence_id ?? idx + 1),
              workstation: op.workstation || "",
              workstationId: op.workstation_id,
              workstationType: op.workstation_type || "",
              timeInMins: String(op.time_in_mins ?? 0),
              hourRate: String(op.hour_rate ?? 0),
              operatingCost: String(op.operating_cost ?? 0),
              qualityInspectionRequired: op.quality_inspection_required === 1,
              isNew: false,
            }))
          );
        }

        if (Array.isArray(related.operations) && related.operations.length) {
          setOperations(related.operations);
        }
        if (Array.isArray(related.workstations) && related.workstations.length) {
          setWorkstations(
            related.workstations.filter((w: any) => w.is_deleted === 0 && w.status === "Active")
          );
        }
        if (Array.isArray(related.warehouses) && related.warehouses.length) {
          setWarehouses(related.warehouses.filter((w: any) => w.disabled === 0));
        }
        if (Array.isArray(related.itemsProduct) && related.itemsProduct.length) {
          setItems(related.itemsProduct);
        }
        if (Array.isArray(related.itemsRaw) && related.itemsRaw.length) {
          setRawItems(related.itemsRaw);
        }

        handoffApplied.current = true;
        sessionStorage.removeItem("erp-detail-handoff");
      }
    } catch (e) {
      console.warn("⚠️ Could not read BOM handoff:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlId, editData]);

  // ─── Direct fetch ──────────────────────────────────────────────
  useEffect(() => {
    if (!urlId || editData) return;
    if (dataLoadedRef.current) return;
    if (handoffApplied.current) return;

    (async () => {
      try {
        const detail = await fetchBOMDetailPageData(urlId);

        if (!detail.ok || !detail.bom) {
          console.warn("⚠️ BOM fetch failed:", detail.errors);
          return;
        }

        setItemToManufacture(detail.bom.item || "");
        setBomNo(detail.bom.id);
        setBomId(detail.bom.id);
        setQuantity(String(detail.bom.quantity ?? 1));
        setDefaultSourceWarehouse(detail.bom.default_source_warehouse || "");
        setDefaultTargetWarehouse(detail.bom.default_target_warehouse || "");
        setBomType(detail.bom.type === "External" ? "External" : "Internal");

        // 🆕 Remember the item's display info for the dropdown.
        setManufactureItemMeta({
          item_code: detail.bom.item || "",
          item_name: (detail.bom as any).item_name || (detail.bom as any).itemName || "",
          item_group: (detail.bom as any).item_group || (detail.bom as any).itemGroup || "",
          stock_uom: (detail.bom as any).stock_uom || (detail.bom as any).uom || "",
        });

        if (detail.bom.standard_rate) {
          setSellingPrice(detail.bom.standard_rate);
          setSelectedItemDetails({
            ...detail.bom,
            standard_rate: detail.bom.standard_rate,
          });
        }

        if (detail.items.length) {
          setCompRows(
            detail.items.map((it: any) => {
              const qty = Number(it.qty) || 0;
              const rate = Number(it.rate ?? it.standard_rate ?? it.valuation_rate ?? 0);
              return {
                id: it.id || Date.now() + Math.random(),
                itemCode: it.item_code || "",
                itemName: it.item_name || "",
                qty: String(qty),
                uom: getItemUom(it),
                rate: String(rate),
                amount: `₹ ${(rate * qty).toFixed(2)}`,
                itemGroup: it.item_group || "",
                valuationRate: it.valuation_rate || 0,
                standardRate: it.standard_rate || 0,
                isNew: false,
              };
            })
          );
        }

        if (detail.operations.length) {
          setWithOperations(true);
          setOpRows(
            detail.operations.map((op: any, idx: number) => ({
              id: op.id || Date.now() + idx,
              operation: op.operation || "",
              operationId: op.operation_id || op.id,
              sequenceId: String(op.sequence_id ?? idx + 1),
              workstation: op.workstation || "",
              workstationId: op.workstation_id,
              workstationType: op.workstation_type || "",
              timeInMins: String(op.time_in_mins ?? 0),
              hourRate: String(op.hour_rate ?? 0),
              operatingCost: String(op.operating_cost ?? 0),
              qualityInspectionRequired: op.quality_inspection_required === 1,
              isNew: false,
            }))
          );
        }

        if (detail.operationsMaster?.length) setOperations(detail.operationsMaster);
        if (detail.workstationsMaster?.length) {
          setWorkstations(
            detail.workstationsMaster.filter(
              (w: any) => w.is_deleted === 0 && w.status === "Active"
            )
          );
        }
        if (detail.warehousesMaster?.length) {
          setWarehouses(detail.warehousesMaster.filter((w: any) => w.disabled === 0));
        }
        if (detail.rawItems?.length) setRawItems(detail.rawItems);

        dataLoadedRef.current = true;
      } catch (e: any) {
        console.warn("⚠️ Direct BOM fetch failed:", e?.message || e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlId, editData]);

  // ─── Fetch static data once ───────────────────────────────────
  useEffect(() => {
    if (operations.length === 0) fetchOperations();
    if (workstations.length === 0) fetchWorkstations();
    if (warehouses.length === 0) fetchWarehouses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Fetch item lists ─────────────────────────────────────────
  // 🆕 Whenever the BOM type changes we clear the list and refetch the
  // correct group. fetchManufactureItems is race-safe and also has
  // fallbacks for backend group-name mismatches.
  useEffect(() => {
    setItems([]);
    if (bomType === "External") {
      fetchManufactureItems("Service");
    } else {
      fetchManufactureItems("Product");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bomType]);

  useEffect(() => {
    if (rawItems.length > 0) return;
    if (bomType === "Internal") {
      fetchRawItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bomType]);

  // ─── Auto-default source / target warehouses ──────────────────
  useEffect(() => {
    if (bomType !== "Internal") return;
    if (!warehouses.length) return;

    const findWarehouse = (hints: string[]) => {
      const lower = (s: string) => String(s || "").toLowerCase();
      for (const hint of hints) {
        const exact = warehouses.find(
          (w) => lower(w.warehouse_name) === lower(hint)
        );
        if (exact) return exact;
      }
      for (const hint of hints) {
        const partial = warehouses.find((w) =>
          lower(w.warehouse_name).includes(lower(hint))
        );
        if (partial) return partial;
      }
      return null;
    };

    const sourceHints = [
      "Raw Material Store",
      "Raw Materials Store",
      "RM Store",
      "Raw Material Warehouse",
      "Raw Materials Warehouse",
      "Raw Material",
      "Raw Materials",
    ];

    const targetHints = [
      "Finished Goods",
      "Finished Goods Store",
      "Finished Goods Warehouse",
      "FG Store",
      "FG Warehouse",
    ];

    if (!defaultSourceWarehouse) {
      const src = findWarehouse(sourceHints);
      if (src) setDefaultSourceWarehouse(src.warehouse_name);
    }

    if (!defaultTargetWarehouse) {
      const tgt = findWarehouse(targetHints);
      if (tgt) setDefaultTargetWarehouse(tgt.warehouse_name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouses, bomType]);

  // ─── Back-fill missing UOM once raw items are available ───────
  useEffect(() => {
    if (!rawItems.length) return;
    setCompRows((rs) => {
      let changed = false;
      const next = rs.map((r) => {
        if (r.itemCode && !r.uom) {
          const it = rawItems.find((i) => i.item_code === r.itemCode);
          const u = getItemUom(it);
          if (u) {
            changed = true;
            return { ...r, uom: u };
          }
        }
        return r;
      });
      return changed ? next : rs;
    });
  }, [rawItems]);

  // 🆕 If the loaded item list happens to contain the manufacture item, enrich
  //    the stored meta with the authoritative name/group.
  useEffect(() => {
    if (!itemToManufacture) return;
    const found = items.find((i) => i.item_code === itemToManufacture);
    if (!found) return;
    setManufactureItemMeta((prev) => {
      if (
        prev &&
        prev.item_name === (found.item_name || "") &&
        prev.item_group === (found.item_group || "")
      ) {
        return prev;
      }
      return {
        item_code: found.item_code,
        item_name: found.item_name || prev?.item_name || "",
        item_group: found.item_group || prev?.item_group || "",
        stock_uom: found.stock_uom || prev?.stock_uom || "",
      };
    });
  }, [items, itemToManufacture]);

  // 🆕 Robust fetch:
  //   1. Tries several candidate group names ("Service", "Services", "service"…)
  //      via the API's `group` param.
  //   2. If all return 0, fetches ALL items and filters client-side by a
  //      fuzzy, case-insensitive group match.
  //   3. A request-id guard prevents stale responses from overwriting the
  //      freshest list (fixes the earlier race condition).
  const fetchManufactureItems = async (group: string) => {
    const requestId = ++itemsRequestRef.current;

    try {
      setItemsLoading(true);

      const target = normalizeGroup(group);
      const candidates: string[] =
        group === "Service"
          ? ["Service", "Services", "service", "services", "External Service"]
          : group === "Product"
          ? ["Product", "Products", "product", "products", "Finished Good"]
          : [group];

      let collected: Item[] = [];

      // 1) Try each candidate group name against the API.
      for (const candidate of candidates) {
        try {
          const res = await api.get(
            `/item?page=1&limit=200&group=${encodeURIComponent(candidate)}`
          );
          if (requestId !== itemsRequestRef.current) return;
          if (res.data?.success === 1) {
            const list = extractItems(res.data.data);
            if (list.length > 0) {
              collected = list;
              break;
            }
          }
        } catch {
          // try next candidate
        }
      }

      // 2) Fallback: fetch all items and filter client-side.
      if (collected.length === 0) {
        try {
          const allRes = await api.get(`/item?page=1&limit=1000`);
          if (requestId !== itemsRequestRef.current) return;
          if (allRes.data?.success === 1) {
            collected = extractItems(allRes.data.data);
          }
        } catch (e) {
          console.warn("Fallback item fetch failed:", e);
        }
      }

      // 3) Fuzzy client-side filter.
      const filtered = collected.filter((item) => {
        const g = normalizeGroup((item as any)?.item_group);
        if (!g) return false;
        return g === target || g.includes(target) || target.includes(g);
      });

      if (requestId !== itemsRequestRef.current) return;
      setItems(filtered);
    } catch (err: any) {
      if (requestId !== itemsRequestRef.current) return;
      console.error("Error fetching manufacture items:", err);
      addToast("error", "Error", "Failed to fetch items");
    } finally {
      if (requestId === itemsRequestRef.current) {
        setItemsLoading(false);
      }
    }
  };

  const fetchRawItems = async () => {
    try {
      setRawItemsLoading(true);
      const response = await api.get("/item?type=raw");
      if (response.data.success === 1) {
        setRawItems(extractItems(response.data.data));
      }
    } catch (err: any) {
      console.error("Error fetching raw items:", err);
      addToast("error", "Error", "Failed to fetch raw materials");
    } finally {
      setRawItemsLoading(false);
    }
  };

  const fetchOperations = async () => {
    try {
      setOperationsLoading(true);
      const response = await api.get("/operation");
      if (response.data.success === 1) {
        setOperations(response.data.data);
      }
    } catch (err: any) {
      console.error("Error fetching operations:", err);
      addToast("error", "Error", "Failed to fetch operations");
    } finally {
      setOperationsLoading(false);
    }
  };

  const fetchWorkstations = async () => {
    try {
      setWorkstationsLoading(true);
      const response = await api.get("/workstation");
      if (response.data.success === 1) {
        const data = response.data.data;
        let workstationList: Workstation[] = [];
        if (Array.isArray(data)) {
          workstationList = data;
        } else if (data && "records" in data) {
          workstationList = data.records || [];
        }
        setWorkstations(
          workstationList.filter((w) => w.is_deleted === 0 && w.status === "Active")
        );
      }
    } catch (err: any) {
      console.error("Error fetching workstations:", err);
    } finally {
      setWorkstationsLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await api.get("/warehouse");
      if (response.data.success === 1) {
        const data = response.data.data;
        let warehouseList: Warehouse[] = [];
        if (Array.isArray(data)) {
          warehouseList = data;
        } else if (data && "records" in data) {
          warehouseList = data.records || [];
        }
        setWarehouses(warehouseList.filter((w) => w.disabled === 0));
      }
    } catch (err: any) {
      console.error("Error fetching warehouses:", err);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────
  const openDeleteModal = (
    type: "component" | "operation",
    rowId: number,
    name: string,
    dbRowId?: number
  ) => {
    setDeleteModal({ isOpen: true, type, rowId, name, dbRowId });
  };

  const closeDeleteModal = () => {
    if (!deleting) {
      setDeleteModal({ isOpen: false, type: "component", rowId: 0, name: "", dbRowId: undefined });
    }
  };

  const confirmDelete = async () => {
    const { type, rowId, name, dbRowId } = deleteModal;

    if (type === "component") {
      const row = compRows.find((r) => r.id === rowId);
      if (row?.isNew) {
        setCompRows((r) => r.filter((row) => row.id !== rowId));
        addToast("success", "Deleted", `Component "${name}" removed`);
        closeDeleteModal();
        return;
      }

      const deleteId = dbRowId || rowId;

      try {
        setDeleting(true);
        const response = await api.delete(`/bom-item/${deleteId}`);
        if (response.data.success === 1) {
          setCompRows((r) => r.filter((row) => row.id !== rowId));
          addToast("success", "Deleted", `Component "${name}" deleted successfully`);
        } else {
          addToast("error", "Error", response.data.message || "Failed to delete component");
        }
      } catch (err: any) {
        addToast("error", "Error", err.response?.data?.message || "Failed to delete component");
      } finally {
        setDeleting(false);
        closeDeleteModal();
      }
    } else if (type === "operation") {
      const row = opRows.find((r) => r.id === rowId);
      if (row?.isNew) {
        setOpRows((r) => {
          const filtered = r.filter((row) => row.id !== rowId);
          return filtered.map((row, idx) => ({ ...row, sequenceId: String(idx + 1) }));
        });
        addToast("success", "Deleted", `Operation "${name}" removed`);
        closeDeleteModal();
        return;
      }

      const deleteId = dbRowId || row?.operationId || rowId;

      try {
        setDeleting(true);
        const response = await api.delete(`/bom-operation/${deleteId}`);
        if (response.data.success === 1) {
          setOpRows((r) => {
            const filtered = r.filter((row) => row.id !== rowId);
            return filtered.map((row, idx) => ({ ...row, sequenceId: String(idx + 1) }));
          });
          addToast("success", "Deleted", `Operation "${name}" deleted successfully`);
        } else {
          addToast("error", "Error", response.data.message || "Failed to delete operation");
        }
      } catch (err: any) {
        addToast("error", "Error", err.response?.data?.message || "Failed to delete operation");
      } finally {
        setDeleting(false);
        closeDeleteModal();
      }
    }
  };

  // ─── Row ops ─────────────────────────────────────────────────
  const addCompRow = () =>
    setCompRows((r) => [
      ...r,
      {
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
        isNew: true,
      },
    ]);

  const addOpRow = () =>
    setOpRows((r) => [
      ...r,
      {
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
        isNew: true,
      },
    ]);

  const handleOperationSelect = (idx: number, operationName: string) => {
    const selectedOp = operations.find((op) => op.name === operationName);
    if (selectedOp) {
      const workstationDetails = workstations.find((w) => w.id === selectedOp.workstationId);
      const workstationName =
        workstationDetails?.workstation_name ||
        selectedOp.workstation_name ||
        selectedOp.workstation ||
        "";
      const hourRate = (workstationDetails?.hour_rate ?? selectedOp.hour_rate ?? 0).toString();
      const timeInMins = selectedOp.total_operation_time?.toString() || "0";
      const operatingCost = (
        ((parseFloat(hourRate) || 0) * (parseFloat(timeInMins) || 0)) /
        60
      ).toFixed(2);

      setOpRows((rs) =>
        rs.map((r, i) =>
          i === idx
            ? {
                ...r,
                operation: operationName,
                operationId: selectedOp.id,
                workstation: workstationName,
                workstationId: selectedOp.workstationId,
                timeInMins,
                workstationType: workstationDetails?.workstation_type || "",
                hourRate,
                operatingCost,
              }
            : r
        )
      );
    }
  };

  const handleWorkstationSelect = (idx: number, workstationName: string) => {
    const selectedWorkstation = workstations.find((w) => w.workstation_name === workstationName);
    if (selectedWorkstation) {
      setOpRows((rs) =>
        rs.map((r, i) =>
          i === idx
            ? {
                ...r,
                workstation: workstationName,
                workstationId: selectedWorkstation.id,
                workstationType: selectedWorkstation.workstation_type || "",
                hourRate: selectedWorkstation.hour_rate?.toString() || r.hourRate || "0",
                operatingCost: selectedWorkstation.hour_rate
                  ? ((selectedWorkstation.hour_rate * (parseFloat(r.timeInMins) || 0)) / 60).toFixed(2)
                  : r.operatingCost || "0",
              }
            : r
        )
      );
    }
  };

  const handleTimeChange = (idx: number, timeInMins: string) => {
    const row = opRows[idx];
    const hourRate = parseFloat(row.hourRate) || 0;
    const time = parseFloat(timeInMins) || 0;
    const operatingCost = (hourRate * time) / 60;

    setOpRows((rs) =>
      rs.map((r, i) =>
        i === idx ? { ...r, timeInMins, operatingCost: operatingCost.toFixed(2) } : r
      )
    );
  };

  const handleHourRateChange = (idx: number, hourRate: string) => {
    const row = opRows[idx];
    const time = parseFloat(row.timeInMins) || 0;
    const rate = parseFloat(hourRate) || 0;
    const operatingCost = (rate * time) / 60;

    setOpRows((rs) =>
      rs.map((r, i) =>
        i === idx ? { ...r, hourRate, operatingCost: operatingCost.toFixed(2) } : r
      )
    );
  };

  const calculateTotalCost = () => {
    let totalComponentCost = 0;
    compRows.forEach((row) => {
      if (row.rate && row.qty) {
        const rate = parseFloat(row.rate ?? "0") || 0;
        const qty = parseFloat(row.qty ?? "0") || 0;
        totalComponentCost += rate * qty;
      }
    });

    let totalOperationCost = 0;
    opRows.forEach((row) => {
      if (row.operatingCost) {
        totalOperationCost += parseFloat(row.operatingCost) || 0;
      }
    });

    const total =
      bomType === "Internal" ? totalComponentCost + totalOperationCost : totalOperationCost;

    return {
      totalComponentCost: totalComponentCost.toFixed(2),
      totalOperationCost: totalOperationCost.toFixed(2),
      totalCost: total.toFixed(2),
    };
  };

  const getProfitLoss = useCallback(() => {
    const totalCost = parseFloat(calculateTotalCost().totalCost) || 0;
    const profit = sellingPrice - totalCost;
    const profitMargin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

    return {
      profit,
      profitMargin,
      isProfitable: profit >= 0,
      totalCost,
      sellingPrice,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellingPrice, compRows, opRows, bomType]);

  const validateForm = (): { isValid: boolean; errors: { [key: string]: string } } => {
    const errors: { [key: string]: string } = {};

    if (!itemToManufacture.trim()) {
      errors.itemToManufacture = "Item to Manufacture is required";
    }

    if (bomType === "Internal") {
      const filledComps = compRows.filter((r) => r.itemCode.trim());
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

    if (bomType === "External" && !withOperations) {
      errors.operations = "Operations are required for External/Service BOM";
    }

    if (withOperations || bomType === "External") {
      opRows.forEach((r, i) => {
        if (!r.operation.trim()) {
          errors[`op_${i}`] = `Operation name is required for row ${i + 1}`;
        }
        if (!r.workstation.trim()) {
          errors[`op_workstation_${i}`] = `Workstation is required for operation "${
            r.operation || i + 1
          }"`;
        }
        if (!r.timeInMins || parseFloat(r.timeInMins) <= 0) {
          errors[`op_time_${i}`] = `Valid time is required for operation "${
            r.operation || i + 1
          }"`;
        }
      });
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const getFieldError = (field: string): string | undefined => {
    if (!showValidationErrors) return undefined;
    return fieldErrors[field];
  };

  const handleItemSelect = (itemCode: string) => {
    setItemToManufacture(itemCode);
    // 🆕 Look in the merged options so the injected item is also found.
    const selectedItem = manufactureItemOptions.find((i) => i.item_code === itemCode);
    if (selectedItem) {
      setSelectedItemDetails(selectedItem);
      setSellingPrice(selectedItem.standard_rate || 0);
      // 🆕 Keep the meta in sync with whatever was picked.
      setManufactureItemMeta({
        item_code: selectedItem.item_code,
        item_name: selectedItem.item_name || "",
        item_group: selectedItem.item_group || "",
        stock_uom: selectedItem.stock_uom || "",
      });
      if (fieldErrors.itemToManufacture) {
        setFieldErrors((prev) => ({ ...prev, itemToManufacture: "" }));
      }
    } else {
      setSelectedItemDetails(null);
      setSellingPrice(0);
    }
  };

  const handleSave = async () => {
    const { isValid, errors } = validateForm();
    setFieldErrors(errors);
    setShowValidationErrors(true);

    if (!isValid) {
      const firstErrorField = Object.keys(errors)[0];
      const element = document.querySelector(`[data-field="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setSaving(true);
    setApiError(null);

    try {
      const selectedItem = items.find((i) => i.item_code === itemToManufacture);

      const totalComponentCost = compRows.reduce((sum, row) => {
        const rate = parseFloat(row.rate || "0") || 0;
        const qty = parseFloat(row.qty || "0") || 0;
        return sum + rate * qty;
      }, 0);

      const totalOperationCost = opRows.reduce((sum, row) => {
        return sum + (parseFloat(row.operatingCost || "0") || 0);
      }, 0);

      const totalCost =
        bomType === "Internal" ? totalComponentCost + totalOperationCost : totalOperationCost;

      let bomResponse;
      const bomPayload = {
        item_Id: selectedItem?.id ?? selectedItemDetails?.id,
        item: itemToManufacture,
        item_name:
          selectedItem?.item_name ||
          selectedItemDetails?.item_name ||
          manufactureItemMeta?.item_name ||
          "",
        company: "SculptorTech",
        quantity: parseFloat(quantity) || 0,
        uom:
          selectedItem?.stock_uom ||
          selectedItemDetails?.stock_uom ||
          manufactureItemMeta?.stock_uom ||
          "Nos",
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
        bomResponse = await api.put("/bom", {
          id: editData.bom.id,
          ...bomPayload,
        });
        setBomId(editData.bom.id);
      } else if (urlId) {
        bomResponse = await api.put("/bom", {
          id: urlId,
          ...bomPayload,
        });
        setBomId(urlId);
      } else {
        bomResponse = await api.post("/bom", bomPayload);
      }

      if (bomResponse.data.success !== 1) {
        throw new Error(bomResponse.data?.message || "Failed to save BOM");
      }

      const insertId =
        bomResponse.data?.data?.insertId || bomId || editData?.bom?.id || urlId || Date.now();
      setBomId(insertId);
      const parentRef = insertId;

      if (bomType === "Internal") {
        const existingComponentIds = editData?.items?.map((item: any) => item.id) || [];
        const currentComponentIds = compRows
          .filter((row) => !row.isNew && row.id)
          .map((row) => row.id);

        const componentsToDelete = existingComponentIds.filter(
          (id) => !currentComponentIds.includes(id)
        );

        for (const deleteId of componentsToDelete) {
          try {
            await api.delete(`/bom-item/${deleteId}`);
          } catch (err) {
            console.error("Error deleting component:", err);
          }
        }

        for (const comp of compRows) {
          if (!comp.itemCode.trim()) continue;

          const compItem = rawItems.find((i) => i.item_code === comp.itemCode);
          const qty = parseFloat(comp.qty) || 0;
          const rate =
            parseFloat(comp.rate) || compItem?.standard_rate || compItem?.valuation_rate || 0;
          const amount = qty * rate;

          const itemPayload: BOMItemData = {
            item_Id: compItem?.id,
            item_code: comp.itemCode,
            item_name: compItem?.item_name || comp.itemCode,
            bom_no: parentRef,
            qty: qty,
            uom: comp.uom || getItemUom(compItem) || "Nos",
            stock_qty: qty,
            stock_uom: comp.uom || getItemUom(compItem) || "Nos",
            conversion_factor: 1,
            rate: rate,
            amount: amount,
            parent: parentRef,
            parentfield: "items",
            parenttype: "BOM",
            owner: "Administrator",
            modified_by: "Administrator",
          };

          if (comp.isNew) {
            await api.post("/bom-item", itemPayload);
          } else {
            await api.put(`/bom-item`, {
              id: comp.id,
              ...itemPayload,
            });
          }
        }
      }

      const existingOperationIds = editData?.operations?.map((op: any) => op.id) || [];
      const currentOperationIds = opRows.filter((row) => !row.isNew && row.id).map((row) => row.id);

      const operationsToDelete = existingOperationIds.filter(
        (id) => !currentOperationIds.includes(id)
      );

      for (const deleteId of operationsToDelete) {
        try {
          await api.delete(`/bom-operation/${deleteId}`);
        } catch (err) {
          console.error("Error deleting operation:", err);
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
          modified_by: "Administrator",
        };

        if (op.isNew) {
          await api.post("/bom-operation", opPayload);
        } else {
          await api.put(`/bom-operation`, {
            id: op.id,
            ...opPayload,
          });
        }
      }

      // 🆕 Show the Success Modal instead of a toast + auto-navigate.
      const isUpdate = !!(editData || urlId);
      setSuccessModal({
        isOpen: true,
        title: "Success!",
        message: isUpdate
          ? "BOM updated successfully!"
          : "BOM created successfully!",
        details: [
          { label: "BOM No.", value: String(parentRef) },
          { label: "Item", value: itemToManufacture || "—" },
          { label: "Type", value: bomType },
          {
            label: "Total Cost",
            value: `₹ ${parseFloat(calculateTotalCost().totalCost).toFixed(2)}`,
          },
        ],
      });
    } catch (err: any) {
      console.error("Error saving BOM:", err);
      addToast("error", "Error", err.response?.data?.message || "Failed to save BOM");
    } finally {
      setSaving(false);
    }
  };

  // 🆕 Close button on the success modal → go back to the listing page.
  const handleSuccessModalClose = () => {
    setSuccessModal((prev) => ({ ...prev, isOpen: false }));
    if (onBack) onBack();
    else navigate("/bom");
  };

  // 🆕 View button on the success modal → stay on the current page.
  const handleSuccessModalView = () => {
    setSuccessModal((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    if (bomType === "External") {
      setWithOperations(true);
    }
  }, [bomType]);

  useEffect(() => {
    const { totalCost } = getProfitLoss();
    if (sellingPrice > 0 && parseFloat(totalCost.toFixed(2)) > sellingPrice) {
      setShowProfitWarning(true);
    } else {
      setShowProfitWarning(false);
    }
  }, [sellingPrice, compRows, opRows, getProfitLoss]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (urlId) {
      navigate("/bom");
    } else {
      navigate(-1);
    }
  };

  // 🆕 Whether to show the full-screen loader during create/update/delete.
  const isBusy = saving || deleting;

  const busyMessage = saving
    ? editData
      ? "Updating BOM..."
      : "Creating BOM..."
    : deleting
    ? "Deleting..."
    : "Please wait...";

  const busySubtitle = saving
    ? editData
      ? "Saving your BOM changes, please wait."
      : "Creating a new BOM, please wait."
    : deleting
    ? "Removing the item, please wait."
    : undefined;

  return (
    <div className="nbom-page">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* 🆕 Full-screen loader for create/update/delete operations */}
      <LoaderOverlay
        isOpen={isBusy}
        message={busyMessage}
        subtitle={busySubtitle}
      />

      {/* 🆕 Success Modal after BOM save */}
      <SuccessModal
        isOpen={successModal.isOpen}
        title={successModal.title}
        message={successModal.message}
        details={successModal.details}
        onClose={handleSuccessModalClose}
        onView={handleSuccessModalView}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        type={deleteModal.type === "component" ? "Component" : "Operation"}
        name={deleteModal.name}
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
        deleting={deleting}
      />

      <div className="nbom-topbar">
        <nav className="nbom-breadcrumb" aria-label="Breadcrumb">
          <ol className="nbom-breadcrumb__list">
            <li className="nbom-breadcrumb__item nbom-breadcrumb__item--home">
              <button className="nbom-breadcrumb__home-btn" title="Home" onClick={handleBack}>
                <ArrowLeft size={12} /> Back
              </button>
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
        </div>
      </div>

      <div className="nbom-body">
        {/* ── BOM Type ── */}
        <div className="nbom-card">
          <div className="nbom-card__body">
            <div className="nbom-bom-type-row">
              <label className="nbom-bom-type-title">BOM Type</label>
              <div className="nbom-radio-options">
                <label className="nbom-radio-option">
                  <input
                    type="radio"
                    name="bomType"
                    value="Internal"
                    checked={bomType === "Internal"}
                    onChange={() => {
                      setBomType("Internal");
                      setItemToManufacture("");
                      setSelectedItemDetails(null);
                      setSellingPrice(0);
                    }}
                  />
                  <span className="nbom-radio-option-label">Product</span>
                </label>
                <label className="nbom-radio-option">
                  <input
                    type="radio"
                    name="bomType"
                    value="External"
                    checked={bomType === "External"}
                    onChange={() => {
                      setBomType("External");
                      setItemToManufacture("");
                      setSelectedItemDetails(null);
                      setSellingPrice(0);
                    }}
                  />
                  <span className="nbom-radio-option-label">Service</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ── Item to Manufacture / Qty / Selling price ── */}
        <div className="nbom-card">
          <div className="nbom-card__body">
            <div className="nbom-three-column">
              <div className="nbom-field nbom-flex-item" data-field="itemToManufacture">
                <Label text="Item to Manufacture" required info />
                <SearchableSelect
                  options={manufactureItemOptions}
                  value={itemToManufacture}
                  onChange={handleItemSelect}
                  placeholder={
                    itemsLoading
                      ? "Loading items..."
                      : bomType === "External"
                      ? "Search service item..."
                      : "Search product..."
                  }
                  disabled={itemsLoading}
                  loading={itemsLoading}
                  getOptionLabel={getManufactureItemLabel}
                  getOptionValue={(item) => item.item_code}
                  filterKeys={["item_code", "item_name", "item_group"]}
                />
                {getFieldError("itemToManufacture") && (
                  <div style={{ color: "#dc2626", fontSize: "13px", fontWeight: 500, marginTop: 6 }}>
                    {getFieldError("itemToManufacture")}
                  </div>
                )}
              </div>

              <div className="nbom-field nbom-qty-field">
                <Label text="Quantity" required />
                <DigitInput
                  value={quantity}
                  onChange={(val) => setQuantity(val)}
                  placeholder="Enter quantity"
                  maxLength={10}
                />
              </div>

              {bomType === "Internal" && selectedItemDetails && (
                <div className="nbom-selling-price-wrapper">
                  <div className="nbom-selling-price-mini">
                    <div className="nbom-selling-price-mini-header">
                      <div className="nbom-selling-price-mini-label">
                        <DollarSign size={13} />
                        <span>Selling Price</span>
                      </div>
                      <button
                        className="nbom-edit-item-link-mini"
                        onClick={() => window.open(`/item/${selectedItemDetails.id}`, "_blank")}
                        title="Go to Item Page to change selling price"
                      >
                        <span>Change</span>
                        <ExternalLink size={10} />
                      </button>
                    </div>
                    <div className="nbom-selling-price-mini-value">
                      ₹ {selectedItemDetails.standard_rate?.toFixed(2) || "0.00"}
                    </div>
                    {showProfitWarning && (
                      <div className="nbom-profit-warning-mini">
                        <AlertTriangle size={12} />
                        <span>BOM Cost (₹{calculateTotalCost().totalCost}) exceeds SP</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Components ── */}
        {bomType === "Internal" && (
          <div className="nbom-card">
            <div className="nbom-card__body">
              <div className="nbom-card__title" style={{ marginBottom: 14 }}>
                <span className="nbom-card__title-dot" />
                Components
              </div>
              {getFieldError("components") && (
                <div style={{ marginBottom: 12, color: "#dc2626", fontSize: "13px", fontWeight: 500 }}>
                  {getFieldError("components")}
                </div>
              )}
              <div className="nbom-tables-wrap">
                <table className="nbom-table">
                  <thead>
                    <tr>
                      <th className="nbom-table-no">No.</th>
                      <th>
                        Item Code <span style={{ color: "#dc2626" }}>*</span>
                      </th>
                      <th>Item Name</th>
                      <th>Item Group</th>
                      <th>
                        Qty <span style={{ color: "#dc2626" }}>*</span>
                      </th>
                      <th>
                        UOM <span style={{ color: "#dc2626" }}>*</span>
                      </th>
                      <th>Rate</th>
                      <th>Amount</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compRows.map((row, idx) => (
                      <tr key={row.id}>
                        <td className="nbom-table-no">{idx + 1}</td>
                        <td>
                          <SearchableSelect
                            options={rawItems}
                            value={row.itemCode}
                            onChange={(val) => {
                              const selectedItem = rawItems.find((i) => i.item_code === val);
                              const rate =
                                selectedItem?.standard_rate ?? selectedItem?.valuation_rate ?? 0;
                              const pickedUom = getItemUom(selectedItem);
                              setCompRows((rs) =>
                                rs.map((r, i) =>
                                  i === idx
                                    ? {
                                        ...r,
                                        itemCode: val,
                                        itemName: selectedItem?.item_name || "",
                                        itemGroup: selectedItem?.item_group || "",
                                        uom: pickedUom || r.uom,
                                        rate: String(rate),
                                        valuationRate: selectedItem?.valuation_rate || 0,
                                        standardRate: selectedItem?.standard_rate || 0,
                                        amount: `₹ ${(rate * (parseFloat(r.qty) || 0)).toFixed(2)}`,
                                      }
                                    : r
                                )
                              );
                              if (fieldErrors[`comp_uom_${idx}`])
                                setFieldErrors((prev) => ({ ...prev, [`comp_uom_${idx}`]: "" }));
                            }}
                            placeholder={rawItemsLoading ? "Loading..." : "Search item code or name..."}
                            disabled={rawItemsLoading}
                            loading={rawItemsLoading}
                            getOptionLabel={(item) => `${item.item_code} - ${item.item_name}`}
                            getOptionValue={(item) => item.item_code}
                            filterKeys={["item_code", "item_name"]}
                          />
                        </td>
                        <td>
                          <input
                            className="nbom-table-input nbom-table-input--readonly"
                            value={row.itemName}
                            readOnly
                            tabIndex={-1}
                          />
                        </td>
                        <td>
                          <input
                            className="nbom-table-input nbom-table-input--readonly"
                            value={row.itemGroup || ""}
                            readOnly
                            tabIndex={-1}
                            style={{ minWidth: 120 }}
                          />
                        </td>
                        <td>
                          <DigitInput
                            value={row.qty}
                            onChange={(val) => {
                              const qty = parseFloat(val) || 0;
                              const rate = parseFloat(row.rate) || 0;
                              setCompRows((rs) =>
                                rs.map((r, i) =>
                                  i === idx
                                    ? { ...r, qty: val, amount: `₹ ${(rate * qty).toFixed(2)}` }
                                    : r
                                )
                              );
                              if (fieldErrors[`comp_qty_${idx}`])
                                setFieldErrors((prev) => ({ ...prev, [`comp_qty_${idx}`]: "" }));
                            }}
                            placeholder="0"
                            maxLength={10}
                          />
                          {getFieldError(`comp_qty_${idx}`) && (
                            <div style={{ marginTop: 4, color: "#dc2626", fontSize: 12 }}>
                              {getFieldError(`comp_qty_${idx}`)}
                            </div>
                          )}
                        </td>
                        <td>
                          <input
                            className="nbom-table-input"
                            value={row.uom}
                            placeholder="UOM"
                            onChange={(e) => {
                              setCompRows((rs) =>
                                rs.map((r, i) => (i === idx ? { ...r, uom: e.target.value } : r))
                              );
                              if (fieldErrors[`comp_uom_${idx}`])
                                setFieldErrors((prev) => ({ ...prev, [`comp_uom_${idx}`]: "" }));
                            }}
                            style={{ minWidth: 90 }}
                          />
                          {getFieldError(`comp_uom_${idx}`) && (
                            <div style={{ marginTop: 4, color: "#dc2626", fontSize: 12 }}>
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
                              setCompRows((rs) =>
                                rs.map((r, i) =>
                                  i === idx
                                    ? { ...r, rate: val, amount: `₹ ${(rate * qty).toFixed(2)}` }
                                    : r
                                )
                              );
                            }}
                            placeholder="0"
                            maxLength={10}
                          />
                        </td>
                        <td className="nbom-table-val">{row.amount}</td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            className="nbom-edit-btn nbom-edit-btn--delete"
                            onClick={() =>
                              openDeleteModal("component", row.id, row.itemCode || `Row ${idx + 1}`, row.id)
                            }
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

        {/* ── Operations ── */}
        <div className="nbom-card">
          <div
            className="nbom-card__header"
            onClick={() => bomType === "Internal" && setOpsPanelOpen((o) => !o)}
          >
            <span className="nbom-card__title">
              <span className="nbom-card__title-dot" />
              Operations
            </span>
            {bomType === "Internal" && (
              <ChevronRight
                size={15}
                className={`nbom-card__chev ${opsPanelOpen ? "nbom-card__chev--open" : ""}`}
              />
            )}
          </div>
          {(bomType === "External" || (bomType === "Internal" && opsPanelOpen)) && (
            <div className="nbom-card__body">
              {bomType === "Internal" && (
                <Checkbox
                  label="With Operations"
                  hint="Manage cost of operations. Drag rows to reorder."
                  checked={withOperations}
                  onChange={() => setWithOperations((v) => !v)}
                />
              )}

              {(bomType === "External" || withOperations) && (
                <div style={{ marginTop: bomType === "Internal" ? 16 : 0 }}>
                  {bomType === "External" && (
                    <div
                      style={{
                        marginBottom: 16,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        background: "#eff6ff",
                        borderRadius: 6,
                        color: "#1e40af",
                        fontSize: 13,
                      }}
                    >
                      <InfoIcon size={14} />
                      <span>
                        External/Service BOM requires operations to define the service workflow.
                      </span>
                    </div>
                  )}
                  {getFieldError("operations") && (
                    <div style={{ marginBottom: 12, color: "#dc2626", fontSize: 13, fontWeight: 500 }}>
                      {getFieldError("operations")}
                    </div>
                  )}
                  <div className="nbom-tables-wrap">
                    <table className="nbom-table">
                      <thead>
                        <tr>
                          <th className="nbom-table-drag-col"></th>
                          <th className="nbom-table-no">No.</th>
                          <th>
                            Operation <span style={{ color: "#dc2626" }}>*</span>
                          </th>
                          <th>Seq ID</th>
                          <th>
                            Workstation <span style={{ color: "#dc2626" }}>*</span>
                          </th>
                          <th>WS Type</th>
                          <th>
                            Time (mins) <span style={{ color: "#dc2626" }}>*</span>
                          </th>
                          <th>Hour Rate (₹)</th>
                          <th>Operating Cost</th>
                          <th>Action</th>
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
                              dragOverIndex === idx ? "nbom-drag-over" : ""
                            } ${dragIndex === idx ? "nbom-dragging" : ""}`}
                          >
                            <td className="nbom-table-drag-handle">
                              <GripVertical size={14} />
                            </td>
                            <td className="nbom-table-no">{idx + 1}</td>
                            <td>
                              <select
                                className="nbom-table-select"
                                value={row.operation}
                                onChange={(e) => {
                                  handleOperationSelect(idx, e.target.value);
                                  if (fieldErrors[`op_${idx}`])
                                    setFieldErrors((prev) => ({ ...prev, [`op_${idx}`]: "" }));
                                }}
                                disabled={operationsLoading || workstationsLoading}
                              >
                                <option value="">
                                  {operationsLoading ? "Loading..." : "Select operation..."}
                                </option>
                                {operations.map((op) => (
                                  <option key={op.id} value={op.name}>
                                    {op.name}
                                  </option>
                                ))}
                              </select>
                              {getFieldError(`op_${idx}`) && (
                                <div style={{ marginTop: 4, color: "#dc2626", fontSize: 12 }}>
                                  {getFieldError(`op_${idx}`)}
                                </div>
                              )}
                            </td>
                            <td>
                              <DigitInput
                                value={row.sequenceId}
                                onChange={(val) =>
                                  setOpRows((rs) =>
                                    rs.map((r, i) => (i === idx ? { ...r, sequenceId: val } : r))
                                  )
                                }
                                placeholder="Seq"
                                maxLength={10}
                              />
                            </td>
                            <td>
                              <select
                                className="nbom-table-select"
                                value={row.workstation}
                                onChange={(e) => {
                                  handleWorkstationSelect(idx, e.target.value);
                                  if (fieldErrors[`op_workstation_${idx}`])
                                    setFieldErrors((prev) => ({
                                      ...prev,
                                      [`op_workstation_${idx}`]: "",
                                    }));
                                }}
                                disabled={workstationsLoading}
                              >
                                <option value="">
                                  {workstationsLoading ? "Loading..." : "Select workstation..."}
                                </option>
                                {workstations.map((w) => (
                                  <option key={w.id} value={w.workstation_name}>
                                    {w.workstation_name}
                                  </option>
                                ))}
                              </select>
                              {getFieldError(`op_workstation_${idx}`) && (
                                <div style={{ marginTop: 4, color: "#dc2626", fontSize: 12 }}>
                                  {getFieldError(`op_workstation_${idx}`)}
                                </div>
                              )}
                            </td>
                            <td>
                              <input
                                className="nbom-table-input"
                                value={row.workstationType}
                                onChange={(e) =>
                                  setOpRows((rs) =>
                                    rs.map((r, i) =>
                                      i === idx ? { ...r, workstationType: e.target.value } : r
                                    )
                                  )
                                }
                                placeholder="WS Type"
                              />
                            </td>
                            <td>
                              <DigitInput
                                value={row.timeInMins}
                                onChange={(val) => {
                                  handleTimeChange(idx, val);
                                  if (fieldErrors[`op_time_${idx}`])
                                    setFieldErrors((prev) => ({ ...prev, [`op_time_${idx}`]: "" }));
                                }}
                                placeholder="0"
                                maxLength={10}
                              />
                              {getFieldError(`op_time_${idx}`) && (
                                <div style={{ marginTop: 4, color: "#dc2626", fontSize: 12 }}>
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
                              />
                            </td>
                            <td>
                              <input
                                className="nbom-table-input nbom-table-input--readonly"
                                value={row.operatingCost}
                                readOnly
                                tabIndex={-1}
                                style={{ minWidth: 90 }}
                              />
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <button
                                className="nbom-edit-btn nbom-edit-btn--delete"
                                onClick={() =>
                                  openDeleteModal(
                                    "operation",
                                    row.id,
                                    row.operation || `Row ${idx + 1}`,
                                    row.operationId
                                  )
                                }
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

        {/* ── Default Warehouse ── */}
        <div className="nbom-card">
          <div className="nbom-card__body">
            <div className="nbom-config-section">
              <div className="nbom-config-section__title">Default Warehouse</div>
              <div className="nbom-form-grid">
                <div className="nbom-field">
                  <Label text="Default Source Warehouse" />
                  <select
                    className="nbom-input"
                    value={defaultSourceWarehouse || ""}
                    onChange={(e) => setDefaultSourceWarehouse(e.target.value)}
                  >
                    <option value="">Select Source Warehouse...</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.warehouse_name}>
                        {w.warehouse_name} {w.warehouse_type ? `(${w.warehouse_type})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="nbom-field">
                  <Label text="Default Target Warehouse" />
                  <select
                    className="nbom-input"
                    value={defaultTargetWarehouse || ""}
                    onChange={(e) => setDefaultTargetWarehouse(e.target.value)}
                  >
                    <option value="">Select Target Warehouse...</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.warehouse_name}>
                        {w.warehouse_name} {w.warehouse_type ? `(${w.warehouse_type})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Cost Summary ── */}
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

      <div className="nbom-footer-row" style={{ justifyContent: "flex-end" }}>
        <button
          type="button"
          className="nbom-footer-btn nbom-footer-btn--primary nbom-footer-btn--submit"
          onClick={handleSave}
          disabled={saving}
        >
          <Save size={14} /> {saving ? "Saving..." : editData ? "Update BOM" : "Save BOM"}
        </button>
      </div>
    </div>
  );
};

export default NewBOMPage;