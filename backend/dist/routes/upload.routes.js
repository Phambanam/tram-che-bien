"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const upload_controller_1 = require("../controllers/upload.controller");
const upload_1 = require("../middleware/upload");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// Upload single file (image or video)
router.post("/file", auth_middleware_1.protect, upload_1.uploadSingle, upload_controller_1.uploadFile);
// Delete file
router.delete("/file/:filename", auth_middleware_1.protect, upload_controller_1.deleteFile);
exports.default = router;
