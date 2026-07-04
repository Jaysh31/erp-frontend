import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { FaArrowLeft, FaSave, FaSpinner, FaTrash,  FaEdit } from 'react-icons/fa';
import "./OperationForm.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';

interface Operation {
  id: number;
  name: string;
  creation: string;
  modified: string;
  modified_by: string;
  owner: string;
  docstatus: number;
  idx: number;
  workstation: string;
  is_corrective_operation: number;
  create_job_card_based_on_batch_size: number;
  quality_inspection_template: string;
  batch_size: number;
  total_operation_time: number;
  description: string;
}

interface Workstation {
  id: number;
  workstation_name: string;
  workstation_type: string;
  plant_floor: string;
  disabled: number;
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

export default function OperationForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { theme } = useAdminTheme();
  
  const [mode, setMode] = useState<'new' | 'edit' | 'view'>('new');
  const [formData, setFormData] = useState<Partial<Operation>>({
    name: '',
    workstation: '',
    is_corrective_operation: 0,
    create_job_card_based_on_batch_size: 1,
    quality_inspection_template: '',
    batch_size: 100,
    total_operation_time: 0,
    description: '',
    docstatus: 0
  });
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState<Partial<Operation> | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const operationData = location.state?.operationData;

  useEffect(() => {
    // Determine mode from URL and state
    const path = location.pathname;
    if (path.includes('/new')) {
      setMode('new');
    } else if (path.includes('/edit')) {
      setMode('edit');
    } else if (id && path.includes(`/operation/${id}`)) {
      setMode('view');
    }

    // Load operation data
    if (operationData) {
      setFormData({
        name: operationData.name,
        workstation: operationData.workstation,
        is_corrective_operation: operationData.is_corrective_operation,
        create_job_card_based_on_batch_size: operationData.create_job_card_based_on_batch_size,
        quality_inspection_template: operationData.quality_inspection_template || '',
        batch_size: operationData.batch_size,
        total_operation_time: operationData.total_operation_time,
        description: operationData.description || '',
        docstatus: operationData.docstatus || 0
      });
      setOriginalData({
        name: operationData.name,
        workstation: operationData.workstation,
        is_corrective_operation: operationData.is_corrective_operation,
        create_job_card_based_on_batch_size: operationData.create_job_card_based_on_batch_size,
        quality_inspection_template: operationData.quality_inspection_template || '',
        batch_size: operationData.batch_size,
        total_operation_time: operationData.total_operation_time,
        description: operationData.description || '',
        docstatus: operationData.docstatus || 0
      });
    } else if (id && mode !== 'new') {
      fetchOperation(id);
    }

    // Load workstations
    fetchWorkstations();
  }, [id, location.pathname, operationData]);

  useEffect(() => {
    // Check for changes
    if (originalData && mode !== 'new') {
      const hasChanged = JSON.stringify(formData) !== JSON.stringify(originalData);
      setHasChanges(hasChanged);
    }
  }, [formData, originalData, mode]);

  const fetchOperation = async (operationId: string) => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse>(`/operation/${operationId}`);
      if (response.data.success === 1) {
        const data = response.data.data;
        setFormData({
          name: data.name,
          workstation: data.workstation,
          is_corrective_operation: data.is_corrective_operation,
          create_job_card_based_on_batch_size: data.create_job_card_based_on_batch_size,
          quality_inspection_template: data.quality_inspection_template || '',
          batch_size: data.batch_size,
          total_operation_time: data.total_operation_time,
          description: data.description || '',
          docstatus: data.docstatus || 0
        });
        setOriginalData({
          name: data.name,
          workstation: data.workstation,
          is_corrective_operation: data.is_corrective_operation,
          create_job_card_based_on_batch_size: data.create_job_card_based_on_batch_size,
          quality_inspection_template: data.quality_inspection_template || '',
          batch_size: data.batch_size,
          total_operation_time: data.total_operation_time,
          description: data.description || '',
          docstatus: data.docstatus || 0
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
        setWorkstations(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching workstations:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked ? 1 : 0
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'view') {
      // In view mode, confirm before saving
      if (!window.confirm('Do you want to save changes to this operation?')) {
        return;
      }
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        ...formData,
        modified_by: 'Administrator',
        owner: 'Administrator'
      };

      let response;
      if (mode === 'edit' || mode === 'view') {
        // For edit/view, pass id in payload
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
        
        if (mode === 'new') {
          setTimeout(() => {
            navigate('/operations');
          }, 1500);
        } else {
          setTimeout(() => {
            // Refresh the data
            if (id) fetchOperation(id);
          }, 1000);
        }
      } else {
        setError(response.data.message || 'Failed to save operation');
      }
    } catch (err: any) {
      console.error('Error saving operation:', err);
      setError(err.response?.data?.message || 'An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete this operation?`)) {
      return;
    }

    try {
      setLoading(true);
      await api.delete('/operation', { data: { id: parseInt(id || '0') } });
      alert('Operation deleted successfully');
      navigate('/operations');
    } catch (err) {
      console.error('Error deleting operation:', err);
      alert('Failed to delete operation');
    } finally {
      setLoading(false);
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

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit' || mode === 'view';
  const isNewMode = mode === 'new';
  const title = isNewMode ? 'Add New Operation' : isViewMode ? 'View Operation' : 'Edit Operation';

  if (loading) {
    return (
      <div className={`opf-page ${theme}`}>
        <div className="opf-loading">
          <FaSpinner className="spinning" size={32} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`opf-page ${theme}`}>
      <div className="opf-container">
        {/* Header */}
        <div className="opf-header">
          <button className="opf-back-btn" onClick={handleCancel}>
            <FaArrowLeft size={18} />
            <span>Back</span>
          </button>
          <h1>{title}</h1>
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
                  placeholder="Enter operation name"
                  required
                  disabled={isViewMode}
                  className={isViewMode ? 'opf-disabled' : ''}
                />
              </div>

              <div className="opf-form-group">
                <label htmlFor="workstation">Workstation *</label>
                <select
                  id="workstation"
                  name="workstation"
                  value={formData.workstation || ''}
                  onChange={handleChange}
                  required
                  disabled={isViewMode}
                  className={isViewMode ? 'opf-disabled' : ''}
                >
                  <option value="">Select Workstation</option>
                  {workstations
                    .filter(w => w.disabled === 0)
                    .map(w => (
                      <option key={w.id} value={w.workstation_name}>
                        {w.workstation_name} - {w.workstation_type}
                      </option>
                    ))
                  }
                </select>
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
                  placeholder="Enter quality template name"
                  disabled={isViewMode}
                  className={isViewMode ? 'opf-disabled' : ''}
                />
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

          {/* View Mode Actions */}
          {isViewMode && hasChanges && (
            <div className="opf-form-actions opf-unsaved-changes">
              <div className="opf-unsaved-warning">
                <span>⚠️ You have unsaved changes</span>
              </div>
              <button 
                type="submit" 
                className="opf-btn opf-btn-primary"
                disabled={saving}
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
            </div>
          )}
        </form>
      </div>
    </div>
  );
}