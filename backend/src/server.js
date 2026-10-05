const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const env = require("./config/env");
const { connectDb } = require("./config/Db");
const { errorHandler } = require("./middleware/errorHandler");

const healthRouter = require("./routes/health");

const app = express();

// Trust reverse proxy (useful for rate limiters, secure cookies, or deployment behind Nginx/Vercel)
app.set("trust proxy", 1);

// 1. Cross-Origin Resource Sharing (CORS)
// Allows frontend on localhost:5173 to communicate and send cookies (credentials: true)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (env.clientOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked: ${origin} not allowed`));
    },
    credentials: true,
  })
);

// 2. Request body & cookie parsers
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// 3. HTTP Request logger
app.use(morgan(env.isProd ? "combined" : "dev"));

// 4. Mount API Routes
app.use("/api/health", healthRouter);

// 5. 404 Fallback for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  });
});

// 6. Centralized Error Handler (MUST be registered after all routes)
app.use(errorHandler);

// 7. Connect Database and Start Server
const startServer = async () => {
  try {
    await connectDb();
    app.listen(env.port, () => {
      console.log(` Server running in ${env.nodeEnv} mode on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error(" Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;