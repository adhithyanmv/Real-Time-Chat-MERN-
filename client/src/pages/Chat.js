import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../features/authSlice"; // ✅ Import logout action
import API from "../api/axios";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";

const Chat = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [conversationId, setConversationId] = useState(null);

  // ✅ Setup socket connection
  useEffect(() => {
    const s = io("http://localhost:5000", {
      query: { token: localStorage.getItem("token") },
    });
    console.log("✅ Socket connecting...");
    s.on("connect", () => console.log("✅ Socket connected", s.id));
    setSocket(s);

    s.on("receive_message", (msg) => setMessages((prev) => [...prev, msg]));

    s.on("user_online", ({ userId }) => {
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isOnline: true } : u))
      );
    });

    s.on("user_offline", ({ userId }) => {
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isOnline: false } : u))
      );
    });

    return () => s.disconnect();
  }, []);

  // ✅ Load users
  useEffect(() => {
    const fetchUsers = async () => {
      const res = await API.get("/users");
      setUsers(res.data);
    };
    fetchUsers();
  }, []);

  // ✅ Open chat
  const openChat = async (u) => {
    setSelectedUser(u);
    const conv = await API.post("/messages/start", { recipientId: u._id });
    setConversationId(conv.data._id);
    const res = await API.get(`/messages/${conv.data._id}`);
    setMessages(res.data);
  };

  // ✅ Send message
  const sendMessage = () => {
    if (!newMessage.trim() || !conversationId) return;
    socket.emit("send_message", { conversationId, content: newMessage });
    setNewMessage("");
  };

  // ✅ Logout
  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="flex flex-col h-screen">
      {/* ✅ Header */}
      <div className="flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3 shadow-md">
        <h2 className="text-xl font-bold">💬 Real-Time Chat</h2>
        <div className="flex items-center gap-4">
          <span className="font-medium">Logged in as: {user?.username}</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 px-4 py-1 rounded-lg shadow"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex flex-1 bg-gray-100">
        {/* ✅ Sidebar */}
        <div className="w-1/4 bg-white shadow-lg border-r overflow-y-auto">
          <h3 className="p-4 font-semibold border-b">Users</h3>
          {users.map((u) => (
            <div
              key={u._id}
              onClick={() => openChat(u)}
              className={`flex items-center justify-between p-3 cursor-pointer hover:bg-blue-100 ${
                selectedUser?._id === u._id ? "bg-blue-200" : ""
              }`}
            >
              <span>{u.username}</span>
              {u.isOnline && (
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
              )}
            </div>
          ))}
        </div>

        {/* ✅ Chat Window */}
        <div className="flex flex-col flex-1">
          <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-200">
            {selectedUser ? (
              messages.map((m, i) => {
                const senderId = m.sender._id || m.sender;
                const isMe = senderId === user.id;
                const senderName = isMe
                  ? "You"
                  : m.sender.username || selectedUser.username;
                return (
                  <div
                    key={i}
                    className={`mb-2 flex ${
                      isMe ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`p-3 max-w-xs rounded-2xl shadow ${
                        isMe
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-gray-300 text-black rounded-bl-none"
                      }`}
                    >
                      <p className="text-xs font-bold mb-1">{senderName}</p>
                      <p>{m.content}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-lg">
                👈 Select a user to start chatting
              </div>
            )}
          </div>

          {/* ✅ Message Input */}
          {selectedUser && (
            <div className="flex p-3 bg-white border-t shadow-lg">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={sendMessage}
                className="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Send
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
