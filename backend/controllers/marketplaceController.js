import Product from '../models/productModel.js';
import FlashSale from '../models/flashSaleModel.js';

// Get all products with filtering and pagination
export const getProducts = async (req, res) => {
  try {
    const {
      category,
      search,
      page = 1,
      limit = 12,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = { isActive: true };
    
    if (category && ['medicine', 'lab-test'].includes(category)) {
      query.category = category;
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get active flash sales for these products
    const now = new Date();
    const productIds = products.map(p => p._id);
    
    const activeFlashSales = await FlashSale.find({
      productId: { $in: productIds },
      isActive: true,
      startTime: { $lte: now },
      endTime: { $gt: now }
    });

    // Create a map of flash sales by product ID
    const flashSaleMap = {};
    activeFlashSales.forEach(sale => {
      if (sale.isAvailable()) {
        flashSaleMap[sale.productId.toString()] = {
          id: sale._id,
          originalPrice: sale.originalPrice,
          salePrice: sale.salePrice,
          discountPercentage: sale.discountPercentage,
          endTime: sale.endTime,
          maxQuantity: sale.maxQuantity,
          soldQuantity: sale.soldQuantity,
          title: sale.title,
          description: sale.description
        };
      }
    });

    // Add flash sale info to products
    const productsWithFlashSales = products.map(product => {
      const productObj = product.toObject();
      const flashSale = flashSaleMap[product._id.toString()];
      
      if (flashSale) {
        productObj.flashSale = flashSale;
        productObj.hasFlashSale = true;
        productObj.effectivePrice = flashSale.salePrice;
      } else {
        productObj.hasFlashSale = false;
        productObj.effectivePrice = productObj.price;
      }
      
      return productObj;
    });

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        products: productsWithFlashSales,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProducts,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

// Get single product by ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findOne({ _id: id, isActive: true });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check for active flash sale
    const now = new Date();
    const flashSale = await FlashSale.findOne({
      productId: id,
      isActive: true,
      startTime: { $lte: now },
      endTime: { $gt: now }
    });

    const productObj = product.toObject();
    
    if (flashSale && flashSale.isAvailable()) {
      productObj.flashSale = {
        id: flashSale._id,
        originalPrice: flashSale.originalPrice,
        salePrice: flashSale.salePrice,
        discountPercentage: flashSale.discountPercentage,
        endTime: flashSale.endTime,
        maxQuantity: flashSale.maxQuantity,
        soldQuantity: flashSale.soldQuantity,
        title: flashSale.title,
        description: flashSale.description
      };
      productObj.hasFlashSale = true;
      productObj.effectivePrice = flashSale.salePrice;
    } else {
      productObj.hasFlashSale = false;
      productObj.effectivePrice = productObj.price;
    }

    res.status(200).json({
      success: true,
      data: productObj
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
};

// Get products by category
export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 12, search } = req.query;

    if (!['medicine', 'lab-test'].includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    let query = { category, isActive: true };
    
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get active flash sales for these products
    const now = new Date();
    const productIds = products.map(p => p._id);
    
    const activeFlashSales = await FlashSale.find({
      productId: { $in: productIds },
      isActive: true,
      startTime: { $lte: now },
      endTime: { $gt: now }
    });

    // Create a map of flash sales by product ID
    const flashSaleMap = {};
    activeFlashSales.forEach(sale => {
      if (sale.isAvailable()) {
        flashSaleMap[sale.productId.toString()] = {
          id: sale._id,
          originalPrice: sale.originalPrice,
          salePrice: sale.salePrice,
          discountPercentage: sale.discountPercentage,
          endTime: sale.endTime,
          maxQuantity: sale.maxQuantity,
          soldQuantity: sale.soldQuantity,
          title: sale.title,
          description: sale.description
        };
      }
    });

    // Add flash sale info to products
    const productsWithFlashSales = products.map(product => {
      const productObj = product.toObject();
      const flashSale = flashSaleMap[product._id.toString()];
      
      if (flashSale) {
        productObj.flashSale = flashSale;
        productObj.hasFlashSale = true;
        productObj.effectivePrice = flashSale.salePrice;
      } else {
        productObj.hasFlashSale = false;
        productObj.effectivePrice = productObj.price;
      }
      
      return productObj;
    });

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        products: productsWithFlashSales,
        category,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProducts,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};
