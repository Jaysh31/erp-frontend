import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaSave,
  FaSpinner,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaPlus,
  FaFolder,
  FaTag,
  FaList,
  FaTimesCircle,
  FaInfoCircle,
} from 'react-icons/fa';
import "./ItemGroupForm.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';

interface DefaultRow {
  id: string;
  company: string;
  defaultWarehouse: string;
}

interface TaxRow {
  id: string;
  itemTaxTemplate: string;
  taxCategory: string;
  validFrom: string;
  minNetRate: string;
  maxNetRate: string;
}

interface Comment {
  id: string;
  author: string;
  initials: string;
  text: string;
  time: string;
}

interface ValidationError {
  field: string;
  label: string;
  message: string;
}

export default function ItemGroupForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const isNew = id === "new";

  // ─── Form State ────────────────────────────────────────────────────────
  const [itemGroupName, setItemGroupName] = useState(
    isNew ? "" : (id !== "new" ? decodeURIComponent(id ?? "") : "")
  );
  const [parentItemGroup, setParentItemGroup] = useState("");
  const [isGroup, setIsGroup] = useState(false);
  const [hsnSac, setHsnSac] = useState("");
  const [defaults, setDefaults] = useState<DefaultRow[]>([]);
  const [taxes, setTaxes] = useState<TaxRow[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activity, setActivity] = useState<{ text: string; time: string }[]>([]);

  const [commentText, setCommentText] = useState("");
  const [, setIsDirty] = useState(isNew);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // ─── Fetch existing record (view/edit mode) ──────────────────────────
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew || !id) return;

    let cancelled = false;

    const fetchItemGroup = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await api.get(`/item-group/${encodeURIComponent(id)}`);
        // support either { data: {...} } or a flat object response
        const data = response.data?.data ?? response.data;

        if (cancelled || !data) return;

        setItemGroupName(data.item_group_name ?? decodeURIComponent(id));
        setParentItemGroup(data.parent_item_group ?? "");
        setIsGroup(!!data.is_group);
        setHsnSac(data.gst_hsn_code ?? data.hsn_sac ?? "");

        setDefaults(
          (data.item_group_defaults ?? []).map((row: any, idx: number) => ({
            id: row.name ?? `${idx}-${Date.now()}`,
            company: row.company ?? "",
            defaultWarehouse: row.default_warehouse ?? "",
          }))
        );

        setTaxes(
          (data.taxes ?? []).map((row: any, idx: number) => ({
            id: row.name ?? `${idx}-${Date.now()}`,
            itemTaxTemplate: row.item_tax_template ?? "",
            taxCategory: row.tax_category ?? "",
            validFrom: row.valid_from ?? "",
            minNetRate: row.minimum_net_rate != null ? String(row.minimum_net_rate) : "",
            maxNetRate: row.maximum_net_rate != null ? String(row.maximum_net_rate) : "",
          }))
        );

        setComments(
          (data.comments ?? []).map((c: any, idx: number) => {
            const authorName = c.comment_by ?? c.owner ?? "Administrator";
            return {
              id: c.name ?? String(idx),
              author: authorName,
              initials: authorName.slice(0, 2).toUpperCase(),
              text: c.content ?? c.comment ?? "",
              time: c.creation ?? "",
            };
          })
        );

        setActivity(
          (data.activity ?? []).map((a: any) => ({
            text: a.text ?? a.action ?? "",
            time: a.time ?? a.creation ?? "",
          }))
        );
      } catch (err: any) {
        if (cancelled) return;
        console.error('Error fetching item group:', err);
        setLoadError(
          err?.response?.data?.message || 'Failed to load item group details'
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchItemGroup();

    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  const isEditMode = !isNew;

  // ─── Validation ──────────────────────────────────────────────────────
  const getAllValidationErrors = (): ValidationError[] => {
    const allErrors: ValidationError[] = [];

    // 1. Validate Item Group Name - Only alphabets and spaces, max 140 chars
    if (isNew && !itemGroupName.trim()) {
      allErrors.push({ 
        field: 'itemGroupName', 
        label: 'Item Group Name', 
        message: 'Item group name is required' 
      });
    }
    if (itemGroupName && itemGroupName.trim() && !/^[A-Za-z\s]+$/.test(itemGroupName.trim())) {
      allErrors.push({ 
        field: 'itemGroupName', 
        label: 'Item Group Name', 
        message: 'Item group name should contain only alphabets and spaces' 
      });
    }
    if (itemGroupName && itemGroupName.trim().length > 140) {
      allErrors.push({ 
        field: 'itemGroupName', 
        label: 'Item Group Name', 
        message: 'Item group name must not exceed 140 characters' 
      });
    }

    // 2. Validate Parent Item Group - Only alphabets and spaces, max 140 chars
    if (parentItemGroup && parentItemGroup.trim() && !/^[A-Za-z\s]+$/.test(parentItemGroup.trim())) {
      allErrors.push({ 
        field: 'parentItemGroup', 
        label: 'Parent Item Group', 
        message: 'Parent item group should contain only alphabets and spaces' 
      });
    }
    if (parentItemGroup && parentItemGroup.trim().length > 140) {
      allErrors.push({ 
        field: 'parentItemGroup', 
        label: 'Parent Item Group', 
        message: 'Parent item group must not exceed 140 characters' 
      });
    }

    // 3. Validate HSN/SAC - Exactly 8 digits only
    if (hsnSac && hsnSac.trim() && !/^\d{8}$/.test(hsnSac.trim())) {
      allErrors.push({ 
        field: 'hsnSac', 
        label: 'HSN/SAC', 
        message: 'HSN/SAC must be exactly 8 digits' 
      });
    }

    // 4. Validate defaults rows
    defaults.forEach((row, index) => {
      const companyField = `defaults[${index}].company`;
      const warehouseField = `defaults[${index}].defaultWarehouse`;
      
      if (!row.company.trim()) {
        allErrors.push({
          field: companyField,
          label: `Default Row ${index + 1} - Company`,
          message: `Company is required in default row ${index + 1}`
        });
      }
      if (row.company && row.company.trim() && !/^[A-Za-z\s]+$/.test(row.company.trim())) {
        allErrors.push({
          field: companyField,
          label: `Default Row ${index + 1} - Company`,
          message: `Company should contain only alphabets and spaces in row ${index + 1}`
        });
      }
      if (row.company && row.company.trim().length > 140) {
        allErrors.push({
          field: companyField,
          label: `Default Row ${index + 1} - Company`,
          message: `Company must not exceed 140 characters in row ${index + 1}`
        });
      }

      if (row.defaultWarehouse && row.defaultWarehouse.trim() && !/^[A-Za-z\s]+$/.test(row.defaultWarehouse.trim())) {
        allErrors.push({
          field: warehouseField,
          label: `Default Row ${index + 1} - Warehouse`,
          message: `Default warehouse should contain only alphabets and spaces in row ${index + 1}`
        });
      }
      if (row.defaultWarehouse && row.defaultWarehouse.trim().length > 140) {
        allErrors.push({
          field: warehouseField,
          label: `Default Row ${index + 1} - Warehouse`,
          message: `Default warehouse must not exceed 140 characters in row ${index + 1}`
        });
      }
    });

    // 5. Validate taxes rows
    taxes.forEach((row, index) => {
      const templateField = `taxes[${index}].itemTaxTemplate`;
      const categoryField = `taxes[${index}].taxCategory`;
      const validFromField = `taxes[${index}].validFrom`;
      const minRateField = `taxes[${index}].minNetRate`;
      const maxRateField = `taxes[${index}].maxNetRate`;
      
      if (!row.itemTaxTemplate.trim()) {
        allErrors.push({
          field: templateField,
          label: `Tax Row ${index + 1} - Item Tax Template`,
          message: `Item tax template is required in tax row ${index + 1}`
        });
      }
      if (row.itemTaxTemplate && row.itemTaxTemplate.trim() && !/^[A-Za-z\s]+$/.test(row.itemTaxTemplate.trim())) {
        allErrors.push({
          field: templateField,
          label: `Tax Row ${index + 1} - Item Tax Template`,
          message: `Item tax template should contain only alphabets and spaces in row ${index + 1}`
        });
      }
      if (row.itemTaxTemplate && row.itemTaxTemplate.trim().length > 140) {
        allErrors.push({
          field: templateField,
          label: `Tax Row ${index + 1} - Item Tax Template`,
          message: `Item tax template must not exceed 140 characters in row ${index + 1}`
        });
      }

      if (row.taxCategory && row.taxCategory.trim() && !/^[A-Za-z\s]+$/.test(row.taxCategory.trim())) {
        allErrors.push({
          field: categoryField,
          label: `Tax Row ${index + 1} - Tax Category`,
          message: `Tax category should contain only alphabets and spaces in row ${index + 1}`
        });
      }
      if (row.taxCategory && row.taxCategory.trim().length > 140) {
        allErrors.push({
          field: categoryField,
          label: `Tax Row ${index + 1} - Tax Category`,
          message: `Tax category must not exceed 140 characters in row ${index + 1}`
        });
      }

      if (row.validFrom && row.validFrom.trim() && !/^[A-Za-z\s]+$/.test(row.validFrom.trim())) {
        allErrors.push({
          field: validFromField,
          label: `Tax Row ${index + 1} - Valid From`,
          message: `Valid from should contain only alphabets and spaces in row ${index + 1}`
        });
      }
      if (row.validFrom && row.validFrom.trim().length > 140) {
        allErrors.push({
          field: validFromField,
          label: `Tax Row ${index + 1} - Valid From`,
          message: `Valid from must not exceed 140 characters in row ${index + 1}`
        });
      }

      if (row.minNetRate && row.minNetRate.trim() && !/^\d*\.?\d+$/.test(row.minNetRate.trim())) {
        allErrors.push({
          field: minRateField,
          label: `Tax Row ${index + 1} - Min Net Rate`,
          message: `Min net rate should contain only numbers in row ${index + 1}`
        });
      }
      if (row.minNetRate && row.minNetRate.trim().length > 140) {
        allErrors.push({
          field: minRateField,
          label: `Tax Row ${index + 1} - Min Net Rate`,
          message: `Min net rate must not exceed 140 characters in row ${index + 1}`
        });
      }

      if (row.maxNetRate && row.maxNetRate.trim() && !/^\d*\.?\d+$/.test(row.maxNetRate.trim())) {
        allErrors.push({
          field: maxRateField,
          label: `Tax Row ${index + 1} - Max Net Rate`,
          message: `Max net rate should contain only numbers in row ${index + 1}`
        });
      }
      if (row.maxNetRate && row.maxNetRate.trim().length > 140) {
        allErrors.push({
          field: maxRateField,
          label: `Tax Row ${index + 1} - Max Net Rate`,
          message: `Max net rate must not exceed 140 characters in row ${index + 1}`
        });
      }
    });

    return allErrors;
  };

  // ─── Field Error Helpers ────────────────────────────────────────────
  const getFieldError = (field: string): string | undefined => {
    if (!formSubmitted) return undefined;
    return errors[field];
  };

  const hasFieldError = (field: string): boolean => {
    if (!formSubmitted) return false;
    return !!errors[field];
  };

  // ─── Handlers ────────────────────────────────────────────────────────
  const addDefaultRow = () => {
    setDefaults([...defaults, { id: Date.now().toString(), company: "", defaultWarehouse: "" }]);
    setIsDirty(true);
  };

  const addTaxRow = () => {
    setTaxes([...taxes, { id: Date.now().toString(), itemTaxTemplate: "", taxCategory: "", validFrom: "", minNetRate: "", maxNetRate: "" }]);
    setIsDirty(true);
  };

  const removeDefaultRow = (rowId: string) => {
    setDefaults(defaults.filter((r) => r.id !== rowId));
    setIsDirty(true);
  };

  const removeTaxRow = (rowId: string) => {
    setTaxes(taxes.filter((r) => r.id !== rowId));
    setIsDirty(true);
  };

  const jumpToError = (fieldName: string) => {
    setShowValidationSummary(false);
    
    let selector = `[data-field="${fieldName}"]`;
    let element = document.querySelector(selector);
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = element as HTMLInputElement;
      input.focus();
      input.style.boxShadow = '0 0 0 2px #dc3545';
      setTimeout(() => {
        input.style.boxShadow = '';
      }, 2000);
    }
  };

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError(null);
    setFormSubmitted(true);

    const validationErrorsList = getAllValidationErrors();
    if (validationErrorsList.length > 0) {
      const fieldErrors: { [key: string]: string } = {};
      validationErrorsList.forEach(error => {
        fieldErrors[error.field] = error.message;
      });
      setErrors(fieldErrors);
      setValidationErrors(validationErrorsList);
      setShowValidationSummary(true);
      
      const firstError = validationErrorsList[0];
      setTimeout(() => {
        jumpToError(firstError.field);
      }, 100);
      
      return;
    }

    setSubmitting(true);
    try {
      if (isNew) {
        const payload = {
          item_group_name: itemGroupName.trim(),
          parent_item_group: parentItemGroup || "All Item Groups",
          is_group: isGroup ? 1 : 0,
          modified_by: "Administrator",
        };

        const response = await api.post('/item-group', payload);
        
        if (response.data && response.data.success === 1) {
          console.log('Item group created successfully:', response.data);
          setIsDirty(false);
          navigate('/item-group');
        } else {
          setApiError(response.data?.message || 'Failed to create item group');
        }
      } else {
        const payload = {
          parent_item_group: parentItemGroup || "All Item Groups",
          is_group: isGroup ? 1 : 0,
          modified_by: "Administrator",
        };
        
        const response = await api.put(`/item-group/${encodeURIComponent(id ?? "")}`, payload);

        if (response.data && (response.data.success === 1 || response.data.success === undefined)) {
          console.log('Update mode - payload:', payload);
          setIsDirty(false);
          navigate('/item-group');
        } else {
          setApiError(response.data?.message || 'Failed to update item group');
        }
      }
    } catch (err: any) {
      console.error('Error saving item group:', err);
      
      if (err.response) {
        if (err.response.status === 409) {
          setApiError('An item group with this name already exists');
        } else if (err.response.status === 400) {
          setApiError(err.response.data?.message || 'Invalid data provided');
        } else {
          setApiError(err.response.data?.message || 'Failed to save item group');
        }
      } else if (err.request) {
        setApiError('Network error. Please check your connection.');
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const hasErrors = formSubmitted && getAllValidationErrors().length > 0;
  const allValidationErrors = getAllValidationErrors();

  // ─── Loading / Load-error states (view/edit mode) ────────────────────
  if (!isNew && loading) {
    return (
      <div className={`igf-page ${theme}`}>
        <div className="igf-inner">
          <div className="igf-header">
            <button onClick={() => navigate('/item-group')} className="back-btn">
              <FaArrowLeft size={9} /> Back
            </button>
          </div>
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <FaSpinner className="spinning" /> Loading item group…
          </div>
        </div>
      </div>
    );
  }

  if (!isNew && loadError) {
    return (
      <div className={`igf-page ${theme}`}>
        <div className="igf-inner">
          <div className="igf-header">
            <button onClick={() => navigate('/item-group')} className="back-btn">
              <FaArrowLeft size={9} /> Back
            </button>
          </div>
          <div className="igf-api-error" style={{ 
            background: '#fee', 
            border: '1px solid #fcc', 
            borderRadius: '4px', 
            padding: '12px 16px',
            marginTop: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <FaExclamationCircle style={{ color: '#dc3545' }} />
            <span style={{ color: '#dc3545' }}>{loadError}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`igf-page ${theme}`}>
      <div className="igf-inner">

        {/* ─── Validation Summary Modal ────────────────────────────────── */}
        {showValidationSummary && validationErrors.length > 0 && (
          <div className="modal-overlay" onClick={() => setShowValidationSummary(false)}>
            <div className="validation-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header modal-header-warning">
                <h2 className="modal-title-warning">
                  <FaExclamationTriangle /> Missing or Invalid Fields
                </h2>
                <button className="modal-close" onClick={() => setShowValidationSummary(false)}>×</button>
              </div>
              <div className="modal-body">
                <p className="modal-intro">
                  Please fix the following issues before submitting:
                </p>
                <div className="error-list">
                  {validationErrors.map((error, idx) => (
                    <div key={idx} className="validation-error-item" onClick={() => jumpToError(error.field)}>
                      <div className="error-header">
                        <FaTimesCircle className="error-icon" />
                        <strong className="error-label">{error.label}</strong>
                      </div>
                      <div className="error-message">{error.message}</div>
                    </div>
                  ))}
                </div>
                <div className="hint-banner">
                  <FaInfoCircle className="hint-icon" />
                  Click on any error to jump to that field
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowValidationSummary(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* ─── API Error Display ────────────────────────────────────── */}
        {apiError && (
          <div className="igf-api-error" style={{ 
            background: '#fee', 
            border: '1px solid #fcc', 
            borderRadius: '4px', 
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <FaExclamationCircle style={{ color: '#dc3545' }} />
            <span style={{ color: '#dc3545' }}>{apiError}</span>
            <button 
              className="error-close" 
              onClick={() => setApiError(null)}
              style={{ 
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: '#dc3545'
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* ─── Header ────────────────────────────────────────────────── */}
        <div className="igf-header">
          <button onClick={() => navigate('/item-group')} className="back-btn">
            <FaArrowLeft size={9} /> Back
          </button>
          <div className="header-title">
            <h1>{isNew ? 'Add New Item Group' : `Edit: ${itemGroupName}`}</h1>
          </div>
          {hasErrors && (
            <div className="error-badge" onClick={() => setShowValidationSummary(true)} style={{
              background: '#dc3545',
              color: 'white',
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer'
            }}>
              <FaExclamationTriangle size={12} />
              {allValidationErrors.length} field{allValidationErrors.length !== 1 ? 's' : ''} need attention
            </div>
          )}
        </div>

        <form onSubmit={handleSave}>

          {/* ─── Main Form Card ────────────────────────────────────────── */}
          <div className="igf-card">

            {/* General Settings */}
            <span className="igf-section-title">General Settings</span>

            {isNew && (
              <div className="igf-field">
                <label className="igf-label">
                  <FaTag className="igf-label-icon" />Item Group Name <span className="igf-required">*</span>
                </label>
                <input
                  type="text"
                  value={itemGroupName}
                  onChange={(e) => { 
                    setItemGroupName(e.target.value); 
                    setIsDirty(true);
                  }}
                  className={`form-field${hasFieldError('itemGroupName') ? ' field-error' : ''}`}
                  placeholder="Enter item group name (alphabets only, max 140)"
                  disabled={submitting}
                  maxLength={140}
                  data-field="itemGroupName"
                />
                {getFieldError('itemGroupName') && (
                  <div className="igf-error-msg" style={{ fontSize: '12px', marginTop: '4px' }}>
                    {getFieldError('itemGroupName')}
                  </div>
                )}
              </div>
            )}

            <div className="igf-grid-2">
              <div className="igf-field">
                <label className="igf-label"><FaFolder className="igf-label-icon" />Parent Item Group</label>
                <input
                  type="text"
                  value={parentItemGroup}
                  onChange={(e) => { 
                    setParentItemGroup(e.target.value); 
                    setIsDirty(true);
                  }}
                  className={`form-field${hasFieldError('parentItemGroup') ? ' field-error' : ''}`}
                  placeholder="Enter parent group (alphabets only, max 140)"
                  disabled={submitting}
                  maxLength={140}
                  data-field="parentItemGroup"
                />
                {getFieldError('parentItemGroup') && (
                  <div className="igf-error-msg" style={{ fontSize: '12px', marginTop: '4px' }}>
                    {getFieldError('parentItemGroup')}
                  </div>
                )}
              </div>

              <div className="igf-field">
                <label className="igf-label"><FaList className="igf-label-icon" />HSN/SAC</label>
                <input
                  type="text"
                  value={hsnSac}
                  onChange={(e) => { 
                    setHsnSac(e.target.value); 
                    setIsDirty(true);
                  }}
                  className={`form-field${hasFieldError('hsnSac') ? ' field-error' : ''}`}
                  placeholder="Enter 8-digit HSN/SAC code"
                  disabled={submitting}
                  maxLength={8}
                  data-field="hsnSac"
                />
                {getFieldError('hsnSac') && (
                  <div className="igf-error-msg" style={{ fontSize: '12px', marginTop: '4px' }}>
                    {getFieldError('hsnSac')}
                  </div>
                )}
              </div>
            </div>

            <div className="igf-field-check">
              <input
                type="checkbox"
                id="isGroup"
                checked={isGroup}
                onChange={(e) => { 
                  setIsGroup(e.target.checked); 
                  setIsDirty(true);
                }}
                className="igf-checkbox"
                disabled={submitting}
              />
              <div>
                <label htmlFor="isGroup" className="igf-check-label">
                  Is Group
                </label>
                <p className="igf-check-hint">
                  Only leaf nodes are allowed in transaction
                </p>
              </div>
            </div>

            <div className="igf-divider" />

            {/* Defaults */}
            <span className="igf-section-title">Item Group Defaults</span>

            <div className="igf-field">
              <div className="igf-table-block">
                <table className="igf-inline-table">
                  <thead>
                    <tr>
                      <th className="igf-ith igf-ith-no">
                        <input type="checkbox" className="igf-checkbox" disabled={submitting} />
                      </th>
                      <th className="igf-ith">No.</th>
                      <th className="igf-ith">Company <span className="igf-required">*</span></th>
                      <th className="igf-ith">Default Warehouse</th>
                      <th className="igf-ith igf-ith-action">
                        <button className="igf-col-settings" title="Column settings" type="button" disabled={submitting}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                          </svg>
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {defaults.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="igf-empty-row">No rows</td>
                      </tr>
                    ) : (
                      defaults.map((row, i) => {
                        const companyField = `defaults[${i}].company`;
                        const warehouseField = `defaults[${i}].defaultWarehouse`;
                        
                        return (
                          <tr key={row.id} className="igf-itr">
                            <td className="igf-itd"><input type="checkbox" className="igf-checkbox" disabled={submitting} /></td>
                            <td className="igf-itd igf-itd-no">{i + 1}</td>
                            <td className="igf-itd">
                              <input 
                                className={`igf-cell-input${hasFieldError(companyField) ? ' field-error' : ''}`} 
                                value={row.company} 
                                onChange={(e) => {
                                  setDefaults(defaults.map(r => r.id === row.id ? { ...r, company: e.target.value } : r));
                                  setIsDirty(true);
                                }} 
                                disabled={submitting}
                                maxLength={140}
                                placeholder="Alphabets only"
                                data-field={companyField}
                              />
                              {getFieldError(companyField) && (
                                <div className="igf-error-msg" style={{ fontSize: '11px', marginTop: '2px' }}>
                                  {getFieldError(companyField)}
                                </div>
                              )}
                            </td>
                            <td className="igf-itd">
                              <input 
                                className={`igf-cell-input${hasFieldError(warehouseField) ? ' field-error' : ''}`} 
                                value={row.defaultWarehouse} 
                                onChange={(e) => {
                                  setDefaults(defaults.map(r => r.id === row.id ? { ...r, defaultWarehouse: e.target.value } : r));
                                  setIsDirty(true);
                                }} 
                                disabled={submitting}
                                maxLength={140}
                                placeholder="Alphabets only"
                                data-field={warehouseField}
                              />
                              {getFieldError(warehouseField) && (
                                <div className="igf-error-msg" style={{ fontSize: '11px', marginTop: '2px' }}>
                                  {getFieldError(warehouseField)}
                                </div>
                              )}
                            </td>
                            <td className="igf-itd">
                              <button className="igf-remove-row" onClick={() => removeDefaultRow(row.id)} type="button" disabled={submitting}>×</button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <button className="igf-add-row" onClick={addDefaultRow} type="button" disabled={submitting}>
                <FaPlus size={10} /> Add row
              </button>
            </div>

            <div className="igf-divider" />

            {/* Taxes */}
            <span className="igf-section-title">Item Tax</span>

            <div className="igf-field">
              <div className="igf-table-block">
                <table className="igf-inline-table">
                  <thead>
                    <tr>
                      <th className="igf-ith igf-ith-no"><input type="checkbox" className="igf-checkbox" disabled={submitting} /></th>
                      <th className="igf-ith">No.</th>
                      <th className="igf-ith">Item Tax Template <span className="igf-required">*</span></th>
                      <th className="igf-ith">Tax Category</th>
                      <th className="igf-ith">Valid From</th>
                      <th className="igf-ith">Min Net Rate</th>
                      <th className="igf-ith">Max Net Rate</th>
                      <th className="igf-ith igf-ith-action">
                        <button className="igf-col-settings" title="Column settings" type="button" disabled={submitting}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                          </svg>
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxes.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="igf-empty-row">No rows</td>
                      </tr>
                    ) : (
                      taxes.map((row, i) => {
                        const templateField = `taxes[${i}].itemTaxTemplate`;
                        const categoryField = `taxes[${i}].taxCategory`;
                        const validFromField = `taxes[${i}].validFrom`;
                        const minRateField = `taxes[${i}].minNetRate`;
                        const maxRateField = `taxes[${i}].maxNetRate`;
                        
                        return (
                          <tr key={row.id} className="igf-itr">
                            <td className="igf-itd"><input type="checkbox" className="igf-checkbox" disabled={submitting} /></td>
                            <td className="igf-itd igf-itd-no">{i + 1}</td>
                            <td className="igf-itd">
                              <input 
                                className={`igf-cell-input${hasFieldError(templateField) ? ' field-error' : ''}`} 
                                value={row.itemTaxTemplate} 
                                onChange={(e) => {
                                  setTaxes(taxes.map(r => r.id === row.id ? { ...r, itemTaxTemplate: e.target.value } : r));
                                  setIsDirty(true);
                                }} 
                                disabled={submitting}
                                maxLength={140}
                                placeholder="Alphabets only"
                                data-field={templateField}
                              />
                              {getFieldError(templateField) && (
                                <div className="igf-error-msg" style={{ fontSize: '11px', marginTop: '2px' }}>
                                  {getFieldError(templateField)}
                                </div>
                              )}
                            </td>
                            <td className="igf-itd">
                              <input 
                                className={`igf-cell-input${hasFieldError(categoryField) ? ' field-error' : ''}`} 
                                value={row.taxCategory} 
                                onChange={(e) => {
                                  setTaxes(taxes.map(r => r.id === row.id ? { ...r, taxCategory: e.target.value } : r));
                                  setIsDirty(true);
                                }} 
                                disabled={submitting}
                                maxLength={140}
                                placeholder="Alphabets only"
                                data-field={categoryField}
                              />
                              {getFieldError(categoryField) && (
                                <div className="igf-error-msg" style={{ fontSize: '11px', marginTop: '2px' }}>
                                  {getFieldError(categoryField)}
                                </div>
                              )}
                            </td>
                            <td className="igf-itd">
                              <input 
                                className={`igf-cell-input${hasFieldError(validFromField) ? ' field-error' : ''}`} 
                                value={row.validFrom} 
                                onChange={(e) => {
                                  setTaxes(taxes.map(r => r.id === row.id ? { ...r, validFrom: e.target.value } : r));
                                  setIsDirty(true);
                                }} 
                                disabled={submitting}
                                maxLength={140}
                                placeholder="Alphabets only"
                                data-field={validFromField}
                              />
                              {getFieldError(validFromField) && (
                                <div className="igf-error-msg" style={{ fontSize: '11px', marginTop: '2px' }}>
                                  {getFieldError(validFromField)}
                                </div>
                              )}
                            </td>
                            <td className="igf-itd">
                              <input 
                                className={`igf-cell-input${hasFieldError(minRateField) ? ' field-error' : ''}`} 
                                value={row.minNetRate} 
                                onChange={(e) => {
                                  setTaxes(taxes.map(r => r.id === row.id ? { ...r, minNetRate: e.target.value } : r));
                                  setIsDirty(true);
                                }} 
                                disabled={submitting}
                                maxLength={140}
                                placeholder="Numbers only"
                                data-field={minRateField}
                              />
                              {getFieldError(minRateField) && (
                                <div className="igf-error-msg" style={{ fontSize: '11px', marginTop: '2px' }}>
                                  {getFieldError(minRateField)}
                                </div>
                              )}
                            </td>
                            <td className="igf-itd">
                              <input 
                                className={`igf-cell-input${hasFieldError(maxRateField) ? ' field-error' : ''}`} 
                                value={row.maxNetRate} 
                                onChange={(e) => {
                                  setTaxes(taxes.map(r => r.id === row.id ? { ...r, maxNetRate: e.target.value } : r));
                                  setIsDirty(true);
                                }} 
                                disabled={submitting}
                                maxLength={140}
                                placeholder="Numbers only"
                                data-field={maxRateField}
                              />
                              {getFieldError(maxRateField) && (
                                <div className="igf-error-msg" style={{ fontSize: '11px', marginTop: '2px' }}>
                                  {getFieldError(maxRateField)}
                                </div>
                              )}
                            </td>
                            <td className="igf-itd">
                              <button className="igf-remove-row" onClick={() => removeTaxRow(row.id)} type="button" disabled={submitting}>×</button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <button className="igf-add-row" onClick={addTaxRow} type="button" disabled={submitting}>
                <FaPlus size={10} /> Add row
              </button>
            </div>

            {/* ─── Comments & Activity (only for existing records) ─── */}
            {!isNew && (
              <>
                <div className="igf-divider" />
                <span className="igf-section-title">Comments</span>

                <div className="igf-comment-input-row">
                  <div className="igf-comment-avatar">AD</div>
                  <input
                    className="igf-comment-input"
                    placeholder="Type a reply / comment"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={submitting}
                    maxLength={140}
                  />
                </div>

                {comments.map((c) => (
                  <div key={c.id} className="igf-comment-row">
                    <div className="igf-comment-avatar">{c.initials}</div>
                    <div>
                      <div className="igf-comment-author">{c.author} <span className="igf-comment-time">{c.time}</span></div>
                      <div className="igf-comment-text">{c.text}</div>
                    </div>
                  </div>
                ))}

                <div className="igf-divider" />

                <div className="igf-activity-header">
                  <span className="igf-section-title igf-activity-title">Activity</span>
                  <button className="igf-new-email-btn" type="button" disabled={submitting}>+ New Email</button>
                </div>

                <ul className="igf-activity-list">
                  {activity.map((a, i) => (
                    <li key={i} className="igf-activity-item">
                      {a.text} · <span className="igf-activity-time">{a.time}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* ─── Footer ────────────────────────────────────────────────── */}
          <div className="igf-footer">
            <button
              type="button"
              onClick={() => navigate('/item-group')}
              className="cancel-btn"
              disabled={submitting}
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