const Message = require("../models/Message");

const setupSocket = (io) => {
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on("join_room", (roomId) => {
            socket.join(roomId);
            console.log(`Joined room: ${roomId}`);
        });

        socket.on("send_message", async (data) => {
            try {
                console.log("Received on backend:", data);
                await Message.create(data);
                io.to(data.roomId).emit("receive_message", data);
            } catch (err) {
                console.log(err);
            }
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });
};

module.exports = setupSocket;