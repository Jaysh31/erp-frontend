// pages/Settings.tsx
import React from 'react';
import { useAdminTheme, type AdminThemeType, type DateFormatType } from '../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';
import './Settings.css';

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const formatDate = (date: Date, format: DateFormatType): string => {
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  return format === 'numeric'
    ? `${day}/${month + 1}/${year}`
    : `${day}/${MONTH_NAMES_SHORT[month]}/${year}`;
};

const Settings: React.FC = () => {
  const { theme, setTheme, dateFormat, setDateFormat } = useAdminTheme();

  const themeOptions = [
    {
      id: 'blue-theme',
      name: 'Blue Theme',
      description: 'Default enterprise dashboard with professional blue tones',
      previewBg: '#f5f7fb',
      sidebarBg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      navbarBg: '#ffffff',
      cardGradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    },
    {
      id: 'green-theme',
      name: 'Green Theme',
      description: 'Premium reservation UI with fresh green accents',
      previewBg: '#f6fbf7',
      sidebarBg: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
      navbarBg: '#ffffff',
      cardGradient: 'linear-gradient(135deg, #43a047 0%, #2e7d32 100%)',
    },
    // {
    //   id: 'dark-theme',
    //   name: 'Dark Theme',
    //   description: 'Modern dark enterprise panel for reduced eye strain',
    //   previewBg: '#0f172a',
    //   sidebarBg: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
    //   navbarBg: '#1e293b',
    //   cardGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    // },
  ];

  // Date format catalogue — each option is identified by a clear pattern name
  // (e.g. "DD/MM/YYYY") instead of a raw date example, so the client can tell
  // at a glance which layout they are choosing.
  const dateFormatOptions: {
    id: DateFormatType;
    name: string;
    tagline: string;
    badge: string;
    pattern: string;
    description: string;
    bestFor: string;
  }[] = [
    {
      id: 'numeric',
      name: 'Numeric',
      tagline: 'Digits only',
      badge: 'Date in Digit Form',
      pattern: 'DD/MM/YYYY',
      description: 'Day, month and year shown entirely as numbers.',
      bestFor: 'Best for data-dense screens like ledgers and reports',
    },
    {
      id: 'monthName',
      name: 'Month Name',
      tagline: 'Written month',
      badge: 'Month in Written Form',
      pattern: 'DD/MMM/YYYY',
      description: 'The month is spelled out to avoid DD/MM vs MM/DD confusion.',
      bestFor: 'Best for invoices, quotations and client-facing documents',
    },
  ];

  const handleThemeSelect = (themeId: AdminThemeType) => {
    setTheme(themeId);
    const themeName = themeId === 'blue-theme' ? 'Blue' : themeId === 'green-theme' ? 'Green' : 'Dark';
    toast.success(`${themeName} theme activated successfully!`);
  };

  const handleDateFormatSelect = (format: DateFormatType) => {
    setDateFormat(format);
    const option = dateFormatOptions.find((f) => f.id === format);
    toast.success(`Date format changed to: ${option?.name} (${option?.pattern})`);
  };

  const previewRows = [
    { label: 'Today', date: new Date() },
    { label: 'Invoice Date', date: new Date(2026, 2, 15) },
    { label: 'Delivery Date', date: new Date(2026, 11, 22) },
  ];

  return (
    <div className="settings-container">
      <div className="settings-page-header">
        <span className="settings-page-eyebrow">Preferences</span>
        <h1 className="settings-page-title">Settings</h1>
        <p className="settings-page-description">Customize your application appearance and preferences</p>
      </div>

      {/* Theme Settings Card */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-header-content">
            <span className="settings-card-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="13.5" cy="6.5" r=".5" />
                <circle cx="17.5" cy="10.5" r=".5" />
                <circle cx="8.5" cy="7.5" r=".5" />
                <circle cx="6.5" cy="12.5" r=".5" />
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
              </svg>
            </span>
            <div>
              <h2>Theme Settings</h2>
              <p className="settings-theme-description">
                Pick the color palette used across the dashboard and sidebar.
              </p>
            </div>
          </div>
          <div className="settings-current-theme-badge">
            <span className="settings-badge-label">Current Theme</span>
            <span className="settings-badge-value">
              {theme === 'blue-theme' && 'Blue'}
              {theme === 'green-theme' && 'Green'}
              {theme === 'dark-theme' && 'Dark'}
            </span>
          </div>
        </div>

        <div className="settings-card-body">
          <div className="settings-theme-grid">
            {themeOptions.map((themeOption) => (
              <div
                key={themeOption.id}
                className={`settings-theme-option ${theme === themeOption.id ? 'settings-active-theme' : ''}`}
                onClick={() => handleThemeSelect(themeOption.id as AdminThemeType)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleThemeSelect(themeOption.id as AdminThemeType);
                }}
              >
                <div className="settings-theme-preview" style={{ background: themeOption.previewBg }}>
                  <div className="settings-preview-sidebar" style={{ background: themeOption.sidebarBg }}>
                    <div className="settings-preview-logo"></div>
                    <div className="settings-preview-menu-item"></div>
                    <div className="settings-preview-menu-item"></div>
                    <div className="settings-preview-menu-item"></div>
                  </div>
                  <div className="settings-preview-content">
                    <div className="settings-preview-navbar" style={{ background: themeOption.navbarBg }}>
                      <div className="settings-preview-nav-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                    <div className="settings-preview-cards">
                      <div style={{ background: themeOption.cardGradient }}></div>
                      <div style={{ background: themeOption.cardGradient }}></div>
                      <div style={{ background: themeOption.cardGradient }}></div>
                    </div>
                  </div>
                </div>
                <div className="settings-theme-info">
                  <div className="settings-theme-info-header">
                    <h4>{themeOption.name}</h4>
                    {theme === themeOption.id && (
                      <span className="settings-active-badge">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Active
                      </span>
                    )}
                  </div>
                  <p>{themeOption.description}</p>
                  {theme === themeOption.id && (
                    <div className="settings-active-indicator">
                      <div className="settings-pulse-dot"></div>
                      <span>Currently Active</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Date Format Settings Card */}
      <div className="settings-card date-format-card">
        <div className="settings-card-header">
          <div className="settings-card-header-content">
            <span className="settings-card-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </span>
            <div>
              <h2>Date Format Settings</h2>
              <p className="settings-theme-description">
                Choose how dates are displayed across the entire application.
                Your selection is saved automatically.
              </p>
            </div>
          </div>
          <div className="settings-current-theme-badge">
            <span className="settings-badge-label">Current Format</span>
            <span className="settings-badge-value">
              {dateFormatOptions.find((f) => f.id === dateFormat)?.pattern}
            </span>
          </div>
        </div>

        <div className="settings-card-body">
          <div className="settings-date-format-grid">
            {dateFormatOptions.map((format) => (
              <div
                key={format.id}
                className={`settings-date-format-option ${dateFormat === format.id ? 'settings-active-format' : ''}`}
                onClick={() => handleDateFormatSelect(format.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleDateFormatSelect(format.id);
                }}
              >
                {dateFormat === format.id && (
                  <span className="settings-format-selected-check" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
                <div className="settings-format-preview">
                  <div className="settings-format-icon">{format.badge}</div>
                  <div className="settings-format-pattern-name">{format.pattern}</div>
                </div>
                <div className="settings-format-info">
                  <div className="settings-format-info-header">
                    <h4>
                      {format.name}
                      <span className="settings-format-tagline">{format.tagline}</span>
                    </h4>
                    {dateFormat === format.id && (
                      <span className="settings-active-badge">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Active
                      </span>
                    )}
                  </div>
                  <p>{format.description}</p>
                  <p className="settings-format-best-for">{format.bestFor}</p>
                </div>
              </div>
            ))}
          </div>

         
            </div>
          </div>
        </div>
      
    
  );
};

export default Settings;