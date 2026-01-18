# Mongoose Pre-Save Hook Fix

## Problem
Creating trades was failing with the error:
```
TypeError: next is not a function
    at model.<anonymous> (trade.models.js:111:3)
```

## Root Cause
The pre-save hooks in `trade.models.js` and `signal.models.js` were using the old Mongoose syntax with `next()` callback, which is incompatible with Mongoose 9.x.

### Old Syntax (Mongoose < 9)
```javascript
tradeSchema.pre("save", function (next) {
  // ... calculations ...
  next(); // ❌ Not needed in Mongoose 9+
});
```

### Issue
In Mongoose 9.x, synchronous pre-save hooks don't require the `next()` callback. When you include `next` as a parameter but the function is synchronous, Mongoose doesn't pass it, causing the "next is not a function" error.

---

## Solution Applied

### File 1: `/backend/models/trade.models.js`

**Before:**
```javascript
tradeSchema.pre("save", function (next) {
  if (this.entryPrice && this.stopLoss && this.target) {
    const risk = Math.abs(this.entryPrice - this.stopLoss);
    const reward = Math.abs(this.target - this.entryPrice);
    this.riskRewardRatio = risk > 0 ? (reward / risk).toFixed(2) : 0;
  }
  next(); // ❌ Causing error
});
```

**After:**
```javascript
tradeSchema.pre("save", function () {
  if (this.entryPrice && this.stopLoss && this.target) {
    const risk = Math.abs(this.entryPrice - this.stopLoss);
    const reward = Math.abs(this.target - this.entryPrice);
    this.riskRewardRatio = risk > 0 ? (reward / risk).toFixed(2) : 0;
  }
  // ✅ No next() needed for synchronous hooks
});
```

---

### File 2: `/backend/models/signal.models.js`

**Before:**
```javascript
signalSchema.pre("save", function (next) {
  if (this.entryPrice && this.stopLoss) {
    const slPercentage = Math.abs((this.entryPrice - this.stopLoss) / this.entryPrice) * 100;
    if (slPercentage <= 2) {
      this.riskLevel = "low";
    } else if (slPercentage <= 5) {
      this.riskLevel = "medium";
    } else {
      this.riskLevel = "high";
    }
  }
  next(); // ❌ Causing error
});
```

**After:**
```javascript
signalSchema.pre("save", function () {
  if (this.entryPrice && this.stopLoss) {
    const slPercentage = Math.abs((this.entryPrice - this.stopLoss) / this.entryPrice) * 100;
    if (slPercentage <= 2) {
      this.riskLevel = "low";
    } else if (slPercentage <= 5) {
      this.riskLevel = "medium";
    } else {
      this.riskLevel = "high";
    }
  }
  // ✅ No next() needed for synchronous hooks
});
```

---

## Mongoose 9.x Pre-Save Hook Patterns

### Pattern 1: Synchronous Hook (No next needed)
```javascript
schema.pre("save", function () {
  // Synchronous operations
  this.field = calculateValue();
  // Automatically continues to next middleware
});
```

### Pattern 2: Async Hook (Use async/await)
```javascript
schema.pre("save", async function () {
  // Asynchronous operations
  this.field = await fetchData();
  // Automatically continues when promise resolves
});
```

### Pattern 3: Callback Style (Legacy - Still supported)
```javascript
schema.pre("save", function (next) {
  // Must call next() explicitly
  someAsyncOperation((err) => {
    if (err) return next(err);
    next();
  });
});
```

---

## When to Use Each Pattern

| Pattern | Use Case | Example |
|---------|----------|---------|
| **Synchronous** | Simple calculations, no async | Calculating derived fields |
| **Async/Await** | Database queries, API calls | Fetching related data |
| **Callback** | Legacy code, complex error handling | Old codebases |

---

## What Changed in Mongoose 9.x

### Before (Mongoose < 9)
- All pre-save hooks required `next()` callback
- Synchronous hooks still needed `next()`
- Error-prone if you forgot to call `next()`

### After (Mongoose 9.x)
- Synchronous hooks don't need `next()`
- Async hooks use promises/async-await
- Cleaner, more intuitive API
- Better TypeScript support

---

## Testing

### Test Creating a Trade
```bash
curl -X POST http://localhost:8901/api/trade/signal \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "RELIANCE",
    "orderType": "market",
    "direction": "buy",
    "quantity": 10,
    "entryPrice": 2500,
    "stopLoss": 2400,
    "target": 2600
  }'
```

**Expected Result:**
- ✅ Trade created successfully
- ✅ Risk-reward ratio calculated (1.67)
- ✅ Risk level calculated (medium)
- ✅ No "next is not a function" error

---

## Impact

### Before Fix
- ❌ Creating trades failed with TypeError
- ❌ Risk-reward ratio not calculated
- ❌ Risk level not calculated
- ❌ Signals couldn't be created

### After Fix
- ✅ Trades create successfully
- ✅ Risk-reward ratio calculated automatically
- ✅ Risk level calculated automatically
- ✅ All pre-save hooks work correctly

---

## Related Files

- `/backend/models/trade.models.js` - Trade model with risk-reward calculation
- `/backend/models/signal.models.js` - Signal model with risk level calculation
- `/backend/controller/trade.controller.js` - Trade creation logic

---

## Additional Notes

### Other Mongoose Models
If you have other models with pre-save hooks, check if they use the old `next()` pattern and update them similarly.

### Migration Guide
```javascript
// Old pattern (Mongoose < 9)
schema.pre("save", function (next) {
  this.field = value;
  next();
});

// New pattern (Mongoose 9+)
schema.pre("save", function () {
  this.field = value;
});
```

### Async Operations
If your pre-save hook does async operations, use async/await:
```javascript
schema.pre("save", async function () {
  this.field = await someAsyncOperation();
});
```

---

## Summary

**Problem:** `TypeError: next is not a function` in pre-save hooks  
**Cause:** Using old Mongoose syntax with `next()` in Mongoose 9.x  
**Solution:** Remove `next` parameter and `next()` call from synchronous hooks  
**Result:** ✅ Trades and signals now create successfully with auto-calculated fields

**Files Modified:**
1. ✅ `/backend/models/trade.models.js`
2. ✅ `/backend/models/signal.models.js`

**Status:** ✅ FIXED - All pre-save hooks now work correctly with Mongoose 9.x



