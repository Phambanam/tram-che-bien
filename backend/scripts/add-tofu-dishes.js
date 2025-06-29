const { MongoClient, ObjectId } = require('mongodb');

const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/military-logistics?authSource=admin';

async function addTofuDishes() {
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('military-logistics');
    
    // Tofu dishes to add
    const tofuDishes = [
      {
        name: 'Đậu phụ sốt cà chua',
        category: 'Món mặn',
        ingredients: 'Đậu phụ, cà chua, hành tây, tỏi, gia vị',
        nutritionPer100g: { calories: 120, protein: 8, fat: 6, carbs: 8 },
        quantityPer100People: 15, // kg
        unit: 'kg'
      },
      {
        name: 'Canh đậu phụ rau cải',
        category: 'Canh',
        ingredients: 'Đậu phụ, rau cải, hành lá, gia vị',
        nutritionPer100g: { calories: 80, protein: 5, fat: 4, carbs: 6 },
        quantityPer100People: 20, // kg
        unit: 'kg'
      },
      {
        name: 'Đậu phụ chiên giòn',
        category: 'Món mặn',
        ingredients: 'Đậu phụ, bột chiên giòn, dầu ăn, nước mắm',
        nutritionPer100g: { calories: 180, protein: 10, fat: 12, carbs: 8 },
        quantityPer100People: 12, // kg
        unit: 'kg'
      },
      {
        name: 'Đậu phụ kho tiêu',
        category: 'Món mặn',
        ingredients: 'Đậu phụ, nước mắm, đường, tiêu, hành tím',
        nutritionPer100g: { calories: 150, protein: 9, fat: 8, carbs: 10 },
        quantityPer100People: 14, // kg
        unit: 'kg'
      },
      {
        name: 'Đậu phụ xào nấm',
        category: 'Món mặn',
        ingredients: 'Đậu phụ, nấm hương, nấm mèo, hành tây, gia vị',
        nutritionPer100g: { calories: 130, protein: 9, fat: 7, carbs: 9 },
        quantityPer100People: 13, // kg
        unit: 'kg'
      },
      {
        name: 'Gỏi đậu phụ',
        category: 'Món mặn',
        ingredients: 'Đậu phụ chiên, rau thơm, đậu phộng, nước mắm chua ngọt',
        nutritionPer100g: { calories: 160, protein: 8, fat: 10, carbs: 8 },
        quantityPer100People: 10, // kg
        unit: 'kg'
      },
      {
        name: 'Đậu phụ nhồi thịt',
        category: 'Món mặn',
        ingredients: 'Đậu phụ, thịt băm, nấm mèo, hành lá, gia vị',
        nutritionPer100g: { calories: 170, protein: 12, fat: 9, carbs: 8 },
        quantityPer100People: 15, // kg
        unit: 'kg'
      },
      {
        name: 'Canh đậu phụ non',
        category: 'Canh',
        ingredients: 'Đậu phụ non, tôm khô, hành lá, tiêu',
        nutritionPer100g: { calories: 90, protein: 6, fat: 5, carbs: 5 },
        quantityPer100People: 18, // kg
        unit: 'kg'
      },
      {
        name: 'Đậu phụ rim mặn',
        category: 'Món mặn',
        ingredients: 'Đậu phụ, nước mắm, tỏi, ớt, đường',
        nutritionPer100g: { calories: 140, protein: 9, fat: 8, carbs: 7 },
        quantityPer100People: 12, // kg
        unit: 'kg'
      },
      {
        name: 'Đậu phụ sốt me',
        category: 'Món mặn',
        ingredients: 'Đậu phụ chiên, me chua, đường, nước mắm, tỏi ớt',
        nutritionPer100g: { calories: 160, protein: 8, fat: 9, carbs: 11 },
        quantityPer100People: 13, // kg
        unit: 'kg'
      }
    ];
    
    // Insert tofu dishes
    const result = await db.collection('dishes').insertMany(tofuDishes);
    console.log(`✅ Added ${result.insertedCount} tofu dishes`);
    
    // Update some existing dishes to include tofu
    const updatePromises = [];
    
    // Find some random dishes to update
    const randomDishes = await db.collection('dishes')
      .find({ category: 'Món mặn', ingredients: { $exists: true } })
      .limit(50)
      .toArray();
    
    // Update 20 random dishes to include tofu
    for (let i = 0; i < Math.min(20, randomDishes.length); i++) {
      const dish = randomDishes[i];
      if (dish.ingredients && typeof dish.ingredients === 'string' && !dish.ingredients.includes('đậu phụ')) {
        updatePromises.push(
          db.collection('dishes').updateOne(
            { _id: dish._id },
            { 
              $set: { 
                ingredients: dish.ingredients + ', đậu phụ',
                quantityPer100People: (dish.quantityPer100People || 10) + 2 // Add 2kg for tofu
              } 
            }
          )
        );
      }
    }
    
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
      console.log(`✅ Updated ${updatePromises.length} existing dishes to include tofu`);
    }
    
    // Count total tofu dishes
    const tofuDishCount = await db.collection('dishes').countDocuments({
      $or: [
        { ingredients: /đậu phụ/i },
        { ingredients: /tofu/i }
      ]
    });
    
    console.log(`\n📊 Total dishes with tofu: ${tofuDishCount}`);
    
  } catch (error) {
    console.error('Error adding tofu dishes:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
addTofuDishes().catch(console.error); 