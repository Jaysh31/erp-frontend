import { useState, type FormEvent,  } from "react";
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
} from 'react-icons/fa';
import "./ItemGroupForm.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';

interface DefaultRow {
  id: string;
  company: string;
  defaultWarehouse: string;
  defaultPriceList: string;
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

const EXISTING_DATA: Record<string, {
  parentItemGroup: string;
  isGroup: boolean;
  hsnSac: string;
  defaults: DefaultRow[];
  taxes: TaxRow[];
  comments: Comment[];
  activity: { text: string; time: string }[];
}> = {
  "Consumable": {
    parentItemGroup: "All Item Groups",
    isGroup: false,
    hsnSac: "",
    defaults: [],
    taxes: [],
    comments: [
      { id: "1", author: "Administrator", initials: "AD", text: "Created this item group", time: "4 hours ago" },
    ],
    activity: [
      { text: "Administrator created this", time: "4 hours ago" },
      { text: "Administrator last edited this", time: "4 hours ago" },
    ],
  },
};

export default function ItemGroupForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const isNew = id === "new";
  const existing = id ? EXISTING_DATA[decodeURIComponent(id)] : undefined;
  const isEditMode = !isNew && existing;

  // ─── Form State ────────────────────────────────────────────────────────
  const [itemGroupName, setItemGroupName] = useState(isNew ? "" : (id !== "new" ? decodeURIComponent(id ?? "") : ""));
  const [parentItemGroup, setParentItemGroup] = useState(existing?.parentItemGroup ?? "");
  const [isGroup, setIsGroup] = useState(existing?.isGroup ?? false);
  const [hsnSac, setHsnSac] = useState(existing?.hsnSac ?? "");
  const [defaults, setDefaults] = useState<DefaultRow[]>(existing?.defaults ?? []);
  const [taxes, setTaxes] = useState<TaxRow[]>(existing?.taxes ?? []);
  const [commentText, setCommentText] = useState("");
  const [, setIsDirty] = useState(isNew);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const comments = existing?.comments ?? [];
  const activity = existing?.activity ?? [];

  // ─── Validation ──────────────────────────────────────────────────────
  const getAllValidationErrors = (): ValidationError[] => {
    const allErrors: ValidationError[] = [];

    // 1. Validate Item Group Name (required for new records)
    if (isNew && !itemGroupName.trim()) {
      allErrors.push({ 
        field: 'itemGroupName', 
        label: 'Item Group Name', 
        message: 'Item group name is required' 
      });
    }

    // 2. Validate Item Group Name length (max 140 characters)
    if (itemGroupName && itemGroupName.length > 140) {
      allErrors.push({ 
        field: 'itemGroupName', 
        label: 'Item Group Name', 
        message: 'Item group name must not exceed 140 characters' 
      });
    }

    // 3. Validate Parent Item Group length (max 140 characters)
    if (parentItemGroup && parentItemGroup.length > 140) {
      allErrors.push({ 
        field: 'parentItemGroup', 
        label: 'Parent Item Group', 
        message: 'Parent item group must not exceed 140 characters' 
      });
    }

    // 4. Validate HSN/SAC length (max 140 characters)
    if (hsnSac && hsnSac.length > 140) {
      allErrors.push({ 
        field: 'hsnSac', 
        label: 'HSN/SAC', 
        message: 'HSN/SAC must not exceed 140 characters' 
      });
    }

    // 5. Validate defaults rows
    defaults.forEach((row, index) => {
      if (!row.company.trim()) {
        allErrors.push({
          field: `defaults[${index}].company`,
          label: `Default Row ${index + 1} - Company`,
          message: `Company is required in default row ${index + 1}`
        });
      }
      if (row.company && row.company.length > 140) {
        allErrors.push({
          field: `defaults[${index}].company`,
          label: `Default Row ${index + 1} - Company`,
          message: `Company must not exceed 140 characters in row ${index + 1}`
        });
      }
      if (row.defaultWarehouse && row.defaultWarehouse.length > 140) {
        allErrors.push({
          field: `defaults[${index}].defaultWarehouse`,
          label: `Default Row ${index + 1} - Warehouse`,
          message: `Default warehouse must not exceed 140 characters in row ${index + 1}`
        });
      }
      if (row.defaultPriceList && row.defaultPriceList.length > 140) {
        allErrors.push({
          field: `defaults[${index}].defaultPriceList`,
          label: `Default Row ${index + 1} - Price List`,
          message: `Default price list must not exceed 140 characters in row ${index + 1}`
        });
      }
    });

    // 6. Validate taxes rows
    taxes.forEach((row, index) => {
      if (!row.itemTaxTemplate.trim()) {
        allErrors.push({
          field: `taxes[${index}].itemTaxTemplate`,
          label: `Tax Row ${index + 1} - Item Tax Template`,
          message: `Item tax template is required in tax row ${index + 1}`
        });
      }
      if (row.itemTaxTemplate && row.itemTaxTemplate.length > 140) {
        allErrors.push({
          field: `taxes[${index}].itemTaxTemplate`,
          label: `Tax Row ${index + 1} - Item Tax Template`,
          message: `Item tax template must not exceed 140 characters in row ${index + 1}`
        });
      }
      if (row.taxCategory && row.taxCategory.length > 140) {
        allErrors.push({
          field: `taxes[${index}].taxCategory`,
          label: `Tax Row ${index + 1} - Tax Category`,
          message: `Tax category must not exceed 140 characters in row ${index + 1}`
        });
      }
      if (row.validFrom && row.validFrom.length > 140) {
        allErrors.push({
          field: `taxes[${index}].validFrom`,
          label: `Tax Row ${index + 1} - Valid From`,
          message: `Valid from must not exceed 140 characters in row ${index + 1}`
        });
      }
      if (row.minNetRate && row.minNetRate.length > 140) {
        allErrors.push({
          field: `taxes[${index}].minNetRate`,
          label: `Tax Row ${index + 1} - Min Net Rate`,
          message: `Min net rate must not exceed 140 characters in row ${index + 1}`
        });
      }
      if (row.maxNetRate && row.maxNetRate.length > 140) {
        allErrors.push({
          field: `taxes[${index}].maxNetRate`,
          label: `Tax Row ${index + 1} - Max Net Rate`,
          message: `Max net rate must not exceed 140 characters in row ${index + 1}`
        });
      }
      // Validate numeric fields
      if (row.minNetRate && isNaN(Number(row.minNetRate))) {
        allErrors.push({
          field: `taxes[${index}].minNetRate`,
          label: `Tax Row ${index + 1} - Min Net Rate`,
          message: `Min net rate must be a number in row ${index + 1}`
        });
      }
      if (row.maxNetRate && isNaN(Number(row.maxNetRate))) {
        allErrors.push({
          field: `taxes[${index}].maxNetRate`,
          label: `Tax Row ${index + 1} - Max Net Rate`,
          message: `Max net rate must be a number in row ${index + 1}`
        });
      }
    });

    return allErrors;
  };

  // ─── Field Error Helper ────────────────────────────────────────────
  const getFieldError = (field: string): string | undefined => {
    // Only show errors if form has been submitted
    if (!formSubmitted) {
      return undefined;
    }
    return errors[field];
  };

  // ─── Handlers ────────────────────────────────────────────────────────
  const addDefaultRow = () => {
    setDefaults([...defaults, { id: Date.now().toString(), company: "", defaultWarehouse: "", defaultPriceList: "" }]);
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

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError(null);
    setFormSubmitted(true);

    const validationErrorsList = getAllValidationErrors();
    if (validationErrorsList.length > 0) {
      // Set errors
      const fieldErrors: { [key: string]: string } = {};
      validationErrorsList.forEach(error => {
        fieldErrors[error.field] = error.message;
      });
      setErrors(fieldErrors);
      
      // Scroll to first error field
      const firstError = validationErrorsList[0];
      const element = document.querySelector(`[data-field="${firstError.field}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Focus on the first error field
        const input = element as HTMLInputElement;
        input.focus();
      }
      return;
    }

    setSubmitting(true);
    try {
      if (isNew) {
        // Create new item group
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
        // Update existing item group
        const payload = {
          parent_item_group: parentItemGroup || "All Item Groups",
          is_group: isGroup ? 1 : 0,
          modified_by: "Administrator",
        };
        
        console.log('Update mode - payload:', payload);
        setIsDirty(false);
        navigate('/item-group');
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

  return (
    <div className={`igf-page ${theme}`}>
      <div className="igf-inner">

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
                  className={`form-field${getFieldError('itemGroupName') ? ' field-error' : ''}`}
                  placeholder="Enter item group name (max 140 characters)"
                  disabled={submitting}
                  maxLength={140}
                  data-field="itemGroupName"
                />
                {getFieldError('itemGroupName') && (
                  <span className="igf-error-msg" style={{ color: 'red', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    <FaExclamationCircle size={10} /> {getFieldError('itemGroupName')}
                  </span>
                )}
                {itemGroupName.length > 0 && (
                  <p className="igf-field-hint" style={{ fontSize: '11px', color: itemGroupName.length > 140 ? '#dc3545' : '#6c757d' }}>
                    {itemGroupName.length}/140 characters
                  </p>
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
                  className={`form-field${getFieldError('parentItemGroup') ? ' field-error' : ''}`}
                  placeholder="Select parent group (max 140 characters)"
                  disabled={submitting}
                  maxLength={140}
                  data-field="parentItemGroup"
                />
                {getFieldError('parentItemGroup') && (
                  <span className="igf-error-msg" style={{ color: 'red', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    <FaExclamationCircle size={10} /> {getFieldError('parentItemGroup')}
                  </span>
                )}
                {parentItemGroup.length > 0 && (
                  <p className="igf-field-hint" style={{ fontSize: '11px', color: parentItemGroup.length > 140 ? '#dc3545' : '#6c757d' }}>
                    {parentItemGroup.length}/140 characters
                  </p>
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
                  className={`form-field${getFieldError('hsnSac') ? ' field-error' : ''}`}
                  placeholder="Enter HSN/SAC code (max 140 characters)"
                  disabled={submitting}
                  maxLength={140}
                  data-field="hsnSac"
                />
                {getFieldError('hsnSac') && (
                  <span className="igf-error-msg" style={{ color: 'red', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    <FaExclamationCircle size={10} /> {getFieldError('hsnSac')}
                  </span>
                )}
                {hsnSac.length > 0 && (
                  <p className="igf-field-hint" style={{ fontSize: '11px', color: hsnSac.length > 140 ? '#dc3545' : '#6c757d' }}>
                    {hsnSac.length}/140 characters
                  </p>
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
                      <th className="igf-ith">Default Price List</th>
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
                        <td colSpan={6} className="igf-empty-row">No rows</td>
                      </tr>
                    ) : (
                      defaults.map((row, i) => {
                        const companyError = getFieldError(`defaults[${i}].company`);
                        const warehouseError = getFieldError(`defaults[${i}].defaultWarehouse`);
                        const priceListError = getFieldError(`defaults[${i}].defaultPriceList`);
                        
                        return (
                          <tr key={row.id} className="igf-itr">
                            <td className="igf-itd"><input type="checkbox" className="igf-checkbox" disabled={submitting} /></td>
                            <td className="igf-itd igf-itd-no">{i + 1}</td>
                            <td className="igf-itd">
                              <input 
                                className={`igf-cell-input${companyError ? ' field-error' : ''}`} 
                                value={row.company} 
                                onChange={(e) => {
                                  setDefaults(defaults.map(r => r.id === row.id ? { ...r, company: e.target.value } : r));
                                  setIsDirty(true);
                                }} 
                                disabled={submitting}
                                maxLength={140}
                                placeholder="Required"
                                data-field={`defaults[${i}].company`}
                              />
                              {companyError && (
                                <span className="igf-error-msg" style={{ color: 'red', fontSize: '11px', marginTop: '2px', display: 'block' }}>
                                  <FaExclamationCircle size={10} /> {companyError}
                                </span>
                              )}
                            </td>
                            <td className="igf-itd">
                              <input 
                                className={`igf-cell-input${warehouseError ? ' field-error' : ''}`} 
                                value={row.defaultWarehouse} 
                                onChange={(e) => {
                                  setDefaults(defaults.map(r => r.id === row.id ? { ...r, defaultWarehouse: e.target.value } : r));
                                  setIsDirty(true);
                                }} 
                                disabled={submitting}
                                maxLength={140}
                                data-field={`defaults[${i}].defaultWarehouse`}
                              />
                              {warehouseError && (
                                <span className="igf-error-msg" style={{ color: 'red', fontSize: '11px', marginTop: '2px', display: 'block' }}>
                                  <FaExclamationCircle size={10} /> {warehouseError}
                                </span>
                              )}
                            </td>
                            <td className="igf-itd">
                              <input 
                                className={`igf-cell-input${priceListError ? ' field-error' : ''}`} 
                                value={row.defaultPriceList} 
                                onChange={(e) => {
                                  setDefaults(defaults.map(r => r.id === row.id ? { ...r, defaultPriceList: e.target.value } : r));
                                  setIsDirty(true);
                                }} 
                                disabled={submitting}
                                maxLength={140}
                                data-field={`defaults[${i}].defaultPriceList`}
                              />
                              {priceListError && (
                                <span className="igf-error-msg" style={{ color: 'red', fontSize: '11px', marginTop: '2px', display: 'block' }}>
                                  <FaExclamationCircle size={10} /> {priceListError}
                                </span>
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
              <p className="igf-field-hint">All fields are limited to 140 characters</p>
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
                        const templateError = getFieldError(`taxes[${i}].itemTaxTemplate`);
                        const categoryError = getFieldError(`taxes[${i}].taxCategory`);
                        const validFromError = getFieldError(`taxes[${i}].validFrom`);
                        const minRateError = getFieldError(`taxes[${i}].minNetRate`);
                        const maxRateError = getFieldError(`taxes[${i}].maxNetRate`);
                        
                        return (
                          <tr key={row.id} className="igf-itr">
                            <td className="igf-itd"><input type="checkbox" className="igf-checkbox" disabled={submitting} /></td>
                            <td className="igf-itd igf-itd-no">{i + 1}</td>
                            <td className="igf-itd">
                              <input 
                                className={`igf-cell-input${templateError ? ' field-error' : ''}`} 
                                value={row.itemTaxTemplate} 
                                onChange={(e) => {
                                  setTaxes(taxes.map(r => r.id === row.id ? { ...r, itemTaxTemplate: e.target.value } : r));
                                  setIsDirty(true);
                                }} 
                                disabled={submitting}
                                maxLength={140}
                                placeholder="Required"
                                data-field={`taxes[${i}].itemTaxTemplate`}
                              />
                              {templateError && (
                                <span className="igf-error-msg" style={{ color: 'red', fontSize: '11px', marginTop: '2px', display: 'block' }}>
                                  <FaExclamationCircle size={10} /> {templateError}
                                </span>
                              )}
                            </td>
                            <td className="igf-itd">
                              <input 
                                className={`igf-cell-input${categoryError ? ' field-error' : ''}`} 
                                value={row.taxCategory} 
                                onChange={(e) => {
                                  setTaxes(taxes.map(r => r.id === row.id ? { ...r, taxCategory: e.target.value } : r));
                                  setIsDirty(true);
                                }} 
                                disabled={submitting}
                                maxLength={140}
                                data-field={`taxes[${i}].taxCategory`}
                              />
                              {categoryError && (
                                <span className="igf-error-msg" style={{ color: 'red', fontSize: '11px', marginTop: '2px', display: 'block' }}>
                                  <FaExclamationCircle size={10} /> {categoryError}
                                </span>
                              )}
                            </td>
                            <td className="igf-itd">
                              <input 
                                className={`igf-cell-input${validFromError ? ' field-error' : ''}`} 
                                value={row.validFrom} 
                                onChange={(e) => {
                                  setTaxes(taxes.map(r => r.id === row.id ? { ...r, validFrom: e.target.value } : r));
                                  setIsDirty(true);
                                }} 
                                disabled={submitting}
                                maxLength={140}
                                data-field={`taxes[${i}].validFrom`}
                              />
                              {validFromError && (
                                <span className="igf-error-msg" style={{ color: 'red', fontSize: '11px', marginTop: '2px', display: 'block' }}>
                                  <FaExclamationCircle size={10} /> {validFromError}
                                </span>
                              )}
                            </td>
                            <td className="igf-itd">
                              <input 
                                className={`igf-cell-input${minRateError ? ' field-error' : ''}`} 
                                value={row.minNetRate} 
                                onChange={(e) => {
                                  setTaxes(taxes.map(r => r.id === row.id ? { ...r, minNetRate: e.target.value } : r));
                                  setIsDirty(true);
                                }} 
                                disabled={submitting}
                                maxLength={140}
                                placeholder="Number"
                                data-field={`taxes[${i}].minNetRate`}
                              />
                              {minRateError && (
                                <span className="igf-error-msg" style={{ color: 'red', fontSize: '11px', marginTop: '2px', display: 'block' }}>
                                  <FaExclamationCircle size={10} /> {minRateError}
                                </span>
                              )}
                            </td>
                            <td className="igf-itd">
                              <input 
                                className={`igf-cell-input${maxRateError ? ' field-error' : ''}`} 
                                value={row.maxNetRate} 
                                onChange={(e) => {
                                  setTaxes(taxes.map(r => r.id === row.id ? { ...r, maxNetRate: e.target.value } : r));
                                  setIsDirty(true);
                                }} 
                                disabled={submitting}
                                maxLength={140}
                                placeholder="Number"
                                data-field={`taxes[${i}].maxNetRate`}
                              />
                              {maxRateError && (
                                <span className="igf-error-msg" style={{ color: 'red', fontSize: '11px', marginTop: '2px', display: 'block' }}>
                                  <FaExclamationCircle size={10} /> {maxRateError}
                                </span>
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
              <p className="igf-field-hint">All fields are limited to 140 characters. Min/Max Net Rate should be numbers.</p>
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