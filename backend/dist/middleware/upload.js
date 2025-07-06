"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMultiple = exports.uploadSingle = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Tạo thư mục uploads nếu chưa tồn tại
const uploadsDir = path_1.default.join(__dirname, '../../uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
const imagesDir = path_1.default.join(uploadsDir, 'images');
const videosDir = path_1.default.join(uploadsDir, 'videos');
if (!fs_1.default.existsSync(imagesDir)) {
    fs_1.default.mkdirSync(imagesDir, { recursive: true });
}
if (!fs_1.default.existsSync(videosDir)) {
    fs_1.default.mkdirSync(videosDir, { recursive: true });
}
// Cấu hình storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, imagesDir);
        }
        else if (file.mimetype.startsWith('video/')) {
            cb(null, videosDir);
        }
        else {
            cb(new Error('Invalid file type'), '');
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path_1.default.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});
// File filter
const fileFilter = (req, file, cb) => {
    // Kiểm tra loại file
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
    }
    else {
        cb(new Error('Only image and video files are allowed!'));
    }
};
// Cấu hình multer
const upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
});
exports.uploadSingle = upload.single('file');
exports.uploadMultiple = upload.array('files', 5);
exports.default = upload;
