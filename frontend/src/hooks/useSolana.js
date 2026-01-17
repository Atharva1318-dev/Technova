import { useState, useEffect } from "react";
import { getWalletBalance, isValidPublicKey } from "../utils/solana";

export const useSolana = (publicKey) => {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!publicKey || !isValidPublicKey(publicKey)) {
      setBalance(null);
      setError("Invalid public key");
      return;
    }

    const fetchBalance = async () => {
      setLoading(true);
      setError(null);
      try {
        const bal = await getWalletBalance(publicKey);
        setBalance(bal);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [publicKey]);

  return { balance, loading, error };
};

export default useSolana;
