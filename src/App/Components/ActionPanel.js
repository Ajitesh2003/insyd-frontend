import React, { useState } from "react";

const ActionPanel = ({
  currentUser,
  users,
  posts,
  onCreatePost,
  onFollowUser,
  onLikePost,
  onCommentPost,
}) => {
  const [postContent, setPostContent] = useState("");
  const [selectedUserToFollow, setSelectedUserToFollow] = useState("");
  const [commentTexts, setCommentTexts] = useState({});

  const handleCreatePost = () => {
    if (!postContent.trim()) {
      alert("Please enter post content");
      return;
    }
    onCreatePost(postContent);
    setPostContent("");
  };

  const handleFollowUser = () => {
    if (!selectedUserToFollow) {
      alert("Please select a user to follow");
      return;
    }
    if (selectedUserToFollow === currentUser._id) {
      alert("You cannot follow yourself");
      return;
    }
    onFollowUser(selectedUserToFollow);
    setSelectedUserToFollow("");
  };

  const handleComment = (postId) => {
    const comment = commentTexts[postId];
    if (!comment?.trim()) {
      alert("Please enter a comment");
      return;
    }
    onCommentPost(postId, comment);
    setCommentTexts({ ...commentTexts, [postId]: "" });
  };

  if (!currentUser) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">
          Please select a user to see actions
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Post */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Create Post</h3>
        <textarea
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full p-3 border rounded-lg resize-none"
          rows="3"
        />
        <button
          onClick={handleCreatePost}
          className="mt-3 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
        >
          Create Post
        </button>
      </div>

      {/* Follow User */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Follow User</h3>
        <select
          value={selectedUserToFollow}
          onChange={(e) => setSelectedUserToFollow(e.target.value)}
          className="w-full p-2 border rounded-lg mb-3"
        >
          <option value="">Select user to follow...</option>
          {users
            .filter((user) => user._id !== currentUser._id)
            .map((user) => (
              <option key={user._id} value={user._id}>
                {user.name}
              </option>
            ))}
        </select>
        <button
          onClick={handleFollowUser}
          className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
        >
          Follow
        </button>
      </div>

      {/* Recent Posts */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Posts</h3>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {posts.length === 0 ? (
            <p className="text-gray-500 text-center">No posts yet</p>
          ) : (
            posts.slice(0, 5).map((post) => (
              <div key={post._id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-sm">
                    {post.authorId.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-sm text-gray-700 mb-3">{post.content}</p>

                <div className="flex items-center space-x-2 mb-3">
                  <button
                    onClick={() => onLikePost(post._id)}
                    className="flex items-center space-x-1 text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200 transition-colors"
                  >
                    <span>❤️</span>
                    <span>{post.likes.length}</span>
                  </button>
                  <span className="text-xs text-gray-500">
                    💬 {post.comments.length}
                  </span>
                </div>

                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={commentTexts[post._id] || ""}
                    onChange={(e) =>
                      setCommentTexts({
                        ...commentTexts,
                        [post._id]: e.target.value,
                      })
                    }
                    placeholder="Add a comment..."
                    className="flex-1 text-xs p-2 border rounded"
                  />
                  <button
                    onClick={() => handleComment(post._id)}
                    className="text-xs bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 transition-colors"
                  >
                    Comment
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionPanel;
