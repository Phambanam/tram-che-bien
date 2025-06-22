"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.comparePassword = exports.hashPassword = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Hash password
const hashPassword = async (password) => {
    const salt = await bcryptjs_1.default.genSalt(12);
    return bcryptjs_1.default.hash(password, salt);
};
exports.hashPassword = hashPassword;
// Compare password
const comparePassword = async (password, hashedPassword) => {
    return bcryptjs_1.default.compare(password, hashedPassword);
};
exports.comparePassword = comparePassword;
// Generate JWT token
const generateToken = (id) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not defined");
    }
    const options = {
        expiresIn: process.env.JWT_EXPIRE || "1d",
    };
    return jsonwebtoken_1.default.sign({ id }, secret, options);
};
exports.generateToken = generateToken;
