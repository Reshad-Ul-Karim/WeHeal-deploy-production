import Product from '../models/productModel.js';
import Order from '../models/orderModel.js';
import multer from 'multer';
import path from 'path';
import { generateLabReport } from '../utils/generateLabReport.js';

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/products/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
}).single('image');

// Get all products for admin
export const getAllProducts = async (req, res) => {
  try {
    const {
      category,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive
    } = req.query;

    // Build query
    let query = {};
    
    if (category && ['medicine', 'lab-test'].includes(category)) {
      query.category = category;
    }
    
    // By default, show only active products in admin list after deletions
    if (isActive === undefined) {
      query.isActive = true;
    } else if (isActive === 'all') {
      // include both active and inactive
    } else {
      query.isActive = isActive === 'true';
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

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        products,
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

// Create new product
export const createProduct = async (req, res) => {
  upload(req, res, async function(err) {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    try {
      const {
        name,
        description,
        category,
        price,
        stock,
        manufacturer,
        dosage,
        composition,
        prescriptionRequired,
        testType,
        preparationInstructions,
        reportDeliveryTime,
        sampleType,
        labOptions
      } = req.body;

      // Validate required fields based on category
      if (!name || !description || !category) {
        return res.status(400).json({
          success: false,
          message: 'Name, description, and category are required'
        });
      }

      if (!['medicine', 'lab-test'].includes(category)) {
        return res.status(400).json({
          success: false,
          message: 'Category must be either "medicine" or "lab-test"'
        });
      }

      // Validate medicine-specific required fields
      if (category === 'medicine') {
        if (!price || stock === undefined) {
          return res.status(400).json({
            success: false,
            message: 'Price and stock are required for medicines'
          });
        }
      }

      // Create product object
      const productData = {
        name: name.trim(),
        description: description.trim(),
        category,
        manufacturer: manufacturer || '',
        image: req.file ? `/uploads/products/${req.file.filename}` : ''
      };

      // Add category-specific fields
      if (category === 'medicine') {
        productData.price = parseFloat(price);
        productData.stock = parseInt(stock);
        productData.dosage = dosage || '';
        productData.composition = composition || '';
        productData.prescriptionRequired = prescriptionRequired === 'true';
      } else if (category === 'lab-test') {
        // For lab tests, set default values for price and stock
        productData.price = 0; // Will be overridden by lab options
        productData.stock = 999; // Unlimited stock for lab tests
        productData.testType = testType || '';
        productData.preparationInstructions = preparationInstructions || '';
        productData.reportDeliveryTime = reportDeliveryTime || '';
        productData.sampleType = sampleType || '';
        
        // Parse lab options if provided
        if (labOptions) {
          try {
            const parsedLabOptions = JSON.parse(labOptions);
            if (Array.isArray(parsedLabOptions) && parsedLabOptions.length > 0) {
              productData.labOptions = parsedLabOptions.map(option => ({
                labName: option.labName,
                price: parseFloat(option.price)
              }));
              // Set the first lab option's price as the main price
              productData.price = parseFloat(parsedLabOptions[0].price);
            }
          } catch (error) {
            console.error('Error parsing lab options:', error);
          }
        }
      }

      const product = new Product(productData);
      await product.save();

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product
      });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating product',
        error: error.message
      });
    }
  });
};

// Update product
export const updateProduct = async (req, res) => {
  upload(req, res, async function(err) {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    try {
      const { id } = req.params;
      const {
        name,
        description,
        category,
        price,
        stock,
        manufacturer,
        isActive,
        dosage,
        composition,
        prescriptionRequired,
        testType,
        preparationInstructions,
        reportDeliveryTime,
        sampleType,
        labOptions
      } = req.body;

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Update basic fields
      if (name) product.name = name.trim();
      if (description) product.description = description.trim();
      if (category && ['medicine', 'lab-test'].includes(category)) product.category = category;
      if (manufacturer !== undefined) product.manufacturer = manufacturer;
      if (isActive !== undefined) product.isActive = isActive === 'true';

      // Update image if provided
      if (req.file) {
        product.image = `/uploads/products/${req.file.filename}`;
      }

      // Update category-specific fields
      if (product.category === 'medicine') {
        if (price !== undefined) product.price = parseFloat(price);
        if (stock !== undefined) product.stock = parseInt(stock);
        if (dosage !== undefined) product.dosage = dosage;
        if (composition !== undefined) product.composition = composition;
        if (prescriptionRequired !== undefined) product.prescriptionRequired = prescriptionRequired === 'true';
        
        // Clear lab-test specific fields
        product.testType = '';
        product.preparationInstructions = '';
        product.reportDeliveryTime = '';
        product.sampleType = '';
        product.labOptions = [];
      } else if (product.category === 'lab-test') {
        // For lab tests, set default values for price and stock
        product.price = 0;
        product.stock = 999;
        
        if (testType !== undefined) product.testType = testType;
        if (preparationInstructions !== undefined) product.preparationInstructions = preparationInstructions;
        if (reportDeliveryTime !== undefined) product.reportDeliveryTime = reportDeliveryTime;
        if (sampleType !== undefined) product.sampleType = sampleType;
        
        // Parse and update lab options if provided
        if (labOptions !== undefined) {
          try {
            const parsedLabOptions = JSON.parse(labOptions);
            if (Array.isArray(parsedLabOptions) && parsedLabOptions.length > 0) {
              product.labOptions = parsedLabOptions.map(option => ({
                labName: option.labName,
                price: parseFloat(option.price)
              }));
              // Set the first lab option's price as the main price
              product.price = parseFloat(parsedLabOptions[0].price);
            }
          } catch (error) {
            console.error('Error parsing lab options:', error);
          }
        }
        
        // Clear medicine specific fields
        product.dosage = '';
        product.composition = '';
        product.prescriptionRequired = false;
      }

      await product.save();

      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: product
      });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating product',
        error: error.message
      });
    }
  });
};

// Delete product (soft delete)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.isActive = false;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
};

// Get all orders for admin
export const getAllOrders = async (req, res) => {
  try {
    const {
      status,
      page = 1,
      limit = 20,
      sortBy = 'orderDate',
      sortOrder = 'desc',
      search
    } = req.query;

    // Build query
    let query = {};
    
    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'shippingAddress.city': { $regex: search, $options: 'i' } },
        { trackingNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const orders = await Order.find(query)
      .populate('userId', 'fullName email phone')
      .populate('items.productId')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalOrders,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber, notes } = req.body;

    // Check if order contains lab tests to determine valid statuses
    const order = await Order.findOne({
      $or: [
        { _id: orderId },
        { orderId: orderId }
      ]
    }).populate('userId', 'fullName email')
      .populate('items.productId');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Determine valid statuses based on order type
    const hasLabTests = order.items.some(item => item.category === 'lab-test');
    const hasMedicines = order.items.some(item => item.category === 'medicine');

    let validStatuses;
    if (hasLabTests && !hasMedicines) {
      // Lab test only order
      validStatuses = [
        'pending', 'confirmed', 'received-request', 'processing-request', 
        'sent-for-sample-collection', 'sample-collected', 'report-delivered', 'cancelled'
      ];
    } else if (hasMedicines && !hasLabTests) {
      // Medicine only order
      validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    } else {
      // Mixed order (shouldn't happen with new validation, but keeping for safety)
      validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    }
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid statuses for this order type are: ${validStatuses.join(', ')}`
      });
    }

    // Update order
    order.status = status;
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
    if (notes !== undefined) order.notes = notes;

    // Generate reports if status is 'report-delivered' and order contains lab tests
    if (status === 'report-delivered' && hasLabTests) {
      try {
        const labTestItems = order.items.filter(item => item.category === 'lab-test');
        
        // Generate report for each lab test item
        for (const labTestItem of labTestItems) {
          const reportPath = await generateLabReport(order, labTestItem);
          
          // Store report path in order
          order.reportPaths.push({
            productId: labTestItem.productId._id,
            reportPath: reportPath,
            generatedAt: new Date()
          });
        }
      } catch (error) {
        console.error('Error generating lab reports:', error);
        return res.status(500).json({
          success: false,
          message: 'Order status updated but failed to generate reports'
        });
      }
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
};

// Get marketplace statistics
export const getMarketplaceStats = async (req, res) => {
  try {
    const [
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      totalRevenue,
      medicineCount,
      labTestCount
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.aggregate([
        { $match: { status: { $in: ['delivered', 'shipped', 'processing', 'confirmed'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Product.countDocuments({ category: 'medicine', isActive: true }),
      Product.countDocuments({ category: 'lab-test', isActive: true })
    ]);

    res.status(200).json({
      success: true,
      data: {
        products: {
          total: totalProducts,
          active: activeProducts,
          medicines: medicineCount,
          labTests: labTestCount
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders
        },
        revenue: {
          total: totalRevenue[0]?.total || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching marketplace stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching marketplace statistics',
      error: error.message
    });
  }
};
