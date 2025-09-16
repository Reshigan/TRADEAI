const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://admin:TradeAI_Mongo_2024!@localhost:27017/tradeai?authSource=admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User schema (simplified)
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: String,
  isActive: Boolean
});

const User = mongoose.model('User', userSchema);

async function resetAdminPassword() {
  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Update the admin user
    const result = await User.updateOne(
      { email: 'admin@tradeai.com' },
      { 
        password: hashedPassword,
        isActive: true 
      }
    );
    
    console.log('Update result:', result);
    
    // Verify the user exists
    const user = await User.findOne({ email: 'admin@tradeai.com' });
    console.log('User found:', !!user);
    if (user) {
      console.log('User details:', {
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        hasPassword: !!user.password
      });
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

resetAdminPassword();