# 🌌 Virtual Cosmos

**Virtual Cosmos** is a real-time multiplayer 2D virtual environment where users can move through a shared world, discover nearby users, request permission to interact, and communicate through proximity-based chat.

The project focuses on building a **real-time social interaction system** where communication depends on both **physical proximity and user permission**, rather than automatically connecting users.

---

## 🚀 Live Demo

🌐 **Live Application:**  
https://virtual-cosmos-tawny.vercel.app/

💻 **GitHub Repository:**  
[View Source Code](https://github.com/chatur446/virtual-cosmos)

🔗 **Backend Health Check:**  
https://virtual-cosmos-backend-gfg8.onrender.com/health

---

## 📌 Overview

Virtual Cosmos creates a shared digital environment where multiple users can exist and interact simultaneously.

Users can move around the world using keyboard controls and see other connected users in real time.

Instead of automatically starting a conversation when two users become close, Virtual Cosmos introduces a **permission-based connection system**.

### Core interaction:

```text
Move closer
     ↓
Discover nearby user
     ↓
Connection request
     ↓
Accept / Deny
     ↓
If accepted → Chat
     ↓
Move away
     ↓
Connection ends
```

This creates a more controlled and intentional communication experience.

---

# ✨ Features

## 🧭 Real-Time Multiplayer Movement

Users can move around the virtual environment using:

- `W`
- `A`
- `S`
- `D`
- Arrow Keys

Player positions are synchronized between connected clients using **Socket.IO**, allowing users to see other players move in real time.

---

## 🌍 Shared Multiplayer World

Multiple users can exist in the same virtual environment.

Each connected user has:

- A unique socket/session identity
- A position
- A visible representation in the world
- Real-time position synchronization
- Proximity-based interaction capabilities

Changes made by one player are reflected across other connected clients.

---

# 📡 Proximity Detection

Virtual Cosmos uses proximity detection to determine when users are close enough to interact.

Each player has a defined interaction radius.

When two users enter the configured proximity range, the backend detects the interaction and triggers the appropriate connection-request flow.

### Interaction states

```text
Outside Range
     ↓
Enter Proximity
     ↓
Connection Opportunity
     ↓
Permission Request
     ↓
Accepted / Denied
```

When users move apart and leave the interaction range, their active connection is terminated.

---

# 🔐 Permission-Based Connection System

One of the main features of Virtual Cosmos is that **being close to another user does not automatically start a chat**.

Instead, the system requires explicit permission.

### Connection flow

```text
User A moves near User B
           ↓
Backend detects proximity
           ↓
Connection request sent
           ↓
User B receives request
        ↙       ↘
    Accept      Deny
      ↓           ↓
   Connect     Request denied
      ↓
     Chat
```

### Why this matters

This prevents unwanted automatic conversations and gives users control over who they interact with.

The system also supports:

- Accept / Deny actions
- Request timeout
- Request cancellation
- Visual feedback for denied requests
- Connection state management
- Automatic disconnection when users move out of range

---

# ⏳ Request Timeout

Connection requests are not kept indefinitely.

If the receiver does not respond within the configured timeout period, the request expires automatically.

This prevents stale requests from remaining active in the system.

---

# ❌ Request Denial

When a connection request is denied:

- The requester is notified
- The connection is not established
- The chat does not open
- Visual feedback is provided to indicate the denial

Users can later approach each other again and initiate another connection request.

---

# 💬 Real-Time Chat

Once a connection request is accepted, users can communicate through the chat interface.

Messages are transmitted through Socket.IO and handled by the backend using Socket.IO rooms.

### Chat flow

```text
Proximity
    ↓
Permission Request
    ↓
Accepted
    ↓
Connection Established
    ↓
Chat Room
    ↓
Real-Time Messages
```

The chat interface supports normal text input and sending messages using the `Enter` key.

---

# 👥 Group Chat

Virtual Cosmos also supports permission-based group interaction.

If users are already connected and another nearby user wants to join the conversation, the new user must request permission before joining.

### Example

```text
User A ←→ User B
     Connected

User C enters proximity
        ↓
User C requests access
        ↓
A/B approve
        ↓
User C joins chat room
```

If the request is denied, the new user cannot access the existing conversation.

This keeps group interactions permission-based rather than automatically exposing conversations to nearby users.

---

# 🔌 Automatic Disconnection

Connections are tied to physical proximity.

When connected users move outside the allowed interaction range:

```text
Users connected
      ↓
Move apart
      ↓
Leave proximity
      ↓
Connection terminated
      ↓
Chat disabled
```

This makes the communication model behave similarly to a real physical environment where interaction depends on being close enough to another person.

---

# ⚡ Real-Time Architecture

The application follows a client-server architecture.

```text
                   ┌──────────────────────┐
                   │      Frontend        │
                   │                      │
                   │ React + PixiJS       │
                   │ Tailwind CSS         │
                   │ Socket.IO Client     │
                   └──────────┬───────────┘
                              │
                              │ WebSocket
                              │
                              ▼
                   ┌──────────────────────┐
                   │       Backend        │
                   │                      │
                   │ Node.js + Express    │
                   │ Socket.IO            │
                   │ Proximity Manager    │
                   └──────────┬───────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │ Multiplayer State    │
                   │                      │
                   │ Users                │
                   │ Positions            │
                   │ Requests             │
                   │ Connections          │
                   │ Chat Rooms           │
                   └──────────────────────┘
```

---

# 🧠 Backend Responsibilities

The backend acts as the central authority for multiplayer state and interaction logic.

It manages:

- Connected users
- User positions
- Proximity detection
- Connection requests
- Request timeouts
- Accepted connections
- Connection termination
- Chat rooms
- Real-time messages
- Client disconnections

The backend ensures that important interaction decisions are not controlled only by the frontend.

---

# 🧮 Proximity Detection Optimization

The backend uses a **grid-based proximity detection approach**.

Instead of comparing every player against every other player, users are organized into spatial grid cells.

Conceptually:

```text
┌───────┬───────┬───────┐
│ Cell  │ Cell  │ Cell  │
│       │       │       │
├───────┼───────┼───────┤
│ Cell  │ Cell  │ Cell  │
│   A   │   B   │       │
├───────┼───────┼───────┤
│ Cell  │ Cell  │ Cell  │
│       │       │       │
└───────┴───────┴───────┘
```

When a user moves, the system can focus proximity checks around relevant neighboring cells rather than blindly comparing against every player.

This provides a better foundation for scaling multiplayer interactions as the number of connected users increases.

---

# 🛠️ Tech Stack

## Frontend

| Technology | Purpose |
|---|---|
| React | UI and application state |
| Vite | Frontend development and build tooling |
| PixiJS | 2D virtual world rendering |
| Tailwind CSS | UI styling |
| Socket.IO Client | Real-time communication |

## Backend

| Technology | Purpose |
|---|---|
| Node.js | Backend runtime |
| Express | HTTP server and API handling |
| Socket.IO | Real-time WebSocket communication |
| JavaScript | Backend application logic |

## Deployment

| Platform | Purpose |
|---|---|
| Vercel | Frontend deployment |
| Render | Backend deployment |

---

# 📁 Project Structure

```text
virtual-cosmos/
│
├── backend/
│   ├── server.js
│   ├── proximity.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── GameCanvas.jsx
│   │   │   ├── ChatBox.jsx
│   │   │   ├── HUD.jsx
│   │   │   ├── MiniMap.jsx
│   │   │   ├── JoinScreen.jsx
│   │   │   └── ConnectionRequest.jsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useSocket.js
│   │   │   └── useMovement.js
│   │   │
│   │   └── App.jsx
│   │
│   └── package.json
│
└── README.md
```

---

# ⚙️ Local Setup

## 1. Clone the Repository

```bash
git clone https://github.com/chatur446/virtual-cosmos.git
cd virtual-cosmos
```

---

## 2. Install Backend Dependencies

```bash
cd backend
npm install
```

---

## 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

# ▶️ Run Locally

## Start the Backend

Open a terminal:

```bash
cd backend
npm start
```

The backend will run on:

```text
http://localhost:3001
```

---

## Start the Frontend

Open another terminal:

```bash
cd frontend
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

# 🔧 Environment Variables

For local development, the frontend can connect to the backend using:

```env
VITE_SOCKET_URL=http://localhost:3001
```

For production, the frontend uses the deployed backend URL:

```env
VITE_SOCKET_URL=https://virtual-cosmos-backend-gfg8.onrender.com
```

The backend supports configuring the allowed frontend origin through:

```env
CORS_ORIGIN=https://virtual-cosmos-tawny.vercel.app
```

---

# 🩺 Backend Health Check

The backend exposes a simple health endpoint:

```text
GET /health
```

Example response:

```json
{
  "status": "ok"
}
```

This can be used to verify that the backend service is running correctly.

---

# 🎮 How to Use

1. Open the application.
2. Enter your username.
3. Enter the virtual world.
4. Move around using `WASD` or Arrow Keys.
5. Find another connected user.
6. Move within their proximity range.
7. A connection request is triggered.
8. The other user can accept or deny the request.
9. If accepted, the chat connection is established.
10. Send real-time messages.
11. Move away from the connected user.
12. The connection is automatically terminated.

---

# 🧪 Testing the Multiplayer Flow

The easiest way to test Virtual Cosmos locally is by opening the application in two browser windows or sessions.

### Test Scenario

```text
Browser A
    ↓
Join as Player A

Browser B
    ↓
Join as Player B

Player A moves toward Player B
    ↓
Proximity detected
    ↓
Player B receives request
    ↓
Accept
    ↓
Chat opens
    ↓
Send messages
    ↓
Move apart
    ↓
Connection ends
```

You can also test:

- Denying a request
- Request timeout
- Requesting again after denial
- Group connection requests
- Chat input
- Movement while outside chat
- Movement key handling while typing

---

# 🎯 Design Goals

Virtual Cosmos was designed around four main ideas:

### 1. Spatial Interaction

Communication should depend on where users are located within the virtual environment.

### 2. User-Controlled Communication

Being nearby should not automatically give another user access to a conversation.

### 3. Real-Time Systems

Player movement, proximity events, connection requests, and messages should be synchronized in real time.

### 4. Scalable Architecture

The backend should maintain multiplayer state and provide a foundation that can support a larger number of users.

---

# 🧩 Engineering Challenges

## Real-Time State Synchronization

Multiple clients can change state simultaneously.

The backend therefore acts as the central point for managing:

- User positions
- Connections
- Requests
- Chat rooms
- Disconnect events

---

## Proximity-Based Interaction

The system needs to determine when users:

- Enter proximity
- Remain within proximity
- Leave proximity
- Re-enter proximity

The proximity manager tracks these transitions instead of treating every position update as a new interaction.

---

## Permission-Based Connections

The system separates:

```text
Proximity
```

from:

```text
Connection
```

Being close to another player only creates an opportunity to request a connection.

The actual connection is established only after the receiving user accepts.

---

## Keyboard Input Handling

The application supports movement controls while also allowing users to type normally inside the chat input.

Movement handling therefore distinguishes between:

```text
Game keyboard input
```

and:

```text
Text input
```

This prevents movement keys and the spacebar from interfering with chat messages.

---

# 🔒 Interaction Model

The application follows this basic state model:

```text
Player
  │
  ├── Outside Proximity
  │
  ├── In Proximity
  │
  ├── Request Pending
  │
  ├── Request Accepted
  │
  ├── Connected
  │
  └── Disconnected
```

This separation makes the interaction flow predictable and prevents proximity from automatically granting communication access.

---

# 🌐 Deployment

The production architecture uses separate frontend and backend services.

```text
                 Internet
                    │
                    ▼
        ┌─────────────────────┐
        │       Vercel        │
        │                     │
        │ React Frontend      │
        └──────────┬──────────┘
                   │
                   │ Socket.IO
                   │
                   ▼
        ┌─────────────────────┐
        │       Render        │
        │                     │
        │ Node.js Backend     │
        │ Express + Socket.IO │
        └─────────────────────┘
```

### Production Services

**Frontend:** Vercel

```text
https://virtual-cosmos-tawny.vercel.app/
```

**Backend:** Render

```text
https://virtual-cosmos-backend-gfg8.onrender.com
```

The frontend communicates with the production backend using the `VITE_SOCKET_URL` environment variable.

---

# 📈 Future Improvements

Potential future improvements include:

- Persistent user accounts
- User profiles
- Authentication
- Persistent chat history
- Larger multiplayer worlds
- Better spatial partitioning
- Database-backed user state
- Private areas and rooms
- Custom avatars
- Voice communication
- Friend/contact system
- Improved mobile controls
- World persistence
- Horizontal backend scaling
- Redis-based shared multiplayer state
- Better moderation and abuse prevention

---

# 💡 What This Project Demonstrates

Virtual Cosmos demonstrates practical experience with:

- React application development
- Component-based UI architecture
- PixiJS 2D rendering
- Node.js backend development
- Express APIs
- WebSockets
- Socket.IO
- Real-time state synchronization
- Multiplayer architecture
- Spatial proximity detection
- Event-driven programming
- Permission-based interaction
- Client-server communication
- State management
- Production deployment
- Frontend-backend integration

---

# 📊 Key System Flow

```text
                    ┌───────────────┐
                    │     Player    │
                    └───────┬───────┘
                            │
                            ▼
                     Move in World
                            │
                            ▼
                    Proximity Detection
                            │
                 ┌──────────┴──────────┐
                 │                     │
              Too Far               Nearby
                 │                     │
                 │                     ▼
                 │              Request Permission
                 │                     │
                 │              ┌──────┴──────┐
                 │              │             │
                 │           Accept         Deny
                 │              │             │
                 │              ▼             ▼
                 │           Connect      Notify User
                 │              │
                 │              ▼
                 │             Chat
                 │              │
                 └──────────────┴──────────────
                                │
                                ▼
                         Move Out of Range
                                │
                                ▼
                       Connection Terminated
```

---

# 🏆 Project Highlights

### Real-Time Multiplayer

Multiple users can occupy and interact within the same shared environment with live position updates.

### Permission-Based Social Interaction

Users must explicitly approve connection requests before communication begins.

### Proximity-Aware Communication

Connections are tied to spatial distance rather than being permanently available.

### Event-Driven Backend

Socket.IO events coordinate movement, proximity, requests, connections, and messaging.

### Scalable Proximity Detection

Grid-based spatial organization reduces unnecessary proximity comparisons.

### Production Deployment

The application is deployed with a separate Vercel frontend and Render backend.

---

# 📜 License

This project is licensed under the **MIT License**.

You are free to use, modify, and distribute this software under the terms of the license.

---

# 👨‍💻 Author

## Ayush Chaturvedi

**AI & Data Science Undergraduate | Software & AI Engineering**

GitHub:  
https://github.com/chatur446

LinkedIn:  
https://linkedin.com/in/ayush-chaturvedi73/

---

# ⭐ Support

If you find this project interesting, consider giving the repository a ⭐ on GitHub.

---

## 🌌 Final Note

Virtual Cosmos started as a real-time multiplayer environment and evolved into a more controlled social interaction system by separating **proximity from permission**.

The project combines frontend rendering, backend event handling, WebSocket communication, spatial interaction, and real-time state management to create a multiplayer experience where users decide **when and with whom they interact**.
