import { useState, useEffect, type FormEvent } from "react";
import ReactDOM from "react-dom";
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
  FaCheck,
  FaEye,
} from 'react-icons/fa';
import "./UOMForm.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';

interface ValidationError {
  field: string;
  label: string;
  message: string;
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
      className="uomf-loader-overlay"
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
        className="uomf-loader-card"
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
          className="uomf-loader-spinner"
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            border: '4px solid #e5e7eb',
            borderTopColor: '#6366f1',
            animation: 'uomfSpin 0.9s linear infinite',
          }}
        />
        <div
          className="uomf-loader-message"
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
            className="uomf-loader-subtitle"
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
        @keyframes uomfSpin {
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
      className="uomf-success-overlay"
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
        className="uomf-success-modal"
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

export default function UOMForm() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const isNew = id === "new";
  const uomName = isNew ? "New UOM" : decodeURIComponent(id || "");
  const isEditMode = !isNew;

  const passedData = (location.state as any)?.uomData;
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

  // 🆕 Global loader state — 'save' | null
  const [loaderAction, setLoaderAction] = useState<'save' | null>(null);

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

  // ─── Fetch Existing UOM Data on Load ────────────────────────────────
  // Uses the shared `api` service so auth + base URL are handled centrally.
  const fetchUOMData = async (uomId: string) => {
    setLoading(true);
    try {
      // Backend pattern: GET /uom returns the list; find by name.
      const response = await api.get('/uom');
      const raw = response.data?.data;
      const list: any[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.records)
        ? raw.records
        : Array.isArray(raw?.data)
        ? raw.data
        : [];

      const target = decodeURIComponent(String(uomId)).toLowerCase();
      const data = list.find(
        (o: any) =>
          String(o.uom_name || o.name || '').toLowerCase() === target
      );

      if (data) {
        setForm({
          name: data.uom_name || data.name || "",
          category: data.category || "Electric Current",
          symbol: data.symbol || "",
          commonCode: data.common_code || data.commonCode || "",
          description: data.description || "",
          enabled: data.enabled !== undefined ? Boolean(data.enabled) : true,
          mustBeWholeNumber:
            data.must_be_whole_number !== undefined
              ? Boolean(data.must_be_whole_number)
              : false,
        });
      }
    } catch (err) {
      console.error("Error fetching UOM data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isNew && id) {
      fetchUOMData(id);
    }
  }, [id, isNew]);

  // ─── Validation ────────────────────────────────────────────────────
  const getAllValidationErrors = (): ValidationError[] => {
    const allErrors: ValidationError[] = [];
    if (isNew && !form.name.trim()) {
      allErrors.push({ field: 'name', label: 'UOM Name', message: 'UOM name is required' });
    }
    return allErrors;
  };

  // ─── Save ──────────────────────────────────────────────────────────
  // 🆕 Uses the shared `api` service and the pattern used by all other
  //    working forms: PUT /uom with the id/name in the BODY (not in URL).
  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isViewMode) return;

    const validationErrorsList = getAllValidationErrors();
    if (validationErrorsList.length > 0) {
      setValidationErrors(validationErrorsList);
      setShowValidationSummary(true);
      return;
    }

    setSubmitting(true);
    setLoaderAction('save');
    setErrors({});

    try {
      const payload: any = {
        uom_name: form.name,
        name: form.name, // send both — backend may use either
        category: form.category,
        symbol: form.symbol,
        common_code: form.commonCode,
        description: form.description,
        enabled: form.enabled ? 1 : 0,
        must_be_whole_number: form.mustBeWholeNumber ? 1 : 0,
      };

      let response;
      if (isEditMode) {
        // 🆕 id/name goes in the BODY (matches Operation/Warehouse pattern)
        response = await api.put('/uom', {
          id: decodeURIComponent(id || ''),
          uom_name: form.name,
          name: form.name,
          ...payload,
        });
      } else {
        response = await api.post('/uom', payload);
      }

      if (response.data?.success === 1) {
        setSuccessModal({
          isOpen: true,
          title: 'Success!',
          message: isEditMode
            ? 'UOM updated successfully!'
            : 'UOM created successfully!',
          details: [
            { label: 'UOM Name', value: form.name || '—' },
            { label: 'Category', value: form.category || '—' },
            { label: 'Symbol', value: form.symbol || '—' },
            { label: 'Enabled', value: form.enabled ? 'Yes' : 'No' },
          ],
        });
      } else {
        const msg = response.data?.message || 'Failed to save UOM';
        setErrors({ submit: msg });
        console.error('Failed to save UOM:', msg);
      }
    } catch (err: any) {
      console.error("Error saving UOM:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'An error occurred while saving';
      setErrors({ submit: msg });
    } finally {
      setSubmitting(false);
      setLoaderAction(null);
    }
  };

  // 🆕 Close button on success modal → listing page.
  const handleSuccessClose = () => {
    setSuccessModal(prev => ({ ...prev, isOpen: false }));
    navigate('/uom');
  };

  // 🆕 View button on success modal → stay on the page.
  const handleSuccessView = () => {
    setSuccessModal(prev => ({ ...prev, isOpen: false }));
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
      {/* 🆕 Full-screen loader */}
      <LoaderOverlay
        isOpen={loaderAction === 'save'}
        message={isEditMode ? 'Updating UOM...' : 'Creating UOM...'}
        subtitle={
          isEditMode
            ? 'Please wait while we save your changes.'
            : 'Please wait while we create the UOM.'
        }
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
          {hasErrors && !isViewMode && (
            <div className="error-badge">
              <FaExclamationTriangle size={12} />
              {getAllValidationErrors().length} missing field{getAllValidationErrors().length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Show API error banner if any */}
        {errors.submit && (
          <div className="opf-alert opf-alert-error" style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '10px 14px',
            borderRadius: '6px',
            marginBottom: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{errors.submit}</span>
            <button onClick={() => setErrors({})} style={{
              background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px'
            }}>×</button>
          </div>
        )}

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
                  readOnly={isViewMode}
                />
                {errors.name && <span className="uomf-error-msg"><FaExclamationCircle size={10} />{errors.name}</span>}
              </div>
            )}

            <div className="uomf-grid-2">
              <div className="uomf-field">
                <label className="uomf-label"><FaList className="uomf-label-icon" />Category</label>
                {isViewMode ? (
                  <input
                    type="text"
                    value={form.category}
                    className="form-field"
                    readOnly
                  />
                ) : (
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

                <div className="uomf-activity-header"></div>
                <ul className="uomf-activity-list"></ul>
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
                {isEditMode ? 'Update' : 'Save'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}