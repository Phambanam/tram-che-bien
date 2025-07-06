"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const category_controller_1 = require("../controllers/category.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// Public routes
router.get("/", category_controller_1.getCategories);
// Protected routes
router.use(auth_middleware_1.protect);
// Routes for admin and brigade assistant
router.post("/", (0, auth_middleware_1.authorize)("admin", "brigadeAssistant"), category_controller_1.createCategory);
router.get("/:id", category_controller_1.getCategoryById);
router.patch("/:id", (0, auth_middleware_1.authorize)("admin", "brigadeAssistant"), category_controller_1.updateCategory);
// Routes for admin only
router.delete("/:id", (0, auth_middleware_1.authorize)("admin"), category_controller_1.deleteCategory);
exports.default = router;
