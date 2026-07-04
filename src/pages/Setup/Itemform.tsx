import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  FaArrowLeft,
  FaSave,
  FaSpinner,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimesCircle,
  FaPlus,
  FaEdit,
  FaTag,
  FaList,
  FaBoxes,
  FaDollarSign,
  FaCube,
  FaTruck,
  FaShoppingCart,
  FaIndustry,
  FaClipboardCheck,
  
  
} from 'react-icons/fa';
import "./ItemForm.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import toast from "react-hot-toast";
import api from '../../services/api';

interface TableRow { id: string; [key: string]: string }

function makeRow(fields: string[]): TableRow {
  const row: TableRow = { id: Date.now().toString() + Math.random() };
  fields.forEach((f) => (row[f] = ""));
  return row;
}

interface ValidationError {
  field: string;
  label: string;
  message: string;
  tabIndex: number;
}

interface ItemData {
  id: number;
  item_code: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  is_stock_item: number;
  is_fixed_asset: number;
  is_sales_item: number;
  is_purchase_item: number;
  disabled: number;
  description: string;
  brand: string | null;
  valuation_method: string;
  creation: string;
  modified: string;
}

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

/* ── Shared sub-components ─────────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="itf-section-title">{children}</h3>;
}

function Field({
  label, required, hint, children,
}: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="itf-field">
      <label className="itf-label">
        {label} {required && <span className="itf-req">*</span>}
      </label>
      {children}
      {hint && <p className="itf-hint">{hint}</p>}
    </div>
  );
}

function TextInput({
  value, onChange, readOnly, placeholder,
}: {
  value: string; onChange?: (v: string) => void; readOnly?: boolean; placeholder?: string;
}) {
  return (
    <input
      className="itf-input"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      readOnly={readOnly}
      placeholder={placeholder ?? ""}
    />
  );
}

// Enhanced SelectInput with search functionality
// Enhanced SelectInput with search functionality and fixed positioning
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
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  // Calculate dropdown position when opening
  const calculateDropdownPosition = () => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = Math.min(240, filteredOptions.length * 38 + 12);
      
      setDropdownPosition({
        top: spaceBelow > dropdownHeight ? rect.bottom + 4 : rect.top - dropdownHeight - 4,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      calculateDropdownPosition();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && listRef.current && highlightedIndex >= 0) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Recalculate position on scroll or resize
  useEffect(() => {
    if (isOpen) {
      const handleUpdate = () => calculateDropdownPosition();
      window.addEventListener('scroll', handleUpdate, true);
      window.addEventListener('resize', handleUpdate);
      return () => {
        window.removeEventListener('scroll', handleUpdate, true);
        window.removeEventListener('resize', handleUpdate);
      };
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          const selected = filteredOptions[highlightedIndex];
          onChange?.(selected.value);
          setSearchTerm("");
          setIsOpen(false);
          setHighlightedIndex(-1);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm("");
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <div className="itf-select-container" ref={dropdownRef}>
      <div
        ref={wrapperRef}
        className={`itf-select-wrapper ${isOpen ? 'itf-select-open' : ''}`}
        onClick={() => setIsOpen(true)}
      >
        <input
          ref={inputRef}
          type="text"
          className="itf-select-input"
          value={isOpen ? searchTerm : (selectedOption?.label || "")}
          onChange={(e) => {
            if (isOpen) {
              setSearchTerm(e.target.value);
              setHighlightedIndex(-1);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={selectedOption?.label || placeholder}
          onFocus={() => setIsOpen(true)}
          readOnly={!isOpen}
        />
        <span className="itf-select-arrow">
          {loading ? (
            <FaSpinner className="spinning" size={12} />
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </span>
        {isOpen && searchTerm && (
          <button
            className="itf-select-clear"
            onClick={(e) => {
              e.stopPropagation();
              setSearchTerm("");
              setHighlightedIndex(-1);
              if (inputRef.current) inputRef.current.focus();
            }}
          >
            ×
          </button>
        )}
      </div>

      {isOpen && (
        <div
          className="itf-select-dropdown"
          ref={listRef}
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            maxHeight: '240px',
            zIndex: 9999,
          }}
        >
          {loading ? (
            <div className="itf-select-loading">
              <FaSpinner className="spinning" size={16} />
              <span>Loading...</span>
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="itf-select-empty">No options found</div>
          ) : (
            filteredOptions.map((opt, index) => (
              <div
                key={opt.value}
                className={`itf-select-option ${index === highlightedIndex ? 'itf-select-option-highlighted' : ''}`}
                onClick={() => {
                  onChange?.(opt.value);
                  setSearchTerm("");
                  setIsOpen(false);
                  setHighlightedIndex(-1);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {opt.label}
                {opt.value === value && (
                  <span className="itf-select-option-check">✓</span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function CheckField({
  id, checked, onChange, label, hint,
}: {
  id: string; checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string;
}) {
  return (
    <div className="itf-check-row">
      <input
        type="checkbox" id={id} className="itf-checkbox"
        checked={checked} onChange={(e) => onChange(e.target.checked)}
      />
      <div>
        <label htmlFor={id} className="itf-check-label">{label}</label>
        {hint && <p className="itf-hint">{hint}</p>}
      </div>
    </div>
  );
}

function InlineTable({
  columns, rows, onAddRow, onRemoveRow, renderCell,
}: {
  columns: { key: string; label: string; required?: boolean }[];
  rows: TableRow[];
  onAddRow: () => void;
  onRemoveRow: (id: string) => void;
  renderCell: (row: TableRow, col: string, onChange: (v: string) => void) => React.ReactNode;
}) {
  return (
    <>
      <div className="itf-table-block">
        <div className="itf-table-scroll-wrapper">
          <table className="itf-inline-table">
            <thead>
              <tr>
                <th className="itf-ith itf-ith-check"><input type="checkbox" className="itf-checkbox" /></th>
                <th className="itf-ith itf-ith-no">No.</th>
                {columns.map((c) => (
                  <th key={c.key} className="itf-ith">
                    {c.label} {c.required && <span className="itf-req">*</span>}
                  </th>
                ))}
                <th className="itf-ith itf-ith-act">
                  <SettingsIcon />
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={columns.length + 3} className="itf-empty-row">No rows</td></tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={row.id} className="itf-itr">
                    <td className="itf-itd"><input type="checkbox" className="itf-checkbox" /></td>
                    <td className="itf-itd itf-itd-no">{i + 1}</td>
                    {columns.map((c) => (
                      <td key={c.key} className="itf-itd itf-cell-with-dropdown">
                        {renderCell(row, c.key, () => {})}
                      </td>
                    ))}
                    <td className="itf-itd">
                      <button className="itf-remove-row" onClick={() => onRemoveRow(row.id)}>×</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <button className="itf-add-row" onClick={onAddRow}><FaPlus size={10} /> Add row</button>
    </>
  );
}

function SettingsIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

/* ── Tab content components ─────────────────────────── */

function DetailsTab({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  const s = (k: string, v: any) => setForm({ ...form, [k]: v });
  
  // State for item groups
  const [itemGroups, setItemGroups] = useState<ItemGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // State for UOMs
  const [uoms, setUoms] = useState<UOM[]>([]);
  const [loadingUoms, setLoadingUoms] = useState(false);

  // Fetch item groups on mount
  useEffect(() => {
    const fetchItemGroups = async () => {
      setLoadingGroups(true);
      try {
        const response = await api.get("/item-group");
        if (response.data.success === 1) {
          setItemGroups(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching item groups:', err);
        toast.error('Failed to load item groups');
      } finally {
        setLoadingGroups(false);
      }
    };
    fetchItemGroups();
  }, []);

  // Fetch UOMs on mount
  useEffect(() => {
    const fetchUoms = async () => {
      setLoadingUoms(true);
      try {
        const response = await api.get("/uom");
        if (response.data.success === 1) {
          setUoms(response.data.data.records || []);
        }
      } catch (err) {
        console.error('Error fetching UOMs:', err);
        toast.error('Failed to load UOMs');
      } finally {
        setLoadingUoms(false);
      }
    };
    fetchUoms();
  }, []);

  // Convert item groups to select options format
  const groupOptions = itemGroups.map(group => ({
    label: group.item_group_name,
    value: group.item_group_name
  }));

  // Convert UOMs to select options format
  const uomOptions = uoms
    .filter(uom => uom.enabled === 1)
    .map(uom => ({
      label: uom.uom_name + (uom.symbol ? ` (${uom.symbol})` : ''),
      value: uom.uom_name
    }));

  return (
    <>
      <section className="itf-section">
        <div className="itf-two-col">
          <div className="itf-col">
            <Field label="Item Name" required>
              <TextInput value={form.itemName} onChange={(v) => s("itemName", v)} />
            </Field>
            <Field label="Item Group" required>
              <SelectInput 
                value={form.itemGroup} 
                onChange={(v) => s("itemGroup", v)} 
                options={groupOptions}
                loading={loadingGroups}
                placeholder="Search for an item group..."
              />
            </Field>
            <Field label="Default Unit of Measure" required>
              <SelectInput 
                value={form.defaultUOM} 
                onChange={(v) => s("defaultUOM", v)} 
                options={uomOptions}
                loading={loadingUoms}
                placeholder="Search for a UOM..."
              />
            </Field>
          </div>
          <div className="itf-col">
            <CheckField id="disabled" checked={form.disabled} onChange={(v) => s("disabled", v)} label="Disabled" />
            <CheckField
              id="maintainStock" checked={form.maintainStock} onChange={(v) => s("maintainStock", v)}
              label="Maintain Stock"
              hint="ERPNext will make a stock ledger entry for each transaction of this item."
            />
            <CheckField
              id="isFixedAsset" checked={form.isFixedAsset} onChange={(v) => s("isFixedAsset", v)}
              label="Is Fixed Asset"
              hint="Enable if this item is a company asset like machinery or furniture."
            />
          </div>
        </div>
      </section>

      <div className="itf-divider" />

      <section className="itf-section">
        <SectionTitle>Item Attributes</SectionTitle>
        <div className="itf-two-col">
          <div className="itf-col">
            <CheckField id="allowSales" checked={form.allowSales} onChange={(v) => s("allowSales", v)} label="Allow Sales" />
            <CheckField id="allowAltItem" checked={form.allowAltItem} onChange={(v) => s("allowAltItem", v)} label="Allow Alternative Item" />
            <CheckField id="hasVariants" checked={form.hasVariants} onChange={(v) => s("hasVariants", v)} label="Has Variants" />
          </div>
          <div className="itf-col">
            <CheckField id="allowPurchase" checked={form.allowPurchase} onChange={(v) => s("allowPurchase", v)} label="Allow Purchase" />
            <CheckField id="isCustomerProvided" checked={form.isCustomerProvided} onChange={(v) => s("isCustomerProvided", v)} label="Is Customer Provided Item" />
          </div>
        </div>
      </section>

      <div className="itf-divider" />

      <section className="itf-section">
        <div className="itf-two-col">
          <div className="itf-col">
            <Field label="Over Delivery/Receipt Allowance (%)" hint="Percentage by which over-delivery or over-receipt is allowed.">
              <TextInput value={form.overDelivery} onChange={(v) => s("overDelivery", v)} />
            </Field>
          </div>
          <div className="itf-col">
            <Field label="Over Billing Allowance (%)" hint="Percentage by which over-billing is allowed.">
              <TextInput value={form.overBilling} onChange={(v) => s("overBilling", v)} />
            </Field>
          </div>
        </div>
      </section>
    </>
  );
}

function AccountingTab({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  const [defaults, setDefaults] = useState<TableRow[]>([]);
  const s = (k: string, v: any) => setForm({ ...form, [k]: v });

  return (
    <>
      <section className="itf-section">
        <SectionTitle>Item Defaults</SectionTitle>
        <InlineTable
          columns={[
            { key: "company", label: "Company", required: true },
            { key: "defaultWarehouse", label: "Default Warehouse" },
            { key: "defaultPriceList", label: "Default Price List" },
          ]}
          rows={defaults}
          onAddRow={() => setDefaults([...defaults, makeRow(["company","defaultWarehouse","defaultPriceList"])])}
          onRemoveRow={(id) => setDefaults(defaults.filter((r) => r.id !== id))}
          renderCell={(row, col) => (
            <input className="itf-cell-input" defaultValue={row[col]} />
          )}
        />
      </section>

      <div className="itf-divider" />

      <section className="itf-section">
        <SectionTitle>Deferred Accounting</SectionTitle>
        <div className="itf-two-col">
          <div className="itf-col">
            <CheckField
              id="deferredExpense" checked={form.deferredExpense ?? false}
              onChange={(v) => s("deferredExpense", v)} label="Enable Deferred Expense"
              hint="Income from this item will be recognized over a period of months."
            />
          </div>
          <div className="itf-col">
            <CheckField
              id="deferredRevenue" checked={form.deferredRevenue ?? false}
              onChange={(v) => s("deferredRevenue", v)} label="Enable Deferred Revenue"
              hint="Expense for this item will be recognized over a period of months."
            />
          </div>
        </div>
      </section>
    </>
  );
}



// In the UOMTab component, update the state and logic:

function UOMTab({ form }: { form: any; setForm: (f: any) => void }) {
  const [rows, setRows] = useState<TableRow[]>([
    { id: "1", uom: "", conversionFactor: "1" },
  ]);
  const [hasSyncedDefault, setHasSyncedDefault] = useState(false);

  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'uom' | 'conversionFactor' | null>(null);
  const [uoms, setUoms] = useState<UOM[]>([]);
  const [loadingUoms, setLoadingUoms] = useState(false);

  useEffect(() => {
    const fetchUoms = async () => {
      setLoadingUoms(true);
      try {
        const response = await api.get("/uom");
        if (response.data.success === 1) {
          setUoms(response.data.data.records || []);
        }
      } catch (err) {
        console.error('Error fetching UOMs:', err);
        toast.error('Failed to load UOMs');
      } finally {
        setLoadingUoms(false);
      }
    };
    fetchUoms();
  }, []);

  // Sync row 1's UOM to whatever form.defaultUOM resolves to, but ONLY ONCE
  // (the first time it becomes available) — so it reflects real API data
  // (e.g. stock_uom from the item) without overwriting user edits afterward.
  useEffect(() => {
    if (!hasSyncedDefault && form.defaultUOM) {
      setRows(prev => {
        const [first, ...rest] = prev;
        return [{ ...first, uom: form.defaultUOM }, ...rest];
      });
      setHasSyncedDefault(true);
    }
  }, [form.defaultUOM, hasSyncedDefault]);

  const uomOptions = uoms
    .filter(uom => uom.enabled === 1)
    .map(uom => ({
      label: uom.uom_name + (uom.symbol ? ` (${uom.symbol})` : ''),
      value: uom.uom_name
    }));

  const getUOMLabel = (value: string) => {
    const option = uomOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  const handleUOMChange = (rowId: string, value: string) => {
    setRows(rows.map(row => row.id === rowId ? { ...row, uom: value } : row));
    setEditingRowId(null);
    setEditingField(null);
  };

  const handleConversionChange = (rowId: string, value: string) => {
    setRows(rows.map(row => row.id === rowId ? { ...row, conversionFactor: value } : row));
  };

  const startEditing = (rowId: string, field: 'uom' | 'conversionFactor') => {
    setEditingRowId(rowId);
    setEditingField(field);
  };

  const stopEditing = () => {
    setEditingRowId(null);
    setEditingField(null);
  };

  const handleAddRow = () => {
    const newRow = makeRow(["uom", "conversionFactor"]);
    setRows([...rows, newRow]);
    setEditingRowId(newRow.id);
    setEditingField('uom');
  };

  return (
    <>
      <section className="itf-section">
        <SectionTitle>UOM Conversion Details</SectionTitle>
        <p className="itf-hint" style={{ marginBottom: 14 }}>
          Define alternate units for this item. Eg: 1 Box = 12 Nos, set conversion factor as 12.
          <a href="#" className="itf-link"> Learn more →</a>
        </p>
        <InlineTable
          columns={[
            { key: "uom", label: "UOM" },
            { key: "conversionFactor", label: "Conversion Factor" },
          ]}
          rows={rows}
          onAddRow={handleAddRow}
          onRemoveRow={(id) => {
            if (rows.length > 1) {
              setRows(rows.filter((r) => r.id !== id));
              if (editingRowId === id) stopEditing();
            }
          }}
          renderCell={(row, col) => {
            if (col === "uom") {
              const isEditing = editingRowId === row.id && editingField === 'uom';

              if (isEditing) {
                return (
                  <SelectInput
                    value={row.uom || ""}
                    onChange={(v) => handleUOMChange(row.id, v)}
                    options={uomOptions}
                    loading={loadingUoms}
                    placeholder="Search for a UOM..."
                  />
                );
              }

              return (
                <div
                  className="itf-view-text itf-clickable-view"
                  onClick={() => startEditing(row.id, 'uom')}
                  style={{
                    cursor: 'pointer',
                    padding: '4px 8px',
                    minHeight: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>
                    {row.uom ? getUOMLabel(row.uom) : <span style={{ color: 'var(--text-muted)' }}>Click to select</span>}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>✎</span>
                </div>
              );
            }

            if (col === "conversionFactor") {
              const isEditing = editingRowId === row.id && editingField === 'conversionFactor';

              if (isEditing) {
                return (
                  <input
                    className="itf-cell-input"
                    value={row.conversionFactor || ""}
                    onChange={(e) => handleConversionChange(row.id, e.target.value)}
                    placeholder="Enter conversion factor"
                    type="number"
                    step="0.001"
                    min="0.001"
                    autoFocus
                    onBlur={stopEditing}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') stopEditing();
                    }}
                  />
                );
              }

              return (
                <div
                  className="itf-view-text itf-clickable-view"
                  onClick={() => startEditing(row.id, 'conversionFactor')}
                  style={{
                    cursor: 'pointer',
                    padding: '4px 8px',
                    minHeight: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>
                    {row.conversionFactor || <span style={{ color: 'var(--text-muted)' }}>Enter factor</span>}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>✎</span>
                </div>
              );
            }
            return null;
          }}
        />

        <div style={{
          marginTop: '12px',
          padding: '8px 12px',
          background: 'var(--bg-secondary)',
          borderRadius: '6px',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <FaInfoCircle size={14} style={{ color: 'var(--text-muted)' }} />
          <span>Click on any value to edit. Press Enter to save, Esc to cancel.</span>
        </div>
      </section>
    </>
  );
}

function TaxTab({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  const [taxes, setTaxes] = useState<TableRow[]>([]);
  const s = (k: string, v: any) => setForm({ ...form, [k]: v });

  return (
    <>
      <section className="itf-section">
        <CheckField
          id="ineligibleITC" checked={form.ineligibleITC ?? false}
          onChange={(v) => s("ineligibleITC", v)} label="Is Ineligible for Input Tax Credit"
        />

        <div style={{ marginTop: 20 }}>
          <SectionTitle>Taxes</SectionTitle>
          <p className="itf-hint" style={{ marginBottom: 12 }}>Will also apply for variants</p>
          <InlineTable
            columns={[
              { key: "itemTaxTemplate", label: "Item Tax Template", required: true },
              { key: "taxCategory", label: "Tax Category" },
              { key: "validFrom", label: "Valid From" },
              { key: "minNetRate", label: "Minimum Net Rate" },
              { key: "maxNetRate", label: "Maximum Net Rate" },
            ]}
            rows={taxes}
            onAddRow={() => setTaxes([...taxes, makeRow(["itemTaxTemplate","taxCategory","validFrom","minNetRate","maxNetRate"])])}
            onRemoveRow={(id) => setTaxes(taxes.filter((r) => r.id !== id))}
            renderCell={(row, col) => <input className="itf-cell-input" defaultValue={row[col]} />}
          />
        </div>
      </section>

      <div className="itf-divider" />

      <section className="itf-section">
        <div className="itf-two-col">
          <div className="itf-col">
            <Field label="Purchase Tax Withholding Category">
              <TextInput value={form.purchaseTaxWithholding ?? ""} onChange={(v) => s("purchaseTaxWithholding", v)} />
            </Field>
          </div>
          <div className="itf-col">
            <Field label="Sales Tax Withholding Category">
              <TextInput value={form.salesTaxWithholding ?? ""} onChange={(v) => s("salesTaxWithholding", v)} />
            </Field>
          </div>
        </div>
      </section>
    </>
  );
}

function InventoryTab({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  const [] = useState<TableRow[]>([]);
  const s = (k: string, v: any) => setForm({ ...form, [k]: v });

  return (
    <>
      <section className="itf-section">
        <SectionTitle>Stock Levels</SectionTitle>
        <div className="itf-empty-state">No Stock Available Currently</div>
      </section>

      <div className="itf-divider" />

      <section className="itf-section">
        <SectionTitle>Inventory Valuation</SectionTitle>
        <div className="itf-two-col">
          <div className="itf-col">
            <Field label="Valuation Method">
              <SelectInput 
                value={form.valuationMethod ?? ""} 
                onChange={(v) => s("valuationMethod", v)} 
                options={[
                  { label: "FIFO", value: "FIFO" },
                  { label: "Moving Average", value: "Moving Average" },
                  { label: "LIFO", value: "LIFO" }
                ]}
              />
            </Field>
          </div>
          <div className="itf-col">
            <Field label="Valuation Rate">
              <TextInput value={form.valuationRate ?? "0.00"} onChange={(v) => s("valuationRate", v)} />
            </Field>
          </div>
        </div>
      </section>

      <div className="itf-divider" />

      <section className="itf-section">
        <SectionTitle>Inventory Settings</SectionTitle>
        <div className="itf-two-col">
          <div className="itf-col">
            <Field label="End of Life">
              <TextInput value={form.endOfLife ?? "31-12-2099"} onChange={(v) => s("endOfLife", v)} />
            </Field>
            <Field label="Default Material Request Type">
              <SelectInput 
                value={form.matReqType ?? "Purchase"} 
                onChange={(v) => s("matReqType", v)} 
                options={[
                  { label: "Purchase", value: "Purchase" },
                  { label: "Manufacture", value: "Manufacture" },
                  { label: "Transfer", value: "Transfer" },
                  { label: "Customer Provided", value: "Customer Provided" }
                ]}
              />
            </Field>
          </div>
          <div className="itf-col">
            <Field label="Warranty Period (in days)">
              <TextInput value={form.warrantyPeriod ?? ""} onChange={(v) => s("warrantyPeriod", v)} />
            </Field>
            <Field label="Weight Per Unit">
              <TextInput value={form.weightPerUnit ?? "0.000"} onChange={(v) => s("weightPerUnit", v)} />
            </Field>
            <Field label="Weight UOM">
              <TextInput value={form.weightUOM ?? ""} onChange={(v) => s("weightUOM", v)} />
            </Field>
            <CheckField
              id="allowNegStock" checked={form.allowNegStock ?? false}
              onChange={(v) => s("allowNegStock", v)} label="Allow Negative Stock"
              hint="Allow stock to go below zero for this item."
            />
          </div>
        </div>
      </section>

      <div className="itf-divider" />

    </>
  );
}

function PurchasingTab({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  const s = (k: string, v: any) => setForm({ ...form, [k]: v });
  
  // State for suppliers data
  const [suppliers, setSuppliers] = useState<TableRow[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<{ label: string; value: string }[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  
  // Editing state
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'supplier' | 'supplierPartNumber' | null>(null);

  // Fetch suppliers on mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoadingSuppliers(true);
      try {
        const response = await api.get("/supplier");
        if (response.data.success === 1) {
          const records = response.data.data.records || [];
          // Transform to options format
          const options = records.map((supplier: any) => ({
            label: supplier.supplier_name + (supplier.mobile_no ? ` (${supplier.mobile_no})` : ''),
            value: supplier.supplier_name
          }));
          setSupplierOptions(options);
        }
      } catch (err) {
        console.error('Error fetching suppliers:', err);
        toast.error('Failed to load suppliers');
      } finally {
        setLoadingSuppliers(false);
      }
    };
    fetchSuppliers();
  }, []);

  const getSupplierLabel = (value: string) => {
    const option = supplierOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  const handleSupplierChange = (rowId: string, value: string) => {
    setSuppliers(prev => prev.map(row => 
      row.id === rowId ? { ...row, supplier: value } : row
    ));
    setEditingRowId(null);
    setEditingField(null);
  };

  const handlePartNumberChange = (rowId: string, value: string) => {
    setSuppliers(prev => prev.map(row => 
      row.id === rowId ? { ...row, supplierPartNumber: value } : row
    ));
  };

  const startEditing = (rowId: string, field: 'supplier' | 'supplierPartNumber') => {
    setEditingRowId(rowId);
    setEditingField(field);
  };

  const stopEditing = () => {
    setEditingRowId(null);
    setEditingField(null);
  };

  const handleAddRow = () => {
    const newRow = makeRow(["supplier", "supplierPartNumber"]);
    setSuppliers(prev => [...prev, newRow]);
    setEditingRowId(newRow.id);
    setEditingField('supplier');
  };

  return (
    <>
      <section className="itf-section">
        <div className="itf-two-col">
          <div className="itf-col">
            <Field label="Default Purchase Unit of Measure">
              <TextInput value={form.purchaseUOM ?? ""} onChange={(v) => s("purchaseUOM", v)} />
            </Field>
            <Field label="Minimum Order Qty" hint="Minimum quantity should be as per Stock UOM">
              <TextInput value={form.minOrderQty ?? "0.000"} onChange={(v) => s("minOrderQty", v)} />
            </Field>
            <Field label="Safety Stock" hint="Minimum stock level to maintain as a buffer.">
              <TextInput value={form.safetyStock ?? "0.000"} onChange={(v) => s("safetyStock", v)} />
            </Field>
          </div>
          <div className="itf-col">
            <Field label="Lead Time in days" hint="Average time taken by the supplier to deliver">
              <TextInput value={form.leadTime ?? "0"} onChange={(v) => s("leadTime", v)} />
            </Field>
            <Field label="Last Purchase Rate" hint="The rate at which this item was last purchased.">
              <TextInput value={form.lastPurchaseRate ?? "0"} onChange={(v) => s("lastPurchaseRate", v)} />
            </Field>
          </div>
        </div>
      </section>

      <div className="itf-divider" />

      <section className="itf-section">
        <SectionTitle>Supplier Details</SectionTitle>
        <CheckField
          id="dropShip" checked={form.dropShip ?? false}
          onChange={(v) => s("dropShip", v)} label="Delivered by Supplier (Drop Ship)"
          hint="Enable for drop shipping - supplier delivers directly to the customer."
        />
        <div style={{ marginTop: 16 }}>
          <Field label="Item Supplier">
            <InlineTable
              columns={[
                { key: "supplier", label: "Supplier", required: true },
                { key: "supplierPartNumber", label: "Supplier Part Number" },
              ]}
              rows={suppliers}
              onAddRow={handleAddRow}
              onRemoveRow={(id) => {
                if (suppliers.length > 0) {
                  setSuppliers(prev => prev.filter((r) => r.id !== id));
                  if (editingRowId === id) stopEditing();
                }
              }}
              renderCell={(row, col) => {
                if (col === "supplier") {
                  const isEditing = editingRowId === row.id && editingField === 'supplier';

                  if (isEditing) {
                    return (
                      <SelectInput
                        value={row.supplier || ""}
                        onChange={(v) => handleSupplierChange(row.id, v)}
                        options={supplierOptions}
                        loading={loadingSuppliers}
                        placeholder="Search for a supplier..."
                      />
                    );
                  }

                  return (
                    <div
                      className="itf-view-text itf-clickable-view"
                      onClick={() => startEditing(row.id, 'supplier')}
                      style={{
                        cursor: 'pointer',
                        padding: '4px 8px',
                        minHeight: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>
                        {row.supplier ? getSupplierLabel(row.supplier) : <span style={{ color: 'var(--text-muted)' }}>Click to select</span>}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>✎</span>
                    </div>
                  );
                }

                if (col === "supplierPartNumber") {
                  const isEditing = editingRowId === row.id && editingField === 'supplierPartNumber';

                  if (isEditing) {
                    return (
                      <input
                        className="itf-cell-input"
                        value={row.supplierPartNumber || ""}
                        onChange={(e) => handlePartNumberChange(row.id, e.target.value)}
                        placeholder="Enter part number"
                        autoFocus
                        onBlur={stopEditing}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === 'Escape') stopEditing();
                        }}
                      />
                    );
                  }

                  return (
                    <div
                      className="itf-view-text itf-clickable-view"
                      onClick={() => startEditing(row.id, 'supplierPartNumber')}
                      style={{
                        cursor: 'pointer',
                        padding: '4px 8px',
                        minHeight: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>
                        {row.supplierPartNumber || <span style={{ color: 'var(--text-muted)' }}>Enter part number</span>}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>✎</span>
                    </div>
                  );
                }
                return null;
              }}
            />

            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              background: 'var(--bg-secondary)',
              borderRadius: '6px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <FaInfoCircle size={14} style={{ color: 'var(--text-muted)' }} />
              <span>Click on any value to edit. Press Enter to save, Esc to cancel.</span>
            </div>
          </Field>
        </div>
      </section>
    </>
  );
}

function SalesTab({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  const s = (k: string, v: any) => setForm({ ...form, [k]: v });
  
  // State for customers data
  const [customers, setCustomers] = useState<TableRow[]>([]);
  const [customerOptions, setCustomerOptions] = useState<{ label: string; value: string }[]>([]);
  const [customerGroupOptions, setCustomerGroupOptions] = useState<{ label: string; value: string }[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  
  // Editing state
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'customerName' | 'customerGroup' | 'refCode' | null>(null);

  // Fetch customers on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const response = await api.get("/customer");
        if (response.data.success === 1) {
          const records = response.data.data.records || [];
          // Transform to options format
          const options = records.map((customer: any) => ({
            label: customer.customer_name + (customer.mobile_no ? ` (${customer.mobile_no})` : ''),
            value: customer.customer_name
          }));
          setCustomerOptions(options);
        }
      } catch (err) {
        console.error('Error fetching customers:', err);
        toast.error('Failed to load customers');
      } finally {
        setLoadingCustomers(false);
      }
    };
    fetchCustomers();
  }, []);

  // Fetch customer groups on mount
  useEffect(() => {
    const fetchCustomerGroups = async () => {
      setLoadingGroups(true);
      try {
        const response = await api.get("/customer-group");
        if (response.data.success === 1) {
          const records = response.data.data.records || [];
          // Filter out parent groups if needed (is_group === 1)
          const filteredRecords = records.filter((group: any) => group.is_group === 0);
          // Transform to options format
          const options = filteredRecords.map((group: any) => ({
            label: group.customer_group_name,
            value: group.customer_group_name
          }));
          setCustomerGroupOptions(options);
        }
      } catch (err) {
        console.error('Error fetching customer groups:', err);
        toast.error('Failed to load customer groups');
      } finally {
        setLoadingGroups(false);
      }
    };
    fetchCustomerGroups();
  }, []);

  const getCustomerLabel = (value: string) => {
    const option = customerOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  const getCustomerGroupLabel = (value: string) => {
    const option = customerGroupOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  const handleCustomerChange = (rowId: string, value: string) => {
    setCustomers(prev => prev.map(row => 
      row.id === rowId ? { ...row, customerName: value } : row
    ));
    setEditingRowId(null);
    setEditingField(null);
  };

  const handleGroupChange = (rowId: string, value: string) => {
    setCustomers(prev => prev.map(row => 
      row.id === rowId ? { ...row, customerGroup: value } : row
    ));
    setEditingRowId(null);
    setEditingField(null);
  };

  const handleRefCodeChange = (rowId: string, value: string) => {
    setCustomers(prev => prev.map(row => 
      row.id === rowId ? { ...row, refCode: value } : row
    ));
  };

  const startEditing = (rowId: string, field: 'customerName' | 'customerGroup' | 'refCode') => {
    setEditingRowId(rowId);
    setEditingField(field);
  };

  const stopEditing = () => {
    setEditingRowId(null);
    setEditingField(null);
  };

  const handleAddRow = () => {
    const newRow = makeRow(["customerName", "customerGroup", "refCode"]);
    setCustomers(prev => [...prev, newRow]);
    setEditingRowId(newRow.id);
    setEditingField('customerName');
  };

  return (
    <>
      <section className="itf-section">
        <div className="itf-two-col">
          <div className="itf-col">
            <Field label="Default Sales Unit of Measure">
              <TextInput value={form.salesUOM ?? ""} onChange={(v) => s("salesUOM", v)} />
            </Field>
            <CheckField
              id="grantCommission" checked={form.grantCommission ?? true}
              onChange={(v) => s("grantCommission", v)} label="Grant Commission"
            />
          </div>
          <div className="itf-col">
            <Field label="Max Discount (%)" hint="Maximum discount % allowed when selling this item.">
              <TextInput value={form.maxDiscount ?? "0.000"} onChange={(v) => s("maxDiscount", v)} />
            </Field>
          </div>
        </div>
      </section>

      <div className="itf-divider" />

      <section className="itf-section">
        <SectionTitle>Customer Details</SectionTitle>
        <Field label="Customer Items">
          <InlineTable
            columns={[
              { key: "customerName", label: "Customer Name", required: true },
              { key: "customerGroup", label: "Customer Group", required: true },
              { key: "refCode", label: "Ref Code", required: true },
            ]}
            rows={customers}
            onAddRow={handleAddRow}
            onRemoveRow={(id) => {
              if (customers.length > 0) {
                setCustomers(prev => prev.filter((r) => r.id !== id));
                if (editingRowId === id) stopEditing();
              }
            }}
            renderCell={(row, col) => {
              if (col === "customerName") {
                const isEditing = editingRowId === row.id && editingField === 'customerName';

                if (isEditing) {
                  return (
                    <SelectInput
                      value={row.customerName || ""}
                      onChange={(v) => handleCustomerChange(row.id, v)}
                      options={customerOptions}
                      loading={loadingCustomers}
                      placeholder="Search for a customer..."
                    />
                  );
                }

                return (
                  <div
                    className="itf-view-text itf-clickable-view"
                    onClick={() => startEditing(row.id, 'customerName')}
                    style={{
                      cursor: 'pointer',
                      padding: '4px 8px',
                      minHeight: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>
                      {row.customerName ? getCustomerLabel(row.customerName) : <span style={{ color: 'var(--text-muted)' }}>Click to select</span>}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>✎</span>
                  </div>
                );
              }

              if (col === "customerGroup") {
                const isEditing = editingRowId === row.id && editingField === 'customerGroup';

                if (isEditing) {
                  return (
                    <SelectInput
                      value={row.customerGroup || ""}
                      onChange={(v) => handleGroupChange(row.id, v)}
                      options={customerGroupOptions}
                      loading={loadingGroups}
                      placeholder="Search for a customer group..."
                    />
                  );
                }

                return (
                  <div
                    className="itf-view-text itf-clickable-view"
                    onClick={() => startEditing(row.id, 'customerGroup')}
                    style={{
                      cursor: 'pointer',
                      padding: '4px 8px',
                      minHeight: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>
                      {row.customerGroup ? getCustomerGroupLabel(row.customerGroup) : <span style={{ color: 'var(--text-muted)' }}>Click to select</span>}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>✎</span>
                  </div>
                );
              }

              if (col === "refCode") {
                const isEditing = editingRowId === row.id && editingField === 'refCode';

                if (isEditing) {
                  return (
                    <input
                      className="itf-cell-input"
                      value={row.refCode || ""}
                      onChange={(e) => handleRefCodeChange(row.id, e.target.value)}
                      placeholder="Enter reference code"
                      autoFocus
                      onBlur={stopEditing}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape') stopEditing();
                      }}
                    />
                  );
                }

                return (
                  <div
                    className="itf-view-text itf-clickable-view"
                    onClick={() => startEditing(row.id, 'refCode')}
                    style={{
                      cursor: 'pointer',
                      padding: '4px 8px',
                      minHeight: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>
                      {row.refCode || <span style={{ color: 'var(--text-muted)' }}>Enter ref code</span>}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>✎</span>
                  </div>
                );
              }
              return null;
            }}
          />

          <div style={{
            marginTop: '12px',
            padding: '8px 12px',
            background: 'var(--bg-secondary)',
            borderRadius: '6px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <FaInfoCircle size={14} style={{ color: 'var(--text-muted)' }} />
            <span>Click on any value to edit. Press Enter to save, Esc to cancel.</span>
          </div>
        </Field>
      </section>
    </>
  );
}

function ManufacturingTab({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  const s = (k: string, v: any) => setForm({ ...form, [k]: v });
  return (
    <>
      <section className="itf-section">
        <div className="itf-two-col">
          <div className="itf-col">
            <CheckField
              id="includeInMfg" checked={form.includeInMfg ?? true}
              onChange={(v) => s("includeInMfg", v)} label="Include Item In Manufacturing"
              hint="Enable for raw material items used in BOM."
            />
            <CheckField
              id="isSubcontracted" checked={form.isSubcontracted ?? false}
              onChange={(v) => s("isSubcontracted", v)} label="Is Subcontracted Item"
              hint="Enable if a vendor manufactures this item for you."
            />
          </div>
          <div className="itf-col">
            <Field label="Production Capacity">
              <TextInput value={form.productionCapacity ?? "0"} onChange={(v) => s("productionCapacity", v)} />
            </Field>
          </div>
        </div>
      </section>
    </>
  );
}

function QualityTab({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  const s = (k: string, v: any) => setForm({ ...form, [k]: v });
  
  // State for quality inspection templates
  const [templateOptions, setTemplateOptions] = useState<{ label: string; value: string }[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Fetch quality inspection templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const response = await api.get("/quality-inspection-template");
        if (response.data.success === 1) {
          const records = response.data.data.records || [];
          // Transform to options format
          const options = records.map((template: any) => ({
            label: template.quality_inspection_template_name,
            value: template.quality_inspection_template_name
          }));
          setTemplateOptions(options);
        }
      } catch (err) {
        console.error('Error fetching quality inspection templates:', err);
        toast.error('Failed to load quality inspection templates');
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  return (
    <>
      <section className="itf-section">
        <SectionTitle>Quality Inspection</SectionTitle>
        
        {/* Two-column layout: checkboxes on left, dropdown on right */}
        <div className="itf-two-col">
          <div className="itf-col">
            <CheckField
              id="inspectionRequiredPurchase"
              checked={form.inspectionRequiredPurchase ?? false}
              onChange={(v) => s("inspectionRequiredPurchase", v)}
              label="Inspection Required before Purchase"
            />
            
            <CheckField
              id="inspectionRequiredDelivery"
              checked={form.inspectionRequiredDelivery ?? false}
              onChange={(v) => s("inspectionRequiredDelivery", v)}
              label="Inspection Required before Delivery"
            />
          </div>
          
          <div className="itf-col">
            <Field label="Quality Inspection Template">
              <SelectInput
                value={form.qualityInspectionTemplate || ""}
                onChange={(v) => s("qualityInspectionTemplate", v)}
                options={templateOptions}
                loading={loadingTemplates}
                placeholder="Search for a quality inspection template..."
              />
            </Field>
          </div>
        </div>
      </section>
    </>
  );
}

function PricingTab({  }: { form: any; setForm: (f: any) => void }) {
  
  // State for price list rows
  const [priceRows, setPriceRows] = useState<TableRow[]>([]);
  const [priceListOptions, setPriceListOptions] = useState<{ label: string; value: string }[]>([]);
  const [loadingPriceLists, setLoadingPriceLists] = useState(false);
  
  // Editing state
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'priceList' | 'price' | null>(null);

  // Fetch price lists on mount
  useEffect(() => {
    const fetchPriceLists = async () => {
      setLoadingPriceLists(true);
      try {
        const response = await api.get("/price-list");
        if (response.data.success === 1) {
          const records = response.data.data.records || [];
          // Transform to options format
          const options = records.map((priceList: any) => ({
            label: priceList.price_list_name + (priceList.currency ? ` (${priceList.currency})` : ''),
            value: priceList.price_list_name
          }));
          setPriceListOptions(options);
        }
      } catch (err) {
        console.error('Error fetching price lists:', err);
        toast.error('Failed to load price lists');
      } finally {
        setLoadingPriceLists(false);
      }
    };
    fetchPriceLists();
  }, []);

  const getPriceListLabel = (value: string) => {
    const option = priceListOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  // Helper to get currency for a price list
  const getCurrencyForPriceList = () => {
    // This would ideally come from the API data
    // For now, we'll default to INR or you can fetch from the price list data
    return "INR";
  };

  const handlePriceListChange = (rowId: string, value: string) => {
    setPriceRows(prev => prev.map(row => 
      row.id === rowId ? { ...row, priceList: value, currency: getCurrencyForPriceList() } : row
    ));
    setEditingRowId(null);
    setEditingField(null);
  };

  const handlePriceChange = (rowId: string, value: string) => {
    setPriceRows(prev => prev.map(row => 
      row.id === rowId ? { ...row, price: value } : row
    ));
  };

  const startEditing = (rowId: string, field: 'priceList' | 'price') => {
    setEditingRowId(rowId);
    setEditingField(field);
  };

  const stopEditing = () => {
    setEditingRowId(null);
    setEditingField(null);
  };

  const handleAddRow = () => {
    const newRow = makeRow(["priceList", "price", "currency"]);
    setPriceRows(prev => [...prev, newRow]);
    setEditingRowId(newRow.id);
    setEditingField('priceList');
  };

  return (
    <>
      <section className="itf-section">
        <SectionTitle>Item Prices</SectionTitle>
        <p className="itf-hint" style={{ marginBottom: 16 }}>
          All active prices for this item across buying and selling price lists.
        </p>
        
        <InlineTable
          columns={[
            { key: "priceList", label: "Price List", required: true },
            { key: "price", label: "Price", required: true },
            { key: "currency", label: "Currency" },
          ]}
          rows={priceRows}
          onAddRow={handleAddRow}
          onRemoveRow={(id) => {
            if (priceRows.length > 0) {
              setPriceRows(prev => prev.filter((r) => r.id !== id));
              if (editingRowId === id) stopEditing();
            }
          }}
          renderCell={(row, col) => {
            if (col === "priceList") {
              const isEditing = editingRowId === row.id && editingField === 'priceList';

              if (isEditing) {
                return (
                  <SelectInput
                    value={row.priceList || ""}
                    onChange={(v) => handlePriceListChange(row.id, v)}
                    options={priceListOptions}
                    loading={loadingPriceLists}
                    placeholder="Search for a price list..."
                  />
                );
              }

              return (
                <div
                  className="itf-view-text itf-clickable-view"
                  onClick={() => startEditing(row.id, 'priceList')}
                  style={{
                    cursor: 'pointer',
                    padding: '4px 8px',
                    minHeight: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>
                    {row.priceList ? getPriceListLabel(row.priceList) : <span style={{ color: 'var(--text-muted)' }}>Click to select</span>}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>✎</span>
                </div>
              );
            }

            if (col === "price") {
              const isEditing = editingRowId === row.id && editingField === 'price';

              if (isEditing) {
                return (
                  <input
                    className="itf-cell-input"
                    value={row.price || ""}
                    onChange={(e) => handlePriceChange(row.id, e.target.value)}
                    placeholder="Enter price"
                    type="number"
                    step="0.01"
                    min="0"
                    autoFocus
                    onBlur={stopEditing}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') stopEditing();
                    }}
                  />
                );
              }

              return (
                <div
                  className="itf-view-text itf-clickable-view"
                  onClick={() => startEditing(row.id, 'price')}
                  style={{
                    cursor: 'pointer',
                    padding: '4px 8px',
                    minHeight: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>
                    {row.price ? `₹ ${row.price}` : <span style={{ color: 'var(--text-muted)' }}>Enter price</span>}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>✎</span>
                </div>
              );
            }

            if (col === "currency") {
              // Read-only display
              return (
                <div
                  className="itf-view-text"
                  style={{
                    padding: '4px 8px',
                    minHeight: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span>
                    {row.currency || "INR"}
                  </span>
                </div>
              );
            }
            return null;
          }}
        />

        <div style={{
          marginTop: '12px',
          padding: '8px 12px',
          background: 'var(--bg-secondary)',
          borderRadius: '6px',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <FaInfoCircle size={14} style={{ color: 'var(--text-muted)' }} />
          <span>Click on any value to edit. Press Enter to save, Esc to cancel.</span>
        </div>
      </section>
    </>
  );
}

function ConnectionsTab() {
  const groups = [
    { label: "Groups", items: ["BOM", "Product Bundle", "Item Alternative"] },
    { label: "Pricing", items: ["Item Price", "Pricing Rule"] },
    { label: "Sell", items: ["Quotation", "Sales Order", "Delivery Note", "Sales Invoice"] },
  ];
  const groups2 = [
    { label: "Buy", items: ["Material Request", "Supplier Quotation", "Request for Quotation", "Purchase Order", "Purchase Receipt", "Purchase Invoice"] },
    { label: "Manufacture", items: ["Production Plan", "Work Order", "Item Manufacturer"] },
    { label: "Traceability", items: ["Serial No", "Batch"] },
  ];
  const stockMovement = ["Stock Entry", "Stock Reconciliation"];
  const leadTime = ["Item Lead Time"];

  return (
    <>
      <section className="itf-section">
        <div className="itf-conn-activity-header">
          <span className="itf-section-title" style={{ margin: 0 }}>Activity</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
        </div>
        <div className="itf-heatmap">
          {["JUN","JUL","AUG","SEP","OCT","NOV","DEC","JAN","FEB","MAR","APR","MAY","JUN"].map((m) => (
            <div key={m} className="itf-heatmap-col">
              <div className="itf-heatmap-month">{m}</div>
              {["Mon","","Wed","","Fri"].map(( i) => (
                <div key={i} className="itf-heatmap-row">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="itf-heatmap-cell" />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="itf-hint" style={{ marginTop: 8 }}>This is based on stock movement. See Stock Ledger for details</p>
      </section>

      <div className="itf-divider" />

      <section className="itf-section">
        <div className="itf-conn-groups">
          {groups.map((g) => (
            <div key={g.label} className="itf-conn-group">
              <div className="itf-conn-group-title">{g.label}</div>
              {g.items.map((item) => (
                <div key={item} className="itf-conn-item">
                  <span>{item}</span>
                  <button className="itf-conn-add">+</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <div className="itf-divider" />

      <section className="itf-section">
        <div className="itf-conn-groups">
          {groups2.map((g) => (
            <div key={g.label} className="itf-conn-group">
              <div className="itf-conn-group-title">{g.label}</div>
              {g.items.map((item) => (
                <div key={item} className="itf-conn-item">
                  <span>{item}</span>
                  <button className="itf-conn-add">+</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <div className="itf-divider" />

      <section className="itf-section">
        <div className="itf-conn-groups">
          <div className="itf-conn-group">
            <div className="itf-conn-group-title">Stock Movement</div>
            {stockMovement.map((item) => (
              <div key={item} className="itf-conn-item">
                <span>{item}</span>
                <button className="itf-conn-add">+</button>
              </div>
            ))}
          </div>
          <div className="itf-conn-group">
            <div className="itf-conn-group-title">Lead Time</div>
            {leadTime.map((item) => (
              <div key={item} className="itf-conn-item">
                <span>{item}</span>
                <button className="itf-conn-add">+</button>
              </div>
            ))}
          </div>
          <div className="itf-conn-group" />
        </div>
      </section>
    </>
  );
}

/* ── Main Component ─────────────────────────── */

export default function ItemForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useAdminTheme();
  
  const isNew = id === "new" || !id;
  const itemCode = isNew ? "" : decodeURIComponent(id ?? "");

    const itemId = isNew ? null : parseInt(id || "0");
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [, setIsDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const tabs = [
    { id: 0, name: 'Details', icon: <FaTag size={14} /> },
    { id: 1, name: 'Accounting', icon: <FaDollarSign size={14} /> },
    { id: 2, name: 'UOM', icon: <FaCube size={14} /> },
    { id: 3, name: 'Tax', icon: <FaList size={14} /> },
    { id: 4, name: 'Inventory', icon: <FaBoxes size={14} /> },
    { id: 5, name: 'Purchasing', icon: <FaTruck size={14} /> },
    { id: 6, name: 'Sales', icon: <FaShoppingCart size={14} /> },
    { id: 7, name: 'Manufacturing', icon: <FaIndustry size={14} /> },
    { id: 8, name: 'Quality', icon: <FaClipboardCheck size={14} /> },
    { id: 9, name: 'Pricing', icon: <FaDollarSign size={14} /> },
    // { id: 10, name: 'Connections', icon: <FaLink size={14} /> },
  ];

  // Get data from location state (from ItemList)
  const itemData = location.state?.itemData as ItemData | undefined;
  const prefillData = location.state?.prefill as any | undefined;

  const [form, setFormRaw] = useState({
    // Basic Info
    id:0,
    itemName: "",
    itemCode: "",
    itemGroup: "",
    defaultUOM: "Nos",
    brand: "",
    description: "",
    disabled: false,
    
    // Flags
    maintainStock: true,
    isFixedAsset: false,
    allowSales: true,
    allowPurchase: true,
    allowAltItem: false,
    isCustomerProvided: false,
    hasVariants: false,
    grantCommission: true,
    includeInMfg: true,
    isSubcontracted: false,
    allowNegStock: false,
    hasBatchNo: false,
    hasSerialNo: false,
    
    // Numbers
    overDelivery: "0.000",
    overBilling: "0.000",
    valuationMethod: "FIFO",
    valuationRate: "0.00",
    standardRate: "0.00",
    openingStock: "0.00",
    weightPerUnit: "0.000",
    weightUOM: "",
    minOrderQty: "0.000",
    safetyStock: "0.000",
    leadTime: "0",
    lastPurchaseRate: "0.00",
    maxDiscount: "0.000",
    productionCapacity: "0",
    warrantyPeriod: "",
    
    // UOMs
    purchaseUOM: "",
    salesUOM: "",
    
    // Other
    countryOfOrigin: "",
    endOfLife: "31-12-2099",
    matReqType: "Purchase",
    inspectionRequiredPurchase: false,
    inspectionRequiredDelivery: false,
    qualityInspectionTemplate: "",
    deferredExpense: false,
    deferredRevenue: false,
    purchaseTaxWithholding: "",
    salesTaxWithholding: "",
    dropShip: false,
    ineligibleITC: false,
  });

  const setForm = (f: any) => { setFormRaw(f); setIsDirty(true); };

  // Fetch item data if editing
  useEffect(() => {
    if (!isNew && itemId) {
      // If we have data from location state, use it
      if (itemData) {
        setFormRaw({
          id: itemData.id || 0,
          // Basic Info
          itemName: itemData.item_name || "",
          itemCode: itemData.item_code || "",
          itemGroup: itemData.item_group || "",
          defaultUOM: itemData.stock_uom || "Nos",
          brand: itemData.brand || "",
          description: itemData.description || "",
          disabled: itemData.disabled === 1,
          
          // Flags
          maintainStock: itemData.is_stock_item === 1,
          isFixedAsset: itemData.is_fixed_asset === 1,
          allowSales: itemData.is_sales_item === 1,
          allowPurchase: itemData.is_purchase_item === 1,
          allowAltItem: false,
          isCustomerProvided: false,
          hasVariants: false,
          grantCommission: true,
          includeInMfg: true,
          isSubcontracted: false,
          allowNegStock: false,
          hasBatchNo: false,
          hasSerialNo: false,
          
          // Numbers
          overDelivery: "0.000",
          overBilling: "0.000",
          valuationMethod: itemData.valuation_method || "FIFO",
          valuationRate: "0.00",
          standardRate: "0.00",
          openingStock: "0.00",
          weightPerUnit: "0.000",
          weightUOM: "",
          minOrderQty: "0.000",
          safetyStock: "0.000",
          leadTime: "0",
          lastPurchaseRate: "0.00",
          maxDiscount: "0.000",
          productionCapacity: "0",
          warrantyPeriod: "",
          
          // UOMs
          purchaseUOM: "",
          salesUOM: "",
          
          // Other
          countryOfOrigin: "",
          endOfLife: "31-12-2099",
          matReqType: "Purchase",
          inspectionRequiredPurchase: false,
          inspectionRequiredDelivery: false,
          qualityInspectionTemplate: "",
          deferredExpense: false,
          deferredRevenue: false,
          purchaseTaxWithholding: "",
          salesTaxWithholding: "",
          dropShip: false,
          ineligibleITC: false,
        });
        setIsDirty(false);
      } else {
        // Fetch from API if no location state
        fetchItemData();
      }
    } else if (isNew && prefillData) {
      // Prefill from quick add
      setFormRaw({
        // Basic Info
        id: 0,
        itemName: prefillData.itemName || "",
        itemCode: prefillData.itemCode || "",
        itemGroup: prefillData.itemGroup || "",
        defaultUOM: prefillData.defaultUOM || "Nos",
        brand: prefillData.brand || "",
        description: prefillData.description || "",
        disabled: false,
        
        // Flags
        maintainStock: prefillData.maintainStock ?? true,
        isFixedAsset: prefillData.isFixedAsset ?? false,
        allowSales: true,
        allowPurchase: true,
        allowAltItem: false,
        isCustomerProvided: false,
        hasVariants: false,
        grantCommission: true,
        includeInMfg: true,
        isSubcontracted: false,
        allowNegStock: false,
        hasBatchNo: false,
        hasSerialNo: false,
        
        // Numbers
        overDelivery: "0.000",
        overBilling: "0.000",
        valuationMethod: "FIFO",
        valuationRate: "0.00",
        standardRate: "0.00",
        openingStock: "0.00",
        weightPerUnit: "0.000",
        weightUOM: "",
        minOrderQty: "0.000",
        safetyStock: "0.000",
        leadTime: "0",
        lastPurchaseRate: "0.00",
        maxDiscount: "0.000",
        productionCapacity: "0",
        warrantyPeriod: "",
        
        // UOMs
        purchaseUOM: "",
        salesUOM: "",
        
        // Other
        countryOfOrigin: "",
        endOfLife: "31-12-2099",
        matReqType: "Purchase",
        inspectionRequiredPurchase: false,
        inspectionRequiredDelivery: false,
        qualityInspectionTemplate: "",
        deferredExpense: false,
        deferredRevenue: false,
        purchaseTaxWithholding: "",
        salesTaxWithholding: "",
        dropShip: false,
        ineligibleITC: false,
      });
    }
  }, [isNew, itemCode, itemData, prefillData]);

// Fetch item data using ID
const fetchItemData = async () => {
  setLoading(true);
  try {
    const response = await api.get(`/item/${id}`); // Use ID from params
    if (response.data.success === 1) {
      const data = response.data.data;
      setFormRaw({
        id: data.id,
        itemName: data.item_name || "",
        itemCode: data.item_code || "",
        itemGroup: data.item_group || "",
        defaultUOM: data.stock_uom || "Nos",
        brand: data.brand || "",
        description: data.description || "",
        disabled: data.disabled === 1,
        maintainStock: data.is_stock_item === 1,
        isFixedAsset: data.is_fixed_asset === 1,
        allowSales: data.is_sales_item === 1,
        allowPurchase: data.is_purchase_item === 1,
        allowAltItem: data.allow_alternative_item === 1,
        isCustomerProvided: data.is_customer_provided_item === 1,
        hasVariants: data.has_variants === 1,
        grantCommission: data.grant_commission === 1,
        includeInMfg: data.include_item_in_manufacturing === 1,
        isSubcontracted: data.is_sub_contracted_item === 1,
        allowNegStock: data.allow_negative_stock === 1,
        hasBatchNo: data.has_batch_no === 1,
        hasSerialNo: data.has_serial_no === 1,
        overDelivery: String(data.over_delivery_receipt_allowance || 0),
        overBilling: String(data.over_billing_allowance || 0),
        valuationMethod: data.valuation_method || "FIFO",
        valuationRate: String(data.valuation_rate || 0),
        standardRate: String(data.standard_rate || 0),
        openingStock: String(data.opening_stock || 0),
        weightPerUnit: String(data.weight_per_unit || 0),
        weightUOM: data.weight_uom || "",
        minOrderQty: String(data.min_order_qty || 0),
        safetyStock: String(data.safety_stock || 0),
        leadTime: String(data.lead_time_days || 0),
        lastPurchaseRate: String(data.last_purchase_rate || 0),
        maxDiscount: String(data.max_discount || 0),
        productionCapacity: String(data.production_capacity || 0),
        warrantyPeriod: data.warranty_period || "",
        purchaseUOM: data.purchase_uom || "",
        salesUOM: data.sales_uom || "",
        countryOfOrigin: data.country_of_origin || "",
        endOfLife: data.end_of_life ? data.end_of_life.split('-').reverse().join('-') : "31-12-2099",
        matReqType: data.default_material_request_type || "Purchase",
        inspectionRequiredPurchase: data.inspection_required_before_purchase === 1,
        inspectionRequiredDelivery: data.inspection_required_before_delivery === 1,
        qualityInspectionTemplate: data.quality_inspection_template || "",
        deferredExpense: data.enable_deferred_expense === 1,
        deferredRevenue: data.enable_deferred_revenue === 1,
        purchaseTaxWithholding: data.purchase_tax_withholding_category || "",
        salesTaxWithholding: data.sales_tax_withholding_category || "",
        dropShip: data.delivered_by_supplier === 1,
        ineligibleITC: false,
      });
      setIsDirty(false);
    }
  } catch (err) {
    console.error('Error fetching item:', err);
    toast.error('Failed to load item data');
  } finally {
    setLoading(false);
  }
};

// Handle save with ID
const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();

  const allErrors = getAllValidationErrors();
  if (allErrors.length > 0) {
    setValidationErrors(allErrors);
    setShowValidationSummary(true);
    return;
  }

  setSubmitting(true);
  try {
    const payload = {
      id: parseInt(id || "0"), // ID first in the payload
      item_code: form.itemCode || form.itemName.toUpperCase().replace(/\s+/g, '-'),
      item_name: form.itemName.trim(),
      item_group: form.itemGroup.trim(),
      stock_uom: form.defaultUOM.trim(),
      brand: form.brand || null,
      description: form.description || form.itemName.trim(),
      disabled: form.disabled ? 1 : 0,
      is_stock_item: form.maintainStock ? 1 : 0,
      is_fixed_asset: form.isFixedAsset ? 1 : 0,
      is_sales_item: form.allowSales ? 1 : 0,
      is_purchase_item: form.allowPurchase ? 1 : 0,
      allow_alternative_item: form.allowAltItem ? 1 : 0,
      is_customer_provided_item: form.isCustomerProvided ? 1 : 0,
      has_variants: form.hasVariants ? 1 : 0,
      grant_commission: form.grantCommission ? 1 : 0,
      include_item_in_manufacturing: form.includeInMfg ? 1 : 0,
      is_sub_contracted_item: form.isSubcontracted ? 1 : 0,
      allow_negative_stock: form.allowNegStock ? 1 : 0,
      has_batch_no: form.hasBatchNo ? 1 : 0,
      has_serial_no: form.hasSerialNo ? 1 : 0,
      delivered_by_supplier: form.dropShip ? 1 : 0,
      over_delivery_receipt_allowance: parseFloat(form.overDelivery) || 0,
      over_billing_allowance: parseFloat(form.overBilling) || 0,
      valuation_method: form.valuationMethod || "FIFO",
      valuation_rate: parseFloat(form.valuationRate) || 0,
      standard_rate: parseFloat(form.standardRate) || 0,
      opening_stock: parseFloat(form.openingStock) || 0,
      weight_per_unit: parseFloat(form.weightPerUnit) || 0,
      weight_uom: form.weightUOM || null,
      min_order_qty: parseFloat(form.minOrderQty) || 0,
      safety_stock: parseFloat(form.safetyStock) || 0,
      lead_time_days: parseInt(form.leadTime) || 0,
      last_purchase_rate: parseFloat(form.lastPurchaseRate) || 0,
      max_discount: parseFloat(form.maxDiscount) || 0,
      production_capacity: parseInt(form.productionCapacity) || 0,
      warranty_period: form.warrantyPeriod || null,
      purchase_uom: form.purchaseUOM || null,
      sales_uom: form.salesUOM || null,
      country_of_origin: form.countryOfOrigin || null,
      end_of_life: form.endOfLife ? form.endOfLife.split('-').reverse().join('-') : "2099-12-31",
      default_material_request_type: form.matReqType || "Purchase",
      inspection_required_before_purchase: form.inspectionRequiredPurchase ? 1 : 0,
      inspection_required_before_delivery: form.inspectionRequiredDelivery ? 1 : 0,
      quality_inspection_template: form.qualityInspectionTemplate || null,
      enable_deferred_expense: form.deferredExpense ? 1 : 0,
      enable_deferred_revenue: form.deferredRevenue ? 1 : 0,
      purchase_tax_withholding_category: form.purchaseTaxWithholding || null,
      sales_tax_withholding_category: form.salesTaxWithholding || null,
    };

    let response;
    if (isNew) {
      response = await api.post('/item', payload);
    } else {
      // PUT to /item with ID in payload
      response = await api.put('/item', payload);
    }

    if (response.data && response.data.success === 1) {
      setIsDirty(false);
      toast.success(isNew ? 'Item created successfully!' : 'Item updated successfully!');
      navigate('/item-list');
    } else {
      toast.error(response.data?.message || 'Failed to save item');
    }
  } catch (err: any) {
    console.error('Error saving item:', err);
    if (err.response?.status === 409) {
      toast.error('An item with this code already exists');
    } else {
      toast.error(err.response?.data?.message || 'Failed to save item');
    }
  } finally {
    setSubmitting(false);
  }
};

  const tabProps = { form, setForm };

  // ─── Validation ──────────────────────────────────────
  const getAllValidationErrors = (): ValidationError[] => {
    const allErrors: ValidationError[] = [];

    // Tab 0 — Details
    if (!form.itemName.trim())
      allErrors.push({ field: 'itemName', label: 'Item Name', message: 'Item name is required', tabIndex: 0 });
    if (!form.itemGroup.trim())
      allErrors.push({ field: 'itemGroup', label: 'Item Group', message: 'Item group is required', tabIndex: 0 });
    if (!form.defaultUOM.trim())
      allErrors.push({ field: 'defaultUOM', label: 'Default UOM', message: 'Default unit of measure is required', tabIndex: 0 });

    return allErrors;
  };

  const getTabErrorCount = (tabId: number): number => {
    return getAllValidationErrors().filter(e => e.tabIndex === tabId).length;
  };

  const jumpToTab = (tabIndex: number) => {
    setActiveTab(tabIndex);
    setShowValidationSummary(false);
  };

  const renderTab = () => {
    switch (activeTab) {
      case 0: return <DetailsTab {...tabProps} />;
      case 1: return <AccountingTab {...tabProps} />;
      case 2: return <UOMTab {...tabProps} />;
      case 3: return <TaxTab {...tabProps} />;
      case 4: return <InventoryTab {...tabProps} />;
      case 5: return <PurchasingTab {...tabProps} />;
      case 6: return <SalesTab {...tabProps} />;
      case 7: return <ManufacturingTab {...tabProps} />;
      case 8: return <QualityTab {...tabProps} />;
      case 9: return <PricingTab {...tabProps} />;
      case 10: return <ConnectionsTab />;
    }
  };


  const allValidationErrors = getAllValidationErrors();
  const hasAnyErrors = allValidationErrors.length > 0;

  if (loading) {
    return (
      <div className={`itf-page ${theme}`}>
        <div className="itf-loading-state">
          <FaSpinner className="spinning" size={32} />
          <p>Loading item data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`itf-page ${theme}`}>
      {/* Validation Summary Modal */}
      {showValidationSummary && validationErrors.length > 0 && (
        <div className="modal-overlay" onClick={() => setShowValidationSummary(false)}>
          <div className="validation-summary-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottomColor: '#fbbf24' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '18px', fontWeight: 700, margin: 0 }}>
                <FaExclamationTriangle /> Missing Required Fields
              </h2>
              <button className="modal-close" onClick={() => setShowValidationSummary(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                Please fill in the following required fields before submitting:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {validationErrors.map((error, idx) => (
                  <div
                    key={idx}
                    className="validation-error-item"
                    onClick={() => jumpToTab(error.tabIndex)}
                  >
                    <div className="error-header">
                      <FaTimesCircle style={{ color: '#ef4444', flexShrink: 0 }} />
                      <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{error.label}</strong>
                      <span className="error-tab">
                        Tab {error.tabIndex + 1}: {tabs[error.tabIndex].name}
                      </span>
                    </div>
                    <div className="error-message">{error.message}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', padding: '10px 12px', background: '#fef3c7', borderRadius: '8px', fontSize: '11px', color: '#92400e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaInfoCircle style={{ flexShrink: 0 }} />
                Click on any error to jump to that section
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowValidationSummary(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="itf-topbar">
        <div className="itf-breadcrumb">
          <button onClick={() => navigate('/item-list')} className="itf-back-btn">
            <FaArrowLeft size={12} /> Back
          </button>
          <span className="itf-bc-sep">/</span>
          <span className="itf-bc-link" onClick={() => navigate("/item-list")}>Stock</span>
          <span className="itf-bc-sep">/</span>
          <span className="itf-bc-link" onClick={() => navigate("/item-list")}>Item</span>
          <span className="itf-bc-sep">/</span>
          <span className="itf-bc-current">{isNew ? "New Item" : form.itemName || itemCode}</span>
          {!isNew && !form.disabled && <span className="itf-status-pill enabled">Enabled</span>}
          {!isNew && form.disabled && <span className="itf-status-pill disabled">Disabled</span>}

          {hasAnyErrors && (
            <div className="itf-error-badge">
              <FaExclamationTriangle size={11} />
              {allValidationErrors.length} missing field(s)
            </div>
          )}
        </div>
        <div className="itf-topbar-right">
          {!isNew && (
            <>
              <button className="itf-btn-outline">View
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button className="itf-btn-outline">Duplicate</button>
              <button className="itf-btn-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button className="itf-btn-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              <button className="itf-btn-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
                </svg>
              </button>
            </>
          )}
          <button className="itf-btn-save" onClick={handleSave} disabled={submitting}>
            {submitting && <FaSpinner className="spinning" />}
            <FaSave size={12} /> Save
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="itf-tab-bar">
        <div className="itf-tabs-container">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const errorCount = getTabErrorCount(tab.id);

            return (
              <button
                key={tab.id}
                type="button"
                className={`itf-tab ${isActive ? 'itf-tab-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <div className="itf-tab-content">
                  <div className={`itf-tab-icon ${isActive ? 'itf-tab-icon-active' : ''}`}>
                    {tab.icon}
                    {errorCount > 0 && !isActive && (
                      <span className="itf-tab-error-badge">{errorCount}</span>
                    )}
                  </div>
                  <span className="itf-tab-label">{tab.name}</span>
                </div>
                {isActive && <div className="itf-tab-indicator" />}
              </button>
            );
          })}
        </div>
        <div className="itf-tab-bar-actions">
          <button className="itf-btn-icon" title="Edit"><FaEdit size={12} /></button>
          <button className="itf-btn-icon" title="Print">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          </button>
          <button className="itf-btn-icon" title="Favourite">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="itf-body">
        <div className="itf-main">
          {renderTab()}
        </div>

        {/* Right sidebar - only for existing items */}
        {!isNew && (
          <aside className="itf-sidebar">
            <div className="itf-doc-avatar">{form.itemName.charAt(0).toUpperCase() || 'I'}</div>
            <div className="itf-doc-name">{form.itemName || itemCode}</div>
            <div className="itf-doc-id">{form.itemCode || itemCode}</div>

            <div className="itf-sidebar-actions">
              <button className="itf-sidebar-action">
                <SidebarIcon label="Assign" />
                Assign
                <span className="itf-sidebar-plus">+</span>
              </button>
              <button className="itf-sidebar-action">
                <SidebarIcon label="Attachments" />
                Attachments
                <span className="itf-sidebar-plus">+</span>
              </button>
              <button className="itf-sidebar-action">
                <SidebarIcon label="Tags" />
                Tags
                <span className="itf-sidebar-plus">+</span>
              </button>
              <button className="itf-sidebar-action">
                <SidebarIcon label="Share" />
                Share
                <span className="itf-sidebar-plus">+</span>
              </button>
            </div>

            <div className="itf-sidebar-meta">
              <div className="itf-meta-row"><span className="itf-meta-label">Last Edited By</span><span className="itf-meta-val">You</span></div>
              <div className="itf-meta-time">Just now</div>
              <div className="itf-meta-row" style={{ marginTop: 12 }}><span className="itf-meta-label">Created By</span><span className="itf-meta-val">You</span></div>
              <div className="itf-meta-time">Just now</div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function SidebarIcon({ label }: { label: string }) {
  const icons: Record<string, React.ReactNode> = {
    Assign: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    Attachments: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
    Tags: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    Share: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  };
  return <>{icons[label]}</>;
}