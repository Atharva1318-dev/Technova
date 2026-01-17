import { Server } from "socket.io";

let io = null;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "*"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Join advisor-specific room
    socket.on("join-advisor-room", (advisorId) => {
      socket.join(`advisor-${advisorId}`);
      console.log(`Advisor ${advisorId} joined their room`);
    });

    // Join investor-specific room
    socket.on("join-investor-room", (investorId) => {
      socket.join(`investor-${investorId}`);
      console.log(`Investor ${investorId} joined their room`);
    });

    // Join global signals feed
    socket.on("join-signals-feed", () => {
      socket.join("signals-feed");
      console.log(`Client ${socket.id} joined signals feed`);
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initializeSocket first.");
  }
  return io;
};

// Emit new signal to all investors
export const emitNewSignal = (signal) => {
  if (io) {
    io.to("signals-feed").emit("new-signal", signal);
    console.log(`📡 New signal emitted: ${signal.symbol}`);
  }
};

// Emit trade update to specific advisor
export const emitTradeUpdate = (advisorId, trade) => {
  if (io) {
    io.to(`advisor-${advisorId}`).emit("trade-update", trade);
    console.log(`📡 Trade update emitted to advisor ${advisorId}`);
  }
};

// Emit target hit notification
export const emitTargetHit = (advisorId, trade) => {
  if (io) {
    io.to(`advisor-${advisorId}`).emit("target-hit", trade);
    io.to("signals-feed").emit("signal-closed", { tradeId: trade._id, outcome: "target-hit" });
    console.log(`🎯 Target hit emitted for trade ${trade._id}`);
  }
};

// Emit stop loss hit notification
export const emitStopLossHit = (advisorId, trade) => {
  if (io) {
    io.to(`advisor-${advisorId}`).emit("sl-hit", trade);
    io.to("signals-feed").emit("signal-closed", { tradeId: trade._id, outcome: "sl-hit" });
    console.log(`🛑 Stop loss hit emitted for trade ${trade._id}`);
  }
};

// Emit trade closed notification
export const emitTradeClosed = (advisorId, trade) => {
  if (io) {
    io.to(`advisor-${advisorId}`).emit("trade-closed", trade);
    io.to("signals-feed").emit("signal-closed", { tradeId: trade._id, outcome: trade.outcome });
    console.log(`✅ Trade closed emitted for trade ${trade._id}`);
  }
};

// Emit paper trade update to investor
export const emitPaperTradeUpdate = (investorId, paperTrade) => {
  if (io) {
    io.to(`investor-${investorId}`).emit("paper-trade-update", paperTrade);
    console.log(`📊 Paper trade update emitted to investor ${investorId}`);
  }
};

// Emit trust score update to advisor
export const emitTrustScoreUpdate = (advisorId, trustScore) => {
  if (io) {
    io.to(`advisor-${advisorId}`).emit("trust-score-update", trustScore);
    console.log(`⭐ Trust score update emitted to advisor ${advisorId}`);
  }
};

export default {
  initializeSocket,
  getIO,
  emitNewSignal,
  emitTradeUpdate,
  emitTargetHit,
  emitStopLossHit,
  emitTradeClosed,
  emitPaperTradeUpdate,
  emitTrustScoreUpdate,
};
