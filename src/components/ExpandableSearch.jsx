import { useState, useRef, useEffect } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import SearchBar from './SearchBar';
import { useQuranData } from '../contexts/QuranContext';

const { FiSearch } = FiIcons;

// Theme-specific styling for the expandable search component
const THEME_STYLES = {
  green: {
    button: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/20',
    icon: 'text-emerald-600 dark:text-emerald-400',
    input: 'bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-700 focus:ring-emerald-500',
    closeButton: 'text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300'
  },
  red: {
    button: 'hover:bg-rose-100 dark:hover:bg-rose-900/20',
    icon: 'text-rose-600 dark:text-rose-400',
    input: 'bg-white dark:bg-slate-800 border-rose-200 dark:border-rose-700 focus:ring-rose-500',
    closeButton: 'text-rose-400 hover:text-rose-600 dark:hover:text-rose-300'
  },
  blue: {
    button: 'hover:bg-sky-100 dark:hover:bg-sky-900/20',
    icon: 'text-sky-600 dark:text-sky-400',
    input: 'bg-white dark:bg-slate-800 border-sky-200 dark:border-sky-700 focus:ring-sky-500',
    closeButton: 'text-sky-400 hover:text-sky-600 dark:hover:text-sky-300'
  },
  light: {
    button: 'hover:bg-slate-100 dark:hover:bg-slate-800',
    icon: 'text-slate-600 dark:text-slate-300',
    input: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-islamic-gold',
    closeButton: 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
  },
  dark: {
    button: 'hover:bg-slate-800 dark:hover:bg-slate-700',
    icon: 'text-slate-200 dark:text-slate-100',
    input: 'bg-slate-900 dark:bg-slate-800 border-slate-700 dark:border-slate-600 focus:ring-slate-500',
    closeButton: 'text-slate-400 hover:text-slate-300 dark:hover:text-slate-200'
  },
  sepia: {
    button: 'hover:bg-amber-100 dark:hover:bg-amber-900/20',
    icon: 'text-amber-600 dark:text-amber-400',
    input: 'bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-700 focus:ring-amber-500',
    closeButton: 'text-amber-400 hover:text-amber-600 dark:hover:text-amber-300'
  }
};

const DEFAULT_THEME_STYLE = THEME_STYLES.light;

/**
 * ExpandableSearch Component
 * 
 * A search interface that starts as a search icon and expands to show
 * the full search input when clicked. Provides a space-efficient solution
 * for navigation header search functionality.
 * 
 * Features:
 * - Responsive width calculations for different screen sizes
 * - Touch-friendly targets (44x44px minimum)
 * - Theme-aware styling that integrates with the app's theme system
 * - Smooth animations and transitions
 * 
 * @param {Object} props - Component props
 * @param {string} [props.variant='nav'] - Display variant ('nav' or 'global')
 * @param {string} [props.className=''] - Additional CSS classes
 */
const ExpandableSearch = ({ variant = 'nav', className = '' }) => {
  // State management for expanded/collapsed states
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  
  // Get current theme from context
  const { theme } = useQuranData();
  const themeStyles = THEME_STYLES[theme] ?? DEFAULT_THEME_STYLE;

  /**
   * Toggle between expanded and collapsed states
   */
  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  /**
   * Collapse the search interface
   */
  const collapseSearch = () => {
    setIsExpanded(false);
  };

  /**
   * Focus management - focus input when expanding
   */
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      // Small delay to ensure smooth animation before focusing
      const timeoutId = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isExpanded]);

  /**
   * Click outside handler - collapse when clicking outside the component
   */
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        collapseSearch();
      }
    };

    // Add event listener with a small delay to prevent immediate collapse
    // when the expand button is clicked
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  /**
   * Escape key handler - collapse when pressing escape key
   */
  useEffect(() => {
    if (!isExpanded) return;

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        collapseSearch();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isExpanded]);

  return (
    <div ref={containerRef} className={`expandable-search relative ${className}`}>
      <div
        className={`
          flex items-center overflow-hidden
          transition-all duration-300 ease-out
          ${isExpanded 
            ? 'w-full sm:w-72 md:w-80 lg:w-96 max-w-md' 
            : 'w-auto'
          }
        `}
      >
        {!isExpanded ? (
          // Collapsed state - show only search icon
          // Touch target: 44x44px (p-3 = 12px padding + 20px icon = 44px total)
          <button
            type="button"
            onClick={toggleExpanded}
            className={`
              flex items-center justify-center 
              min-w-[44px] min-h-[44px] p-3
              rounded-lg transition-colors
              ${themeStyles.button}
            `}
            aria-label="Open search"
            aria-expanded={isExpanded}
          >
            <SafeIcon 
              icon={FiSearch} 
              className={`text-xl ${themeStyles.icon}`}
            />
          </button>
        ) : (
          // Expanded state - full search interface
          <div 
            className={`
              flex items-center gap-2 w-full
              transition-opacity duration-300 ease-out
              ${isExpanded ? 'opacity-100' : 'opacity-0'}
            `}
          >
            {/* Search icon indicator */}
            <SafeIcon 
              icon={FiSearch} 
              className={`text-lg flex-shrink-0 ${themeStyles.icon}`}
            />
            
            {/* Search input field */}
            <input
              ref={inputRef}
              type="text"
              placeholder="Search Quran..."
              className={`
                flex-1 
                px-3 py-2
                min-h-[44px]
                border rounded-lg 
                focus:outline-none focus:ring-2 
                transition-all
                text-sm sm:text-base
                ${themeStyles.input}
              `}
              aria-label="Search Quran"
            />
            
            {/* Close button - Touch target: 44x44px */}
            <button
              type="button"
              onClick={toggleExpanded}
              className={`
                flex-shrink-0 
                min-w-[44px] min-h-[44px]
                flex items-center justify-center
                text-2xl leading-none 
                transition-colors
                ${themeStyles.closeButton}
              `}
              aria-label="Close search"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpandableSearch;
