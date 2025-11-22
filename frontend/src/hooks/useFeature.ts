/**
 * Feature Flag Hooks
 * 
 * Custom hooks for checking feature flags in React components.
 */

import { features, type FeatureFlags } from '@/config/features';

/**
 * Hook to check if a feature is enabled
 * 
 * @example
 * const showImport = useFeature('csvImportV2');
 * if (showImport) {
 *   // render import button
 * }
 */
export function useFeature(feature: keyof FeatureFlags): boolean {
  return features[feature];
}

/**
 * Hook to get all enabled features
 * Useful for debugging or analytics
 */
export function useEnabledFeatures(): string[] {
  return Object.entries(features)
    .filter(([, enabled]) => enabled)
    .map(([feature]) => feature);
}
