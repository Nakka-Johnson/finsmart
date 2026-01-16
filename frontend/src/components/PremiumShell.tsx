import { useState, useEffect, type ReactNode } from 'react';
import { AppShell } from './AppShellNew';
import { CommandPalette } from './CommandPalette';
import { ToastContainer } from '@/components/ui/toast';
import { useToastStore } from '@/store/toast';

interface PremiumShellProps {
  children: ReactNode;
}

export function PremiumShell({ children }: PremiumShellProps) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const { toasts, hideToast } = useToastStore();

  // Global keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Map toast store format to component format
  const mappedToasts = toasts.map(t => ({
    id: t.id,
    title: t.message,
    variant: t.type === 'error' ? 'destructive' as const : t.type === 'success' ? 'success' as const : 'default' as const,
  }));

  return (
    <>
      <AppShell onCommandPaletteOpen={() => setCommandPaletteOpen(true)}>
        {children}
      </AppShell>
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
      <ToastContainer toasts={mappedToasts} onDismiss={hideToast} />
    </>
  );
}
