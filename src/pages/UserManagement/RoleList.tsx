// RoleList.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaFilter,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaUserTag,
  FaLock,
  FaUnlock,
  FaEllipsisV,
  FaCog,
} from "react-icons/fa";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';
import "./RoleList.css";
import { PageLoader } from "../components/PageLoader";

interface Role {
  id: number;
  name: string;
  role_name: string;
  disabled: number;
  desk_access: number;
  two_factor_auth: number;
  is_custom: number;
  creation: string;
  modified: string;
  modified_by: string;
  owner: string;
}

interface ApiResponse {
  success: number;
  data: Role[];
}

export default function RoleList() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();

  const [roles, setRoles] = useState<Role[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Role | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const dropdownRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ApiResponse>('/role');
      if (response.data.success === 1 && response.data.data) {
        setRoles(response.data.data);
        setFilteredRoles(response.data.data);
        setTotalItems(response.data.data.length);
      } else {
        setRoles([]);
        setFilteredRoles([]);
        setError("Failed to fetch roles");
      }
    } catch (err) {
      console.error("Error fetching roles:", err);
      setError("An error occurred while fetching roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    let filtered = roles;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(role =>
        (role.name?.toLowerCase().includes(term) || false) ||
        (role.role_name?.toLowerCase().includes(term) || false)
      );
    }

    if (statusFilter === "active") {
      filtered = filtered.filter(role => role.disabled === 0);
    } else if (statusFilter === "disabled") {
      filtered = filtered.filter(role => role.disabled === 1);
    }

    setFilteredRoles(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, roles]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId !== null) {
        const ref = dropdownRefs.current[openDropdownId];
        if (ref && !ref.contains(event.target as Node)) {
          setOpenDropdownId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);

  // Pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedData = filteredRoles.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleDelete = (item: Role) => {
    setSelectedItem(item);
    setShowDeleteConfirm(true);
    setOpenDropdownId(null);
  };

  const confirmDelete = async () => {
    if (selectedItem) {
      try {
        const response = await api.delete(`/role/${selectedItem.id}`);
        if (response.data.success === 1) {
          setShowDeleteConfirm(false);
          setSelectedItem(null);
          fetchRoles();
        }
      } catch (err) {
        console.error("Error deleting role:", err);
        alert("Failed to delete role");
      }
    }
  };

  const toggleDropdown = (id: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  const handleView = (id: number) => {
    navigate(`/role/${id}`);
    setOpenDropdownId(null);
  };

  const handleEdit = (id: number) => {
    navigate(`/role/${id}`);
    setOpenDropdownId(null);
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
    setSearchTerm("");
    setStatusFilter("all");
  };

  const getStatusBadge = (disabled: number) => {
    return disabled === 0 ? (
      <span className="role-status-active">Active</span>
    ) : (
      <span className="role-status-inactive">Disabled</span>
    );
  };

  const getAccessIcon = (deskAccess: number) => {
    return deskAccess === 1 ? (
      <span className="access-icon active"><FaUnlock size={12} /> Yes</span>
    ) : (
      <span className="access-icon inactive"><FaLock size={12} /> No</span>
    );
  };

    // ─── Loading Screen ─────────────────────────────────────────────────────
      if (loading) {
        return (
          <div className={`p-6 max-w-7xl mx-auto ${theme}`}>
            <PageLoader 
              message="Loading Organization & Role List..." 
              //subtitle="Calculating bill of materials, operations rates, and component structures"
            />
          </div>
        );
      }

  return (
    <div className={`rl-page ${theme}`}>
      {/* Search and Filter Bar */}
      <div className="rl-filter-bar">
        <div className="rl-filter-left">
          <div className="rl-search-wrapper">
            <FaSearch className="rl-search-icon" />
            <input
              type="text"
              placeholder="Search roles by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rl-search-input"
            />
            {searchTerm && (
              <button className="rl-search-clear" onClick={() => setSearchTerm("")}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="rl-filter-right">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="rl-filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
          <button className="rl-btn-primary" onClick={() => navigate("/role/new")}>
            <FaPlus size={12} />
            Add Role
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(searchTerm || statusFilter !== "all") && (
        <div className="rl-active-filters">
          <FaFilter size={12} style={{ color: "var(--primary-color)" }} />
          <span style={{ color: "var(--text-primary)" }}>Active filters:</span>
          {searchTerm && (
            <span style={{ color: "var(--text-primary)" }}>
              <strong>Search:</strong> "{searchTerm}"
            </span>
          )}
          {statusFilter !== "all" && (
            <span style={{ color: "var(--text-primary)" }}>
              <strong>Status:</strong> {statusFilter === "active" ? "Active" : "Disabled"}
            </span>
          )}
          <button onClick={clearFilters} className="rl-clear-filters">
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="rl-loading">
          <p>Loading roles...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rl-error">
          <p>{error}</p>
          <button onClick={fetchRoles} className="rl-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="rl-table-wrap">
            <table className="rl-table">
              <thead>
                <tr>
                  <th className="rl-th">#</th>
                  <th className="rl-th">Role Name</th>
                  <th className="rl-th">Desk Access</th>
                  <th className="rl-th">2FA</th>
                  <th className="rl-th">Status</th>
                  <th className="rl-th">Created</th>
                  <th className="rl-th rl-th-meta">
                    <span className="rl-count-label">{totalItems} roles</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="rl-empty-state">
                      <div className="rl-empty-content">
                        <FaUserTag size={48} style={{ color: "var(--text-secondary)" }} />
                        <p>No roles found</p>
                        <span>Try adjusting your search criteria</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, index) => (
                    <tr
                      key={row.id}
                      className="rl-tr"
                      onClick={() => navigate(`/role/${row.id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <td className="rl-td rl-td-id">
                        <span className="rl-row-number">{startIndex + index + 1}</span>
                      </td>
                      <td className="rl-td rl-td-name">
                        <div className="rl-name-info">
                          <FaUserTag className="rl-role-icon" />
                          <span className="rl-name">{row.role_name || row.name}</span>
                        </div>
                      </td>
                      <td className="rl-td">
                        {getAccessIcon(row.desk_access)}
                      </td>
                      <td className="rl-td">
                        {row.two_factor_auth === 1 ? (
                          <span className="rl-2fa-enabled">Enabled</span>
                        ) : (
                          <span className="rl-2fa-disabled">Disabled</span>
                        )}
                      </td>
                      <td className="rl-td">
                        {getStatusBadge(row.disabled)}
                      </td>
                      <td className="rl-td rl-td-date">
                        {row.creation ? new Date(row.creation).toLocaleDateString("en-IN", { 
                          day: "2-digit", 
                          month: "short", 
                          year: "numeric" 
                        }) : "—"}
                      </td>
                      <td className="rl-td rl-td-meta" onClick={(e) => e.stopPropagation()}>
                        <div className="rl-action-wrapper">
                          {/* Settings Button - Left side */}
<button
  className="rl-settings-btn "
  onClick={() => navigate(`/role/permissions/${row.id}`)}
  title="Module Permissions"
>
  <FaCog size={14} />
</button>

                          {/* Dropdown Container - Right side */}
                          <div 
                            className="rl-dropdown-container" 
                            ref={(el) => { dropdownRefs.current[row.id] = el; }}
                          >
                            <button 
                              className={`rl-dropdown-trigger ${openDropdownId === row.id ? 'rl-dropdown-active' : ''}`}
                              onClick={(e) => toggleDropdown(row.id, e)}
                              aria-label="Actions"
                            >
                              <FaEllipsisV size={14} />
                            </button>
                            
                            {openDropdownId === row.id && (
                              <div className="rl-dropdown-menu">
                                <button 
                                  className="rl-dropdown-item rl-dropdown-view"
                                  onClick={() => handleView(row.id)}
                                >
                                  <FaEye size={12} />
                                  View
                                </button>
                                <button 
                                  className="rl-dropdown-item rl-dropdown-edit"
                                  onClick={() => handleEdit(row.id)}
                                >
                                  <FaEdit size={12} />
                                  Edit
                                </button>
                                <hr className="rl-dropdown-divider" />
                                <button 
                                  className="rl-dropdown-item rl-dropdown-delete"
                                  onClick={() => handleDelete(row)}
                                >
                                  <FaTrash size={12} />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary Stats */}
          <div className="rl-stats-bar">
            <div className="rl-stats-item">
              <span className="rl-stats-label">Total Roles:</span>
              <span className="rl-stats-value">{totalItems}</span>
            </div>
            <div className="rl-stats-item">
              <span className="rl-stats-label">Active:</span>
              <span className="rl-stats-value" style={{ color: "#10b981" }}>
                {roles.filter(r => r.disabled === 0).length}
              </span>
            </div>
            <div className="rl-stats-item">
              <span className="rl-stats-label">Disabled:</span>
              <span className="rl-stats-value" style={{ color: "#ef4444" }}>
                {roles.filter(r => r.disabled === 1).length}
              </span>
            </div>
            <div className="rl-stats-item">
              <span className="rl-stats-label">Custom:</span>
              <span className="rl-stats-value" style={{ color: "#8b5cf6" }}>
                {roles.filter(r => r.is_custom === 1).length}
              </span>
            </div>
          </div>

          {/* Pagination */}
          {totalItems > 0 && (
            <div className="rl-pagination">
              <div className="rl-pagination-left">
                <span className="rl-pagination-label">Show:</span>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }} 
                  className="rl-page-size-select"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="rl-pagination-label">entries</span>
              </div>
              <div className="rl-pagination-center">
                <button onClick={() => goToPage(1)} disabled={currentPage === 1} className="rl-page-btn">
                  <FaAngleDoubleLeft size={12} />
                </button>
                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="rl-page-btn">
                  <FaChevronLeft size={12} />
                </button>
                {getPageNumbers().map((page) => (
                  <button 
                    key={page} 
                    onClick={() => goToPage(page)} 
                    className={`rl-page-btn ${currentPage === page ? "rl-page-btn-active" : ""}`}
                  >
                    {page}
                  </button>
                ))}
                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="rl-page-btn">
                  <FaChevronRight size={12} />
                </button>
                <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} className="rl-page-btn">
                  <FaAngleDoubleRight size={12} />
                </button>
              </div>
              <div className="rl-pagination-right">
                <span className="rl-pagination-info">
                  Showing {startIndex + 1} to {endIndex} of {totalItems} entries
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedItem && (
        <div className="rl-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="rl-modal rl-modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="rl-modal-header">
              <span className="rl-modal-title">Confirm Delete</span>
              <button className="rl-modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="rl-modal-body">
              <p>Are you sure you want to delete this role?</p>
              <div className="rl-modal-item-details">
                <p><strong>Role:</strong> {selectedItem.role_name || selectedItem.name}</p>
                <p><strong>Status:</strong> {selectedItem.disabled === 0 ? "Active" : "Disabled"}</p>
              </div>
              <p className="rl-modal-warning">⚠️ This action cannot be undone.</p>
            </div>
            <div className="rl-modal-footer">
              <button className="rl-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="rl-btn-delete" onClick={confirmDelete}>
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}