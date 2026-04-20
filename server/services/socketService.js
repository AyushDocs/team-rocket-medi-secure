import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { getBlockchainStatus } from "./offlineSupport.js";

dotenv.config();

const prisma = new PrismaClient();

const connectedUsers = new Map();
const roomSubscribers = new Map();

let socketHelpers = null;

export const initializeSocket = (io) => {
    const chatHistory = {};

    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on("authenticate", (data) => {
            if (data.walletAddress) {
                connectedUsers.set(data.walletAddress, socket.id);
                socket.walletAddress = data.walletAddress;
                console.log(`Authenticated: ${data.walletAddress}`);
                socket.emit("authenticated", { status: "ok" });
            }
        });

        socket.on("subscribe_vitals", (data) => {
            if (data.patientId) {
                socket.join(`vitals:${data.patientId}`);
                console.log(`Subscribed to vitals: ${data.patientId}`);
            }
        });

        socket.on("subscribe_appointments", (data) => {
            if (data.patientId || data.doctorId) {
                const room = data.patientId ? `appointments:patient:${data.patientId}` : `appointments:doctor:${data.doctorId}`;
                socket.join(room);
            }
        });

        socket.on("join_room", async (room) => {
            socket.join(room);
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
                if (history?.length) chatHistory[room] = history;
            } catch (err) {
                socket.emit("load_history", []);
            }
        });

        socket.on("send_message", async (data) => {
            if (!chatHistory[data.room]) chatHistory[data.room] = [];
            chatHistory[data.room].push(data);
            socket.to(data.room).emit("receive_message", data);

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

        socket.on("request_sync", async (data) => {
            const bcStatus = getBlockchainStatus();
            socket.emit("sync_status", {
                blockchain: bcStatus.healthy,
                canSync: bcStatus.healthy
            });
        });

        socket.on("disconnect", () => {
            if (socket.walletAddress) {
                connectedUsers.delete(socket.walletAddress);
            }
            console.log("User disconnected", socket.id);
        });
    });

    socketHelpers = {
        emitVitalsUpdate: (patientId, vitals) => {
            io.to(`vitals:${patientId}`).emit("vitals_update", vitals);
        },

        emitAppointmentUpdate: (patientId, appointment) => {
            io.to(`appointments:patient:${patientId}`).emit("appointment_update", appointment);
        },

        emitEmergencyAlert: (patientId, alert) => {
            io.to(`vitals:${patientId}`).emit("emergency_alert", alert);
        },

        emitPrescriptionAdded: (patientId, prescription) => {
            io.to(`appointments:patient:${patientId}`).emit("prescription_added", prescription);
        },

        emitInvoiceUpdate: (patientId, invoice) => {
            io.to(`appointments:patient:${patientId}`).emit("invoice_update", invoice);
        },

        emitClaimUpdate: (patientId, claim) => {
            io.to(`appointments:patient:${patientId}`).emit("claim_update", claim);
        },

        emitBlockchainStatus: (status) => {
            io.emit("blockchain_status", status);
        },

        notifyUser: (walletAddress, event, data) => {
            const socketId = connectedUsers.get(walletAddress);
            if (socketId) {
                io.to(socketId).emit(event, data);
            }
        },

        broadcastSystemMessage: (message) => {
            io.emit("system_message", message);
        }
    };

    return socketHelpers;
};

export const getSocketHelpers = () => socketHelpers;

export const socketEvents = {
    VITALS_UPDATE: "vitals_update",
    APPOINTMENT_UPDATE: "appointment_update",
    EMERGENCY_ALERT: "emergency_alert",
    PRESCRIPTION_ADDED: "prescription_added",
    INVOICE_UPDATE: "invoice_update",
    CLAIM_UPDATE: "claim_update",
    BLOCKCHAIN_STATUS: "blockchain_status",
    SYSTEM_MESSAGE: "system_message"
};

export default { initializeSocket, getSocketHelpers, socketEvents };
