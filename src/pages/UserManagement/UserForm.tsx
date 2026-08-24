import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaSave,
  FaSpinner,
  FaExclamationCircle,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaStore,
} from 'react-icons/fa';
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';
import "./UserForm.css";

interface Role {
  id: number;
  name: string;
  role_name: string;
}

export default function UserForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  
  const isNew = id === "new" || id === "create" || id === "add" || !id;
  const userId = isNew ? null : parseInt(id || "0");

  // ─── Form State ────────────────────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [location, setLocation] = useState('');
  const [roleProfileName, setRoleProfileName] = useState('');
  const [selectedRoles, ] = useState<number[]>([]);

  // ─── Roles ─────────────────────────────────────────────────────────────
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ─── Fetch Roles ──────────────────────────────────────────────────────
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setRolesLoading(true);
    try {
      const response = await api.get('/role');
      if (response.data.success === 1 && response.data.data) {
        setRoles(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    } finally {
      setRolesLoading(false);
    }
  };

  // ─── Fetch User Data (for edit mode) ──────────────────────────────────
  useEffect(() => {
    if (!isNew && userId) {
      fetchUserData();
    }
  }, [isNew, userId]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/user/${userId}`);
      if (response.data.success === 1 && response.data.data) {
        const user = response.data.data;
        setEmail(user.email || '');
        setFirstName(user.first_name || '');
        setMiddleName(user.middle_name || '');
        setLastName(user.last_name || '');
        setMobileNo(user.mobile_no || '');
        setGender(user.gender || '');
        setBirthDate(user.birth_date ? user.birth_date.split('T')[0] : '');
        setLocation(user.location || '');
        setRoleProfileName(user.role_profile_name || '');
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      setApiError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (roleIdValue: string) => {
    if (!roleIdValue) {
      setRoleProfileName('');
      setSelectedRoleId(null);
      return;
    }
    const role = roles.find(r => String(r.id) === roleIdValue);
    if (!role) return;
    setRoleProfileName(role.role_name || role.name);
    setSelectedRoleId(role.id);
    handleFieldBlur('roleProfileName', role.role_name || role.name);
  };

  // ─── Validation ──────────────────────────────────────────────────────
  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'email':
        if (!value?.trim()) return 'Email is required';
        if (!/^\S+@\S+\.\S+$/.test(value)) return 'Invalid email format';
        return '';
      case 'password':
        if (isNew && !value?.trim()) return 'Password is required';
        if (value && value.length < 6) return 'Password must be at least 6 characters';
        return '';
      case 'confirmPassword':
        if (isNew && !value?.trim()) return 'Please confirm your password';
        if (isNew && value !== password) return 'Passwords do not match';
        return '';
      case 'firstName':
        if (!value?.trim()) return 'First name is required';
        return '';
      case 'mobileNo':
        if (!value?.trim()) return 'Mobile number is required';
        if (!/^[0-9]{10,11}$/.test(value)) return 'Mobile must be 10-11 digits';
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
    const fieldsToValidate: Record<string, { label: string; value: any }> = {
      email: { label: 'Email', value: email },
      firstName: { label: 'First Name', value: firstName },
      mobileNo: { label: 'Mobile Number', value: mobileNo },
      roleProfileName: { label: 'Role Profile', value: roleProfileName },
    };

    if (isNew) {
      fieldsToValidate.password = { label: 'Password', value: password };
      fieldsToValidate.confirmPassword = { label: 'Confirm Password', value: confirmPassword };
    }

    const newErrors: Record<string, string> = {};
    let hasError = false;

    Object.entries(fieldsToValidate).forEach(([key, { value }]) => {
      const error = validateField(key, value);
      if (error) {
        newErrors[key] = error;
        hasError = true;
      }
    });

    if (isNew && password && confirmPassword && password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      hasError = true;
    }

    setFieldErrors(newErrors);
    return !hasError;
  };

  // ─── Handle Save ──────────────────────────────────────────────────────
  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError(null);

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
      let response;

      if (!isNew) {
        // Edit mode
        const payload: Record<string, any> = {
          id: userId,
          email: email.trim(),
          mobile_no: mobileNo.trim(),
          role_profile_name: roleProfileName,
          roles: selectedRoles,
          first_name: firstName.trim(),
          middle_name: middleName.trim(),
          last_name: lastName.trim(),
          gender: gender,
          birth_date: birthDate || null,
          location: location.trim(),
          modified_by: 1,
        };

        if (password.trim()) {
          payload.password = password.trim();
        }

        response = await api.put('/user', payload);
      } else {
        // Create new user
        const payload = {
          email: email.trim(),
          password: password.trim(),
          mobile_no: mobileNo.trim(),
          role_profile_name: roleProfileName,
          roles: selectedRoles,
          first_name: firstName.trim(),
          middle_name: middleName.trim(),
          last_name: lastName.trim(),
          gender: gender,
          birth_date: birthDate || null,
          location: location.trim(),
          modified_by: 1,
        };

        response = await api.post('/user', payload);
      }

      if (response.data.success === 1) {
        navigate('/user-management');
      } else {
        setApiError(response.data.message || 'Failed to save user');
      }
    } catch (err: any) {
      console.error('Error saving user:', err);
      if (err.response) {
        if (err.response.status === 409) {
          setApiError('A user with this email already exists');
        } else {
          setApiError(err.response.data?.message || 'Failed to save user');
        }
      } else {
        setApiError('Network error. Please check your connection.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Loading State ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`uf-page ${theme}`}>
        <div className="uf-loading">
          <FaSpinner className="uf-spinning" size={32} />
          <p>Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`uf-page ${theme}`}>
      <div className="uf-inner">

        {apiError && (
          <div className="uf-api-error">
            <FaExclamationCircle className="error-icon" />
            <span>{apiError}</span>
            <button className="error-close" onClick={() => setApiError(null)}>×</button>
          </div>
        )}

        <div className="uf-header">
          <button onClick={() => navigate('/user-management')} className="back-btn">
            <FaArrowLeft size={9} /> Back
          </button>
          <div className="header-title">
            <h1>{isNew ? 'Add New User' : 'Edit User'}</h1>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="uf-card">

            <span className="uf-section-title">User Information</span>

            {/* Row 1: Email, First Name, Middle Name */}
            <div className="uf-grid-3">
              <div className="uf-field">
                <label className="uf-label">
                  <FaEnvelope className="uf-label-icon" /> Email <span className="uf-required">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleFieldBlur('email', email)}
                  className={`form-field ${fieldErrors.email ? 'field-error' : ''}`}
                  placeholder="Enter email address"
                  disabled={submitting || !isNew}
                  style={!isNew ? { backgroundColor: 'var(--layout-bg)' } : {}}
                />
                {fieldErrors.email && (
                  <div style={{ color: 'var(--danger-color)', fontSize: '11px', marginTop: '4px' }}>
                    <FaExclamationCircle style={{ marginRight: '4px', fontSize: '10px' }} />
                    {fieldErrors.email}
                  </div>
                )}
              </div>

              <div className="uf-field">
                <label className="uf-label">
                  <FaUser className="uf-label-icon" /> First Name <span className="uf-required">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onBlur={() => handleFieldBlur('firstName', firstName)}
                  className={`form-field ${fieldErrors.firstName ? 'field-error' : ''}`}
                  placeholder="Enter first name"
                  disabled={submitting}
                />
                {fieldErrors.firstName && (
                  <div style={{ color: 'var(--danger-color)', fontSize: '11px', marginTop: '4px' }}>
                    <FaExclamationCircle style={{ marginRight: '4px', fontSize: '10px' }} />
                    {fieldErrors.firstName}
                  </div>
                )}
              </div>

              <div className="uf-field">
                <label className="uf-label">Middle Name</label>
                <input
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  className="form-field"
                  placeholder="Enter middle name"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Row 2: Last Name, Mobile, Gender */}
            <div className="uf-grid-3">
              <div className="uf-field">
                <label className="uf-label">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="form-field"
                  placeholder="Enter last name"
                  disabled={submitting}
                />
              </div>

              <div className="uf-field">
                <label className="uf-label">
                  <FaPhone className="uf-label-icon" /> Mobile <span className="uf-required">*</span>
                </label>
                <input
                  type="text"
                  value={mobileNo}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '');
                    setMobileNo(cleaned);
                  }}
                  onBlur={() => handleFieldBlur('mobileNo', mobileNo)}
                  className={`form-field ${fieldErrors.mobileNo ? 'field-error' : ''}`}
                  placeholder="Enter 10-11 digit mobile"
                  maxLength={11}
                  disabled={submitting}
                />
                {fieldErrors.mobileNo && (
                  <div style={{ color: 'var(--danger-color)', fontSize: '11px', marginTop: '4px' }}>
                    <FaExclamationCircle style={{ marginRight: '4px', fontSize: '10px' }} />
                    {fieldErrors.mobileNo}
                  </div>
                )}
              </div>

              <div className="uf-field">
                <label className="uf-label">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="form-field"
                  disabled={submitting}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Row 3: Birth Date, Location, Role Profile Name */}
            <div className="uf-grid-3">
              <div className="uf-field">
                <label className="uf-label">Birth Date</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="form-field"
                  disabled={submitting}
                />
              </div>

              <div className="uf-field">
                <label className="uf-label">
                  <FaStore className="uf-label-icon" /> Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="form-field"
                  placeholder="Enter location"
                  disabled={submitting}
                />
              </div>

              <div className="uf-field">
                <label className="uf-label">Role Profile Name <span className="uf-required">*</span></label>
                <select
                  value={selectedRoleId ?? ''}
                  onChange={(e) => handleRoleSelect(e.target.value)}
                  onBlur={() => handleFieldBlur('roleProfileName', roleProfileName)}
                  className={`form-field ${fieldErrors.roleProfileName ? 'field-error' : ''}`}
                  disabled={submitting || rolesLoading}
                >
                  <option value="">{rolesLoading ? 'Loading roles...' : 'Select Role Profile'}</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.role_name || role.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.roleProfileName && (
                  <div style={{ color: 'var(--danger-color)', fontSize: '11px', marginTop: '4px' }}>
                    <FaExclamationCircle style={{ marginRight: '4px', fontSize: '10px' }} />
                    {fieldErrors.roleProfileName}
                  </div>
                )}
              </div>
            </div>

            {/* ─── Password Fields (Only for New Users) ────────────────── */}
            {isNew && (
              <>
                <div className="uf-divider" />
                <span className="uf-section-title">Security Settings</span>
                
                <div className="uf-grid-2">
                  <div className="uf-field">
                    <label className="uf-label">
                      <FaLock className="uf-label-icon" /> Password <span className="uf-required">*</span>
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => handleFieldBlur('password', password)}
                      className={`form-field ${fieldErrors.password ? 'field-error' : ''}`}
                      placeholder="Enter password (min 6 chars)"
                      disabled={submitting}
                    />
                    {fieldErrors.password && (
                      <div style={{ color: 'var(--danger-color)', fontSize: '11px', marginTop: '4px' }}>
                        <FaExclamationCircle style={{ marginRight: '4px', fontSize: '10px' }} />
                        {fieldErrors.password}
                      </div>
                    )}
                  </div>

                  <div className="uf-field">
                    <label className="uf-label">
                      <FaLock className="uf-label-icon" /> Confirm Password <span className="uf-required">*</span>
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={() => handleFieldBlur('confirmPassword', confirmPassword)}
                      className={`form-field ${fieldErrors.confirmPassword ? 'field-error' : ''}`}
                      placeholder="Confirm your password"
                      disabled={submitting}
                    />
                    {fieldErrors.confirmPassword && (
                      <div style={{ color: 'var(--danger-color)', fontSize: '11px', marginTop: '4px' }}>
                        <FaExclamationCircle style={{ marginRight: '4px', fontSize: '10px' }} />
                        {fieldErrors.confirmPassword}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '-4px', marginBottom: '4px' }}>
                  Password must be at least 6 characters long
                </div>
              </>
            )}

          </div>

          {/* ─── Footer ────────────────────────────────────────────────── */}
          <div className="uf-footer">
            <button
              type="button"
              onClick={() => navigate('/user-management')}
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
              {isNew ? 'Create User' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}