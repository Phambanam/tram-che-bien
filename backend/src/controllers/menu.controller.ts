import type { Request, Response } from "express"
import { ObjectId } from "mongodb"
import { getDb } from "../config/database"
import { AppError } from "../middleware/error.middleware"

// @desc    Get all menus
// @route   GET /api/menus
// @access  Private
export const getAllMenus = async (req: Request, res: Response) => {
  try {
    const { year, week } = req.query

    const db = await getDb()

    let query = {}
    if (year) {
      query = { ...query, year: Number.parseInt(year as string) }
    }
    if (week) {
      query = { ...query, week: Number.parseInt(week as string) }
    }

    const menus = await db.collection("menus").find(query).sort({ year: -1, week: -1 }).toArray()

    // Transform data for response
    const transformedMenus = menus.map((menu) => ({
      id: menu._id.toString(),
      week: menu.week,
      year: menu.year,
      startDate: menu.startDate,
      endDate: menu.endDate,
      status: menu.status,
    }))

    res.status(200).json({
      success: true,
      count: transformedMenus.length,
      data: transformedMenus,
    })
  } catch (error) {
    console.error("Error fetching menus:", error)
    throw new AppError("Đã xảy ra lỗi khi lấy danh sách thực đơn", 500)
  }
}

// @desc    Get menu by ID with daily menus
// @route   GET /api/menus/:id
// @access  Private
export const getMenuById = async (req: Request, res: Response) => {
  try {
    const menuId = req.params.id

    // Validate ObjectId
    if (!ObjectId.isValid(menuId)) {
      throw new AppError("ID thực đơn không hợp lệ", 400)
    }

    const db = await getDb()

    const menu = await db.collection("menus").findOne({ _id: new ObjectId(menuId) })

    if (!menu) {
      throw new AppError("Không tìm thấy thực đơn", 404)
    }

    // Get daily menus
    const dailyMenus = await db
      .collection("dailyMenus")
      .find({ menuId: new ObjectId(menuId) })
      .sort({ date: 1 })
      .toArray()

    // Get meals for each daily menu
    const dailyMenusWithMeals = await Promise.all(
      dailyMenus.map(async (dailyMenu) => {
        const meals = await db
          .collection("meals")
          .aggregate([
            {
              $match: { dailyMenuId: dailyMenu._id },
            },
            {
              $lookup: {
                from: "dishes",
                localField: "dishes",
                foreignField: "_id",
                as: "dishDetails",
              },
            },
            {
              $project: {
                id: { $toString: "$_id" },
                dailyMenuId: { $toString: "$dailyMenuId" },
                type: 1,
                dishes: "$dishDetails",
              },
            },
          ])
          .toArray()

        return {
          id: dailyMenu._id.toString(),
          menuId: dailyMenu.menuId.toString(),
          date: dailyMenu.date,
          mealCount: dailyMenu.mealCount,
          status: dailyMenu.status,
          meals: meals,
        }
      }),
    )

    // Transform data for response
    const transformedMenu = {
      id: menu._id.toString(),
      week: menu.week,
      year: menu.year,
      startDate: menu.startDate,
      endDate: menu.endDate,
      status: menu.status,
      dailyMenus: dailyMenusWithMeals,
    }

    res.status(200).json({
      success: true,
      data: transformedMenu,
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error fetching menu:", error)
    throw new AppError("Đã xảy ra lỗi khi lấy thông tin thực đơn", 500)
  }
}

// @desc    Create new menu
// @route   POST /api/menus
// @access  Private (Admin only)
export const createMenu = async (req: Request, res: Response) => {
  try {
    const { week, year, startDate, endDate } = req.body

    // Validate input
    if (!week || !year || !startDate || !endDate) {
      throw new AppError("Vui lòng điền đầy đủ thông tin", 400)
    }

    const db = await getDb()

    // Check if menu already exists
    const existingMenu = await db.collection("menus").findOne({ week, year })
    if (existingMenu) {
      throw new AppError("Thực đơn tuần này đã tồn tại", 400)
    }

    // Create new menu
    const result = await db.collection("menus").insertOne({
      week,
      year,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    res.status(201).json({
      success: true,
      message: "Thêm thực đơn thành công",
      menuId: result.insertedId.toString(),
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error creating menu:", error)
    throw new AppError("Đã xảy ra lỗi khi thêm thực đơn", 500)
  }
}

// @desc    Update menu
// @route   PATCH /api/menus/:id
// @access  Private (Admin only)
export const updateMenu = async (req: Request, res: Response) => {
  try {
    const menuId = req.params.id
    const { week, year, startDate, endDate, status } = req.body

    // Validate ObjectId
    if (!ObjectId.isValid(menuId)) {
      throw new AppError("ID thực đơn không hợp lệ", 400)
    }

    // Validate input
    if (!week || !year || !startDate || !endDate) {
      throw new AppError("Vui lòng điền đầy đủ thông tin", 400)
    }

    const db = await getDb()

    // Check if menu with the same week and year already exists (excluding current menu)
    const existingMenu = await db.collection("menus").findOne({
      _id: { $ne: new ObjectId(menuId) },
      week,
      year,
    })

    if (existingMenu) {
      throw new AppError("Thực đơn tuần này đã tồn tại", 400)
    }

    // Update menu
    const result = await db.collection("menus").updateOne(
      { _id: new ObjectId(menuId) },
      {
        $set: {
          week,
          year,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          status: status || "active",
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      throw new AppError("Không tìm thấy thực đơn", 404)
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật thực đơn thành công",
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error updating menu:", error)
    throw new AppError("Đã xảy ra lỗi khi cập nhật thực đơn", 500)
  }
}

// @desc    Delete menu
// @route   DELETE /api/menus/:id
// @access  Private (Admin only)
export const deleteMenu = async (req: Request, res: Response) => {
  try {
    const menuId = req.params.id

    // Validate ObjectId
    if (!ObjectId.isValid(menuId)) {
      throw new AppError("ID thực đơn không hợp lệ", 400)
    }

    const db = await getDb()

    // Get daily menus
    const dailyMenus = await db
      .collection("dailyMenus")
      .find({ menuId: new ObjectId(menuId) })
      .toArray()

    // Delete meals for each daily menu
    for (const dailyMenu of dailyMenus) {
      await db.collection("meals").deleteMany({ dailyMenuId: dailyMenu._id })
    }

    // Delete daily menus
    await db.collection("dailyMenus").deleteMany({ menuId: new ObjectId(menuId) })

    // Delete menu
    const result = await db.collection("menus").deleteOne({ _id: new ObjectId(menuId) })

    if (result.deletedCount === 0) {
      throw new AppError("Không tìm thấy thực đơn", 404)
    }

    res.status(200).json({
      success: true,
      message: "Xóa thực đơn thành công",
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error deleting menu:", error)
    throw new AppError("Đã xảy ra lỗi khi xóa thực đơn", 500)
  }
}

// @desc    Create daily menu
// @route   POST /api/menus/:id/daily-menus
// @access  Private (Admin only)
export const createDailyMenu = async (req: Request, res: Response) => {
  try {
    const menuId = req.params.id
    const { date, mealCount } = req.body

    // Validate ObjectId
    if (!ObjectId.isValid(menuId)) {
      throw new AppError("ID thực đơn không hợp lệ", 400)
    }

    // Validate input
    if (!date || !mealCount) {
      throw new AppError("Vui lòng điền đầy đủ thông tin", 400)
    }

    const db = await getDb()

    // Check if menu exists
    const menu = await db.collection("menus").findOne({ _id: new ObjectId(menuId) })
    if (!menu) {
      throw new AppError("Không tìm thấy thực đơn", 404)
    }

    // Check if daily menu already exists
    const existingDailyMenu = await db.collection("dailyMenus").findOne({
      menuId: new ObjectId(menuId),
      date: new Date(date),
    })

    if (existingDailyMenu) {
      throw new AppError("Thực đơn ngày này đã tồn tại", 400)
    }

    // Create new daily menu
    const result = await db.collection("dailyMenus").insertOne({
      menuId: new ObjectId(menuId),
      date: new Date(date),
      mealCount,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Create default meals (morning, noon, evening)
    const mealTypes = ["morning", "noon", "evening"]
    for (const type of mealTypes) {
      await db.collection("meals").insertOne({
        dailyMenuId: result.insertedId,
        type,
        dishes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    res.status(201).json({
      success: true,
      message: "Thêm thực đơn ngày thành công",
      dailyMenuId: result.insertedId.toString(),
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error creating daily menu:", error)
    throw new AppError("Đã xảy ra lỗi khi thêm thực đơn ngày", 500)
  }
}

// @desc    Update daily menu
// @route   PATCH /api/menus/daily-menus/:id
// @access  Private (Admin only)
export const updateDailyMenu = async (req: Request, res: Response) => {
  try {
    const dailyMenuId = req.params.id
    const { date, mealCount, status } = req.body

    // Validate ObjectId
    if (!ObjectId.isValid(dailyMenuId)) {
      throw new AppError("ID thực đơn ngày không hợp lệ", 400)
    }

    // Validate input
    if (!date || !mealCount) {
      throw new AppError("Vui lòng điền đầy đủ thông tin", 400)
    }

    const db = await getDb()

    // Get current daily menu
    const currentDailyMenu = await db.collection("dailyMenus").findOne({ _id: new ObjectId(dailyMenuId) })
    if (!currentDailyMenu) {
      throw new AppError("Không tìm thấy thực đơn ngày", 404)
    }

    // Check if daily menu with the same date already exists (excluding current daily menu)
    const existingDailyMenu = await db.collection("dailyMenus").findOne({
      _id: { $ne: new ObjectId(dailyMenuId) },
      menuId: currentDailyMenu.menuId,
      date: new Date(date),
    })

    if (existingDailyMenu) {
      throw new AppError("Thực đơn ngày này đã tồn tại", 400)
    }

    // Update daily menu
    const result = await db.collection("dailyMenus").updateOne(
      { _id: new ObjectId(dailyMenuId) },
      {
        $set: {
          date: new Date(date),
          mealCount,
          status: status || "active",
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      throw new AppError("Không tìm thấy thực đơn ngày", 404)
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật thực đơn ngày thành công",
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error updating daily menu:", error)
    throw new AppError("Đã xảy ra lỗi khi cập nhật thực đơn ngày", 500)
  }
}

// @desc    Delete daily menu
// @route   DELETE /api/menus/daily-menus/:id
// @access  Private (Admin only)
export const deleteDailyMenu = async (req: Request, res: Response) => {
  try {
    const dailyMenuId = req.params.id

    // Validate ObjectId
    if (!ObjectId.isValid(dailyMenuId)) {
      throw new AppError("ID thực đơn ngày không hợp lệ", 400)
    }

    const db = await getDb()

    // Delete meals
    await db.collection("meals").deleteMany({ dailyMenuId: new ObjectId(dailyMenuId) })

    // Delete daily menu
    const result = await db.collection("dailyMenus").deleteOne({ _id: new ObjectId(dailyMenuId) })

    if (result.deletedCount === 0) {
      throw new AppError("Không tìm thấy thực đơn ngày", 404)
    }

    res.status(200).json({
      success: true,
      message: "Xóa thực đơn ngày thành công",
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error deleting daily menu:", error)
    throw new AppError("Đã xảy ra lỗi khi xóa thực đơn ngày", 500)
  }
}

// @desc    Update meal dishes
// @route   PATCH /api/menus/meals/:id
// @access  Private (Admin only)
export const updateMealDishes = async (req: Request, res: Response) => {
  try {
    const mealId = req.params.id
    const { dishes } = req.body

    // Validate ObjectId
    if (!ObjectId.isValid(mealId)) {
      throw new AppError("ID bữa ăn không hợp lệ", 400)
    }

    // Validate input
    if (!dishes || !Array.isArray(dishes)) {
      throw new AppError("Danh sách món ăn không hợp lệ", 400)
    }

    const db = await getDb()

    // Validate dishes
    for (const dishId of dishes) {
      if (!ObjectId.isValid(dishId)) {
        throw new AppError("ID món ăn không hợp lệ", 400)
      }

      const dish = await db.collection("dishes").findOne({ _id: new ObjectId(dishId) })
      if (!dish) {
        throw new AppError(`Không tìm thấy món ăn với ID: ${dishId}`, 404)
      }
    }

    // Update meal dishes
    const result = await db.collection("meals").updateOne(
      { _id: new ObjectId(mealId) },
      {
        $set: {
          dishes: dishes.map((dishId) => new ObjectId(dishId)),
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      throw new AppError("Không tìm thấy bữa ăn", 404)
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật món ăn thành công",
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error updating meal dishes:", error)
    throw new AppError("Đã xảy ra lỗi khi cập nhật món ăn", 500)
  }
}

// @desc    Copy daily menu
// @route   POST /api/menus/daily-menus/:id/copy
// @access  Private (Admin only)
export const copyDailyMenu = async (req: Request, res: Response) => {
  try {
    const sourceDailyMenuId = req.params.id
    const { targetDate, mealCount } = req.body

    // Validate ObjectId
    if (!ObjectId.isValid(sourceDailyMenuId)) {
      throw new AppError("ID thực đơn ngày nguồn không hợp lệ", 400)
    }

    // Validate input
    if (!targetDate) {
      throw new AppError("Vui lòng chọn ngày đích", 400)
    }

    const db = await getDb()

    // Get source daily menu
    const sourceDailyMenu = await db.collection("dailyMenus").findOne({ _id: new ObjectId(sourceDailyMenuId) })
    if (!sourceDailyMenu) {
      throw new AppError("Không tìm thấy thực đơn ngày nguồn", 404)
    }

    // Check if target daily menu already exists
    const existingTargetDailyMenu = await db.collection("dailyMenus").findOne({
      menuId: sourceDailyMenu.menuId,
      date: new Date(targetDate),
    })

    if (existingTargetDailyMenu) {
      throw new AppError("Thực đơn ngày đích đã tồn tại", 400)
    }

    // Create target daily menu
    const targetDailyMenuResult = await db.collection("dailyMenus").insertOne({
      menuId: sourceDailyMenu.menuId,
      date: new Date(targetDate),
      mealCount: mealCount || sourceDailyMenu.mealCount,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Get source meals
    const sourceMeals = await db
      .collection("meals")
      .find({ dailyMenuId: new ObjectId(sourceDailyMenuId) })
      .toArray()

    // Create target meals
    for (const sourceMeal of sourceMeals) {
      await db.collection("meals").insertOne({
        dailyMenuId: targetDailyMenuResult.insertedId,
        type: sourceMeal.type,
        dishes: sourceMeal.dishes,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    res.status(201).json({
      success: true,
      message: "Sao chép thực đơn ngày thành công",
      dailyMenuId: targetDailyMenuResult.insertedId.toString(),
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error copying daily menu:", error)
    throw new AppError("Đã xảy ra lỗi khi sao chép thực đơn ngày", 500)
  }
}
