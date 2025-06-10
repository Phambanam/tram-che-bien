import type { Request, Response } from "express"
import { ObjectId } from "mongodb"
import { getDb } from "../config/database"
import { AppError } from "../middleware/error.middleware"

interface DishIngredient {
  lttpId: string
  lttpName: string
  quantity: number
  unit: string
  notes?: string
}

interface MainLTTP {
  lttpId: string
  lttpName: string
  category: string
}

// @desc    Get all dishes
// @route   GET /api/dishes
// @access  Private
export const getDishes = async (req: Request, res: Response) => {
  try {
    const db = await getDb()

    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const skip = (page - 1) * limit
    
    // Filter parameters
    const { category, lttpId, mainLttpId } = req.query
    const filter: any = {}
    
    if (category) {
      filter.category = category
    }
    
    if (lttpId) {
      filter["ingredients.lttpId"] = lttpId
    }

    if (mainLttpId) {
      filter["mainLTTP.lttpId"] = mainLttpId
    }
    
    // Get total count for pagination
    const totalCount = await db.collection("dishes").countDocuments(filter)
    
    // Get dishes
    const dishes = await db
      .collection("dishes")
      .find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    // Transform data for response
    const transformedDishes = dishes.map((dish) => ({
      _id: dish._id.toString(),
      name: dish.name,
      description: dish.description,
      mainLTTP: dish.mainLTTP || null,
      ingredients: dish.ingredients || [],
      servings: dish.servings,
      preparationTime: dish.preparationTime,
      difficulty: dish.difficulty,
      category: dish.category,
      createdAt: dish.createdAt,
      updatedAt: dish.updatedAt,
    }))

    res.status(200).json({
      success: true,
      count: transformedDishes.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      data: transformedDishes,
    })
  } catch (error) {
    console.error("Error fetching dishes:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy danh sách món ăn",

    })
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
      return res.status(404).json({
        success: false,
        message: "ID món ăn không hợp lệ",

      })
    }

    const db = await getDb()

    const dish = await db.collection("dishes").findOne({ _id: new ObjectId(dishId) })

    if (!dish) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy món ăn",

      })
    }

    // Transform data for response
    const transformedDish = {
      _id: dish._id.toString(),
      name: dish.name,
      description: dish.description,
      mainLTTP: dish.mainLTTP || null,
      ingredients: dish.ingredients || [],
      servings: dish.servings,
      preparationTime: dish.preparationTime,
      difficulty: dish.difficulty,
      category: dish.category,
      createdAt: dish.createdAt,
      updatedAt: dish.updatedAt,
    }

    res.status(200).json({
      success: true,
      data: transformedDish,
    })
  } catch (error) {
   
    console.error("Error fetching dish:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy thông tin món ăn",

    })
  }
}

// @desc    Create new dish
// @route   POST /api/dishes
// @access  Private (Admin, Brigade Assistant)
export const createDish = async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      description, 
      mainLTTP,
      ingredients, 
      servings, 
      preparationTime, 
      difficulty, 
      category 
    } = req.body

    // Validate input
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Tên món ăn không được để trống",

      })
    }

    if (!mainLTTP || !mainLTTP.lttpId || !mainLTTP.lttpName) {
      return res.status(400).json({
        success: false,
        message: "LTTP chính không được để trống",

      })
    }

    const db = await getDb()

    // Check if dish already exists
    const existingDish = await db.collection("dishes").findOne({ name })
    if (existingDish) {
     return res.status(400).json({
        success: false,
        message: "Món ăn đã tồn tại trong hệ thống",
      
      })
    }

    // Validate ingredients if provided
    if (ingredients && Array.isArray(ingredients)) {
      for (const ingredient of ingredients) {
        if (!ingredient.lttpId || !ingredient.lttpName || !ingredient.quantity || !ingredient.unit) {
          return res.status(400).json({
            success: false,
            message: "Thông tin nguyên liệu không đầy đủ",

          })
}
      }
    }

    // Create new dish
    const result = await db.collection("dishes").insertOne({
      name,
      description: description || "",
      mainLTTP: {
        lttpId: mainLTTP.lttpId,
        lttpName: mainLTTP.lttpName,
        category: mainLTTP.category || ""
      },
      ingredients: ingredients || [],
      servings: servings || 1,
      preparationTime: preparationTime || 0,
      difficulty: difficulty || "medium",
      category: category || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

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
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi thêm món ăn",

    })
  }
}

// @desc    Update dish
// @route   PATCH /api/dishes/:id
// @access  Private (Admin, Brigade Assistant)
export const updateDish = async (req: Request, res: Response) => {
  try {
    const dishId = req.params.id
    const { 
      name, 
      description, 
      mainLTTP,
      ingredients, 
      servings, 
      preparationTime, 
      difficulty, 
      category 
    } = req.body

    // Validate ObjectId
    if (!ObjectId.isValid(dishId)) {
      return res.status(400).json({
        success: false,
        message: "ID món ăn không hợp lệ"
      })
    }

    // Validate input
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Tên món ăn không được để trống"
      })
    }

    if (!mainLTTP || !mainLTTP.lttpId || !mainLTTP.lttpName) {
      return res.status(400).json({
        success: false,
        message: "LTTP chính không được để trống"
      })
    }

    const db = await getDb()

    // Check if dish with the same name already exists (excluding current dish)
    const existingDish = await db.collection("dishes").findOne({
      _id: { $ne: new ObjectId(dishId) },
      name,
    })

    if (existingDish) {
      return res.status(400).json({
        success: false,
        message: "Món ăn với tên này đã tồn tại"
      })
    }

    // Validate ingredients if provided
    if (ingredients && Array.isArray(ingredients)) {
      for (const ingredient of ingredients) {
        if (!ingredient.lttpId || !ingredient.lttpName || !ingredient.quantity || !ingredient.unit) {
          return res.status(400).json({
            success: false,
            message: "Thông tin nguyên liệu không đầy đủ"
          })
        }
      }
    }

    const result = await db.collection("dishes").updateOne(
      { _id: new ObjectId(dishId) },
      {
        $set: {
          name,
          description: description || "",
          mainLTTP: {
            lttpId: mainLTTP.lttpId,
            lttpName: mainLTTP.lttpName,
            category: mainLTTP.category || ""
          },
          ingredients: ingredients || [],
          servings: servings || 1,
          preparationTime: preparationTime || 0,
          difficulty: difficulty || "medium",
          category: category || "",
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy món ăn",

      })
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật món ăn thành công",
    })
  } catch (error) {
    console.error("Error updating dish:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật món ăn"
    })
  }
}

// @desc    Delete dish
// @route   DELETE /api/dishes/:id
// @access  Private (Admin)
export const deleteDish = async (req: Request, res: Response) => {
  try {
    const dishId = req.params.id

    // Validate ObjectId
    if (!ObjectId.isValid(dishId)) {
      return res.status(400).json({
        success: false,
        message: "ID món ăn không hợp lệ",

      })
    }

    const db = await getDb()

    const result = await db.collection("dishes").deleteOne({ _id: new ObjectId(dishId) })

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy món ăn",

      })
    }

    res.status(200).json({
      success: true,
      message: "Xóa món ăn thành công",
    })
  } catch (error) {
   
    console.error("Error deleting dish:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xóa món ăn",

    })
  }
}

// @desc    Get dishes by main LTTP
// @route   GET /api/dishes/by-main-lttp/:lttpId
// @access  Private
export const getDishesByMainLTTP = async (req: Request, res: Response) => {
  try {
    const lttpId = req.params.lttpId

    const db = await getDb()

    const dishes = await db
      .collection("dishes")
      .find({ "mainLTTP.lttpId": lttpId })
      .sort({ name: 1 })
      .toArray()

    // Transform data for response
    const transformedDishes = dishes.map((dish) => ({
      _id: dish._id.toString(),
      name: dish.name,
      description: dish.description,
      mainLTTP: dish.mainLTTP || null,
      ingredients: dish.ingredients || [],
      servings: dish.servings,
      preparationTime: dish.preparationTime,
      difficulty: dish.difficulty,
      category: dish.category,
    }))

    res.status(200).json({
      success: true,
      count: transformedDishes.length,
      data: transformedDishes,
    })
  } catch (error) {
    console.error("Error fetching dishes by main LTTP:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy danh sách món ăn theo LTTP chính",

    })
  }
}

// @desc    Get dishes by ingredient
// @route   GET /api/dishes/by-ingredient/:lttpId
// @access  Private
export const getDishesByIngredient = async (req: Request, res: Response) => {
  try {
    const lttpId = req.params.lttpId

    const db = await getDb()

    const dishes = await db
      .collection("dishes")
      .find({ "ingredients.lttpId": lttpId })
      .sort({ name: 1 })
      .toArray()

    // Transform data for response
    const transformedDishes = dishes.map((dish) => ({
      _id: dish._id.toString(),
      name: dish.name,
      description: dish.description,
      mainLTTP: dish.mainLTTP || null,
      ingredients: dish.ingredients || [],
      servings: dish.servings,
      preparationTime: dish.preparationTime,
      difficulty: dish.difficulty,
      category: dish.category,
    }))

    res.status(200).json({
      success: true,
      count: transformedDishes.length,
      data: transformedDishes,
    })
  } catch (error) {
    console.error("Error fetching dishes by ingredient:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy danh sách món ăn theo nguyên liệu",

    })
  }
}
