export const initializeSocket = (io) => {
    const chatHistory = {};

    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on("join_room", (room) => {
            socket.join(room);
            console.log(`User ${socket.id} joined room: ${room}`);
            
            if (chatHistory[room]) {
                socket.emit("load_history", chatHistory[room]);
            }
        });

        socket.on("send_message", (data) => {
            if (!chatHistory[data.room]) chatHistory[data.room] = [];
            chatHistory[data.room].push(data);
            socket.to(data.room).emit("receive_message", data);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected", socket.id);
        });
    });
};
