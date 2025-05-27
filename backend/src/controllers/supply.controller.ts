import type { Request, Response } from "express"
import { ObjectId } from "mongodb"
import { getDb } from "../config/database"
import { AppError } from "../middleware/error.middleware"

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
    const { unit, category, status, fromDate, toDate } = req.query

    const db = await getDb()

    // Build query based on role and filters
    const query: any = {}

    // Unit assistants can only see their own unit's supplies
    if (req.user!.role === "unitAssistant") {
      query.unit = new ObjectId(req.user!.unit)
    }
    // Filter by unit if specified
    else if (unit && ObjectId.isValid(unit as string)) {
      query.unit = new ObjectId(unit as string)
    }

    // Filter by category if specified
    if (category) {
      query.category = category
    }

    // Filter by status if specified
    if (status) {
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

    // Get supplies with related information
    const supplies = await db
      .collection("supplies")
      .aggregate([
        {
          $match: query,
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
            expectedQuantity: 1,
            expectedHarvestDate: 1,
            stationEntryDate: 1,
            requiredQuantity: 1,
            actualQuantity: 1,
            price: 1,
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

    res.status(200).json(supplies)
  } catch (error) {
    console.error("Error fetching supplies:", error)
    throw new AppError("Đã xảy ra lỗi khi lấy danh sách nguồn nhập", 500)
  }
}

// @desc    Create new supply
// @route   POST /api/supplies
// @access  Private (Unit Assistant, Admin)
export const createSupply = async (req: Request, res: Response) => {
  try {
    const { unit, category, product, expectedQuantity, expectedHarvestDate, note } = req.body

    // Validate input
    if (!category || !product || !expectedQuantity || !expectedHarvestDate) {
      throw new AppError("Vui lòng điền đầy đủ thông tin", 400)
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

    const db = await getDb()

    // Determine unit based on role
    let unitId = null
    if (req.user!.role === "unitAssistant") {
      unitId = new ObjectId(req.user!.unit)
    } else if (req.user!.role === "admin") {
      // Admin needs to specify unit
      if (!unit || !ObjectId.isValid(unit)) {
        throw new AppError("Vui lòng chọn đơn vị", 400)
      }
      unitId = new ObjectId(unit)
    }

    // Create new supply
    const result = await db.collection("supplies").insertOne({
      unit: unitId,
      category,
      product,
      expectedQuantity: Number(expectedQuantity),
      expectedHarvestDate: new Date(expectedHarvestDate),
      stationEntryDate: null,
      requiredQuantity: null,
      actualQuantity: null,
      price: null,
      totalPrice: null,
      expiryDate: null,
      status: "pending",
      note: note || "",
      createdBy: new ObjectId(req.user!.id),
      approvedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    res.status(201).json({
      success: true,
      message: "Thêm nguồn nhập thành công",
      data: { supplyId: result.insertedId.toString() },
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
            expectedQuantity: 1,
            expectedHarvestDate: 1,
            stationEntryDate: 1,
            requiredQuantity: 1,
            actualQuantity: 1,
            price: 1,
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
// @access  Private (Unit Assistant for own supplies, Admin for all)
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

    // Check permissions based on role and supply status
    if (req.user!.role === "unitAssistant") {
      // Unit assistants can only update their own supplies in pending status
      if (currentSupply.unit.toString() !== req.user!.unit) {
        throw new AppError("Bạn không có quyền cập nhật nguồn nhập này", 403)
      }

      if (currentSupply.status !== "pending") {
        throw new AppError("Chỉ có thể chỉnh sửa nguồn nhập ở trạng thái chờ phê duyệt", 400)
      }

      const { category, product, expectedQuantity, expectedHarvestDate, note } = req.body

      // Validate input
      if (!category || !product || !expectedQuantity || !expectedHarvestDate) {
        throw new AppError("Vui lòng điền đầy đủ thông tin", 400)
      }

      // Update supply
      const result = await db.collection("supplies").updateOne(
        { _id: new ObjectId(supplyId) },
        {
          $set: {
            category,
            product,
            expectedQuantity: Number(expectedQuantity),
            expectedHarvestDate: new Date(expectedHarvestDate),
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
    } else if (req.user!.role === "brigadeAssistant" || req.user!.role === "admin") {
      // Brigade assistants and admin can approve supplies
      const { stationEntryDate, requiredQuantity, actualQuantity, price, expiryDate, note, status } = req.body

      if (status === "approved") {
        // Validate input for approval
        if (
          !stationEntryDate ||
          requiredQuantity === undefined ||
          actualQuantity === undefined ||
          !price ||
          !expiryDate
        ) {
          throw new AppError("Vui lòng điền đầy đủ thông tin phê duyệt", 400)
        }

        const totalPrice = Number(actualQuantity) * Number(price)

        // Update supply with approval information
        const result = await db.collection("supplies").updateOne(
          { _id: new ObjectId(supplyId) },
          {
            $set: {
              stationEntryDate: new Date(stationEntryDate),
              requiredQuantity: Number(requiredQuantity),
              actualQuantity: Number(actualQuantity),
              price: Number(price),
              totalPrice,
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
          message: "Phê duyệt nguồn nhập thành công",
        })
      } else if (status === "rejected") {
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
      } else {
        throw new AppError("Trạng thái không hợp lệ", 400)
      }
    } else {
      throw new AppError("Bạn không có quyền cập nhật nguồn nhập", 403)
    }
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
// @access  Private (Brigade Assistant, Admin)
export const approveSupply = async (req: Request, res: Response) => {
  try {
    const supplyId = req.params.id
    const { stationEntryDate, requiredQuantity, actualQuantity, price, expiryDate, note } = req.body

    // Validate ObjectId
    if (!ObjectId.isValid(supplyId)) {
      throw new AppError("ID nguồn nhập không hợp lệ", 400)
    }

    // Validate input
    if (!stationEntryDate || requiredQuantity === undefined || actualQuantity === undefined || !price || !expiryDate) {
      throw new AppError("Vui lòng điền đầy đủ thông tin phê duyệt", 400)
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

    const totalPrice = Number(actualQuantity) * Number(price)

    // Update supply with approval information
    const result = await db.collection("supplies").updateOne(
      { _id: new ObjectId(supplyId) },
      {
        $set: {
          stationEntryDate: new Date(stationEntryDate),
          requiredQuantity: Number(requiredQuantity),
          actualQuantity: Number(actualQuantity),
          price: Number(price),
          totalPrice,
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
      message: "Phê duyệt nguồn nhập thành công",
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    console.error("Error approving supply:", error)
    throw new AppError("Đã xảy ra lỗi khi phê duyệt nguồn nhập", 500)
  }
}

// @desc    Delete supply (soft delete)
// @route   DELETE /api/supplies/:id
// @access  Private (Unit Assistant for own supplies, Admin for all)
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

    // Check permissions
    if (req.user!.role === "unitAssistant") {
      // Unit assistants can only delete their own supplies in pending status
      if (currentSupply.unit.toString() !== req.user!.unit) {
        throw new AppError("Bạn không có quyền xóa nguồn nhập này", 403)
      }

      if (currentSupply.status !== "pending") {
        throw new AppError("Chỉ có thể xóa nguồn nhập ở trạng thái chờ phê duyệt", 400)
      }
    } else if (req.user!.role !== "admin") {
      throw new AppError("Bạn không có quyền xóa nguồn nhập", 403)
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
