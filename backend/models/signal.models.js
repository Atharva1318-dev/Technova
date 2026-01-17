import mongoose from "mongoose";
const { Schema, model } = mongoose;

const signalSchema = new Schema(
  {
    tradeId: { 
      type: Schema.Types.ObjectId, 
      ref: "Trade", 
      required: true 
    },
    advisorId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    symbol: { 
      type: String, 
      required: true 
    },
    assetClass: { 
      type: String, 
      enum: ["equity", "futures", "options"], 
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
    stopLoss: { 
      type: Number, 
      required: true 
    },
    target: { 
      type: Number, 
      required: true 
    },
    riskLevel: { 
      type: String, 
      enum: ["low", "medium", "high"], 
      required: true 
    },
    status: { 
      type: String, 
      enum: ["active", "closed", "expired"], 
      default: "active" 
    },
    // Engagement metrics
    views: { 
      type: Number, 
      default: 0 
    },
    followers: { 
      type: Number, 
      default: 0 
    }, // Number of investors who followed this signal
    // Visibility
    isPublic: { 
      type: Boolean, 
      default: true 
    },
    expiresAt: { 
      type: Date 
    },
  },
  { timestamps: true }
);

// Auto-calculate risk level based on stop loss distance
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
});

const Signal = model("Signal", signalSchema);
export default Signal;
