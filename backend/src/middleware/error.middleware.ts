import type { Request, Response, NextFunction } from "express"

export class AppError extends Error {
  statusCode: number
  status: string
  isOperational: boolean

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error"
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`)
  res.status(404)
  next(error)
}

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500
  err.status = err.status || "error"

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
