import type { Request, Response, NextFunction } from "express"

// @desc    Detect if request is coming from a mobile device
// @usage   Use as middleware in routes
export const detectMobileClient = (req: Request, res: Response, next: NextFunction) => {
  // Check user agent for mobile device signatures
  const userAgent = req.headers["user-agent"] || ""
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent)

  // Add isMobile flag to request object for use in controllers
  req.isMobile = isMobile

  next()
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      isMobile?: boolean
    }
  }
}
