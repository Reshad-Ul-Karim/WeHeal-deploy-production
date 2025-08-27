import { connectDB } from '../db/connectDB.js';
import { LabTestPricing } from '../models/labTestPricingModel.js';
import { LabCenter } from '../models/labCenterModel.js';
import Product from '../models/productModel.js';
import dotenv from 'dotenv';

dotenv.config();

async function addSampleLabTestPricing() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Successfully connected to MongoDB');

    // Get lab centers
    const labCenters = await LabCenter.find({ isActive: true });
    if (labCenters.length === 0) {
      console.log('❌ No lab centers found. Please run addSampleLabCenters.js first.');
      return;
    }

    // Get lab test products
    const labTestProducts = await Product.find({ category: 'lab-test', isActive: true });
    if (labTestProducts.length === 0) {
      console.log('❌ No lab test products found. Please create some lab test products first.');
      return;
    }

    console.log(`📋 Found ${labCenters.length} lab centers and ${labTestProducts.length} lab test products`);

    // Clear existing pricing
    await LabTestPricing.deleteMany({});
    console.log('🗑️ Cleared existing lab test pricing');

    const pricingData = [];

    // Create pricing for each lab test product across different lab centers
    for (const product of labTestProducts) {
      for (const labCenter of labCenters) {
        // Generate different pricing based on lab center rating and location
        const basePrice = product.price;
        const ratingMultiplier = labCenter.rating / 4.0; // Higher rating = higher price
        const cityMultiplier = getCityMultiplier(labCenter.address.city);
        
        const adjustedPrice = Math.round(basePrice * ratingMultiplier * cityMultiplier);
        const discountPrice = Math.random() > 0.7 ? Math.round(adjustedPrice * 0.9) : null; // 30% chance of discount

        pricingData.push({
          productId: product._id,
          labCenterId: labCenter._id,
          price: adjustedPrice,
          discountPrice,
          sampleCollectionTime: getRandomCollectionTime(),
          reportDeliveryTime: getRandomDeliveryTime(),
          specialInstructions: getRandomInstructions(),
          homeCollectionAvailable: Math.random() > 0.5, // 50% chance
          homeCollectionCharge: Math.random() > 0.5 ? Math.round(adjustedPrice * 0.1) : 0
        });
      }
    }

    // Insert pricing data
    const createdPricing = await LabTestPricing.insertMany(pricingData);
    console.log(`✅ Successfully created ${createdPricing.length} pricing entries`);

    // Populate and display results
    await LabTestPricing.populate(createdPricing, [
      { path: 'productId', select: 'name category' },
      { path: 'labCenterId', select: 'name address.city rating' }
    ]);

    console.log('\n📊 Sample Pricing Summary:');
    const productGroups = {};
    
    createdPricing.forEach(pricing => {
      const productName = pricing.productId.name;
      if (!productGroups[productName]) {
        productGroups[productName] = [];
      }
      productGroups[productName].push(pricing);
    });

    Object.keys(productGroups).forEach(productName => {
      console.log(`\n🧪 ${productName}:`);
      const prices = productGroups[productName];
      prices.sort((a, b) => a.price - b.price);
      
      prices.forEach(pricing => {
        const labCenter = pricing.labCenterId;
        const discountText = pricing.discountPrice ? ` (Discounted: ₹${pricing.discountPrice})` : '';
        const homeCollectionText = pricing.homeCollectionAvailable ? ' 🏠' : '';
        console.log(`   📍 ${labCenter.name} (${labCenter.address.city}) - ₹${pricing.price}${discountText} ⭐${labCenter.rating}${homeCollectionText}`);
      });
    });

    console.log('\n🎉 Sample lab test pricing added successfully!');
    console.log('\n💡 Users can now see different pricing options for each lab test across different lab centers.');

  } catch (error) {
    console.error('❌ Error adding sample lab test pricing:', error.message);
    console.log('\n🔧 Common issues:');
    console.log('1. MongoDB not running');
    console.log('2. No lab centers found (run addSampleLabCenters.js first)');
    console.log('3. No lab test products found (create lab test products first)');
  } finally {
    try {
      await connectDB().then(() => {
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
      });
    } catch (error) {
      console.log('Error disconnecting:', error.message);
      process.exit(1);
    }
  }
}

function getCityMultiplier(city) {
  const multipliers = {
    'Mumbai': 1.2,
    'Delhi': 1.1,
    'Bangalore': 1.0,
    'Chennai': 0.9,
    'Hyderabad': 0.95
  };
  return multipliers[city] || 1.0;
}

function getRandomCollectionTime() {
  const times = [
    '8:00 AM - 10:00 AM',
    '9:00 AM - 11:00 AM',
    '7:00 AM - 9:00 AM',
    '8:30 AM - 10:30 AM',
    '6:00 AM - 8:00 AM'
  ];
  return times[Math.floor(Math.random() * times.length)];
}

function getRandomDeliveryTime() {
  const times = [
    '24-48 hours',
    'Same day',
    '48-72 hours',
    'Next day',
    '3-5 days'
  ];
  return times[Math.floor(Math.random() * times.length)];
}

function getRandomInstructions() {
  const instructions = [
    'Fasting required for 8-12 hours',
    'No special preparation needed',
    'Avoid heavy meals 2 hours before',
    'Bring previous reports if available',
    'Wear loose clothing for easy access'
  ];
  return instructions[Math.floor(Math.random() * instructions.length)];
}

addSampleLabTestPricing();
