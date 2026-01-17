import React from 'react'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginButton = () => {
  const navigate = useNavigate();
  const { userData, logout } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logout();
      console.log("Logout successful");
      navigate("/login");
    } catch (error) {
      console.error("Logout Failed", error);
    }
  }
  
  const handleLoginSignup = () => {
    navigate("/login");
  }
  
  return (
    <div>
      {userData ? (
        <button onClick={handleLogout} className='bg-red-400 rounded-3xl px-4 py-2'>
          Logout
        </button>
      ) : (
        <button onClick={handleLoginSignup} className='bg-black text-white rounded-3xl px-4 py-2'>
          Login/Signup
        </button>
      )}
    </div>
  )
}

export default LoginButton