import { useState, useEffect } from "react";
import { notificationsAPI } from "../Services/Api";

const useNotification = (currentUser, socket) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications when user changes
  useEffect(() => {
    if (currentUser) {
      fetchNotifications(currentUser._id);
      fetchUnreadCount(currentUser._id);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [currentUser]);

  // Listen for real-time notifications
  useEffect(() => {
    if (socket && socket.socket && currentUser) {
      socket.onNotification((notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });

      return () => {
        socket.offNotification();
      };
    }
  }, [socket, currentUser]);

  const fetchNotifications = async (userId) => {
    try {
      setLoading(true);
      const response = await notificationsAPI.getByUser(userId);
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async (userId) => {
    try {
      const response = await notificationsAPI.getUnreadCount(userId);
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId);

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser) return;

    try {
      await notificationsAPI.markAllAsRead(currentUser._id);

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  };
};

export default useNotification;
