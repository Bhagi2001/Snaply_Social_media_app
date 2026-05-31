# 📱 SocialApp — Instagram-Like Social Media Platform

A full-stack, production-ready social media mobile application built with the **MERN stack** and **React Native (Expo)**.

![Stack](https://img.shields.io/badge/React_Native-Expo-blue)
![Stack](https://img.shields.io/badge/Node.js-Express-green)
![Stack](https://img.shields.io/badge/Database-MongoDB-brightgreen)
![Stack](https://img.shields.io/badge/Realtime-Socket.IO-black)
![Stack](https://img.shields.io/badge/Storage-Cloudinary-purple)

---

## ✨ Features

### Core
- 🔐 **JWT Authentication** — Register, login, refresh tokens
- 👤 **User Profiles** — Avatar, bio, website, verified badges
- 👥 **Follow System** — Follow/unfollow, followers/following lists
- 📝 **Posts** — Multi-image/video upload, captions, hashtags, location
- ❤️ **Like & Save** — Double-tap heart animation, bookmarks
- 💬 **Comments** — Nested replies, like comments
- 📰 **Social Feed** — Infinite scrolling, pull-to-refresh
- 🔍 **Explore** — Trending posts, user search
- 🤝 **Suggested Users** — Based on mutual connections

### Real-Time
- 💬 **Chat** — One-to-one messaging with Socket.IO
- ⌨️ **Typing Indicators** — Real-time typing status
- 🟢 **Online Status** — Live online/offline tracking
- 🖼️ **Image Sharing** — Share images in chat

### Stories & Notifications
- 📸 **Stories** — 24-hour auto-delete, gradient rings, viewer list
- 🔔 **Notifications** — Likes, comments, follows, mentions
- 📲 **Push Notifications** — Firebase Cloud Messaging

### UI/UX
- 🌙 **Dark Mode** — Full dark/light theme support
- 💫 **Animations** — Heart burst, shimmer loading, transitions
- 📱 **Mobile-First** — Instagram-inspired modern UI

---

## 🏗 Architecture

```
📱 React Native (Expo)
    ├── Context API (Auth, Theme, Socket)
    ├── Axios (REST API)
    └── Socket.IO Client (Real-time)
            ↓
⚙️ Node.js + Express
    ├── REST API Routes
    ├── Socket.IO Server
    ├── JWT Authentication
    └── Multer (File uploads)
            ↓
🗄️ MongoDB (Mongoose ODM)
☁️ Cloudinary (Media CDN)
🔔 Firebase (Push Notifications)
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ 
- **MongoDB** (local or [Atlas](https://mongodb.com/cloud/atlas))
- **Expo CLI** (`npm install -g expo-cli`)
- **Cloudinary** account (free tier: [cloudinary.com](https://cloudinary.com))
- **Firebase** project (optional, for push notifications)

### 1. Clone & Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secrets, and Cloudinary credentials

# Start the server
npm run dev
```

The server will start at `http://localhost:5000`

### 2. Setup Mobile App

```bash
cd mobile

# Install dependencies
npm install

# Start Expo
npx expo start
```

### 3. Configure API URL

Edit `mobile/src/config/api.js` and set the correct backend URL:
- **Android Emulator**: `http://10.0.2.2:5000/api`
- **iOS Simulator**: `http://localhost:5000/api`
- **Physical Device**: `http://<your-local-ip>:5000/api`

---

## 📁 Project Structure

```
├── backend/
│   ├── config/          # DB, Cloudinary, Firebase config
│   ├── controllers/     # Request handlers
│   ├── middleware/       # Auth, error handling, validation
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API route definitions
│   ├── socket/          # Socket.IO event handlers
│   ├── utils/           # Cloudinary upload, push notifications
│   └── server.js        # Express app entry point
│
├── mobile/
│   ├── App.js           # Root component
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── config/      # API client, theme tokens
│       ├── context/     # Auth, Theme, Socket providers
│       ├── navigation/  # Tab & stack navigators
│       ├── screens/     # All app screens
│       └── services/    # API & socket services
```

---

## 🔌 API Endpoints

| Resource | Method | Endpoint | Auth |
|----------|--------|----------|------|
| **Auth** | POST | `/api/auth/register` | ❌ |
| | POST | `/api/auth/login` | ❌ |
| | GET | `/api/auth/me` | ✅ |
| **Users** | GET | `/api/users/:username` | ❌ |
| | PUT | `/api/users/profile` | ✅ |
| | POST | `/api/users/:id/follow` | ✅ |
| | GET | `/api/users/search?q=` | ✅ |
| | GET | `/api/users/suggested` | ✅ |
| **Posts** | POST | `/api/posts` | ✅ |
| | GET | `/api/posts/feed` | ✅ |
| | GET | `/api/posts/explore` | ✅ |
| | POST | `/api/posts/:id/like` | ✅ |
| | POST | `/api/posts/:id/comments` | ✅ |
| **Chat** | GET | `/api/chat/conversations` | ✅ |
| | POST | `/api/chat/conversations/:id/messages` | ✅ |
| **Stories** | POST | `/api/stories` | ✅ |
| | GET | `/api/stories` | ✅ |
| **Notifications** | GET | `/api/notifications` | ✅ |

---

## 🔧 Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/social-media-app
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 📱 Screens

| Screen | Description |
|--------|-------------|
| Splash | Animated logo with gradient |
| Login | Email/password with gradient button |
| Register | Full registration form |
| Home Feed | Infinite scroll with stories bar |
| Create Post | Multi-image picker, caption, location |
| Post Detail | Full post with comments & replies |
| Explore | Search + trending posts grid |
| Profile | Stats, posts grid, follow/unfollow |
| Edit Profile | Avatar upload, bio, username |
| Chat List | Conversations with online status |
| Chat Detail | Real-time messages, typing indicator |
| Notifications | Grouped by type with avatars |
| Story Viewer | Full-screen with progress bars |
| Settings | Dark mode, account, logout |

---

## 🛡 Security

- JWT access + refresh token rotation
- bcrypt password hashing (12 rounds)
- Protected route middleware
- Input validation with express-validator
- Helmet security headers
- CORS configuration

---

## 📄 License

MIT License — Build something amazing! 🚀
