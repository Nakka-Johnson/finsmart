# CSV Import v2 - Sprint-1

## Overview

Complete CSV import feature with AI-powered categorization, duplicate detection, and header mapping.

## Features Implemented

### ✅ 3-Step Import Process

**Step 1: Upload File**
- Account selection dropdown
- Drag-and-drop or click to upload CSV
- File format requirements displayed
- File size and name preview

**Step 2: Map Headers**
- Auto-detection of CSV headers (date, description, amount, category)
- Manual header mapping with dropdowns
- Sample data preview for each mapped field
- Required fields validation (date, description, amount)
- Optional category field

**Step 3: Preview & Import**
- Full preview table with all mapped rows
- AI category suggestions with confidence scores
- Duplicate detection (automatically unselected)
- Individual row selection
- Bulk actions:
  - Toggle all non-duplicates
  - Apply all AI suggestions at once
- Per-row actions:
  - Apply individual AI suggestions
- Import selected transactions

### ✅ AI Integration

**Category Suggestions:**
- Calls `/api/transactions/import/preview` endpoint
- Displays AI-suggested categories with confidence scores
- One-click to apply suggestions (individual or bulk)
- Visual indicators for applied suggestions (✓)

**Duplicate Detection:**
- Backend detects duplicates based on hash
- Duplicate rows highlighted in red
- Automatically unselected (prevents re-import)
- Badge shows "Duplicate" status

### ✅ Statistics Dashboard

Real-time stats display:
- **Total Rows**: All rows in CSV
- **Selected**: Rows marked for import
- **Duplicates**: Detected duplicate transactions
- **AI Categorized**: Rows with AI suggestions (highlighted)

### ✅ Progress Tracking

Visual 3-step progress indicator:
1. Upload File (🔵 → ✅)
2. Map Headers (🔵 → ✅)
3. Preview & Import (🔵 → ✅)

### ✅ Import Completion

Success screen showing:
- Checkmark icon
- Number of transactions imported
- Number of duplicates skipped
- Actions:
  - Import another file (reset)
  - View transactions (navigate)

## Files Created

### Component
- `frontend/src/pages/CSVImportPage.tsx` (860 lines)
  - Main CSVImportPage component
  - UploadStep component
  - MapHeadersStep component
  - PreviewStep component
  - CompleteStep component
  - Full TypeScript types
  - API integration

### Styling
- `frontend/src/pages/CSVImportPage.css` (630 lines)
  - Complete responsive design
  - Step progress indicators
  - Table styling with row states
  - AI suggestion styling
  - Mobile-friendly breakpoints

### Modified Files
- `frontend/src/App.tsx` - Added `/import` route
- `frontend/src/components/Shell.tsx` - Added "Import CSV" navigation link

## Backend Integration

### Endpoints Used

```typescript
// Preview with AI suggestions
POST /api/transactions/import/preview
Body: {
  accountId: string;
  rows: Array<{
    date: string;
    description: string;
    amount: number;
    category?: string;
  }>;
}
Response: {
  rows: Array<{
    date: string;
    description: string;
    amount: number;
    category?: string;
    aiSuggestedCategory?: string;
    aiScore?: number;
    isDuplicate: boolean;
  }>;
}

// Import transactions
POST /api/transactions/import
Body: {
  accountId: string;
  rows: Array<{
    date: string;
    description: string;
    amount: number;
    category?: string;
  }>;
}
Response: {
  imported: number;
  skipped: number;
}

// Get accounts
GET /api/accounts
Response: Array<{
  id: string;
  name: string;
  type: string;
}>
```

## CSV Format

### Required Headers
- **Date**: Transaction date (YYYY-MM-DD or MM/DD/YYYY)
- **Description**: Merchant/payee name
- **Amount**: Transaction amount (positive for expenses)

### Optional Headers
- **Category**: Pre-categorized (will be overridden by AI suggestions if applied)

### Example CSV

```csv
Date,Description,Amount,Category
2024-01-15,Starbucks Coffee,5.50,Dining
2024-01-16,Shell Gas Station,45.00,Transportation
2024-01-17,Amazon.com,129.99,Shopping
```

## Usage Flow

### 1. Navigate to Import
- Click "Import CSV" in sidebar (📥 icon)
- Only visible if `VITE_FEATURE_CSV_IMPORT_V2=true`

### 2. Upload File
- Select account from dropdown
- Click or drag CSV file
- Verify file details
- Click "Next: Map Headers"

### 3. Map Headers
- Review auto-detected mappings
- Adjust mappings if needed
- See sample data for validation
- Click "Next: Preview Transactions"

### 4. Preview & Select
- Review all transactions
- Check AI category suggestions
- Apply suggestions (individual or bulk)
- Uncheck duplicates or unwanted rows
- Click "Import X Transactions"

### 5. Complete
- View import summary
- Import another file OR
- Go to transactions page

## Technical Details

### State Management
- Local state with `useState` for:
  - Current step
  - File data
  - Header mappings
  - Preview rows
  - Statistics
  - Import results

### CSV Parsing
- Custom CSV parser handles:
  - Quoted fields
  - Commas within fields
  - Multiple line formats
- Auto-detects headers by keywords

### Header Auto-Detection
Keywords matched (case-insensitive):
- **Date**: "date", "posted"
- **Description**: "description", "merchant", "payee"
- **Amount**: "amount", "debit", "credit"
- **Category**: "category", "type"

### Row Selection Logic
- **Auto-select**: All non-duplicate rows
- **Cannot select**: Duplicate rows (grayed out)
- **Toggle all**: Affects only non-duplicates

### AI Suggestion Display
- Shows category name + confidence %
- Green checkmark button to apply
- "✓ Applied" badge when already applied
- Purple gradient for AI-related UI elements

## Feature Flag

Controlled by `VITE_FEATURE_CSV_IMPORT_V2`:
- Navigation link shows/hides
- Entire page wrapped in `<FeatureGate>`
- Set to `true` in `.env.development`

## Error Handling

- File validation (CSV only)
- Required field validation (date, description, amount)
- API error handling with toast messages
- Network error retry capability
- Empty selection validation

## Responsive Design

Mobile optimizations:
- Stacked layout for narrow screens
- Scrollable table on mobile
- Full-width buttons
- Simplified step indicators
- Touch-friendly controls

## Build Status

```
✓ 762 modules transformed
✓ built in 411ms
dist/assets/index-2Rm2mqQx.css   31.25 kB (includes CSV Import styles)
dist/assets/index-BQjxUOix.js   639.79 kB
✅ NO TYPESCRIPT ERRORS
```

## Next Steps

This completes **Feature 3 of 10** in Sprint-1 frontend implementation.

**Completed Features:**
1. ✅ Feature Flags System
2. ✅ Insights v2 Dashboard
3. ✅ CSV Import v2

**Remaining Features:**
- Onboarding Wizard with Demo
- Budgets v2 (Rollover + Envelope)
- UX Polish & Accessibility
- Export Center
- PWA + Offline Queue
- Open Banking Stub
- Enhanced Type Safety

## Notes

- CSV parser handles basic CSV format (quoted fields, commas)
- For complex CSV formats, backend should parse
- AI suggestions depend on backend categorizer v2
- Duplicate detection uses transaction hash algorithm
- Import is transactional (all or nothing per backend logic)
- Progress persists within session (no localStorage yet)
