const mongoose = require('mongoose');
require('dotenv').config();

async function assignUnit() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/military-logistics');
    console.log('✅ Connected to MongoDB');
    
    // Define schemas
    const userSchema = new mongoose.Schema({
      name: String,
      phoneNumber: String,
      password: String,
      role: String,
      unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
      active: Boolean
    });
    
    const unitSchema = new mongoose.Schema({
      name: String,
      type: String,
      personnel: Number,
      active: Boolean
    });
    
    const User = mongoose.model('User', userSchema);
    const Unit = mongoose.model('Unit', unitSchema);
    
    // Tìm units có sẵn
    console.log('🔍 Tìm units có sẵn...');
    const units = await Unit.find({ active: true });
    console.log(`Found ${units.length} units:`);
    units.forEach(unit => {
      console.log(`   - ${unit.name} (ID: ${unit._id})`);
    });
    
    // Tìm user cần gán unit
    const user = await User.findOne({ phoneNumber: '0987654321' });
    if (!user) {
      console.log('❌ Không tìm thấy user với số điện thoại 0987654321');
      return;
    }
    
    // Gán unit đầu tiên cho user
    if (units.length > 0) {
      user.unit = units[0]._id;
      await user.save();
      console.log(`✅ Đã gán unit "${units[0].name}" cho user 0987654321`);
    } else {
      console.log('⚠️  Không có unit nào để gán');
    }
    
    await mongoose.disconnect();
    console.log('🎉 Hoàn thành! User 0987654321 đã sẵn sàng để login.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

assignUnit(); 