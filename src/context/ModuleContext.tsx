import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';

export type ModuleType =
  | 'home'
  | 'manufacturing'
  | 'setup'
  | 'sales'
  | 'purchasing'
  | 'organization'
  | 'tools'
  | 'reports'
  | 'system';

interface ModuleContextType {
  currentModule: ModuleType;
  setCurrentModule: (module: ModuleType) => void;
  clearModule: () => void;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

export function ModuleProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage if available
  const [currentModule, setCurrentModule] = useState<ModuleType>(() => {
    const saved = localStorage.getItem('currentModule');
    return (saved as ModuleType) || 'home';
  });

  // Save to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('currentModule', currentModule);
  }, [currentModule]);

  const clearModule = () => {
    setCurrentModule('home');
    localStorage.removeItem('currentModule');
  };

  return (
    <ModuleContext.Provider
      value={{
        currentModule,
        setCurrentModule,
        clearModule,
      }}
    >
      {children}
    </ModuleContext.Provider>
  );
}

export function useModule() {
  const context = useContext(ModuleContext);

  if (!context) {
    throw new Error('useModule must be used within a ModuleProvider');
  }

  return context;
}