# Technova - Testing Guide

## 🧪 How to Test the Application

### Prerequisites
- ✅ Backend running on http://localhost:8901
- ✅ Frontend running on http://localhost:5173
- ✅ MongoDB connected
- ✅ Firebase configured (restart Vite if you just added env vars)

---

## 🎯 Test Scenario 1: Investor Flow

### Step 1: Sign Up as Investor
1. Navigate to http://localhost:5173/signup
2. Select **"Investor"** role (left card)
3. Fill in:
   - Name: "Test Investor"
   - Email: "investor@test.com"
   - Password: "password123"
4. Click "Create Account"
5. ✅ **Expected**: Redirected to `/investor/dashboard`

### Step 2: Explore Investor Dashboard
1. ✅ **Expected**: See 4 stat cards:
   - Paper Trading Balance: ₹1,00,000
   - Active Trades: 0
   - Win Rate: 0%
   - Net P&L: ₹0

2. ✅ **Expected**: See two tabs:
   - "Discovery Feed" (active)
   - "My Portfolio"

### Step 3: View Discovery Feed
1. Click "Discovery Feed" tab
2. ✅ **Expected**: See message "No signals available" (no advisors have created signals yet)

### Step 4: View Portfolio
1. Click "My Portfolio" tab
2. ✅ **Expected**: See "No active trades" message

---

## 🎯 Test Scenario 2: Advisor Flow

### Step 1: Sign Up as Advisor
1. Open new incognito window or logout
2. Navigate to http://localhost:5173/signup
3. Select **"Advisor"** role (right card)
4. Fill in:
   - Name: "Test Advisor"
   - Email: "advisor@test.com"
   - Password: "password123"
5. Click "Create Account"
6. ✅ **Expected**: Redirected to `/advisor/onboarding`

### Step 2: Complete Onboarding

**Phase 1: Phone Verification**
1. Enter phone: "1234567890"
2. Click "Send OTP"
3. ✅ **Expected**: See console log with OTP (mock mode)
4. Check backend console for: `[MOCK SMS] OTP for 1234567890: XXXXXX`
5. Enter the OTP from console
6. Click "Verify OTP"
7. ✅ **Expected**: Progress to step 3

**Phase 2: SEBI Registration**
1. Enter SEBI Registration Number: "INH000001234"
2. Enter Bio: "Experienced trader with 5 years in F&O"
3. Upload SEBI Certificate (any PDF or image file)
4. Click "Submit Application"
5. ✅ **Expected**: See success screen "Application Submitted!"

### Step 3: Manual Admin Approval (For Testing)

**Option A: Using MongoDB Compass/Shell**
```javascript
db.users.updateOne(
  { email: "advisor@test.com" },
  { 
    $set: { 
      isVerified: true, 
      verificationStatus: "approved",
      solanaWallet: "mock_solana_wallet_address_123"
    } 
  }
)
```

**Option B: Using Backend Script**
Create a test script or use the admin API (when admin panel is built)

### Step 4: Access Advisor Dashboard
1. Logout and login again as advisor@test.com
2. ✅ **Expected**: Redirected to `/advisor/dashboard`
3. ✅ **Expected**: See 4 stat cards:
   - Subscribers: 0
   - Total Trades: 0
   - Win Rate: 0%
   - Trust Score: 0/100

### Step 5: Create a Signal
1. Click "Create Signal" button
2. Fill in the form:
   - Symbol: "NIFTY 25JAN 18000 CE"
   - Direction: Buy
   - Order Type: Market
   - Quantity: 50
   - Stop Loss: 140
   - Target: 180
   - Notes: "Bullish on NIFTY"
3. Click "Create Signal"
4. ✅ **Expected**: 
   - Toast: "Signal created successfully!"
   - Modal closes
   - Signal appears in Active Trades table

### Step 6: Verify Real-Time Updates
1. Keep advisor dashboard open
2. Open investor dashboard in another tab/window
3. ✅ **Expected**: Signal appears in investor's Discovery Feed instantly
4. ✅ **Expected**: Investor sees advisor name, trust score, and signal details

---

## 🎯 Test Scenario 3: Paper Trading Flow

### Step 1: Investor Follows Signal
1. Login as investor
2. Go to Discovery Feed
3. Find the signal created by advisor
4. Click "Follow Signal"
5. Enter quantity: 50
6. ✅ **Expected**: 
   - Toast: "Signal followed successfully!"
   - Balance deducted (₹1,00,000 - entry_price × 50)

### Step 2: View Paper Trade
1. Switch to "My Portfolio" tab
2. Click "Active Trades"
3. ✅ **Expected**: See the paper trade in the table
4. ✅ **Expected**: Shows symbol, advisor, direction, entry, target, qty

### Step 3: Advisor Closes Trade
1. Switch to advisor dashboard
2. In Active Trades table, click close icon (X)
3. Confirm closure
4. ✅ **Expected**:
   - Trade closed
   - P&L calculated
   - Trade removed from Active Trades

### Step 4: Investor Sees Closed Trade
1. Switch to investor dashboard
2. Go to "My Portfolio" → "Closed Trades"
3. ✅ **Expected**:
   - Paper trade appears in closed trades
   - Shows P&L (profit or loss)
   - Balance updated with P&L

---

## 🎯 Test Scenario 4: Real-Time Updates

### Setup
1. Open advisor dashboard in one browser window
2. Open investor dashboard in another window
3. Open browser console in both to see Socket.io logs

### Test 1: New Signal
1. Advisor creates a signal
2. ✅ **Expected in Investor Window**:
   - Toast notification: "New signal: NIFTY 25JAN 18000 CE"
   - Signal appears at top of Discovery Feed
   - No page refresh needed

### Test 2: Trade Modification
1. Advisor edits SL/Target of active trade
2. ✅ **Expected in Investor Window**:
   - Paper trade updates automatically
   - New SL/Target values reflected

### Test 3: Trade Closure
1. Advisor closes a trade
2. ✅ **Expected in Investor Window**:
   - Paper trade moves to "Closed Trades"
   - P&L calculated and displayed
   - Balance updated

---

## 🐛 Common Issues & Solutions

### Issue 1: "Failed to fetch user data" (401 Error)
**Cause**: Not logged in or session expired  
**Solution**: 
- Login again
- Check if cookies are enabled
- Verify `withCredentials: true` in axios calls

### Issue 2: Firebase Invalid API Key
**Cause**: Environment variables not loaded  
**Solution**:
1. Stop Vite dev server (Ctrl+C)
2. Verify `.env` file has all VITE_FIREBASE_* variables
3. Restart: `npm run dev`
4. Hard refresh browser (Ctrl+Shift+R)

### Issue 3: "Signal created" but not appearing
**Cause**: Socket.io not connected  
**Solution**:
- Check browser console for Socket.io connection logs
- Verify backend is running
- Check CORS configuration

### Issue 4: File upload failing
**Cause**: Cloudinary not configured  
**Solution**:
- Add Cloudinary credentials to backend `.env`
- Restart backend server
- Try upload again

### Issue 5: OTP not received
**Cause**: Twilio not configured (using mock mode)  
**Solution**:
- Check backend console for: `[MOCK SMS] OTP for ...`
- Copy OTP from console
- Enter in frontend
- For production: Add real Twilio credentials

---

## ✅ Testing Checklist

### Authentication
- [ ] Email signup as investor
- [ ] Email signup as advisor
- [ ] Google signup as investor
- [ ] Google signup as advisor
- [ ] Email login (existing user)
- [ ] Google login (existing user)
- [ ] Logout functionality
- [ ] Role-based redirection

### Advisor Flow
- [ ] Onboarding: Phone verification
- [ ] Onboarding: OTP verification
- [ ] Onboarding: SEBI upload
- [ ] Dashboard: View stats
- [ ] Create signal (market order)
- [ ] Create signal (limit order)
- [ ] View active trades
- [ ] Edit SL/Target
- [ ] Close trade manually

### Investor Flow
- [ ] Dashboard: View stats
- [ ] Discovery feed: View signals
- [ ] Filter by asset class
- [ ] Filter by risk level
- [ ] Follow a signal
- [ ] View active paper trades
- [ ] View closed paper trades
- [ ] Close paper trade manually
- [ ] Check P&L calculation

### Real-Time Features
- [ ] New signal notification
- [ ] Trade update notification
- [ ] Trade closure notification
- [ ] Socket.io connection status

### UI/UX
- [ ] Responsive on mobile
- [ ] Responsive on tablet
- [ ] Responsive on desktop
- [ ] Loading states work
- [ ] Error messages display
- [ ] Toast notifications work
- [ ] Forms validate properly

---

## 🎬 Demo Script

### For Hackathon Demo (5 minutes)

**Minute 1: Introduction**
- "Technova is a blockchain-verified trading signals platform"
- "Connects SEBI-registered advisors with investors"
- "All trades are transparently recorded on Solana blockchain"

**Minute 2: Advisor Flow**
- Show signup as advisor
- Complete onboarding (phone + SEBI)
- Show dashboard with stats
- Create a live signal

**Minute 3: Investor Flow**
- Show signup as investor
- Browse discovery feed
- Follow the advisor's signal
- Show paper trading portfolio

**Minute 4: Real-Time Features**
- Advisor modifies trade (show instant update on investor side)
- Advisor closes trade
- Show P&L calculation
- Show trust score update

**Minute 5: Unique Features**
- Blockchain verification (show Solana wallet)
- Trust score algorithm explanation
- Admin approval workflow
- SMS 2FA security

---

## 📊 Expected Test Results

### After Creating 5 Signals (3 Wins, 2 Losses)

**Advisor Stats:**
- Total Trades: 5
- Win Rate: 60%
- Trust Score: ~45-55 (depends on R:R ratios)
- Net P&L: Positive (if wins > losses)

**Investor Stats (if followed all):**
- Active Trades: 0 (all closed)
- Total Trades: 5
- Win Rate: 60%
- Net P&L: Mirrors advisor's performance

---

**Ready to Test!** 🚀

Start with Scenario 1 (Investor Flow) and Scenario 2 (Advisor Flow) to verify the complete user journey.
