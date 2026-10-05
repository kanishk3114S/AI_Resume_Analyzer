const mongoose = require("mongoose");
const env = require("./env"); // Or require("./config/env") depending on where this file is saved

const connectDB = async () => {
    const uri = env.mongoUri && env.mongoUri.trim();

    // Validate MongoDB URI scheme before attempting connection
    if (!/^mongodb(\+srv)?:\/\//i.test(uri)) {
        console.error("Invalid MONGO_URI scheme. Expected 'mongodb://' or 'mongodb+srv://'. Found:", uri);
        process.exit(1);
    }

    // Monitor connection lifecycle for runtime drops and errors
    mongoose.connection.on("connected", () => {
        console.log("⚡ [Mongoose] Connection established successfully");
    });

    mongoose.connection.on("error", (err) => {
        console.error("❌ [Mongoose] Connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
        console.warn("⚠️ [Mongoose] Connection lost / disconnected");
    });

    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000, // Fail fast in 5s (instead of 30s) if the database cluster is down
            maxPoolSize: 10,                // Maintain up to 10 sockets for concurrent requests
            minPoolSize: 2,                 // Keep 2 warm connections open to eliminate idle latency
            socketTimeoutMS: 45000,         // Terminate hanging database operations after 45s
        });

        console.log("MongoDB connected");
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
};

module.exports = connectDB;
module.exports.connectDb = connectDB;
module.exports.connectDB = connectDB;