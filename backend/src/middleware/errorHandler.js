const env = require("../config/env");

/**
 * Global Express Error Handling Middleware.
 * Catches all errors forwarded via next(err) or thrown in async routes.
 * Must have all 4 arguments (err, req, res, next) so Express recognizes it as an error middleware.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal server error";
  let details = err.details || null;

  // 1. Handle Zod Validation Errors
  if (err.name === "ZodError" || err.issues) {
    statusCode = 400;
    message = "Validation error";
    details = (err.issues || []).map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  }

  // 2. Handle Mongoose Validation Errors (e.g., required fields missing)
  else if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Database validation failed";
    details = Object.values(err.errors || {}).map((item) => ({
      field: item.path,
      message: item.message,
    }));
  }

  // 3. Handle Mongoose Duplicate Key Errors (e.g., unique email already registered)
  else if (err.code === 11000) {
    statusCode = 409;
    const duplicatedField = Object.keys(err.keyValue || {})[0] || "field";
    message = `An account with this ${duplicatedField} already exists`;
    details = [{ field: duplicatedField, message }];
  }

  // 4. Handle Mongoose Invalid ObjectId (CastError)
  else if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ID format for ${err.path}`;
    details = [{ field: err.path, message }];
  }

  // 5. Handle JWT Authentication Errors
  else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token expired. Please log in again.";
  }

  // Hide 500 server crash details in production to avoid leaking sensitive information
  if (statusCode === 500 && env.isProd) {
    message = "Something went wrong on our end. Please try again later.";
  }

  // Construct response matching frontend apiClient format (err.response.data.error.message / details)
  const errorResponse = {
    error: {
      message,
      ...(details ? { details } : {}),
      ...(!env.isProd ? { stack: err.stack } : {}),
    },
  };

  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;
module.exports.errorHandler = errorHandler;


/*
================================================================================
PURPOSE OF THIS FILE & HOW TO USE IT
================================================================================

WHY THIS FILE EXISTS:
1. Centralized Error Formatting:
   Instead of writing try-catch blocks with `res.status(500).json({ ... })` in
   every controller, you simply pass errors to `next(err)`. This middleware
   catches them in one place and formats them consistently.

2. Matching Frontend Expectations:
   Your frontend (`src/api/client.js`) specifically looks for:
   `err.response?.data?.error?.message` and `err.response?.data?.error?.details`.
   This file ensures EVERY error (Zod, Mongoose, JWT, or custom) matches that shape.

3. Security in Production:
   In production, detailed database error traces are hidden so attackers cannot
   see your database structure or internal file paths.

--------------------------------------------------------------------------------
EXAMPLE USAGE:

1. In `src/server.js`:
   Register this middleware at the VERY END, after all your routes:

   ```javascript
   const express = require("express");
   const authRoutes = require("./routes/auth");
   const errorHandler = require("./middleware/errorHandler");

   const app = express();

   app.use(express.json());

   // Mount routes
   app.use("/api/auth", authRoutes);

   // IMPORTANT: errorHandler must be registered LAST!
   app.use(errorHandler);

   app.listen(5000);
   ```

2. In a Controller (e.g. `src/controllers/authController.js`):
   When an error occurs, throw or pass it with status code:

   ```javascript
   const login = async (req, res, next) => {
     try {
       const user = await User.findOne({ email: req.body.email });
       if (!user) {
         // Create a custom error and pass it to next()
         const error = new Error("Invalid email or password");
         error.statusCode = 401;
         return next(error);
       }
       // ... continue login logic
     } catch (err) {
       next(err); // errorHandler automatically catches database crashes!
     }
   };
   ```

3. Frontend Receives:
   HTTP 401:
   {
     "error": {
       "message": "Invalid email or password"
     }
   }
================================================================================
*/
