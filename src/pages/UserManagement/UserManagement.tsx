import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaSearch,
  FaFilter,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSpinner,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
} from 'react-icons/fa';
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';
import './UserManagement.css';
import { PageLoader } from '../components/PageLoader';

interface User {
  id: number;
  name: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  mobile_no?: string;
  role_profile_name?: string;
  gender?: string;
  birth_date?: string;
  location?: string;
  redirect_url?: string;
  creation: string;
  modified: string;
  modified_by: string | null;
  owner: string | null;
}

interface ApiResponse {
  success: number;
  users?: User[];
  data?: any;
  message?: string;
}

export default function UserManagement() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();

  // ─── State ─────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Refs to prevent duplicate API calls
  const isInitialized = useRef(false);
  const isFetching = useRef(false);

  // ─── Helper Functions ──────────────────────────────────────────────────

  // Format date to "X h" or "X d" format


  const formatFullName = (user: User) => {
    return user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.name || user.email;
  };

  // ─── API Calls ─────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    if (isFetching.current) return;

    try {
      isFetching.current = true;
      setLoading(true);

      const response = await api.get<ApiResponse>('/user');
      
      if (response.data.success === 1 && response.data.users) {
        setUsers(response.data.users);
        setFilteredUsers(response.data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  // ─── Initial Load ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      fetchUsers();
    }
  }, [fetchUsers]);

  // ─── Filter & Search ──────────────────────────────────────────────────
  useEffect(() => {
    const searchLower = search.toLowerCase().trim();
    let filtered = users;

    if (searchLower) {
      filtered = filtered.filter(
        (u) =>
          (u.full_name || '').toLowerCase().includes(searchLower) ||
          (u.email || '').toLowerCase().includes(searchLower) ||
          (u.first_name || '').toLowerCase().includes(searchLower) ||
          (u.last_name || '').toLowerCase().includes(searchLower) ||
          (u.mobile_no || '').includes(searchLower) ||
          (u.role_profile_name || '').toLowerCase().includes(searchLower)
      );
    }

    // Status filter - consider users with role_profile_name as active
    if (statusFilter === 'active') {
      filtered = filtered.filter(u => u.role_profile_name !== null);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(u => u.role_profile_name === null);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [search, statusFilter, users]);

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

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
  };

  const getStartIndex = () => {
    return (currentPage - 1) * itemsPerPage + 1;
  };

  const getEndIndex = () => {
    return Math.min(currentPage * itemsPerPage, filteredUsers.length);
  };

  // ─── CRUD Operations ──────────────────────────────────────────────────

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      // Try different possible endpoint patterns
      let response;
      
      // Try with /user/{id} first
      try {
        response = await api.delete(`/user/${userId}`);
      } catch (err: any) {
        // If that fails, try alternative endpoints
        if (err.response?.status === 404 || err.response?.status === 500) {
          // Try with /users/{id}
          try {
            response = await api.delete(`/users/${userId}`);
          } catch (err2: any) {
            // Try with /user/delete/{id}
            try {
              response = await api.delete(`/user/delete/${userId}`);
            } catch (err3: any) {
              // Try with POST method for delete
              response = await api.post(`/user/delete/${userId}`);
            }
          }
        } else {
          throw err;
        }
      }
      
      if (response?.data?.success === 1) {
        await fetchUsers();
        alert('User deleted successfully');
      } else {
        alert(response?.data?.message || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user. Please try again.');
    }
  };

  // ─── Loading Screen ─────────────────────────────────────────────────────
    if (loading) {
      return (
        <div className={`p-6 max-w-7xl mx-auto ${theme}`}>
          <PageLoader
            message="Loading Organization & User Management List..." 
            //subtitle="Calculating bill of materials, operations rates, and component structures"
          />
        </div>
      );
    }

  return (
    <div className={`um-page ${theme}`}>
      <div className="um-inner">

        {/* Filter Bar */}
        <div className="um-filter-bar">
          <div className="um-filter-left">
            <div className="um-search-wrapper">
              <FaSearch className="um-search-icon" />
              <input
                type="text"
                placeholder="Search users..."
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
          <div className="um-filter-right">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="um-filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button className="um-filter-btn">
              <FaFilter size={12} />
              Filter
            </button>
            <button className="um-btn-primary" onClick={() => navigate('/users/new')}>
              <FaPlus size={12} />
              Add User
            </button>
          </div>
        </div>

        {/* Active Filters Indicator */}
        {(search || statusFilter !== 'all') && (
          <div className="um-active-filters">
            <FaFilter size={12} style={{ color: 'var(--primary-color)' }} />
            <span>Active filters:</span>
            {search && (
              <span>
                <strong>Search:</strong> "{search}"
              </span>
            )}
            {statusFilter !== 'all' && (
              <span>
                <strong>Status:</strong> {statusFilter === 'active' ? 'Active' : 'Inactive'}
              </span>
            )}
            <button 
              onClick={clearFilters}
              className="um-clear-filters"
            >
              <FaTimes size={10} /> Clear All
            </button>
          </div>
        )}

        {/* Table */}
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
                <th className="um-th um-th-meta">
                  <span className="um-count-label">{/*filteredUsers.length} of {users.length}</span>*/}

                  {filteredUsers.length> 0
                        ? `${getStartIndex()}–${getEndIndex()}`
                        : '0'} of {filteredUsers.length}
                    </span>
                    
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary, #9ca3af)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="um-empty-state">
                    <div className="um-empty-content">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      <p>No users found</p>
                      <span>Try adjusting your search criteria</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, index) => (
                  <tr key={user.id} className="um-tr">
                    <td className="um-td um-td-id">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="um-td">
                      <span className="um-role-badge">{user.role_profile_name || 'N/A'}</span>
                    </td>
                    <td className="um-td">{formatFullName(user)}</td>
                    <td className="um-td">{user.mobile_no || '-'}</td>
                    <td className="um-td">{user.email}</td>
                    <td className="um-td">
                      <span className={`um-status-badge ${user.role_profile_name ? 'um-status-active' : 'um-status-inactive'}`}>
                        {user.role_profile_name ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="um-td um-td-meta">

                      <div className="um-action-buttons">
                        <button 
                          className="um-action-btn um-action-edit" 
                          onClick={() => navigate(`/users/${user.id}`)}
                          title="Edit"
                        >
                          <FaEdit size={12} />
                        </button>
                        <button 
                          className="um-action-btn um-action-delete" 
                          onClick={() => handleDeleteUser(user.id)}
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

        {/* Pagination */}
        <div className="um-pagination">
          <div className="um-pagination-left">
            <span className="um-pagination-label">Show:</span>
            <select 
              value={itemsPerPage} 
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="um-page-size-select"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="um-pagination-label">entries</span>
          </div>
          <div className="um-pagination-center">
            <button 
              onClick={() => goToPage(1)} 
              disabled={currentPage === 1 || filteredUsers.length === 0} 
              className="um-page-btn"
            >
              <FaAngleDoubleLeft size={12} />
            </button>
            <button 
              onClick={() => goToPage(currentPage - 1)} 
              disabled={currentPage === 1 || filteredUsers.length === 0} 
              className="um-page-btn"
            >
              <FaChevronLeft size={12} />
            </button>
            {filteredUsers.length > 0 && getPageNumbers().map(page => (
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
              disabled={currentPage === totalPages || filteredUsers.length === 0} 
              className="um-page-btn"
            >
              <FaChevronRight size={12} />
            </button>
            <button 
              onClick={() => goToPage(totalPages)} 
              disabled={currentPage === totalPages || filteredUsers.length === 0} 
              className="um-page-btn"
            >
              <FaAngleDoubleRight size={12} />
            </button>
          </div>
          <div className="um-pagination-right">
            <span className="um-pagination-info">
              {filteredUsers.length > 0 ? (
                `Showing ${getStartIndex()} to ${getEndIndex()} of ${filteredUsers.length} entries`
              ) : (
                'No entries to show'
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}