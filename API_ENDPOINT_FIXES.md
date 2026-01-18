# API Endpoint Fixes

## Problem
Frontend components were using incorrect API endpoints that don't exist in the backend, causing 404 errors.

## Root Cause
The frontend was using `/api/advisor/signal/*` and `/api/advisor/trade/*` endpoints, but the backend uses `/api/trade/*` endpoints.

---

## Fixes Applied

### 1. AdvisorTradePage.jsx

#### Fix 1: Create Signal Endpoint
**Before:**
```javascript
await axios.post(
  `${serverUrl}/api/advisor/signal/create`,
  ...
)
```

**After:**
```javascript
await axios.post(
  `${serverUrl}/api/trade/signal`,
  ...
)
```

**Backend Route:** `POST /api/trade/signal`

---

#### Fix 2: Fetch Active Trades Endpoint
**Before:**
```javascript
const response = await axios.get(
  `${serverUrl}/api/advisor/trades?status=active`,
  ...
)
```

**After:**
```javascript
const response = await axios.get(
  `${serverUrl}/api/trade/advisor/trades?status=active`,
  ...
)
```

**Backend Route:** `GET /api/trade/advisor/trades`

---

#### Fix 3: Update Trade Endpoint
**Before:**
```javascript
await axios.put(
  `${serverUrl}/api/advisor/trade/${tradeId}`,
  ...
)
```

**After:**
```javascript
await axios.put(
  `${serverUrl}/api/trade/${tradeId}`,
  ...
)
```

**Backend Route:** `PUT /api/trade/:tradeId`

---

### 2. AdvisorHistoryPage.jsx

#### Fix: Fetch Trade History Endpoint
**Before:**
```javascript
axios.get(`${serverUrl}/api/advisor/trades/history`, { withCredentials: true })
```

**After:**
```javascript
axios.get(`${serverUrl}/api/trade/advisor/trades?status=closed`, { withCredentials: true })
```

**Backend Route:** `GET /api/trade/advisor/trades?status=closed`

**Note:** The `getAdvisorTrades` controller accepts a `status` query parameter to filter trades.

---

## Backend Route Reference

### Trade Routes (`/api/trade`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/signal` | Create new signal/trade | Advisor (Verified) |
| GET | `/advisor/trades` | Get advisor's trades (with optional status filter) | Advisor |
| PUT | `/:tradeId` | Update trade (SL/Target) | Advisor (Verified) |
| POST | `/:tradeId/close` | Close trade manually | Advisor (Verified) |
| DELETE | `/:tradeId/cancel` | Cancel pending trade | Advisor |
| GET | `/signals` | Get all public signals | Public |
| GET | `/monitors/status` | Get monitor status | Authenticated |
| POST | `/monitors/restart` | Restart all monitors | Advisor |

### Advisor Routes (`/api/advisor`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/dashboard/stats` | Get dashboard statistics | Advisor |
| ... | ... | Other advisor routes | ... |

---

## Query Parameters

### GET /api/trade/advisor/trades

**Query Parameters:**
- `status` (optional): Filter by trade status
  - `active` - Active trades
  - `pending` - Pending orders
  - `closed` - Closed trades
  - `cancelled` - Cancelled trades

**Examples:**
```javascript
// Get all trades
GET /api/trade/advisor/trades

// Get active trades only
GET /api/trade/advisor/trades?status=active

// Get closed trades (history)
GET /api/trade/advisor/trades?status=closed
```

---

## Testing

### Test Create Signal
```bash
curl -X POST http://localhost:8901/api/trade/signal \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "RELIANCE",
    "orderType": "market",
    "direction": "buy",
    "quantity": 10,
    "stopLoss": 2400,
    "target": 2600
  }'
```

### Test Get Active Trades
```bash
curl http://localhost:8901/api/trade/advisor/trades?status=active \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Update Trade
```bash
curl -X PUT http://localhost:8901/api/trade/TRADE_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stopLoss": 2450,
    "target": 2650
  }'
```

### Test Get Trade History
```bash
curl http://localhost:8901/api/trade/advisor/trades?status=closed \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Impact

### Before Fix
- ❌ Creating signals returned 404 error
- ❌ Fetching active trades failed
- ❌ Updating trades failed
- ❌ Trade history page showed errors

### After Fix
- ✅ Creating signals works correctly
- ✅ Active trades load properly
- ✅ Trade updates work
- ✅ Trade history loads correctly
- ✅ All endpoints match backend routes

---

## Files Modified

1. **frontend/src/components/advisor/AdvisorTradePage.jsx**
   - Fixed create signal endpoint
   - Fixed fetch active trades endpoint
   - Fixed update trade endpoint

2. **frontend/src/components/advisor/AdvisorHistoryPage.jsx**
   - Fixed fetch trade history endpoint

---

## Verification Checklist

- [x] Create signal endpoint fixed
- [x] Fetch active trades endpoint fixed
- [x] Update trade endpoint fixed
- [x] Trade history endpoint fixed
- [x] All endpoints match backend routes
- [x] Query parameters used correctly
- [x] Authentication headers preserved

---

## Related Documentation

- **TRADE_LIFECYCLE.md** - Complete trade lifecycle
- **TRADE_MONITORING_SYSTEM.md** - Monitoring system docs
- **Backend Routes:**
  - `/backend/routes/trade.routes.js`
  - `/backend/routes/advisor.routes.js`
  - `/backend/controller/trade.controller.js`

---

## Summary

**Fixed 4 incorrect API endpoints** across 2 frontend components:
1. ✅ Create signal: `/api/advisor/signal/create` → `/api/trade/signal`
2. ✅ Fetch trades: `/api/advisor/trades` → `/api/trade/advisor/trades`
3. ✅ Update trade: `/api/advisor/trade/:id` → `/api/trade/:id`
4. ✅ Trade history: `/api/advisor/trades/history` → `/api/trade/advisor/trades?status=closed`

All endpoints now correctly match the backend route definitions.



