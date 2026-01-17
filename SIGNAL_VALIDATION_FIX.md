# Signal Validation Error Fix

## Problem
Creating signals was failing with validation error:
```
ValidationError: Signal validation failed: riskLevel: Path `riskLevel` is required.
```

## Root Cause
The `riskLevel` field was marked as `required: true` in the Signal schema, but it's supposed to be auto-calculated by the pre-save hook. 

### The Issue
In Mongoose, the validation happens **BEFORE** the pre-save hooks run. So even though we have a pre-save hook that calculates `riskLevel`, validation fails first because the field is required but not provided.

**Order of Operations:**
1. ❌ **Validation** runs first → `riskLevel` is required but undefined → ERROR
2. ⏭️ **Pre-save hook** never runs → `riskLevel` never gets calculated

---

## Solution Applied

Changed `riskLevel` from required to optional with a default value:

### File: `/backend/models/signal.models.js`

**Before:**
```javascript
riskLevel: { 
  type: String, 
  enum: ["low", "medium", "high"], 
  required: true  // ❌ Causes validation error
},
```

**After:**
```javascript
riskLevel: { 
  type: String, 
  enum: ["low", "medium", "high"], 
  default: "medium"  // ✅ Default value, auto-calculated in pre-save hook
},
```

### Why This Works

**New Order of Operations:**
1. ✅ **Validation** passes → `riskLevel` has default value "medium"
2. ✅ **Pre-save hook** runs → Calculates actual risk level based on stop loss
3. ✅ **Save** succeeds → Signal saved with correct risk level

---

## How Risk Level is Calculated

The pre-save hook automatically calculates risk level based on stop loss distance:

```javascript
signalSchema.pre("save", function () {
  if (this.entryPrice && this.stopLoss) {
    const slPercentage = Math.abs((this.entryPrice - this.stopLoss) / this.entryPrice) * 100;
    
    if (slPercentage <= 2) {
      this.riskLevel = "low";      // SL within 2%
    } else if (slPercentage <= 5) {
      this.riskLevel = "medium";   // SL within 5%
    } else {
      this.riskLevel = "high";     // SL > 5%
    }
  }
});
```

### Examples

| Entry Price | Stop Loss | SL % | Risk Level |
|-------------|-----------|------|------------|
| 2500 | 2450 | 2.0% | low |
| 2500 | 2400 | 4.0% | medium |
| 2500 | 2300 | 8.0% | high |

---

## Testing

### Test Creating a Signal

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
```json
{
  "message": "Signal created successfully",
  "trade": {
    "_id": "...",
    "symbol": "RELIANCE",
    "entryPrice": 2500,
    "stopLoss": 2400,
    "target": 2600,
    "riskRewardRatio": "1.67",
    "status": "active"
  },
  "signal": {
    "_id": "...",
    "symbol": "RELIANCE",
    "entryPrice": 2500,
    "stopLoss": 2400,
    "target": 2600,
    "riskLevel": "medium",  // ✅ Auto-calculated (4% SL)
    "status": "active"
  }
}
```

---

## Impact

### Before Fix
- ❌ Signal creation failed with validation error
- ❌ Trades couldn't be created
- ❌ Monitoring system couldn't start
- ❌ Frontend showed error messages

### After Fix
- ✅ Signals create successfully
- ✅ Risk level calculated automatically
- ✅ Trades save properly
- ✅ Monitoring starts automatically
- ✅ Frontend works correctly

---

## Related Fields

### Other Auto-Calculated Fields

Both Trade and Signal models have auto-calculated fields:

#### Trade Model
- **riskRewardRatio**: Calculated in pre-save hook
  ```javascript
  risk = |entryPrice - stopLoss|
  reward = |target - entryPrice|
  riskRewardRatio = reward / risk
  ```

#### Signal Model
- **riskLevel**: Calculated in pre-save hook (based on SL distance)

### Why Not Required?

Fields that are auto-calculated should **NOT** be marked as `required: true` because:
1. They're not provided in the request
2. They're calculated by the system
3. Validation runs before calculation
4. Use `default` value instead

---

## Best Practices

### Auto-Calculated Fields Pattern

```javascript
// ✅ CORRECT: Use default value
fieldName: {
  type: String,
  enum: ["value1", "value2"],
  default: "value1"  // Provides default, allows pre-save to override
}

// ❌ WRONG: Mark as required
fieldName: {
  type: String,
  enum: ["value1", "value2"],
  required: true  // Validation fails before pre-save hook
}
```

### Pre-Save Hook Order

1. **Validation** (checks required fields, enums, etc.)
2. **Pre-save hooks** (calculate derived fields)
3. **Save** (write to database)

**Key Point:** If a field is calculated in a pre-save hook, don't mark it as required!

---

## Files Modified

1. **`/backend/models/signal.models.js`**
   - Changed `riskLevel` from `required: true` to `default: "medium"`
   - Pre-save hook still calculates actual risk level

---

## Verification Checklist

- [x] `riskLevel` no longer required
- [x] `riskLevel` has default value
- [x] Pre-save hook still calculates risk level
- [x] Validation passes before pre-save
- [x] Signal creation works
- [x] Risk level calculated correctly

---

## Additional Notes

### Why Default "medium"?

The default value "medium" is used as a fallback:
- If `entryPrice` or `stopLoss` is missing, it stays "medium"
- If calculation succeeds, it gets overwritten with actual value
- Provides a safe middle-ground default

### Enum Validation

The `enum` validation still applies:
```javascript
enum: ["low", "medium", "high"]
```
This ensures `riskLevel` can only be one of these three values, whether it's the default or calculated.

---

## Summary

**Problem:** Signal validation failed because `riskLevel` was required but not provided  
**Cause:** Auto-calculated fields can't be required (validation runs before calculation)  
**Solution:** Changed `riskLevel` to have default value instead of being required  
**Result:** ✅ Signals now create successfully with auto-calculated risk level

**Status:** ✅ FIXED - Signals can now be created and risk level is calculated automatically

