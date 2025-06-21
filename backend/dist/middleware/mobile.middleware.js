"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectMobileClient = void 0;
// @desc    Detect if request is coming from a mobile device
// @usage   Use as middleware in routes
const detectMobileClient = (req, res, next) => {
    // Check user agent for mobile device signatures
    const userAgent = req.headers["user-agent"] || "";
    const isMobile = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent);
    // Add isMobile flag to request object for use in controllers
    req.isMobile = isMobile;
    next();
};
exports.detectMobileClient = detectMobileClient;
