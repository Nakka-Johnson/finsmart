# Sprint R1 Premium UX - Integration Guide

## ✅ Completed Components

### Design System Foundation
- **tokens.css** - Complete design system with color primitives, spacing, typography, shadows, light/dark themes
- **useTheme.ts** - Theme management hook with localStorage persistence
- **Base UI Components:**
  - Button (variants: primary, secondary, ghost, danger, success)
  - Card (with subcomponents: Header, Title, Description, Content, Footer)
  - Input (with label, error, hint, icons)
  - Select (dropdown with placeholder)
  - Badge (with ConfidenceBadge for ML predictions)
  - Modal (with keyboard navigation and backdrop)
  - Table (with sorting, striping, hoverable rows)
  - Skeleton (loading states with pulse/wave animations)
  - Toast (notification system with portal rendering)

### Application Shell
- **AppShell.tsx** - Premium sidebar + top bar layout with:
  - Collapsible sidebar (desktop) / slide-in drawer (mobile)
  - Navigation items with active states
  - Theme toggle (dark/light/system)
  - Search button for command palette
  - User menu with avatar and logout
  - Mobile-responsive with hamburger menu

### Command Palette
- **CommandPalette.tsx** - Spotlight-style quick actions (Ctrl/Cmd+K):
  - Navigation commands (Dashboard, Transactions, Accounts, Insights, Settings)
  - Theme switching commands
  - Keyboard navigation (↑↓ arrows, Enter, Escape)
  - Fuzzy search filtering
  - Grouped by category

### Dashboard Widgets
- **CashRunwayWidget.tsx** - 30-day cash flow forecast with:
  - Current balance display
  - Days until low threshold alert
  - Predicted balance chart with confidence bounds
  - Status indicators (healthy/moderate/low)

- **NarrativeCard.tsx** - AI-generated insights with:
  - Natural language summary
  - Bullet-point highlights
  - Top spending category
  - Trend indicators (up/down/stable)

- **AnomalyInbox.tsx** - Flagged unusual transactions with:
  - Anomaly score badges
  - Reason for flagging
  - Quick preview of recent anomalies
  - "View all" button to filter transactions

### Transaction Enhancements
- **MerchantChip.tsx** - Merchant name display with:
  - AI-normalized merchant names
  - Original transaction description on hover
  - Confidence indicator (high/medium/low)
  - AI badge showing normalization

- **CategoryPill.tsx** - Category display with:
  - Color-coded by category type
  - Icon per category
  - Confidence score badge
  - Clickable to show explanation

- **WhyDrawer.tsx** - AI explanation modal with:
  - Natural language explanation
  - Contributing factors list
  - Feedback mechanism (user corrections)
  - Category/anomaly type support

### AI API Integration
- **ai.ts** - Complete AI service client with:
  - `normaliseMerchants()` - Clean up merchant names
  - `predictCategories()` - ML category predictions
  - `scoreAnomalies()` - Detect unusual transactions
  - `getCashFlowForecast()` - Future balance predictions
  - `getSpendingInsights()` - Trend analysis
  - `getCashRunway()` - Days until low balance
  - `getNarrativeInsight()` - Natural language summary
  - `getRecentAnomalies()` - Latest flagged transactions
  - `submitFeedback()` - User corrections for ML
  - `getExplanation()` - Why this prediction?

### New Pages
- **DashboardV2.tsx** - Premium dashboard with:
  - Hero widget grid (Cash Runway, Narrative, Anomaly Inbox)
  - Quick stats cards (Spending, Income, Net Flow)
  - Cash flow trend chart (6 months)
  - Spending by category bars
  - AI financial summary card

## 🔧 Integration Steps

### Option 1: Replace Existing Shell (Recommended)

**Update App.tsx:**
```tsx
import { PremiumShell } from '@/components/PremiumShell';

// Replace all <Shell> with <PremiumShell>
<Route
  path="/dashboard"
  element={
    <PremiumShell>
      <Guard>
        <DashboardV2 />  {/* Use new dashboard */}
      </Guard>
    </PremiumShell>
  }
/>
```

### Option 2: Side-by-Side (For Testing)

Keep old routes and add new ones:
```tsx
// Old dashboard (existing Shell)
<Route path="/dashboard" element={<Shell><Guard><Dashboard /></Guard></Shell>} />

// New premium dashboard
<Route path="/dashboard-v2" element={<PremiumShell><Guard><DashboardV2 /></Guard></PremiumShell>} />
```

### Option 3: Feature Flag

```tsx
const USE_PREMIUM_UX = import.meta.env.VITE_PREMIUM_UX === 'true';
const ShellComponent = USE_PREMIUM_UX ? PremiumShell : Shell;
const DashboardComponent = USE_PREMIUM_UX ? DashboardV2 : Dashboard;
```

## 📝 Usage Examples

### Using Design System Components

```tsx
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '@/ui';

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
        <Badge variant="success">New</Badge>
      </CardHeader>
      <CardContent>
        <Button variant="primary" onClick={handleClick}>
          Click Me
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Using Theme Hook

```tsx
import { useTheme } from '@/hooks/useTheme';

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>{isDark ? '☀️' : '🌙'}</button>;
}
```

### Using Toast Notifications

```tsx
import { toast } from '@/ui/Toast';

function MyComponent() {
  const handleSave = async () => {
    try {
      await saveData();
      toast.success('Saved successfully!');
    } catch (error) {
      toast.error('Failed to save', error.message);
    }
  };
}
```

### Displaying Transaction with Premium Components

```tsx
import { MerchantChip } from '@/components/MerchantChip';
import { CategoryPill } from '@/components/CategoryPill';
import { WhyDrawer } from '@/components/WhyDrawer';

function TransactionRow({ transaction }) {
  const [whyOpen, setWhyOpen] = useState(false);

  return (
    <>
      <tr>
        <td>
          <MerchantChip
            original={transaction.description}
            normalised={transaction.normalisedMerchant}
            confidence={transaction.merchantConfidence}
          />
        </td>
        <td>
          <CategoryPill
            category={transaction.category}
            confidence={transaction.categoryConfidence}
            onClick={() => setWhyOpen(true)}
          />
        </td>
      </tr>
      <WhyDrawer
        open={whyOpen}
        onClose={() => setWhyOpen(false)}
        transactionId={transaction.id}
        type="category"
        currentValue={transaction.category}
        confidence={transaction.categoryConfidence}
      />
    </>
  );
}
```

## 🎨 Theming

The design system uses CSS custom properties defined in `tokens.css`:

- **Colors:** Primary, positive, danger, warning, info with subtle/hover/active variants
- **Spacing:** 8-point grid (space-1 through space-16)
- **Typography:** Text sizes (xs, sm, base, lg, xl, 2xl, 3xl)
- **Shadows:** sm, md, lg, xl for elevation
- **Transitions:** fast (150ms), normal (250ms), slow (350ms)

Themes automatically switch based on `data-theme` attribute on root element.

## 🚀 Testing Premium UX

1. **Start backend:** `./backend> mvnw spring-boot:run`
2. **Start frontend:** `./frontend> npm run dev`
3. **Login** with test credentials (see TEST_CREDENTIALS.md)
4. **Test features:**
   - Press `Ctrl+K` to open command palette
   - Toggle theme with sun/moon icon in sidebar
   - View dashboard hero widgets (cash runway, narrative, anomalies)
   - Click category pills on transactions to see "Why?" explanations
   - Submit feedback to correct AI predictions

## 📦 File Structure

```
frontend/src/
├── ui/                          # Base design system components
│   ├── tokens.css              # Design system tokens
│   ├── Button.tsx/css
│   ├── Card.tsx/css
│   ├── Input.tsx/css
│   ├── Select.tsx/css
│   ├── Badge.tsx/css
│   ├── Modal.tsx/css
│   ├── Table.tsx/css
│   ├── Skeleton.tsx/css
│   ├── Toast.tsx/css
│   └── index.ts                # Barrel exports
├── components/
│   ├── AppShell.tsx/css        # Premium sidebar + topbar
│   ├── CommandPalette.tsx/css  # Ctrl+K quick actions
│   ├── PremiumShell.tsx        # Shell wrapper with palette + toasts
│   ├── MerchantChip.tsx/css    # AI-normalized merchants
│   ├── CategoryPill.tsx/css    # ML category predictions
│   ├── WhyDrawer.tsx/css       # AI explanation modal
│   └── widgets/
│       ├── CashRunwayWidget.tsx/css
│       ├── NarrativeCard.tsx/css
│       ├── AnomalyInbox.tsx/css
│       └── index.ts
├── hooks/
│   └── useTheme.ts             # Dark/light theme management
├── api/
│   └── ai.ts                   # AI service client functions
├── pages/
│   └── DashboardV2.tsx/css     # Premium dashboard
└── utils/
    └── clsx.ts                 # Conditional className utility
```

## 🐛 Troubleshooting

### "Module not found" errors
- Run `npm install` to ensure all dependencies are installed
- Check imports use correct path aliases (`@/` or relative paths)

### Theme not switching
- Check `data-theme` attribute on `<html>` element
- Clear browser cache/localStorage
- Verify `initializeTheme()` is called in PremiumShell

### Command palette not opening
- Check keyboard shortcut handler in AppShell
- Verify `onCommandPaletteOpen` prop is passed correctly
- Check browser console for errors

### AI features show "Demo Data"
- This is normal - backend returns mock data when AI service is unavailable
- Real AI requires service running on http://127.0.0.1:8001
- Demo data allows testing UX without AI dependency

### Login redirect loops
- Clear browser localStorage/sessionStorage
- Check Guard component console logs
- Verify token is being stored correctly
- Try registering a new account

## 🎯 Next Steps

1. **Integrate into existing routes** - Replace old Shell with PremiumShell
2. **Update Transactions page** - Add MerchantChip and CategoryPill to transaction rows
3. **Test AI endpoints** - Connect to real AI service when available
4. **Customize theme** - Adjust color tokens in tokens.css for brand alignment
5. **Add more widgets** - Create additional dashboard widgets as needed
6. **Mobile optimization** - Test and refine responsive behavior
7. **Accessibility audit** - Verify keyboard navigation and screen reader support

## 📄 Related Files

- `TEST_CREDENTIALS.md` - Test account details
- `tokens.css` - Design system tokens reference
- `README.md` - Project setup and architecture
