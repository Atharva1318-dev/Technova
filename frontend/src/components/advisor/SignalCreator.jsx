import React, { useState, useContext } from "react";
import { X, Search, TrendingUp, TrendingDown } from "lucide-react";
import axios from "axios";
import { AuthDataContext } from "../../context/AuthDataContext";
import { toast } from "react-toastify";

const SignalCreator = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    symbol: "",
    orderType: "market",
    direction: "buy",
    quantity: "",
    limitPrice: "",
    stopPrice: "",
    stopLoss: "",
    target: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const { serverUrl } = useContext(AuthDataContext);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.symbol || !formData.quantity || !formData.stopLoss || !formData.target) {
      toast.error("Please fill all required fields");
      return;
    }

    if (formData.orderType === "limit" && !formData.limitPrice) {
      toast.error("Limit price is required for limit orders");
      return;
    }

    if (formData.orderType === "stop-limit" && (!formData.stopPrice || !formData.limitPrice)) {
      toast.error("Stop price and limit price are required for stop-limit orders");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${serverUrl}/api/trade/signal`,
        {
          symbol: formData.symbol.toUpperCase(),
          orderType: formData.orderType,
          direction: formData.direction,
          quantity: parseFloat(formData.quantity),
          limitPrice: formData.limitPrice ? parseFloat(formData.limitPrice) : undefined,
          stopPrice: formData.stopPrice ? parseFloat(formData.stopPrice) : undefined,
          stopLoss: parseFloat(formData.stopLoss),
          target: parseFloat(formData.target),
          notes: formData.notes,
        },
        { withCredentials: true }
      );

      toast.success("Signal created successfully!");
      onSuccess();
    } catch (error) {
      console.error("Error creating signal:", error);
      toast.error(error.response?.data?.message || "Failed to create signal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Create Trading Signal</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Symbol Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Symbol *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="e.g., NIFTY 25JAN 18000 CE, RELIANCE, BANKNIFTY"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter stock symbol or F&O contract (e.g., NIFTY 25JAN 18000 CE)
            </p>
          </div>

          {/* Direction */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Direction *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, direction: "buy" })}
                className={`p-4 rounded-lg border-2 transition flex items-center justify-center gap-2 ${
                  formData.direction === "buy"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                <span className="font-semibold">Buy</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, direction: "sell" })}
                className={`p-4 rounded-lg border-2 transition flex items-center justify-center gap-2 ${
                  formData.direction === "sell"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <TrendingDown className="w-5 h-5" />
                <span className="font-semibold">Sell</span>
              </button>
            </div>
          </div>

          {/* Order Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Type *
            </label>
            <select
              value={formData.orderType}
              onChange={(e) => setFormData({ ...formData, orderType: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
            >
              <option value="market">Market Order</option>
              <option value="limit">Limit Order</option>
              <option value="stop-limit">Stop-Limit Order</option>
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity *
            </label>
            <input
              type="number"
              placeholder="Enter quantity"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
            />
          </div>

          {/* Conditional Price Fields */}
          {formData.orderType === "limit" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Limit Price *
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="Enter limit price"
                value={formData.limitPrice}
                onChange={(e) => setFormData({ ...formData, limitPrice: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
              />
            </div>
          )}

          {formData.orderType === "stop-limit" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stop Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Stop price"
                  value={formData.stopPrice}
                  onChange={(e) => setFormData({ ...formData, stopPrice: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Limit Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Limit price"
                  value={formData.limitPrice}
                  onChange={(e) => setFormData({ ...formData, limitPrice: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                />
              </div>
            </div>
          )}

          {/* Stop Loss & Target */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stop Loss * <span className="text-red-600">⚠</span>
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="SL price"
                value={formData.stopLoss}
                onChange={(e) => setFormData({ ...formData, stopLoss: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target * <span className="text-green-600">🎯</span>
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="Target price"
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              placeholder="Add any additional notes or analysis..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.notes.length}/500 characters
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-900 transition disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Signal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignalCreator;
