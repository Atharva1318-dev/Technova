# Testing the Trade Monitoring System

## Prerequisites

### 1. Start the Backend Server
```bash
cd backend
npm start
```

**Expected Output**:
```
🚀 Server is running on port 8901
📡 Socket.io is ready for real-time connections
⏰ Trust score cron job is scheduled
🔄 Restarted 0 trade monitors
```

### 2. Get Your Auth Token
You need a valid JWT token for an advisor account.

**Option A: Login via API**
```bash
curl -X POST http://localhost:8901/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your_advisor_email@example.com",
    "password": "your_password"
  }'
```

**Option B: Check your browser's localStorage** (if using the frontend)

---

## Running the Tests

### Method 1: Using the Test Script

```bash
cd backend/test
node testMonitor.js YOUR_AUTH_TOKEN
```

Replace `YOUR_AUTH_TOKEN` with your actual JWT token.

### Method 2: Manual API Testing

#### Step 1: Check Server Health
```bash
curl http://localhost:8901/
```

**Expected Response**:
```json
{
  "message": "Technova API is running",
  "version": "1.0.0"
}
```

#### Step 2: Create a Market Order
```bash
curl -X POST http://localhost:8901/api/trade/signal \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "TEST_STOCK",
    "orderType": "market",
    "direction": "buy",
    "quantity": 10,
    "stopLoss": 90,
    "target": 110,
    "notes": "Test trade"
  }'
```

**Expected Response**:
```json
{
  "message": "Signal created successfully",
  "trade": {
    "_id": "...",
    "symbol": "TEST_STOCK",
    "status": "active",
    ...
  },
  "signal": {...}
}
```

#### Step 3: Check Monitor Status
```bash
curl http://localhost:8901/api/trade/monitors/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response**:
```json
{
  "totalMonitors": 1,
  "activeMonitors": 1,
  "pendingMonitors": 0,
  "runningMonitors": 1,
  "monitors": [
    {
      "tradeId": "...",
      "symbol": "TEST_STOCK",
      "status": "active",
      "isRunning": true,
      "lastPrice": 100.5,
      "entryPrice": 100,
      "stopLoss": 90,
      "target": 110,
      "errorCount": 0
    }
  ]
}
```

#### Step 4: Update Trade (Test Monitor Update)
```bash
curl -X PUT http://localhost:8901/api/trade/TRADE_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stopLoss": 85,
    "target": 115
  }'
```

#### Step 5: Check Monitor Again (Should Show Updated Values)
```bash
curl http://localhost:8901/api/trade/monitors/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Step 6: Close Trade
```bash
curl -X POST http://localhost:8901/api/trade/TRADE_ID/close \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exitPrice": 105
  }'
```

#### Step 7: Verify Monitor Removed
```bash
curl http://localhost:8901/api/trade/monitors/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**: `totalMonitors: 0`

---

## Watching the Logs

### Backend Console
Watch for these log messages:

```
🚀 Starting monitor for trade 507f... (TEST_STOCK)
💹 TEST_STOCK: Current=100.5, Entry=100, SL=90, Target=110
📝 Updated stop loss for 507f...: 85
📝 Updated target for 507f...: 115
🔒 Closing trade 507f... at 105 (manual)
✅ Trade 507f... closed successfully. P&L: 50.00
🗑️  Removed monitor for trade 507f...
```

---

## Testing Automatic Execution

To test automatic SL/Target execution, you need to simulate price changes. Here's how:

### Option 1: Use Mock Prices (Development)

The `marketData.service.js` uses mock prices when `UPSTOX_ACCESS_TOKEN` is not configured.

**Mock prices are random** around these base values:
- NIFTY: 18500
- BANKNIFTY: 45000
- Other symbols: 100

### Option 2: Create a Test with Close SL/Target

```bash
curl -X POST http://localhost:8901/api/trade/signal \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "TEST_STOCK",
    "orderType": "market",
    "direction": "buy",
    "quantity": 10,
    "stopLoss": 99,
    "target": 101,
    "notes": "Test auto-execution"
  }'
```

Since mock prices vary randomly by ±5, this trade should execute automatically within a few checks (10-60 seconds).

**Watch the logs** for:
```
🎯 Target HIT for 507f...: 101 >= 101
🔒 Closing trade 507f... at 101 (target-hit)
⛓️  Trade 507f... written to blockchain: mock_tx_...
✅ Trade 507f... closed successfully. P&L: 10.00
```

---

## Testing Limit Orders

```bash
curl -X POST http://localhost:8901/api/trade/signal \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "TEST_LIMIT",
    "orderType": "limit",
    "direction": "buy",
    "limitPrice": 95,
    "quantity": 5,
    "stopLoss": 85,
    "target": 110,
    "notes": "Test limit order"
  }'
```

**Expected Behavior**:
1. Trade created with status "pending"
2. Monitor starts checking price
3. When price ≤ 95, order activates
4. Status changes to "active"
5. Monitor continues for SL/Target

**Check Status**:
```bash
curl http://localhost:8901/api/trade/monitors/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Should show:
```json
{
  "tradeId": "...",
  "status": "pending",
  "isRunning": true,
  "entryPrice": 95
}
```

---

## Common Issues & Solutions

### Issue 1: "connect ECONNREFUSED"
**Cause**: Backend server not running  
**Solution**: Start the server with `npm start` in the backend directory

### Issue 2: "Unauthorized"
**Cause**: Invalid or expired JWT token  
**Solution**: Login again to get a fresh token

### Issue 3: Monitor not starting
**Cause**: Error in trade creation  
**Solution**: Check backend logs for errors

### Issue 4: Monitor not updating
**Cause**: Update request failed  
**Solution**: Check trade ID and authorization

### Issue 5: Trade not closing automatically
**Cause**: Price not hitting SL/Target  
**Solution**: 
- Check current price in monitor status
- Adjust SL/Target closer to current price
- Wait for price fluctuations (mock prices vary randomly)

---

## Verification Checklist

- [ ] Backend server is running on port 8901
- [ ] You have a valid advisor JWT token
- [ ] MongoDB is connected
- [ ] Create trade succeeds
- [ ] Monitor appears in status endpoint
- [ ] Monitor shows `isRunning: true`
- [ ] Update trade succeeds
- [ ] Monitor shows updated SL/Target
- [ ] Close trade succeeds
- [ ] Monitor is removed from status

---

## Expected Test Results

When running `node testMonitor.js YOUR_TOKEN`, you should see:

```
============================================================
  Trade Monitoring System - Test Suite
============================================================

ℹ Starting tests...

→ Test 1: Creating market order...
✓ Market order created: 507f1f77bcf86cd799439011
✓ Monitor is running for trade 507f1f77bcf86cd799439011
  Status: active
  Last Price: 100.5
  Stop Loss: 90
  Target: 110

→ Test 2: Updating trade parameters...
✓ Trade updated
✓ Monitor updated successfully
  New Stop Loss: 85
  New Target: 115

→ Test 3: Creating limit order...
✓ Limit order created: 507f1f77bcf86cd799439012
✓ Limit order monitor is running in pending state
  Status: pending
  Entry Price: 200

→ Test 5: Fetching monitor statistics...
✓ Monitor statistics retrieved
  Total Monitors: 2
  Active Monitors: 1
  Pending Monitors: 1
  Running Monitors: 2

  Active Monitors:
    1. TEST_MARKET (active) - Last: 100.5
    2. TEST_LIMIT (pending) - Last: 100.3

→ Test 4: Closing trade...
✓ Trade closed
✓ Monitor successfully removed after trade closure
  Total active monitors: 1

============================================================
✓ All tests completed!
============================================================
```

---

## Advanced Testing

### Test Automatic Stop Loss
```bash
# Create trade with SL very close to current price
curl -X POST http://localhost:8901/api/trade/signal \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "TEST_STOCK",
    "orderType": "market",
    "direction": "buy",
    "quantity": 10,
    "stopLoss": 99.5,
    "target": 120,
    "notes": "Test SL trigger"
  }'
```

Wait 10-60 seconds and check if trade auto-closed with loss.

### Test Automatic Target
```bash
# Create trade with target very close to current price
curl -X POST http://localhost:8901/api/trade/signal \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "TEST_STOCK",
    "orderType": "market",
    "direction": "buy",
    "quantity": 10,
    "stopLoss": 80,
    "target": 100.5,
    "notes": "Test target trigger"
  }'
```

Wait 10-60 seconds and check if trade auto-closed with profit.

### Test Server Restart Recovery
1. Create several trades
2. Check monitor status (should show multiple monitors)
3. Stop the server (Ctrl+C)
4. Restart the server
5. Check monitor status again (all monitors should be restored)

---

## Monitoring in Production

### Real-Time Monitoring
Use Socket.IO to listen for events:

```javascript
const socket = io("http://localhost:8901");

socket.emit("join-advisor-room", advisorId);

socket.on("trade-update", (trade) => {
  console.log("Trade updated:", trade);
});

socket.on("target-hit", (trade) => {
  console.log("🎯 Target hit!", trade);
  // Show notification to user
});

socket.on("sl-hit", (trade) => {
  console.log("🛑 Stop loss hit!", trade);
  // Show notification to user
});
```

### Health Checks
Set up periodic health checks:

```bash
# Every minute
*/1 * * * * curl http://localhost:8901/api/trade/monitors/status
```

---

## Troubleshooting Commands

```bash
# Check if server is running
curl http://localhost:8901/

# Check monitor count
curl http://localhost:8901/api/trade/monitors/status -H "Authorization: Bearer TOKEN" | jq '.totalMonitors'

# Restart all monitors
curl -X POST http://localhost:8901/api/trade/monitors/restart -H "Authorization: Bearer TOKEN"

# Get all advisor trades
curl http://localhost:8901/api/trade/advisor/trades -H "Authorization: Bearer TOKEN"
```

---

## Success Criteria

✅ **System is working correctly if:**
1. Trades create successfully
2. Monitors start automatically
3. Monitor status shows correct data
4. Updates reflect in monitor immediately
5. Trades close automatically when SL/Target hit
6. Monitors are removed after closure
7. Server restart recovers all monitors
8. No errors in console logs
9. Socket.IO events are emitted
10. Blockchain recording succeeds

---

## Need Help?

Check the documentation:
- **Full System Docs**: `TRADE_MONITORING_SYSTEM.md`
- **Quick Start**: `MONITORING_QUICK_START.md`
- **Implementation**: `MONITORING_IMPLEMENTATION_SUMMARY.md`
- **Trade Lifecycle**: `TRADE_LIFECYCLE.md`



