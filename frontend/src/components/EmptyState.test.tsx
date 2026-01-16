import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState, ErrorState } from './EmptyState';

describe('EmptyState', () => {
  it('renders title and default icon', () => {
    render(<EmptyState title="No transactions" />);

    expect(screen.getByText('No transactions')).toBeInTheDocument();
    expect(screen.getByText('📭')).toBeInTheDocument();
  });

  it('renders custom icon and message', () => {
    render(
      <EmptyState
        icon="🔍"
        title="No results"
        message="Try adjusting your search filters"
      />
    );

    expect(screen.getByText('🔍')).toBeInTheDocument();
    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search filters')).toBeInTheDocument();
  });

  it('calls action callback when button clicked', () => {
    const handleClick = vi.fn();

    render(
      <EmptyState
        title="No data"
        action={{ label: 'Add item', onClick: handleClick }}
      />
    );

    const button = screen.getByRole('button', { name: 'Add item' });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not render action button when no action provided', () => {
    render(<EmptyState title="Empty" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('renders error message with default title', () => {
    render(<ErrorState message="Something went wrong" />);

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(<ErrorState title="Connection failed" message="Check your network" />);

    expect(screen.getByText('Connection failed')).toBeInTheDocument();
    expect(screen.getByText('Check your network')).toBeInTheDocument();
  });

  it('calls retry callback when Try Again clicked', () => {
    const handleRetry = vi.fn();

    render(<ErrorState message="Failed to load" retry={handleRetry} />);

    const retryButton = screen.getByRole('button', { name: 'Try Again' });
    fireEvent.click(retryButton);

    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});
