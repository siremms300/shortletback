const Property = require("../Models/PropertyModel");
const User = require("../Models/UserModel");
const Amenity = require("../Models/AmenityModel");
const mongoose = require("mongoose");

const propertyController = {
  // Create new property
//   createProperty: async (req, res) => {
//     try {
//       const {
//         title,
//         description,
//         type,
//         price,
//         location,
//         bedrooms,
//         bathrooms,
//         maxGuests,
//         squareFeet,
//         amenities
//       } = req.body;

//       // Parse amenities if it's a string
//       let amenitiesArray = [];
//       if (amenities) {
//         amenitiesArray = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
//       }

//       // Handle image uploads
//       const images = req.files ? req.files.map((file, index) => ({
//         url: `/uploads/properties/${file.filename}`,
//         isMain: index === 0,
//         order: index
//       })) : [];

//       // this line was added for debugging purposes 
//       if (!req.files || req.files.length === 0) {
//         return res.status(400).json({ message: "At least one image is required" });
//       }
//       console.log('Files received:', req.files);
//       console.log('Body received:', req.body);
//       //   that line ends here 

//       const property = new Property({
//         title,
//         description,
//         type,
//         price: parseFloat(price),
//         location,
//         specifications: {
//           bedrooms: parseInt(bedrooms) || 0,
//           bathrooms: parseInt(bathrooms) || 0,
//           maxGuests: parseInt(maxGuests) || 1,
//           squareFeet: parseInt(squareFeet) || 0
//         },
//         amenities: amenitiesArray,
//         images,
//         owner: req.user.id,
//         status: 'active'
//       });

//       await property.save();

//       // Add property to user's propertyList
//       await User.findByIdAndUpdate(req.user.id, {
//         $push: { propertyList: property._id }
//       });

//       const populatedProperty = await Property.findById(property._id)
//         .populate('owner', 'firstName lastName email profileImagePath');

//       res.status(201).json({
//         message: "Property created successfully",
//         property: populatedProperty
//       });

//     } catch (err) {
//       console.error('Create property error:', err);
//       res.status(500).json({ 
//         message: "Failed to create property", 
//         error: err.message 
//       });
//     }
//   },

  // Get all properties (public)
//   getAllProperties: async (req, res) => {
//     try {
//       const {
//         page = 1,
//         limit = 10,
//         type,
//         minPrice,
//         maxPrice,
//         location,
//         amenities,
//         sortBy = 'createdAt',
//         sortOrder = 'desc'
//       } = req.query;

//       const query = { status: 'active' };

//       // Build filter query
//       if (type) query.type = type;
//       if (location) {
//         query.location = { $regex: location, $options: 'i' };
//       }
//       if (minPrice || maxPrice) {
//         query.price = {};
//         if (minPrice) query.price.$gte = parseInt(minPrice);
//         if (maxPrice) query.price.$lte = parseInt(maxPrice);
//       }
//       if (amenities) {
//         const amenitiesArray = Array.isArray(amenities) ? amenities : [amenities];
//         query.amenities = { $in: amenitiesArray };
//       }

//       const sort = {};
//       sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

//       const properties = await Property.find(query)
//         .populate('owner', 'firstName lastName profileImagePath')
//         .sort(sort)
//         .limit(limit * 1)
//         .skip((page - 1) * limit);

//       const total = await Property.countDocuments(query);

//       res.status(200).json({
//         properties,
//         totalPages: Math.ceil(total / limit),
//         currentPage: page,
//         total
//       });

//     } catch (err) {
//       console.error('Get properties error:', err);
//       res.status(500).json({ 
//         message: "Failed to fetch properties", 
//         error: err.message 
//       });
//     }
//   },

  // Get featured properties
  getFeaturedProperties: async (req, res) => {
    try {
      const properties = await Property.find({ 
        status: 'active', 
        isFeatured: true 
      })
      .populate('owner', 'firstName lastName profileImagePath')
      .limit(6)
      .sort({ createdAt: -1 });

      res.status(200).json(properties);
    } catch (err) {
      console.error('Get featured properties error:', err);
      res.status(500).json({ 
        message: "Failed to fetch featured properties", 
        error: err.message 
      });
    }
  },

  // Get single property by ID
//   getPropertyById: async (req, res) => {
//     try {
//       const property = await Property.findById(req.params.id)
//         .populate('owner', 'firstName lastName email phone profileImagePath verificationStatus');

//       if (!property) {
//         return res.status(404).json({ message: "Property not found" });
//       }

//       res.status(200).json(property);
//     } catch (err) {
//       console.error('Get property error:', err);
//       res.status(500).json({ 
//         message: "Failed to fetch property", 
//         error: err.message 
//       });
//     }
//   },

//   // Update property
//   updateProperty: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const updateData = { ...req.body };

//       // Find property and check ownership
//       const property = await Property.findById(id);
//       if (!property) {
//         return res.status(404).json({ message: "Property not found" });
//       }

//       // Check if user owns the property or is admin
//       if (property.owner.toString() !== req.user.id && req.user.role !== 'admin') {
//         return res.status(403).json({ message: "Access denied" });
//       }

//       // Handle specifications update
//       if (updateData.bedrooms || updateData.bathrooms || updateData.maxGuests || updateData.squareFeet) {
//         updateData.specifications = {
//           bedrooms: parseInt(updateData.bedrooms) || property.specifications.bedrooms,
//           bathrooms: parseInt(updateData.bathrooms) || property.specifications.bathrooms,
//           maxGuests: parseInt(updateData.maxGuests) || property.specifications.maxGuests,
//           squareFeet: parseInt(updateData.squareFeet) || property.specifications.squareFeet
//         };
//         delete updateData.bedrooms;
//         delete updateData.bathrooms;
//         delete updateData.maxGuests;
//         delete updateData.squareFeet;
//       }

//       // Handle amenities update
//       if (updateData.amenities) {
//         updateData.amenities = typeof updateData.amenities === 'string' 
//           ? JSON.parse(updateData.amenities) 
//           : updateData.amenities;
//       }

//       // Handle image uploads
//       if (req.files && req.files.length > 0) {
//         const newImages = req.files.map((file, index) => ({
//           url: `/uploads/properties/${file.filename}`,
//           isMain: property.images.length === 0 && index === 0,
//           order: property.images.length + index
//         }));
//         updateData.$push = { images: { $each: newImages } };
//       }

//       const updatedProperty = await Property.findByIdAndUpdate(
//         id,
//         updateData,
//         { new: true, runValidators: true }
//       ).populate('owner', 'firstName lastName profileImagePath');

//       res.status(200).json({
//         message: "Property updated successfully",
//         property: updatedProperty
//       });

//     } catch (err) {
//       console.error('Update property error:', err);
//       res.status(500).json({ 
//         message: "Failed to update property", 
//         error: err.message 
//       });
//     }
//   },









// ///////////////////////////////////////////////////////////////////////////////////////


 
  // createProperty: async (req, res) => {
  //   try {
  //     const {
  //       title,
  //       description,
  //       type,
  //       price,
  //       location,
  //       bedrooms,
  //       bathrooms,
  //       maxGuests,
  //       squareFeet,
  //       amenities
  //     } = req.body;

  //     // Parse amenities if it's a string and validate they exist
  //     let amenitiesArray = [];
  //     if (amenities) {
  //       amenitiesArray = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
        
  //       // Validate that all amenity IDs exist and are active
  //       if (amenitiesArray.length > 0) {
  //         const existingAmenities = await Amenity.find({
  //           _id: { $in: amenitiesArray },
  //           isActive: true
  //         });
          
  //         if (existingAmenities.length !== amenitiesArray.length) {
  //           return res.status(400).json({ 
  //             message: "Some amenities are invalid or inactive" 
  //           });
  //         }
  //       }
  //     }

  //     // Handle image uploads
  //     const images = req.files ? req.files.map((file, index) => ({
  //       url: `/uploads/properties/${file.filename}`,
  //       isMain: index === 0,
  //       order: index
  //     })) : [];

  //     if (!req.files || req.files.length === 0) {
  //       return res.status(400).json({ message: "At least one image is required" });
  //     }

  //     const property = new Property({
  //       title,
  //       description,
  //       type,
  //       price: parseFloat(price),
  //       location,
  //       specifications: {
  //         bedrooms: parseInt(bedrooms) || 0,
  //         bathrooms: parseInt(bathrooms) || 0,
  //         maxGuests: parseInt(maxGuests) || 1,
  //         squareFeet: parseInt(squareFeet) || 0
  //       },
  //       amenities: amenitiesArray,
  //       images,
  //       owner: req.user.id,
  //       status: 'active'
  //     });

  //     await property.save();

  //     // Add property to user's propertyList
  //     await User.findByIdAndUpdate(req.user.id, {
  //       $push: { propertyList: property._id }
  //     });

  //     const populatedProperty = await Property.findById(property._id)
  //       .populate('owner', 'firstName lastName email profileImagePath')
  //       .populate('amenities', 'name icon category');

  //     res.status(201).json({
  //       message: "Property created successfully",
  //       property: populatedProperty
  //     });

  //   } catch (err) {
  //     console.error('Create property error:', err);
  //     res.status(500).json({ 
  //       message: "Failed to create property", 
  //       error: err.message 
  //     });
  //   }
  // },

  // In propertyController.js - update createProperty and updateProperty functions

  // createProperty: async (req, res) => {
  //   try {
  //     const {
  //       title,
  //       description,
  //       type,
  //       price,
  //       location,
  //       bedrooms,
  //       bathrooms,
  //       maxGuests,
  //       squareFeet,
  //       amenities
  //     } = req.body;

  //     // Parse amenities if it's a string and validate they exist
  //     let amenitiesArray = [];
  //     if (amenities) {
  //       amenitiesArray = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
        
  //       // Validate that all amenity IDs exist and are active
  //       if (amenitiesArray.length > 0) {
  //         const existingAmenities = await Amenity.find({
  //           _id: { $in: amenitiesArray },
  //           isActive: true
  //         });
          
  //         if (existingAmenities.length !== amenitiesArray.length) {
  //           return res.status(400).json({ 
  //             message: "Some amenities are invalid or inactive" 
  //           });
  //         }
  //       }
  //     }

  //     // Handle image uploads for Vercel vs local
  //     let images = [];
  //     if (req.files && req.files.length > 0) {
  //       images = req.files.map((file, index) => {
  //         // Handle Vercel memory storage
  //         let imageUrl;
  //         if (process.env.VERCEL && file.isVercel) {
  //           // On Vercel: File is in memory
  //           console.log('Vercel property upload - image in memory');
  //           imageUrl = `/uploads/properties/${file.filename}`;
  //           // In production, upload to cloud storage here
  //         } else {
  //           // Local: File is saved to disk
  //           imageUrl = `/uploads/properties/${file.filename}`;
  //         }
          
  //         return {
  //           url: imageUrl,
  //           isMain: index === 0,
  //           order: index
  //         };
  //       });
  //     }

  //     if (images.length === 0) {
  //       return res.status(400).json({ message: "At least one image is required" });
  //     }

  //     const property = new Property({
  //       title,
  //       description,
  //       type,
  //       price: parseFloat(price),
  //       location,
  //       specifications: {
  //         bedrooms: parseInt(bedrooms) || 0,
  //         bathrooms: parseInt(bathrooms) || 0,
  //         maxGuests: parseInt(maxGuests) || 1,
  //         squareFeet: parseInt(squareFeet) || 0
  //       },
  //       amenities: amenitiesArray,
  //       images,
  //       owner: req.user.id,
  //       status: 'active'
  //     });

  //     await property.save();

  //     // Add property to user's propertyList
  //     await User.findByIdAndUpdate(req.user.id, {
  //       $push: { propertyList: property._id }
  //     });

  //     const populatedProperty = await Property.findById(property._id)
  //       .populate('owner', 'firstName lastName email profileImagePath')
  //       .populate('amenities', 'name icon category');

  //     res.status(201).json({
  //       message: "Property created successfully",
  //       property: populatedProperty
  //     });

  //   } catch (err) {
  //     console.error('Create property error:', err);
  //     res.status(500).json({ 
  //       message: "Failed to create property", 
  //       error: err.message 
  //     });
  //   }
  // },

  // Get all properties (public) - Updated to populate amenities
  getAllProperties: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        type,
        minPrice,
        maxPrice,
        location,
        amenities,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const query = { status: 'active' };

      // Build filter query
      if (type) query.type = type;
      if (location) {
        query.location = { $regex: location, $options: 'i' };
      }
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = parseInt(minPrice);
        if (maxPrice) query.price.$lte = parseInt(maxPrice);
      }
      if (amenities) {
        const amenitiesArray = Array.isArray(amenities) ? amenities : [amenities];
        query.amenities = { $in: amenitiesArray };
      }

      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const properties = await Property.find(query)
        .populate('owner', 'firstName lastName profileImagePath')
        .populate('amenities', 'name icon category isActive')
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Property.countDocuments(query);

      res.status(200).json({
        properties,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });

    } catch (err) {
      console.error('Get properties error:', err);
      res.status(500).json({ 
        message: "Failed to fetch properties", 
        error: err.message 
      });
    }
  },

  // Get single property by ID - Updated to populate amenities
  // getPropertyById: async (req, res) => {
  //   try {
  //     const property = await Property.findById(req.params.id)
  //       .populate('owner', 'firstName lastName email phone profileImagePath verificationStatus')
  //       .populate('amenities', 'name icon category description');

  //     if (!property) {
  //       return res.status(404).json({ message: "Property not found" });
  //     }

  //     res.status(200).json(property);
  //   } catch (err) {
  //     console.error('Get property error:', err);
  //     res.status(500).json({ 
  //       message: "Failed to fetch property", 
  //       error: err.message 
  //     });
  //   }
  // },

  // In propertyController.js - Update getPropertyById function
  getPropertyById: async (req, res) => {
    try {
      const { id } = req.params;

      // Validate property ID
      if (!id || id === 'undefined') {
        return res.status(400).json({ 
          message: "Property ID is required" 
        });
      }

      // Check if it's a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ 
          message: "Invalid property ID format" 
        });
      }

      console.log('Fetching property with ID:', id); // Debug log

      const property = await Property.findById(id)
        .populate('owner', 'firstName lastName email phone profileImagePath verificationStatus')
        .populate('amenities', 'name icon category description');

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      res.status(200).json(property);
    } catch (err) {
      console.error('Get property error:', err);
      
      // Handle CastError specifically
      if (err.name === 'CastError') {
        return res.status(400).json({ 
          message: "Invalid property ID format" 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to fetch property", 
        error: err.message 
      });
    }
  },

  // Update property - Updated to handle amenities
  // updateProperty: async (req, res) => {
  //   try {
  //     const { id } = req.params;
  //     const updateData = { ...req.body };

  //     // Find property and check ownership
  //     const property = await Property.findById(id);
  //     if (!property) {
  //       return res.status(404).json({ message: "Property not found" });
  //     }

  //     // Check if user owns the property or is admin
  //     if (property.owner.toString() !== req.user.id && req.user.role !== 'admin') {
  //       return res.status(403).json({ message: "Access denied" });
  //     }

  //     // Handle specifications update
  //     if (updateData.bedrooms || updateData.bathrooms || updateData.maxGuests || updateData.squareFeet) {
  //       updateData.specifications = {
  //         bedrooms: parseInt(updateData.bedrooms) || property.specifications.bedrooms,
  //         bathrooms: parseInt(updateData.bathrooms) || property.specifications.bathrooms,
  //         maxGuests: parseInt(updateData.maxGuests) || property.specifications.maxGuests,
  //         squareFeet: parseInt(updateData.squareFeet) || property.specifications.squareFeet
  //       };
  //       delete updateData.bedrooms;
  //       delete updateData.bathrooms;
  //       delete updateData.maxGuests;
  //       delete updateData.squareFeet;
  //     }

  //     // Handle amenities update
  //     if (updateData.amenities) {
  //       const amenitiesArray = typeof updateData.amenities === 'string' 
  //         ? JSON.parse(updateData.amenities) 
  //         : updateData.amenities;
        
  //       // Validate amenities exist and are active
  //       if (amenitiesArray.length > 0) {
  //         const existingAmenities = await Amenity.find({
  //           _id: { $in: amenitiesArray },
  //           isActive: true
  //         });
          
  //         if (existingAmenities.length !== amenitiesArray.length) {
  //           return res.status(400).json({ 
  //             message: "Some amenities are invalid or inactive" 
  //           });
  //         }
  //       }
        
  //       updateData.amenities = amenitiesArray;
  //     }

  //     // Handle image uploads
  //     if (req.files && req.files.length > 0) {
  //       const newImages = req.files.map((file, index) => ({
  //         url: `/uploads/properties/${file.filename}`,
  //         isMain: property.images.length === 0 && index === 0,
  //         order: property.images.length + index
  //       }));
  //       updateData.$push = { images: { $each: newImages } };
  //     }

  //     const updatedProperty = await Property.findByIdAndUpdate(
  //       id,
  //       updateData,
  //       { new: true, runValidators: true }
  //     )
  //       .populate('owner', 'firstName lastName profileImagePath')
  //       .populate('amenities', 'name icon category');

  //     res.status(200).json({
  //       message: "Property updated successfully",
  //       property: updatedProperty
  //     });

  //   } catch (err) {
  //     console.error('Update property error:', err);
  //     res.status(500).json({ 
  //       message: "Failed to update property", 
  //       error: err.message 
  //     });
  //   }
  // },
  

// ///////////////////////////////////////////////////////////////////////////////////////

// @@@@@@@@@@@@@@@@@@@@@@@@ the two code blocks below works

  // createProperty: async (req, res) => {
  //   try {
  //     const {
  //       title,
  //       description,
  //       type,
  //       price,
  //       location,
  //       bedrooms,
  //       bathrooms,
  //       maxGuests,
  //       squareFeet,
  //       amenities
  //     } = req.body;

  //     // Parse amenities if it's a string and validate they exist
  //     let amenitiesArray = [];
  //     if (amenities) {
  //       amenitiesArray = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
        
  //       // Validate that all amenity IDs exist and are active
  //       if (amenitiesArray.length > 0) {
  //         const existingAmenities = await Amenity.find({
  //           _id: { $in: amenitiesArray },
  //           isActive: true
  //         });
          
  //         if (existingAmenities.length !== amenitiesArray.length) {
  //           return res.status(400).json({ 
  //             message: "Some amenities are invalid or inactive" 
  //           });
  //         }
  //       }
  //     }

  //     // Handle image uploads for Cloudinary
  //     let images = [];
  //     if (req.files && req.files.length > 0) {
  //       images = req.files.map((file, index) => {
  //         // Get URL from Cloudinary or fallback to path
  //         const imageUrl = file.cloudinary?.url || file.path;
          
  //         console.log('Processing image:', {
  //           originalName: file.originalname,
  //           cloudinaryUrl: file.cloudinary?.url,
  //           localPath: file.path,
  //           finalUrl: imageUrl
  //         });
          
  //         return {
  //           url: imageUrl,
  //           isMain: index === 0,
  //           order: index
  //         };
  //       });
  //     }

  //     if (images.length === 0) {
  //       return res.status(400).json({ message: "At least one image is required" });
  //     }

  //     const property = new Property({
  //       title,
  //       description,
  //       type,
  //       price: parseFloat(price),
  //       location,
  //       specifications: {
  //         bedrooms: parseInt(bedrooms) || 0,
  //         bathrooms: parseInt(bathrooms) || 0,
  //         maxGuests: parseInt(maxGuests) || 1,
  //         squareFeet: parseInt(squareFeet) || 0
  //       },
  //       amenities: amenitiesArray,
  //       images,
  //       owner: req.user.id,
  //       status: 'active'
  //     });

  //     await property.save();

  //     // Add property to user's propertyList
  //     await User.findByIdAndUpdate(req.user.id, {
  //       $push: { propertyList: property._id }
  //     });

  //     const populatedProperty = await Property.findById(property._id)
  //       .populate('owner', 'firstName lastName email profileImagePath')
  //       .populate('amenities', 'name icon category');

  //     res.status(201).json({
  //       message: "Property created successfully",
  //       property: populatedProperty
  //     });

  //   } catch (err) {
  //     console.error('Create property error:', err);
  //     res.status(500).json({ 
  //       message: "Failed to create property", 
  //       error: err.message 
  //     });
  //   }
  // },


  // updateProperty: async (req, res) => {
  //   try {
  //     const { id } = req.params;
  //     const updateData = { ...req.body };

  //     // Find property and check ownership
  //     const property = await Property.findById(id);
  //     if (!property) {
  //       return res.status(404).json({ message: "Property not found" });
  //     }

  //     // Check if user owns the property or is admin
  //     if (property.owner.toString() !== req.user.id && req.user.role !== 'admin') {
  //       return res.status(403).json({ message: "Access denied" });
  //     }

  //     // Handle specifications update
  //     if (updateData.bedrooms || updateData.bathrooms || updateData.maxGuests || updateData.squareFeet) {
  //       updateData.specifications = {
  //         bedrooms: parseInt(updateData.bedrooms) || property.specifications.bedrooms,
  //         bathrooms: parseInt(updateData.bathrooms) || property.specifications.bathrooms,
  //         maxGuests: parseInt(updateData.maxGuests) || property.specifications.maxGuests,
  //         squareFeet: parseInt(updateData.squareFeet) || property.specifications.squareFeet
  //       };
  //       delete updateData.bedrooms;
  //       delete updateData.bathrooms;
  //       delete updateData.maxGuests;
  //       delete updateData.squareFeet;
  //     }

  //     // Handle amenities update
  //     if (updateData.amenities) {
  //       const amenitiesArray = typeof updateData.amenities === 'string' 
  //         ? JSON.parse(updateData.amenities) 
  //         : updateData.amenities;
        
  //       // Validate amenities exist and are active
  //       if (amenitiesArray.length > 0) {
  //         const existingAmenities = await Amenity.find({
  //           _id: { $in: amenitiesArray },
  //           isActive: true
  //         });
          
  //         if (existingAmenities.length !== amenitiesArray.length) {
  //           return res.status(400).json({ 
  //             message: "Some amenities are invalid or inactive" 
  //           });
  //         }
  //       }
        
  //       updateData.amenities = amenitiesArray;
  //     }

  //     // Handle image uploads for Cloudinary
  //     if (req.files && req.files.length > 0) {
  //       const newImages = req.files.map((file, index) => {
  //         const imageUrl = file.cloudinary?.url || file.path;
          
  //         console.log('Adding new image:', {
  //           originalName: file.originalname,
  //           cloudinaryUrl: file.cloudinary?.url,
  //           finalUrl: imageUrl
  //         });
          
  //         return {
  //           url: imageUrl,
  //           isMain: property.images.length === 0 && index === 0,
  //           order: property.images.length + index
  //         };
  //       });
        
  //       updateData.$push = { images: { $each: newImages } };
  //     }

  //     const updatedProperty = await Property.findByIdAndUpdate(
  //       id,
  //       updateData,
  //       { new: true, runValidators: true }
  //     )
  //       .populate('owner', 'firstName lastName profileImagePath')
  //       .populate('amenities', 'name icon category');

  //     res.status(200).json({
  //       message: "Property updated successfully",
  //       property: updatedProperty
  //     });

  //   } catch (err) {
  //     console.error('Update property error:', err);
  //     res.status(500).json({ 
  //       message: "Failed to update property", 
  //       error: err.message 
  //     });
  //   }
  // },



  createProperty: async (req, res) => {
    try {
      const {
        title,
        description,
        type,
        price,
        location,
        bedrooms,
        bathrooms,
        maxGuests,
        squareFeet,
        amenities,
        utilityPercentage,
        serviceChargePercentage,
        vatPercentage
      } = req.body;

      // Parse amenities if it's a string and validate they exist
      let amenitiesArray = [];
      if (amenities) {
        amenitiesArray = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
        
        // Validate that all amenity IDs exist and are active
        if (amenitiesArray.length > 0) {
          const existingAmenities = await Amenity.find({
            _id: { $in: amenitiesArray },
            isActive: true
          });
          
          if (existingAmenities.length !== amenitiesArray.length) {
            return res.status(400).json({ 
              message: "Some amenities are invalid or inactive" 
            });
          }
        }
      }

      // Handle image uploads for Cloudinary
      let images = [];
      if (req.files && req.files.length > 0) {
        images = req.files.map((file, index) => {
          // Get URL from Cloudinary or fallback to path
          const imageUrl = file.cloudinary?.url || file.path;
          
          console.log('Processing image:', {
            originalName: file.originalname,
            cloudinaryUrl: file.cloudinary?.url,
            localPath: file.path,
            finalUrl: imageUrl
          });
          
          return {
            url: imageUrl,
            isMain: index === 0,
            order: index
          };
        });
      }

      if (images.length === 0) {
        return res.status(400).json({ message: "At least one image is required" });
      }

      // Create property with new price fields
      const property = new Property({
        title,
        description,
        type,
        price: parseFloat(price),
        // New price calculation fields with defaults
        utilityPercentage: utilityPercentage ? parseFloat(utilityPercentage) : 20,
        serviceChargePercentage: serviceChargePercentage ? parseFloat(serviceChargePercentage) : 10,
        vatPercentage: vatPercentage ? parseFloat(vatPercentage) : 7.5,
        location,
        specifications: {
          bedrooms: parseInt(bedrooms) || 0,
          bathrooms: parseInt(bathrooms) || 0,
          maxGuests: parseInt(maxGuests) || 1,
          squareFeet: parseInt(squareFeet) || 0
        },
        amenities: amenitiesArray,
        images,
        owner: req.user.id,
        status: 'active'
      });

      await property.save();

      // Add property to user's propertyList
      await User.findByIdAndUpdate(req.user.id, {
        $push: { propertyList: property._id }
      });

      // Populate the property with owner and amenities data
      const populatedProperty = await Property.findById(property._id)
        .populate('owner', 'firstName lastName email profileImagePath')
        .populate('amenities', 'name icon category');

      // Log price breakdown for verification
      console.log('Property created with price breakdown:', {
        actualPrice: property.price,
        utilityPercentage: property.utilityPercentage,
        serviceChargePercentage: property.serviceChargePercentage,
        vatPercentage: property.vatPercentage,
        calculatedPrices: property.calculatedPrices,
        priceBreakdown: property.priceBreakdown
      });

      res.status(201).json({
        message: "Property created successfully",
        property: populatedProperty,
        priceBreakdown: property.priceBreakdown
      });

    } catch (err) {
      console.error('Create property error:', err);
      res.status(500).json({ 
        message: "Failed to create property", 
        error: err.message 
      });
    }
  },

  // Update property
  updateProperty: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      // Find property and check ownership
      const property = await Property.findById(id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      // Check if user owns the property or is admin
      if (property.owner.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      // Handle specifications update
      if (updateData.bedrooms || updateData.bathrooms || updateData.maxGuests || updateData.squareFeet) {
        updateData.specifications = {
          bedrooms: parseInt(updateData.bedrooms) || property.specifications.bedrooms,
          bathrooms: parseInt(updateData.bathrooms) || property.specifications.bathrooms,
          maxGuests: parseInt(updateData.maxGuests) || property.specifications.maxGuests,
          squareFeet: parseInt(updateData.squareFeet) || property.specifications.squareFeet
        };
        delete updateData.bedrooms;
        delete updateData.bathrooms;
        delete updateData.maxGuests;
        delete updateData.squareFeet;
      }

      // Handle amenities update
      if (updateData.amenities) {
        const amenitiesArray = typeof updateData.amenities === 'string' 
          ? JSON.parse(updateData.amenities) 
          : updateData.amenities;
        
        // Validate amenities exist and are active
        if (amenitiesArray.length > 0) {
          const existingAmenities = await Amenity.find({
            _id: { $in: amenitiesArray },
            isActive: true
          });
          
          if (existingAmenities.length !== amenitiesArray.length) {
            return res.status(400).json({ 
              message: "Some amenities are invalid or inactive" 
            });
          }
        }
        
        updateData.amenities = amenitiesArray;
      }

      // Handle price-related field updates
      if (updateData.price !== undefined) {
        updateData.price = parseFloat(updateData.price);
      }
      if (updateData.utilityPercentage !== undefined) {
        updateData.utilityPercentage = parseFloat(updateData.utilityPercentage);
      }
      if (updateData.serviceChargePercentage !== undefined) {
        updateData.serviceChargePercentage = parseFloat(updateData.serviceChargePercentage);
      }
      if (updateData.vatPercentage !== undefined) {
        updateData.vatPercentage = parseFloat(updateData.vatPercentage);
      }

      // Handle image uploads for Cloudinary
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map((file, index) => {
          const imageUrl = file.cloudinary?.url || file.path;
          
          console.log('Adding new image:', {
            originalName: file.originalname,
            cloudinaryUrl: file.cloudinary?.url,
            finalUrl: imageUrl
          });
          
          return {
            url: imageUrl,
            isMain: property.images.length === 0 && index === 0,
            order: property.images.length + index
          };
        });
        
        updateData.$push = { images: { $each: newImages } };
      }

      const updatedProperty = await Property.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('owner', 'firstName lastName profileImagePath')
        .populate('amenities', 'name icon category');

      // Log updated price breakdown
      console.log('Property updated with price breakdown:', {
        actualPrice: updatedProperty.price,
        utilityPercentage: updatedProperty.utilityPercentage,
        serviceChargePercentage: updatedProperty.serviceChargePercentage,
        vatPercentage: updatedProperty.vatPercentage,
        calculatedPrices: updatedProperty.calculatedPrices,
        priceBreakdown: updatedProperty.priceBreakdown
      });

      res.status(200).json({
        message: "Property updated successfully",
        property: updatedProperty,
        priceBreakdown: updatedProperty.priceBreakdown
      });

    } catch (err) {
      console.error('Update property error:', err);
      res.status(500).json({ 
        message: "Failed to update property", 
        error: err.message 
      });
    }
  },
 

  // Delete property
  deleteProperty: async (req, res) => {
    try {
      const { id } = req.params;

      const property = await Property.findById(id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      // Check if user owns the property or is admin
      if (property.owner.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      await Property.findByIdAndDelete(id);

      // Remove property from user's propertyList
      await User.findByIdAndUpdate(property.owner, {
        $pull: { propertyList: id }
      });

      res.status(200).json({ message: "Property deleted successfully" });

    } catch (err) {
      console.error('Delete property error:', err);
      res.status(500).json({ 
        message: "Failed to delete property", 
        error: err.message 
      });
    }
  },

  // Get user's properties
  getUserProperties: async (req, res) => {
    try {
      const properties = await Property.find({ owner: req.user.id })
        .populate('owner', 'firstName lastName profileImagePath')
        .sort({ createdAt: -1 });

      res.status(200).json(properties);
    } catch (err) {
      console.error('Get user properties error:', err);
      res.status(500).json({ 
        message: "Failed to fetch user properties", 
        error: err.message 
      });
    }
  },

  // Admin: Get all properties
  getAllPropertiesAdmin: async (req, res) => {
    try {
      const { page = 1, limit = 10, status } = req.query;

      const query = {};
      if (status) query.status = status;

      const properties = await Property.find(query)
        .populate('owner', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Property.countDocuments(query);

      res.status(200).json({
        properties,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });

    } catch (err) {
      console.error('Get admin properties error:', err);
      res.status(500).json({ 
        message: "Failed to fetch properties", 
        error: err.message 
      });
    }
  },

  // Admin: Update property status
  updatePropertyStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const property = await Property.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      ).populate('owner', 'firstName lastName email');

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      res.status(200).json({
        message: "Property status updated successfully",
        property
      });

    } catch (err) {
      console.error('Update property status error:', err);
      res.status(500).json({ 
        message: "Failed to update property status", 
        error: err.message 
      });
    }
  },

  // Admin: Toggle featured status
  toggleFeatured: async (req, res) => {
    try {
      const { id } = req.params;

      const property = await Property.findById(id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      property.isFeatured = !property.isFeatured;
      await property.save();

      res.status(200).json({
        message: `Property ${property.isFeatured ? 'added to' : 'removed from'} featured listings`,
        property
      });

    } catch (err) {
      console.error('Toggle featured error:', err);
      res.status(500).json({ 
        message: "Failed to update featured status", 
        error: err.message 
      });
    }
  }
};

module.exports = propertyController;




