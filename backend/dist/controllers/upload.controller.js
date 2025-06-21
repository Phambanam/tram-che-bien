"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.uploadFile = void 0;
const path_1 = __importDefault(require("path"));
const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }
        const file = req.file;
        const fileType = file.mimetype.startsWith('image/') ? 'image' : 'video';
        const relativePath = path_1.default.join('uploads', fileType === 'image' ? 'images' : 'videos', file.filename);
        // URL để truy cập file
        const fileUrl = `${req.protocol}://${req.get('host')}/${relativePath}`;
        res.json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                filename: file.filename,
                originalName: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                url: fileUrl,
                type: fileType
            }
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload file',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.uploadFile = uploadFile;
const deleteFile = async (req, res) => {
    try {
        const { filename } = req.params;
        const fs = require('fs');
        const path = require('path');
        // Tìm file trong cả 2 thư mục images và videos
        const uploadsDir = path.join(__dirname, '../../uploads');
        const imagePath = path.join(uploadsDir, 'images', filename);
        const videoPath = path.join(uploadsDir, 'videos', filename);
        let deleted = false;
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            deleted = true;
        }
        else if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
            deleted = true;
        }
        if (deleted) {
            res.json({
                success: true,
                message: 'File deleted successfully'
            });
        }
        else {
            res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }
    }
    catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete file',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.deleteFile = deleteFile;
