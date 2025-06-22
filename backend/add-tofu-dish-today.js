const { MongoClient, ObjectId } = require('mongodb');

async function addTofuDishToday() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/military-logistics');
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('=== ADDING TOFU DISH TO TODAY\'S MENU ===\n');
    
    // 1. Create or ensure tofu dish exists
    console.log('1. Creating tofu dish...');
    
    const tofuDishId = "canh-dau-phu";
    const tofuDish = {
      _id: tofuDishId,
      name: "Canh đậu phụ nấm rơm",
      category: "Canh",
      servings: 100,
      preparationTime: 25,
      instructions: "Nấu canh đậu phụ với nấm rơm, hành lá",
      ingredients: [
        {
          lttpId: "dau-phu",
          lttpName: "Đậu phụ",
          quantity: 2.5, // 2.5kg cho 100 người
          unit: "kg",
          preparationNotes: "Cắt miếng vuông vừa ăn"
        },
        {
          lttpId: "nam-rom",
          lttpName: "Nấm rơm",
          quantity: 0.8, // 0.8kg cho 100 người
          unit: "kg",
          preparationNotes: "Rửa sạch, cắt đôi"
        },
        {
          lttpId: "hanh-la",
          lttpName: "Hành lá",
          quantity: 0.3, // 0.3kg cho 100 người
          unit: "kg",
          preparationNotes: "Thái nhỏ"
        },
        {
          lttpId: "tuong-ca-chua",
          lttpName: "Tương cà chua",
          quantity: 0.2, // 0.2kg cho 100 người
          unit: "kg",
          preparationNotes: "Nêm nếm vừa ăn"
        }
      ],
      nutritionalInfo: {
        calories: 180,
        protein: 15,
        carbs: 8,
        fat: 11
      },
      cost: 45000, // 45,000 VND cho 100 người
      costPerServing: 450,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('dishes').replaceOne(
      { _id: tofuDishId },
      tofuDish,
      { upsert: true }
    );
    console.log('   ✅ Created tofu dish: Canh đậu phụ nấm rơm');
    
    // 2. Find today's daily menu
    console.log('\n2. Finding today\'s daily menu...');
    const today = '2025-06-22';
    
    const dailyMenu = await db.collection('dailyMenus').findOne({
      date: today
    });
    
    if (!dailyMenu) {
      console.log('   ❌ No daily menu found for today');
      return;
    }
    
    console.log(`   ✅ Found daily menu for ${today}:`, dailyMenu._id);
    
    // 3. Find a meal to add the tofu dish to (prefer lunch)
    const meals = await db.collection('meals').find({
      dailyMenuId: dailyMenu._id
    }).toArray();
    
    console.log(`   Found ${meals.length} meals for today`);
    
    // Look for lunch meal first, then any meal
    let targetMeal = meals.find(meal => meal.mealType.toLowerCase().includes('trưa')) ||
                    meals.find(meal => meal.mealType.toLowerCase().includes('lunch')) ||
                    meals[0]; // fallback to first meal
    
    if (!targetMeal) {
      console.log('   ❌ No meals found');
      return;
    }
    
    console.log(`   ✅ Will add to meal: ${targetMeal.mealType}`);
    
    // 4. Add tofu dish to the meal
    console.log('\n3. Adding tofu dish to meal...');
    
    const existingDishes = targetMeal.dishes || [];
    const hasTofu = existingDishes.some(dish => 
      dish.dishId === tofuDishId || 
      (dish.dishName && dish.dishName.toLowerCase().includes('đậu phụ'))
    );
    
    if (hasTofu) {
      console.log('   ✅ Tofu dish already exists in this meal');
    } else {
      // Add the tofu dish
      const updatedDishes = [
        ...existingDishes,
        {
          dishId: tofuDishId,
          dishName: "Canh đậu phụ nấm rơm",
          servings: 100,
          notes: "Thêm cho ngày hôm nay"
        }
      ];
      
      await db.collection('meals').updateOne(
        { _id: targetMeal._id },
        {
          $set: {
            dishes: updatedDishes,
            updatedAt: new Date()
          }
        }
      );
      
      console.log('   ✅ Added tofu dish to meal successfully');
    }
    
    // 5. Verify the result
    console.log('\n4. Verifying result...');
    const updatedMeal = await db.collection('meals').findOne({ _id: targetMeal._id });
    const tofuDishes = updatedMeal.dishes.filter(dish => 
      dish.dishId === tofuDishId || 
      (dish.dishName && dish.dishName.toLowerCase().includes('đậu phụ'))
    );
    
    console.log(`   ✅ Tofu dishes in meal: ${tofuDishes.length}`);
    tofuDishes.forEach(dish => {
      console.log(`      - ${dish.dishName}`);
    });
    
    console.log('\n🎉 SUCCESS! Tofu dish added to today\'s menu.');
    console.log('Now the processing station should show tofu output requirement.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

addTofuDishToday(); 