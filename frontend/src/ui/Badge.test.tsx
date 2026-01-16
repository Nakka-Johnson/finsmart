import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge, ConfidenceBadge } from './Badge';

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Active</Badge>);

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies variant class', () => {
    render(<Badge variant="success">Success</Badge>);

    const badge = screen.getByText('Success');
    expect(badge).toHaveClass('ui-badge--success');
  });

  it('applies size class', () => {
    render(<Badge size="lg">Large</Badge>);

    const badge = screen.getByText('Large');
    expect(badge).toHaveClass('ui-badge--lg');
  });

  it('renders dot indicator when dot prop is true', () => {
    render(<Badge dot>Status</Badge>);

    const badge = screen.getByText('Status');
    expect(badge).toHaveClass('ui-badge--dot');
  });

  it('maps destructive variant to danger', () => {
    render(<Badge variant="destructive">Delete</Badge>);

    const badge = screen.getByText('Delete');
    expect(badge).toHaveClass('ui-badge--danger');
  });
});

describe('ConfidenceBadge', () => {
  it('renders percentage from confidence value', () => {
    render(<ConfidenceBadge confidence={0.85} />);

    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('applies success variant for high confidence (>= 0.8)', () => {
    render(<ConfidenceBadge confidence={0.92} />);

    const badge = screen.getByText('92%');
    expect(badge).toHaveClass('ui-badge--success');
  });

  it('applies warning variant for medium confidence (0.5-0.79)', () => {
    render(<ConfidenceBadge confidence={0.65} />);

    const badge = screen.getByText('65%');
    expect(badge).toHaveClass('ui-badge--warning');
  });

  it('applies danger variant for low confidence (< 0.5)', () => {
    render(<ConfidenceBadge confidence={0.3} />);

    const badge = screen.getByText('30%');
    expect(badge).toHaveClass('ui-badge--danger');
  });

  it('rounds percentage correctly', () => {
    render(<ConfidenceBadge confidence={0.876} />);

    expect(screen.getByText('88%')).toBeInTheDocument();
  });
});
