// ModulePermissions.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaSpinner,
  FaExclamationCircle,
  FaCheckCircle,
  FaPlus,
  FaTimes,
  FaEdit,
  FaTrash,
  FaCog,
  FaEllipsisV,
  FaPuzzlePiece,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
} from "react-icons/fa";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';
import "./ModulePermissions.css";

interface Module {
  id: number;
  name: string;
  creation: string;
  modified: string;
  modified_by: string;
  is_deleted: number;
}

interface ApiResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: Module[];
  };
}

export default function ModulePermissions() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const { roleId } = useParams<{ roleId: string }>();
  const roleIdNum = parseInt(roleId || "0");

  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const dropdownRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // ─── Pagination State ──────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // ─── Add Module Modal State ──────────────────────────────────────────
  const [showAddModuleModal, setShowAddModuleModal] = useState(false);
  const [newModuleName, setNewModuleName] = useState("");
  const [addingModule, setAddingModule] = useState(false);
  const [moduleError, setModuleError] = useState<string | null>(null);

  // ─── Edit Module Modal State ──────────────────────────────────────────
  const [showEditModuleModal, setShowEditModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editModuleName, setEditModuleName] = useState("");
  const [updatingModule, setUpdatingModule] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ─── Delete Confirmation State ──────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingModule, setDeletingModule] = useState<Module | null>(null);

  // ─── Fetch Data ──────────────────────────────────────────────────────
  const fetchData = async () => {
    if (!roleIdNum || isNaN(roleIdNum)) {
      setApiError("Invalid role ID");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get<ApiResponse>(`/module?page=${currentPage}&limit=${itemsPerPage}`);
      if (response.data.success === 1 && response.data.data) {
        const { records, total, page, limit } = response.data.data;
        setModules(records || []);
        setTotalItems(total || 0);
        setCurrentPage(page || 1);
        setTotalPages(Math.ceil((total || 0) / (limit || itemsPerPage)));
      } else {
        setModules([]);
        setTotalItems(0);
        setTotalPages(0);
        setApiError("Failed to fetch modules");
      }
    } catch (err) {
      console.error("Error fetching modules:", err);
      setApiError("Failed to load modules data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, itemsPerPage, roleIdNum]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // ─── Filter Modules (frontend search on current page) ──────────────
  const filteredModules = modules.filter(module =>
    module.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalFilteredItems = filteredModules.length;

  // ─── Pagination Handlers ─────────────────────────────────────────────
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
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
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  const getStartIndex = () => {
    return (currentPage - 1) * itemsPerPage + 1;
  };

  const getEndIndex = () => {
    return Math.min(currentPage * itemsPerPage, totalItems);
  };

  // ─── Close dropdown when clicking outside ──────────────────────────
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

  // ─── Module CRUD Handlers ─────────────────────────────────────────────
  const handleAddModule = () => {
    setShowAddModuleModal(true);
    setNewModuleName("");
    setModuleError(null);
  };

  const handleCloseAddModal = () => {
    setShowAddModuleModal(false);
    setNewModuleName("");
    setModuleError(null);
  };

  const handleCreateModule = async () => {
    if (!newModuleName.trim()) {
      setModuleError("Module name is required");
      return;
    }

    setAddingModule(true);
    setModuleError(null);

    try {
      const response = await api.post('/module', {
        name: newModuleName.trim(),
        modified_by: 1
      });

      if (response.data.success === 1) {
        setSuccess(`Module "${newModuleName}" created successfully!`);
        handleCloseAddModal();
        await fetchData();
      } else {
        setModuleError(response.data.message || "Failed to create module");
      }
    } catch (err: any) {
      console.error("Error creating module:", err);
      if (err.response && err.response.status === 409) {
        setModuleError("A module with this name already exists");
      } else {
        setModuleError(err.response?.data?.message || "Failed to create module");
      }
    } finally {
      setAddingModule(false);
    }
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setEditModuleName(module.name);
    setShowEditModuleModal(true);
    setEditError(null);
    setOpenDropdownId(null);
  };

  const handleCloseEditModal = () => {
    setShowEditModuleModal(false);
    setEditingModule(null);
    setEditModuleName("");
    setEditError(null);
  };

  const handleUpdateModule = async () => {
    if (!editModuleName.trim()) {
      setEditError("Module name is required");
      return;
    }

    if (!editingModule) return;

    setUpdatingModule(true);
    setEditError(null);

    try {
      const response = await api.put('/module', {
        id: editingModule.id,
        name: editModuleName.trim(),
        modified_by: 1
      });

      if (response.data.success === 1) {
        setSuccess(`Module updated successfully!`);
        handleCloseEditModal();
        await fetchData();
      } else {
        setEditError(response.data.message || "Failed to update module");
      }
    } catch (err: any) {
      console.error("Error updating module:", err);
      if (err.response && err.response.status === 409) {
        setEditError("A module with this name already exists");
      } else {
        setEditError(err.response?.data?.message || "Failed to update module");
      }
    } finally {
      setUpdatingModule(false);
    }
  };

  const handleDeleteModule = (module: Module) => {
    setDeletingModule(module);
    setShowDeleteConfirm(true);
    setOpenDropdownId(null);
  };

  const confirmDelete = async () => {
    if (!deletingModule) return;

    try {
      const response = await api.delete(`/module/${deletingModule.id}`);
      if (response.data.success === 1) {
        setSuccess(`Module "${deletingModule.name}" deleted successfully!`);
        setShowDeleteConfirm(false);
        setDeletingModule(null);
        await fetchData();
      }
    } catch (err) {
      console.error("Error deleting module:", err);
      alert("Failed to delete module");
    }
  };

  const handleManageSubmodules = (moduleId: number) => {
    navigate(`/module/${moduleId}/submodules?roleId=${roleIdNum}`);
    setOpenDropdownId(null);
  };

  const handleModuleClick = (moduleId: number) => {
    navigate(`/module/${moduleId}/submodules?roleId=${roleIdNum}`);
  };

  const toggleDropdown = (id: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  // ─── Loading State ──────────────────────────────────────────────────
  if (loading && modules.length === 0) {
    return (
      <div className={`mp-page ${theme}`}>
        <div className="mp-loading">
          <FaSpinner className="mp-spinning" size={32} />
          <p>Loading modules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`mp-page ${theme}`}>
      <div className="mp-inner">

        {/* ─── Header ────────────────────────────────────────────────── */}
        <div className="mp-header">
          <button onClick={() => navigate('/role')} className="back-btn">
            <FaArrowLeft size={9} /> Back
          </button>
          <div className="header-title">
            <h1>Module Permissions</h1>
            <p className="header-subtitle">
              Manage modules for role #{roleIdNum}
            </p>
          </div>
        </div>

        {/* ─── Messages ──────────────────────────────────────────────── */}
        {apiError && (
          <div className="mp-message error">
            <FaExclamationCircle className="message-icon" />
            <span>{apiError}</span>
            <button className="message-close" onClick={() => setApiError(null)}>×</button>
          </div>
        )}
        {success && (
          <div className="mp-message success">
            <FaCheckCircle className="message-icon" />
            <span>{success}</span>
            <button className="message-close" onClick={() => setSuccess(null)}>×</button>
          </div>
        )}

        {/* ─── Search and Add Module ──────────────────────────────────── */}
        <div className="mp-toolbar">
          <div className="mp-search-wrapper">
            <FaSearch className="mp-search-icon" />
            <input
              type="text"
              placeholder="Search modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mp-search-input"
            />
            {searchTerm && (
              <button className="mp-search-clear" onClick={() => setSearchTerm("")}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
          <button className="mp-add-module-btn" onClick={handleAddModule}>
            <FaPlus size={12} />
            Add Module
          </button>
        </div>

        {/* ─── Modules List ────────────────────────────────────────── */}
        <div className="mp-modules-container">
          {filteredModules.length === 0 ? (
            <div className="mp-empty-state">
              <FaPuzzlePiece size={48} style={{ color: "var(--text-secondary)" }} />
              <p>No modules found</p>
              {searchTerm && <span>Try adjusting your search criteria</span>}
            </div>
          ) : (
            filteredModules.map((module) => (
              <div 
                key={module.id} 
                className="mp-module-item"
                onClick={() => handleModuleClick(module.id)}
              >
                <div className="mp-module-row">
                  <div className="mp-module-info">
                    <FaPuzzlePiece className="mp-module-icon" />
                    <span className="mp-module-name">{module.name}</span>
                    <span className="mp-module-id">ID: {module.id}</span>
                  </div>
                  <div className="mp-module-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="mp-action-btn mp-settings-btn"
                      onClick={() => handleManageSubmodules(module.id)}
                      title="Manage Submodules & Permissions"
                    >
                      <FaCog size={14} />
                    </button>
                    <div 
                      className="mp-dropdown-container"
                      ref={(el) => { dropdownRefs.current[module.id] = el; }}
                    >
                      <button
                        type="button"
                        className={`mp-action-btn mp-dropdown-trigger ${openDropdownId === module.id ? 'mp-dropdown-active' : ''}`}
                        onClick={(e) => toggleDropdown(module.id, e)}
                        aria-label="Actions"
                      >
                        <FaEllipsisV size={14} />
                      </button>
                      {openDropdownId === module.id && (
                        <div className="mp-dropdown-menu">
                          <button
                            type="button"
                            className="mp-dropdown-item mp-dropdown-edit"
                            onClick={() => handleEditModule(module)}
                          >
                            <FaEdit size={12} />
                            Edit
                          </button>
                          <button
                            type="button"
                            className="mp-dropdown-item mp-dropdown-submodules"
                            onClick={() => handleManageSubmodules(module.id)}
                          >
                            <FaCog size={12} />
                            Manage Submodules
                          </button>
                          <hr className="mp-dropdown-divider" />
                          <button
                            type="button"
                            className="mp-dropdown-item mp-dropdown-delete"
                            onClick={() => handleDeleteModule(module)}
                          >
                            <FaTrash size={12} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ─── Pagination ────────────────────────────────────────────── */}
        {totalItems > 0 && (
          <div className="mp-pagination">
            <div className="mp-pagination-left">
              <span className="mp-pagination-label">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="mp-page-size-select"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="mp-pagination-label">entries</span>
            </div>
            <div className="mp-pagination-center">
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1 || totalItems === 0}
                className="mp-page-btn"
              >
                <FaAngleDoubleLeft size={12} />
              </button>
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1 || totalItems === 0}
                className="mp-page-btn"
              >
                <FaChevronLeft size={12} />
              </button>
              {totalItems > 0 && getPageNumbers().map(page => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`mp-page-btn ${currentPage === page ? 'mp-page-btn-active' : ''}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages || totalItems === 0}
                className="mp-page-btn"
              >
                <FaChevronRight size={12} />
              </button>
              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages || totalItems === 0}
                className="mp-page-btn"
              >
                <FaAngleDoubleRight size={12} />
              </button>
            </div>
            <div className="mp-pagination-right">
              <span className="mp-pagination-info">
                {totalItems > 0 ? (
                  `Showing ${getStartIndex()} to ${getEndIndex()} of ${totalItems} entries`
                ) : (
                  'No entries to show'
                )}
              </span>
            </div>
          </div>
        )}

        {/* ─── Footer ────────────────────────────────────────────────── */}
        <div className="mp-footer">
          <button
            type="button"
            onClick={() => navigate('/role')}
            className="cancel-btn"
          >
            Back
          </button>
        </div>

      </div>

      {/* ─── Add Module Modal ────────────────────────────────────────── */}
      {showAddModuleModal && (
        <div className="mp-modal-overlay" onClick={handleCloseAddModal}>
          <div className="mp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mp-modal-header">
              <span className="mp-modal-title">Add New Module</span>
              <button className="mp-modal-close" onClick={handleCloseAddModal}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="mp-modal-body">
              {moduleError && (
                <div className="mp-modal-error">
                  <FaExclamationCircle />
                  <span>{moduleError}</span>
                </div>
              )}
              <div className="mp-modal-field">
                <label className="mp-modal-label">
                  Module Name <span className="mp-required">*</span>
                </label>
                <input
                  type="text"
                  value={newModuleName}
                  onChange={(e) => setNewModuleName(e.target.value)}
                  placeholder="Enter module name"
                  className="mp-modal-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateModule();
                    }
                  }}
                  autoFocus
                />
              </div>
            </div>
            <div className="mp-modal-footer">
              <button
                type="button"
                onClick={handleCloseAddModal}
                className="mp-modal-cancel"
                disabled={addingModule}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateModule}
                className="mp-modal-submit"
                disabled={addingModule || !newModuleName.trim()}
              >
                {addingModule && <FaSpinner className="mp-spinning" size={12} />}
                <FaPlus size={12} />
                Create Module
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Edit Module Modal ────────────────────────────────────────── */}
      {showEditModuleModal && editingModule && (
        <div className="mp-modal-overlay" onClick={handleCloseEditModal}>
          <div className="mp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mp-modal-header">
              <span className="mp-modal-title">Edit Module</span>
              <button className="mp-modal-close" onClick={handleCloseEditModal}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="mp-modal-body">
              {editError && (
                <div className="mp-modal-error">
                  <FaExclamationCircle />
                  <span>{editError}</span>
                </div>
              )}
              <div className="mp-modal-field">
                <label className="mp-modal-label">
                  Module Name <span className="mp-required">*</span>
                </label>
                <input
                  type="text"
                  value={editModuleName}
                  onChange={(e) => setEditModuleName(e.target.value)}
                  placeholder="Enter module name"
                  className="mp-modal-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdateModule();
                    }
                  }}
                  autoFocus
                />
              </div>
            </div>
            <div className="mp-modal-footer">
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="mp-modal-cancel"
                disabled={updatingModule}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateModule}
                className="mp-modal-submit"
                disabled={updatingModule || !editModuleName.trim()}
              >
                {updatingModule && <FaSpinner className="mp-spinning" size={12} />}
                <FaEdit size={12} />
                Update Module
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ──────────────────────────────── */}
      {showDeleteConfirm && deletingModule && (
        <div className="mp-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="mp-modal mp-modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="mp-modal-header">
              <span className="mp-modal-title">Confirm Delete</span>
              <button className="mp-modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="mp-modal-body">
              <p>Are you sure you want to delete this module?</p>
              <div className="mp-modal-item-details">
                <p><strong>Module:</strong> {deletingModule.name}</p>
                <p><strong>Created:</strong> {new Date(deletingModule.creation).toLocaleDateString()}</p>
              </div>
              <p className="mp-modal-warning">⚠️ This action cannot be undone.</p>
            </div>
            <div className="mp-modal-footer">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="mp-modal-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="mp-modal-delete-btn"
              >
                <FaTrash size={12} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}