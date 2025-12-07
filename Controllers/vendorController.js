const { Vendor, VendorProduct } = require("../Models/VendorModel");
const VendorOrder = require("../Models/VendorOrderModel");
const emailService = require("../Services/emailService");

const vendorController = {
  // Create new vendor (Admin only)
  createVendor: async (req, res) => {
    try {
      const {
        businessName,
        description,
        contactPerson,
        address,
        services,
        operatingHours,
        commissionRate,
        paymentTerms,
        notes
      } = req.body;

      const vendor = new Vendor({
        businessName,
        description,
        contactPerson: {
          name: contactPerson.name,
          email: contactPerson.email,
          phone: contactPerson.phone
        },
        address,
        services: services || [],
        operatingHours,
        commissionRate: commissionRate || 15,
        paymentTerms: paymentTerms || 'bi-weekly',
        notes,
        createdBy: req.user.id
      });

      await vendor.save();

      // Send welcome email to vendor contact
      await emailService.sendVendorWelcomeEmail(vendor);

      res.status(201).json({
        message: "Vendor created successfully",
        vendor
      });

    } catch (error) {
      console.error('Create vendor error:', error);
      res.status(500).json({ 
        message: "Failed to create vendor", 
        error: error.message 
      });
    }
  },

  // Get all vendors (Admin only)
  getAllVendors: async (req, res) => {
    try {
      const { page = 1, limit = 10, status, search } = req.query;

      const query = {};
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { businessName: { $regex: search, $options: 'i' } },
          { 'contactPerson.name': { $regex: search, $options: 'i' } },
          { 'contactPerson.email': { $regex: search, $options: 'i' } }
        ];
      }

      const vendors = await Vendor.find(query)
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Vendor.countDocuments(query);

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
      const vendor = await Vendor.findById(req.params.id)
        .populate('createdBy', 'firstName lastName');

      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      res.status(200).json(vendor);
    } catch (error) {
      console.error('Get vendor error:', error);
      res.status(500).json({ 
        message: "Failed to fetch vendor", 
        error: error.message 
      });
    }
  },

  // Update vendor (Admin only)
  updateVendor: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const vendor = await Vendor.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('createdBy', 'firstName lastName');

      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      res.status(200).json({
        message: "Vendor updated successfully",
        vendor
      });

    } catch (error) {
      console.error('Update vendor error:', error);
      res.status(500).json({ 
        message: "Failed to update vendor", 
        error: error.message 
      });
    }
  },

  // Update vendor status (Admin only)
  updateVendorStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const vendor = await Vendor.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      res.status(200).json({
        message: "Vendor status updated successfully",
        vendor
      });

    } catch (error) {
      console.error('Update vendor status error:', error);
      res.status(500).json({ 
        message: "Failed to update vendor status", 
        error: error.message 
      });
    }
  },

  // Vendor dashboard stats (Admin only)
  getVendorStats: async (req, res) => {
    try {
      const totalVendors = await Vendor.countDocuments();
      const activeVendors = await Vendor.countDocuments({ status: 'active' });
      const totalProducts = await VendorProduct.countDocuments();
      const totalOrders = await VendorOrder.countDocuments();

      // Calculate total revenue from vendor orders
      const revenueResult = await VendorOrder.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
      ]);

      const totalRevenue = revenueResult[0]?.totalRevenue || 0;

      res.status(200).json({
        totalVendors,
        activeVendors,
        totalProducts,
        totalOrders,
        totalRevenue
      });

    } catch (error) {
      console.error('Get vendor stats error:', error);
      res.status(500).json({ 
        message: "Failed to fetch vendor stats", 
        error: error.message 
      });
    }
  }
};

module.exports = vendorController;
