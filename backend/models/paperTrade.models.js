import mongoose from "mongoose";
const { Schema, model } = mongoose;

const paperTradeSchema = new Schema(
  {
    investorId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
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
    direction: { 
      type: String, 
      enum: ["buy", "sell"], 
      required: true 
    },
    entryPrice: { 
      type: Number, 
      required: true 
    },
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
    exitPrice: { 
      type: Number 
    },
    status: { 
      type: String, 
      enum: ["active", "closed"], 
      default: "active" 
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
    closedAt: { 
      type: Date 
    },
    closedReason: { 
      type: String, 
      enum: ["target-hit", "sl-hit", "manual", "advisor-closed"], 
    },
  },
  { timestamps: true }
);

const PaperTrade = model("PaperTrade", paperTradeSchema);
export default PaperTrade;
