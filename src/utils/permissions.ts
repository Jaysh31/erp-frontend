// src/utils/permissions.ts
// Reads the modules/submodules/permissions tree stored at login
// (storage.setAuthData -> STORAGE_KEYS.MODULES) and exposes helpers
// to check module / submodule / action-level access anywhere in the app.

import { getModules as getStoredModules } from './storage';

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

/** Raw modules array as stored at login. */
export function getModules() {
  return getStoredModules() || [];
}

/** True if the logged-in user has ANY access to this module (by name). */
export function hasModule(moduleName: string): boolean {
  return getModules().some(m => norm(m.moduleName) === norm(moduleName));
}

/** True if the user has ANY access to this submodule within a module. */
export function hasSubmodule(moduleName: string, submoduleName: string): boolean {
  const mod = getModules().find(m => norm(m.moduleName) === norm(moduleName));
  if (!mod) return false;
  return mod.submodules.some(s => norm(s.submoduleName) === norm(submoduleName));
}

/**
 * True if the user has a specific action permission (view/add/edit/delete/update...)
 * on a submodule. If permissionName is omitted, behaves like hasSubmodule.
 */
export function hasPermission(
  moduleName: string,
  submoduleName: string,
  permissionName?: string
): boolean {
  const mod = getModules().find(m => norm(m.moduleName) === norm(moduleName));
  if (!mod) return false;
  const sub = mod.submodules.find(s => norm(s.submoduleName) === norm(submoduleName));
  if (!sub) return false;
  if (!permissionName) return true;
  return sub.permissions.some(p => norm(p.permissionName) === norm(permissionName));
}

/** Returns permission names (e.g. ['view','edit']) the user has on a submodule. */
export function getSubmodulePermissions(moduleName: string, submoduleName: string): string[] {
  const mod = getModules().find(m => norm(m.moduleName) === norm(moduleName));
  const sub = mod?.submodules.find(s => norm(s.submoduleName) === norm(submoduleName));
  return sub ? sub.permissions.map(p => p.permissionName) : [];
}

// Convenience shortcuts for listing pages (Add/Edit/Delete/View buttons)
export const can = {
  view: (moduleName: string, submoduleName: string) => hasPermission(moduleName, submoduleName, 'view'),
  add: (moduleName: string, submoduleName: string) => hasPermission(moduleName, submoduleName, 'add'),
  edit: (moduleName: string, submoduleName: string) => hasPermission(moduleName, submoduleName, 'edit'),
  delete: (moduleName: string, submoduleName: string) => hasPermission(moduleName, submoduleName, 'delete'),
  update: (moduleName: string, submoduleName: string) => hasPermission(moduleName, submoduleName, 'update'),
};



/**
 * True if the submodule name exists ANYWHERE in the user's permission tree,
 * regardless of which module it belongs to. Use this when you just want to
 * gate a sidebar item by its name (e.g. "Work Order") without also having
 * to get the parent module name exactly right.
 */
export function hasSubmoduleByName(submoduleName: string): boolean {
    const target = norm(submoduleName);
    return getModules().some(m =>
      m.submodules.some(s => norm(s.submoduleName) === target)
    );
  }
  
  /**
   * Same as hasSubmoduleByName, but also checks a specific action permission
   * (view/add/edit/delete/update) on whichever module contains that submodule.
   */
  export function hasPermissionByName(submoduleName: string, permissionName?: string): boolean {
    const target = norm(submoduleName);
    for (const m of getModules()) {
      const sub = m.submodules.find(s => norm(s.submoduleName) === target);
      if (sub) {
        if (!permissionName) return true;
        return sub.permissions.some(p => norm(p.permissionName) === norm(permissionName));
      }
    }
    return false;
  }