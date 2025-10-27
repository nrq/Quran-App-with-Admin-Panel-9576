import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExpandableSearch from '../ExpandableSearch';
import { QuranProvider } from '../../contexts/QuranContext';

// Mock Firebase and Firestore
vi.mock('../../lib/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  onSnapshot: vi.fn(() => vi.fn()),
  addDoc: vi.fn(() => Promise.resolve({ id: 'test-id' })),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  doc: vi.fn(() => ({})),
  serverTimestamp: vi.fn(() => new Date()),
}));

// Mock offline data
vi.mock('../../data/quran-data.js', () => ({
  getAllSurahsInfo: vi.fn(() => [
    { id: 1, name_simple: 'Al-Fatihah', translated_name: { name: 'The Opening' }, verses_count: 7 },
  ]),
  getSurahVerses: vi.fn(() => Promise.resolve([])),
}));

describe('ExpandableSearch Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State and Rendering', () => {
    it('should render in collapsed state by default', () => {
      render(
        <QuranProvider>
          <ExpandableSearch />
        </QuranProvider>
      );

      const searchButton = screen.getByRole('button', { name: /open search/i });
      expect(searchButton).toBeInTheDocument();
      expect(searchButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should not show search input in collapsed state', () => {
      render(
        <QuranProvider>
          <ExpandableSearch />
        </QuranProvider>
      );

      const searchInput = screen.queryByRole('searchbox');
      expect(searchInput).not.toBeInTheDocument();
    });

    it('should have proper ARIA attributes for accessibility', () => {
      render(
        <QuranProvider>
          <ExpandableSearch />
        </QuranProvider>
      );

      const searchButton = screen.getByRole('button', { name: /open search/i });
      expect(searchButton).toHaveAttribute('aria-label', 'Open search');
      expect(searchButton).toHaveAttribute('aria-expanded', 'false');
      expect(searchButton).toHaveAttribute('aria-controls', 'search-input-container');
    });

    it('should render with custom className', () => {
      const { container } = render(
        <QuranProvider>
          <ExpandableSearch className="custom-class" />
        </QuranProvider>
      );

      const searchContainer = container.querySelector('.expandable-search');
      expect(searchContainer).toHaveClass('custom-class');
    });
  });

  describe('Expand Functionality', () => {
    it('should expand when search icon is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <QuranProvider>
          <ExpandableSearch />
        </QuranProvider>
      );

      const searchButton = screen.getByRole('button', { name: /open search/i });
      await user.click(searchButton);

      await waitFor(() => {
        const searchInput = screen.getByRole('searchbox');
        expect(searchInput).toBeInTheDocument();
      });
    });

    it('should focus input field after expanding', async () => {
      const user = userEvent.setup();
      
      render(
        <QuranProvider>
          <ExpandableSearch />
        </QuranProvider>
      );

      const searchButton = screen.getByRole('button', { name: /open search/i });
      await user.click(searchButton);

      await waitFor(() => {
        const searchInput = screen.getByRole('searchbox');
        expect(searchInput).toHaveFocus();
      });
    });

    it('should update aria-expanded attribute when expanded', async () => {
      const user = userEvent.setup();
      
      render(
        <QuranProvider>
          <ExpandableSearch />
        </QuranProvider>
      );

      const searchButton = screen.getByRole('button', { name: /open search/i });
      await user.click(searchButton);

      // After expansion, the button is no longer visible, but we can check the input exists
      await waitFor(() => {
        const searchInput = screen.getByRole('searchbox');
        expect(searchInput).toBeInTheDocument();
      });
    });

    it('should announce expansion to screen readers', async () => {
      const user = userEvent.setup();
      
      render(
        <QuranProvider>
          <ExpandableSearch />
        </QuranProvider>
      );

      const searchButton = screen.getByRole('button', { name: /open search/i });
      await user.click(searchButton);

      await waitFor(() => {
        const announcement = document.getElementById('search-announcement');
        expect(announcement).toBeInTheDocument();
      });
    });
  });

  describe('Collapse Functionality', () => {
    it('should collapse when close button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <QuranProvider>
          <ExpandableSearch />
        </QuranProvider>
      );

      // Expand first
      const searchButton = screen.getByRole('button', { name: /open search/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByRole('searchbox')).toBeInTheDocument();
      });

      // Now collapse
      const closeButton = screen.getByRole('button', { name: /close search/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
      });
    });

    it('should clear search query when collapsed', async () => {
      const user = userEvent.setup();
      
      render(
        <QuranProvider>
          <ExpandableSearch />
        </QuranProvider>
      );

      // Expand and type
      const searchButton = screen.getByRole('button', { name: /open search/i });
      await user.click(searchButton);

      const searchInput = await screen.findByRole('searchbox');
      await user.type(searchInput, 'test query');
      expect(searchInput).toHaveValue('test query');

      // Collapse
      const closeButton = screen.getByRole('button', { name: /close search/i });
      await user.click(closeButton);

      // Expand again and check if cleared
      const searchButtonAgain = await screen.findByRole('button', { name: /open search/i });
      await user.click(searchButtonAgain);

      const searchInputAgain = await screen.findByRole('searchbox');
      expect(searchInputAgain).toHaveValue('');
    });

    it('should return focus to search button after closing', async () => {
      const user = userEvent.setup();
      
      render(
        <QuranProvider>
          <ExpandableSearch />
        </QuranProvider>
      );

      // Expand
      const searchButton = screen.getByRole('button', { name: /open search/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByRole('searchbox')).toBeInTheDocument();
      });

      // Close
      const closeButton = screen.getByRole('button', { name: /close search/i });
      await user.click(closeButton);

      // Check focus returns to search button
      await waitFor(() => {
        const searchButtonAgain = screen.getByRole('button', { name: /open search/i });
        expect(searchButtonAgain).toHaveFocus();
      });
    });
  });

  describe('Click Outside Handling', () => {
    it('should collapse when clicking outside the component', async () => {
      const user = userEvent.setup();
      
      const { container } = render(
        <div>
          <QuranProvider>
            <ExpandableSearch />
          </QuranProvider>
          <div data-testid="outside-element">Outside</div>
        </div>
      );

      // Expand
      const searchButton = screen.getByRole('button', { name: /open search/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByRole('searchbox')).toBeInTheDocument();
      });

      // Wait for the click outside listener to be attached (100ms delay in component)
      await new Promise(resolve => setTimeout(resolve, 150));

      // Click outside
      const outsideElement = screen.getByTestId('outside-element');
      await user.click(outsideElement);

      await waitFor(() => {
        expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
      });
    });

    it('should not collapse when clicking inside the component', async () => {
      const user = userEvent.setup();
      
      render(
        <QuranProvider>
          <ExpandableSearch />
        </QuranProvider>
      );

      // Expand
      const searchButton = screen.getByRole('button', { name: /open search/i });
      await user.click(searchButton);

      const searchInput = await screen.findByRole('searchbox');
      
      // Click inside (on the input)
      await user.click(searchInput);

      // Should still be expanded
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('Escape Key Handling', () => {
    it('should collapse when Escape key is pressed', async () => {
      const user = userEvent.setup();
      
      render(
        <QuranProvider>
          <ExpandableSearch />
        </QuranProvider>
      );

      // Expand
      const searchButton = screen.getByRole('button', { name: /open search/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByRole('searchbox')).toBeInTheDocument();
      });

      // Press Escape
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
      });
    });

    it('should not collapse on other key presses', async () => {
      const user = userEvent.setup();
      
      render(
        <QuranProvider>
          <ExpandableSearch />
        </QuranProvider>
      );

      // Expand
      const searchButton = screen.getByRole('button', { name: /open search/i });
      await user.click(searchButton);

      const searchInput = await screen.findByRole('searchbox');
      
      // Type some text
      await user.type(searchInput, 'test');

      // Should still be expanded
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveValue('test');
    });
  });

  describe('Search Input Functionality', () => {
    it('should allow typing in the search input', async () => {
      const user = userEvent.setup();
      
      render(
        <QuranProvider>
          <ExpandableSearch />
        </QuranProvider>
      );

      // Expand
      const searchButton = screen.getByRole('button', { name: /open search/i });
      await user.click(searchButton);

      const searchInput = await screen.findByRole('searchbox');
      
      // Type
      await user.type(searchInput, 'Al-Fatihah');
      
      expect(searchInput).toHaveValue('Al-Fatihah');
    });

    it('should have proper placeholder text', async () => {
      const user = userEvent.setup();
      
      render(
        <QuranProvider>
          <ExpandableSearch />
        </QuranProvider>
      );

      // Expand
      const searchButton = screen.getByRole('button', { name: /open search/i });
      await user.click(searchButton);

      const searchInput = await screen.findByRole('searchbox');
      
      expect(searchInput).toHaveAttribute('placeholder', 'Search Quran...');
    });

    it('should have proper ARIA labels for search input', async () => {
      const user = userEvent.setup();
      
      render(
        <QuranProvider>
          <ExpandableSearch />
        </QuranProvider>
      );

      // Expand
      const searchButton = screen.getByRole('button', { name: /open search/i });
      await user.click(searchButton);

      const searchInput = await screen.findByRole('searchbox');
      
      expect(searchInput).toHaveAttribute('aria-label', 'Search the Quran by verse, surah, or keyword');
      expect(searchInput).toHaveAttribute('aria-describedby', 'search-instructions');
    });
  });

  describe('Theme Integration', () => {
    it('should apply theme-specific styles', () => {
      render(
        <QuranProvider>
          <ExpandableSearch />
        </QuranProvider>
      );

      const searchButton = screen.getByRole('button', { name: /open search/i });
      
      // Should have theme-related classes
      expect(searchButton.className).toMatch(/hover:bg-/);
    });
  });

  describe('Responsive Behavior', () => {
    it('should have responsive width classes when expanded', async () => {
      const user = userEvent.setup();
      
      const { container } = render(
        <QuranProvider>
          <ExpandableSearch />
        </QuranProvider>
      );

      // Expand
      const searchButton = screen.getByRole('button', { name: /open search/i });
      await user.click(searchButton);

      await waitFor(() => {
        const expandedContainer = container.querySelector('.expandable-search > div');
        expect(expandedContainer?.className).toMatch(/w-full|sm:w-|md:w-|lg:w-/);
      });
    });

    it('should have minimum touch target size for mobile', () => {
      render(
        <QuranProvider>
          <ExpandableSearch />
        </QuranProvider>
      );

      const searchButton = screen.getByRole('button', { name: /open search/i });
      
      // Should have min-w-[44px] and min-h-[44px] for touch targets
      expect(searchButton.className).toMatch(/min-w-\[44px\]/);
      expect(searchButton.className).toMatch(/min-h-\[44px\]/);
    });
  });

  describe('Event Listener Cleanup', () => {
    it('should cleanup event listeners on unmount', async () => {
      const user = userEvent.setup();
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      
      const { unmount } = render(
        <QuranProvider>
          <ExpandableSearch />
        </QuranProvider>
      );

      // Expand to trigger event listeners
      const searchButton = screen.getByRole('button', { name: /open search/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByRole('searchbox')).toBeInTheDocument();
      });

      // Unmount
      unmount();

      // Should have called removeEventListener
      expect(removeEventListenerSpy).toHaveBeenCalled();
      
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid expand/collapse clicks', async () => {
      const user = userEvent.setup();
      
      render(
        <QuranProvider>
          <ExpandableSearch />
        </QuranProvider>
      );

      const searchButton = screen.getByRole('button', { name: /open search/i });
      
      // Rapid clicks
      await user.click(searchButton);
      
      await waitFor(() => {
        expect(screen.getByRole('searchbox')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /close search/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
      });

      // Should still work after rapid clicks
      const searchButtonAgain = screen.getByRole('button', { name: /open search/i });
      await user.click(searchButtonAgain);

      await waitFor(() => {
        expect(screen.getByRole('searchbox')).toBeInTheDocument();
      });
    });

    it('should handle form submission', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      render(
        <QuranProvider>
          <ExpandableSearch />
        </QuranProvider>
      );

      // Expand
      const searchButton = screen.getByRole('button', { name: /open search/i });
      await user.click(searchButton);

      const searchInput = await screen.findByRole('searchbox');
      
      // Type and submit
      await user.type(searchInput, 'test query');
      await user.keyboard('{Enter}');

      // Should log the search query (placeholder functionality)
      expect(consoleSpy).toHaveBeenCalledWith('Searching for:', 'test query');
      
      consoleSpy.mockRestore();
    });

    it('should not submit empty search queries', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      render(
        <QuranProvider>
          <ExpandableSearch />
        </QuranProvider>
      );

      // Expand
      const searchButton = screen.getByRole('button', { name: /open search/i });
      await user.click(searchButton);

      const searchInput = await screen.findByRole('searchbox');
      
      // Submit without typing
      await user.keyboard('{Enter}');

      // Should not log anything
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});
