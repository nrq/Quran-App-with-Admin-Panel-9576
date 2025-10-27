import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SearchBar from '../SearchBar';

let searchQuranMock;

vi.mock('../../contexts/QuranContext', () => ({
  useQuranData: () => ({
    searchQuran: searchQuranMock,
  }),
}));

describe('SearchBar floating island behaviour', () => {
  beforeEach(() => {
    searchQuranMock = vi.fn().mockResolvedValue([]);
  });

  it('renders a floating island trigger by default', () => {
    const { container } = render(
      <MemoryRouter>
        <SearchBar />
      </MemoryRouter>
    );

    const root = container.firstChild;
    expect(root).toHaveClass('fixed');
    expect(root).toHaveClass('pointer-events-none');

    expect(screen.getByRole('button', { name: /open search/i })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /search quran/i })).not.toBeInTheDocument();
  });

  it('expands to a half-width panel when activated', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MemoryRouter>
        <SearchBar />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /open search/i }));

    const input = await screen.findByRole('textbox', { name: /search quran/i });
    expect(input).toBeVisible();
    expect(screen.queryByRole('button', { name: /open search/i })).not.toBeInTheDocument();

    const innerContainer = container.querySelector('[class*="md:w-1/2"]');
    expect(innerContainer).not.toBeNull();
  });
});
