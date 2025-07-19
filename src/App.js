import React, { useState, useEffect } from "react";
import Navbar from "./App/Components/Navbar";
import NotificationPanel from "./App/Components/NotificationPanel";
import ActionPanel from "./App/Components/ActionPanel";
import useSocket from "./App/Hooks/useSocket";
import useNotification from "./App/Hooks/useNotification";
import { usersAPI, postsAPI } from "./App/Services/Api";
import "./App.css";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const socket = useSocket();
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    markAsRead,
    markAllAsRead,
  } = useNotification(currentUser, socket);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [usersResponse, postsResponse] = await Promise.all([
          usersAPI.getAll(),
          postsAPI.getAll(),
        ]);

        setUsers(usersResponse.data);
        setPosts(postsResponse.data);
      } catch (error) {
        console.error("Error loading initial data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Handle user change
  const handleUserChange = (userId) => {
    const user = users.find((u) => u._id === userId);
    setCurrentUser(user || null);

    if (user && socket) {
      socket.joinRoom(userId);
    }
  };

  // Load posts
  const loadPosts = async () => {
    try {
      const response = await postsAPI.getAll();
      setPosts(response.data);
    } catch (error) {
      console.error("Error loading posts:", error);
    }
  };

  // Action handlers
  const handleCreatePost = async (content) => {
    if (!currentUser) return;

    try {
      await postsAPI.create({
        authorId: currentUser._id,
        content: content,
      });

      loadPosts();
      alert("Post created successfully!");
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Error creating post");
    }
  };

  const handleFollowUser = async (userToFollowId) => {
    if (!currentUser) return;

    try {
      await usersAPI.follow(userToFollowId, currentUser._id);
      alert("User followed successfully!");
    } catch (error) {
      console.error("Error following user:", error);
      alert("Error following user");
    }
  };

  const handleLikePost = async (postId) => {
    if (!currentUser) return;

    try {
      await postsAPI.like(postId, currentUser._id);
      loadPosts();
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleCommentPost = async (postId, text) => {
    if (!currentUser) return;

    try {
      await postsAPI.comment(postId, currentUser._id, text);
      loadPosts();
    } catch (error) {
      console.error("Error commenting on post:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Insyd Notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar
        currentUser={currentUser}
        unreadCount={unreadCount}
        onUserChange={handleUserChange}
        users={users}
      />

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NotificationPanel
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={markAsRead}
            onMarkAllRead={markAllAsRead}
            loading={notificationsLoading}
          />

          <ActionPanel
            currentUser={currentUser}
            users={users}
            posts={posts}
            onCreatePost={handleCreatePost}
            onFollowUser={handleFollowUser}
            onLikePost={handleLikePost}
            onCommentPost={handleCommentPost}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
