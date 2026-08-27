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
  FaTag,
  FaPlus,
  FaTrash,
} from 'react-icons/fa';
import "./BrandForm.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';

interface BrandDefaults {
  id: string;
  company: string;
  defaultWarehouse: string;
  defaultPriceList: string;
}

interface ValidationError {
  field: string;
  label: string;
  message: string;
}

export default function BrandForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const isNew = id === "new";
  const brandName = isNew ? "New Brand" : decodeURIComponent(id || "");
  const isEditMode = !isNew;

  const [form, setForm] = useState({
    name: isNew ? "" : decodeURIComponent(id || ""),
  });

  const [defaults, setDefaults] = useState<BrandDefaults[]>([]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, ] = useState<{ [key: string]: string }>({});
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const addRow = () => {
    setDefaults([
      ...defaults,
      { id: Date.now().toString(), company: "", defaultWarehouse: "", defaultPriceList: "" },
    ]);
  };

  const removeRow = (id: string) => {
    setDefaults(defaults.filter((r) => r.id !== id));
  };

  const updateDefault = (id: string, field: keyof BrandDefaults, value: string) => {
    setDefaults(defaults.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  // ─── Validation ──────────────────────────────────────────────────────
  const getAllValidationErrors = (): ValidationError[] => {
    const allErrors: ValidationError[] = [];

    if (isNew && !form.name.trim()) {
      allErrors.push({ field: 'name', label: 'Brand Name', message: 'Brand name is required' });
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
      navigate('/brand');
    } catch (err) {
      // Handle error
    } finally {
      setSubmitting(false);
    }
  };

  const hasErrors = getAllValidationErrors().length > 0;

  return (
    <div className={`bf-page ${theme}`}>
      <div className="bf-inner">

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
        <div className="bf-header">
          <button onClick={() => navigate('/brand')} className="back-btn">
            <FaArrowLeft size={9} /> Back
          </button>
          <div className="header-title">
            <h1>{isNew ? 'Add New Brand' : `Edit: ${brandName}`}</h1>
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
          <div className="bf-card">

            {/* Brand Name */}
            <span className="bf-section-title">Brand Details</span>

            <div className="bf-field">
              <label className="bf-label">
                <FaTag className="bf-label-icon" />Brand Name <span className="bf-required">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`form-field${errors.name ? ' field-error' : ''}`}
                placeholder="Enter brand name"
                disabled={!isNew}
              />
              {errors.name && <span className="bf-error-msg"><FaExclamationCircle size={10} />{errors.name}</span>}
            </div>

            <div className="bf-divider" />

            {/* Brand Defaults */}
            <span className="bf-section-title">Brand Defaults</span>

            <div className="bf-field">
              <div className="bf-table-block">
                <table className="bf-inline-table">
                  <thead>
                    <tr>
                      <th className="bf-ith bf-ith-check"><input type="checkbox" className="bf-checkbox" /></th>
                      <th className="bf-ith bf-ith-no">No.</th>
                      <th className="bf-ith">Company <span className="bf-required">*</span></th>
                      <th className="bf-ith">Default Warehouse</th>
                      <th className="bf-ith">Default Price List</th>
                      <th className="bf-ith bf-ith-act"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {defaults.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="bf-empty-row">No rows</td>
                      </tr>
                    ) : (
                      defaults.map((row, index) => (
                        <tr key={row.id} className="bf-itr">
                          <td className="bf-itd bf-itd-check"><input type="checkbox" className="bf-checkbox" /></td>
                          <td className="bf-itd bf-itd-no">{index + 1}</td>
                          <td className="bf-itd">
                            <input
                              className="bf-cell-input"
                              value={row.company}
                              onChange={(e) => updateDefault(row.id, "company", e.target.value)}
                              placeholder="Company"
                            />
                          </td>
                          <td className="bf-itd">
                            <input
                              className="bf-cell-input"
                              value={row.defaultWarehouse}
                              onChange={(e) => updateDefault(row.id, "defaultWarehouse", e.target.value)}
                              placeholder="Default Warehouse"
                            />
                          </td>
                          <td className="bf-itd">
                            <input
                              className="bf-cell-input"
                              value={row.defaultPriceList}
                              onChange={(e) => updateDefault(row.id, "defaultPriceList", e.target.value)}
                              placeholder="Default Price List"
                            />
                          </td>
                          <td className="bf-itd bf-itd-act">
                            <button className="bf-remove-row" onClick={() => removeRow(row.id)} type="button">
                              <FaTrash size={12} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <button className="bf-add-row" onClick={addRow} type="button">
                <FaPlus size={10} /> Add row
              </button>
            </div>

            {/* ─── Comments & Activity (only for existing records) ─── */}
            {!isNew && (
              <>
                <div className="bf-divider" />
                <span className="bf-section-title">Comments</span>

                <div className="bf-comment-input-row">
                  <div className="bf-comment-avatar">AD</div>
                  <input
                    className="bf-comment-input"
                    placeholder="Type a reply / comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>

                <div className="bf-divider" />

                <div className="bf-activity-header">
                  <span className="bf-section-title bf-activity-title">Activity</span>
                  <button className="bf-new-email-btn" type="button">+ New Email</button>
                </div>

                <ul className="bf-activity-list">
                  <li>You created this · <span className="bf-activity-time">1 minute ago</span></li>
                  <li>You last edited this · <span className="bf-activity-time">1 minute ago</span></li>
                </ul>
              </>
            )}
          </div>

          {/* ─── Footer ────────────────────────────────────────────────── */}
          <div className="bf-footer">
            <button
              type="button"
              onClick={() => navigate('/brand')}
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