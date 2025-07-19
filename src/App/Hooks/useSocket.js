import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const useSocket = (serverUrl = "https://insyd-backend-p1ul.onrender.com") => {
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(serverUrl, {
      transports: ["websocket", "polling"],
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("Connected to server:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [serverUrl]);

  const joinRoom = (userId) => {
    if (socketRef.current) {
      socketRef.current.emit("join", userId);
    }
  };

  const onNotification = (callback) => {
    if (socketRef.current) {
      socketRef.current.on("notification", callback);
    }
  };

  const offNotification = (callback) => {
    if (socketRef.current) {
      socketRef.current.off("notification", callback);
    }
  };

  return {
    socket: socketRef.current,
    joinRoom,
    onNotification,
    offNotification,
  };
};

export default useSocket;
