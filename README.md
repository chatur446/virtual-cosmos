# 🌌 Virtual Cosmos

A real-time multiplayer 2D virtual environment where users can move, interact, and communicate based on spatial proximity — enhanced with a permission-based connection system.

---

## 🚀 Overview

Virtual Cosmos simulates a shared digital space where multiple users exist simultaneously, move freely, and interact with others nearby.

Unlike traditional chat apps, communication is **spatial and dynamic**:
- Move closer → discover users  
- Request connection → start interaction  
- Move away → connection ends  

---

## ✨ Key Features

### 🧭 Real-Time Movement
- Users move using **WASD / Arrow keys**
- Smooth real-time position updates using WebSockets

### 🌍 Multiplayer Environment
- Multiple users visible simultaneously
- Live synchronization of positions across clients

### 📡 Proximity Detection
- Each user has a **proximity radius**
- Users within range can interact

---

## 🔥 Bonus Feature: Connection Request System

Instead of automatic chat connections, Virtual Cosmos introduces a **permission-based interaction model**.

### 💡 How it works:
1. User A enters User B’s proximity  
2. User B receives a prompt:
   - Accept  
   - Deny  
3. Based on response:
   - **Accepted →** chat connection established  
   - **Denied →** requester notified  

### ⏳ Additional Behavior:
- Requests **auto-expire (timeout)**  
- Denial triggers **visual feedback (red flash)**  
- Prevents unwanted interactions → improves UX  

---

## 👥 Group Chat Logic

- If two users are already connected:
  - A third user must **request permission** to join  
- If accepted:
  - Joins the same chat room  
- If denied:
  - Cannot access the conversation  

---

## 🔌 Disconnection Logic

- When users move out of range:
  - Connection is **immediately terminated**  
  - Chat is disabled  

---

## 🏗️ Tech Stack

### Frontend
- React (Vite)  
- PixiJS (2D rendering)  
- Tailwind CSS  

### Backend
- Node.js  
- Express  
- Socket.IO (real-time communication)  

---

## 🧠 System Architecture

### Backend Responsibilities
- Track:
  - User ID  
  - Position (x, y)  
  - Active connections  
  - Pending requests  
- Handle:
  - Movement updates  
  - Proximity detection (grid-based optimization)  
  - Connection request/response flow  
  - Chat messaging via rooms  

---

### Frontend Responsibilities
- Render game world (PixiJS)  
- Handle user input (movement)  
- Display:
  - Users  
  - Chat UI  
  - Connection prompts  
  - Minimap  
- Manage socket events and UI state  

---

## 📁 Project Structure

virtual-cosmos/
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
│   │   ├── hooks/
│   │   │   ├── useSocket.js
│   │   │   └── useMovement.js
│   │   └── App.jsx
│   └── package.json
│
└── README.md

---

## ⚙️ Setup & Run

### 1️⃣ Clone the repository
git clone <your-repo-url>  
cd virtual-cosmos  

### 2️⃣ Install dependencies

Backend:
cd backend  
npm install  

Frontend:
cd ../frontend  
npm install  

### 3️⃣ Run the project

Start backend:
cd backend  
npm start  

Start frontend:
cd frontend  
npm run dev  

---

## 🌐 Access

Open in browser:  
http://localhost:5173  

---

## 🎮 User Flow

1. Enter your name  
2. Spawn into the cosmos  
3. Move around freely  
4. Approach another user  
5. Send/receive connection request  
6. Chat if accepted  
7. Move away → connection ends  

---

## 🎯 Design Goals

- Simulate real-world social interaction digitally  
- Provide **user control over communication**  
- Create an immersive spatial UI  
- Demonstrate real-time system design using sockets  

---

## 📽️ Demo Highlights

- Real-time movement  
- Multiplayer interaction  
- Proximity-based logic  
- Connection request system  
- Chat functionality  

---

## 🏁 Conclusion

Virtual Cosmos transforms a simple proximity chat system into a **controlled, interactive social experience**, combining real-time communication with user-driven interaction decisions.

---

## 📄 License

This project is licensed under the **MIT License**.  
You are free to use, modify, and distribute this software with proper attribution.

---

## 👨‍💻 Author

Built as part of a real-time systems assignment to demonstrate:
- Frontend rendering  
- Backend architecture  
- Real-time communication  
- System design thinking  
