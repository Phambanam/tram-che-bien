"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, next) => {
    console.error("Error:", err);
    // Default error
    let statusCode = 500;
    let message = "Đã xảy ra lỗi trên máy chủ";
    let errors = null;
    // Check if it's our custom error
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
    }
    // MongoDB duplicate key error
    if (err.code === 11000) {
        statusCode = 400;
        message = "Dữ liệu đã tồn tại";
        errors = { field: "Trường dữ liệu bị trùng lặp" };
    }
    // MongoDB validation error
    if (err.name === "ValidationError") {
        statusCode = 400;
        message = "Dữ liệu không hợp lệ";
        errors = Object.values(err.errors).map((val) => val.message);
    }
    // JWT errors
    if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Token không hợp lệ";
    }
    if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Token đã hết hạn";
    }
    // Send response
    res.status(statusCode).json({
        success: false,
        message,
        errors,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
};
exports.errorHandler = errorHandler;
