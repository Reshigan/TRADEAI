require('dotenv').config({ path: '.env.development' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  firstName: String,
  lastName: String,
  role: String,
  isActive: Boolean,
  isDeleted: Boolean
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function seed() {
  try {
    console.log('🔌 Connecting to MongoDB:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});

    // Create test user
    console.log('👤 Creating test user...');
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    
    const user = new User({
      email: 'admin@demo.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'super_admin',
      isActive: true,
      isDeleted: false
    });

    await user.save();
    console.log('✅ User created:', user.email);

    console.log('\n✨ Database seeded successfully!');
    console.log('\n📧 Login credentials:');
    console.log('   Email: admin@demo.com');
    console.log('   Password: Admin@123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
