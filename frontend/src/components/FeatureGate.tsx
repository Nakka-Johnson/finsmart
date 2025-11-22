/**
 * FeatureGate Component
 * 
 * Conditionally renders children based on feature flag status.
 * Useful for wrapping Sprint-1 features that can be toggled on/off.
 * 
 * @example
 * <FeatureGate feature="csvImportV2">
 *   <CSVImportButton />
 * </FeatureGate>
 */

import { type ReactNode } from 'react';
import { useFeature } from '@/hooks/useFeature';
import type { FeatureFlags } from '@/config/features';

interface FeatureGateProps {
  /** Feature flag to check */
  feature: keyof FeatureFlags;
  
  /** Content to render when feature is enabled */
  children: ReactNode;
  
  /** Optional fallback content when feature is disabled */
  fallback?: ReactNode;
}

export function FeatureGate({ feature, children, fallback = null }: FeatureGateProps) {
  const isEnabled = useFeature(feature);
  
  return <>{isEnabled ? children : fallback}</>;
}
