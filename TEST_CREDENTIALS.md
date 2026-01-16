# Test Credentials for FinSmart

## Demo Account

**Email:** `demo@finsmart.com`  
**Password:** `demo123`

## Alternative Test Account

**Email:** `user@example.com`  
**Password:** `password123`

---

**Note:** If these accounts don't exist yet, you can register a new account using any email and password. The backend accepts any valid registration.

## Quick Start

1. Navigate to http://localhost:5173
2. Click "Register" if you don't have an account
3. Use any email/password combination to register
4. After registration, you'll be automatically logged in
5. Or use the demo credentials above if already seeded

## Features to Test

### Premium UX Features (Sprint R1)
- ✅ **Dark/Light Theme Toggle** - Click sun/moon icon in sidebar
- ✅ **Command Palette** - Press `Ctrl+K` (Windows) or `Cmd+K` (Mac)
- ✅ **Cash Runway Widget** - View 30-day cash forecast on dashboard
- ✅ **AI Narrative Card** - See AI-generated spending insights
- ✅ **Anomaly Inbox** - Review flagged unusual transactions
- ✅ **Merchant Chips** - AI-normalized merchant names on transactions
- ✅ **Category Pills** - ML-predicted categories with confidence scores
- ✅ **Why Drawer** - Click category pills to see AI explanation

### Navigation
- Dashboard (hero widgets with cash runway, insights, anomalies)
- Transactions (with merchant chips and category pills)
- Accounts
- Insights
- Settings

### Keyboard Shortcuts
- `Ctrl/Cmd + K` - Open command palette
- `↑↓` - Navigate command palette
- `Enter` - Execute command
- `Esc` - Close modals/palette

## Troubleshooting

If login fails:
1. Check backend is running on http://localhost:8080
2. Check browser console for errors
3. Try registering a new account
4. Verify JWT token in browser localStorage/sessionStorage

If AI features show "Demo Data":
- Backend AI endpoints are returning mock data (this is normal for development)
- Real AI integration requires the AI service running on http://127.0.0.1:8001
