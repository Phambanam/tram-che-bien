import express from "express"
import upload from "../middleware/upload.middleware"
import { protect } from "../middleware/auth.middleware"

const router = express.Router()

// Protect all upload routes
router.use(protect)

// Upload single image
router.post("/image", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      })
    }

    // Return the file URL
    const fileUrl = `/uploads/${req.file.filename}`

    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      data: {
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
      },
    })
  } catch (error) {
    console.error("Upload error:", error)
    res.status(500).json({
      success: false,
      message: "Error uploading file",
    })
  }
})

export default router
