import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaSave,
  FaSpinner,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimesCircle,
  FaBuilding,
  FaBoxes,
  FaUsers,
  FaUserTie,
  FaChevronDown,
  FaChevronRight,
  FaPlus,
  FaCheckSquare,
  FaHome,
  FaPhone,
  FaMobileAlt,
  FaMapMarkerAlt,
  FaCity,
  FaGlobe,
  FaMapPin,
  FaTruck,
  FaEnvelope,
} from 'react-icons/fa';
import "./WarehouseForm.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';
import toast from "react-hot-toast";

interface ValidationError {
  field: string;
  label: string;
  message: string;
}

export default function WarehouseForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  
  const isNew = id === "new" || !id;
  const isEditMode = !isNew;

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    warehouseName: "",
    company: "",
    isRejectedWarehouse: false,
    parentWarehouse: "",
    isGroupWarehouse: false,
    account: "",
    customer: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    stateProvince: "",
    pin: "",
    phoneNo: "",
    mobileNo: "",
    warehouseType: "",
    transit: false,
    emailId: "",
  });

  const [isContactInfoExpanded, setIsContactInfoExpanded] = useState(true);
  const [isTransitExpanded, setIsTransitExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [warehouseId, setWarehouseId] = useState<number | null>(null);

  // Fetch warehouse data if editing
  useEffect(() => {
    const fetchWarehouseData = async () => {
      if (!isNew && id) {
        setLoading(true);
        try {
          const response = await api.get(`/warehouse/${id}`);
          if (response.data && response.data.success === 1) {
            const data = response.data.data;
            setWarehouseId(data.id);
            setForm({
              warehouseName: data.warehouse_name || "",
              company: data.company || "",
              isRejectedWarehouse: data.is_rejected_warehouse === 1,
              parentWarehouse: data.parent_warehouse || "",
              isGroupWarehouse: data.is_group === 1,
              account: data.account || "",
              customer: data.customer || "",
              addressLine1: data.address_line_1 || "",
              addressLine2: data.address_line_2 || "",
              city: data.city || "",
              stateProvince: data.state || "",
              pin: data.pin || "",
              phoneNo: data.phone_no || "",
              mobileNo: data.mobile_no || "",
              warehouseType: data.warehouse_type || "",
              transit: data.default_in_transit_warehouse === "1",
              emailId: data.email_id || "",
            });
          } else {
            toast.error('Failed to load warehouse data');
          }
        } catch (err: any) {
          console.error('Error fetching warehouse:', err);
          toast.error(err.response?.data?.message || 'Failed to load warehouse data');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchWarehouseData();
  }, [isNew, id]);

  // ─── Validation Functions ──────────────────────────────────────────────

  // Only alphabets and spaces (for name, city, state, warehouse type)
  const isValidAlphabetOnly = (value: string): boolean => {
    return /^[A-Za-z\s]*$/.test(value);
  };

  // Only alphabets and spaces with dot (for state/province)
  const isValidState = (value: string): boolean => {
    return /^[A-Za-z\s.]*$/.test(value);
  };

  // Exactly 10 digits (for mobile and phone)
  const isValidPhone = (value: string): boolean => {
    return /^\d{10}$/.test(value);
  };

  // Valid email format
  const isValidEmail = (value: string): boolean => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
  };

  // Exactly 6 digits (for PIN)
  const isValidPin = (value: string): boolean => {
    return /^\d{6}$/.test(value);
  };

  // ─── Validation ──────────────────────────────────────────────────────
  const getAllValidationErrors = (): ValidationError[] => {
    const allErrors: ValidationError[] = [];

    // Warehouse Name - Required (only for new)
    if (isNew && !form.warehouseName.trim()) {
      allErrors.push({ field: 'warehouseName', label: 'Warehouse Name', message: 'Warehouse name is required' });
    }
    if (isNew && form.warehouseName.trim() && !isValidAlphabetOnly(form.warehouseName.trim())) {
      allErrors.push({ field: 'warehouseName', label: 'Warehouse Name', message: 'Warehouse name should contain only alphabets and spaces' });
    }

    // Company - Required
    if (!form.company.trim()) {
      allErrors.push({ field: 'company', label: 'Company', message: 'Company is required' });
    }
    if (form.company.trim() && !isValidAlphabetOnly(form.company.trim())) {
      allErrors.push({ field: 'company', label: 'Company', message: 'Company should contain only alphabets and spaces' });
    }

    // Parent Warehouse - Alphabets only
    if (form.parentWarehouse.trim() && !isValidAlphabetOnly(form.parentWarehouse.trim())) {
      allErrors.push({ field: 'parentWarehouse', label: 'Parent Warehouse', message: 'Parent warehouse should contain only alphabets and spaces' });
    }

    // Phone No - Exactly 10 digits
    if (form.phoneNo.trim() && !isValidPhone(form.phoneNo.trim())) {
      allErrors.push({ field: 'phoneNo', label: 'Phone No', message: 'Phone number must be exactly 10 digits' });
    }

    // Mobile No - Exactly 10 digits
    if (form.mobileNo.trim() && !isValidPhone(form.mobileNo.trim())) {
      allErrors.push({ field: 'mobileNo', label: 'Mobile No', message: 'Mobile number must be exactly 10 digits' });
    }

    // Email - Valid email format
    if (form.emailId.trim() && !isValidEmail(form.emailId.trim())) {
      allErrors.push({ field: 'emailId', label: 'Email ID', message: 'Please enter a valid email address' });
    }

    // PIN - Exactly 6 digits
    if (form.pin.trim() && !isValidPin(form.pin.trim())) {
      allErrors.push({ field: 'pin', label: 'PIN', message: 'PIN code must be exactly 6 digits' });
    }

    // City - Alphabets only
    if (form.city.trim() && !isValidAlphabetOnly(form.city.trim())) {
      allErrors.push({ field: 'city', label: 'City', message: 'City should contain only alphabets and spaces' });
    }

    // State/Province - Alphabets, spaces and dot allowed
    if (form.stateProvince.trim() && !isValidState(form.stateProvince.trim())) {
      allErrors.push({ field: 'stateProvince', label: 'State/Province', message: 'State should contain only alphabets, spaces and dots' });
    }

    // Warehouse Type - Alphabets only
    if (form.warehouseType.trim() && !isValidAlphabetOnly(form.warehouseType.trim())) {
      allErrors.push({ field: 'warehouseType', label: 'Warehouse Type', message: 'Warehouse type should contain only alphabets and spaces' });
    }

    return allErrors;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrorsList = getAllValidationErrors();
    if (validationErrorsList.length > 0) {
      setValidationErrors(validationErrorsList);
      setShowValidationSummary(true);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const payload: any = {};

      if (!isNew && warehouseId) {
        payload.id = warehouseId;
      }

      payload.warehouse_name = form.warehouseName.trim();
      payload.company = form.company.trim() || null;
      payload.parent_warehouse = form.parentWarehouse.trim() || null;
      payload.warehouse_type = form.warehouseType.trim() || null;
      payload.city = form.city.trim() || null;
      payload.state = form.stateProvince.trim() || null;
      payload.phone_no = form.phoneNo.trim() || null;
      payload.mobile_no = form.mobileNo.trim() || null;
      payload.email_id = form.emailId.trim() || null;
      payload.address_line_1 = form.addressLine1.trim() || null;
      payload.address_line_2 = form.addressLine2.trim() || null;
      payload.pin = form.pin.trim() || null;
      payload.account = form.account.trim() || null;
      payload.customer = form.customer.trim() || null;
      
      payload.is_rejected_warehouse = form.isRejectedWarehouse ? 1 : 0;
      payload.is_group = form.isGroupWarehouse ? 1 : 0;
      payload.default_in_transit_warehouse = form.transit ? 1 : 0;

      let response;
      if (isNew) {
        response = await api.post('/warehouse', payload);
      } else {
        response = await api.put('/warehouse', payload);
      }

      if (response.data && response.data.success === 1) {
        toast.success(isNew ? 'Warehouse created successfully!' : 'Warehouse updated successfully!');
        navigate('/warehouse');
      } else {
        toast.error(response.data?.message || 'Failed to save warehouse');
        setErrors({ submit: response.data?.message || 'Failed to save warehouse' });
      }
    } catch (err: any) {
      console.error('Error saving warehouse:', err);
      
      if (err.response) {
        if (err.response.status === 409) {
          toast.error('A warehouse with this name already exists');
          setErrors({ warehouseName: 'A warehouse with this name already exists' });
        } else if (err.response.status === 400) {
          toast.error(err.response.data?.message || 'Invalid data provided');
          setErrors({ submit: err.response.data?.message || 'Invalid data provided' });
        } else {
          toast.error(err.response.data?.message || 'Failed to save warehouse');
          setErrors({ submit: err.response.data?.message || 'Failed to save warehouse' });
        }
      } else if (err.request) {
        toast.error('Network error. Please check your connection.');
        setErrors({ submit: 'Network error. Please check your connection.' });
      } else {
        toast.error('An unexpected error occurred. Please try again.');
        setErrors({ submit: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const hasErrors = getAllValidationErrors().length > 0;

  // Helper to check if a field has error
  const hasFieldError = (fieldName: string): boolean => {
    return validationErrors.some(err => err.field === fieldName);
  };

  // Get error message for a field
  const getFieldError = (fieldName: string): string => {
    const error = validationErrors.find(err => err.field === fieldName);
    return error ? error.message : '';
  };

  if (loading) {
    return (
      <div className={`wf-page ${theme}`}>
        <div className="wf-inner">
          <div className="wf-loading">
            <FaSpinner className="spinning" size={40} />
            <p>Loading warehouse data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`wf-page ${theme}`}>
      <div className="wf-inner">

        {/* ─── Validation Summary Modal ────────────────────────────── */}
        {showValidationSummary && validationErrors.length > 0 && (
          <div className="modal-overlay" onClick={() => setShowValidationSummary(false)}>
            <div className="validation-summary-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  <FaExclamationTriangle /> Missing or Invalid Fields
                </h2>
                <button className="modal-close" onClick={() => setShowValidationSummary(false)}>×</button>
              </div>
              <div className="modal-body">
                <p className="modal-description">
                  Please fix the following issues before submitting:
                </p>
                <div className="validation-errors-list">
                  {validationErrors.map((error, idx) => (
                    <div key={idx} className="validation-error-item">
                      <div className="error-header">
                        <FaTimesCircle className="error-icon" />
                        <strong>{error.label}</strong>
                      </div>
                      <div className="error-message">{error.message}</div>
                    </div>
                  ))}
                </div>
                <div className="validation-tip">
                  <FaInfoCircle className="tip-icon" />
                  Please fix the errors above before submitting
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowValidationSummary(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Header ────────────────────────────────────────────────── */}
        <div className="wf-header">
          <button onClick={() => navigate('/warehouse')} className="back-btn">
            <FaArrowLeft size={9} /> Back
          </button>
          <div className="header-title">
            <h1>{isNew ? 'Add New Warehouse' : `Edit: ${form.warehouseName || 'Warehouse'}`}</h1>
          </div>
          {hasErrors && (
            <div className="error-badge" onClick={() => setShowValidationSummary(true)} style={{ cursor: 'pointer' }}>
              <FaExclamationTriangle size={12} />
              {getAllValidationErrors().length} field{getAllValidationErrors().length !== 1 ? 's' : ''} need attention
            </div>
          )}
        </div>

        <form onSubmit={handleSave}>

          {/* ─── Main Form Card ────────────────────────────────────────── */}
          <div className="wf-card">

            {/* Warehouse Detail */}
            <span className="wf-section-title">Warehouse Detail</span>

            {isNew && (
              <div className="wf-field">
                <label className="wf-label">
                  <FaBuilding className="wf-label-icon" />Warehouse Name <span className="wf-required">*</span>
                </label>
                <input
                  type="text"
                  value={form.warehouseName}
                  onChange={(e) => {
                    // Only allow alphabets and spaces
                    const value = e.target.value.replace(/[^A-Za-z\s]/g, '');
                    setForm({ ...form, warehouseName: value });
                    if (errors.warehouseName) setErrors({ ...errors, warehouseName: '' });
                  }}
                  className={`form-field${hasFieldError('warehouseName') ? ' field-error' : ''}`}
                  placeholder="Enter warehouse name"
                  maxLength={50}
                />
                {hasFieldError('warehouseName') && <span className="wf-error-msg"><FaExclamationCircle size={10} />{getFieldError('warehouseName')}</span>}
              </div>
            )}

            {!isNew && (
              <div className="wf-field">
                <label className="wf-label">
                  <FaBuilding className="wf-label-icon" />Warehouse Name
                </label>
                <input
                  type="text"
                  value={form.warehouseName}
                  disabled
                  className="form-field"
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
                <p className="wf-field-hint">Warehouse name cannot be changed</p>
              </div>
            )}

            <div className="wf-grid-2">
              <div className="wf-field">
                <label className="wf-label">
                  <FaUsers className="wf-label-icon" />Company <span className="wf-required">*</span>
                </label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => {
                    // Only allow alphabets and spaces
                    const value = e.target.value.replace(/[^A-Za-z\s]/g, '');
                    setForm({ ...form, company: value });
                    if (errors.company) setErrors({ ...errors, company: '' });
                  }}
                  className={`form-field${hasFieldError('company') ? ' field-error' : ''}`}
                  placeholder="Enter company name"
                  maxLength={50}
                />
                {hasFieldError('company') && <span className="wf-error-msg"><FaExclamationCircle size={10} />{getFieldError('company')}</span>}
              </div>

              <div className="wf-field">
                <label className="wf-label">
                  <FaBoxes className="wf-label-icon" />Parent Warehouse
                </label>
                <input
                  type="text"
                  value={form.parentWarehouse}
                  onChange={(e) => {
                    // Only allow alphabets and spaces
                    const value = e.target.value.replace(/[^A-Za-z\s]/g, '');
                    setForm({ ...form, parentWarehouse: value });
                    if (errors.parentWarehouse) setErrors({ ...errors, parentWarehouse: '' });
                  }}
                  className={`form-field${hasFieldError('parentWarehouse') ? ' field-error' : ''}`}
                  placeholder="Enter parent warehouse"
                  maxLength={50}
                />
                {hasFieldError('parentWarehouse') && <span className="wf-error-msg"><FaExclamationCircle size={10} />{getFieldError('parentWarehouse')}</span>}
              </div>
            </div>

            <div className="wf-field-check">
              <input
                type="checkbox"
                id="isRejectedWarehouse"
                checked={form.isRejectedWarehouse}
                onChange={(e) => setForm({ ...form, isRejectedWarehouse: e.target.checked })}
                className="wf-checkbox"
              />
              <div>
                <label htmlFor="isRejectedWarehouse" className="wf-check-label">
                  <FaCheckSquare className="wf-check-icon" /> Is Rejected Warehouse
                </label>
                <p className="wf-check-hint">If yes, then this warehouse will be used to store rejected materials</p>
              </div>
            </div>

            <div className="wf-field-check">
              <input
                type="checkbox"
                id="isGroupWarehouse"
                checked={form.isGroupWarehouse}
                onChange={(e) => setForm({ ...form, isGroupWarehouse: e.target.checked })}
                className="wf-checkbox"
              />
              <div>
                <label htmlFor="isGroupWarehouse" className="wf-check-label">
                  <FaCheckSquare className="wf-check-icon" /> Is Group Warehouse
                </label>
                <p className="wf-check-hint">Enable if this is a group warehouse</p>
              </div>
            </div>

            <div className="wf-divider" />

            {/* Address and Contact Section */}
            <span className="wf-section-title">Address and Contact</span>

            {/* Address Line 1 & 2 */}
            <div className="wf-grid-2">
              <div className="wf-field">
                <label className="wf-label">
                  <FaMapMarkerAlt className="wf-label-icon" />Address Line 1
                </label>
                <input
                  type="text"
                  value={form.addressLine1}
                  onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                  className="form-field"
                  placeholder="Enter address line 1"
                />
              </div>

              <div className="wf-field">
                <label className="wf-label">
                  <FaMapMarkerAlt className="wf-label-icon" />Address Line 2
                </label>
                <input
                  type="text"
                  value={form.addressLine2}
                  onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
                  className="form-field"
                  placeholder="Enter address line 2"
                />
              </div>
            </div>

            {/* Warehouse Contact Info Collapsible */}
            <div className="wf-collapsible" style={{ marginTop: '8px' }}>
              <button 
                type="button"
                className="wf-collapsible-btn" 
                onClick={() => setIsContactInfoExpanded(!isContactInfoExpanded)}
              >
                <span className="wf-collapsible-icon">
                  {isContactInfoExpanded ? <FaChevronDown /> : <FaChevronRight />}
                </span>
                Warehouse Contact Info
              </button>
              {isContactInfoExpanded && (
                <div className="wf-collapsible-content">
                  <div className="wf-grid-2">
                    <div className="wf-field">
                      <label className="wf-label">
                        <FaPhone className="wf-label-icon" />Phone No
                      </label>
                      <input
                        type="text"
                        value={form.phoneNo}
                        onChange={(e) => {
                          // Only allow digits, max 10
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setForm({ ...form, phoneNo: value });
                          if (errors.phoneNo) setErrors({ ...errors, phoneNo: '' });
                        }}
                        className={`form-field${hasFieldError('phoneNo') ? ' field-error' : ''}`}
                        placeholder="Enter 10 digit phone number"
                        maxLength={10}
                      />
                      {hasFieldError('phoneNo') && <span className="wf-error-msg"><FaExclamationCircle size={10} />{getFieldError('phoneNo')}</span>}
                    </div>

                    <div className="wf-field">
                      <label className="wf-label">
                        <FaMobileAlt className="wf-label-icon" />Mobile No
                      </label>
                      <input
                        type="text"
                        value={form.mobileNo}
                        onChange={(e) => {
                          // Only allow digits, max 10
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setForm({ ...form, mobileNo: value });
                          if (errors.mobileNo) setErrors({ ...errors, mobileNo: '' });
                        }}
                        className={`form-field${hasFieldError('mobileNo') ? ' field-error' : ''}`}
                        placeholder="Enter 10 digit mobile number"
                        maxLength={10}
                      />
                      {hasFieldError('mobileNo') && <span className="wf-error-msg"><FaExclamationCircle size={10} />{getFieldError('mobileNo')}</span>}
                    </div>
                  </div>

                  <div className="wf-grid-2">
                    <div className="wf-field">
                      <label className="wf-label">
                        <FaEnvelope className="wf-label-icon" />Email ID
                      </label>
                      <input
                        type="email"
                        value={form.emailId}
                        onChange={(e) => {
                          setForm({ ...form, emailId: e.target.value });
                          if (errors.emailId) setErrors({ ...errors, emailId: '' });
                        }}
                        className={`form-field${hasFieldError('emailId') ? ' field-error' : ''}`}
                        placeholder="Enter email address"
                      />
                      {hasFieldError('emailId') && <span className="wf-error-msg"><FaExclamationCircle size={10} />{getFieldError('emailId')}</span>}
                    </div>

                    <div className="wf-field">
                      <label className="wf-label">
                        <FaMapPin className="wf-label-icon" />PIN
                      </label>
                      <input
                        type="text"
                        value={form.pin}
                        onChange={(e) => {
                          // Only allow digits, max 6
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setForm({ ...form, pin: value });
                          if (errors.pin) setErrors({ ...errors, pin: '' });
                        }}
                        className={`form-field${hasFieldError('pin') ? ' field-error' : ''}`}
                        placeholder="Enter 6 digit PIN code"
                        maxLength={6}
                      />
                      {hasFieldError('pin') && <span className="wf-error-msg"><FaExclamationCircle size={10} />{getFieldError('pin')}</span>}
                    </div>
                  </div>

                  <div className="wf-grid-2">
                    <div className="wf-field">
                      <label className="wf-label">
                        <FaCity className="wf-label-icon" />City
                      </label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => {
                          // Only allow alphabets and spaces
                          const value = e.target.value.replace(/[^A-Za-z\s]/g, '');
                          setForm({ ...form, city: value });
                          if (errors.city) setErrors({ ...errors, city: '' });
                        }}
                        className={`form-field${hasFieldError('city') ? ' field-error' : ''}`}
                        placeholder="Enter city"
                        maxLength={50}
                      />
                      {hasFieldError('city') && <span className="wf-error-msg"><FaExclamationCircle size={10} />{getFieldError('city')}</span>}
                    </div>

                    <div className="wf-field">
                      <label className="wf-label">
                        <FaGlobe className="wf-label-icon" />State/Province
                      </label>
                      <input
                        type="text"
                        value={form.stateProvince}
                        onChange={(e) => {
                          // Only allow alphabets, spaces and dots
                          const value = e.target.value.replace(/[^A-Za-z\s.]/g, '');
                          setForm({ ...form, stateProvince: value });
                          if (errors.stateProvince) setErrors({ ...errors, stateProvince: '' });
                        }}
                        className={`form-field${hasFieldError('stateProvince') ? ' field-error' : ''}`}
                        placeholder="Enter state/province"
                        maxLength={50}
                      />
                      {hasFieldError('stateProvince') && <span className="wf-error-msg"><FaExclamationCircle size={10} />{getFieldError('stateProvince')}</span>}
                    </div>
                  </div>

                  <div className="wf-field">
                    <label className="wf-label">
                      <FaBoxes className="wf-label-icon" />Warehouse Type
                    </label>
                    <input
                      type="text"
                      value={form.warehouseType}
                      onChange={(e) => {
                        // Only allow alphabets and spaces
                        const value = e.target.value.replace(/[^A-Za-z\s]/g, '');
                        setForm({ ...form, warehouseType: value });
                        if (errors.warehouseType) setErrors({ ...errors, warehouseType: '' });
                      }}
                      className={`form-field${hasFieldError('warehouseType') ? ' field-error' : ''}`}
                      placeholder="Enter warehouse type"
                      maxLength={50}
                    />
                    {hasFieldError('warehouseType') && <span className="wf-error-msg"><FaExclamationCircle size={10} />{getFieldError('warehouseType')}</span>}
                  </div>

                  <div className="wf-field-check">
                    <input
                      type="checkbox"
                      id="transit"
                      checked={form.transit}
                      onChange={(e) => setForm({ ...form, transit: e.target.checked })}
                      className="wf-checkbox"
                    />
                    <div>
                      <label htmlFor="transit" className="wf-check-label">
                        <FaTruck className="wf-check-icon" /> Default In Transit Warehouse
                      </label>
                      <p className="wf-check-hint">Enable if this warehouse is used for transit</p>
                    </div>
                  </div>

                  <div className="wf-empty-state">No contacts added yet.</div>
                  <button type="button" className="wf-link-btn">
                    <FaPlus size={10} /> New Contact
                  </button>
                </div>
              )}
            </div>

            <div className="wf-divider" />

            {/* Transit Collapsible */}
            <div className="wf-collapsible">
              <button 
                type="button"
                className="wf-collapsible-btn" 
                onClick={() => setIsTransitExpanded(!isTransitExpanded)}
              >
                <span className="wf-collapsible-icon">
                  {isTransitExpanded ? <FaChevronDown /> : <FaChevronRight />}
                </span>
                Transit
              </button>
              {isTransitExpanded && (
                <div className="wf-collapsible-content">
                  <div className="wf-field-check">
                    <input
                      type="checkbox"
                      id="transitSection"
                      checked={form.transit}
                      onChange={(e) => setForm({ ...form, transit: e.target.checked })}
                      className="wf-checkbox"
                    />
                    <div>
                      <label htmlFor="transitSection" className="wf-check-label">
                        <FaTruck className="wf-check-icon" /> Default In Transit Warehouse
                      </label>
                      <p className="wf-check-hint">Enable if this warehouse is used for transit</p>
                    </div>
                  </div>
                  <div className="wf-empty-state">No transit configurations added yet.</div>
                  <button type="button" className="wf-link-btn">
                    <FaPlus size={10} /> Add Transit
                  </button>
                </div>
              )}
            </div>

            <div className="wf-divider" />

            {/* Account */}
            <span className="wf-section-title">Account</span>
            <div className="wf-field">
              <label className="wf-label">
                <FaHome className="wf-label-icon" />Account
              </label>
              <input
                type="text"
                value={form.account}
                onChange={(e) => setForm({ ...form, account: e.target.value })}
                className="form-field"
                placeholder="If blank, parent Warehouse Account or company default will be considered in transactions"
              />
              <p className="wf-field-hint">
                If blank, parent Warehouse Account or company default will be considered in transactions
              </p>
            </div>

            <div className="wf-divider" />

            {/* Customer */}
            <span className="wf-section-title">Customer</span>
            <div className="wf-field">
              <label className="wf-label">
                <FaUserTie className="wf-label-icon" />Customer
              </label>
              <input
                type="text"
                value={form.customer}
                onChange={(e) => setForm({ ...form, customer: e.target.value })}
                className="form-field"
                placeholder="Only to be used for Subcontracting Inward"
              />
              <p className="wf-field-hint">Only to be used for Subcontracting Inward</p>
            </div>

          
          </div>

          {/* ─── Footer ────────────────────────────────────────────────── */}
          <div className="wf-footer">
            <button
              type="button"
              onClick={() => navigate('/warehouse')}
              className="cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="submit-btn"
            >
              {submitting && <FaSpinner className="spinning" />}
              <FaSave size={12} />
              {isEditMode ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}