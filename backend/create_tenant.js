const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/trade-ai', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  
  // Define Tenant schema (simplified)
  const TenantSchema = new mongoose.Schema({
    name: String,
    slug: String,
    isActive: { type: Boolean, default: true },
    subscription: {
      plan: String,
      status: String
    },
    settings: mongoose.Schema.Types.Mixed
  });
  
  const Tenant = mongoose.model('Tenant', TenantSchema);
  
  // Get the tenantId from users
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const user = await User.findOne({ email: 'admin@tradeai.com' });
  
  if (!user) {
    console.log('User not found');
    process.exit(1);
  }
  
  console.log('Found user with tenantId:', user.tenantId);
  
  // Create or update tenant
  const tenant = await Tenant.findByIdAndUpdate(
    user.tenantId,
    {
      _id: user.tenantId,
      name: 'TradeAI Demo Company',
      slug: 'tradeai-demo',
      isActive: true,
      subscription: {
        plan: 'enterprise',
        status: 'active'
      },
      settings: {
        currency: 'ZAR',
        timezone: 'Africa/Johannesburg'
      }
    },
    { upsert: true, new: true }
  );
  
  console.log('Tenant created/updated:', tenant);
  
  await mongoose.connection.close();
  console.log('Done!');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
