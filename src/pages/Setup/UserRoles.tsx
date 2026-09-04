// UserRoles.tsx
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
  FaIdBadge,
  FaBuilding,
  FaBriefcase,
  FaCheckCircle,
  FaUserCheck,
} from 'react-icons/fa';
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';
import "./UserRoles.css";
import { PageLoader } from "../components/PageLoader";

interface User {
  id: number;
  name: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  mobile_no?: string;
  role_profile_name?: string;
  employee_id?: number;
  employee?: string;
  employee_name?: string;
  company?: string;
  department?: string;
  designation?: string;
  roles?: Role[];
}

interface Role {
  id: number;
  role_name: string;
}

interface Employee {
  id: number;
  employee: string;
  employee_name: string;
  company: string;
  department: string;
  designation: string;
  cell_number: string;
  company_email: string;
  personal_email: string;
}

export default function UserRoles() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const { id } = useParams<{ id: string }>();
  const userId = parseInt(id || "0");

  // ─── State ──────────────────────────────────────────────────────────────
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // ─── Fetch User Data and Roles ──────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      if (!userId || isNaN(userId)) {
        setApiError("Invalid user ID");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch all roles first
        const rolesResponse = await api.get('/role');
        if (rolesResponse.data.success === 1 && rolesResponse.data.data) {
          // Filter out disabled roles
          const activeRoles = rolesResponse.data.data.filter((r: any) => r.disabled === 0);
          setAllRoles(activeRoles.map((r: any) => ({
            id: r.id,
            role_name: r.role_name || r.name
          })));
        }

        // Fetch user data
        const userResponse = await api.get(`/user/${userId}`);
        if (userResponse.data.success === 1 && userResponse.data.data) {
          const userData = userResponse.data.data;
          setUser(userData);
          
          // Set selected roles from user data
          if (userData.roles && Array.isArray(userData.roles)) {
            setSelectedRoles(userData.roles.map((r: any) => r.id));
          }

          // If employee_id exists, fetch employee data
          if (userData.employee_id) {
            const empResponse = await api.get(`/employee/${userData.employee_id}`);
            if (empResponse.data.success === 1 && empResponse.data.data) {
              setEmployee(empResponse.data.data);
            }
          }
        } else {
          setApiError("User not found");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setApiError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // ─── Handlers ──────────────────────────────────────────────────────────
  const handleRoleToggle = (roleId: number) => {
    setSelectedRoles(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setSuccess(null);

    if (!user) {
      setApiError("User data not found");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        userId: user.id,
        roles: selectedRoles,
        modified_by: 1,
      };

      const response = await api.post('/user/add-roles', payload);

      if (response.data.success === 1) {
        setSuccess(response.data.message || "Roles updated successfully!");
        
        // Refresh user data to get updated roles
        const refreshResponse = await api.get(`/user/${userId}`);
        if (refreshResponse.data.success === 1 && refreshResponse.data.data) {
          const userData = refreshResponse.data.data;
          setUser(userData);
          if (userData.roles && Array.isArray(userData.roles)) {
            setSelectedRoles(userData.roles.map((r: any) => r.id));
          }
        }
      } else {
        setApiError(response.data.message || "Failed to update roles");
      }
    } catch (err: any) {
      console.error("Error updating roles:", err);
      if (err.response) {
        setApiError(err.response.data?.message || "Failed to update roles");
      } else {
        setApiError("An unexpected error occurred");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Filtered Roles ──────────────────────────────────────────────────
  const filteredRoles = allRoles.filter(role =>
    role.role_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ─── Loading State ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`ur-page ${theme}`}>
        <div className="ur-loading">
          <FaSpinner className="ur-spinning" size={32} />
          <p>Loading user data...</p>
        </div>
      </div>
    );
  }

  // ─── Error State ────────────────────────────────────────────────────
  if (apiError && !user) {
    return (
      <div className={`ur-page ${theme}`}>
        <div className="ur-error-container">
          <FaExclamationCircle className="ur-error-icon" />
          <p>{apiError}</p>
          <button onClick={() => navigate('/employee')} className="ur-back-btn">
            <FaArrowLeft size={12} /> Back to Employees
          </button>
        </div>
      </div>
    );
  }

      // ─── Loading Screen ─────────────────────────────────────────────────────
      if (loading) {
        return (
          <div className={`p-6 max-w-7xl mx-auto ${theme}`}>
            <PageLoader 
              message="Loading Setup & User Role..." 
              //subtitle="Calculating bill of materials, operations rates, and component structures"
            />
          </div>
        );
      }

  return (
    <div className={`ur-page ${theme}`}>
      <div className="ur-inner">

        {/* ─── Header ────────────────────────────────────────────────── */}
        <div className="ur-header">
          <button onClick={() => navigate('/employee')} className="back-btn">
            <FaArrowLeft size={9} /> Back
          </button>
          <div className="header-title">
            <h1>Manage User Roles</h1>
            <p className="header-subtitle">
              {user?.full_name || 'User'} • {user?.email || ''}
            </p>
          </div>
        </div>

        {/* ─── Messages ──────────────────────────────────────────────── */}
        {apiError && (
          <div className="ur-message error">
            <FaExclamationCircle className="message-icon" />
            <span>{apiError}</span>
            <button className="message-close" onClick={() => setApiError(null)}>×</button>
          </div>
        )}
        {success && (
          <div className="ur-message success">
            <FaCheckCircle className="message-icon" />
            <span>{success}</span>
            <button className="message-close" onClick={() => setSuccess(null)}>×</button>
          </div>
        )}

        <form onSubmit={handleSave}>

          {/* ─── User Info Card ──────────────────────────────────── */}
          <div className="ur-card">
            <div className="ur-user-info">
              <div className="ur-avatar">
                <FaUser size={32} />
              </div>
              <div className="ur-user-details">
                <div className="ur-user-name">{user?.full_name || 'N/A'}</div>
                <div className="ur-user-email">
                  <FaEnvelope size={12} />
                  {user?.email || 'N/A'}
                </div>
                {user?.mobile_no && (
                  <div className="ur-user-mobile">
                    <FaPhone size={12} />
                    {user.mobile_no}
                  </div>
                )}
                {user?.employee && (
                  <div className="ur-user-employee">
                    <FaIdBadge size={12} />
                    {user.employee}
                  </div>
                )}
              </div>
            </div>

            {employee && (
              <div className="ur-employee-details">
                <div className="ur-employee-detail">
                  <FaBuilding size={12} />
                  <span>{employee.company || 'N/A'}</span>
                </div>
                <div className="ur-employee-detail">
                  <FaBriefcase size={12} />
                  <span>{employee.department || 'N/A'}</span>
                </div>
                <div className="ur-employee-detail">
                  <FaBriefcase size={12} />
                  <span>{employee.designation || 'N/A'}</span>
                </div>
              </div>
            )}
          </div>

          {/* ─── Roles Selection Card ────────────────────────────────── */}
          <div className="ur-card">
            <div className="ur-roles-header">
              <h3>
                <FaUserCheck size={16} />
                Assign Roles
              </h3>
              <span className="ur-role-count">
                {selectedRoles.length} selected
              </span>
            </div>

            <div className="ur-search-wrapper">
              <input
                type="text"
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ur-search-input"
              />
            </div>

            <div className="ur-roles-grid">
              {filteredRoles.length > 0 ? (
                filteredRoles.map((role) => (
                  <label key={role.id} className="ur-role-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role.id)}
                      onChange={() => handleRoleToggle(role.id)}
                      disabled={submitting}
                    />
                    <span>{role.role_name}</span>
                  </label>
                ))
              ) : (
                <div className="ur-no-roles">
                  {allRoles.length === 0 
                    ? "No roles available" 
                    : `No roles found matching "${searchTerm}"`}
                </div>
              )}
            </div>

            <div className="ur-selected-roles">
              <span className="ur-selected-label">Selected Roles:</span>
              {selectedRoles.length > 0 ? (
                <div className="ur-selected-tags">
                  {selectedRoles.map(roleId => {
                    const role = allRoles.find(r => r.id === roleId);
                    return role ? (
                      <span key={roleId} className="ur-selected-tag">
                        {role.role_name}
                        <button
                          type="button"
                          className="ur-remove-tag"
                          onClick={() => handleRoleToggle(roleId)}
                        >
                          ×
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              ) : (
                <span className="ur-no-selected">No roles selected</span>
              )}
            </div>
          </div>

          {/* ─── Footer ────────────────────────────────────────────────── */}
          <div className="ur-footer">
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
              disabled={submitting}
              className="submit-btn"
            >
              {submitting && <FaSpinner className="ur-spinning" />}
              <FaSave size={12} />
              Update Roles
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}