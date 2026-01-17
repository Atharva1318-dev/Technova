import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthDataContext } from "../../context/AuthDataContext";
import { Wallet, TrendingUp, TrendingDown, RefreshCw, Plus, Minus } from "lucide-react";
import { useSelector } from "react-redux";

const WalletPage = () => {
  const [balance, setBalance] = useState(100000);
  const [transactions, setTransactions] = useState([]);
  const { serverUrl } = useContext(AuthDataContext);
  const userData = useSelector((state) => state.user.userData);

  useEffect(() => {
    if (userData) {
      setBalance(userData.paperTradingBalance || 100000);
    }
    // Mock transactions for now
    setTransactions([
      { id: 1, type: "credit", amount: 100000, description: "Initial Balance", date: new Date() },
    ]);
  }, [userData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
        <p className="text-gray-600 mt-1">Manage your paper trading balance</p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-[#0077b6] to-[#00b4d8] rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-white/80 mb-2">Paper Trading Balance</p>
            <p className="text-5xl font-bold">₹{balance.toLocaleString()}</p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <Wallet className="w-8 h-8" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition backdrop-blur-sm">
            <Plus className="w-5 h-5" />
            <span className="font-semibold">Add Funds</span>
          </button>
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition backdrop-blur-sm">
            <Minus className="w-5 h-5" />
            <span className="font-semibold">Withdraw</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Available Balance</p>
              <p className="text-xl font-bold text-gray-900">₹{balance.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Invested Amount</p>
              <p className="text-xl font-bold text-gray-900">₹0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Returns</p>
              <p className="text-xl font-bold text-gray-900">₹0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Transaction History</h3>
        </div>

        <div className="p-6">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No transactions yet
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${
                      txn.type === "credit" ? "bg-green-100" : "bg-red-100"
                    }`}>
                      {txn.type === "credit" ? (
                        <Plus className="w-5 h-5 text-green-600" />
                      ) : (
                        <Minus className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{txn.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(txn.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className={`text-lg font-bold ${
                    txn.type === "credit" ? "text-green-600" : "text-red-600"
                  }`}>
                    {txn.type === "credit" ? "+" : "-"}₹{txn.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
