import * as React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground lg:text-base">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 mt-4 sm:mt-0">{children}</div>
      )}
    </div>
  );
}
