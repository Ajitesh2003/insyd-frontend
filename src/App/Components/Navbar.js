import React from "react";

const Navbar = ({ currentUser, unreadCount, onUserChange, users }) => {
  return (
    <nav className="bg-white shadow-lg p-4 mb-6">
      <div className="container mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-300 text-purple-600">
            Insyd Notifications
          </h1>
          <p className="text-gray-600 text-sm">
            Real-time notification system POC
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={currentUser?._id || ""}
            onChange={(e) => onUserChange(e.target.value)}
            className="p-2 border rounded-lg"
          >
            <option value="">Select User</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name}
              </option>
            ))}
          </select>

          {currentUser && (
            <div className="flex items-center space-x-2">
              <span className="text-gray-700">Welcome, {currentUser.name}</span>
              <div className="relative">
                <span className="text-2xl">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
