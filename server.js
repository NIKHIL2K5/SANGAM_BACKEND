import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { logger } from "./utils/logger.js";
import { Server } from "socket.io"
import http from "http"
import { randomUUID } from "crypto"

import cors from "cors"
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import Chat from "./models/Chat.js";
import CommunityMessage from "./models/CommunityMessage.js";
import chatRoute from "./routes/chatRoutes.js"
import commentRoute from "./routes/commentRoutes.js"
import communityRoute from "./routes/communityRoutes.js"
import paymentRoute from "./routes/paymentRoutes.js"
import postRoute from "./routes/postRoutes.js"
import translationRoute from "./routes/translationRoutes.js"
import userRoute from "./routes/userRoutes.js"
import { errorHandling, notFound } from "./middleware/errorMiddleware.js";

const app = express();
import path from "path";
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
dotenv.config()


console.log("Trying to connect to Database and Starting the Server")


const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_CONNECT)
    } catch (error) {
        console.log("Failed to connect to Datatase")
        process.exit(1)
    }
};

export function initSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: "http://localhost:5173",
            credentials: true
        }
    })

    io.use(async (socket, next) => {
        try {

            const cookieHeader = socket.handshake.headers?.cookie || "";
            const cookies = Object.fromEntries(
                cookieHeader.split(";").map(c => c.trim()).filter(Boolean).map(c => {
                    const idx = c.indexOf("=");
                    return idx > -1 ? [decodeURIComponent(c.slice(0, idx)), decodeURIComponent(c.slice(idx + 1))] : [c, ""]
                })
            );
            let token = cookies.token;
            if (!token) {
                const auth = socket.handshake.headers?.authorization || "";
                if (auth.startsWith("Bearer ")) token = auth.slice(7);
            }
            if (!token) return next(); // allow anon but mark as unauthenticated
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select("-password");
            if (user) socket.user = { _id: String(user._id), username: user.username };
            return next();
        } catch (err) {

            return next();
        }
    })

    io.on("connection", (socket) => {
        console.log("User connected", socket.id)
        socket.emit("connected", { socketId: socket.id })
        if (socket.user?._id) {
            socket.join(`user:${socket.user._id}`);
        }

        socket.on("join", async ({ roomId }) => {
            if (!roomId) return;
            socket.join(roomId);
            socket.to(roomId).emit("user:joined", { socketId: socket.id, roomId });

            try {

                if (roomId.startsWith("dm:")) {
                    const ids = roomId.slice(3).split("_");
                    if (ids.length === 2) {

                        const [a, b] = ids;
                        let chat = await Chat.findOne({ participants: { $all: [a, b], $size: 2 } });
                        if (!chat) {
                            chat = new Chat({ participants: [a, b], messages: [] });
                            await chat.save();
                        }
                        const history = (chat.messages || []).slice(-50).map(m => ({
                            _id: String(m._id),
                            roomId,
                            body: m.content,
                            from: String(m.sender),
                            createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt
                        }));
                        socket.emit("history", { roomId, messages: history });
                    }
                } else if (roomId.startsWith("community:")) {
                    const communityId = roomId.slice("community:".length);
                    const msgs = await CommunityMessage.find({ community: communityId })
                        .sort({ createdAt: 1 })
                        .limit(50)
                        .lean();
                    const history = msgs.map(m => ({
                        _id: String(m._id),
                        roomId,
                        body: m.content,
                        from: m.sender ? String(m.sender) : "anon",
                        createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt
                    }));
                    socket.emit("history", { roomId, messages: history });
                }
            } catch (e) {
                console.error("Failed to send history:", e.message);
            }
        })

        socket.on("leave", ({ roomId }) => {
            if (!roomId) return
            socket.leave(roomId)
            socket.to(roomId).emit("user:left", { socketId: socket.id, roomId })
        })

        socket.on("message:send", async ({ roomId, body, clientId, meta }) => {
            try {
                if (!roomId || !body) return;
                const from = socket.user?._id ?? "anon";
                let messageId = randomUUID();


                if (roomId.startsWith("dm:")) {
                    const ids = roomId.slice(3).split("_");
                    if (ids.length === 2) {
                        const [a, b] = ids;
                        let chat = await Chat.findOne({ participants: { $all: [a, b], $size: 2 } });
                        if (!chat) {
                            chat = new Chat({ participants: [a, b], messages: [] });
                        }
                        chat.messages.push({ sender: from, content: body, type: 'text', createdAt: new Date() });
                        await chat.save();
                        const last = chat.messages[chat.messages.length - 1];
                        messageId = String(last._id);


                        const other = (from === a ? b : a);
                        const dmRoom = io.sockets.adapter.rooms.get(roomId);
                        const userRoom = io.sockets.adapter.rooms.get(`user:${other}`);
                        let deliverViaPersonal = true;
                        if (dmRoom && userRoom) {
                            for (const sid of userRoom) {
                                if (dmRoom.has(sid)) { deliverViaPersonal = false; break; }
                            }
                        }
                        if (deliverViaPersonal) {
                            io.to(`user:${other}`).emit("message:new", {
                                _id: messageId,
                                roomId,
                                body,
                                from,
                                createdAt: new Date().toISOString(),
                                meta
                            });
                        }
                    }
                } else if (roomId.startsWith("community:")) {
                    const communityId = roomId.slice("community:".length);
                    const doc = await CommunityMessage.create({
                        community: communityId,
                        sender: from !== "anon" ? from : undefined,
                        content: body,
                        type: 'text',
                        createdAt: new Date()
                    });
                    messageId = String(doc._id);
                }

                const saved = {
                    _id: messageId,
                    roomId,
                    body,
                    from,
                    createdAt: new Date().toISOString(),
                    meta
                };

                socket.to(roomId).emit("message:new", saved);
                socket.emit("message:ack", { clientId, messageId: saved._id });
            } catch (error) {
                console.error(error);
            }
        })

        socket.on("typing", ({ roomId, isTyping }) => {
            if (!roomId) return
            socket.to(roomId).emit("typing", { userId: socket.user?._id, isTyping, roomId })
        })

        socket.on("disconnect", () => { })
    })
    return io
}

mongoose.connection.on("connected", () => {
    console.log("Database connected Successfully")
})
mongoose.connection.on("disconnected", () => {
    console.log("Failed to connect to database")
})

app.set('trust proxy', 1)

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(logger)

app.use("/server/chat", chatRoute)
app.use("/server/comment", commentRoute)
app.use("/server/community", communityRoute)
app.use("/server/payment", paymentRoute)
app.use("/server/post", postRoute)
app.use("/server/translation", translationRoute)
app.use("/server/user", userRoute)

app.use(notFound)
app.use(errorHandling)



const starServer = async () => {
    await connect()
    const httpServer = http.createServer(app)
    initSocket(httpServer)
    httpServer.listen(process.env.PORT, () => {
        console.log(`Server is Running on ${process.env.PORT}`)
    })
}

starServer()
