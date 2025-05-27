import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { ObjectId } from "mongodb"
import { getDb } from "../config/database"

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        role: string
        unit: string
      }
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token

    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1]
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No token provided" })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string
      iat: number
      exp: number
    }

    // Get user from database
    const db = await getDb()
    const user = await db.collection("users").findOne({ _id: new ObjectId(decoded.id) })

    if (!user) {
      return res.status(401).json({ message: "Unauthorized - User not found" })
    }

    // Check if user is active
    if (user.status !== "active") {
      return res.status(401).json({ message: "Unauthorized - Account is not active" })
    }

    // Set user in request
    req.user = {
      id: user._id.toString(),
      role: user.role,
      unit: user.unit.toString(),
    }

    next()
  } catch (error) {
    console.error("Auth middleware error:", error)
    return res.status(401).json({ message: "Unauthorized - Invalid token" })
  }
}

// Middleware to restrict access based on roles
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized - User not authenticated" })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden - Not authorized to access this resource" })
    }

    next()
  }
}
