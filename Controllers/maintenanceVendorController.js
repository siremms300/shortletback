// Controllers/maintenanceVendorController.js
const MaintenanceVendor = require("../Models/MaintenanceVendorModel");
const MaintenanceIssue = require("../Models/MaintenanceModel");

const maintenanceVendorController = {
  // Get all vendors
  getAllVendors: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 50,
        specialty,
        search,
        sortBy = 'name',
        sortOrder = 'asc'
      } = req.query;

      const query = { isActive: true };

      // Build filter query
      if (specialty && specialty !== 'all') {
        query.specialty = specialty;
      }
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { contact: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const vendors = await MaintenanceVendor.find(query)
        .populate('createdBy', 'firstName lastName')
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await MaintenanceVendor.countDocuments(query);

      res.status(200).json({
        vendors,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });

    } catch (error) {
      console.error('Get vendors error:', error);
      res.status(500).json({
        message: "Failed to fetch vendors",
        error: error.message
      });
    }
  },

  // Get vendor by ID
  getVendorById: async (req, res) => {
    try {
      const { id } = req.params;

      const vendor = await MaintenanceVendor.findById(id)
        .populate('createdBy', 'firstName lastName');

      if (!vendor) {
        return res.status(404).json({
          message: "Vendor not found"
        });
      }

      res.status(200).json({
        vendor
      });

    } catch (error) {
      console.error('Get vendor error:', error);
      res.status(500).json({
        message: "Failed to fetch vendor",
        error: error.message
      });
    }
  },

  
  createVendor: async (req, res) => {
    try {
      const {
        name,
        specialty,
        contact,
        email,
        rating,
        responseTime,
        address,
        website,
        notes
      } = req.body;

      // Validate required fields
      if (!name || !contact || !email || !responseTime || !specialty || specialty.length === 0) {
        return res.status(400).json({
          message: "Name, contact, email, response time, and at least one specialty are required"
        });
      }

      // Check if vendor already exists
      const existingVendor = await MaintenanceVendor.findOne({
        $or: [
          { name: { $regex: new RegExp(`^${name}$`, 'i') } },
          { email: email.toLowerCase() }
        ]
      });

      if (existingVendor) {
        return res.status(400).json({
          message: "Vendor with this name or email already exists"
        });
      }

      // MANUALLY generate vendor number as fallback
      const manualVendorNumber = `V-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      console.log('Manually generated vendor number:', manualVendorNumber);

      // Create vendor with manually generated number
      const vendor = new MaintenanceVendor({
        vendorNumber: manualVendorNumber, // Force set vendor number
        name,
        specialty,
        contact,
        email: email.toLowerCase(),
        rating: rating || 5,
        responseTime,
        address: address || '',
        website: website || '',
        notes: notes || '',
        createdBy: req.user.id
      });

      await vendor.save();

      const populatedVendor = await MaintenanceVendor.findById(vendor._id)
        .populate('createdBy', 'firstName lastName');

      res.status(201).json({
        message: "Vendor created successfully",
        vendor: populatedVendor
      });

    } catch (error) {
      console.error('Create vendor error:', error);
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          message: "Validation failed",
          errors: errors
        });
      }

      res.status(500).json({
        message: "Failed to create vendor",
        error: error.message
      });
    }
  },

  // Update vendor
  updateVendor: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const vendor = await MaintenanceVendor.findById(id);

      if (!vendor) {
        return res.status(404).json({
          message: "Vendor not found"
        });
      }

      const updatedVendor = await MaintenanceVendor.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('createdBy', 'firstName lastName');

      res.status(200).json({
        message: "Vendor updated successfully",
        vendor: updatedVendor
      });

    } catch (error) {
      console.error('Update vendor error:', error);
      res.status(500).json({
        message: "Failed to update vendor",
        error: error.message
      });
    }
  },

  // Delete vendor (soft delete)
  deleteVendor: async (req, res) => {
    try {
      const { id } = req.params;

      const vendor = await MaintenanceVendor.findById(id);

      if (!vendor) {
        return res.status(404).json({
          message: "Vendor not found"
        });
      }

      // Check if vendor is assigned to any active issues
      const assignedIssues = await MaintenanceIssue.countDocuments({
        assignedToVendor: id,
        status: { $in: ['reported', 'assigned', 'in-progress'] }
      });

      if (assignedIssues > 0) {
        return res.status(400).json({
          message: "Cannot delete vendor that is assigned to active maintenance issues"
        });
      }

      // Soft delete by setting isActive to false
      await MaintenanceVendor.findByIdAndUpdate(id, { isActive: false });

      res.status(200).json({
        message: "Vendor deleted successfully"
      });

    } catch (error) {
      console.error('Delete vendor error:', error);
      res.status(500).json({
        message: "Failed to delete vendor",
        error: error.message
      });
    }
  },

  // Get vendor statistics
  getVendorStats: async (req, res) => {
    try {
      const totalVendors = await MaintenanceVendor.countDocuments({ isActive: true });
      
      // Vendor performance stats
      const vendorPerformance = await MaintenanceIssue.aggregate([
        {
          $match: {
            assignedToVendor: { $exists: true },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: '$assignedToVendor',
            completedIssues: { $sum: 1 },
            totalCost: { $sum: '$actualCost' },
            avgCompletionTime: { $avg: '$actualDuration' }
          }
        },
        {
          $lookup: {
            from: 'maintenancevendors',
            localField: '_id',
            foreignField: '_id',
            as: 'vendor'
          }
        },
        {
          $unwind: '$vendor'
        },
        {
          $project: {
            vendorName: '$vendor.name',
            completedIssues: 1,
            totalCost: 1,
            avgCompletionTime: 1,
            rating: '$vendor.rating'
          }
        }
      ]);

      // Specialty distribution
      const specialtyStats = await MaintenanceVendor.aggregate([
        { $match: { isActive: true } },
        { $unwind: '$specialty' },
        {
          $group: {
            _id: '$specialty',
            count: { $sum: 1 }
          }
        }
      ]);

      res.status(200).json({
        stats: {
          totalVendors,
          vendorPerformance,
          specialtyStats
        }
      });

    } catch (error) {
      console.error('Get vendor stats error:', error);
      res.status(500).json({
        message: "Failed to fetch vendor statistics",
        error: error.message
      });
    }
  }
};

module.exports = maintenanceVendorController;





