"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const role_controller_1 = require("../controllers/role.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// All routes are protected and admin-only
router.use(auth_middleware_1.protect, (0, auth_middleware_1.authorize)("admin"));
router.get("/", role_controller_1.getRoles);
router.get("/:roleId/users", role_controller_1.getUsersByRole);
router.patch("/users/:id", role_controller_1.updateUserRole);
exports.default = router;
