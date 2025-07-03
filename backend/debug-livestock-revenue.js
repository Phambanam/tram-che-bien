const { MongoClient } = require('mongodb');

async function debugLivestockRevenue() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('military-logistics');
    
    console.log('🔍 Checking livestock data for 2025-07-03...\n');
    
    // Get daily livestock processing data for 3/7/2025
    const dailyData = await db.collection('dailyLivestockProcessing').findOne({
      date: '2025-07-03'
    });
    
    if (!dailyData) {
      console.log('❌ No daily livestock data found for 2025-07-03');
      return;
    }
    
    console.log('📊 Daily livestock data for 2025-07-03:');
    console.log('- Live animals input:', dailyData.liveAnimalsInput || 0, 'kg');
    console.log('- Lean meat output:', dailyData.leanMeatOutput || 0, 'kg');
    console.log('- Bone output:', dailyData.boneOutput || 0, 'kg');
    console.log('- Ground meat output:', dailyData.groundMeatOutput || 0, 'kg');
    console.log('- Organs output:', dailyData.organsOutput || 0, 'kg');
    console.log('\n💰 Prices:');
    console.log('- Live animal price:', dailyData.liveAnimalPrice || 0, 'VND/kg');
    console.log('- Lean meat price:', dailyData.leanMeatPrice || 0, 'VND/kg');
    console.log('- Bone price:', dailyData.bonePrice || 0, 'VND/kg');
    console.log('- Ground meat price:', dailyData.groundMeatPrice || 0, 'VND/kg');
    console.log('- Organs price:', dailyData.organsPrice || 0, 'VND/kg');
    
    console.log('\n🧮 Revenue calculations:');
    const leanMeatRevenue = (dailyData.leanMeatOutput || 0) * (dailyData.leanMeatPrice || 0);
    const boneRevenue = (dailyData.boneOutput || 0) * (dailyData.bonePrice || 0);
    const groundMeatRevenue = (dailyData.groundMeatOutput || 0) * (dailyData.groundMeatPrice || 0);
    const organsRevenue = (dailyData.organsOutput || 0) * (dailyData.organsPrice || 0);
    const totalRevenue = leanMeatRevenue + boneRevenue + groundMeatRevenue + organsRevenue;
    
    console.log('- Lean meat revenue:', leanMeatRevenue.toLocaleString('vi-VN'), 'VND');
    console.log('- Bone revenue:', boneRevenue.toLocaleString('vi-VN'), 'VND');
    console.log('- Ground meat revenue:', groundMeatRevenue.toLocaleString('vi-VN'), 'VND');
    console.log('- Organs revenue:', organsRevenue.toLocaleString('vi-VN'), 'VND');
    console.log('- Total revenue:', totalRevenue.toLocaleString('vi-VN'), 'VND');
    
    console.log('\n🏢 Backend monthly aggregation for July 2025:');
    
    // Test backend aggregation logic
    const monthlyData = await db.collection('dailyLivestockProcessing')
      .aggregate([
        {
          $match: {
            date: { $gte: '2025-07-01', $lte: '2025-07-31' }
          }
        },
        {
          $addFields: {
            // Calculate daily revenues for each product
            dailyLeanMeatRevenue: { $multiply: ["$leanMeatOutput", "$leanMeatPrice"] },
            dailyBoneRevenue: { $multiply: ["$boneOutput", "$bonePrice"] },
            dailyGroundMeatRevenue: { $multiply: ["$groundMeatOutput", "$groundMeatPrice"] },
            dailyOrgansRevenue: { $multiply: ["$organsOutput", "$organsPrice"] },
            dailyLivestockCost: { $multiply: ["$liveAnimalsInput", "$liveAnimalPrice"] }
          }
        },
        {
          $group: {
            _id: null,
            totalLiveAnimalsInput: { $sum: "$liveAnimalsInput" },
            totalLeanMeatOutput: { $sum: "$leanMeatOutput" },
            totalBoneOutput: { $sum: "$boneOutput" },
            totalGroundMeatOutput: { $sum: "$groundMeatOutput" },
            totalOrgansOutput: { $sum: "$organsOutput" },
            // Sum daily revenues (correct way)
            totalLeanMeatRevenue: { $sum: "$dailyLeanMeatRevenue" },
            totalBoneRevenue: { $sum: "$dailyBoneRevenue" },
            totalGroundMeatRevenue: { $sum: "$dailyGroundMeatRevenue" },
            totalOrgansRevenue: { $sum: "$dailyOrgansRevenue" },
            totalLivestockCost: { $sum: "$dailyLivestockCost" },
            count: { $sum: 1 }
          }
        }
      ])
      .toArray();
    
    if (monthlyData.length > 0) {
      const data = monthlyData[0];
      console.log('📈 Monthly aggregation results:');
      console.log('- Total lean meat output:', data.totalLeanMeatOutput || 0, 'kg');
      console.log('- Total bone output:', data.totalBoneOutput || 0, 'kg');
      console.log('- Total ground meat output:', data.totalGroundMeatOutput || 0, 'kg');
      console.log('- Total organs output:', data.totalOrgansOutput || 0, 'kg');
      console.log('- Total lean meat revenue:', (data.totalLeanMeatRevenue || 0).toLocaleString('vi-VN'), 'VND');
      console.log('- Total bone revenue:', (data.totalBoneRevenue || 0).toLocaleString('vi-VN'), 'VND');
      console.log('- Total ground meat revenue:', (data.totalGroundMeatRevenue || 0).toLocaleString('vi-VN'), 'VND');
      console.log('- Total organs revenue:', (data.totalOrgansRevenue || 0).toLocaleString('vi-VN'), 'VND');
      console.log('- Total revenue:', ((data.totalLeanMeatRevenue || 0) + (data.totalBoneRevenue || 0) + (data.totalGroundMeatRevenue || 0) + (data.totalOrgansRevenue || 0)).toLocaleString('vi-VN'), 'VND');
      console.log('- Days with data:', data.count);
      
      console.log('\n📊 Revenue in thousands VND (as sent to frontend):');
      console.log('- Lean meat revenue:', Math.round((data.totalLeanMeatRevenue || 0) / 1000), '(thousand VND)');
      console.log('- Bone revenue:', Math.round((data.totalBoneRevenue || 0) / 1000), '(thousand VND)');
      console.log('- Ground meat revenue:', Math.round((data.totalGroundMeatRevenue || 0) / 1000), '(thousand VND)');
      console.log('- Organs revenue:', Math.round((data.totalOrgansRevenue || 0) / 1000), '(thousand VND)');
      console.log('- Total revenue:', Math.round(((data.totalLeanMeatRevenue || 0) + (data.totalBoneRevenue || 0) + (data.totalGroundMeatRevenue || 0) + (data.totalOrgansRevenue || 0)) / 1000), '(thousand VND)');
    } else {
      console.log('❌ No monthly aggregation data found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

debugLivestockRevenue(); 