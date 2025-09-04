import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/productModel.js';
import { connectDB } from '../db/connectDB.js';

dotenv.config();

const sampleProducts = [
  // Medicines
  {
    name: 'Paracetamol 500mg',
    description: 'Pain reliever and fever reducer. Used for headaches, muscle aches, and fever.',
    price: 12.99,
    category: 'medicine',
    stock: 100,
    manufacturer: 'MediCare',
    image: '/api/uploads/sample-paracetamol.jpg',
    dosage: '500mg',
    composition: 'Paracetamol',
    prescriptionRequired: false
  },
  {
    name: 'Amoxicillin 250mg',
    description: 'Antibiotic used to treat bacterial infections.',
    price: 25.50,
    category: 'medicine',
    stock: 50,
    manufacturer: 'PharmaCorp',
    image: '/api/uploads/sample-amoxicillin.jpg',
    dosage: '250mg',
    composition: 'Amoxicillin',
    prescriptionRequired: true
  },
  {
    name: 'Ibuprofen 200mg',
    description: 'Anti-inflammatory pain reliever for joint pain, headaches, and fever.',
    price: 18.75,
    category: 'medicine',
    stock: 75,
    manufacturer: 'HealthPlus',
    image: '/api/uploads/sample-ibuprofen.jpg',
    dosage: '200mg',
    composition: 'Ibuprofen',
    prescriptionRequired: false
  },
  {
    name: 'Vitamin D3 1000IU',
    description: 'Essential vitamin supplement for bone health and immune support.',
    price: 22.00,
    category: 'medicine',
    stock: 120,
    manufacturer: 'VitaLife',
    image: '/api/uploads/sample-vitamind3.jpg',
    dosage: '1000IU',
    composition: 'Cholecalciferol',
    prescriptionRequired: false
  },

  // Lab Tests
  {
    name: 'Complete Blood Count (CBC)',
    description: 'Comprehensive blood test to check overall health and detect various disorders.',
    price: 45.00,
    category: 'lab-test',
    stock: 999, // Lab tests don't really have stock limits
    manufacturer: 'LabCorp',
    image: '/api/uploads/sample-cbc.jpg',
    testType: 'Blood Test',
    preparationInstructions: 'No fasting required',
    sampleType: 'Blood',
    reportDeliveryTime: '24-48 hours',
    labOptions: [
      { labName: 'LabCorp Central', price: 45.00 },
      { labName: 'Diagnostic Plus', price: 50.00 },
      { labName: 'Health Lab', price: 42.00 }
    ]
  },
  {
    name: 'Lipid Profile',
    description: 'Test to measure cholesterol and triglyceride levels in blood.',
    price: 55.00,
    category: 'lab-test',
    stock: 999,
    manufacturer: 'LabCorp',
    image: '/api/uploads/sample-lipid.jpg',
    testType: 'Blood Test',
    preparationInstructions: '12-hour fasting required',
    sampleType: 'Blood',
    reportDeliveryTime: '24 hours',
    labOptions: [
      { labName: 'LabCorp Central', price: 55.00 },
      { labName: 'Diagnostic Plus', price: 60.00 },
      { labName: 'Health Lab', price: 52.00 }
    ]
  },
  {
    name: 'Thyroid Function Test (TSH, T3, T4)',
    description: 'Comprehensive thyroid function assessment.',
    price: 85.00,
    category: 'lab-test',
    stock: 999,
    manufacturer: 'DiagnosticLab',
    image: '/api/uploads/sample-thyroid.jpg',
    testType: 'Blood Test',
    preparationInstructions: 'No special preparation required',
    sampleType: 'Blood',
    reportDeliveryTime: '48 hours',
    labOptions: [
      { labName: 'DiagnosticLab Central', price: 85.00 },
      { labName: 'LabCorp Central', price: 90.00 },
      { labName: 'Health Lab', price: 80.00 }
    ]
  },
  {
    name: 'Diabetes Panel (HbA1c + Glucose)',
    description: 'Comprehensive diabetes screening and monitoring tests.',
    price: 65.00,
    category: 'lab-test',
    stock: 999,
    manufacturer: 'HealthLab',
    image: '/api/uploads/sample-diabetes.jpg',
    testType: 'Blood Test',
    preparationInstructions: '8-hour fasting required for glucose test',
    sampleType: 'Blood',
    reportDeliveryTime: '24-48 hours',
    labOptions: [
      { labName: 'HealthLab Central', price: 65.00 },
      { labName: 'Diagnostic Plus', price: 70.00 },
      { labName: 'LabCorp Central', price: 62.00 }
    ]
  },
  {
    name: 'Liver Function Test (LFT)',
    description: 'Tests to assess liver health and function.',
    price: 70.00,
    category: 'lab-test',
    stock: 999,
    manufacturer: 'MedLab',
    image: '/api/uploads/sample-liver.jpg',
    testType: 'Blood Test',
    preparationInstructions: 'No fasting required',
    sampleType: 'Blood',
    reportDeliveryTime: '24 hours',
    labOptions: [
      { labName: 'MedLab Central', price: 70.00 },
      { labName: 'Health Lab', price: 75.00 },
      { labName: 'Diagnostic Plus', price: 68.00 }
    ]
  },
  {
    name: 'Kidney Function Test',
    description: 'Tests to evaluate kidney health and function.',
    price: 60.00,
    category: 'lab-test',
    stock: 999,
    manufacturer: 'DiagnosticLab',
    image: '/api/uploads/sample-kidney.jpg',
    testType: 'Blood & Urine Test',
    preparationInstructions: 'No special preparation required',
    sampleType: 'Blood and Urine',
    reportDeliveryTime: '24-48 hours',
    labOptions: [
      { labName: 'DiagnosticLab Central', price: 60.00 },
      { labName: 'MedLab Central', price: 65.00 },
      { labName: 'Health Lab', price: 58.00 }
    ]
  }
];

async function addSampleProducts() {
  try {
    await connectDB();
    
    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');
    
    // Add sample products
    const products = await Product.insertMany(sampleProducts);
    console.log(`Added ${products.length} sample products:`);
    
    products.forEach(product => {
      console.log(`- ${product.name} (${product.category}) - $${product.price}`);
    });
    
    console.log('\nSample products added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding sample products:', error);
    process.exit(1);
  }
}

addSampleProducts();
