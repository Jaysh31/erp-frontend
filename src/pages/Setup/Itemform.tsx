import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaSave,
  FaSpinner,
  FaExclamationTriangle,
  FaPlus,
  FaTrash,
  FaTag,
  FaCheck,
  FaImage,
  FaUpload,
  FaTimes,
  FaCalculator,
  FaWarehouse,
} from "react-icons/fa";
import "./ItemForm.css";
import { useAdminTheme } from "../../admin-theme/AdminThemeContext";
import toast from "react-hot-toast";
import api from "../../services/api";

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
  enabled: number;
  must_be_whole_number: number;
  creation: string;
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
      {error && <p className="itf-field-error">{error}</p>}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly = false,
  min,
  prefix,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
  min?: string;
  prefix?: string;
}) {
  return (
    <div className={`itf-input-wrap ${readOnly ? "itf-input-wrap-readonly" : ""}`}>
      {prefix && <span className="itf-input-prefix">{prefix}</span>}
      <input
        className={`itf-input ${prefix ? "itf-input-has-prefix" : ""}`}
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder ?? ""}
        readOnly={readOnly}
        min={min}
      />
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  options,
  placeholder = "Search or select...",
  loading = false,
}: {
  value: string;
  onChange?: (v: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  loading?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="itf-select-container" ref={dropdownRef}>
      <div
        className={`itf-select-wrapper ${isOpen ? "itf-select-wrapper-open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <input
            autoFocus
            type="text"
            className="itf-select-display itf-select-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
        <div className="itf-select-dropdown">
          {loading ? (
            <div className="itf-select-loading">
              <FaSpinner className="itf-spin" size={14} />
              <span>Loading…</span>
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="itf-select-empty">No options found</div>
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
                {opt.value === value && <FaCheck className="itf-select-check" size={11} />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Checkbox({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className={`itf-checkbox-card ${checked ? "itf-checkbox-card-active" : ""}`}>
      <input
        type="checkbox"
        className="itf-checkbox-input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="itf-checkbox-box">
        <FaCheck size={9} />
      </span>
      <span className="itf-checkbox-text">
        <span className="itf-checkbox-label">{label}</span>
        {description && <span className="itf-checkbox-desc">{description}</span>}
      </span>
    </label>
  );
}

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

  return (
    <div className="itf-image-upload-container">
      {image ? (
        <div className="itf-image-preview-wrapper">
          <div className="itf-image-preview">
            <img src={image} alt="Item" className="itf-image-preview-img" />
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
                  <FaImage size={20} />
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
  const handleAdd = () => {
    const newId = entries.length > 0 ? Math.max(...entries.map((e) => e.id)) + 1 : 1;
    onChange([...entries, { id: newId, quantity: 0, rate: 0, total: 0 }]);
  };

  const handleRemove = (id: number) => {
    onChange(entries.filter((e) => e.id !== id));
  };

  const handleUpdate = (id: number, field: "quantity" | "rate", value: number) => {
    onChange(
      entries.map((entry) => {
        if (entry.id === id) {
          const updated = { ...entry, [field]: value };
          updated.total = updated.quantity * updated.rate;
          return updated;
        }
        return entry;
      })
    );
  };

  const totalQuantity = entries.reduce((sum, e) => sum + e.quantity, 0);
  const totalAmount = entries.reduce((sum, e) => sum + e.total, 0);

  return (
    <div className="itf-opening-stock">
      <div className="itf-opening-stock-header">
        <div>
          <h4>Opening stock entries</h4>
          <p className="itf-opening-stock-sub">Each row is a stock lot recorded at a specific cost.</p>
        </div>
        <button type="button" onClick={handleAdd} className="itf-btn-add-row">
          <FaPlus size={11} /> Add row
        </button>
      </div>

      <div className="itf-table-wrapper">
        <table className="itf-table">
          <thead>
            <tr>
              <th className="itf-table-th-num">#</th>
              <th>Quantity</th>
              <th>Rate (base price)</th>
              <th>Total</th>
              <th className="itf-table-th-action" />
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="itf-table-empty">
                  <FaWarehouse size={20} className="itf-table-empty-icon" />
                  <span>No opening stock entries yet. Click "Add row" to record one.</span>
                </td>
              </tr>
            ) : (
              entries.map((entry, index) => (
                <tr key={entry.id}>
                  <td className="itf-table-td-num">{index + 1}</td>
                  <td>
                    <input
                      type="number"
                      className="itf-table-input"
                      value={entry.quantity || ""}
                      onChange={(e) => handleUpdate(entry.id, "quantity", parseFloat(e.target.value) || 0)}
                      min="0"
                      placeholder="0"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="itf-table-input"
                      value={entry.rate || ""}
                      onChange={(e) => handleUpdate(entry.id, "rate", parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="itf-table-total">₹{entry.total.toFixed(2)}</td>
                  <td>
                    <button
                      type="button"
                      className="itf-btn-remove-row"
                      onClick={() => handleRemove(entry.id)}
                      aria-label="Remove row"
                    >
                      <FaTrash size={12} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {entries.length > 0 && (
            <tfoot>
              <tr>
                <td className="itf-table-th-num" />
                <td>
                  <strong>{totalQuantity}</strong>
                </td>
                <td />
                <td>
                  <strong>₹{totalAmount.toFixed(2)}</strong>
                </td>
                <td />
              </tr>
            </tfoot>
          )}
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
}: {
  basePrice: number;
  profitMargin: number;
  taxPercentage: number;
  taxType: string;
}) {
  const profitAmount = basePrice * (profitMargin / 100);
  const priceBeforeTax = basePrice + profitAmount;
  const taxAmount = priceBeforeTax * (taxPercentage / 100);
  const finalSellingPrice = priceBeforeTax + taxAmount;

  const rows = [
    { label: "Base price (purchase rate)", value: basePrice },
    { label: `Profit margin (${profitMargin || 0}%)`, value: profitAmount },
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

  const [form, setFormRaw] = useState({
    id: 0,
    itemName: "",
    itemCode: "",
    itemGroup: "",
    defaultUOM: "Nos",
    brand: "",
    description: "",
    disabled: false,
    standardRate: "0.00",
    sellingPrice: "0.00",
    profitMargin: "10",
    image: null as string | null,
    isSalesItem: true,
    isPurchaseItem: true,
    isStockItem: true,
    safetyStock: "20",
    lastPurchaseRate: "0.00",
    valuationRate: "0.00",
    taxId: "1",
    inspectionRequiredBeforePurchase: false,
    inspectionRequiredBeforeDelivery: false,
    warehouseId: "",
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

  // Recalculate MRP / valuation whenever base price, margin or tax changes.
  useEffect(() => {
    const basePrice = parseFloat(form.standardRate) || 0;
    const profitMargin = parseFloat(form.profitMargin) || 0;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.standardRate, form.profitMargin, taxPercentage]);

  useEffect(() => {
    const fetchLookups = async () => {
      setLoadingGroups(true);
      try {
        const response = await api.get("/item-group");
        if (response.data.success === 1) setItemGroups(response.data.data);
      } catch (err) {
        console.error("Error fetching item groups:", err);
      } finally {
        setLoadingGroups(false);
      }

      setLoadingUoms(true);
      try {
        const response = await api.get("/uom");
        if (response.data.success === 1) setUoms(response.data.data.records || []);
      } catch (err) {
        console.error("Error fetching UOMs:", err);
      } finally {
        setLoadingUoms(false);
      }

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
            : "10";

        setFormRaw({
          id: data.id || 0,
          itemName: data.item_name || "",
          itemCode: data.item_code || "",
          itemGroup: data.item_group || "",
          defaultUOM: data.stock_uom || "Nos",
          brand: data.brand || "",
          description: data.description || "",
          disabled: data.disabled === 1,
          standardRate: String(standardRate),
          sellingPrice: String(data.selling_price || 0),
          profitMargin: derivedMargin,
          image: data.image || null,
          isSalesItem: data.is_sales_item === 1,
          isPurchaseItem: data.is_purchase_item === 1,
          isStockItem: data.is_stock_item === 1,
          safetyStock: String(data.safety_stock ?? 20),
          lastPurchaseRate: String(data.last_purchase_rate || 0),
          valuationRate: String(valuationRate),
          taxId: String(data.tax_id || 1),
          inspectionRequiredBeforePurchase: data.inspection_required_before_purchase === 1,
          inspectionRequiredBeforeDelivery: data.inspection_required_before_delivery === 1,
          warehouseId: "",
        });

        const openingQty = Number(data.opening_stock) || 0;
        const openingRate = Number(data.opening_stock_rate) || 0;
        if (openingQty > 0) {
          setOpeningStockEntries([
            {
              id: 1,
              quantity: openingQty,
              rate: openingRate,
              total: openingQty * openingRate,
            },
          ]);
        } else {
          setOpeningStockEntries([]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const uomOptions = uoms
    .filter((uom) => uom.enabled === 1)
    .map((uom) => ({
      label: uom.uom_name + (uom.symbol ? ` (${uom.symbol})` : ""),
      value: uom.uom_name,
    }));

  const taxOptions = taxes.map((tax) => ({
    label: tax.tax_type,
    value: tax.tax_id.toString(),
  }));

  // Default to first warehouse if available
  useEffect(() => {
    if (warehouses.length === 0) return;
  
    // Don't overwrite when editing an existing item
    if (form.warehouseId) return;
  
    const rawMaterialWarehouse = warehouses.find(
      (w) => w.warehouse_name === "Raw Material Store"
    );
  
    if (rawMaterialWarehouse) {
      setFormRaw((prev) => ({
        ...prev,
        warehouseId: rawMaterialWarehouse.id.toString(),
      }));
    }
  }, [warehouses]);
  const warehouseOptions = warehouses.map((w) => ({
    label: w.warehouse_name,
    value: w.id.toString(),
  }));

  const getValidationErrors = () => {
    const errors: { field: string; label: string; message: string }[] = [];
    if (!form.itemName.trim()) errors.push({ field: "itemName", label: "Item Name", message: "Item name is required" });
    if (!form.itemGroup.trim()) errors.push({ field: "itemGroup", label: "Item Group", message: "Item group is required" });
    if (!form.defaultUOM.trim()) errors.push({ field: "defaultUOM", label: "Default UOM", message: "Default unit of measure is required" });
    if (form.isStockItem && !form.warehouseId)
      errors.push({ field: "warehouseId", label: "Warehouse", message: "Select a warehouse to track inventory for this item" });
    return errors;
  };

  const fieldError = (field: string) => validationErrors.find((e) => e.field === field)?.message;

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
      toast.error("Please fill in all required fields");
      return;
    }
    setValidationErrors([]);

    setSubmitting(true);
    try {
      let imagePath = form.image;

      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("image", imageFile);
        uploadFormData.append("type", "item");

        try {
          const uploadResponse = await api.post("/upload", uploadFormData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          if (uploadResponse.data.success === 1) {
            imagePath = uploadResponse.data.data.path || uploadResponse.data.data.url;
          } else {
            toast.error("Failed to upload image");
            setSubmitting(false);
            return;
          }
        } catch (uploadError: any) {
          console.error("Image upload error:", uploadError);
          if (uploadError.response?.status === 413) {
            toast.error("Image file is too large. Please use a smaller image (max 2MB).");
          } else {
            toast.error("Failed to upload image");
          }
          setSubmitting(false);
          return;
        }
      }

      const totalOpeningStock = openingStockEntries.reduce((sum, entry) => sum + entry.quantity, 0);
      const totalOpeningValue = openingStockEntries.reduce((sum, entry) => sum + entry.total, 0);
      const openingStockRate = totalOpeningStock > 0 ? totalOpeningValue / totalOpeningStock : 0;

      const payload = {
        id: parseInt(id || "0"),
        naming_series: "STO-ITEM-.YYYY.-",
        item_code: form.itemCode || form.itemName.toUpperCase().replace(/\s+/g, "-"),
        item_name: form.itemName.trim(),
        item_group: form.itemGroup.trim(),
        stock_uom: form.defaultUOM.trim(),
        image: imagePath,
        disabled: form.disabled ? 1 : 0,
        tax_id: parseInt(form.taxId),
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
        enable_deferred_expense: 0,
        no_of_months_exp: 0,
        enable_deferred_revenue: 0,
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
        safety_stock: parseInt(form.safetyStock) || 20,
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
      };

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

      setIsDirty(false);
      toast.success(isNew ? "Item created" : "Item updated");

      // Step 2: sync the inventory record
      let inventoryConfirmed = false;

      if (form.isStockItem) {
        const savedItemId = isNew ? response.data.data?.insertId ?? response.data.data?.id : itemId;
        const savedItemCode = response.data.data?.item_code || payload.item_code;

        if (!form.warehouseId) {
          toast.error(`Item ${isNew ? "created" : "updated"}, but no warehouse was selected — inventory was not saved.`);
        } else if (!savedItemId) {
          console.warn("Could not resolve item id — skipping inventory sync", response.data);
          toast.error(`Item ${isNew ? "created" : "updated"}, but couldn't resolve its id — inventory was not saved.`);
        } else {
          // FIXED: Include ID in payload for updates
          const inventoryPayload = {
            id: inventoryRecord?.id || undefined, // Add this line
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
              // For existing inventory - pass ID in path AND payload
              invResponse = await api.put(`/inventory`, inventoryPayload);
            } else {
              // For new inventory - POST without ID (remove id from payload if undefined)
              if (inventoryPayload.id === undefined) {
                delete inventoryPayload.id;
              }
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
          <button className="itf-btn-save" onClick={handleSave} disabled={submitting}>
            {submitting ? <FaSpinner className="itf-spin" size={13} /> : <FaSave size={13} />}
            {submitting ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="itf-body">
        <form onSubmit={handleSave} className="itf-form">
          <div className="itf-grid-main">
            {/* Left column */}
            <div className="itf-col-left">
              {/* Item Details Card */}
              <div className="itf-card">
                <SectionTitle icon={<FaTag size={14} />} subtitle="Core identity and classification for this item.">
                  Item details
                </SectionTitle>

                <div className="itf-grid-2">
                  <div className="itf-col">
                    <Field label="Item name" required error={fieldError("itemName")}>
                      <TextInput value={form.itemName} onChange={(v) => s("itemName", v)} placeholder="e.g. Cotton Yarn 40s" />
                    </Field>

                    <Field label="Item group" required error={fieldError("itemGroup")}>
                      <SelectInput
                        value={form.itemGroup}
                        onChange={(v) => s("itemGroup", v)}
                        options={groupOptions}
                        loading={loadingGroups}
                        placeholder="Search for an item group…"
                      />
                    </Field>

                    <Field label="Default unit of measure" required error={fieldError("defaultUOM")}>
                      <SelectInput
                        value={form.defaultUOM}
                        onChange={(v) => s("defaultUOM", v)}
                        options={uomOptions}
                        loading={loadingUoms}
                        placeholder="Search for a UOM…"
                      />
                    </Field>

                    <Field label="Brand / company">
                      <TextInput value={form.brand} onChange={(v) => s("brand", v)} placeholder="Enter brand or company name" />
                    </Field>
                  </div>

                  <div className="itf-col">
                    <Field label="Description">
                      <TextInput value={form.description} onChange={(v) => s("description", v)} placeholder="Enter item description" />
                    </Field>

                    <Field label="Safety stock" hint="Minimum stock level before reorder is triggered.">
                      <TextInput value={form.safetyStock} onChange={(v) => s("safetyStock", v)} type="number" placeholder="20" min="0" />
                    </Field>
                  </div>
                </div>

                <div className="itf-divider" />

                <div className="itf-checkbox-grid">
                  <Checkbox
                    label="Sales item"
                    description="Can be sold to customers"
                    checked={form.isSalesItem}
                    onChange={(v) => s("isSalesItem", v)}
                  />
                  <Checkbox
                    label="Purchase item"
                    description="Can be bought from suppliers"
                    checked={form.isPurchaseItem}
                    onChange={(v) => s("isPurchaseItem", v)}
                  />
                  {/* <Checkbox
                    label="Stock item"
                    description="Tracked in inventory"
                    checked={form.isStockItem}
                    onChange={(v) => s("isStockItem", v)}
                  /> */}
                </div>

                <div className="itf-checkbox-grid">
                  <Checkbox
                    label="Inspect before purchase"
                    description="Raw material quality check"
                    checked={form.inspectionRequiredBeforePurchase}
                    onChange={(v) => s("inspectionRequiredBeforePurchase", v)}
                  />
                  <Checkbox
                    label="Inspect before delivery"
                    description="Finished product quality check"
                    checked={form.inspectionRequiredBeforeDelivery}
                    onChange={(v) => s("inspectionRequiredBeforeDelivery", v)}
                  />
                </div>
              </div>

              {/* Pricing Card */}
              <div className="itf-card">
                <SectionTitle icon={<FaCalculator size={14} />} subtitle="Set the purchase cost and margin — MRP updates automatically.">
                  Pricing
                </SectionTitle>

                <div className="itf-grid-2">
                  <Field label="Standard purchase rate (base price)" hint="The cost at which you purchase this item.">
                    <TextInput value={form.standardRate} onChange={(v) => s("standardRate", v)} type="number" placeholder="0.00" min="0" prefix="₹" />
                  </Field>
                  <Field label="Profit margin (%)" hint="Margin applied on top of the base price.">
                    <TextInput value={form.profitMargin} onChange={(v) => s("profitMargin", v)} type="number" placeholder="10" min="0" />
                  </Field>
                </div>

                <div className="itf-grid-2">
                  <Field label="Valuation rate" hint="Auto-calculated: base price + profit.">
                    <TextInput value={form.valuationRate} readOnly prefix="₹" />
                  </Field>
                  <Field label="Last purchase rate" hint="Auto-set to the current base price.">
                    <TextInput value={form.lastPurchaseRate} readOnly prefix="₹" />
                  </Field>
                </div>
                <div> 
                  <Field label="Tax type" required>
                    <SelectInput
                      value={form.taxId}
                      onChange={(v) => s("taxId", v)}
                      options={taxOptions}
                      loading={loadingTaxes}
                      placeholder="Select tax type…"
                    />
                  </Field>
                </div>
                <div className="itf-divider" />

                <PricingSummary
                  basePrice={parseFloat(form.standardRate) || 0}
                  profitMargin={parseFloat(form.profitMargin) || 0}
                  taxPercentage={taxPercentage}
                  taxType={currentTax?.tax_type || "GST"}
                />
              </div>

              {/* Opening Stock Card */}
              <div className="itf-card">
                <SectionTitle icon={<FaWarehouse size={14} />} subtitle="Record any stock on hand when this item is created.">
                  Opening stock
                </SectionTitle>
                <OpeningStockTable entries={openingStockEntries} onChange={setOpeningStockEntries} />
              </div>

              {/* Inventory Card — simplified warehouse selection */}
              <div className="itf-card">
                <SectionTitle
                  icon={<FaWarehouse size={14} />}
                  subtitle="Select the warehouse where this item's stock will be stored."
                >
                  Warehouse assigned
                </SectionTitle>

                <div className="itf-grid-2">
                  <Field
                    label="Warehouse"
                    required={form.isStockItem}
                    hint="Opening stock will be added to this warehouse."
                    error={fieldError("warehouseId")}
                  >
         <SelectInput
  value={form.warehouseId}
  onChange={(v) => s("warehouseId", v)}
  options={warehouseOptions}
  loading={loadingWarehouses}
  placeholder="Select a warehouse…"
/>
      </Field>
                </div>

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

            {/* Right column */}
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

                <div className="itf-divider" />

                <Checkbox
                  label="Disabled"
                  description="Hide this item from active use"
                  checked={form.disabled}
                  onChange={(v) => s("disabled", v)}
                />
              </div>
            </div>
          </div>

          {validationErrors.length > 0 && (
            <div className="itf-validation-errors">
              {validationErrors.map((error) => (
                <div key={error.field} className="itf-validation-error">
                  <FaExclamationTriangle size={12} />
                  <span>
                    {error.label}: {error.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}