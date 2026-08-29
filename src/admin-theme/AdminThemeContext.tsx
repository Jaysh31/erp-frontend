// admin-theme/AdminThemeContext.tsx
import './themes.css';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type AdminThemeType =
  | "blue-theme"
  | "green-theme"
  | "dark-theme";

// ✅ ALL 4 date format types
export type DateFormatType = 
  | "ddmmyyyy"    // DD/MM/YYYY - 15/03/2026
  | "ddmmmyyyy"   // DD/MMM/YYYY - 15/Mar/2026
  | "mmddyyyy"    // MM/DD/YYYY - 03/15/2026
  | "yyyymmdd";   // YYYY-MM-DD - 2026-03-15

interface AdminThemeContextType {
  theme: AdminThemeType;
  setTheme: (theme: AdminThemeType) => void;
  dateFormat: DateFormatType;
  setDateFormat: (format: DateFormatType) => void;
  formatDate: (dateString: string) => string;
  getApiDateFormat: (date: Date) => string;
}

const AdminThemeContext =
  createContext<AdminThemeContextType | null>(null);

interface Props {
  children: ReactNode;
}

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const AdminThemeProvider = ({
  children,
}: Props) => {

  // --- THEME STATE ---
  const [theme, setThemeState] =
    useState<AdminThemeType>(() => {
      return (
        (localStorage.getItem(
          "admin-theme"
        ) as AdminThemeType) ||
        "blue-theme"
      );
    });

  // --- DATE FORMAT STATE ---
  const [dateFormat, setDateFormatState] =
    useState<DateFormatType>(() => {
      const saved = localStorage.getItem("date-format");
      const validFormats: DateFormatType[] = ['ddmmyyyy', 'ddmmmyyyy', 'mmddyyyy', 'yyyymmdd'];
      return (saved && validFormats.includes(saved as DateFormatType)) 
        ? saved as DateFormatType 
        : "ddmmyyyy";
    });

  // --- THEME SETTER ---
  const setTheme = (
    newTheme: AdminThemeType
  ) => {
    setThemeState(newTheme);
  };

  // --- DATE FORMAT SETTER ---
  const setDateFormat = (
    format: DateFormatType
  ) => {
    setDateFormatState(format);
    localStorage.setItem("date-format", format);
  };

  // --- FORMAT DATE FOR DISPLAY (UI) - Supports all 4 formats ---
  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const day = String(date.getDate()).padStart(2, '0');
    const month = date.getMonth();
    const year = date.getFullYear();
    const monthNum = String(month + 1).padStart(2, '0');

    switch (dateFormat) {
      case 'ddmmyyyy':
        return `${day}/${monthNum}/${year}`; // 15/03/2026
      case 'ddmmmyyyy':
        return `${day}/${MONTH_NAMES_SHORT[month]}/${year}`; // 15/Mar/2026
      case 'mmddyyyy':
        return `${monthNum}/${day}/${year}`; // 03/15/2026
      case 'yyyymmdd':
        return `${year}-${monthNum}-${day}`; // 2026-03-15
      default:
        return `${day}/${monthNum}/${year}`;
    }
  };

  // --- FORMAT DATE FOR API (Always YYYY-MM-DD) ---
  const getApiDateFormat = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // --- THEME EFFECT ---
  useEffect(() => {
    localStorage.setItem(
      "admin-theme",
      theme
    );

    document.body.classList.remove(
      "blue-theme",
      "green-theme",
      "dark-theme"
    );

    document.body.classList.add(theme);

  }, [theme]);

  return (
    <AdminThemeContext.Provider
      value={{
        theme,
        setTheme,
        dateFormat,
        setDateFormat,
        formatDate,
        getApiDateFormat,
      }}
    >
      {children}
    </AdminThemeContext.Provider>
  );
};

export const useAdminTheme = () => {
  const context =
    useContext(AdminThemeContext);

  if (!context) {
    throw new Error(
      "useAdminTheme must be used inside AdminThemeProvider"
    );
  }

  return context;
};