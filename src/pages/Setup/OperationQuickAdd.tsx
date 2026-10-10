import { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { FaArrowLeft, FaSave, FaSpinner, FaTrash, FaEdit, FaCheck, FaEye } from 'react-icons/fa';
import "./OperationQuickAdd.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';
import { PageLoader } from "../components/PageLoader";

interface Operation {
  id: number;
  name: string;
  creation: string;
  modified: string;
  modified_by: string;
  owner: string;
  docstatus: number;
  idx: number;
  workstationId: number;
  workstation_name: string | null;
  is_corrective_operation: number;
  create_job_card_based_on_batch_size: number;
  quality_inspection_template: string;
  batch_size: number;
  total_operation_time: number;
  description: string;
  hour_rate: number | null;
}

interface Workstation {
  id: number;
  workstation_name: string;
  workstation_type: string;
  plant_floor: string;
  is_deleted: number;
  production_capacity: number;
  warehouse: string;
  status: string;
  hour_rate: number;
  description: string;
  total_working_hours: number;
}

interface ApiResponse {
  success: number;
  data: any;
}

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
      className="opf-loader-overlay"
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
        className="opf-loader-card"
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
          className="opf-loader-spinner"
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            border: '4px solid #e5e7eb',
            borderTopColor: '#6366f1',
            animation: 'opfSpin 0.9s linear infinite',
          }}
        />
        <div
          className="opf-loader-message"
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
            className="opf-loader-subtitle"
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
        @keyframes opfSpin {
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
      className="opf-success-overlay"
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
        className="opf-success-modal"
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
          <FaCheck size={28} style={{ color: '#10b981' }} />
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
            <FaEye size={14} />
            View
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default function OperationForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { theme } = useAdminTheme();

  const [mode, setMode] = useState<'new' | 'edit' | 'view'>('new');
  const [formData, setFormData] = useState<Partial<Operation>>({
    name: '',
    workstationId: 0,
    workstation_name: '',
    is_corrective_operation: 0,
    create_job_card_based_on_batch_size: 1,
    quality_inspection_template: '',
    batch_size: 100,
    total_operation_time: 0,
    description: '',
    docstatus: 0,
    hour_rate: null
  });
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState<Partial<Operation> | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // 🆕 Global loader state — 'save' | 'delete' | null
  const [loaderAction, setLoaderAction] = useState<'save' | 'delete' | null>(null);

  // 🆕 Success modal state
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

  const operationData = location.state?.operationData;

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/new')) {
      setMode('new');
    } else if (path.includes('/edit')) {
      setMode('edit');
    } else if (id && path.includes(`/operations/${id}`)) {
      setMode('view');
    }

    if (operationData) {
      setFormData({
        name: operationData.name,
        workstationId: operationData.workstationId || 0,
        workstation_name: operationData.workstation_name || '',
        is_corrective_operation: operationData.is_corrective_operation,
        create_job_card_based_on_batch_size: operationData.create_job_card_based_on_batch_size,
        quality_inspection_template: operationData.quality_inspection_template || '',
        batch_size: operationData.batch_size,
        total_operation_time: operationData.total_operation_time,
        description: operationData.description || '',
        docstatus: operationData.docstatus || 0,
        hour_rate: operationData.hour_rate || null
      });
      setOriginalData({
        name: operationData.name,
        workstationId: operationData.workstationId || 0,
        workstation_name: operationData.workstation_name || '',
        is_corrective_operation: operationData.is_corrective_operation,
        create_job_card_based_on_batch_size: operationData.create_job_card_based_on_batch_size,
        quality_inspection_template: operationData.quality_inspection_template || '',
        batch_size: operationData.batch_size,
        total_operation_time: operationData.total_operation_time,
        description: operationData.description || '',
        docstatus: operationData.docstatus || 0,
        hour_rate: operationData.hour_rate || null
      });
    } else if (id && mode !== 'new') {
      fetchOperation(id);
    }

    fetchWorkstations();
  }, [id, location.pathname, operationData]);

  useEffect(() => {
    if (originalData && mode !== 'new') {
      const hasChanged = JSON.stringify(formData) !== JSON.stringify(originalData);
      setHasChanges(hasChanged);
    }
  }, [formData, originalData, mode]);

  const fetchOperation = async (operationId: string) => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse>('/operation');
      if (response.data.success === 1) {
        const list: any[] = Array.isArray(response.data.data)
          ? response.data.data
          : (response.data.data?.records || []);

        const target = decodeURIComponent(String(operationId));
        const targetLower = target.toLowerCase();

        const data =
          list.find((o: any) => String(o.name) === target) ||
          list.find((o: any) => String(o.id) === target) ||
          list.find((o: any) => String(o.name).toLowerCase() === targetLower);

        if (!data) {
          setError(`Operation "${target}" not found`);
          return;
        }

        setFormData({
          name: data.name,
          workstationId: data.workstationId || 0,
          workstation_name: data.workstation_name || '',
          is_corrective_operation: data.is_corrective_operation,
          create_job_card_based_on_batch_size: data.create_job_card_based_on_batch_size,
          quality_inspection_template: data.quality_inspection_template || '',
          batch_size: data.batch_size,
          total_operation_time: data.total_operation_time,
          description: data.description || '',
          docstatus: data.docstatus || 0,
          hour_rate: data.hour_rate || null
        });
        setOriginalData({
          name: data.name,
          workstationId: data.workstationId || 0,
          workstation_name: data.workstation_name || '',
          is_corrective_operation: data.is_corrective_operation,
          create_job_card_based_on_batch_size: data.create_job_card_based_on_batch_size,
          quality_inspection_template: data.quality_inspection_template || '',
          batch_size: data.batch_size,
          total_operation_time: data.total_operation_time,
          description: data.description || '',
          docstatus: data.docstatus || 0,
          hour_rate: data.hour_rate || null
        });
      }
    } catch (err) {
      console.error('Error fetching operation:', err);
      setError('Failed to load operation data');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkstations = async () => {
    try {
      const response = await api.get<ApiResponse>('/workstation');
      if (response.data.success === 1) {
        const data = response.data.data;
        let workstationList: Workstation[] = [];

        if (Array.isArray(data)) {
          workstationList = data;
        } else if (data && data.records) {
          workstationList = data.records;
        } else {
          workstationList = [];
        }

        const activeWorkstations = workstationList.filter(w => w.is_deleted === 0);
        setWorkstations(activeWorkstations);
      }
    } catch (err) {
      console.error('Error fetching workstations:', err);
      setWorkstations([]);
    }
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'name' || name === 'quality_inspection_template') {
      if (value === '' || /^[a-zA-Z\s]*$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name === 'workstationId') {
      const selectedId = parseInt(value);
      const selectedWs = workstations.find(w => w.id === selectedId);
      setFormData(prev => ({
        ...prev,
        workstationId: selectedId,
        workstation_name: selectedWs ? selectedWs.workstation_name : '',
        hour_rate: selectedWs ? selectedWs.hour_rate || null : null
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else if (type === 'text' || type === 'textarea') {
      handleTextInputChange(e as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked ? 1 : 0 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      setError('Operation name is required');
      return;
    }
    if (!/^[a-zA-Z\s]+$/.test(formData.name.trim())) {
      setError('Operation name must contain only alphabets and spaces');
      return;
    }

    if (formData.quality_inspection_template && formData.quality_inspection_template.trim()) {
      if (!/^[a-zA-Z\s]+$/.test(formData.quality_inspection_template.trim())) {
        setError('Quality Inspection Template must contain only alphabets and spaces');
        return;
      }
    }

    if (!formData.workstationId || formData.workstationId === 0) {
      setError('Workstation is required');
      return;
    }
    if (!formData.batch_size || formData.batch_size <= 0) {
      setError('Batch size must be greater than 0');
      return;
    }
    if (formData.total_operation_time === undefined || formData.total_operation_time < 0) {
      setError('Operation time must be 0 or greater');
      return;
    }

    if (mode === 'view') {
      if (!window.confirm('Do you want to save changes to this operation?')) {
        return;
      }
    }

    setSaving(true);
    setLoaderAction('save'); // 🆕 Show global loader
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        name: formData.name,
        workstationId: formData.workstationId,
        workstation_name: formData.workstation_name,
        is_corrective_operation: formData.is_corrective_operation,
        create_job_card_based_on_batch_size: formData.create_job_card_based_on_batch_size,
        quality_inspection_template: formData.quality_inspection_template || '',
        batch_size: formData.batch_size,
        total_operation_time: formData.total_operation_time,
        description: formData.description || '',
        docstatus: formData.docstatus || 0,
        hour_rate: formData.hour_rate || null,
        modified_by: 'Administrator',
        owner: 'Administrator'
      };

      let response;
      if (mode === 'edit' || mode === 'view') {
        response = await api.put('/operation', {
          id: parseInt(id || '0'),
          ...payload
        });
      } else {
        response = await api.post('/operation', payload);
      }

      if (response.data.success === 1) {
        setSuccess(mode === 'new' ? 'Operation created successfully!' : 'Operation updated successfully!');
        setOriginalData({ ...formData });
        setHasChanges(false);

        // 🆕 Show success modal
        setSuccessModal({
          isOpen: true,
          title: 'Success!',
          message:
            mode === 'new'
              ? 'Operation created successfully!'
              : 'Operation updated successfully!',
          details: [
            { label: 'Operation Name', value: formData.name || '—' },
            { label: 'Workstation', value: formData.workstation_name || '—' },
            { label: 'Batch Size', value: formData.batch_size ?? '—' },
            { label: 'Status', value: getStatusLabel(formData.docstatus ?? 0) },
          ],
        });

        // After a create, remember we're now effectively editing this record
        if (mode === 'new') {
          setMode('edit');
        } else if (id) {
          fetchOperation(id);
        }
      } else {
        setError(response.data.message || 'Failed to save operation');
      }
    } catch (err: any) {
      console.error('Error saving operation:', err);
      setError(err.response?.data?.message || 'An error occurred while saving');
    } finally {
      setSaving(false);
      setLoaderAction(null);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete this operation?`)) {
      return;
    }

    try {
      setLoaderAction('delete'); // 🆕 Show global loader
      setLoading(true);
      await api.delete('/operation', { data: { id: parseInt(id || '0') } });
      // 🆕 Show success modal instead of alert
      setSuccessModal({
        isOpen: true,
        title: 'Success!',
        message: 'Operation deleted successfully!',
        details: [
          { label: 'Operation Name', value: formData.name || '—' },
        ],
      });
    } catch (err) {
      console.error('Error deleting operation:', err);
      setError('Failed to delete operation');
    } finally {
      setLoading(false);
      setLoaderAction(null);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        return;
      }
    }
    navigate('/operations');
  };

  const getStatusLabel = (docstatus: number) => {
    switch (docstatus) {
      case 0: return 'Active';
      case 1: return 'Submitted';
      case 2: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (docstatus: number) => {
    switch (docstatus) {
      case 0: return '#10b981';
      case 1: return '#3b82f6';
      case 2: return '#ef4444';
      default: return '#6b7280';
    }
  };

  // 🆕 Close button on the success modal → go to listing.
  const handleSuccessClose = () => {
    setSuccessModal(prev => ({ ...prev, isOpen: false }));
    navigate('/operations');
  };

  // 🆕 View button on the success modal → simply dismiss the modal.
  const handleSuccessView = () => {
    setSuccessModal(prev => ({ ...prev, isOpen: false }));
  };

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit' || mode === 'view';
  const isNewMode = mode === 'new';

  // 🆕 Loader messages based on the current action.
  const loaderMessage =
    loaderAction === 'delete'
      ? 'Deleting Operation...'
      : isNewMode
      ? 'Creating Operation...'
      : 'Saving Operation...';

  const loaderSubtitle =
    loaderAction === 'delete'
      ? 'Please wait while we remove the operation.'
      : isNewMode
      ? 'Please wait while we create the operation.'
      : 'Please wait while we save your changes.';

  if (loading && loaderAction !== 'delete') {
    return (
      <div className={`p-6 max-w-7xl mx-auto ${theme}`}>
        <PageLoader
          message="Loading Setup & Operation Quick Add..."
        />
      </div>
    );
  }

  return (
    <div className={`opf-page ${theme}`}>
      {/* 🆕 Full-screen loader */}
      <LoaderOverlay
        isOpen={loaderAction !== null}
        message={loaderMessage}
        subtitle={loaderSubtitle}
      />

      {/* 🆕 Success modal */}
      <SuccessModal
        isOpen={successModal.isOpen}
        title={successModal.title}
        message={successModal.message}
        details={successModal.details}
        onClose={handleSuccessClose}
        onView={handleSuccessView}
      />

      <div className="opf-container">
        {/* Header */}
        <div className="opf-header">
          <button className="opf-back-btn" onClick={handleCancel}>
            <FaArrowLeft size={18} />
            <span>Back</span>
          </button>
          <div className="opf-header-actions">
            {isViewMode && (
              <button
                className="opf-btn opf-btn-primary"
                onClick={() => navigate(`/operation/${id}/edit`, { state: { operationData: formData } })}
              >
                <FaEdit size={14} />
                Edit
              </button>
            )}
            {isViewMode && (
              <button className="opf-btn opf-btn-danger" onClick={handleDelete}>
                <FaTrash size={14} />
                Delete
              </button>
            )}
            {isEditMode && formData.docstatus !== undefined && (
              <span className="opf-status-badge" style={{ background: getStatusColor(formData.docstatus) }}>
                {getStatusLabel(formData.docstatus)}
              </span>
            )}
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="opf-alert opf-alert-error">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="opf-alert-close">×</button>
          </div>
        )}
        {success && (
          <div className="opf-alert opf-alert-success">
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className="opf-alert-close">×</button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="opf-form">
          <div className="opf-form-grid">
            <div className="opf-form-section">
              <h3>Basic Information</h3>

              <div className="opf-form-group">
                <label htmlFor="name">Operation Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  placeholder="Enter operation name (alphabets only)"
                  required
                  disabled={isViewMode}
                  className={isViewMode ? 'opf-disabled' : ''}
                />
                <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                  Only alphabets and spaces are allowed
                </small>
              </div>

              <div className="opf-form-group">
                <label htmlFor="workstationId">Workstation *</label>
                <select
                  id="workstationId"
                  name="workstationId"
                  value={formData.workstationId || 0}
                  onChange={handleChange}
                  required
                  disabled={isViewMode}
                  className={isViewMode ? 'opf-disabled' : ''}
                >
                  <option value={0}>Select Workstation</option>
                  {workstations
                    .filter(w => w.is_deleted === 0)
                    .map(w => (
                      <option key={w.id} value={w.id}>
                        {w.workstation_name} - {w.workstation_type} (₹{w.hour_rate}/hr)
                      </option>
                    ))
                  }
                </select>
                {workstations.length === 0 && (
                  <small style={{ color: '#ef4444', display: 'block', marginTop: '4px' }}>
                    No active workstations found. Please add a workstation first.
                  </small>
                )}
              </div>

              <div className="opf-form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  placeholder="Enter description"
                  rows={4}
                  disabled={isViewMode}
                  className={isViewMode ? 'opf-disabled' : ''}
                />
              </div>
            </div>

            <div className="opf-form-section">
              <h3>Operation Details</h3>

              <div className="opf-form-row">
                <div className="opf-form-group">
                  <label htmlFor="batch_size">Batch Size *</label>
                  <input
                    type="number"
                    id="batch_size"
                    name="batch_size"
                    value={formData.batch_size || ''}
                    onChange={handleChange}
                    placeholder="Enter batch size"
                    min="1"
                    required
                    disabled={isViewMode}
                    className={isViewMode ? 'opf-disabled' : ''}
                  />
                </div>

                <div className="opf-form-group">
                  <label htmlFor="total_operation_time">Operation Time (min) *</label>
                  <input
                    type="number"
                    id="total_operation_time"
                    name="total_operation_time"
                    value={formData.total_operation_time || ''}
                    onChange={handleChange}
                    placeholder="Enter time in minutes"
                    min="0"
                    step="0.5"
                    required
                    disabled={isViewMode}
                    className={isViewMode ? 'opf-disabled' : ''}
                  />
                </div>
              </div>

              <div className="opf-form-group">
                <label htmlFor="quality_inspection_template">Quality Inspection Template</label>
                <input
                  type="text"
                  id="quality_inspection_template"
                  name="quality_inspection_template"
                  value={formData.quality_inspection_template || ''}
                  onChange={handleChange}
                  placeholder="Enter quality template name (alphabets only)"
                  disabled={isViewMode}
                  className={isViewMode ? 'opf-disabled' : ''}
                />
                <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                  Only alphabets and spaces are allowed
                </small>
              </div>

              <div className="opf-form-checkboxes">
                <div className="opf-checkbox-group">
                  <label className="opf-checkbox-label">
                    <input
                      type="checkbox"
                      name="is_corrective_operation"
                      checked={formData.is_corrective_operation === 1}
                      onChange={handleCheckboxChange}
                      disabled={isViewMode}
                    />
                    <span>Corrective Operation</span>
                  </label>
                  <small className="opf-checkbox-help">
                    Mark if this is a corrective operation
                  </small>
                </div>

                <div className="opf-checkbox-group">
                  <label className="opf-checkbox-label">
                    <input
                      type="checkbox"
                      name="create_job_card_based_on_batch_size"
                      checked={formData.create_job_card_based_on_batch_size === 1}
                      onChange={handleCheckboxChange}
                      disabled={isViewMode}
                    />
                    <span>Create Job Card Based on Batch Size</span>
                  </label>
                  <small className="opf-checkbox-help">
                    Automatically create job cards based on batch size
                  </small>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          {!isViewMode && (
            <div className="opf-form-actions">
              <button type="button" className="opf-btn opf-btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
              <button
                type="submit"
                className="opf-btn opf-btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <FaSpinner className="spinning" size={16} />
                    {isNewMode ? 'Creating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <FaSave size={16} />
                    {isNewMode ? 'Create Operation' : 'Save Changes'}
                  </>
                )}
              </button>
            </div>
          )}

          {/* View Mode Actions with Save button */}
          {isViewMode && (
            <div className="opf-form-actions">
              {hasChanges && (
                <div className="opf-unsaved-warning">
                  <span>⚠️ You have unsaved changes</span>
                </div>
              )}
              <div className="opf-view-actions">
                <button
                  type="submit"
                  className="opf-btn opf-btn-primary"
                  disabled={saving || !hasChanges}
                >
                  {saving ? (
                    <>
                      <FaSpinner className="spinning" size={16} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave size={16} />
                      Save Changes
                    </>
                  )}
                </button>
                {!hasChanges && (
                  <span className="opf-no-changes">No changes to save</span>
                )}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}