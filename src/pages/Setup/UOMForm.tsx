import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  FaArrowLeft,
  FaSave,
  FaSpinner,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimesCircle,
  FaRuler,
  FaTag,
  FaList,
  FaHashtag,
  FaAlignLeft,
  FaCheckSquare,
} from 'react-icons/fa';
import "./UOMForm.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface ValidationError {
  field: string;
  label: string;
  message: string;
}

export default function UOMForm() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const isNew = id === "new";
  const uomName = isNew ? "New UOM" : decodeURIComponent(id || "");
  const isEditMode = Boolean(id && !isNew);

  // Get data passed from list page (if available)
  const passedData = (location.state as any)?.uomData;
  
  // ─── View Mode Flag ──────────────────────────────────────────────────
  const isViewMode = (location.state as any)?.viewMode === true;

  const [form, setForm] = useState({
    name: isNew ? "" : (passedData?.uom_name || decodeURIComponent(id || "")),
    category: passedData?.category || "Electric Current",
    symbol: passedData?.symbol || "",
    commonCode: passedData?.common_code || "",
    description: passedData?.description || "",
    enabled: passedData ? passedData.enabled === 1 : true,
    mustBeWholeNumber: passedData ? passedData.must_be_whole_number === 1 : false,
  });

  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // ─── Fetch Existing UOM Data on Load ─────────────────────────────────
  useEffect(() => {
    if (!isNew && id) {
      fetchUOMData(id);
    }
  }, [id, isNew]);

  const fetchUOMData = async (uomId: string) => {
    setLoading(true);
    try {
      // Use the shared Axios client so the app's configured base URL and
      // authentication/interceptors are applied consistently.
      const response = await api.get(`/uom/${encodeURIComponent(uomId)}`);
      const responseBody = response?.data;

      if (responseBody?.success === false || responseBody?.success === 0) {
        throw new Error(responseBody?.message || 'Failed to fetch UOM data');
      }

      const rawData = responseBody?.data ?? responseBody;
      const data = Array.isArray(rawData)
        ? rawData[0]
        : (rawData?.record ?? rawData?.uom ?? rawData);

      if (!data || typeof data !== 'object') {
        throw new Error('UOM record was not found');
      }

      const enabledValue = data.enabled;
      const wholeNumberValue = data.must_be_whole_number ?? data.mustBeWholeNumber;

      setForm({
        name: data.uom_name || data.name || uomId,
        category: data.category || 'Electric Current',
        symbol: data.symbol || '',
        commonCode: data.common_code || data.commonCode || '',
        description: data.description || '',
        enabled: enabledValue === undefined ? true : (enabledValue === true || Number(enabledValue) === 1),
        mustBeWholeNumber: wholeNumberValue === undefined
          ? false
          : (wholeNumberValue === true || Number(wholeNumberValue) === 1),
      });
    } catch (err: any) {
      console.error('Error fetching UOM data:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to load UOM data');
    } finally {
      setLoading(false);
    }
  };

  // ─── Validation ──────────────────────────────────────────────────────
  const getAllValidationErrors = (): ValidationError[] => {
    const allErrors: ValidationError[] = [];

    if (!form.name.trim()) {
      allErrors.push({
        field: 'name',
        label: 'UOM Name',
        message: 'UOM name is required',
      });
    }

    return allErrors;
  };

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isViewMode || submitting) return;

    const validationErrorsList = getAllValidationErrors();
    if (validationErrorsList.length > 0) {
      const nextErrors = validationErrorsList.reduce<{ [key: string]: string }>((acc, error) => {
        acc[error.field] = error.message;
        return acc;
      }, {});
      setErrors(nextErrors);
      setValidationErrors(validationErrorsList);
      setShowValidationSummary(true);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const payload = {
        uom_name: form.name.trim(),
        category: form.category,
        symbol: form.symbol.trim(),
        common_code: form.commonCode.trim(),
        description: form.description.trim(),
        enabled: form.enabled ? 1 : 0,
        must_be_whole_number: form.mustBeWholeNumber ? 1 : 0,
      };

      // Existing records must use PUT on their current endpoint. New records
      // are created with POST on the collection endpoint.
      const response = isEditMode
        ? await api.put(`/uom/${encodeURIComponent(id || '')}`, payload)
        : await api.post('/uom', payload);

      const responseBody = response?.data;
      if (responseBody?.success === false || responseBody?.success === 0) {
        throw new Error(responseBody?.message || `Failed to ${isEditMode ? 'update' : 'create'} UOM`);
      }

      toast.success(isEditMode ? 'UOM updated successfully' : 'UOM created successfully');
      navigate('/uom', { replace: true, state: { refresh: true } });
    } catch (err: any) {
      console.error('Error saving UOM:', err);
      const message = err?.response?.data?.message || err?.message || `Failed to ${isEditMode ? 'update' : 'save'} UOM`;
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const hasErrors = getAllValidationErrors().length > 0;

  if (loading) {
    return (
      <div className={`uomf-page ${theme}`}>
        <div className="uomf-inner" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <FaSpinner className="spinning" size={40} />
          <p style={{ marginLeft: '16px' }}>Loading UOM data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`uomf-page ${theme}`}>
      <div className="uomf-inner">

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
        <div className="uomf-header">
          <button onClick={() => navigate('/uom')} className="back-btn">
            <FaArrowLeft size={9} /> Back
          </button>
          <div className="header-title">
            <h1>
              {isNew ? 'New UOM' : isViewMode ? `View: ${uomName}` : `Edit: ${uomName}`}
            </h1>
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
          <div className="uomf-card">

            {/* UOM Details */}
            <span className="uomf-section-title">UOM Details</span>

            {isNew && (
              <div className="uomf-field">
                <label className="uomf-label">
                  <FaRuler className="uomf-label-icon" />UOM Name <span className="uomf-required">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors((prev) => ({ ...prev, name: '' })); }}
                  className={`form-field${errors.name ? ' field-error' : ''}`}
                  placeholder="Enter UOM name"
                  readOnly={isViewMode}
                />
                {errors.name && <span className="uomf-error-msg"><FaExclamationCircle size={10} />{errors.name}</span>}
              </div>
            )}

            <div className="uomf-grid-2">
              <div className="uomf-field">
                <label className="uomf-label"><FaList className="uomf-label-icon" />Category</label>
                {isViewMode ? (
                  /* In view mode: show as plain text input (no dropdown) */
                  <input
                    type="text"
                    value={form.category}
                    className="form-field"
                    readOnly
                  />
                ) : (
                  /* In edit mode: show the actual select dropdown */
                  <select
                    className="form-field"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="Area">Area</option>
                    <option value="Electric Current">Electric Current</option>
                    <option value="Electrical Charge">Electrical Charge</option>
                    <option value="Length">Length</option>
                    <option value="Pressure">Pressure</option>
                    <option value="Volume">Volume</option>
                    <option value="Weight">Weight</option>
                    <option value="Time">Time</option>
                    <option value="Temperature">Temperature</option>
                    <option value="Speed">Speed</option>
                    <option value="Frequency">Frequency</option>
                    <option value="Force">Force</option>
                    <option value="Energy">Energy</option>
                    <option value="Power">Power</option>
                  </select>
                )}
              </div>

              <div className="uomf-field">
                <label className="uomf-label"><FaHashtag className="uomf-label-icon" />Symbol</label>
                <input
                  type="text"
                  value={form.symbol}
                  onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                  className="form-field"
                  placeholder="Enter symbol (e.g., kg, m, L)"
                  readOnly={isViewMode}
                />
              </div>
            </div>

            <div className="uomf-grid-2">
              <div className="uomf-field">
                <label className="uomf-label"><FaTag className="uomf-label-icon" />Common Code</label>
                <input
                  type="text"
                  value={form.commonCode}
                  onChange={(e) => setForm({ ...form, commonCode: e.target.value })}
                  className="form-field"
                  placeholder="Enter common code"
                  readOnly={isViewMode}
                />
              </div>

              <div className="uomf-field">
                <label className="uomf-label"><FaAlignLeft className="uomf-label-icon" />Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="form-field uomf-textarea"
                  placeholder="Enter description"
                  rows={2}
                  readOnly={isViewMode}
                />
              </div>
            </div>

            <div className="uomf-field-check">
              <input
                type="checkbox"
                id="enabled"
                checked={form.enabled}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                className="uomf-checkbox"
                disabled={isViewMode}
              />
              <div>
                <label htmlFor="enabled" className="uomf-check-label">
                  <FaCheckSquare className="uomf-check-icon" /> Enabled
                </label>
                <p className="uomf-check-hint">Enable this UOM for use in transactions</p>
              </div>
            </div>

            <div className="uomf-field-check">
              <input
                type="checkbox"
                id="mustBeWholeNumber"
                checked={form.mustBeWholeNumber}
                onChange={(e) => setForm({ ...form, mustBeWholeNumber: e.target.checked })}
                className="uomf-checkbox"
                disabled={isViewMode}
              />
              <div>
                <label htmlFor="mustBeWholeNumber" className="uomf-check-label">
                  Must be Whole Number
                </label>
                <p className="uomf-check-hint">Check this to disallow fractions (e.g., for Nos)</p>
              </div>
            </div>

            {/* ─── Comments & Activity (only for existing records) ─── */}
            {!isNew && (
              <>
                <div className="uomf-divider" />
                <span className="uomf-section-title">Comments</span>

                <div className="uomf-comment-input-row">
                  <div className="uomf-comment-avatar">AD</div>
                  <input
                    className="uomf-comment-input"
                    placeholder="Type a reply / comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    readOnly={isViewMode}
                  />
                </div>

                <div className="uomf-divider" />

                <div className="uomf-activity-header">
                  
                </div>

                <ul className="uomf-activity-list">
                </ul>
              </>
            )}
          </div>

          {/* ─── Footer ────────────────────────────────────────────────── */}
          <div className="uomf-footer">
            <button
              type="button"
              onClick={() => navigate('/uom')}
              className="cancel-btn"
            >
              {isViewMode ? 'Back' : 'Cancel'}
            </button>
            {!isViewMode && (
              <button
                type="submit"
                disabled={submitting}
                className="submit-btn"
              >
                {submitting && <FaSpinner className="spinning" />}
                <FaSave size={12} />
                {submitting ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update' : 'Save')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}