import { useEffect } from "react";
import { initializeSocket, disconnectSocket } from "../utils/socket";

export const useSocket = () => {
  useEffect(() => {
    const socket = initializeSocket();

    return () => {
      // Don't disconnect on unmount, keep connection alive
      // disconnectSocket();
    };
  }, []);

  return initializeSocket();
};

export default useSocket;
