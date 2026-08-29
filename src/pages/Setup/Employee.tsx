// Employee.tsx - Updated version with actual API response

import { useState, useEffect, useRef, type JSX } from "react";
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
  FaUsers,
  FaPhone,
  FaEnvelope,
  FaBuilding,
  FaCalendarAlt,
  FaBriefcase,
  FaUserCircle,
  FaUserCheck,
  FaEllipsisV,
  FaUserPlus,
  FaUserSlash,
} from "react-icons/fa";
import "./Employee.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';

interface Employee {
  id: number;
  name: string;
  employee: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  employee_name: string;
  gender: string;
  date_of_birth: string;
  date_of_joining: string;
  status: string;
  company: string;
  department: string;
  designation: string;
  branch: string;
  employee_number: string;
  reports_to: string;
  cell_number: string;
  company_email: string;
  personal_email: string;
  current_address: string;
  permanent_address: string;
  ctc: number;
  salary_currency: string;
  bank_name: string;
  bank_ac_no: string;
  blood_group: string;
  marital_status: string;
  user_id?: string | number;
  is_user?: number; // 1 = has user account, 0 = no user account
}

interface EmployeeDisplay {
  id: string;
  employee: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  status: string;
  joiningDate: string;
  branch: string;
  gender: string;
  ctc: number;
  isUser: boolean; // Converted from is_user (1/0) to boolean
  userId: string | number | null; // Store the user_id for API calls
}

interface ApiResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: Employee[];
  };
}

const STATUS_CLASS: Record<string, string> = {
  Active: "status-active",
  Inactive: "status-inactive",
  "On Leave": "status-onleave",
  Terminated: "status-terminated",
};

const GENDER_ICONS: Record<string, JSX.Element> = {
  Male: <FaUserCircle className="gender-icon male" />,
  Female: <FaUserCircle className="gender-icon female" />,
  Other: <FaUserCircle className="gender-icon other" />,
};

export default function Employee() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();

  const [employees, setEmployees] = useState<EmployeeDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allChecked, setAllChecked] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [, setTotalPages] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EmployeeDisplay | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // const formatDate = (dateString: string) => {
  //   if (!dateString) return "N/A";
  //   try {
  //     const date = new Date(dateString);
  //     const now = new Date();
  //     const diffMs = now.getTime() - date.getTime();
  //     const diffMins = Math.floor(diffMs / 60000);
  //     const diffHours = Math.floor(diffMs / 3600000);
  //     const diffDays = Math.floor(diffMs / 86400000);

  //     if (diffMins < 1) return "Just now";
  //     if (diffMins < 60) return `${diffMins} min ago`;
  //     if (diffHours < 24) return `${diffHours} h ago`;
  //     if (diffDays < 7) return `${diffDays} d ago`;
  //     if (diffDays < 30) return `${Math.floor(diffDays / 7)} w ago`;
  //     if (diffDays < 365) return `${Math.floor(diffDays / 30)} mo ago`;
  //     return `${Math.floor(diffDays / 365)} y ago`;
  //   } catch {
  //     return dateString;
  //   }
  // };

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ApiResponse>(`/employee?page=${currentPage}&limit=${itemsPerPage}`);

      if (response.data.success === 1 && response.data.data) {
        const { records, total, page, limit } = response.data.data;
        setTotalItems(total ?? 0);
        setTotalPages(Math.ceil((total ?? 0) / (limit || itemsPerPage)));
        setCurrentPage(page ?? 1);

        const transformedData: EmployeeDisplay[] = (records ?? []).map((item: Employee) => ({
          id: item.id?.toString() || item.employee || "",
          employee: item.employee || "",
          name: item.employee_name || `${item.first_name || ""} ${item.last_name || ""}`.trim() || "N/A",
          email: item.company_email || item.personal_email || "",
          phone: item.cell_number || "",
          department: item.department || "",
          designation: item.designation || "",
          status: item.status || "Active",
          joiningDate: item.date_of_joining || "",
          branch: item.branch || "",
          gender: item.gender || "",
          ctc: item.ctc || 0,
          // Use the actual API response for is_user
          isUser: item.is_user === 1,
          userId: item.user_id || null,
        }));

        setEmployees(transformedData);
      } else {
        setEmployees([]);
        setError("Failed to fetch employees");
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
      setError("An error occurred while fetching employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, departmentFilter]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId) {
        const ref = dropdownRefs.current[openDropdownId];
        if (ref && !ref.contains(event.target as Node)) {
          setOpenDropdownId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);

  // Get unique departments for filter
  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  const filteredData = employees.filter((item) => {
    const matchesSearch =
      (item.name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.employee ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.email ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.phone ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.department ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.designation ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.branch ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesDepartment = departmentFilter === "all" || item.department === departmentFilter;
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const totalFilteredItems = filteredData.length;
  const filteredTotalPages = Math.ceil(totalFilteredItems / itemsPerPage);

  const validCurrentPage = Math.min(currentPage, filteredTotalPages || 1);

  useEffect(() => {
    if (validCurrentPage !== currentPage) {
      setCurrentPage(validCurrentPage);
    }
  }, [validCurrentPage, currentPage]);

  const paginatedData = filteredData.slice(
    (validCurrentPage - 1) * itemsPerPage,
    validCurrentPage * itemsPerPage
  );

  const toggleAll = () => {
    if (allChecked) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginatedData.map((r) => r.id)));
    }
    setAllChecked(!allChecked);
  };

  const toggleRow = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
    setAllChecked(next.size === paginatedData.length);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= filteredTotalPages) {
      setCurrentPage(page);
    }
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(filteredTotalPages);
  const goToNextPage = () => goToPage(currentPage + 1);
  const goToPrevPage = () => goToPage(currentPage - 1);

  const handlePageSizeChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(filteredTotalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  const handleDelete = (item: EmployeeDisplay) => {
    setSelectedItem(item);
    setShowDeleteConfirm(true);
    setOpenDropdownId(null);
  };

  const confirmDelete = async () => {
    if (selectedItem) {
      try {
        const response = await api.delete(`/employee/${selectedItem.id}`);
        if (response.data.success === 1) {
          setShowDeleteConfirm(false);
          setSelectedItem(null);
          fetchEmployees();
        }
      } catch (err) {
        console.error("Error deleting employee:", err);
        alert("Failed to delete employee");
      }
    }
  };

  const handleRowClick = (item: EmployeeDisplay) => {
    navigate(`/employee/${encodeURIComponent(item.id)}`);
  };

  const handleEdit = (item: EmployeeDisplay) => {
    navigate(`/employee/${encodeURIComponent(item.id)}`);
    setOpenDropdownId(null);
  };

  const handleView = (item: EmployeeDisplay) => {
    navigate(`/employee/${encodeURIComponent(item.id)}`);
    setOpenDropdownId(null);
  };

const handleToggleUser = async (item: EmployeeDisplay) => {
  try {
    if (item.isUser) {
      // Navigate to user roles page with user ID
      navigate(`/user/roles/${item.userId}`);
      setOpenDropdownId(null);
    } else {
      // Navigate to user creation page with employee_id
      navigate(`/user/create?employee_id=${item.id}&email=${encodeURIComponent(item.email)}`);
      setOpenDropdownId(null);
    }
  } catch (err) {
    console.error("Error toggling user status:", err);
    alert("Failed to toggle user status");
  }
};

  const toggleDropdown = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDepartmentFilter("all");
  };

  const getStartIndex = () => {
    return (validCurrentPage - 1) * itemsPerPage + 1;
  };

  const getEndIndex = () => {
    return Math.min(validCurrentPage * itemsPerPage, totalFilteredItems);
  };

  const getStatusBadgeClass = (status: string) => {
    return STATUS_CLASS[status] || "status-default";
  };

  // const getUserStatusIcon = (isUser: boolean) => {
  //   return isUser ? (
  //     <FaUserCheck className="emp-user-icon active" title="User has access" />
  //   ) : (
  //     <FaUserSlash className="emp-user-icon inactive" title="User does not have access" />
  //   );
  // };

  return (
    <div className={`emp-page ${theme}`}>
      {/* Search and Filter Bar */}
      <div className="emp-filter-bar">
        <div className="emp-filter-left">
          <div className="emp-search-wrapper">
            <FaSearch className="emp-search-icon" />
            <input
              type="text"
              placeholder="Search employees by name, email, department, or designation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="emp-search-input"
            />
            {searchTerm && (
              <button className="emp-search-clear" onClick={() => setSearchTerm("")}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="emp-filter-right">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="emp-filter-select"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="On Leave">On Leave</option>
            <option value="Terminated">Terminated</option>
          </select>
          
          <select 
            value={departmentFilter} 
            onChange={(e) => setDepartmentFilter(e.target.value)} 
            className="emp-filter-select"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <button className="emp-filter-btn">
            <FaFilter size={12} />
            Filter
          </button>
          <button className="emp-btn-primary" onClick={() => navigate("/employee/new")}>
            <FaPlus size={12} />
            Add Employee
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(searchTerm || statusFilter !== "all" || departmentFilter !== "all") && (
        <div className="emp-active-filters">
          <FaFilter size={12} style={{ color: "var(--primary-color)" }} />
          <span style={{ color: "var(--text-primary)" }}>Active filters:</span>
          {searchTerm && (
            <span style={{ color: "var(--text-primary)" }}>
              <strong>Search:</strong> "{searchTerm}"
            </span>
          )}
          {statusFilter !== "all" && (
            <span style={{ color: "var(--text-primary)" }}>
              <strong>Status:</strong> {statusFilter}
            </span>
          )}
          {departmentFilter !== "all" && (
            <span style={{ color: "var(--text-primary)" }}>
              <strong>Department:</strong> {departmentFilter}
            </span>
          )}
          <button onClick={clearFilters} className="emp-clear-filters">
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="emp-loading">
          <p>Loading employees...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="emp-error">
          <p>{error}</p>
          <button onClick={fetchEmployees} className="emp-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="emp-table-wrap">
            <table className="emp-table">
              <thead>
                <tr>
                  <th className="emp-th-check">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} className="emp-checkbox" />
                  </th>
                  <th className="emp-th">Employee</th>
                  <th className="emp-th">Name</th>
                  <th className="emp-th">Department</th>
                  <th className="emp-th">Designation</th>
                  <th className="emp-th">Status</th>
                  <th className="emp-th">Contact</th>
                  <th className="emp-th">CTC</th>
                  <th className="emp-th">Joining Date</th>
                  <th className="emp-th emp-th-meta">
                    <span className="emp-count-label">{/*totalFilteredItems} of {totalItems}</span>*/}
                    {totalItems> 0
                        ? `${getStartIndex()}–${getEndIndex()}`
                        : '0'} of {totalItems}
                    </span>
                    
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary, #9ca3af)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="emp-empty-state">
                      <div className="emp-empty-content">
                        <FaUsers size={48} style={{ color: "var(--text-secondary)" }} />
                        <p>No employees found</p>
                        <span>Try adjusting your search criteria</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => (
                    <tr
                      key={row.id}
                      className={`emp-tr ${selected.has(row.id) ? "emp-tr-selected" : ""}`}
                      onClick={() => handleRowClick(row)}
                      style={{ cursor: "pointer" }}
                    >
                      <td className="emp-td-check" onClick={(e) => { e.stopPropagation(); toggleRow(row.id); }}>
                        <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleRow(row.id)} className="emp-checkbox" />
                      </td>
                      <td className="emp-td emp-td-id">
                        <span className="emp-employee-id">{row.employee || row.id}</span>
                      </td>
                      <td className="emp-td emp-td-name">
                        <div className="emp-name-info">
                          {GENDER_ICONS[row.gender] || <FaUserCircle className="gender-icon default" />}
                          <span className="emp-name">{row.name}</span>
                        </div>
                      </td>
                      <td className="emp-td">
                        <span className="emp-department-badge">
                          <FaBuilding size={10} />
                          {row.department || "—"}
                        </span>
                      </td>
                      <td className="emp-td">
                        <span className="emp-designation">
                          <FaBriefcase size={10} />
                          {row.designation || "—"}
                        </span>
                      </td>
                      <td className="emp-td">
                        <span className={`emp-status-badge ${getStatusBadgeClass(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="emp-td emp-td-contact">
                        <div className="emp-contact-info">
                          {row.email && (
                            <span className="emp-contact-item">
                              <FaEnvelope size={10} />
                              {row.email}
                            </span>
                          )}
                          {row.phone && (
                            <span className="emp-contact-item">
                              <FaPhone size={10} />
                              {row.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="emp-td emp-td-amount">
                        <span className="emp-ctc">
                          ₹{row.ctc.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="emp-td emp-td-dates">
                        <div className="emp-date-info">
                          <FaCalendarAlt size={10} className="emp-date-icon" />
                          {row.joiningDate
                            ? new Date(row.joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                            : "—"}
                        </div>
                      </td>
                      <td className="emp-td emp-td-meta" onClick={(e) => e.stopPropagation()}>
                        <div className="emp-action-wrapper">
                          {/* User Status Button - Left side */}
                          <button
                            className={`emp-user-toggle ${row.isUser ? 'emp-user-active' : 'emp-user-inactive'}`}
                            onClick={() => handleToggleUser(row)}
                            title={row.isUser ? "Remove user access" : "Add user access"}
                          >
                            {row.isUser ? (
                              <>
                                <FaUserCheck size={12} />
                                <span className="emp-user-label">User</span>
                              </>
                            ) : (
                              <>
                                <FaUserPlus size={12} />
                                <span className="emp-user-label">Add User</span>
                              </>
                            )}
                          </button>

                          {/* Dropdown Container - Right side */}
                          <div 
                            className="emp-dropdown-container" 
                            ref={(el) => { dropdownRefs.current[row.id] = el; }}
                          >
                            <button 
                              className={`emp-dropdown-trigger ${openDropdownId === row.id ? 'emp-dropdown-active' : ''}`}
                              onClick={(e) => toggleDropdown(row.id, e)}
                              aria-label="Actions"
                            >
                              <FaEllipsisV size={14} />
                            </button>
                            
                            {openDropdownId === row.id && (
                              <div className="emp-dropdown-menu">
                                <button 
                                  className="emp-dropdown-item emp-dropdown-view"
                                  onClick={() => handleView(row)}
                                >
                                  <FaEye size={12} />
                                  View
                                </button>
                                <button 
                                  className="emp-dropdown-item emp-dropdown-edit"
                                  onClick={() => handleEdit(row)}
                                >
                                  <FaEdit size={12} />
                                  Edit
                                </button>
                                
                                {row.isUser ? (
                                  <button 
                                    className="emp-dropdown-item emp-dropdown-user-remove"
                                    onClick={() => handleToggleUser(row)}
                                  >
                                    <FaUserSlash size={12} />
                                    Remove User Access
                                  </button>
                                ) : (
                                  <button 
                                    className="emp-dropdown-item emp-dropdown-user-add"
                                    onClick={() => handleToggleUser(row)}
                                  >
                                    <FaUserPlus size={12} />
                                    Add User Access
                                  </button>
                                )}
                                
                                <hr className="emp-dropdown-divider" />
                                <button 
                                  className="emp-dropdown-item emp-dropdown-delete"
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
          <div className="emp-stats-bar">
            <div className="emp-stats-item">
              <span className="emp-stats-label">Total Employees:</span>
              <span className="emp-stats-value">{totalItems}</span>
            </div>
            <div className="emp-stats-item">
              <span className="emp-stats-label">Active:</span>
              <span className="emp-stats-value" style={{ color: "#10b981" }}>
                {employees.filter(e => e.status === "Active").length}
              </span>
            </div>
            <div className="emp-stats-item">
              <span className="emp-stats-label">On Leave:</span>
              <span className="emp-stats-value" style={{ color: "#f59e0b" }}>
                {employees.filter(e => e.status === "On Leave").length}
              </span>
            </div>
            <div className="emp-stats-item">
              <span className="emp-stats-label">Users:</span>
              <span className="emp-stats-value" style={{ color: "#8b5cf6" }}>
                {employees.filter(e => e.isUser).length}
              </span>
            </div>
            <div className="emp-stats-item">
              <span className="emp-stats-label">Departments:</span>
              <span className="emp-stats-value">{departments.length}</span>
            </div>
          </div>

          {/* Pagination */}
          <div className="emp-pagination">
            <div className="emp-pagination-left">
              <span className="emp-pagination-label">Show:</span>
              <select value={itemsPerPage} onChange={(e) => handlePageSizeChange(Number(e.target.value))} className="emp-page-size-select">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="emp-pagination-label">entries</span>
            </div>
            <div className="emp-pagination-center">
              <button onClick={goToFirstPage} disabled={currentPage === 1 || totalFilteredItems === 0} className="emp-page-btn">
                <FaAngleDoubleLeft size={12} />
              </button>
              <button onClick={goToPrevPage} disabled={currentPage === 1 || totalFilteredItems === 0} className="emp-page-btn">
                <FaChevronLeft size={12} />
              </button>
              {totalFilteredItems > 0 && getPageNumbers().map((page) => (
                <button key={page} onClick={() => goToPage(page)} className={`emp-page-btn ${currentPage === page ? "emp-page-btn-active" : ""}`}>
                  {page}
                </button>
              ))}
              <button onClick={goToNextPage} disabled={currentPage === filteredTotalPages || totalFilteredItems === 0} className="emp-page-btn">
                <FaChevronRight size={12} />
              </button>
              <button onClick={goToLastPage} disabled={currentPage === filteredTotalPages || totalFilteredItems === 0} className="emp-page-btn">
                <FaAngleDoubleRight size={12} />
              </button>
            </div>
            <div className="emp-pagination-right">
              <span className="emp-pagination-info">
                {totalFilteredItems > 0
                  ? `Showing ${getStartIndex()} to ${getEndIndex()} of ${totalFilteredItems} entries`
                  : "No entries to show"}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedItem && (
        <div className="emp-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="emp-modal emp-modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-header">
              <span className="emp-modal-title">Confirm Delete</span>
              <button className="emp-modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="emp-modal-body">
              <p>Are you sure you want to delete this employee?</p>
              <div className="emp-modal-item-details">
                <p><strong>Employee:</strong> {selectedItem.employee || selectedItem.id}</p>
                <p><strong>Name:</strong> {selectedItem.name}</p>
                <p><strong>Department:</strong> {selectedItem.department || "—"}</p>
                <p><strong>Designation:</strong> {selectedItem.designation || "—"}</p>
              </div>
              <p className="emp-modal-warning">⚠️ This action cannot be undone.</p>
            </div>
            <div className="emp-modal-footer">
              <button className="emp-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="emp-btn-delete" onClick={confirmDelete}>
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}