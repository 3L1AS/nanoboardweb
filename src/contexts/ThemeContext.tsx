import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { themeApi } from "../lib/tauri";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "nanoboard_theme";

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // 从 localStorage 读取主题偏好
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return (savedTheme === "dark" ? "dark" : "light");
  });

  useEffect(() => {
    // 同步主题：从后端获取主题并应用
    const syncTheme = async () => {
      try {
        const savedTheme = await themeApi.getTheme();
        if (savedTheme && savedTheme !== theme) {
          setThemeState(savedTheme as Theme);
          localStorage.setItem(THEME_STORAGE_KEY, savedTheme);
        }
      } catch (error) {
        console.error("Failed to sync theme:", error);
      }
    };

    syncTheme();

    // 仅在组件挂载时同步一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 当主题改变时，更新HTML class和localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = async () => {
    try {
      const newTheme = await themeApi.toggleTheme();
      if (newTheme) {
        setThemeState(newTheme as Theme);
      }
    } catch (error) {
      console.error("Failed to toggle theme:", error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
