// pages/Settings.tsx
import React from 'react';
import { useAdminTheme, type AdminThemeType } from '../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';
import './Settings.css';

const Settings: React.FC = () => {
  const { theme, setTheme } = useAdminTheme();

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

  const handleThemeSelect = (themeId: AdminThemeType) => {
    setTheme(themeId);
    const themeName = themeId === 'blue-theme' ? 'Blue' : themeId === 'green-theme' ? 'Green' : 'Dark';
    toast.success(`${themeName} theme activated successfully!`);
  };

  return (
    <div className="settings-container">
      <div className="settings-page-header">
        <h1 className="settings-page-title">⚙️ Settings</h1>
        <p className="settings-page-description">Customize your application appearance and preferences</p>
      </div>

      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-header-content">
            <h2>Theme Settings</h2>
            <p className="settings-theme-description">
              Choose a color scheme that matches your brand and preferences.
              Your selection will be saved automatically.
            </p>
          </div>
          <div className="settings-current-theme-badge">
            <span className="settings-badge-label">Current Theme:</span>
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
                      <span className="settings-active-badge">
                        ✓ Active
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
    </div>
  );
};

export default Settings;