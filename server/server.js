const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Models for socket events
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Message = require("./models/Message");
const Conversation = require("./models/Conversation");

// Load env vars
dotenv.config();

// Connect DB
connectDB();

// Init express
const app = express();
const server = http.createServer(app); // ✅ server is defined here

// Import and use routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const messageRoutes = require("./routes/messages");

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => res.send("🚀 API is running..."));

// ✅ After server is defined, import Server
const { Server } = require("socket.io");
const io = new Server(server, { cors: { origin: "*" } });

// ✅ Socket.IO middleware and events here...
let onlineUsers = {};

io.use((socket, next) => {
  try {
    const token = socket.handshake.query?.token;
    if (!token) return next(new Error("Authentication error"));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
});

io.on("connection", async (socket) => {
  console.log("✅ User connected:", socket.userId);

  await User.findByIdAndUpdate(socket.userId, { isOnline: true });
  onlineUsers[socket.userId] = socket.id;

  socket.broadcast.emit("user_online", { userId: socket.userId });

  const conversations = await Conversation.find({
    participants: socket.userId,
  });
  conversations.forEach((c) => socket.join(c._id.toString()));

  socket.on("send_message", async ({ conversationId, content }) => {
    const message = new Message({
      sender: socket.userId,
      conversationId,
      content,
    });
    await message.save();

    io.to(conversationId).emit("receive_message", {
      _id: message._id,
      sender: socket.userId,
      content: message.content,
      timestamp: message.timestamp,
    });
  });

  socket.on("disconnect", async () => {
    console.log("❌ User disconnected:", socket.userId);
    await User.findByIdAndUpdate(socket.userId, { isOnline: false });
    delete onlineUsers[socket.userId];
    socket.broadcast.emit("user_offline", { userId: socket.userId });
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
