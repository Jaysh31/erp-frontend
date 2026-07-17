// import React, { useState, useEffect, useCallback } from "react";
// import {
//   Home,
//   ChevronDown,
//   ChevronRight,
//   X,
//   Trash2,
//   AlertTriangle,
//   Package,
//   Wrench,
//   XCircle,
//   InfoIcon,
//   Save,
//   Plus,
//   CheckCircle,
//   Box,
//   Clock,
//   TrendingUp,
//   GripVertical,
// } from "lucide-react";
// import "./Newbompage.css";
// import api from '../../src/services/api';

// // ─── Types ────────────────────────────────────────────────────────────────────

// interface ComponentRow {
//   id: number;
//   itemCode: string;
//   itemName: string;
//   qty: string;
//   uom: string;
//   rate: string;
//   amount: string;
//   stockUom?: string;
//   conversionFactor?: string;
//   itemGroup?: string;
//   valuationRate?: number;
//   standardRate?: number;
//   isNew?: boolean;
// }

// interface OperationRow {
//   id: number;
//   operation: string;
//   operationId?: number;
//   sequenceId: string;
//   workstation: string;
//   workstationId?: number;
//   workstationType: string;
//   timeInMins: string;
//   hourRate: string;
//   operatingCost: string;
//   qualityInspectionRequired: boolean;
//   isNew?: boolean;
// }

// interface ValidationError {
//   field: string;
//   label: string;
//   message: string;
//   tabId: TabId;
// }

// interface Toast {
//   id: string;
//   type: 'success' | 'error' | 'info';
//   title: string;
//   message: string;
// }

// interface DeleteModal {
//   isOpen: boolean;
//   type: 'component' | 'operation';
//   rowId: number;
//   name: string;
//   dbRowId?: number;
// }

// interface BOMItemData {
//   item_code: string;
//   item_name: string;
//   bom_no: string | number;
//   qty: number;
//   uom: string;
//   stock_qty: number;
//   stock_uom: string;
//   conversion_factor: number;
//   rate: number;
//   amount: number;
//   parent: string | number;
//   parentfield: string;
//   parenttype: string;
//   owner: string;
//   modified_by: string;
// }

// interface BOMOperationData {
//   operation: string;
//   sequence_id: number;
//   bom_no: string | number;
//   finished_good: string;
//   finished_good_qty: number;
//   workstation: string;
//   workstation_type: string;
//   time_in_mins: number;
//   hour_rate: number;
//   operating_cost: number;
//   quality_inspection_required: number;
//   parent: string | number;
//   parentfield: string;
//   parenttype: string;
//   owner: string;
//   modified_by: string;
// }

// interface Operation {
//   id: number;
//   name: string;
//   workstation?: string;
//   workstation_name?: string;
//   workstationId?: number;
//   hour_rate?: number;
//   total_operation_time: number;
//   description: string;
// }

// interface Workstation {
//   id: number;
//   workstation_name: string;
//   workstation_type: string;
//   status: string;
//   is_deleted: number;
//   hour_rate: number;
// }

// interface Warehouse {
//   id: number;
//   warehouse_name: string;
//   warehouse_type: string;
//   disabled: number;
// }

// interface Item {
//   id: number;
//   item_code: string;
//   item_name: string;
//   item_group: string;
//   stock_uom: string;
//   valuation_rate: number;
//   standard_rate: number;
// }

// // ─── Shared atoms ─────────────────────────────────────────────────────────────

// const Label: React.FC<{ text: string; required?: boolean; info?: boolean }> = ({ text, required, info }) => (
//   <span className="nbom-label">
//     {text}
//     {required && <span className="nbom-label__req">*</span>}
//     {info && <span className="nbom-label__info">?</span>}
//   </span>
// );

// const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { readOnly?: boolean; hasError?: boolean }> = ({
//   readOnly, hasError, className = "", ...props
// }) => (
//   <input
//     className={`nbom-input ${readOnly ? "nbom-input--readonly" : ""} ${hasError ? "nbom-input--error" : ""} ${className}`}
//     readOnly={readOnly}
//     {...props}
//   />
// );

// const Checkbox: React.FC<{ label: string; hint?: string; checked?: boolean; onChange?: () => void }> = ({
//   label, hint, checked = false, onChange,
// }) => (
//   <div className="nbom-check-row">
//     <input type="checkbox" checked={checked} onChange={onChange ?? (() => {})} />
//     <div>
//       <div className="nbom-check-row__label">{label}</div>
//       {hint && <div className="nbom-check-row__hint">{hint}</div>}
//     </div>
//   </div>
// );

// const RadioOption: React.FC<{ label: string; hint?: string; name: string; value: string; checked: boolean; onChange: () => void }> = ({
//   label, hint, name, value, checked, onChange,
// }) => (
//   <label className="nbom-radio-option" style={{ cursor: "pointer" }}>
//     <input type="radio" name={name} value={value} checked={checked} onChange={onChange} />
//     <div>
//       <div className="nbom-radio-option__label">{label}</div>
//       {hint && <div className="nbom-radio-option__hint">{hint}</div>}
//     </div>
//   </label>
// );

// // ─── Toast Component ─────────────────────────────────────────────────────────

// const ToastContainer: React.FC<{ toasts: Toast[]; removeToast: (id: string) => void }> = ({ toasts, removeToast }) => (
//   <div className="nbom-toast-container">
//     {toasts.map(toast => (
//       <div key={toast.id} className={`nbom-toast nbom-toast--${toast.type}`}>
//         <div className="nbom-toast-icon">
//           {toast.type === 'success' && <CheckCircle size={16} />}
//           {toast.type === 'error' && <AlertTriangle size={16} />}
//           {toast.type === 'info' && <InfoIcon size={16} />}
//         </div>
//         <div className="nbom-toast-content">
//           <p className="nbom-toast-title">{toast.title}</p>
//           <p className="nbom-toast-message">{toast.message}</p>
//         </div>
//         <button className="nbom-toast-close" onClick={() => removeToast(toast.id)}>
//           <X size={14} />
//         </button>
//       </div>
//     ))}
//   </div>
// );

// // ─── Delete Confirmation Modal ──────────────────────────────────────────────

// const DeleteConfirmModal: React.FC<{
//   isOpen: boolean;
//   type: string;
//   name: string;
//   onConfirm: () => void;
//   onCancel: () => void;
//   deleting: boolean;
// }> = ({ isOpen, type, name, onConfirm, onCancel, deleting }) => {
//   if (!isOpen) return null;
  
//   return (
//     <div className="nbom-modal-overlay" onClick={onCancel}>
//       <div className="nbom-delete-modal" onClick={e => e.stopPropagation()}>
//         <div className="nbom-delete-modal-header">
//           <div className="nbom-delete-modal-icon">
//             <AlertTriangle size={20} />
//           </div>
//           <div>
//             <h3 className="nbom-delete-modal-title">Delete {type}</h3>
//             <p className="nbom-delete-modal-subtitle">
//               Are you sure you want to delete "{name}"? This action cannot be undone.
//             </p>
//           </div>
//         </div>
//         <div className="nbom-delete-modal-footer">
//           <button className="nbom-btn-cancel" onClick={onCancel} disabled={deleting}>
//             Cancel
//           </button>
//           <button className="nbom-btn-delete" onClick={onConfirm} disabled={deleting}>
//             {deleting ? 'Deleting...' : 'Delete'}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // ─── Validation Modal ─────────────────────────────────────────────────────────

// interface ValidationModalProps {
//   errors: ValidationError[];
//   onClose: () => void;
//   onJump: (tabId: TabId) => void;
//   tabs: { id: TabId; label: string }[];
// }

// const ValidationModal: React.FC<ValidationModalProps> = ({ errors, onClose, onJump, tabs }) => {
//   if (errors.length === 0) return null;
  
//   return (
//     <div className="nbom-modal-overlay" onClick={onClose}>
//       <div className="nbom-validation-modal" onClick={e => e.stopPropagation()}>
//         <div className="nbom-modal-header">
//           <h2 className="nbom-modal-title">
//             <AlertTriangle size={16} />
//             Missing Required Fields
//           </h2>
//           <button className="nbom-modal-close" onClick={onClose}><X size={18} /></button>
//         </div>
//         <div className="nbom-modal-body">
//           <p className="nbom-modal-intro">
//             Please fill in all fields marked with <strong style={{ color: '#dc2626' }}>*</strong> before saving:
//           </p>
//           <div className="nbom-error-list">
//             {errors.map((err, i) => {
//               const tabLabel = tabs.find(t => t.id === err.tabId)?.label ?? err.tabId;
//               return (
//                 <div key={i} className="nbom-validation-error-item" onClick={() => onJump(err.tabId)}>
//                   <div className="nbom-error-header">
//                     <XCircle size={14} className="nbom-error-icon" />
//                     <strong className="nbom-error-label">{err.label}</strong>
//                     <span className="nbom-error-tab">{tabLabel}</span>
//                   </div>
//                   <div className="nbom-error-message">{err.message}</div>
//                 </div>
//               );
//             })}
//           </div>
//           <div className="nbom-hint-banner">
//             <InfoIcon size={13} className="nbom-hint-icon" />
//             Click on any error to jump to that section
//           </div>
//         </div>
//         <div className="nbom-modal-footer">
//           <button className="nbom-btn-cancel" onClick={onClose}>Close</button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // ─── BOM Type Selector ─────────────────────────────────────────────────────

// interface BOMTypeSelectorProps {
//   bomType: "Internal" | "External";
//   onBomTypeChange: (value: "Internal" | "External") => void;
// }

// const BOMTypeSelector: React.FC<BOMTypeSelectorProps> = ({ bomType, onBomTypeChange }) => (
//   <div className="nbom-bom-type-section">
//     <div className="nbom-bom-type-header">
//       <h3 className="nbom-bom-type-title">BOM Type</h3>
//       <p className="nbom-bom-type-subtitle">Select the type of Bill of Materials</p>
//     </div>
//     <div className="nbom-bom-type-options">
//       <div 
//         className={`nbom-bom-type-card ${bomType === "Internal" ? "active" : ""}`}
//         onClick={() => onBomTypeChange("Internal")}
//       >
//         <div className="nbom-bom-type-card-content">
//           <div className="nbom-bom-type-card-icon">
//             <Package size={22} />
//           </div>
//           <div className="nbom-bom-type-card-info">
//             <div className="nbom-bom-type-card-label">Product (Internal)</div>
//             <div className="nbom-bom-type-card-hint">For manufactured products</div>
//           </div>
//           <div className="nbom-bom-type-card-check">
//             {bomType === "Internal" && <CheckCircle size={18} />}
//           </div>
//         </div>
//       </div>
//       <div 
//         className={`nbom-bom-type-card ${bomType === "External" ? "active" : ""}`}
//         onClick={() => onBomTypeChange("External")}
//       >
//         <div className="nbom-bom-type-card-content">
//           <div className="nbom-bom-type-card-icon">
//             <Wrench size={22} />
//           </div>
//           <div className="nbom-bom-type-card-info">
//             <div className="nbom-bom-type-card-label">Service (External)</div>
//             <div className="nbom-bom-type-card-hint">For external services</div>
//           </div>
//           <div className="nbom-bom-type-card-check">
//             {bomType === "External" && <CheckCircle size={18} />}
//           </div>
//         </div>
//       </div>
//     </div>
//   </div>
// );

// // ─── BOM Configuration Tab ────────────────────────────────────────────────────

// interface BOMConfigTabProps {
//   defaultSourceWarehouse?: string;
//   defaultTargetWarehouse?: string;
//   warehouses: Warehouse[];
//   onDefaultSourceChange?: (value: string) => void;
//   onDefaultTargetChange?: (value: string) => void;
//   bomType: "Internal" | "External";
//   onBomTypeChange: (value: "Internal" | "External") => void;
// }

// const BOMConfigTab: React.FC<BOMConfigTabProps> = ({ 
//   defaultSourceWarehouse, 
//   defaultTargetWarehouse, 
//   warehouses,
//   onDefaultSourceChange,
//   onDefaultTargetChange,
//   bomType,
//   onBomTypeChange,
// }) => {
//   const [qiRequired, setQiRequired] = useState(false);

//   return (
//     <div className="nbom-tab-content">
//       {/* BOM Type at top of config tab */}
//       <BOMTypeSelector bomType={bomType} onBomTypeChange={onBomTypeChange} />

//       <div className="nbom-config-section">
//         <div className="nbom-config-section__title">Quality Inspection</div>
//         <Checkbox label="Quality Inspection Required" checked={qiRequired} onChange={() => setQiRequired(v => !v)} />
//       </div>

//       <div className="nbom-config-section">
//         <div className="nbom-config-section__title">Default Warehouse</div>
//         <div className="nbom-form-grid">
//           <div className="nbom-field">
//             <Label text="Default Source Warehouse" />
//             <select 
//               className="nbom-input" 
//               value={defaultSourceWarehouse || ''}
//               onChange={(e) => onDefaultSourceChange?.(e.target.value)}
//             >
//               <option value="">Select Source Warehouse...</option>
//               {warehouses.map(w => (
//                 <option key={w.id} value={w.warehouse_name}>
//                   {w.warehouse_name} {w.warehouse_type ? `(${w.warehouse_type})` : ''}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div className="nbom-field">
//             <Label text="Default Target Warehouse" />
//             <select 
//               className="nbom-input" 
//               value={defaultTargetWarehouse || ''}
//               onChange={(e) => onDefaultTargetChange?.(e.target.value)}
//             >
//               <option value="">Select Target Warehouse...</option>
//               {warehouses.map(w => (
//                 <option key={w.id} value={w.warehouse_name}>
//                   {w.warehouse_name} {w.warehouse_type ? `(${w.warehouse_type})` : ''}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // ─── Tab definitions ──────────────────────────────────────────────────────────

// type TabId = "production" | "config";

// const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
//   { id: "production", label: "Production Item", icon: <Package size={14} /> },
//   { id: "config", label: "BOM Configuration", icon: <Wrench size={14} /> },
// ];

// // ─── Main Page ────────────────────────────────────────────────────────────────

// interface NewBOMPageProps {
//   onBack?: () => void;
//   editData?: {
//     bom: any;
//     items: any[];
//     operations: any[];
//   } | null;
// }

// const NewBOMPage: React.FC<NewBOMPageProps> = ({ onBack, editData }) => {
//   const [activeTab, setActiveTab] = useState<TabId>("production");
//   const [costAllocPanelOpen, setCostAllocPanelOpen] = useState(true);
//   const [opsPanelOpen, setOpsPanelOpen] = useState(true);
//   const [withOperations, setWithOperations] = useState(false);
//   const [itemToManufacture, setItemToManufacture] = useState("");
//   const [bomNo, setBomNo] = useState("");
//   const [bomId, setBomId] = useState<number | null>(null);
//   const [saving, setSaving] = useState(false);
//   const [apiError, setApiError] = useState<string | null>(null);
//   const [defaultSourceWarehouse, setDefaultSourceWarehouse] = useState("");
//   const [defaultTargetWarehouse, setDefaultTargetWarehouse] = useState("");
//   const [bomType, setBomType] = useState<"Internal" | "External">("Internal");
  
//   const [showValidationErrors, setShowValidationErrors] = useState(false);

//   const [compRows, setCompRows] = useState<ComponentRow[]>([
//     { id: Date.now(), itemCode: "", itemName: "", qty: "", uom: "", rate: "0", amount: "₹ 0.00", itemGroup: "", valuationRate: 0, standardRate: 0, isNew: true },
//   ]);

//   const [opRows, setOpRows] = useState<OperationRow[]>([
//     {
//       id: Date.now(),
//       operation: "",
//       operationId: undefined,
//       sequenceId: "1",
//       workstation: "",
//       workstationId: undefined,
//       workstationType: "",
//       timeInMins: "",
//       hourRate: "",
//       operatingCost: "",
//       qualityInspectionRequired: false,
//       isNew: true
//     }
//   ]);

//   // Drag and Drop state
//   const [dragIndex, setDragIndex] = useState<number | null>(null);
//   const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

//   const [showValidation, setShowValidation] = useState(false);
//   const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
//   const [toasts, setToasts] = useState<Toast[]>([]);
//   const [deleteModal, setDeleteModal] = useState<DeleteModal>({
//     isOpen: false,
//     type: 'component',
//     rowId: 0,
//     name: '',
//     dbRowId: undefined,
//   });
//   const [deleting, setDeleting] = useState(false);

//   // Data
//   const [items, setItems] = useState<Item[]>([]);
//   const [itemsLoading, setItemsLoading] = useState(false);
//   const [operations, setOperations] = useState<Operation[]>([]);
//   const [operationsLoading, setOperationsLoading] = useState(false);
//   const [workstations, setWorkstations] = useState<Workstation[]>([]);
//   const [workstationsLoading, setWorkstationsLoading] = useState(false);
//   const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

//   // ─── Toast helper functions ──────────────────────────────────────────────────

//   const addToast = useCallback((type: Toast['type'], title: string, message: string) => {
//     const id = Date.now().toString();
//     setToasts(prev => [...prev, { id, type, title, message }]);
//     setTimeout(() => {
//       setToasts(prev => prev.filter(t => t.id !== id));
//     }, 4000);
//   }, []);

//   const removeToast = useCallback((id: string) => {
//     setToasts(prev => prev.filter(t => t.id !== id));
//   }, []);

//   // ─── Drag and Drop Handlers ─────────────────────────────────────────────────

//   const handleDragStart = (e: React.DragEvent, index: number) => {
//     setDragIndex(index);
//     e.dataTransfer.effectAllowed = 'move';
//     if (e.currentTarget instanceof HTMLElement) {
//       e.currentTarget.style.opacity = '0.5';
//     }
//   };

//   const handleDragOver = (e: React.DragEvent, index: number) => {
//     e.preventDefault();
//     e.dataTransfer.dropEffect = 'move';
//     setDragOverIndex(index);
//   };

//   const handleDragLeave = () => {
//     setDragOverIndex(null);
//   };

//   const handleDrop = (e: React.DragEvent, dropIndex: number) => {
//     e.preventDefault();
    
//     if (dragIndex === null || dragIndex === dropIndex) {
//       setDragIndex(null);
//       setDragOverIndex(null);
//       return;
//     }

//     setOpRows(prevRows => {
//       const newRows = [...prevRows];
//       const draggedRow = newRows[dragIndex];
//       newRows.splice(dragIndex, 1);
//       newRows.splice(dropIndex, 0, draggedRow);
//       return newRows.map((row, idx) => ({
//         ...row,
//         sequenceId: String(idx + 1)
//       }));
//     });

//     setDragIndex(null);
//     setDragOverIndex(null);
//   };

//   const handleDragEnd = (e: React.DragEvent) => {
//     if (e.currentTarget instanceof HTMLElement) {
//       e.currentTarget.style.opacity = '1';
//     }
//     setDragIndex(null);
//     setDragOverIndex(null);
//   };

//   // ─── Load edit data ──────────────────────────────────────────────────────────

//   useEffect(() => {
//     if (editData) {
//       const { bom, items, operations } = editData;
      
//       setItemToManufacture(bom.item);
//       setBomNo(bom.id);
//       setBomId(bom.id);
//       setDefaultSourceWarehouse(bom.default_source_warehouse || "");
//       setDefaultTargetWarehouse(bom.default_target_warehouse || "");
//       setBomType(bom.type === "External" ? "External" : "Internal");
      
//       if (items && items.length > 0) {
//         const comps = items.map((item: any) => ({
//           id: item.id || Date.now() + Math.random(),
//           itemCode: item.item_code,
//           itemName: item.item_name,
//           qty: String(item.qty),
//           uom: item.uom,
//           rate: String(item.rate || item.standard_rate || item.valuation_rate || 0),
//           amount: `₹ ${(item.rate || item.standard_rate || item.valuation_rate || 0) * (item.qty || 0)}`,
//           itemGroup: item.item_group || '',
//           valuationRate: item.valuation_rate || 0,
//           standardRate: item.standard_rate || 0,
//           isNew: false,
//         }));
//         setCompRows(comps);
//       }
      
//       if (operations && operations.length > 0) {
//         setWithOperations(true);
//         const ops = operations.map((op: any, idx: number) => ({
//           id: op.id || Date.now() + idx,
//           operation: op.operation,
//           operationId: op.operation_id || op.id,
//           sequenceId: String(op.sequence_id || idx + 1),
//           workstation: op.workstation,
//           workstationId: op.workstation_id,
//           workstationType: op.workstation_type || '',
//           timeInMins: String(op.time_in_mins || 0),
//           hourRate: String(op.hour_rate || 0),
//           operatingCost: String(op.operating_cost || 0),
//           qualityInspectionRequired: op.quality_inspection_required === 1,
//           isNew: false,
//         }));
//         setOpRows(ops);
//       }
//     }
//   }, [editData]);

//   // ─── Fetch data ──────────────────────────────────────────────────────────────

//   useEffect(() => {
//     fetchItems();
//     fetchOperations();
//     fetchWorkstations();
//     fetchWarehouses();
//   }, []);

//   const fetchItems = async () => {
//     try {
//       setItemsLoading(true);
//       const response = await api.get('/item');
//       if (response.data.success === 1) {
//         setItems(response.data.data);
//       }
//     } catch (err: any) {
//       console.error('Error fetching items:', err);
//       addToast('error', 'Error', 'Failed to fetch items');
//     } finally {
//       setItemsLoading(false);
//     }
//   };

//   const fetchOperations = async () => {
//     try {
//       setOperationsLoading(true);
//       const response = await api.get('/operation');
//       if (response.data.success === 1) {
//         setOperations(response.data.data);
//       }
//     } catch (err: any) {
//       console.error('Error fetching operations:', err);
//       addToast('error', 'Error', 'Failed to fetch operations');
//     } finally {
//       setOperationsLoading(false);
//     }
//   };

//   const fetchWorkstations = async () => {
//     try {
//       setWorkstationsLoading(true);
//       const response = await api.get('/workstation');
//       if (response.data.success === 1) {
//         const data = response.data.data;
//         let workstationList: Workstation[] = [];
//         if (Array.isArray(data)) {
//           workstationList = data;
//         } else if (data && 'records' in data) {
//           workstationList = data.records || [];
//         }
//         setWorkstations(
//           workstationList.filter(w => w.is_deleted === 0 && w.status === 'Active')
//         );
//       }
//     } catch (err: any) {
//       console.error('Error fetching workstations:', err);
//     } finally {
//       setWorkstationsLoading(false);
//     }
//   };

//   const fetchWarehouses = async () => {
//     try {
//       const response = await api.get('/warehouse');
//       if (response.data.success === 1) {
//         const data = response.data.data;
//         let warehouseList: Warehouse[] = [];
//         if (Array.isArray(data)) {
//           warehouseList = data;
//         } else if (data && 'records' in data) {
//           warehouseList = data.records || [];
//         }
//         setWarehouses(warehouseList.filter(w => w.disabled === 0));
//       }
//     } catch (err: any) {
//       console.error('Error fetching warehouses:', err);
//     }
//   };

//   // ─── Delete Functions ──────────────────────────────────────────────────────

//   const openDeleteModal = (type: 'component' | 'operation', rowId: number, name: string, dbRowId?: number) => {
//     setDeleteModal({ isOpen: true, type, rowId, name, dbRowId });
//   };

//   const closeDeleteModal = () => {
//     if (!deleting) {
//       setDeleteModal({ isOpen: false, type: 'component', rowId: 0, name: '', dbRowId: undefined });
//     }
//   };

//   const confirmDelete = async () => {
//     const { type, rowId, name, dbRowId } = deleteModal;
    
//     if (type === 'component') {
//       const row = compRows.find(r => r.id === rowId);
//       if (row?.isNew) {
//         setCompRows(r => r.filter(row => row.id !== rowId));
//         addToast('success', 'Deleted', `Component "${name}" removed`);
//         closeDeleteModal();
//         return;
//       }

//       const deleteId = dbRowId || rowId;
      
//       try {
//         setDeleting(true);
//         const response = await api.delete(`/bom-item/${deleteId}`);
//         if (response.data.success === 1) {
//           setCompRows(r => r.filter(row => row.id !== rowId));
//           addToast('success', 'Deleted', `Component "${name}" deleted successfully`);
//         } else {
//           addToast('error', 'Error', response.data.message || 'Failed to delete component');
//         }
//       } catch (err: any) {
//         addToast('error', 'Error', err.response?.data?.message || 'Failed to delete component');
//       } finally {
//         setDeleting(false);
//         closeDeleteModal();
//       }
//     } else if (type === 'operation') {
//       const row = opRows.find(r => r.id === rowId);
//       if (row?.isNew) {
//         setOpRows(r => {
//           const filtered = r.filter(row => row.id !== rowId);
//           return filtered.map((row, idx) => ({ ...row, sequenceId: String(idx + 1) }));
//         });
//         addToast('success', 'Deleted', `Operation "${name}" removed`);
//         closeDeleteModal();
//         return;
//       }

//       const deleteId = dbRowId || row?.operationId || rowId;
      
//       try {
//         setDeleting(true);
//         const response = await api.delete(`/bom-operation/${deleteId}`);
//         if (response.data.success === 1) {
//           setOpRows(r => {
//             const filtered = r.filter(row => row.id !== rowId);
//             return filtered.map((row, idx) => ({ ...row, sequenceId: String(idx + 1) }));
//           });
//           addToast('success', 'Deleted', `Operation "${name}" deleted successfully`);
//         } else {
//           addToast('error', 'Error', response.data.message || 'Failed to delete operation');
//         }
//       } catch (err: any) {
//         addToast('error', 'Error', err.response?.data?.message || 'Failed to delete operation');
//       } finally {
//         setDeleting(false);
//         closeDeleteModal();
//       }
//     }
//   };

//   // ─── Row Operations ──────────────────────────────────────────────────────────

//   const addCompRow = () =>
//     setCompRows(r => [...r, {
//       id: Date.now(),
//       itemCode: "",
//       itemName: "",
//       qty: "",
//       uom: "",
//       rate: "0",
//       amount: "₹ 0.00",
//       itemGroup: "",
//       valuationRate: 0,
//       standardRate: 0,
//       isNew: true
//     }]);

//   const addOpRow = () =>
//     setOpRows(r => [...r, {
//       id: Date.now(),
//       operation: "",
//       operationId: undefined,
//       sequenceId: String(r.length + 1),
//       workstation: "",
//       workstationId: undefined,
//       workstationType: "",
//       timeInMins: "",
//       hourRate: "",
//       operatingCost: "",
//       qualityInspectionRequired: false,
//       isNew: true
//     }]);

//   const handleOperationSelect = (idx: number, operationName: string) => {
//     const selectedOp = operations.find(op => op.name === operationName);
//     if (selectedOp) {
//       const workstationDetails = workstations.find(w => w.id === selectedOp.workstationId);
//       const workstationName = workstationDetails?.workstation_name || selectedOp.workstation_name || selectedOp.workstation || '';
//       const hourRate = (workstationDetails?.hour_rate ?? selectedOp.hour_rate ?? 0).toString();
//       const timeInMins = selectedOp.total_operation_time?.toString() || '0';
//       const operatingCost = ((parseFloat(hourRate) || 0) * (parseFloat(timeInMins) || 0) / 60).toFixed(2);
  
//       setOpRows(rs => rs.map((r, i) => 
//         i === idx ? {
//           ...r,
//           operation: operationName,
//           operationId: selectedOp.id,
//           workstation: workstationName,
//           workstationId: selectedOp.workstationId,
//           timeInMins,
//           workstationType: workstationDetails?.workstation_type || '',
//           hourRate,
//           operatingCost,
//         } : r
//       ));
//     }
//   };

//   const handleWorkstationSelect = (idx: number, workstationName: string) => {
//     const selectedWorkstation = workstations.find(w => w.workstation_name === workstationName);
//     if (selectedWorkstation) {
//       setOpRows(rs => rs.map((r, i) => 
//         i === idx ? {
//           ...r,
//           workstation: workstationName,
//           workstationId: selectedWorkstation.id,
//           workstationType: selectedWorkstation.workstation_type || '',
//           hourRate: selectedWorkstation.hour_rate?.toString() || r.hourRate || '0',
//           operatingCost: selectedWorkstation.hour_rate 
//             ? ((selectedWorkstation.hour_rate * (parseFloat(r.timeInMins) || 0)) / 60).toFixed(2)
//             : r.operatingCost || '0',
//         } : r
//       ));
//     }
//   };

//   const handleTimeChange = (idx: number, timeInMins: string) => {
//     const row = opRows[idx];
//     const hourRate = parseFloat(row.hourRate) || 0;
//     const time = parseFloat(timeInMins) || 0;
//     const operatingCost = (hourRate * time) / 60;
    
//     setOpRows(rs => rs.map((r, i) => 
//       i === idx ? {
//         ...r,
//         timeInMins: timeInMins,
//         operatingCost: operatingCost.toFixed(2)
//       } : r
//     ));
//   };

//   const handleHourRateChange = (idx: number, hourRate: string) => {
//     const row = opRows[idx];
//     const time = parseFloat(row.timeInMins) || 0;
//     const rate = parseFloat(hourRate) || 0;
//     const operatingCost = (rate * time) / 60;
    
//     setOpRows(rs => rs.map((r, i) => 
//       i === idx ? {
//         ...r,
//         hourRate: hourRate,
//         operatingCost: operatingCost.toFixed(2)
//       } : r
//     ));
//   };

//   const calculateTotalCost = () => {
//     let totalComponentCost = 0;
//     compRows.forEach(row => {
//       if (row.rate && row.qty) {
//         const rate = parseFloat(row.rate ?? '0') || 0;
//         const qty = parseFloat(row.qty ?? '0') || 0;
//         totalComponentCost += rate * qty;
//       }
//     });

//     let totalOperationCost = 0;
//     opRows.forEach(row => {
//       if (row.operatingCost) {
//         totalOperationCost += parseFloat(row.operatingCost) || 0;
//       }
//     });

//     return {
//       totalComponentCost: totalComponentCost.toFixed(2),
//       totalOperationCost: totalOperationCost.toFixed(2),
//       totalCost: (totalComponentCost + totalOperationCost).toFixed(2)
//     };
//   };

//   // Helper: how many component rows currently have an item selected
//   const getSelectedItemsCount = () => compRows.filter(r => r.itemCode.trim() !== "").length;

//   const getAllErrors = (): ValidationError[] => {
//     const errs: ValidationError[] = [];

//     if (!itemToManufacture.trim())
//       errs.push({ field: "itemToManufacture", label: "Item to Manufacture", message: "Item to Manufacture is required", tabId: "production" });

//     const filledComps = compRows.filter(r => r.itemCode.trim());
//     if (filledComps.length === 0)
//       errs.push({ field: "components", label: "Components", message: "At least one component with an Item Code is required", tabId: "production" });

//     compRows.forEach((r, i) => {
//       if (r.itemCode && !r.uom.trim())
//         errs.push({ field: `comp_uom_${i}`, label: `Component ${i + 1} UOM`, message: `UOM is required for component "${r.itemCode}"`, tabId: "production" });
//       if (r.itemCode && (!r.qty || parseFloat(r.qty) <= 0))
//         errs.push({ field: `comp_qty_${i}`, label: `Component ${i + 1} Qty`, message: `Valid quantity is required for component "${r.itemCode}"`, tabId: "production" });
//     });

//     if (withOperations) {
//       opRows.forEach((r, i) => {
//         if (!r.operation.trim())
//           errs.push({ field: `op_${i}`, label: `Operation ${i + 1}`, message: `Operation name is required for row ${i + 1}`, tabId: "production" });
//         if (!r.workstation.trim())
//           errs.push({ field: `op_workstation_${i}`, label: `Operation ${i + 1} Workstation`, message: `Workstation is required for operation "${r.operation || i + 1}"`, tabId: "production" });
//         if (!r.timeInMins || parseFloat(r.timeInMins) <= 0)
//           errs.push({ field: `op_time_${i}`, label: `Operation ${i + 1} Time`, message: `Valid time is required for operation "${r.operation || i + 1}"`, tabId: "production" });
//       });
//     }

//     return errs;
//   };

//   const hasFieldError = (field: string): boolean => {
//     if (!showValidationErrors) return false;
//     return getAllErrors().some(e => e.field === field);
//   };

//   const handleSave = async () => {
//     setShowValidationErrors(true);
    
//     const errs = getAllErrors();
//     if (errs.length > 0) {
//       setValidationErrors(errs);
//       setShowValidation(true);
//       return;
//     }

//     setSaving(true);
//     setApiError(null);

//     try {
//       const selectedItem = items.find(i => i.item_code === itemToManufacture);

//       // Number of component rows that currently have an item selected
//       const selectedItemsCount = getSelectedItemsCount();
      
//       const totalComponentCost = compRows.reduce((sum, row) => {
//         const rate = parseFloat(row.rate || "0") || 0;
//         const qty = parseFloat(row.qty || "0") || 0;
//         return sum + (rate * qty);
//       }, 0);

//       const totalOperationCost = opRows.reduce((sum, row) => {
//         return sum + (parseFloat(row.operatingCost || "0") || 0);
//       }, 0);

//       const totalCost = totalComponentCost + totalOperationCost;
      
//       let bomResponse;
//       const bomPayload = {
//         item_Id: selectedItem?.id,        // id of the item being manufactured
//         item: itemToManufacture,
//         item_name: selectedItem?.item_name || "",
//         company: "SculptorTech",
//         quantity: 1,
//         uom: selectedItem?.stock_uom || "Nos",
//         is_active: 1,
//         is_default: 1,
//         type: bomType,
//         description: `${itemToManufacture} BOM`,
//         modified_by: "Administrator",
//         default_source_warehouse: defaultSourceWarehouse,
//         default_target_warehouse: defaultTargetWarehouse,
//         operating_cost: totalOperationCost,
//         raw_material_cost: totalComponentCost,
//         base_operating_cost: totalOperationCost,
//         base_raw_material_cost: totalComponentCost,
//         total_cost: totalCost,
//         base_total_cost: totalCost,
//         // total_items: selectedItemsCount,  // how many components are selected
//       };

//       if (editData && editData.bom && editData.bom.id) {
//         bomResponse = await api.put('/bom', { 
//           id: editData.bom.id,
//           ...bomPayload 
//         });
//         setBomId(editData.bom.id);
//       } else {
//         bomResponse = await api.post('/bom', bomPayload);
//       }

//       if (bomResponse.data.success !== 1) {
//         throw new Error(bomResponse.data?.message || 'Failed to save BOM');
//       }

//       const insertId = bomResponse.data?.data?.insertId || bomId || editData?.bom?.id || Date.now();
//       setBomId(insertId);
//       const parentRef = insertId;

//       const validComponents = compRows.filter(r => r.itemCode.trim() && r.isNew);
//       for (const comp of validComponents) {
//         const compItem = items.find(i => i.item_code === comp.itemCode);
//         const qty = parseFloat(comp.qty) || 0;
//         const rate = parseFloat(comp.rate) || compItem?.standard_rate || compItem?.valuation_rate || 0;
//         const amount = qty * rate;
        
//         const itemPayload: BOMItemData = {
//           item_code: comp.itemCode,
//           item_name: compItem?.item_name || comp.itemCode,
//           bom_no: parentRef,
//           qty: qty,
//           uom: comp.uom || compItem?.stock_uom || "Nos",
//           stock_qty: qty,
//           stock_uom: comp.uom || compItem?.stock_uom || "Nos",
//           conversion_factor: 1,
//           rate: rate,
//           amount: amount,
//           parent: parentRef,
//           parentfield: "items",
//           parenttype: "BOM",
//           owner: "Administrator",
//           modified_by: "Administrator"
//         };
        
//         await api.post('/bom-item', itemPayload);
//       }

//       if (withOperations) {
//         const validOps = opRows.filter(r => r.operation.trim() && r.isNew);
//         for (const op of validOps) {
//           const hourRate = parseFloat(op.hourRate) || 0;
//           const timeInMins = parseFloat(op.timeInMins) || 0;
//           const operatingCost = (hourRate * timeInMins) / 60;
          
//           const opPayload: BOMOperationData = {
//             operation: op.operation,
//             sequence_id: parseInt(op.sequenceId) || 0,
//             bom_no: parentRef,
//             finished_good: itemToManufacture,
//             finished_good_qty: 1,
//             workstation: op.workstation,
//             workstation_type: op.workstationType || "Machine",
//             time_in_mins: timeInMins,
//             hour_rate: hourRate,
//             operating_cost: operatingCost,
//             quality_inspection_required: op.qualityInspectionRequired ? 1 : 0,
//             parent: parentRef,
//             parentfield: "operations",
//             parenttype: "BOM",
//             owner: "Administrator",
//             modified_by: "Administrator"
//           };
//           await api.post('/bom-operation', opPayload);
//         }
//       }

//       addToast('success', 'Success', `BOM ${editData ? 'updated' : 'created'} successfully! BOM ID: ${parentRef}`);
      
//       setTimeout(() => {
//         if (onBack) onBack();
//       }, 1000);
      
//     } catch (err: any) {
//       console.error('Error saving BOM:', err);
//       addToast('error', 'Error', err.response?.data?.message || 'Failed to save BOM');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleJump = (tabId: TabId) => {
//     setActiveTab(tabId);
//     setShowValidation(false);
//   };

//   const activeIndex = TABS.findIndex(t => t.id === activeTab);
//   const handleNext = () => { const n = TABS[activeIndex + 1]; if (n) setActiveTab(n.id); };
//   const handlePrev = () => { const p = TABS[activeIndex - 1]; if (p) setActiveTab(p.id); };

//   return (
//     <div className="nbom-page">

//       {/* Toast Notifications */}
//       <ToastContainer toasts={toasts} removeToast={removeToast} />

//       {/* Delete Confirmation Modal */}
//       <DeleteConfirmModal
//         isOpen={deleteModal.isOpen}
//         type={deleteModal.type === 'component' ? 'Component' : 'Operation'}
//         name={deleteModal.name}
//         onConfirm={confirmDelete}
//         onCancel={closeDeleteModal}
//         deleting={deleting}
//       />

//       {/* Validation Modal */}
//       {showValidation && (
//         <ValidationModal
//           errors={validationErrors}
//           onClose={() => setShowValidation(false)}
//           onJump={handleJump}
//           tabs={TABS}
//         />
//       )}

//       {/* Topbar */}
//       <div className="nbom-topbar">
//         <nav className="nbom-breadcrumb" aria-label="Breadcrumb">
//           <ol className="nbom-breadcrumb__list">
//             <li className="nbom-breadcrumb__item nbom-breadcrumb__item--home">
//               <button className="nbom-breadcrumb__home-btn" title="Home" onClick={onBack}>
//                 <Home size={13} />
//               </button>
//             </li>
//             <li className="nbom-breadcrumb__sep" aria-hidden><ChevronRight size={12} /></li>
//             <li className="nbom-breadcrumb__item">
//               <button className="nbom-breadcrumb__link" onClick={onBack}>
//                 Manufacturing
//               </button>
//             </li>
//             <li className="nbom-breadcrumb__sep" aria-hidden><ChevronRight size={12} /></li>
//             <li className="nbom-breadcrumb__item">
//               <button className="nbom-breadcrumb__link" onClick={onBack}>
//                 Bill of Materials
//               </button>
//             </li>
//             <li className="nbom-breadcrumb__sep" aria-hidden><ChevronRight size={12} /></li>
//             <li className="nbom-breadcrumb__item nbom-breadcrumb__item--active" aria-current="page">
//               <span className="nbom-breadcrumb__current">
//                 <span className="nbom-breadcrumb__current-dot" />
//                 {editData ? 'Edit' : 'New'} BOM
//               </span>
//             </li>
//           </ol>
//         </nav>
//         <div className="nbom-topbar__right">
//           {apiError && (
//             <div className="nbom-error-pill">
//               <AlertTriangle size={11} />
//               {apiError}
//             </div>
//           )}
//           <button className="nbom-btn-save" onClick={handleSave} disabled={saving}>
//             <Save size={13} />
//             {saving ? 'Saving...' : 'Save'}
//           </button>
//         </div>
//       </div>

//       {/* ═══════════════════════════════════════════════════ */}
//       {/* BOM TYPE SELECTOR - AT THE TOP OF FIRST TAB */}
//       {/* ═══════════════════════════════════════════════════ */}
      
//       {/* BOM Type Selector - Always visible at top of production tab
//       <div className="nbom-bom-type-wrapper">
//         <BOMTypeSelector bomType={bomType} onBomTypeChange={setBomType} />
//       </div> */}

//       {/* Stepper Tabs */}
//       <div className="nbom-stepper-wrap">
//         <div className="nbom-stepper-row">
//           {TABS.map((tab, idx) => {
//             const isActive = activeTab === tab.id;
//             return (
//               <button
//                 key={tab.id}
//                 type="button"
//                 onClick={() => setActiveTab(tab.id)}
//                 className={`nbom-step-btn ${isActive ? "nbom-step-btn--active" : ""}`}
//               >
//                 <div className={`nbom-step-circle ${isActive ? "nbom-step-circle--active" : ""}`}>
//                   {isActive ? tab.icon : idx + 1}
//                 </div>
//                 <div className="nbom-step-label-wrap">
//                   <div className={`nbom-step-step ${isActive ? "nbom-step-step--active" : ""}`}>
//                     Step {idx + 1}
//                   </div>
//                   <div className={`nbom-step-name ${isActive ? "nbom-step-name--active" : ""}`}>
//                     {tab.label}
//                   </div>
//                 </div>
//                 {isActive && <div className="nbom-step-underline" />}
//               </button>
//             );
//           })}
//         </div>
//       </div>

//       {/* Body */}
//       <div className="nbom-body" key={activeTab}>

//         {activeTab === "config" && (
//           <BOMConfigTab 
//             defaultSourceWarehouse={defaultSourceWarehouse}
//             defaultTargetWarehouse={defaultTargetWarehouse}
//             warehouses={warehouses}
//             onDefaultSourceChange={setDefaultSourceWarehouse}
//             onDefaultTargetChange={setDefaultTargetWarehouse}
//             bomType={bomType}
//             onBomTypeChange={setBomType}
//           />
//         )}

//         {activeTab === "production" && (
//           <>
//             {/* Item to Manufacture */}
//             <div className="nbom-card">
//               <div className="nbom-card__body">
//                 <div className="nbom-field">
//                   <Label text="Item to Manufacture" required info />
//                   <select
//                     className={`nbom-input ${hasFieldError('itemToManufacture') ? 'nbom-input--error' : ''}`}
//                     value={itemToManufacture}
//                     onChange={e => setItemToManufacture(e.target.value)}
//                     disabled={itemsLoading}
//                   >
//                     <option value="">{itemsLoading ? 'Loading items...' : 'Select an item...'}</option>
//                     {items.map(item => (
//                       <option key={item.id} value={item.item_code}>
//                         {item.item_code} - {item.item_name} ({item.item_group})
//                       </option>
//                     ))}
//                   </select>
//                   {hasFieldError('itemToManufacture') && (
//                     <span className="nbom-error-text">Item to Manufacture is required</span>
//                   )}
//                 </div>
//               </div>
//             </div>

          

//             {/* Operations with Drag & Drop */}
//             <div className="nbom-card">
//               <div className="nbom-card__header" onClick={() => setOpsPanelOpen(o => !o)}>
//                 <span className="nbom-card__title"><span className="nbom-card__title-dot" />Operations</span>
//                 <ChevronDown size={15} className={`nbom-card__chev ${opsPanelOpen ? "nbom-card__chev--open" : ""}`} />
//               </div>
//               {opsPanelOpen && (
//                 <div className="nbom-card__body">
//                   <Checkbox
//                     label="With Operations"
//                     hint="Manage cost of operations. Drag rows to reorder."
//                     checked={withOperations}
//                     onChange={() => setWithOperations(v => !v)}
//                   />

//                   {withOperations && (
//                     <div style={{ marginTop: 16 }}>
//                       <div className="nbom-table-wrap">
//                         <table className="nbom-table">
//                           <thead>
//                             <tr>
//                               <th className="nbom-table-drag-col"></th>
//                               <th className="nbom-table-no">No.</th>
//                               <th>Operation <span style={{ color: "var(--c-danger)" }}>*</span></th>
//                               <th>Seq ID</th>
//                               <th>Workstation <span style={{ color: "var(--c-danger)" }}>*</span></th>
//                               <th>WS Type</th>
//                               <th>Time (mins) <span style={{ color: "var(--c-danger)" }}>*</span></th>
//                               <th>Hour Rate (₹)</th>
//                               <th>Operating Cost</th>
//                               <th>QI Req</th>
//                               <th></th>
//                             </tr>
//                           </thead>
//                           <tbody>
//                             {opRows.map((row, idx) => (
//                               <tr 
//                                 key={row.id}
//                                 draggable
//                                 onDragStart={(e) => handleDragStart(e, idx)}
//                                 onDragOver={(e) => handleDragOver(e, idx)}
//                                 onDragLeave={handleDragLeave}
//                                 onDrop={(e) => handleDrop(e, idx)}
//                                 onDragEnd={handleDragEnd}
//                                 className={`nbom-draggable-row ${
//                                   dragOverIndex === idx ? 'nbom-drag-over' : ''
//                                 } ${dragIndex === idx ? 'nbom-dragging' : ''}`}
//                               >
//                                 <td className="nbom-table-drag-handle">
//                                   <GripVertical size={14} />
//                                 </td>
//                                 <td className="nbom-table-no">{idx + 1}</td>
//                                 <td>
//                                   <select
//                                     className={`nbom-table-select ${hasFieldError(`op_${idx}`) ? 'nbom-input--error' : ''}`}
//                                     value={row.operation}
//                                     onChange={e => handleOperationSelect(idx, e.target.value)}
//                                     disabled={operationsLoading || workstationsLoading}
//                                   >
//                                     <option value="">{operationsLoading ? 'Loading...' : 'Select operation...'}</option>
//                                     {operations.map(op => (
//                                       <option key={op.id} value={op.name}>{op.name}</option>
//                                     ))}
//                                   </select>
//                                 </td>
//                                 <td>
//                                   <input
//                                     className="nbom-table-input"
//                                     value={row.sequenceId}
//                                     onChange={e => setOpRows(rs => rs.map((r, i) => i === idx ? { ...r, sequenceId: e.target.value } : r))}
//                                     placeholder="Seq"
//                                     style={{ width: 60 }}
//                                   />
//                                 </td>
//                                 <td>
//                                   <select
//                                     className={`nbom-table-select ${hasFieldError(`op_workstation_${idx}`) ? 'nbom-input--error' : ''}`}
//                                     value={row.workstation}
//                                     onChange={e => handleWorkstationSelect(idx, e.target.value)}
//                                     disabled={workstationsLoading}
//                                   >
//                                     <option value="">{workstationsLoading ? 'Loading...' : 'Select workstation...'}</option>
//                                     {workstations.map(w => (
//                                       <option key={w.id} value={w.workstation_name}>{w.workstation_name}</option>
//                                     ))}
//                                   </select>
//                                 </td>
//                                 <td>
//                                   <input
//                                     className="nbom-table-input"
//                                     value={row.workstationType}
//                                     onChange={e => setOpRows(rs => rs.map((r, i) => i === idx ? { ...r, workstationType: e.target.value } : r))}
//                                     placeholder="WS Type"
//                                   />
//                                 </td>
//                                 <td>
//                                   <input
//                                     className={`nbom-table-input ${hasFieldError(`op_time_${idx}`) ? 'nbom-input--error' : ''}`}
//                                     value={row.timeInMins}
//                                     onChange={e => handleTimeChange(idx, e.target.value)}
//                                     placeholder="0"
//                                     type="number"
//                                     style={{ width: 80 }}
//                                   />
//                                 </td>
//                                 <td>
//                                   <input
//                                     className="nbom-table-input"
//                                     value={row.hourRate}
//                                     onChange={e => handleHourRateChange(idx, e.target.value)}
//                                     placeholder="0"
//                                     type="number"
//                                     style={{ width: 80 }}
//                                   />
//                                 </td>
//                                 <td>
//                                   <input
//                                     className="nbom-table-input"
//                                     value={row.operatingCost}
//                                     readOnly
//                                     style={{ width: 80, background: "var(--c-bg-muted)" }}
//                                   />
//                                 </td>
//                                 <td style={{ textAlign: "center" }}>
//                                   <input
//                                     type="checkbox"
//                                     checked={row.qualityInspectionRequired}
//                                     onChange={e => setOpRows(rs => rs.map((r, i) => i === idx ? { ...r, qualityInspectionRequired: e.target.checked } : r))}
//                                   />
//                                 </td>
//                                 <td style={{ textAlign: "center" }}>
//                                   <button
//                                     className="nbom-edit-btn nbom-edit-btn--delete"
//                                     onClick={() => openDeleteModal('operation', row.id, row.operation || `Row ${idx + 1}`, row.operationId)}
//                                     title="Delete row"
//                                   >
//                                     <Trash2 size={12} />
//                                   </button>
//                                 </td>
//                               </tr>
//                             ))}
//                           </tbody>
//                         </table>
//                       </div>
//                       <div className="nbom-table-footer">
//                         <div className="nbom-table-footer__left">
//                           <button className="nbom-btn-link" onClick={addOpRow}>
//                             <Plus size={12} /> Add Operation
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>

//             {/* Components */}
//             <div className="nbom-card">
//               <div className="nbom-card__body">
//                 <div className="nbom-card__title" style={{ marginBottom: 14 }}>
//                   <span className="nbom-card__title-dot" />Components
//                 </div>
//                 <div className="nbom-table-wrap">
//                   <table className="nbom-table">
//                     <thead>
//                       <tr>
//                         <th className="nbom-table-no">No.</th>
//                         <th>Item Code <span style={{ color: "var(--c-danger)" }}>*</span></th>
//                         <th>Item Name</th>
//                         <th>Item Group</th>
//                         <th>Qty <span style={{ color: "var(--c-danger)" }}>*</span></th>
//                         <th>UOM <span style={{ color: "var(--c-danger)" }}>*</span></th>
//                         <th>Rate</th>
//                         <th>Amount</th>
//                         <th></th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {compRows.map((row, idx) => (
//                         <tr key={row.id}>
//                           <td className="nbom-table-no">{idx + 1}</td>
//                           <td>
//                             <select
//                               className="nbom-table-select"
//                               value={row.itemCode}
//                               onChange={e => {
//                                 const selectedItem = items.find(i => i.item_code === e.target.value);
//                                 const rate = selectedItem?.standard_rate ?? selectedItem?.valuation_rate ?? 0;
//                                 setCompRows(rs => rs.map((r, i) => i === idx ? {
//                                   ...r,
//                                   itemCode: e.target.value,
//                                   itemName: selectedItem?.item_name || '',
//                                   itemGroup: selectedItem?.item_group || '',
//                                   uom: selectedItem?.stock_uom || r.uom,
//                                   rate: String(rate),
//                                   valuationRate: selectedItem?.valuation_rate || 0,
//                                   standardRate: selectedItem?.standard_rate || 0,
//                                   amount: `₹ ${(rate * (parseFloat(r.qty) || 0)).toFixed(2)}`
//                                 } : r));
//                               }}
//                             >
//                               <option value="">Select item...</option>
//                               {items.map(item => (
//                                 <option key={item.id} value={item.item_code}>
//                                   {item.item_code} - {item.item_name}
//                                 </option>
//                               ))}
//                             </select>
//                           </td>
//                           <td>
//                             <input
//                               className="nbom-table-input"
//                               value={row.itemName}
//                               readOnly
//                               style={{ background: "var(--c-bg-muted)" }}
//                             />
//                           </td>
//                           <td>
//                             <input
//                               className="nbom-table-input"
//                               value={row.itemGroup}
//                               readOnly
//                               style={{ background: "var(--c-bg-muted)", width: 120 }}
//                             />
//                           </td>
//                           <td>
//                             <input
//                               className={`nbom-table-input ${hasFieldError(`comp_qty_${idx}`) ? 'nbom-input--error' : ''}`}
//                               value={row.qty}
//                               onChange={e => {
//                                 const qty = parseFloat(e.target.value) || 0;
//                                 const rate = parseFloat(row.rate) || 0;
//                                 setCompRows(rs => rs.map((r, i) => i === idx ? { 
//                                   ...r, 
//                                   qty: e.target.value,
//                                   amount: `₹ ${(rate * qty).toFixed(2)}`
//                                 } : r));
//                               }}
//                               style={{ width: 80 }}
//                               type="number"
//                             />
//                           </td>
//                           <td>
//                             <input
//                               className={`nbom-table-input ${hasFieldError(`comp_uom_${idx}`) ? 'nbom-input--error' : ''}`}
//                               value={row.uom}
//                               onChange={e => setCompRows(rs => rs.map((r, i) => i === idx ? { ...r, uom: e.target.value } : r))}
//                               style={{ width: 80 }}
//                             />
//                           </td>
//                           <td>
//                             <input
//                               className="nbom-table-input"
//                               value={row.rate}
//                               onChange={e => {
//                                 const rate = parseFloat(e.target.value) || 0;
//                                 const qty = parseFloat(row.qty) || 0;
//                                 setCompRows(rs => rs.map((r, i) => i === idx ? { 
//                                   ...r, 
//                                   rate: e.target.value,
//                                   amount: `₹ ${(rate * qty).toFixed(2)}`
//                                 } : r));
//                               }}
//                               style={{ width: 80 }}
//                               type="number"
//                             />
//                           </td>
//                           <td className="nbom-table-val">{row.amount}</td>
//                           <td style={{ textAlign: "center" }}>
//                             <button
//                               className="nbom-edit-btn nbom-edit-btn--delete"
//                               onClick={() => openDeleteModal('component', row.id, row.itemCode || `Row ${idx + 1}`, row.id)}
//                               title="Delete row"
//                             >
//                               <Trash2 size={12} />
//                             </button>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//                 <div className="nbom-table-footer">
//                   <div className="nbom-table-footer__left">
//                     <button className="nbom-btn-link" onClick={addCompRow}>
//                       <Plus size={12} /> Add Component
//                     </button>
//                   </div>
//                   <div className="nbom-table-footer__right">
//                     <button className="nbom-btn-ghost">Download</button>
//                     <button className="nbom-btn-ghost">Upload</button>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Cost Summary */}
//             <div className="nbom-cost-summary">
//               <div className="nbom-cost-card nbom-cost-card--material">
//                 <div className="nbom-cost-card__icon">
//                   <Box size={18} />
//                 </div>
//                 <div className="nbom-cost-card__label">Raw Material Cost</div>
//                 <div className="nbom-cost-card__value">₹{calculateTotalCost().totalComponentCost}</div>
//                 <div className="nbom-cost-card__subtitle">Total component cost</div>
//               </div>
              
//               <div className="nbom-cost-card nbom-cost-card--operation">
//                 <div className="nbom-cost-card__icon">
//                   <Clock size={18} />
//                 </div>
//                 <div className="nbom-cost-card__label">Operation Cost</div>
//                 <div className="nbom-cost-card__value">₹{calculateTotalCost().totalOperationCost}</div>
//                 <div className="nbom-cost-card__subtitle">Total operations cost</div>
//               </div>
              
//               <div className="nbom-cost-card nbom-cost-card--total">
//                 <div className="nbom-cost-card__icon">
//                   <TrendingUp size={18} />
//                 </div>
//                 <div className="nbom-cost-card__label">Total BOM Cost</div>
//                 <div className="nbom-cost-card__value">₹{calculateTotalCost().totalCost}</div>
//                 <div className="nbom-cost-card__subtitle">Material + Operations</div>
//               </div>
//             </div>
//           </>
//         )}
//       </div>

//       {/* Footer */}
//       <div className="nbom-footer-row">
//         {activeIndex > 0 && (
//           <button type="button" className="nbom-footer-btn nbom-footer-btn--secondary" onClick={handlePrev}>
//             ← Previous
//           </button>
//         )}
//         {activeIndex < TABS.length - 1 && (
//           <button type="button" className="nbom-footer-btn nbom-footer-btn--primary" onClick={handleNext}>
//             Next →
//           </button>
//         )}
//         {activeIndex === TABS.length - 1 && (
//           <button type="button" className="nbom-footer-btn nbom-footer-btn--primary nbom-footer-btn--submit" onClick={handleSave} disabled={saving}>
//             <Save size={14} /> {saving ? 'Saving...' : (editData ? 'Update BOM' : 'Save BOM')}
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// export default NewBOMPage;
import React, { useState, useEffect, useCallback } from "react";
import {
  Home,
  ChevronDown,
  ChevronRight,
  X,
  Trash2,
  AlertTriangle,
  Package,
  Wrench,
  XCircle,
  InfoIcon,
  Save,
  Plus,
  CheckCircle,
  Box,
  Clock,
  TrendingUp,
  GripVertical,
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

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

interface DeleteModal {
  isOpen: boolean;
  type: 'component' | 'operation';
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

// ─── Shared atoms ─────────────────────────────────────────────────────────────

const Label: React.FC<{ text: string; required?: boolean; info?: boolean }> = ({ text, required, info }) => (
  <span className="nbom-label">
    {text}
    {required && <span className="nbom-label__req">*</span>}
    {info && <span className="nbom-label__info">?</span>}
  </span>
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


// ─── Toast Component ─────────────────────────────────────────────────────────

const ToastContainer: React.FC<{ toasts: Toast[]; removeToast: (id: string) => void }> = ({ toasts, removeToast }) => (
  <div className="nbom-toast-container">
    {toasts.map(toast => (
      <div key={toast.id} className={`nbom-toast nbom-toast--${toast.type}`}>
        <div className="nbom-toast-icon">
          {toast.type === 'success' && <CheckCircle size={16} />}
          {toast.type === 'error' && <AlertTriangle size={16} />}
          {toast.type === 'info' && <InfoIcon size={16} />}
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
      <div className="nbom-delete-modal" onClick={e => e.stopPropagation()}>
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
            {deleting ? 'Deleting...' : 'Delete'}
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

const ValidationModal: React.FC<ValidationModalProps> = ({ errors, onClose, onJump, tabs }) => {
  if (errors.length === 0) return null;
  
  return (
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
            Please fill in all fields marked with <strong style={{ color: '#dc2626' }}>*</strong> before saving:
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
};

// ─── BOM Type Selector ─────────────────────────────────────────────────────

interface BOMTypeSelectorProps {
  bomType: "Internal" | "External";
  onBomTypeChange: (value: "Internal" | "External") => void;
}

const BOMTypeSelector: React.FC<BOMTypeSelectorProps> = ({ bomType, onBomTypeChange }) => (
  <div className="nbom-bom-type-section">
    <div className="nbom-bom-type-header">
      <h3 className="nbom-bom-type-title">BOM Type</h3>
      <p className="nbom-bom-type-subtitle">Select the type of Bill of Materials</p>
    </div>
    <div className="nbom-bom-type-options">
      <div 
        className={`nbom-bom-type-card ${bomType === "Internal" ? "active" : ""}`}
        onClick={() => onBomTypeChange("Internal")}
      >
        <div className="nbom-bom-type-card-content">
          <div className="nbom-bom-type-card-icon">
            <Package size={22} />
          </div>
          <div className="nbom-bom-type-card-info">
            <div className="nbom-bom-type-card-label">Product (Internal)</div>
            <div className="nbom-bom-type-card-hint">For manufactured products</div>
          </div>
          <div className="nbom-bom-type-card-check">
            {bomType === "Internal" && <CheckCircle size={18} />}
          </div>
        </div>
      </div>
      <div 
        className={`nbom-bom-type-card ${bomType === "External" ? "active" : ""}`}
        onClick={() => onBomTypeChange("External")}
      >
        <div className="nbom-bom-type-card-content">
          <div className="nbom-bom-type-card-icon">
            <Wrench size={22} />
          </div>
          <div className="nbom-bom-type-card-info">
            <div className="nbom-bom-type-card-label">Service (External)</div>
            <div className="nbom-bom-type-card-hint">For external services</div>
          </div>
          <div className="nbom-bom-type-card-check">
            {bomType === "External" && <CheckCircle size={18} />}
          </div>
        </div>
      </div>
    </div>
  </div>
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
      {/* BOM Type at top of config tab */}
      <BOMTypeSelector bomType={bomType} onBomTypeChange={onBomTypeChange} />

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
    </div>
  );
};

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
  // const [costAllocPanelOpen, setCostAllocPanelOpen] = useState(true);
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
  
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const [compRows, setCompRows] = useState<ComponentRow[]>([
    { id: Date.now(), itemCode: "", itemName: "", qty: "", uom: "", rate: "0", amount: "₹ 0.00", itemGroup: "", valuationRate: 0, standardRate: 0, isNew: true },
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
      isNew: true
    }
  ]);

  // Drag and Drop state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const [showValidation, setShowValidation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [deleteModal, setDeleteModal] = useState<DeleteModal>({
    isOpen: false,
    type: 'component',
    rowId: 0,
    name: '',
    dbRowId: undefined,
  });
  const [deleting, setDeleting] = useState(false);

  // Data
  const [items, setItems] = useState<Item[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [operationsLoading, setOperationsLoading] = useState(false);
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [workstationsLoading, setWorkstationsLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // ─── Toast helper functions ──────────────────────────────────────────────────

  const addToast = useCallback((type: Toast['type'], title: string, message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ─── Drag and Drop Handlers ─────────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
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

    setOpRows(prevRows => {
      const newRows = [...prevRows];
      const draggedRow = newRows[dragIndex];
      newRows.splice(dragIndex, 1);
      newRows.splice(dropIndex, 0, draggedRow);
      return newRows.map((row, idx) => ({
        ...row,
        sequenceId: String(idx + 1)
      }));
    });

    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  // ─── Load edit data ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (editData) {
      const { bom, items, operations } = editData;
      
      setItemToManufacture(bom.item);
      setBomNo(bom.id);
      setBomId(bom.id);
      setDefaultSourceWarehouse(bom.default_source_warehouse || "");
      setDefaultTargetWarehouse(bom.default_target_warehouse || "");
      setBomType(bom.type === "External" ? "External" : "Internal");
      
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

  // ─── Fetch data ──────────────────────────────────────────────────────────────

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
      addToast('error', 'Error', 'Failed to fetch items');
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
      addToast('error', 'Error', 'Failed to fetch operations');
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
    }
  };

  // ─── Delete Functions ──────────────────────────────────────────────────────

  const openDeleteModal = (type: 'component' | 'operation', rowId: number, name: string, dbRowId?: number) => {
    setDeleteModal({ isOpen: true, type, rowId, name, dbRowId });
  };

  const closeDeleteModal = () => {
    if (!deleting) {
      setDeleteModal({ isOpen: false, type: 'component', rowId: 0, name: '', dbRowId: undefined });
    }
  };

  const confirmDelete = async () => {
    const { type, rowId, name, dbRowId } = deleteModal;
    
    if (type === 'component') {
      const row = compRows.find(r => r.id === rowId);
      if (row?.isNew) {
        setCompRows(r => r.filter(row => row.id !== rowId));
        addToast('success', 'Deleted', `Component "${name}" removed`);
        closeDeleteModal();
        return;
      }

      const deleteId = dbRowId || rowId;
      
      try {
        setDeleting(true);
        const response = await api.delete(`/bom-item/${deleteId}`);
        if (response.data.success === 1) {
          setCompRows(r => r.filter(row => row.id !== rowId));
          addToast('success', 'Deleted', `Component "${name}" deleted successfully`);
        } else {
          addToast('error', 'Error', response.data.message || 'Failed to delete component');
        }
      } catch (err: any) {
        addToast('error', 'Error', err.response?.data?.message || 'Failed to delete component');
      } finally {
        setDeleting(false);
        closeDeleteModal();
      }
    } else if (type === 'operation') {
      const row = opRows.find(r => r.id === rowId);
      if (row?.isNew) {
        setOpRows(r => {
          const filtered = r.filter(row => row.id !== rowId);
          return filtered.map((row, idx) => ({ ...row, sequenceId: String(idx + 1) }));
        });
        addToast('success', 'Deleted', `Operation "${name}" removed`);
        closeDeleteModal();
        return;
      }

      const deleteId = dbRowId || row?.operationId || rowId;
      
      try {
        setDeleting(true);
        const response = await api.delete(`/bom-operation/${deleteId}`);
        if (response.data.success === 1) {
          setOpRows(r => {
            const filtered = r.filter(row => row.id !== rowId);
            return filtered.map((row, idx) => ({ ...row, sequenceId: String(idx + 1) }));
          });
          addToast('success', 'Deleted', `Operation "${name}" deleted successfully`);
        } else {
          addToast('error', 'Error', response.data.message || 'Failed to delete operation');
        }
      } catch (err: any) {
        addToast('error', 'Error', err.response?.data?.message || 'Failed to delete operation');
      } finally {
        setDeleting(false);
        closeDeleteModal();
      }
    }
  };

  // ─── Row Operations ──────────────────────────────────────────────────────────

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

  const handleOperationSelect = (idx: number, operationName: string) => {
    const selectedOp = operations.find(op => op.name === operationName);
    if (selectedOp) {
      const workstationDetails = workstations.find(w => w.id === selectedOp.workstationId);
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
        } : r
      ));
    }
  };

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
        } : r
      ));
    }
  };

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

  // Helper: how many component rows currently have an item selected
  // const getSelectedItemsCount = () => compRows.filter(r => r.itemCode.trim() !== "").length;

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

  const hasFieldError = (field: string): boolean => {
    if (!showValidationErrors) return false;
    return getAllErrors().some(e => e.field === field);
  };

  const handleSave = async () => {
    setShowValidationErrors(true);
    
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

      // Number of component rows that currently have an item selected
      // const selectedItemsCount = getSelectedItemsCount();
      
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
        item_Id: selectedItem?.id,        // id of the item being manufactured
        item: itemToManufacture,
        item_name: selectedItem?.item_name || "",
        company: "SculptorTech",
        quantity: 1,
        uom: selectedItem?.stock_uom || "Nos",
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
        // total_items: selectedItemsCount,  // how many components are selected
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

      const validComponents = compRows.filter(r => r.itemCode.trim() && r.isNew);
      for (const comp of validComponents) {
        const compItem = items.find(i => i.item_code === comp.itemCode);
        const qty = parseFloat(comp.qty) || 0;
        const rate = parseFloat(comp.rate) || compItem?.standard_rate || compItem?.valuation_rate || 0;
        const amount = qty * rate;
        
        const itemPayload: BOMItemData = {
          item_Id: compItem?.id,
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

      addToast('success', 'Success', `BOM ${editData ? 'updated' : 'created'} successfully! BOM ID: ${parentRef}`);
      
      setTimeout(() => {
        if (onBack) onBack();
      }, 1000);
      
    } catch (err: any) {
      console.error('Error saving BOM:', err);
      addToast('error', 'Error', err.response?.data?.message || 'Failed to save BOM');
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

  return (
    <div className="nbom-page">

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        type={deleteModal.type === 'component' ? 'Component' : 'Operation'}
        name={deleteModal.name}
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
        deleting={deleting}
      />

      {/* Validation Modal */}
      {showValidation && (
        <ValidationModal
          errors={validationErrors}
          onClose={() => setShowValidation(false)}
          onJump={handleJump}
          tabs={TABS}
        />
      )}

      {/* Topbar */}
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
            <div className="nbom-error-pill">
              <AlertTriangle size={11} />
              {apiError}
            </div>
          )}
          <button className="nbom-btn-save" onClick={handleSave} disabled={saving}>
            <Save size={13} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* BOM TYPE SELECTOR - AT THE TOP OF FIRST TAB */}
      {/* ═══════════════════════════════════════════════════ */}
      
      {/* BOM Type Selector - Always visible at top of production tab
      <div className="nbom-bom-type-wrapper">
        <BOMTypeSelector bomType={bomType} onBomTypeChange={setBomType} />
      </div> */}

      {/* Stepper Tabs */}
      <div className="nbom-stepper-wrap">
        <div className="nbom-stepper-row">
          {TABS.map((tab, idx) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`nbom-step-btn ${isActive ? "nbom-step-btn--active" : ""}`}
              >
                <div className={`nbom-step-circle ${isActive ? "nbom-step-circle--active" : ""}`}>
                  {isActive ? tab.icon : idx + 1}
                </div>
                <div className="nbom-step-label-wrap">
                  <div className={`nbom-step-step ${isActive ? "nbom-step-step--active" : ""}`}>
                    Step {idx + 1}
                  </div>
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

      {/* Body */}
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
                    className={`nbom-input ${hasFieldError('itemToManufacture') ? 'nbom-input--error' : ''}`}
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
                  {hasFieldError('itemToManufacture') && (
                    <span className="nbom-error-text">Item to Manufacture is required</span>
                  )}
                </div>
              </div>
            </div>

          

            {/* Operations with Drag & Drop */}
            <div className="nbom-card">
              <div className="nbom-card__header" onClick={() => setOpsPanelOpen(o => !o)}>
                <span className="nbom-card__title"><span className="nbom-card__title-dot" />Operations</span>
                <ChevronDown size={15} className={`nbom-card__chev ${opsPanelOpen ? "nbom-card__chev--open" : ""}`} />
              </div>
              {opsPanelOpen && (
                <div className="nbom-card__body">
                  <Checkbox
                    label="With Operations"
                    hint="Manage cost of operations. Drag rows to reorder."
                    checked={withOperations}
                    onChange={() => setWithOperations(v => !v)}
                  />

                  {withOperations && (
                    <div style={{ marginTop: 16 }}>
                      <div className="nbom-table-wrap">
                        <table className="nbom-table">
                          <thead>
                            <tr>
                              <th className="nbom-table-drag-col"></th>
                              <th className="nbom-table-no">No.</th>
                              <th>Operation <span style={{ color: "var(--c-danger)" }}>*</span></th>
                              <th>Seq ID</th>
                              <th>Workstation <span style={{ color: "var(--c-danger)" }}>*</span></th>
                              <th>WS Type</th>
                              <th>Time (mins) <span style={{ color: "var(--c-danger)" }}>*</span></th>
                              <th>Hour Rate (₹)</th>
                              <th>Operating Cost</th>
                              <th>QI Req</th>
                              <th></th>
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
                                  dragOverIndex === idx ? 'nbom-drag-over' : ''
                                } ${dragIndex === idx ? 'nbom-dragging' : ''}`}
                              >
                                <td className="nbom-table-drag-handle">
                                  <GripVertical size={14} />
                                </td>
                                <td className="nbom-table-no">{idx + 1}</td>
                                <td>
                                  <select
                                    className={`nbom-table-select ${hasFieldError(`op_${idx}`) ? 'nbom-input--error' : ''}`}
                                    value={row.operation}
                                    onChange={e => handleOperationSelect(idx, e.target.value)}
                                    disabled={operationsLoading || workstationsLoading}
                                  >
                                    <option value="">{operationsLoading ? 'Loading...' : 'Select operation...'}</option>
                                    {operations.map(op => (
                                      <option key={op.id} value={op.name}>{op.name}</option>
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
                                    className={`nbom-table-select ${hasFieldError(`op_workstation_${idx}`) ? 'nbom-input--error' : ''}`}
                                    value={row.workstation}
                                    onChange={e => handleWorkstationSelect(idx, e.target.value)}
                                    disabled={workstationsLoading}
                                  >
                                    <option value="">{workstationsLoading ? 'Loading...' : 'Select workstation...'}</option>
                                    {workstations.map(w => (
                                      <option key={w.id} value={w.workstation_name}>{w.workstation_name}</option>
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
                                    className={`nbom-table-input ${hasFieldError(`op_time_${idx}`) ? 'nbom-input--error' : ''}`}
                                    value={row.timeInMins}
                                    onChange={e => handleTimeChange(idx, e.target.value)}
                                    placeholder="0"
                                    type="number"
                                    style={{ width: 80 }}
                                  />
                                </td>
                                <td>
                                  <input
                                    className="nbom-table-input"
                                    value={row.hourRate}
                                    onChange={e => handleHourRateChange(idx, e.target.value)}
                                    placeholder="0"
                                    type="number"
                                    style={{ width: 80 }}
                                  />
                                </td>
                                <td>
                                  <input
                                    className="nbom-table-input"
                                    value={row.operatingCost}
                                    readOnly
                                    style={{ width: 80, background: "var(--c-bg-muted)" }}
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
                                    onClick={() => openDeleteModal('operation', row.id, row.operation || `Row ${idx + 1}`, row.operationId)}
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
                        <th className="nbom-table-no">No.</th>
                        <th>Item Code <span style={{ color: "var(--c-danger)" }}>*</span></th>
                        <th>Item Name</th>
                        <th>Item Group</th>
                        <th>Qty <span style={{ color: "var(--c-danger)" }}>*</span></th>
                        <th>UOM <span style={{ color: "var(--c-danger)" }}>*</span></th>
                        <th>Rate</th>
                        <th>Amount</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {compRows.map((row, idx) => (
                        <tr key={row.id}>
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
                              style={{ background: "var(--c-bg-muted)", width: 120 }}
                            />
                          </td>
                          <td>
                            <input
                              className={`nbom-table-input ${hasFieldError(`comp_qty_${idx}`) ? 'nbom-input--error' : ''}`}
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
                              style={{ width: 80 }}
                              type="number"
                            />
                          </td>
                          <td>
                            <input
                              className={`nbom-table-input ${hasFieldError(`comp_uom_${idx}`) ? 'nbom-input--error' : ''}`}
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
                              style={{ width: 80 }}
                              type="number"
                            />
                          </td>
                          <td className="nbom-table-val">{row.amount}</td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              className="nbom-edit-btn nbom-edit-btn--delete"
                              onClick={() => openDeleteModal('component', row.id, row.itemCode || `Row ${idx + 1}`, row.id)}
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
            <div className="nbom-cost-summary">
              <div className="nbom-cost-card nbom-cost-card--material">
                <div className="nbom-cost-card__icon">
                  <Box size={18} />
                </div>
                <div className="nbom-cost-card__label">Raw Material Cost</div>
                <div className="nbom-cost-card__value">₹{calculateTotalCost().totalComponentCost}</div>
                <div className="nbom-cost-card__subtitle">Total component cost</div>
              </div>
              
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
                <div className="nbom-cost-card__subtitle">Material + Operations</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
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
    </div>
  );
};

export default NewBOMPage;