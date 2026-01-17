import cron from "node-cron";
import { calculateAllTrustScores } from "../services/trustScore.service.js";
import { emitTrustScoreUpdate } from "../services/socket.service.js";

// Run trust score calculation daily at 4:00 PM IST (after market closes)
export const initTrustScoreCron = () => {
  // Cron expression: "0 16 * * *" = Every day at 4:00 PM
  // For testing, you can use "*/5 * * * *" = Every 5 minutes
  
  cron.schedule("0 16 * * *", async () => {
    console.log("🔄 Running daily trust score calculation...");
    
    try {
      const results = await calculateAllTrustScores();
      
      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      
      console.log(`✅ Trust score calculation completed:`);
      console.log(`   - Successful: ${successful}`);
      console.log(`   - Failed: ${failed}`);
      
      // Emit real-time updates to advisors
      results.forEach((result) => {
        if (result.success) {
          emitTrustScoreUpdate(result.advisorId, {
            score: result.score,
            timestamp: new Date(),
          });
        }
      });
      
    } catch (error) {
      console.error("❌ Error in trust score cron job:", error);
    }
  });
  
  console.log("⏰ Trust score cron job initialized (runs daily at 4:00 PM IST)");
};

export default initTrustScoreCron;
