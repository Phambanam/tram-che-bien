const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function addTofuDishViaAPI() {
  try {
    console.log('=== ADDING TOFU DISH VIA API ===\n');
    
    // 1. Create tofu dish via API
    console.log('1. Creating tofu dish via API...');
    
    const tofuDish = {
      id: "canh-dau-phu",
      name: "Canh đậu phụ nấm rơm",
      category: "Canh",
      servings: 100,
      preparationTime: 25,
      instructions: "Nấu canh đậu phụ với nấm rơm, hành lá",
      ingredients: [
        {
          lttpId: "dau-phu",
          lttpName: "Đậu phụ",
          quantity: 2.5,
          unit: "kg",
          preparationNotes: "Cắt miếng vuông vừa ăn"
        },
        {
          lttpId: "nam-rom", 
          lttpName: "Nấm rơm",
          quantity: 0.8,
          unit: "kg",
          preparationNotes: "Rửa sạch, cắt đôi"
        },
        {
          lttpId: "hanh-la",
          lttpName: "Hành lá", 
          quantity: 0.3,
          unit: "kg",
          preparationNotes: "Thái nhỏ"
        }
      ],
      nutritionalInfo: {
        calories: 180,
        protein: 15,
        carbs: 8,
        fat: 11
      },
      cost: 45000,
      costPerServing: 450
    };
    
    try {
      const createResponse = await axios.post(`${API_BASE}/dishes`, tofuDish);
      console.log('   ✅ Created tofu dish successfully');
    } catch (createError) {
      if (createError.response?.status === 409) {
        console.log('   ✅ Tofu dish already exists');
      } else {
        console.log('   ⚠️ Could not create dish:', createError.message);
        // Continue anyway, dish might exist
      }
    }
    
    // 2. Get today's menu
    console.log('\n2. Getting today\'s menu...');
    
    try {
      const menusResponse = await axios.get(`${API_BASE}/menus`);
      const menus = menusResponse.data;
      
      // Find current week menu (week 25, 2025)
      const currentMenu = menus.find(menu => 
        menu.name && menu.name.includes('25') && menu.name.includes('2025')
      );
      
      if (!currentMenu) {
        console.log('   ❌ Could not find current week menu');
        return;
      }
      
      console.log(`   ✅ Found menu: ${currentMenu.name}`);
      
      // Get menu details
      const menuDetailsResponse = await axios.get(`${API_BASE}/menus/${currentMenu.id}`);
      const menuDetails = menuDetailsResponse.data;
      
      // Find today's daily menu (2025-06-22 = Sunday)
      const todayDailyMenu = menuDetails.data.dailyMenus.find(dm => dm.date === '2025-06-22');
      
      if (!todayDailyMenu) {
        console.log('   ❌ Could not find today\'s daily menu');
        return;
      }
      
      console.log(`   ✅ Found today's daily menu with ${todayDailyMenu.meals.length} meals`);
      
      // 3. Add tofu dish to a meal (prefer lunch)
      console.log('\n3. Adding tofu dish to meal...');
      
      const lunchMeal = todayDailyMenu.meals.find(meal => 
        meal.mealType.toLowerCase().includes('trưa') || 
        meal.mealType.toLowerCase().includes('lunch')
      ) || todayDailyMenu.meals[0];
      
      if (!lunchMeal) {
        console.log('   ❌ No meals found');
        return;
      }
      
      console.log(`   ✅ Adding to meal: ${lunchMeal.mealType}`);
      
      // Check if tofu dish already exists
      const hasTofu = lunchMeal.dishes.some(dish => 
        dish.dishId === 'canh-dau-phu' || 
        dish.dishName.toLowerCase().includes('đậu phụ')
      );
      
      if (hasTofu) {
        console.log('   ✅ Tofu dish already exists in this meal');
      } else {
        // Add tofu dish to meal
        const addDishResponse = await axios.post(`${API_BASE}/menus/meals/${lunchMeal.id}/dishes`, {
          dishId: 'canh-dau-phu',
          notes: 'Thêm cho demo processing station'
        });
        console.log('   ✅ Added tofu dish to meal successfully');
      }
      
    } catch (menuError) {
      console.error('   ❌ Error with menu operations:', menuError.message);
    }
    
    console.log('\n🎉 Done! Check the processing station now.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Check if axios is available
try {
  addTofuDishViaAPI();
} catch (error) {
  console.log('Need to install axios first: npm install axios');
  console.log('Or use curl commands instead');
} 