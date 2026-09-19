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

// ============ CHATBOT TYPES ============
export interface ChatbotModuleInfo {
  moduleId: number;
  moduleName: string;
  submodules: {
    submoduleId: number;
    submoduleName: string;
  }[];
}

export interface ChatbotContextData {
  user: {
    name: string;
    email: string;
    role: string;
  };
  modules: ChatbotModuleInfo[];
  totalModules: number;
  totalSubmodules: number;
  moduleNames: string[];
  submoduleNamesByModule: Record<string, string[]>;
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

// Reverse map: ID -> Name (useful for chatbot to translate IDs)
export const MODULE_ID_TO_NAME: Record<number, string> = Object.entries(MODULE_MAP)
  .reduce((acc, [name, id]) => ({ ...acc, [id]: name }), {});

export const SUBMODULE_ID_TO_NAME: Record<number, string> = Object.entries(SUBMODULE_MAP)
  .reduce((acc, [name, id]) => ({ ...acc, [id]: name }), {});

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

  // ================================================================
  // ============ CHATBOT HELPERS (NEWLY ADDED) =====================
  // ================================================================

  /**
   * Get a structured snapshot of what the CURRENT user can access.
   * This is what we send to the chatbot so it only answers with allowed data.
   */
  const getChatbotContext = (): ChatbotContextData => {
    const accessibleModules: ChatbotModuleInfo[] = (modules || []).map((m) => ({
      moduleId: m.moduleId,
      moduleName: m.moduleName,
      submodules: m.submodules.map((s) => ({
        submoduleId: s.submoduleId,
        submoduleName: s.submoduleName,
      })),
    }));

    const totalSubmodules = accessibleModules.reduce(
      (sum, m) => sum + m.submodules.length,
      0
    );

    const moduleNames = accessibleModules.map((m) => m.moduleName);

    const submoduleNamesByModule: Record<string, string[]> = {};
    accessibleModules.forEach((m) => {
      submoduleNamesByModule[m.moduleName] = m.submodules.map(
        (s) => s.submoduleName
      );
    });

    return {
      user: {
        name: (user as any)?.name || (user as any)?.fullName || 'User',
        email: (user as any)?.email || '',
        role: (user as any)?.role?.name || (user as any)?.role || '',
      },
      modules: accessibleModules,
      totalModules: accessibleModules.length,
      totalSubmodules,
      moduleNames,
      submoduleNamesByModule,
    };
  };

  /**
   * Answer a chatbot question using ONLY the current user's permissions.
   * Returns null if the question can't be handled locally (fall back to AI/API).
   */
  const answerFromPermissions = (question: string): string | null => {
    const q = question.toLowerCase().trim();

    // ---- Questions about modules count ----
    if (
      (q.includes('how many') && q.includes('module')) ||
      q.includes('total module') ||
      q.includes('list module') ||
      q.includes('show module') ||
      q.includes('all module') ||
      q === 'modules'
    ) {
      if (!modules || modules.length === 0) {
        return "You don't have access to any modules yet.";
      }
      const names = modules.map((m) => `• ${m.moduleName}`).join('\n');
      return `You have access to ${modules.length} module${modules.length > 1 ? 's' : ''}:\n${names}`;
    }

    // ---- Questions about submodules count ----
    if (
      (q.includes('how many') && q.includes('submodule')) ||
      q.includes('total submodule') ||
      q.includes('list submodule')
    ) {
      const total = modules.reduce((sum, m) => sum + m.submodules.length, 0);
      return `You have access to ${total} submodules across ${modules.length} modules.`;
    }

    // ---- Questions about a SPECIFIC module ----
    for (const module of modules) {
      const moduleNameLower = module.moduleName.toLowerCase();
      if (q.includes(moduleNameLower)) {
        // "how many submodules in sales" etc.
        if (q.includes('how many') || q.includes('count')) {
          return `The ${module.moduleName} module has ${module.submodules.length} submodule${module.submodules.length !== 1 ? 's' : ''}.`;
        }
        // "list/show submodules in sales"
        if (
          q.includes('submodule') ||
          q.includes('list') ||
          q.includes('show') ||
          q.includes('what')
        ) {
          if (module.submodules.length === 0) {
            return `The ${module.moduleName} module has no submodules assigned to you.`;
          }
          const subs = module.submodules
            .map((s) => `• ${s.submoduleName}`)
            .join('\n');
          return `Submodules in ${module.moduleName} (${module.submodules.length}):\n${subs}`;
        }
        // Generic "tell me about sales"
        return `The ${module.moduleName} module contains ${module.submodules.length} submodule${module.submodules.length !== 1 ? 's' : ''}: ${module.submodules.map(s => s.submoduleName).join(', ') || 'none'}.`;
      }
    }

    // ---- Questions about a SPECIFIC submodule ----
    for (const module of modules) {
      for (const sub of module.submodules) {
        if (q.includes(sub.submoduleName.toLowerCase())) {
          return `"${sub.submoduleName}" is a submodule of the ${module.moduleName} module.`;
        }
      }
    }

    // ---- Question about the current user ----
    if (q.includes('my role') || q.includes('who am i') || q.includes('my name')) {
      const name = (user as any)?.name || (user as any)?.fullName || 'User';
      const role = (user as any)?.role?.name || (user as any)?.role || 'N/A';
      return `You are ${name}${role ? `, role: ${role}` : ''}.`;
    }

    // ---- "What can you do?" / help ----
    if (q.includes('help') || q.includes('what can you do')) {
      return `I can answer questions about your accessible modules:
• "How many modules do I have?"
• "List my modules"
• "List submodules in Sales"
• "How many submodules in Manufacturing?"
• "What is my role?"`;
    }

    // No local answer available → let AI/API handle it
    return null;
  };

  /**
   * Check whether a module name is accessible (case-insensitive).
   * Useful for the chatbot to gate answers.
   */
  const canAccessModule = (moduleName: string): boolean => {
    return hasModule(moduleName);
  };

  /**
   * Check whether a submodule is accessible (case-insensitive).
   */
  const canAccessSubModule = (moduleName: string, submoduleName: string): boolean => {
    return hasSubModule(moduleName, submoduleName);
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

    // ============ CHATBOT EXPORTS ============
    getChatbotContext,
    answerFromPermissions,
    canAccessModule,
    canAccessSubModule,
  };
}