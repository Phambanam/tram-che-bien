const { MongoClient, ObjectId } = require('mongodb');
const { format, startOfWeek, addDays } = require('date-fns');

const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/military-logistics?authSource=admin';

async function seedMenuData() {
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('military-logistics');
    
    // Clear existing menu data
    await db.collection('menus').deleteMany({});
    await db.collection('dailyMenus').deleteMany({});
    await db.collection('meals').deleteMany({});
    console.log('Cleared existing menu data');
    
    // Get all dishes
    const dishes = await db.collection('dishes').find({}).toArray();
    console.log(`Found ${dishes.length} dishes`);
    
    if (dishes.length === 0) {
      console.log('No dishes found! Please run seed-data-library.js and generate-dishes.js first');
      return;
    }
    
    // Separate dishes by category
    const mainDishes = dishes.filter(d => d.category === 'Món mặn');
    const soupDishes = dishes.filter(d => d.category === 'Canh');
    const vegetableDishes = dishes.filter(d => d.category === 'Rau');
    const tofuDishes = dishes.filter(d => {
      if (d.ingredients && typeof d.ingredients === 'string') {
        return d.ingredients.toLowerCase().includes('đậu phụ') || 
               d.ingredients.toLowerCase().includes('tofu');
      }
      return false;
    });
    
    console.log(`Found ${tofuDishes.length} dishes with tofu`);
    
    // Create menus for multiple weeks
    const currentDate = new Date();
    const weeksToCreate = 8; // Create 8 weeks of menus
    
    for (let w = 0; w < weeksToCreate; w++) {
      const weekStart = startOfWeek(addDays(currentDate, w * 7), { weekStartsOn: 1 });
      const weekNumber = getWeekNumber(weekStart);
      const year = weekStart.getFullYear();
      
      // Create menu for this week
      const menuResult = await db.collection('menus').insertOne({
        week: weekNumber,
        year: year,
        status: w < 2 ? 'approved' : 'pending',
        approvedBy: w < 2 ? new ObjectId() : null,
        approvedAt: w < 2 ? new Date() : null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const menuId = menuResult.insertedId;
      console.log(`Created menu for week ${weekNumber}/${year}`);
      
      // Create daily menus for each day of the week
      const dailyMenus = [];
      
      for (let d = 0; d < 7; d++) {
        const date = addDays(weekStart, d);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayOfWeek = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'][d];
        
        // Select random dishes for each meal
        const breakfastMain = getRandomDishes(mainDishes, 2);
        const breakfastSoup = getRandomDishes(soupDishes, 1);
        
        const lunchMain = getRandomDishes(mainDishes, 3);
        const lunchSoup = getRandomDishes(soupDishes, 1);
        const lunchVeg = getRandomDishes(vegetableDishes, 1);
        
        const dinnerMain = getRandomDishes(mainDishes, 3);
        const dinnerSoup = getRandomDishes(soupDishes, 1);
        const dinnerVeg = getRandomDishes(vegetableDishes, 1);
        
        // Ensure at least one tofu dish on some days
        if (Math.random() > 0.3 && tofuDishes.length > 0) {
          const randomTofu = tofuDishes[Math.floor(Math.random() * tofuDishes.length)];
          if (Math.random() > 0.5) {
            lunchMain[0] = randomTofu;
          } else {
            dinnerMain[0] = randomTofu;
          }
        }
        
        const dailyMenu = {
          menuId: menuId,
          date: date,
          dateStr: dateStr,
          dayOfWeek: dayOfWeek,
          mealCount: 450, // Total personnel
          status: w < 2 ? 'approved' : 'pending',
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        dailyMenus.push(dailyMenu);
      }
      
      // Insert all daily menus
      if (dailyMenus.length > 0) {
        const insertedDailyMenus = await db.collection('dailyMenus').insertMany(dailyMenus);
        console.log(`Created ${dailyMenus.length} daily menus for week ${weekNumber}`);
        
        // Create meals for each daily menu
        const meals = [];
        let mealIndex = 0;
        
        for (let i = 0; i < dailyMenus.length; i++) {
          const dailyMenuId = insertedDailyMenus.insertedIds[i];
          const dailyMenu = dailyMenus[i];
          const d = i; // day index
          
          // Re-select dishes for this daily menu
          const breakfastMain = getRandomDishes(mainDishes, 2);
          const breakfastSoup = getRandomDishes(soupDishes, 1);
          
          const lunchMain = getRandomDishes(mainDishes, 3);
          const lunchSoup = getRandomDishes(soupDishes, 1);
          const lunchVeg = getRandomDishes(vegetableDishes, 1);
          
          const dinnerMain = getRandomDishes(mainDishes, 3);
          const dinnerSoup = getRandomDishes(soupDishes, 1);
          const dinnerVeg = getRandomDishes(vegetableDishes, 1);
          
          // Ensure at least one tofu dish on some days
          if (Math.random() > 0.3 && tofuDishes.length > 0) {
            const randomTofu = tofuDishes[Math.floor(Math.random() * tofuDishes.length)];
            if (Math.random() > 0.5) {
              lunchMain[0] = randomTofu._id;
            } else {
              dinnerMain[0] = randomTofu._id;
            }
          }
          
          // Create morning meal
          meals.push({
            dailyMenuId: dailyMenuId,
            type: 'morning',
            dishes: [...breakfastMain, ...breakfastSoup],
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          // Create noon meal
          meals.push({
            dailyMenuId: dailyMenuId,
            type: 'noon',
            dishes: [...lunchMain, ...lunchSoup, ...lunchVeg],
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          // Create evening meal
          meals.push({
            dailyMenuId: dailyMenuId,
            type: 'evening',
            dishes: [...dinnerMain, ...dinnerSoup, ...dinnerVeg],
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        
        // Insert all meals
        if (meals.length > 0) {
          await db.collection('meals').insertMany(meals);
          console.log(`Created ${meals.length} meals for week ${weekNumber}`);
        }
      }
    }
    
    // Create supply outputs for approved menus
    console.log('\nCreating supply outputs for approved menus...');
    const approvedMenus = await db.collection('menus').find({ status: 'approved' }).toArray();
    
    for (const menu of approvedMenus) {
      const dailyMenusForWeek = await db.collection('dailyMenus')
        .find({ menuId: menu._id })
        .toArray();
      
      // Calculate total personnel
      const units = await db.collection('units').find({}).toArray();
      const totalPersonnel = units.reduce((sum, unit) => sum + (unit.personnelCount || 0), 0);
      
      // Track ingredients needed
      const ingredientsMap = new Map();
      
      for (const dailyMenu of dailyMenusForWeek) {
        // Get meals for this daily menu
        const meals = await db.collection('meals').find({ dailyMenuId: dailyMenu._id }).toArray();
        
        // Collect all dish IDs from all meals
        const allDishIds = [];
        for (const meal of meals) {
          if (meal.dishes && Array.isArray(meal.dishes)) {
            allDishIds.push(...meal.dishes);
          }
        }
        
        for (const dishId of allDishIds) {
          const dish = await db.collection('dishes').findOne({ _id: dishId });
          if (dish && dish.ingredients && typeof dish.ingredients === 'string') {
            // Simple ingredient parsing (in real system this would be more sophisticated)
            const ingredientsLower = dish.ingredients.toLowerCase();
            if (ingredientsLower.includes('thịt')) {
              addIngredient(ingredientsMap, 'Thịt lợn', 0.1 * totalPersonnel);
            }
            if (ingredientsLower.includes('gà')) {
              addIngredient(ingredientsMap, 'Thịt gà', 0.15 * totalPersonnel);
            }
            if (ingredientsLower.includes('cá')) {
              addIngredient(ingredientsMap, 'Cá', 0.12 * totalPersonnel);
            }
            if (ingredientsLower.includes('đậu phụ') || ingredientsLower.includes('tofu')) {
              addIngredient(ingredientsMap, 'Đậu phụ', 0.05 * totalPersonnel);
            }
            if (ingredientsLower.includes('rau')) {
              addIngredient(ingredientsMap, 'Rau xanh', 0.08 * totalPersonnel);
            }
          }
        }
      }
      
      // Create supply outputs
      const supplyOutputs = [];
      for (const [productName, quantity] of ingredientsMap) {
        const product = await db.collection('products').findOne({ name: productName });
        if (product) {
          supplyOutputs.push({
            week: menu.week,
            year: menu.year,
            productId: product._id,
            productName: product.name,
            categoryId: product.categoryId,
            quantity: Math.round(quantity * 10) / 10,
            unit: product.unit,
            unitPrice: product.averagePrice || 0,
            totalPrice: Math.round(quantity * (product.averagePrice || 0)),
            outputDate: menu.createdAt,
            outputType: 'menu',
            status: 'approved',
            note: `Xuất theo thực đơn tuần ${menu.week}/${menu.year}`,
            approvedBy: new ObjectId(),
            approvedAt: new Date(),
            createdBy: new ObjectId(),
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
      
      if (supplyOutputs.length > 0) {
        await db.collection('supplyOutputs').insertMany(supplyOutputs);
        console.log(`Created ${supplyOutputs.length} supply outputs for week ${menu.week}/${menu.year}`);
      }
    }
    
    console.log('\n✅ Menu data seeding completed successfully!');
    
    // Summary
    const menuCount = await db.collection('menus').countDocuments();
    const dailyMenuCount = await db.collection('dailyMenus').countDocuments();
    const supplyOutputCount = await db.collection('supplyOutputs').countDocuments();
    
    console.log('\n📊 Summary:');
    console.log(`📅 Menus: ${menuCount}`);
    console.log(`📆 Daily Menus: ${dailyMenuCount}`);
    console.log(`📦 Supply Outputs: ${supplyOutputCount}`);
    console.log(`🥘 Dishes with tofu: ${tofuDishes.length}`);
    
  } catch (error) {
    console.error('Error seeding menu data:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

function getWeekNumber(date) {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - startOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
}

function getRandomDishes(dishes, count) {
  const shuffled = [...dishes].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map(d => d._id);
}

function addIngredient(map, name, quantity) {
  if (map.has(name)) {
    map.set(name, map.get(name) + quantity);
  } else {
    map.set(name, quantity);
  }
}

// Run the seeding
seedMenuData().catch(console.error); 