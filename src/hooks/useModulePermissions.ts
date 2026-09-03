// src/hooks/useModulePermissions.ts

import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';

export interface SubModulePermission {
  submoduleId: number;
  submoduleName: string;
}

export interface ModulePermission {
  moduleId: number;
  moduleName: string;
  submodules: SubModulePermission[];
}

export const MODULE_MAP: Record<string, number> = {
  'manufacturing': 18,
  'sales': 19,
  'purchasing': 20,
  'setup': 21,
  'organization': 22,
  'tools': 23,
  'reports': 24,
  'system': 25,
  'accounting': 26,
};

// Map submodule names to their IDs (from the login response)
export const SUBMODULE_MAP: Record<string, number> = {
  'BOM': 1,
  'Work Order': 2,
  'Job Card': 3,
  'Stock Entry': 4,
  'Quotation': 5,
  'Sales Order': 6,
  'Sales Invoice': 7,
  'Lead': 8,
  'Item': 9,
  'Item Group': 10,
  'Price List': 11,
  'Brand': 12,
  'Warehouse': 13,
  'Supplier': 14,
  'Purchase Order': 15,
  'Material Request': 16,
  'Supplier Quotation': 17,
  'Purchase Invoice': 18,
  'Company': 19,
  'Letter Head': 20,
  'User Management': 21,
  'Chart of Accounts': 22,
  'Ledger Accounts': 23,
  'Cost Centers': 24,
  'Customer Invoices': 25,
  'Customer Payments': 26,
  'Delivery Challans': 27,
  'Credit Notes': 28,
  'Outstanding Receivables': 29,
  'Supplier Bills': 30,
  'Supplier Payments': 31,
  'Outstanding Payables': 32,
  'Bank Accounts': 33,
  'Bank Transactions': 34,
  'Bank Reconciliation': 35,
  'Expense': 36,
  'Settings': 37,
  'Tools': 38,
  'Workstation': 39,
  'Operations': 40,
  'Unit of Measure (UOM)': 41,
  'Item Attribute': 42,
  'Pricing Rule': 43,
  'Coupon Code': 44,
  'Supplier Group': 45,
  'Contacts': 46,
  'Supplier Scorecard': 47,
  'Supplier Scorecard Criteria': 48,
  'Address': 49,
  'Request for Quotation': 50,
  'Goods Receipt Note': 51,
  'Dashboard': 52,
};

export function useModulePermissions() {
  const [isLoading, setIsLoading] = useState(true);
  const [modules, setModules] = useState(storage.getModules() || []);
  const [user, setUser] = useState(storage.getUser());

  // Reload modules when auth state changes
  useEffect(() => {
    const loadPermissions = () => {
      setIsLoading(true);
      try {
        const authData = storage.getAuthData();
        if (authData) {
          setModules(authData.modules || []);
          setUser(authData.user || null);
        } else {
          setModules([]);
          setUser(null);
        }
      } catch (error) {
        console.error('Error loading permissions:', error);
        setModules([]);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadPermissions();

    // Listen for storage changes (in case of login/logout in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_data') {
        loadPermissions();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Check if a module is accessible
  const hasModule = (moduleName: string): boolean => {
    // If no modules, check if user exists (for testing)
    if (!modules || modules.length === 0) {
      return !!user; // Return true if user exists
    }
    
    if (moduleName === 'home') return true;
    
    const moduleId = MODULE_MAP[moduleName.toLowerCase()];
    if (!moduleId) return false;

    return modules.some(module => module.moduleId === moduleId);
  };

  // Check if a submodule is accessible
  const hasSubModule = (moduleName: string, submoduleName: string): boolean => {
    if (!modules || modules.length === 0) return !!user;

    const moduleId = MODULE_MAP[moduleName.toLowerCase()];
    if (!moduleId) return false;

    const module = modules.find(m => m.moduleId === moduleId);
    if (!module) return false;

    return module.submodules.some(
      sub => sub.submoduleName.toLowerCase() === submoduleName.toLowerCase()
    );
  };

  // Get submodules for a module
  const getSubModules = (moduleName: string): SubModulePermission[] => {
    if (!modules || modules.length === 0) return [];

    const moduleId = MODULE_MAP[moduleName.toLowerCase()];
    if (!moduleId) return [];

    const module = modules.find(m => m.moduleId === moduleId);
    return module?.submodules || [];
  };

  // Get all accessible modules
  const getAccessibleModules = (): ModulePermission[] => {
    return modules || [];
  };

  // Check if a path is accessible
  const isPathAccessible = (path: string): boolean => {
    // Normalize path
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    // Always allow home
    if (normalizedPath === '/home' || normalizedPath === '/') {
      return true;
    }

    // Always allow dashboard paths for modules the user has access to
    if (normalizedPath.startsWith('/dashboard/')) {
      const moduleName = normalizedPath.replace('/dashboard/', '');
      // Check if module exists in our map and user has access
      const moduleId = MODULE_MAP[moduleName.toLowerCase()];
      if (!moduleId) return false;
      return hasModule(moduleName);
    }

    // Extract module from path
    const pathParts = normalizedPath.split('/').filter(Boolean);
    if (pathParts.length === 0) return true;

    // Check if it's a settings or system path
    if (pathParts[0] === 'settings' || pathParts[0] === 'system') {
      return true;
    }

    // For paths like /sales-order, /bom, etc., determine which module they belong to
    const pathToModuleMap: Record<string, string> = {
      'sales-order': 'sales',
      'sales-invoice': 'sales',
      'quotation': 'sales',
      'lead': 'sales',
      'leads': 'sales',
      'price-list': 'sales',
      'item-price': 'sales',
      'pricing-rule': 'sales',
      'coupon-codes': 'sales',
      'supplier': 'purchasing',
      'supplier-group': 'purchasing',
      'contacts': 'purchasing',
      'material-request': 'purchasing',
      'purchase-order': 'purchasing',
      'request-for-quotation': 'purchasing',
      'supplier-quotation': 'purchasing',
      'purchase-invoice': 'purchasing',
      'grn': 'purchasing',
      'item-group': 'setup',
      'item-list': 'setup',
      'item': 'setup',
      'item-attribute': 'setup',
      'brand': 'setup',
      'warehouse': 'setup',
      'uom': 'setup',
      'workstation': 'setup',
      'operations': 'setup',
      'operation': 'setup',
      'bom': 'manufacturing',
      'work-order': 'manufacturing',
      'job-card': 'manufacturing',
      'stock-entry': 'manufacturing',
      'company': 'organization',
      'letter-head': 'organization',
      'user-management': 'organization',
      'accounts': 'accounting',
      'chart-of-accounts': 'accounting',
      'ledger-accounts': 'accounting',
      'customer-invoices': 'accounting',
      'sales-receipts': 'accounting',
      'outstanding-receivables': 'accounting',
      'customer-payments': 'accounting',
      'expenses': 'accounting',
      'banking': 'accounting',
    };

    const moduleName = pathToModuleMap[pathParts[0]];
    if (!moduleName) {
      // If we don't have a mapping, check if the path itself is a module name
      const moduleId = MODULE_MAP[pathParts[0].toLowerCase()];
      if (moduleId) {
        return hasModule(pathParts[0]);
      }
      // Allow unknown paths (they might be valid routes)
      return true;
    }

    return hasModule(moduleName);
  };

  // Filter sidebar items based on permissions
  const filterSidebarItems = (categories: any[]): any[] => {
    return categories
      .filter(category => {
        if (category.module === 'home' || category.module === 'system') {
          return true;
        }
        return hasModule(category.module);
      })
      .map(category => {
        if (!category.module) {
          return category;
        }

        const accessibleItems = category.items.filter((item: { title: string; }) => {
          const submoduleId = SUBMODULE_MAP[item.title];
          if (submoduleId) {
            return hasSubModule(category.module, item.title);
          }
          return true;
        });

        return {
          ...category,
          items: accessibleItems
        };
      });
  };

  return {
    modules,
    user,
    isLoading,
    hasModule,
    hasSubModule,
    getSubModules,
    getAccessibleModules,
    isPathAccessible,
    filterSidebarItems,
  };
}