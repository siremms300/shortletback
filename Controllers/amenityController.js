const Amenity = require("../Models/AmenityModel");

const amenityController = {
  // Create new amenity
  createAmenity: async (req, res) => {
    try {
      const { name, description, icon, category } = req.body;

      // Check if amenity already exists
      const existingAmenity = await Amenity.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') } 
      });
      
      if (existingAmenity) {
        return res.status(400).json({ 
          message: "Amenity with this name already exists" 
        });
      }

      const amenity = new Amenity({
        name,
        description,
        // icon: icon || "🏠",
        icon: icon || "", // Empty string if no icon provided
        category: category || 'general',
        createdBy: req.user.id
      });

      await amenity.save();

      res.status(201).json({
        message: "Amenity created successfully",
        amenity
      });

    } catch (err) {
      console.error('Create amenity error:', err);
      res.status(500).json({ 
        message: "Failed to create amenity", 
        error: err.message 
      });
    }
  },

  // Get all amenities
  getAllAmenities: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 50, 
        category, 
        search,
        isActive = true 
      } = req.query;

      const query = { isActive: isActive !== 'false' };

      // Build filter query
      if (category) query.category = category;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const amenities = await Amenity.find(query)
        .populate('createdBy', 'firstName lastName')
        .sort({ name: 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Amenity.countDocuments(query);

      res.status(200).json({
        amenities,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });

    } catch (err) {
      console.error('Get amenities error:', err);
      res.status(500).json({ 
        message: "Failed to fetch amenities", 
        error: err.message 
      });
    }
  },

  // Get amenity by ID
  getAmenityById: async (req, res) => {
    try {
      const amenity = await Amenity.findById(req.params.id)
        .populate('createdBy', 'firstName lastName');

      if (!amenity) {
        return res.status(404).json({ message: "Amenity not found" });
      }

      res.status(200).json(amenity);
    } catch (err) {
      console.error('Get amenity error:', err);
      res.status(500).json({ 
        message: "Failed to fetch amenity", 
        error: err.message 
      });
    }
  },

  // Update amenity
  updateAmenity: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, icon, category, isActive } = req.body;

      // Check if amenity exists
      const amenity = await Amenity.findById(id);
      if (!amenity) {
        return res.status(404).json({ message: "Amenity not found" });
      }

      // Check if name is being changed and if it already exists
      if (name && name !== amenity.name) {
        const existingAmenity = await Amenity.findOne({ 
          name: { $regex: new RegExp(`^${name}$`, 'i') },
          _id: { $ne: id }
        });
        
        if (existingAmenity) {
          return res.status(400).json({ 
            message: "Amenity with this name already exists" 
          });
        }
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (icon !== undefined) updateData.icon = icon;
      if (category !== undefined) updateData.category = category;
      if (isActive !== undefined) updateData.isActive = isActive;

      const updatedAmenity = await Amenity.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('createdBy', 'firstName lastName');

      res.status(200).json({
        message: "Amenity updated successfully",
        amenity: updatedAmenity
      });

    } catch (err) {
      console.error('Update amenity error:', err);
      res.status(500).json({ 
        message: "Failed to update amenity", 
        error: err.message 
      });
    }
  },

  // Delete amenity (soft delete)
  deleteAmenity: async (req, res) => {
    try {
      const { id } = req.params;

      const amenity = await Amenity.findById(id);
      if (!amenity) {
        return res.status(404).json({ message: "Amenity not found" });
      }

      // Soft delete by setting isActive to false
      amenity.isActive = false;
      await amenity.save();

      res.status(200).json({ 
        message: "Amenity deleted successfully" 
      });

    } catch (err) {
      console.error('Delete amenity error:', err);
      res.status(500).json({ 
        message: "Failed to delete amenity", 
        error: err.message 
      });
    }
  },

  // Hard delete amenity (admin only)
  hardDeleteAmenity: async (req, res) => {
    try {
      const { id } = req.params;

      const amenity = await Amenity.findByIdAndDelete(id);
      if (!amenity) {
        return res.status(404).json({ message: "Amenity not found" });
      }

      res.status(200).json({ 
        message: "Amenity permanently deleted successfully" 
      });

    } catch (err) {
      console.error('Hard delete amenity error:', err);
      res.status(500).json({ 
        message: "Failed to delete amenity", 
        error: err.message 
      });
    }
  },

  // Get amenity categories
  getAmenityCategories: async (req, res) => {
    try {
      const categories = await Amenity.distinct('category', { isActive: true });
      res.status(200).json(categories);
    } catch (err) {
      console.error('Get categories error:', err);
      res.status(500).json({ 
        message: "Failed to fetch categories", 
        error: err.message 
      });
    }
  },

  // Bulk create amenities (for initial setup)
  bulkCreateAmenities: async (req, res) => {
    try {
      const { amenities } = req.body;

      if (!Array.isArray(amenities) || amenities.length === 0) {
        return res.status(400).json({ 
          message: "Amenities array is required" 
        });
      }

      // Check for duplicates
      const amenityNames = amenities.map(a => a.name.toLowerCase());
      const existingAmenities = await Amenity.find({ 
        name: { $in: amenityNames.map(name => new RegExp(`^${name}$`, 'i')) } 
      });

      if (existingAmenities.length > 0) {
        const existingNames = existingAmenities.map(a => a.name);
        return res.status(400).json({ 
          message: "Some amenities already exist", 
          existing: existingNames 
        });
      }

      const amenitiesWithCreator = amenities.map(amenity => ({
        ...amenity,
        createdBy: req.user.id
      }));

      const createdAmenities = await Amenity.insertMany(amenitiesWithCreator);

      res.status(201).json({
        message: `${createdAmenities.length} amenities created successfully`,
        amenities: createdAmenities
      });

    } catch (err) {
      console.error('Bulk create amenities error:', err);
      res.status(500).json({ 
        message: "Failed to create amenities", 
        error: err.message 
      });
    }
  }
};

module.exports = amenityController;





