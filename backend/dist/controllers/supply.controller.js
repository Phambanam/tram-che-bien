"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportSuppliesExcel = exports.receiveSupply = exports.getFoodProducts = exports.getFoodCategories = exports.deleteSupply = exports.rejectSupply = exports.approveSupply = exports.updateSupply = exports.getSupplyById = exports.createSupply = exports.getSupplies = void 0;
const mongodb_1 = require("mongodb");
const database_1 = require("../config/database");
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const database_2 = require("../config/database");
const date_fns_1 = require("date-fns");
// Predefined categories and products
const FOOD_CATEGORIES = {
    "luong-thuc": "Lương thực",
    "thit-gia-suc": "Thịt gia súc",
    "thit-gia-cam": "Thịt gia cầm",
    "hai-san": "Hải sản",
    trung: "Trứng",
    "cac-loai-hat": "Các loại hạt",
    "rau-cu-qua": "Rau củ quả",
    "sua-tuoi": "Sữa tươi",
    "trai-cay": "Trái cây",
    "gia-vi": "Gia vị",
    "ve-sinh-dccd": "Vệ sinh DCCD",
    "chat-dot": "Chất đốt",
};
const FOOD_PRODUCTS = {
    "luong-thuc": [
        { id: "gao", name: "Gạo", unit: "kg" },
        { id: "bun", name: "Bún", unit: "kg" },
        { id: "mien", name: "Miến", unit: "kg" },
        { id: "banh-mi", name: "Bánh mì", unit: "ổ" },
    ],
    "thit-gia-suc": [
        { id: "thit-lon", name: "Thịt lợn", unit: "kg" },
        { id: "thit-bo", name: "Thịt bò", unit: "kg" },
        { id: "thit-trau", name: "Thịt trâu", unit: "kg" },
    ],
    "thit-gia-cam": [
        { id: "thit-ga", name: "Thịt gà", unit: "kg" },
        { id: "thit-vit", name: "Thịt vịt", unit: "kg" },
        { id: "thit-ngan", name: "Thịt ngan", unit: "kg" },
    ],
    "hai-san": [
        { id: "ca", name: "Cá", unit: "kg" },
        { id: "tom", name: "Tôm", unit: "kg" },
        { id: "muc", name: "Mực", unit: "kg" },
    ],
    trung: [
        { id: "trung-ga", name: "Trứng gà", unit: "quả" },
        { id: "trung-vit", name: "Trứng vịt", unit: "quả" },
    ],
    "cac-loai-hat": [
        { id: "dau-nanh", name: "Đậu nành", unit: "kg" },
        { id: "dau-xanh", name: "Đậu xanh", unit: "kg" },
        { id: "lac", name: "Lạc", unit: "kg" },
    ],
    "rau-cu-qua": [
        { id: "rau-muong", name: "Rau muống", unit: "kg" },
        { id: "rau-cai", name: "Rau cải", unit: "kg" },
        { id: "ca-rot", name: "Cà rốt", unit: "kg" },
        { id: "khoai-tay", name: "Khoai tây", unit: "kg" },
    ],
    "sua-tuoi": [{ id: "sua-tuoi", name: "Sữa tươi", unit: "lít" }],
    "trai-cay": [
        { id: "chuoi", name: "Chuối", unit: "kg" },
        { id: "cam", name: "Cam", unit: "kg" },
        { id: "dua-hau", name: "Dưa hấu", unit: "kg" },
    ],
    "gia-vi": [
        { id: "muoi", name: "Muối", unit: "kg" },
        { id: "duong", name: "Đường", unit: "kg" },
        { id: "nuoc-mam", name: "Nước mắm", unit: "lít" },
        { id: "dau-an", name: "Dầu ăn", unit: "lít" },
    ],
    "ve-sinh-dccd": [{ id: "nuoc-rua-bat", name: "Nước rửa bát", unit: "chai" }],
    "chat-dot": [
        { id: "gas", name: "Gas", unit: "bình" },
        { id: "than", name: "Than", unit: "kg" },
    ],
};
// @desc    Get all supplies
// @route   GET /api/supplies
// @access  Private
const getSupplies = async (req, res) => {
    try {
        const { unit, category, status, fromDate, toDate, stationEntryFromDate, stationEntryToDate, createdFromDate, createdToDate } = req.query;
        // Make sure the database is connected
        await (0, database_2.connectToDatabase)();
        // Log user info for debugging
        console.log("DEBUG - getSupplies user info:", {
            role: req.user.role,
            unit: req.user.unit,
            userId: req.user.id
        });
        // Build query based on role and filters
        const query = {};
        // Don't filter by unit for admin, brigadeAssistant or stationManager roles
        if (req.user.role === "admin" || req.user.role === "brigadeAssistant" || req.user.role === "stationManager") {
            console.log("DEBUG - Not filtering by unit for admin/brigadeAssistant/stationManager role");
        }
        // Unit assistants can only see their own unit's supplies
        else if (req.user.role === "unitAssistant") {
            try {
                // Convert unit to ObjectId if it's a string
                if (typeof req.user.unit === "string") {
                    query.unit = new mongoose_1.default.Types.ObjectId(req.user.unit);
                }
                else {
                    // Use as is if already ObjectId
                    query.unit = req.user.unit;
                }
                console.log("DEBUG - Filtering by unit for unitAssistant:", query.unit);
            }
            catch (error) {
                console.error("Error converting unit to ObjectId:", error);
                query.unit = req.user.unit; // Fallback to using as-is
            }
        }
        // Filter by unit parameter if specified
        if (unit && unit !== "all" && mongoose_1.default.isValidObjectId(unit)) {
            try {
                query.unit = new mongoose_1.default.Types.ObjectId(unit);
                console.log("DEBUG - Filtering by unit from query param:", query.unit);
            }
            catch (error) {
                console.error("Error converting unit param to ObjectId:", error);
                query.unit = unit;
            }
        }
        // Filter by category if specified
        if (category) {
            query.category = category;
        }
        // Filter by status if specified
        if (status && status !== 'all') {
            query.status = status;
        }
        // Filter by harvest date range if specified
        if (fromDate || toDate) {
            query.expectedHarvestDate = {};
            if (fromDate) {
                query.expectedHarvestDate.$gte = new Date(fromDate);
            }
            if (toDate) {
                query.expectedHarvestDate.$lte = new Date(toDate);
            }
        }
        // Filter by station entry date range if specified
        if (stationEntryFromDate || stationEntryToDate) {
            query.stationEntryDate = {};
            if (stationEntryFromDate) {
                query.stationEntryDate.$gte = new Date(stationEntryFromDate);
            }
            if (stationEntryToDate) {
                query.stationEntryDate.$lte = new Date(stationEntryToDate);
            }
        }
        // Filter by created date range if specified
        if (createdFromDate || createdToDate) {
            query.createdAt = {};
            if (createdFromDate) {
                query.createdAt.$gte = new Date(createdFromDate);
            }
            if (createdToDate) {
                query.createdAt.$lte = new Date(createdToDate);
            }
        }
        console.log("DEBUG - Final query:", JSON.stringify(query, null, 2));
        // Use Mongoose model to find supplies
        const supplies = await models_1.Supply.find(query)
            .populate({
            path: 'unit',
            select: 'name'
        })
            .lean() // Convert to plain JavaScript objects
            .exec(); // Execute the query
        // Format response for the frontend
        const formattedSupplies = supplies.map(supply => {
            const { _id, unit, category, product, ...rest } = supply;
            return {
                id: _id.toString(),
                unit: {
                    _id: unit && typeof unit === 'object' ? (unit._id ? unit._id.toString() : '') : '',
                    name: unit && typeof unit === 'object' && 'name' in unit ? unit.name : ''
                },
                category: {
                    _id: category,
                    name: FOOD_CATEGORIES[category] || category
                },
                product: {
                    _id: product,
                    name: getProductName(product),
                    unit: getProductUnit(product)
                },
                ...rest
            };
        });
        console.log(`DEBUG - Found ${formattedSupplies.length} supplies`);
        if (formattedSupplies.length > 0) {
            console.log("DEBUG - First supply:", JSON.stringify(formattedSupplies[0], null, 2));
        }
        res.status(200).json(formattedSupplies);
    }
    catch (error) {
        console.error("Error fetching supplies:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi lấy danh sách nguồn nhập"
        });
    }
};
exports.getSupplies = getSupplies;
// Helper functions to get product details
function getProductName(productId) {
    const allProducts = Object.values(FOOD_PRODUCTS).flat();
    const product = allProducts.find(p => p.id === productId);
    return product ? product.name : productId;
}
function getProductUnit(productId) {
    const allProducts = Object.values(FOOD_PRODUCTS).flat();
    const product = allProducts.find(p => p.id === productId);
    return product ? product.unit : 'kg';
}
// @desc    Create new supply
// @route   POST /api/supplies
// @access  Private (Unit Assistant only)
const createSupply = async (req, res) => {
    try {
        const { category, product, supplyQuantity, expiryDate, note, } = req.body;
        // Check permission - now unit assistants create supplies
        if (req.user.role !== "unitAssistant") {
            return res.status(403).json({
                success: false,
                message: "Chỉ trợ lý tiểu đoàn mới có thể thêm nguồn nhập"
            });
        }
        // Validate required fields
        if (!category || !product || !supplyQuantity) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng điền đầy đủ thông tin bắt buộc"
            });
        }
        // Validate category and product are strings (not ObjectIds for predefined categories)
        if (!FOOD_CATEGORIES[category]) {
            return res.status(400).json({
                success: false,
                message: "Phân loại không hợp lệ"
            });
        }
        const categoryProducts = FOOD_PRODUCTS[category] || [];
        const productExists = categoryProducts.find((p) => p.id === product);
        if (!productExists) {
            return res.status(400).json({
                success: false,
                message: "Sản phẩm không hợp lệ"
            });
        }
        // Ensure database connection
        await (0, database_2.connectToDatabase)();
        // Unit assistants can only create for their own unit
        const unitId = new mongoose_1.default.Types.ObjectId(req.user.unit);
        console.log("DEBUG - createSupply user info:", {
            role: req.user.role,
            unit: req.user.unit,
            unitId: unitId.toString(),
            userId: req.user.id
        });
        // Get the user's full name for the createdBy field
        const user = await models_1.User.findById(req.user.id).select('fullName').lean();
        // Create new supply using Mongoose model
        const supplyData = {
            unit: unitId,
            category,
            product,
            supplyQuantity: Number(supplyQuantity),
            stationEntryDate: null, // Will be filled by brigade assistant during approval
            requestedQuantity: null, // Will be filled by brigade assistant
            actualQuantity: null,
            unitPrice: null,
            totalPrice: null,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            status: "pending", // Always starts as pending (CHỜ DUYỆT)
            note: note || "",
            createdBy: {
                id: new mongoose_1.default.Types.ObjectId(req.user.id),
                name: user?.fullName || 'Unknown'
            },
            approvedBy: null
        };
        console.log("DEBUG - Creating supply with data:", JSON.stringify({
            ...supplyData,
            unit: supplyData.unit.toString(),
            createdBy: {
                id: supplyData.createdBy.id.toString(),
                name: supplyData.createdBy.name
            }
        }, null, 2));
        // Create new supply with pending status
        const newSupply = new models_1.Supply(supplyData);
        const savedSupply = await newSupply.save();
        res.status(201).json({
            success: true,
            message: "Thêm nguồn nhập thành công. Trạng thái: Chờ duyệt",
            data: { supplyId: savedSupply._id.toString() },
        });
    }
    catch (error) {
        console.error("Error creating supply:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi thêm nguồn nhập"
        });
    }
};
exports.createSupply = createSupply;
// @desc    Get supply by ID
// @route   GET /api/supplies/:id
// @access  Private
const getSupplyById = async (req, res) => {
    try {
        const supplyId = req.params.id;
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(supplyId)) {
            return res.status(400).json({
                success: false,
                message: "ID nguồn nhập không hợp lệ"
            });
        }
        const db = await (0, database_1.getDb)();
        // Get supply with related information
        const supply = await db
            .collection("supplies")
            .aggregate([
            {
                $match: { _id: new mongodb_1.ObjectId(supplyId) },
            },
            {
                $lookup: {
                    from: "units",
                    localField: "unit",
                    foreignField: "_id",
                    as: "unitInfo",
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "createdByInfo",
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "approvedBy",
                    foreignField: "_id",
                    as: "approvedByInfo",
                },
            },
            {
                $unwind: "$unitInfo",
            },
            {
                $unwind: {
                    path: "$createdByInfo",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $unwind: {
                    path: "$approvedByInfo",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    id: { $toString: "$_id" },
                    unit: {
                        _id: { $toString: "$unit" },
                        name: "$unitInfo.name",
                    },
                    category: {
                        _id: "$category",
                        name: {
                            $switch: {
                                branches: Object.entries(FOOD_CATEGORIES).map(([key, value]) => ({
                                    case: { $eq: ["$category", key] },
                                    then: value,
                                })),
                                default: "$category",
                            },
                        },
                    },
                    product: {
                        _id: "$product",
                        name: {
                            $switch: {
                                branches: Object.values(FOOD_PRODUCTS)
                                    .flat()
                                    .map((product) => ({
                                    case: { $eq: ["$product", product.id] },
                                    then: product.name,
                                })),
                                default: "$product",
                            },
                        },
                        unit: {
                            $switch: {
                                branches: Object.values(FOOD_PRODUCTS)
                                    .flat()
                                    .map((product) => ({
                                    case: { $eq: ["$product", product.id] },
                                    then: product.unit,
                                })),
                                default: "kg",
                            },
                        },
                    },
                    supplyQuantity: 1,
                    expectedHarvestDate: 1,
                    stationEntryDate: 1,
                    requestedQuantity: 1,
                    actualQuantity: 1,
                    unitPrice: 1,
                    totalPrice: 1,
                    expiryDate: 1,
                    status: 1,
                    note: 1,
                    createdBy: {
                        $cond: [
                            { $ifNull: ["$createdByInfo", false] },
                            {
                                id: { $toString: "$createdBy" },
                                name: "$createdByInfo.fullName",
                            },
                            null,
                        ],
                    },
                    approvedBy: {
                        $cond: [
                            { $ifNull: ["$approvedByInfo", false] },
                            {
                                id: { $toString: "$approvedBy" },
                                name: "$approvedByInfo.fullName",
                            },
                            null,
                        ],
                    },
                    createdAt: 1,
                    updatedAt: 1,
                },
            },
        ])
            .toArray();
        if (!supply || supply.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nguồn nhập"
            });
        }
        // Check permission
        if (req.user.role === "battalionAssistant" && supply[0].unit._id !== req.user.unit) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền xem nguồn nhập này"
            });
        }
        res.status(200).json(supply[0]);
    }
    catch (error) {
        console.error("Error fetching supply:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi lấy thông tin nguồn nhập"
        });
    }
};
exports.getSupplyById = getSupplyById;
// @desc    Update supply
// @route   PATCH /api/supplies/:id
// @access  Private (Battalion Assistant only)
const updateSupply = async (req, res) => {
    try {
        const supplyId = req.params.id;
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(supplyId)) {
            return res.status(400).json({
                success: false,
                message: "ID nguồn nhập không hợp lệ"
            });
        }
        const db = await (0, database_1.getDb)();
        // Check if supply exists
        const existingSupply = await db.collection("supplies").findOne({ _id: new mongodb_1.ObjectId(supplyId) });
        if (!existingSupply) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nguồn nhập"
            });
        }
        // Check permission
        if (req.user.role !== "battalionAssistant") {
            return res.status(403).json({
                success: false,
                message: "Chỉ trợ lý tiểu đoàn mới có thể chỉnh sửa nguồn nhập"
            });
        }
        if (existingSupply.battalion.toString() !== req.user.battalion.toString()) {
            return res.status(403).json({
                success: false,
                message: "Bạn chỉ có thể chỉnh sửa nguồn nhập của tiểu đoàn mình"
            });
        }
        // Only allow editing pending supplies
        if (existingSupply.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Chỉ có thể chỉnh sửa nguồn nhập ở trạng thái chờ phê duyệt"
            });
        }
        const { category, product, supplyQuantity, expectedHarvestDate, actualQuantity, unitPrice, expiryDate, note } = req.body;
        // Validate input
        if (!category || !product || !supplyQuantity || !expectedHarvestDate) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng điền đầy đủ thông tin bắt buộc"
            });
        }
        // Calculate total price if both actualQuantity and unitPrice are provided
        const totalPrice = (actualQuantity && unitPrice) ? Number(actualQuantity) * Number(unitPrice) : null;
        // Update supply
        const result = await db.collection("supplies").updateOne({ _id: new mongodb_1.ObjectId(supplyId) }, {
            $set: {
                category,
                product,
                supplyQuantity: Number(supplyQuantity),
                expectedHarvestDate: new Date(expectedHarvestDate),
                actualQuantity: actualQuantity ? Number(actualQuantity) : null,
                unitPrice: unitPrice ? Number(unitPrice) : null,
                totalPrice: totalPrice,
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                note: note || "",
                updatedAt: new Date(),
            },
        });
        if (result.matchedCount === 0) {
            return res.status(400).json({
                success: false,
                message: "Không có thay đổi nào được thực hiện"
            });
        }
        res.status(200).json({
            success: true,
            message: "Cập nhật nguồn nhập thành công",
        });
    }
    catch (error) {
        console.error("Error updating supply:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi cập nhật nguồn nhập"
        });
    }
};
exports.updateSupply = updateSupply;
// @desc    Approve supply
// @route   PATCH /api/supplies/:id/approve
// @access  Private (Brigade Assistant only)
const approveSupply = async (req, res) => {
    try {
        const supplyId = req.params.id;
        const { stationEntryDate, requestedQuantity, unitPrice, expiryDate, note } = req.body;
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(supplyId)) {
            return res.status(400).json({
                success: false,
                message: "ID nguồn nhập không hợp lệ"
            });
        }
        // Check permission
        if (req.user.role !== "brigadeAssistant" && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Chỉ trợ lý lữ đoàn mới có thể phê duyệt nguồn nhập"
            });
        }
        // Validate required fields for approval - không yêu cầu actualQuantity
        if (!stationEntryDate || !requestedQuantity || !unitPrice) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ: Số lượng phải nhập, Đơn giá, Ngày nhập trạm"
            });
        }
        // Ensure database connection
        await (0, database_2.connectToDatabase)();
        // Find supply
        const supply = await models_1.Supply.findById(supplyId);
        if (!supply) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nguồn nhập"
            });
        }
        // Check if supply is pending
        if (supply.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Chỉ có thể phê duyệt nguồn nhập ở trạng thái chờ duyệt"
            });
        }
        // Calculate total price dựa trên requestedQuantity
        const totalPrice = Number(requestedQuantity) * Number(unitPrice);
        // Get the user's full name for the approvedBy field
        const user = await models_1.User.findById(req.user.id).select('fullName').lean();
        // Update supply with approval data
        supply.status = "approved";
        supply.stationEntryDate = new Date(stationEntryDate);
        supply.requestedQuantity = Number(requestedQuantity);
        supply.unitPrice = Number(unitPrice);
        supply.totalPrice = totalPrice;
        // actualQuantity sẽ được nhập bởi trạm trưởng khi nhận hàng
        supply.actualQuantity = null;
        if (expiryDate) {
            supply.expiryDate = new Date(expiryDate);
        }
        if (note) {
            supply.note = note;
        }
        supply.approvedBy = {
            id: new mongoose_1.default.Types.ObjectId(req.user.id),
            name: user?.fullName || 'Unknown'
        };
        await supply.save();
        res.status(200).json({
            success: true,
            message: "Đã phê duyệt nguồn nhập thành công! Trạng thái: Đã duyệt",
            data: { supplyId: supply._id.toString() }
        });
    }
    catch (error) {
        console.error("Error approving supply:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi phê duyệt nguồn nhập"
        });
    }
};
exports.approveSupply = approveSupply;
// @desc    Reject supply
// @route   PATCH /api/supplies/:id/reject
// @access  Private (Brigade Assistant only)
const rejectSupply = async (req, res) => {
    try {
        const supplyId = req.params.id;
        const { note } = req.body;
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(supplyId)) {
            return res.status(400).json({
                success: false,
                message: "ID nguồn nhập không hợp lệ"
            });
        }
        // Check permission
        if (req.user.role !== "brigadeAssistant" && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Chỉ trợ lý lữ đoàn mới có thể từ chối nguồn nhập"
            });
        }
        const db = await (0, database_1.getDb)();
        // Check if supply exists
        const existingSupply = await db.collection("supplies").findOne({ _id: new mongodb_1.ObjectId(supplyId) });
        if (!existingSupply) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nguồn nhập"
            });
        }
        if (existingSupply.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Chỉ có thể từ chối nguồn nhập ở trạng thái chờ phê duyệt"
            });
        }
        // Update supply status to rejected
        const result = await db.collection("supplies").updateOne({ _id: new mongodb_1.ObjectId(supplyId) }, {
            $set: {
                status: "rejected",
                note: note || "Từ chối bởi trợ lý lữ đoàn",
                updatedAt: new Date(),
            },
        });
        if (result.modifiedCount === 0) {
            return res.status(400).json({
                success: false,
                message: "Không có thay đổi nào được thực hiện"
            });
        }
        res.status(200).json({
            success: true,
            message: "Đã từ chối nguồn nhập",
        });
    }
    catch (error) {
        console.error("Error rejecting supply:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi từ chối nguồn nhập"
        });
    }
};
exports.rejectSupply = rejectSupply;
// @desc    Delete supply
// @route   DELETE /api/supplies/:id
// @access  Private (Battalion Assistant only)
const deleteSupply = async (req, res) => {
    try {
        const supplyId = req.params.id;
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(supplyId)) {
            return res.status(400).json({
                success: false,
                message: "ID nguồn nhập không hợp lệ"
            });
        }
        const db = await (0, database_1.getDb)();
        // Check if supply exists
        const existingSupply = await db.collection("supplies").findOne({ _id: new mongodb_1.ObjectId(supplyId) });
        if (!existingSupply) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nguồn nhập"
            });
        }
        // Check permission
        if (req.user.role !== "battalionAssistant") {
            return res.status(403).json({
                success: false,
                message: "Chỉ trợ lý tiểu đoàn mới có thể xóa nguồn nhập"
            });
        }
        if (existingSupply.battalion.toString() !== req.user.battalion.toString()) {
            return res.status(403).json({
                success: false,
                message: "Bạn chỉ có thể xóa nguồn nhập của tiểu đoàn mình"
            });
        }
        // Only allow deleting pending supplies
        if (existingSupply.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Chỉ có thể xóa nguồn nhập ở trạng thái chờ phê duyệt"
            });
        }
        // Soft delete by changing status
        const result = await db.collection("supplies").updateOne({ _id: new mongodb_1.ObjectId(supplyId) }, {
            $set: {
                status: "deleted",
                updatedAt: new Date(),
            },
        });
        if (result.modifiedCount === 0) {
            return res.status(400).json({
                success: false,
                message: "Không có thay đổi nào được thực hiện"
            });
        }
        res.status(200).json({
            success: true,
            message: "Xóa nguồn nhập thành công",
        });
    }
    catch (error) {
        console.error("Error deleting supply:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi xóa nguồn nhập"
        });
    }
};
exports.deleteSupply = deleteSupply;
// @desc    Get food categories
// @route   GET /api/supplies/categories
// @access  Private
const getFoodCategories = async (req, res) => {
    try {
        const categories = Object.entries(FOOD_CATEGORIES).map(([id, name]) => ({
            _id: id,
            name,
        }));
        res.status(200).json({
            success: true,
            data: categories,
        });
    }
    catch (error) {
        console.error("Error fetching food categories:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi lấy danh sách phân loại"
        });
    }
};
exports.getFoodCategories = getFoodCategories;
// @desc    Get food products by category
// @route   GET /api/supplies/products/:categoryId
// @access  Private
const getFoodProducts = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        if (!FOOD_CATEGORIES[categoryId]) {
            return res.status(404).json({
                success: false,
                message: "Phân loại không tồn tại"
            });
        }
        const products = FOOD_PRODUCTS[categoryId] || [];
        const formattedProducts = products.map((product) => ({
            _id: product.id,
            name: product.name,
            unit: product.unit,
            category: categoryId,
        }));
        res.status(200).json({
            success: true,
            data: formattedProducts,
        });
    }
    catch (error) {
        console.error("Error fetching food products:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi lấy danh sách sản phẩm"
        });
    }
};
exports.getFoodProducts = getFoodProducts;
// @desc    Receive supply (Station Manager)
// @route   PATCH /api/supplies/:id/receive
// @access  Private (Station Manager only)
const receiveSupply = async (req, res) => {
    try {
        const supplyId = req.params.id;
        const { actualQuantity, receivedQuantity } = req.body;
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(supplyId)) {
            return res.status(400).json({
                success: false,
                message: "ID nguồn nhập không hợp lệ"
            });
        }
        // Check permission
        if (req.user.role !== "stationManager" && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Chỉ trạm trưởng mới có thể nhận nguồn nhập"
            });
        }
        // Validate quantities
        if (!actualQuantity || Number(actualQuantity) <= 0 || !receivedQuantity || Number(receivedQuantity) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập số lượng thực nhập và số lượng thực nhận hợp lệ"
            });
        }
        // Ensure database connection
        await (0, database_2.connectToDatabase)();
        // Find supply
        const supply = await models_1.Supply.findById(supplyId);
        if (!supply) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nguồn nhập"
            });
        }
        // Check if supply is approved and has station entry date for today
        if (supply.status !== "approved") {
            return res.status(400).json({
                success: false,
                message: "Chỉ có thể nhận nguồn nhập đã được duyệt"
            });
        }
        // Check if station entry date is today
        /* Tạm thời comment out để test
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const stationDate = new Date(supply.stationEntryDate!)
        stationDate.setHours(0, 0, 0, 0)
        
        if (stationDate.getTime() !== today.getTime()) {
          return res.status(400).json({
            success: false,
            message: "Chỉ có thể nhận nguồn nhập có ngày nhập trạm là hôm nay"
          })
        }
        */
        // Update supply with received quantities
        supply.actualQuantity = Number(actualQuantity);
        supply.receivedQuantity = Number(receivedQuantity);
        supply.status = "received";
        // Recalculate total price based on actual quantity
        if (supply.unitPrice) {
            supply.totalPrice = Number(actualQuantity) * supply.unitPrice;
        }
        await supply.save();
        res.status(200).json({
            success: true,
            message: "Đã nhận nguồn nhập thành công! Trạng thái: Đã nhận",
            data: { supplyId: supply._id.toString() }
        });
    }
    catch (error) {
        console.error("Error receiving supply:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi nhận nguồn nhập"
        });
    }
};
exports.receiveSupply = receiveSupply;
// @desc    Export supplies to Excel
// @route   GET /api/supplies/export
// @access  Private
const exportSuppliesExcel = async (req, res) => {
    try {
        const { unit, stationEntryDate, status } = req.query;
        // Build query - chỉ xuất các phiếu đã nhận
        const query = {
            status: "received" // Chỉ xuất phiếu đã nhận
        };
        // Filter by specific date if provided
        if (stationEntryDate) {
            const startOfDay = new Date(stationEntryDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(stationEntryDate);
            endOfDay.setHours(23, 59, 59, 999);
            query.stationEntryDate = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        }
        // Filter by unit if specified
        if (unit && unit !== "all" && mongoose_1.default.isValidObjectId(unit)) {
            query.unit = new mongoose_1.default.Types.ObjectId(unit);
        }
        // Get supplies with populated unit data
        const supplies = await models_1.Supply.find(query)
            .populate({
            path: 'unit',
            select: 'name'
        })
            .lean()
            .exec();
        // Check if there are any supplies to export
        if (!supplies || supplies.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không có nguồn nhập nào để xuất Excel"
            });
        }
        console.log("Found supplies for export:", supplies.length);
        // Group supplies by unit and date
        const groupedSupplies = {};
        supplies.forEach((supply) => {
            const dateKey = supply.stationEntryDate ? (0, date_fns_1.format)(new Date(supply.stationEntryDate), 'dd/MM/yyyy') : 'Không xác định';
            const unitKey = supply.unit?.name || 'Không xác định';
            const key = `${unitKey}_${dateKey}`;
            if (!groupedSupplies[key]) {
                groupedSupplies[key] = {
                    unit: unitKey,
                    date: dateKey,
                    supplies: []
                };
            }
            groupedSupplies[key].supplies.push(supply);
        });
        console.log("Grouped supplies:", Object.keys(groupedSupplies));
        // Create Excel workbook
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        // Create a worksheet for each unit/date combination
        Object.values(groupedSupplies).forEach((group) => {
            console.log("Processing group:", { unit: group.unit, date: group.date, suppliesCount: group.supplies?.length || 0 });
            // Clean worksheet name by removing invalid characters: * ? : \ / [ ]
            const cleanWorksheetName = `${group.unit} - ${group.date}`.replace(/[*?:\\/\[\]]/g, '-');
            const worksheet = workbook.addWorksheet(cleanWorksheetName);
            // Set column widths theo layout trong hình
            worksheet.columns = [
                { width: 5 }, // TT
                { width: 25 }, // TÊN, QUI CÁCH, KÝ MÃ HIỆU VẬT TƯ
                { width: 8 }, // Đơn vị tính
                { width: 12 }, // Phải nhập
                { width: 12 }, // Thực nhập
                { width: 12 }, // Đơn giá
                { width: 15 }, // Thành tiền
                { width: 15 } // GHI CHÚ
            ];
            // Header layout theo hình
            // Row 1: Đơn vị và PHIẾU NHẬP KHO và Mẫu 26
            worksheet.mergeCells('A1:B1');
            worksheet.getCell('A1').value = `Đơn vị ........................`;
            worksheet.getCell('A1').font = { size: 10 };
            worksheet.mergeCells('C1:F1');
            worksheet.getCell('C1').value = 'PHIẾU NHẬP KHO';
            worksheet.getCell('C1').alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.getCell('C1').font = { bold: true, size: 14 };
            worksheet.mergeCells('G1:H1');
            worksheet.getCell('G1').value = 'Mẫu 26: PNX-TMKH/QN21';
            worksheet.getCell('G1').alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.getCell('G1').font = { size: 10 };
            // Row 2: Số
            worksheet.mergeCells('G2:H2');
            worksheet.getCell('G2').value = 'Số .....';
            worksheet.getCell('G2').alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.getCell('G2').font = { size: 10 };
            // Row 3: Kho nhận hàng
            worksheet.mergeCells('A3:B3');
            worksheet.getCell('A3').value = 'Kho nhận hàng ................';
            worksheet.getCell('A3').font = { size: 10 };
            // Row 4: Có giá trị hết ngày
            worksheet.mergeCells('C4:F4');
            worksheet.getCell('C4').value = `Có giá trị hết ngày ........../......../20....`;
            worksheet.getCell('C4').alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.getCell('C4').font = { size: 10 };
            // Row 5: Nhập của và theo
            worksheet.mergeCells('A5:H5');
            worksheet.getCell('A5').value = `Nhập của ....................................................theo ......................................`;
            worksheet.getCell('A5').font = { size: 10 };
            // Row 6: Hàng do và vận chuyển
            worksheet.mergeCells('A6:H6');
            worksheet.getCell('A6').value = `Hàng do .........................................................................vận chuyển`;
            worksheet.getCell('A6').font = { size: 10 };
            // Table headers - Row 7-8
            // Row 7 - Main headers
            worksheet.getCell('A7').value = 'TT';
            worksheet.getCell('B7').value = 'TÊN, QUI CÁCH,\nKÝ MÃ HIỆU VẬT TƯ';
            worksheet.getCell('C7').value = 'Đơn\nvị\ntính';
            worksheet.mergeCells('D7:E7');
            worksheet.getCell('D7').value = 'SỐ LƯỢNG';
            worksheet.getCell('F7').value = 'Đơn giá';
            worksheet.getCell('G7').value = 'Thành tiền';
            worksheet.getCell('H7').value = 'GHI CHÚ';
            // Row 8 - Sub headers
            worksheet.getCell('A8').value = '';
            worksheet.getCell('B8').value = '';
            worksheet.getCell('C8').value = '';
            worksheet.getCell('D8').value = 'Phải nhập';
            worksheet.getCell('E8').value = 'Thực nhập';
            worksheet.getCell('F8').value = '';
            worksheet.getCell('G8').value = '';
            worksheet.getCell('H8').value = '';
            // Style headers
            const headerCells = ['A7', 'A8', 'B7', 'B8', 'C7', 'C8', 'D7', 'D8', 'E8', 'F7', 'F8', 'G7', 'G8', 'H7', 'H8'];
            headerCells.forEach(cell => {
                const cellObj = worksheet.getCell(cell);
                cellObj.font = { bold: true, size: 9 };
                cellObj.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cellObj.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
            // Merge cells for TT column
            worksheet.mergeCells('A7:A8');
            worksheet.mergeCells('B7:B8');
            worksheet.mergeCells('C7:C8');
            worksheet.mergeCells('F7:F8');
            worksheet.mergeCells('G7:G8');
            worksheet.mergeCells('H7:H8');
            // Add data rows
            let rowIndex = 9;
            let totalAmount = 0;
            if (group.supplies && group.supplies.length > 0) {
                group.supplies.forEach((supply, index) => {
                    const row = worksheet.getRow(rowIndex);
                    // Set cell values individually
                    row.getCell(1).value = index + 1;
                    row.getCell(2).value = `${getProductName(supply.product)} - ${FOOD_CATEGORIES[supply.category] || supply.category}`;
                    row.getCell(3).value = getProductUnit(supply.product);
                    row.getCell(4).value = supply.requestedQuantity || 0;
                    row.getCell(5).value = supply.receivedQuantity || 0;
                    row.getCell(6).value = supply.unitPrice || 0;
                    row.getCell(7).value = supply.totalPrice || 0;
                    row.getCell(8).value = supply.note || '';
                    // Add borders to data cells
                    for (let col = 1; col <= 8; col++) {
                        const cell = row.getCell(col);
                        cell.border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        };
                        cell.font = { size: 9 };
                        // Right align numbers
                        if (col >= 4 && col <= 7) {
                            cell.alignment = { horizontal: 'right', vertical: 'middle' };
                            if (col === 6 || col === 7) {
                                cell.numFmt = '#,##0';
                            }
                        }
                    }
                    totalAmount += supply.totalPrice || 0;
                    rowIndex++;
                });
            }
            // Add empty rows to match template (total 20+ rows)
            const totalRows = Math.max(20, rowIndex - 9 + 5);
            for (let i = rowIndex; i <= 9 + totalRows; i++) {
                for (let col = 1; col <= 8; col++) {
                    const cell = worksheet.getCell(i, col);
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                }
            }
            // Total section at bottom
            const totalRowIndex = 9 + totalRows + 2;
            worksheet.mergeCells(`A${totalRowIndex}:C${totalRowIndex}`);
            worksheet.getCell(`A${totalRowIndex}`).value = 'Tổng nhập ......mặt hàng';
            worksheet.getCell(`A${totalRowIndex}`).font = { size: 10 };
            worksheet.mergeCells(`A${totalRowIndex + 1}:H${totalRowIndex + 1}`);
            worksheet.getCell(`A${totalRowIndex + 1}`).value = `Thành tiền ........................................................................`;
            worksheet.getCell(`A${totalRowIndex + 1}`).font = { size: 10 };
            // Date section
            worksheet.mergeCells(`A${totalRowIndex + 2}:D${totalRowIndex + 2}`);
            worksheet.getCell(`A${totalRowIndex + 2}`).value = `Ngày giao nhận ....../....../20....`;
            worksheet.getCell(`A${totalRowIndex + 2}`).font = { size: 10 };
            worksheet.mergeCells(`E${totalRowIndex + 2}:H${totalRowIndex + 2}`);
            worksheet.getCell(`E${totalRowIndex + 2}`).value = `Ngày...... tháng...... năm 20....`;
            worksheet.getCell(`E${totalRowIndex + 2}`).alignment = { horizontal: 'right' };
            worksheet.getCell(`E${totalRowIndex + 2}`).font = { size: 10 };
            // Signature section
            const signatureRow = totalRowIndex + 3;
            worksheet.getCell(`A${signatureRow}`).value = 'Người viết phiếu';
            worksheet.getCell(`A${signatureRow}`).font = { size: 10 };
            worksheet.getCell(`A${signatureRow}`).alignment = { horizontal: 'center' };
            worksheet.getCell(`C${signatureRow}`).value = 'Người giao';
            worksheet.getCell(`C${signatureRow}`).font = { size: 10 };
            worksheet.getCell(`C${signatureRow}`).alignment = { horizontal: 'center' };
            worksheet.getCell(`E${signatureRow}`).value = 'Người nhận';
            worksheet.getCell(`E${signatureRow}`).font = { size: 10 };
            worksheet.getCell(`E${signatureRow}`).alignment = { horizontal: 'center' };
            worksheet.getCell(`G${signatureRow}`).value = 'Người duyệt';
            worksheet.getCell(`G${signatureRow}`).font = { size: 10 };
            worksheet.getCell(`G${signatureRow}`).alignment = { horizontal: 'center' };
        });
        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=phieu-nhap-kho-${(0, date_fns_1.format)(new Date(), 'dd-MM-yyyy')}.xlsx`);
        // Write to response
        await workbook.xlsx.write(res);
        res.end();
    }
    catch (error) {
        console.error("Error exporting supplies:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi xuất Excel"
        });
    }
};
exports.exportSuppliesExcel = exportSuppliesExcel;
