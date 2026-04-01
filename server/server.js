const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const { Server } = require('socket.io')
const dotenv = require('dotenv')
const http = require('http')
const path = require('path')
const setupSocket = require('./sockets/chatSocket.js')
const Message = require('./models/Message.js')
const User = require('./models/User.js')
const multer = require('multer')
dotenv.config();

const app = express();
app.use(cors())
app.use(express.json())

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

setupSocket(io);

app.get("/", (req, res) => {
    res.send("server is running")
});

app.get("/messages/:roomId", async (req, res) => {
    try {
        const messages = await Message.find({ roomId: req.params.roomId });
        res.json(messages);
    }
    catch (err) {
        res.status(500).send({ error: err.message });
    }
})

const bcrypt = require("bcrypt");

app.post("/signup", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send("User already exists");
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            username,
            email,
            password: hashedPassword
        });
        res.json({
            username: user.username,
            email: user.email
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).send("User not found");
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send("Invalid password");
        }
        res.json({
            username: user.username,
            email: user.email
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});



const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });
app.use("/uploads", express.static("uploads"));
app.post("/upload", upload.single("file"), (req, res) => {
    res.json({
        url: `${process.env.BASE_URL}/uploads/${req.file.filename}`
    });
});

const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGO_DB_URL);
        console.log("connected to mongoDB");
        server.listen(5000, () => {
            console.log("server listening on port 5000")
        });
    }
    catch (err) {
        console.log("DB error", err);
    }
};
startServer();
