import type { Request, Response } from "express"
import { ObjectId } from "mongodb"
import { getDb } from "../config/database"
import { AppError } from "../middleware/error.middleware"
import mongoose from "mongoose"
import { Supply, Unit, User } from "../models"
import { connectToDatabase } from "../config/database"

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
}

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
}

// @desc    Get all supplies
// @route   GET /api/supplies
// @access  Private
export const getSupplies = async (req: Request, res: Response) => {
  try {
    const { 
      unit, 
      category, 
      status, 
      fromDate, 
      toDate, 
      stationEntryFromDate, 
      stationEntryToDate,
      createdFromDate,
      createdToDate
    } = req.query

    // Make sure the database is connected
    await connectToDatabase()

    // Log user info for debugging
    console.log("DEBUG - getSupplies user info:", {
      role: req.user!.role,
      unit: req.user!.unit,
      userId: req.user!.id
    })

    // Build query based on role and filters
    const query: any = {}

    // Don't filter by unit for admin, brigadeAssistant or stationManager roles
    if (req.user!.role === "admin" || req.user!.role === "brigadeAssistant" || req.user!.role === "stationManager") {
      console.log("DEBUG - Not filtering by unit for admin/brigadeAssistant/stationManager role")
    } 
    // Unit assistants can only see their own unit's supplies
    else if (req.user!.role === "unitAssistant") {
      try {
        // Convert unit to ObjectId if it's a string
        if (typeof req.user!.unit === "string") {
          query.unit = new mongoose.Types.ObjectId(req.user!.unit)
        } else {
          // Use as is if already ObjectId
          query.unit = req.user!.unit
        }
        console.log("DEBUG - Filtering by unit for unitAssistant:", query.unit)
      } catch (error) {
        console.error("Error converting unit to ObjectId:", error)
        query.unit = req.user!.unit // Fallback to using as-is
      }
    }

    // Filter by unit parameter if specified
    if (unit && unit !== "all" && mongoose.isValidObjectId(unit)) {
      try {
        query.unit = new mongoose.Types.ObjectId(unit as string)
        console.log("DEBUG - Filtering by unit from query param:", query.unit)
      } catch (error) {
        console.error("Error converting unit param to ObjectId:", error)
        query.unit = unit
      }
    }

    // Filter by category if specified
    if (category) {
      query.category = category
    }

    // Filter by status if specified
    if (status && status !== 'all') {
      query.status = status
    }

    // Filter by harvest date range if specified
    if (fromDate || toDate) {
      query.expectedHarvestDate = {}
      if (fromDate) {
        query.expectedHarvestDate.$gte = new Date(fromDate as string)
      }
      if (toDate) {
        query.expectedHarvestDate.$lte = new Date(toDate as string)
      }
    }

    // Filter by station entry date range if specified
    if (stationEntryFromDate || stationEntryToDate) {
      query.stationEntryDate = {}
      if (stationEntryFromDate) {
        query.stationEntryDate.$gte = new Date(stationEntryFromDate as string)
      }
      if (stationEntryToDate) {
        query.stationEntryDate.$lte = new Date(stationEntryToDate as string)
      }
    }

    // Filter by created date range if specified
    if (createdFromDate || createdToDate) {
      query.createdAt = {}
      if (createdFromDate) {
        query.createdAt.$gte = new Date(createdFromDate as string)
      }
      if (createdToDate) {
        query.createdAt.$lte = new Date(createdToDate as string)
      }
    }

    console.log("DEBUG - Final query:", JSON.stringify(query, null, 2))

    // Use Mongoose model to find supplies
    const supplies = await Supply.find(query)
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
          name: FOOD_CATEGORIES[category as keyof typeof FOOD_CATEGORIES] || category
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

    res.status(200).json(formattedSupplies)
  } catch (error) {
    console.error("Error fetching supplies:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy danh sách nguồn nhập"
    })
  }
}

// Helper functions to get product details
function getProductName(productId: string): string {
  const allProducts = Object.values(FOOD_PRODUCTS).flat();
  const product = allProducts.find(p => p.id === productId);
  return product ? product.name : productId;
}

function getProductUnit(productId: string): string {
  const allProducts = Object.values(FOOD_PRODUCTS).flat();
  const product = allProducts.find(p => p.id === productId);
  return product ? product.unit : 'kg';
}

// @desc    Create new supply
// @route   POST /api/supplies
// @access  Private (Unit Assistant only)
export const createSupply = async (req: Request, res: Response) => {
  try {
    const { 
      unit, 
      category, 
      product, 
      supplyQuantity, 
      expectedHarvestDate, 
      actualQuantity,
      unitPrice,
      expiryDate,
      note 
    } = req.body

    // Only unit assistants can create supplies
    if (req.user!.role !== "unitAssistant") {
      throw new AppError("Chỉ trợ lý tiểu đoàn mới có thể thêm nguồn nhập", 403)
    }

    // Validate input
    if (!category || !product || !supplyQuantity || !expectedHarvestDate) {
      throw new AppError("Vui lòng điền đầy đủ thông tin bắt buộc", 400)
    }

    // Validate category and product
    if (!FOOD_CATEGORIES[category as keyof typeof FOOD_CATEGORIES]) {
      throw new AppError("Phân loại không hợp lệ", 400)
    }
    
    const categoryProducts = FOOD_PRODUCTS[category as keyof typeof FOOD_PRODUCTS] || []
    const productExists = categoryProducts.find((p) => p.id === product)
    if (!productExists) {
      throw new AppError("Sản phẩm không hợp lệ", 400)
    }

    // Ensure database connection
    await connectToDatabase()

    // Unit assistants can only create for their own unit
    const unitId = new mongoose.Types.ObjectId(req.user!.unit)

    console.log("DEBUG - createSupply user info:", {
      role: req.user!.role,
      unit: req.user!.unit,
      unitId: unitId.toString(),
      userId: req.user!.id
    })

    // Calculate total price if both actualQuantity and unitPrice are provided
    const totalPrice = (actualQuantity && unitPrice) ? Number(actualQuantity) * Number(unitPrice) : null

    // Get the user's full name for the createdBy field
    const user = await User.findById(req.user!.id).select('fullName').lean()
    
    // Create new supply using Mongoose model
    const supplyData = {
      unit: unitId,
      category,
      product,
      supplyQuantity: Number(supplyQuantity),
      expectedHarvestDate: new Date(expectedHarvestDate),
      stationEntryDate: null, // Will be filled by brigade assistant during approval
      requestedQuantity: null, // Will be filled by brigade assistant during approval
      actualQuantity: actualQuantity ? Number(actualQuantity) : null,
      unitPrice: unitPrice ? Number(unitPrice) : null,
      totalPrice,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      status: "pending", // Always starts as pending
      note: note || "",
      createdBy: {
        id: new mongoose.Types.ObjectId(req.user!.id),
        name: user?.fullName || 'Unknown'
      },
      approvedBy: null
    }

    console.log("DEBUG - Creating supply with data:", JSON.stringify({
      ...supplyData,
      unit: supplyData.unit.toString(),
      createdBy: { 
        id: supplyData.createdBy.id.toString(),
        name: supplyData.createdBy.name
      }
    }, null, 2))

    // Create new supply with pending status
    const newSupply = new Supply(supplyData)
    const savedSupply = await newSupply.save()

    res.status(201).json({
      success: true,
      message: "Thêm nguồn nhập thành công. Trạng thái: Chờ phê duyệt",
      data: { supplyId: savedSupply._id.toString() },
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error creating supply:", error)
    throw new AppError("Đã xảy ra lỗi khi thêm nguồn nhập", 500)
  }
}

// @desc    Get supply by ID
// @route   GET /api/supplies/:id
// @access  Private
export const getSupplyById = async (req: Request, res: Response) => {
  try {
    const supplyId = req.params.id

    // Validate ObjectId
    if (!ObjectId.isValid(supplyId)) {
      throw new AppError("ID nguồn nhập không hợp lệ", 400)
    }

    const db = await getDb()

    // Get supply with related information
    const supply = await db
      .collection("supplies")
      .aggregate([
        {
          $match: { _id: new ObjectId(supplyId) },
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
      .toArray()

    if (!supply || supply.length === 0) {
      throw new AppError("Không tìm thấy nguồn nhập", 404)
    }

    // Check if user has access to this supply
    if (req.user!.role === "unitAssistant" && supply[0].unit._id !== req.user!.unit) {
      throw new AppError("Bạn không có quyền xem nguồn nhập này", 403)
    }

    res.status(200).json(supply[0])
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error fetching supply:", error)
    throw new AppError("Đã xảy ra lỗi khi lấy thông tin nguồn nhập", 500)
  }
}

// @desc    Update supply
// @route   PATCH /api/supplies/:id
// @access  Private (Unit Assistant for own supplies in pending status only)
export const updateSupply = async (req: Request, res: Response) => {
  try {
    const supplyId = req.params.id

    // Validate ObjectId
    if (!ObjectId.isValid(supplyId)) {
      throw new AppError("ID nguồn nhập không hợp lệ", 400)
    }

    const db = await getDb()

    // Get current supply
    const currentSupply = await db.collection("supplies").findOne({ _id: new ObjectId(supplyId) })

    if (!currentSupply) {
      throw new AppError("Không tìm thấy nguồn nhập", 404)
    }

    // Only unit assistants can update supplies
    if (req.user!.role !== "unitAssistant") {
      throw new AppError("Chỉ trợ lý tiểu đoàn mới có thể chỉnh sửa nguồn nhập", 403)
    }

    // Unit assistants can only update their own supplies
      if (currentSupply.unit.toString() !== req.user!.unit) {
      throw new AppError("Bạn chỉ có thể chỉnh sửa nguồn nhập của tiểu đoàn mình", 403)
      }

    // Can only update supplies in pending status
      if (currentSupply.status !== "pending") {
        throw new AppError("Chỉ có thể chỉnh sửa nguồn nhập ở trạng thái chờ phê duyệt", 400)
      }

    const { 
      category, 
      product, 
      supplyQuantity, 
      expectedHarvestDate, 
      actualQuantity,
      unitPrice,
      expiryDate,
      note 
    } = req.body

      // Validate input
    if (!category || !product || !supplyQuantity || !expectedHarvestDate) {
      throw new AppError("Vui lòng điền đầy đủ thông tin bắt buộc", 400)
      }
      
    // Calculate total price if both actualQuantity and unitPrice are provided
    const totalPrice = (actualQuantity && unitPrice) ? Number(actualQuantity) * Number(unitPrice) : null

      // Update supply
      const result = await db.collection("supplies").updateOne(
        { _id: new ObjectId(supplyId) },
        {
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
        },
      )

      if (result.modifiedCount === 0) {
        throw new AppError("Không có thay đổi nào được thực hiện", 400)
      }

      res.status(200).json({
        success: true,
        message: "Cập nhật nguồn nhập thành công",
      })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error updating supply:", error)
    throw new AppError("Đã xảy ra lỗi khi cập nhật nguồn nhập", 500)
  }
}

// @desc    Approve supply
// @route   PATCH /api/supplies/:id/approve
// @access  Private (Brigade Assistant only)
export const approveSupply = async (req: Request, res: Response) => {
  try {
    const supplyId = req.params.id
    const { stationEntryDate, requestedQuantity, actualQuantity, unitPrice, expiryDate, note } = req.body

    // Only brigade assistants and station managers can approve supplies
    if (req.user!.role !== "brigadeAssistant" && req.user!.role !== "stationManager") {
      throw new AppError("Chỉ trợ lý lữ đoàn hoặc trạm trưởng trạm chế biến mới có thể phê duyệt nguồn nhập", 403)
    }

    // Validate ObjectId
    if (!ObjectId.isValid(supplyId)) {
      throw new AppError("ID nguồn nhập không hợp lệ", 400)
    }

    // Validate required input for approval
    if (!stationEntryDate || requestedQuantity === undefined || actualQuantity === undefined || !unitPrice || !expiryDate) {
      throw new AppError("Vui lòng điền đầy đủ thông tin: Ngày nhập trạm, Số lượng nhập yêu cầu, Số lượng nhập thực tế, Giá tiền, Hạn sử dụng", 400)
    }

    const db = await getDb()

    // Get current supply
    const currentSupply = await db.collection("supplies").findOne({ _id: new ObjectId(supplyId) })

    if (!currentSupply) {
      throw new AppError("Không tìm thấy nguồn nhập", 404)
    }

    if (currentSupply.status !== "pending") {
      throw new AppError("Chỉ có thể phê duyệt nguồn nhập ở trạng thái chờ phê duyệt", 400)
    }

    // Calculate total price
    const totalPrice = Number(actualQuantity) * Number(unitPrice)

    // Update supply with approval information
    const result = await db.collection("supplies").updateOne(
      { _id: new ObjectId(supplyId) },
      {
        $set: {
          stationEntryDate: new Date(stationEntryDate),
          requestedQuantity: Number(requestedQuantity),
          actualQuantity: Number(actualQuantity),
          unitPrice: Number(unitPrice),
          totalPrice: totalPrice,
          expiryDate: new Date(expiryDate),
          note: note || currentSupply.note,
          status: "approved",
          approvedBy: new ObjectId(req.user!.id),
          updatedAt: new Date(),
        },
      },
    )

    if (result.modifiedCount === 0) {
      throw new AppError("Không có thay đổi nào được thực hiện", 400)
    }

    res.status(200).json({
      success: true,
      message: "Phê duyệt nguồn nhập thành công. Thông tin đã được cập nhật vào hệ thống trạm chế biến",
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error approving supply:", error)
    throw new AppError("Đã xảy ra lỗi khi phê duyệt nguồn nhập", 500)
  }
}

// @desc    Reject supply
// @route   PATCH /api/supplies/:id/reject
// @access  Private (Brigade Assistant only)
export const rejectSupply = async (req: Request, res: Response) => {
  try {
    const supplyId = req.params.id
    const { note } = req.body

    // Only brigade assistants and station managers can reject supplies
    if (req.user!.role !== "brigadeAssistant" && req.user!.role !== "stationManager") {
      throw new AppError("Chỉ trợ lý lữ đoàn hoặc trạm trưởng trạm chế biến mới có thể từ chối nguồn nhập", 403)
    }

    // Validate ObjectId
    if (!ObjectId.isValid(supplyId)) {
      throw new AppError("ID nguồn nhập không hợp lệ", 400)
    }

    const db = await getDb()

    // Get current supply
    const currentSupply = await db.collection("supplies").findOne({ _id: new ObjectId(supplyId) })

    if (!currentSupply) {
      throw new AppError("Không tìm thấy nguồn nhập", 404)
    }

    if (currentSupply.status !== "pending") {
      throw new AppError("Chỉ có thể từ chối nguồn nhập ở trạng thái chờ phê duyệt", 400)
    }

    // Update supply with rejection
    const result = await db.collection("supplies").updateOne(
      { _id: new ObjectId(supplyId) },
      {
        $set: {
          status: "rejected",
          note: note || currentSupply.note,
          updatedAt: new Date(),
        },
      },
    )

    if (result.modifiedCount === 0) {
      throw new AppError("Không có thay đổi nào được thực hiện", 400)
    }

    res.status(200).json({
      success: true,
      message: "Từ chối nguồn nhập thành công",
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error rejecting supply:", error)
    throw new AppError("Đã xảy ra lỗi khi từ chối nguồn nhập", 500)
  }
}

// @desc    Delete supply (soft delete)
// @route   DELETE /api/supplies/:id
// @access  Private (Unit Assistant for own supplies in pending status only)
export const deleteSupply = async (req: Request, res: Response) => {
  try {
    const supplyId = req.params.id

    // Validate ObjectId
    if (!ObjectId.isValid(supplyId)) {
      throw new AppError("ID nguồn nhập không hợp lệ", 400)
    }

    const db = await getDb()

    // Get current supply
    const currentSupply = await db.collection("supplies").findOne({ _id: new ObjectId(supplyId) })

    if (!currentSupply) {
      throw new AppError("Không tìm thấy nguồn nhập", 404)
    }

    // Only unit assistants can delete supplies
    if (req.user!.role !== "unitAssistant") {
      throw new AppError("Chỉ trợ lý tiểu đoàn mới có thể xóa nguồn nhập", 403)
    }

    // Unit assistants can only delete their own supplies
      if (currentSupply.unit.toString() !== req.user!.unit) {
      throw new AppError("Bạn chỉ có thể xóa nguồn nhập của tiểu đoàn mình", 403)
      }

    // Can only delete supplies in pending status
      if (currentSupply.status !== "pending") {
        throw new AppError("Chỉ có thể xóa nguồn nhập ở trạng thái chờ phê duyệt", 400)
    }

    // Soft delete by changing status
    const result = await db.collection("supplies").updateOne(
      { _id: new ObjectId(supplyId) },
      {
        $set: {
          status: "deleted",
          updatedAt: new Date(),
        },
      },
    )

    if (result.modifiedCount === 0) {
      throw new AppError("Không có thay đổi nào được thực hiện", 400)
    }

    res.status(200).json({
      success: true,
      message: "Xóa nguồn nhập thành công",
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error deleting supply:", error)
    throw new AppError("Đã xảy ra lỗi khi xóa nguồn nhập", 500)
  }
}

// @desc    Get food categories
// @route   GET /api/supplies/categories
// @access  Private
export const getFoodCategories = async (req: Request, res: Response) => {
  try {
    const categories = Object.entries(FOOD_CATEGORIES).map(([id, name]) => ({
      _id: id,
      name,
    }))

    res.status(200).json({
      success: true,
      data: categories,
    })
  } catch (error) {
    console.error("Error fetching food categories:", error)
    throw new AppError("Đã xảy ra lỗi khi lấy danh sách phân loại", 500)
  }
}

// @desc    Get food products by category
// @route   GET /api/supplies/products/:categoryId
// @access  Private
export const getFoodProducts = async (req: Request, res: Response) => {
  try {
    const categoryId = req.params.categoryId

    if (!FOOD_CATEGORIES[categoryId as keyof typeof FOOD_CATEGORIES]) {
      throw new AppError("Phân loại không tồn tại", 404)
    }

    const products = FOOD_PRODUCTS[categoryId as keyof typeof FOOD_PRODUCTS] || []
    const formattedProducts = products.map((product) => ({
      _id: product.id,
      name: product.name,
      unit: product.unit,
      category: categoryId,
    }))

    res.status(200).json({
      success: true,
      data: formattedProducts,
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error fetching food products:", error)
    throw new AppError("Đã xảy ra lỗi khi lấy danh sách sản phẩm", 500)
  }
}
