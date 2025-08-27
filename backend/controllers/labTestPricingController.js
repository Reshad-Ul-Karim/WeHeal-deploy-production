import { LabTestPricing } from '../models/labTestPricingModel.js';
import { LabCenter } from '../models/labCenterModel.js';
import Product from '../models/productModel.js';

// Get pricing for a specific lab test
export const getLabTestPricing = async (req, res) => {
  try {
    const { productId } = req.params;
    const { city = '' } = req.query;
    
    let query = { productId, isAvailable: true };
    
    if (city) {
      // Get lab centers in the city first
      const labCenters = await LabCenter.find({
        'address.city': { $regex: city, $options: 'i' },
        isActive: true
      }).select('_id');
      
      const labCenterIds = labCenters.map(lc => lc._id);
      query.labCenterId = { $in: labCenterIds };
    }
    
    const pricing = await LabTestPricing.find(query)
      .populate('labCenterId', 'name address contactInfo rating facilities')
      .sort({ price: 1 });
    
    res.json({
      success: true,
      data: pricing
    });
  } catch (error) {
    console.error('Error fetching lab test pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lab test pricing'
    });
  }
};

// Get all pricing for admin
export const getAllLabTestPricing = async (req, res) => {
  try {
    const { page = 1, limit = 10, productId = '', labCenterId = '' } = req.query;
    
    const query = {};
    
    if (productId) {
      query.productId = productId;
    }
    
    if (labCenterId) {
      query.labCenterId = labCenterId;
    }
    
    const skip = (page - 1) * limit;
    
    const pricing = await LabTestPricing.find(query)
      .populate('productId', 'name category')
      .populate('labCenterId', 'name address.city')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await LabTestPricing.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        pricing,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          total,
          hasNextPage: skip + pricing.length < total,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching lab test pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lab test pricing'
    });
  }
};

// Create new pricing
export const createLabTestPricing = async (req, res) => {
  try {
    const {
      productId,
      labCenterId,
      price,
      discountPrice,
      sampleCollectionTime,
      reportDeliveryTime,
      specialInstructions,
      homeCollectionAvailable,
      homeCollectionCharge
    } = req.body;
    
    // Validate required fields
    if (!productId || !labCenterId || !price) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, Lab Center ID, and price are required'
      });
    }
    
    // Check if product exists and is a lab test
    const product = await Product.findById(productId);
    if (!product || product.category !== 'lab-test') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product or product is not a lab test'
      });
    }
    
    // Check if lab center exists
    const labCenter = await LabCenter.findById(labCenterId);
    if (!labCenter || !labCenter.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lab center or lab center is not active'
      });
    }
    
    // Check if pricing already exists for this product and lab center
    const existingPricing = await LabTestPricing.findOne({
      productId,
      labCenterId
    });
    
    if (existingPricing) {
      return res.status(400).json({
        success: false,
        message: 'Pricing already exists for this product and lab center'
    });
    }
    
    const labTestPricing = new LabTestPricing({
      productId,
      labCenterId,
      price,
      discountPrice,
      sampleCollectionTime,
      reportDeliveryTime,
      specialInstructions,
      homeCollectionAvailable,
      homeCollectionCharge
    });
    
    await labTestPricing.save();
    
    // Populate the response
    await labTestPricing.populate('productId', 'name category');
    await labTestPricing.populate('labCenterId', 'name address');
    
    res.status(201).json({
      success: true,
      message: 'Lab test pricing created successfully',
      data: labTestPricing
    });
  } catch (error) {
    console.error('Error creating lab test pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating lab test pricing'
    });
  }
};

// Update pricing
export const updateLabTestPricing = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const pricing = await LabTestPricing.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('productId', 'name category')
     .populate('labCenterId', 'name address');
    
    if (!pricing) {
      return res.status(404).json({
        success: false,
        message: 'Lab test pricing not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Lab test pricing updated successfully',
      data: pricing
    });
  } catch (error) {
    console.error('Error updating lab test pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating lab test pricing'
    });
  }
};

// Delete pricing
export const deleteLabTestPricing = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pricing = await LabTestPricing.findByIdAndDelete(id);
    
    if (!pricing) {
      return res.status(404).json({
        success: false,
        message: 'Lab test pricing not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Lab test pricing deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lab test pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting lab test pricing'
    });
  }
};

// Bulk create pricing for multiple lab centers
export const bulkCreateLabTestPricing = async (req, res) => {
  try {
    const { productId, labCenterPricing } = req.body;
    
    if (!productId || !labCenterPricing || !Array.isArray(labCenterPricing)) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and lab center pricing array are required'
      });
    }
    
    // Check if product exists and is a lab test
    const product = await Product.findById(productId);
    if (!product || product.category !== 'lab-test') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product or product is not a lab test'
      });
    }
    
    const pricingData = [];
    const errors = [];
    
    for (const pricing of labCenterPricing) {
      try {
        // Check if lab center exists
        const labCenter = await LabCenter.findById(pricing.labCenterId);
        if (!labCenter || !labCenter.isActive) {
          errors.push(`Invalid lab center: ${pricing.labCenterId}`);
          continue;
        }
        
        // Check if pricing already exists
        const existingPricing = await LabTestPricing.findOne({
          productId,
          labCenterId: pricing.labCenterId
        });
        
        if (existingPricing) {
          errors.push(`Pricing already exists for lab center: ${labCenter.name}`);
          continue;
        }
        
        pricingData.push({
          productId,
          labCenterId: pricing.labCenterId,
          price: pricing.price,
          discountPrice: pricing.discountPrice,
          sampleCollectionTime: pricing.sampleCollectionTime,
          reportDeliveryTime: pricing.reportDeliveryTime,
          specialInstructions: pricing.specialInstructions,
          homeCollectionAvailable: pricing.homeCollectionAvailable,
          homeCollectionCharge: pricing.homeCollectionCharge
        });
      } catch (error) {
        errors.push(`Error processing lab center ${pricing.labCenterId}: ${error.message}`);
      }
    }
    
    if (pricingData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid pricing data to create',
        errors
      });
    }
    
    const createdPricing = await LabTestPricing.insertMany(pricingData);
    
    // Populate the response
    await LabTestPricing.populate(createdPricing, [
      { path: 'productId', select: 'name category' },
      { path: 'labCenterId', select: 'name address' }
    ]);
    
    res.status(201).json({
      success: true,
      message: `Created ${createdPricing.length} pricing entries`,
      data: createdPricing,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error bulk creating lab test pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk creating lab test pricing'
    });
  }
};
