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

interface AdminThemeContextType {
  theme: AdminThemeType;
  setTheme: (theme: AdminThemeType) => void;
}

const AdminThemeContext =
  createContext<AdminThemeContextType | null>(null);

interface Props {
  children: ReactNode;
}

export const AdminThemeProvider = ({
  children,
}: Props) => {

  const [theme, setThemeState] =
    useState<AdminThemeType>(() => {
      return (
        (localStorage.getItem(
          "admin-theme"
        ) as AdminThemeType) ||
        "blue-theme"
      );
    });

  const setTheme = (
    newTheme: AdminThemeType
  ) => {
    setThemeState(newTheme);
  };

  useEffect(() => {
    localStorage.setItem(
      "admin-theme",
      theme
    );

    // REMOVE OLD THEMES FROM BODY
    document.body.classList.remove(
      "blue-theme",
      "green-theme",
      "dark-theme"
    );

    // ADD NEW THEME TO BODY
    document.body.classList.add(theme);

  }, [theme]);

  return (
    <AdminThemeContext.Provider
      value={{
        theme,
        setTheme,
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