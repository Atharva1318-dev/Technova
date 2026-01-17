import mongoose from "mongoose";
const { Schema, model } = mongoose;

const trustScoreSchema = new Schema(
  {
    advisorId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      unique: true 
    },
    score: { 
      type: Number, 
      default: 0, 
      min: 0, 
      max: 100 
    },
    // Metrics
    totalTrades: { 
      type: Number, 
      default: 0 
    },
    winningTrades: { 
      type: Number, 
      default: 0 
    },
    losingTrades: { 
      type: Number, 
      default: 0 
    },
    winRate: { 
      type: Number, 
      default: 0 
    }, // Percentage
    avgRiskRewardRatio: { 
      type: Number, 
      default: 0 
    },
    totalProfit: { 
      type: Number, 
      default: 0 
    },
    totalLoss: { 
      type: Number, 
      default: 0 
    },
    netProfitLoss: { 
      type: Number, 
      default: 0 
    },
    profitFactor: { 
      type: Number, 
      default: 0 
    }, // Total Profit / Total Loss
    // Consistency metrics
    consecutiveWins: { 
      type: Number, 
      default: 0 
    },
    consecutiveLosses: { 
      type: Number, 
      default: 0 
    },
    maxDrawdown: { 
      type: Number, 
      default: 0 
    },
    avgHoldingPeriod: { 
      type: Number, 
      default: 0 
    }, // In hours
    // Time-based metrics
    last7DaysWinRate: { 
      type: Number, 
      default: 0 
    },
    last30DaysWinRate: { 
      type: Number, 
      default: 0 
    },
    // Score breakdown
    scoreBreakdown: {
      winRateScore: { type: Number, default: 0 }, // 40% weight
      riskRewardScore: { type: Number, default: 0 }, // 30% weight
      consistencyScore: { type: Number, default: 0 }, // 20% weight
      volumeScore: { type: Number, default: 0 }, // 10% weight
    },
    lastCalculatedAt: { 
      type: Date, 
      default: Date.now 
    },
  },
  { timestamps: true }
);

const TrustScore = model("TrustScore", trustScoreSchema);
export default TrustScore;
