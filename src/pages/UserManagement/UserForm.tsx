import { useState, useEffect, useRef, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaSave,
  FaSpinner,
  FaExclamationCircle,
  FaInfoCircle,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaStore,
  FaSearch,
  FaBuilding,
  FaBriefcase,
  FaIdBadge,
} from 'react-icons/fa';
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';
import "./UserForm.css";

// interface User {
//   id: number;
//   name: string;
//   email: string;
//   full_name: string;
//   first_name: string;
//   last_name: string;
//   middle_name: string;
//   mobile_no?: string;
//   role_profile_name?: string;
//   gender?: string;
//   birth_date?: string;
//   location?: string;
//   redirect_url?: string;
//   creation: string;
//   modified: string;
//   modified_by: string | null;
//   owner: string | null;
// }

interface Employee {
  id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  employee_name: string;
  gender: string;
  date_of_birth?: string;
  company: string;
  department: string;
  designation: string;
  cell_number: string;
  company_email: string;
  personal_email: string;
  employee: string;
  employee_number?: string;
}

interface Role {
  id: number;
  name: string;
}

// Hardcoded roles
const ROLES: Role[] = [
  { id: 1, name: "Academics User" },
  { id: 2, name: "Accounts Manager" },
  { id: 3, name: "Accounts User" },
  { id: 4, name: "Administrator" },
  { id: 5, name: "All" },
  { id: 6, name: "Auditor" },
  { id: 7, name: "Customer" },
  { id: 8, name: "Dashboard Manager" },
  { id: 9, name: "Delivery Manager" },
  { id: 10, name: "Delivery User" },
  { id: 11, name: "Desk User" },
  { id: 12, name: "Employee" },
  { id: 13, name: "Fleet Manager" },
  { id: 14, name: "Fulfillment User" },
  { id: 15, name: "Guest" },
  { id: 16, name: "HR Manager" },
  { id: 17, name: "HR User" },
  { id: 18, name: "Inbox User" },
  { id: 19, name: "Item Manager" },
  { id: 20, name: "Knowledge Base Contributor" },
  { id: 21, name: "Knowledge Base Editor" },
  { id: 22, name: "Maintenance Manager" },
  { id: 23, name: "Maintenance User" },
  { id: 24, name: "Manufacturing Manager" },
  { id: 25, name: "Manufacturing User" },
  { id: 26, name: "Marketing Manager" },
  { id: 27, name: "Newsletter Manager" },
  { id: 28, name: "Prepared Report User" },
  { id: 29, name: "Projects Manager" },
  { id: 30, name: "Projects User" },
  { id: 31, name: "Purchase Manager" },
  { id: 32, name: "Purchase Master Manager" },
  { id: 33, name: "Purchase User" },
  { id: 34, name: "Quality Manager" },
  { id: 35, name: "Report Manager" },
  { id: 36, name: "Sales Manager" },
  { id: 37, name: "Sales Master Manager" },
  { id: 38, name: "Sales User" },
  { id: 39, name: "Script Manager" },
  { id: 40, name: "Stock Manager" },
  { id: 41, name: "Stock User" },
  { id: 42, name: "Supplier" },
  { id: 43, name: "Support Team" },
  { id: 44, name: "System Manager" },
  { id: 45, name: "Translator" },
  { id: 46, name: "Website Manager" },
  { id: 47, name: "Workspace Manager" },
];

export default function UserForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const isNew = id === "new";
  const userId = isNew ? null : parseInt(id || "0");

  // ─── Form State ────────────────────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [location, setLocation] = useState('');
  const [roleProfileName, setRoleProfileName] = useState('');
  const [redirectUrl] = useState('/dashboard');
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);

  // ─── Employee Search State ────────────────────────────────────────────
  const [employeeFound, setEmployeeFound] = useState<boolean>(false);
  const [employeeData, setEmployeeData] = useState<Employee | null>(null);
  const [searching, setSearching] = useState<boolean>(false);
  const emailTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
        setSelectedRoles([]);
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      setApiError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  // ─── Employee Search ──────────────────────────────────────────────────
  const searchEmployee = async (searchEmail: string) => {
    clearEmployeeData();

    if (!searchEmail.trim()) {
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(searchEmail)) {
      return;
    }

    setSearching(true);
    try {
      const response = await api.get(`/employee/email/${encodeURIComponent(searchEmail)}`);
      
      if (response.status === 200 && response.data && response.data.success === 1) {
        const employee = response.data.data;
        setEmployeeData(employee);
        setEmployeeFound(true);
        
        setFirstName(employee.first_name || '');
        setMiddleName(employee.middle_name || '');
        setLastName(employee.last_name || '');
        setGender(employee.gender || '');
        setBirthDate(employee.date_of_birth ? employee.date_of_birth.split('T')[0] : '');
        setMobileNo(employee.cell_number || '');
        setLocation(employee.department || '');
      }
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        clearEmployeeData();
      } else {
        clearEmployeeData();
        setApiError('Unable to verify employee. Please try again.');
        console.error('Error searching employee:', err);
      }
    } finally {
      setSearching(false);
    }
  };

  const clearEmployeeData = () => {
    setEmployeeFound(false);
    setEmployeeData(null);
  };

  const handleEmailBlur = () => {
    if (emailTimeoutRef.current) {
      clearTimeout(emailTimeoutRef.current);
      emailTimeoutRef.current = null;
    }

    emailTimeoutRef.current = setTimeout(() => {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (email.trim() && emailRegex.test(email)) {
        searchEmployee(email);
      } else {
        clearEmployeeData();
      }
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (emailTimeoutRef.current) {
        clearTimeout(emailTimeoutRef.current);
      }
    };
  }, []);

  // ─── Validation ──────────────────────────────────────────────────────
  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'email':
        if (!value?.trim()) return 'Email is required';
        if (!/^\S+@\S+\.\S+$/.test(value)) return 'Invalid email format';
        return '';
      case 'password':
        if (isNew && !value?.trim()) return 'Password is required';
        if (isNew && value?.length < 6) return 'Password must be at least 6 characters';
        return '';
      case 'firstName':
        if (!value?.trim()) return 'First name is required';
        return '';
      case 'mobileNo':
        if (!value?.trim()) return 'Mobile number is required';
        // Allow 10-11 digits, with optional leading zero
        if (!/^[0-9]{10,11}$/.test(value)) return 'Mobile must be 10-11 digits';
        return '';
      case 'roleProfileName':
        if (!value) return 'Role profile name is required';
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
    const fieldsToValidate = {
      email: { label: 'Email', value: email },
      firstName: { label: 'First Name', value: firstName },
      mobileNo: { label: 'Mobile Number', value: mobileNo },
      roleProfileName: { label: 'Role Profile', value: roleProfileName },
    };

    if (isNew) {
      Object.assign(fieldsToValidate, { password: { label: 'Password', value: password } });
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

    setFieldErrors(newErrors);
    return !hasError;
  };

// ─── Handlers ────────────────────────────────────────────────────────
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
    
    if (employeeFound && employeeData) {
      // Case 1: Employee exists - POST /user
      const payload = {
        employee_id: employeeData.id,
        email: email.trim(),
        password: password.trim(),
        roles: selectedRoles,
        mobile_no: mobileNo.trim(),
        role_profile_name: roleProfileName,
        first_name: firstName.trim(),
        middle_name: middleName.trim(),
        last_name: lastName.trim(),
        gender: gender,
        birth_date: birthDate || null,
        location: location.trim(),
        redirect_url: redirectUrl,
        modified_by: 1,
      };

      response = await api.post('/user', payload);
    } else {
      // Case 2: Employee not found - POST /user/create-with-employee
      // All employee fields should be at the root level, not nested under "employee"
      const payload = {
        // User fields
        email: email.trim(),
        password: password.trim(),
        mobile_no: mobileNo.trim(),
        role_profile_name: roleProfileName,
        redirect_url: redirectUrl,
        modified_by: 1,
        roles: selectedRoles,
        
        // Employee fields - at root level (not nested)
        first_name: firstName.trim(),
        middle_name: middleName.trim(),
        last_name: lastName.trim(),
        gender: gender,
        date_of_birth: birthDate || null,
        cell_number: mobileNo.trim(),
        personal_email: email.trim(),
        company: '',
        department: location.trim() || '',
        designation: '',
        employee: '',
        employee_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      };

      response = await api.post('/user/create-with-employee', payload);
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
      } else if (err.response.status === 400) {
        setApiError(err.response.data?.message || 'Invalid data provided');
      } else {
        setApiError(err.response.data?.message || 'Failed to save user');
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

        {/* ─── API Error Display ────────────────────────────────────── */}
        {apiError && (
          <div className="uf-api-error">
            <FaExclamationCircle className="error-icon" />
            <span>{apiError}</span>
            <button className="error-close" onClick={() => setApiError(null)}>×</button>
          </div>
        )}

        {/* ─── Header ────────────────────────────────────────────────── */}
        <div className="uf-header">
          <button onClick={() => navigate('/user-management')} className="back-btn">
            <FaArrowLeft size={9} /> Back
          </button>
          <div className="header-title">
            <h1>{isNew ? 'Add New User' : `Edit User`}</h1>
          </div>
        </div>

        <form onSubmit={handleSave}>

          {/* ─── Main Form Card ────────────────────────────────────────── */}
          <div className="uf-card">

            {/* General Settings */}
            <span className="uf-section-title">User Information</span>

            {/* Row 1: Email, First Name, Middle Name */}
            <div className="uf-grid-3">
              <div className="uf-field">
                <label className="uf-label">
                  <FaEnvelope className="uf-label-icon" /> Email <span className="uf-required">*</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={handleEmailBlur}
                    className={`form-field ${fieldErrors.email ? 'field-error' : ''}`}
                    placeholder="Enter email address"
                    disabled={submitting || searching}
                    style={{ 
                      paddingRight: searching ? '110px' : undefined,
                      opacity: searching ? 0.7 : 1
                    }}
                  />
                  {searching && (
                    <div style={{ 
                      position: 'absolute', 
                      right: '12px', 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <FaSpinner 
                        className="uf-spinning" 
                        style={{ 
                          fontSize: '16px',
                          color: 'var(--primary-color)'
                        }} 
                      />
                      <span style={{ 
                        fontSize: '11px', 
                        color: 'var(--text-secondary)',
                        fontWeight: 500
                      }}>
                        Searching...
                      </span>
                    </div>
                  )}
                  {!searching && employeeFound && (
                    <FaSearch 
                      style={{ 
                        position: 'absolute', 
                        right: '12px', 
                        fontSize: '16px',
                        color: 'var(--success-color, #10b981)'
                      }} 
                    />
                  )}
                </div>
                {fieldErrors.email && (
                  <div style={{ color: 'var(--danger-color)', fontSize: '11px', marginTop: '4px' }}>
                    <FaExclamationCircle style={{ marginRight: '4px', fontSize: '10px' }} />
                    {fieldErrors.email}
                  </div>
                )}
                {employeeFound && employeeData && (
                  <div style={{ 
                    marginTop: '4px', 
                    fontSize: '11px', 
                    color: 'var(--success-color, #10b981)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <FaInfoCircle size={10} />
                    <span>Employee found - {employeeData.employee_name}</span>
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
                <label className="uf-label">
                  <FaUser className="uf-label-icon" /> Middle Name
                </label>
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
                <label className="uf-label">
                  <FaUser className="uf-label-icon" /> Last Name
                </label>
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
                    // Allow only digits and preserve leading zeros
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
                  value={roleProfileName}
                  onChange={(e) => setRoleProfileName(e.target.value)}
                  onBlur={() => handleFieldBlur('roleProfileName', roleProfileName)}
                  className={`form-field ${fieldErrors.roleProfileName ? 'field-error' : ''}`}
                  disabled={submitting}
                >
                  <option value="">Select Role Profile</option>
                  {ROLES.map((role) => (
                    <option key={role.id} value={role.name}>
                      {role.name}
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

            {/* Password - shown separately for new users */}
            {isNew && (
              <div className="uf-field" style={{ maxWidth: '400px', marginTop: '8px' }}>
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
            )}

            {/* Employee details - shown only when employee is found */}
            {employeeFound && employeeData && (
              <>
                <div className="uf-divider" />
                <span className="uf-section-title">Employee Details</span>
                
                <div className="uf-grid-3">
                  <div className="uf-field">
                    <label className="uf-label">
                      <FaBuilding className="uf-label-icon" /> Company
                    </label>
                    <input
                      type="text"
                      value={employeeData.company}
                      className="form-field"
                      disabled
                      style={{ backgroundColor: 'var(--layout-bg)' }}
                    />
                  </div>
                  <div className="uf-field">
                    <label className="uf-label">
                      <FaBriefcase className="uf-label-icon" /> Department
                    </label>
                    <input
                      type="text"
                      value={employeeData.department}
                      className="form-field"
                      disabled
                      style={{ backgroundColor: 'var(--layout-bg)' }}
                    />
                  </div>
                  <div className="uf-field">
                    <label className="uf-label">
                      <FaBriefcase className="uf-label-icon" /> Designation
                    </label>
                    <input
                      type="text"
                      value={employeeData.designation}
                      className="form-field"
                      disabled
                      style={{ backgroundColor: 'var(--layout-bg)' }}
                    />
                  </div>
                </div>
                <div className="uf-grid-3">
                  <div className="uf-field">
                    <label className="uf-label">
                      <FaIdBadge className="uf-label-icon" /> Employee #
                    </label>
                    <input
                      type="text"
                      value={employeeData.employee || employeeData.employee_number || 'N/A'}
                      className="form-field"
                      disabled
                      style={{ backgroundColor: 'var(--layout-bg)' }}
                    />
                  </div>
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