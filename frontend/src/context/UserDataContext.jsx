
import React, { useEffect, useContext, useState } from "react";
import { useDispatch } from "react-redux";
import axios from "axios";
import { setUserData } from "../redux/userSlice";
import { AuthDataContext } from "./AuthDataContext";

const UserDataContext = () => {
  const dispatch = useDispatch();
  const { serverUrl } = useContext(AuthDataContext);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    // Only fetch once on mount
    if (hasFetched) return;

    const fetchUser = async () => {
      try {
        const response = await axios.get(`${serverUrl}/api/user/current`, {
          withCredentials: true,
        });
        
        if (response.data.user) {
          dispatch(setUserData(response.data.user));
        }
      } catch (error) {
        // 401 means not logged in - this is expected, don't log error
        if (error.response?.status !== 401) {
          console.error("Error fetching user:", error);
        }
        // Clear user data if not authenticated
        dispatch(setUserData(null));
      } finally {
        setHasFetched(true);
      }
    };

    fetchUser();
  }, [dispatch, serverUrl, hasFetched]);

  return null;
};

export default UserDataContext;