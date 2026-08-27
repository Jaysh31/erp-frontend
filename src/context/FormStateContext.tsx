import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

// ===== TYPES =====

interface FormState {
  moduleType: string;
  formData: any;
  timestamp: number;
  id?: string | number;
}

interface FormStateContextType {
  saveFormState: (moduleType: string, formData: any, id?: string | number) => void;
  getFormState: (moduleType: string, id?: string | number) => FormState | null;
  restoreFormState: (moduleType: string, id?: string | number) => any | null;
  clearFormState: (moduleType: string, id?: string | number) => void;
  hasSavedState: (moduleType: string, id?: string | number) => boolean;
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
  maxStorageItems = 10,
}) => {
  const [formStates, setFormStates] = useState<Map<string, FormState>>(new Map());

  // Load from sessionStorage on mount.
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

  // Save to sessionStorage whenever state changes.
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

  const makeKey = (moduleType: string, id?: string | number) =>
    `${moduleType}${id !== undefined && id !== null && String(id) !== '' ? `_${id}` : ''}`;

  const saveFormState = (
    moduleType: string,
    formData: any,
    id?: string | number
  ) => {
    const key = makeKey(moduleType, id);

    setFormStates((prev) => {
      const newMap = new Map(prev);

      // Updating an existing key should not consume another storage slot.
      const isExistingKey = newMap.has(key);

      if (!isExistingKey && newMap.size >= maxStorageItems) {
        const oldestEntry = Array.from(newMap.entries()).sort(
          ([, a], [, b]) => a.timestamp - b.timestamp
        )[0];

        if (oldestEntry) {
          newMap.delete(oldestEntry[0]);
        }
      }

      newMap.set(key, {
        moduleType,
        formData,
        timestamp: Date.now(),
        id,
      });

      return newMap;
    });
  };

  const getFormState = (
    moduleType: string,
    id?: string | number
  ): FormState | null => {
    // When an id is supplied, always retrieve that exact record.
    if (id !== undefined && id !== null && String(id) !== '') {
      const exactState = formStates.get(makeKey(moduleType, id));
      return exactState || null;
    }

    // Otherwise retrieve the most recent state for this module.
    let latest: FormState | null = null;
    let latestTimestamp = 0;

    formStates.forEach((state) => {
      if (
        state.moduleType === moduleType &&
        state.timestamp > latestTimestamp
      ) {
        latest = state;
        latestTimestamp = state.timestamp;
      }
    });

    return latest;
  };

  const restoreFormState = (
    moduleType: string,
    id?: string | number
  ): any | null => {
    const state = getFormState(moduleType, id);

    if (!state) {
      return null;
    }

    // Only clear the exact state that was restored.
    clearFormState(moduleType, id ?? state.id);

    return state.formData;
  };

  const clearFormState = (
    moduleType: string,
    id?: string | number
  ) => {
    setFormStates((prev) => {
      const newMap = new Map(prev);

      if (id !== undefined && id !== null && String(id) !== '') {
        newMap.delete(makeKey(moduleType, id));
        return newMap;
      }

      // No id means clear all saved states for this module.
      newMap.forEach((state, key) => {
        if (state.moduleType === moduleType) {
          newMap.delete(key);
        }
      });

      return newMap;
    });
  };

  const hasSavedState = (
    moduleType: string,
    id?: string | number
  ): boolean => {
    return getFormState(moduleType, id) !== null;
  };

  const getModulePath = (
    moduleType: string,
    id?: string | number
  ): string => {
    const paths: Record<string, string> = {
      delivery_challan: '/delivery-challan',
      sales_invoice: '/sales-bill',
      purchase_order: '/purchase-order',
      purchase_invoice: '/purchase-invoice',
      sales_order: '/sales-order',
      quotation: '/quotation',
      grn: '/grn',
      material_request: '/material-request',
      supplier_quotation: '/supplier-quotation',
      job_card: '/job-cards',
      work_order: '/work-order',
      stock_entry: '/stock-entry',
    };

    const basePath = paths[moduleType] || `/${moduleType}`;

    if (id !== undefined && id !== null && String(id) !== '') {
      return `${basePath}/edit/${id}`;
    }

    return basePath;
  };

  return (
    <FormStateContext.Provider
      value={{
        saveFormState,
        getFormState,
        restoreFormState,
        clearFormState,
        hasSavedState,
        getModulePath,
      }}
    >
      {children}
    </FormStateContext.Provider>
  );
};
