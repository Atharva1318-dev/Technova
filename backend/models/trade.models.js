import mongoose from "mongoose";
const { Schema, model } = mongoose;

const tradeSchema = new Schema(
  {
    advisorId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    symbol: { 
      type: String, 
      required: true 
    }, // e.g., "NIFTY 25JAN 18000 CE"
    assetClass: { 
      type: String, 
      enum: ["equity", "futures", "options"], 
      required: true 
    },
    orderType: { 
      type: String, 
      enum: ["market", "limit", "stop-limit"], 
      required: true 
    },
    direction: { 
      type: String, 
      enum: ["buy", "sell"], 
      required: true 
    },
    entryPrice: { 
      type: Number, 
      required: true 
    },
    limitPrice: { 
      type: Number 
    }, // For limit orders
    stopPrice: { 
      type: Number 
    }, // For stop-limit orders
    quantity: { 
      type: Number, 
      required: true 
    },
    stopLoss: { 
      type: Number, 
      required: true 
    },
    target: { 
      type: Number, 
      required: true 
    },
    currentPrice: { 
      type: Number 
    },
    exitPrice: { 
      type: Number 
    },
    status: { 
      type: String, 
      enum: ["pending", "active", "closed", "cancelled"], 
      default: "pending" 
    },
    outcome: { 
      type: String, 
      enum: ["profit", "loss", "breakeven", "pending"], 
      default: "pending" 
    },
    profitLoss: { 
      type: Number, 
      default: 0 
    },
    profitLossPercentage: { 
      type: Number, 
      default: 0 
    },
    riskRewardRatio: { 
      type: Number 
    },
    closedAt: { 
      type: Date 
    },
    closedReason: { 
      type: String, 
      enum: ["target-hit", "sl-hit", "manual", "expired"], 
    },
    // Blockchain
    solanaTransactionId: { 
      type: String 
    },
    isOnChain: { 
      type: Boolean, 
      default: false 
    },
    // Metadata
    notes: { 
      type: String, 
      maxlength: 500 
    },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

// Calculate risk-reward ratio before saving
tradeSchema.pre("save", function () {
  if (this.entryPrice && this.stopLoss && this.target) {
    const risk = Math.abs(this.entryPrice - this.stopLoss);
    const reward = Math.abs(this.target - this.entryPrice);
    this.riskRewardRatio = risk > 0 ? (reward / risk).toFixed(2) : 0;
  }
});

const Trade = model("Trade", tradeSchema);
export default Trade;
