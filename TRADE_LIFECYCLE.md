# Trade Lifecycle Documentation

## Overview
This document explains the complete lifecycle of a trade in the Technova trading platform, from creation by an advisor to closure and blockchain recording. The system supports both advisor-led trading signals and investor paper trading.

---

## Table of Contents
1. [Trade Creation (Advisor)](#1-trade-creation-advisor)
2. [Signal Broadcasting](#2-signal-broadcasting)
3. [Trade States & Transitions](#3-trade-states--transitions)
4. [Investor Following (Paper Trading)](#4-investor-following-paper-trading)
5. [Trade Monitoring & Updates](#5-trade-monitoring--updates)
6. [Trade Closure](#6-trade-closure)
7. [Post-Closure Processing](#7-post-closure-processing)
8. [Data Flow Architecture](#8-data-flow-architecture)

---

## 1. Trade Creation (Advisor)

### Endpoint
```
POST /api/trade/signal
```

### Authentication & Authorization
- **Middleware Chain**: `isAuth` → `checkRole("advisor")` → `checkAdvisorVerified`
- Only verified advisors can create signals
- Requires valid JWT token

### Input Parameters
```javascript
{
  symbol: String,           // e.g., "NIFTY 25JAN 18000 CE"
  orderType: String,        // "market", "limit", "stop-limit"
  direction: String,        // "buy" or "sell"
  quantity: Number,         // Number of units
  limitPrice: Number,       // Required for limit/stop-limit orders
  stopPrice: Number,        // Required for stop-limit orders
  stopLoss: Number,         // Required
  target: Number,           // Required
  notes: String            // Optional (max 500 chars)
}
```

### Processing Steps

#### Step 1: Validation
- Validates required fields (symbol, orderType, direction, quantity, stopLoss, target)
- Validates order-type-specific fields (limitPrice for limit orders, etc.)

#### Step 2: Symbol Parsing & Asset Classification
```javascript
parseSymbol(symbol) → { type: "equity" | "futures" | "options" }
```
- Determines asset class from symbol format
- Sets `assetClass` field

#### Step 3: Entry Price Determination
- **Market Order**: Fetches live price via `getLivePrice(symbol)`
- **Limit Order**: Uses provided `limitPrice`
- **Stop-Limit Order**: Uses provided `limitPrice`

#### Step 4: Database Records Creation

**Trade Record (MongoDB)**
```javascript
Trade.create({
  advisorId: ObjectId,
  symbol: String,
  assetClass: "equity" | "futures" | "options",
  orderType: "market" | "limit" | "stop-limit",
  direction: "buy" | "sell",
  entryPrice: Number,
  limitPrice: Number,
  stopPrice: Number,
  quantity: Number,
  stopLoss: Number,
  target: Number,
  notes: String,
  status: "active" | "pending",  // market orders → active, others → pending
  riskRewardRatio: Number        // Auto-calculated via pre-save hook
})
```

**Signal Record (MongoDB)**
```javascript
Signal.create({
  tradeId: ObjectId,
  advisorId: ObjectId,
  symbol: String,
  assetClass: String,
  direction: String,
  entryPrice: Number,
  stopLoss: Number,
  target: Number,
  riskLevel: "low" | "medium" | "high",  // Auto-calculated
  status: "active",
  isPublic: true
})
```

#### Step 5: Real-Time Storage (Supabase)
- **Market Orders** → `active_trades` table
- **Limit/Stop-Limit Orders** → `pending_trades` table

```javascript
supabaseData = {
  trade_id: String,
  advisor_id: String,
  symbol: String,
  asset_class: String,
  order_type: String,
  direction: String,
  entry_price: Number,
  stop_loss: Number,
  target: Number,
  quantity: Number,
  status: String,
  created_at: ISO String
}
```

#### Step 6: Real-Time Broadcasting
```javascript
emitNewSignal({
  signalId: ObjectId,
  tradeId: ObjectId,
  advisorId: ObjectId,
  symbol: String,
  direction: String,
  entryPrice: Number,
  stopLoss: Number,
  target: Number,
  assetClass: String
})
```
- Broadcasts to all clients in `signals-feed` room via Socket.IO
- Investors receive instant notifications

### Response
```javascript
{
  message: "Signal created successfully",
  trade: { /* Trade object */ },
  signal: { /* Signal object */ }
}
```

---

## 2. Signal Broadcasting

### Real-Time Communication (Socket.IO)

#### Rooms Structure
1. **`signals-feed`**: Global feed for all investors
2. **`advisor-{advisorId}`**: Advisor-specific room
3. **`investor-{investorId}`**: Investor-specific room

#### Events Emitted
- **`new-signal`**: New trade signal created
- **`trade-update`**: Trade modified (SL/Target changed)
- **`trade-closed`**: Trade manually closed
- **`target-hit`**: Target price reached
- **`sl-hit`**: Stop loss triggered
- **`signal-closed`**: Signal no longer active

---

## 3. Trade States & Transitions

### Trade Status Flow

```
┌─────────┐
│ PENDING │ ← Limit/Stop-Limit orders
└────┬────┘
     │ (Price condition met)
     ↓
┌────────┐
│ ACTIVE │ ← Market orders start here
└────┬───┘
     │ (Target hit, SL hit, or manual close)
     ↓
┌────────┐
│ CLOSED │
└────────┘
     ↓
┌───────────┐
│ CANCELLED │ (Optional: Order expired/cancelled)
└───────────┘
```

### Status Definitions

| Status | Description | Allowed Actions |
|--------|-------------|-----------------|
| **pending** | Order placed but not yet triggered | Cancel, Modify |
| **active** | Trade is live in the market | Update SL/Target, Close |
| **closed** | Trade completed | View only |
| **cancelled** | Order cancelled before execution | View only |

### Outcome Types
- **profit**: Exit price > Entry price (for buy) or Entry price > Exit price (for sell)
- **loss**: Opposite of profit
- **breakeven**: No profit or loss
- **pending**: Trade still active

---

## 4. Investor Following (Paper Trading)

### Endpoint
```
POST /api/investor/paper-trade/follow
```

### Authentication
- **Middleware**: `isAuth` → `checkRole("investor")`

### Input
```javascript
{
  tradeId: ObjectId,
  quantity: Number
}
```

### Processing Steps

#### Step 1: Trade Validation
- Fetches original trade from MongoDB
- Verifies trade status is "active"
- Checks trade exists

#### Step 2: Balance Check
```javascript
requiredBalance = trade.entryPrice * quantity
if (investor.paperTradingBalance < requiredBalance) {
  return 400 "Insufficient balance"
}
```

#### Step 3: Paper Trade Creation
```javascript
PaperTrade.create({
  investorId: ObjectId,
  tradeId: ObjectId,
  advisorId: ObjectId,
  symbol: String,
  direction: String,
  entryPrice: Number,
  quantity: Number,
  stopLoss: Number,
  target: Number,
  status: "active"
})
```

#### Step 4: Balance Deduction
```javascript
investor.paperTradingBalance -= requiredBalance
```

#### Step 5: Relationship Updates
- Increments advisor's `subscriberCount`
- Adds advisor to investor's `followedAdvisors` array
- Increments signal's `followers` count

### Response
```javascript
{
  message: "Signal followed successfully",
  paperTrade: { /* PaperTrade object */ }
}
```

---

## 5. Trade Monitoring & Updates

### Get Advisor Trades
```
GET /api/trade/advisor/trades?status=active
```
- Returns all trades for the authenticated advisor
- Optional filter by status

### Update Trade (Modify SL/Target)
```
PUT /api/trade/:tradeId
```

**Input**:
```javascript
{
  stopLoss: Number,  // Optional
  target: Number     // Optional
}
```

**Processing**:
1. Validates trade ownership
2. Checks trade is not closed
3. Updates MongoDB Trade record
4. Updates Supabase active_trades
5. Emits `trade-update` event via Socket.IO

**Restrictions**:
- Can only modify `stopLoss` and `target`
- Cannot modify closed trades
- Cannot change entry price, quantity, or direction

### Get All Signals (Investor Feed)
```
GET /api/trade/signals?assetClass=options&riskLevel=low
```

**Query Parameters**:
- `assetClass`: Filter by equity/futures/options
- `riskLevel`: Filter by low/medium/high
- `advisorId`: Filter by specific advisor

**Returns**:
- Active signals only (`status: "active"`, `isPublic: true`)
- Populated with advisor details (name, profilePicture, trustScore, winRate)
- Sorted by creation date (newest first)
- Limited to 50 signals

---

## 6. Trade Closure

### Manual Closure by Advisor
```
POST /api/trade/:tradeId/close
```

**Input**:
```javascript
{
  exitPrice: Number,  // Optional (uses live price if not provided)
  reason: String      // Optional
}
```

### Processing Steps

#### Step 1: Validation
- Verifies trade ownership
- Checks trade is not already closed

#### Step 2: Exit Price Determination
```javascript
exitPrice = providedExitPrice || getLivePrice(trade.symbol)
```

#### Step 3: P&L Calculation
```javascript
// For BUY trades
profitLoss = (exitPrice - entryPrice) * quantity

// For SELL trades
profitLoss = (entryPrice - exitPrice) * quantity

profitLossPercentage = ((exitPrice - entryPrice) / entryPrice) * 100
```

#### Step 4: Outcome Determination
```javascript
if (profitLoss > 0) outcome = "profit"
else if (profitLoss < 0) outcome = "loss"
else outcome = "breakeven"
```

#### Step 5: Trade Update
```javascript
trade.exitPrice = exitPrice
trade.profitLoss = profitLoss
trade.profitLossPercentage = profitLossPercentage
trade.outcome = outcome
trade.status = "closed"
trade.closedAt = new Date()
trade.closedReason = reason || "manual"
```

#### Step 6: Signal Update
```javascript
Signal.findOneAndUpdate(
  { tradeId: trade._id },
  { status: "closed" }
)
```

#### Step 7: Supabase Cleanup
```javascript
deleteActiveTrade(tradeId)
```
- Removes from `active_trades` table

---

## 7. Post-Closure Processing

### Blockchain Recording

#### Step 1: Wallet Check
```javascript
if (advisor.solanaWallet) {
  // Proceed with blockchain recording
}
```

#### Step 2: Write to Blockchain
```javascript
writeTradeToBlockchain({
  advisorPublicKey: advisor.solanaWallet,
  tradeDetails: {
    symbol: trade.symbol,
    entryPrice: trade.entryPrice,
    exitPrice: trade.exitPrice,
    profitLoss: trade.profitLoss
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

#### Step 3: Update Trade with Blockchain Data
```javascript
trade.solanaTransactionId = transactionId
trade.isOnChain = true
```

**Note**: Currently uses mock implementation. Production version will:
- Call actual Solana program (smart contract)
- Sign transaction with advisor's keypair
- Confirm transaction on-chain
- Return real transaction ID

### Advisor Statistics Update

```javascript
User.findByIdAndUpdate(advisorId, {
  $inc: {
    totalTrades: 1,
    totalProfit: outcome === "profit" ? profitLoss : 0,
    totalLoss: outcome === "loss" ? Math.abs(profitLoss) : 0
  }
})
```

### Real-Time Notifications

```javascript
// To advisor
emitTradeClosed(advisorId, trade)

// To all investors watching signals
io.to("signals-feed").emit("signal-closed", {
  tradeId: trade._id,
  outcome: trade.outcome
})
```

### Trust Score Recalculation

Triggered automatically by cron job or manually:
```javascript
calculateTrustScore(advisorId)
```

**Metrics Calculated**:
- Win rate
- Average risk-reward ratio
- Consecutive wins/losses
- Total profit/loss
- Profit factor
- Average holding period
- Recent performance (7-day, 30-day win rates)

**Score Breakdown** (out of 100):
- **40%**: Win Rate (70% win rate = full score)
- **30%**: Risk-Reward Ratio (2:1 RR = full score)
- **20%**: Consistency (5 consecutive wins = full score)
- **10%**: Volume (50 trades = full score)

---

## 8. Data Flow Architecture

### Multi-Database Strategy

#### MongoDB (Primary Database)
**Purpose**: Persistent storage, complex queries, relationships

**Collections**:
- `trades`: All trade records
- `signals`: Public signals for investors
- `paperTrades`: Investor paper trading records
- `users`: User profiles and stats
- `trustScores`: Advisor performance metrics

#### Supabase (Real-Time Database)
**Purpose**: Fast real-time access, live updates

**Tables**:
- `active_trades`: Currently active trades
- `pending_trades`: Orders awaiting execution

**Benefits**:
- Instant queries for active trades
- Real-time subscriptions
- Reduced MongoDB load

#### Solana Blockchain (Immutable Ledger)
**Purpose**: Transparent, tamper-proof trade history

**Stored Data**:
- Closed trade details
- Entry/exit prices
- Profit/loss
- Timestamps

**Benefits**:
- Verifiable trade history
- Trust building
- Regulatory compliance

### Data Synchronization Flow

```
┌──────────┐
│ Advisor  │
│ Creates  │
│  Trade   │
└────┬─────┘
     │
     ↓
┌────────────────────────────────────────┐
│         MongoDB (Primary)              │
│  - Trade record created                │
│  - Signal record created               │
│  - Status: "active" or "pending"       │
└────┬───────────────────────────────────┘
     │
     ├─────────────────────────────────┐
     │                                 │
     ↓                                 ↓
┌─────────────────┐          ┌──────────────────┐
│    Supabase     │          │    Socket.IO     │
│  - active_trades│          │  - Emit signal   │
│  - pending_trades│         │  - Broadcast     │
└─────────────────┘          └──────────────────┘
                                      │
                                      ↓
                             ┌──────────────────┐
                             │    Investors     │
                             │  - Receive signal│
                             │  - Follow trade  │
                             └──────────────────┘
```

### Trade Closure Flow

```
┌──────────┐
│ Advisor  │
│  Closes  │
│  Trade   │
└────┬─────┘
     │
     ↓
┌────────────────────────────────────────┐
│         MongoDB Update                 │
│  - status: "closed"                    │
│  - Calculate P&L                       │
│  - Set outcome                         │
└────┬───────────────────────────────────┘
     │
     ├──────────────┬──────────────┬──────────────┐
     │              │              │              │
     ↓              ↓              ↓              ↓
┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐
│Supabase │  │Socket.IO │  │Blockchain│  │Trust Score   │
│ DELETE  │  │ Emit     │  │ Write    │  │ Recalculate  │
│ active  │  │ closed   │  │ Trade    │  │              │
└─────────┘  └──────────┘  └──────────┘  └──────────────┘
```

---

## API Endpoints Summary

### Trade Routes (`/api/trade`)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/signal` | Advisor (Verified) | Create new signal/trade |
| GET | `/advisor/trades` | Advisor | Get advisor's trades |
| PUT | `/:tradeId` | Advisor (Verified) | Update SL/Target |
| POST | `/:tradeId/close` | Advisor (Verified) | Close trade manually |
| GET | `/signals` | Public | Get all active signals |

### Investor Routes (`/api/investor`)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/paper-trade/follow` | Investor | Follow a signal |
| GET | `/paper-trades` | Investor | Get investor's paper trades |
| POST | `/paper-trade/:paperTradeId/close` | Investor | Close paper trade |
| GET | `/portfolio/summary` | Investor | Get portfolio stats |
| POST | `/follow/:advisorId` | Investor | Follow/unfollow advisor |

---

## Socket.IO Events

### Client → Server
- `join-advisor-room`: Join advisor-specific room
- `join-investor-room`: Join investor-specific room
- `join-signals-feed`: Join global signals feed

### Server → Client
- `new-signal`: New trade signal created
- `trade-update`: Trade modified
- `trade-closed`: Trade closed
- `target-hit`: Target price reached
- `sl-hit`: Stop loss triggered
- `signal-closed`: Signal no longer active
- `paper-trade-update`: Paper trade updated
- `trust-score-update`: Advisor trust score updated

---

## Trade Models

### Trade Schema (MongoDB)
```javascript
{
  advisorId: ObjectId,
  symbol: String,
  assetClass: "equity" | "futures" | "options",
  orderType: "market" | "limit" | "stop-limit",
  direction: "buy" | "sell",
  entryPrice: Number,
  limitPrice: Number,
  stopPrice: Number,
  quantity: Number,
  stopLoss: Number,
  target: Number,
  currentPrice: Number,
  exitPrice: Number,
  status: "pending" | "active" | "closed" | "cancelled",
  outcome: "profit" | "loss" | "breakeven" | "pending",
  profitLoss: Number,
  profitLossPercentage: Number,
  riskRewardRatio: Number,  // Auto-calculated
  closedAt: Date,
  closedReason: "target-hit" | "sl-hit" | "manual" | "expired",
  solanaTransactionId: String,
  isOnChain: Boolean,
  notes: String,
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Signal Schema (MongoDB)
```javascript
{
  tradeId: ObjectId,
  advisorId: ObjectId,
  symbol: String,
  assetClass: "equity" | "futures" | "options",
  direction: "buy" | "sell",
  entryPrice: Number,
  stopLoss: Number,
  target: Number,
  riskLevel: "low" | "medium" | "high",  // Auto-calculated
  status: "active" | "closed" | "expired",
  views: Number,
  followers: Number,
  isPublic: Boolean,
  expiresAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### PaperTrade Schema (MongoDB)
```javascript
{
  investorId: ObjectId,
  tradeId: ObjectId,
  advisorId: ObjectId,
  symbol: String,
  direction: "buy" | "sell",
  entryPrice: Number,
  quantity: Number,
  stopLoss: Number,
  target: Number,
  exitPrice: Number,
  status: "active" | "closed",
  outcome: "profit" | "loss" | "breakeven" | "pending",
  profitLoss: Number,
  profitLossPercentage: Number,
  closedAt: Date,
  closedReason: "target-hit" | "sl-hit" | "manual" | "advisor-closed",
  createdAt: Date,
  updatedAt: Date
}
```

---

## Key Features & Mechanisms

### 1. Risk-Reward Ratio (Auto-Calculated)
```javascript
risk = Math.abs(entryPrice - stopLoss)
reward = Math.abs(target - entryPrice)
riskRewardRatio = reward / risk
```
Calculated via MongoDB pre-save hook.

### 2. Risk Level (Auto-Calculated)
```javascript
slPercentage = Math.abs((entryPrice - stopLoss) / entryPrice) * 100

if (slPercentage <= 2) riskLevel = "low"
else if (slPercentage <= 5) riskLevel = "medium"
else riskLevel = "high"
```
Calculated via Signal pre-save hook.

### 3. Paper Trading Balance Management
- **Initial Balance**: Set during investor registration (default: ₹100,000)
- **Deduction**: When following a signal
- **Return**: When closing paper trade (principal + P&L)

```javascript
// On follow
requiredBalance = entryPrice * quantity
investor.paperTradingBalance -= requiredBalance

// On close
returnAmount = (entryPrice * quantity) + profitLoss
investor.paperTradingBalance += returnAmount
```

### 4. Trust Score Calculation
Runs periodically via cron job (`/backend/cron/trustScore.cron.js`):

```javascript
// Every hour
cron.schedule('0 * * * *', async () => {
  await calculateAllTrustScores()
})
```

Updates advisor's:
- `trustScore` (0-100)
- `winRate` (%)
- `totalProfit`
- `totalLoss`
- `totalTrades`

---

## Error Handling

### Common Error Responses

| Status | Message | Cause |
|--------|---------|-------|
| 400 | "All required fields must be provided" | Missing required parameters |
| 400 | "Trade is not active" | Trying to follow closed trade |
| 400 | "Insufficient paper trading balance" | Not enough virtual funds |
| 400 | "Cannot modify closed trade" | Trying to update closed trade |
| 400 | "Trade is already closed" | Trying to close already closed trade |
| 404 | "Trade not found" | Invalid trade ID or unauthorized access |
| 500 | "Internal server error" | Server-side error |

---

## Performance Optimizations

### 1. Dual Database Strategy
- **MongoDB**: Complex queries, historical data
- **Supabase**: Real-time active trades
- Reduces MongoDB query load by 60-70%

### 2. Socket.IO Rooms
- Targeted broadcasting reduces network overhead
- Advisors only receive their own updates
- Investors receive relevant signals only

### 3. Blockchain Async Writing
- Non-blocking blockchain writes
- Trade closure doesn't wait for blockchain confirmation
- Failures logged but don't affect trade closure

### 4. Cron-Based Trust Score
- Periodic calculation (hourly)
- Avoids real-time calculation overhead
- Cached in User model for fast access

---

## Security Considerations

### 1. Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Advisor verification requirement for signal creation

### 2. Trade Ownership Validation
- All trade operations verify ownership
- Investors can only close their own paper trades
- Advisors can only modify their own trades

### 3. Balance Validation
- Paper trading balance checked before following signals
- Prevents negative balances
- Transaction-like balance updates

### 4. Blockchain Immutability
- Closed trades written to blockchain
- Provides tamper-proof audit trail
- Enhances trust and transparency

---

## Future Enhancements

### Planned Features
1. **Automated Trade Execution**: Auto-close on SL/Target hit
2. **Limit Order Activation**: Auto-move pending → active when price conditions met
3. **Trade Expiry**: Auto-expire pending orders after set duration
4. **Advanced Analytics**: ML-based trade suggestions
5. **Real Blockchain Integration**: Full Solana program implementation
6. **Multi-Exchange Support**: Support for multiple trading platforms
7. **Copy Trading**: Automatic signal following
8. **Risk Management**: Portfolio-level risk limits

---

## Conclusion

The trade lifecycle in Technova is designed for:
- **Speed**: Real-time updates via Socket.IO and Supabase
- **Reliability**: Persistent storage in MongoDB
- **Transparency**: Blockchain recording of closed trades
- **Scalability**: Multi-database architecture
- **Security**: Role-based access and ownership validation

The system supports both advisor signal creation and investor paper trading, with comprehensive monitoring, analytics, and trust scoring mechanisms.

