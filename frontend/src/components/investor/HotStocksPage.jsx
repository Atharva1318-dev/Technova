import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, RefreshCw, Search } from "lucide-react";

const HotStocksPage = () => {
  const [selectedStock, setSelectedStock] = useState("RELIANCE");
  const [timeframe, setTimeframe] = useState("1"); // 1 min or 15 min
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stockInfo, setStockInfo] = useState(null);
  const [customSymbol, setCustomSymbol] = useState("");

  // Popular stocks with their ISIN codes
  const popularStocks = [
    { symbol: "RELIANCE", name: "Reliance Industries", isin: "INE002A01018" },
    { symbol: "TCS", name: "Tata Consultancy Services", isin: "INE467B01029" },
    { symbol: "INFY", name: "Infosys", isin: "INE009A01021" },
    { symbol: "HDFCBANK", name: "HDFC Bank", isin: "INE040A01034" },
    { symbol: "ICICIBANK", name: "ICICI Bank", isin: "INE090A01021" },
    { symbol: "SBIN", name: "State Bank of India", isin: "INE062A01020" },
    { symbol: "BHARTIARTL", name: "Bharti Airtel", isin: "INE397D01024" },
    { symbol: "ITC", name: "ITC Limited", isin: "INE154A01025" },
  ];

  useEffect(() => {
    fetchStockData();
  }, [selectedStock, timeframe]);

  const fetchStockData = async () => {
    setLoading(true);
    try {
      const stock = popularStocks.find(s => s.symbol === selectedStock);
      if (!stock) {
        toast.error("Stock not found");
        return;
      }

      // Fetch from Upstox API
      const interval = timeframe === "1" ? "1minute" : "15minute";
      const url = `https://api.upstox.com/v3/historical-candle/intraday/NSE_EQ%7C${stock.isin}/${interval}`;
      
      const response = await axios.get(url);
      
      if (response.data && response.data.data && response.data.data.candles) {
        const candles = response.data.data.candles;
        
        // Transform data for Recharts
        const formattedData = candles.map((candle, index) => ({
          time: new Date(candle[0]).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          timestamp: candle[0],
          open: candle[1],
          high: candle[2],
          low: candle[3],
          close: candle[4],
          volume: candle[5],
        })).reverse(); // Reverse to show oldest to newest

        setChartData(formattedData);
        
        // Calculate stock info
        if (formattedData.length > 0) {
          const latest = formattedData[formattedData.length - 1];
          const previous = formattedData[formattedData.length - 2] || latest;
          const change = latest.close - previous.close;
          const changePercent = (change / previous.close) * 100;

          setStockInfo({
            currentPrice: latest.close,
            change: change,
            changePercent: changePercent,
            high: Math.max(...formattedData.map(d => d.high)),
            low: Math.min(...formattedData.map(d => d.low)),
            volume: formattedData.reduce((sum, d) => sum + d.volume, 0),
          });
        }
      } else {
        // Fallback to mock data if API fails
        generateMockData();
      }
    } catch (error) {
      console.error("Error fetching stock data:", error);
      toast.error("Failed to fetch stock data, using mock data");
      generateMockData();
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    const basePrice = 2500;
    const data = [];
    const now = new Date();
    
    for (let i = 60; i >= 0; i--) {
      const time = new Date(now.getTime() - i * (timeframe === "1" ? 60000 : 900000));
      const randomChange = (Math.random() - 0.5) * 50;
      const price = basePrice + randomChange;
      
      data.push({
        time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        timestamp: time.getTime(),
        close: price,
        open: price - (Math.random() - 0.5) * 10,
        high: price + Math.random() * 20,
        low: price - Math.random() * 20,
        volume: Math.floor(Math.random() * 100000),
      });
    }

    setChartData(data);
    
    const latest = data[data.length - 1];
    const previous = data[data.length - 2];
    const change = latest.close - previous.close;
    
    setStockInfo({
      currentPrice: latest.close,
      change: change,
      changePercent: (change / previous.close) * 100,
      high: Math.max(...data.map(d => d.high)),
      low: Math.min(...data.map(d => d.low)),
      volume: data.reduce((sum, d) => sum + d.volume, 0),
    });
  };

  const handleStockChange = (symbol) => {
    setSelectedStock(symbol);
  };

  const handleCustomSearch = () => {
    if (customSymbol.trim()) {
      setSelectedStock(customSymbol.toUpperCase());
      setCustomSymbol("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hot Stocks</h1>
          <p className="text-gray-600 mt-1">Real-time market data and charts</p>
        </div>
        <button
          onClick={fetchStockData}
          className="flex items-center gap-2 px-4 py-2 bg-[#0077b6] text-white rounded-lg hover:bg-[#005a8d] transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stock Selector */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-wrap gap-2 mb-4">
          {popularStocks.map((stock) => (
            <button
              key={stock.symbol}
              onClick={() => handleStockChange(stock.symbol)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                selectedStock === stock.symbol
                  ? "bg-[#0077b6] text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {stock.symbol}
            </button>
          ))}
        </div>

        {/* Custom Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search custom stock symbol..."
              value={customSymbol}
              onChange={(e) => setCustomSymbol(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCustomSearch()}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0077b6]"
            />
          </div>
          <button
            onClick={handleCustomSearch}
            className="px-6 py-2.5 bg-[#0077b6] text-white rounded-lg hover:bg-[#005a8d] transition font-medium"
          >
            Search
          </button>
        </div>
      </div>

      {/* Stock Info Card */}
      {stockInfo && (
        <div className="bg-gradient-to-r from-[#0077b6] to-[#00b4d8] rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">{selectedStock}</h2>
              <p className="text-sm text-white/80">
                {popularStocks.find(s => s.symbol === selectedStock)?.name || "Stock"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">₹{stockInfo.currentPrice.toFixed(2)}</p>
              <div className={`flex items-center gap-1 justify-end mt-1 ${
                stockInfo.change >= 0 ? "text-green-300" : "text-red-300"
              }`}>
                {stockInfo.change >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="font-semibold">
                  {stockInfo.change >= 0 ? "+" : ""}
                  {stockInfo.change.toFixed(2)} ({stockInfo.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <p className="text-xs text-white/70 mb-1">High</p>
              <p className="font-bold">₹{stockInfo.high.toFixed(2)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <p className="text-xs text-white/70 mb-1">Low</p>
              <p className="font-bold">₹{stockInfo.low.toFixed(2)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <p className="text-xs text-white/70 mb-1">Volume</p>
              <p className="font-bold">{(stockInfo.volume / 1000).toFixed(1)}K</p>
            </div>
          </div>
        </div>
      )}

      {/* Timeframe Selector */}
      <div className="flex gap-3">
        <button
          onClick={() => setTimeframe("1")}
          className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
            timeframe === "1"
              ? "bg-[#0077b6] text-white shadow-md"
              : "bg-white border border-gray-300 text-gray-700 hover:border-[#0077b6]"
          }`}
        >
          1 Minute
        </button>
        <button
          onClick={() => setTimeframe("15")}
          className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
            timeframe === "15"
              ? "bg-[#0077b6] text-white shadow-md"
              : "bg-white border border-gray-300 text-gray-700 hover:border-[#0077b6]"
          }`}
        >
          15 Minutes
        </button>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Price Chart - {timeframe} Minute Interval
        </h3>
        
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0077b6]"></div>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="time" 
                stroke="#666"
                style={{ fontSize: '12px' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="#666"
                style={{ fontSize: '12px' }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}
                labelStyle={{ color: '#374151', fontWeight: 'bold' }}
              />
              <Line
                type="monotone"
                dataKey="close"
                stroke="#0077b6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: '#0077b6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-96 text-gray-500">
            No data available
          </div>
        )}
      </div>

      {/* Additional Stock Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Today's High</p>
              <p className="text-xl font-bold text-gray-900">
                ₹{stockInfo?.high.toFixed(2) || "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Today's Low</p>
              <p className="text-xl font-bold text-gray-900">
                ₹{stockInfo?.low.toFixed(2) || "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Volume</p>
              <p className="text-xl font-bold text-gray-900">
                {stockInfo ? (stockInfo.volume / 1000).toFixed(1) + "K" : "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Market Insights */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Market Insights</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">Trend</span>
            <span className={`font-semibold ${
              stockInfo?.change >= 0 ? "text-green-600" : "text-red-600"
            }`}>
              {stockInfo?.change >= 0 ? "Bullish 📈" : "Bearish 📉"}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">Volatility</span>
            <span className="font-semibold text-gray-900">
              {stockInfo ? (
                Math.abs(stockInfo.changePercent) > 2 ? "High" : 
                Math.abs(stockInfo.changePercent) > 1 ? "Medium" : "Low"
              ) : "-"}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">Data Points</span>
            <span className="font-semibold text-gray-900">{chartData.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotStocksPage;
