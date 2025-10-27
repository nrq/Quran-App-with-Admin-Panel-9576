import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useQuranData } from '../contexts/QuranContext';
import './ExpandableSearch.css';

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
 * Debounce utility for performance optimization
 * Delays function execution until after a specified wait time has elapsed
 * since the last time it was invoked
 * 
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const searchButtonRef = useRef(null);
  
  // Refs for debouncing and preventing rapid state changes
  const toggleTimeoutRef = useRef(null);
  const isTogglingRef = useRef(false);
  const animationTimeoutRef = useRef(null);
  
  // Get current theme from context
  const { theme } = useQuranData();
  
  // Memoize theme styles to prevent recalculation on every render
  const themeStyles = useMemo(() => {
    return THEME_STYLES[theme] ?? DEFAULT_THEME_STYLE;
  }, [theme]);

  /**
   * Toggle between expanded and collapsed states
   * Optimized to prevent excessive rapid state changes that could cause performance issues
   */
  const toggleExpanded = useCallback(() => {
    // Prevent rapid toggling during animation
    if (isTogglingRef.current) return;
    
    isTogglingRef.current = true;
    setIsAnimating(true);
    setIsExpanded((prev) => !prev);
    
    // Reset animation state after animation completes
    animationTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, 300); // Match animation duration
    
    // Reset toggling flag with minimal delay to allow reasonable user interaction
    // while still preventing excessive rapid clicks that could cause performance issues
    toggleTimeoutRef.current = setTimeout(() => {
      isTogglingRef.current = false;
    }, 100); // Minimal delay for better UX while still preventing excessive clicks
  }, []);

  /**
   * Collapse the search interface
   * Memoized to prevent unnecessary re-renders
   */
  const collapseSearch = useCallback(() => {
    setIsExpanded(false);
    setSearchQuery('');
    // Return focus to the search button after closing
    setTimeout(() => {
      searchButtonRef.current?.focus();
    }, 100);
  }, []);

  /**
   * Handle search input changes
   * Memoized to prevent unnecessary re-renders
   */
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  /**
   * Handle search form submission
   * Memoized to prevent unnecessary re-renders
   */
  const handleSearchSubmit = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Search functionality will be implemented here
      console.log('Searching for:', searchQuery);
    }
  }, [searchQuery]);

  /**
   * Focus management - focus input when expanding
   * Announce state changes to screen readers
   */
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      // Small delay to ensure smooth animation before focusing
      const timeoutId = setTimeout(() => {
        inputRef.current?.focus();
        // Announce to screen readers
        announceToScreenReader('Search expanded. Type to search the Quran.');
      }, 100);
      return () => clearTimeout(timeoutId);
    } else if (!isExpanded) {
      // Announce collapse to screen readers
      announceToScreenReader('Search collapsed.');
    }
  }, [isExpanded]);

  /**
   * Announce messages to screen readers using ARIA live region
   * Memoized to prevent unnecessary re-creation
   */
  const announceToScreenReader = useCallback((message) => {
    const announcement = document.getElementById('search-announcement');
    if (announcement) {
      announcement.textContent = message;
      // Clear after announcement
      setTimeout(() => {
        announcement.textContent = '';
      }, 1000);
    }
  }, []);

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
  }, [isExpanded, collapseSearch]);

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
  }, [isExpanded, collapseSearch]);
  
  /**
   * Cleanup timeouts on unmount to prevent memory leaks
   */
  useEffect(() => {
    return () => {
      if (toggleTimeoutRef.current) {
        clearTimeout(toggleTimeoutRef.current);
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* ARIA live region for screen reader announcements */}
      <div
        id="search-announcement"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      
      <div 
        ref={containerRef} 
        className={`expandable-search relative ${isAnimating ? 'animating' : ''} ${className}`}
        role="search"
        aria-label="Quran search"
      >
        <div
          className={`
            flex items-center overflow-hidden
            transition-[width] duration-300 ease-out
            will-change-[width]
            ${isExpanded 
              ? 'w-full sm:w-72 md:w-80 lg:w-96 max-w-md' 
              : 'w-auto'
            }
          `}
          style={{
            // Use transform for better performance on supported browsers
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden'
          }}
        >
          {!isExpanded ? (
            // Collapsed state - show only search icon
            // Touch target: 44x44px (p-3 = 12px padding + 20px icon = 44px total)
            <button
              ref={searchButtonRef}
              type="button"
              onClick={toggleExpanded}
              className={`
                flex items-center justify-center 
                min-w-[44px] min-h-[44px] p-3
                rounded-lg transition-colors
                focus:outline-none focus:ring-2 focus:ring-offset-2
                ${themeStyles.button}
              `}
              aria-label="Open search"
              aria-expanded={isExpanded}
              aria-controls="search-input-container"
              title="Open search"
            >
              <SafeIcon 
                icon={FiSearch} 
                className={`text-xl ${themeStyles.icon}`}
                aria-hidden="true"
              />
            </button>
          ) : (
            // Expanded state - full search interface
            <form 
              onSubmit={handleSearchSubmit}
              id="search-input-container"
              className={`
                flex items-center gap-2 w-full
                transition-opacity duration-300 ease-out
                will-change-opacity
                ${isExpanded ? 'opacity-100' : 'opacity-0'}
              `}
              role="search"
              style={{
                // Use transform for better performance
                transform: 'translateZ(0)'
              }}
            >
              {/* Search icon indicator */}
              <SafeIcon 
                icon={FiSearch} 
                className={`text-lg flex-shrink-0 ${themeStyles.icon}`}
                aria-hidden="true"
              />
              
              {/* Search input field */}
              <label htmlFor="quran-search-input" className="sr-only">
                Search the Quran
              </label>
              <input
                ref={inputRef}
                id="quran-search-input"
                type="search"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search Quran..."
                className={`
                  flex-1 
                  px-3 py-2
                  min-h-[44px]
                  border rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-offset-1
                  transition-all
                  text-sm sm:text-base
                  ${themeStyles.input}
                `}
                aria-label="Search the Quran by verse, surah, or keyword"
                aria-describedby="search-instructions"
                autoComplete="off"
                spellCheck="false"
              />
              
              {/* Hidden instructions for screen readers */}
              <span id="search-instructions" className="sr-only">
                Type to search for verses, surahs, or keywords in the Quran. Press Escape to close search.
              </span>
              
              {/* Close button - Touch target: 44x44px */}
              <button
                type="button"
                onClick={collapseSearch}
                className={`
                  flex-shrink-0 
                  min-w-[44px] min-h-[44px]
                  flex items-center justify-center
                  text-2xl leading-none 
                  transition-colors
                  focus:outline-none focus:ring-2 focus:ring-offset-1
                  rounded
                  ${themeStyles.closeButton}
                `}
                aria-label="Close search and clear input"
                title="Close search (Esc)"
              >
                <span aria-hidden="true">×</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default ExpandableSearch;
