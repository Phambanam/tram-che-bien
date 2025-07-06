"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchUpdatePersonnel = exports.updatePersonnelForDate = exports.getPersonnelByWeek = void 0;
const models_1 = require("../models");
const mongoose_1 = __importDefault(require("mongoose"));
// Get personnel data for a specific week
const getPersonnelByWeek = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'startDate and endDate are required'
            });
        }
        const personnelData = await models_1.UnitPersonnelDaily.find({
            date: {
                $gte: startDate,
                $lte: endDate
            }
        });
        // Transform data to the format frontend expects
        const personnelByDay = {};
        personnelData.forEach((item) => {
            if (!personnelByDay[item.date]) {
                personnelByDay[item.date] = {};
            }
            // Use unitId directly as string, don't populate
            personnelByDay[item.date][item.unitId.toString()] = item.personnel;
        });
        res.json({
            success: true,
            data: personnelByDay
        });
    }
    catch (error) {
        console.error('Error fetching personnel data:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching personnel data',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};
exports.getPersonnelByWeek = getPersonnelByWeek;
// Update personnel count for a specific unit on a specific date
const updatePersonnelForDate = async (req, res) => {
    try {
        const { unitId, date, personnel } = req.body;
        if (!unitId || !date || personnel === undefined) {
            return res.status(400).json({
                success: false,
                message: 'unitId, date, and personnel are required'
            });
        }
        // Validate ObjectId
        if (!mongoose_1.default.Types.ObjectId.isValid(unitId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid unitId format'
            });
        }
        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format. Use YYYY-MM-DD'
            });
        }
        // Validate personnel number
        if (typeof personnel !== 'number' || personnel < 0) {
            return res.status(400).json({
                success: false,
                message: 'Personnel must be a non-negative number'
            });
        }
        // Use upsert to create or update the record
        const updatedPersonnel = await models_1.UnitPersonnelDaily.findOneAndUpdate({ unitId, date }, { unitId, date, personnel }, {
            new: true,
            upsert: true,
            runValidators: true
        }).populate('unitId', 'name code');
        res.json({
            success: true,
            message: 'Personnel count updated successfully',
            data: updatedPersonnel
        });
    }
    catch (error) {
        console.error('Error updating personnel data:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating personnel data',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};
exports.updatePersonnelForDate = updatePersonnelForDate;
// Batch update personnel for multiple units/dates
const batchUpdatePersonnel = async (req, res) => {
    try {
        const { updates } = req.body;
        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'updates array is required and must not be empty'
            });
        }
        const results = [];
        for (const update of updates) {
            const { unitId, date, personnel } = update;
            if (!unitId || !date || personnel === undefined) {
                continue; // Skip invalid entries
            }
            try {
                const result = await models_1.UnitPersonnelDaily.findOneAndUpdate({ unitId, date }, { unitId, date, personnel }, {
                    new: true,
                    upsert: true,
                    runValidators: true
                });
                results.push(result);
            }
            catch (error) {
                console.error(`Error updating personnel for ${unitId} on ${date}:`, error);
            }
        }
        res.json({
            success: true,
            message: `Successfully updated ${results.length} personnel records`,
            data: results
        });
    }
    catch (error) {
        console.error('Error batch updating personnel data:', error);
        res.status(500).json({
            success: false,
            message: 'Error batch updating personnel data',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};
exports.batchUpdatePersonnel = batchUpdatePersonnel;
