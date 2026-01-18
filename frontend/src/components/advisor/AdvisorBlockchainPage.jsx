import { useSelector } from "react-redux";
import BlockchainDashboard from "./BlockchainDashboard";

const AdvisorBlockchainPage = () => {
  const userData = useSelector((state) => state.user.userData);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Blockchain Transparency</h1>
        <p className="text-gray-600">
          Your trading performance, verified on the Solana blockchain
        </p>
      </div>

      <BlockchainDashboard advisorId={userData?._id} />
    </div>
  );
};

export default AdvisorBlockchainPage;

