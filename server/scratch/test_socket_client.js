import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";
const socket = io(SOCKET_URL);

socket.on("connect", () => {
    console.log("Connected to server");
    
    // Simulate sending vitals from server side (this is what the backend would do)
    // Here we're just testing if the socket can receive it.
    // Actually, to test the broadcast, we need to be a client that 'subscribes' or just wait.
    
    socket.emit("subscribe_vitals", { patientId: "patient1" });
    console.log("Subscribed to patient1 vitals");
});

socket.on("vitals_update", (data) => {
    console.log("Received vitals update:", data);
});

// Since we want to test if the SERVER can send to clients, 
// a better test is to have a script that connects to the server and we manually trigger a send 
// from the server's context.

// But for a quick check, I'll just check if the backend starts without errors.
