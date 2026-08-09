import React, { useState, useEffect, useRef } from "react";
import {
  Home,
  ChevronRight,
  X,
  Save,
  AlertTriangle,
  
  Plus,
  Trash2,
  Calendar,
} from "lucide-react";
import "./NewWorkstation.css";
import api from '../../src/services/api';
import { createPortal } from 'react-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkstationFormData {
  id?: number;
  workstation_name: string;
  workstation_type: string;
  plant_floor: string;
  disabled: number;
  production_capacity: number;
  warehouse: string;
  status: string;
  hour_rate: number;
  description: string;
  holiday_list: string;
  total_working_hours: number;
  _user_tags: string;
  _comments: string;
  _assign: string;
  _liked_by: string;
  custom_holidays?: string[];
}

interface Warehouse {
  id: number;
  warehouse_name: string;
  warehouse_type: string;
  address?: string;
  disabled: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  "Active",
  "Idle",
  "Maintenance",
  "Off",
  "Problem",
  "Setup",
  "Production"
];

// ─── Main Component ───────────────────────────────────────────────────────────

interface NewWorkstationProps {
  onBack?: () => void;
  editData?: WorkstationFormData | null;
}

const NewWorkstation: React.FC<NewWorkstationProps> = ({ onBack, editData }) => {
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // ─── Errors state ──────────────────────────────────────────────────────────
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // ─── Dynamic lists state ──────────────────────────────────────────────────
  const [workstationTypes, setWorkstationTypes] = useState<string[]>([
    "Assembly",
    "Cutting",
    "Molding",
    "Work Center",
    "Quality Inspection",
    "Packaging",
    "Welding",
    "Painting",
    "Drilling",
    "CNC",
    "Testing",
    "Finishing"
  ]);
  const [plantFloors, setPlantFloors] = useState<string[]>([
    "Ground Floor",
    "First Floor",
    "Second Floor",
    "Third Floor",
    "Basement"
  ]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [, setWarehousesLoading] = useState(false);
  
  // ─── New item input states ─────────────────────────────────────────────────
  const [newType, setNewType] = useState('');
  const [showNewTypeInput, setShowNewTypeInput] = useState(false);
  const [newFloor, setNewFloor] = useState('');
  const [showNewFloorInput, setShowNewFloorInput] = useState(false);
  
  // ─── Holiday selection state ──────────────────────────────────────────────
  const [showHolidayPicker, setShowHolidayPicker] = useState(false);
  const [selectedHolidays, setSelectedHolidays] = useState<string[]>([]);
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayDescription, setHolidayDescription] = useState('');
  const holidayContainerRef = useRef<HTMLDivElement>(null);
  const holidayPickerRef = useRef<HTMLDivElement>(null);

  // ─── Form State ────────────────────────────────────────────────────────────

  const defaultFormData: WorkstationFormData = {
    workstation_name: "",
    workstation_type: "",
    plant_floor: "Ground Floor",
    disabled: 0,
    production_capacity: 1,
    warehouse: "",
    status: "Active",
    hour_rate: 0,
    description: "",
    holiday_list: "India Holidays",
    total_working_hours: 8,
    _user_tags: "",
    _comments: "",
    _assign: "",
    _liked_by: "",
    custom_holidays: [],
  };

  const [formData, setFormData] = useState<WorkstationFormData>(defaultFormData);

  // ─── Fetch warehouses ──────────────────────────────────────────────────────

  const fetchWarehouses = async () => {
    setWarehousesLoading(true);
    try {
      const response = await api.get('/warehouse?limit=100');
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
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    } finally {
      setWarehousesLoading(false);
    }
  };

  // ─── Load data on mount ──────────────────────────────────────────────────

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (editData) {
      setIsEditMode(true);
      setFormData({
        ...defaultFormData,
        ...editData,
      });
      if (editData.custom_holidays) {
        setSelectedHolidays(editData.custom_holidays);
      }
    }
  }, [editData]);

  // ─── Click outside handler ────────────────────────────────────────────────

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        holidayContainerRef.current && 
        !holidayContainerRef.current.contains(event.target as Node) &&
        holidayPickerRef.current &&
        !holidayPickerRef.current.contains(event.target as Node)
      ) {
        setShowHolidayPicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Validation Functions ──────────────────────────────────────────────────

  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'workstation_name':
        return !value?.trim() ? 'Workstation name is required' : '';
      
      case 'workstation_type':
        return !value?.trim() ? 'Workstation type is required' : '';
      
      case 'plant_floor':
        return !value?.trim() ? 'Plant floor is required' : '';
      
      case 'production_capacity':
        const cap = Number(value);
        if (cap < 1) return 'Production capacity must be at least 1';
        return '';
      
      case 'hour_rate':
        const rate = Number(value);
        if (rate < 0) return 'Hour rate cannot be negative';
        return '';
      
      case 'total_working_hours':
        const hours = Number(value);
        if (hours < 0) return 'Working hours cannot be negative';
        if (hours === 0) return 'Working hours must be greater than 0';
        return '';
      
      case 'warehouse':
        return !value?.trim() ? 'Warehouse is required' : '';
      
      case 'status':
        return !value?.trim() ? 'Status is required' : '';
      
      case 'description':
        return ''; // Optional field
      
      default:
        return '';
    }
  };

  const validateAllFields = (): { [key: string]: string } => {
    const newErrors: { [key: string]: string } = {};
    
    const requiredFields = [
      'workstation_name',
      'workstation_type',
      'plant_floor',
      'production_capacity',
      'warehouse',
      'status',
      'hour_rate',
      'total_working_hours'
    ];

    requiredFields.forEach(field => {
      const error = validateField(field, formData[field as keyof WorkstationFormData]);
      if (error) {
        newErrors[field] = error;
      }
    });

    return newErrors;
  };

  // ─── Form handlers ──────────────────────────────────────────────────────

  const handleChange = (field: keyof WorkstationFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked ? 1 : 0
      : e.target.value;
    
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Validate field on change
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  // ─── Add new workstation type ────────────────────────────────────────────

  const handleAddType = () => {
    if (newType.trim() && !workstationTypes.includes(newType.trim())) {
      setWorkstationTypes(prev => [...prev, newType.trim()]);
      setFormData(prev => ({ ...prev, workstation_type: newType.trim() }));
      // Clear error for workstation_type
      setErrors(prev => ({ ...prev, workstation_type: '' }));
      setNewType('');
      setShowNewTypeInput(false);
    }
  };

  // ─── Add new plant floor ─────────────────────────────────────────────────

  const handleAddFloor = () => {
    if (newFloor.trim() && !plantFloors.includes(newFloor.trim())) {
      setPlantFloors(prev => [...prev, newFloor.trim()]);
      setFormData(prev => ({ ...prev, plant_floor: newFloor.trim() }));
      // Clear error for plant_floor
      setErrors(prev => ({ ...prev, plant_floor: '' }));
      setNewFloor('');
      setShowNewFloorInput(false);
    }
  };

  // ─── Holiday management ──────────────────────────────────────────────────

  const handleAddHoliday = () => {
    if (holidayDate) {
      const holiday = holidayDescription 
        ? `${holidayDate} - ${holidayDescription}`
        : holidayDate;
      if (!selectedHolidays.includes(holiday)) {
        setSelectedHolidays(prev => [...prev, holiday]);
        setFormData(prev => ({
          ...prev,
          custom_holidays: [...(prev.custom_holidays || []), holiday]
        }));
      }
      setHolidayDate('');
      setHolidayDescription('');
    }
  };

  const handleRemoveHoliday = (holiday: string) => {
    setSelectedHolidays(prev => prev.filter(h => h !== holiday));
    setFormData(prev => ({
      ...prev,
      custom_holidays: (prev.custom_holidays || []).filter(h => h !== holiday)
    }));
  };

  const toggleHolidayPicker = () => {
    setShowHolidayPicker(!showHolidayPicker);
  };

  // ─── Save handler ─────────────────────────────────────────────────────────

  const handleSave = async () => {
    const allErrors = validateAllFields();
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      return;
    }

    setSaving(true);
    setApiError(null);

    try {
      const payload = {
        workstation_name: formData.workstation_name.trim(),
        workstation_type: formData.workstation_type,
        plant_floor: formData.plant_floor,
        disabled: formData.disabled || 0,
        production_capacity: formData.production_capacity || 1,
        warehouse: formData.warehouse,
        status: formData.status || "Active",
        hour_rate: formData.hour_rate || 0,
        description: formData.description || "",
        holiday_list: selectedHolidays.length > 0 
          ? `Custom: ${selectedHolidays.join(', ')}`
          : formData.holiday_list || "India Holidays",
        total_working_hours: formData.total_working_hours || 8,
        custom_holidays: selectedHolidays,
      };

      let response;
      if (isEditMode && formData.id) {
        response = await api.put('/workstation', { 
          id: formData.id,
          ...payload 
        });
      } else {
        response = await api.post('/workstation', payload);
      }
      
      if (response.data.success === 1) {
        alert(`✅ Workstation ${isEditMode ? 'updated' : 'created'} successfully!`);
        if (onBack) onBack();
      } else {
        setApiError(response.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} workstation`);
      }
    } catch (err: any) {
      console.error('Error saving workstation:', err);
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

  const hasErrors = Object.keys(validateAllFields()).length > 0;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="nws-page">
      {/* ── Topbar ────────────────────────────────────────────── */}
      <div className="nws-topbar">
        <nav className="nws-breadcrumb" aria-label="Breadcrumb">
          <ol className="nws-breadcrumb__list">
            <li className="nws-breadcrumb__item nws-breadcrumb__item--home">
              <button className="nws-breadcrumb__home-btn" title="Home" onClick={onBack}>
                <Home size={13} />
              </button>
            </li>
            <li className="nws-breadcrumb__sep" aria-hidden><ChevronRight size={12} /></li>
            <li className="nws-breadcrumb__item">
              <button className="nws-breadcrumb__link" onClick={onBack}>
                Manufacturing
              </button>
            </li>
            <li className="nws-breadcrumb__sep" aria-hidden><ChevronRight size={12} /></li>
            <li className="nws-breadcrumb__item">
              <button className="nws-breadcrumb__link" onClick={onBack}>
                Workstations
              </button>
            </li>
            <li className="nws-breadcrumb__sep" aria-hidden><ChevronRight size={12} /></li>
            <li className="nws-breadcrumb__item nws-breadcrumb__item--active" aria-current="page">
              <span className="nws-breadcrumb__current">
                <span className="nws-breadcrumb__current-dot" />
                {isEditMode ? 'Edit' : 'New'} Workstation
              </span>
            </li>
          </ol>
        </nav>
        <div className="nws-topbar__right">
          {apiError && (
            <div className="nws-error-pill">
              <AlertTriangle size={11} />
              {apiError}
            </div>
          )}
          {hasErrors && (
            <div className="nws-error-pill">
              <AlertTriangle size={11} />
              {Object.keys(validateAllFields()).length} missing field{Object.keys(validateAllFields()).length > 1 ? "s" : ""}
            </div>
          )}
          <span className="nws-badge--unsaved">Not Saved</span>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────── */}
      <div className="nws-body">
        {/* Basic Information */}
        <div className="nws-card">
          <div className="nws-card__header">
            <span className="nws-card__title">
              <span className="nws-card__title-dot" />
              Basic Information
            </span>
          </div>
          <div className="nws-card__body">
            <div className="nws-form-grid">
              <div className="nws-field">
                <label className="nws-label required-star">Workstation Name</label>
                <input
                  className="nws-input"
                  value={formData.workstation_name}
                  onChange={handleChange('workstation_name')}
                  placeholder="Enter workstation name..."
                />
                {errors.workstation_name && (
                  <span className="nws-error-text">{errors.workstation_name}</span>
                )}
              </div>
              
              <div className="nws-field">
                <label className="nws-label required-star">Workstation Type</label>
                <div className="nws-select-with-add">
                  <select
                    className="nws-input"
                    value={formData.workstation_type}
                    onChange={handleChange('workstation_type')}
                  >
                    <option value="">Select type...</option>
                    {workstationTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {!showNewTypeInput ? (
                    <button 
                      className="nws-add-btn"
                      onClick={() => setShowNewTypeInput(true)}
                      title="Add new type"
                    >
                      <Plus size={16} />
                    </button>
                  ) : (
                    <div className="nws-add-input-group">
                      <input
                        className="nws-input nws-add-input"
                        value={newType}
                        onChange={(e) => setNewType(e.target.value)}
                        placeholder="New type..."
                        onKeyDown={(e) => e.key === 'Enter' && handleAddType()}
                      />
                      <button className="nws-add-confirm" onClick={handleAddType}>
                        <Save size={14} />
                      </button>
                      <button className="nws-add-cancel" onClick={() => {
                        setShowNewTypeInput(false);
                        setNewType('');
                      }}>
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
                {errors.workstation_type && (
                  <span className="nws-error-text">{errors.workstation_type}</span>
                )}
              </div>
              
              <div className="nws-field">
                <label className="nws-label required-star">Plant Floor</label>
                <div className="nws-select-with-add">
                  <select
                    className="nws-input"
                    value={formData.plant_floor}
                    onChange={handleChange('plant_floor')}
                  >
                    {plantFloors.map(floor => (
                      <option key={floor} value={floor}>{floor}</option>
                    ))}
                  </select>
                  {!showNewFloorInput ? (
                    <button 
                      className="nws-add-btn"
                      onClick={() => setShowNewFloorInput(true)}
                      title="Add new floor"
                    >
                      <Plus size={16} />
                    </button>
                  ) : (
                    <div className="nws-add-input-group">
                      <input
                        className="nws-input nws-add-input"
                        value={newFloor}
                        onChange={(e) => setNewFloor(e.target.value)}
                        placeholder="New floor..."
                        onKeyDown={(e) => e.key === 'Enter' && handleAddFloor()}
                      />
                      <button className="nws-add-confirm" onClick={handleAddFloor}>
                        <Save size={14} />
                      </button>
                      <button className="nws-add-cancel" onClick={() => {
                        setShowNewFloorInput(false);
                        setNewFloor('');
                      }}>
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
                {errors.plant_floor && (
                  <span className="nws-error-text">{errors.plant_floor}</span>
                )}
              </div>
              
              <div className="nws-field">
                <label className="nws-label required-star">Status</label>
                <select
                  className="nws-input"
                  value={formData.status}
                  onChange={handleChange('status')}
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                {errors.status && (
                  <span className="nws-error-text">{errors.status}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Capacity & Cost */}
        <div className="nws-card">
          <div className="nws-card__header">
            <span className="nws-card__title">
              <span className="nws-card__title-dot" style={{ background: 'var(--c-teal)' }} />
              Capacity & Cost
            </span>
          </div>
          <div className="nws-card__body">
            <div className="nws-form-grid">
              <div className="nws-field">
                <label className="nws-label required-star">Production Capacity</label>
                <input
                  className="nws-input"
                  type="number"
                  value={formData.production_capacity}
                  onChange={handleChange('production_capacity')}
                  min="1"
                  placeholder="Enter production capacity..."
                />
                {errors.production_capacity && (
                  <span className="nws-error-text">{errors.production_capacity}</span>
                )}
              </div>
              <div className="nws-field">
                <label className="nws-label required-star">Hour Rate (₹)</label>
                <input
                  className="nws-input"
                  type="number"
                  value={formData.hour_rate}
                  onChange={handleChange('hour_rate')}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
                {errors.hour_rate && (
                  <span className="nws-error-text">{errors.hour_rate}</span>
                )}
              </div>
              <div className="nws-field">
                <label className="nws-label required-star">Total Working Hours (per day)</label>
                <input
                  className="nws-input"
                  type="number"
                  value={formData.total_working_hours}
                  onChange={handleChange('total_working_hours')}
                  min="0"
                  step="0.5"
                  placeholder="8"
                />
                {errors.total_working_hours && (
                  <span className="nws-error-text">{errors.total_working_hours}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Warehouse & Holiday */}
        <div className="nws-card">
          <div className="nws-card__header">
            <span className="nws-card__title">
              <span className="nws-card__title-dot" style={{ background: '#3b82f6' }} />
              Warehouse & Holiday
            </span>
          </div>
          <div className="nws-card__body">
            <div className="nws-form-grid">
              <div className="nws-field">
                <label className="nws-label required-star">Warehouse</label>
                <select
                  className="nws-input"
                  value={formData.warehouse}
                  onChange={handleChange('warehouse')}
                >
                  <option value="">Select warehouse...</option>
                  {warehouses.map(warehouse => (
                    <option key={warehouse.id} value={warehouse.warehouse_name}>
                      {warehouse.warehouse_name} {warehouse.warehouse_type ? `(${warehouse.warehouse_type})` : ''}
                    </option>
                  ))}
                  <option value="Other">Other (Enter manually)</option>
                </select>
                {formData.warehouse === 'Other' && (
                  <input
                    className="nws-input"
                    value={formData.warehouse}
                    onChange={handleChange('warehouse')}
                    placeholder="Enter warehouse name..."
                    style={{ marginTop: 8 }}
                  />
                )}
                {errors.warehouse && (
                  <span className="nws-error-text">{errors.warehouse}</span>
                )}
              </div>
              <div className="nws-field">
                <label className="nws-label">Holiday List</label>
                <div className="nws-holiday-container" ref={holidayContainerRef}>
                  <button 
                    className="nws-holiday-toggle"
                    onClick={toggleHolidayPicker}
                    type="button"
                  >
                    <Calendar size={16} />
                    {selectedHolidays.length > 0 
                      ? `${selectedHolidays.length} holidays selected`
                      : formData.holiday_list || 'Select holidays'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="nws-card">
          <div className="nws-card__header">
            <span className="nws-card__title">
              <span className="nws-card__title-dot" style={{ background: '#6b7280' }} />
              Description
            </span>
          </div>
          <div className="nws-card__body">
            <div className="nws-field">
              <textarea
                className="nws-textarea"
                value={formData.description}
                onChange={handleChange('description')}
                placeholder="Enter workstation description..."
                rows={4}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className="nws-footer-row">
        <button type="button" className="nws-footer-btn nws-footer-btn--secondary" onClick={onBack}>
          Cancel
        </button>
        <button type="button" className="nws-footer-btn nws-footer-btn--primary" onClick={handleSave} disabled={saving}>
          <Save size={14} /> {saving ? 'Saving...' : (isEditMode ? 'Update Workstation' : 'Create Workstation')}
        </button>
      </div>

      {/* ── Holiday Picker Portal (moved to end) ────────────────────── */}
      {showHolidayPicker && createPortal(
        <div 
          className="nws-holiday-picker-portal"
          ref={holidayPickerRef}
          style={{
            position: 'fixed',
            top: holidayContainerRef.current 
              ? holidayContainerRef.current.getBoundingClientRect().bottom + window.scrollY + 4
              : 0,
            left: holidayContainerRef.current 
              ? holidayContainerRef.current.getBoundingClientRect().left + window.scrollX
              : 0,
            width: holidayContainerRef.current 
              ? holidayContainerRef.current.getBoundingClientRect().width
              : 300,
            zIndex: 9999,
          }}
        >
          <div className="nws-holiday-picker" onClick={(e) => e.stopPropagation()}>
            <div className="nws-holiday-input-row">
              <input
                type="date"
                value={holidayDate}
                onChange={(e) => setHolidayDate(e.target.value)}
                className="nws-input"
                onClick={(e) => e.stopPropagation()}
              />
              <input
                type="text"
                value={holidayDescription}
                onChange={(e) => setHolidayDescription(e.target.value)}
                placeholder="Description..."
                className="nws-input"
                onClick={(e) => e.stopPropagation()}
              />
              <button className="nws-add-holiday-btn" onClick={(e) => {
                e.stopPropagation();
                handleAddHoliday();
              }}>
                <Plus size={12} /> Add
              </button>
            </div>
            
            <div className="nws-holiday-list">
              {selectedHolidays.length === 0 ? (
                <p className="nws-no-holidays">No holidays selected</p>
              ) : (
                selectedHolidays.map((holiday, index) => (
                  <div key={index} className="nws-holiday-item">
                    <span>{holiday}</span>
                    <button 
                      className="nws-remove-holiday"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveHoliday(holiday);
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <div className="nws-holiday-presets">
              <span>Presets:</span>
              <button 
                className="nws-preset-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  const presets = [
                    '2024-01-01 - New Year',
                    '2024-01-26 - Republic Day',
                    '2024-08-15 - Independence Day',
                    '2024-10-02 - Gandhi Jayanti',
                    '2024-12-25 - Christmas'
                  ];
                  presets.forEach(p => {
                    if (!selectedHolidays.includes(p)) {
                      setSelectedHolidays(prev => [...prev, p]);
                      setFormData(prev => ({
                        ...prev,
                        custom_holidays: [...(prev.custom_holidays || []), p]
                      }));
                    }
                  });
                }}
              >
                Add Indian Holidays
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default NewWorkstation;