import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

// ================================
// FIX __dirname (ES Modules)
// ================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

// ================================
// FIREBASE INIT
// ================================
import "./config/db.js";

import complaintRoutes from "./routes/complaint.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import { setIO } from "./sockets/socket.js";

// ================================
// EXPRESS APP
// ================================
const app = express();
const server = http.createServer(app);

// ================================
// SMART PRODUCTION CORS
// ================================
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Postman / curl

      // Allow localhost (dev)
      if (origin.includes("localhost")) {
        return callback(null, true);
      }

      // Allow ALL Vercel deployments (preview + production)
      if (origin.includes(".vercel.app")) {
        return callback(null, true);
      }

      console.log("❌ Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json());

// ================================
// SOCKET.IO WITH MATCHING CORS
// ================================
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (origin.includes("localhost")) return callback(null, true);
      if (origin.includes(".vercel.app")) return callback(null, true);

      console.log("❌ Socket blocked by CORS:", origin);
      return callback("Not allowed by CORS", false);
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

setIO(io);

// ================================
// ROUTES
// ================================
app.get("/", (req, res) => {
  res.send("🚀 CivicSense Backend Running (Production)");
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    database: "Firebase Firestore",
    realtime: true,
    service: "CivicSense Backend",
  });
});

app.use("/api/complaint", complaintRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ================================
// SOCKET LOGGING
// ================================
io.on("connection", (socket) => {
  console.log("✅ Dashboard Connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Dashboard Disconnected:", socket.id);
  });
});

// ================================
// START SERVER
// ================================
const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
  console.log(`
🔥 CivicSense Backend Started
🌐 Port: ${PORT}
🔥 Database: Firebase Firestore
📡 Realtime Enabled
🔒 Smart CORS Enabled (Vercel + Localhost)
🚀 Ready for Frontend
`);
});
