import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle = ({ className = '', size = 'default' }) => {
  const { isDark, toggleTheme } = useTheme();
  
  const sizeClasses = {
    small: 'w-12 h-6',
    default: 'w-14 h-7',
    large: 'w-16 h-8',
  };
  
  const knobSizes = {
    small: 'w-5 h-5',
    default: 'w-6 h-6',
    large: 'w-7 h-7',
  };
  
  const iconSizes = {
    small: 12,
    default: 14,
    large: 16,
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative ${sizeClasses[size]} rounded-full p-0.5
        transition-all duration-500 ease-out
        ${isDark 
          ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 shadow-lg shadow-purple-500/30' 
          : 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 shadow-lg shadow-amber-500/30'
        }
        hover:scale-105 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-offset-2 
        ${isDark ? 'focus:ring-purple-500' : 'focus:ring-amber-500'}
        ${className}
      `}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Background stars/sun rays */}
      <div className="absolute inset-0 overflow-hidden rounded-full">
        {isDark ? (
          // Stars animation for dark mode
          <>
            <div className="absolute top-1 left-2 w-1 h-1 bg-white rounded-full animate-pulse opacity-60" />
            <div className="absolute top-2.5 left-4 w-0.5 h-0.5 bg-white rounded-full animate-pulse opacity-40 delay-100" />
            <div className="absolute bottom-1.5 left-3 w-0.5 h-0.5 bg-white rounded-full animate-pulse opacity-50 delay-200" />
          </>
        ) : (
          // Sun rays for light mode
          <div className="absolute inset-0 bg-gradient-to-tr from-yellow-300/20 to-transparent" />
        )}
      </div>
      
      {/* Toggle knob */}
      <div
        className={`
          ${knobSizes[size]} rounded-full
          flex items-center justify-center
          transition-all duration-500 ease-out
          ${isDark 
            ? 'translate-x-full bg-slate-900 shadow-inner' 
            : 'translate-x-0 bg-white shadow-md'
          }
        `}
        style={{
          transform: isDark ? `translateX(calc(100% - 2px))` : 'translateX(0)',
        }}
      >
        {isDark ? (
          <Moon 
            size={iconSizes[size]} 
            className="text-purple-300 transition-transform duration-300" 
            strokeWidth={2.5}
          />
        ) : (
          <Sun 
            size={iconSizes[size]} 
            className="text-amber-500 transition-transform duration-300 animate-spin-slow" 
            strokeWidth={2.5}
          />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
