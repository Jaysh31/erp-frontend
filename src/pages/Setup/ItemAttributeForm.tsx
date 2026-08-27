import { useState, type FormEvent, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaSave,
  FaSpinner,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaPlus,
  FaTag,
} from 'react-icons/fa';
import "./ItemAttributeForm.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';

interface AttributeValue {
  id: string;
  value: string;
  abbreviation: string;
}

interface ValidationError {
  field: string;
  label: string;
  message: string;
}

export default function ItemAttributeForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const isNew = id === "new";
  const attributeName = isNew ? "New Item Attribute" : id || "";
  const isEditMode = !isNew;

  const [form, setForm] = useState({
    attributeName: isNew ? "" : id || "",
    disabled: false,
    numericValues: false,
  });

  const [values, setValues] = useState<AttributeValue[]>([
    { id: "1", value: "Red", abbreviation: "RED" },
    { id: "2", value: "Green", abbreviation: "GRE" },
    { id: "3", value: "Blue", abbreviation: "BLU" },
    { id: "4", value: "Black", abbreviation: "BLA" },
    { id: "5", value: "White", abbreviation: "WHI" },
  ]);

  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [] = useState<ValidationError[]>([]);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const addRow = () => {
    setValues([...values, { id: Date.now().toString(), value: "", abbreviation: "" }]);
  };

  const removeRow = (id: string) => {
    setValues(values.filter((v) => v.id !== id));
  };

  const updateValue = (id: string, field: keyof AttributeValue, val: string) => {
    setValues(values.map((v) => (v.id === id ? { ...v, [field]: val } : v)));
  };

  // ─── Validation Functions ──────────────────────────────────────────
  const getAllValidationErrors = (): ValidationError[] => {
    const allErrors: ValidationError[] = [];

    // 1. Validate Attribute Name - REQUIRED (varchar(140), NOT NULL, UNIQUE)
    if (!form.attributeName.trim()) {
      allErrors.push({ field: 'attributeName', label: 'Attribute Name', message: 'Attribute name is required' });
    } else if (form.attributeName.length > 140) {
      allErrors.push({ field: 'attributeName', label: 'Attribute Name', message: 'Attribute name must not exceed 140 characters' });
    } else if (!/^[a-zA-Z\s]+$/.test(form.attributeName.trim())) {
      // NEW: Only allow alphabets and spaces
      allErrors.push({ field: 'attributeName', label: 'Attribute Name', message: 'Attribute name must contain only alphabets and spaces' });
    }

    // 2. Validate Attribute Values
    values.forEach((v, i) => {
      // Attribute Value is required
      if (!v.value.trim()) {
        allErrors.push({ 
          field: `value_${i}`, 
          label: `Attribute Value ${i + 1}`, 
          message: 'Attribute value is required' 
        });
      } else if (v.value.length > 140) {
        allErrors.push({ 
          field: `value_${i}`, 
          label: `Attribute Value ${i + 1}`, 
          message: 'Attribute value must not exceed 140 characters' 
        });
      }

      // Abbreviation is required
      if (!v.abbreviation.trim()) {
        allErrors.push({ 
          field: `abbreviation_${i}`, 
          label: `Abbreviation ${i + 1}`, 
          message: 'Abbreviation is required' 
        });
      } else if (v.abbreviation.length > 140) {
        allErrors.push({ 
          field: `abbreviation_${i}`, 
          label: `Abbreviation ${i + 1}`, 
          message: 'Abbreviation must not exceed 140 characters' 
        });
      }
    });

    return allErrors;
  };

  // ─── Real-time validation ──────────────────────────────────────────
  useEffect(() => {
    const validationErrorsList = getAllValidationErrors();
    const fieldErrors: { [key: string]: string } = {};
    validationErrorsList.forEach(error => {
      fieldErrors[error.field] = error.message;
    });
    setErrors(fieldErrors);
  }, [form.attributeName, values]);

  // ─── Field Error Helper ────────────────────────────────────────────
  const getFieldError = (field: string): string | undefined => {
    // Only show errors if form has been submitted
    if (!formSubmitted) {
      return undefined;
    }
    return errors[field];
  };

  // ─── Handle Attribute Name Change with Alphabet Only Validation ────
  const handleAttributeNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only alphabets and spaces
    if (value === '' || /^[a-zA-Z\s]*$/.test(value)) {
      setForm({ ...form, attributeName: value });
    }
  };

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormSubmitted(true);

    const validationErrorsList = getAllValidationErrors();
    if (validationErrorsList.length > 0) {
      // Scroll to first error field
      const firstError = validationErrorsList[0];
      const element = document.querySelector(`[data-field="${firstError.field}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = element as HTMLInputElement;
        input.focus();
      }
      return;
    }

    setSubmitting(true);
    try {
      // Prepare payload according to table schema
      const payload = {
        attribute_name: form.attributeName.trim(),
        numeric_values: form.numericValues ? 1 : 0,
        disabled: form.disabled ? 1 : 0,
      };

      console.log('Saving item attribute:', payload);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      navigate('/item-attribute');
    } catch (err) {
      console.error('Error saving item attribute:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const hasErrors = formSubmitted && getAllValidationErrors().length > 0;

  return (
    <div className={`iaf-page ${theme}`}>
      <div className="iaf-inner">

        {/* ─── Header ────────────────────────────────────────────────── */}
        <div className="iaf-header">
          <button onClick={() => navigate('/item-attribute')} className="back-btn">
            <FaArrowLeft size={9} /> Back
          </button>
          <div className="header-title">
            <h1>{isNew ? 'Add New Item Attribute' : `Edit: ${attributeName}`}</h1>
          </div>
          {hasErrors && (
            <div className="error-badge" style={{
              background: '#dc3545',
              color: 'white',
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <FaExclamationTriangle size={12} />
              {getAllValidationErrors().length} missing field{getAllValidationErrors().length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <form onSubmit={handleSave}>

          {/* ─── Main Form Card ────────────────────────────────────────── */}
          <div className="iaf-card">

            {/* General Settings */}
            <span className="iaf-section-title">General Settings</span>

            <div className="iaf-field">
              <label className="iaf-label">
                <FaTag className="iaf-label-icon" />Attribute Name <span className="iaf-required">*</span>
              </label>
              <input
                type="text"
                value={form.attributeName}
                onChange={handleAttributeNameChange}
                className={`form-field${getFieldError('attributeName') ? ' field-error' : ''}`}
                placeholder="Enter attribute name (alphabets only, max 140 characters)"
                maxLength={140}
                data-field="attributeName"
              />
              {getFieldError('attributeName') && (
                <span className="iaf-error-msg" style={{ color: 'red', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  <FaExclamationCircle size={10} /> {getFieldError('attributeName')}
                </span>
              )}
              <span className="iaf-hint" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                Only alphabets and spaces are allowed
              </span>
            </div>

            <div className="iaf-field-check">
              <input
                type="checkbox"
                id="disabled"
                checked={form.disabled}
                onChange={(e) => setForm({ ...form, disabled: e.target.checked })}
                className="iaf-checkbox"
              />
              <div>
                <label htmlFor="disabled" className="iaf-check-label">Disabled</label>
                <p className="iaf-check-hint">Disable this attribute if it is no longer in use</p>
              </div>
            </div>

            <div className="iaf-field-check">
              <input
                type="checkbox"
                id="numericValues"
                checked={form.numericValues}
                onChange={(e) => setForm({ ...form, numericValues: e.target.checked })}
                className="iaf-checkbox"
              />
              <div>
                <label htmlFor="numericValues" className="iaf-check-label">Numeric Values</label>
                <p className="iaf-check-hint">Enable if attribute values are numeric (e.g., sizes, measurements)</p>
              </div>
            </div>

            <div className="iaf-divider" />

            {/* Item Attribute Values Table */}
            <span className="iaf-section-title">Item Attribute Values</span>

            <div className="iaf-field">
              <div className="iaf-table-block">
                <table className="iaf-inline-table">
                  <thead>
                    <tr>
                      <th className="iaf-ith iaf-ith-no">
                        <input type="checkbox" className="iaf-checkbox" />
                      </th>
                      <th className="iaf-ith">No.</th>
                      <th className="iaf-ith">Attribute Value <span className="iaf-required">*</span></th>
                      <th className="iaf-ith">Abbreviation <span className="iaf-required">*</span></th>
                      <th className="iaf-ith iaf-ith-action"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {values.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="iaf-empty-row">No rows</td>
                      </tr>
                    ) : (
                      values.map((row, i) => {
                        const valueError = getFieldError(`value_${i}`);
                        const abbreviationError = getFieldError(`abbreviation_${i}`);
                        
                        return (
                          <tr key={row.id} className="iaf-itr">
                            <td className="iaf-itd"><input type="checkbox" className="iaf-checkbox" /></td>
                            <td className="iaf-itd iaf-itd-no">{i + 1}</td>
                            <td className="iaf-itd">
                              <input
                                className={`iaf-cell-input${valueError ? ' field-error' : ''}`}
                                value={row.value}
                                onChange={(e) => updateValue(row.id, "value", e.target.value)}
                                placeholder="Enter value (max 140 chars)"
                                maxLength={140}
                                data-field={`value_${i}`}
                              />
                              {valueError && (
                                <span className="iaf-error-msg" style={{ color: 'red', fontSize: '11px', marginTop: '2px', display: 'block' }}>
                                  <FaExclamationCircle size={10} /> {valueError}
                                </span>
                              )}
                            </td>
                            <td className="iaf-itd">
                              <input
                                className={`iaf-cell-input${abbreviationError ? ' field-error' : ''}`}
                                value={row.abbreviation}
                                onChange={(e) => updateValue(row.id, "abbreviation", e.target.value)}
                                placeholder="Enter abbreviation (max 140 chars)"
                                maxLength={140}
                                data-field={`abbreviation_${i}`}
                              />
                              {abbreviationError && (
                                <span className="iaf-error-msg" style={{ color: 'red', fontSize: '11px', marginTop: '2px', display: 'block' }}>
                                  <FaExclamationCircle size={10} /> {abbreviationError}
                                </span>
                              )}
                            </td>
                            <td className="iaf-itd">
                              <button className="iaf-remove-row" onClick={() => removeRow(row.id)} type="button">×</button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <button className="iaf-add-row" onClick={addRow} type="button">
                <FaPlus size={10} /> Add row
              </button>
            </div>

            {/* ─── Comments & Activity (only for existing records) ─── */}
            {!isNew && (
              <>
                <div className="iaf-divider" />
                <span className="iaf-section-title">Comments</span>

                <div className="iaf-comment-input-row">
                  <div className="iaf-comment-avatar">AD</div>
                  <input
                    className="iaf-comment-input"
                    placeholder="Type a reply / comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={140}
                  />
                </div>

                <div className="iaf-divider" />

                <div className="iaf-activity-header">
                  <span className="iaf-section-title iaf-activity-title">Activity</span>
                  <button className="iaf-new-email-btn" type="button">+ New Email</button>
                </div>

                <ul className="iaf-activity-list">
                  <li>Administrator created this · <span className="iaf-activity-time">yesterday</span></li>
                  <li>Administrator last edited this · <span className="iaf-activity-time">yesterday</span></li>
                </ul>
              </>
            )}
          </div>

          {/* ─── Footer ────────────────────────────────────────────────── */}
          <div className="iaf-footer">
            <button
              type="button"
              onClick={() => navigate('/item-attribute')}
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