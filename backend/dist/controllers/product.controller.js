"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.getProductById = exports.createProduct = exports.getProducts = void 0;
const mongodb_1 = require("mongodb");
const database_1 = require("../config/database");
// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
    try {
        const db = await (0, database_1.getDb)();
        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Filter parameters
        const { category } = req.query;
        const filter = {};
        if (category) {
            filter.category = new mongodb_1.ObjectId(category);
        }
        // Get total count for pagination
        const totalCount = await db.collection("products").countDocuments(filter);
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
            .toArray();
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
        }));
        res.status(200).json({
            success: true,
            count: transformedProducts.length,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
            data: transformedProducts,
        });
    }
    catch (error) {
        console.error("Error fetching products:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi lấy danh sách sản phẩm"
        });
    }
};
exports.getProducts = getProducts;
// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin, Brigade Assistant)
const createProduct = async (req, res) => {
    try {
        const { name, categoryId, description, unit, nutritionalValue, storageCondition } = req.body;
        // Validate input
        if (!name || !categoryId) {
            return res.status(400).json({
                success: false,
                message: "Tên sản phẩm và phân loại không được để trống"
            });
        }
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(categoryId)) {
            return res.status(400).json({
                success: false,
                message: "ID phân loại không hợp lệ"
            });
        }
        const db = await (0, database_1.getDb)();
        // Check if category exists
        const categoryExists = await db.collection("categories").findOne({ _id: new mongodb_1.ObjectId(categoryId) });
        if (!categoryExists) {
            return res.status(400).json({
                success: false,
                message: "Phân loại không tồn tại"
            });
        }
        // Create new product
        const result = await db.collection("products").insertOne({
            name,
            category: new mongodb_1.ObjectId(categoryId),
            description: description || "",
            unit: unit || "kg",
            nutritionalValue: nutritionalValue || "",
            storageCondition: storageCondition || "",
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        res.status(201).json({
            success: true,
            message: "Thêm sản phẩm thành công",
            productId: result.insertedId.toString(),
        });
    }
    catch (error) {
        console.error("Error creating product:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi thêm sản phẩm"
        });
    }
};
exports.createProduct = createProduct;
// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res) => {
    try {
        const productId = req.params.id;
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "ID sản phẩm không hợp lệ"
            });
        }
        const db = await (0, database_1.getDb)();
        // Get product with category information
        const product = await db
            .collection("products")
            .aggregate([
            {
                $match: { _id: new mongodb_1.ObjectId(productId) },
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
            .toArray();
        if (!product || product.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm"
            });
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
        };
        res.status(200).json({
            success: true,
            data: transformedProduct,
        });
    }
    catch (error) {
        console.error("Error fetching product:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi lấy thông tin sản phẩm"
        });
    }
};
exports.getProductById = getProductById;
// @desc    Update product
// @route   PATCH /api/products/:id
// @access  Private (Admin, Brigade Assistant)
const updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const { name, categoryId, description, unit, nutritionalValue, storageCondition } = req.body;
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "ID sản phẩm không hợp lệ"
            });
        }
        // Validate input
        if (!name || !categoryId) {
            return res.status(400).json({
                success: false,
                message: "Tên sản phẩm và phân loại không được để trống"
            });
        }
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(categoryId)) {
            return res.status(400).json({
                success: false,
                message: "ID phân loại không hợp lệ"
            });
        }
        const db = await (0, database_1.getDb)();
        // Check if category exists
        const categoryExists = await db.collection("categories").findOne({ _id: new mongodb_1.ObjectId(categoryId) });
        if (!categoryExists) {
            return res.status(400).json({
                success: false,
                message: "Phân loại không tồn tại"
            });
        }
        const result = await db.collection("products").updateOne({ _id: new mongodb_1.ObjectId(productId) }, {
            $set: {
                name,
                category: new mongodb_1.ObjectId(categoryId),
                description: description || "",
                unit: unit || "kg",
                nutritionalValue: nutritionalValue || "",
                storageCondition: storageCondition || "",
                updatedAt: new Date(),
            },
        });
        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm"
            });
        }
        res.status(200).json({
            success: true,
            message: "Cập nhật sản phẩm thành công",
        });
    }
    catch (error) {
        console.error("Error updating product:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi cập nhật sản phẩm"
        });
    }
};
exports.updateProduct = updateProduct;
// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin, Brigade Assistant)
const deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "ID sản phẩm không hợp lệ"
            });
        }
        const db = await (0, database_1.getDb)();
        // Check if product is being used by any supply
        const supplyWithProduct = await db.collection("supplies").findOne({ product: new mongodb_1.ObjectId(productId) });
        if (supplyWithProduct) {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa sản phẩm đang được sử dụng trong nguồn nhập"
            });
        }
        const result = await db.collection("products").deleteOne({ _id: new mongodb_1.ObjectId(productId) });
        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy sản phẩm"
            });
        }
        res.status(200).json({
            success: true,
            message: "Xóa sản phẩm thành công",
        });
    }
    catch (error) {
        console.error("Error deleting product:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi xóa sản phẩm"
        });
    }
};
exports.deleteProduct = deleteProduct;
