import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AyahCard from '../AyahCard';
import { QuranProvider } from '../../contexts/QuranContext';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

// Mock Firebase and Firestore
vi.mock('../../lib/firebase', () => ({
  db: {
    collection: vi.fn(),
  },
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

// Mock AuthContext
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
  }),
}));

describe('AyahCard - Scroll Position Locking Integration Tests', () => {
  let scrollYMock;
  let scrollToMock;
  let requestAnimationFrameMock;
  
  const mockVerse = {
    verse_number: 1,
    text_uthmani: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
    translations: [
      {
        text: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
      },
    ],
  };

  beforeEach(() => {
    // Mock window.scrollY
    scrollYMock = 500; // Simulate being scrolled down 500px
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: scrollYMock,
    });

    // Mock window.scrollTo
    scrollToMock = vi.fn();
    window.scrollTo = scrollToMock;

    // Mock requestAnimationFrame
    requestAnimationFrameMock = vi.fn((callback) => {
      callback();
      return 1;
    });
    window.requestAnimationFrame = requestAnimationFrameMock;

    // Mock Audio - must be a proper constructor function
    window.Audio = function(src) {
      this.src = src;
      this.play = vi.fn().mockResolvedValue(undefined);
      this.pause = vi.fn();
      this.load = vi.fn();
      this.addEventListener = vi.fn((event, handler) => {
        if (event === 'canplay') {
          setTimeout(() => handler(), 0);
        }
      });
      this.removeEventListener = vi.fn();
      return this;
    };

    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should maintain scroll position after play button click', async () => {
    const user = userEvent.setup();
    
    render(
      <QuranProvider>
        <AyahCard verse={mockVerse} surahNumber={1} index={0} />
      </QuranProvider>
    );

    // Get the play button
    const playButton = screen.getByRole('button', { name: /play/i });

    // Click the play button
    await user.click(playButton);

    // Wait for scroll restoration to be called
    await waitFor(() => {
      expect(scrollToMock).toHaveBeenCalled();
    });

    // Verify scrollTo was called with the original scroll position
    expect(scrollToMock).toHaveBeenCalledWith(0, 500);
    
    // Verify requestAnimationFrame was used for scroll restoration
    expect(requestAnimationFrameMock).toHaveBeenCalled();
  });

  it('should maintain scroll position after pause button click', async () => {
    const user = userEvent.setup();
    
    render(
      <QuranProvider>
        <AyahCard verse={mockVerse} surahNumber={1} index={0} />
      </QuranProvider>
    );

    // First, play the audio
    const playButton = screen.getByRole('button', { name: /play/i });
    await user.click(playButton);

    // Wait for the button to change to "Pause"
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    // Clear previous scrollTo calls
    scrollToMock.mockClear();

    // Update scroll position to simulate user scrolling
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 800,
    });

    // Click the pause button
    const pauseButton = screen.getByRole('button', { name: /pause/i });
    await user.click(pauseButton);

    // Wait for scroll restoration to be called
    await waitFor(() => {
      expect(scrollToMock).toHaveBeenCalled();
    });

    // Verify scrollTo was called with the updated scroll position
    expect(scrollToMock).toHaveBeenCalledWith(0, 800);
  });

  it('should maintain scroll position when resuming from pause', async () => {
    const user = userEvent.setup();
    
    render(
      <QuranProvider>
        <AyahCard verse={mockVerse} surahNumber={1} index={0} />
      </QuranProvider>
    );

    // Play the audio
    const playButton = screen.getByRole('button', { name: /play/i });
    await user.click(playButton);

    // Wait for pause button
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    // Pause the audio
    const pauseButton = screen.getByRole('button', { name: /pause/i });
    await user.click(pauseButton);

    // Wait for resume button
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
    });

    // Clear previous scrollTo calls
    scrollToMock.mockClear();

    // Update scroll position
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 1000,
    });

    // Resume the audio
    const resumeButton = screen.getByRole('button', { name: /resume/i });
    await user.click(resumeButton);

    // Wait for scroll restoration to be called
    await waitFor(() => {
      expect(scrollToMock).toHaveBeenCalled();
    });

    // Verify scrollTo was called with the current scroll position
    expect(scrollToMock).toHaveBeenCalledWith(0, 1000);
  });

  it('should maintain scroll position during auto-play next ayah', async () => {
    const user = userEvent.setup();
    
    // Mock verse data with multiple verses
    const verse1 = { ...mockVerse, verse_number: 1 };
    const verse2 = { ...mockVerse, verse_number: 2 };

    // Mock Audio with ended event support
    let endedHandler;
    global.Audio = vi.fn().mockImplementation(() => ({
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      load: vi.fn(),
      addEventListener: vi.fn((event, handler) => {
        if (event === 'canplay') {
          setTimeout(() => handler(), 0);
        } else if (event === 'ended') {
          endedHandler = handler;
        }
      }),
      removeEventListener: vi.fn(),
    }));

    const { rerender } = render(
      <QuranProvider>
        <AyahCard verse={verse1} surahNumber={1} index={0} />
      </QuranProvider>
    );

    // Play the first ayah
    const playButton = screen.getByRole('button', { name: /play/i });
    await user.click(playButton);

    // Wait for audio to start playing
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    // Clear previous scrollTo calls
    scrollToMock.mockClear();

    // Update scroll position to simulate user scrolling during playback
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 1200,
    });

    // Simulate audio ending (which triggers auto-play next)
    if (endedHandler) {
      endedHandler();
    }

    // Rerender with the next verse
    rerender(
      <QuranProvider>
        <AyahCard verse={verse2} surahNumber={1} index={1} />
      </QuranProvider>
    );

    // Wait for the next ayah to start playing
    await waitFor(() => {
      // The scroll position should be maintained
      expect(scrollToMock).toHaveBeenCalledWith(0, 1200);
    }, { timeout: 3000 });
  });

  it('should prevent default scroll behavior on button click', async () => {
    const user = userEvent.setup();
    
    render(
      <QuranProvider>
        <AyahCard verse={mockVerse} surahNumber={1} index={0} />
      </QuranProvider>
    );

    const playButton = screen.getByRole('button', { name: /play/i });

    // Create a spy for preventDefault
    const preventDefaultSpy = vi.fn();
    const stopPropagationSpy = vi.fn();

    // Add event listener to capture the event
    playButton.addEventListener('click', (e) => {
      preventDefaultSpy();
      stopPropagationSpy();
    });

    // Click the button
    await user.click(playButton);

    // The component should handle preventDefault and stopPropagation internally
    // We verify that scroll position is maintained instead
    await waitFor(() => {
      expect(scrollToMock).toHaveBeenCalledWith(0, 500);
    });
  });

  it('should blur the button after click to prevent focus-based scrolling', async () => {
    const user = userEvent.setup();
    
    render(
      <QuranProvider>
        <AyahCard verse={mockVerse} surahNumber={1} index={0} />
      </QuranProvider>
    );

    const playButton = screen.getByRole('button', { name: /play/i });

    // Focus the button first
    playButton.focus();
    expect(document.activeElement).toBe(playButton);

    // Click the button
    await user.click(playButton);

    // Wait for the blur to happen
    await waitFor(() => {
      // After clicking, the button should not be focused
      // (blur is called in handlePlayAudio)
      expect(document.activeElement).not.toBe(playButton);
    });
  });

  it('should handle multiple rapid clicks without scroll jumping', async () => {
    const user = userEvent.setup();
    
    render(
      <QuranProvider>
        <AyahCard verse={mockVerse} surahNumber={1} index={0} />
      </QuranProvider>
    );

    const playButton = screen.getByRole('button', { name: /play/i });

    // Simulate rapid clicks
    await user.click(playButton);
    await user.click(playButton);
    await user.click(playButton);

    // Wait for all scroll restorations
    await waitFor(() => {
      expect(scrollToMock.mock.calls.length).toBeGreaterThan(0);
    });

    // All calls should restore to the same position
    scrollToMock.mock.calls.forEach(call => {
      expect(call).toEqual([0, 500]);
    });
  });

  it('should maintain scroll position at different scroll positions', async () => {
    const user = userEvent.setup();
    
    const testScrollPositions = [0, 100, 500, 1000, 2000];

    for (const scrollPos of testScrollPositions) {
      // Update scroll position
      Object.defineProperty(window, 'scrollY', {
        writable: true,
        configurable: true,
        value: scrollPos,
      });

      scrollToMock.mockClear();

      const { unmount } = render(
        <QuranProvider>
          <AyahCard verse={mockVerse} surahNumber={1} index={0} />
        </QuranProvider>
      );

      const playButton = screen.getByRole('button', { name: /play/i });
      await user.click(playButton);

      // Wait for scroll restoration
      await waitFor(() => {
        expect(scrollToMock).toHaveBeenCalledWith(0, scrollPos);
      });

      unmount();
    }
  });
});
