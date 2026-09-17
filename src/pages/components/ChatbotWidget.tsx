// src/pages/components/ChatbotWidget.tsx
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { useModule, type ChatMessage } from '../../context/ModuleContext';
import { useModulePermissions } from '../../hooks/useModulePermissions';
import { chatbotService } from '../../services/chatbotService';
import './ChatbotWidget.css';

const PAGE_LABEL_MAP: Record<string, string> = {
  '/home': 'Home',
  '/dashboard': 'Dashboard',
};

// Safe UUID that works in all contexts (HTTP, IP, file://)
const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

function getPageLabel(path: string): string {
  if (PAGE_LABEL_MAP[path]) return PAGE_LABEL_MAP[path];
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return 'Home';
  return parts
    .map((p) => p.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(' → ');
}

export default function ChatbotWidget() {
  const location = useLocation();
  const {
    isChatbotOpen,
    openChatbot,
    closeChatbot,
    chatMessages,
    addChatMessage,
    clearChatMessages,
    isChatbotLoading,
    setIsChatbotLoading,
    currentModule,
  } = useModule();

  // Only destructure what we actually use
  const { getChatbotContext } = useModulePermissions();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatbotLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isChatbotOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isChatbotOpen]);

  // Welcome message on first open
  useEffect(() => {
    if (isChatbotOpen && chatMessages.length === 0) {
      addChatMessage({
        id: uid(),
        role: 'assistant',
        content:
          "Hi! 👋 I'm your ERP Assistant. I can fetch **live data** from your ERP.\n\nTry asking:\n• \"How many sales orders?\"\n• \"How many items?\"\n• \"Show me leads\"\n• \"Purchase order count?\"\n• \"How many BOMs?\"\n• \"GRN count?\"",
        timestamp: Date.now(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChatbotOpen]);

  const handleSend = async (e?: FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isChatbotLoading) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: uid(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    addChatMessage(userMsg);
    setInput('');
    setIsChatbotLoading(true);

    try {
      const context = getChatbotContext();
      const history = chatMessages
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await chatbotService.ask({
        message: text,
        userContext: context,
        currentModule,
        currentPage: getPageLabel(location.pathname),
        history,
      });

      addChatMessage({
        id: uid(),
        role: 'assistant',
        content: response.reply,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('Chatbot error:', err);
      addChatMessage({
        id: uid(),
        role: 'assistant',
        content: 'Something went wrong. Please try again.',
        timestamp: Date.now(),
      });
    } finally {
      setIsChatbotLoading(false);
    }
  };

  const handleSuggestionClick = (s: string) => {
    setInput(s);
    setTimeout(() => handleSend(), 0);
  };

  // ============================================================
  // FLOATING LAUNCHER — shows when chat is closed
  // Works on /home, /dashboard/*, and every other page
  // ============================================================
  if (!isChatbotOpen) {
    return (
      <button
        className="chatbot-launcher"
        onClick={openChatbot}
        aria-label="Open ERP Assistant"
        title="Ask the ERP Assistant"
        type="button"
      >
        {/* Chat bubble icon */}
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <circle cx="9" cy="10" r="1" fill="currentColor" />
          <circle cx="12" cy="10" r="1" fill="currentColor" />
          <circle cx="15" cy="10" r="1" fill="currentColor" />
        </svg>
      </button>
    );
  }

  const suggestions = chatbotService.getSuggestions(currentModule);

  // ============================================================
  // FULL CHAT PANEL — shows when chat is open
  // ============================================================
  return (
    <div className="chatbot-widget" role="dialog" aria-label="ERP Assistant">
      {/* HEADER */}
      <div className="chatbot-header">
        <div className="chatbot-header-left">
          <div className="chatbot-avatar">🤖</div>
          <div>
            <div className="chatbot-title">ERP Assistant</div>
            <div className="chatbot-subtitle">
              <span className="chatbot-status-dot" /> Online
            </div>
          </div>
        </div>
        <div className="chatbot-header-actions">
          <button
            className="chatbot-icon-btn"
            onClick={clearChatMessages}
            title="Clear chat"
            aria-label="Clear chat"
          >
            🗑
          </button>
          <button
            className="chatbot-icon-btn"
            onClick={closeChatbot}
            title="Close"
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="chatbot-messages">
        {chatMessages.map((m) => (
          <div
            key={m.id}
            className={`chatbot-bubble ${m.role === 'user' ? 'user' : 'bot'}`}
          >
            {m.role === 'assistant' && (
              <div className="chatbot-bubble-avatar">🤖</div>
            )}
            <div className="chatbot-bubble-content">
              {m.content.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        ))}

        {isChatbotLoading && (
          <div className="chatbot-bubble bot">
            <div className="chatbot-bubble-avatar">🤖</div>
            <div className="chatbot-bubble-content typing">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* SUGGESTIONS */}
      {chatMessages.length <= 1 && (
        <div className="chatbot-suggestions">
          {suggestions.map((s) => (
            <button
              key={s}
              className="chatbot-suggestion-chip"
              onClick={() => handleSuggestionClick(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* INPUT */}
      <form className="chatbot-input-area" onSubmit={handleSend}>
        <input
          ref={inputRef}
          type="text"
          className="chatbot-input"
          placeholder="Ask me anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isChatbotLoading}
        />
        <button
          type="submit"
          className="chatbot-send-btn"
          disabled={!input.trim() || isChatbotLoading}
          aria-label="Send"
        >
          ➤
        </button>
      </form>
    </div>
  );
}