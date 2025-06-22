"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSupplyOutput = exports.updateSupplyOutput = exports.createSupplyOutput = exports.getSupplyOutputById = exports.getAllSupplyOutputs = void 0;
const mongodb_1 = require("mongodb");
const database_1 = require("../config/database");
// @desc    Get all supply outputs
// @route   GET /api/supply-outputs
// @access  Private
const getAllSupplyOutputs = async (req, res) => {
    try {
        const { receivingUnit, productId, startDate, endDate } = req.query;
        const db = await (0, database_1.getDb)();
        let query = {};
        if (receivingUnit && mongodb_1.ObjectId.isValid(receivingUnit)) {
            query = { ...query, receivingUnit: new mongodb_1.ObjectId(receivingUnit) };
        }
        if (productId && mongodb_1.ObjectId.isValid(productId)) {
            query = { ...query, productId: new mongodb_1.ObjectId(productId) };
        }
        if (startDate || endDate) {
            query = { ...query, outputDate: {} };
            if (startDate) {
                query.outputDate = { ...query.outputDate, $gte: new Date(startDate) };
            }
            if (endDate) {
                query.outputDate = { ...query.outputDate, $lte: new Date(endDate) };
            }
        }
        // Get supply outputs with related information
        const supplyOutputs = await db
            .collection("supplyOutputs")
            .aggregate([
            {
                $match: query,
            },
            {
                $lookup: {
                    from: "units",
                    localField: "receivingUnit",
                    foreignField: "_id",
                    as: "unitInfo",
                },
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
                $lookup: {
                    from: "users",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "createdByInfo",
                },
            },
            {
                $unwind: "$unitInfo",
            },
            {
                $unwind: "$productInfo",
            },
            {
                $unwind: {
                    path: "$createdByInfo",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "productCategories",
                    localField: "productInfo.category",
                    foreignField: "_id",
                    as: "categoryInfo",
                },
            },
            {
                $unwind: "$categoryInfo",
            },
            {
                $project: {
                    id: { $toString: "$_id" },
                    receivingUnit: {
                        id: { $toString: "$receivingUnit" },
                        name: "$unitInfo.name",
                    },
                    product: {
                        id: { $toString: "$productId" },
                        name: "$productInfo.name",
                        category: {
                            id: { $toString: "$categoryInfo._id" },
                            name: "$categoryInfo.name",
                        },
                    },
                    quantity: 1,
                    outputDate: 1,
                    receiver: 1,
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
                    createdAt: 1,
                    updatedAt: 1,
                },
            },
            {
                $sort: { outputDate: -1 },
            },
        ])
            .toArray();
        res.status(200).json({
            success: true,
            count: supplyOutputs.length,
            data: supplyOutputs,
        });
    }
    catch (error) {
        console.error("Error fetching supply outputs:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi lấy danh sách nguồn xuất"
        });
    }
};
exports.getAllSupplyOutputs = getAllSupplyOutputs;
// @desc    Get supply output by ID
// @route   GET /api/supply-outputs/:id
// @access  Private
const getSupplyOutputById = async (req, res) => {
    try {
        const outputId = req.params.id;
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(outputId)) {
            return res.status(400).json({
                success: false,
                message: "ID nguồn xuất không hợp lệ"
            });
        }
        const db = await (0, database_1.getDb)();
        // Get supply output with related information
        const supplyOutput = await db
            .collection("supplyOutputs")
            .aggregate([
            {
                $match: { _id: new mongodb_1.ObjectId(outputId) },
            },
            {
                $lookup: {
                    from: "units",
                    localField: "receivingUnit",
                    foreignField: "_id",
                    as: "unitInfo",
                },
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
                $lookup: {
                    from: "users",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "createdByInfo",
                },
            },
            {
                $unwind: "$unitInfo",
            },
            {
                $unwind: "$productInfo",
            },
            {
                $unwind: {
                    path: "$createdByInfo",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "productCategories",
                    localField: "productInfo.category",
                    foreignField: "_id",
                    as: "categoryInfo",
                },
            },
            {
                $unwind: "$categoryInfo",
            },
            {
                $project: {
                    id: { $toString: "$_id" },
                    receivingUnit: {
                        id: { $toString: "$receivingUnit" },
                        name: "$unitInfo.name",
                    },
                    product: {
                        id: { $toString: "$productId" },
                        name: "$productInfo.name",
                        category: {
                            id: { $toString: "$categoryInfo._id" },
                            name: "$categoryInfo.name",
                        },
                    },
                    quantity: 1,
                    outputDate: 1,
                    receiver: 1,
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
                    createdAt: 1,
                    updatedAt: 1,
                },
            },
        ])
            .toArray();
        if (!supplyOutput || supplyOutput.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nguồn xuất"
            });
        }
        res.status(200).json({
            success: true,
            data: supplyOutput[0],
        });
    }
    catch (error) {
        console.error("Error fetching supply output:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi lấy thông tin nguồn xuất"
        });
    }
};
exports.getSupplyOutputById = getSupplyOutputById;
// @desc    Create new supply output
// @route   POST /api/supply-outputs
// @access  Private (Admin only)
const createSupplyOutput = async (req, res) => {
    try {
        const { receivingUnit, productId, quantity, outputDate, receiver, note } = req.body;
        // Validate input
        if (!receivingUnit || !productId || !quantity || !outputDate || !receiver) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng điền đầy đủ thông tin"
            });
        }
        // Validate ObjectIds
        if (!mongodb_1.ObjectId.isValid(receivingUnit) || !mongodb_1.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "ID đơn vị hoặc sản phẩm không hợp lệ"
            });
        }
        const db = await (0, database_1.getDb)();
        // Check if unit exists
        const unitExists = await db.collection("units").findOne({ _id: new mongodb_1.ObjectId(receivingUnit) });
        if (!unitExists) {
            return res.status(400).json({
                success: false,
                message: "Đơn vị không tồn tại"
            });
        }
        // Check if product exists
        const productExists = await db.collection("products").findOne({ _id: new mongodb_1.ObjectId(productId) });
        if (!productExists) {
            return res.status(400).json({
                success: false,
                message: "Sản phẩm không tồn tại"
            });
        }
        // Check if there is enough inventory
        const inventory = await db
            .collection("processingStation")
            .aggregate([
            {
                $match: {
                    type: "food",
                    productId: new mongodb_1.ObjectId(productId),
                    nonExpiredQuantity: { $gt: 0 },
                },
            },
            {
                $group: {
                    _id: "$productId",
                    totalNonExpired: { $sum: "$nonExpiredQuantity" },
                },
            },
        ])
            .toArray();
        const availableQuantity = inventory.length > 0 ? inventory[0].totalNonExpired : 0;
        if (availableQuantity < quantity) {
            return res.status(400).json({
                success: false,
                message: `Không đủ số lượng trong kho. Hiện có ${availableQuantity}kg, cần xuất ${quantity}kg`
            });
        }
        // Create new supply output
        const result = await db.collection("supplyOutputs").insertOne({
            receivingUnit: new mongodb_1.ObjectId(receivingUnit),
            productId: new mongodb_1.ObjectId(productId),
            quantity: Number(quantity),
            outputDate: new Date(outputDate),
            receiver,
            status: "completed",
            note: note || "",
            createdBy: new mongodb_1.ObjectId(req.user.id),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        // Update inventory (reduce from non-expired items)
        let remainingQuantity = Number(quantity);
        const inventoryItems = await db
            .collection("processingStation")
            .find({
            type: "food",
            productId: new mongodb_1.ObjectId(productId),
            nonExpiredQuantity: { $gt: 0 },
        })
            .sort({ expiryDate: 1 }) // Use oldest items first
            .toArray();
        for (const item of inventoryItems) {
            if (remainingQuantity <= 0)
                break;
            const reduceAmount = Math.min(item.nonExpiredQuantity, remainingQuantity);
            remainingQuantity -= reduceAmount;
            await db.collection("processingStation").updateOne({ _id: item._id }, {
                $inc: { nonExpiredQuantity: -reduceAmount, quantity: -reduceAmount },
                $set: { updatedAt: new Date() },
            });
        }
        res.status(201).json({
            success: true,
            message: "Thêm nguồn xuất thành công",
            supplyOutputId: result.insertedId.toString(),
        });
    }
    catch (error) {
        console.error("Error creating supply output:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi thêm nguồn xuất"
        });
    }
};
exports.createSupplyOutput = createSupplyOutput;
// @desc    Update supply output
// @route   PATCH /api/supply-outputs/:id
// @access  Private (Admin only)
const updateSupplyOutput = async (req, res) => {
    try {
        const outputId = req.params.id;
        const { receivingUnit, productId, quantity, outputDate, receiver, status, note } = req.body;
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(outputId)) {
            return res.status(400).json({
                success: false,
                message: "ID nguồn xuất không hợp lệ"
            });
        }
        // Validate input
        if (!receivingUnit || !productId || !quantity || !outputDate || !receiver) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng điền đầy đủ thông tin"
            });
        }
        // Validate ObjectIds
        if (!mongodb_1.ObjectId.isValid(receivingUnit) || !mongodb_1.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "ID đơn vị hoặc sản phẩm không hợp lệ"
            });
        }
        const db = await (0, database_1.getDb)();
        // Get current supply output
        const currentOutput = await db.collection("supplyOutputs").findOne({ _id: new mongodb_1.ObjectId(outputId) });
        if (!currentOutput) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nguồn xuất"
            });
        }
        // Check if unit exists
        const unitExists = await db.collection("units").findOne({ _id: new mongodb_1.ObjectId(receivingUnit) });
        if (!unitExists) {
            return res.status(400).json({
                success: false,
                message: "Đơn vị không tồn tại"
            });
        }
        // Check if product exists
        const productExists = await db.collection("products").findOne({ _id: new mongodb_1.ObjectId(productId) });
        if (!productExists) {
            return res.status(400).json({
                success: false,
                message: "Sản phẩm không tồn tại"
            });
        }
        // If product or quantity changed, check inventory and update
        if (productId !== currentOutput.productId.toString() || Number(quantity) !== currentOutput.quantity) {
            // Return previous quantity to inventory
            await db.collection("processingStation").updateOne({
                type: "food",
                productId: currentOutput.productId,
                expiryDate: { $gt: new Date() },
            }, {
                $inc: { nonExpiredQuantity: currentOutput.quantity, quantity: currentOutput.quantity },
                $set: { updatedAt: new Date() },
            });
            // Check if there is enough inventory for new product/quantity
            const inventory = await db
                .collection("processingStation")
                .aggregate([
                {
                    $match: {
                        type: "food",
                        productId: new mongodb_1.ObjectId(productId),
                        nonExpiredQuantity: { $gt: 0 },
                    },
                },
                {
                    $group: {
                        _id: "$productId",
                        totalNonExpired: { $sum: "$nonExpiredQuantity" },
                    },
                },
            ])
                .toArray();
            const availableQuantity = inventory.length > 0 ? inventory[0].totalNonExpired : 0;
            if (availableQuantity < Number(quantity)) {
                return res.status(400).json({
                    success: false,
                    message: `Không đủ số lượng trong kho. Hiện có ${availableQuantity}kg, cần xuất ${quantity}kg`
                });
            }
            // Update inventory with new quantity
            let remainingQuantity = Number(quantity);
            const inventoryItems = await db
                .collection("processingStation")
                .find({
                type: "food",
                productId: new mongodb_1.ObjectId(productId),
                nonExpiredQuantity: { $gt: 0 },
            })
                .sort({ expiryDate: 1 }) // Use oldest items first
                .toArray();
            for (const item of inventoryItems) {
                if (remainingQuantity <= 0)
                    break;
                const reduceAmount = Math.min(item.nonExpiredQuantity, remainingQuantity);
                remainingQuantity -= reduceAmount;
                await db.collection("processingStation").updateOne({ _id: item._id }, {
                    $inc: { nonExpiredQuantity: -reduceAmount, quantity: -reduceAmount },
                    $set: { updatedAt: new Date() },
                });
            }
        }
        // Update supply output
        const result = await db.collection("supplyOutputs").updateOne({ _id: new mongodb_1.ObjectId(outputId) }, {
            $set: {
                receivingUnit: new mongodb_1.ObjectId(receivingUnit),
                productId: new mongodb_1.ObjectId(productId),
                quantity: Number(quantity),
                outputDate: new Date(outputDate),
                receiver,
                status: status || "completed",
                note: note || "",
                updatedAt: new Date(),
            },
        });
        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nguồn xuất"
            });
        }
        res.status(200).json({
            success: true,
            message: "Cập nhật nguồn xuất thành công",
        });
    }
    catch (error) {
        console.error("Error updating supply output:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi cập nhật nguồn xuất"
        });
    }
};
exports.updateSupplyOutput = updateSupplyOutput;
// @desc    Delete supply output
// @route   DELETE /api/supply-outputs/:id
// @access  Private (Admin only)
const deleteSupplyOutput = async (req, res) => {
    try {
        const outputId = req.params.id;
        // Validate ObjectId
        if (!mongodb_1.ObjectId.isValid(outputId)) {
            return res.status(400).json({
                success: false,
                message: "ID nguồn xuất không hợp lệ"
            });
        }
        const db = await (0, database_1.getDb)();
        // Get current supply output
        const currentOutput = await db.collection("supplyOutputs").findOne({ _id: new mongodb_1.ObjectId(outputId) });
        if (!currentOutput) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nguồn xuất"
            });
        }
        // Return quantity to inventory
        await db.collection("processingStation").updateOne({
            type: "food",
            productId: currentOutput.productId,
            expiryDate: { $gt: new Date() },
        }, {
            $inc: { nonExpiredQuantity: currentOutput.quantity, quantity: currentOutput.quantity },
            $set: { updatedAt: new Date() },
        });
        // Delete supply output
        const result = await db.collection("supplyOutputs").deleteOne({ _id: new mongodb_1.ObjectId(outputId) });
        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy nguồn xuất"
            });
        }
        res.status(200).json({
            success: true,
            message: "Xóa nguồn xuất thành công",
        });
    }
    catch (error) {
        console.error("Error deleting supply output:", error);
        return res.status(500).json({
            success: false,
            message: "Đã xảy ra lỗi khi xóa nguồn xuất"
        });
    }
};
exports.deleteSupplyOutput = deleteSupplyOutput;
