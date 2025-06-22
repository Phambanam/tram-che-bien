const { MongoClient, ObjectId } = require('mongodb');

async function createMenuSampleData() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/military-logistics');
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('=== CREATING MENU SAMPLE DATA ===\n');
    
    // 1. Create sample dishes if not exist
    console.log('1. Creating sample dishes...');
    
    const sampleDishes = [
      {
        _id: "canh-chua-ca",
        name: "Canh chua cá",
        category: "Canh",
        servings: 100,
        preparationTime: 30,
        instructions: "Nấu canh chua cá với cà chua, dứa, đậu bắp",
        ingredients: [
          {
            lttpId: "ca-tra",
            lttpName: "Cá tra",
            quantity: 2.0,
            unit: "kg"
          },
          {
            lttpId: "ca-chua",
            lttpName: "Cà chua",
            quantity: 1.5,
            unit: "kg"
          },
          {
            lttpId: "dua-tuoi",
            lttpName: "Dứa tươi",
            quantity: 1.0,
            unit: "kg"
          }
        ]
      },
      {
        _id: "thit-kho-tau",
        name: "Thịt kho tàu",
        category: "Món mặn",
        servings: 100,
        preparationTime: 45,
        instructions: "Kho thịt với nước dừa và gia vị",
        ingredients: [
          {
            lttpId: "thit-heo-ba-chi",
            lttpName: "Thịt heo ba chỉ",
            quantity: 3.0,
            unit: "kg"
          },
          {
            lttpId: "nuoc-dua",
            lttpName: "Nước dừa",
            quantity: 0.5,
            unit: "lít"
          },
          {
            lttpId: "duong-phen",
            lttpName: "Đường phèn",
            quantity: 0.2,
            unit: "kg"
          }
        ]
      },
      {
        _id: "rau-muong-xao-toi",
        name: "Rau muống xào tỏi",
        category: "Rau củ",
        servings: 100,
        preparationTime: 15,
        instructions: "Xào rau muống với tỏi",
        ingredients: [
          {
            lttpId: "rau-muong",
            lttpName: "Rau muống",
            quantity: 2.5,
            unit: "kg"
          },
          {
            lttpId: "toi",
            lttpName: "Tỏi",
            quantity: 0.1,
            unit: "kg"
          }
        ]
      },
      {
        _id: "com-trang",
        name: "Cơm trắng",
        category: "Cơm",
        servings: 100,
        preparationTime: 25,
        instructions: "Nấu cơm trắng",
        ingredients: [
          {
            lttpId: "gao-te",
            lttpName: "Gạo tẻ",
            quantity: 6.0,
            unit: "kg"
          }
        ]
      }
    ];
    
    let dishesCreated = 0;
    for (const dish of sampleDishes) {
      const existing = await db.collection('dishes').findOne({ _id: dish._id });
      if (!existing) {
        await db.collection('dishes').insertOne({
          ...dish,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        dishesCreated++;
      }
    }
    console.log(`   ✓ Created ${dishesCreated} dishes`);
    
    // 2. Create weekly menu
    console.log('\n2. Creating weekly menu...');
    
    const currentDate = new Date();
    const currentWeek = getWeekNumber(currentDate);
    const currentYear = currentDate.getFullYear();
    
    // Start of week (Monday)
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // End of week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const weeklyMenuId = new ObjectId();
    
    const existingMenu = await db.collection('menus').findOne({
      week: currentWeek,
      year: currentYear
    });
    
    if (!existingMenu) {
      await db.collection('menus').insertOne({
        _id: weeklyMenuId,
        name: `Thực đơn tuần ${currentWeek}/${currentYear}`,
        week: currentWeek,
        year: currentYear,
        startDate: startOfWeek,
        endDate: endOfWeek,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`   ✓ Created weekly menu for week ${currentWeek}/${currentYear}`);
    } else {
      console.log(`   ✓ Weekly menu already exists for week ${currentWeek}/${currentYear}`);
      weeklyMenuId._id = existingMenu._id;
    }
    
    // 3. Create daily menus
    console.log('\n3. Creating daily menus...');
    
    const dayNames = ['Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy', 'Chủ nhật'];
    let dailyMenusCreated = 0;
    
    // Get total personnel for meal count calculation
    const units = await db.collection('units').find({}).toArray();
    const totalPersonnel = units.reduce((sum, unit) => sum + (unit.personnel || 0), 0) || 100;
    const mealCount = Math.max(totalPersonnel, 100); // At least 100 meals
    
    const dailyMenuIds = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const existingDailyMenu = await db.collection('dailyMenus').findOne({
        menuId: existingMenu ? existingMenu._id : weeklyMenuId,
        date: dateStr
      });
      
      if (!existingDailyMenu) {
        const dailyMenuId = new ObjectId();
        dailyMenuIds.push(dailyMenuId);
        
        await db.collection('dailyMenus').insertOne({
          _id: dailyMenuId,
          menuId: existingMenu ? existingMenu._id : weeklyMenuId,
          date: dateStr,
          dayName: dayNames[i],
          mealCount: mealCount,
          status: 'planned',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        dailyMenusCreated++;
      } else {
        dailyMenuIds.push(existingDailyMenu._id);
      }
    }
    
    console.log(`   ✓ Created ${dailyMenusCreated} daily menus`);
    
    // 4. Create meals
    console.log('\n4. Creating meals...');
    
    const mealTypes = ['morning', 'noon', 'evening'];
    const dishRotation = [
      ['canh-chua-ca', 'thit-kho-tau', 'rau-muong-xao-toi', 'com-trang'],
      ['thit-kho-tau', 'rau-muong-xao-toi', 'com-trang'],
      ['canh-chua-ca', 'com-trang']
    ];
    
    let mealsCreated = 0;
    
    for (let dayIndex = 0; dayIndex < dailyMenuIds.length; dayIndex++) {
      const dailyMenuId = dailyMenuIds[dayIndex];
      
      for (let mealIndex = 0; mealIndex < mealTypes.length; mealIndex++) {
        const mealType = mealTypes[mealIndex];
        const dishes = dishRotation[mealIndex];
        
        const existingMeal = await db.collection('meals').findOne({
          dailyMenuId: dailyMenuId,
          mealType: mealType
        });
        
        if (!existingMeal) {
          await db.collection('meals').insertOne({
            _id: new ObjectId(),
            dailyMenuId: dailyMenuId,
            mealType: mealType,
            dishes: dishes,
            servingTime: mealIndex === 0 ? '07:00' : mealIndex === 1 ? '12:00' : '18:00',
            createdAt: new Date(),
            updatedAt: new Date()
          });
          mealsCreated++;
        }
      }
    }
    
    console.log(`   ✓ Created ${mealsCreated} meals`);
    
    // 5. Verify the data
    console.log('\n5. Verifying created data...');
    
    const totalDishes = await db.collection('dishes').countDocuments();
    const totalMenus = await db.collection('menus').countDocuments();
    const totalDailyMenus = await db.collection('dailyMenus').countDocuments();
    const totalMeals = await db.collection('meals').countDocuments();
    
    console.log(`   ✓ Total dishes: ${totalDishes}`);
    console.log(`   ✓ Total weekly menus: ${totalMenus}`);
    console.log(`   ✓ Total daily menus: ${totalDailyMenus}`);
    console.log(`   ✓ Total meals: ${totalMeals}`);
    
    console.log('\n=== MENU SAMPLE DATA CREATED ===');
    console.log('The supply output management page should now have ingredient data to display');
    
  } catch (error) {
    console.error('Error creating menu sample data:', error);
  } finally {
    await client.close();
  }
}

// Helper function to get week number
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// Load environment variables
if (typeof require !== 'undefined') {
  try {
    require('dotenv').config();
  } catch (e) {
    console.log('dotenv not available, using default connection');
  }
}

createMenuSampleData(); 