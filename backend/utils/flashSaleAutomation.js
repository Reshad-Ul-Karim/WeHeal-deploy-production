import cron from 'node-cron';
import FlashSale from '../models/flashSaleModel.js';
import Product from '../models/productModel.js';

// Function to create random flash sales
const createRandomFlashSales = async () => {
  try {
    console.log('🔥 Starting automatic flash sale creation...');
    
    // Check current active flash sales count
    const now = new Date();
    const activeFlashSalesCount = await FlashSale.countDocuments({
      isActive: true,
      startTime: { $lte: now },
      endTime: { $gt: now }
    });

    // Don't create if we already have 3 or more active sales
    if (activeFlashSalesCount >= 3) {
      console.log(`⚠️ Already have ${activeFlashSalesCount} active flash sales. Skipping creation.`);
      return;
    }

    // Get products that are not currently in flash sale
    const existingFlashSaleProductIds = await FlashSale.find({
      isActive: true,
      endTime: { $gt: now }
    }).distinct('productId');

    const availableProducts = await Product.find({
      isActive: true,
      category: 'medicine',
      _id: { $nin: existingFlashSaleProductIds },
      price: { $gte: 10 }
    });

    if (availableProducts.length === 0) {
      console.log('❌ No available products for flash sale creation');
      return;
    }

    // Create 1-2 random flash sales
    const salesToCreate = Math.min(Math.floor(Math.random() * 2) + 1, availableProducts.length);
    const createdSales = [];

    for (let i = 0; i < salesToCreate; i++) {
      const randomProduct = availableProducts[Math.floor(Math.random() * availableProducts.length)];
      
      // Remove from available products to avoid duplicates
      const index = availableProducts.indexOf(randomProduct);
      availableProducts.splice(index, 1);

      const discountPercentage = Math.floor(Math.random() * 41) + 10; // 10-50%
      const salePrice = Math.round(randomProduct.price * (100 - discountPercentage) / 100);
      const durationHours = Math.floor(Math.random() * 11) + 2; // 2-12 hours
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + (durationHours * 60 * 60 * 1000));

      const flashSale = new FlashSale({
        productId: randomProduct._id,
        originalPrice: randomProduct.price,
        salePrice,
        discountPercentage,
        startTime,
        endTime,
        maxQuantity: Math.floor(Math.random() * 20) + 5,
        title: `Flash Sale: ${randomProduct.name}`,
        description: `Limited time offer on ${randomProduct.name}! ${discountPercentage}% off for ${durationHours} hours only!`
      });

      await flashSale.save();
      createdSales.push(flashSale);
      
      console.log(`✅ Created flash sale: ${randomProduct.name} - ${discountPercentage}% off (${durationHours}h)`);
    }

    console.log(`🎉 Successfully created ${createdSales.length} flash sales!`);

  } catch (error) {
    console.error('❌ Error creating automatic flash sales:', error);
  }
};

// Function to cleanup expired flash sales
const cleanupExpiredFlashSales = async () => {
  try {
    const now = new Date();
    
    const expiredSales = await FlashSale.updateMany(
      {
        isActive: true,
        endTime: { $lte: now }
      },
      {
        isActive: false
      }
    );

    if (expiredSales.modifiedCount > 0) {
      console.log(`🧹 Cleaned up ${expiredSales.modifiedCount} expired flash sales`);
    }

  } catch (error) {
    console.error('❌ Error cleaning up expired flash sales:', error);
  }
};

// Initialize flash sale automation
export const initFlashSaleAutomation = () => {
  console.log('⚡ Initializing Flash Sale Automation...');

  // Create flash sales every 4-8 hours (randomized)
  const scheduleFlashSaleCreation = () => {
    const hours = Math.floor(Math.random() * 5) + 4; // 4-8 hours
    const minutes = Math.floor(Math.random() * 60); // Random minutes
    
    setTimeout(() => {
      createRandomFlashSales();
      scheduleFlashSaleCreation(); // Schedule next creation
    }, (hours * 60 + minutes) * 60 * 1000);
    
    console.log(`📅 Next flash sale creation scheduled in ${hours}h ${minutes}m`);
  };

  // Start the scheduling
  scheduleFlashSaleCreation();

  // Cleanup expired sales every hour
  cron.schedule('0 * * * *', () => {
    cleanupExpiredFlashSales();
  });

  // Create initial flash sales if none exist
  setTimeout(() => {
    createRandomFlashSales();
  }, 5000); // 5 seconds after server start

  console.log('✨ Flash Sale Automation initialized successfully!');
};

// Manual functions for testing/admin use
export {
  createRandomFlashSales,
  cleanupExpiredFlashSales
};
