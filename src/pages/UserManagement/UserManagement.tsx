import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaSearch, FaPlus, FaEdit, FaTrash, FaEye,
  FaSpinner, FaTimes, FaUser, FaEnvelope,
  FaPhone, FaLock, FaUserTag, FaStore,
  FaChevronLeft, FaChevronRight,
  FaAngleDoubleLeft, FaAngleDoubleRight,
  FaExclamationTriangle, FaInfoCircle,
  FaTimesCircle, FaCheckCircle
} from 'react-icons/fa';
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';
import api from '../../services/api';
import './UserManagement.css';

interface User {
  id: number;
  fullName: string;
  email: string;
  role: string;
  mobile?: string;
  userTypeId?: number;
  storeId?: number;
  roleId?: number;
  isActive?: boolean;
  createdAt?: string;
}

interface UserType {
  UserTypeID: number;
  UserType: string;
}

interface Role {
  RoleID: number;
  RoleName: string;
}

interface Store {
  StoreID: number;
  StoreName: string;
}

interface ApiResponse {
  success: number;
  data: any;
  message?: string;
}

export default function UserManagement() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();

  // ─── State ─────────────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [userTypeId, setUserTypeId] = useState<number | ''>('');
  const [selectedRole, setSelectedRole] = useState<number | ''>('');
  const [selectedStore, setSelectedStore] = useState<number | ''>('');

  // Dynamic data
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Popup
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'success' | 'error' | 'info'>('success');

  // Refs to prevent duplicate API calls
  const isInitialized = useRef(false);
  const isFetching = useRef(false);

  // ─── Helper Functions ──────────────────────────────────────────────────
  const showPopup = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setPopupMessage(msg);
    setPopupType(type);
    setTimeout(() => setPopupMessage(''), 3000);
  }, []);

  // ─── API Calls ─────────────────────────────────────────────────────────

  // Fetch user types
  const fetchUserTypes = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse>('/user-type');
      if (response.data.success === 1) {
        const data = response.data.data?.records || response.data.data || [];
        setUserTypes(data);
        return data;
      }
      return [];
    } catch (err) {
      console.error('Error fetching user types:', err);
      return [];
    }
  }, []);

  // Fetch users
  const fetchUsers = useCallback(async (userTypesData?: UserType[]) => {
    if (isFetching.current) return;

    try {
      isFetching.current = true;
      setLoading(true);

      const response = await api.get<ApiResponse>('/user');
      const list = response.data.data?.records || response.data.data || [];

      const typesToUse = userTypesData || userTypes;

      const mapped: User[] = list.map((u: any) => {
        const matchedType = typesToUse.find(
          (ut) => ut.UserTypeID === u.UserTypeID
        );
        return {
          id: u.UserID || u.id,
          fullName: u.FullName || u.fullName || '',
          email: u.EmailID || u.email || '',
          role: matchedType?.UserType || u.role || '',
          mobile: u.MobileNumber || u.mobile || '',
          userTypeId: u.UserTypeID || u.userTypeId,
          storeId: u.StoreID || u.storeId,
          roleId: u.RoleID || u.roleId,
          isActive: u.IsActive !== undefined ? u.IsActive : true,
          createdAt: u.CreatedAt || u.createdAt,
        };
      });

      setUsers(mapped);
      setFilteredUsers(mapped);
    } catch (err) {
      console.error('Error fetching users:', err);
      showPopup('Failed to load users', 'error');
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [userTypes, showPopup]);

  // Fetch stores
  const fetchStores = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse>('/store');
      if (response.data.success === 1) {
        const data = response.data.data?.records || response.data.data || [];
        setStores(data);
        return data;
      }
      return [];
    } catch (err) {
      console.error('Error fetching stores:', err);
      return [];
    }
  }, []);

  // Fetch roles by user type
  const fetchRolesByUserType = useCallback(async (userType: string) => {
    try {
      const response = await api.get<ApiResponse>(`/role?userType=${encodeURIComponent(userType)}`);
      if (response.data.success === 1) {
        const data = response.data.data?.records || response.data.data || [];
        setRoles(data);
        return data;
      }
      return [];
    } catch (err) {
      console.error('Error fetching roles:', err);
      return [];
    }
  }, []);

  // ─── Initial Load ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      const loadData = async () => {
        const types = await fetchUserTypes();
        await fetchUsers(types);
        await fetchStores();
      };
      loadData();
    }
  }, [fetchUserTypes, fetchUsers, fetchStores]);

  // ─── Search ────────────────────────────────────────────────────────────
  useEffect(() => {
    const searchLower = search.toLowerCase().trim();
    if (!searchLower) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (u) =>
          (u.fullName || '').toLowerCase().includes(searchLower) ||
          (u.email || '').toLowerCase().includes(searchLower) ||
          (u.role || '').toLowerCase().includes(searchLower) ||
          (u.mobile || '').includes(searchLower)
      );
      setFilteredUsers(filtered);
    }
    setCurrentPage(1);
  }, [search, users]);

  // ─── Dynamic Data for Modal ──────────────────────────────────────────
  useEffect(() => {
    const selectedUserType = userTypes.find((ut) => ut.UserTypeID === userTypeId);

    if (!userTypeId || !selectedUserType) {
      setRoles([]);
      return;
    }

    const loadDynamicData = async () => {
      await fetchRolesByUserType(selectedUserType.UserType);
    };

    loadDynamicData();

    // Reset selections when user type changes
    setSelectedRole('');
  }, [userTypeId, userTypes, fetchRolesByUserType]);

  // ─── Pagination ────────────────────────────────────────────────────────
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  // ─── Validation ────────────────────────────────────────────────────────
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[0-9]{10}$/.test(mobile)) {
      newErrors.mobile = 'Mobile must be 10 digits';
    }

    if (!userTypeId) {
      newErrors.userTypeId = 'User type is required';
    }

    if (!isEdit && !password.trim()) {
      newErrors.password = 'Password is required';
    } else if (!isEdit && password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    const selectedUserType = userTypes.find((ut) => ut.UserTypeID === userTypeId);
    if (selectedUserType?.UserType === 'Store User' && !selectedStore) {
      newErrors.store = 'Store selection is required';
    }

    if (roles.length > 0 && !selectedRole) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fullName, email, mobile, userTypeId, isEdit, password, selectedStore, roles.length, selectedRole, userTypes]);

  // ─── CRUD Operations ──────────────────────────────────────────────────

  // Create/Update User
  const handleSaveUser = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload: any = {
        FullName: fullName.trim(),
        EmailID: email.trim(),
        MobileNumber: mobile.trim(),
        UserTypeID: userTypeId,
      };

      if (selectedStore) {
        payload.StoreID = Number(selectedStore);
      }

      if (isEdit && editUserId) {
        // Update existing user
        payload.UserID = editUserId;
        const response = await api.put('/user', payload);
        if (response.data.success === 1) {
          showPopup('User updated successfully', 'success');
          await fetchUsers();
        } else {
          showPopup(response.data.message || 'Failed to update user', 'error');
        }
      } else {
        // Create new user
        payload.Password = password.trim();
        const response = await api.post('/user', payload);

        if (response.data.success === 1) {
          const userId = response.data.data?.UserID || response.data.data?.id;

          // Assign role if selected
          if (selectedRole && userId) {
            await api.post('/user-role', {
              UserId: userId,
              RoleId: Number(selectedRole),
              IsPrimary: 1,
            });
          }

          showPopup('User created successfully', 'success');
          await fetchUsers();
        } else {
          showPopup(response.data.message || 'Failed to create user', 'error');
        }
      }

      closeModal();
    } catch (err: any) {
      console.error('Error saving user:', err);
      showPopup(err.response?.data?.message || 'Failed to save user', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete User
  const handleDeleteUser = async () => {
    if (!deleteId) return;

    try {
      const response = await api.delete(`/user/${deleteId}`);
      if (response.data.success === 1) {
        showPopup('User deleted successfully', 'success');
        await fetchUsers();
      } else {
        showPopup(response.data.message || 'Failed to delete user', 'error');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      showPopup('Failed to delete user', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  // ─── Modal Helpers ────────────────────────────────────────────────────

  const openAddModal = () => {
    setIsEdit(false);
    setEditUserId(null);
    setFullName('');
    setEmail('');
    setMobile('');
    setPassword('');
    setUserTypeId('');
    setSelectedRole('');
    setSelectedStore('');
    setErrors({});
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setIsEdit(true);
    setEditUserId(user.id);
    setFullName(user.fullName || '');
    setEmail(user.email || '');
    setMobile(user.mobile || '');
    setUserTypeId(user.userTypeId || '');
    setSelectedRole(user.roleId || '');
    setSelectedStore(user.storeId || '');
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEdit(false);
    setEditUserId(null);
    setErrors({});
  };

  // ─── Stats ─────────────────────────────────────────────────────────────
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive !== false).length;

  // ─── Render ────────────────────────────────────────────────────────────

  if (loading && users.length === 0) {
    return (
      <div className={`um-page ${theme}`}>
        <div className="um-loading">
          <FaSpinner className="um-spinning" size={32} />
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`um-page ${theme}`}>
      <div className="um-inner">

        {/* ─── Header ──────────────────────────────────────────────────── */}
        <div className="um-header">
          <div className="um-header-left">
            <h1 className="um-title">User Management</h1>
            <span className="um-badge">{totalUsers}</span>
          </div>
          <button className="um-btn-primary" onClick={openAddModal}>
            <FaPlus size={12} /> Add User
          </button>
        </div>

        {/* ─── Stats Cards ────────────────────────────────────────────── */}
        <div className="um-stats-container">
          <div className="um-stat-card" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #818cf8cc 100%)' }}>
            <div className="um-stat-icon"><FaUser size={20} /></div>
            <div className="um-stat-content">
              <p className="um-stat-title">Total Users</p>
              <p className="um-stat-value">{totalUsers}</p>
            </div>
          </div>
          <div className="um-stat-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #34d399cc 100%)' }}>
            <div className="um-stat-icon"><FaCheckCircle size={20} /></div>
            <div className="um-stat-content">
              <p className="um-stat-title">Active Users</p>
              <p className="um-stat-value">{activeUsers}</p>
            </div>
          </div>
          <div className="um-stat-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24cc 100%)' }}>
            <div className="um-stat-icon"><FaUserTag size={20} /></div>
            <div className="um-stat-content">
              <p className="um-stat-title">User Types</p>
              <p className="um-stat-value">{userTypes.length}</p>
            </div>
          </div>
          <div className="um-stat-card" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfacc 100%)' }}>
            <div className="um-stat-icon"><FaStore size={20} /></div>
            <div className="um-stat-content">
              <p className="um-stat-title">Stores</p>
              <p className="um-stat-value">{stores.length}</p>
            </div>
          </div>
        </div>

        {/* ─── Search Bar ──────────────────────────────────────────────── */}
        <div className="um-search-bar">
          <div className="um-search-wrapper">
            <FaSearch className="um-search-icon" />
            <input
              type="text"
              placeholder="Search by name, email, role or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="um-search-input"
            />
            {search && (
              <button className="um-search-clear" onClick={() => setSearch('')}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>

        {/* ─── Table ───────────────────────────────────────────────────── */}
        <div className="um-table-wrap">
          <table className="um-table">
            <thead>
              <tr>
                <th className="um-th">#</th>
                <th className="um-th">Role</th>
                <th className="um-th">Full Name</th>
                <th className="um-th">Mobile</th>
                <th className="um-th">Email</th>
                <th className="um-th">Status</th>
                <th className="um-th um-th-meta">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="um-empty-state">
                    <div className="um-empty-content">
                      <FaUser size={48} />
                      <p>No users found</p>
                      <span>Add a new user to get started</span>
                      <button className="um-btn-primary" onClick={openAddModal} style={{ marginTop: '12px' }}>
                        <FaPlus size={12} /> Add User
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, index) => (
                  <tr key={user.id} className="um-tr">
                    <td className="um-td um-td-no">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="um-td">
                      <span className="um-role-badge">{user.role || 'N/A'}</span>
                    </td>
                    <td className="um-td um-td-name">{user.fullName}</td>
                    <td className="um-td">{user.mobile || '-'}</td>
                    <td className="um-td">{user.email}</td>
                    <td className="um-td">
                      <span className={`um-status-badge ${user.isActive !== false ? 'um-status-active' : 'um-status-inactive'}`}>
                        {user.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="um-td um-td-meta">
                      <div className="um-action-buttons">
                        <button
                          className="um-action-btn um-action-edit"
                          onClick={() => openEditModal(user)}
                          title="Edit"
                        >
                          <FaEdit size={12} />
                        </button>
                        <button
                          className="um-action-btn um-action-delete"
                          onClick={() => setDeleteId(user.id)}
                          title="Delete"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Pagination ──────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="um-pagination">
            <div className="um-pagination-left">
              <span className="um-pagination-label">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredUsers.length)} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length}
              </span>
            </div>
            <div className="um-pagination-center">
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className="um-page-btn"
              >
                <FaAngleDoubleLeft size={12} />
              </button>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="um-page-btn"
              >
                <FaChevronLeft size={12} />
              </button>
              {getPageNumbers().map(page => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`um-page-btn ${currentPage === page ? 'um-page-btn-active' : ''}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="um-page-btn"
              >
                <FaChevronRight size={12} />
              </button>
              <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                className="um-page-btn"
              >
                <FaAngleDoubleRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Add/Edit Modal ────────────────────────────────────────────── */}
      {showModal && (
        <div className="um-modal-overlay" onClick={closeModal}>
          <div className="um-modal" onClick={(e) => e.stopPropagation()}>
            <div className="um-modal-header">
              <h2>{isEdit ? 'Edit User' : 'Add New User'}</h2>
              <button className="um-modal-close" onClick={closeModal}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="um-modal-body">
              {/* Full Name */}
              <div className="um-form-group">
                <label className="um-label">Full Name <span className="um-required">*</span></label>
                <div className="um-input-wrapper">
                  <FaUser className="um-input-icon" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`um-input ${errors.fullName ? 'um-input-error' : ''}`}
                    placeholder="Enter full name"
                  />
                </div>
                {errors.fullName && <span className="um-error-msg">{errors.fullName}</span>}
              </div>

              <div className="um-form-row">
                {/* User Type */}
                <div className="um-form-group">
                  <label className="um-label">User Type <span className="um-required">*</span></label>
                  <select
                    value={userTypeId}
                    onChange={(e) => setUserTypeId(Number(e.target.value) || '')}
                    className={`um-input ${errors.userTypeId ? 'um-input-error' : ''}`}
                  >
                    <option value="">Select User Type</option>
                    {userTypes.map((ut) => (
                      <option key={ut.UserTypeID} value={ut.UserTypeID}>
                        {ut.UserType}
                      </option>
                    ))}
                  </select>
                  {errors.userTypeId && <span className="um-error-msg">{errors.userTypeId}</span>}
                </div>

                {/* Store (conditional) */}
                {userTypes.find((ut) => ut.UserTypeID === userTypeId)?.UserType === 'Store User' && (
                  <div className="um-form-group">
                    <label className="um-label">Store <span className="um-required">*</span></label>
                    <select
                      value={selectedStore}
                      onChange={(e) => setSelectedStore(Number(e.target.value) || '')}
                      className={`um-input ${errors.store ? 'um-input-error' : ''}`}
                    >
                      <option value="">Select Store</option>
                      {stores.map((s) => (
                        <option key={s.StoreID} value={s.StoreID}>
                          {s.StoreName}
                        </option>
                      ))}
                    </select>
                    {errors.store && <span className="um-error-msg">{errors.store}</span>}
                  </div>
                )}
              </div>

              {/* Role (conditional) */}
              {roles.length > 0 && (
                <div className="um-form-group">
                  <label className="um-label">Role <span className="um-required">*</span></label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(Number(e.target.value) || '')}
                    className={`um-input ${errors.role ? 'um-input-error' : ''}`}
                  >
                    <option value="">Select Role</option>
                    {roles.map((r) => (
                      <option key={r.RoleID} value={r.RoleID}>
                        {r.RoleName}
                      </option>
                    ))}
                  </select>
                  {errors.role && <span className="um-error-msg">{errors.role}</span>}
                </div>
              )}

              <div className="um-form-row">
                {/* Mobile */}
                <div className="um-form-group">
                  <label className="um-label">Mobile <span className="um-required">*</span></label>
                  <div className="um-input-wrapper">
                    <FaPhone className="um-input-icon" />
                    <input
                      type="text"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className={`um-input ${errors.mobile ? 'um-input-error' : ''}`}
                      placeholder="Enter mobile number"
                      maxLength={10}
                    />
                  </div>
                  {errors.mobile && <span className="um-error-msg">{errors.mobile}</span>}
                </div>

                {/* Email */}
                <div className="um-form-group">
                  <label className="um-label">Email <span className="um-required">*</span></label>
                  <div className="um-input-wrapper">
                    <FaEnvelope className="um-input-icon" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`um-input ${errors.email ? 'um-input-error' : ''}`}
                      placeholder="Enter email address"
                    />
                  </div>
                  {errors.email && <span className="um-error-msg">{errors.email}</span>}
                </div>
              </div>

              {/* Password (only for new users) */}
              {!isEdit && (
                <div className="um-form-group">
                  <label className="um-label">Password <span className="um-required">*</span></label>
                  <div className="um-input-wrapper">
                    <FaLock className="um-input-icon" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`um-input ${errors.password ? 'um-input-error' : ''}`}
                      placeholder="Enter password (min 6 characters)"
                    />
                  </div>
                  {errors.password && <span className="um-error-msg">{errors.password}</span>}
                </div>
              )}
            </div>
            <div className="um-modal-footer">
              <button className="um-btn-cancel" onClick={closeModal}>
                Cancel
              </button>
              <button className="um-btn-submit" onClick={handleSaveUser} disabled={saving}>
                {saving && <FaSpinner className="um-spinning" size={14} />}
                {saving ? 'Saving...' : 'Save User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ──────────────────────────────────── */}
      {deleteId !== null && (
        <div className="um-modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="um-modal um-modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="um-modal-header">
              <h2>Confirm Delete</h2>
              <button className="um-modal-close" onClick={() => setDeleteId(null)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="um-modal-body um-modal-body-delete">
              <FaExclamationTriangle size={48} className="um-delete-icon" />
              <p>Are you sure you want to delete this user?</p>
              <p className="um-delete-warning">This action cannot be undone.</p>
            </div>
            <div className="um-modal-footer">
              <button className="um-btn-cancel" onClick={() => setDeleteId(null)}>
                Cancel
              </button>
              <button className="um-btn-delete" onClick={handleDeleteUser}>
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Popup Notification ────────────────────────────────────────── */}
      {popupMessage && (
        <div className={`um-popup ${popupType}`}>
          {popupType === 'success' && <FaCheckCircle size={16} />}
          {popupType === 'error' && <FaTimesCircle size={16} />}
          {popupType === 'info' && <FaInfoCircle size={16} />}
          {popupMessage}
        </div>
      )}
    </div>
  );
}