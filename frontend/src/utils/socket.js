import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:8901";

let socket = null;

export const initializeSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
  }

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Join rooms
export const joinAdvisorRoom = (advisorId) => {
  const sock = getSocket();
  sock.emit("join-advisor-room", advisorId);
};

export const joinInvestorRoom = (investorId) => {
  const sock = getSocket();
  sock.emit("join-investor-room", investorId);
};

export const joinSignalsFeed = () => {
  const sock = getSocket();
  sock.emit("join-signals-feed");
};

// Event listeners
export const onNewSignal = (callback) => {
  const sock = getSocket();
  sock.on("new-signal", callback);
};

export const onTradeUpdate = (callback) => {
  const sock = getSocket();
  sock.on("trade-update", callback);
};

export const onTargetHit = (callback) => {
  const sock = getSocket();
  sock.on("target-hit", callback);
};

export const onStopLossHit = (callback) => {
  const sock = getSocket();
  sock.on("sl-hit", callback);
};

export const onTradeClosed = (callback) => {
  const sock = getSocket();
  sock.on("trade-closed", callback);
};

export const onSignalClosed = (callback) => {
  const sock = getSocket();
  sock.on("signal-closed", callback);
};

export const onPaperTradeUpdate = (callback) => {
  const sock = getSocket();
  sock.on("paper-trade-update", callback);
};

export const onTrustScoreUpdate = (callback) => {
  const sock = getSocket();
  sock.on("trust-score-update", callback);
};

// Remove event listeners
export const offNewSignal = (callback) => {
  const sock = getSocket();
  sock.off("new-signal", callback);
};

export const offTradeUpdate = (callback) => {
  const sock = getSocket();
  sock.off("trade-update", callback);
};

export default {
  initializeSocket,
  getSocket,
  disconnectSocket,
  joinAdvisorRoom,
  joinInvestorRoom,
  joinSignalsFeed,
  onNewSignal,
  onTradeUpdate,
  onTargetHit,
  onStopLossHit,
  onTradeClosed,
  onSignalClosed,
  onPaperTradeUpdate,
  onTrustScoreUpdate,
  offNewSignal,
  offTradeUpdate,
};
