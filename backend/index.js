import express from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import ConnectDB from "./Db/Db.js";
import AuthRouter from "./routes/auth.routes.js";
import UserRouter from "./routes/user.routes.js";
import AdvisorRouter from "./routes/advisor.routes.js";
import TradeRouter from "./routes/trade.routes.js";
import InvestorRouter from "./routes/investor.routes.js";
import AdminRouter from "./routes/admin.routes.js";
import BlockchainRouter from "./routes/blockchain.routes.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import { initializeSocket } from "./services/socket.service.js";
import initTrustScoreCron from "./cron/trustScore.cron.js";
import MonitorManager from "./services/tradeMonitor.service.js";
import AINewsRouter from "./routes/aiNews.routes.js";
import IncrementRouter from "./routes/increment.routes.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8901;

// Create HTTP server for Socket.io
const server = createServer(app);

// Initialize Socket.io
initializeSocket(server);

// Connect to MongoDB
ConnectDB();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ["*", "http://localhost:5173", "http://localhost:5174"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Routes
app.use("/api/auth", AuthRouter);
app.use("/api/user", UserRouter);
app.use("/api/advisor", AdvisorRouter);
app.use("/api/trade", TradeRouter);
app.use("/api/investor", InvestorRouter);
app.use("/api/admin", AdminRouter);
app.use("/api/blockchain", BlockchainRouter);
app.use("/api/ai-news", AINewsRouter);
app.use("/api/increment", IncrementRouter);
// Health check
app.get("/", (req, res) => {
  res.json({
    message: "Technova API is running",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      user: "/api/user",
      advisor: "/api/advisor",
      trade: "/api/trade",
      investor: "/api/investor",
      admin: "/api/admin",
      blockchain: "/api/blockchain",
      aiNews: "/api/ai-news",
    }
  });
});

// Initialize cron jobs
initTrustScoreCron();

// Start server
server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Socket.io is ready for real-time connections`);
  // console.log(`Trust score cron job is scheduled`);

  // Restart monitors for all active and pending trades
  try {
    const monitorCount = await MonitorManager.restartAllMonitors();
    console.log(`Restarted ${monitorCount} trade monitors`);
  } catch (error) {
    console.error("Failed to restart monitors:", error.message);
  }
});
