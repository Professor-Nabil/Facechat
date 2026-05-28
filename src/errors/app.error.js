export class AppError extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.errors = errors;

    // Capture clean stack traces, ignoring the constructor call layer itself
    Error.captureStackTrace(this, this.constructor);
  }
}
