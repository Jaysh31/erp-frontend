// pages/Settings.tsx
import React from 'react';
import { useAdminTheme, type AdminThemeType, type DateFormatType } from '../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';
import './Settings.css';


// ✅ FIXED: Changed 'dd/mmmyyyy' to 'ddmmmyyyy'


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
  ];

  // Date format options - simple cards like theme
  const dateFormats: {
    id: DateFormatType;
    pattern: string;
    example: string;
    badge: string;
    description: string;
  }[] = [
    {
      id: 'ddmmyyyy',
      pattern: 'DD/MM/YYYY',
      example: 'Ex.15/03/2026',
      badge: 'Digits only',
      description: 'Day, month and year shown entirely as numbers.',
    },
    {
      id: 'ddmmmyyyy',
      pattern: 'DD/MMM/YYYY',
      example: 'Ex.15/Mar/2026',
      badge: 'Written month',
      description: 'The month is spelled out to avoid DD/MM vs MM/DD confusion.',
    },
    {
      id: 'mmddyyyy',
      pattern: 'MM/DD/YYYY',
      example: 'Ex.03/15/2026',
      badge: 'US format',
      description: 'Month, day and year with leading zeros.',
    },
    {
      id: 'yyyymmdd',
      pattern: 'YYYY-MM-DD',
      example: 'Ex.2026-03-15',
      badge: 'ISO standard',
      description: 'Year, month and day in international standard format.',
    },
  ];

  const handleThemeSelect = (themeId: AdminThemeType) => {
    setTheme(themeId);
    const themeName = themeId === 'blue-theme' ? 'Blue' : themeId === 'green-theme' ? 'Green' : 'Dark';
    toast.success(`${themeName} theme activated successfully!`);
  };

  const handleDateFormatSelect = (formatId: DateFormatType) => {
    setDateFormat(formatId);
    const format = dateFormats.find(f => f.id === formatId);
    toast.success(`Date format changed to: ${format?.pattern}`);
  };


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
                Choose a color scheme that matches your brand and preferences.
                Your selection will be saved automatically.
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
                      <span className="settings-active-badge">✓ Active</span>
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
              {dateFormats.find(f => f.id === dateFormat)?.pattern || 'DD/MM/YYYY'}
            </span>
          </div>
        </div>

        <div className="settings-card-body">
          {/* Date Format Cards */}
          <div className="settings-date-format-grid">
            {dateFormats.map((format) => (
              <div
                key={format.id}
                className={`settings-date-format-card ${dateFormat === format.id ? 'active' : ''}`}
                onClick={() => handleDateFormatSelect(format.id)}
              >
                <div className="settings-date-format-card-left">
                  <span className="settings-date-format-pattern">{format.pattern}</span>
                  <span className="settings-date-format-badge">{format.badge}</span>
                </div>
                <div className="settings-date-format-card-right">
                  <span className="settings-date-format-example">{format.example}</span>
                  {dateFormat === format.id && (
                    <span className="settings-date-format-check">✓</span>
                  )}
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