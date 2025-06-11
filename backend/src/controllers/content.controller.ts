import type { Request, Response } from "express"
import { ObjectId } from "mongodb"
import { getDb } from "../config/database"
import { AppError } from "../middleware/error.middleware"

// @desc    Get all content
// @route   GET /api/content
// @access  Public
export const getAllContent = async (req: Request, res: Response) => {
  try {
    const { type } = req.query

    const db = await getDb()

    let query = {}
    if (type) {
      query = { type }
    }

    const content = await db.collection("content").find(query).sort({ createdAt: -1 }).toArray()

    // Transform data for response
    const transformedContent = content.map((item) => ({
      id: item._id.toString(),
      title: item.title,
      type: item.type,
      content: item.content,
      imageUrl: item.imageUrl,
      videoUrl: item.videoUrl,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))

    res.status(200).json({
      success: true,
      count: transformedContent.length,
      data: transformedContent,
    })
  } catch (error) {
    console.error("Error fetching content:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy nội dung"
    })
  }
}

// @desc    Get content by ID
// @route   GET /api/content/:id
// @access  Public
export const getContentById = async (req: Request, res: Response) => {
  try {
    const contentId = req.params.id

    // Log the ID for debugging
    console.log("Content ID requested:", contentId)

    // Validate ObjectId
    if (!contentId || contentId === 'undefined' || contentId === 'null') {
      return res.status(400).json({
        success: false,
        message: "ID nội dung không được để trống"
      })
    }

    if (!ObjectId.isValid(contentId)) {
      return res.status(400).json({
        success: false,
        message: `ID nội dung không hợp lệ: ${contentId}`
      })
    }

    const db = await getDb()

    const content = await db.collection("content").findOne({ _id: new ObjectId(contentId) })

    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nội dung"
      })
    }

    // Transform data for response
    const transformedContent = {
      id: content._id.toString(),
      title: content.title,
      type: content.type,
      content: content.content,
      imageUrl: content.imageUrl,
      videoUrl: content.videoUrl,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
    }

    res.status(200).json({
      success: true,
      data: transformedContent,
    })
  } catch (error) {
    console.error("Error fetching content:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy nội dung"
    })
  }
}

// @desc    Create new content
// @route   POST /api/content
// @access  Private (Admin only)
export const createContent = async (req: Request, res: Response) => {
  try {
    const { title, type, content, imageUrl, videoUrl } = req.body

    // Validate input
    if (!title || !type) {
      return res.status(400).json({
        success: false,
        message: "Tiêu đề và loại nội dung không được để trống"
      })
    }

    // Validate content type
    if (!["article", "image", "video"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Loại nội dung không hợp lệ"
      })
    }

    // Validate content based on type
    if (type === "article" && !content) {
      return res.status(400).json({
        success: false,
        message: "Nội dung không được để trống"
      })
    }

    if (type === "image" && !imageUrl) {
      return res.status(400).json({
        success: false,
        message: "URL hình ảnh không được để trống"
      })
    }

    if (type === "video" && !videoUrl) {
      return res.status(400).json({
        success: false,
        message: "URL video không được để trống"
      })
    }

    const db = await getDb()

    // Create new content
    const result = await db.collection("content").insertOne({
      title,
      type,
      content: content || "",
      imageUrl: imageUrl || "",
      videoUrl: videoUrl || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    res.status(201).json({
      success: true,
      message: "Thêm nội dung thành công",
      contentId: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("Error creating content:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi thêm nội dung"
    })
  }
}

// @desc    Update content
// @route   PATCH /api/content/:id
// @access  Private (Admin only)
export const updateContent = async (req: Request, res: Response) => {
  try {
    const contentId = req.params.id
    const { title, type, content, imageUrl, videoUrl } = req.body

    // Validate ObjectId
    if (!ObjectId.isValid(contentId)) {
      return res.status(400).json({
        success: false,
        message: "ID nội dung không hợp lệ"
      })
    }

    // Validate input
    if (!title || !type) {
      return res.status(400).json({
        success: false,
        message: "Tiêu đề và loại nội dung không được để trống"
      })
    }

    // Validate content type
    if (!["article", "image", "video"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Loại nội dung không hợp lệ"
      })
    }

    const db = await getDb()

    const result = await db.collection("content").updateOne(
      { _id: new ObjectId(contentId) },
      {
        $set: {
          title,
          type,
          content: content || "",
          imageUrl: imageUrl || "",
          videoUrl: videoUrl || "",
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nội dung"
      })
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật nội dung thành công",
    })
  } catch (error) {
    console.error("Error updating content:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật nội dung"
    })
  }
}

// @desc    Delete content
// @route   DELETE /api/content/:id
// @access  Private (Admin only)
export const deleteContent = async (req: Request, res: Response) => {
  try {
    const contentId = req.params.id

    // Validate ObjectId
    if (!ObjectId.isValid(contentId)) {
      return res.status(400).json({
        success: false,
        message: "ID nội dung không hợp lệ"
      })
    }

    const db = await getDb()

    const result = await db.collection("content").deleteOne({ _id: new ObjectId(contentId) })

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nội dung"
      })
    }

    res.status(200).json({
      success: true,
      message: "Xóa nội dung thành công",
    })
  } catch (error) {
    console.error("Error deleting content:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xóa nội dung"
    })
  }
}
