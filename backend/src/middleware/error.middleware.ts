import type { Request, Response, NextFunction } from "express"

export class AppError extends Error {
  statusCode: number
  isOperational: boolean

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export const errorHandler = (err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err)

  // Default error
  let statusCode = 500
  let message = "Đã xảy ra lỗi trên máy chủ"
  let errors: any = null

  // Check if it's our custom error
  if (err instanceof AppError) {
    statusCode = err.statusCode
    message = err.message
  }

  // MongoDB duplicate key error
  if ((err as any).code === 11000) {
    statusCode = 400
    message = "Dữ liệu đã tồn tại"
    errors = { field: "Trường dữ liệu bị trùng lặp" }
  }

  // MongoDB validation error
  if ((err as any).name === "ValidationError") {
    statusCode = 400
    message = "Dữ liệu không hợp lệ"
    errors = Object.values((err as any).errors).map((val: any) => val.message)
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401
    message = "Token không hợp lệ"
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401
    message = "Token đã hết hạn"
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    errors,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  })
}
