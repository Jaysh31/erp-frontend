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

// ============ CHATBOT TYPES ============
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ModuleContextType {
  // ----- Module state -----
  currentModule: ModuleType;
  setCurrentModule: (module: ModuleType) => void;
  clearModule: () => void;

  // ----- Chatbot state -----
  isChatbotOpen: boolean;
  openChatbot: () => void;
  closeChatbot: () => void;
  toggleChatbot: () => void;

  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  clearChatMessages: () => void;

  isChatbotLoading: boolean;
  setIsChatbotLoading: (loading: boolean) => void;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

export function ModuleProvider({ children }: { children: ReactNode }) {
  // ============ MODULE STATE ============
  const [currentModule, setCurrentModule] = useState<ModuleType>(() => {
    const saved = localStorage.getItem('currentModule');
    return (saved as ModuleType) || 'home';
  });

  // ============ CHATBOT STATE ============
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('chatMessages');
      return saved ? (JSON.parse(saved) as ChatMessage[]) : [];
    } catch {
      return [];
    }
  });

  const [isChatbotLoading, setIsChatbotLoading] = useState<boolean>(false);

  // Save module to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('currentModule', currentModule);
  }, [currentModule]);

  // Persist chat messages
  useEffect(() => {
    try {
      localStorage.setItem('chatMessages', JSON.stringify(chatMessages));
    } catch {
      // ignore storage errors (quota, private mode)
    }
  }, [chatMessages]);

  // ============ MODULE ACTIONS ============
  const clearModule = () => {
    setCurrentModule('home');
    localStorage.removeItem('currentModule');
  };

  // ============ CHATBOT ACTIONS ============
  const openChatbot = () => setIsChatbotOpen(true);
  const closeChatbot = () => setIsChatbotOpen(false);
  const toggleChatbot = () => setIsChatbotOpen((prev) => !prev);

  const addChatMessage = (message: ChatMessage) => {
    setChatMessages((prev) => [...prev, message]);
  };

  const clearChatMessages = () => {
    setChatMessages([]);
    localStorage.removeItem('chatMessages');
  };

  return (
    <ModuleContext.Provider
      value={{
        // Module
        currentModule,
        setCurrentModule,
        clearModule,

        // Chatbot
        isChatbotOpen,
        openChatbot,
        closeChatbot,
        toggleChatbot,

        chatMessages,
        addChatMessage,
        setChatMessages,
        clearChatMessages,

        isChatbotLoading,
        setIsChatbotLoading,
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