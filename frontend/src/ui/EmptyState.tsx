import type { ReactNode } from 'react';
import { clsx } from '../utils/clsx';
import { Button } from './Button';
import './EmptyState.css';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actions?: EmptyStateAction[];
  variant?: 'default' | 'compact' | 'card';
  className?: string;
}

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: ReactNode;
  href?: string;
  disabled?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  actions,
  variant = 'default',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'ui-empty-state',
        `ui-empty-state--${variant}`,
        className
      )}
      role="status"
      aria-label={title}
    >
      {icon && (
        <div className="ui-empty-state__icon" aria-hidden="true">
          {typeof icon === 'string' ? (
            <span className="ui-empty-state__emoji">{icon}</span>
          ) : (
            icon
          )}
        </div>
      )}
      <h3 className="ui-empty-state__title">{title}</h3>
      {description && (
        <p className="ui-empty-state__description">{description}</p>
      )}
      {actions && actions.length > 0 && (
        <div className="ui-empty-state__actions">
          {actions.map((action, index) => {
            const buttonProps = {
              key: index,
              variant: action.variant || (index === 0 ? 'primary' : 'secondary') as 'primary' | 'secondary' | 'ghost',
              icon: action.icon,
              disabled: action.disabled,
            };
            
            if (action.href) {
              return (
                <a key={index} href={action.href}>
                  <Button {...buttonProps}>{action.label}</Button>
                </a>
              );
            }
            
            return (
              <Button {...buttonProps} onClick={action.onClick}>
                {action.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* Loading Empty State - shows skeleton while data is being fetched */
export function EmptyStateLoading({ className }: { className?: string }) {
  return (
    <div className={clsx('ui-empty-state ui-empty-state--loading', className)}>
      <div className="ui-empty-state__skeleton-icon" />
      <div className="ui-empty-state__skeleton-title" />
      <div className="ui-empty-state__skeleton-description" />
    </div>
  );
}
