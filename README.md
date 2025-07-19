# Insyd Notification System - System Design Document

## Table of Contents

1. [Overview](#overview)
2. [Requirements](#requirements)
3. [System Architecture](#system-architecture)
4. [Database Design](#database-design)
5. [API Design](#api-design)
6. [Real-time Communication](#real-time-communication)
7. [Notification Types & Logic](#notification-types--logic)
8. [Scalability Considerations](#scalability-considerations)
9. [Performance Optimizations](#performance-optimizations)
10. [Security & Privacy](#security--privacy)
11. [Monitoring & Analytics](#monitoring--analytics)
12. [Limitations & Trade-offs](#limitations--trade-offs)

---

## 1. Overview

### Problem Statement

Insyd needs a notification system to keep architecture professionals engaged by notifying them of relevant activities from their network and content interactions.

### Solution Approach

Design a scalable, real-time notification system inspired by LinkedIn's architecture but optimized for startup constraints (100 DAUs initially, scalable to 1M DAUs).

### Key Success Metrics

- **Delivery Rate**: >99% notification delivery
- **Latency**: <500ms for real-time notifications
- **Engagement**: 15%+ notification click-through rate
- **System Availability**: 99.9% uptime

---

## 2. Requirements

### 2.1 Functional Requirements

- **Real-time notifications** for user activities
- **Multiple notification types**: social, content, discovery, system
- **Notification preferences** and settings
- **Read/unread status** tracking
- **Notification history** with pagination
- **Bulk operations** for mass notifications

### 2.2 Non-Functional Requirements

- **Scalability**: Handle 100 DAUs → 1M DAUs
- **Performance**: <500ms response time
- **Availability**: 99.9% uptime
- **Consistency**: Eventually consistent notifications
- **Security**: User privacy and data protection

### 2.3 Scale Estimates

```
Current Scale (100 DAUs):
- 100 users × 50 actions/day = 5,000 events/day
- ~0.06 events/second average, ~1 events/second peak

Target Scale (1M DAUs):
- 1M users × 50 actions/day = 50M events/day
- ~580 events/second average, ~2,000 events/second peak
- ~10GB notification data/month
```

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │   API Gateway   │    │  Notification   │
│  (Web/Mobile)   │◄──►│   Load Balancer │◄──►│    Service      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                       ┌─────────────────┐             │
                       │  WebSocket      │◄────────────┘
                       │  Server         │
                       └─────────────────┘
                                │
        ┌──────────────────────────────────────────────┐
        │                                              │
        ▼                      ▼                       ▼
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  MongoDB    │    │  Redis Cache    │    │  Message Queue  │
│ (Primary DB)│    │ (Session/Cache) │    │  (Future Scale) │
└─────────────┘    └─────────────────┘    └─────────────────┘
```

### 3.2 Core Components

#### 3.2.1 Event Producer

- Captures user actions (follow, like, comment, post)
- Validates events and enriches with metadata
- Publishes events to notification processor

#### 3.2.2 Notification Processor

- Determines notification recipients using business logic
- Applies user preferences and filtering rules
- Creates notification objects

#### 3.2.3 Delivery Engine

- Real-time delivery via WebSocket
- Fallback mechanisms (push notifications, email)
- Retry logic for failed deliveries

#### 3.2.4 Notification API

- CRUD operations for notifications
- User preference management
- Analytics and reporting endpoints

---

## 4. Database Design

### 4.1 MongoDB Collections

#### Users Collection

```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  profilePicture: String,
  followers: [ObjectId], // User IDs
  following: [ObjectId], // User IDs
  notificationSettings: {
    email: Boolean,
    push: Boolean,
    inApp: Boolean,
    types: {
      social: Boolean,
      content: Boolean,
      discovery: Boolean,
      system: Boolean
    }
  },
  createdAt: Date,
  lastActive: Date
}
```

#### Posts Collection

```javascript
{
  _id: ObjectId,
  authorId: ObjectId,
  content: String,
  images: [String],
  likes: [ObjectId], // User IDs
  comments: [{
    _id: ObjectId,
    userId: ObjectId,
    text: String,
    timestamp: Date
  }],
  tags: [String],
  visibility: String, // public, followers, private
  createdAt: Date,
  updatedAt: Date
}
```

#### Notifications Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Recipient
  type: String, // follow, like, comment, post, system
  actorId: ObjectId, // Who performed the action
  entityId: ObjectId, // Post/Comment ID (optional)
  message: String,
  metadata: {
    postTitle: String,
    commentText: String,
    // Additional context
  },
  isRead: Boolean,
  priority: String, // high, medium, low
  createdAt: Date,
  readAt: Date,
  // Indexes for efficient querying
  // Index: { userId: 1, createdAt: -1 }
  // Index: { userId: 1, isRead: 1 }
}
```

### 4.2 Database Indexing Strategy

```javascript
// Primary indexes for performance
db.notifications.createIndex({ userId: 1, createdAt: -1 });
db.notifications.createIndex({ userId: 1, isRead: 1 });
db.notifications.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ followers: 1 });
db.users.createIndex({ following: 1 });

db.posts.createIndex({ authorId: 1, createdAt: -1 });
db.posts.createIndex({ createdAt: -1 });
```

---

## 5. API Design

### 5.1 REST Endpoints

#### Notification Management

```
GET    /api/notifications              # Get user notifications (paginated)
POST   /api/notifications/:id/read     # Mark notification as read
PUT    /api/notifications/read-all     # Mark all as read
DELETE /api/notifications/:id          # Delete notification

GET    /api/notifications/unread-count # Get unread count
GET    /api/notifications/settings     # Get notification preferences
PUT    /api/notifications/settings     # Update preferences
```

#### User Actions (Trigger Notifications)

```
POST   /api/users/:id/follow           # Follow user
POST   /api/posts                      # Create post
POST   /api/posts/:id/like             # Like post
POST   /api/posts/:id/comments         # Comment on post
```

### 5.2 WebSocket Events

```javascript
// Client → Server
socket.emit("join", { userId: "user123" });
socket.emit("mark-read", { notificationId: "notif456" });

// Server → Client
socket.emit("notification", {
  id: "notif789",
  type: "like",
  message: "John liked your post",
  timestamp: "2024-01-15T10:30:00Z",
});

socket.emit("notification-read", { notificationId: "notif456" });
```

---

## 6. Real-time Communication

### 6.1 WebSocket Implementation

- **Socket.io** for real-time bidirectional communication
- **Room-based architecture**: Each user joins their own room
- **Connection management**: Handle reconnections and offline users
- **Message queuing**: Store notifications for offline users

### 6.2 Fallback Mechanisms

```
Real-time (WebSocket) → Push Notifications → Email Digest
     ↓ (if failed)           ↓ (if failed)        ↓
   Retry logic          Store for later    Daily/Weekly summary
```

---

## 7. Notification Types & Logic

### 7.1 Notification Categories

#### Social Notifications

- **New Follower**: "X started following you"
- **Follow Back**: "X followed you back"
- **Mention**: "X mentioned you in a post"

#### Content Notifications

- **New Post**: "X shared a new post"
- **Post Interaction**: "X liked/commented on your post"
- **Comment Reply**: "X replied to your comment"

#### Discovery Notifications

- **Content Shared**: "Your post was shared by X"
- **Profile Viewed**: "X viewed your profile"
- **Trending Content**: "Your post is trending"

#### System Notifications

- **Welcome**: "Welcome to Insyd!"
- **Feature Updates**: "New feature available"
- **Weekly Digest**: "Your week on Insyd"

### 7.2 Business Logic Rules

#### Notification Generation Rules

```javascript
// Follow notification
if (userA.follows(userB)) {
  notify(userB, "follow", userA, `${userA.name} started following you`);
}

// Post like notification
if (userA.likes(post) && post.author !== userA) {
  notify(post.author, "like", userA, `${userA.name} liked your post`, post.id);
}

// New post to followers
if (userA.createPost(post)) {
  userA.followers.forEach((follower) => {
    notify(follower, "post", userA, `${userA.name} shared a new post`, post.id);
  });
}
```

#### Aggregation Logic

```javascript
// Aggregate similar notifications
if (multipleUsersLikedSamePost) {
  // "John and 5 others liked your post" instead of 6 separate notifications
  aggregateNotification(postId, "like", userIds, count);
}
```

---

## 8. Scalability Considerations

### 8.1 Current Architecture (100 DAUs)

```
Single Server Setup:
├── Node.js + Express API
├── Socket.io for WebSocket
├── MongoDB (single instance)
└── Redis (optional caching)

Estimated Resources:
- 1 CPU core, 2GB RAM
- 10GB storage
- 100GB bandwidth/month
```

### 8.2 Future Architecture (1M DAUs)

```
Microservices Architecture:
├── API Gateway (Load Balancer)
├── Notification Service (Multiple instances)
├── WebSocket Service (Horizontal scaling)
├── Message Queue (Redis/RabbitMQ)
├── Database Cluster (MongoDB sharding)
└── CDN for static assets

Estimated Resources:
- 20+ CPU cores, 64GB+ RAM
- 1TB+ storage
- 10TB+ bandwidth/month
```

### 8.3 Scaling Strategies

#### Database Scaling

```javascript
// Shard notifications by userId
const shard = userId.hashCode() % numberOfShards;
const collection = `notifications_shard_${shard}`;
```

#### Horizontal Scaling

- **Load balancing** across multiple API servers
- **WebSocket clustering** with Redis adapter
- **Database read replicas** for read-heavy operations
- **CDN** for static content delivery

#### Caching Strategy

```javascript
// Cache frequently accessed data
cache.set(`user:${userId}:unread_count`, count, 300); // 5 min TTL
cache.set(`notifications:${userId}:recent`, notifications, 600); // 10 min TTL
```

---

## 9. Performance Optimizations

### 9.1 Database Optimizations

- **Compound indexes** for common query patterns
- **TTL indexes** for automatic cleanup (90-day retention)
- **Aggregation pipelines** for complex queries
- **Connection pooling** to reduce overhead

### 9.2 Application Optimizations

```javascript
// Batch notifications for bulk operations
const batchNotifications = async (notifications) => {
  await Notification.insertMany(notifications);
  notifications.forEach((notif) => {
    io.to(notif.userId).emit("notification", notif);
  });
};

// Rate limiting to prevent spam
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
});
```

### 9.3 Real-time Optimizations

- **Connection pooling** for WebSocket connections
- **Message compression** for large payloads
- **Heartbeat mechanism** to detect disconnections
- **Graceful degradation** when WebSocket fails

---

## 10. Security & Privacy

### 10.1 Data Protection

- **User consent** for notification preferences
- **Data encryption** in transit and at rest
- **Access control** - users only see their notifications
- **Data retention** policies (90-day automatic cleanup)

### 10.2 Security Measures

```javascript
// Input validation
const notificationSchema = Joi.object({
  type: Joi.string().valid("follow", "like", "comment", "post").required(),
  message: Joi.string().max(500).required(),
});

// Rate limiting per user
const userRateLimit = rateLimit({
  keyGenerator: (req) => req.user.id,
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 notifications per minute per user
});
```

### 10.3 Privacy Controls

- **Granular notification settings** by type
- **Block/mute functionality** for specific users
- **Opt-out mechanisms** for all notifications
- **GDPR compliance** for data deletion

---

## 11. Monitoring & Analytics

### 11.1 Key Metrics

```javascript
// Performance Metrics
- Notification delivery rate (target: >99%)
- Average delivery latency (target: <500ms)
- WebSocket connection success rate
- Database query performance

// Business Metrics
- Notification click-through rate
- User engagement after notifications
- Notification preferences distribution
- Most effective notification types
```

### 11.2 Monitoring Tools

- **Application monitoring**: New Relic/DataDog
- **Database monitoring**: MongoDB Compass/Atlas
- **Real-time monitoring**: Socket.io admin UI
- **Error tracking**: Sentry

### 11.3 Alerting

```javascript
// Critical alerts
- Notification delivery failure rate > 5%
- Database connection failures
- WebSocket server downtime
- Memory/CPU usage > 80%

// Warning alerts
- Notification latency > 1 second
- Unread notification backlog > 10,000
- Failed WebSocket connections > 10%
```

---

## 12. Limitations & Trade-offs

### 12.1 Current Limitations

- **No offline notification queue** in POC version
- **Basic notification preferences** (no ML-based personalization)
- **Simple aggregation logic** (no smart bundling)
- **No cross-platform push notifications**
- **Limited analytics and reporting**

### 12.2 Technical Trade-offs

```
Consistency vs Performance:
✓ Chose eventual consistency for better performance
✗ Some notifications might arrive out of order

Simplicity vs Features:
✓ Simple architecture for faster development
✗ Limited advanced features (smart notifications, ML)

Cost vs Scalability:
✓ Cost-effective for startup phase
✗ Will need significant refactoring for 1M+ users
```

### 12.3 Future Improvements

- **Machine learning** for notification relevance scoring
- **Smart aggregation** based on user behavior
- **Cross-platform push notifications** (FCM, APNs)
- **Advanced analytics** dashboard
- **A/B testing** framework for notification optimization
- **Microservices architecture** for better scalability

---

## Conclusion

This notification system design provides a solid foundation for Insyd's engagement needs, starting with a simple but scalable architecture that can grow from 100 to 1M DAUs. The design prioritizes real-time delivery, user experience, and cost-effectiveness while maintaining clear paths for future scaling and feature enhancement.

The POC implementation will validate core assumptions and provide valuable insights for the production system design.
