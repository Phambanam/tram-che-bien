const { MongoClient, ObjectId } = require('mongodb');

const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/military-logistics?authSource=admin';

// Function to get week dates
function getWeekDates(week, year) {
  // Find first Monday of the year
  const jan1 = new Date(year, 0, 1);
  const dayOfWeek = jan1.getDay(); // 0 = Sunday, 1 = Monday, ...
  const firstMonday = new Date(jan1);
  const daysToAdd = dayOfWeek === 0 ? 1 : (8 - dayOfWeek); // Days to first Monday
  firstMonday.setDate(jan1.getDate() + daysToAdd);
  
  // Calculate start date of target week
  const startDate = new Date(firstMonday);
  startDate.setDate(firstMonday.getDate() + (week - 1) * 7);
  
  // Calculate end date (6 days later)
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  
  return { startDate, endDate };
}

async function fixMenuDates() {
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('military-logistics');
    
    // Check if we have any dishes
    const dishCount = await db.collection('dishes').countDocuments();
    console.log(`Found ${dishCount} dishes in database`);
    
    if (dishCount === 0) {
      console.log('No dishes found, creating some sample dishes first...');
      
      // Create sample dishes with bean sprouts
      const sampleDishes = [
        {
          _id: new ObjectId(),
          name: 'Canh giá đỗ',
          category: 'Canh',
          ingredients: [
            {
              lttpId: 'lttp_gia_do_001',
              lttpName: 'Giá đỗ',
              quantityPer100: 50,
              unit: 'g'
            },
            {
              lttpId: 'lttp_thit_lon_001', 
              lttpName: 'Thịt lợn',
              quantityPer100: 30,
              unit: 'g'
            }
          ],
          nutritionInfo: {
            calories: 85,
            protein: 8.2,
            carbs: 6.1,
            fat: 3.4
          },
          preparationTime: 20,
          difficulty: 'Dễ',
          servingSize: 100,
          description: 'Canh giá đỗ thịt lợn thanh mát, bổ dưỡng',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId(),
          name: 'Thịt bò xào giá đỗ',
          category: 'Món mặn',
          ingredients: [
            {
              lttpId: 'lttp_gia_do_001',
              lttpName: 'Giá đỗ',
              quantityPer100: 40,
              unit: 'g'
            },
            {
              lttpId: 'lttp_thit_bo_001',
              lttpName: 'Thịt bò',
              quantityPer100: 60,
              unit: 'g'
            }
          ],
          nutritionInfo: {
            calories: 165,
            protein: 18.5,
            carbs: 4.2,
            fat: 8.7
          },
          preparationTime: 25,
          difficulty: 'Trung bình',
          servingSize: 100,
          description: 'Thịt bò xào giá đỗ giòn ngọt, đậm đà',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId(),
          name: 'Cơm trắng',
          category: 'Món mặn',
          ingredients: [
            {
              lttpId: 'lttp_gao_001',
              lttpName: 'Gạo tẻ',
              quantityPer100: 80,
              unit: 'g'
            }
          ],
          nutritionInfo: {
            calories: 130,
            protein: 2.7,
            carbs: 28,
            fat: 0.3
          },
          preparationTime: 30,
          difficulty: 'Dễ',
          servingSize: 100,
          description: 'Cơm trắng dẻo thơm',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      await db.collection('dishes').insertMany(sampleDishes);
      console.log('Created sample dishes');
    }
    
    // Get some dishes to use in menus
    const dishes = await db.collection('dishes').find({}).limit(10).toArray();
    const dishIds = dishes.map(d => d._id);
    
    // Create menu for July 2025 covering the date 2025-07-02
    const menuStartDate = new Date('2025-06-30'); // Monday of the week containing July 2nd
    const menuEndDate = new Date('2025-07-06'); // Sunday of that week
    
    // Check if menu already exists
    const existingMenu = await db.collection('menus').findOne({
      startDate: { $lte: new Date('2025-07-02') },
      endDate: { $gte: new Date('2025-07-02') }
    });
    
    if (existingMenu) {
      console.log('Menu already exists for this date period');
      return;
    }
    
    // Create menu
    const menuResult = await db.collection('menus').insertOne({
      name: 'Thực đơn tuần 27/2025',
      week: 27,
      year: 2025,
      startDate: menuStartDate,
      endDate: menuEndDate,
      status: 'approved',
      approvedBy: new ObjectId(),
      approvedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const menuId = menuResult.insertedId;
    console.log('Created menu for week 27/2025');
    
    // Create daily menus for each day of the week
    const dailyMenus = [];
    const currentDate = new Date(menuStartDate);
    
    for (let d = 0; d < 7; d++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() + d);
      
      // Select random dishes for each meal (ensure variety)
      const morningDishes = dishIds.slice(0, 2);
      const noonDishes = dishIds.slice(0, 3);
      const eveningDishes = dishIds.slice(0, 3);
      
      const dailyMenu = {
        menuId: menuId,
        date: date,
        dateStr: date.toISOString().split('T')[0],
        dayOfWeek: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'][d],
        morning: morningDishes,
        noon: noonDishes,
        evening: eveningDishes,
        mealCount: 450,
        status: 'approved',
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      dailyMenus.push(dailyMenu);
    }
    
    // Insert daily menus
    if (dailyMenus.length > 0) {
      await db.collection('dailyMenus').insertMany(dailyMenus);
      console.log(`Created ${dailyMenus.length} daily menus`);
    }
    
    console.log('✅ Menu data fix completed!');
    
    // Verify the specific date exists
    const targetDate = new Date('2025-07-02');
    const verifyMenu = await db.collection('menus').findOne({
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate }
    });
    
    const verifyDailyMenu = await db.collection('dailyMenus').findOne({
      date: targetDate
    });
    
    console.log('Verification:');
    console.log(`Menu exists for 2025-07-02: ${!!verifyMenu}`);
    console.log(`Daily menu exists for 2025-07-02: ${!!verifyDailyMenu}`);
    
  } catch (error) {
    console.error('Error fixing menu dates:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

fixMenuDates().catch(console.error); 