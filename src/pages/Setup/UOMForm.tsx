import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

interface ValidationError {
  field: string;
  label: string;
  message: string;
}

export default function UOMForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const isNew = id === "new";
  const uomName = isNew ? "New UOM" : decodeURIComponent(id || "");
  const isEditMode = !isNew;

  const [form, setForm] = useState({
    name: isNew ? "" : decodeURIComponent(id || ""),
    category: "Electric Current",
    symbol: "",
    commonCode: "",
    description: "",
    enabled: true,
    mustBeWholeNumber: false,
  });

  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, ] = useState<{ [key: string]: string }>({});
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // ─── Validation ──────────────────────────────────────────────────────
  const getAllValidationErrors = (): ValidationError[] => {
    const allErrors: ValidationError[] = [];

    if (isNew && !form.name.trim()) {
      allErrors.push({ field: 'name', label: 'UOM Name', message: 'UOM name is required' });
    }

    return allErrors;
  };

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationErrorsList = getAllValidationErrors();
    if (validationErrorsList.length > 0) {
      setValidationErrors(validationErrorsList);
      setShowValidationSummary(true);
      return;
    }

    setSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      navigate('/uom');
    } catch (err) {
      // Handle error
    } finally {
      setSubmitting(false);
    }
  };

  const hasErrors = getAllValidationErrors().length > 0;

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
            <h1>{isNew ? 'New UOM' : `Edit: ${uomName}`}</h1>
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
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`form-field${errors.name ? ' field-error' : ''}`}
                  placeholder="Enter UOM name"
                />
                {errors.name && <span className="uomf-error-msg"><FaExclamationCircle size={10} />{errors.name}</span>}
              </div>
            )}

            <div className="uomf-grid-2">
              <div className="uomf-field">
                <label className="uomf-label"><FaList className="uomf-label-icon" />Category</label>
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
              </div>

              <div className="uomf-field">
                <label className="uomf-label"><FaHashtag className="uomf-label-icon" />Symbol</label>
                <input
                  type="text"
                  value={form.symbol}
                  onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                  className="form-field"
                  placeholder="Enter symbol (e.g., kg, m, L)"
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
                  />
                </div>

                <div className="uomf-divider" />

                <div className="uomf-activity-header">
                  <span className="uomf-section-title uomf-activity-title">Activity</span>
                  <button className="uomf-new-email-btn" type="button">+ New Email</button>
                </div>

                <ul className="uomf-activity-list">
                  <li>Administrator created this · <span className="uomf-activity-time">yesterday</span></li>
                  <li>Administrator last edited this · <span className="uomf-activity-time">yesterday</span></li>
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