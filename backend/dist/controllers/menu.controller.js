"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectDailyMenu = exports.approveDailyMenu = exports.copyDailyMenu = exports.removeDishFromMeal = exports.addDishToMeal = exports.updateMealDishes = exports.deleteDailyMenu = exports.updateDailyMenu = exports.createDailyMenu = exports.deleteMenu = exports.updateMenu = exports.createMenu = exports.getMenuById = exports.getAllMenus = void 0;
const mongodb_1 = require("mongodb");
const database_1 = require("../config/database");
// @desc    Get all menus
// @route   GET /api/menus
// @access  Private
const getAllMenus = async (req, res) => {
    try {
        const { year, week } = req.query;
        const db = await (0, database_1.getDb)();
        let query = {};
        if (year) {
            query = { ...query, year: Number.parseInt(year) };
        }
        if (week) {
            query = { ...query, week: Number.parseInt(week) };
        }
        const menus = await db.collection("menus").find(query).sort({ year: -1, week: -1 }).toArray();
        // Transform data for response
        const transformedMenus = menus.map((menu) => ({
            id: menu._id.toString(),
            week: menu.week,
            year: menu.year,
            startDate: menu.startDate,
            endDate: menu.endDate,
            status: menu.status,
        }));
        res.status(200).json({
            success: true,
            count: transformedMenus.length,
            data: transformedMenus,
        });
    }
    catch (error) {
        console.error("Error fetching menus:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi lấy danh sách thực đơn"
        });
    }
};
exports.getAllMenus = getAllMenus;
// @desc    Get menu by ID with daily menus
// @route   GET /api/menus/:id
// @access  Private
const getMenuById = async (req, res) => {
    try {
        const menuId = req.params.id;
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(menuId)) {
            return res.status(400).json({
                success: false,
                message: "ID thực đơn không hợp lệ"
            });
        }
        const db = await (0, database_1.getDb)();
        const menu = await db.collection("menus").findOne({ _id: new mongodb_1.ObjectId(menuId) });
        if (!menu) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thực đơn"
            });
        }
        // Get daily menus
        const dailyMenus = await db
            .collection("dailyMenus")
            .find({ menuId: new mongodb_1.ObjectId(menuId) })
            .sort({ date: 1 })
            .toArray();
        // Get meals for each daily menu
        const dailyMenusWithMeals = await Promise.all(dailyMenus.map(async (dailyMenu) => {
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
                .toArray();
            return {
                id: dailyMenu._id.toString(),
                menuId: dailyMenu.menuId.toString(),
                date: dailyMenu.date instanceof Date ? dailyMenu.date.toISOString().split('T')[0] : dailyMenu.date,
                mealCount: dailyMenu.mealCount,
                status: dailyMenu.status,
                meals: meals,
            };
        }));
        // Transform data for response
        const transformedMenu = {
            id: menu._id.toString(),
            week: menu.week,
            year: menu.year,
            startDate: menu.startDate,
            endDate: menu.endDate,
            status: menu.status,
            dailyMenus: dailyMenusWithMeals,
        };
        res.status(200).json({
            success: true,
            data: transformedMenu,
        });
    }
    catch (error) {
        console.error("Error fetching menu:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi lấy thông tin thực đơn"
        });
    }
};
exports.getMenuById = getMenuById;
// @desc    Create new menu
// @route   POST /api/menus
// @access  Private (Brigade Assistant only)
const createMenu = async (req, res) => {
    try {
        const { week, year, startDate, endDate } = req.body;
        // Validate input
        if (!week || !year || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng điền đầy đủ thông tin"
            });
        }
        const db = await (0, database_1.getDb)();
        // Check if menu already exists
        const existingMenu = await db.collection("menus").findOne({ week, year });
        if (existingMenu) {
            return res.status(400).json({
                success: false,
                message: "Thực đơn tuần này đã tồn tại"
            });
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
        });
        res.status(201).json({
            success: true,
            message: "Thêm thực đơn thành công",
            menuId: result.insertedId.toString(),
        });
    }
    catch (error) {
        console.error("Error creating menu:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi thêm thực đơn"
        });
    }
};
exports.createMenu = createMenu;
// @desc    Update menu
// @route   PATCH /api/menus/:id
// @access  Private (Brigade Assistant only)
const updateMenu = async (req, res) => {
    try {
        const menuId = req.params.id;
        const { week, year, startDate, endDate, status } = req.body;
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(menuId)) {
            return res.status(400).json({
                success: false,
                message: "ID thực đơn không hợp lệ"
            });
        }
        // Validate input
        if (!week || !year || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng điền đầy đủ thông tin"
            });
        }
        const db = await (0, database_1.getDb)();
        // Check if menu with the same week and year already exists (excluding current menu)
        const existingMenu = await db.collection("menus").findOne({
            _id: { $ne: new mongodb_1.ObjectId(menuId) },
            week,
            year,
        });
        if (existingMenu) {
            return res.status(400).json({
                success: false,
                message: "Thực đơn tuần này đã tồn tại"
            });
        }
        // Update menu
        const result = await db.collection("menus").updateOne({ _id: new mongodb_1.ObjectId(menuId) }, {
            $set: {
                week,
                year,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                status: status || "active",
                updatedAt: new Date(),
            },
        });
        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thực đơn"
            });
        }
        res.status(200).json({
            success: true,
            message: "Cập nhật thực đơn thành công",
        });
    }
    catch (error) {
        console.error("Error updating menu:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi cập nhật thực đơn"
        });
    }
};
exports.updateMenu = updateMenu;
// @desc    Delete menu
// @route   DELETE /api/menus/:id
// @access  Private (Brigade Assistant only)
const deleteMenu = async (req, res) => {
    try {
        const menuId = req.params.id;
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(menuId)) {
            return res.status(400).json({
                success: false,
                message: "ID thực đơn không hợp lệ"
            });
        }
        const db = await (0, database_1.getDb)();
        // Get daily menus
        const dailyMenus = await db
            .collection("dailyMenus")
            .find({ menuId: new mongodb_1.ObjectId(menuId) })
            .toArray();
        // Delete meals for each daily menu
        for (const dailyMenu of dailyMenus) {
            await db.collection("meals").deleteMany({ dailyMenuId: dailyMenu._id });
        }
        // Delete daily menus
        await db.collection("dailyMenus").deleteMany({ menuId: new mongodb_1.ObjectId(menuId) });
        // Delete menu
        const result = await db.collection("menus").deleteOne({ _id: new mongodb_1.ObjectId(menuId) });
        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thực đơn"
            });
        }
        res.status(200).json({
            success: true,
            message: "Xóa thực đơn thành công",
        });
    }
    catch (error) {
        console.error("Error deleting menu:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi xóa thực đơn"
        });
    }
};
exports.deleteMenu = deleteMenu;
// @desc    Create daily menu
// @route   POST /api/menus/:id/daily-menus
// @access  Private (Brigade Assistant only)
const createDailyMenu = async (req, res) => {
    try {
        const menuId = req.params.id;
        const { date, mealCount } = req.body;
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(menuId)) {
            return res.status(400).json({
                success: false,
                message: "ID thực đơn không hợp lệ"
            });
        }
        // Validate input
        if (!date || !mealCount) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng điền đầy đủ thông tin"
            });
        }
        const db = await (0, database_1.getDb)();
        // Check if menu exists
        const menu = await db.collection("menus").findOne({ _id: new mongodb_1.ObjectId(menuId) });
        if (!menu) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thực đơn"
            });
        }
        // Check if daily menu already exists
        const existingDailyMenu = await db.collection("dailyMenus").findOne({
            menuId: new mongodb_1.ObjectId(menuId),
            date: new Date(date),
        });
        if (existingDailyMenu) {
            return res.status(400).json({
                success: false,
                message: "Thực đơn ngày này đã tồn tại"
            });
        }
        // Create new daily menu
        const result = await db.collection("dailyMenus").insertOne({
            menuId: new mongodb_1.ObjectId(menuId),
            date: new Date(date),
            mealCount,
            status: "pending", // Default to pending for approval workflow
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        // Create default meals (morning, noon, evening)
        const mealTypes = ["morning", "noon", "evening"];
        for (const type of mealTypes) {
            await db.collection("meals").insertOne({
                dailyMenuId: result.insertedId,
                type,
                dishes: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
        res.status(201).json({
            success: true,
            message: "Thêm thực đơn ngày thành công",
            dailyMenuId: result.insertedId.toString(),
        });
    }
    catch (error) {
        console.error("Error creating daily menu:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi thêm thực đơn ngày"
        });
    }
};
exports.createDailyMenu = createDailyMenu;
// @desc    Update daily menu
// @route   PATCH /api/menus/daily-menus/:id
// @access  Private (Brigade Assistant only)
const updateDailyMenu = async (req, res) => {
    try {
        const dailyMenuId = req.params.id;
        const { date, mealCount, status } = req.body;
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(dailyMenuId)) {
            return res.status(400).json({
                success: false,
                message: "ID thực đơn ngày không hợp lệ"
            });
        }
        // Validate input
        if (!date || !mealCount) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng điền đầy đủ thông tin"
            });
        }
        const db = await (0, database_1.getDb)();
        // Get current daily menu
        const currentDailyMenu = await db.collection("dailyMenus").findOne({ _id: new mongodb_1.ObjectId(dailyMenuId) });
        if (!currentDailyMenu) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thực đơn ngày"
            });
        }
        // Check if daily menu with the same date already exists (excluding current daily menu)
        const existingDailyMenu = await db.collection("dailyMenus").findOne({
            _id: { $ne: new mongodb_1.ObjectId(dailyMenuId) },
            menuId: currentDailyMenu.menuId,
            date: new Date(date),
        });
        if (existingDailyMenu) {
            return res.status(400).json({
                success: false,
                message: "Thực đơn ngày này đã tồn tại"
            });
        }
        // Update daily menu
        const result = await db.collection("dailyMenus").updateOne({ _id: new mongodb_1.ObjectId(dailyMenuId) }, {
            $set: {
                date: new Date(date),
                mealCount,
                status: status || "active",
                updatedAt: new Date(),
            },
        });
        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thực đơn ngày"
            });
        }
        res.status(200).json({
            success: true,
            message: "Cập nhật thực đơn ngày thành công",
        });
    }
    catch (error) {
        console.error("Error updating daily menu:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi cập nhật thực đơn ngày"
        });
    }
};
exports.updateDailyMenu = updateDailyMenu;
// @desc    Delete daily menu
// @route   DELETE /api/menus/daily-menus/:id
// @access  Private (Brigade Assistant only)
const deleteDailyMenu = async (req, res) => {
    try {
        const dailyMenuId = req.params.id;
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(dailyMenuId)) {
            return res.status(400).json({
                success: false,
                message: "ID thực đơn ngày không hợp lệ"
            });
        }
        const db = await (0, database_1.getDb)();
        // Delete meals
        await db.collection("meals").deleteMany({ dailyMenuId: new mongodb_1.ObjectId(dailyMenuId) });
        // Delete daily menu
        const result = await db.collection("dailyMenus").deleteOne({ _id: new mongodb_1.ObjectId(dailyMenuId) });
        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thực đơn ngày"
            });
        }
        res.status(200).json({
            success: true,
            message: "Xóa thực đơn ngày thành công",
        });
    }
    catch (error) {
        console.error("Error deleting daily menu:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi xóa thực đơn ngày"
        });
    }
};
exports.deleteDailyMenu = deleteDailyMenu;
// @desc    Update meal dishes
// @route   PATCH /api/menus/meals/:id
// @access  Private (Brigade Assistant only)
const updateMealDishes = async (req, res) => {
    try {
        const mealId = req.params.id;
        const { dishes } = req.body;
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(mealId)) {
            return res.status(400).json({
                success: false,
                message: "ID bữa ăn không hợp lệ"
            });
        }
        // Validate input
        if (!dishes || !Array.isArray(dishes)) {
            return res.status(400).json({
                success: false,
                message: "Danh sách món ăn không hợp lệ"
            });
        }
        const db = await (0, database_1.getDb)();
        // Validate dishes
        for (const dishId of dishes) {
            if (!mongodb_1.ObjectId.isValid(dishId)) {
                return res.status(400).json({
                    success: false,
                    message: "ID món ăn không hợp lệ"
                });
            }
            const dish = await db.collection("dishes").findOne({ _id: new mongodb_1.ObjectId(dishId) });
            if (!dish) {
                return res.status(404).json({
                    success: false,
                    message: `Không tìm thấy món ăn với ID: ${dishId}`
                });
            }
        }
        // Update meal dishes
        const result = await db.collection("meals").updateOne({ _id: new mongodb_1.ObjectId(mealId) }, {
            $set: {
                dishes: dishes.map((dishId) => new mongodb_1.ObjectId(dishId)),
                updatedAt: new Date(),
            },
        });
        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy bữa ăn"
            });
        }
        res.status(200).json({
            success: true,
            message: "Cập nhật món ăn thành công",
        });
    }
    catch (error) {
        console.error("Error updating meal dishes:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi cập nhật món ăn"
        });
    }
};
exports.updateMealDishes = updateMealDishes;
// @desc    Add dish to meal
// @route   POST /api/menus/meals/:id/dishes
// @access  Private (Brigade Assistant only)
const addDishToMeal = async (req, res) => {
    try {
        const mealId = req.params.id;
        const { dishId, notes } = req.body;
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(mealId)) {
            return res.status(400).json({
                success: false,
                message: "ID bữa ăn không hợp lệ"
            });
        }
        if (!mongodb_1.ObjectId.isValid(dishId)) {
            return res.status(400).json({
                success: false,
                message: "ID món ăn không hợp lệ"
            });
        }
        const db = await (0, database_1.getDb)();
        // Check if dish exists
        const dish = await db.collection("dishes").findOne({ _id: new mongodb_1.ObjectId(dishId) });
        if (!dish) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy món ăn"
            });
        }
        // Check if meal exists
        const meal = await db.collection("meals").findOne({ _id: new mongodb_1.ObjectId(mealId) });
        if (!meal) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy bữa ăn"
            });
        }
        // Check if dish already exists in meal - fix the comparison logic
        const dishObjectId = new mongodb_1.ObjectId(dishId);
        console.log("Debug - Adding dish:", {
            dishId: dishId,
            dishObjectId: dishObjectId.toString(),
            mealId: mealId,
            existingDishes: meal.dishes.map((d) => ({
                type: typeof d,
                isObjectId: d instanceof mongodb_1.ObjectId,
                value: d.toString()
            }))
        });
        const dishExists = meal.dishes.some((d) => {
            // Handle both ObjectId and string formats
            if (d instanceof mongodb_1.ObjectId) {
                return d.equals(dishObjectId);
            }
            else {
                return d.toString() === dishId;
            }
        });
        console.log("Debug - Dish exists check:", dishExists);
        if (dishExists) {
            return res.status(400).json({
                success: false,
                message: "Món ăn đã tồn tại trong bữa ăn này"
            });
        }
        // Add dish to meal
        const result = await db.collection("meals").updateOne({ _id: new mongodb_1.ObjectId(mealId) }, {
            $push: { dishes: new mongodb_1.ObjectId(dishId) },
            $set: { updatedAt: new Date() },
        });
        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy bữa ăn"
            });
        }
        res.status(200).json({
            success: true,
            message: "Thêm món ăn thành công",
        });
    }
    catch (error) {
        console.error("Error adding dish to meal:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi thêm món ăn"
        });
    }
};
exports.addDishToMeal = addDishToMeal;
// @desc    Remove dish from meal
// @route   DELETE /api/menus/meals/:id/dishes/:dishId
// @access  Private (Brigade Assistant only)
const removeDishFromMeal = async (req, res) => {
    try {
        const mealId = req.params.id;
        const dishId = req.params.dishId;
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(mealId)) {
            return res.status(400).json({
                success: false,
                message: "ID bữa ăn không hợp lệ"
            });
        }
        if (!mongodb_1.ObjectId.isValid(dishId)) {
            return res.status(400).json({
                success: false,
                message: "ID món ăn không hợp lệ"
            });
        }
        const db = await (0, database_1.getDb)();
        // Remove dish from meal
        const result = await db.collection("meals").updateOne({ _id: new mongodb_1.ObjectId(mealId) }, {
            $pull: { dishes: new mongodb_1.ObjectId(dishId) },
            $set: { updatedAt: new Date() },
        });
        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy bữa ăn"
            });
        }
        res.status(200).json({
            success: true,
            message: "Xóa món ăn thành công",
        });
    }
    catch (error) {
        console.error("Error removing dish from meal:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi xóa món ăn"
        });
    }
};
exports.removeDishFromMeal = removeDishFromMeal;
// @desc    Copy daily menu
// @route   POST /api/menus/daily-menus/:id/copy
// @access  Private (Brigade Assistant only)
const copyDailyMenu = async (req, res) => {
    try {
        const sourceDailyMenuId = req.params.id;
        const { targetDate, mealCount } = req.body;
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(sourceDailyMenuId)) {
            return res.status(400).json({
                success: false,
                message: "ID thực đơn ngày nguồn không hợp lệ"
            });
        }
        // Validate input
        if (!targetDate) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng chọn ngày đích"
            });
        }
        const db = await (0, database_1.getDb)();
        // Get source daily menu
        const sourceDailyMenu = await db.collection("dailyMenus").findOne({ _id: new mongodb_1.ObjectId(sourceDailyMenuId) });
        if (!sourceDailyMenu) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thực đơn ngày nguồn"
            });
        }
        // Check if target daily menu already exists
        const existingTargetDailyMenu = await db.collection("dailyMenus").findOne({
            menuId: sourceDailyMenu.menuId,
            date: new Date(targetDate),
        });
        if (existingTargetDailyMenu) {
            return res.status(400).json({
                success: false,
                message: "Thực đơn ngày đích đã tồn tại"
            });
        }
        // Create target daily menu
        const targetDailyMenuResult = await db.collection("dailyMenus").insertOne({
            menuId: sourceDailyMenu.menuId,
            date: new Date(targetDate),
            mealCount: mealCount || sourceDailyMenu.mealCount,
            status: "pending", // Default to pending for approval workflow
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        // Get source meals
        const sourceMeals = await db
            .collection("meals")
            .find({ dailyMenuId: new mongodb_1.ObjectId(sourceDailyMenuId) })
            .toArray();
        // Create target meals
        for (const sourceMeal of sourceMeals) {
            await db.collection("meals").insertOne({
                dailyMenuId: targetDailyMenuResult.insertedId,
                type: sourceMeal.type,
                dishes: sourceMeal.dishes,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
        res.status(201).json({
            success: true,
            message: "Sao chép thực đơn ngày thành công",
            dailyMenuId: targetDailyMenuResult.insertedId.toString(),
        });
    }
    catch (error) {
        console.error("Error copying daily menu:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi sao chép thực đơn ngày"
        });
    }
};
exports.copyDailyMenu = copyDailyMenu;
// @desc    Approve daily menu
// @route   POST /api/menus/daily-menus/:id/approve
// @access  Private (Commander only)
const approveDailyMenu = async (req, res) => {
    try {
        const dailyMenuId = req.params.id;
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(dailyMenuId)) {
            return res.status(400).json({
                success: false,
                message: "ID thực đơn ngày không hợp lệ"
            });
        }
        const db = await (0, database_1.getDb)();
        // Check if daily menu exists
        const dailyMenu = await db.collection("dailyMenus").findOne({ _id: new mongodb_1.ObjectId(dailyMenuId) });
        if (!dailyMenu) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thực đơn ngày"
            });
        }
        // Update daily menu status to approved
        const result = await db.collection("dailyMenus").updateOne({ _id: new mongodb_1.ObjectId(dailyMenuId) }, {
            $set: {
                status: "approved",
                approvedBy: req.user?.id,
                approvedAt: new Date(),
                updatedAt: new Date(),
            },
        });
        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thực đơn ngày"
            });
        }
        res.status(200).json({
            success: true,
            message: "Phê duyệt thực đơn ngày thành công",
        });
    }
    catch (error) {
        console.error("Error approving daily menu:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi phê duyệt thực đơn ngày"
        });
    }
};
exports.approveDailyMenu = approveDailyMenu;
// @desc    Reject daily menu
// @route   POST /api/menus/daily-menus/:id/reject
// @access  Private (Commander only)
const rejectDailyMenu = async (req, res) => {
    try {
        const dailyMenuId = req.params.id;
        const { reason } = req.body;
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(dailyMenuId)) {
            return res.status(400).json({
                success: false,
                message: "ID thực đơn ngày không hợp lệ"
            });
        }
        const db = await (0, database_1.getDb)();
        // Check if daily menu exists
        const dailyMenu = await db.collection("dailyMenus").findOne({ _id: new mongodb_1.ObjectId(dailyMenuId) });
        if (!dailyMenu) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thực đơn ngày"
            });
        }
        // Update daily menu status to rejected
        const result = await db.collection("dailyMenus").updateOne({ _id: new mongodb_1.ObjectId(dailyMenuId) }, {
            $set: {
                status: "rejected",
                rejectedBy: req.user?.id,
                rejectedAt: new Date(),
                rejectionReason: reason || "Không có lý do cụ thể",
                updatedAt: new Date(),
            },
        });
        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thực đơn ngày"
            });
        }
        res.status(200).json({
            success: true,
            message: "Từ chối thực đơn ngày thành công",
        });
    }
    catch (error) {
        console.error("Error rejecting daily menu:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi từ chối thực đơn ngày"
        });
    }
};
exports.rejectDailyMenu = rejectDailyMenu;
