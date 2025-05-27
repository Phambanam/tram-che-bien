import multer from "multer"
import path from "path"
import type { Request } from "express"

// Configure storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: Function) => {
    cb(null, "uploads/") // Make sure this directory exists
  },
  filename: (req: Request, file: Express.Multer.File, cb: Function) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname))
  },
})

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: Function) => {
  // Check file type
  if (file.mimetype.startsWith("image/")) {
    cb(null, true)
  } else {
    cb(new Error("Only image files are allowed!"), false)
  }
}

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
})

export default upload
