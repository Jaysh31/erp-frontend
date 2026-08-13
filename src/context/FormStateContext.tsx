import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// ===== TYPES =====

interface FormState {
  moduleType: string;
  formData: any;
  timestamp: number;
  id?: string | number;
}

interface FormStateContextType {
  saveFormState: (moduleType: string, formData: any, id?: string | number) => void;
  getFormState: (moduleType: string) => FormState | null;
  restoreFormState: (moduleType: string) => any | null;
  clearFormState: (moduleType: string) => void;
  hasSavedState: (moduleType: string) => boolean;
  getModulePath: (moduleType: string, id?: string | number) => string;
}

const FormStateContext = createContext<FormStateContextType | undefined>(undefined);

export const useFormState = (): FormStateContextType => {
  const context = useContext(FormStateContext);
  if (!context) {
    throw new Error('useFormState must be used within a FormStateProvider');
  }
  return context;
};

// ===== PROVIDER =====

interface FormStateProviderProps {
  children: ReactNode;
  maxStorageItems?: number;
}

export const FormStateProvider: React.FC<FormStateProviderProps> = ({ 
  children, 
  maxStorageItems = 10 
}) => {
  const [formStates, setFormStates] = useState<Map<string, FormState>>(new Map());

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('formStates');
      if (saved) {
        const parsed = JSON.parse(saved);
        const map = new Map<string, FormState>();
        Object.entries(parsed).forEach(([key, value]) => {
          map.set(key, value as FormState);
        });
        setFormStates(map);
      }
    } catch (error) {
      console.error('Error loading form states from sessionStorage:', error);
    }
  }, []);

  // Save to sessionStorage whenever state changes
  useEffect(() => {
    try {
      const obj: Record<string, FormState> = {};
      formStates.forEach((value, key) => {
        obj[key] = value;
      });
      sessionStorage.setItem('formStates', JSON.stringify(obj));
    } catch (error) {
      console.error('Error saving form states to sessionStorage:', error);
    }
  }, [formStates]);

  const saveFormState = (moduleType: string, formData: any, id?: string | number) => {
    const key = `${moduleType}${id ? `_${id}` : ''}`;
    
    setFormStates(prev => {
      const newMap = new Map(prev);
      
      // Remove oldest if exceeds max
      if (newMap.size >= maxStorageItems) {
        const oldestKey = Array.from(newMap.keys())[0];
        newMap.delete(oldestKey);
      }
      
      newMap.set(key, {
        moduleType,
        formData,
        timestamp: Date.now(),
        id
      });
      
      return newMap;
    });
  };

  const getFormState = (moduleType: string): FormState | null => {
    // Find the most recent state for this module type
    let latest: FormState | null = null;
    let latestTimestamp = 0;
    
    formStates.forEach((state) => {
      if (state.moduleType === moduleType && state.timestamp > latestTimestamp) {
        latest = state;
        latestTimestamp = state.timestamp;
      }
    });
    
    return latest;
  };

  const restoreFormState = (moduleType: string): any | null => {
    const state = getFormState(moduleType);
    if (state) {
      // Clear after restore to prevent stale data
      clearFormState(moduleType);
      return state.formData;
    }
    return null;
  };

  const clearFormState = (moduleType: string) => {
    setFormStates(prev => {
      const newMap = new Map(prev);
      const keysToDelete: string[] = [];
      newMap.forEach((state, key) => {
        if (state.moduleType === moduleType) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => newMap.delete(key));
      return newMap;
    });
  };

  const hasSavedState = (moduleType: string): boolean => {
    return getFormState(moduleType) !== null;
  };

  const getModulePath = (moduleType: string, id?: string | number): string => {
    const paths: Record<string, string> = {
      'delivery_challan': '/delivery-challan',
      'sales_invoice': '/sales-bill',
      'purchase_order': '/purchase-order',
      'purchase_invoice': '/purchase-invoice',
      'sales_order': '/sales-order',
      'quotation': '/quotation',
      'grn': '/grn',
      'material_request': '/material-request',
      'supplier_quotation': '/supplier-quotation',
      'job_card': '/job-cards',
      'work_order': '/work-order',
      'stock_entry': '/stock-entry',
    };
    
    const basePath = paths[moduleType] || `/${moduleType}`;
    if (id) {
      return `${basePath}/edit/${id}`;
    }
    return basePath;
  };

  return (
    <FormStateContext.Provider value={{
      saveFormState,
      getFormState,
      restoreFormState,
      clearFormState,
      hasSavedState,
      getModulePath
    }}>
      {children}
    </FormStateContext.Provider>
  );
};