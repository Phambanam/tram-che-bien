"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonthlyPoultrySummary = exports.getWeeklyPoultryTracking = void 0;
// Helper function to get poultry processing data for a specific date
async function getPoultryProcessingData(db, dateStr) {
    try {
        const data = await db.collection("dailyPoultryProcessing").findOne({ date: dateStr });
        if (!data) {
            // Return default/fallback data if no data exists
            return {
                livePoultryInput: 0,
                poultryMeatOutput: 0,
                poultryMeatActualOutput: 0,
                poultryMeatRemaining: 0,
                note: "",
                livePoultryPrice: 60000,
                poultryMeatPrice: 150000
            };
        }
        return {
            livePoultryInput: data.livePoultryInput || 0,
            poultryMeatOutput: data.poultryMeatOutput || 0,
            poultryMeatActualOutput: data.poultryMeatActualOutput || 0,
            poultryMeatRemaining: Math.max(0, (data.poultryMeatOutput || 0) - (data.poultryMeatActualOutput || 0)),
            note: data.note || "",
            livePoultryPrice: data.livePoultryPrice || 60000,
            poultryMeatPrice: data.poultryMeatPrice || 150000
        };
    }
    catch (error) {
        console.log(`No poultry processing data for ${dateStr}`);
        return {
            livePoultryInput: 0,
            poultryMeatOutput: 0,
            poultryMeatActualOutput: 0,
            poultryMeatRemaining: 0,
            note: "",
            livePoultryPrice: 60000,
            poultryMeatPrice: 150000
        };
    }
}
// Helper function to get monthly poultry processing data
async function getMonthlyPoultryProcessingData(db, year, month) {
    try {
        // Get start and end dates for the month
        const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];
        // Aggregate data from daily poultry processing records
        const monthlyData = await db.collection("dailyPoultryProcessing")
            .aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalLivePoultryInput: { $sum: "$livePoultryInput" },
                    totalPoultryMeatOutput: { $sum: "$poultryMeatOutput" },
                    totalPoultryMeatActualOutput: { $sum: "$poultryMeatActualOutput" },
                    avgLivePoultryPrice: { $avg: "$livePoultryPrice" },
                    avgPoultryMeatPrice: { $avg: "$poultryMeatPrice" },
                    count: { $sum: 1 }
                }
            }
        ])
            .toArray();
        if (monthlyData.length > 0) {
            const data = monthlyData[0];
            return {
                totalLivePoultryInput: data.totalLivePoultryInput || 0,
                totalPoultryMeatOutput: data.totalPoultryMeatOutput || 0,
                totalPoultryMeatActualOutput: data.totalPoultryMeatActualOutput || 0,
                totalPoultryMeatRemaining: Math.max(0, (data.totalPoultryMeatOutput || 0) - (data.totalPoultryMeatActualOutput || 0)),
                avgLivePoultryPrice: Math.round(data.avgLivePoultryPrice || 60000),
                avgPoultryMeatPrice: Math.round(data.avgPoultryMeatPrice || 150000),
                processingEfficiency: data.totalLivePoultryInput > 0
                    ? Math.round((data.totalPoultryMeatOutput / data.totalLivePoultryInput) * 100)
                    : 95
            };
        }
        // If no real data, return zeros instead of fake data
        return {
            totalLivePoultryInput: 0,
            totalPoultryMeatOutput: 0,
            totalPoultryMeatActualOutput: 0,
            totalPoultryMeatRemaining: 0,
            avgLivePoultryPrice: 60000,
            avgPoultryMeatPrice: 150000,
            processingEfficiency: 0
        };
    }
    catch (error) {
        console.error(`Error getting monthly poultry data for ${year}-${month}:`, error);
        return {
            totalLivePoultryInput: 0,
            totalPoultryMeatOutput: 0,
            totalPoultryMeatActualOutput: 0,
            totalPoultryMeatRemaining: 0,
            avgLivePoultryPrice: 60000,
            avgPoultryMeatPrice: 150000,
            processingEfficiency: 0
        };
    }
}
// @desc    Get weekly poultry tracking data
// @route   GET /api/processing-station/poultry/weekly-tracking
// @access  Private
const getWeeklyPoultryTracking = async (req, res) => {
    try {
        const { week, year } = req.query;
        if (!week || !year) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng cung cấp week và year"
            });
        }
        const weekNum = parseInt(week);
        const yearNum = parseInt(year);
        if (weekNum < 1 || weekNum > 53 || yearNum < 2020 || yearNum > 2030) {
            return res.status(400).json({
                success: false,
                message: "Week phải từ 1-53, year phải từ 2020-2030"
            });
        }
        const db = await getDb();
        // Calculate dates for the week
        const weekDates = getWeekDates(weekNum, yearNum);
        const weeklyData = [];
        if (!db) {
            return res.status(500).json({ error: 'Database connection not available' });
        }
        // Lấy tồn cuối ngày trước tuần (nếu có)
        const prevDate = new Date(weekDates[0]);
        prevDate.setDate(prevDate.getDate() - 1);
        const prevDateStr = prevDate.toISOString().split('T')[0];
        const prevData = await getPoultryProcessingData(db, prevDateStr);
        let lastPoultryMeatRemain = prevData.poultryMeatRemaining || 0;
        for (const date of weekDates) {
            const dateStr = date.toISOString().split('T')[0];
            // Get poultry processing data
            const processingData = await getPoultryProcessingData(db, dateStr);
            // Tồn đầu ngày = tồn cuối ngày trước
            const poultryMeatBegin = lastPoultryMeatRemain;
            // Tồn cuối ngày = tồn đầu + thu - xuất
            const poultryMeatEnd = poultryMeatBegin + (processingData.poultryMeatOutput || 0) - (processingData.poultryMeatActualOutput || 0);
            // Lưu lại cho ngày sau
            lastPoultryMeatRemain = poultryMeatEnd;
            weeklyData.push({
                date: dateStr,
                dayOfWeek: getDayNameVi(date.getDay()),
                livePoultryInput: processingData.livePoultryInput || 0,
                poultryMeatOutput: processingData.poultryMeatOutput || 0,
                poultryMeatActualOutput: processingData.poultryMeatActualOutput || 0,
                poultryMeatBegin,
                poultryMeatEnd,
                note: processingData.note || "",
                livePoultryPrice: processingData.livePoultryPrice || 60000,
                poultryMeatPrice: processingData.poultryMeatPrice || 150000
            });
        }
        // Tổng hợp tuần
        const weeklyTotals = {
            totalLivePoultryInput: weeklyData.reduce((sum, day) => sum + day.livePoultryInput, 0),
            totalPoultryMeatOutput: weeklyData.reduce((sum, day) => sum + day.poultryMeatOutput, 0),
            totalPoultryMeatActualOutput: weeklyData.reduce((sum, day) => sum + day.poultryMeatActualOutput, 0),
            totalPoultryMeatBegin: weeklyData[0]?.poultryMeatBegin || 0,
            totalPoultryMeatEnd: weeklyData[weeklyData.length - 1]?.poultryMeatEnd || 0,
            avgLivePoultryPrice: Math.round(weeklyData.reduce((sum, day) => sum + day.livePoultryPrice, 0) / weeklyData.length),
            avgPoultryMeatPrice: Math.round(weeklyData.reduce((sum, day) => sum + day.poultryMeatPrice, 0) / weeklyData.length)
        };
        res.json({
            success: true,
            data: {
                week: weekNum,
                year: yearNum,
                weekDates: weekDates.map(d => d.toISOString().split('T')[0]),
                dailyData: weeklyData,
                totals: weeklyTotals
            }
        });
    }
    catch (error) {
        console.error('Error getting weekly poultry tracking:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi lấy dữ liệu theo dõi tuần"
        });
    }
};
exports.getWeeklyPoultryTracking = getWeeklyPoultryTracking;
// @desc    Get monthly poultry summary
// @route   GET /api/processing-station/poultry/monthly-summary
// @access  Private
const getMonthlyPoultrySummary = async (req, res) => {
    try {
        const { month, year, monthCount = 6 } = req.query;
        if (!month || !year) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng cung cấp month và year"
            });
        }
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        const monthCountNum = parseInt(monthCount);
        if (monthNum < 1 || monthNum > 12 || yearNum < 2020 || yearNum > 2030) {
            return res.status(400).json({
                success: false,
                message: "Month phải từ 1-12, year phải từ 2020-2030"
            });
        }
        const db = await getDb();
        const monthlySummaries = [];
        // Generate data for the requested number of months ending with the specified month
        for (let i = monthCountNum - 1; i >= 0; i--) {
            const targetDate = new Date(yearNum, monthNum - 1 - i, 1);
            const targetMonth = targetDate.getMonth() + 1;
            const targetYear = targetDate.getFullYear();
            try {
                // Get monthly data
                const monthlyData = await getMonthlyPoultryProcessingData(db, targetYear, targetMonth);
                // Lấy tồn cuối ngày trước tháng
                const prevDate = new Date(targetYear, targetMonth - 1, 1);
                prevDate.setDate(prevDate.getDate() - 1);
                const prevDateStr = prevDate.toISOString().split('T')[0];
                const prevData = await getPoultryProcessingData(db, prevDateStr);
                const poultryMeatBegin = prevData.poultryMeatRemaining || 0;
                // Lấy tồn cuối ngày cuối tháng
                const endDate = new Date(targetYear, targetMonth, 0);
                const endDateStr = endDate.toISOString().split('T')[0];
                const endData = await getPoultryProcessingData(db, endDateStr);
                const poultryMeatEnd = endData.poultryMeatRemaining || 0;
                const summary = {
                    month: `${targetMonth.toString().padStart(2, '0')}/${targetYear}`,
                    year: targetYear,
                    monthNumber: targetMonth,
                    totalLivePoultryInput: monthlyData.totalLivePoultryInput,
                    totalPoultryMeatOutput: monthlyData.totalPoultryMeatOutput,
                    totalPoultryMeatActualOutput: monthlyData.totalPoultryMeatActualOutput,
                    poultryMeatBegin,
                    poultryMeatEnd,
                    processingEfficiency: monthlyData.processingEfficiency,
                    avgLivePoultryPrice: monthlyData.avgLivePoultryPrice,
                    avgPoultryMeatPrice: monthlyData.avgPoultryMeatPrice,
                    // Financial calculations (in thousands VND)
                    totalRevenue: Math.round(monthlyData.totalPoultryMeatActualOutput * monthlyData.avgPoultryMeatPrice / 1000),
                    poultryCost: Math.round(monthlyData.totalLivePoultryInput * monthlyData.avgLivePoultryPrice / 1000),
                    otherCosts: Math.round(monthlyData.totalLivePoultryInput * monthlyData.avgLivePoultryPrice * 0.05 / 1000), // 5% other costs
                    netProfit: 0 // Will calculate below
                };
                // Calculate net profit
                summary.netProfit = summary.totalRevenue - (summary.poultryCost + summary.otherCosts);
                monthlySummaries.push(summary);
            }
            catch (error) {
                console.error(`Error getting data for ${targetMonth}/${targetYear}:`, error);
                // Push zeros instead of fake data when error occurs
                monthlySummaries.push({
                    month: `${targetMonth.toString().padStart(2, '0')}/${targetYear}`,
                    year: targetYear,
                    monthNumber: targetMonth,
                    totalLivePoultryInput: 0,
                    totalPoultryMeatOutput: 0,
                    totalPoultryMeatActualOutput: 0,
                    poultryMeatBegin: 0,
                    poultryMeatEnd: 0,
                    processingEfficiency: 0,
                    avgLivePoultryPrice: 60000,
                    avgPoultryMeatPrice: 150000,
                    totalRevenue: 0,
                    poultryCost: 0,
                    otherCosts: 0,
                    netProfit: 0
                });
            }
        }
        res.json({
            success: true,
            data: {
                targetMonth: monthNum,
                targetYear: yearNum,
                monthCount: monthCountNum,
                monthlySummaries
            }
        });
    }
    catch (error) {
        console.error('Error getting monthly poultry summary:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi lấy tổng hợp tháng"
        });
    }
};
exports.getMonthlyPoultrySummary = getMonthlyPoultrySummary;
