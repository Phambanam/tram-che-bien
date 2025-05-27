import type { Request, Response } from "express"
import { ObjectId } from "mongodb"
import { getDb } from "../config/database"
import { AppError } from "../middleware/error.middleware"

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req: Request, res: Response) => {
  try {
    const db = await getDb()

    const categories = await db.collection("categories").find().toArray()

    // Transform data for response
    const transformedCategories = categories.map((category) => ({
      _id: category._id.toString(),
      name: category.name,
      description: category.description,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }))

    res.status(200).json({
      success: true,
      count: transformedCategories.length,
      data: transformedCategories,
    })
  } catch (error) {
    console.error("Error fetching categories:", error)
    throw new AppError("Đã xảy ra lỗi khi lấy danh sách phân loại", 500)
  }
}

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Admin, Brigade Assistant)
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body

    // Validate input
    if (!name) {
      throw new AppError("Tên phân loại không được để trống", 400)
    }

    const db = await getDb()

    // Check if category already exists
    const existingCategory = await db.collection("categories").findOne({ name })
    if (existingCategory) {
      throw new AppError("Phân loại đã tồn tại", 400)
    }

    // Create new category
    const result = await db.collection("categories").insertOne({
      name,
      description: description || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    res.status(201).json({
      success: true,
      message: "Thêm phân loại thành công",
      categoryId: result.insertedId.toString(),
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error creating category:", error)
    throw new AppError("Đã xảy ra lỗi khi thêm phân loại", 500)
  }
}

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Private
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const categoryId = req.params.id

    // Validate ObjectId
    if (!ObjectId.isValid(categoryId)) {
      throw new AppError("ID phân loại không hợp lệ", 400)
    }

    const db = await getDb()

    const category = await db.collection("categories").findOne({ _id: new ObjectId(categoryId) })

    if (!category) {
      throw new AppError("Không tìm thấy phân loại", 404)
    }

    // Transform data for response
    const transformedCategory = {
      _id: category._id.toString(),
      name: category.name,
      description: category.description,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }

    res.status(200).json({
      success: true,
      data: transformedCategory,
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error fetching category:", error)
    throw new AppError("Đã xảy ra lỗi khi lấy thông tin phân loại", 500)
  }
}

// @desc    Update category
// @route   PATCH /api/categories/:id
// @access  Private (Admin, Brigade Assistant)
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const categoryId = req.params.id
    const { name, description } = req.body

    // Validate ObjectId
    if (!ObjectId.isValid(categoryId)) {
      throw new AppError("ID phân loại không hợp lệ", 400)
    }

    // Validate input
    if (!name) {
      throw new AppError("Tên phân loại không được để trống", 400)
    }

    const db = await getDb()

    // Check if category with the same name already exists (excluding current category)
    const existingCategory = await db.collection("categories").findOne({
      _id: { $ne: new ObjectId(categoryId) },
      name,
    })

    if (existingCategory) {
      throw new AppError("Phân loại với tên này đã tồn tại", 400)
    }

    const result = await db.collection("categories").updateOne(
      { _id: new ObjectId(categoryId) },
      {
        $set: {
          name,
          description: description || "",
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      throw new AppError("Không tìm thấy phân loại", 404)
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật phân loại thành công",
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error updating category:", error)
    throw new AppError("Đã xảy ra lỗi khi cập nhật phân loại", 500)
  }
}

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const categoryId = req.params.id

    // Validate ObjectId
    if (!ObjectId.isValid(categoryId)) {
      throw new AppError("ID phân loại không hợp lệ", 400)
    }

    const db = await getDb()

    // Check if category is being used by any product
    const productWithCategory = await db.collection("products").findOne({ category: new ObjectId(categoryId) })
    if (productWithCategory) {
      throw new AppError("Không thể xóa phân loại đang được sử dụng bởi sản phẩm", 400)
    }

    // Check if category is being used by any supply
    const supplyWithCategory = await db.collection("supplies").findOne({ category: new ObjectId(categoryId) })
    if (supplyWithCategory) {
      throw new AppError("Không thể xóa phân loại đang được sử dụng trong nguồn nhập", 400)
    }

    const result = await db.collection("categories").deleteOne({ _id: new ObjectId(categoryId) })

    if (result.deletedCount === 0) {
      throw new AppError("Không tìm thấy phân loại", 404)
    }

    res.status(200).json({
      success: true,
      message: "Xóa phân loại thành công",
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error deleting category:", error)
    throw new AppError("Đã xảy ra lỗi khi xóa phân loại", 500)
  }
}
