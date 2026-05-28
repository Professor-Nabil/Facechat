import { AppError } from "./app.error.js";

export const globalError = (err, _req, res, _next) => {
  // 1. Establish unified fallbacks for unhandled system errors
  const statusCode = err.statusCode || 500;
  const status = err.status || "error";
  const message = err.message || "Internal Server Error";
  const operationalErrors = err.errors || null;

  // 2. Dump stack traces only if a genuine 500 server exception hits us
  if (statusCode === 500) {
    console.error("💥 SYSTEM CRITICAL FAILURE:", err);
  } else {
    console.log(`⚠️  [Client Error] ${statusCode} - ${message}`);
  }

  // 3. Return a consistent error envelope back to the client
  return res.status(statusCode).json({
    status,
    message,
    ...(operationalErrors && { errors: operationalErrors }),
    // Show the execution stack traces locally for rapid debugging
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};
