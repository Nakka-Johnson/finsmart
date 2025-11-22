# Onboarding Wizard - Sprint-1 Feature 4

## Overview
Multi-step onboarding wizard for new users with optional demo data injection. Provides a smooth first-time experience and showcases all FinSmart features.

## Features Implemented

### 1. **4-Step Wizard Flow**
- **Welcome Step**: Feature showcase with animated cards
- **Account Setup**: Create initial financial accounts
- **Demo Data**: Optional sample transactions & budgets
- **Complete**: Success animation with auto-redirect

### 2. **Account Creation**
- Multiple account support
- Account types: Checking, Savings, Credit Card
- Initial balance setting
- Add/Remove accounts dynamically
- Validation (minimum 1 account required)

### 3. **Demo Data Option**
- Toggle to enable/disable demo data
- Preview of what demo data includes:
  - 3 months of sample transactions
  - Auto-categorized expenses
  - Pre-configured budgets
  - AI insights ready to explore
- Helps users understand app capabilities immediately

### 4. **Progress Tracking**
- Visual progress bar (25%, 50%, 75%, 100%)
- Step navigation (Next/Back)
- Skip option on welcome screen
- Loading states during API calls

### 5. **Animations & UX**
- Smooth step transitions (fadeIn)
- Welcome wave animation
- Feature card hover effects
- Success checkmark animation
- Loading dots on completion

## Backend Integration

### Endpoints Used

**1. Create Account**
```http
POST /api/accounts
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "My Checking",
  "type": "CHECKING",
  "balance": 1000.00
}
```

**2. Load Demo Data** (Optional)
```http
POST /api/admin/demo-data
Authorization: Bearer {token}
```

## Component Structure

```
OnboardingPage (Main)
├── WelcomeStep
│   ├── Feature grid (4 cards)
│   └── Actions (Skip / Get Started)
├── AccountSetupStep
│   ├── Account rows (dynamic list)
│   │   ├── Name input
│   │   ├── Type select
│   │   ├── Balance input
│   │   └── Remove button
│   ├── Add account button
│   └── Actions (Back / Continue)
├── DemoDataStep
│   ├── Demo toggle switch
│   ├── Demo preview (conditional)
│   │   ├── Features list
│   │   └── Note about deletion
│   └── Actions (Back / Finish)
└── CompleteStep
    ├── Success animation
    └── Auto-redirect to dashboard
```

## Usage Flow

### New User Journey
1. User registers and logs in
2. Redirected to `/onboarding` (or clicks "Try Demo" in nav)
3. Sees welcome screen with feature highlights
4. Sets up initial accounts (name, type, balance)
5. Chooses whether to load demo data
6. Accounts created + demo data loaded (if selected)
7. Success screen → Auto-redirect to dashboard
8. Ready to explore FinSmart!

### Accessing Onboarding
- **Route**: `/onboarding`
- **Navigation**: "Try Demo" link in sidebar (when `demo` flag enabled)
- **Feature Flag**: `demo` (VITE_FEATURE_DEMO)

## Technical Implementation

### State Management
```typescript
type OnboardingStep = 'welcome' | 'account-setup' | 'demo-data' | 'complete';

interface Account {
  name: string;
  type: 'checking' | 'savings' | 'credit';
  balance: string;
}

const [step, setStep] = useState<OnboardingStep>('welcome');
const [accounts, setAccounts] = useState<Account[]>([...]);
const [useDemoData, setUseDemoData] = useState(false);
const [loading, setLoading] = useState(false);
```

### Validation
- **Account Name**: Must not be empty
- **Balance**: Must be a valid number (defaults to 0)
- **Minimum Accounts**: At least 1 account required
- Form validation prevents continuing with invalid data

### API Integration
- Uses Zustand auth store for token
- Handles errors with toast notifications
- Loading states during async operations
- Graceful fallback if demo data endpoint unavailable

## Styling Highlights

### Design System
- **Primary Gradient**: Purple gradient (#667eea → #764ba2)
- **Card Style**: Subtle gray backgrounds with hover effects
- **Animations**: Smooth transitions, spring-like effects
- **Typography**: Clear hierarchy, readable sizes

### Responsive Design
- **Desktop**: Full-width cards, 2-column feature grid
- **Tablet**: Single-column layout
- **Mobile**: Stacked elements, bottom action buttons

### Key Animations
```css
@keyframes wave { /* Welcome icon wave */ }
@keyframes scaleIn { /* Success checkmark appear */ }
@keyframes bounce { /* Loading dots */ }
@keyframes expandDown { /* Demo preview expand */ }
```

## Files Created
1. **OnboardingPage.tsx** (540 lines) - Main wizard logic
2. **OnboardingPage.css** (660 lines) - Complete styling

## Build Status
✅ **Build**: SUCCESS (337ms)
✅ **TypeScript**: No errors
✅ **Bundle Size**: 38.50 KB CSS, 648.32 KB JS

## Next Steps
- Consider adding progress persistence (localStorage)
- Add analytics tracking for step completion
- Create automated onboarding trigger for first-time users
- Add skip confirmation dialog
- Create demo data deletion UI in settings

## Feature Flag
Controlled by `demo` feature flag:
```env
VITE_FEATURE_DEMO=true
```

---

**Status**: ✅ Complete  
**Sprint**: 1  
**Feature**: #4 (Onboarding Wizard)  
**Progress**: 40% of Sprint-1 frontend (4/10 features)
