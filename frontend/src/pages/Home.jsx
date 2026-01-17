import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginButton from '../components/LoginButton';

const Home = () => {
  const navigate = useNavigate();
  const userData = useSelector((state) => state.user.userData);

  useEffect(() => {
    if (userData) {
      // Redirect based on role
      if (userData.role === 'advisor') {
        if (!userData.isVerified) {
          navigate('/advisor/onboarding');
        } else {
          navigate('/advisor/dashboard');
        }
      } else if (userData.role === 'investor') {
        navigate('/investor/dashboard');
      } else if (userData.role === 'admin') {
        navigate('/admin/panel');
      }
    }
  }, [userData, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to Technova
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Blockchain-Verified Trading Signals Platform
        </p>
        <p className="text-gray-500 mb-12 max-w-2xl mx-auto">
          Connect with SEBI-registered advisors, follow verified trading signals,
          and practice with paper trading. All trades are transparently recorded
          on the Solana blockchain.
        </p>
        <LoginButton />
      </div>
    </div>
  );
};

export default Home;