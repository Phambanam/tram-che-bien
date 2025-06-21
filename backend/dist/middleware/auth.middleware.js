"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongodb_1 = require("mongodb");
const database_1 = require("../config/database");
const protect = async (req, res, next) => {
    try {
        let token;
        // Check if token exists in headers
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }
        // Check if token exists
        if (!token) {
            return res.status(401).json({ message: "Unauthorized - No token provided" });
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Get user from database
        const db = await (0, database_1.getDb)();
        const user = await db.collection("users").findOne({ _id: new mongodb_1.ObjectId(decoded.id) });
        if (!user) {
            return res.status(401).json({ message: "Unauthorized - User not found" });
        }
        // Check if user is active
        if (user.status !== "active") {
            return res.status(401).json({ message: "Unauthorized - Account is not active" });
        }
        // Set user in request
        req.user = {
            id: user._id.toString(),
            role: user.role,
            unit: user.unit.toString(),
        };
        next();
    }
    catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }
};
exports.protect = protect;
// Middleware to restrict access based on roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized - User not authenticated" });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden - Not authorized to access this resource" });
        }
        next();
    };
};
exports.authorize = authorize;
