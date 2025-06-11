const { MongoClient } = require('mongodb');
require('dotenv').config();

// Sample data for generating dishes
const dishTypes = [
  'Canh', 'Súp', 'Thịt', 'Cá', 'Gà', 'Rau', 'Đậu', 'Nấm', 
  'Bánh', 'Chả', 'Nem', 'Gỏi', 'Nộm', 'Xôi', 'Cháo', 'Phở',
  'Bún', 'Miến', 'Mì', 'Cơm', 'Kho', 'Rang', 'Xào', 'Luộc',
  'Nướng', 'Chiên', 'Hấp', 'Nấu', 'Rim', 'Nộm'
];

const mainIngredients = [
  { id: 'lttp001', name: 'Thịt lợn', category: 'Thịt' },
  { id: 'lttp002', name: 'Thịt bò', category: 'Thịt' },
  { id: 'lttp003', name: 'Gà ta', category: 'Thịt' },
  { id: 'lttp004', name: 'Cá thu', category: 'Thủy sản' },
  { id: 'lttp005', name: 'Cá ngừ', category: 'Thủy sản' },
  { id: 'lttp006', name: 'Tôm', category: 'Thủy sản' },
  { id: 'lttp007', name: 'Cua', category: 'Thủy sản' },
  { id: 'lttp008', name: 'Rau cải', category: 'Rau củ' },
  { id: 'lttp009', name: 'Cà chua', category: 'Rau củ' },
  { id: 'lttp010', name: 'Bắp cải', category: 'Rau củ' },
  { id: 'lttp011', name: 'Đậu phụ', category: 'Đậu' },
  { id: 'lttp012', name: 'Đậu xanh', category: 'Đậu' },
  { id: 'lttp013', name: 'Đậu đen', category: 'Đậu' },
  { id: 'lttp014', name: 'Nấm hương', category: 'Nấm' },
  { id: 'lttp015', name: 'Nấm rơm', category: 'Nấm' },
  { id: 'lttp016', name: 'Khoai tây', category: 'Củ quả' },
  { id: 'lttp017', name: 'Khoai lang', category: 'Củ quả' },
  { id: 'lttp018', name: 'Bí đỏ', category: 'Củ quả' },
  { id: 'lttp019', name: 'Mướp', category: 'Rau củ' },
  { id: 'lttp020', name: 'Dưa chua', category: 'Rau củ' }
];

const secondaryIngredients = [
  { id: 'lttp021', name: 'Hành tây', category: 'Gia vị' },
  { id: 'lttp022', name: 'Tỏi', category: 'Gia vị' },
  { id: 'lttp023', name: 'Gừng', category: 'Gia vị' },
  { id: 'lttp024', name: 'Nước mắm', category: 'Gia vị' },
  { id: 'lttp025', name: 'Đường', category: 'Gia vị' },
  { id: 'lttp026', name: 'Muối', category: 'Gia vị' },
  { id: 'lttp027', name: 'Tiêu', category: 'Gia vị' },
  { id: 'lttp028', name: 'Dầu ăn', category: 'Gia vị' },
  { id: 'lttp029', name: 'Bột ngọt', category: 'Gia vị' },
  { id: 'lttp030', name: 'Hạt nêm', category: 'Gia vị' }
];

const difficulties = ['easy', 'medium', 'hard'];
const categories = ['Món chính', 'Món phụ', 'Canh', 'Súp', 'Món tráng miệng', 'Món ăn sáng'];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateDishName() {
  const type = getRandomElement(dishTypes);
  const main = getRandomElement(mainIngredients);
  const adjectives = ['ngon', 'đậm đà', 'thơm', 'cay', 'ngọt', 'chua', 'đặc biệt', 'truyền thống', 'hiện đại', 'gia đình'];
  
  const patterns = [
    `${type} ${main.name}`,
    `${main.name} ${type}`,
    `${type} ${main.name} ${getRandomElement(adjectives)}`,
    `${main.name} ${getRandomElement(adjectives)}`,
    `${type} ${main.name} kiểu ${getRandomElement(['Bắc', 'Trung', 'Nam'])}`,
    `${main.name} ${type} ${getRandomElement(['cổ truyền', 'hiện đại', 'gia đình'])}`
  ];
  
  return getRandomElement(patterns);
}

function generateIngredients() {
  const numIngredients = getRandomNumber(3, 8);
  const ingredients = [];
  const usedIngredients = new Set();
  
  // Always add main ingredient
  const mainIngredient = getRandomElement(mainIngredients);
  ingredients.push({
    lttpId: mainIngredient.id,
    lttpName: mainIngredient.name,
    quantity: getRandomNumber(200, 1000),
    unit: 'gram',
    notes: ''
  });
  usedIngredients.add(mainIngredient.id);
  
  // Add secondary ingredients
  for (let i = 1; i < numIngredients; i++) {
    let ingredient;
    do {
      ingredient = getRandomElement([...mainIngredients, ...secondaryIngredients]);
    } while (usedIngredients.has(ingredient.id));
    
    usedIngredients.add(ingredient.id);
    
    const units = ['gram', 'ml', 'muỗng canh', 'muỗng cà phê', 'củ', 'trái', 'lá'];
    let quantity, unit;
    
    if (ingredient.category === 'Gia vị') {
      quantity = getRandomNumber(1, 50);
      unit = getRandomElement(['gram', 'ml', 'muỗng canh', 'muỗng cà phê']);
    } else {
      quantity = getRandomNumber(100, 500);
      unit = getRandomElement(['gram', 'củ', 'trái']);
    }
    
    ingredients.push({
      lttpId: ingredient.id,
      lttpName: ingredient.name,
      quantity: quantity,
      unit: unit,
      notes: ''
    });
  }
  
  return ingredients;
}

function generateDescription(dishName) {
  const descriptions = [
    `${dishName} là món ăn truyền thống được chế biến từ nguyên liệu tươi ngon.`,
    `Món ${dishName} có hương vị đậm đà, thích hợp cho bữa cơm gia đình.`,
    `${dishName} được nấu theo công thức truyền thống, giữ nguyên hương vị đặc trưng.`,
    `Món ăn bổ dưỡng ${dishName} cung cấp đầy đủ chất dinh dưỡng cho cơ thể.`,
    `${dishName} là sự kết hợp hoàn hảo giữa nguyên liệu tươi ngon và kỹ thuật nấu nướng.`,
    `Món ${dishName} có vị ngọt tự nhiên, thơm ngon và dễ ăn.`,
    `${dishName} được chế biến cẩn thận với gia vị vừa phải, hấp dẫn mọi lứa tuổi.`
  ];
  
  return getRandomElement(descriptions);
}

async function generateDishes() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/military-logistics';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const dishesCollection = db.collection('dishes');
    
    // Check if we already have dishes
    const existingCount = await dishesCollection.countDocuments();
    console.log(`Existing dishes count: ${existingCount}`);
    
    const dishes = [];
    const usedNames = new Set();
    
    for (let i = 1; i <= 1000; i++) {
      let dishName;
      let attempts = 0;
      
      // Generate unique dish name
      do {
        dishName = generateDishName();
        attempts++;
        if (attempts > 50) {
          dishName = `${generateDishName()} ${i}`;
          break;
        }
      } while (usedNames.has(dishName));
      
      usedNames.add(dishName);
      
      const ingredients = generateIngredients();
      const mainIngredient = ingredients[0]; // First ingredient is always main
      
      const dish = {
        name: dishName,
        description: generateDescription(dishName),
        mainLTTP: {
          lttpId: mainIngredient.lttpId,
          lttpName: mainIngredient.lttpName,
          category: mainIngredients.find(ing => ing.id === mainIngredient.lttpId)?.category || 'Khác'
        },
        ingredients: ingredients,
        servings: getRandomNumber(4, 20),
        preparationTime: getRandomNumber(15, 120),
        difficulty: getRandomElement(difficulties),
        category: getRandomElement(categories),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      dishes.push(dish);
      
      // Insert in batches of 100
      if (dishes.length === 100) {
        await dishesCollection.insertMany(dishes);
        console.log(`Inserted batch: ${i - 99} - ${i} dishes`);
        dishes.length = 0; // Clear array
      }
    }
    
    // Insert remaining dishes
    if (dishes.length > 0) {
      await dishesCollection.insertMany(dishes);
      console.log(`Inserted final batch: ${dishes.length} dishes`);
    }
    
    const finalCount = await dishesCollection.countDocuments();
    console.log(`\n✅ Successfully generated dishes!`);
    console.log(`Total dishes in database: ${finalCount}`);
    console.log(`New dishes added: ${finalCount - existingCount}`);
    
  } catch (error) {
    console.error('Error generating dishes:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  console.log('🚀 Starting dish generation...\n');
  generateDishes().catch(console.error);
}

module.exports = { generateDishes }; 