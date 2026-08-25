// SubModulePermissions.tsx - Clean & Clear UI
import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaSave,
  FaSpinner,
  FaExclamationCircle,
  FaCheckCircle,
  FaPlus,
  FaTimes,
  FaEdit,
  FaTrash,
  FaPuzzlePiece,
  FaFolder,
  FaKey,
  FaChevronRight,
  FaCrown,
  FaShieldAlt,
} from "react-icons/fa";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';
import "./SubModulePermissions.css";

interface ModuleData {
  id: number;
  name: string;
}

interface Permission {
  id: number;
  permission_name: string;
  is_selected?: boolean;
}

interface SubModuleData {
  submodule_id: number;
  submodule_name: string;
  permissions: Permission[];
}

interface ModulePermissionsResponse {
  success: number;
  data: {
    module: ModuleData;
    submodules: SubModuleData[];
  };
}

export default function SubModulePermissions() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const { moduleId } = useParams<{ moduleId: string }>();
  const [searchParams] = useSearchParams();
  const moduleIdNum = parseInt(moduleId || "0");
  const roleId = parseInt(searchParams.get('roleId') || "1");

  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [subModules, setSubModules] = useState<SubModuleData[]>([]);
  const [selectedSubModuleId, setSelectedSubModuleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedPermissions, setSelectedPermissions] = useState<Map<number, Set<number>>>(new Map());

  // ─── Modal States ──────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add-submodule' | 'edit-submodule' | 'delete-submodule' | 
                                      'add-permission' | 'edit-permission' | 'delete-permission' | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [modalInput, setModalInput] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // ─── Fetch Data ──────────────────────────────────────────────────────
  const fetchData = async () => {
    if (!moduleIdNum || isNaN(moduleIdNum)) {
      setApiError("Invalid module ID");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get<ModulePermissionsResponse>(
        `/module-permission/${moduleIdNum}/${roleId}`
      );
      
      if (response.data.success === 1 && response.data.data) {
        const data = response.data.data;
        setModuleData(data.module);
        setSubModules(data.submodules || []);
        
        if (data.submodules.length > 0 && !selectedSubModuleId) {
          setSelectedSubModuleId(data.submodules[0].submodule_id);
        }
        
        const permMap = new Map<number, Set<number>>();
        data.submodules.forEach((sub: SubModuleData) => {
          const permSet = new Set<number>();
          sub.permissions.forEach((p: Permission) => {
            if (p.is_selected) {
              permSet.add(p.id);
            }
          });
          permMap.set(sub.submodule_id, permSet);
        });
        setSelectedPermissions(permMap);
      } else {
        setApiError("Failed to fetch module permissions");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setApiError("Failed to load submodule data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [moduleIdNum, roleId]);

  const selectedSubModule = subModules.find(s => s.submodule_id === selectedSubModuleId);

  const hasPermission = (submoduleId: number, permissionId: number): boolean => {
    return selectedPermissions.get(submoduleId)?.has(permissionId) || false;
  };

  const togglePermission = (submoduleId: number, permissionId: number) => {
    setSelectedPermissions(prev => {
      const newMap = new Map(prev);
      const permSet = new Set(prev.get(submoduleId) || []);
      
      if (permSet.has(permissionId)) {
        permSet.delete(permissionId);
      } else {
        permSet.add(permissionId);
      }
      
      if (permSet.size === 0) {
        newMap.delete(submoduleId);
      } else {
        newMap.set(submoduleId, permSet);
      }
      
      return newMap;
    });
  };

  const toggleAllPermissions = () => {
    if (!selectedSubModule) return;
    const allSelected = selectedSubModule.permissions.every(p => 
      hasPermission(selectedSubModule.submodule_id, p.id)
    );
    
    selectedSubModule.permissions.forEach(p => {
      const currentState = hasPermission(selectedSubModule.submodule_id, p.id);
      if (allSelected && currentState) {
        togglePermission(selectedSubModule.submodule_id, p.id);
      } else if (!allSelected && !currentState) {
        togglePermission(selectedSubModule.submodule_id, p.id);
      }
    });
  };

  // ─── Modal Handlers ──────────────────────────────────────────────────
  const openModal = (type: any, data?: any) => {
    setModalType(type);
    setModalData(data || null);
    setModalInput(data?.name || "");
    setModalError(null);
    setModalLoading(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType(null);
    setModalData(null);
    setModalInput("");
    setModalError(null);
    setModalLoading(false);
  };

  // ─── SubModule CRUD ──────────────────────────────────────────────────
  const handleCreateSubModule = async () => {
    if (!modalInput.trim()) {
      setModalError("Submodule name is required");
      return;
    }

    setModalLoading(true);
    setModalError(null);

    try {
      const response = await api.post('/sub-module', {
        name: modalInput.trim(),
        module_Id: moduleIdNum,
        modified_by: 1
      });

      if (response.data.success === 1) {
        setSuccess(`Submodule "${modalInput}" created successfully!`);
        closeModal();
        await fetchData();
      } else {
        setModalError(response.data.message || "Failed to create submodule");
      }
    } catch (err: any) {
      console.error("Error creating submodule:", err);
      setModalError(err.response?.data?.message || "Failed to create submodule");
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateSubModule = async () => {
    if (!modalInput.trim()) {
      setModalError("Submodule name is required");
      return;
    }

    setModalLoading(true);
    setModalError(null);

    try {
      const response = await api.put('/sub-module', {
        id: modalData.id,
        name: modalInput.trim(),
        module_Id: moduleIdNum,
        modified_by: 1
      });

      if (response.data.success === 1) {
        setSuccess(`Submodule updated successfully!`);
        closeModal();
        await fetchData();
      } else {
        setModalError(response.data.message || "Failed to update submodule");
      }
    } catch (err: any) {
      console.error("Error updating submodule:", err);
      setModalError(err.response?.data?.message || "Failed to update submodule");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteSubModule = async () => {
    setModalLoading(true);

    try {
      const response = await api.delete(`/sub-module/${modalData.id}`);
      if (response.data.success === 1) {
        setSuccess(`Submodule "${modalData.name}" deleted successfully!`);
        closeModal();
        await fetchData();
      }
    } catch (err) {
      console.error("Error deleting submodule:", err);
      setModalError("Failed to delete submodule");
    } finally {
      setModalLoading(false);
    }
  };

  // ─── Permission CRUD ──────────────────────────────────────────────────
  const handleCreatePermission = async () => {
    if (!modalInput.trim()) {
      setModalError("Permission name is required");
      return;
    }

    setModalLoading(true);
    setModalError(null);

    try {
      const response = await api.post('/permission', {
        permission_name: modalInput.trim(),
        module_Id: moduleIdNum,
        submodule_Id: modalData.submoduleId,
        modified_by: 1
      });

      if (response.data.success === 1) {
        setSuccess(`Permission "${modalInput}" created successfully!`);
        closeModal();
        await fetchData();
      } else {
        setModalError(response.data.message || "Failed to create permission");
      }
    } catch (err: any) {
      console.error("Error creating permission:", err);
      setModalError(err.response?.data?.message || "Failed to create permission");
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdatePermission = async () => {
    if (!modalInput.trim()) {
      setModalError("Permission name is required");
      return;
    }

    setModalLoading(true);
    setModalError(null);

    try {
      const response = await api.put('/permission', {
        id: modalData.id,
        permission_name: modalInput.trim(),
        module_Id: moduleIdNum,
        submodule_Id: modalData.submoduleId,
        modified_by: 1
      });

      if (response.data.success === 1) {
        setSuccess(`Permission updated successfully!`);
        closeModal();
        await fetchData();
      } else {
        setModalError(response.data.message || "Failed to update permission");
      }
    } catch (err: any) {
      console.error("Error updating permission:", err);
      setModalError(err.response?.data?.message || "Failed to update permission");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeletePermission = async () => {
    setModalLoading(true);

    try {
      const response = await api.delete(`/permission/${modalData.id}`);
      if (response.data.success === 1) {
        setSuccess(`Permission "${modalData.name}" deleted successfully!`);
        closeModal();
        await fetchData();
      }
    } catch (err) {
      console.error("Error deleting permission:", err);
      setModalError("Failed to delete permission");
    } finally {
      setModalLoading(false);
    }
  };

  // ─── Save Permissions ──────────────────────────────────────────────────
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setSuccess(null);

    setSubmitting(true);
    try {
      const permissions: { module_Id: number; submodule_Id: number; permission_Id: number }[] = [];
      
      selectedPermissions.forEach((permSet, submoduleId) => {
        permSet.forEach((permissionId) => {
          permissions.push({
            module_Id: moduleIdNum,
            submodule_Id: submoduleId,
            permission_Id: permissionId
          });
        });
      });

      const payload = {
        roleId: roleId,
        moduleId: moduleIdNum,
        permissions: permissions,
        modified_by: 1
      };

      const response = await api.post('/module-permission/save', payload);

      if (response.data.success === 1) {
        setSuccess("Permissions updated successfully!");
        await fetchData();
      } else {
        setApiError(response.data.message || "Failed to update permissions");
      }
    } catch (err: any) {
      console.error("Error saving permissions:", err);
      setApiError(err.response?.data?.message || "Failed to save permissions");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Loading State ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`sp-page ${theme}`}>
        <div className="sp-loading">
          <FaSpinner className="sp-spinning" size={32} />
          <p>Loading permissions...</p>
        </div>
      </div>
    );
  }

  // ─── Render Modal ────────────────────────────────────────────────────
  const renderModal = () => {
    if (!showModal || !modalType) return null;

    const getModalConfig = () => {
      switch (modalType) {
        case 'add-submodule':
          return {
            title: 'Add Submodule',
            submitLabel: 'Create',
            onSubmit: handleCreateSubModule,
            placeholder: 'Enter submodule name',
          };
        case 'edit-submodule':
          return {
            title: 'Edit Submodule',
            submitLabel: 'Update',
            onSubmit: handleUpdateSubModule,
            placeholder: 'Enter submodule name',
          };
        case 'delete-submodule':
          return {
            title: 'Delete Submodule',
            submitLabel: 'Delete',
            onSubmit: handleDeleteSubModule,
            isDelete: true,
            message: `Delete "${modalData?.name}"? This cannot be undone.`,
          };
        case 'add-permission':
          return {
            title: 'Add Permission',
            submitLabel: 'Create',
            onSubmit: handleCreatePermission,
            placeholder: 'Enter permission name',
          };
        case 'edit-permission':
          return {
            title: 'Edit Permission',
            submitLabel: 'Update',
            onSubmit: handleUpdatePermission,
            placeholder: 'Enter permission name',
          };
        case 'delete-permission':
          return {
            title: 'Delete Permission',
            submitLabel: 'Delete',
            onSubmit: handleDeletePermission,
            isDelete: true,
            message: `Delete "${modalData?.name}"? This cannot be undone.`,
          };
        default:
          return null;
      }
    };

    const config = getModalConfig();
    if (!config) return null;

    return (
      <div className="sp-modal-overlay" onClick={closeModal}>
        <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
          <div className="sp-modal-header">
            <span className="sp-modal-title">{config.title}</span>
            <button className="sp-modal-close" onClick={closeModal}>
              <FaTimes size={16} />
            </button>
          </div>
          <div className="sp-modal-body">
            {modalError && (
              <div className="sp-modal-error">
                <FaExclamationCircle />
                <span>{modalError}</span>
              </div>
            )}
            
            {config.isDelete ? (
              <p className="sp-modal-warning">{config.message}</p>
            ) : (
              <div className="sp-modal-field">
                <label className="sp-modal-label">
                  Name <span className="sp-required">*</span>
                </label>
                <input
                  type="text"
                  value={modalInput}
                  onChange={(e) => setModalInput(e.target.value)}
                  placeholder={config.placeholder}
                  className="sp-modal-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      config.onSubmit();
                    }
                  }}
                  autoFocus
                />
              </div>
            )}
          </div>
          <div className="sp-modal-footer">
            <button
              type="button"
              onClick={closeModal}
              className="sp-modal-cancel"
              disabled={modalLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={config.onSubmit}
              className={config.isDelete ? "sp-modal-delete-btn" : "sp-modal-submit"}
              disabled={modalLoading || (!config.isDelete && !modalInput.trim())}
            >
              {modalLoading && <FaSpinner className="sp-spinning" size={12} />}
              {config.submitLabel}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const totalSelected = Array.from(selectedPermissions.values()).reduce((acc, set) => acc + set.size, 0);

  return (
    <div className={`sp-page ${theme}`}>
      <div className="sp-inner">

        {/* ─── Header ────────────────────────────────────────────────── */}
        <div className="sp-header">
          {/* FIX: Navigate back to ModulePermissions with roleId */}
          <button onClick={() => navigate(`/role/permissions/${roleId}`)} className="back-btn">
  <FaArrowLeft size={12} /> Back
</button>
          <div className="header-title">
            <div className="header-title-top">
              <h1>
                <FaPuzzlePiece className="header-icon" />
                {moduleData?.name || 'Module'}
              </h1>
              <div className="header-badge">
                <FaCrown size={12} />
                <span>Role #{roleId}</span>
              </div>
            </div>
            <p className="header-subtitle">
              {subModules.length} Submodule{subModules.length !== 1 ? 's' : ''} · {totalSelected} permissions selected
            </p>
          </div>
        </div>

        {/* ─── Messages ──────────────────────────────────────────────── */}
        {apiError && (
          <div className="sp-message error">
            <FaExclamationCircle className="message-icon" />
            <span>{apiError}</span>
            <button className="message-close" onClick={() => setApiError(null)}>×</button>
          </div>
        )}
        {success && (
          <div className="sp-message success">
            <FaCheckCircle className="message-icon" />
            <span>{success}</span>
            <button className="message-close" onClick={() => setSuccess(null)}>×</button>
          </div>
        )}

        <form onSubmit={handleSave}>

          {/* ─── Split Layout ────────────────────────────────────────── */}
          <div className="sp-split-layout">
            
            {/* ─── Left Panel: SubModules List ────────────────────── */}
            <div className="sp-left-panel">
              <div className="sp-panel-header">
                <div className="sp-panel-title">
                  <FaFolder size={14} />
                  <span>Submodules</span>
                  <span className="sp-panel-count">{subModules.length}</span>
                </div>
                <button
                  type="button"
                  className="sp-panel-add-btn"
                  onClick={() => openModal('add-submodule')}
                >
                  <FaPlus size={12} /> Add
                </button>
              </div>
              
              <div className="sp-submodule-list">
                {subModules.length === 0 ? (
                  <div className="sp-empty-state">
                    <p>No submodules</p>
                    <button
                      type="button"
                      onClick={() => openModal('add-submodule')}
                      className="sp-empty-add-btn"
                    >
                      <FaPlus size={12} /> Add Submodule
                    </button>
                  </div>
                ) : (
                  subModules.map((sub) => {
                    const isActive = selectedSubModuleId === sub.submodule_id;
                    const permCount = selectedPermissions.get(sub.submodule_id)?.size || 0;
                    const totalPerms = sub.permissions.length;
                    
                    return (
                      <div
                        key={sub.submodule_id}
                        className={`sp-submodule-item ${isActive ? 'active' : ''}`}
                        onClick={() => setSelectedSubModuleId(sub.submodule_id)}
                      >
                        <div className="sp-submodule-item-content">
                          <div className="sp-submodule-item-left">
                            <FaChevronRight className={`sp-item-chevron ${isActive ? 'active' : ''}`} size={12} />
                            <span className="sp-submodule-item-name">{sub.submodule_name}</span>
                          </div>
                          <span className="sp-submodule-item-badge">{permCount}/{totalPerms}</span>
                        </div>
                        <div className="sp-submodule-item-actions">
                          <button
                            type="button"
                            className="sp-item-action-btn sp-item-edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal('edit-submodule', { id: sub.submodule_id, name: sub.submodule_name });
                            }}
                          >
                            <FaEdit size={12} />
                          </button>
                          <button
                            type="button"
                            className="sp-item-action-btn sp-item-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal('delete-submodule', { id: sub.submodule_id, name: sub.submodule_name });
                            }}
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ─── Right Panel: Permissions ────────────────────────── */}
            <div className="sp-right-panel">
              {!selectedSubModule ? (
                <div className="sp-empty-state">
                  <FaKey size={32} />
                  <p>Select a submodule</p>
                  <span>Click a submodule on the left to manage its permissions</span>
                </div>
              ) : (
                <>
                  <div className="sp-panel-header">
                    <div className="sp-panel-title">
                      <FaKey size={14} />
                      <span>{selectedSubModule.submodule_name}</span>
                      <span className="sp-panel-badge">
                        {selectedPermissions.get(selectedSubModule.submodule_id)?.size || 0}/{selectedSubModule.permissions.length}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="sp-panel-add-btn"
                      onClick={() => openModal('add-permission', { submoduleId: selectedSubModule.submodule_id })}
                    >
                      <FaPlus size={12} /> Add Permission
                    </button>
                  </div>

                  <div className="sp-permissions-list">
                    {selectedSubModule.permissions.length === 0 ? (
                      <div className="sp-empty-state">
                        <p>No permissions</p>
                        <button
                          type="button"
                          onClick={() => openModal('add-permission', { submoduleId: selectedSubModule.submodule_id })}
                          className="sp-empty-add-btn"
                        >
                          <FaPlus size={12} /> Add Permission
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Select All */}
                        <div className="sp-select-all-wrapper">
                          <label className="sp-select-all-checkbox">
                            <input
                              type="checkbox"
                              checked={selectedSubModule.permissions.every(p => 
                                hasPermission(selectedSubModule.submodule_id, p.id)
                              )}
                              onChange={toggleAllPermissions}
                              disabled={submitting}
                            />
                            <span className="sp-checkbox-custom"></span>
                            <span className="sp-select-all-label">✓ Select All</span>
                          </label>
                        </div>

                        {/* Permission Items */}
                        <div className="sp-permissions-grid">
                          {selectedSubModule.permissions.map((perm) => {
                            const isChecked = hasPermission(selectedSubModule.submodule_id, perm.id);
                            return (
                              <div key={perm.id} className="sp-permission-item">
                                <label className={`sp-permission-checkbox ${isChecked ? 'checked' : ''}`}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => togglePermission(selectedSubModule.submodule_id, perm.id)}
                                    disabled={submitting}
                                  />
                                  <span className="sp-checkbox-custom"></span>
                                  <span className="sp-permission-name">{perm.permission_name}</span>
                                </label>
                                <div className="sp-permission-actions">
                                  <button
                                    type="button"
                                    className="sp-item-action-btn sp-item-edit"
                                    onClick={() => openModal('edit-permission', { 
                                      id: perm.id, 
                                      name: perm.permission_name, 
                                      submoduleId: selectedSubModule.submodule_id 
                                    })}
                                  >
                                    <FaEdit size={11} />
                                  </button>
                                  <button
                                    type="button"
                                    className="sp-item-action-btn sp-item-delete"
                                    onClick={() => openModal('delete-permission', { 
                                      id: perm.id, 
                                      name: perm.permission_name, 
                                      submoduleId: selectedSubModule.submodule_id 
                                    })}
                                  >
                                    <FaTrash size={11} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ─── Footer ────────────────────────────────────────────────── */}
          <div className="sp-footer">
            <div className="sp-footer-left">
              <span className="sp-selected-count">
                <FaShieldAlt size={14} />
                <strong>{totalSelected}</strong> permissions selected
              </span>
            </div>
            <div className="sp-footer-right">
              {/* FIX: Navigate back to ModulePermissions with roleId */}
              <button
                type="button"
                onClick={() => navigate(`/role/permissions/${roleId}`)}
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
                {submitting && <FaSpinner className="sp-spinning" />}
                <FaSave size={14} />
                Save Permissions
              </button>
            </div>
          </div>

        </form>
      </div>

      {/* ─── Modal ────────────────────────────────────────────────────── */}
      {renderModal()}
    </div>
  );
}