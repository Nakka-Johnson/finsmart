/// <reference types="vite/client" />

interface ImportMetaEnv {
  // API Endpoints
  readonly VITE_API_BASE: string;
  readonly VITE_AI_URL: string;
  
  // Feature Flags
  readonly VITE_FEATURE_DEMO?: string;
  readonly VITE_FEATURE_CSV_IMPORT_V2?: string;
  readonly VITE_FEATURE_BUDGET_ROLLOVER?: string;
  readonly VITE_FEATURE_ENVELOPE?: string;
  readonly VITE_FEATURE_INSIGHTS_V2?: string;
  readonly VITE_FEATURE_PWA?: string;
  readonly VITE_FEATURE_EXPORT_CENTRE?: string;
  readonly VITE_FEATURE_OB_OB_READONLY?: string;
  
  // Open Banking
  readonly VITE_OB_PROVIDER?: string;
  
  // App Configuration
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_APP_ENV?: string;
  
  // Development mode
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
