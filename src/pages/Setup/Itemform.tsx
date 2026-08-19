import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaSave,
  FaSpinner,
  FaPlus,
  FaTrash,
  FaTag,
  FaCheck,
  FaImage,
  FaUpload,
  FaTimes,
  FaCalculator,
  FaWarehouse,
  FaInfoCircle,
} from "react-icons/fa";
import "./ItemForm.css";
import { useAdminTheme } from "../../admin-theme/AdminThemeContext";
import toast from "react-hot-toast";
import api, { baseURL } from "../../services/api";

// ────────────────────────────────────────────────────────────────────────
// Constants & Helpers for Image Handling
// ────────────────────────────────────────────────────────────────────────
const IMAGE_BASE_URL = `${baseURL}/getimage`;

const extractRelativePath = (url: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith("data:")) return url;
  if (url.startsWith("/")) return url;

  try {
    const parsed = new URL(url);
    let path = parsed.pathname;
    if (path.startsWith("/erpsystem")) {
      path = path.substring("/erpsystem".length);
    }
    return path || "/";
  } catch {
    return `/${url}`;
  }
};

const getImageUrl = (path: string | null): string | null => {
  if (!path) return null;
  if (path.startsWith("data:")) return path;
  if (path.startsWith("http")) return path;
  const relativePath = path.startsWith("/") ? path : `/${path}`;
  return `${IMAGE_BASE_URL}${relativePath}`;
};

// ────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────
interface ItemGroup {
  id: number;
  item_group_name: string;
  parent_item_group: string;
  is_group: number;
  image: string | null;
  creation: string;
  modified: string;
}

interface UOM {
  id: number;
  uom_name: string;
  symbol: string;
  common_code: string;
  category: string;
  category_id?: number;
  enabled?: number;
  must_be_whole_number: number;
  creation: string;
}

interface UOMCategory {
  id: number;
  name: string;
  category_name: string;
  creation: string;
  modified: string;
}

interface Tax {
  tax_id: number;
  tax_type: string;
}

interface Warehouse {
  id: number;
  warehouse_name: string;
  company?: string;
}

interface InventoryRecord {
  id: number;
  name: string;
  item_Id: number;
  item_code: string;
  warehouse_Id: number;
  actual_qty: number;
  planned_qty: number;
  indented_qty: number;
  ordered_qty: number;
  reserved_qty: number;
  reserved_qty_for_production: number;
  reserved_qty_for_sub_contract: number;
  reserved_qty_for_production_plan: number;
  projected_qty: number;
  reserved_stock: number;
  stock_uom: string;
  company: string;
  valuation_rate: number;
  stock_value: number;
}

interface OpeningStockEntry {
  id: number;
  quantity: number;
  rate: number;
  total: number;
}

// ────────────────────────────────────────────────────────────────────────
// Shared UI primitives
// ────────────────────────────────────────────────────────────────────────
function SectionTitle({
  children,
  icon,
  subtitle,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="itf-section-head">
      <h3 className="itf-section-title">
        {icon && <span className="itf-section-icon">{icon}</span>}
        {children}
      </h3>
      {subtitle && <p className="itf-section-subtitle">{subtitle}</p>}
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
  error,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="itf-field">
      <label className="itf-label">
        {label} {required && <span className="itf-req">*</span>}
      </label>
      {children}
      {hint && !error && <p className="itf-hint">{hint}</p>}
      {error && <p className="itf-field-error" style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{error}</p>}
    </div>
  );
}

// ─── TextInput ──────────────────────────────────────────────────────────
function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly = false,
  min,
  prefix,
  allowOnlyAlphabets = false,
  allowOnlyDigits = false,
  maxLength,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
  min?: string;
  prefix?: string;
  allowOnlyAlphabets?: boolean;
  allowOnlyDigits?: boolean;
  maxLength?: number;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    if (allowOnlyAlphabets) {
      val = val.replace(/[^a-zA-Z0-9\s]/g, "");
    } else if (allowOnlyDigits) {
      val = val.replace(/[^0-9]/g, "");
      if (maxLength && val.length > maxLength) {
        val = val.slice(0, maxLength);
      }
    }
    
    onChange?.(val);
  };

  return (
    <div className={`itf-input-wrap ${readOnly ? "itf-input-wrap-readonly" : ""}`}>
      {prefix && <span className="itf-input-prefix">{prefix}</span>}
      <input
        className={`itf-input ${prefix ? "itf-input-has-prefix" : ""}`}
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder ?? ""}
        readOnly={readOnly}
        min={min}
        maxLength={maxLength}
      />
    </div>
  );
}

// ─── SelectInput with "+" button INSIDE the field ──────────────────────
function SelectInput({
  value,
  onChange,
  options,
  placeholder = "Search or select...",
  loading = false,
  error,
  allowOnlyAlphabets = false,
  showAddButton = false,
  onAddClick,
  theme = "light",
  onCustomValueConfirm,
  entityLabel = "option",
}: {
  value: string;
  onChange?: (v: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  loading?: boolean;
  error?: string;
  allowOnlyAlphabets?: boolean;
  showAddButton?: boolean;
  onAddClick?: () => void;
  theme?: string;
  onCustomValueConfirm?: (value: string) => void;
  /** Human-readable name used in "No X found" / "Add new X" messaging, e.g. "UOM", "Customer" */
  entityLabel?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddPrompt, setShowAddPrompt] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter((opt) => {
    let search = searchTerm;
    if (allowOnlyAlphabets) {
      search = search.replace(/[^a-zA-Z0-9\s]/g, "");
    }
    return opt.label.toLowerCase().includes(search.toLowerCase());
  });

  const selectedOption = options.find((opt) => opt.value === value);

  const isExactMatch = options.some(
    (opt) => opt.label.toLowerCase() === searchTerm.toLowerCase()
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
        setShowAddPrompt(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (allowOnlyAlphabets) {
      val = val.replace(/[^a-zA-Z0-9\s]/g, "");
    }
    setSearchTerm(val);
    setShowAddPrompt(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const trimmedSearch = searchTerm.trim();
      
      const exactMatch = options.some(
        (opt) => opt.label.toLowerCase() === trimmedSearch.toLowerCase()
      );
      
      if (trimmedSearch && !exactMatch && onCustomValueConfirm) {
        e.preventDefault();
        onCustomValueConfirm(trimmedSearch);
        setSearchTerm("");
        setIsOpen(false);
      } else if (trimmedSearch && exactMatch) {
        const match = options.find(
          (opt) => opt.label.toLowerCase() === trimmedSearch.toLowerCase()
        );
        if (match) {
          onChange?.(match.value);
          setSearchTerm("");
          setIsOpen(false);
        }
      }
    }
  };

  const trimmedSearch = searchTerm.trim();

  return (
    <div className="itf-select-wrapper-main" ref={dropdownRef}>
      <div
        className={`itf-select-wrapper ${isOpen ? "itf-select-wrapper-open" : ""} ${error ? "itf-select-wrapper-error" : ""} ${showAddButton ? "itf-select-wrapper-with-add" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <input
            autoFocus
            type="text"
            className="itf-select-display itf-select-search"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            placeholder={selectedOption?.label || placeholder}
          />
        ) : (
          <span className={`itf-select-display ${!selectedOption ? "itf-select-placeholder" : ""}`}>
            {selectedOption?.label || placeholder}
          </span>
        )}
        <span className="itf-select-arrow">
          {loading ? (
            <FaSpinner className="itf-spin" size={12} />
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={isOpen ? "itf-chevron-up" : ""}>
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      </div>

      {isOpen && (
        <div
          className="itf-select-dropdown"
          style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
        >
          {/* Scrollable area: loading state / empty state / option list */}
          <div style={{ overflowY: 'auto', flex: '1 1 auto' }}>
            {loading ? (
              <div className="itf-select-loading">
                <FaSpinner className="itf-spin" size={14} />
                <span>Loading…</span>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="itf-select-empty" style={{ padding: '10px 12px' }}>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '13px',
                    color: 'var(--text-secondary, #6b7280)',
                  }}
                >
                  <FaInfoCircle size={12} style={{ marginRight: '6px', opacity: 0.6, flexShrink: 0 }} />
                  {trimmedSearch
                    ? `No ${entityLabel} found for "${trimmedSearch}"`
                    : `No ${entityLabel} found`}
                </span>
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={`itf-select-option ${opt.value === value ? "itf-select-option-selected" : ""}`}
                  onClick={() => {
                    onChange?.(opt.value);
                    setSearchTerm("");
                    setIsOpen(false);
                  }}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>

          {/* ✅ Fixed / stable "Add New" footer - stays pinned at the bottom of the
              dropdown regardless of list scrolling, like "Add New Customer" in Delivery Challan */}
          {!loading && trimmedSearch && !isExactMatch && onCustomValueConfirm && (
            <div
              className="itf-select-option itf-select-option-add"
              onClick={(e) => {
                e.stopPropagation();
                onCustomValueConfirm(trimmedSearch);
                setSearchTerm("");
                setIsOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexShrink: 0,
                borderTop: '1px solid var(--border-color, #e5e7eb)',
                background: 'var(--card-bg, #fff)',
                color: 'var(--primary-color, #2563eb)',
                fontWeight: 500,
                fontSize: '13px',
                cursor: 'pointer',
                padding: '10px 12px',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: 'var(--primary-color, #2563eb)',
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                <FaPlus size={9} />
              </span>
              Add "{trimmedSearch}" as New {entityLabel}
            </div>
          )}
          {!loading && showAddButton && !trimmedSearch && (
            <div
              className="itf-select-option itf-select-option-add"
              onClick={(e) => {
                e.stopPropagation();
                onAddClick?.();
                setIsOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexShrink: 0,
                borderTop: '1px solid var(--border-color, #e5e7eb)',
                background: 'var(--card-bg, #fff)',
                color: 'var(--primary-color, #2563eb)',
                fontWeight: 500,
                fontSize: '13px',
                cursor: 'pointer',
                padding: '10px 12px',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: 'var(--primary-color, #2563eb)',
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                <FaPlus size={9} />
              </span>
              Add New {entityLabel}
            </div>
          )}
        </div>
      )}
      {error && <p className="itf-field-error" style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{error}</p>}
    </div>
  );
}

// ─── ImageUpload ──────────────────────────────────────────────────────
function ImageUpload({
  image,
  onImageChange,
  onImageRemove,
  uploading,
}: {
  image: string | null;
  onImageChange: (file: File) => void;
  onImageRemove: () => void;
  uploading?: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(`Image should be under 2MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
      return;
    }
    onImageChange(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const displayImage = image ? getImageUrl(image) : null;

  return (
    <div className="itf-image-upload-container">
      {displayImage ? (
        <div className="itf-image-preview-wrapper">
          <div className="itf-image-preview">
            <img src={displayImage} alt="Item" className="itf-image-preview-img" />
          </div>
          <div className="itf-image-actions">
            <button
              type="button"
              className="itf-image-btn itf-image-btn-change"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <FaUpload size={11} /> Change
            </button>
            <button
              type="button"
              className="itf-image-btn itf-image-btn-remove"
              onClick={onImageRemove}
              disabled={uploading}
            >
              <FaTimes size={11} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`itf-image-dropzone ${dragOver ? "itf-image-dropzone-drag" : ""}`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragOver(false);
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="itf-image-dropzone-content">
            {uploading ? (
              <>
                <FaSpinner className="itf-spin" size={26} />
                <p>Uploading…</p>
              </>
            ) : (
              <>
                <span className="itf-image-icon-wrap">
                  <FaImage size={0} />
                </span>
                <p className="itf-image-dropzone-text">
                  <span className="itf-image-dropzone-bold">Click to upload</span> or drag and drop
                </p>
                <p className="itf-image-dropzone-hint">PNG, JPG, GIF up to 2MB</p>
              </>
            )}
          </div>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
          e.target.value = "";
        }}
        className="itf-image-file-input"
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Opening Stock Table
// ────────────────────────────────────────────────────────────────────────
function OpeningStockTable({
  entries,
  onChange,
}: {
  entries: OpeningStockEntry[];
  onChange: (entries: OpeningStockEntry[]) => void;
}) {
  useEffect(() => {
    if (entries.length === 0) {
      onChange([{ id: 1, quantity: 0, rate: 0, total: 0 }]);
    }
  }, [entries, onChange]);

  const handleUpdate = (field: "quantity" | "rate", value: number) => {
    if (entries.length > 0) {
      const entry = entries[0];
      const updated = { ...entry, [field]: value };
      updated.total = updated.quantity * updated.rate;
      onChange([updated]);
    }
  };

  const entry = entries.length > 0 ? entries[0] : { id: 1, quantity: 0, rate: 0, total: 0 };

  return (
    <div className="itf-opening-stock">
      <div className="itf-opening-stock-header">
        <div>
          <h4>Opening stock entry</h4>
          <p className="itf-opening-stock-sub">Record the stock on hand when this item is created.</p>
        </div>
      </div>

      <div className="itf-table-wrapper">
        <table className="itf-table">
          <thead>
            <tr>
              <th className="itf-table-th-num">#</th>
              <th>Quantity</th>
              <th>Rate (base price)</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="itf-table-td-num">1</td>
              <td>
                <NumberInput
                  value={entry.quantity || ""}
                  onChange={(v) => handleUpdate("quantity", parseFloat(v) || 0)}
                  placeholder="0"
                  min={0}
                  step={1}
                  allowDecimal={false}
                />
              </td>
              <td>
                <NumberInput
                  value={entry.rate || ""}
                  onChange={(v) => handleUpdate("rate", parseFloat(v) || 0)}
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                  prefix="₹"
                />
              </td>
              <td className="itf-table-total">₹{entry.total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Pricing Summary
// ────────────────────────────────────────────────────────────────────────
function PricingSummary({
  basePrice,
  profitMargin,
  taxPercentage,
  taxType,
  isRawMaterial = false,
}: {
  basePrice: number;
  profitMargin: number;
  taxPercentage: number;
  taxType: string;
  isRawMaterial?: boolean;
}) {
  const profitAmount = basePrice * (profitMargin / 100);
  const priceBeforeTax = basePrice + profitAmount;
  const taxAmount = priceBeforeTax * (taxPercentage / 100);
  const finalSellingPrice = priceBeforeTax + taxAmount;

  const rows = [
    { label: "Base price (purchase rate)", value: basePrice },
    ...(isRawMaterial ? [] : [{ label: `Profit margin (${profitMargin || 0}%)`, value: profitAmount }]),
    { label: "Price before tax", value: priceBeforeTax, divider: true },
    { label: `${taxType} (${taxPercentage}%)`, value: taxAmount },
  ];

  return (
    <div className="itf-pricing-summary">
      <div className="itf-pricing-list">
        {rows.map((row) => (
          <div key={row.label} className={`itf-pricing-item ${row.divider ? "itf-pricing-item-divider" : ""}`}>
            <span className="itf-pricing-label">{row.label}</span>
            <span className="itf-pricing-value">₹{row.value.toFixed(2)}</span>
          </div>
        ))}
        <div className="itf-pricing-item itf-pricing-total">
          <span className="itf-pricing-label">Final selling price (MRP)</span>
          <span className="itf-pricing-value">₹{finalSellingPrice.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// NumberInput Component
// ────────────────────────────────────────────────────────────────────────
interface NumberInputProps {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  allowDecimal?: boolean;
  maxLength?: number;
}

function NumberInput({
  value,
  onChange,
  placeholder = "0.00",
  min,
  max,
  prefix,
  suffix,
  disabled = false,
  readOnly = false,
  className = "",
  allowDecimal = true,
  maxLength,
}: NumberInputProps) {
  const [displayValue, setDisplayValue] = useState<string>(String(value || ""));

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setDisplayValue(String(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value;
    
    if (rawValue === "") {
      setDisplayValue("");
      onChange("");
      return;
    }

    if (!allowDecimal) {
      rawValue = rawValue.replace(/[^0-9]/g, "");
    } else {
      const parts = rawValue.split(".");
      if (parts.length > 2) {
        rawValue = parts[0] + "." + parts.slice(1).join("");
      }
      rawValue = rawValue.replace(/[^0-9.]/g, "");
      const decimalCount = (rawValue.match(/\./g) || []).length;
      if (decimalCount > 1) {
        const firstDecimalIndex = rawValue.indexOf(".");
        rawValue = rawValue.substring(0, firstDecimalIndex + 1) + 
                   rawValue.substring(firstDecimalIndex + 1).replace(/\./g, "");
      }
    }

    if (maxLength && rawValue.replace(/\./g, "").length > maxLength) {
      return;
    }

    setDisplayValue(rawValue);

    if (rawValue === "" || rawValue === "-" || rawValue === ".") {
      onChange(rawValue);
      return;
    }

    const numValue = parseFloat(rawValue);
    if (!isNaN(numValue)) {
      if (min !== undefined && numValue < min) {
        const clamped = min.toString();
        setDisplayValue(clamped);
        onChange(clamped);
        return;
      }
      if (max !== undefined && numValue > max) {
        const clamped = max.toString();
        setDisplayValue(clamped);
        onChange(clamped);
        return;
      }
      onChange(rawValue);
    }
  };

  const handleBlur = () => {
    if (displayValue === "" || displayValue === "." || displayValue === "-") {
      setDisplayValue("");
      onChange("");
      return;
    }
    
    const numValue = parseFloat(displayValue);
    if (!isNaN(numValue)) {
      const formatted = allowDecimal ? numValue.toString() : Math.round(numValue).toString();
      setDisplayValue(formatted);
      onChange(formatted);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.preventDefault();
  };

  return (
    <div className={`itf-input-wrap ${readOnly ? "itf-input-wrap-readonly" : ""} ${className}`}>
      {prefix && <span className="itf-input-prefix">{prefix}</span>}
      <input
        type="text"
        className={`itf-input ${prefix ? "itf-input-has-prefix" : ""}`}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onWheel={handleWheel}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        inputMode={allowDecimal ? "decimal" : "numeric"}
        autoComplete="off"
      />
      {suffix && <span className="itf-input-suffix">{suffix}</span>}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Add Item Group Modal
// ────────────────────────────────────────────────────────────────────────
function AddItemGroupModal({
  isOpen,
  onClose,
  onSave,
  saving,
  theme = "light",
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, company: string) => void;
  saving: boolean;
  theme?: string;
}) {
  const [groupName, setGroupName] = useState("");
  const [company, setCompany] = useState("");

  useEffect(() => {
    if (isOpen) {
      setGroupName("");
      setCompany("");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error("Item Group Name is required");
      return;
    }
    if (!company.trim()) {
      toast.error("Company is required");
      return;
    }
    onSave(groupName.trim(), company.trim());
  };

  if (!isOpen) return null;

  const isDark = theme === "dark";

  return (
    <div className="itf-modal-overlay" onClick={onClose}>
      <div className={`itf-modal ${isDark ? "itf-modal-dark" : "itf-modal-light"}`} onClick={(e) => e.stopPropagation()}>
        <div className="itf-modal-header">
          <div className="itf-modal-header-left">
            <span className="itf-modal-icon">
              <FaTag size={18} />
            </span>
            <h3>Add New Item Group</h3>
          </div>
          <button type="button" className="itf-modal-close" onClick={onClose}>
            <FaTimes size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="itf-modal-body">
            <p className="itf-modal-subtitle">Create a new item group to organize your items.</p>
            
            <div className="itf-modal-form-group">
              <label className="itf-modal-label">
                Item Group Name <span className="itf-req">*</span>
              </label>
              <div className="itf-modal-input-wrap">
                <input
                  type="text"
                  className={`itf-modal-input ${isDark ? "itf-modal-input-dark" : "itf-modal-input-light"}`}
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value.replace(/[^a-zA-Z0-9\s]/g, ""))}
                  placeholder="Enter item group name (e.g. Raw Material)"
                  autoFocus
                />
              </div>
              <p className="itf-modal-hint">Only alphabets, digits, and spaces are allowed</p>
            </div>

            <div className="itf-modal-form-group">
              <label className="itf-modal-label">
                Company <span className="itf-req">*</span>
              </label>
              <div className="itf-modal-input-wrap">
                <input
                  type="text"
                  className={`itf-modal-input ${isDark ? "itf-modal-input-dark" : "itf-modal-input-light"}`}
                  value={company}
                  onChange={(e) => setCompany(e.target.value.replace(/[^a-zA-Z0-9\s]/g, ""))}
                  placeholder="Enter company name"
                />
              </div>
              <p className="itf-modal-hint">Only alphabets, digits, and spaces are allowed</p>
            </div>
          </div>

          <div className="itf-modal-footer">
            <button type="button" className="itf-modal-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className={`itf-modal-btn-save ${isDark ? "itf-modal-btn-save-dark" : "itf-modal-btn-save-light"}`} 
              disabled={saving}
            >
              {saving ? <FaSpinner className="itf-spin" size={14} /> : <FaPlus size={14} />}
              {saving ? "Adding..." : "Add Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Add UOM Modal - with Category dropdown from API
// ────────────────────────────────────────────────────────────────────────
function AddUOMModal({
  isOpen,
  onClose,
  onSave,
  saving,
  theme = "light",
  categoryOptions = [],
  loadingCategories = false,
  initialUOMName = "",
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, symbol: string, categoryId: string) => void;
  saving: boolean;
  theme?: string;
  categoryOptions?: { label: string; value: string }[];
  loadingCategories?: boolean;
  initialUOMName?: string;
}) {
  const [uomName, setUomName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUomName(initialUOMName || "");
      setSymbol("");
      setSelectedCategory("");
      setIsCategoryOpen(false);
    }
  }, [isOpen, initialUOMName]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uomName.trim()) {
      toast.error("UOM Name is required");
      return;
    }
    if (!symbol.trim()) {
      toast.error("Symbol is required");
      return;
    }
    if (!selectedCategory) {
      toast.error("Category is required");
      return;
    }
    onSave(uomName.trim(), symbol.trim(), selectedCategory);
  };

  if (!isOpen) return null;

  const isDark = theme === "dark";
  const selectedCategoryLabel = categoryOptions.find(opt => opt.value === selectedCategory)?.label || "";

  return (
    <div className="itf-modal-overlay" onClick={onClose}>
      <div className={`itf-modal ${isDark ? "itf-modal-dark" : "itf-modal-light"}`} onClick={(e) => e.stopPropagation()}>
        <div className="itf-modal-header">
          <div className="itf-modal-header-left">
            <span className="itf-modal-icon">
              <FaTag size={18} />
            </span>
            <h3>Add New UOM</h3>
          </div>
          <button type="button" className="itf-modal-close" onClick={onClose}>
            <FaTimes size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="itf-modal-body">
            <p className="itf-modal-subtitle">Create a new unit of measure for your items.</p>
            
            <div className="itf-modal-form-group">
              <label className="itf-modal-label">
                UOM Name <span className="itf-req">*</span>
              </label>
              <div className="itf-modal-input-wrap">
                <input
                  type="text"
                  className={`itf-modal-input ${isDark ? "itf-modal-input-dark" : "itf-modal-input-light"}`}
                  value={uomName}
                  onChange={(e) => setUomName(e.target.value.replace(/[^a-zA-Z0-9\s]/g, ""))}
                  placeholder="Enter UOM name (e.g. Kilogram, Meter)"
                  autoFocus
                />
              </div>
              <p className="itf-modal-hint">Only alphabets, digits, and spaces are allowed</p>
            </div>

            <div className="itf-modal-form-group">
              <label className="itf-modal-label">
                Symbol <span className="itf-req">*</span>
              </label>
              <div className="itf-modal-input-wrap">
                <input
                  type="text"
                  className={`itf-modal-input ${isDark ? "itf-modal-input-dark" : "itf-modal-input-light"}`}
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
                  placeholder="Enter symbol (e.g. kg, m)"
                />
              </div>
              <p className="itf-modal-hint">Only alphabets and digits are allowed</p>
            </div>

            {/* ✅ Category Dropdown */}
            <div className="itf-modal-form-group">
              <label className="itf-modal-label">
                Category <span className="itf-req">*</span>
              </label>
              <div className="itf-select-wrapper-main" ref={categoryDropdownRef}>
                <div
                  className={`itf-select-wrapper ${isCategoryOpen ? "itf-select-wrapper-open" : ""} ${isDark ? "itf-select-add-btn-dark" : "itf-select-add-btn-light"}`}
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                >
                  <span className={`itf-select-display ${!selectedCategory ? "itf-select-placeholder" : ""}`}>
                    {selectedCategoryLabel || (loadingCategories ? "Loading..." : "Search or select category...")}
                  </span>
                  <span className="itf-select-arrow">
                    {loadingCategories ? (
                      <FaSpinner className="itf-spin" size={12} />
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={isCategoryOpen ? "itf-chevron-up" : ""}>
                        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                </div>

                {isCategoryOpen && (
                  <div className="itf-select-dropdown">
                    {loadingCategories ? (
                      <div className="itf-select-loading">
                        <FaSpinner className="itf-spin" size={14} />
                        <span>Loading categories…</span>
                      </div>
                    ) : categoryOptions.length === 0 ? (
                      <div className="itf-select-empty">
                        <span>No categories found</span>
                      </div>
                    ) : (
                      categoryOptions.map((opt) => (
                        <div
                          key={opt.value}
                          className={`itf-select-option ${opt.value === selectedCategory ? "itf-select-option-selected" : ""}`}
                          onClick={() => {
                            setSelectedCategory(opt.value);
                            setIsCategoryOpen(false);
                          }}
                        >
                          {opt.label}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <p className="itf-modal-hint">Select a category from the list</p>
            </div>
          </div>

          <div className="itf-modal-footer">
            <button type="button" className="itf-modal-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className={`itf-modal-btn-save ${isDark ? "itf-modal-btn-save-dark" : "itf-modal-btn-save-light"}`} 
              disabled={saving}
            >
              {saving ? <FaSpinner className="itf-spin" size={14} /> : <FaPlus size={14} />}
              {saving ? "Adding..." : "Add UOM"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────────────────
export default function ItemForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useAdminTheme();

  const isNew = id === "new" || !id;
  const itemId = isNew ? null : parseInt(id || "0");

  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ field: string; label: string; message: string }[]>([]);
  const [warehouseManuallyChanged, setWarehouseManuallyChanged] = useState(false);
  const [previousItemGroup, setPreviousItemGroup] = useState<string>("");

  // ─── State for Add UOM Modal ────────────────────────────────────────
  const [showAddUOMModal, setShowAddUOMModal] = useState(false);
  const [addingUOM, setAddingUOM] = useState(false);
  const [pendingUOMName, setPendingUOMName] = useState("");

  // ─── State for UOM Categories ──────────────────────────────────────
  const [uomCategories, setUomCategories] = useState<UOMCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [form, setFormRaw] = useState({
    id: 0,
    itemName: "",
    itemCode: "",
    itemGroup: "",
    defaultUOM: "Nos",
    brand: "",
    description: "",
    disabled: false,
    standardRate: "",
    sellingPrice: "0.00",
    profitMargin: "",
    image: null as string | null,
    isSalesItem: false,
    isPurchaseItem: false,
    isStockItem: true,
    safetyStock: "",
    lastPurchaseRate: "0.00",
    valuationRate: "0.00",
    taxId: "1",
    inspectionRequiredBeforePurchase: false,
    inspectionRequiredBeforeDelivery: false,
    warehouseId: "",
    hsn: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [openingStockEntries, setOpeningStockEntries] = useState<OpeningStockEntry[]>([]);

  const setForm = (f: any) => {
    setFormRaw(f);
    setIsDirty(true);
  };
  const s = (k: string, v: any) => setForm({ ...form, [k]: v });

  const [itemGroups, setItemGroups] = useState<ItemGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [uoms, setUoms] = useState<UOM[]>([]);
  const [loadingUoms, setLoadingUoms] = useState(false);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loadingTaxes, setLoadingTaxes] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [inventoryRecord, setInventoryRecord] = useState<InventoryRecord | null>(null);
  const [loadingInventory, setLoadingInventory] = useState(false);

  const currentTax = taxes.find((t) => t.tax_id.toString() === form.taxId);
  const taxPercentage = currentTax ? parseFloat(currentTax.tax_type.replace("GST", "")) || 0 : 0;

  const isRawMaterialGroup = (groupName: string): boolean => {
    if (!groupName) return false;
    const rawMaterialGroups = [
      "raw material", "raw materials", "input material",
      "raw material store", "raw materials store",
      "component", "components", "parts",
      "sub assembly", "sub-assembly",
      "raw material -", "raw materials -",
    ];
    const lowerGroup = groupName.toLowerCase().trim();
    return rawMaterialGroups.some(g => lowerGroup.includes(g));
  };

  const getDefaultWarehouse = (itemGroup: string, warehouseList: Warehouse[]): Warehouse | null => {
    if (!itemGroup || warehouseList.length === 0) return null;

    if (isRawMaterialGroup(itemGroup)) {
      let warehouse = warehouseList.find(
        (w) => w.warehouse_name.toLowerCase() === "raw material store"
      );
      if (!warehouse) {
        warehouse = warehouseList.find(
          (w) => w.warehouse_name.toLowerCase().includes("raw material")
        );
      }
      return warehouse || null;
    } else {
      let warehouse = warehouseList.find(
        (w) => w.warehouse_name.toLowerCase() === "finished goods"
      );
      if (!warehouse) {
        warehouse = warehouseList.find(
          (w) => w.warehouse_name.toLowerCase() === "finished goods store"
        );
      }
      if (!warehouse) {
        warehouse = warehouseList.find(
          (w) => w.warehouse_name.toLowerCase().includes("finished goods")
        );
      }
      if (!warehouse) {
        warehouse = warehouseList.find(
          (w) => w.warehouse_name.toLowerCase().includes("finished")
        );
      }
      return warehouse || null;
    }
  };

  const compressImage = (file: File, maxWidth = 600, maxHeight = 600, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  useEffect(() => {
    const basePrice = parseFloat(form.standardRate) || 0;
    const profitMargin = isRawMaterialGroup(form.itemGroup) ? 0 : parseFloat(form.profitMargin) || 0;
    const profitAmount = basePrice * (profitMargin / 100);
    const priceBeforeTax = basePrice + profitAmount;
    const taxAmount = priceBeforeTax * (taxPercentage / 100);
    const finalPrice = priceBeforeTax + taxAmount;

    setFormRaw((prev) => ({
      ...prev,
      sellingPrice: finalPrice.toFixed(2),
      valuationRate: priceBeforeTax.toFixed(2),
      lastPurchaseRate: basePrice.toFixed(2),
    }));
  }, [form.standardRate, form.profitMargin, taxPercentage, form.itemGroup]);

  // ─── ✅ GET API: Fetch UOMs (direct /uom endpoint) ─────────────────
  const fetchUOMs = async () => {
    setLoadingUoms(true);
    try {
      const response = await api.get("/uom");
      console.log("UOM Response:", response.data);
      
      if (response.data.success === 1) {
        const uomRecords = response.data.data?.records || response.data.data || [];
        console.log("UOM Records:", uomRecords);
        setUoms(uomRecords);
      } else {
        console.warn("UOM API failed, using default UOMs");
        setUoms([
          { id: 1, uom_name: "Nos", symbol: "Nos", common_code: "", category: "General", must_be_whole_number: 1, creation: "" },
          { id: 2, uom_name: "Kg", symbol: "Kg", common_code: "", category: "Weight", must_be_whole_number: 1, creation: "" },
          { id: 3, uom_name: "Meter", symbol: "m", common_code: "", category: "Length", must_be_whole_number: 1, creation: "" },
          { id: 4, uom_name: "Gram", symbol: "g", common_code: "", category: "Weight", must_be_whole_number: 1, creation: "" },
          { id: 5, uom_name: "Liter", symbol: "L", common_code: "", category: "Volume", must_be_whole_number: 1, creation: "" },
        ]);
      }
    } catch (err) {
      console.error("Error fetching UOMs:", err);
      setUoms([
        { id: 1, uom_name: "Nos", symbol: "Nos", common_code: "", category: "General", must_be_whole_number: 1, creation: "" },
        { id: 2, uom_name: "Kg", symbol: "Kg", common_code: "", category: "Weight", must_be_whole_number: 1, creation: "" },
        { id: 3, uom_name: "Meter", symbol: "m", common_code: "", category: "Length", must_be_whole_number: 1, creation: "" },
        { id: 4, uom_name: "Gram", symbol: "g", common_code: "", category: "Weight", must_be_whole_number: 1, creation: "" },
        { id: 5, uom_name: "Liter", symbol: "L", common_code: "", category: "Volume", must_be_whole_number: 1, creation: "" },
      ]);
    } finally {
      setLoadingUoms(false);
    }
  };

  // ─── ✅ GET API: Fetch UOM Categories ──────────────────────────────
  const fetchUOMCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await api.get("/uom-category");
      console.log("UOM Category Response:", response.data);
      
      if (response.data.success === 1) {
        const categories = response.data.data?.records || response.data.data || [];
        console.log("UOM Categories:", categories);
        setUomCategories(categories);
      } else {
        console.warn("UOM Category API failed, using empty list");
        setUomCategories([]);
      }
    } catch (err) {
      console.error("Error fetching UOM categories:", err);
      setUomCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  // ─── ✅ GET API: Fetch Item Groups ──────────────────────────────────
  const fetchItemGroups = async () => {
    setLoadingGroups(true);
    try {
      const response = await api.get("/item-group?type=Input%0Material");
      if (response.data.success === 1) {
        setItemGroups(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching item groups:", err);
    } finally {
      setLoadingGroups(false);
    }
  };

  // ─── ✅ POST API: Add New UOM ──────────────────────────────────────
  const handleAddUOM = async (uomName: string, symbol: string, categoryId: string) => {
    setAddingUOM(true);
    try {
      const selectedCategory = uomCategories.find(cat => String(cat.id) === categoryId);
      const generatedCommonCode = symbol || uomName.substring(0, 3).toUpperCase();

      // ✅ Duplicate checks
      const nameClash = uoms.find(
        (u) => u.uom_name.trim().toLowerCase() === uomName.trim().toLowerCase()
      );
      if (nameClash) {
        toast.error(`A UOM named "${uomName}" already exists. Choose a different name.`);
        setAddingUOM(false);
        return;
      }

      const symbolClash = uoms.find(
        (u) => u.symbol && u.symbol.trim().toLowerCase() === symbol.trim().toLowerCase()
      );
      if (symbolClash) {
        toast.error(`Symbol "${symbol}" is already used by "${symbolClash.uom_name}". Choose a different symbol.`);
        setAddingUOM(false);
        return;
      }

      const commonCodeClash = uoms.find(
        (u) => u.common_code && u.common_code.trim().toLowerCase() === generatedCommonCode.trim().toLowerCase()
      );
      if (commonCodeClash) {
        toast.error(
          `Internal code "${generatedCommonCode}" is already used by "${commonCodeClash.uom_name}". Try a different symbol.`
        );
        setAddingUOM(false);
        return;
      }

      const payload = {
        uom_name: uomName,
        symbol: symbol || "",
        category: selectedCategory?.category_name || selectedCategory?.name || "General",
        common_code: generatedCommonCode,
        must_be_whole_number: 1,
      };

      console.log("📤 Sending UOM Payload:", JSON.stringify(payload, null, 2));

      const response = await api.post("/uom", payload);

      console.log("📥 UOM Response:", response.data);

      if (response.data.success === 1) {
        toast.success(`UOM "${uomName}" created successfully!`);
        setShowAddUOMModal(false);
        setPendingUOMName("");
        
        await fetchUOMs();
        
        setTimeout(() => {
          s("defaultUOM", uomName);
        }, 500);
      } else {
        toast.error(response.data?.message || "Failed to create UOM");
      }
    } catch (err: any) {
      console.error("❌ Error creating UOM:", err);

      if (err.response) {
        console.error("Full error response:", JSON.stringify(err.response.data, null, 2));

        const serverMessage =
          err.response.data?.message ||
          err.response.data?.error ||
          err.response.data?.sqlMessage ||
          err.response.data?.detail ||
          JSON.stringify(err.response.data);

        if (err.response.status === 409) {
          toast.error(`UOM "${uomName}" already exists!`);
        } else if (err.response.status === 500) {
          toast.error(`Server Error: ${serverMessage}`, { duration: 10000 });
          console.error("Full 500 Error:", err.response.data);
        } else {
          toast.error(`Error ${err.response.status}: ${serverMessage}`);
        }
      } else if (err.request) {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setAddingUOM(false);
    }
  };

  // ─── Handle Custom UOM Value Confirmation ──────────────────────────
  const handleCustomUOMConfirm = (customValue: string) => {
    const exists = uoms.some(
      (u) => u.uom_name.trim().toLowerCase() === customValue.trim().toLowerCase()
    );

    if (exists) {
      s("defaultUOM", customValue.trim());
      toast.info(`UOM "${customValue}" already exists. Selected.`);
      return;
    }

    setPendingUOMName(customValue.trim());
    setShowAddUOMModal(true);
  };

  useEffect(() => {
    const fetchLookups = async () => {
      await fetchItemGroups();
      await fetchUOMs();
      await fetchUOMCategories();

      setLoadingTaxes(true);
      try {
        const response = await api.get("/item/get-tax");
        if (response.data.success === 1) setTaxes(response.data.data);
      } catch (err) {
        console.error("Error fetching taxes:", err);
        toast.error("Failed to load tax data");
      } finally {
        setLoadingTaxes(false);
      }

      setLoadingWarehouses(true);
      try {
        const response = await api.get("/warehouse");
        if (response.data.success === 1) {
          setWarehouses(response.data.data.records || response.data.data || []);
        }
      } catch (err) {
        console.error("Error fetching warehouses:", err);
        toast.error("Failed to load warehouses");
      } finally {
        setLoadingWarehouses(false);
      }
    };

    fetchLookups();
  }, []);

  const fetchItemData = async () => {
    if (!itemId) return;

    setLoading(true);
    try {
      const response = await api.get(`/item/${itemId}`);

      if (response.data.success === 1) {
        const data = response.data.data;

        const standardRate = Number(data.standard_rate) || 0;
        const valuationRate = Number(data.valuation_rate) || 0;

        const derivedMargin =
          standardRate > 0 && valuationRate >= standardRate
            ? (((valuationRate - standardRate) / standardRate) * 100).toFixed(2)
            : "";

        setFormRaw({
          id: data.id || 0,
          itemName: data.item_name || "",
          itemCode: data.item_code || "",
          itemGroup: data.item_group || "",
          defaultUOM: data.stock_uom || "Nos",
          brand: data.brand || "",
          description: data.description || "",
          disabled: data.disabled === 1,
          standardRate: standardRate > 0 ? String(standardRate) : "",
          sellingPrice: String(data.selling_price || 0),
          profitMargin: derivedMargin,
          image: extractRelativePath(data.image),
          isSalesItem: data.is_sales_item === 1,
          isPurchaseItem: data.is_purchase_item === 1,
          isStockItem: data.is_stock_item === 1,
          safetyStock: data.safety_stock ? String(data.safety_stock) : "",
          lastPurchaseRate: String(data.last_purchase_rate || 0),
          valuationRate: String(valuationRate),
          taxId: String(data.tax_id || 1),
          inspectionRequiredBeforePurchase: data.inspection_required_before_purchase === 1,
          inspectionRequiredBeforeDelivery: data.inspection_required_before_delivery === 1,
          warehouseId: "",
          hsn: data.hsn || data.HSN || "",
        });

        const openingQty = Number(data.opening_stock) || 0;
        const openingRate = Number(data.opening_stock_rate) || 0;
        if (openingQty > 0 || openingRate > 0) {
          setOpeningStockEntries([
            {
              id: 1,
              quantity: openingQty,
              rate: openingRate,
              total: openingQty * openingRate,
            },
          ]);
        } else {
          setOpeningStockEntries([{ id: 1, quantity: 0, rate: 0, total: 0 }]);
        }

        setImageFile(null);
        setIsDirty(false);

        await fetchInventoryForItem(data.id);
      } else {
        toast.error("Failed to load item data");
      }
    } catch (err) {
      console.error("Error fetching item:", err);
      toast.error("Failed to load item data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isNew && itemId) fetchItemData();
  }, [isNew, itemId]);

  const fetchInventoryRecord = async (inventoryId: number) => {
    setLoadingInventory(true);
    try {
      const response = await api.get(`/inventory/${inventoryId}`);
      if (response.data.success === 1) {
        setInventoryRecord(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching inventory record:", err);
    } finally {
      setLoadingInventory(false);
    }
  };

  const fetchInventoryForItem = async (targetItemId: number): Promise<boolean> => {
    setLoadingInventory(true);
    try {
      const response = await api.get("/inventory");
      if (response.data.success === 1) {
        const records: InventoryRecord[] = response.data.data.records || response.data.data || [];
        const match = records.find((r) => r.item_Id === targetItemId);

        if (match) {
          setInventoryRecord(match);
          setFormRaw((prev) => ({
            ...prev,
            warehouseId: String(match.warehouse_Id),
          }));
          setOpeningStockEntries([
            {
              id: 1,
              quantity: match.actual_qty,
              rate: match.valuation_rate,
              total: match.stock_value,
            },
          ]);
          return true;
        }
      }
      setInventoryRecord(null);
      return false;
    } catch (err) {
      console.error("Error fetching inventory list:", err);
      setInventoryRecord(null);
      return false;
    } finally {
      setLoadingInventory(false);
    }
  };

  const groupOptions = itemGroups.map((group) => ({
    label: group.item_group_name,
    value: group.item_group_name,
  }));

  const uomOptions = uoms.map((uom: UOM) => ({
    label: uom.uom_name + (uom.symbol ? ` (${uom.symbol})` : ""),
    value: uom.uom_name,
  }));

  const taxOptions = taxes.map((tax) => ({
    label: tax.tax_type,
    value: tax.tax_id.toString(),
  }));

  const categoryOptions = uomCategories.map((cat) => ({
    label: cat.category_name || cat.name || "Unnamed",
    value: String(cat.id),
  }));

  useEffect(() => {
    if (form.itemGroup && form.itemGroup !== previousItemGroup) {
      setPreviousItemGroup(form.itemGroup);
      setWarehouseManuallyChanged(false);
      
      if (warehouses.length > 0) {
        const defaultWarehouse = getDefaultWarehouse(form.itemGroup, warehouses);
        if (defaultWarehouse) {
          setFormRaw((prev) => ({
            ...prev,
            warehouseId: defaultWarehouse.id.toString(),
          }));
        }
      }
    }
  }, [form.itemGroup, previousItemGroup, warehouses]);

  useEffect(() => {
    if (warehouses.length > 0 && form.itemGroup && !form.warehouseId && !warehouseManuallyChanged) {
      const defaultWarehouse = getDefaultWarehouse(form.itemGroup, warehouses);
      if (defaultWarehouse) {
        setFormRaw((prev) => ({
          ...prev,
          warehouseId: defaultWarehouse.id.toString(),
        }));
        setPreviousItemGroup(form.itemGroup);
      }
    }
  }, [warehouses, form.itemGroup, form.warehouseId, warehouseManuallyChanged]);

  const warehouseOptions = warehouses.map((w) => ({
    label: w.warehouse_name,
    value: w.id.toString(),
  }));

  const validateAlphabetsAndDigits = (value: string): boolean => {
    return /^[a-zA-Z0-9\s]*$/.test(value);
  };

  const validateDigitsOnly = (value: string): boolean => {
    return /^[0-9]*$/.test(value);
  };

  const getValidationErrors = () => {
    const errors: { field: string; label: string; message: string }[] = [];

    if (!form.itemName.trim()) {
      errors.push({ field: "itemName", label: "Item Name", message: "Item name is required" });
    } else if (form.itemName.length > 140) {
      errors.push({ field: "itemName", label: "Item Name", message: "Item name must be 140 characters or less" });
    } else if (!validateAlphabetsAndDigits(form.itemName)) {
      errors.push({ field: "itemName", label: "Item Name", message: "Item name must contain only alphabets, digits, and spaces" });
    }

    if (form.itemCode && form.itemCode.length > 140) {
      errors.push({ field: "itemCode", label: "Item Code", message: "Item code must be 140 characters or less" });
    }

    if (!form.itemGroup.trim()) {
      errors.push({ field: "itemGroup", label: "Item Group", message: "Item group is required" });
    } else if (form.itemGroup.length > 140) {
      errors.push({ field: "itemGroup", label: "Item Group", message: "Item group must be 140 characters or less" });
    } else if (!validateAlphabetsAndDigits(form.itemGroup)) {
      errors.push({ field: "itemGroup", label: "Item Group", message: "Item group must contain only alphabets, digits, and spaces" });
    }

    if (!form.defaultUOM.trim()) {
      errors.push({ field: "defaultUOM", label: "Default UOM", message: "Default unit of measure is required" });
    } else if (form.defaultUOM.length > 140) {
      errors.push({ field: "defaultUOM", label: "Default UOM", message: "UOM must be 140 characters or less" });
    } else if (!validateAlphabetsAndDigits(form.defaultUOM)) {
      errors.push({ field: "defaultUOM", label: "Default UOM", message: "UOM must contain only alphabets, digits, and spaces" });
    }

    if (form.hsn && form.hsn.length > 45) {
      errors.push({ field: "hsn", label: "HSN Code", message: "HSN code must be 45 characters or less" });
    } else if (form.hsn && !validateDigitsOnly(form.hsn)) {
      errors.push({ field: "hsn", label: "HSN Code", message: "HSN code must contain only digits" });
    }

    if (form.brand && form.brand.length > 140) {
      errors.push({ field: "brand", label: "Brand", message: "Brand must be 140 characters or less" });
    } else if (form.brand && !validateAlphabetsAndDigits(form.brand)) {
      errors.push({ field: "brand", label: "Brand", message: "Brand must contain only alphabets, digits, and spaces" });
    }

    if (!form.taxId) {
      errors.push({ field: "taxId", label: "Tax Type", message: "Tax type is required" });
    }

    const standardRate = parseFloat(form.standardRate);
    if (form.standardRate !== "" && (isNaN(standardRate) || standardRate < 0)) {
      errors.push({ field: "standardRate", label: "Standard Rate", message: "Standard rate must be a valid number" });
    }

    const sellingPrice = parseFloat(form.sellingPrice);
    if (isNaN(sellingPrice) || sellingPrice < 0) {
      errors.push({ field: "sellingPrice", label: "Selling Price", message: "Selling price must be a valid number" });
    }

    if (form.safetyStock && !validateDigitsOnly(form.safetyStock)) {
      errors.push({ field: "safetyStock", label: "Safety Stock", message: "Safety stock must contain only digits" });
    }
    const safetyStock = parseFloat(form.safetyStock);
    if (form.safetyStock !== "" && (isNaN(safetyStock) || safetyStock < 0)) {
      errors.push({ field: "safetyStock", label: "Safety Stock", message: "Safety stock must be a valid number" });
    }

    if (form.isStockItem && !form.warehouseId) {
      errors.push({ field: "warehouseId", label: "Warehouse", message: "Select a warehouse to track inventory for this item" });
    }

    if (!isRawMaterialGroup(form.itemGroup)) {
      const profitMargin = parseFloat(form.profitMargin);
      if (form.profitMargin !== "" && (isNaN(profitMargin) || profitMargin < 0)) {
        errors.push({ field: "profitMargin", label: "Profit Margin", message: "Profit margin must be a valid number" });
      }
    }

    const valuationRate = parseFloat(form.valuationRate);
    if (isNaN(valuationRate) || valuationRate < 0) {
      errors.push({ field: "valuationRate", label: "Valuation Rate", message: "Valuation rate must be a valid number" });
    }

    const lastPurchaseRate = parseFloat(form.lastPurchaseRate);
    if (isNaN(lastPurchaseRate) || lastPurchaseRate < 0) {
      errors.push({ field: "lastPurchaseRate", label: "Last Purchase Rate", message: "Last purchase rate must be a valid number" });
    }

    return errors;
  };

  const fieldError = (field: string) => {
    const error = validationErrors.find((e) => e.field === field);
    return error?.message;
  };

  const handleImageChange = async (file: File) => {
    setUploadingImage(true);
    try {
      const compressedImage = await compressImage(file, 600, 600, 0.6);
      setForm({ ...form, image: compressedImage });
      setImageFile(file);
      toast.success("Image uploaded");
    } catch (error) {
      toast.error("Failed to process image");
      console.error("Image processing error:", error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageRemove = () => {
    setForm({ ...form, image: null });
    setImageFile(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = getValidationErrors();
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error("Please fix all validation errors");
      return;
    }
    setValidationErrors([]);

    setSubmitting(true);
    try {
      const totalOpeningStock = openingStockEntries.reduce((sum, entry) => sum + entry.quantity, 0);
      const totalOpeningValue = openingStockEntries.reduce((sum, entry) => sum + entry.total, 0);
      const openingStockRate = totalOpeningStock > 0 ? totalOpeningValue / totalOpeningStock : 0;

      const existingImage = form.image && !imageFile ? form.image : null;

      const payload: any = {
        naming_series: "STO-ITEM-.YYYY.-",
        item_code: form.itemCode || form.itemName.toUpperCase().replace(/\s+/g, "-"),
        item_name: form.itemName.trim(),
        item_group: form.itemGroup.trim(),
        stock_uom: form.defaultUOM.trim(),
        image: existingImage,
        disabled: form.disabled ? 1 : 0,
        tax_id: parseInt(form.taxId) || null,
        is_stock_item: form.isStockItem ? 1 : 0,
        is_fixed_asset: 0,
        auto_create_assets: 0,
        is_grouped_asset: 0,
        asset_category: null,
        asset_naming_series: null,
        is_sales_item: form.isSalesItem ? 1 : 0,
        allow_alternative_item: 0,
        has_variants: 0,
        is_purchase_item: form.isPurchaseItem ? 1 : 0,
        is_customer_provided_item: 0,
        standard_rate: parseFloat(form.standardRate) || 0,
        selling_price: parseFloat(form.sellingPrice) || 0,
        opening_stock: totalOpeningStock,
        over_delivery_receipt_allowance: 0,
        over_billing_allowance: 0,
        brand: form.brand || null,
        description: form.description || form.itemName.trim(),
        no_of_months: 0,
        purchase_tax_withholding_category: null,
        sales_tax_withholding_category: null,
        valuation_method: "FIFO",
        valuation_rate: parseFloat(form.valuationRate) || 0,
        end_of_life: "2099-12-31",
        default_material_request_type: "Purchase",
        warranty_period: null,
        weight_per_unit: 0,
        weight_uom: null,
        allow_negative_stock: 0,
        has_batch_no: 0,
        create_new_batch: 0,
        batch_number_series: null,
        has_expiry_date: 0,
        shelf_life_in_days: 0,
        retain_sample: 0,
        sample_quantity: 0,
        has_serial_no: 0,
        serial_no_series: null,
        variant_of: null,
        variant_based_on: "Item Attribute",
        purchase_uom: null,
        min_order_qty: 0,
        safety_stock: parseInt(form.safetyStock) || 0,
        lead_time_days: 0,
        last_purchase_rate: parseFloat(form.lastPurchaseRate) || 0,
        delivered_by_supplier: 0,
        country_of_origin: "India",
        customs_tariff_number: null,
        sales_uom: null,
        grant_commission: 1,
        max_discount: 0,
        include_item_in_manufacturing: 1,
        is_sub_contracted_item: 0,
        default_bom: null,
        production_capacity: 0,
        total_projected_qty: 0,
        default_manufacturer_part_no: null,
        default_item_manufacturer: null,
        customer_code: null,
        inspection_required_before_purchase: form.inspectionRequiredBeforePurchase ? 1 : 0,
        inspection_required_before_delivery: form.inspectionRequiredBeforeDelivery ? 1 : 0,
        quality_inspection_template: null,
        HSN: form.hsn || null,
      };

      if (!isNew && itemId) {
        payload.id = itemId;
      }

      let response;
      if (isNew) {
        response = await api.post("/item", payload);
      } else {
        response = await api.put("/item", payload);
      }

      if (!(response.data && response.data.success === 1)) {
        toast.error(response.data?.message || "Failed to save item");
        setSubmitting(false);
        return;
      }

      const savedItemId = isNew
        ? response.data.data?.insertId ?? response.data.data?.id
        : itemId;

      if (!savedItemId) {
        toast.error("Item saved but could not retrieve ID");
        setSubmitting(false);
        return;
      }

      let uploadedImageUrl = null;
      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", imageFile);
        uploadFormData.append("itemID", String(savedItemId));
        uploadFormData.append("type", "item");
        uploadFormData.append("location", "azure");
      
        try {
          const uploadResponse = await api.post("/uploadmedia", uploadFormData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          if (uploadResponse.data.success === 1) {
            uploadedImageUrl = extractRelativePath(uploadResponse.data.fileUrl);
            toast.success("Image uploaded successfully");
          } else {
            toast.error("Image upload failed: " + (uploadResponse.data.message || "Unknown error"));
          }
        } catch (uploadError: any) {
          console.error("Image upload error:", uploadError);
          if (uploadError.response?.status === 413) {
            toast.error("Image file is too large. Please use a smaller image (max 2MB).");
          } else {
            toast.error("Failed to upload image: " + (uploadError.response?.data?.message || "Network error"));
          }
        }
      }

      if (uploadedImageUrl) {
        const updatePayload = { id: savedItemId, image: uploadedImageUrl };
        try {
          const updateResponse = await api.put("/item", updatePayload);
          if (updateResponse.data.success === 1) {
            toast.success("Item image updated");
            setFormRaw((prev) => ({ ...prev, image: uploadedImageUrl }));
            setImageFile(null);
          } else {
            toast("Item saved but image URL could not be updated");
          }
        } catch (updateErr) {
          console.error("Error updating item image:", updateErr);
          toast("Item saved but image URL could not be updated");
        }
      }

      let inventoryConfirmed = false;
      if (form.isStockItem) {
        const savedItemCode = response.data.data?.item_code || payload.item_code;

        if (!form.warehouseId) {
          toast.error(`Item ${isNew ? "created" : "updated"}, but no warehouse was selected — inventory was not saved.`);
        } else if (!savedItemId) {
          toast.error(`Item ${isNew ? "created" : "updated"}, but couldn't resolve its id — inventory was not saved.`);
        } else {
          const inventoryPayload = {
            id: inventoryRecord?.id || undefined,
            name: inventoryRecord?.name || `INV-${savedItemCode}`,
            item_Id: savedItemId,
            item_code: savedItemCode,
            warehouse_Id: parseInt(form.warehouseId, 10),
            actual_qty: totalOpeningStock,
            planned_qty: inventoryRecord?.planned_qty ?? 0,
            indented_qty: inventoryRecord?.indented_qty ?? 0,
            ordered_qty: inventoryRecord?.ordered_qty ?? 0,
            reserved_qty: inventoryRecord?.reserved_qty ?? 0,
            reserved_qty_for_production: inventoryRecord?.reserved_qty_for_production ?? 0,
            reserved_qty_for_sub_contract: inventoryRecord?.reserved_qty_for_sub_contract ?? 0,
            reserved_qty_for_production_plan: inventoryRecord?.reserved_qty_for_production_plan ?? 0,
            projected_qty: totalOpeningStock,
            reserved_stock: parseInt(form.safetyStock, 10) || 0,
            stock_uom: form.defaultUOM,
            company: "SculptorTech Pvt Ltd",
            valuation_rate: openingStockRate,
            stock_value: totalOpeningValue,
          };

          try {
            let invResponse;
            if (inventoryRecord && inventoryRecord.id) {
              invResponse = await api.put(`/inventory`, inventoryPayload);
            } else {
              if (inventoryPayload.id === undefined) delete inventoryPayload.id;
              invResponse = await api.post("/inventory", inventoryPayload);
            }

            if (invResponse.data && invResponse.data.success === 1) {
              const savedInventoryId = inventoryRecord?.id ?? invResponse.data.data?.insertId ?? invResponse.data.data?.id;
              if (savedInventoryId) {
                await fetchInventoryRecord(savedInventoryId);
                inventoryConfirmed = true;
                toast.success(
                  `Inventory ${inventoryRecord ? "updated" : "confirmed"}: ${inventoryPayload.actual_qty} ${inventoryPayload.stock_uom} @ ₹${inventoryPayload.valuation_rate.toFixed(2)}`
                );
              }
            } else {
              toast.error(invResponse.data?.message || "Item saved, but the inventory record failed to sync.");
            }
          } catch (invErr: any) {
            console.error("Error syncing inventory record:", invErr);
            toast.error(invErr.response?.data?.message || "Item saved, but the inventory record failed to sync.");
          }
        }
      }

      setIsDirty(false);
      toast.success(isNew ? "Item created" : "Item updated");

      setTimeout(() => navigate("/item-list"), inventoryConfirmed ? 1200 : 0);
      return;

    } catch (err: any) {
      console.error("Error saving item:", err);
      if (err.response?.status === 409) {
        toast.error("An item with this code already exists");
      } else if (err.response?.status === 413) {
        toast.error("Request entity too large. Please try with a smaller image.");
      } else {
        toast.error(err.response?.data?.message || "Failed to save item");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`itf-page ${theme}`}>
        <div className="itf-loading-state">
          <FaSpinner className="itf-spin" size={28} />
          <p>Loading item data…</p>
        </div>
      </div>
    );
  }

  const isRawMaterial = isRawMaterialGroup(form.itemGroup);
  const isDark = theme === "dark";

  return (
    <div className={`itf-page ${theme}`}>
      {/* Top Bar */}
      <div className="itf-topbar">
        <div className="itf-breadcrumb">
          <button onClick={() => navigate("/item-list")} className="itf-back-btn">
            <FaArrowLeft size={11} /> Back
          </button>
          <span className="itf-bc-sep">/</span>
          <span className="itf-bc-link" onClick={() => navigate("/item-list")}>Stock</span>
          <span className="itf-bc-sep">/</span>
          <span className="itf-bc-link" onClick={() => navigate("/item-list")}>Item</span>
          <span className="itf-bc-sep">/</span>
          <span className="itf-bc-current">{isNew ? "New item" : form.itemName || form.itemCode}</span>
          {!isNew && (
            <span className={`itf-status-pill ${form.disabled ? "disabled" : "enabled"}`}>
              {form.disabled ? "Disabled" : "Enabled"}
            </span>
          )}
        </div>
        <div className="itf-topbar-actions">
          {isDirty && <span className="itf-unsaved-dot">Unsaved changes</span>}
        </div>
      </div>

      {/* Main Content */}
      <div className="itf-body">
        <form onSubmit={handleSave} className="itf-form">
          <div className="itf-grid-main">
            {/* Left column */}
            <div className="itf-col-left">
              {/* Item Details Card - 3 columns */}
              <div className="itf-card">
                <SectionTitle icon={<FaTag size={14} />} subtitle="Core identity and classification for this item.">
                  Item details
                </SectionTitle>

                <div className="itf-grid-3">
                  <div className="itf-col">
                    <Field 
                      label="Item name" 
                      required 
                      error={fieldError("itemName")}
                    >
                      <TextInput 
                        value={form.itemName} 
                        onChange={(v) => s("itemName", v)} 
                        placeholder="e.g. Cotton Yarn 40s" 
                      />
                      <p className="itf-hint" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Alphabets, digits, and spaces are allowed
                      </p>
                    </Field>
                  </div>
                  <div className="itf-col">
                    <Field label="Item group" required error={fieldError("itemGroup")}>
                      <SelectInput
                        value={form.itemGroup}
                        onChange={(v) => {
                          s("itemGroup", v);
                          setWarehouseManuallyChanged(false);
                        }}
                        options={groupOptions}
                        loading={loadingGroups}
                        placeholder="Search for an item group…"
                        error={fieldError("itemGroup")}
                        allowOnlyAlphabets={true}
                        showAddButton={false}
                        theme={theme}
                        entityLabel="Item Group"
                      />
                      <p className="itf-hint" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Only alphabets and spaces are allowed
                      </p>
                    </Field>
                  </div>
                  <div className="itf-col">
                    <Field label="Default UOM" required error={fieldError("defaultUOM")}>
                      <SelectInput
                        value={form.defaultUOM}
                        onChange={(v) => s("defaultUOM", v)}
                        options={uomOptions}
                        loading={loadingUoms}
                        placeholder="Search for a UOM…"
                        error={fieldError("defaultUOM")}
                        allowOnlyAlphabets={true}
                        showAddButton={true}
                        onAddClick={() => {
                          setPendingUOMName("");
                          setShowAddUOMModal(true);
                        }}
                        onCustomValueConfirm={handleCustomUOMConfirm}
                        theme={theme}
                        entityLabel="UOM"
                      />
                      <p className="itf-hint" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Type a name and press Enter or click the "Add" option to create a new UOM
                      </p>
                    </Field>
                  </div>
                </div>

                <div className="itf-grid-3">
                  <div className="itf-col">
                    <Field label="HSN Code" hint="Harmonized System of Nomenclature code - digits only" error={fieldError("hsn")}>
                      <TextInput 
                        value={form.hsn} 
                        onChange={(v) => s("hsn", v)} 
                        placeholder="e.g. 87690" 
                        type="text"
                        allowOnlyDigits={true}
                        maxLength={45}
                      />
                      <p className="itf-hint" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Only digits are allowed
                      </p>
                    </Field>
                  </div>
                  
                  <div className="itf-col">
                    <Field label="Safety stock" hint="Minimum stock level before reorder is triggered." error={fieldError("safetyStock")}>
                      <NumberInput
                        value={form.safetyStock}
                        onChange={(v) => s("safetyStock", v)}
                        placeholder="0"
                        min={0}
                        step={1}
                        allowDecimal={false}
                      />
                      <p className="itf-hint" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Only digits are allowed
                      </p>
                    </Field>
                  </div>
                </div>

                <Field label="Description">
                  <TextInput value={form.description} onChange={(v) => s("description", v)} placeholder="Enter item description" />
                </Field>

                <div className="itf-divider" />
              </div>

              {/* Pricing, Opening Stock, Warehouse - 50:50 split */}
              <div className="itf-grid-2-50">
                {/* Left: Pricing */}
                <div className="itf-col-left-50">
                  <div className="itf-card">
                    <SectionTitle icon={<FaCalculator size={14} />} subtitle="Set the purchase cost and margin — MRP updates automatically.">
                      Pricing
                    </SectionTitle>

                    <div className="itf-grid-2">
                      <Field label="Standard purchase rate (base price)" hint="The cost at which you purchase this item." error={fieldError("standardRate")}>
                        <NumberInput
                          value={form.standardRate}
                          onChange={(v) => s("standardRate", v)}
                          placeholder="0.00"
                          min={0}
                          step={0.01}
                          prefix="₹"
                        />
                      </Field>
                      {!isRawMaterial && (
                        <Field label="Profit margin (%)" hint="Margin applied on top of the base price." error={fieldError("profitMargin")}>
                          <NumberInput
                            value={form.profitMargin}
                            onChange={(v) => s("profitMargin", v)}
                            placeholder="10"
                            min={0}
                            step={0.5}
                            suffix="%"
                          />
                        </Field>
                      )}
                    </div>

                    <div className="itf-grid-2">
                      <Field label="Valuation rate" hint="Auto-calculated: base price + profit." error={fieldError("valuationRate")}>
                        <NumberInput
                          value={form.valuationRate}
                          readOnly
                          prefix="₹"
                          onChange={() => {}}
                        />
                      </Field>
                      <Field label="Last purchase rate" hint="Auto-set to the current base price." error={fieldError("lastPurchaseRate")}>
                        <NumberInput
                          value={form.lastPurchaseRate}
                          readOnly
                          prefix="₹"
                          onChange={() => {}}
                        />
                      </Field>
                    </div>

                    <Field label="Tax type" required>
                      <SelectInput
                        value={form.taxId}
                        onChange={(v) => s("taxId", v)}
                        options={taxOptions}
                        loading={loadingTaxes}
                        placeholder="Select tax type…"
                        error={fieldError("taxId")}
                        entityLabel="Tax Type"
                      />
                    </Field>

                    <div className="itf-divider" />

                    <PricingSummary
                      basePrice={parseFloat(form.standardRate) || 0}
                      profitMargin={isRawMaterial ? 0 : parseFloat(form.profitMargin) || 0}
                      taxPercentage={taxPercentage}
                      taxType={currentTax?.tax_type || "GST"}
                      isRawMaterial={isRawMaterial}
                    />
                  </div>
                </div>

                {/* Right: Opening Stock + Warehouse */}
                <div className="itf-col-right-50">
                  {/* Opening Stock Card */}
                  <div className="itf-card">
                    <SectionTitle icon={<FaWarehouse size={14} />} subtitle="Record any stock on hand when this item is created.">
                      Opening stock
                    </SectionTitle>
                    <OpeningStockTable entries={openingStockEntries} onChange={setOpeningStockEntries} />
                  </div>

                  {/* Warehouse Card */}
                  <div className="itf-card">
                    <SectionTitle
                      icon={<FaWarehouse size={14} />}
                      subtitle="Select the warehouse where this item's stock will be stored."
                    >
                      Warehouse assigned
                    </SectionTitle>

                    <Field
                      label="Warehouse"
                      required={form.isStockItem}
                      hint={!warehouseManuallyChanged && form.warehouseId ? 
                        `Auto-selected: ${warehouses.find(w => w.id.toString() === form.warehouseId)?.warehouse_name || 'Selected warehouse'}` : 
                        "Opening stock will be added to this warehouse."}
                      error={fieldError("warehouseId")}
                    >
                      <SelectInput
                        value={form.warehouseId}
                        onChange={(v) => {
                          s("warehouseId", v);
                          setWarehouseManuallyChanged(true);
                        }}
                        options={warehouseOptions}
                        loading={loadingWarehouses}
                        placeholder="Select a warehouse…"
                        error={fieldError("warehouseId")}
                        entityLabel="Warehouse"
                      />
                      {!warehouseManuallyChanged && form.warehouseId && (
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#16a34a', 
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <FaCheck size={10} />
                          Auto-selected based on item type
                        </div>
                      )}
                    </Field>

                    {loadingInventory && (
                      <div className="itf-inventory-loading">
                        <FaSpinner className="itf-spin" size={13} /> Checking saved inventory…
                      </div>
                    )}

                    {!loadingInventory && inventoryRecord && (
                      <>
                        <div className="itf-divider" />
                        <div className="itf-inventory-record">
                          <div className="itf-inventory-record-head">
                            <span>Stock on record ({inventoryRecord.name})</span>
                          </div>
                          <div className="itf-pricing-list">
                            <div className="itf-pricing-item">
                              <span className="itf-pricing-label">Actual quantity</span>
                              <span className="itf-pricing-value">{inventoryRecord.actual_qty} {inventoryRecord.stock_uom}</span>
                            </div>
                            <div className="itf-pricing-item">
                              <span className="itf-pricing-label">Reserved stock</span>
                              <span className="itf-pricing-value">{inventoryRecord.reserved_stock}</span>
                            </div>
                            <div className="itf-pricing-item">
                              <span className="itf-pricing-label">Projected quantity</span>
                              <span className="itf-pricing-value">{inventoryRecord.projected_qty}</span>
                            </div>
                            <div className="itf-pricing-item itf-pricing-item-divider">
                              <span className="itf-pricing-label">Valuation rate</span>
                              <span className="itf-pricing-value">₹{Number(inventoryRecord.valuation_rate).toFixed(2)}</span>
                            </div>
                            <div className="itf-pricing-item itf-pricing-total">
                              <span className="itf-pricing-label">Stock value</span>
                              <span className="itf-pricing-value">₹{Number(inventoryRecord.stock_value).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right column - Image & Summary */}
            <div className="itf-col-right">
              <div className="itf-card itf-card-sticky">
                <SectionTitle icon={<FaImage size={14} />}>Item image</SectionTitle>
                <ImageUpload
                  image={form.image}
                  onImageChange={handleImageChange}
                  onImageRemove={handleImageRemove}
                  uploading={uploadingImage}
                />

                <div className="itf-divider" />

                <div className="itf-summary-block">
                  <div className="itf-summary-row">
                    <span>Base price</span>
                    <strong>₹{(parseFloat(form.standardRate) || 0).toFixed(2)}</strong>
                  </div>
                  <div className="itf-summary-row">
                    <span>MRP</span>
                    <strong className="itf-summary-highlight">₹{form.sellingPrice}</strong>
                  </div>
                  <div className="itf-summary-row">
                    <span>Opening stock</span>
                    <strong>{openingStockEntries.reduce((sum, e) => sum + e.quantity, 0)} {form.defaultUOM}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Footer with Save Button ───────────────────────────────── */}
          <div className="itf-footer">
            <div className="itf-footer-actions">
              <button 
                type="button" 
                className="itf-btn-cancel" 
                onClick={() => navigate("/item-list")}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className={`itf-btn-save-bottom ${isDark ? "itf-btn-save-dark" : "itf-btn-save-light"}`}
                disabled={submitting}
              >
                {submitting ? <FaSpinner className="itf-spin" size={13} /> : <FaSave size={13} />}
                {submitting ? "Saving…" : "Save Item"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ─── Add UOM Modal ─────────────────────────────────────────────── */}
      <AddUOMModal
        isOpen={showAddUOMModal}
        onClose={() => {
          setShowAddUOMModal(false);
          setPendingUOMName("");
        }}
        onSave={handleAddUOM}
        saving={addingUOM}
        theme={theme}
        categoryOptions={categoryOptions}
        loadingCategories={loadingCategories}
        initialUOMName={pendingUOMName}
      />
    </div>
  );
}
