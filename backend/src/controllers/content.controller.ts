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
    throw new AppError("Đã xảy ra lỗi khi lấy nội dung", 500)
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
      throw new AppError("ID nội dung không được để trống", 400)
    }

    if (!ObjectId.isValid(contentId)) {
      throw new AppError(`ID nội dung không hợp lệ: ${contentId}`, 400)
    }

    const db = await getDb()

    const content = await db.collection("content").findOne({ _id: new ObjectId(contentId) })

    if (!content) {
      throw new AppError("Không tìm thấy nội dung", 404)
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
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error fetching content:", error)
    throw new AppError("Đã xảy ra lỗi khi lấy nội dung", 500)
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
      throw new AppError("Tiêu đề và loại nội dung không được để trống", 400)
    }

    // Validate content type
    if (!["article", "image", "video"].includes(type)) {
      throw new AppError("Loại nội dung không hợp lệ", 400)
    }

    // Validate content based on type
    if (type === "article" && !content) {
      throw new AppError("Nội dung không được để trống", 400)
    }

    if (type === "image" && !imageUrl) {
      throw new AppError("URL hình ảnh không được để trống", 400)
    }

    if (type === "video" && !videoUrl) {
      throw new AppError("URL video không được để trống", 400)
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
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error creating content:", error)
    throw new AppError("Đã xảy ra lỗi khi thêm nội dung", 500)
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
      throw new AppError("ID nội dung không hợp lệ", 400)
    }

    // Validate input
    if (!title || !type) {
      throw new AppError("Tiêu đề và loại nội dung không được để trống", 400)
    }

    // Validate content type
    if (!["article", "image", "video"].includes(type)) {
      throw new AppError("Loại nội dung không hợp lệ", 400)
    }

    const db = await getDb()

    // Update content
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
      throw new AppError("Không tìm thấy nội dung", 404)
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật nội dung thành công",
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error updating content:", error)
    throw new AppError("Đã xảy ra lỗi khi cập nhật nội dung", 500)
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
      throw new AppError("ID nội dung không hợp lệ", 400)
    }

    const db = await getDb()

    // Delete content
    const result = await db.collection("content").deleteOne({ _id: new ObjectId(contentId) })

    if (result.deletedCount === 0) {
      throw new AppError("Không tìm thấy nội dung", 404)
    }

    res.status(200).json({
      success: true,
      message: "Xóa nội dung thành công",
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error deleting content:", error)
    throw new AppError("Đã xảy ra lỗi khi xóa nội dung", 500)
  }
}
