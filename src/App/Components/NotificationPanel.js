import React from "react";

const NotificationPanel = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllRead,
  loading,
}) => {
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Notifications</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Notifications</h2>
        <div className="flex items-center space-x-2">
          <span className="bg-red-500 text-white px-2 py-1 rounded-full text-sm">
            {unreadCount}
          </span>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
            >
              Mark All Read
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No notifications yet</p>
        ) : (
          // Update the notification mapping to use correct field names
          notifications.map((notification) => (
            <div
              key={notification._id}
              onClick={
                () => !notification.read && onMarkAsRead(notification._id) // Use 'read' not 'isRead'
              }
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                notification.read // Use 'read' not 'isRead'
                  ? "bg-gray-50 border-gray-200"
                  : "bg-blue-50 border-blue-200 hover:bg-blue-100"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p
                    className={`text-sm ${
                      notification.read // Use 'read' not 'isRead'
                        ? "text-gray-600"
                        : "text-gray-800 font-medium"
                    }`}
                  >
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">
                      {formatTime(notification.createdAt)}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        notification.type === "follow"
                          ? "bg-purple-100 text-purple-600"
                          : notification.type === "like"
                          ? "bg-red-100 text-red-600"
                          : notification.type === "comment"
                          ? "bg-green-100 text-green-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {notification.type}
                    </span>
                  </div>
                </div>
                {!notification.read && ( // Use 'read' not 'isRead'
                  <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
