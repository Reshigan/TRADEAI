const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config');

async function checkDatabase() {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);

    const userCount = await User.countDocuments();

    if (userCount === 0) {
      console.log('No users found');
      process.exit(0);
    } else {
      console.log(`Found ${userCount} users`);
      process.exit(0);
    }
  } catch (error) {
    console.error('Error checking database:', error);
    process.exit(1);
  }
}

checkDatabase();
