const { MongoClient, ObjectId } = require('mongodb');

async function seedSupplyOutputRequests() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/military-logistics?authSource=admin');
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db();
    
    // Clear existing requests
    console.log('🧹 Clearing existing supply output requests...');
    const deleteResult = await db.collection('supplyOutputs').deleteMany({
      type: 'request'
    });
    console.log(`Deleted ${deleteResult.deletedCount} existing requests`);
    
    // Get data needed for creating requests
    console.log('📋 Fetching units, products, and users...');
    const units = await db.collection('units').find({}).toArray();
    const products = await db.collection('products').find({}).toArray();
    const unitAssistants = await db.collection('users').find({ role: 'unitAssistant' }).toArray();
    
    if (units.length === 0 || products.length === 0 || unitAssistants.length === 0) {
      console.log('❌ Missing required data. Please ensure units, products, and unit assistants exist.');
      return;
    }
    
    console.log(`Found ${units.length} units, ${products.length} products, ${unitAssistants.length} unit assistants`);
    
    // Create sample supply output requests
    const requests = [];
    const priorities = ['normal', 'urgent', 'critical'];
    const reasons = [
      'Chuẩn bị cho hoạt động huấn luyện',
      'Bổ sung cho bữa ăn của đơn vị', 
      'Phục vụ lễ tết và các hoạt động đặc biệt',
      'Dự trữ cho tình huống khẩn cấp',
      'Thay thế hàng hóa hết hạn sử dụng'
    ];
    
    // Create requests for next 7 days
    for (let day = 0; day < 7; day++) {
      const requestDate = new Date();
      requestDate.setDate(requestDate.getDate() + day);
      
      // Each unit assistant creates 2-3 requests per day
      for (const assistant of unitAssistants) {
        const requestCount = Math.floor(Math.random() * 2) + 2; // 2-3 requests
        
        for (let i = 0; i < requestCount; i++) {
          const randomProduct = products[Math.floor(Math.random() * products.length)];
          const randomPriority = priorities[Math.floor(Math.random() * priorities.length)];
          const randomReason = reasons[Math.floor(Math.random() * reasons.length)];
          
          // Get unit for this assistant
          const assistantUnit = units.find(u => u._id.equals(assistant.unit));
          
          if (assistantUnit) {
            requests.push({
              type: 'request',
              receivingUnit: assistantUnit._id,
              productId: randomProduct._id,
              quantity: Math.floor(Math.random() * 50) + 10, // 10-60 kg
              requestDate: new Date(requestDate),
              outputDate: new Date(requestDate),
              priority: randomPriority,
              reason: randomReason,
              receiver: `${assistantUnit.name} - Yêu cầu`,
              status: Math.random() > 0.7 ? 'pending' : 'pending', // Most are pending
              note: `Yêu cầu ${randomProduct.name} cho ${assistantUnit.name}`,
              requestedBy: assistant._id,
              createdBy: assistant._id,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }
      }
    }
    
    // Add some processed requests (approved/rejected) for demo
    const processedRequests = [];
    const brigadeAssistants = await db.collection('users').find({ role: 'brigadeAssistant' }).toArray();
    
    if (brigadeAssistants.length > 0) {
      const brigadeAssistant = brigadeAssistants[0];
      
      // Add 5 approved requests from yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      for (let i = 0; i < 5; i++) {
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        const randomUnit = units[Math.floor(Math.random() * units.length)];
        const randomAssistant = unitAssistants[Math.floor(Math.random() * unitAssistants.length)];
        
        processedRequests.push({
          type: 'request',
          receivingUnit: randomUnit._id,
          productId: randomProduct._id,
          quantity: Math.floor(Math.random() * 40) + 20,
          requestDate: yesterday,
          outputDate: yesterday,
          priority: 'normal',
          reason: 'Yêu cầu đã được xử lý',
          receiver: `${randomUnit.name} - Yêu cầu`,
          status: 'approved',
          note: 'Yêu cầu được phê duyệt',
          requestedBy: randomAssistant._id,
          createdBy: randomAssistant._id,
          approvedBy: brigadeAssistant._id,
          approvedAt: new Date(yesterday.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
          approvedQuantity: Math.floor(Math.random() * 40) + 20,
          approvalNote: 'Phê duyệt theo yêu cầu',
          createdAt: yesterday,
          updatedAt: new Date(yesterday.getTime() + 2 * 60 * 60 * 1000),
        });
      }
      
      // Add 2 rejected requests
      for (let i = 0; i < 2; i++) {
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        const randomUnit = units[Math.floor(Math.random() * units.length)];
        const randomAssistant = unitAssistants[Math.floor(Math.random() * unitAssistants.length)];
        
        processedRequests.push({
          type: 'request',
          receivingUnit: randomUnit._id,
          productId: randomProduct._id,
          quantity: Math.floor(Math.random() * 100) + 50, // Higher quantity
          requestDate: yesterday,
          outputDate: yesterday,
          priority: 'normal',
          reason: 'Yêu cầu bị từ chối',
          receiver: `${randomUnit.name} - Yêu cầu`,
          status: 'rejected',
          note: 'Yêu cầu số lượng lớn',
          requestedBy: randomAssistant._id,
          createdBy: randomAssistant._id,
          rejectedBy: brigadeAssistant._id,
          rejectedAt: new Date(yesterday.getTime() + 1 * 60 * 60 * 1000), // 1 hour later
          rejectionReason: 'Không đủ tồn kho để đáp ứng yêu cầu',
          createdAt: yesterday,
          updatedAt: new Date(yesterday.getTime() + 1 * 60 * 60 * 1000),
        });
      }
    }
    
    // Combine all requests
    const allRequests = [...requests, ...processedRequests];
    
    if (allRequests.length > 0) {
      console.log('📦 Inserting supply output requests...');
      const result = await db.collection('supplyOutputs').insertMany(allRequests);
      console.log(`✅ Created ${result.insertedCount} supply output requests`);
      
      // Show summary
      const pendingCount = allRequests.filter(r => r.status === 'pending').length;
      const approvedCount = allRequests.filter(r => r.status === 'approved').length;
      const rejectedCount = allRequests.filter(r => r.status === 'rejected').length;
      
      console.log('\n📊 Summary by status:');
      console.log(`   - Pending: ${pendingCount}`);
      console.log(`   - Approved: ${approvedCount}`);
      console.log(`   - Rejected: ${rejectedCount}`);
      console.log(`   - Total: ${allRequests.length}`);
      
      // Show summary by priority
      const urgentCount = allRequests.filter(r => r.priority === 'urgent').length;
      const criticalCount = allRequests.filter(r => r.priority === 'critical').length;
      const normalCount = allRequests.filter(r => r.priority === 'normal').length;
      
      console.log('\n⚡ Summary by priority:');
      console.log(`   - Critical: ${criticalCount}`);
      console.log(`   - Urgent: ${urgentCount}`);
      console.log(`   - Normal: ${normalCount}`);
      
      // Show sample requests
      console.log('\n📋 Sample requests created:');
      const sampleRequests = allRequests.slice(0, 5);
      for (const request of sampleRequests) {
        const unit = units.find(u => u._id.equals(request.receivingUnit));
        const product = products.find(p => p._id.equals(request.productId));
        console.log(`   - ${product?.name || 'Unknown'}: ${request.quantity}kg → ${unit?.name || 'Unknown'} (${request.status})`);
      }
    } else {
      console.log('❌ No requests created. Check if required data exists.');
    }
    
  } catch (error) {
    console.error('❌ Error seeding supply output requests:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the seeding
seedSupplyOutputRequests().catch(console.error); 