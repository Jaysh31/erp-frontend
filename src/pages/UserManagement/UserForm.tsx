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
  FaPlus,
  FaTimes,
  FaCalendarAlt,
  FaVenusMars,
  FaMapMarkerAlt,
  FaUserTag,
  FaShieldAlt,
  FaCheck,
  FaSearch,
} from 'react-icons/fa';
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';
import "./UserForm.css";

interface Role {
  id: number;
  name: string;
  role_name: string;
  disabled: number;
  desk_access?: number;
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
  
  // ─── Multiple Roles Management ──────────────────────────────────────
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roleSearch, setRoleSearch] = useState('');
  const [, setShowRoleDropdown] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ─── Fetch Roles ──────────────────────────────────────────────────────
  useEffect(() => {
    fetchAllRoles();
  }, []);

  const fetchAllRoles = async () => {
    setRolesLoading(true);
    try {
      const response = await api.get('/role');
      if (response.data.success === 1 && response.data.data) {
        const activeRoles = response.data.data.filter((r: Role) => r.disabled === 0);
        setAllRoles(activeRoles);
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
        
        // Set selected roles from user data
        if (user.roles && Array.isArray(user.roles)) {
          const roleIds = user.roles.map((r: any) => r.id);
          setSelectedRoles(roleIds);
        }
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      setApiError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  // ─── Role Management Functions ──────────────────────────────────────

  const handleAddRole = (roleId: number) => {
    if (!selectedRoles.includes(roleId)) {
      setSelectedRoles([...selectedRoles, roleId]);
    }
    setShowRoleDropdown(false);
    setRoleSearch('');
  };

  const handleRemoveRole = (roleId: number) => {
    setSelectedRoles(selectedRoles.filter(id => id !== roleId));
  };

  const handleRoleProfileChange = (value: string) => {
    setRoleProfileName(value);
    // If a role profile is selected, also add it as a role if not already selected
    if (value) {
      const matchingRole = allRoles.find(r => 
        (r.role_name || r.name).toLowerCase() === value.toLowerCase()
      );
      if (matchingRole && !selectedRoles.includes(matchingRole.id)) {
        setSelectedRoles([...selectedRoles, matchingRole.id]);
      }
    }
  };

  // ─── Role Search Filter ──────────────────────────────────────────────
  const filteredRoles = roleSearch
    ? allRoles.filter(r => 
        (r.role_name || r.name).toLowerCase().includes(roleSearch.toLowerCase()) &&
        !selectedRoles.includes(r.id)
      )
    : allRoles.filter(r => !selectedRoles.includes(r.id));

  // ─── Get selected role objects ──────────────────────────────────────
  const getSelectedRoleObjects = () => {
    return selectedRoles
      .map(id => allRoles.find(r => r.id === id))
      .filter((r): r is Role => r !== undefined);
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
      case 'roleProfileName':
        if (!value?.trim()) return 'Role profile is required';
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

    if (selectedRoles.length === 0) {
      newErrors.roles = 'At least one role must be assigned';
      hasError = true;
    }

    setFieldErrors(newErrors);
    return !hasError;
  };

  // ─── Handle Save ──────────────────────────────────────────────────────
  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError(null);
    setSuccessMessage(null);

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
        // Edit mode - use update with roles
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
        // Create new user with roles
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
        setSuccessMessage(response.data.message || 'User saved successfully!');
        setTimeout(() => {
          navigate('/user-management');
        }, 1500);
      } else {
        setApiError(response.data.message || 'Failed to save user');
      }
    } catch (err: any) {
      console.error('Error saving user:', err);
      if (err.response) {
        if (err.response.status === 409) {
          setApiError('A user with this email or mobile already exists');
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

        {successMessage && (
          <div className="uf-api-success">
            <FaCheck className="success-icon" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="uf-header">
          <button onClick={() => navigate('/user-management')} className="back-btn">
            <FaArrowLeft size={9} /> Back
          </button>
          <div className="header-title">
            <h1>{isNew ? 'Add New User' : 'Edit User'}</h1>
            <span className="header-subtitle">
              {isNew ? 'Create a new user account with role assignments' : 'Update user information and roles'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="uf-card">

            <div className="uf-section">
              <span className="uf-section-title">
                <FaUser className="uf-section-icon" /> User Information
              </span>
            </div>

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
                  <div className="uf-error-text">
                    <FaExclamationCircle className="uf-error-icon" />
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
                  <div className="uf-error-text">
                    <FaExclamationCircle className="uf-error-icon" />
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
                  <div className="uf-error-text">
                    <FaExclamationCircle className="uf-error-icon" />
                    {fieldErrors.mobileNo}
                  </div>
                )}
              </div>

              <div className="uf-field">
                <label className="uf-label">
                  <FaVenusMars className="uf-label-icon" /> Gender
                </label>
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

            {/* Row 3: Birth Date, Location, Role Profile */}
            <div className="uf-grid-3">
              <div className="uf-field">
                <label className="uf-label">
                  <FaCalendarAlt className="uf-label-icon" /> Birth Date
                </label>
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
                  <FaMapMarkerAlt className="uf-label-icon" /> Location
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
                <label className="uf-label">
                  <FaUserTag className="uf-label-icon" /> Role Profile <span className="uf-required">*</span>
                </label>
                <select
                  value={roleProfileName}
                  onChange={(e) => handleRoleProfileChange(e.target.value)}
                  onBlur={() => handleFieldBlur('roleProfileName', roleProfileName)}
                  className={`form-field ${fieldErrors.roleProfileName ? 'field-error' : ''}`}
                  disabled={submitting || rolesLoading}
                >
                  <option value="">{rolesLoading ? 'Loading roles...' : 'Select Role Profile'}</option>
                  {allRoles.map((role) => (
                    <option key={role.id} value={role.role_name || role.name}>
                      {role.role_name || role.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.roleProfileName && (
                  <div className="uf-error-text">
                    <FaExclamationCircle className="uf-error-icon" />
                    {fieldErrors.roleProfileName}
                  </div>
                )}
              </div>
            </div>

            {/* ─── Roles Management Section ──────────────────────────────── */}
            <div className="uf-divider" />
            
            <div className="uf-section">
              <span className="uf-section-title">
                <FaShieldAlt className="uf-section-icon" /> Role Assignments <span className="uf-required">*</span>
              </span>
              <span className="uf-section-subtitle">Assign one or more roles to this user</span>
            </div>

            {fieldErrors.roles && (
              <div className="uf-error-text uf-error-block">
                <FaExclamationCircle className="uf-error-icon" />
                {fieldErrors.roles}
              </div>
            )}

            <div className="uf-roles-container">
              {/* Selected Roles */}
              <div className="uf-selected-roles">
                <div className="uf-selected-header">
                  <label className="uf-label">Assigned Roles</label>
                  <span className="uf-role-count">{selectedRoles.length}</span>
                </div>
                <div className="uf-role-tags-wrapper">
                  {selectedRoles.length === 0 ? (
                    <div className="uf-no-roles">
                      <FaUserTag className="uf-no-roles-icon" />
                      <span>No roles assigned yet</span>
                      <span className="uf-no-roles-sub">Select roles from the right panel</span>
                    </div>
                  ) : (
                    <div className="uf-role-tags">
                      {getSelectedRoleObjects().map(role => (
                        <div key={role.id} className="uf-role-tag">
                          <FaCheck className="uf-role-tag-icon" size={10} />
                          <span>{role.role_name || role.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRole(role.id)}
                            className="uf-remove-role"
                            disabled={submitting}
                            title="Remove role"
                          >
                            <FaTimes size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Available Roles */}
              <div className="uf-available-roles">
                <div className="uf-available-header">
                  <label className="uf-label">Available Roles</label>
                  {rolesLoading && <FaSpinner className="uf-spinning-small" />}
                </div>
                <div className="uf-role-search">
                  <FaSearch className="uf-search-icon" />
                  <input
                    type="text"
                    value={roleSearch}
                    onChange={(e) => {
                      setRoleSearch(e.target.value);
                      setShowRoleDropdown(true);
                    }}
                    onFocus={() => setShowRoleDropdown(true)}
                    placeholder="Search available roles..."
                    className="form-field uf-search-input"
                    disabled={submitting || rolesLoading}
                  />
                </div>
                <div className="uf-role-list">
                  {rolesLoading ? (
                    <div className="uf-loading-roles">
                      <FaSpinner className="uf-spinning-small" />
                      <span>Loading roles...</span>
                    </div>
                  ) : filteredRoles.length === 0 ? (
                    <div className="uf-no-roles">
                      <span>No available roles</span>
                      {roleSearch && (
                        <span className="uf-no-roles-sub">Try a different search term</span>
                      )}
                    </div>
                  ) : (
                    filteredRoles.map(role => (
                      <div key={role.id} className="uf-role-item">
                        <div className="uf-role-item-info">
                          <span className="uf-role-item-name">{role.role_name || role.name}</span>
                          {role.desk_access === 1 && (
                            <span className="uf-role-item-badge">Desk Access</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddRole(role.id)}
                          className="uf-add-role"
                          disabled={submitting}
                          title="Add role"
                        >
                          <FaPlus size={10} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ─── Password Fields (Only for New Users) ────────────────── */}
            {isNew && (
              <>
                <div className="uf-divider" />
                <div className="uf-section">
                  <span className="uf-section-title">
                    <FaLock className="uf-section-icon" /> Security Settings
                  </span>
                </div>
                
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
                      <div className="uf-error-text">
                        <FaExclamationCircle className="uf-error-icon" />
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
                      <div className="uf-error-text">
                        <FaExclamationCircle className="uf-error-icon" />
                        {fieldErrors.confirmPassword}
                      </div>
                    )}
                  </div>
                </div>
                <div className="uf-password-hint">
                  <FaLock size={10} />
                  Password must be at least 6 characters long
                </div>
              </>
            )}

          </div>

          {/* ─── Footer ────────────────────────────────────────────────── */}
          <div className="uf-footer">
            <div className="uf-footer-left">
              {!isNew && (
                <span className="uf-last-modified">
                  Last modified: {new Date().toLocaleString()}
                </span>
              )}
            </div>
            <div className="uf-footer-right">
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
                {submitting ? 'Saving...' : isNew ? 'Create User' : 'Update User'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}