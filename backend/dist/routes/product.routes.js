"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const product_controller_1 = require("../controllers/product.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// Public routes
router.get("/", product_controller_1.getProducts);
// Protected routes
router.use(auth_middleware_1.protect);
// Routes for admin and brigade assistant
router.post("/", (0, auth_middleware_1.authorize)("admin", "brigadeAssistant"), product_controller_1.createProduct);
router.get("/:id", product_controller_1.getProductById);
router.patch("/:id", (0, auth_middleware_1.authorize)("admin", "brigadeAssistant"), product_controller_1.updateProduct);
// Routes for admin only
router.delete("/:id", (0, auth_middleware_1.authorize)("admin"), product_controller_1.deleteProduct);
exports.default = router;
