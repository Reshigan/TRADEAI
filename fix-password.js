const { MongoClient } = require('mongodb');

const uri = 'mongodb://admin:TradeAI_Mongo_2024!@localhost:27017/tradeai?authSource=admin';
const newPasswordHash = '$2a$12$N/8jXSlyNRG.BV2fWSGg7eSM1pGUB2xLBdda.m7x/HHgCYew98evi'; // admin123

async function fixPassword() {
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db('tradeai');
        const users = db.collection('users');
        
        // Update admin@tradeai.com password
        const result = await users.updateOne(
            { email: 'admin@tradeai.com' },
            { $set: { password: newPasswordHash } }
        );
        
        console.log('Update result:', result);
        
        if (result.matchedCount > 0) {
            console.log('Password updated successfully for admin@tradeai.com');
        } else {
            console.log('User not found');
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

fixPassword();