# Trade Monitoring System Documentation

## Overview
The Trade Monitoring System is an automated service that continuously monitors trades and executes them based on real-time price movements. It handles pending order activation, stop-loss triggers, target hits, and automatic trade closure with blockchain recording.

---

## Architecture

### Core Components

#### 1. TradeMonitor Class
- **Purpose**: Monitors a single trade
- **Location**: `/backend/services/tradeMonitor.service.js`
- **Functionality**:
  - Fetches live prices periodically (every 10 seconds)
  - Checks pending order activation conditions
  - Monitors stop-loss and target prices
  - Executes trades automatically
  - Updates all databases (MongoDB, Supabase, Blockchain)

#### 2. MonitorManager Class
- **Purpose**: Manages all active monitors
- **Location**: `/backend/services/tradeMonitor.service.js`
- **Functionality**:
  - Maintains a Map of all active monitors
  - Adds/removes monitors dynamically
  - Updates monitor parameters
  - Provides statistics and status
  - Handles graceful shutdown

---

## Trade Monitoring Flow

### 1. Trade Creation
```
Advisor creates trade
        ↓
Trade saved to MongoDB
        ↓
Trade saved to Supabase (active_trades or pending_trades)
        ↓
MonitorManager.addMonitor(trade) ← Monitor starts here
        ↓
TradeMonitor instance created
        ↓
Price checking begins (every 10 seconds)
```

### 2. Pending Order Activation

#### Limit Orders
```javascript
// BUY Limit Order
if (direction === "buy" && currentPrice <= limitPrice) {
  activateOrder();
}

// SELL Limit Order
if (direction === "sell" && currentPrice >= limitPrice) {
  activateOrder();
}
```

#### Stop-Limit Orders
```javascript
// BUY Stop-Limit
if (direction === "buy" && currentPrice >= stopPrice) {
  activateOrder();
}

// SELL Stop-Limit
if (direction === "sell" && currentPrice <= stopPrice) {
  activateOrder();
}
```

**Activation Process**:
1. Update trade status: `pending` → `active`
2. Update entry price to actual activation price
3. Move from `pending_trades` to `active_trades` in Supabase
4. Emit real-time update via Socket.IO
5. Continue monitoring for SL/Target

### 3. Active Trade Monitoring

#### Stop Loss Detection
```javascript
// BUY trade
if (direction === "buy" && currentPrice <= stopLoss) {
  closeTrade(currentPrice, "sl-hit", "loss");
}

// SELL trade
if (direction === "sell" && currentPrice >= stopLoss) {
  closeTrade(currentPrice, "sl-hit", "loss");
}
```

#### Target Detection
```javascript
// BUY trade
if (direction === "buy" && currentPrice >= target) {
  closeTrade(currentPrice, "target-hit", "profit");
}

// SELL trade
if (direction === "sell" && currentPrice <= target) {
  closeTrade(currentPrice, "target-hit", "profit");
}
```

### 4. Trade Closure Process

```
Price condition met (SL or Target)
        ↓
Stop monitor immediately
        ↓
Calculate P&L
        ↓
Update MongoDB (status: "closed", outcome, P&L)
        ↓
Update Signal status to "closed"
        ↓
Delete from Supabase active_trades
        ↓
Write to Blockchain (if wallet configured)
        ↓
Update Advisor statistics
        ↓
Emit Socket.IO notifications
        ↓
Remove monitor from MonitorManager
```

---

## API Integration

### New Endpoints

#### 1. Cancel Pending Trade
```
DELETE /api/trade/:tradeId/cancel
```
**Authorization**: Advisor only  
**Purpose**: Cancel a pending order before activation

**Response**:
```json
{
  "message": "Trade cancelled successfully",
  "trade": { /* Updated trade object */ }
}
```

**Actions**:
- Sets trade status to "cancelled"
- Removes from Supabase pending_trades
- Stops monitoring
- Updates signal status

#### 2. Get Monitor Status
```
GET /api/trade/monitors/status
```
**Authorization**: Authenticated users  
**Purpose**: View all active monitors (debugging/admin)

**Response**:
```json
{
  "totalMonitors": 15,
  "activeMonitors": 10,
  "pendingMonitors": 5,
  "runningMonitors": 15,
  "monitors": [
    {
      "tradeId": "507f1f77bcf86cd799439011",
      "symbol": "NIFTY 25JAN 18000 CE",
      "status": "active",
      "isRunning": true,
      "lastPrice": 175.50,
      "entryPrice": 150.00,
      "stopLoss": 140.00,
      "target": 180.00,
      "errorCount": 0
    }
  ]
}
```

#### 3. Restart Monitors
```
POST /api/trade/monitors/restart
```
**Authorization**: Advisor only  
**Purpose**: Manually restart all monitors (useful after server restart)

**Response**:
```json
{
  "message": "Monitors restarted successfully",
  "count": 15
}
```

### Modified Endpoints

#### Update Trade
```
PUT /api/trade/:tradeId
```
**New Behavior**: Now updates the monitor in real-time

**Body**:
```json
{
  "stopLoss": 145.00,
  "target": 185.00
}
```

**Process**:
1. Updates MongoDB
2. Updates Supabase
3. **Updates monitor parameters** ← NEW
4. Emits Socket.IO update

---

## Monitor Configuration

### Default Settings
```javascript
{
  checkInterval: 10000,     // Check every 10 seconds
  maxErrors: 5,             // Stop after 5 consecutive errors
}
```

### Customization
To change the check interval, modify the `TradeMonitor` constructor:

```javascript
constructor(tradeData) {
  // ...
  this.checkInterval = 10000; // Change this value (in milliseconds)
  // ...
}
```

**Recommended intervals**:
- High-frequency trading: 5000ms (5 seconds)
- Normal trading: 10000ms (10 seconds)
- Low-frequency trading: 30000ms (30 seconds)

---

## Error Handling

### Price Fetch Failures
- Monitor tracks consecutive errors
- After 5 consecutive errors, monitor stops automatically
- Error logged to console
- Monitor removed from MonitorManager

### Database Failures
- MongoDB failures: Critical, trade closure aborted
- Supabase failures: Non-critical, logged but process continues
- Blockchain failures: Non-critical, logged but trade closure completes

### Recovery Mechanisms
1. **Automatic Restart**: On server restart, all active/pending trades are re-monitored
2. **Manual Restart**: Admin can trigger monitor restart via API
3. **Error Isolation**: One monitor failure doesn't affect others

---

## Performance Considerations

### Resource Usage

#### Memory
- Each monitor: ~1-2 KB
- 1000 monitors: ~1-2 MB
- Negligible impact on server memory

#### CPU
- Price check: ~5-10ms per trade
- 1000 trades checked every 10 seconds
- Total CPU time: ~5-10 seconds per 10-second interval
- Distributed over time, minimal impact

#### Network
- API calls to market data service
- Rate limiting considerations:
  - 1000 trades × 6 checks/minute = 6000 API calls/minute
  - Consider caching or batch price fetching for high volume

### Optimization Strategies

#### 1. Batch Price Fetching
```javascript
// Instead of individual calls
const prices = await getLivePrices([symbol1, symbol2, symbol3]);
```

#### 2. Dynamic Intervals
```javascript
// Adjust interval based on proximity to SL/Target
if (isCloseToTarget || isCloseToStopLoss) {
  this.checkInterval = 5000; // Check more frequently
} else {
  this.checkInterval = 15000; // Check less frequently
}
```

#### 3. Smart Monitoring
```javascript
// Only monitor during market hours
if (isMarketClosed()) {
  this.pause();
} else {
  this.resume();
}
```

---

## Real-Time Updates

### Socket.IO Events

#### Trade Activation
```javascript
// Event: "trade-update"
// Room: advisor-{advisorId}
{
  _id: "507f1f77bcf86cd799439011",
  status: "active",
  entryPrice: 175.50,
  // ... full trade object
}
```

#### Stop Loss Hit
```javascript
// Event: "sl-hit"
// Room: advisor-{advisorId}
{
  _id: "507f1f77bcf86cd799439011",
  exitPrice: 140.00,
  profitLoss: -1500.00,
  outcome: "loss",
  closedReason: "sl-hit"
}
```

#### Target Hit
```javascript
// Event: "target-hit"
// Room: advisor-{advisorId}
{
  _id: "507f1f77bcf86cd799439011",
  exitPrice: 180.00,
  profitLoss: 3000.00,
  outcome: "profit",
  closedReason: "target-hit"
}
```

#### Trade Closed
```javascript
// Event: "trade-closed"
// Rooms: advisor-{advisorId}, signals-feed
{
  _id: "507f1f77bcf86cd799439011",
  status: "closed",
  exitPrice: 180.00,
  profitLoss: 3000.00,
  outcome: "profit"
}
```

---

## Database Updates

### MongoDB Updates

#### On Activation
```javascript
{
  status: "active",
  entryPrice: actualActivationPrice
}
```

#### On Closure
```javascript
{
  status: "closed",
  exitPrice: Number,
  profitLoss: Number,
  profitLossPercentage: Number,
  outcome: "profit" | "loss" | "breakeven",
  closedAt: Date,
  closedReason: "target-hit" | "sl-hit" | "manual",
  solanaTransactionId: String,  // If blockchain write succeeds
  isOnChain: Boolean
}
```

### Supabase Updates

#### Pending → Active
```javascript
// Delete from pending_trades
// Insert into active_trades
{
  trade_id: String,
  status: "active",
  entry_price: actualActivationPrice
}
```

#### Active → Closed
```javascript
// Delete from active_trades
// No record in Supabase (historical data in MongoDB only)
```

### Blockchain Recording
```javascript
writeTradeToBlockchain({
  advisorPublicKey: String,
  tradeDetails: {
    symbol: String,
    entryPrice: Number,
    exitPrice: Number,
    profitLoss: Number
  }
})
```

**Returns**:
```javascript
{
  transactionId: String,
  success: Boolean,
  explorerUrl: String
}
```

---

## Monitoring Lifecycle

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    TRADE CREATED                            │
│              (Advisor submits signal)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              MONITOR STARTED                                │
│        MonitorManager.addMonitor(trade)                     │
│        - Create TradeMonitor instance                       │
│        - Start price checking (every 10s)                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
                    ┌────────┐
                    │ PENDING│
                    │  ORDER │
                    └────┬───┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ↓                               ↓
    Price condition                 Price condition
    NOT met                         MET
         │                               │
         ↓                               ↓
    Keep monitoring              ACTIVATE ORDER
    (check every 10s)                   │
         │                               ↓
         │                      ┌────────────────┐
         │                      │ ACTIVE TRADE   │
         │                      └────────┬───────┘
         │                               │
         └───────────────┬───────────────┘
                         │
                         ↓
                  Monitor SL/Target
                  (check every 10s)
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ↓               ↓               ↓
    SL HIT          TARGET HIT      MANUAL CLOSE
         │               │               │
         └───────────────┴───────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    CLOSE TRADE                              │
│  1. Stop monitor                                            │
│  2. Calculate P&L                                           │
│  3. Update MongoDB                                          │
│  4. Delete from Supabase                                    │
│  5. Write to Blockchain                                     │
│  6. Update advisor stats                                    │
│  7. Emit Socket.IO events                                   │
│  8. Remove from MonitorManager                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Usage Examples

### Example 1: Creating a Market Order
```javascript
POST /api/trade/signal
{
  "symbol": "NIFTY 25JAN 18000 CE",
  "orderType": "market",
  "direction": "buy",
  "quantity": 100,
  "stopLoss": 140.00,
  "target": 180.00,
  "notes": "Bullish on Nifty"
}
```

**What Happens**:
1. Trade created with status "active"
2. Monitor starts immediately
3. Checks price every 10 seconds
4. If price ≤ 140: Auto-closes with loss
5. If price ≥ 180: Auto-closes with profit

### Example 2: Creating a Limit Order
```javascript
POST /api/trade/signal
{
  "symbol": "BANKNIFTY 25JAN 45000 PE",
  "orderType": "limit",
  "direction": "buy",
  "limitPrice": 200.00,
  "quantity": 50,
  "stopLoss": 180.00,
  "target": 230.00
}
```

**What Happens**:
1. Trade created with status "pending"
2. Monitor starts immediately
3. Checks price every 10 seconds
4. When price ≤ 200: Auto-activates order
5. Then monitors for SL (180) or Target (230)

### Example 3: Modifying Active Trade
```javascript
PUT /api/trade/507f1f77bcf86cd799439011
{
  "stopLoss": 145.00,
  "target": 185.00
}
```

**What Happens**:
1. MongoDB updated
2. Supabase updated
3. **Monitor updated in real-time**
4. Next price check uses new SL/Target values

### Example 4: Cancelling Pending Order
```javascript
DELETE /api/trade/507f1f77bcf86cd799439011/cancel
```

**What Happens**:
1. Trade status set to "cancelled"
2. Removed from Supabase pending_trades
3. Monitor stopped and removed
4. Signal status updated

---

## Testing

### Manual Testing

#### 1. Test Monitor Creation
```bash
# Create a trade
curl -X POST http://localhost:8901/api/trade/signal \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "TEST",
    "orderType": "market",
    "direction": "buy",
    "quantity": 10,
    "stopLoss": 90,
    "target": 110
  }'

# Check monitor status
curl http://localhost:8901/api/trade/monitors/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 2. Test Monitor Update
```bash
# Update trade
curl -X PUT http://localhost:8901/api/trade/TRADE_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stopLoss": 85,
    "target": 115
  }'

# Verify monitor updated
curl http://localhost:8901/api/trade/monitors/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 3. Test Monitor Removal
```bash
# Close trade
curl -X POST http://localhost:8901/api/trade/TRADE_ID/close \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exitPrice": 105
  }'

# Verify monitor removed
curl http://localhost:8901/api/trade/monitors/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Automated Testing

```javascript
// Test monitor lifecycle
describe("TradeMonitor", () => {
  it("should start monitoring on trade creation", async () => {
    const trade = await createTrade({ /* ... */ });
    const monitor = MonitorManager.getMonitor(trade._id);
    expect(monitor).toBeDefined();
    expect(monitor.isRunning).toBe(true);
  });

  it("should update monitor parameters", () => {
    const updated = MonitorManager.updateMonitor(tradeId, {
      stopLoss: 145,
      target: 185
    });
    expect(updated).toBe(true);
  });

  it("should remove monitor on trade closure", async () => {
    await closeTrade(tradeId);
    const monitor = MonitorManager.getMonitor(tradeId);
    expect(monitor).toBeUndefined();
  });
});
```

---

## Troubleshooting

### Issue: Monitor not starting
**Symptoms**: Trade created but no monitor in status  
**Causes**:
- Error in trade data
- MongoDB connection issue
- Monitor creation failed

**Solution**:
```bash
# Check logs for errors
tail -f backend.log

# Manually restart monitors
curl -X POST http://localhost:8901/api/trade/monitors/restart \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Issue: Monitor stopped unexpectedly
**Symptoms**: Monitor shows `isRunning: false`  
**Causes**:
- 5+ consecutive price fetch errors
- Market data service down
- Network issues

**Solution**:
1. Check market data service
2. Verify network connectivity
3. Restart monitor manually

### Issue: Trade not closing automatically
**Symptoms**: Price hit SL/Target but trade still active  
**Causes**:
- Monitor not running
- Price data incorrect
- Logic error in conditions

**Solution**:
1. Check monitor status
2. Verify price data
3. Check console logs for errors
4. Manually close trade if needed

---

## Best Practices

### 1. Monitor Management
- Always check monitor status after trade creation
- Restart monitors after server restart
- Monitor the monitors (check stats regularly)

### 2. Error Handling
- Log all monitor errors
- Set up alerts for repeated failures
- Have manual override capabilities

### 3. Performance
- Don't create too many monitors (max ~10,000)
- Consider batch price fetching for scale
- Monitor server resources

### 4. Testing
- Test in staging environment first
- Use mock prices for testing
- Verify all edge cases

### 5. Monitoring
- Set up monitoring for monitor service itself
- Track success/failure rates
- Monitor execution latency

---

## Future Enhancements

### Planned Features
1. **Smart Intervals**: Adjust check frequency based on price proximity
2. **Market Hours**: Pause monitoring when market is closed
3. **Batch Price Fetching**: Optimize API calls
4. **Advanced Conditions**: Trailing stop-loss, partial exits
5. **Machine Learning**: Predict optimal exit points
6. **Multi-Exchange**: Support multiple trading platforms
7. **Alert System**: SMS/Email notifications on execution
8. **Analytics Dashboard**: Real-time monitor statistics

---

## Conclusion

The Trade Monitoring System provides:
- ✅ Automated trade execution
- ✅ Real-time price monitoring
- ✅ Automatic SL/Target management
- ✅ Seamless database synchronization
- ✅ Blockchain recording
- ✅ Real-time notifications
- ✅ Scalable architecture
- ✅ Error resilience

This system eliminates manual monitoring and ensures trades are executed precisely when conditions are met, providing a professional trading experience for advisors and investors.



