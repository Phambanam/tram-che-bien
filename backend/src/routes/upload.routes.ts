import express from "express"
import { uploadFile, deleteFile } from "../controllers/upload.controller"
import { uploadSingle } from "../middleware/upload"
import { protect } from "../middleware/auth.middleware"

const router = express.Router()

// Upload single file (image or video)
router.post("/file", protect, uploadSingle, uploadFile)

// Delete file
router.delete("/file/:filename", protect, deleteFile)

export default router
