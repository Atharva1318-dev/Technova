import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthDataContext } from "../../context/AuthDataContext";
import { toast } from "react-toastify";
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Search,
  Edit2,
  X as CloseIcon,
  Plus,
  AlertCircle
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const AdvisorTradePage = () => {
  const [selectedStock, setSelectedStock] = useState("RELIANCE");
  const [timeframe, setTimeframe] = useState("1");
  const [chartData, setChartData] = useState([]);
  const [stockInfo, setStockInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customSymbol, setCustomSymbol] = useState("");
  const [activeTrades, setActiveTrades] = useState([]);
  const [showSignalCreator, setShowSignalCreator] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const { serverUrl } = useContext(AuthDataContext);

  // Signal Creator Form State
  const [signalForm, setSignalForm] = useState({
    instrument: "stock",
    symbol: "",
    action: "buy",
    entryPrice: "",
    target: "",
    stopLoss: "",
    riskLevel: "medium",
    validity: "intraday",
    notes: ""
  });

  const popularStocks = [
    { symbol: "RELIANCE", name: "Reliance Industries" },
    { symbol: "TCS", name: "Tata Consultancy Services" },
    { symbol: "INFY", name: "Infosys" },
    { symbol: "HDFCBANK", name: "HDFC Bank" },
    { symbol: "ICICIBANK", name: "ICICI Bank" },
    { symbol: "SBIN", name: "State Bank of India" },
  ];

  useEffect(() => {
    fetchChartData();
    fetchActiveTrades();
  }, [selectedStock, timeframe]);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration
      const mockData = Array.from({ length: 20 }, (_, i) => ({
        time: `${i}:00`,
        price: 2400 + Math.random() * 100,
        volume: Math.floor(Math.random() * 1000000)
      }));
      
      setChartData(mockData);
      setStockInfo({
        symbol: selectedStock,
        price: mockData[mockData.length - 1].price.toFixed(2),
        change: (Math.random() * 10 - 5).toFixed(2),
        changePercent: (Math.random() * 2 - 1).toFixed(2)
      });
    } catch (error) {
      console.error("Error fetching chart data:", error);
      toast.error("Failed to load chart data");
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveTrades = async () => {
    try {
      const response = await axios.get(
        `${serverUrl}/api/advisor/trades?status=active`,
        { withCredentials: true }
      );
      setActiveTrades(response.data.trades || []);
    } catch (error) {
      console.error("Error fetching active trades:", error);
    }
  };

  const handleCreateSignal = async (e) => {
    e.preventDefault();
    
    if (!signalForm.symbol || !signalForm.entryPrice || !signalForm.target || !signalForm.stopLoss) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await axios.post(
        `${serverUrl}/api/advisor/signal/create`,
        {
          ...signalForm,
          orderType: "market",
          direction: signalForm.action,
          quantity: 1
        },
        { withCredentials: true }
      );
      
      toast.success("Signal created successfully!");
      setShowSignalCreator(false);
      setSignalForm({
        instrument: "stock",
        symbol: "",
        action: "buy",
        entryPrice: "",
        target: "",
        stopLoss: "",
        riskLevel: "medium",
        validity: "intraday",
        notes: ""
      });
      fetchActiveTrades();
    } catch (error) {
      console.error("Error creating signal:", error);
      toast.error(error.response?.data?.message || "Failed to create signal");
    }
  };

  const handleEditTrade = async (tradeId, updates) => {
    try {
      await axios.put(
        `${serverUrl}/api/advisor/trade/${tradeId}`,
        updates,
        { withCredentials: true }
      );
      toast.success("Trade updated successfully");
      setEditingTrade(null);
      fetchActiveTrades();
    } catch (error) {
      console.error("Error updating trade:", error);
      toast.error("Failed to update trade");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trade</h1>
          <p className="text-gray-600 mt-1">Create signals and manage active trades</p>
        </div>
        <button
          onClick={() => setShowSignalCreator(!showSignalCreator)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a1a2e] text-white rounded-lg hover:bg-[#16213e] transition font-medium"
        >
          <Plus className="w-4 h-4" />
          Create New Signal
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section - 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stock Selector */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search stock symbol..."
                    value={customSymbol}
                    onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && customSymbol) {
                        setSelectedStock(customSymbol);
                        setCustomSymbol("");
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a1a2e]"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                {popularStocks.slice(0, 4).map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => setSelectedStock(stock.symbol)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                      selectedStock === stock.symbol
                        ? "bg-[#1a1a2e] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {stock.symbol}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setTimeframe("1")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    timeframe === "1"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  1 Min
                </button>
                <button
                  onClick={() => setTimeframe("15")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    timeframe === "15"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  15 Min
                </button>
                <button
                  onClick={fetchChartData}
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  <RefreshCw className="w-4 h-4 text-gray-700" />
                </button>
              </div>
            </div>
          </div>

          {/* Stock Info */}
          {stockInfo && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{stockInfo.symbol}</h2>
                  <p className="text-3xl font-bold text-gray-900 mt-2">₹{stockInfo.price}</p>
                </div>
                <div className={`text-right ${parseFloat(stockInfo.change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <div className="flex items-center gap-2 justify-end">
                    {parseFloat(stockInfo.change) >= 0 ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                    <span className="text-xl font-bold">{stockInfo.change}</span>
                  </div>
                  <p className="text-lg font-semibold mt-1">({stockInfo.changePercent}%)</p>
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Price Chart ({timeframe} min)</h3>
            {loading ? (
              <div className="flex items-center justify-center h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a1a2e]"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" stroke="#666" />
                  <YAxis stroke="#666" domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #ddd',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#1a1a2e" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Signal Creator Form */}
          {showSignalCreator && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Create New Signal</h3>
                <button
                  onClick={() => setShowSignalCreator(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <CloseIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleCreateSignal} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Instrument Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instrument Type *
                    </label>
                    <select
                      value={signalForm.instrument}
                      onChange={(e) => setSignalForm({ ...signalForm, instrument: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a1a2e]"
                    >
                      <option value="stock">Stock</option>
                      <option value="futures">Futures & Options</option>
                      <option value="index">Index</option>
                      <option value="commodity">Commodity</option>
                    </select>
                  </div>

                  {/* Symbol */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Symbol *
                    </label>
                    <input
                      type="text"
                      value={signalForm.symbol}
                      onChange={(e) => setSignalForm({ ...signalForm, symbol: e.target.value.toUpperCase() })}
                      placeholder="e.g., RELIANCE, NIFTY"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a1a2e]"
                      required
                    />
                  </div>

                  {/* Action Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Action Type *
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSignalForm({ ...signalForm, action: "buy" })}
                        className={`flex-1 py-2 rounded-lg font-medium transition ${
                          signalForm.action === "buy"
                            ? "bg-green-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Buy
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignalForm({ ...signalForm, action: "sell" })}
                        className={`flex-1 py-2 rounded-lg font-medium transition ${
                          signalForm.action === "sell"
                            ? "bg-red-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Sell
                      </button>
                    </div>
                  </div>

                  {/* Entry Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Entry Price * (Auto-locked)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={signalForm.entryPrice}
                      onChange={(e) => setSignalForm({ ...signalForm, entryPrice: e.target.value })}
                      placeholder="Current market price"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a1a2e]"
                      required
                    />
                  </div>

                  {/* Target Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={signalForm.target}
                      onChange={(e) => setSignalForm({ ...signalForm, target: e.target.value })}
                      placeholder="Target price"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a1a2e]"
                      required
                    />
                  </div>

                  {/* Stop Loss */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stop Loss *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={signalForm.stopLoss}
                      onChange={(e) => setSignalForm({ ...signalForm, stopLoss: e.target.value })}
                      placeholder="Stop loss price"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a1a2e]"
                      required
                    />
                  </div>

                  {/* Risk Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Risk Level *
                    </label>
                    <select
                      value={signalForm.riskLevel}
                      onChange={(e) => setSignalForm({ ...signalForm, riskLevel: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a1a2e]"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  {/* Validity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Validity *
                    </label>
                    <select
                      value={signalForm.validity}
                      onChange={(e) => setSignalForm({ ...signalForm, validity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a1a2e]"
                    >
                      <option value="intraday">Intraday</option>
                      <option value="positional">Positional</option>
                      <option value="btst">BTST</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rationale/Notes (Optional)
                  </label>
                  <textarea
                    value={signalForm.notes}
                    onChange={(e) => setSignalForm({ ...signalForm, notes: e.target.value })}
                    placeholder="Add your analysis or reasoning..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a1a2e] resize-none"
                  />
                </div>

                {/* Warning */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Important Notice</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Once published, this trade cannot be edited or deleted. Please review all details carefully.
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-3 bg-[#1a1a2e] text-white font-semibold rounded-lg hover:bg-[#16213e] transition"
                >
                  Publish Signal
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Active Trades Sidebar - 1/3 width */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm sticky top-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Active & Pending Trades</h3>
            
            <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
              {activeTrades.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No active trades</p>
                </div>
              ) : (
                activeTrades.map((trade) => (
                  <div 
                    key={trade._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-900">{trade.symbol}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        trade.direction === 'buy' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {trade.direction.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="text-sm space-y-1 text-gray-600">
                      <div className="flex justify-between">
                        <span>Entry:</span>
                        <span className="font-semibold">₹{trade.entryPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Target:</span>
                        <span className="font-semibold text-green-600">₹{trade.target}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SL:</span>
                        <span className="font-semibold text-red-600">₹{trade.stopLoss}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setEditingTrade(trade)}
                      className="w-full mt-3 flex items-center justify-center gap-2 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-sm font-medium"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Trade
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Trade Modal */}
      {editingTrade && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Edit Trade</h3>
              <button
                onClick={() => setEditingTrade(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <CloseIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue={editingTrade.target}
                  id="edit-target"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a1a2e]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stop Loss
                </label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue={editingTrade.stopLoss}
                  id="edit-sl"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a1a2e]"
                />
              </div>

              <button
                onClick={() => {
                  const target = document.getElementById("edit-target").value;
                  const stopLoss = document.getElementById("edit-sl").value;
                  handleEditTrade(editingTrade._id, { target, stopLoss });
                }}
                className="w-full py-3 bg-[#1a1a2e] text-white font-semibold rounded-lg hover:bg-[#16213e] transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvisorTradePage;

