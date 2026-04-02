import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

if (process.env.DB_FILE_PATH_SECRET && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = `file:./${process.env.DB_FILE_PATH_SECRET}`;
}

const prisma = new PrismaClient();

export const initializeSocket = (io) => {
    const chatHistory = {};

    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on("join_room", async (room) => {
            socket.join(room);
            console.log(`User ${socket.id} joined room: ${room}`);

            // First try in-memory cache, then fall back to DB
            if (chatHistory[room]) {
                socket.emit("load_history", chatHistory[room]);
                return;
            }

            try {
                const history = await prisma.chatMessage.findMany({
                    where: { room },
                    orderBy: { createdAt: "asc" }
                });
                socket.emit("load_history", history);
                if (history && history.length) chatHistory[room] = history;
            } catch (err) {
                console.error("Failed to load chat history from DB", err);
                socket.emit("load_history", []);
            }
        });

        socket.on("send_message", async (data) => {
            if (!chatHistory[data.room]) chatHistory[data.room] = [];
            chatHistory[data.room].push(data);

            // Broadcast to others in room
            socket.to(data.room).emit("receive_message", data);

            // Persist to DB
            try {
                await prisma.chatMessage.create({
                    data: {
                        room: data.room,
                        senderId: data.senderId || null,
                        message: data.message
                    }
                });
            } catch (err) {
                console.error("Failed to persist chat message", err);
            }
        });

        socket.on("disconnect", () => {
            console.log("User disconnected", socket.id);
        });
    });
};
