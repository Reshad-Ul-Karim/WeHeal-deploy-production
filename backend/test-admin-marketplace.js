import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/userModel.js';
import Product from './models/productModel.js';

dotenv.config();

const testAdminMarketplace = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check admin user
    const adminUser = await User.findOne({ email: 'abrar.samin@g.bracu.ac.bd' });
    if (adminUser) {
      console.log('Admin user found:', {
        id: adminUser._id,
        email: adminUser.email,
        role: adminUser.role
      });
    } else {
      console.log('Admin user not found');
    }

    // Check products
    const products = await Product.find({}).limit(5);
    console.log(`Found ${products.length} products in database`);
    
    if (products.length > 0) {
      console.log('Sample product:', {
        id: products[0]._id,
        name: products[0].name,
        category: products[0].category,
        price: products[0].price
      });
    } else {
      console.log('No products found in database');
      
      // Create a sample product
      const sampleProduct = new Product({
        name: 'Sample Medicine',
        description: 'A test medicine for marketplace testing',
        category: 'medicine',
        price: 25.99,
        stock: 100,
        manufacturer: 'Test Pharma',
        dosage: '500mg',
        requirements: 'Prescription required',
        isActive: true
      });
      
      await sampleProduct.save();
      console.log('Created sample product:', sampleProduct._id);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

testAdminMarketplace();
