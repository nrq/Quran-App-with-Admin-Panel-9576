# Design Document

## Overview

This design implements an expandable search interface in the navigation header to replace the currently non-functional search bar. The solution uses a search icon that expands into a full search interface when clicked, providing a clean and space-efficient approach to search functionality.

## Architecture

### Component Structure
```
Layout Component
├── Navigation Header
│   ├── Brand (NurulQuran)
│   ├── ExpandableSearch (NEW)
│   │   ├── Search Icon (collapsed state)
│   │   └── SearchBar (expanded state)
│   └── Action Buttons (Last Ayah, Settings)
```

### State Management
- **Expanded State**: Boolean state to track whether search is expanded or collapsed
- **Search Query**: Managed by existing SearchBar component
- **Animation State**: CSS transitions for smooth expand/collapse animations

## Components and Interfaces

### ExpandableSearch Component (NEW)

**Props:**
```typescript
interface ExpandableSearchProps {
  variant?: 'nav' | 'global';
  className?: string;
}
```

**State:**
```typescript
interface ExpandableSearchState {
  isExpanded: boolean;
  searchQuery: string;
}
```

**Key Methods:**
- `toggleExpanded()`: Toggle between expanded and collapsed states
- `handleClickOutside()`: Collapse when clicking outside the component
- `handleEscapeKey()`: Collapse when pressing escape key
- `handleSearchSubmit()`: Handle search form submission

### Modified Layout Component

**Changes:**
- Replace direct SearchBar usage with ExpandableSearch component
- Remove responsive visibility classes that were hiding the search
- Maintain existing navigation structure and styling

### SearchBar Component Integration

**Modifications:**
- Add support for controlled expanded state
- Modify styling for inline expansion within navigation
- Maintain existing search functionality and results display

## Data Models

### Search State Model
```typescript
interface SearchState {
  isExpanded: boolean;
  query: string;
  results: SearchResult[];
  isLoading: boolean;
}
```

### Animation Configuration
```typescript
interface AnimationConfig {
  expandDuration: number; // 300ms
  collapseDuration: number; // 200ms
  easing: string; // 'ease-out'
}
```

## User Interface Design

### Collapsed State (Default)
- **Icon**: Search icon (FiSearch) positioned between brand and action buttons
- **Size**: 20px icon with appropriate padding for touch targets
- **Styling**: Matches existing navigation button styling
- **Hover State**: Subtle background color change consistent with other nav buttons

### Expanded State
- **Width**: Dynamically calculated based on available space (max 400px on desktop, 80% on mobile)
- **Animation**: Smooth width expansion from icon to full search bar
- **Input Field**: Full SearchBar component with existing functionality
- **Backdrop**: Maintains existing backdrop blur and transparency effects
- **Results**: Search results appear below the expanded search bar

### Responsive Behavior
- **Desktop (≥768px)**: Expands to maximum 400px width
- **Tablet (640px-767px)**: Expands to 70% of available space
- **Mobile (<640px)**: Expands to 80% of available space, may push other elements to next line if needed

## Error Handling

### Expansion Failures
- **Fallback**: If animation fails, immediately show expanded state without animation
- **Error Logging**: Log expansion errors to console for debugging

### Search Functionality
- **Existing Error Handling**: Leverage existing SearchBar error handling
- **Network Failures**: Display appropriate error messages within search results
- **Invalid Queries**: Handle gracefully with existing SearchBar logic

### Click Outside Detection
- **Event Listener Management**: Properly add/remove event listeners to prevent memory leaks
- **Escape Key Handling**: Ensure escape key works consistently across browsers

## Testing Strategy

### Unit Tests
- **ExpandableSearch Component**: Test expand/collapse functionality
- **State Management**: Test state transitions and edge cases
- **Event Handling**: Test click outside and escape key behaviors

### Integration Tests
- **Layout Integration**: Test integration with existing Layout component
- **SearchBar Integration**: Test that existing search functionality is preserved
- **Navigation Flow**: Test that expansion doesn't break other navigation elements

### Visual Regression Tests
- **Animation Smoothness**: Verify smooth transitions across different screen sizes
- **Theme Compatibility**: Test with all existing themes (green, red, blue, light, dark, sepia)
- **Responsive Design**: Test expansion behavior on various screen sizes

### User Experience Tests
- **Accessibility**: Test keyboard navigation and screen reader compatibility
- **Touch Interaction**: Test on mobile devices for proper touch targets
- **Performance**: Ensure animations don't cause performance issues

## Implementation Notes

### CSS Transitions
```css
.expandable-search {
  transition: width 300ms ease-out;
  overflow: hidden;
}

.search-icon {
  transition: opacity 200ms ease-out;
}

.search-input {
  transition: opacity 300ms ease-out 100ms;
}
```

### Event Handling Strategy
- Use `useRef` for click outside detection
- Implement proper cleanup in `useEffect` hooks
- Handle edge cases like rapid clicking

### Performance Considerations
- Debounce search queries (existing functionality)
- Minimize re-renders during animation
- Use CSS transforms for better performance where possible

### Accessibility Features
- Proper ARIA labels for search icon and expanded state
- Keyboard navigation support
- Focus management during expand/collapse
- Screen reader announcements for state changes