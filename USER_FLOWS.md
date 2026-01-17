# Technova - User Flows Guide

## 🔐 Authentication Flows

### 1. Sign Up Flow (Email/Password)

**Step 1: Choose Role**
- User visits `/signup`
- Selects role: **Investor** or **Advisor**
- Fills in: Name, Email, Password
- Clicks "Create Account"

**Step 2: Automatic Redirection**
- **If Investor**: → `/investor/dashboard`
- **If Advisor**: → `/advisor/onboarding`

### 2. Sign Up Flow (Google OAuth)

**Step 1: Choose Role**
- User visits `/signup`
- Selects role: **Investor** or **Advisor**
- Clicks "Sign up with Google"

**Step 2: Google Authentication**
- Google popup appears
- User selects Google account
- Grants permissions

**Step 3: Automatic Redirection**
- **If Investor**: → `/investor/dashboard`
- **If Advisor**: → `/advisor/onboarding`

### 3. Login Flow (Email/Password)

**Step 1: Login**
- User visits `/login`
- Can toggle between Investor/Advisor view (visual only)
- Enters: Email, Password
- Clicks "Sign In"

**Step 2: Automatic Redirection (Based on Account Type)**
- **If Investor**: → `/investor/dashboard`
- **If Advisor (Not Verified)**: → `/advisor/onboarding`
- **If Advisor (Verified)**: → `/advisor/dashboard`
- **If Admin**: → `/admin/panel`

### 4. Login Flow (Google OAuth)

**Step 1: Login**
- User visits `/login`
- Clicks "Sign in with Google"
- Google popup appears

**Step 2: Automatic Redirection (Based on Account Type)**
- **If Existing User**: Redirected based on their role
- **If New User**: → `/role-selection` (legacy flow, now replaced by signup)

---

## 👨‍💼 Advisor Journey

### Step 1: Sign Up
- Choose "Advisor" role
- Complete signup (email or Google)
- → Redirected to `/advisor/onboarding`

### Step 2: Onboarding (Multi-Step)

**Phase 1: Phone Verification**
- Enter phone number
- Click "Send OTP"
- Receive SMS with 6-digit code
- Enter OTP and verify

**Phase 2: SEBI Registration**
- Enter SEBI registration number
- Write bio (optional, 500 chars)
- Upload SEBI certificate (PDF/Image, max 5MB)
- Click "Submit Application"

**Phase 3: Waiting for Approval**
- Application submitted
- Status: "Pending Admin Approval"
- Cannot create signals yet

### Step 3: Admin Approval
- Admin reviews SEBI certificate
- Admin approves application
- **Solana wallet automatically generated**
- Advisor receives notification

### Step 4: Advisor Dashboard
- Access full dashboard at `/advisor/dashboard`
- View stats: Subscribers, Trades, Win Rate, Trust Score
- Create trading signals
- Manage active trades
- Edit SL/Target
- Close trades manually

---

## 👨‍💻 Investor Journey

### Step 1: Sign Up
- Choose "Investor" role
- Complete signup (email or Google)
- → Redirected to `/investor/dashboard`

### Step 2: Investor Dashboard
- View portfolio stats: Balance, Active Trades, Win Rate, Net P&L
- Default balance: ₹1,00,000 (virtual)

### Step 3: Discovery Feed
- Browse live trading signals from verified advisors
- Filter by:
  - Asset Class (Equity/Futures/Options)
  - Risk Level (Low/Medium/High)
- See advisor stats: Trust Score, Win Rate
- Real-time new signal notifications

### Step 4: Paper Trading
- Click "Follow Signal" on any signal
- Enter quantity to trade
- Virtual trade is created
- Balance is deducted

### Step 5: Portfolio Management
- Switch to "My Portfolio" tab
- View active paper trades
- View closed paper trades with P&L
- Close trades manually
- Track overall performance

### Step 6: Blockchain Verification (Coming Soon)
- Click "Verify on Chain" for any advisor
- View blockchain vs app data comparison
- See Solana transaction IDs
- Verify trade authenticity

---

## 👨‍💼 Admin Journey (Coming Soon)

### Step 1: Login
- Login with admin credentials
- → Redirected to `/admin/panel`

### Step 2: Verification Queue
- View pending advisor applications
- Review SEBI certificates
- Approve or reject applications
- Solana wallet auto-generated on approval

### Step 3: System Monitoring
- View system health metrics
- Monitor API latency
- Check Solana transaction status
- View admin action logs

### Step 4: Dispute Resolution
- Review disputed trades
- Manually correct trade data
- All actions are logged for audit

---

## 🔄 Key User Interactions

### Creating a Signal (Advisor)
1. Click "Create Signal" button
2. Enter symbol (e.g., "NIFTY 25JAN 18000 CE")
3. Select direction (Buy/Sell)
4. Choose order type (Market/Limit/Stop-Limit)
5. Enter quantity
6. **Mandatory**: Set Stop Loss
7. **Mandatory**: Set Target
8. Add notes (optional)
9. Click "Create Signal"
10. Signal appears in Discovery Feed instantly (Socket.io)

### Following a Signal (Investor)
1. Browse Discovery Feed
2. Find interesting signal
3. Click "Follow Signal"
4. Enter quantity
5. Confirm
6. Paper trade created
7. Balance deducted
8. Trade appears in "My Portfolio"

### Closing a Trade (Advisor)
1. Go to Active Trades table
2. Click close icon (X)
3. Confirm closure
4. Trade is closed at current market price
5. P&L calculated automatically
6. Trade written to Solana blockchain
7. Trust score updated (next cron run)
8. All followers' paper trades also closed

### Modifying a Trade (Advisor)
1. Go to Active Trades table
2. Click edit icon (pencil)
3. Modify Stop Loss or Target
4. Click "Save"
5. Changes synced to Supabase
6. Real-time update sent to all followers

---

## 🎯 Role Differences

| Feature | Investor | Advisor | Admin |
|---------|----------|---------|-------|
| View Signals | ✅ | ✅ | ✅ |
| Create Signals | ❌ | ✅ | ❌ |
| Paper Trading | ✅ | ❌ | ❌ |
| Real Trading | ❌ | ✅ | ❌ |
| Verify Advisors | ❌ | ❌ | ✅ |
| View Analytics | Own | Own | All |
| Blockchain Verify | ✅ | ✅ | ✅ |

---

## 📱 Navigation Map

```
/
├── /login (Public)
├── /signup (Public)
├── /role-selection (Legacy - for Google OAuth new users)
│
├── /advisor/
│   ├── /onboarding (Advisor only, unverified)
│   └── /dashboard (Advisor only, verified)
│
├── /investor/
│   └── /dashboard (Investor only)
│
└── /admin/
    └── /panel (Admin only)
```

---

## 🔔 Real-Time Events

### Advisor Receives:
- `trade-update` - When trade is modified
- `target-hit` - When target is reached
- `sl-hit` - When stop loss is hit
- `trade-closed` - When trade is closed
- `trust-score-update` - When trust score is recalculated

### Investor Receives:
- `new-signal` - When new signal is created
- `signal-closed` - When followed signal is closed
- `paper-trade-update` - When paper trade is updated

---

## 💡 Tips for Users

### For Investors:
- Start with low-risk signals to learn
- Diversify across multiple advisors
- Check advisor trust scores before following
- Use blockchain verification to ensure transparency
- Monitor your paper trading balance

### For Advisors:
- Always set realistic Stop Loss and Targets
- Maintain good risk-reward ratios (1:2 or better)
- Close losing trades quickly to protect trust score
- Add detailed notes to help investors understand your strategy
- Build consistency to improve trust score

### For Admins:
- Verify SEBI certificates carefully
- Check registration numbers on SEBI website
- Monitor system health regularly
- Review dispute cases thoroughly
- Keep audit logs for compliance

---

**Built for Technova Hackathon 2026** 🚀
