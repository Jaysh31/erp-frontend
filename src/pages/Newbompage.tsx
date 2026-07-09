import React, { useState, useEffect } from "react";
import {
  Home,
  ChevronDown,
  ChevronRight,
  X,
  Pencil,
  Settings,
  Copy,
  Trash2,
  AlertTriangle,
  Package,
  Wrench,
  XCircle,
  InfoIcon,
  Save,
  Plus,

} from "lucide-react";
import "./Newbompage.css";
import api from '../../src/services/api';

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

interface ValidationError {
  field: string;
  label: string;
  message: string;
  tabId: TabId;
}


interface BOMItemData {
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
  is_corrective_operation: number;
  create_job_card_based_on_batch_size: number;
  quality_inspection_template: string;
  batch_size: number;
  total_operation_time: number;
  description: string;
  _user_tags: string;
  _comments: string | null;
  _assign: string | null;
  _liked_by: string | null;
  creation: string;
  modified: string;
  modified_by: string;
  owner: string;
  docstatus: number;
  idx: number;
}

interface Workstation {
  id: number;
  workstation_name: string;
  workstation_type: string;
  plant_floor: string;
  status: string;          // "Active" / "Inactive" etc — not `disabled`
  is_deleted: number;      // 0 / 1
  production_capacity: number;
  warehouse: string;
  hour_rate: number;
  description: string;
  holiday_list: string;
  total_working_hours: number;
}

interface Warehouse {
  id: number;
  warehouse_name: string;
  warehouse_type: string;
  address?: string;
  disabled: number;
}

interface Item {
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
  valuation_rate: number;
  standard_rate: number;
  creation: string;
  modified: string;
}

// ─── Shared atoms ─────────────────────────────────────────────────────────────

const Label: React.FC<{ text: string; required?: boolean; info?: boolean }> = ({ text, required, info }) => (
  <span className="nbom-label">
    {text}
    {required && <span className="nbom-label__req">*</span>}
    {info    && <span className="nbom-label__info">?</span>}
  </span>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { readOnly?: boolean }> = ({
  readOnly, className = "", ...props
}) => (
  <input
    className={`nbom-input ${readOnly ? "nbom-input--readonly" : ""} ${className}`}
    readOnly={readOnly}
    {...props}
  />
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

const RadioOption: React.FC<{ label: string; hint?: string; name: string; value: string; checked: boolean; onChange: () => void }> = ({
  label, hint, name, value, checked, onChange,
}) => (
  <label className="nbom-check-row" style={{ cursor: "pointer" }}>
    <input type="radio" name={name} value={value} checked={checked} onChange={onChange} />
    <div>
      <div className="nbom-check-row__label">{label}</div>
      {hint && <div className="nbom-check-row__hint">{hint}</div>}
    </div>
  </label>
);

// ─── BOM Configuration Tab ────────────────────────────────────────────────────

interface BOMConfigTabProps {
  defaultSourceWarehouse?: string;
  defaultTargetWarehouse?: string;
  warehouses: Warehouse[];
  onDefaultSourceChange?: (value: string) => void;
  onDefaultTargetChange?: (value: string) => void;
  bomType: "Internal" | "External";
  onBomTypeChange: (value: "Internal" | "External") => void;
}

const BOMConfigTab: React.FC<BOMConfigTabProps> = ({ 
  defaultSourceWarehouse, 
  defaultTargetWarehouse, 
  warehouses,
  onDefaultSourceChange,
  onDefaultTargetChange,
  bomType,
  onBomTypeChange,
}) => {
  const [qiRequired, setQiRequired] = useState(false);

  return (
    <div className="nbom-tab-content">
      <div className="nbom-config-section">
        <div className="nbom-config-section__title">Quality Inspection</div>
        <Checkbox label="Quality Inspection Required" checked={qiRequired} onChange={() => setQiRequired(v => !v)} />
      </div>

      <div className="nbom-config-section">
        <div className="nbom-config-section__title">Default Warehouse</div>
        <div className="nbom-form-grid">
          <div className="nbom-field">
            <Label text="Default Source Warehouse" />
            <select 
              className="nbom-input" 
              value={defaultSourceWarehouse || ''}
              onChange={(e) => onDefaultSourceChange?.(e.target.value)}
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
              onChange={(e) => onDefaultTargetChange?.(e.target.value)}
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

      <div className="nbom-config-section">
        <div className="nbom-config-section__title">BOM Type</div>
        <div style={{ display: "flex", gap: 24 }}>
          <RadioOption
            label="Internal"
            name="bomType"
            value="Internal"
            checked={bomType === "Internal"}
            onChange={() => onBomTypeChange("Internal")}
          />
          <RadioOption
            label="External"
            name="bomType"
            value="External"
            checked={bomType === "External"}
            onChange={() => onBomTypeChange("External")}
          />
        </div>
      </div>
    </div>
  );
};

// ─── Component edit popup ─────────────────────────────────────────────────────

interface ComponentPopupProps {
  row: ComponentRow; rowIndex: number;
  onClose: () => void; onSave: (u: ComponentRow) => void;
}

const ComponentPopup: React.FC<ComponentPopupProps> = ({ row, rowIndex, onClose, onSave }) => {
  const [form, setForm] = useState<ComponentRow>({ ...row });
  const [showSuggest, setShowSuggest] = useState(false);
  const [doNotExplode, setDoNotExplode] = useState(false);
  const [allowAlt, setAllowAlt] = useState(false);
  const [isStock, setIsStock] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);
  const [includeInMfg, setIncludeInMfg] = useState(false);
  const [sourcedBySupplier, setSourcedBySupplier] = useState(false);
  const [isSubAssembly, setIsSubAssembly] = useState(false);
  const [isPhantom, setIsPhantom] = useState(false);
  const set = (k: keyof ComponentRow) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="nbom-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="nbom-popup">
        <div className="nbom-popup__head">
          <span className="nbom-popup__title">Editing Row #{rowIndex + 1}</span>
          <div className="nbom-popup__actions">
            <button className="nbom-popup-btn nbom-popup-btn--danger"><Trash2 size={13} /> Delete</button>
            <button className="nbom-popup-btn">Insert Below</button>
            <button className="nbom-popup-btn">Insert Above</button>
            <button className="nbom-popup-btn"><Copy size={12} /> Duplicate</button>
            <button className="nbom-popup-btn nbom-popup-btn--move">Move <ChevronDown size={13} /></button>
            <button className="nbom-popup__close" onClick={onClose}><X size={16} /></button>
          </div>
        </div>
        <div className="nbom-popup__body">
          <div className="nbom-popup-grid">
            <div className="nbom-field">
              <Label text="Item Code" required />
              <div className="nbom-autocomplete-wrap">
                <Input value={form.itemCode}
                  onChange={e => { setForm(f => ({ ...f, itemCode: e.target.value })); setShowSuggest(true); }}
                  onFocus={() => setShowSuggest(true)}
                  onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                  placeholder="Search item..." />
                {showSuggest && (
                  <div className="nbom-autocomplete-list">
                    <div className="nbom-autocomplete-item">
                      <div className="nbom-autocomplete-item__code">No suggestions</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 22 }}>
              <Checkbox label="Do Not Explode" checked={doNotExplode} onChange={() => setDoNotExplode(v => !v)} />
            </div>
            <div className="nbom-field"><Label text="BOM No" /><Input readOnly value="" /></div>
            <div className="nbom-field"><Label text="Source Warehouse" /><Input readOnly value="" /></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
              <Checkbox label="Allow Alternative Item" checked={allowAlt} onChange={() => setAllowAlt(v => !v)} />
              <Checkbox label="Is Stock Item" checked={isStock} onChange={() => setIsStock(v => !v)} />
            </div>
          </div>
          <div className="nbom-popup-grid">
            <div className="nbom-field"><Label text="Qty" required /><Input value={form.qty} onChange={set("qty")} type="number" /></div>
            <div className="nbom-field"><Label text="Stock UOM" /><Input readOnly value="Nos" /></div>
            <div className="nbom-field"><Label text="UOM" required /><Input value={form.uom} onChange={set("uom")} /></div>
            <div className="nbom-field"><Label text="Conversion Factor" /><Input readOnly value="" /></div>
          </div>
          <div className="nbom-popup-section">
            <div className="nbom-popup-section__title">Rate &amp; Amount</div>
            <div className="nbom-popup-grid">
              <div className="nbom-field"><Label text="Rate" required /><Input value={form.rate} onChange={set("rate")} type="number" /></div>
            </div>
          </div>
          <div className="nbom-popup-grid">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Checkbox label="Has Variants" checked={hasVariants} onChange={() => setHasVariants(v => !v)} />
              <Checkbox label="Include Item In Manufacturing" checked={includeInMfg} onChange={() => setIncludeInMfg(v => !v)} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Checkbox label="Sourced by Supplier" checked={sourcedBySupplier} onChange={() => setSourcedBySupplier(v => !v)} />
              <Checkbox label="Is Sub Assembly Item" checked={isSubAssembly} onChange={() => setIsSubAssembly(v => !v)} />
              <Checkbox label="Is Phantom Item" checked={isPhantom} onChange={() => setIsPhantom(v => !v)} />
            </div>
          </div>
        </div>
        <div className="nbom-popup__foot">
          <div className="nbom-shortcuts">
            <span>Shortcuts:</span>
            <kbd className="nbom-kbd">Ctrl + Up</kbd><span>·</span>
            <kbd className="nbom-kbd">Ctrl + Down</kbd><span>·</span>
            <kbd className="nbom-kbd">ESC</kbd>
          </div>
          <button className="nbom-popup-btn nbom-popup-btn--primary" onClick={() => { onSave(form); onClose(); }}>
            Insert Below
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Validation Modal ─────────────────────────────────────────────────────────

interface ValidationModalProps {
  errors: ValidationError[];
  onClose: () => void;
  onJump: (tabId: TabId) => void;
  tabs: { id: TabId; label: string }[];
}

const ValidationModal: React.FC<ValidationModalProps> = ({ errors, onClose, onJump, tabs }) => (
  <div className="nbom-modal-overlay" onClick={onClose}>
    <div className="nbom-validation-modal" onClick={e => e.stopPropagation()}>
      <div className="nbom-modal-header">
        <h2 className="nbom-modal-title">
          <AlertTriangle size={16} />
          Missing Required Fields
        </h2>
        <button className="nbom-modal-close" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="nbom-modal-body">
        <p className="nbom-modal-intro">
          Please fill in the following required fields before saving:
        </p>
        <div className="nbom-error-list">
          {errors.map((err, i) => {
            const tabLabel = tabs.find(t => t.id === err.tabId)?.label ?? err.tabId;
            return (
              <div key={i} className="nbom-validation-error-item" onClick={() => onJump(err.tabId)}>
                <div className="nbom-error-header">
                  <XCircle size={14} className="nbom-error-icon" />
                  <strong className="nbom-error-label">{err.label}</strong>
                  <span className="nbom-error-tab">{tabLabel}</span>
                </div>
                <div className="nbom-error-message">{err.message}</div>
              </div>
            );
          })}
        </div>
        <div className="nbom-hint-banner">
          <InfoIcon size={13} className="nbom-hint-icon" />
          Click on any error to jump to that section
        </div>
      </div>
      <div className="nbom-modal-footer">
        <button className="nbom-btn-cancel" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

// ─── Tab definitions ──────────────────────────────────────────────────────────

type TabId = "production" | "config";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "production", label: "Production Item", icon: <Package size={14} /> },
  { id: "config", label: "BOM Configuration", icon: <Wrench size={14} /> },
];

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
  const [activeTab, setActiveTab] = useState<TabId>("production");
  const [costAllocPanelOpen, setCostAllocPanelOpen] = useState(true);
  const [opsPanelOpen, setOpsPanelOpen] = useState(true);
  const [withOperations, setWithOperations] = useState(false);
  const [itemToManufacture, setItemToManufacture] = useState("");
  const [, setBomNo] = useState("");
  const [bomId, setBomId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [defaultSourceWarehouse, setDefaultSourceWarehouse] = useState("");
  const [defaultTargetWarehouse, setDefaultTargetWarehouse] = useState("");
  const [bomType, setBomType] = useState<"Internal" | "External">("Internal");

  const [compRows, setCompRows] = useState<ComponentRow[]>([
    { id: 1, itemCode: "", itemName: "", qty: "", uom: "", rate: "0", amount: "₹ 0.00", itemGroup: "", valuationRate: 0, standardRate: 0, isNew: true },
  ]);
  const [editingComp, setEditingComp] = useState<{ row: ComponentRow; idx: number } | null>(null);

  const [opRows, setOpRows] = useState<OperationRow[]>([
    {
      id: 1,
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

  const [showValidation, setShowValidation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // ─── Fetch Items ──────────────────────────────────────────────────────────
  const [items, setItems] = useState<Item[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  // ─── Fetch Operations ──────────────────────────────────────────────────────
  const [operations, setOperations] = useState<Operation[]>([]);
  const [operationsLoading, setOperationsLoading] = useState(false);

  // ─── Fetch Workstations ──────────────────────────────────────────────────────
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [workstationsLoading, setWorkstationsLoading] = useState(false);

  // ─── Fetch Warehouses ──────────────────────────────────────────────────────
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [, setWarehousesLoading] = useState(false);

  // ─── Load edit data ──────────────────────────────────────────────────────

  useEffect(() => {
    if (editData) {
      const { bom, items, operations } = editData;
      
      // Set BOM data
      setItemToManufacture(bom.item);
      setBomNo(bom.id);
      setBomId(bom.id);
      
      // Set default warehouses
      setDefaultSourceWarehouse(bom.default_source_warehouse || "");
      setDefaultTargetWarehouse(bom.default_target_warehouse || "");

      // Set BOM type
      setBomType(bom.type === "External" ? "External" : "Internal");
      
      // Populate components
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
      
      // Populate operations
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

  // ─── Fetch data ──────────────────────────────────────────────────────────

  useEffect(() => {
    fetchItems();
    fetchOperations();
    fetchWorkstations();
    fetchWarehouses();
  }, []);

  const fetchItems = async () => {
    try {
      setItemsLoading(true);
      const response = await api.get('/item');
      if (response.data.success === 1) {
        setItems(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching items:', err);
      setApiError(err.response?.data?.message || 'Failed to fetch items');
    } finally {
      setItemsLoading(false);
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
      setApiError(err.response?.data?.message || 'Failed to fetch operations');
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
        // was: w.disabled === 0  → always false, wiped everything
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
      setWarehousesLoading(true);
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
    } finally {
      setWarehousesLoading(false);
    }
  };

  // ─── Delete Functions ──────────────────────────────────────────────────────

  const handleDeleteOperation = async (row: OperationRow, ) => {
    // If it's a new row (not saved to DB), just remove it from local state
    if (row.isNew) {
      deleteOpRow(row.id);
      return;
    }

    // If it's an existing row, delete from API
    if (row.operationId) {
      if (window.confirm(`Are you sure you want to delete operation "${row.operation}"?`)) {
        try {
          const response = await api.delete(`/bom-operation/${row.operationId}`);
          if (response.data.success === 1) {
            deleteOpRow(row.id);
            alert('Operation deleted successfully');
          } else {
            setApiError('Failed to delete operation');
          }
        } catch (err: any) {
          console.error('Error deleting operation:', err);
          setApiError(err.response?.data?.message || 'Failed to delete operation');
        }
      }
    } else {
      // Fallback: just remove from local state
      deleteOpRow(row.id);
    }
  };

  const handleDeleteComponent = async (row: ComponentRow, ) => {
    // If it's a new row (not saved to DB), just remove it from local state
    if (row.isNew) {
      deleteCompRow(row.id);
      return;
    }

    // If it's an existing row, delete from API
    if (row.id) {
      if (window.confirm(`Are you sure you want to delete component "${row.itemCode}"?`)) {
        try {
          const response = await api.delete(`/bom-item/${row.id}`);
          if (response.data.success === 1) {
            deleteCompRow(row.id);
            alert('Component deleted successfully');
          } else {
            setApiError('Failed to delete component');
          }
        } catch (err: any) {
          console.error('Error deleting component:', err);
          setApiError(err.response?.data?.message || 'Failed to delete component');
        }
      }
    } else {
      // Fallback: just remove from local state
      deleteCompRow(row.id);
    }
  };

  // ─── Row Operations ──────────────────────────────────────────────────────

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

  const deleteCompRow = (id: number) => {
    if (compRows.length <= 1) {
      setApiError("Cannot delete the last row");
      setTimeout(() => setApiError(null), 3000);
      return;
    }
    setCompRows(r => r.filter(row => row.id !== id));
  };

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

  const deleteOpRow = (id: number) => {
    if (opRows.length <= 1) {
      setApiError("Cannot delete the last row");
      setTimeout(() => setApiError(null), 3000);
      return;
    }
    setOpRows(r => r.filter(row => row.id !== id));
  };

  // ─── When operation is selected, auto-fill workstation, hour rate & time
  //     directly from the /api/operation response ──────────────────────────

  const handleOperationSelect = (idx: number, operationName: string) => {
    const selectedOp = operations.find(op => op.name === operationName);
    if (selectedOp) {
      const workstationDetails = workstations.find(w => w.id === selectedOp.workstationId);
  
      // Prefer the canonical list (workstations) so the value always matches
      // an <option> in the dropdown. Fall back to the denormalized name only
      // if the workstation truly isn't in the loaded list (e.g. disabled).
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
          isNew: r.isNew,
        } : r
      ));
    }
  };
  // ─── When workstation is manually selected ──────────────────────────────

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
          isNew: r.isNew,
        } : r
      ));
    }
  };

  // ─── When time changes, recalculate operating cost ──────────────────────

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

  // ─── When hour rate changes, recalculate operating cost ────────────────

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

  // ─── Calculate total BOM cost ────────────────────────────────────────────

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

  // ─── Validation ──────────────────────────────────────────────────────────

  const getAllErrors = (): ValidationError[] => {
    const errs: ValidationError[] = [];

    if (!itemToManufacture.trim())
      errs.push({ field: "itemToManufacture", label: "Item to Manufacture", message: "Item to Manufacture is required", tabId: "production" });

    const filledComps = compRows.filter(r => r.itemCode.trim());
    if (filledComps.length === 0)
      errs.push({ field: "components", label: "Components", message: "At least one component with an Item Code is required", tabId: "production" });

    compRows.forEach((r, i) => {
      if (r.itemCode && !r.uom.trim())
        errs.push({ field: `comp_uom_${i}`, label: `Component ${i + 1} UOM`, message: `UOM is required for component "${r.itemCode}"`, tabId: "production" });
      if (r.itemCode && (!r.qty || parseFloat(r.qty) <= 0))
        errs.push({ field: `comp_qty_${i}`, label: `Component ${i + 1} Qty`, message: `Valid quantity is required for component "${r.itemCode}"`, tabId: "production" });
    });

    if (withOperations) {
      opRows.forEach((r, i) => {
        if (!r.operation.trim())
          errs.push({ field: `op_${i}`, label: `Operation ${i + 1}`, message: `Operation name is required for row ${i + 1}`, tabId: "production" });
        if (!r.workstation.trim())
          errs.push({ field: `op_workstation_${i}`, label: `Operation ${i + 1} Workstation`, message: `Workstation is required for operation "${r.operation || i + 1}"`, tabId: "production" });
        if (!r.timeInMins || parseFloat(r.timeInMins) <= 0)
          errs.push({ field: `op_time_${i}`, label: `Operation ${i + 1} Time`, message: `Valid time is required for operation "${r.operation || i + 1}"`, tabId: "production" });
      });
    }

    return errs;
  };

  const getTabErrorCount = (tabId: TabId) => getAllErrors().filter(e => e.tabId === tabId).length;
  const hasAnyErrors = getAllErrors().length > 0;

  // ─── Save handler ─────────────────────────────────────────────────────────

  const handleSave = async () => {
    const errs = getAllErrors();
    if (errs.length > 0) {
      setValidationErrors(errs);
      setShowValidation(true);
      return;
    }

    setSaving(true);
    setApiError(null);

    try {
      const selectedItem = items.find(i => i.item_code === itemToManufacture);
      
      // Calculate all costs
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
        item: itemToManufacture,
        item_name: selectedItem?.item_name || "",
        company: "SculptorTech",
        quantity: 1,
        uom: selectedItem?.stock_uom || "Nos",
        is_active: 1,
        is_default: 1,
        type: bomType,
        description: `${itemToManufacture} BOM`,
        // owner: "Administrator",
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

      // 2) Create BOM Items (Components) - Only for new items
      const validComponents = compRows.filter(r => r.itemCode.trim() && r.isNew);

      for (const comp of validComponents) {
        const compItem = items.find(i => i.item_code === comp.itemCode);
        const qty = parseFloat(comp.qty) || 0;
        const rate = parseFloat(comp.rate) || compItem?.standard_rate || compItem?.valuation_rate || 0;
        const amount = qty * rate;
        
        const itemPayload: BOMItemData = {
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
        
        await api.post('/bom-item', itemPayload);
      }

      // 3) Create BOM Operations if enabled - Only for new operations
      if (withOperations) {
        const validOps = opRows.filter(r => r.operation.trim() && r.isNew);
        for (const op of validOps) {
          const hourRate = parseFloat(op.hourRate) || 0;
          const timeInMins = parseFloat(op.timeInMins) || 0;
          const operatingCost = (hourRate * timeInMins) / 60;
          
          const opPayload: BOMOperationData = {
            operation: op.operation,
            sequence_id: parseInt(op.sequenceId) || 0,
            bom_no: parentRef,
            finished_good: itemToManufacture,
            finished_good_qty: 1,
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
          await api.post('/bom-operation', opPayload);
        }
      }

      const totalCostFormatted = totalCost.toFixed(2);

      alert(`✅ BOM ${editData ? 'updated' : 'created'} successfully!\nBOM ID: ${parentRef}\nTotal Cost: ₹${totalCostFormatted}`);
      
      if (onBack) onBack();
      
    } catch (err: any) {
      console.error('Error saving BOM:', err);
      if (err.response) {
        setApiError(err.response.data?.message || `Server error: ${err.response.status}`);
      } else if (err.request) {
        setApiError('Network error. Please check your connection.');
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleJump = (tabId: TabId) => {
    setActiveTab(tabId);
    setShowValidation(false);
  };

  const activeIndex = TABS.findIndex(t => t.id === activeTab);

  const handleNext = () => { const n = TABS[activeIndex + 1]; if (n) setActiveTab(n.id); };
  const handlePrev = () => { const p = TABS[activeIndex - 1]; if (p) setActiveTab(p.id); };

  const getTabWarning = (tabId: TabId) => getTabErrorCount(tabId) > 0;

  return (
    <div className="nbom-page">

      {/* ── Validation Modal ───────────────────────────────────── */}
      {showValidation && (
        <ValidationModal
          errors={validationErrors}
          onClose={() => setShowValidation(false)}
          onJump={handleJump}
          tabs={TABS}
        />
      )}

      {/* ── Topbar ────────────────────────────────────────────── */}
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
            <div className="nbom-error-pill" style={{ background: '#fef2f2', color: '#dc2626', borderColor: '#fca5a5' }}>
              <AlertTriangle size={11} />
              {apiError}
            </div>
          )}
          {hasAnyErrors && (
            <div className="nbom-error-pill">
              <AlertTriangle size={11} />
              {getAllErrors().length} missing field{getAllErrors().length > 1 ? "s" : ""}
            </div>
          )}
          <span className="nbom-badge--unsaved">Not Saved</span>
          <button className="nbom-btn-save" onClick={handleSave} disabled={saving}>
            <Save size={13} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* ── Stepper Tabs ───────────────────────────────────────── */}
      <div className="nbom-stepper-wrap">
        <div className="nbom-stepper-row">
          {TABS.map((tab, idx) => {
            const isActive = activeTab === tab.id;
            const hasWarn = getTabWarning(tab.id);
            const errCount = getTabErrorCount(tab.id);

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`nbom-step-btn ${isActive ? "nbom-step-btn--active" : ""}`}
              >
                <div className={`nbom-step-circle
                  ${isActive ? "nbom-step-circle--active" : ""}
                  ${hasWarn && !isActive ? "nbom-step-circle--warning" : ""}
                `}>
                  {hasWarn && !isActive
                    ? <AlertTriangle size={14} />
                    : isActive
                      ? tab.icon
                      : idx + 1
                  }
                  {errCount > 0 && !isActive && (
                    <div className="nbom-step-error-badge">{errCount}</div>
                  )}
                </div>
                <div className="nbom-step-label-wrap">
                  <div className={`nbom-step-step
                    ${isActive ? "nbom-step-step--active" : ""}
                    ${hasWarn && !isActive ? "nbom-step-step--warning" : ""}
                  `}>Step {idx + 1}</div>
                  <div className={`nbom-step-name ${isActive ? "nbom-step-name--active" : ""}`}>
                    {tab.label}
                  </div>
                </div>
                {isActive && <div className="nbom-step-underline" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Warning banner ─────────────────────────────────────── */}
      {getTabWarning(activeTab) && (
        <div className="nbom-tab-warning-banner">
          <AlertTriangle size={12} />
          <span>This tab has incomplete or missing information. Please review before saving.</span>
        </div>
      )}

      {/* ── Body ───────────────────────────────────────────────── */}
      <div className="nbom-body" key={activeTab}>

        {activeTab === "config" && (
          <BOMConfigTab 
            defaultSourceWarehouse={defaultSourceWarehouse}
            defaultTargetWarehouse={defaultTargetWarehouse}
            warehouses={warehouses}
            onDefaultSourceChange={setDefaultSourceWarehouse}
            onDefaultTargetChange={setDefaultTargetWarehouse}
            bomType={bomType}
            onBomTypeChange={setBomType}
          />
        )}

        {activeTab === "production" && (
          <>
            {/* Item to Manufacture */}
            <div className="nbom-card">
              <div className="nbom-card__body">
                <div className="nbom-field">
                  <Label text="Item to Manufacture" required info />
                  <select
                    className="nbom-input"
                    value={itemToManufacture}
                    onChange={e => setItemToManufacture(e.target.value)}
                    disabled={itemsLoading}
                  >
                    <option value="">{itemsLoading ? 'Loading items...' : 'Select an item...'}</option>
                    {items.map(item => (
                      <option key={item.id} value={item.item_code}>
                        {item.item_code} - {item.item_name} ({item.item_group})
                      </option>
                    ))}
                  </select>
                  {!itemToManufacture.trim() && (
                    <span className="nbom-error-text">Item to Manufacture is required</span>
                  )}
                </div>
              </div>
            </div>

            {/* Cost Allocation */}
            <div className="nbom-card">
              <div className="nbom-card__header" onClick={() => setCostAllocPanelOpen(o => !o)}>
                <span className="nbom-card__title"><span className="nbom-card__title-dot" />Cost Allocation</span>
                <ChevronDown size={15} className={`nbom-card__chev ${costAllocPanelOpen ? "nbom-card__chev--open" : ""}`} />
              </div>
              {costAllocPanelOpen && (
                <div className="nbom-card__body">
                  <div className="nbom-form-grid">
                    <div className="nbom-field"><Label text="% Cost Allocation" /><Input defaultValue="100.000" /></div>
                  </div>
                </div>
              )}
            </div>

            {/* Operations */}
            <div className="nbom-card">
              <div className="nbom-card__header" onClick={() => setOpsPanelOpen(o => !o)}>
                <span className="nbom-card__title"><span className="nbom-card__title-dot" />Operations</span>
                <ChevronDown size={15} className={`nbom-card__chev ${opsPanelOpen ? "nbom-card__chev--open" : ""}`} />
              </div>
              {opsPanelOpen && (
                <div className="nbom-card__body">
                  <Checkbox
                    label="With Operations"
                    hint="Manage cost of operations"
                    checked={withOperations}
                    onChange={() => setWithOperations(v => !v)}
                  />

                  {withOperations && (
                    <div style={{ marginTop: 16 }}>
                      <div className="nbom-table-wrap">
                        <table className="nbom-table">
                          <thead>
                            <tr>
                              <th className="nbom-table-cb"><input type="checkbox" /></th>
                              <th className="nbom-table-no">No.</th>
                              <th>Operation <span style={{ color: "var(--c-danger)" }}>*</span></th>
                              <th>Seq ID</th>
                              <th>Workstation <span style={{ color: "var(--c-danger)" }}>*</span></th>
                              <th>WS Type</th>
                              <th>Time (mins) <span style={{ color: "var(--c-danger)" }}>*</span></th>
                              <th>Hour Rate (₹)</th>
                              <th>Operating Cost</th>
                              <th>QI Req</th>
                              <th><Settings size={13} style={{ color: "var(--c-text-muted)" }} /></th>
                            </tr>
                          </thead>
                          <tbody>
                            {opRows.map((row, idx) => (
                              <tr key={row.id}>
                                <td className="nbom-table-cb"><input type="checkbox" /></td>
                                <td className="nbom-table-no">{idx + 1}</td>
                                <td>
                                <select
  className="nbom-table-select"
  value={row.operation}
  onChange={e => handleOperationSelect(idx, e.target.value)}
  disabled={operationsLoading || workstationsLoading}
>
                                    <option value="">{operationsLoading ? 'Loading operations...' : 'Select operation...'}</option>
                                    {operations.map(op => (
                                      <option key={op.id} value={op.name}>
                                        {op.name} {op.workstation_name ? `- ${op.workstation_name}` : ''} {op.hour_rate ? `(₹${op.hour_rate}/hr)` : ''}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td>
                                  <input
                                    className="nbom-table-input"
                                    value={row.sequenceId}
                                    onChange={e => setOpRows(rs => rs.map((r, i) => i === idx ? { ...r, sequenceId: e.target.value } : r))}
                                    placeholder="Seq"
                                    style={{ width: 60 }}
                                  />
                                </td>
                                <td>
                                  <select
                                    className="nbom-table-select"
                                    value={row.workstation}
                                    onChange={e => handleWorkstationSelect(idx, e.target.value)}
                                    disabled={workstationsLoading}
                                  >
                                    <option value="">{workstationsLoading ? 'Loading workstations...' : 'Select workstation...'}</option>
                                    {workstations.map(w => (
                                      <option key={w.id} value={w.workstation_name}>
                                        {w.workstation_name} {w.workstation_type ? `(${w.workstation_type})` : ''} - ₹{w.hour_rate}/hr
                                      </option>
                                    ))}
                                  </select>
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
                                  <input
                                    className="nbom-table-input"
                                    value={row.timeInMins}
                                    onChange={e => handleTimeChange(idx, e.target.value)}
                                    placeholder="0"
                                    type="number"
                                    style={{ width: 70, textAlign: "right" }}
                                  />
                                </td>
                                <td>
                                  <input
                                    className="nbom-table-input"
                                    value={row.hourRate}
                                    onChange={e => handleHourRateChange(idx, e.target.value)}
                                    placeholder="0"
                                    type="number"
                                    style={{ width: 80, textAlign: "right" }}
                                    step="0.01"
                                  />
                                </td>
                                <td>
                                  <input
                                    className="nbom-table-input"
                                    value={row.operatingCost}
                                    readOnly
                                    style={{ width: 80, textAlign: "right", background: "var(--c-bg-muted)" }}
                                  />
                                </td>
                                <td style={{ textAlign: "center" }}>
                                  <input
                                    type="checkbox"
                                    checked={row.qualityInspectionRequired}
                                    onChange={e => setOpRows(rs => rs.map((r, i) => i === idx ? { ...r, qualityInspectionRequired: e.target.checked } : r))}
                                  />
                                </td>
                                <td style={{ textAlign: "center" }}>
                                  <button
                                    className="nbom-edit-btn nbom-edit-btn--delete"
                                    onClick={() => handleDeleteOperation(row, )}
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

            {/* Components */}
            <div className="nbom-card">
              <div className="nbom-card__body">
                <div className="nbom-card__title" style={{ marginBottom: 14 }}>
                  <span className="nbom-card__title-dot" />Components
                </div>
                <div className="nbom-table-wrap">
                  <table className="nbom-table">
                    <thead>
                      <tr>
                        <th className="nbom-table-cb"><input type="checkbox" /></th>
                        <th className="nbom-table-no">No.</th>
                        <th>Item Code <span style={{ color: "var(--c-danger)" }}>*</span></th>
                        <th>Item Name</th>
                        <th>Item Group</th>
                        <th>Qty <span style={{ color: "var(--c-danger)" }}>*</span></th>
                        <th>UOM <span style={{ color: "var(--c-danger)" }}>*</span></th>
                        <th>Rate</th>
                        <th>Amount</th>
                        <th><Settings size={13} style={{ color: "var(--c-text-muted)" }} /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {compRows.map((row, idx) => (
                        <tr key={row.id}>
                          <td className="nbom-table-cb"><input type="checkbox" /></td>
                          <td className="nbom-table-no">{idx + 1}</td>
                          <td>
                            <select
                              className="nbom-table-select"
                              value={row.itemCode}
                              onChange={e => {
                                const selectedItem = items.find(i => i.item_code === e.target.value);
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
                            >
                              <option value="">Select item...</option>
                              {items.map(item => (
                                <option key={item.id} value={item.item_code}>
                                  {item.item_code} - {item.item_name}
                                  {item.standard_rate ? ` (₹${item.standard_rate})` : ''}
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
                              style={{ background: "var(--c-bg-muted)", width: 100 }}
                            />
                          </td>
                          <td>
                            <input
                              className="nbom-table-input"
                              value={row.qty}
                              onChange={e => {
                                const qty = parseFloat(e.target.value) || 0;
                                const rate = parseFloat(row.rate) || 0;
                                setCompRows(rs => rs.map((r, i) => i === idx ? { 
                                  ...r, 
                                  qty: e.target.value,
                                  amount: `₹ ${(rate * qty).toFixed(2)}`
                                } : r));
                              }}
                              style={{ textAlign: "right", width: 80 }}
                              type="number"
                              step="0.001"
                            />
                          </td>
                          <td>
                            <input
                              className="nbom-table-input"
                              value={row.uom}
                              onChange={e => setCompRows(rs => rs.map((r, i) => i === idx ? { ...r, uom: e.target.value } : r))}
                              style={{ width: 80 }}
                            />
                          </td>
                          <td>
                            <input
                              className="nbom-table-input"
                              value={row.rate}
                              onChange={e => {
                                const rate = parseFloat(e.target.value) || 0;
                                const qty = parseFloat(row.qty) || 0;
                                setCompRows(rs => rs.map((r, i) => i === idx ? { 
                                  ...r, 
                                  rate: e.target.value,
                                  amount: `₹ ${(rate * qty).toFixed(2)}`
                                } : r));
                              }}
                              style={{ width: 80, textAlign: "right" }}
                              type="number"
                              step="0.01"
                            />
                          </td>
                          <td className="nbom-table-val">{row.amount}</td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              className="nbom-edit-btn"
                              onClick={() => setEditingComp({ row, idx })}
                              title="Edit row"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              className="nbom-edit-btn nbom-edit-btn--delete"
                              onClick={() => handleDeleteComponent(row, )}
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

            {/* Cost Summary */}
            <div className="nbom-card">
              <div className="nbom-card__body">
                <div className="nbom-card__title" style={{ marginBottom: 14 }}>
                  <span className="nbom-card__title-dot" style={{ background: "var(--c-primary)" }} />Cost Summary
                </div>
                <div className="nbom-cost-summary">
                  <div className="nbom-cost-item">
                    <span>Raw Material Cost:</span>
                    <strong>₹{calculateTotalCost().totalComponentCost}</strong>
                  </div>
                  <div className="nbom-cost-item">
                    <span>Operation Cost:</span>
                    <strong>₹{calculateTotalCost().totalOperationCost}</strong>
                  </div>
                  <div className="nbom-cost-item nbom-cost-total">
                    <span>Total BOM Cost:</span>
                    <strong>₹{calculateTotalCost().totalCost}</strong>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className="nbom-footer-row">
        {activeIndex > 0 && (
          <button type="button" className="nbom-footer-btn nbom-footer-btn--secondary" onClick={handlePrev}>
            ← Previous
          </button>
        )}
        {activeIndex < TABS.length - 1 && (
          <button type="button" className="nbom-footer-btn nbom-footer-btn--primary" onClick={handleNext}>
            Next →
          </button>
        )}
        {activeIndex === TABS.length - 1 && (
          <button type="button" className="nbom-footer-btn nbom-footer-btn--primary nbom-footer-btn--submit" onClick={handleSave} disabled={saving}>
            <Save size={14} /> {saving ? 'Saving...' : (editData ? 'Update BOM' : 'Save BOM')}
          </button>
        )}
      </div>

      {/* ── Row edit popups ────────────────────────────────────── */}
      {editingComp && (
        <ComponentPopup row={editingComp.row} rowIndex={editingComp.idx}
          onClose={() => setEditingComp(null)}
          onSave={updated => setCompRows(rs => rs.map((r, i) => i === editingComp.idx ? updated : r))} />
      )}
    </div>
  );
};

export default NewBOMPage;