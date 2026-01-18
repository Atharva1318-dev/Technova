import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axios from "axios";

const BlockchainVerification = ({ advisorId, tradeId }) => {
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState(null);
  const [error, setError] = useState(null);

  const verifyTrade = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `http://localhost:8901/api/blockchain/trade/${tradeId}/verify`
      );
      setVerification(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to verify trade");
    } finally {
      setLoading(false);
    }
  };

  const getExplorerLink = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8901/api/blockchain/trade/${tradeId}/explorer`
      );
      window.open(response.data.explorerUrl, "_blank");
    } catch (err) {
      setError("Failed to get explorer link");
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Blockchain Verification</h3>
        <div className="flex items-center gap-2">
          {verification?.verification?.verified ? (
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              ✓ Verified
            </span>
          ) : (
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
              Not Verified
            </span>
          )}
        </div>
      </div>

      {!verification && (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            Verify this trade on the Solana blockchain for transparency
          </p>
          <Button onClick={verifyTrade} disabled={loading}>
            {loading ? "Verifying..." : "Verify on Blockchain"}
          </Button>
        </div>
      )}

      {verification && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Trade ID</p>
              <p className="font-mono text-sm">{verification.tradeId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-semibold">
                {verification.verification.isValid ? "Valid" : "Invalid"}
              </p>
            </div>
          </div>

          {verification.verification.onChainData && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">On-Chain Data</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Symbol</p>
                  <p>{verification.verification.onChainData.symbol}</p>
                </div>
                <div>
                  <p className="text-gray-600">Entry Price</p>
                  <p>₹{verification.verification.onChainData.entryPrice}</p>
                </div>
                <div>
                  <p className="text-gray-600">Exit Price</p>
                  <p>₹{verification.verification.onChainData.exitPrice}</p>
                </div>
                <div>
                  <p className="text-gray-600">P&L</p>
                  <p
                    className={
                      verification.verification.onChainData.profitLoss >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    ₹{verification.verification.onChainData.profitLoss}
                  </p>
                </div>
              </div>
            </div>
          )}

          {verification.verification.discrepancies?.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-semibold text-red-600 mb-2">
                ⚠️ Discrepancies Found
              </h4>
              <ul className="list-disc list-inside text-sm text-red-600">
                {verification.verification.discrepancies.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={getExplorerLink} variant="outline" size="sm">
              View on Solana Explorer
            </Button>
            <Button onClick={verifyTrade} variant="outline" size="sm">
              Re-verify
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
          {error}
        </div>
      )}
    </Card>
  );
};

export default BlockchainVerification;

