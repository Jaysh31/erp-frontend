import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import {
  Home,
  ChevronRight,
  X,
  Save,
  AlertTriangle,
  Plus,
  Trash2,
  Calendar,
  Check,
  Eye,
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

// ═══════════════════════════════════════════════════════════════════════════
// 🆕 FULL-SCREEN LOADER OVERLAY
// ═══════════════════════════════════════════════════════════════════════════

interface LoaderOverlayProps {
  isOpen: boolean;
  message?: string;
  subtitle?: string;
}

const LoaderOverlay: React.FC<LoaderOverlayProps> = ({
  isOpen,
  message = 'Please wait...',
  subtitle,
}) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="nws-loader-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20000,
        padding: '20px',
      }}
    >
      <div
        className="nws-loader-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '32px 40px',
          minWidth: '280px',
          maxWidth: '380px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
          textAlign: 'center',
        }}
      >
        <div
          className="nws-loader-spinner"
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            border: '4px solid #e5e7eb',
            borderTopColor: '#6366f1',
            animation: 'nwsSpin 0.9s linear infinite',
          }}
        />
        <div
          className="nws-loader-message"
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#111827',
          }}
        >
          {message}
        </div>
        {subtitle && (
          <div
            className="nws-loader-subtitle"
            style={{
              fontSize: '13px',
              color: '#6b7280',
              marginTop: '-8px',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      <style>{`
        @keyframes nwsSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>,
    document.body
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 🆕 SUCCESS MODAL
// ═══════════════════════════════════════════════════════════════════════════

interface SuccessModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  details: { label: string; value: string | number }[];
  onClose: () => void;
  onView: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  title,
  message,
  details,
  onClose,
  onView,
}) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="nws-success-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 30000,
        padding: '20px',
      }}
    >
      <div
        className="nws-success-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          maxWidth: '480px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center',
          padding: '32px 24px',
        }}
      >
        {/* Green check icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#d1fae5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Check size={32} style={{ color: '#10b981' }} />
        </div>

        <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: '#111827' }}>
          {title}
        </h2>

        <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#6b7280' }}>
          {message}
        </p>

        {details.length > 0 && (
          <div
            style={{
              background: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              padding: '16px',
              marginBottom: '24px',
              textAlign: 'left',
            }}
          >
            {details.map((detail, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: idx < details.length - 1 ? '12px' : '0',
                }}
              >
                <span style={{ fontSize: '13px', color: '#6b7280' }}>{detail.label}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                  {detail.value}
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              background: 'transparent',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            Close
          </button>
          <button
            onClick={onView}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '6px',
              border: 'none',
              background: '#2563eb',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#1d4ed8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#2563eb'; }}
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

// ─── Main Component ───────────────────────────────────────────────────────────

interface NewWorkstationProps {
  onBack?: () => void;
  editData?: WorkstationFormData | null;
  isViewMode?: boolean;
}

const NewWorkstation: React.FC<NewWorkstationProps> = ({
  onBack,
  editData,
  isViewMode = false,
}) => {
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // 🆕 Global loader state.
  const [loaderAction, setLoaderAction] = useState<'save' | null>(null);

  // 🆕 Success modal state.
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    details: { label: string; value: string | number }[];
  }>({
    isOpen: false,
    title: '',
    message: '',
    details: [],
  });

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

  const isValidAlphabetOnly = (value: string): boolean => {
    return /^[A-Za-z\s]*$/.test(value);
  };

  const isValidNumberOnly = (value: string): boolean => {
    return /^\d*\.?\d*$/.test(value);
  };

  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'workstation_name':
        if (!value?.trim()) return 'Workstation name is required';
        if (!isValidAlphabetOnly(value.trim())) {
          return 'Workstation name should contain only alphabets and spaces';
        }
        return '';

      case 'workstation_type':
        if (!value?.trim()) return 'Workstation type is required';
        if (!isValidAlphabetOnly(value.trim())) {
          return 'Workstation type should contain only alphabets and spaces';
        }
        return '';

      case 'plant_floor':
        if (!value?.trim()) return 'Plant floor is required';
        if (!isValidAlphabetOnly(value.trim())) {
          return 'Plant floor should contain only alphabets and spaces';
        }
        return '';

      case 'production_capacity':
        const capStr = String(value);
        if (!capStr.trim()) return 'Production capacity is required';
        if (!isValidNumberOnly(capStr.trim())) {
          return 'Production capacity should contain only numbers';
        }
        const cap = Number(value);
        if (cap < 1) return 'Production capacity must be at least 1';
        return '';

      case 'hour_rate':
        const rateStr = String(value);
        if (!rateStr.trim()) return 'Hour rate is required';
        if (!isValidNumberOnly(rateStr.trim())) {
          return 'Hour rate should contain only numbers';
        }
        const rate = Number(value);
        if (rate < 0) return 'Hour rate cannot be negative';
        return '';

      case 'total_working_hours':
        const hoursStr = String(value);
        if (!hoursStr.trim()) return 'Working hours is required';
        if (!isValidNumberOnly(hoursStr.trim())) {
          return 'Working hours should contain only numbers';
        }
        const hours = Number(value);
        if (hours < 0) return 'Working hours cannot be negative';
        if (hours === 0) return 'Working hours must be greater than 0';
        return '';

      case 'warehouse':
        if (!value?.trim()) return 'Warehouse is required';
        return '';

      case 'status':
        if (!value?.trim()) return 'Status is required';
        return '';

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
    if (isViewMode) return;

    const value = e.target.type === 'checkbox'
      ? (e.target as HTMLInputElement).checked ? 1 : 0
      : e.target.value;

    if (field === 'production_capacity' || field === 'hour_rate' || field === 'total_working_hours') {
      const numValue = String(value);
      if (numValue !== '' && !/^\d*\.?\d*$/.test(numValue)) {
        return;
      }
    }

    if (field === 'workstation_name' || field === 'workstation_type' || field === 'plant_floor') {
      const textValue = String(value);
      if (textValue !== '' && !/^[A-Za-z\s]*$/.test(textValue)) {
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  // ─── Add new workstation type ────────────────────────────────────────────

  const handleAddType = () => {
    if (isViewMode) return;
    if (newType.trim() && !workstationTypes.includes(newType.trim())) {
      if (!isValidAlphabetOnly(newType.trim())) {
        alert('Workstation type should contain only alphabets and spaces');
        return;
      }
      setWorkstationTypes(prev => [...prev, newType.trim()]);
      setFormData(prev => ({ ...prev, workstation_type: newType.trim() }));
      setErrors(prev => ({ ...prev, workstation_type: '' }));
      setNewType('');
      setShowNewTypeInput(false);
    }
  };

  // ─── Add new plant floor ─────────────────────────────────────────────────

  const handleAddFloor = () => {
    if (isViewMode) return;
    if (newFloor.trim() && !plantFloors.includes(newFloor.trim())) {
      if (!isValidAlphabetOnly(newFloor.trim())) {
        alert('Plant floor should contain only alphabets and spaces');
        return;
      }
      setPlantFloors(prev => [...prev, newFloor.trim()]);
      setFormData(prev => ({ ...prev, plant_floor: newFloor.trim() }));
      setErrors(prev => ({ ...prev, plant_floor: '' }));
      setNewFloor('');
      setShowNewFloorInput(false);
    }
  };

  // ─── Holiday management ──────────────────────────────────────────────────

  const handleAddHoliday = () => {
    if (isViewMode) return;
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
    if (isViewMode) return;
    setSelectedHolidays(prev => prev.filter(h => h !== holiday));
    setFormData(prev => ({
      ...prev,
      custom_holidays: (prev.custom_holidays || []).filter(h => h !== holiday)
    }));
  };

  const toggleHolidayPicker = () => {
    if (isViewMode) return;
    setShowHolidayPicker(!showHolidayPicker);
  };

  // ─── Save handler ─────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (isViewMode) return;

    const allErrors = validateAllFields();
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      return;
    }

    setSaving(true);
    setLoaderAction('save');
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
        const responseData = response.data.data;
        const newId = responseData?.id || formData.id || '—';
        const name = formData.workstation_name.trim();

        // 🆕 Show the success modal instead of alert + auto-navigate.
        setSuccessModal({
          isOpen: true,
          title: 'Success!',
          message: isEditMode
            ? 'Workstation updated successfully!'
            : 'Workstation created successfully!',
          details: [
            { label: 'Workstation', value: name },
            { label: 'ID', value: String(newId) },
            { label: 'Type', value: formData.workstation_type || '—' },
            { label: 'Status', value: formData.status || '—' },
          ],
        });

        // If we created a new workstation, remember its ID so subsequent
        // saves become updates.
        if (!isEditMode && responseData?.id) {
          setFormData(prev => ({ ...prev, id: responseData.id }));
          setIsEditMode(true);
        }
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
      setLoaderAction(null);
    }
  };

  // 🆕 Close button on the success modal → return to listing page.
  const handleSuccessClose = () => {
    setSuccessModal(prev => ({ ...prev, isOpen: false }));
    if (onBack) onBack();
  };

  // 🆕 View button on the success modal → simply dismiss the modal.
  //    The form stays exactly as it is on the current page.
  const handleSuccessView = () => {
    setSuccessModal(prev => ({ ...prev, isOpen: false }));
  };

  const hasErrors = Object.keys(validateAllFields()).length > 0;

  const loaderMessage = isEditMode
    ? 'Updating Workstation...'
    : 'Creating Workstation...';

  const loaderSubtitle = isEditMode
    ? 'Please wait while we save your changes.'
    : 'Please wait while we create the workstation.';

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="nws-page">
      {/* 🆕 Full-screen loader during create/update */}
      <LoaderOverlay
        isOpen={loaderAction === 'save'}
        message={loaderMessage}
        subtitle={loaderSubtitle}
      />

      {/* 🆕 Success Modal */}
      <SuccessModal
        isOpen={successModal.isOpen}
        title={successModal.title}
        message={successModal.message}
        details={successModal.details}
        onClose={handleSuccessClose}
        onView={handleSuccessView}
      />

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
                {isViewMode ? 'View' : isEditMode ? 'Edit' : 'New'} Workstation
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
          {isViewMode && (
            <span className="nws-badge--viewonly">View Only</span>
          )}
          {!isViewMode && hasErrors && (
            <div className="nws-error-pill">
              <AlertTriangle size={11} />
              {Object.keys(validateAllFields()).length} missing field{Object.keys(validateAllFields()).length > 1 ? "s" : ""}
            </div>
          )}
          {!isViewMode && !hasErrors && isEditMode && (
            <span className="nws-badge--unsaved">Not Saved</span>
          )}
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
                  className={`nws-input ${isViewMode ? 'nws-input-readonly' : ''}`}
                  value={formData.workstation_name}
                  onChange={handleChange('workstation_name')}
                  placeholder="Enter workstation name..."
                  maxLength={50}
                  readOnly={isViewMode}
                  disabled={isViewMode}
                />
                {errors.workstation_name && !isViewMode && (
                  <span className="nws-error-text">{errors.workstation_name}</span>
                )}
              </div>

              <div className="nws-field">
                <label className="nws-label required-star">Workstation Type</label>
                <div className="nws-select-with-add">
                  <select
                    className={`nws-input nws-select-no-arrow ${isViewMode ? 'nws-input-readonly' : ''}`}
                    value={formData.workstation_type}
                    onChange={handleChange('workstation_type')}
                    disabled={isViewMode}
                  >
                    <option value="">Select type...</option>
                    {workstationTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {!isViewMode && !showNewTypeInput ? (
                    <button
                      className="nws-add-btn"
                      onClick={() => setShowNewTypeInput(true)}
                      title="Add new type"
                    >
                      <Plus size={16} />
                    </button>
                  ) : !isViewMode && showNewTypeInput ? (
                    <div className="nws-add-input-group">
                      <input
                        className="nws-input nws-add-input"
                        value={newType}
                        onChange={(e) => setNewType(e.target.value)}
                        placeholder="New type..."
                        onKeyDown={(e) => e.key === 'Enter' && handleAddType()}
                        maxLength={50}
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
                  ) : null}
                </div>
                {errors.workstation_type && !isViewMode && (
                  <span className="nws-error-text">{errors.workstation_type}</span>
                )}
              </div>

              <div className="nws-field">
                <label className="nws-label required-star">Plant Floor</label>
                <div className="nws-select-with-add">
                  <select
                    className={`nws-input nws-select-no-arrow ${isViewMode ? 'nws-input-readonly' : ''}`}
                    value={formData.plant_floor}
                    onChange={handleChange('plant_floor')}
                    disabled={isViewMode}
                  >
                    {plantFloors.map(floor => (
                      <option key={floor} value={floor}>{floor}</option>
                    ))}
                  </select>
                  {!isViewMode && !showNewFloorInput ? (
                    <button
                      className="nws-add-btn"
                      onClick={() => setShowNewFloorInput(true)}
                      title="Add new floor"
                    >
                      <Plus size={16} />
                    </button>
                  ) : !isViewMode && showNewFloorInput ? (
                    <div className="nws-add-input-group">
                      <input
                        className="nws-input nws-add-input"
                        value={newFloor}
                        onChange={(e) => setNewFloor(e.target.value)}
                        placeholder="New floor..."
                        onKeyDown={(e) => e.key === 'Enter' && handleAddFloor()}
                        maxLength={50}
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
                  ) : null}
                </div>
                {errors.plant_floor && !isViewMode && (
                  <span className="nws-error-text">{errors.plant_floor}</span>
                )}
              </div>

              <div className="nws-field">
                <label className="nws-label required-star">Status</label>
                <select
                  className={`nws-input nws-select-no-arrow ${isViewMode ? 'nws-input-readonly' : ''}`}
                  value={formData.status}
                  onChange={handleChange('status')}
                  disabled={isViewMode}
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                {errors.status && !isViewMode && (
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
                  className={`nws-input ${isViewMode ? 'nws-input-readonly' : ''}`}
                  type="text"
                  value={formData.production_capacity}
                  onChange={handleChange('production_capacity')}
                  placeholder="Enter production capacity..."
                  readOnly={isViewMode}
                  disabled={isViewMode}
                />
                {errors.production_capacity && !isViewMode && (
                  <span className="nws-error-text">{errors.production_capacity}</span>
                )}
              </div>
              <div className="nws-field">
                <label className="nws-label required-star">Hour Rate (₹)</label>
                <input
                  className={`nws-input ${isViewMode ? 'nws-input-readonly' : ''}`}
                  type="text"
                  value={formData.hour_rate}
                  onChange={handleChange('hour_rate')}
                  placeholder="0.00"
                  readOnly={isViewMode}
                  disabled={isViewMode}
                />
                {errors.hour_rate && !isViewMode && (
                  <span className="nws-error-text">{errors.hour_rate}</span>
                )}
              </div>
              <div className="nws-field">
                <label className="nws-label required-star">Total Working Hours (per day)</label>
                <input
                  className={`nws-input ${isViewMode ? 'nws-input-readonly' : ''}`}
                  type="text"
                  value={formData.total_working_hours}
                  onChange={handleChange('total_working_hours')}
                  placeholder="8"
                  readOnly={isViewMode}
                  disabled={isViewMode}
                />
                {errors.total_working_hours && !isViewMode && (
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
                  className={`nws-input nws-select-no-arrow ${isViewMode ? 'nws-input-readonly' : ''}`}
                  value={formData.warehouse}
                  onChange={handleChange('warehouse')}
                  disabled={isViewMode}
                >
                  <option value="">Select warehouse...</option>
                  {warehouses.map(warehouse => (
                    <option key={warehouse.id} value={warehouse.warehouse_name}>
                      {warehouse.warehouse_name} {warehouse.warehouse_type ? `(${warehouse.warehouse_type})` : ''}
                    </option>
                  ))}
                  <option value="Other">Other (Enter manually)</option>
                </select>
                {formData.warehouse === 'Other' && !isViewMode && (
                  <input
                    className="nws-input"
                    value={formData.warehouse}
                    onChange={handleChange('warehouse')}
                    placeholder="Enter warehouse name..."
                    style={{ marginTop: 8 }}
                  />
                )}
                {formData.warehouse === 'Other' && isViewMode && (
                  <input
                    className={`nws-input nws-input-readonly`}
                    value={formData.warehouse}
                    readOnly
                    disabled
                    style={{ marginTop: 8 }}
                  />
                )}
                {errors.warehouse && !isViewMode && (
                  <span className="nws-error-text">{errors.warehouse}</span>
                )}
              </div>
              <div className="nws-field">
                <label className="nws-label">Holiday List</label>
                <div className="nws-holiday-container" ref={holidayContainerRef}>
                  <button
                    className={`nws-holiday-toggle ${isViewMode ? 'nws-holiday-toggle-readonly' : ''}`}
                    onClick={toggleHolidayPicker}
                    type="button"
                    disabled={isViewMode}
                  >
                    <Calendar size={16} />
                    {selectedHolidays.length > 0
                      ? `${selectedHolidays.length} holidays selected`
                      : formData.holiday_list || 'Select holidays'}
                  </button>
                  {isViewMode && selectedHolidays.length > 0 && (
                    <div className="nws-holiday-view-list" style={{ marginTop: 8 }}>
                      {selectedHolidays.map((holiday, index) => (
                        <span key={index} className="nws-holiday-view-item">
                          {holiday}
                        </span>
                      ))}
                    </div>
                  )}
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
                className={`nws-textarea ${isViewMode ? 'nws-input-readonly' : ''}`}
                value={formData.description}
                onChange={handleChange('description')}
                placeholder="Enter workstation description..."
                rows={4}
                readOnly={isViewMode}
                disabled={isViewMode}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className="nws-footer-row">
        <button type="button" className="nws-footer-btn nws-footer-btn--secondary" onClick={onBack}>
          {isViewMode ? 'Close' : 'Cancel'}
        </button>
        {!isViewMode && (
          <button type="button" className="nws-footer-btn nws-footer-btn--primary" onClick={handleSave} disabled={saving}>
            <Save size={14} /> {saving ? 'Saving...' : (isEditMode ? 'Update Workstation' : 'Create Workstation')}
          </button>
        )}
      </div>

      {/* ── Holiday Picker Portal ────────────────────── */}
      {showHolidayPicker && !isViewMode && createPortal(
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