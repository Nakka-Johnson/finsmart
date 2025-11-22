# Insights v2 Dashboard - Sprint-1

## Overview

Complete AI-powered insights dashboard that connects to the Sprint-1 backend endpoints to display:
- **Merchant Insights**: Top spending patterns, trends, and analytics
- **Anomaly Detection**: Unusual transactions with actions (Snooze, Confirm, Ignore)

## Features Implemented

### ✅ Merchant Insights Tab
- Top 10 merchants bar chart (Recharts)
- Sortable table with all merchants
- Trend indicators (📈 increasing, ➡️ stable, 📉 decreasing)
- Merchant detail modal with 6-month trend chart
- Metrics: Total spent, transaction count, average amount, category

### ✅ Anomalies Tab
- Summary cards (New, Snoozed, Total)
- Filter buttons (New, Snoozed, All)
- Color-coded severity badges (High, Medium, Low)
- Anomaly cards with detailed information
- Action buttons:
  - **😴 Snooze**: Review later
  - **✓ Confirm**: Unusual but correct
  - **🚫 Ignore**: Don't flag this pattern again

### ✅ Integration Points

**Backend Endpoints:**
```
GET /api/insights/merchants     → List merchant insights
GET /api/insights/anomalies     → List detected anomalies
POST /api/insights/anomalies/{id}/snooze   → Snooze anomaly
POST /api/insights/anomalies/{id}/confirm  → Confirm anomaly
POST /api/insights/anomalies/{id}/ignore   → Ignore anomaly pattern
```

**Feature Flag:**
- Controlled by `VITE_FEATURE_INSIGHTS_V2=true`
- Navigation menu shows "Insights" link only when enabled
- Entire page wrapped in `<FeatureGate feature="insightsV2">`

## Files Created

### Component Files
- `frontend/src/pages/InsightsPage.tsx` (560 lines)
  - Main dashboard component
  - Merchants tab with charts
  - Anomalies tab with filtering
  - Merchant detail modal

### Styling
- `frontend/src/pages/InsightsPage.css` (670 lines)
  - Complete styling for all components
  - Responsive design (mobile-friendly)
  - Color-coded severity indicators
  - Professional UI polish

### Modified Files
- `frontend/src/App.tsx` - Added `/insights` route
- `frontend/src/components/Shell.tsx` - Added navigation link

## Usage

### Navigation
1. Feature must be enabled: `VITE_FEATURE_INSIGHTS_V2=true`
2. Navigate to **Insights** from sidebar menu (🔍 icon)
3. Toggle between Merchants and Anomalies tabs

### Merchant Insights
- View top 10 spending chart
- Click "Details" button for merchant drill-down
- See 6-month trend in modal

### Anomaly Management
- Review new anomalies (red badge shows count)
- Filter by status (New/Snoozed/All)
- Take action on each anomaly:
  - Snooze to review later
  - Confirm if transaction is valid
  - Ignore to exclude pattern from future detection

## API Data Format

### Merchant Insight
```typescript
interface MerchantInsight {
  merchant: string;
  totalSpent: number;
  transactionCount: number;
  avgAmount: number;
  category: string;
  trend: 'increasing' | 'stable' | 'decreasing';
  monthlyData?: Array<{
    month: string;
    amount: number;
  }>;
}
```

### Anomaly
```typescript
interface Anomaly {
  id: number;
  transactionId: number;
  merchant: string;
  amount: number;
  category: string;
  date: string;
  reason: string;
  status: 'new' | 'snoozed' | 'confirmed' | 'ignored';
  severity: 'high' | 'medium' | 'low';
}
```

## Technical Details

### Dependencies Used
- **React 19.1.1** - Component framework
- **Recharts 3.3.0** - Charts (BarChart, LineChart)
- **TypeScript** - Type safety
- **Feature Flags** - Conditional rendering

### State Management
- Local state with `useState` for:
  - Active tab selection
  - Merchant/anomaly data
  - Loading/error states
  - Modal visibility
  - Filters

### Error Handling
- Try-catch for API calls
- Error banner with retry button
- Loading states with spinner
- Empty states for no data

### Responsive Design
- Mobile-friendly breakpoints
- Scrollable tables on small screens
- Stacked action buttons on mobile
- Full-screen modals on small devices

## Testing the Feature

### 1. Start Backend
```bash
cd backend
mvn spring-boot:run
# Backend should run on port 8081
```

### 2. Start AI Service
```bash
cd ai
# Assuming Python AI service runs on port 5001
```

### 3. Start Frontend
```bash
cd frontend
npm run dev
# Frontend runs on port 5173
```

### 4. Navigate to Insights
- Login to the application
- Click "Insights" in sidebar
- View merchant insights and anomalies

## Next Steps

This completes **Feature 2 of 10** in Sprint-1 frontend implementation.

**Remaining Features:**
- CSV Import v2 UI
- Onboarding Wizard
- Budgets v2 (Rollover + Envelope)
- UX Polish & Accessibility
- Export Center
- PWA + Offline Queue
- Open Banking Stub
- Enhanced Error Handling

## Notes

- Backend endpoints must return data in the expected format
- Feature flag must be enabled in `.env.development`
- Charts require Recharts library (already installed)
- All actions are async with proper error handling
- Modal uses overlay pattern for UX
- Severity colors: Red (high), Orange (medium), Green (low)
