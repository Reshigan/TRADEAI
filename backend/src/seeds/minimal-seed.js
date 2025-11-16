require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trade-ai', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected for seeding');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear only users
    console.log('Clearing users...');
    await User.deleteMany({});

    // Create minimal users
    console.log('Creating users...');
    const password = await bcrypt.hash('Vantax1234#', 10);

    const users = await User.insertMany([
      {
        email: 'info@vantax.co.za',
        password,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true,
        department: 'admin',
        employeeId: 'EMP001'
      }
    ]);

    console.log(`Created ${users.length} users`);
    console.log('\n✅ Minimal database seeded successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: info@vantax.co.za / Vantax1234#');
    console.log('\nNote: This is a minimal seed. You can add more data through the UI.');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
