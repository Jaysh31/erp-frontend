
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaSearch,
  FaFilter,
  FaPlus,
  FaEdit,
  FaTrash,
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

/* ----------------------------- Interfaces ----------------------------- */

interface User {
  id: number;
  name: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  mobile_no?: string;
  role_profile_name?: string | null;
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
  success: number | boolean;
  users?: User[];
  data?: User[] | { users?: User[] };
  message?: string;
}

/* ----------------------------- Component ------------------------------ */

export default function UserManagement() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  // Prevent duplicate initial API calls
  const isInitialized = useRef(false);
  const isFetching = useRef(false);

  /* ---------------------------- Helpers ---------------------------- */

  const formatFullName = (user: User): string => {
    return (
      user.full_name ||
      `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
      user.name ||
      user.email ||
      'N/A'
    );
  };

  // Uses the same role-profile-based status logic as the existing page.
  const isUserActive = (user: User): boolean => {
    return Boolean(user.role_profile_name?.trim());
  };

  /* ---------------------------- Fetch Users ---------------------------- */

  const fetchUsers = useCallback(async () => {
    if (isFetching.current) return;

    isFetching.current = true;
    setLoading(true);

    try {
      const response = await api.get<ApiResponse>('/user');
      const result = response.data;

      if (result?.success === 1 || result?.success === true) {
        let fetchedUsers: User[] = [];

        if (Array.isArray(result.users)) {
          fetchedUsers = result.users;
        } else if (Array.isArray(result.data)) {
          fetchedUsers = result.data;
        } else if (
          result.data &&
          !Array.isArray(result.data) &&
          Array.isArray(result.data.users)
        ) {
          fetchedUsers = result.data.users;
        }

        setUsers(fetchedUsers);
      } else {
        setUsers([]);
        console.error(result?.message || 'Unable to fetch users.');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  /* ----------------------------- Initial Load ----------------------------- */

  useEffect(() => {
    if (isInitialized.current) return;

    isInitialized.current = true;
    fetchUsers();
  }, [fetchUsers]);

  /* --------------------------- Search & Filter --------------------------- */

  useEffect(() => {
    const searchLower = search.toLowerCase().trim();
    let filtered = [...users];

    if (searchLower) {
      filtered = filtered.filter((user) => {
        return (
          (user.full_name || '').toLowerCase().includes(searchLower) ||
          (user.name || '').toLowerCase().includes(searchLower) ||
          (user.email || '').toLowerCase().includes(searchLower) ||
          (user.first_name || '').toLowerCase().includes(searchLower) ||
          (user.last_name || '').toLowerCase().includes(searchLower) ||
          (user.mobile_no || '').toLowerCase().includes(searchLower) ||
          (user.role_profile_name || '').toLowerCase().includes(searchLower)
        );
      });
    }

    if (statusFilter === 'active') {
      filtered = filtered.filter((user) => isUserActive(user));
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((user) => !isUserActive(user));
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [search, statusFilter, users]);

  /* ----------------------------- Pagination ----------------------------- */

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

  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    const maxVisible = 5;

    let startPage = Math.max(
      1,
      currentPage - Math.floor(maxVisible / 2)
    );

    let endPage = Math.min(
      totalPages,
      startPage + maxVisible - 1
    );

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let page = startPage; page <= endPage; page++) {
      pages.push(page);
    }

    return pages;
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
  };

  const getStartIndex = () => {
    return filteredUsers.length === 0
      ? 0
      : (currentPage - 1) * itemsPerPage + 1;
  };

  const getEndIndex = () => {
    return Math.min(
      currentPage * itemsPerPage,
      filteredUsers.length
    );
  };

  /* ----------------------------- Delete User ----------------------------- */

  const handleDeleteUser = async (userId: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this user? This action cannot be undone.'
    );

    if (!confirmed) return;

    setDeletingUserId(userId);

    try {
      let response;

      // Try the primary endpoint first.
      try {
        response = await api.delete(`/user/${userId}`);
      } catch (error: any) {
        const status = error?.response?.status;

        // Try alternate endpoints only when the route or method is unavailable.
        if (status !== 404 && status !== 405) {
          throw error;
        }

        try {
          response = await api.delete(`/users/${userId}`);
        } catch (secondError: any) {
          const secondStatus = secondError?.response?.status;

          if (secondStatus !== 404 && secondStatus !== 405) {
            throw secondError;
          }

          try {
            response = await api.delete(`/user/delete/${userId}`);
          } catch (thirdError: any) {
            const thirdStatus = thirdError?.response?.status;

            if (thirdStatus !== 404 && thirdStatus !== 405) {
              throw thirdError;
            }

            response = await api.post(`/user/delete/${userId}`);
          }
        }
      }

      if (
        response?.data?.success === 1 ||
        response?.data?.success === true
      ) {
        // Remove immediately from the UI after successful deletion.
        setUsers((previousUsers) =>
          previousUsers.filter((user) => user.id !== userId)
        );

        alert('User deleted successfully.');
      } else {
        alert(
          response?.data?.message ||
            'Unable to delete the user. Please try again.'
        );
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);

      alert(
        error?.response?.data?.message ||
          'Failed to delete user. Please check the backend delete API.'
      );
    } finally {
      setDeletingUserId(null);
    }
  };

  /* ----------------------------- Loading Screen ----------------------------- */

  if (loading) {
    return (
      <div className={`p-6 max-w-7xl mx-auto ${theme}`}>
        <PageLoader message="Loading Organization & User Management List..." />
      </div>
    );
  }

  /* ----------------------------- Main UI ----------------------------- */

  return (
    <div className={`um-page ${theme}`}>
      <div className="um-inner">
        {/* Search and Filter Bar */}
        <div className="um-filter-bar">
          <div className="um-filter-left">
            <div className="um-search-wrapper">
              <FaSearch className="um-search-icon" />

              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="um-search-input"
                aria-label="Search users"
              />

              {search && (
                <button
                  type="button"
                  className="um-search-clear"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  title="Clear search"
                >
                  <FaTimes size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="bom-filter-right">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="um-filter-select"
              aria-label="Filter users by status"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              type="button"
              className="um-filter-btn"
              onClick={() => {
                // Search and status filters apply automatically.
                setCurrentPage(1);
              }}
            >
              <FaFilter size={12} />
              Filter
            </button>
          </div>

          <button
            type="button"
            className="um-btn-primary"
            onClick={() => navigate('/users/new')}
          >
            <FaPlus size={12} />
            Add User
          </button>
        </div>

        {/* Active Filters Indicator */}
        {(search || statusFilter !== 'all') && (
          <div className="um-active-filters">
            <FaFilter
              size={12}
              style={{ color: 'var(--primary-color)' }}
            />

            <span>Active filters:</span>

            {search && (
              <span>
                <strong>Search:</strong> "{search}"
              </span>
            )}

            {statusFilter !== 'all' && (
              <span>
                <strong>Status:</strong>{' '}
                {statusFilter === 'active' ? 'Active' : 'Inactive'}
              </span>
            )}

            <button
              type="button"
              onClick={clearFilters}
              className="um-clear-filters"
            >
              <FaTimes size={10} />
              Clear All
            </button>
          </div>
        )}

        {/* Users Table */}
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
                  <span className="um-count-label">
                    {getStartIndex()}–{getEndIndex()} of{' '}
                    {filteredUsers.length}
                  </span>
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="um-empty-state">
                    <div className="um-empty-content">
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--text-secondary)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>

                      <p>No users found</p>
                      <span>Try adjusting your search criteria</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, index) => {
                  const active = isUserActive(user);

                  return (
                    <tr key={user.id} className="um-tr">
                      <td className="um-td um-td-id">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>

                      <td className="um-td">
                        <span className="um-role-badge">
                          {user.role_profile_name || 'N/A'}
                        </span>
                      </td>

                      <td className="um-td">
                        {formatFullName(user)}
                      </td>

                      <td className="um-td">
                        {user.mobile_no || '-'}
                      </td>

                      <td className="um-td">
                        {user.email || '-'}
                      </td>

                      <td className="um-td">
                        <span
                          className={`um-status-badge ${
                            active
                              ? 'um-status-active'
                              : 'um-status-inactive'
                          }`}
                        >
                          {active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Edit and Delete Actions */}
                      <td className="um-td um-td-meta">
                        <div className="um-action-buttons">
                          <button
                            type="button"
                            className="um-action-btn um-action-edit"
                            onClick={() => navigate(`/users/${user.id}`)}
                            title="Edit user"
                            aria-label={`Edit ${formatFullName(user)}`}
                          >
                            <FaEdit size={12} />
                          </button>

                          <button
                            type="button"
                            className="um-action-btn um-action-delete"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deletingUserId === user.id}
                            title={
                              deletingUserId === user.id
                                ? 'Deleting user...'
                                : 'Delete user'
                            }
                            aria-label={`Delete ${formatFullName(user)}`}
                          >
                            {deletingUserId === user.id ? (
                              <span className="um-delete-loading">...</span>
                            ) : (
                              <FaTrash size={12} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
              onChange={(event) => {
                setItemsPerPage(Number(event.target.value));
                setCurrentPage(1);
              }}
              className="um-page-size-select"
              aria-label="Number of users per page"
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
              type="button"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1 || filteredUsers.length === 0}
              className="um-page-btn"
              title="First page"
              aria-label="First page"
            >
              <FaAngleDoubleLeft size={12} />
            </button>

            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1 || filteredUsers.length === 0}
              className="um-page-btn"
              title="Previous page"
              aria-label="Previous page"
            >
              <FaChevronLeft size={12} />
            </button>

            {filteredUsers.length > 0 &&
              getPageNumbers().map((page) => (
                <button
                  type="button"
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`um-page-btn ${
                    currentPage === page ? 'um-page-btn-active' : ''
                  }`}
                  aria-current={currentPage === page ? 'page' : undefined}
                >
                  {page}
                </button>
              ))}

            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={
                currentPage === totalPages || filteredUsers.length === 0
              }
              className="um-page-btn"
              title="Next page"
              aria-label="Next page"
            >
              <FaChevronRight size={12} />
            </button>

            <button
              type="button"
              onClick={() => goToPage(totalPages)}
              disabled={
                currentPage === totalPages || filteredUsers.length === 0
              }
              className="um-page-btn"
              title="Last page"
              aria-label="Last page"
            >
              <FaAngleDoubleRight size={12} />
            </button>
          </div>

          <div className="um-pagination-right">
            <span className="um-pagination-info">
              {filteredUsers.length > 0
                ? `Showing ${getStartIndex()} to ${getEndIndex()} of ${filteredUsers.length} entries`
                : 'No entries to show'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
