const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'chz-app-db';

async function approveAllItems() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    const collections = ['jerseys', 'stadiums', 'badges'];
    
    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      
      const result = await collection.updateMany(
        { status: { $ne: 'Approved' } }, // Todos que não são Approved
        { $set: { status: 'Approved', moderatedAt: new Date(), moderatedBy: 'auto-approve-script' } }
      );
      
      console.log(`✅ ${collectionName}: ${result.modifiedCount} items approved`);
    }

    console.log('🎉 All items approved successfully!');
    
  } catch (error) {
    console.error('❌ Error approving items:', error);
  } finally {
    await client.close();
  }
}

approveAllItems(); 