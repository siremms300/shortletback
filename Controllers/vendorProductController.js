const { Vendor, VendorProduct } = require("../Models/VendorModel");

const vendorProductController = {
  // Add product to vendor (Admin only)
  createProduct: async (req, res) => {
    try {
      const {
        name,
        description,
        category,
        price,
        stockQuantity,
        minOrderQuantity,
        maxOrderQuantity,
        preparationTime,
        tags,
        vendorId
      } = req.body;

      const images = req.files ? req.files.map((file, index) => ({
        url: `/uploads/vendor-products/${file.filename}`,
        isMain: index === 0
      })) : [];

      // Verify vendor exists and is active
      const vendor = await Vendor.findOne({ _id: vendorId, status: 'active' });
      if (!vendor) {
        return res.status(404).json({ message: "Active vendor not found" });
      }

      const product = new VendorProduct({
        name,
        description,
        category,
        price: parseFloat(price),
        images,
        vendor: vendorId,
        stockQuantity: parseInt(stockQuantity) || 0,
        minOrderQuantity: parseInt(minOrderQuantity) || 1,
        maxOrderQuantity: parseInt(maxOrderQuantity) || 10,
        preparationTime: parseInt(preparationTime) || 30,
        tags: tags || []
      });

      await product.save();

      const populatedProduct = await VendorProduct.findById(product._id)
        .populate('vendor', 'businessName');

      res.status(201).json({
        message: "Product created successfully",
        product: populatedProduct
      });

    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({ 
        message: "Failed to create product", 
        error: error.message 
      });
    }
  },

  // Get all products for a vendor
  getVendorProducts: async (req, res) => {
    try {
      const { vendorId } = req.params;
      const { category, availableOnly = true, page = 1, limit = 20 } = req.query;

      const query = { vendor: vendorId };
      if (availableOnly) query.isAvailable = true;
      if (category) query.category = category;

      const products = await VendorProduct.find(query)
        .populate('vendor', 'businessName')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await VendorProduct.countDocuments(query);

      res.status(200).json({
        products,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });

    } catch (error) {
      console.error('Get vendor products error:', error);
      res.status(500).json({ 
        message: "Failed to fetch vendor products", 
        error: error.message 
      });
    }
  },

  // Get all available products (for users)
  getAvailableProducts: async (req, res) => {
    try {
      const { 
        category, 
        vendor, 
        minPrice, 
        maxPrice, 
        search,
        page = 1, 
        limit = 20 
      } = req.query;

      const query = { isAvailable: true };

      // Build filter query
      if (category) query.category = category;
      if (vendor) query.vendor = vendor;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = parseFloat(minPrice);
        if (maxPrice) query.price.$lte = parseFloat(maxPrice);
      }

      const products = await VendorProduct.find(query)
        .populate('vendor', 'businessName description rating')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await VendorProduct.countDocuments(query);

      res.status(200).json({
        products,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });

    } catch (error) {
      console.error('Get available products error:', error);
      res.status(500).json({ 
        message: "Failed to fetch products", 
        error: error.message 
      });
    }
  },

//   // Update product (Admin only)
  updateProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Handle image uploads
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map((file, index) => ({
          url: `/uploads/vendor-products/${file.filename}`,
          isMain: index === 0
        }));
        updateData.$push = { images: { $each: newImages } };
      }

      const product = await VendorProduct.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('vendor', 'businessName');

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.status(200).json({
        message: "Product updated successfully",
        product
      });

    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ 
        message: "Failed to update product", 
        error: error.message 
      });
    }
  },

  // Toggle product availability (Admin only)
  toggleProductAvailability: async (req, res) => {
    try {
      const { id } = req.params;

      const product = await VendorProduct.findById(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      product.isAvailable = !product.isAvailable;
      await product.save();

      res.status(200).json({
        message: `Product ${product.isAvailable ? 'activated' : 'deactivated'} successfully`,
        product
      });

    } catch (error) {
      console.error('Toggle product availability error:', error);
      res.status(500).json({ 
        message: "Failed to update product availability", 
        error: error.message 
      });
    }
  }
};

module.exports = vendorProductController;








 