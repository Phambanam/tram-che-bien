import type { Request, Response } from "express"
import { ObjectId } from "mongodb"
import { getDb } from "../config/database"
import { AppError } from "../middleware/error.middleware"

// @desc    Get all dishes
// @route   GET /api/dishes
// @access  Private
export const getAllDishes = async (req: Request, res: Response) => {
  try {
    const { category } = req.query

    const db = await getDb()

    let query = {}
    if (category) {
      query = { category }
    }

    const dishes = await db.collection("dishes").find(query).sort({ name: 1 }).toArray()

    // Transform data for response
    const transformedDishes = dishes.map((dish) => ({
      id: dish._id.toString(),
      name: dish.name,
      ingredients: dish.ingredients,
      description: dish.description,
      imageUrl: dish.imageUrl,
      category: dish.category,
    }))

    res.status(200).json({
      success: true,
      count: transformedDishes.length,
      data: transformedDishes,
    })
  } catch (error) {
    console.error("Error fetching dishes:", error)
    throw new AppError("Đã xảy ra lỗi khi lấy danh sách món ăn", 500)
  }
}

// @desc    Get dish by ID
// @route   GET /api/dishes/:id
// @access  Private
export const getDishById = async (req: Request, res: Response) => {
  try {
    const dishId = req.params.id

    // Validate ObjectId
    if (!ObjectId.isValid(dishId)) {
      throw new AppError("ID món ăn không hợp lệ", 400)
    }

    const db = await getDb()

    const dish = await db.collection("dishes").findOne({ _id: new ObjectId(dishId) })

    if (!dish) {
      throw new AppError("Không tìm thấy món ăn", 404)
    }

    // Get recipe ingredients
    const recipeIngredients = await db
      .collection("recipeIngredients")
      .aggregate([
        {
          $match: { dishId: new ObjectId(dishId) },
        },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        {
          $unwind: "$productInfo",
        },
        {
          $project: {
            id: { $toString: "$_id" },
            dishId: { $toString: "$dishId" },
            product: {
              id: { $toString: "$productId" },
              name: "$productInfo.name",
            },
            quantity: 1,
            unit: 1,
          },
        },
      ])
      .toArray()

    // Transform data for response
    const transformedDish = {
      id: dish._id.toString(),
      name: dish.name,
      ingredients: dish.ingredients,
      description: dish.description,
      imageUrl: dish.imageUrl,
      category: dish.category,
      recipeIngredients: recipeIngredients,
    }

    res.status(200).json({
      success: true,
      data: transformedDish,
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error fetching dish:", error)
    throw new AppError("Đã xảy ra lỗi khi lấy thông tin món ăn", 500)
  }
}

// @desc    Create new dish
// @route   POST /api/dishes
// @access  Private (Admin only)
export const createDish = async (req: Request, res: Response) => {
  try {
    const { name, ingredients, description, imageUrl, category, recipeIngredients } = req.body

    // Validate input
    if (!name || !category) {
      throw new AppError("Tên món ăn và phân loại không được để trống", 400)
    }

    const db = await getDb()

    // Check if dish already exists
    const existingDish = await db.collection("dishes").findOne({ name })
    if (existingDish) {
      throw new AppError("Món ăn đã tồn tại", 400)
    }

    // Create new dish
    const result = await db.collection("dishes").insertOne({
      name,
      ingredients: ingredients || "",
      description: description || "",
      imageUrl: imageUrl || "",
      category,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Add recipe ingredients if provided
    if (recipeIngredients && Array.isArray(recipeIngredients) && recipeIngredients.length > 0) {
      const ingredientsToInsert = recipeIngredients.map((ingredient) => ({
        dishId: result.insertedId,
        productId: new ObjectId(ingredient.productId),
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))

      await db.collection("recipeIngredients").insertMany(ingredientsToInsert)
    }

    res.status(201).json({
      success: true,
      message: "Thêm món ăn thành công",
      dishId: result.insertedId.toString(),
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error creating dish:", error)
    throw new AppError("Đã xảy ra lỗi khi thêm món ăn", 500)
  }
}

// @desc    Update dish
// @route   PATCH /api/dishes/:id
// @access  Private (Admin only)
export const updateDish = async (req: Request, res: Response) => {
  try {
    const dishId = req.params.id
    const { name, ingredients, description, imageUrl, category, recipeIngredients } = req.body

    // Validate ObjectId
    if (!ObjectId.isValid(dishId)) {
      throw new AppError("ID món ăn không hợp lệ", 400)
    }

    // Validate input
    if (!name || !category) {
      throw new AppError("Tên món ăn và phân loại không được để trống", 400)
    }

    const db = await getDb()

    // Check if dish with the same name already exists (excluding current dish)
    const existingDish = await db.collection("dishes").findOne({
      _id: { $ne: new ObjectId(dishId) },
      name,
    })

    if (existingDish) {
      throw new AppError("Món ăn với tên này đã tồn tại", 400)
    }

    // Update dish
    const result = await db.collection("dishes").updateOne(
      { _id: new ObjectId(dishId) },
      {
        $set: {
          name,
          ingredients: ingredients || "",
          description: description || "",
          imageUrl: imageUrl || "",
          category,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      throw new AppError("Không tìm thấy món ăn", 404)
    }

    // Update recipe ingredients if provided
    if (recipeIngredients && Array.isArray(recipeIngredients)) {
      // Delete existing recipe ingredients
      await db.collection("recipeIngredients").deleteMany({ dishId: new ObjectId(dishId) })

      // Add new recipe ingredients
      if (recipeIngredients.length > 0) {
        const ingredientsToInsert = recipeIngredients.map((ingredient) => ({
          dishId: new ObjectId(dishId),
          productId: new ObjectId(ingredient.productId),
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))

        await db.collection("recipeIngredients").insertMany(ingredientsToInsert)
      }
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật món ăn thành công",
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error updating dish:", error)
    throw new AppError("Đã xảy ra lỗi khi cập nhật món ăn", 500)
  }
}

// @desc    Delete dish
// @route   DELETE /api/dishes/:id
// @access  Private (Admin only)
export const deleteDish = async (req: Request, res: Response) => {
  try {
    const dishId = req.params.id

    // Validate ObjectId
    if (!ObjectId.isValid(dishId)) {
      throw new AppError("ID món ăn không hợp lệ", 400)
    }

    const db = await getDb()

    // Check if dish is being used in any menu
    const menuWithDish = await db.collection("meals").findOne({
      dishes: { $elemMatch: { $eq: new ObjectId(dishId) } },
    })

    if (menuWithDish) {
      throw new AppError("Không thể xóa món ăn đang được sử dụng trong thực đơn", 400)
    }

    // Delete dish
    const result = await db.collection("dishes").deleteOne({ _id: new ObjectId(dishId) })

    if (result.deletedCount === 0) {
      throw new AppError("Không tìm thấy món ăn", 404)
    }

    // Delete recipe ingredients
    await db.collection("recipeIngredients").deleteMany({ dishId: new ObjectId(dishId) })

    res.status(200).json({
      success: true,
      message: "Xóa món ăn thành công",
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error deleting dish:", error)
    throw new AppError("Đã xảy ra lỗi khi xóa món ăn", 500)
  }
}
