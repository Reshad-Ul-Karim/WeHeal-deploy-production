import FlashSale from '../models/flashSaleModel.js';
import Product from '../models/productModel.js';

// Get all active flash sales
export const getActiveFlashSales = async (req, res) => {
  try {
    const now = new Date();
    
    const flashSales = await FlashSale.find({
      isActive: true,
      startTime: { $lte: now },
      endTime: { $gt: now }
    })
    .populate('productId')
    .sort({ createdAt: -1 });

    // Filter out sales where products are not active or sold out
    const availableFlashSales = flashSales.filter(sale => 
      sale.productId && 
      sale.productId.isActive && 
      sale.isAvailable()
    );

    res.status(200).json({
      success: true,
      data: {
        flashSales: availableFlashSales,
        count: availableFlashSales.length
      }
    });

  } catch (error) {
    console.error('Error fetching flash sales:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching flash sales',
      error: error.message
    });
  }
};

// Get flash sale for a specific product
export const getProductFlashSale = async (req, res) => {
  try {
    const { productId } = req.params;
    const now = new Date();

    const flashSale = await FlashSale.findOne({
      productId,
      isActive: true,
      startTime: { $lte: now },
      endTime: { $gt: now }
    }).populate('productId');

    if (!flashSale || !flashSale.isAvailable()) {
      return res.status(404).json({
        success: false,
        message: 'No active flash sale found for this product'
      });
    }

    res.status(200).json({
      success: true,
      data: flashSale
    });

  } catch (error) {
    console.error('Error fetching product flash sale:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product flash sale',
      error: error.message
    });
  }
};

// Create a random flash sale (admin function)
export const createRandomFlashSale = async (req, res) => {
  try {
    // Get random products that are active and not already in flash sale
    const existingFlashSaleProductIds = await FlashSale.find({
      isActive: true,
      endTime: { $gt: new Date() }
    }).distinct('productId');

    const availableProducts = await Product.find({
      isActive: true,
      category: 'medicine', // Only medicines for flash sales
      _id: { $nin: existingFlashSaleProductIds },
      price: { $gte: 10 } // Minimum price for flash sale
    });

    if (availableProducts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No available products for flash sale'
      });
    }

    // Select random product
    const randomProduct = availableProducts[Math.floor(Math.random() * availableProducts.length)];
    
    // Generate random discount between 10-50%
    const discountPercentage = Math.floor(Math.random() * 41) + 10; // 10-50%
    const salePrice = Math.round(randomProduct.price * (100 - discountPercentage) / 100);
    
    // Set duration between 2-12 hours
    const durationHours = Math.floor(Math.random() * 11) + 2; // 2-12 hours
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + (durationHours * 60 * 60 * 1000));

    // Create flash sale
    const flashSale = new FlashSale({
      productId: randomProduct._id,
      originalPrice: randomProduct.price,
      salePrice,
      discountPercentage,
      startTime,
      endTime,
      maxQuantity: Math.floor(Math.random() * 20) + 5, // 5-24 units
      title: `Flash Sale: ${randomProduct.name}`,
      description: `Limited time offer on ${randomProduct.name}! ${discountPercentage}% off for ${durationHours} hours only!`
    });

    await flashSale.save();

    const populatedFlashSale = await FlashSale.findById(flashSale._id).populate('productId');

    res.status(201).json({
      success: true,
      message: 'Flash sale created successfully',
      data: populatedFlashSale
    });

  } catch (error) {
    console.error('Error creating flash sale:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating flash sale',
      error: error.message
    });
  }
};

// Create multiple random flash sales
export const createMultipleRandomFlashSales = async (req, res) => {
  try {
    const { count = 3 } = req.body;
    const maxCount = Math.min(count, 5); // Limit to 5 flash sales at once
    
    const createdSales = [];
    
    for (let i = 0; i < maxCount; i++) {
      try {
        // Get available products for each iteration
        const existingFlashSaleProductIds = await FlashSale.find({
          isActive: true,
          endTime: { $gt: new Date() }
        }).distinct('productId');

        const availableProducts = await Product.find({
          isActive: true,
          category: 'medicine',
          _id: { $nin: [...existingFlashSaleProductIds, ...createdSales.map(s => s.productId)] },
          price: { $gte: 10 }
        });

        if (availableProducts.length === 0) {
          break; // No more products available
        }

        const randomProduct = availableProducts[Math.floor(Math.random() * availableProducts.length)];
        const discountPercentage = Math.floor(Math.random() * 41) + 10;
        const salePrice = Math.round(randomProduct.price * (100 - discountPercentage) / 100);
        const durationHours = Math.floor(Math.random() * 11) + 2;
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

      } catch (error) {
        console.error(`Error creating flash sale ${i + 1}:`, error);
        // Continue with next iteration
      }
    }

    const populatedSales = await FlashSale.find({
      _id: { $in: createdSales.map(s => s._id) }
    }).populate('productId');

    res.status(201).json({
      success: true,
      message: `Created ${createdSales.length} flash sales successfully`,
      data: populatedSales
    });

  } catch (error) {
    console.error('Error creating multiple flash sales:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating flash sales',
      error: error.message
    });
  }
};

// Get all flash sales (admin)
export const getAllFlashSales = async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 10 } = req.query;
    const now = new Date();
    
    let query = {};
    
    switch (status) {
      case 'active':
        query = {
          isActive: true,
          startTime: { $lte: now },
          endTime: { $gt: now }
        };
        break;
      case 'upcoming':
        query = {
          isActive: true,
          startTime: { $gt: now }
        };
        break;
      case 'ended':
        query = {
          endTime: { $lte: now }
        };
        break;
      case 'inactive':
        query = { isActive: false };
        break;
      default:
        // All flash sales
        break;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const flashSales = await FlashSale.find(query)
      .populate('productId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await FlashSale.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        flashSales,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error fetching all flash sales:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching flash sales',
      error: error.message
    });
  }
};

// End flash sale (admin)
export const endFlashSale = async (req, res) => {
  try {
    const { flashSaleId } = req.params;

    const flashSale = await FlashSale.findByIdAndUpdate(
      flashSaleId,
      { 
        isActive: false,
        endTime: new Date() // End it immediately
      },
      { new: true }
    ).populate('productId');

    if (!flashSale) {
      return res.status(404).json({
        success: false,
        message: 'Flash sale not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Flash sale ended successfully',
      data: flashSale
    });

  } catch (error) {
    console.error('Error ending flash sale:', error);
    res.status(500).json({
      success: false,
      message: 'Error ending flash sale',
      error: error.message
    });
  }
};
