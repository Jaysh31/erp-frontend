import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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

interface WarehouseData {
  id: number;
  warehouse_name: string;
  company: string | null;
  parent_warehouse: string | null;
  warehouse_type: string | null;
  city: string | null;
  state: string | null;
  email_id: string | null;
  phone_no: string | null;
  disabled: number;
}

export default function WarehouseForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useAdminTheme();
  
  const isNew = id === "new" || !id;
  const warehouseName = isNew ? "New Warehouse" : decodeURIComponent(id || "");
  const isEditMode = !isNew;

  // Get warehouse data from location state if available
  const warehouseData = location.state?.warehouseData as WarehouseData | undefined;

  // const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    warehouseName: "",
    company: "",
    isRejectedWarehouse: false,
    parentWarehouse: "",
    isGroupWarehouse: false,
    account: "",
    customer: "",
    // Address and Contact fields
    addressLine1: "",
    addressLine2: "",
    city: "",
    stateProvince: "",
    pin: "",
    phoneNo: "",
    mobileNo: "",
    warehouseType: "",
    transit: false,
  });

  // const [comment, setComment] = useState("");
  const [isContactInfoExpanded, setIsContactInfoExpanded] = useState(true);
  const [isTransitExpanded, setIsTransitExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // Load data if editing
  useEffect(() => {
    if (!isNew && warehouseData) {
      setForm({
        warehouseName: warehouseData.warehouse_name || "",
        company: warehouseData.company || "",
        isRejectedWarehouse: false,
        parentWarehouse: warehouseData.parent_warehouse || "",
        isGroupWarehouse: false,
        account: "",
        customer: "",
        addressLine1: "",
        addressLine2: "",
        city: warehouseData.city || "",
        stateProvince: warehouseData.state || "",
        pin: "",
        phoneNo: warehouseData.phone_no || "",
        mobileNo: "",
        warehouseType: warehouseData.warehouse_type || "",
        transit: false,
      });
    } else if (isNew) {
      setForm({
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
      });
    }
  }, [isNew, warehouseData]);

  // ─── Validation ──────────────────────────────────────────────────────
  const getAllValidationErrors = (): ValidationError[] => {
    const allErrors: ValidationError[] = [];

    if (isNew && !form.warehouseName.trim()) {
      allErrors.push({ field: 'warehouseName', label: 'Warehouse Name', message: 'Warehouse name is required' });
    }
    if (!form.company.trim()) {
      allErrors.push({ field: 'company', label: 'Company', message: 'Company is required' });
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
      // Prepare payload for API - only send fields that exist in the form
      const payload: any = {
        warehouse_name: form.warehouseName.trim(),
        company: form.company.trim() || null,
        parent_warehouse: form.parentWarehouse.trim() || null,
        warehouse_type: form.warehouseType.trim() || null,
        city: form.city.trim() || null,
        state: form.stateProvince.trim() || null,
        phone_no: form.phoneNo.trim() || null,
        disabled: 0,
        // Additional fields from the API spec
        operation: null,
        status: "Pending",
        completed_qty: 0,
        process_loss_qty: 0,
        pending_qty: 0,
        bom: null,
        workstation_type: null,
        workstation: null,
        sequence_id: 1,
        quality_inspection_required: 0,
        bom_no: null,
        finished_good: null,
        is_subcontracted: 0,
        skip_material_transfer: 0,
        backflush_from_wip_warehouse: 0,
        source_warehouse: null,
        wip_warehouse: null,
        fg_warehouse: null,
        description: null,
        planned_start_time: null,
        hour_rate: 0,
        time_in_mins: 0,
        planned_end_time: null,
        batch_size: 0,
        planned_operating_cost: 0,
        actual_start_time: null,
        actual_operation_time: 0,
        actual_end_time: null,
        actual_operating_cost: 0,
        parent: null,
        parentfield: null,
        parenttype: null,
        modified_by: "Administrator",
        owner: "Administrator",
        docstatus: 0,
        idx: 1
      };

      // Only add is_group if it's a group warehouse
      if (form.isGroupWarehouse) {
        // Note: The API might not have is_group field, but we keep it for UI state
        // If the API has this field, uncomment below
        // payload.is_group = 1;
      }

      // If it's a rejected warehouse
      if (form.isRejectedWarehouse) {
        // Note: The API might not have is_rejected field
        // If the API has this field, uncomment below
        // payload.is_rejected = 1;
      }

      let response;
      if (isNew) {
        response = await api.post('/warehouse', payload);
      } else {
        // For update, you might need to use PUT or PATCH
        response = await api.put(`/warehouse/${id}`, payload);
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

  return (
    <div className={`wf-page ${theme}`}>
      <div className="wf-inner">

        {/* ─── Validation Summary Modal ────────────────────────────── */}
        {showValidationSummary && validationErrors.length > 0 && (
          <div className="modal-overlay" onClick={() => setShowValidationSummary(false)}>
            <div className="validation-summary-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  <FaExclamationTriangle /> Missing Required Fields
                </h2>
                <button className="modal-close" onClick={() => setShowValidationSummary(false)}>×</button>
              </div>
              <div className="modal-body">
                <p className="modal-description">
                  Please fill in the following required fields before submitting:
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
            <h1>{isNew ? 'Add New Warehouse' : `Edit: ${warehouseName}`}</h1>
          </div>
          {hasErrors && (
            <div className="error-badge">
              <FaExclamationTriangle size={12} />
              {getAllValidationErrors().length} missing field{getAllValidationErrors().length !== 1 ? 's' : ''}
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
                  onChange={(e) => setForm({ ...form, warehouseName: e.target.value })}
                  className={`form-field${errors.warehouseName ? ' field-error' : ''}`}
                  placeholder="Enter warehouse name"
                />
                {errors.warehouseName && <span className="wf-error-msg"><FaExclamationCircle size={10} />{errors.warehouseName}</span>}
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
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className={`form-field${errors.company ? ' field-error' : ''}`}
                  placeholder="Enter company name"
                />
                {errors.company && <span className="wf-error-msg"><FaExclamationCircle size={10} />{errors.company}</span>}
              </div>

              <div className="wf-field">
                <label className="wf-label">
                  <FaBoxes className="wf-label-icon" />Parent Warehouse
                </label>
                <input
                  type="text"
                  value={form.parentWarehouse}
                  onChange={(e) => setForm({ ...form, parentWarehouse: e.target.value })}
                  className="form-field"
                  placeholder="Select parent warehouse"
                />
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

            {/* New Address button and empty state */}
            <div className="wf-empty-state">No address added yet.</div>
            <button type="button" className="wf-link-btn" style={{ marginBottom: '16px' }}>
              <FaPlus size={10} /> New Address
            </button>

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
                        onChange={(e) => setForm({ ...form, phoneNo: e.target.value })}
                        className="form-field"
                        placeholder="Enter phone number"
                      />
                    </div>

                    <div className="wf-field">
                      <label className="wf-label">
                        <FaMobileAlt className="wf-label-icon" />Mobile No
                      </label>
                      <input
                        type="text"
                        value={form.mobileNo}
                        onChange={(e) => setForm({ ...form, mobileNo: e.target.value })}
                        className="form-field"
                        placeholder="Enter mobile number"
                      />
                    </div>
                  </div>

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

                  <div className="wf-grid-2">
                    <div className="wf-field">
                      <label className="wf-label">
                        <FaCity className="wf-label-icon" />City
                      </label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        className="form-field"
                        placeholder="Enter city"
                      />
                    </div>

                    <div className="wf-field">
                      <label className="wf-label">
                        <FaGlobe className="wf-label-icon" />State/Province
                      </label>
                      <input
                        type="text"
                        value={form.stateProvince}
                        onChange={(e) => setForm({ ...form, stateProvince: e.target.value })}
                        className="form-field"
                        placeholder="Enter state/province"
                      />
                    </div>
                  </div>

                  <div className="wf-grid-2">
                    <div className="wf-field">
                      <label className="wf-label">
                        <FaMapPin className="wf-label-icon" />PIN
                      </label>
                      <input
                        type="text"
                        value={form.pin}
                        onChange={(e) => setForm({ ...form, pin: e.target.value })}
                        className="form-field"
                        placeholder="Enter PIN code"
                      />
                    </div>

                    <div className="wf-field">
                      <label className="wf-label">
                        <FaBoxes className="wf-label-icon" />Warehouse Type
                      </label>
                      <input
                        type="text"
                        value={form.warehouseType}
                        onChange={(e) => setForm({ ...form, warehouseType: e.target.value })}
                        className="form-field"
                        placeholder="Enter warehouse type"
                      />
                    </div>
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
                        <FaTruck className="wf-check-icon" /> Transit
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
                        <FaTruck className="wf-check-icon" /> Transit
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