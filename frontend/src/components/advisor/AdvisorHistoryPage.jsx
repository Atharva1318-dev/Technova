import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthDataContext } from "../../context/AuthDataContext";
import { toast } from "react-toastify";
import { 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Download,
  Search
} from "lucide-react";

const AdvisorHistoryPage = () => {
  const [trades, setTrades] = useState([]);
  const [filteredTrades, setFilteredTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, won, lost
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState(null);
  const { serverUrl } = useContext(AuthDataContext);

  useEffect(() => {
    fetchTradeHistory();
  }, []);

  useEffect(() => {
    filterTrades();
  }, [trades, filter, searchTerm]);

  const fetchTradeHistory = async () => {
    try {
      setLoading(true);
      const [tradesRes, statsRes] = await Promise.all([
        axios.get(`${serverUrl}/api/advisor/trades/history`, { withCredentials: true }),
        axios.get(`${serverUrl}/api/advisor/dashboard/stats`, { withCredentials: true })
      ]);
      
      setTrades(tradesRes.data.trades || []);
      setStats(statsRes.data.stats);
    } catch (error) {
      console.error("Error fetching trade history:", error);
      toast.error("Failed to load trade history");
    } finally {
      setLoading(false);
    }
  };

  const filterTrades = () => {
    let filtered = [...trades];

    // Filter by status
    if (filter === "won") {
      filtered = filtered.filter(t => t.status === "closed" && t.profitLoss > 0);
    } else if (filter === "lost") {
      filtered = filtered.filter(t => t.status === "closed" && t.profitLoss < 0);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTrades(filtered);
  };

  const exportToCSV = () => {
    const csvContent = [
      ["Symbol", "Direction", "Entry", "Exit", "P&L", "Status", "Date"],
      ...filteredTrades.map(t => [
        t.symbol,
        t.direction,
        t.entryPrice,
        t.exitPrice || "N/A",
        t.profitLoss || 0,
        t.status,
        new Date(t.createdAt).toLocaleDateString()
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trade-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success("Trade history exported!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a1a2e]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trade History</h1>
          <p className="text-gray-600 mt-1">Complete record of all your trades</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a1a2e] text-white rounded-lg hover:bg-[#16213e] transition font-medium"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Total Trades</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.totalTrades || 0}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Won Trades</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{stats?.wonTrades || 0}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Lost Trades</span>
          </div>
          <p className="text-3xl font-bold text-red-600">{stats?.lostTrades || 0}</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Win Rate</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.winRate?.toFixed(1) || 0}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === "all"
                  ? "bg-[#1a1a2e] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Trades
            </button>
            <button
              onClick={() => setFilter("won")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === "won"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Won
            </button>
            <button
              onClick={() => setFilter("lost")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === "lost"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Lost
            </button>
          </div>

          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by symbol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#1a1a2e]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Trades Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Symbol
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Direction
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Entry Price
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Exit Price
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Stop Loss
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  P&L
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No trades found</p>
                  </td>
                </tr>
              ) : (
                filteredTrades.map((trade) => (
                  <tr key={trade._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">{trade.symbol}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        trade.direction === 'buy' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {trade.direction === 'buy' ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {trade.direction.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{trade.entryPrice?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {trade.exitPrice ? `₹${trade.exitPrice.toFixed(2)}` : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      ₹{trade.target?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                      ₹{trade.stopLoss?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-semibold ${
                        (trade.profitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(trade.profitLoss || 0) >= 0 ? '+' : ''}₹{trade.profitLoss?.toFixed(2) || '0.00'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        trade.status === 'closed' && (trade.profitLoss || 0) > 0
                          ? 'bg-green-100 text-green-700'
                          : trade.status === 'closed' && (trade.profitLoss || 0) < 0
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {trade.status === 'closed' && (trade.profitLoss || 0) > 0 && (
                          <CheckCircle className="w-3 h-3" />
                        )}
                        {trade.status === 'closed' && (trade.profitLoss || 0) < 0 && (
                          <XCircle className="w-3 h-3" />
                        )}
                        {trade.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(trade.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination (if needed) */}
      {filteredTrades.length > 0 && (
        <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredTrades.length}</span> of{" "}
            <span className="font-semibold">{trades.length}</span> trades
          </p>
        </div>
      )}
    </div>
  );
};

export default AdvisorHistoryPage;



