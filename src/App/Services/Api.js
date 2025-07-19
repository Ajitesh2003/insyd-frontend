import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://insyd-backend-p1ul.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Users API
export const usersAPI = {
  getAll: () => api.get("/users"),
  follow: (userId, followerId) =>
    api.post(`/users/${userId}/follow`, { followerId }),
};

// Posts API
export const postsAPI = {
  getAll: () => api.get("/posts"),
  create: (postData) => api.post("/posts", postData),
  like: (postId, userId) => api.post(`/posts/${postId}/like`, { userId }),
  comment: (postId, userId, text) =>
    api.post(`/posts/${postId}/comments`, { userId, text }),
};

// Notifications API
export const notificationsAPI = {
  getByUser: (userId, page = 1, limit = 20) =>
    api.get(`/notifications/${userId}?page=${page}&limit=${limit}`),
  getUnreadCount: (userId) => api.get(`/notifications/${userId}/unread-count`),
  markAsRead: (notificationId) =>
    api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: (userId) => api.put(`/notifications/${userId}/read-all`),
};

export default api;
