// ModulePermissions.tsx
import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaSave,
  FaSpinner,
  FaExclamationCircle,
  FaCheckCircle,
  FaChevronDown,
  FaChevronRight,
  FaPlus,
  FaTimes,
  FaEdit,
  FaTrash,
  FaEye,
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

interface SubModule {
  id: number;
  name: string;
  module_Id: number;
  module_name?: string;
  is_deleted: number;
}

interface Permission {
  id: number;
  permission_name: string;
  module_Id: number;
}

interface ModulePermission {
  id?: number;
  role_Id: number;
  module_Id: number;
  submodule_Id: number;
  permission_Id: number;
  is_deleted: number;
}

// Available permissions
const AVAILABLE_PERMISSIONS = [
  { id: 1, name: "Create" },
  { id: 2, name: "Read" },
  { id: 3, name: "Update" },
  { id: 4, name: "Delete" },
  { id: 5, name: "Export" },
  { id: 6, name: "Import" },
  { id: 7, name: "Print" },
  { id: 8, name: "Email" },
];

export default function ModulePermissions() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const { roleId } = useParams<{ roleId: string }>();
  const roleIdNum = parseInt(roleId || "0");

  const [modules, setModules] = useState<Module[]>([]);
  const [subModules, setSubModules] = useState<SubModule[]>([]);
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  // ─── Fetch Data ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      if (!roleIdNum || isNaN(roleIdNum)) {
        setApiError("Invalid role ID");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch modules
        const modulesRes = await api.get('/module');
        if (modulesRes.data.success === 1) {
          setModules(modulesRes.data.data || []);
        }

        // Fetch submodules
        const subModulesRes = await api.get('/sub-module');
        if (subModulesRes.data.success === 1) {
          setSubModules(subModulesRes.data.data || []);
        }

        // Fetch existing permissions for this role
        const permissionsRes = await api.get(`/module-permissions/role/${roleIdNum}`);
        if (permissionsRes.data.success === 1) {
          setPermissions(permissionsRes.data.data || []);
        }

        // Expand first module by default
        if (modulesRes.data.data && modulesRes.data.data.length > 0) {
          setExpandedModules(new Set([modulesRes.data.data[0].id]));
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setApiError("Failed to load module permissions data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [roleIdNum]);

  // ─── Handlers ──────────────────────────────────────────────────────
  const toggleModule = (moduleId: number) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const getSubModulesForModule = (moduleId: number) => {
    return subModules.filter(sm => sm.module_Id === moduleId && sm.is_deleted === 0);
  };

  const hasPermission = (submoduleId: number, permissionId: number): boolean => {
    return permissions.some(p => 
      p.submodule_Id === submoduleId && 
      p.permission_Id === permissionId && 
      p.is_deleted === 0
    );
  };

  const togglePermission = (submoduleId: number, permissionId: number) => {
    setPermissions(prev => {
      const existing = prev.find(p => 
        p.submodule_Id === submoduleId && 
        p.permission_Id === permissionId
      );

      if (existing) {
        // Toggle is_deleted
        return prev.map(p => 
          p.submodule_Id === submoduleId && 
          p.permission_Id === permissionId
            ? { ...p, is_deleted: p.is_deleted === 0 ? 1 : 0 }
            : p
        );
      } else {
        // Add new permission
        return [
          ...prev,
          {
            role_Id: roleIdNum,
            module_Id: subModules.find(sm => sm.id === submoduleId)?.module_Id || 0,
            submodule_Id: submoduleId,
            permission_Id: permissionId,
            is_deleted: 0
          }
        ];
      }
    });
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setSuccess(null);

    if (!roleIdNum) {
      setApiError("Invalid role ID");
      return;
    }

    setSubmitting(true);
    try {
      // Filter only permissions that are not deleted (is_deleted === 0)
      const activePermissions = permissions.filter(p => p.is_deleted === 0);
      
      const payload = {
        roleId: roleIdNum,
        permissions: activePermissions.map(p => ({
          module_Id: p.module_Id,
          submodule_Id: p.submodule_Id,
          permission_Id: p.permission_Id
        }))
      };

      const response = await api.post('/module-permissions', payload);

      if (response.data.success === 1) {
        setSuccess("Module permissions updated successfully!");
        // Refresh permissions
        const refreshRes = await api.get(`/module-permissions/role/${roleIdNum}`);
        if (refreshRes.data.success === 1) {
          setPermissions(refreshRes.data.data || []);
        }
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

  // ─── Filtered Modules ──────────────────────────────────────────────
  const filteredModules = modules.filter(module => 
    module.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    module.is_deleted === 0
  );

  // ─── Loading State ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`mp-page ${theme}`}>
        <div className="mp-loading">
          <FaSpinner className="mp-spinning" size={32} />
          <p>Loading module permissions...</p>
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
              Configure permissions for role #{roleIdNum}
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

        {/* ─── Search ────────────────────────────────────────────────── */}
        <div className="mp-search-wrapper">
          <input
            type="text"
            placeholder="Search modules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mp-search-input"
          />
        </div>

        <form onSubmit={handleSave}>

          {/* ─── Modules List ────────────────────────────────────────── */}
          <div className="mp-modules-container">
            {filteredModules.length === 0 ? (
              <div className="mp-empty-state">
                <p>No modules found</p>
              </div>
            ) : (
              filteredModules.map((module) => {
                const subModulesForModule = getSubModulesForModule(module.id);
                const isExpanded = expandedModules.has(module.id);

                return (
                  <div key={module.id} className="mp-module-item">
                    {/* Module Header */}
                    <div 
                      className="mp-module-header"
                      onClick={() => toggleModule(module.id)}
                    >
                      <div className="mp-module-header-left">
                        {isExpanded ? (
                          <FaChevronDown size={12} />
                        ) : (
                          <FaChevronRight size={12} />
                        )}
                        <span className="mp-module-name">{module.name}</span>
                        <span className="mp-module-count">
                          {subModulesForModule.length} sub-modules
                        </span>
                      </div>
                    </div>

                    {/* Sub-modules */}
                    {isExpanded && (
                      <div className="mp-submodules-container">
                        {subModulesForModule.length === 0 ? (
                          <div className="mp-no-submodules">
                            No sub-modules for this module
                          </div>
                        ) : (
                          subModulesForModule.map((subModule) => (
                            <div key={subModule.id} className="mp-submodule-item">
                              <div className="mp-submodule-name">
                                {subModule.name}
                              </div>
                              <div className="mp-permissions-grid">
                                {AVAILABLE_PERMISSIONS.map((perm) => {
                                  const isChecked = hasPermission(subModule.id, perm.id);
                                  return (
                                    <label key={perm.id} className="mp-permission-checkbox">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => togglePermission(subModule.id, perm.id)}
                                        disabled={submitting}
                                      />
                                      <span>{perm.name}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* ─── Footer ────────────────────────────────────────────────── */}
          <div className="mp-footer">
            <button
              type="button"
              onClick={() => navigate('/role')}
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
              {submitting && <FaSpinner className="mp-spinning" />}
              <FaSave size={12} />
              Save Permissions
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}