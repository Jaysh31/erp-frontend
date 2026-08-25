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

export type DateFormatType = "numeric" | "monthName";

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
      return (
        (localStorage.getItem(
          "date-format"
        ) as DateFormatType) ||
        "numeric"
      );
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

  // --- FORMAT DATE FOR DISPLAY (UI) ---
  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const day = date.getDate();
    const year = date.getFullYear();
    const month = date.getMonth();

    if (dateFormat === "numeric") {
      return `${day}/${month + 1}/${year}`;
    } else {
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
      return `${day}/${monthNames[month]}/${year}`;
    }
  };

  // --- FORMAT DATE FOR API (YYYY-MM-DD) ---
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