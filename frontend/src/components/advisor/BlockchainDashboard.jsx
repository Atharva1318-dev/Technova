import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axios from "axios";

const BlockchainDashboard = ({ advisorId }) => {
  const [loading, setLoading] = useState(false);
  const [escrowStatus, setEscrowStatus] = useState(null);
  const [blockchainTrades, setBlockchainTrades] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (advisorId) {
      fetchBlockchainData();
    }
  }, [advisorId]);

  const fetchBlockchainData = async () => {
    if (!advisorId) {
      console.log("No advisor ID available yet");
      return;
    }

    setLoading(true);
    try {
      // Fetch escrow status
      const escrowRes = await axios.get(
        `http://localhost:8901/api/blockchain/advisor/${advisorId}/escrow`
      );
      setEscrowStatus(escrowRes.data);

      // Fetch blockchain trades
      const tradesRes = await axios.get(
        `http://localhost:8901/api/blockchain/advisor/${advisorId}/trades`
      );
      setBlockchainTrades(tradesRes.data.trades || []);

      // Fetch blockchain stats
      const statsRes = await axios.get(
        `http://localhost:8901/api/blockchain/advisor/${advisorId}/stats`
      );
      setStats(statsRes.data.stats);
    } catch (err) {
      console.error("Error fetching blockchain data:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Blockchain Wallet</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600">Solana Wallet Address</p>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-gray-100 px-3 py-1 rounded flex-1 overflow-x-auto">
                {escrowStatus?.solanaWallet || "Not generated"}
              </code>
              {escrowStatus?.solanaWallet && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(escrowStatus.solanaWallet)}
                >
                  Copy
                </Button>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600">Escrow PDA</p>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-gray-100 px-3 py-1 rounded flex-1 overflow-x-auto">
                {escrowStatus?.escrowPDA || "Not created"}
              </code>
              {escrowStatus?.escrowPDA && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(escrowStatus.escrowPDA)}
                >
                  Copy
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <div>
              <p className="text-sm text-gray-600">Escrow Status</p>
              <p className="font-semibold">
                {escrowStatus?.escrowStatus?.exists ? (
                  <span className="text-green-600">✓ Active</span>
                ) : (
                  <span className="text-gray-600">Not Created</span>
                )}
              </p>
            </div>
            {escrowStatus?.escrowStatus?.balance > 0 && (
              <div>
                <p className="text-sm text-gray-600">Balance</p>
                <p className="font-semibold">
                  {escrowStatus.escrowStatus.balance} SOL
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Blockchain Stats */}
      {stats && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">On-Chain Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Trades</p>
              <p className="text-2xl font-bold">{stats.totalTrades}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Win Rate</p>
              <p className="text-2xl font-bold">{stats.winRate}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Net P&L</p>
              <p
                className={`text-2xl font-bold ${stats.netProfitLoss >= 0 ? "text-green-600" : "text-red-600"
                  }`}
              >
                ₹{stats.netProfitLoss}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Trust Score</p>
              <p className="text-2xl font-bold">{stats.trustScore}/100</p>
            </div>
          </div>
          {stats.mock && (
            <p className="text-xs text-gray-500 mt-4">
              * Stats will be live once the Solana program is deployed
            </p>
          )}
        </Card>
      )}

      {/* Blockchain Trades */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">On-Chain Trade History</h3>
          <Button size="sm" variant="outline" onClick={fetchBlockchainData}>
            Refresh
          </Button>
        </div>

        {blockchainTrades.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No trades recorded on blockchain yet</p>
            <p className="text-sm mt-2">
              Closed trades will automatically be written to the blockchain
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {blockchainTrades.map((trade, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{trade.symbol}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(trade.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${trade.profitLoss >= 0
                        ? "text-green-600"
                        : "text-red-600"
                        }`}
                    >
                      {trade.profitLoss >= 0 ? "+" : ""}₹{trade.profitLoss}
                    </p>
                    <p className="text-sm text-gray-600">
                      {trade.outcome.toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span>Entry: ₹{trade.entryPrice}</span>
                  <span>Exit: ₹{trade.exitPrice}</span>
                  {trade.transactionId && (
                    <Button
                      size="sm"
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() =>
                        window.open(
                          `https://explorer.solana.com/tx/${trade.transactionId}?cluster=devnet`,
                          "_blank"
                        )
                      }
                    >
                      View on Explorer →
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Info Banner */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="text-blue-600 text-xl">ℹ️</div>
          <div className="flex-1">
            <p className="font-semibold text-blue-900">
              Blockchain Transparency
            </p>
            <p className="text-sm text-blue-800 mt-1">
              All your closed trades are automatically recorded on the Solana
              blockchain, providing transparent and immutable proof of your
              trading performance. Investors can verify your track record
              independently.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BlockchainDashboard;

