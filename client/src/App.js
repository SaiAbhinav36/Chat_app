import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import "./App.css";
import Login from "./Components/Login";
import Signup from "./Components/Signup";

const socket = io(process.env.REACT_APP_SOCKET_URL);

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [currentPage, setCurrentPage] = useState("login");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [file, setFile] = useState(null);

  const handleLogin = async (email, password) => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_SOCKET_URL}/login`,
        { email, password }
      );
      setUserEmail(res.data.email);
      setUsername(res.data.username);
      setIsLoggedIn(true);
    } catch (err) {
      alert("Invalid email or password");
    }
  };

  const handleSignup = async (username, email, password) => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_SOCKET_URL}/signup`,
        { username, email, password }
      );
      setUserEmail(res.data.email);
      setUsername(res.data.username);
      setIsLoggedIn(true);
    } catch (err) {
      alert("Signup failed");
    }
  };

  const joinRoom = async () => {
    if (room !== "" && username !== "") {
      socket.emit("join_room", room);

      const res = await axios.get(
        `${process.env.REACT_APP_SOCKET_URL}/messages/${room}`
      );
      setMessages(res.data);
    }
  };

  const sendMessage = async () => {
    let mediaUrl = "";
    try {
      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await axios.post(
          `${process.env.REACT_APP_SOCKET_URL}/upload`,
          formData
        );
        mediaUrl = res.data.url;
      }
      if (message !== "" || mediaUrl !== "") {
        const msgData = {
          roomId: room,
          text: message,
          sender: username,
          mediaUrl,
        };
        socket.emit("send_message", msgData);
        setMessage("");
        setFile(null);
      }

    } catch (err) {
      console.log(err);
      alert("File upload failed");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage("login");
    setMessages([]);
    setRoom("");
    setUsername("");
    setUserEmail("");
  };

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, []);

  if (!isLoggedIn) {
    return (
      <>
        {currentPage === "login" && (
          <Login
            onLogin={handleLogin}
            onSignupClick={() => setCurrentPage("signup")}
          />
        )}
        {currentPage === "signup" && (
          <Signup
            onSignup={handleSignup}
            onLoginClick={() => setCurrentPage("login")}
          />
        )}
      </>
    );
  }

  return (
    <div className="app-container">
      <div className="chat-wrapper">
        <div className="chat-header">
          <h1>SmartWinnr</h1>
          <div className="header-info">
            <div className="room-info">
              {room ? `Room: ${room}` : "Join a room to start chatting"}
            </div>
            <div className="user-info">
              {username ? `User : ${username}` : ""}
            </div>
          </div>
        </div>

        <div className="join-room-section">
          <h3>Join a Room</h3>
          <div className="input-group">
            <input
              placeholder="Room ID..."
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
            <button className="join-btn" onClick={joinRoom}>
              Join
            </button>
            <button className="join-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        <div className="messages-container">
          {messages.length > 0 ? (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.sender === username ? "you" : "other"}`}
              >
                <span className="message-sender">{msg.sender}</span>
                {msg.text && (
                  <span className="message-text">{msg.text}</span>
                )}
                {msg.mediaUrl && (
                  <>
                    {msg.mediaUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                      <img
                        src={msg.mediaUrl}
                        alt="media"
                        style={{ width: "200px", marginTop: "5px", borderRadius: "10px" }}
                      />
                    ) : (
                      <a href={msg.mediaUrl} target="_blank" rel="noreferrer">
                        📎 {msg.mediaUrl.split('/').pop()}
                      </a>
                    )}
                  </>
                )}
              </div>
            ))
          ) : (
            <div className="empty-messages">
              {room ? "No messages yet" : "Select a room to see messages"}
            </div>
          )}
        </div>

        <div className="input-section">
          <div className="file-input-wrapper">
            <label className="file-label">
              Attach
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                hidden
              />
            </label>

            <span className="file-name">
              {file ? file.name : "No file chosen"}
            </span>
          </div>
          <input
            className="message-input"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button className="send-btn" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
