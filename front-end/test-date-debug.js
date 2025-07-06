// Test date logic - Chạy trong browser console
console.log("🔍 TESTING DATE LOGIC");

// Test getDayNameForWeekPosition function
function getDayNameForWeekPosition(index) {
  const dayNames = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
  return dayNames[index] || "Không xác định";
}

// Test for today (Sunday 06/07)
console.log("Position 0 (Monday):", getDayNameForWeekPosition(0));
console.log("Position 1 (Tuesday):", getDayNameForWeekPosition(1));
console.log("Position 2 (Wednesday):", getDayNameForWeekPosition(2));
console.log("Position 3 (Thursday):", getDayNameForWeekPosition(3));
console.log("Position 4 (Friday):", getDayNameForWeekPosition(4));
console.log("Position 5 (Saturday):", getDayNameForWeekPosition(5));
console.log("Position 6 (Sunday - TODAY):", getDayNameForWeekPosition(6));

console.log("👆 06/07 (Chủ nhật) should be at position 6 and show 'Chủ nhật'");

// If 06/07 shows as "Thứ 2", it means the data is at position 0
// This indicates the dates array is wrong or the rendering is using wrong index 