// middleware/errorHandler.js
import { ApiError } from "../utility/ApiError.js";

export const errorHandler = (err, req, res, next) => {
  // ✅ Only log unexpected errors (not 401, 403, 404, or other expected client errors)
  const expectedErrors = [401, 403, 404];
  if (!expectedErrors.includes(err.statusCode)) {
    console.error(err.stack || err);
  }

  // If it's an instance of ApiError, use its properties
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  const data = err.data || null;

  res.status(statusCode).json({
    success: false,
    message,
    data,
  });
};
