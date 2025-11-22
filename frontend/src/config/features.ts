/**
 * Feature Flags Configuration
 * 
 * Reads VITE_FEATURE_* environment variables and provides type-safe access
 * to feature flags throughout the application.
 */

export interface FeatureFlags {
  // Demo & Onboarding
  demo: boolean;
  
  // CSV Import
  csvImportV2: boolean;
  
  // Budget Features
  budgetRollover: boolean;
  envelope: boolean;
  
  // Insights & Analytics
  insightsV2: boolean;
  
  // Progressive Web App
  pwa: boolean;
  
  // Export Centre
  exportCentre: boolean;
  
  // Open Banking (readonly mode)
  openBanking: boolean;
}

/**
 * Parse boolean from environment variable
 * Supports: 'true', '1', 'yes', 'on' (case-insensitive)
 */
function parseBoolean(value: string | undefined, defaultValue = false): boolean {
  if (!value) return defaultValue;
  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
}

/**
 * Feature flags singleton
 * All features default to false for safety
 */
export const features: FeatureFlags = {
  demo: parseBoolean(import.meta.env.VITE_FEATURE_DEMO),
  csvImportV2: parseBoolean(import.meta.env.VITE_FEATURE_CSV_IMPORT_V2),
  budgetRollover: parseBoolean(import.meta.env.VITE_FEATURE_BUDGET_ROLLOVER),
  envelope: parseBoolean(import.meta.env.VITE_FEATURE_ENVELOPE),
  insightsV2: parseBoolean(import.meta.env.VITE_FEATURE_INSIGHTS_V2),
  pwa: parseBoolean(import.meta.env.VITE_FEATURE_PWA),
  exportCentre: parseBoolean(import.meta.env.VITE_FEATURE_EXPORT_CENTRE),
  openBanking: parseBoolean(import.meta.env.VITE_FEATURE_OB_OB_READONLY),
};

/**
 * Check if a feature is enabled
 * Provides type-safe feature flag checking
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return features[feature];
}

/**
 * Get all enabled features (useful for debugging)
 */
export function getEnabledFeatures(): string[] {
  return Object.entries(features)
    .filter(([, enabled]) => enabled)
    .map(([feature]) => feature);
}

/**
 * Log feature flags on app startup (development only)
 */
if (import.meta.env.DEV) {
  console.log('🚩 Feature Flags:', {
    ...features,
    enabled: getEnabledFeatures(),
  });
}
