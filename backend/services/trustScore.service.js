import Trade from "../models/trade.models.js";
import TrustScore from "../models/trustScore.models.js";
import User from "../models/user.models.js";

// Calculate trust score for a specific advisor
export const calculateTrustScore = async (advisorId) => {
  try {
    // Fetch all closed trades for the advisor
    const trades = await Trade.find({
      advisorId,
      status: "closed",
    }).sort({ closedAt: -1 });

    if (trades.length === 0) {
      return {
        score: 0,
        message: "No closed trades found",
      };
    }

    // Calculate metrics
    const totalTrades = trades.length;
    const winningTrades = trades.filter((t) => t.outcome === "profit").length;
    const losingTrades = trades.filter((t) => t.outcome === "loss").length;
    const winRate = (winningTrades / totalTrades) * 100;

    const totalProfit = trades
      .filter((t) => t.outcome === "profit")
      .reduce((sum, t) => sum + t.profitLoss, 0);

    const totalLoss = Math.abs(
      trades
        .filter((t) => t.outcome === "loss")
        .reduce((sum, t) => sum + t.profitLoss, 0)
    );

    const netProfitLoss = totalProfit - totalLoss;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit;

    // Average risk-reward ratio
    const avgRiskRewardRatio =
      trades.reduce((sum, t) => sum + (t.riskRewardRatio || 0), 0) / totalTrades;

    // Consistency: Calculate consecutive wins/losses
    let consecutiveWins = 0;
    let consecutiveLosses = 0;
    let currentStreak = 0;
    let streakType = null;

    for (const trade of trades) {
      if (trade.outcome === "profit") {
        if (streakType === "win") {
          currentStreak++;
        } else {
          consecutiveWins = Math.max(consecutiveWins, currentStreak);
          currentStreak = 1;
          streakType = "win";
        }
      } else if (trade.outcome === "loss") {
        if (streakType === "loss") {
          currentStreak++;
        } else {
          consecutiveLosses = Math.max(consecutiveLosses, currentStreak);
          currentStreak = 1;
          streakType = "loss";
        }
      }
    }

    // Calculate time-based metrics
    const now = Date.now();
    const last7Days = trades.filter(
      (t) => now - new Date(t.closedAt).getTime() < 7 * 24 * 60 * 60 * 1000
    );
    const last30Days = trades.filter(
      (t) => now - new Date(t.closedAt).getTime() < 30 * 24 * 60 * 60 * 1000
    );

    const last7DaysWinRate =
      last7Days.length > 0
        ? (last7Days.filter((t) => t.outcome === "profit").length / last7Days.length) * 100
        : 0;

    const last30DaysWinRate =
      last30Days.length > 0
        ? (last30Days.filter((t) => t.outcome === "profit").length / last30Days.length) * 100
        : 0;

    // Calculate average holding period (in hours)
    const avgHoldingPeriod =
      trades.reduce((sum, t) => {
        const duration = new Date(t.closedAt).getTime() - new Date(t.createdAt).getTime();
        return sum + duration / (1000 * 60 * 60); // Convert to hours
      }, 0) / totalTrades;

    // Calculate score breakdown (out of 100)
    const winRateScore = Math.min((winRate / 70) * 40, 40); // 40% weight, 70% win rate = full score
    const riskRewardScore = Math.min((avgRiskRewardRatio / 2) * 30, 30); // 30% weight, 2:1 RR = full score
    const consistencyScore = Math.min((consecutiveWins / 5) * 20, 20); // 20% weight, 5 consecutive wins = full score
    const volumeScore = Math.min((totalTrades / 50) * 10, 10); // 10% weight, 50 trades = full score

    const finalScore = Math.round(
      winRateScore + riskRewardScore + consistencyScore + volumeScore
    );

    // Update or create trust score record
    const trustScoreData = {
      advisorId,
      score: finalScore,
      totalTrades,
      winningTrades,
      losingTrades,
      winRate: parseFloat(winRate.toFixed(2)),
      avgRiskRewardRatio: parseFloat(avgRiskRewardRatio.toFixed(2)),
      totalProfit: parseFloat(totalProfit.toFixed(2)),
      totalLoss: parseFloat(totalLoss.toFixed(2)),
      netProfitLoss: parseFloat(netProfitLoss.toFixed(2)),
      profitFactor: parseFloat(profitFactor.toFixed(2)),
      consecutiveWins,
      consecutiveLosses,
      avgHoldingPeriod: parseFloat(avgHoldingPeriod.toFixed(2)),
      last7DaysWinRate: parseFloat(last7DaysWinRate.toFixed(2)),
      last30DaysWinRate: parseFloat(last30DaysWinRate.toFixed(2)),
      scoreBreakdown: {
        winRateScore: parseFloat(winRateScore.toFixed(2)),
        riskRewardScore: parseFloat(riskRewardScore.toFixed(2)),
        consistencyScore: parseFloat(consistencyScore.toFixed(2)),
        volumeScore: parseFloat(volumeScore.toFixed(2)),
      },
      lastCalculatedAt: new Date(),
    };

    const trustScore = await TrustScore.findOneAndUpdate(
      { advisorId },
      trustScoreData,
      { upsert: true, new: true }
    );

    // Update user's trust score
    await User.findByIdAndUpdate(advisorId, {
      trustScore: finalScore,
      winRate: parseFloat(winRate.toFixed(2)),
      totalProfit: parseFloat(totalProfit.toFixed(2)),
      totalLoss: parseFloat(totalLoss.toFixed(2)),
      totalTrades,
    });

    return trustScore;
  } catch (error) {
    console.error("Error calculating trust score:", error);
    throw error;
  }
};

// Calculate trust scores for all advisors
export const calculateAllTrustScores = async () => {
  try {
    const advisors = await User.find({ role: "advisor", isVerified: true });
    const results = [];

    for (const advisor of advisors) {
      try {
        const trustScore = await calculateTrustScore(advisor._id);
        results.push({
          advisorId: advisor._id,
          name: advisor.name,
          score: trustScore.score,
          success: true,
        });
      } catch (error) {
        results.push({
          advisorId: advisor._id,
          name: advisor.name,
          error: error.message,
          success: false,
        });
      }
    }

    return results;
  } catch (error) {
    console.error("Error calculating all trust scores:", error);
    throw error;
  }
};

export default {
  calculateTrustScore,
  calculateAllTrustScores,
};
