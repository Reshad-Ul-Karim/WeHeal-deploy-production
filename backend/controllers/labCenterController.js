import { LabCenter } from '../models/labCenterModel.js';

// Get all lab centers
export const getAllLabCenters = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', city = '' } = req.query;
    
    const query = { isActive: true };
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (city) {
      query['address.city'] = { $regex: city, $options: 'i' };
    }
    
    const skip = (page - 1) * limit;
    
    const labCenters = await LabCenter.find(query)
      .sort({ rating: -1, name: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await LabCenter.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        labCenters,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          total,
          hasNextPage: skip + labCenters.length < total,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching lab centers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lab centers'
    });
  }
};

// Get single lab center
export const getLabCenter = async (req, res) => {
  try {
    const { id } = req.params;
    
    const labCenter = await LabCenter.findById(id);
    
    if (!labCenter) {
      return res.status(404).json({
        success: false,
        message: 'Lab center not found'
      });
    }
    
    res.json({
      success: true,
      data: labCenter
    });
  } catch (error) {
    console.error('Error fetching lab center:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lab center'
    });
  }
};

// Create new lab center
export const createLabCenter = async (req, res) => {
  try {
    const {
      name,
      address,
      contactInfo,
      operatingHours,
      facilities
    } = req.body;
    
    // Validate required fields
    if (!name || !address || !contactInfo) {
      return res.status(400).json({
        success: false,
        message: 'Name, address, and contact info are required'
      });
    }
    
    const labCenter = new LabCenter({
      name,
      address,
      contactInfo,
      operatingHours,
      facilities: facilities || []
    });
    
    await labCenter.save();
    
    res.status(201).json({
      success: true,
      message: 'Lab center created successfully',
      data: labCenter
    });
  } catch (error) {
    console.error('Error creating lab center:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating lab center'
    });
  }
};

// Update lab center
export const updateLabCenter = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const labCenter = await LabCenter.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!labCenter) {
      return res.status(404).json({
        success: false,
        message: 'Lab center not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Lab center updated successfully',
      data: labCenter
    });
  } catch (error) {
    console.error('Error updating lab center:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating lab center'
    });
  }
};

// Delete lab center (soft delete)
export const deleteLabCenter = async (req, res) => {
  try {
    const { id } = req.params;
    
    const labCenter = await LabCenter.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    
    if (!labCenter) {
      return res.status(404).json({
        success: false,
        message: 'Lab center not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Lab center deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lab center:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting lab center'
    });
  }
};

// Get lab centers by city
export const getLabCentersByCity = async (req, res) => {
  try {
    const { city } = req.params;
    
    const labCenters = await LabCenter.find({
      'address.city': { $regex: city, $options: 'i' },
      isActive: true
    }).sort({ rating: -1, name: 1 });
    
    res.json({
      success: true,
      data: labCenters
    });
  } catch (error) {
    console.error('Error fetching lab centers by city:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lab centers'
    });
  }
};
