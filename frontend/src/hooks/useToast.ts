import { useToastStore } from '@/store/toast';

// Re-export from store for backwards compatibility
export { useToastStore as useToast };

// Simpler hook version for convenience
export function useSimpleToast() {
  const showToast = useToastStore(state => state.showToast);
  return { showToast };
}
