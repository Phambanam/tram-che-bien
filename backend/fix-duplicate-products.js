const { MongoClient, ObjectId } = require('mongodb');

async function fixDuplicateProducts() {
  const client = new MongoClient('mongodb://admin:password@localhost:27017/military-logistics?authSource=admin');
  await client.connect();
  const db = client.db('military-logistics');
  
  try {
    // Find all 'Thịt lợn' products
    const porkProducts = await db.collection('products').find({ name: 'Thịt lợn' }).toArray();
    console.log('Found Thịt lợn products:', porkProducts.map(p => ({ 
      _id: p._id.toString(), 
      code: p.code, 
      name: p.name,
      category: p.category 
    })));
    
    // Delete the one without code
    const productWithoutCode = porkProducts.find(p => !p.code);
    if (productWithoutCode) {
      console.log('Deleting product without code:', productWithoutCode._id.toString());
      
      // Update any requests using this product to use the correct one
      const correctProduct = porkProducts.find(p => p.code === 'thit-lon');
      if (correctProduct) {
        const updateResult = await db.collection('supplyOutputs').updateMany(
          { productId: productWithoutCode._id },
          { $set: { productId: correctProduct._id } }
        );
        console.log('Updated', updateResult.modifiedCount, 'supply output requests');
      }
      
      // Delete the duplicate product
      await db.collection('products').deleteOne({ _id: productWithoutCode._id });
      console.log('Deleted duplicate product');
    } else {
      console.log('No duplicate product found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

fixDuplicateProducts(); 