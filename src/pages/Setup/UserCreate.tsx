// UserCreate.tsx
import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaSave,
  FaSpinner,
  FaExclamationCircle,
  FaUser,
  FaEnvelope,
  FaLock,
  FaIdBadge,
  FaInfoCircle,
} from 'react-icons/fa';
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';
import "./UserCreate.css";

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
  is_user?: number;
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

export default function UserCreate() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const [searchParams] = useSearchParams();
  
  // Get employee_id from URL
  const employeeId = searchParams.get('employee_id');
  const emailParam = searchParams.get('email');

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

  // ─── Employee Data State ──────────────────────────────────────────────
  const [employeeData, setEmployeeData] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ─── UI State ──────────────────────────────────────────────────────────
  const [showTooltip, setShowTooltip] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ─── Fetch Employee Data ──────────────────────────────────────────────
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!employeeId) {
        setFetchError('No employee ID provided');
        return;
      }

      setLoading(true);
      setFetchError(null);

      try {
        const response = await api.get(`/employee/${employeeId}`);
        
        if (response.status === 200 && response.data && response.data.success === 1) {
          const employee = response.data.data;
          
          // Check if employee already has a user account
          if (employee.is_user === 1) {
            setFetchError('This employee already has a user account');
            return;
          }
          
          setEmployeeData(employee);
          
          // Auto-fill form fields with employee data
          setEmail(employee.personal_email || employee.company_email || emailParam || '');
          setFirstName(employee.first_name || '');
          setMiddleName(employee.middle_name || '');
          setLastName(employee.last_name || '');
          setGender(employee.gender || '');
          setBirthDate(employee.date_of_birth ? employee.date_of_birth.split('T')[0] : '');
          setMobileNo(employee.cell_number || '');
          setLocation(employee.department || '');
        } else {
          setFetchError('Failed to fetch employee data');
        }
      } catch (err: any) {
        console.error('Error fetching employee:', err);
        if (err.response && err.response.status === 404) {
          setFetchError('Employee not found');
        } else {
          setFetchError('Unable to fetch employee data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [employeeId, emailParam]);

  // ─── Validation ──────────────────────────────────────────────────────
  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'email':
        if (!value?.trim()) return 'Email is required';
        if (!/^\S+@\S+\.\S+$/.test(value)) return 'Invalid email format';
        return '';
      case 'password':
        if (!value?.trim()) return 'Password is required';
        if (value?.length < 6) return 'Password must be at least 6 characters';
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
      roleProfileName: { label: 'Role Profile', value: roleProfileName },
      password: { label: 'Password', value: password },
    };

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

  // ─── Get Role ID from Role Name ──────────────────────────────────────
  const getRoleIdFromName = (roleName: string): number | null => {
    const role = ROLES.find(r => r.name === roleName);
    return role ? role.id : null;
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

    if (!employeeData) {
      setApiError('Employee data not found');
      return;
    }

    // Get the role ID from the selected role profile name
    const roleId = getRoleIdFromName(roleProfileName);
    
    if (!roleId) {
      setApiError('Invalid role profile selected');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        employee_id: employeeData.id,
        email: email.trim(),
        password: password.trim(),
        // Pass the role ID in the roles array
        roles: [roleId],
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

      const response = await api.post('/user', payload);

      if (response.data.success === 1) {
        navigate('/employee');
      } else {
        setApiError(response.data.message || 'Failed to create user');
      }
    } catch (err: any) {
      console.error('Error creating user:', err);
      
      if (err.response) {
        if (err.response.status === 409) {
          setApiError('A user with this email already exists');
        } else if (err.response.status === 400) {
          setApiError(err.response.data?.message || 'Invalid data provided');
        } else {
          setApiError(err.response.data?.message || 'Failed to create user');
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
      <div className={`uc-page ${theme}`}>
        <div className="uc-inner">
          <div className="uc-loading">
            <FaSpinner className="uc-spinning" size={32} />
            <p>Loading employee data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`uc-page ${theme}`}>
      <div className="uc-inner">

        {/* ─── API Error Display ────────────────────────────────────── */}
        {apiError && (
          <div className="uc-api-error">
            <FaExclamationCircle className="error-icon" />
            <span>{apiError}</span>
            <button className="error-close" onClick={() => setApiError(null)}>×</button>
          </div>
        )}

        {/* ─── Fetch Error Display ────────────────────────────────────── */}
        {fetchError && (
          <div className="uc-api-error">
            <FaExclamationCircle className="error-icon" />
            <span>{fetchError}</span>
            <button className="error-close" onClick={() => navigate('/employee')}>×</button>
          </div>
        )}

        {/* ─── Header ────────────────────────────────────────────────── */}
        <div className="uc-header">
          <button onClick={() => navigate('/employee')} className="back-btn">
            <FaArrowLeft size={9} /> Back
          </button>
          <div className="header-title">
            <h1>Create User</h1>
            <p className="header-subtitle">
              {employeeData ? `Creating user for ${employeeData.employee_name}` : 'Loading employee data...'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave}>

          {/* ─── Main Form Card ────────────────────────────────────────── */}
          <div className="uc-card">

            {/* Employee Info - Minimal compact view */}
            <div className="employee-mini-info">
              <FaIdBadge className="mini-icon" />
              <span className="mini-name">{employeeData?.employee_name || 'Loading...'}</span>
              {employeeData?.employee && (
                <span className="mini-id">({employeeData.employee})</span>
              )}
              <button
                type="button"
                className="info-tooltip-trigger"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onFocus={() => setShowTooltip(true)}
                onBlur={() => setShowTooltip(false)}
                aria-label="View employee details"
              >
                <FaInfoCircle />
                {showTooltip && employeeData && (
                  <div className="info-tooltip">
                    <div className="tooltip-item">
                      <span className="tooltip-label">Department:</span>
                      <span>{employeeData.department || 'N/A'}</span>
                    </div>
                    <div className="tooltip-item">
                      <span className="tooltip-label">Designation:</span>
                      <span>{employeeData.designation || 'N/A'}</span>
                    </div>
                    <div className="tooltip-item">
                      <span className="tooltip-label">Company:</span>
                      <span>{employeeData.company || 'N/A'}</span>
                    </div>
                    <div className="tooltip-item">
                      <span className="tooltip-label">Mobile:</span>
                      <span>{employeeData.cell_number || 'N/A'}</span>
                    </div>
                    <div className="tooltip-item">
                      <span className="tooltip-label">Gender:</span>
                      <span>{employeeData.gender || 'N/A'}</span>
                    </div>
                    <div className="tooltip-item">
                      <span className="tooltip-label">Date of Birth:</span>
                      <span>
                        {employeeData.date_of_birth 
                          ? new Date(employeeData.date_of_birth).toLocaleDateString('en-IN', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric' 
                            })
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                )}
              </button>
            </div>

            <div className="uc-divider" />

            {/* User Information - Only 3 fields */}
            <span className="uc-section-title">
              <FaUser className="section-icon" /> Account Details
            </span>

            {/* Email */}
            <div className="uc-field">
              <label className="uc-label">
                <FaEnvelope className="uc-label-icon" /> Email <span className="uc-required">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleFieldBlur('email', email)}
                className={`form-field ${fieldErrors.email ? 'field-error' : ''}`}
                placeholder="Enter email address"
                disabled={submitting}
              />
              {fieldErrors.email && (
                <div className="field-error-message">
                  <FaExclamationCircle />
                  {fieldErrors.email}
                </div>
              )}
            </div>

            {/* Role Profile Name + Password in 2 columns */}
            <div className="uc-grid-2">
              <div className="uc-field">
                <label className="uc-label">Role Profile Name <span className="uc-required">*</span></label>
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
                  <div className="field-error-message">
                    <FaExclamationCircle />
                    {fieldErrors.roleProfileName}
                  </div>
                )}
              </div>

              <div className="uc-field">
                <label className="uc-label">
                  <FaLock className="uc-label-icon" /> Password <span className="uc-required">*</span>
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
                  <div className="field-error-message">
                    <FaExclamationCircle />
                    {fieldErrors.password}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ─── Footer ────────────────────────────────────────────────── */}
          <div className="uc-footer">
            <button
              type="button"
              onClick={() => navigate('/employee')}
              className="cancel-btn"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !employeeData || !!fetchError}
              className="submit-btn"
            >
              {submitting && <FaSpinner className="uc-spinning" />}
              <FaSave size={12} />
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}