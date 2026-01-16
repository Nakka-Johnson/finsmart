/**
 * Page Layout Component
 * 
 * A reusable wrapper for all route pages providing consistent:
 * - Max width (max-w-7xl)
 * - Horizontal padding (px-6)
 * - Vertical padding (py-6)
 * - Header row with title/description left, actions right
 * - Consistent spacing for children
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

interface PageProps {
  children: React.ReactNode;
  className?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

interface PageContentProps {
  children: React.ReactNode;
  className?: string;
}

interface PageActionsProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Main Page wrapper - provides max-width and padding
 */
export function Page({ children, className }: PageProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-7xl px-4 py-6 sm:px-6',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Page Header - title/description left, actions (children) right
 */
export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex shrink-0 items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Page Content - main content area with top margin
 */
export function PageContent({ children, className }: PageContentProps) {
  return (
    <div className={cn('mt-6', className)}>
      {children}
    </div>
  );
}

/**
 * Page Actions - wrapper for action buttons (used within PageHeader)
 */
export function PageActions({ children, className }: PageActionsProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {children}
    </div>
  );
}

export type { PageProps, PageHeaderProps, PageContentProps, PageActionsProps };
