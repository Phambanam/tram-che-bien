"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.getCategoryById = exports.createCategory = exports.getCategories = void 0;
const mongodb_1 = require("mongodb");
const database_1 = require("../config/database");
// Helper function to generate slug from name
const generateSlug = (name) => {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
        .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-") // Replace multiple hyphens with single
        .trim();
};
// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
    try {
        const db = await (0, database_1.getDb)();
        const categories = await db.collection("categories").find().toArray();
        // Calculate item count for each category
        const transformedCategories = await Promise.all(categories.map(async (category) => {
            const itemCount = await db.collection("products").countDocuments({
                category: category._id
            });
            return {
                _id: category._id.toString(),
                name: category.name,
                slug: category.slug,
                description: category.description,
                itemCount,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt,
            };
        }));
        res.status(200).json({
            success: true,
            count: transformedCategories.length,
            data: transformedCategories,
        });
    }
    catch (error) {
        console.error("Error fetching categories:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi lấy danh sách phân loại"
        });
    }
};
exports.getCategories = getCategories;
// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Admin, Brigade Assistant)
const createCategory = async (req, res) => {
    try {
        const { name, slug, description } = req.body;
        // Validate input
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Tên phân loại không được để trống"
            });
        }
        const db = await (0, database_1.getDb)();
        // Generate slug if not provided
        const finalSlug = slug || generateSlug(name);
        // Check if category already exists by name or slug
        const existingCategory = await db.collection("categories").findOne({
            $or: [
                { name },
                { slug: finalSlug }
            ]
        });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: "Phân loại đã tồn tại"
            });
        }
        // Create new category
        const result = await db.collection("categories").insertOne({
            name,
            slug: finalSlug,
            description: description || "",
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        res.status(201).json({
            success: true,
            message: "Thêm phân loại thành công",
            categoryId: result.insertedId.toString(),
        });
    }
    catch (error) {
        console.error("Error creating category:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi thêm phân loại"
        });
    }
};
exports.createCategory = createCategory;
// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Private
const getCategoryById = async (req, res) => {
    try {
        const categoryId = req.params.id;
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(categoryId)) {
            return res.status(400).json({
                success: false,
                message: "ID phân loại không hợp lệ"
            });
        }
        const db = await (0, database_1.getDb)();
        const category = await db.collection("categories").findOne({ _id: new mongodb_1.ObjectId(categoryId) });
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phân loại"
            });
        }
        // Calculate item count
        const itemCount = await db.collection("products").countDocuments({
            category: category._id
        });
        // Transform data for response
        const transformedCategory = {
            _id: category._id.toString(),
            name: category.name,
            slug: category.slug,
            description: category.description,
            itemCount,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
        };
        res.status(200).json({
            success: true,
            data: transformedCategory,
        });
    }
    catch (error) {
        console.error("Error fetching category:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi lấy thông tin phân loại"
        });
    }
};
exports.getCategoryById = getCategoryById;
// @desc    Update category
// @route   PATCH /api/categories/:id
// @access  Private (Admin, Brigade Assistant)
const updateCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const { name, slug, description } = req.body;
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(categoryId)) {
            return res.status(400).json({
                success: false,
                message: "ID phân loại không hợp lệ"
            });
        }
        // Validate input
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Tên phân loại không được để trống"
            });
        }
        const db = await (0, database_1.getDb)();
        // Generate slug if not provided
        const finalSlug = slug || generateSlug(name);
        // Check if category already exists by name or slug (excluding current category)
        const existingCategory = await db.collection("categories").findOne({
            $and: [
                { _id: { $ne: new mongodb_1.ObjectId(categoryId) } },
                {
                    $or: [
                        { name },
                        { slug: finalSlug }
                    ]
                }
            ]
        });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: "Phân loại với tên hoặc slug này đã tồn tại"
            });
        }
        const result = await db.collection("categories").updateOne({ _id: new mongodb_1.ObjectId(categoryId) }, {
            $set: {
                name,
                slug: finalSlug,
                description: description || "",
                updatedAt: new Date(),
            },
        });
        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phân loại"
            });
        }
        res.status(200).json({
            success: true,
            message: "Cập nhật phân loại thành công",
        });
    }
    catch (error) {
        console.error("Error updating category:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi cập nhật phân loại"
        });
    }
};
exports.updateCategory = updateCategory;
// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
const deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(categoryId)) {
            return res.status(400).json({
                success: false,
                message: "ID phân loại không hợp lệ"
            });
        }
        const db = await (0, database_1.getDb)();
        // Check if category is being used
        const productCount = await db.collection("products").countDocuments({ category: new mongodb_1.ObjectId(categoryId) });
        if (productCount > 0) {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa phân loại đang được sử dụng bởi sản phẩm"
            });
        }
        const supplyCount = await db.collection("supplies").countDocuments({ categoryId });
        if (supplyCount > 0) {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa phân loại đang được sử dụng trong nguồn nhập"
            });
        }
        const result = await db.collection("categories").deleteOne({ _id: new mongodb_1.ObjectId(categoryId) });
        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phân loại"
            });
        }
        res.status(200).json({
            success: true,
            message: "Xóa phân loại thành công",
        });
    }
    catch (error) {
        console.error("Error deleting category:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi xóa phân loại"
        });
    }
};
exports.deleteCategory = deleteCategory;
