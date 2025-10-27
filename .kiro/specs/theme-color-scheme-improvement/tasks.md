# Implementation Plan

- [ ] 1. Update Layout component with improved theme color definitions
  - Replace the THEME_STYLES object in src/components/Layout.jsx with the new professional-grade color schemes
  - Implement dark theme with white text (#F8FAFC) on dark blackish backgrounds (#0F172A, #1E293B)
  - Implement blue theme using only blue shades (blue-50 to blue-950) and white
  - Implement green theme with fresh emerald tones (emerald-50 to emerald-950)
  - Implement red theme with warm rose tones (rose-50 to rose-950)
  - Implement sepia theme with comfortable amber tones (amber-50 to amber-950)
  - Implement light theme with clean slate grays and islamic-gold accents
  - Add backdrop-blur-sm and opacity to navigation backgrounds for modern floating effect
  - Add color-matched shadows to brand badges (e.g., shadow-blue-900/30 for blue theme)
  - Ensure all text colors meet WCAG AA contrast standards (minimum 4.5:1 ratio)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4_

- [ ] 2. Update AyahCard component for theme compatibility
  - Review and update background colors to work with all 6 themes
  - Ensure Arabic text (quran-text-pak) has sufficient contrast in all themes
  - Ensure translation text has sufficient contrast in all themes
  - Update button colors (play/pause, tafseer) to match theme palette
  - Verify playing state styling works with all themes
  - Test bookmark button visibility in all themes
  - _Requirements: 3.3, 3.4_

- [ ] 3. Verify SettingsPanel theme selection buttons
  - Confirm theme button colors accurately represent each theme
  - Ensure active state (ring-2 ring-offset-2) is visible in all themes
  - Verify hover states provide clear visual feedback
  - Test focus states for keyboard navigation
  - _Requirements: 3.2_

- [ ] 4. Update AudioPlayer component styling
  - Review and update any theme-dependent colors in AudioPlayer
  - Ensure progress bar colors work with all themes
  - Verify control button visibility in all themes
  - Test playing/paused state indicators
  - _Requirements: 3.2_

- [ ] 5. Verify Home page surah cards
  - Test surah card backgrounds and borders in all themes
  - Ensure surah names and metadata are readable in all themes
  - Verify hover states provide clear feedback in all themes
  - Check that card shadows work well with each theme's background
  - _Requirements: 3.1, 3.2_

- [ ] 6. Test Surah page with all themes
  - Verify verse display readability in all themes
  - Test bismillah styling in all themes
  - Ensure back button and navigation elements are visible
  - Verify loading spinner visibility in all themes
  - _Requirements: 3.1, 3.3, 3.4_

- [ ] 7. Test Bookmarks page with all themes
  - Verify bookmark list item readability in all themes
  - Test empty state message visibility
  - Ensure delete/edit buttons are clearly visible
  - _Requirements: 3.2_

- [ ] 8. Cross-browser and device testing
  - Test all themes in Chrome, Firefox, Safari, and Edge
  - Verify mobile responsiveness with all themes
  - Test on different screen sizes (mobile, tablet, desktop)
  - Verify backdrop-blur support or graceful degradation
  - _Requirements: 3.1, 3.2_

- [ ] 9. Accessibility validation
  - Use browser DevTools to verify contrast ratios for all text in each theme
  - Test keyboard navigation with focus indicators in all themes
  - Verify screen reader compatibility with theme changes
  - Test with prefers-reduced-motion for users sensitive to animations
  - _Requirements: 1.3, 3.1_

- [ ] 10. Performance testing
  - Verify theme switching is instant with no visual glitches
  - Test that theme preference persists correctly in localStorage
  - Ensure no layout shifts occur during theme changes
  - Verify CSS class application doesn't cause re-renders
  - _Requirements: 3.1_
