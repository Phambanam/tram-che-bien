import type { Request, Response } from "express"
import { ObjectId } from "mongodb"
import { getDb } from "../config/database"
import { AppError } from "../middleware/error.middleware"
import mongoose from "mongoose"
import { Supply, Unit, User } from "../models"
import { connectToDatabase } from "../config/database"
import { format } from 'date-fns'

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
      category,
      product,
      supplyQuantity,
      expiryDate,
      note,
    } = req.body

    // Check permission - now unit assistants create supplies
    if (req.user!.role !== "unitAssistant") {
      return res.status(403).json({
        success: false,
        message: "Chỉ trợ lý tiểu đoàn mới có thể thêm nguồn nhập"
      })
    }

    // Validate required fields
    if (!category || !product || !supplyQuantity) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin bắt buộc"
      })
    }

    // Validate category and product are strings (not ObjectIds for predefined categories)
    if (!FOOD_CATEGORIES[category as keyof typeof FOOD_CATEGORIES]) {
      return res.status(400).json({
        success: false,
        message: "Phân loại không hợp lệ"
      })
    }
    
    const categoryProducts = FOOD_PRODUCTS[category as keyof typeof FOOD_PRODUCTS] || []
    const productExists = categoryProducts.find((p) => p.id === product)
    if (!productExists) {
      return res.status(400).json({
        success: false,
        message: "Sản phẩm không hợp lệ"
      })
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

    // Get the user's full name for the createdBy field
    const user = await User.findById(req.user!.id).select('fullName').lean()
    
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
      message: "Thêm nguồn nhập thành công. Trạng thái: Chờ duyệt",
      data: { supplyId: savedSupply._id.toString() },
    })
  } catch (error) {
    console.error("Error creating supply:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi thêm nguồn nhập"
    })
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
      return res.status(400).json({
        success: false,
        message: "ID nguồn nhập không hợp lệ"
      })
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
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nguồn nhập"
      })
    }

    // Check permission
    if (req.user!.role === "battalionAssistant" && supply[0].unit._id !== req.user!.unit) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem nguồn nhập này"
      })
    }

    res.status(200).json(supply[0])
  } catch (error) {
    console.error("Error fetching supply:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy thông tin nguồn nhập"
    })
  }
}

// @desc    Update supply
// @route   PATCH /api/supplies/:id
// @access  Private (Battalion Assistant only)
export const updateSupply = async (req: Request, res: Response) => {
  try {
    const supplyId = req.params.id

    // Validate ObjectId
    if (!ObjectId.isValid(supplyId)) {
      return res.status(400).json({
        success: false,
        message: "ID nguồn nhập không hợp lệ"
      })
    }

    const db = await getDb()

    // Check if supply exists
    const existingSupply = await db.collection("supplies").findOne({ _id: new ObjectId(supplyId) })
    if (!existingSupply) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nguồn nhập"
      })
    }

    // Check permission
    if (req.user!.role !== "battalionAssistant") {
      return res.status(403).json({
        success: false,
        message: "Chỉ trợ lý tiểu đoàn mới có thể chỉnh sửa nguồn nhập"
      })
    }

    if (existingSupply.battalion.toString() !== req.user!.battalion.toString()) {
      return res.status(403).json({
        success: false,
        message: "Bạn chỉ có thể chỉnh sửa nguồn nhập của tiểu đoàn mình"
      })
    }

    // Only allow editing pending supplies
    if (existingSupply.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể chỉnh sửa nguồn nhập ở trạng thái chờ phê duyệt"
      })
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
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin bắt buộc"
      })
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

    if (result.matchedCount === 0) {
      return res.status(400).json({
        success: false,
        message: "Không có thay đổi nào được thực hiện"
      })
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật nguồn nhập thành công",
    })
  } catch (error) {
    console.error("Error updating supply:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật nguồn nhập"
    })
  }
}

// @desc    Approve supply
// @route   PATCH /api/supplies/:id/approve
// @access  Private (Brigade Assistant only)
export const approveSupply = async (req: Request, res: Response) => {
  try {
    const supplyId = req.params.id
    const { 
      stationEntryDate, 
      requestedQuantity, 
      unitPrice, 
      expiryDate, 
      note 
    } = req.body

    // Validate ObjectId
    if (!ObjectId.isValid(supplyId)) {
      return res.status(400).json({
        success: false,
        message: "ID nguồn nhập không hợp lệ"
      })
    }

    // Check permission
    if (req.user!.role !== "brigadeAssistant" && req.user!.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Chỉ trợ lý lữ đoàn mới có thể phê duyệt nguồn nhập"
      })
    }

    // Validate required fields for approval - không yêu cầu actualQuantity
    if (!stationEntryDate || !requestedQuantity || !unitPrice) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ: Số lượng phải nhập, Đơn giá, Ngày nhập trạm"
      })
    }

    // Ensure database connection
    await connectToDatabase()

    // Find supply
    const supply = await Supply.findById(supplyId)
    if (!supply) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nguồn nhập"
      })
    }

    // Check if supply is pending
    if (supply.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể phê duyệt nguồn nhập ở trạng thái chờ duyệt"
      })
    }

    // Calculate total price dựa trên requestedQuantity
    const totalPrice = Number(requestedQuantity) * Number(unitPrice)

    // Get the user's full name for the approvedBy field
    const user = await User.findById(req.user!.id).select('fullName').lean()

    // Update supply with approval data
    supply.status = "approved"
    supply.stationEntryDate = new Date(stationEntryDate)
    supply.requestedQuantity = Number(requestedQuantity)
    supply.unitPrice = Number(unitPrice)
    supply.totalPrice = totalPrice
    // actualQuantity sẽ được nhập bởi trạm trưởng khi nhận hàng
    supply.actualQuantity = null
    if (expiryDate) {
      supply.expiryDate = new Date(expiryDate)
    }
    if (note) {
      supply.note = note
    }
    supply.approvedBy = {
      id: new mongoose.Types.ObjectId(req.user!.id),
      name: user?.fullName || 'Unknown'
    }

    await supply.save()

    res.status(200).json({
      success: true,
      message: "Đã phê duyệt nguồn nhập thành công! Trạng thái: Đã duyệt",
      data: { supplyId: supply._id.toString() }
    })
  } catch (error) {
    console.error("Error approving supply:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi phê duyệt nguồn nhập"
    })
  }
}

// @desc    Reject supply
// @route   PATCH /api/supplies/:id/reject
// @access  Private (Brigade Assistant only)
export const rejectSupply = async (req: Request, res: Response) => {
  try {
    const supplyId = req.params.id
    const { note } = req.body

    // Validate ObjectId
    if (!ObjectId.isValid(supplyId)) {
      return res.status(400).json({
        success: false,
        message: "ID nguồn nhập không hợp lệ"
      })
    }

    // Check permission
    if (req.user!.role !== "brigadeAssistant" && req.user!.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Chỉ trợ lý lữ đoàn mới có thể từ chối nguồn nhập"
      })
    }

    const db = await getDb()

    // Check if supply exists
    const existingSupply = await db.collection("supplies").findOne({ _id: new ObjectId(supplyId) })
    if (!existingSupply) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nguồn nhập"
      })
    }

    if (existingSupply.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể từ chối nguồn nhập ở trạng thái chờ phê duyệt"
      })
    }

    // Update supply status to rejected
    const result = await db.collection("supplies").updateOne(
      { _id: new ObjectId(supplyId) },
      {
        $set: {
          status: "rejected",
          note: note || "Từ chối bởi trợ lý lữ đoàn",
          updatedAt: new Date(),
        },
      },
    )

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: "Không có thay đổi nào được thực hiện"
      })
    }

    res.status(200).json({
      success: true,
      message: "Đã từ chối nguồn nhập",
    })
  } catch (error) {
    console.error("Error rejecting supply:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi từ chối nguồn nhập"
    })
  }
}

// @desc    Delete supply
// @route   DELETE /api/supplies/:id
// @access  Private (Battalion Assistant only)
export const deleteSupply = async (req: Request, res: Response) => {
  try {
    const supplyId = req.params.id

    // Validate ObjectId
    if (!ObjectId.isValid(supplyId)) {
      return res.status(400).json({
        success: false,
        message: "ID nguồn nhập không hợp lệ"
      })
    }

    const db = await getDb()

    // Check if supply exists
    const existingSupply = await db.collection("supplies").findOne({ _id: new ObjectId(supplyId) })
    if (!existingSupply) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nguồn nhập"
      })
    }

    // Check permission
    if (req.user!.role !== "battalionAssistant") {
      return res.status(403).json({
        success: false,
        message: "Chỉ trợ lý tiểu đoàn mới có thể xóa nguồn nhập"
      })
    }

    if (existingSupply.battalion.toString() !== req.user!.battalion.toString()) {
      return res.status(403).json({
        success: false,
        message: "Bạn chỉ có thể xóa nguồn nhập của tiểu đoàn mình"
      })
    }

    // Only allow deleting pending supplies
    if (existingSupply.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể xóa nguồn nhập ở trạng thái chờ phê duyệt"
      })
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
      return res.status(400).json({
        success: false,
        message: "Không có thay đổi nào được thực hiện"
      })
    }

    res.status(200).json({
      success: true,
      message: "Xóa nguồn nhập thành công",
    })
  } catch (error) {
    console.error("Error deleting supply:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xóa nguồn nhập"
    })
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
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy danh sách phân loại"
    })
  }
}

// @desc    Get food products by category
// @route   GET /api/supplies/products/:categoryId
// @access  Private
export const getFoodProducts = async (req: Request, res: Response) => {
  try {
    const categoryId = req.params.categoryId

    if (!FOOD_CATEGORIES[categoryId as keyof typeof FOOD_CATEGORIES]) {
      return res.status(404).json({
        success: false,
        message: "Phân loại không tồn tại"
      })
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
    console.error("Error fetching food products:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy danh sách sản phẩm"
    })
  }
}

// @desc    Receive supply (Station Manager)
// @route   PATCH /api/supplies/:id/receive
// @access  Private (Station Manager only)
export const receiveSupply = async (req: Request, res: Response) => {
  try {
    const supplyId = req.params.id
    const { actualQuantity, receivedQuantity } = req.body

    // Validate ObjectId
    if (!ObjectId.isValid(supplyId)) {
      return res.status(400).json({
        success: false,
        message: "ID nguồn nhập không hợp lệ"
      })
    }

    // Check permission
    if (req.user!.role !== "stationManager" && req.user!.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Chỉ trạm trưởng mới có thể nhận nguồn nhập"
      })
    }

    // Validate quantities
    if (!actualQuantity || Number(actualQuantity) <= 0 || !receivedQuantity || Number(receivedQuantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập số lượng thực nhập và số lượng thực nhận hợp lệ"
      })
    }

    // Ensure database connection
    await connectToDatabase()

    // Find supply
    const supply = await Supply.findById(supplyId)
    if (!supply) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nguồn nhập"
      })
    }

    // Check if supply is approved and has station entry date for today
    if (supply.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể nhận nguồn nhập đã được duyệt"
      })
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
    supply.actualQuantity = Number(actualQuantity)
    supply.receivedQuantity = Number(receivedQuantity)
    supply.status = "received"
    
    // Recalculate total price based on actual quantity
    if (supply.unitPrice) {
      supply.totalPrice = Number(actualQuantity) * supply.unitPrice
    }

    await supply.save()

    res.status(200).json({
      success: true,
      message: "Đã nhận nguồn nhập thành công! Trạng thái: Đã nhận",
      data: { supplyId: supply._id.toString() }
    })
  } catch (error) {
    console.error("Error receiving supply:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi nhận nguồn nhập"
    })
  }
}

// @desc    Export supplies to Excel
// @route   GET /api/supplies/export
// @access  Private
export const exportSuppliesExcel = async (req: Request, res: Response) => {
  try {
    const { 
      unit, 
      stationEntryDate,
      status
    } = req.query

    // Build query - chỉ xuất các phiếu đã nhận
    const query: any = {
      status: "received" // Chỉ xuất phiếu đã nhận
    }

    // Filter by specific date if provided
    if (stationEntryDate) {
      const startOfDay = new Date(stationEntryDate as string)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(stationEntryDate as string)
      endOfDay.setHours(23, 59, 59, 999)
      
      query.stationEntryDate = {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }

    // Filter by unit if specified
    if (unit && unit !== "all" && mongoose.isValidObjectId(unit)) {
      query.unit = new mongoose.Types.ObjectId(unit as string)
    }

    // Get supplies with populated unit data
    const supplies = await Supply.find(query)
      .populate({
        path: 'unit',
        select: 'name'
      })
      .lean()
      .exec()

    // Group supplies by unit and date
    const groupedSupplies: any = {}
    supplies.forEach((supply: any) => {
      const dateKey = supply.stationEntryDate ? format(new Date(supply.stationEntryDate), 'dd/MM/yyyy') : 'Không xác định'
      const unitKey = supply.unit?.name || 'Không xác định'
      const key = `${unitKey}_${dateKey}`
      
      if (!groupedSupplies[key]) {
        groupedSupplies[key] = {
          unit: unitKey,
          date: dateKey,
          supplies: []
        }
      }
      groupedSupplies[key].supplies.push(supply)
    })

    // Create Excel workbook
    const ExcelJS = require('exceljs')
    const workbook = new ExcelJS.Workbook()

    // Create a worksheet for each unit/date combination
    Object.values(groupedSupplies).forEach((group: any) => {
      // Clean worksheet name by removing invalid characters: * ? : \ / [ ]
      const cleanWorksheetName = `${group.unit} - ${group.date}`.replace(/[*?:\\/\[\]]/g, '-')
      const worksheet = workbook.addWorksheet(cleanWorksheetName)

      // Add header
      worksheet.mergeCells('A1:C1')
      worksheet.getCell('A1').value = `Đơn vị: ${group.unit}`
      worksheet.getCell('A1').font = { size: 11 }

      worksheet.mergeCells('D1:H1')
      worksheet.getCell('D1').value = 'PHIẾU NHẬP KHO'
      worksheet.getCell('D1').font = { bold: true, size: 16 }
      worksheet.getCell('D1').alignment = { horizontal: 'center' }

      worksheet.mergeCells('I1:J1')
      worksheet.getCell('I1').value = `Mẫu 26: PNX-TMKH/QN21`
      worksheet.getCell('I1').font = { italic: true, size: 10 }
      worksheet.getCell('I1').alignment = { horizontal: 'right' }

      // Add sub-header
      worksheet.getCell('A2').value = 'Kho nhận hàng: Trạm chế biến'
      worksheet.mergeCells('A2:C2')

      worksheet.mergeCells('I2:J2')
      worksheet.getCell('I2').value = `Số: ${Math.floor(Math.random() * 1000)}`
      worksheet.getCell('I2').alignment = { horizontal: 'right' }

      // Add date info
      worksheet.mergeCells('D3:H3')
      worksheet.getCell('D3').value = `Có giá trị kết ngày ${group.date}`
      worksheet.getCell('D3').alignment = { horizontal: 'center' }

      // Add receipt info
      worksheet.mergeCells('A4:J4')
      worksheet.getCell('A4').value = `Nhập của ${group.unit} theo phiếu yêu cầu`

      worksheet.mergeCells('A5:J5')
      worksheet.getCell('A5').value = 'Hàng do vận chuyển'

      // Add table headers
      const headers = [
        'TT',
        'TÊN, QUI CÁCH, KÝ MÃ HIỆU VẬT TƯ',
        'Đơn vị tính',
        'SỐ LƯỢNG',
        '',
        'Đơn giá',
        'Thành tiền',
        'GHI CHÚ'
      ]

      // Merge cells for headers
      worksheet.mergeCells('B7:B8')
      worksheet.mergeCells('C7:C8')
      worksheet.mergeCells('D7:E7')
      worksheet.getCell('D7').value = 'SỐ LƯỢNG'
      worksheet.getCell('D8').value = 'Phải nhập'
      worksheet.getCell('E8').value = 'Thực nhập'
      worksheet.mergeCells('F7:F8')
      worksheet.mergeCells('G7:G8')
      worksheet.mergeCells('H7:H8')

      // Set header values
      worksheet.getCell('A7').value = 'TT'
      worksheet.getCell('B7').value = 'TÊN, QUI CÁCH, KÝ MÃ HIỆU VẬT TƯ'
      worksheet.getCell('C7').value = 'Đơn vị tính'
      worksheet.getCell('F7').value = 'Đơn giá'
      worksheet.getCell('G7').value = 'Thành tiền'
      worksheet.getCell('H7').value = 'GHI CHÚ'

      // Style headers
      ['A7', 'A8', 'B7', 'C7', 'D7', 'D8', 'E8', 'F7', 'G7', 'H7'].forEach(cell => {
        worksheet.getCell(cell).font = { bold: true }
        worksheet.getCell(cell).alignment = { vertical: 'middle', horizontal: 'center' }
        worksheet.getCell(cell).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      })

      // Add data rows
      let rowIndex = 9
      let totalAmount = 0
      let totalItems = 0

      group.supplies.forEach((supply: any, index: number) => {
        const row = worksheet.getRow(rowIndex)
        row.values = [
          index + 1,
          `${getProductName(supply.product)} - ${FOOD_CATEGORIES[supply.category as keyof typeof FOOD_CATEGORIES] || supply.category}`,
          getProductUnit(supply.product),
          supply.requestedQuantity || 0,
          supply.receivedQuantity || 0,
          supply.unitPrice || 0,
          supply.totalPrice || 0,
          supply.note || ''
        ]

        // Apply borders
        for (let col = 1; col <= 8; col++) {
          row.getCell(col).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
          row.getCell(col).alignment = { vertical: 'middle', horizontal: 'center' }
        }

        totalAmount += supply.totalPrice || 0
        totalItems++
        rowIndex++
      })

      // Add total row
      worksheet.mergeCells(`A${rowIndex}:C${rowIndex}`)
      worksheet.getCell(`A${rowIndex}`).value = `Tổng nhập: ${totalItems} mặt hàng`
      worksheet.getCell(`A${rowIndex}`).font = { bold: true }

      // Add total amount
      worksheet.mergeCells(`A${rowIndex + 1}:J${rowIndex + 1}`)
      worksheet.getCell(`A${rowIndex + 1}`).value = `Thành tiền: ${totalAmount.toLocaleString('vi-VN')} VNĐ`
      worksheet.getCell(`A${rowIndex + 1}`).font = { bold: true }

      // Add date row
      worksheet.mergeCells(`A${rowIndex + 2}:E${rowIndex + 2}`)
      worksheet.getCell(`A${rowIndex + 2}`).value = `Ngày giao nhận: ${group.date}`
      worksheet.getCell(`A${rowIndex + 2}`).font = { italic: true }

      worksheet.mergeCells(`F${rowIndex + 2}:J${rowIndex + 2}`)
      worksheet.getCell(`F${rowIndex + 2}`).value = `Ngày..... tháng..... năm 20....`
      worksheet.getCell(`F${rowIndex + 2}`).alignment = { horizontal: 'right' }
      worksheet.getCell(`F${rowIndex + 2}`).font = { italic: true }

      // Add signature row
      const signRow = rowIndex + 3
      worksheet.getCell(`A${signRow}`).value = 'Người viết phiếu'
      worksheet.getCell(`C${signRow}`).value = 'Người giao'
      worksheet.getCell(`F${signRow}`).value = 'Người nhận'
      worksheet.getCell(`I${signRow}`).value = 'Người duyệt'

      // Style signature row
      ['A', 'C', 'F', 'I'].forEach(col => {
        worksheet.getCell(`${col}${signRow}`).font = { bold: true }
        worksheet.getCell(`${col}${signRow}`).alignment = { horizontal: 'center' }
      })

      // Set column widths
      worksheet.getColumn(1).width = 5
      worksheet.getColumn(2).width = 35
      worksheet.getColumn(3).width = 10
      worksheet.getColumn(4).width = 12
      worksheet.getColumn(5).width = 12
      worksheet.getColumn(6).width = 12
      worksheet.getColumn(7).width = 15
      worksheet.getColumn(8).width = 20
    })

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=phieu-nhap-kho-${format(new Date(), 'dd-MM-yyyy')}.xlsx`
    )

    // Write to response
    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    console.error("Error exporting supplies:", error)
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xuất Excel"
    })
  }
}
