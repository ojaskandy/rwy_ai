import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

// Define theme type and context type
type Theme = "dark" | "light";

type ThemeContextType = {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

// Create the context
export const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize state with dark mode as default, or stored theme preference
  const [theme, setThemeState] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    // Default to dark mode if no stored preference
    return storedTheme || 'dark';
  });
  
  // Helper for setting theme in state and storage
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };
  
  // Toggle between dark and light
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  // Apply theme to document when it changes
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove the old theme class and add the new theme class
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
    
    // Update the theme-color meta tag for mobile browsers
    const themeColor = theme === 'dark' ? '#000000' : '#ffffff';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
    
  }, [theme]);
  
  // Listen for system preference changes but don't automatically apply them
  // Keep user's explicit choice or default to dark mode
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only apply system preference if user hasn't made an explicit choice
      if (localStorage.getItem('theme') === null) {
        // Even then, default to dark mode
        setThemeState('dark');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDarkMode: theme === 'dark',
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}