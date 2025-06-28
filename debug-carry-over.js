// Debug script for Carry Over issue in Military Logistics System
// Investigating why 78kg tofu surplus on day 28 doesn't carry to day 29

const axios = require('axios');
const { format, subDays } = require('date-fns');

const BASE_URL = 'http://localhost:5001/api';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NWY5OGQyZDljMTdhOTRkYzZjYjliNCIsImlhdCI6MTc1MTExMTUwNSwiZXhwIjoxNzUxMTk3OTA1fQ.ilSCsFIYY-Wje_Tk-Xf5vL7wBLCOt4USKDDrkYLkUf0';

// Debug specific dates
const DAY_28 = '2025-06-28'; // Day with 78kg surplus
const DAY_29 = '2025-06-29'; // Day showing 0

async function debugCarryOver() {
  console.log('🔍 DEBUG: Carry Over Investigation');
  console.log('=====================================');
  console.log(`📅 Checking Day 28: ${DAY_28} (should have 78kg surplus)`);
  console.log(`📅 Checking Day 29: ${DAY_29} (should receive carry over)\n`);

  try {
    // Step 1: Check raw data for Day 28
    console.log('1️⃣ STEP 1: Raw data for Day 28');
    console.log('--------------------------------');
    
    const day28Response = await axios.get(`${BASE_URL}/processing-station/daily/${DAY_28}`, {
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    });
    
    console.log('Day 28 API Response:', {
      success: day28Response.status === 200,
      data: day28Response.data,
      hasData: !!day28Response.data,
      dataKeys: day28Response.data ? Object.keys(day28Response.data) : []
    });
    
    if (day28Response.data) {
      const day28Data = day28Response.data;
      console.log('Day 28 Detailed Data:', {
        tofuInput: day28Data.tofuInput,
        tofuOutput: day28Data.tofuOutput,
        tofuRemaining: day28Data.tofuInput - day28Data.tofuOutput,
        soybeanInput: day28Data.soybeanInput,
        note: day28Data.note,
        allFields: day28Data
      });
      
      const calculatedSurplus = day28Data.tofuInput - day28Data.tofuOutput;
      console.log(`\n📊 CALCULATION: ${day28Data.tofuInput} - ${day28Data.tofuOutput} = ${calculatedSurplus}kg surplus`);
      
      if (calculatedSurplus !== 78) {
        console.log(`⚠️  WARNING: Expected 78kg surplus but calculated ${calculatedSurplus}kg`);
      } else {
        console.log(`✅ CONFIRMED: 78kg surplus matches calculation`);
      }
    }

    console.log('\n');

    // Step 2: Check raw data for Day 29
    console.log('2️⃣ STEP 2: Raw data for Day 29');
    console.log('--------------------------------');
    
    try {
      const day29Response = await axios.get(`${BASE_URL}/processing-station/daily/${DAY_29}`, {
        headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
      });
      
      console.log('Day 29 API Response:', {
        success: day29Response.status === 200,
        data: day29Response.data,
        hasData: !!day29Response.data
      });
      
      if (day29Response.data) {
        console.log('Day 29 Data:', day29Response.data);
      }
    } catch (error) {
      console.log('Day 29 API Error:', error.response?.status, error.response?.data || error.message);
      if (error.response?.status === 404) {
        console.log('✅ Day 29 has no data yet (normal for carry over to create it)');
      }
    }

    console.log('\n');

    // Step 3: Test carry over logic manually
    console.log('3️⃣ STEP 3: Manual Carry Over Logic Test');
    console.log('----------------------------------------');
    
    if (day28Response.data) {
      const previousTofuInput = day28Response.data.tofuInput || 0;
      const previousTofuOutput = day28Response.data.tofuOutput || 0;
      const carryOverAmount = Math.max(0, previousTofuInput - previousTofuOutput);
      
      console.log('Manual Carry Over Calculation:', {
        previousTofuInput,
        previousTofuOutput,
        carryOverAmount,
        formula: `Math.max(0, ${previousTofuInput} - ${previousTofuOutput}) = ${carryOverAmount}`
      });
      
      if (carryOverAmount > 0) {
        console.log(`✅ SHOULD CARRY OVER: ${carryOverAmount}kg to Day 29`);
        
        // Test if carry over would work
        const carryOverNote = `📦 Chuyển từ ${format(new Date(DAY_28), "dd/MM/yyyy")}: +${carryOverAmount}kg đậu phụ`;
        console.log('Generated carry over note:', carryOverNote);
      } else {
        console.log(`❌ NO CARRY OVER: ${carryOverAmount}kg (≤ 0)`);
      }
    }

    console.log('\n');

    // Step 4: Check API endpoints being used
    console.log('4️⃣ STEP 4: API Endpoint Verification');
    console.log('--------------------------------------');
    
    console.log('Endpoints being tested:');
    console.log(`- Day 28: GET ${BASE_URL}/processing-station/daily/${DAY_28}`);
    console.log(`- Day 29: GET ${BASE_URL}/processing-station/daily/${DAY_29}`);
    
    // Test alternative endpoints
    console.log('\nTesting alternative endpoints...');
    
    try {
      const altResponse = await axios.get(`${BASE_URL}/processing-station/sausage/${DAY_28}`, {
        headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
      });
      console.log('Alternative sausage endpoint works:', !!altResponse.data);
    } catch (error) {
      console.log('Alternative sausage endpoint error:', error.response?.status);
    }

    console.log('\n');

    // Step 5: Check database collections (if possible)
    console.log('5️⃣ STEP 5: Database Collection Check');
    console.log('-------------------------------------');
    
    console.log('Expected database collections:');
    console.log('- dailyTofuProcessing (specific)');
    console.log('- processingStation (generic)');
    console.log('- Any collection with tofu data');
    
    console.log('\n');

    // Step 6: Frontend logic simulation
    console.log('6️⃣ STEP 6: Frontend Logic Simulation');
    console.log('-------------------------------------');
    
    if (day28Response.data) {
      // Simulate frontend fetchDailyTofuProcessing logic
      const previousStationResponse = { data: day28Response.data };
      const previousTofuInput = previousStationResponse.data.tofuInput || 0;
      const previousTofuOutput = previousStationResponse.data.tofuOutput || 0;
      const carryOverAmount = Math.max(0, previousTofuInput - previousTofuOutput);
      
      console.log('Frontend Logic Simulation:', {
        step1: 'Getting previous day data',
        step2: `Previous tofu input: ${previousTofuInput}`,
        step3: `Previous tofu output: ${previousTofuOutput}`,
        step4: `Carry over calculation: Math.max(0, ${previousTofuInput} - ${previousTofuOutput})`,
        step5: `Final carry over amount: ${carryOverAmount}kg`,
        shouldWork: carryOverAmount > 0
      });
      
      if (carryOverAmount > 0) {
        // Simulate what Day 29 data should look like
        const day29SimulatedData = {
          tofuInput: carryOverAmount, // Should be 78
          note: `📦 Chuyển từ ${format(new Date(DAY_28), "dd/MM/yyyy")}: +${carryOverAmount}kg đậu phụ`,
          soybeanInput: 0,
          tofuOutput: 0, // From planned outputs
          tofuRemaining: carryOverAmount
        };
        
        console.log('\nDay 29 SHOULD show:', day29SimulatedData);
      }
    }

    console.log('\n');
    console.log('🎯 SUMMARY & RECOMMENDATIONS:');
    console.log('===============================');
    
    if (!day28Response.data || (day28Response.data.tofuInput - day28Response.data.tofuOutput) <= 0) {
      console.log('❌ ISSUE: Day 28 has no surplus data or incorrect calculation');
      console.log('   - Check if data was saved correctly');
      console.log('   - Verify field names (tofuInput, tofuOutput)');
      console.log('   - Check database collection');
    } else {
      console.log('✅ Day 28 data looks correct');
      console.log('❌ POSSIBLE ISSUES:');
      console.log('   - Frontend carry over logic not running');
      console.log('   - API endpoint mismatch');
      console.log('   - Date format issues');
      console.log('   - Console errors in browser');
    }
    
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Open browser F12 → Console');
    console.log('2. Go to Tofu processing tab');
    console.log('3. Look for these logs:');
    console.log('   🔄 Checking tofu carry over from 2025-06-28 to 2025-06-29');
    console.log('   ✅ Tofu carry over found: XXkg from 2025-06-28');
    console.log('4. If no logs, carry over logic is not running');
    console.log('5. If logs show 0kg, API data is wrong');

  } catch (error) {
    console.error('❌ Debug script failed:', error.response?.data || error.message);
  }
}

// Run the debug
debugCarryOver();

module.exports = { debugCarryOver }; 