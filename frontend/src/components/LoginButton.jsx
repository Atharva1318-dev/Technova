
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUserData } from '../redux/userSlice';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthDataContext } from '../context/AuthDataContext.jsx';
import { toast } from 'react-toastify';

const LoginButton = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userData = useSelector((state) => state.user.userData);
  const { serverUrl } = useContext(AuthDataContext);

  const handleLogout = async () => {
    try {
      // Clear Redux FIRST before API call
      dispatch(setUserData(null));
      
      // Then call logout API
      await axios.post(
        `${serverUrl}/api/auth/logout`, 
        {}, 
        { withCredentials: true }
      );
      
      toast.success("Logged out successfully");
      
      // Navigate to home, not login
      navigate("/");
      
    } catch (error) {
      console.error("Logout error:", error);
      // Redux already cleared, just navigate
      navigate("/");
    }
  };

  const handleLoginSignup = () => {
    navigate("/login");
  };

  return (
    <div>
      {userData ? (
        <button 
          onClick={handleLogout} 
          className='bg-red-500 hover:bg-red-600 text-white rounded-3xl px-4 py-2 font-medium transition'
        >
          Logout
        </button>
      ) : (
        <button 
          onClick={handleLoginSignup} 
          className='bg-black hover:bg-gray-900 text-white rounded-3xl px-4 py-2 font-medium transition'
        >
          Login/Signup
        </button>
      )}
    </div>
  );
};

export default LoginButton;