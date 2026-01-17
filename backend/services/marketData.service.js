import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const MARKET_DATA_API_KEY = process.env.MARKET_DATA_API_KEY;
const MARKET_DATA_API_URL = process.env.MARKET_DATA_API_URL || "https://api.example.com";

// Mock market data for development
const mockPrices = {
  "NIFTY": 18500,
  "BANKNIFTY": 45000,
  "RELIANCE": 2500,
  "TCS": 3500,
  "INFY": 1500,
};

// Fetch live price for a symbol
export const getLivePrice = async (symbol) => {
  try {
    // In production, replace with actual API call
    if (!MARKET_DATA_API_KEY) {
      console.log(`[MOCK] Fetching price for ${symbol}`);
      const basePrice = mockPrices[symbol.split(" ")[0]] || 100;
      const randomVariation = (Math.random() - 0.5) * 10;
      return basePrice + randomVariation;
    }

    // Example API call (replace with actual market data provider)
    const response = await axios.get(`${MARKET_DATA_API_URL}/quote`, {
      params: { symbol, apikey: MARKET_DATA_API_KEY },
    });

    return response.data.price;
  } catch (error) {
    console.error("Error fetching live price:", error.message);
    // Fallback to mock data
    const basePrice = mockPrices[symbol.split(" ")[0]] || 100;
    return basePrice + (Math.random() - 0.5) * 10;
  }
};

// Fetch multiple prices at once
export const getBulkPrices = async (symbols) => {
  try {
    const prices = {};
    for (const symbol of symbols) {
      prices[symbol] = await getLivePrice(symbol);
    }
    return prices;
  } catch (error) {
    console.error("Error fetching bulk prices:", error);
    throw error;
  }
};

// Parse complex symbol queries (e.g., "NIFTY 25JAN 18000 CE")
export const parseSymbol = (query) => {
  const parts = query.trim().toUpperCase().split(" ");
  
  if (parts.length === 1) {
    // Simple equity symbol
    return {
      underlying: parts[0],
      type: "equity",
      expiry: null,
      strike: null,
      optionType: null,
    };
  }
  
  if (parts.length === 4) {
    // Options: NIFTY 25JAN 18000 CE
    return {
      underlying: parts[0],
      type: "options",
      expiry: parts[1],
      strike: parseFloat(parts[2]),
      optionType: parts[3], // CE or PE
    };
  }
  
  if (parts.length === 2) {
    // Futures: NIFTY 25JAN
    return {
      underlying: parts[0],
      type: "futures",
      expiry: parts[1],
      strike: null,
      optionType: null,
    };
  }
  
  // Default to equity
  return {
    underlying: query,
    type: "equity",
    expiry: null,
    strike: null,
    optionType: null,
  };
};

// Validate if market is open
export const isMarketOpen = () => {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  // Market closed on weekends
  if (day === 0 || day === 6) {
    return false;
  }
  
  // Market hours: 9:15 AM to 3:30 PM IST
  const currentTime = hours * 60 + minutes;
  const marketOpen = 9 * 60 + 15; // 9:15 AM
  const marketClose = 15 * 60 + 30; // 3:30 PM
  
  return currentTime >= marketOpen && currentTime <= marketClose;
};

// Get market status
export const getMarketStatus = () => {
  const open = isMarketOpen();
  return {
    isOpen: open,
    status: open ? "open" : "closed",
    message: open ? "Market is currently open" : "Market is currently closed",
  };
};

// Detect gap (difference between previous close and current open)
export const detectGap = async (symbol, previousClose) => {
  try {
    const currentPrice = await getLivePrice(symbol);
    const gapPercentage = ((currentPrice - previousClose) / previousClose) * 100;
    
    return {
      hasGap: Math.abs(gapPercentage) > 1, // Gap if > 1%
      gapPercentage: gapPercentage.toFixed(2),
      previousClose,
      currentPrice,
      direction: gapPercentage > 0 ? "gap-up" : "gap-down",
    };
  } catch (error) {
    console.error("Error detecting gap:", error);
    throw error;
  }
};

export default {
  getLivePrice,
  getBulkPrices,
  parseSymbol,
  isMarketOpen,
  getMarketStatus,
  detectGap,
};
