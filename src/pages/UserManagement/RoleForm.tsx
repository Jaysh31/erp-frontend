// RoleForm.tsx
import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaSave,
  FaSpinner,
  FaExclamationCircle,
  FaUserTag,
  FaToggleOn,
  FaUnlock,
  FaShieldAlt,
} from 'react-icons/fa';
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';
import "./RoleForm.css";

// interface Role {
//   id: number;
//   name: string;
//   role_name: string;
//   disabled: number;
//   desk_access: number;
//   two_factor_auth: number;
//   is_custom: number;
//   home_page: string;
//   restrict_to_domain: string;
// }

export default function RoleForm() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const roleId = isNew ? null : parseInt(id || "0");

  // ─── Form State ────────────────────────────────────────────────────────
  const [roleName, setRoleName] = useState('');
  const [deskAccess, setDeskAccess] = useState(1);
  const [twoFactorAuth, setTwoFactorAuth] = useState(0);
  const [disabled, setDisabled] = useState(0);
  const [isCustom, setIsCustom] = useState(0);
  const [homePage, setHomePage] = useState('');
  const [restrictToDomain, setRestrictToDomain] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ─── Fetch Role Data ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isNew && roleId) {
      fetchRoleData();
    }
  }, [isNew, roleId]);

  const fetchRoleData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/role/${roleId}`);
      if (response.data.success === 1 && response.data.data) {
        const role = response.data.data;
        setRoleName(role.role_name || role.name || '');
        setDeskAccess(role.desk_access ?? 1);
        setTwoFactorAuth(role.two_factor_auth || 0);
        setDisabled(role.disabled || 0);
        setIsCustom(role.is_custom || 0);
        setHomePage(role.home_page || '');
        setRestrictToDomain(role.restrict_to_domain || '');
      }
    } catch (err) {
      console.error('Error fetching role:', err);
      setApiError('Failed to load role data');
    } finally {
      setLoading(false);
    }
  };

  // ─── Validation ──────────────────────────────────────────────────────
  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'roleName':
        if (!value?.trim()) return 'Role name is required';
        if (value.length < 2) return 'Role name must be at least 2 characters';
        return '';
      default:
        return '';
    }
  };

  const handleFieldBlur = (field: string, value: any) => {
    const error = validateField(field, value);
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateAllFields = (): boolean => {
    const newErrors: Record<string, string> = {};
    let hasError = false;

    const roleNameError = validateField('roleName', roleName);
    if (roleNameError) {
      newErrors.roleName = roleNameError;
      hasError = true;
    }

    setFieldErrors(newErrors);
    return !hasError;
  };

  // ─── Handlers ────────────────────────────────────────────────────────
  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError(null);

    // 调试：打印当前模式，确认 isNew 是否为 true
    console.log('🔍 isNew:', isNew, 'roleId:', roleId);

    if (!validateAllFields()) {
      const firstErrorField = document.querySelector('.field-error');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (firstErrorField as HTMLElement).focus();
      }
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: roleName.trim(),
        role_name: roleName.trim(),
        desk_access: deskAccess,
        two_factor_auth: twoFactorAuth,
        disabled: disabled,
        is_custom: isCustom,
        home_page: homePage || null,
        restrict_to_domain: restrictToDomain || null,
      };

      let response;
      if (isNew) {
        response = await api.post('/role', payload);
      } else {
        response = await api.put('/role', { ...payload, id: roleId });
      }

      if (response.data.success === 1) {
        navigate('/role');
      } else {
        setApiError(response.data.message || 'Failed to save role');
      }
    } catch (err: any) {
      console.error('Error saving role:', err);
      if (err.response) {
        setApiError(err.response.data?.message || 'Failed to save role');
      } else {
        setApiError('An unexpected error occurred');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSwitch = (value: number): number => {
    return value === 1 ? 0 : 1;
  };

  // ─── Loading State ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`rf-page ${theme}`}>
        <div className="rf-loading">
          <FaSpinner className="rf-spinning" size={32} />
          <p>Loading role data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rf-page ${theme}`}>
      <div className="rf-inner">

        {/* ─── API Error Display ────────────────────────────────────── */}
        {apiError && (
          <div className="rf-api-error">
            <FaExclamationCircle className="error-icon" />
            <span>{apiError}</span>
            <button className="error-close" onClick={() => setApiError(null)}>×</button>
          </div>
        )}

        {/* ─── Header ────────────────────────────────────────────────── */}
        <div className="rf-header">
          <button onClick={() => navigate('/role')} className="back-btn">
            <FaArrowLeft size={9} /> Back
          </button>
          <div className="header-title">
            <h1>{isNew ? 'Add New Role' : 'Edit Role'}</h1>
          </div>
        </div>

        <form onSubmit={handleSave}>

          {/* ─── Main Form Card ────────────────────────────────────────── */}
          <div className="rf-card">

            <span className="rf-section-title">
              <FaUserTag className="section-icon" /> Role Details
            </span>

            {/* Role Name */}
            <div className="rf-field">
              <label className="rf-label">
                <FaUserTag className="rf-label-icon" /> Role Name <span className="rf-required">*</span>
              </label>
              <input
                type="text"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                onBlur={() => handleFieldBlur('roleName', roleName)}
                className={`form-field ${fieldErrors.roleName ? 'field-error' : ''}`}
                placeholder="Enter role name"
                disabled={submitting}
              />
              {fieldErrors.roleName && (
                <div className="field-error-message">
                  <FaExclamationCircle />
                  {fieldErrors.roleName}
                </div>
              )}
            </div>

            {/* Toggle Switches */}
            <div className="rf-toggle-group">
              <div className="rf-toggle-item">
                <label className="rf-toggle-label">
                  <FaUnlock className="toggle-icon" />
                  Desk Access
                </label>
                <button
                  type="button"
                  className={`rf-toggle ${deskAccess === 1 ? 'rf-toggle-active' : 'rf-toggle-inactive'}`}
                  onClick={() => setDeskAccess(toggleSwitch(deskAccess))}
                  disabled={submitting}
                >
                  <span className="rf-toggle-slider" />
                  <span className="rf-toggle-text">
                    {deskAccess === 1 ? 'Enabled' : 'Disabled'}
                  </span>
                </button>
              </div>

              <div className="rf-toggle-item">
                <label className="rf-toggle-label">
                  <FaShieldAlt className="toggle-icon" />
                  Two Factor Auth
                </label>
                <button
                  type="button"
                  className={`rf-toggle ${twoFactorAuth === 1 ? 'rf-toggle-active' : 'rf-toggle-inactive'}`}
                  onClick={() => setTwoFactorAuth(toggleSwitch(twoFactorAuth))}
                  disabled={submitting}
                >
                  <span className="rf-toggle-slider" />
                  <span className="rf-toggle-text">
                    {twoFactorAuth === 1 ? 'Enabled' : 'Disabled'}
                  </span>
                </button>
              </div>

              <div className="rf-toggle-item">
                <label className="rf-toggle-label">
                  <FaToggleOn className="toggle-icon" />
                  Status
                </label>
                <button
                  type="button"
                  className={`rf-toggle ${disabled === 0 ? 'rf-toggle-active' : 'rf-toggle-inactive'}`}
                  onClick={() => setDisabled(toggleSwitch(disabled))}
                  disabled={submitting}
                >
                  <span className="rf-toggle-slider" />
                  <span className="rf-toggle-text">
                    {disabled === 0 ? 'Active' : 'Disabled'}
                  </span>
                </button>
              </div>

              <div className="rf-toggle-item">
                <label className="rf-toggle-label">
                  <FaUserTag className="toggle-icon" />
                  Custom Role
                </label>
                <button
                  type="button"
                  className={`rf-toggle ${isCustom === 1 ? 'rf-toggle-active' : 'rf-toggle-inactive'}`}
                  onClick={() => setIsCustom(toggleSwitch(isCustom))}
                  disabled={submitting}
                >
                  <span className="rf-toggle-slider" />
                  <span className="rf-toggle-text">
                    {isCustom === 1 ? 'Yes' : 'No'}
                  </span>
                </button>
              </div>
            </div>

            {/* Home Page & Restrict To Domain */}
            <div className="rf-grid-2">
              <div className="rf-field">
                <label className="rf-label">Home Page</label>
                <input
                  type="text"
                  value={homePage}
                  onChange={(e) => setHomePage(e.target.value)}
                  className="form-field"
                  placeholder="Enter home page URL"
                  disabled={submitting}
                />
              </div>

              <div className="rf-field">
                <label className="rf-label">Restrict to Domain</label>
                <input
                  type="text"
                  value={restrictToDomain}
                  onChange={(e) => setRestrictToDomain(e.target.value)}
                  className="form-field"
                  placeholder="Enter domain restriction"
                  disabled={submitting}
                />
              </div>
            </div>

          </div>

          {/* ─── Footer ────────────────────────────────────────────────── */}
          <div className="rf-footer">
            <button
              type="button"
              onClick={() => navigate('/role')}
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
              {submitting && <FaSpinner className="rf-spinning" />}
              <FaSave size={12} />
              {isNew ? 'Create Role' : 'Update Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}