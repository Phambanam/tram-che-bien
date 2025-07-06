const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function createDemoData() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/military-logistics');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Lấy các đơn vị
    const units = await db.collection('units').find({}).toArray();
    console.log(`Found ${units.length} units`);
    
    // Cập nhật personnel cho các đơn vị
    for (let i = 0; i < units.length; i++) {
      const personnel = [150, 120, 100, 80][i] || 100;
      await db.collection('units').updateOne(
        { _id: units[i]._id },
        { $set: { personnel: personnel } }
      );
      console.log(`Updated ${units[i].name} with ${personnel} personnel`);
    }
    
    // Tạo dữ liệu unitPersonnelDaily cho tuần 25 (2025-06-16 đến 2025-06-22)
    const dates = [
      '2025-06-16', '2025-06-17', '2025-06-18', '2025-06-19', 
      '2025-06-20', '2025-06-21', '2025-06-22'
    ];
    
    // Xóa dữ liệu cũ
    await db.collection('unitPersonnelDaily').deleteMany({
      date: { $in: dates }
    });
    
    const personnelData = [];
    for (const date of dates) {
      for (let i = 0; i < units.length; i++) {
        const basePersonnel = [150, 120, 100, 80][i] || 100;
        // Thêm variation nhỏ cho mỗi ngày
        const dailyPersonnel = basePersonnel + Math.floor(Math.random() * 20) - 10;
        
        personnelData.push({
          unitId: units[i]._id,
          date: date,
          personnel: Math.max(50, dailyPersonnel), // Minimum 50
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    
    await db.collection('unitPersonnelDaily').insertMany(personnelData);
    console.log(`Created ${personnelData.length} personnel daily records`);
    
    // Tạo một số dữ liệu tofu processing
    const tofuProcessingData = [];
    for (const date of dates) {
      tofuProcessingData.push({
        date: date,
        soybeanInput: 40 + Math.floor(Math.random() * 20), // 40-60kg đậu tương
        tofuInput: 100 + Math.floor(Math.random() * 50),   // 100-150kg đậu phụ
        note: `Chế biến ngày ${date}`,
        soybeanPrice: 15000,
        tofuPrice: 35000,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: units[0]._id // Dùng unit đầu tiên làm creator
      });
    }
    
    // Xóa dữ liệu cũ
    await db.collection('dailyTofuProcessing').deleteMany({
      date: { $in: dates }
    });
    
    await db.collection('dailyTofuProcessing').insertMany(tofuProcessingData);
    console.log(`Created ${tofuProcessingData.length} tofu processing records`);
    
    console.log('Demo data created successfully!');
    
  } catch (error) {
    console.error('Error creating demo data:', error);
  } finally {
    await client.close();
  }
}

createDemoData(); 