import type { Request, Response } from "express"
import { ObjectId } from "mongodb"
import { getDb } from "../config/database"
import { AppError } from "../middleware/error.middleware"

// @desc    Get all products
// @route   GET /api/products
// @access  Private
export const getProducts = async (req: Request, res: Response) => {
  try {
    const db = await getDb()
    
    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const skip = (page - 1) * limit
    
    // Filter parameters
    const { category } = req.query
    const filter: any = {}
    
    if (category) {
      filter.category = new ObjectId(category as string)
    }
    
    // Get total count for pagination
    const totalCount = await db.collection("products").countDocuments(filter)
    
    // Aggregation pipeline for products with category info
    const products = await db
      .collection("products")
      .aggregate([
        {
          $match: filter
        },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "categoryInfo",
          },
        },
        {
          $unwind: "$categoryInfo",
        },
        {
          $sort: { name: 1 } // Sort by name
        },
        {
          $skip: skip
        },
        {
          $limit: limit
        }
      ])
      .toArray()

    // Transform data for response
    const transformedProducts = products.map((product) => ({
      _id: product._id.toString(),
      name: product.name,
      description: product.description,
      unit: product.unit,
      nutritionalValue: product.nutritionalValue,
      storageCondition: product.storageCondition,
      categoryId: product.category.toString(),
      categoryName: product.categoryInfo.name,
      category: {
        _id: product.category.toString(),
        name: product.categoryInfo.name,
      },
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }))

    res.status(200).json({
      success: true,
      count: transformedProducts.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      data: transformedProducts,
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    throw new AppError("Đã xảy ra lỗi khi lấy danh sách sản phẩm", 500)
  }
}

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin, Brigade Assistant)
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, category, description, unit, nutritionalValue, storageCondition } = req.body

    // Validate input
    if (!name || !category) {
      throw new AppError("Tên sản phẩm và phân loại không được để trống", 400)
    }

    // Validate ObjectId
    if (!ObjectId.isValid(category)) {
      throw new AppError("ID phân loại không hợp lệ", 400)
    }

    const db = await getDb()

    // Check if category exists
    const categoryExists = await db.collection("categories").findOne({ _id: new ObjectId(category) })
    if (!categoryExists) {
      throw new AppError("Phân loại không tồn tại", 400)
    }

    // Create new product
    const result = await db.collection("products").insertOne({
      name,
      category: new ObjectId(category),
      description: description || "",
      unit: unit || "kg",
      nutritionalValue: nutritionalValue || "",
      storageCondition: storageCondition || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    res.status(201).json({
      success: true,
      message: "Thêm sản phẩm thành công",
      productId: result.insertedId.toString(),
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error creating product:", error)
    throw new AppError("Đã xảy ra lỗi khi thêm sản phẩm", 500)
  }
}

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Private
export const getProductById = async (req: Request, res: Response) => {
  try {
    const productId = req.params.id

    // Validate ObjectId
    if (!ObjectId.isValid(productId)) {
      throw new AppError("ID sản phẩm không hợp lệ", 400)
    }

    const db = await getDb()

    // Get product with category information
    const product = await db
      .collection("products")
      .aggregate([
        {
          $match: { _id: new ObjectId(productId) },
        },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "categoryInfo",
          },
        },
        {
          $unwind: "$categoryInfo",
        },
      ])
      .toArray()

    if (!product || product.length === 0) {
      throw new AppError("Không tìm thấy sản phẩm", 404)
    }

    // Transform data for response
    const transformedProduct = {
      _id: product[0]._id.toString(),
      name: product[0].name,
      categoryId: product[0].category.toString(),
      categoryName: product[0].categoryInfo.name,
      category: {
        _id: product[0].category.toString(),
        name: product[0].categoryInfo.name,
      },
      description: product[0].description,
      unit: product[0].unit,
      nutritionalValue: product[0].nutritionalValue,
      storageCondition: product[0].storageCondition,
      createdAt: product[0].createdAt,
      updatedAt: product[0].updatedAt,
    }

    res.status(200).json({
      success: true,
      data: transformedProduct,
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error fetching product:", error)
    throw new AppError("Đã xảy ra lỗi khi lấy thông tin sản phẩm", 500)
  }
}

// @desc    Update product
// @route   PATCH /api/products/:id
// @access  Private (Admin, Brigade Assistant)
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const productId = req.params.id
    const { name, category, description, unit, nutritionalValue, storageCondition } = req.body

    // Validate ObjectId
    if (!ObjectId.isValid(productId)) {
      throw new AppError("ID sản phẩm không hợp lệ", 400)
    }

    // Validate input
    if (!name || !category) {
      throw new AppError("Tên sản phẩm và phân loại không được để trống", 400)
    }

    // Validate category ObjectId
    if (!ObjectId.isValid(category)) {
      throw new AppError("ID phân loại không hợp lệ", 400)
    }

    const db = await getDb()

    // Check if category exists
    const categoryExists = await db.collection("categories").findOne({ _id: new ObjectId(category) })
    if (!categoryExists) {
      throw new AppError("Phân loại không tồn tại", 400)
    }

    const result = await db.collection("products").updateOne(
      { _id: new ObjectId(productId) },
      {
        $set: {
          name,
          category: new ObjectId(category),
          description: description || "",
          unit: unit || "kg",
          nutritionalValue: nutritionalValue || "",
          storageCondition: storageCondition || "",
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      throw new AppError("Không tìm thấy sản phẩm", 404)
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật sản phẩm thành công",
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error updating product:", error)
    throw new AppError("Đã xảy ra lỗi khi cập nhật sản phẩm", 500)
  }
}

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin)
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const productId = req.params.id

    // Validate ObjectId
    if (!ObjectId.isValid(productId)) {
      throw new AppError("ID sản phẩm không hợp lệ", 400)
    }

    const db = await getDb()

    // Check if product is being used by any supply
    const supplyWithProduct = await db.collection("supplies").findOne({ product: new ObjectId(productId) })
    if (supplyWithProduct) {
      throw new AppError("Không thể xóa sản phẩm đang được sử dụng trong nguồn nhập", 400)
    }

    const result = await db.collection("products").deleteOne({ _id: new ObjectId(productId) })

    if (result.deletedCount === 0) {
      throw new AppError("Không tìm thấy sản phẩm", 404)
    }

    res.status(200).json({
      success: true,
      message: "Xóa sản phẩm thành công",
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error deleting product:", error)
    throw new AppError("Đã xảy ra lỗi khi xóa sản phẩm", 500)
  }
}
