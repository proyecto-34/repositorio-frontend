import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './ThemeToggle.css';

export const ThemeToggle = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-btn ${isDark ? 'dark' : 'light'} ${className}`}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      <div className="theme-toggle-icon-wrap">
        {isDark ? (
          <Sun size={17} className="theme-icon sun-icon" />
        ) : (
          <Moon size={17} className="theme-icon moon-icon" />
        )}
      </div>
      {showLabel && (
        <span className="theme-toggle-label">
          {isDark ? 'Modo Claro' : 'Modo Oscuro'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
