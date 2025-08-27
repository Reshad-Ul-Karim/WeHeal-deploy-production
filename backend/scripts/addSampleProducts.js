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
    brand: 'MediCare',
    images: ['/api/uploads/sample-paracetamol.jpg'],
    medicineDetails: {
      dosage: '500mg',
      form: 'tablet',
      activeIngredient: 'Paracetamol',
      prescriptionRequired: false,
      sideEffects: ['Nausea', 'Allergic reactions (rare)'],
      instructions: 'Take 1-2 tablets every 4-6 hours as needed. Do not exceed 8 tablets in 24 hours.'
    }
  },
  {
    name: 'Amoxicillin 250mg',
    description: 'Antibiotic used to treat bacterial infections.',
    price: 25.50,
    category: 'medicine',
    stock: 50,
    brand: 'PharmaCorp',
    images: ['/api/uploads/sample-amoxicillin.jpg'],
    medicineDetails: {
      dosage: '250mg',
      form: 'capsule',
      activeIngredient: 'Amoxicillin',
      prescriptionRequired: true,
      sideEffects: ['Nausea', 'Diarrhea', 'Allergic reactions'],
      instructions: 'Take as directed by physician. Complete the full course even if feeling better.'
    }
  },
  {
    name: 'Ibuprofen 200mg',
    description: 'Anti-inflammatory pain reliever for joint pain, headaches, and fever.',
    price: 18.75,
    category: 'medicine',
    stock: 75,
    brand: 'HealthPlus',
    images: ['/api/uploads/sample-ibuprofen.jpg'],
    medicineDetails: {
      dosage: '200mg',
      form: 'tablet',
      activeIngredient: 'Ibuprofen',
      prescriptionRequired: false,
      sideEffects: ['Stomach upset', 'Drowsiness', 'Allergic reactions'],
      instructions: 'Take with food. 1-2 tablets every 6-8 hours as needed.'
    }
  },
  {
    name: 'Vitamin D3 1000IU',
    description: 'Essential vitamin supplement for bone health and immune support.',
    price: 22.00,
    category: 'medicine',
    stock: 120,
    brand: 'VitaLife',
    images: ['/api/uploads/sample-vitamind3.jpg'],
    medicineDetails: {
      dosage: '1000IU',
      form: 'softgel',
      activeIngredient: 'Cholecalciferol',
      prescriptionRequired: false,
      sideEffects: ['Rare: nausea if taken in excess'],
      instructions: 'Take 1 softgel daily with a meal.'
    }
  },

  // Lab Tests
  {
    name: 'Complete Blood Count (CBC)',
    description: 'Comprehensive blood test to check overall health and detect various disorders.',
    price: 45.00,
    category: 'lab-test',
    stock: 999, // Lab tests don't really have stock limits
    brand: 'LabCorp',
    images: ['/api/uploads/sample-cbc.jpg'],
    labTestDetails: {
      testType: 'Blood Test',
      duration: '1-2 hours',
      preparation: 'No fasting required',
      sampleType: 'Blood',
      reportTime: '24-48 hours',
      testIncludes: [
        'White Blood Cell Count',
        'Red Blood Cell Count',
        'Hemoglobin',
        'Hematocrit',
        'Platelet Count'
      ]
    }
  },
  {
    name: 'Lipid Profile',
    description: 'Test to measure cholesterol and triglyceride levels in blood.',
    price: 55.00,
    category: 'lab-test',
    stock: 999,
    brand: 'LabCorp',
    images: ['/api/uploads/sample-lipid.jpg'],
    labTestDetails: {
      testType: 'Blood Test',
      duration: '30 minutes',
      preparation: '12-hour fasting required',
      sampleType: 'Blood',
      reportTime: '24 hours',
      testIncludes: [
        'Total Cholesterol',
        'LDL Cholesterol',
        'HDL Cholesterol',
        'Triglycerides',
        'Cholesterol Ratio'
      ]
    }
  },
  {
    name: 'Thyroid Function Test (TSH, T3, T4)',
    description: 'Comprehensive thyroid function assessment.',
    price: 85.00,
    category: 'lab-test',
    stock: 999,
    brand: 'DiagnosticLab',
    images: ['/api/uploads/sample-thyroid.jpg'],
    labTestDetails: {
      testType: 'Blood Test',
      duration: '30 minutes',
      preparation: 'No special preparation required',
      sampleType: 'Blood',
      reportTime: '48 hours',
      testIncludes: [
        'TSH (Thyroid Stimulating Hormone)',
        'T3 (Triiodothyronine)',
        'T4 (Thyroxine)',
        'Free T3',
        'Free T4'
      ]
    }
  },
  {
    name: 'Diabetes Panel (HbA1c + Glucose)',
    description: 'Comprehensive diabetes screening and monitoring tests.',
    price: 65.00,
    category: 'lab-test',
    stock: 999,
    brand: 'HealthLab',
    images: ['/api/uploads/sample-diabetes.jpg'],
    labTestDetails: {
      testType: 'Blood Test',
      duration: '30 minutes',
      preparation: '8-hour fasting required for glucose test',
      sampleType: 'Blood',
      reportTime: '24-48 hours',
      testIncludes: [
        'HbA1c (3-month average blood sugar)',
        'Fasting Glucose',
        'Random Glucose',
        'Glucose Tolerance interpretation'
      ]
    }
  },
  {
    name: 'Liver Function Test (LFT)',
    description: 'Tests to assess liver health and function.',
    price: 70.00,
    category: 'lab-test',
    stock: 999,
    brand: 'MedLab',
    images: ['/api/uploads/sample-liver.jpg'],
    labTestDetails: {
      testType: 'Blood Test',
      duration: '30 minutes',
      preparation: 'No fasting required',
      sampleType: 'Blood',
      reportTime: '24 hours',
      testIncludes: [
        'ALT (Alanine Aminotransferase)',
        'AST (Aspartate Aminotransferase)',
        'Bilirubin (Total & Direct)',
        'Alkaline Phosphatase',
        'Protein levels'
      ]
    }
  },
  {
    name: 'Kidney Function Test',
    description: 'Tests to evaluate kidney health and function.',
    price: 60.00,
    category: 'lab-test',
    stock: 999,
    brand: 'DiagnosticLab',
    images: ['/api/uploads/sample-kidney.jpg'],
    labTestDetails: {
      testType: 'Blood & Urine Test',
      duration: '45 minutes',
      preparation: 'No special preparation required',
      sampleType: 'Blood and Urine',
      reportTime: '24-48 hours',
      testIncludes: [
        'Creatinine',
        'Blood Urea Nitrogen (BUN)',
        'eGFR (estimated Glomerular Filtration Rate)',
        'Uric Acid',
        'Urinalysis'
      ]
    }
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
