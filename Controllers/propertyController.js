const Property = require("../Models/PropertyModel");
const User = require("../Models/UserModel");
const Amenity = require("../Models/AmenityModel");
const mongoose = require("mongoose");

const propertyController = {
   
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

  
// ///////////////////////////////////////////////////////////////////////////////////////


   

  // Get all properties (public) - Updated to populate amenities
  // getAllProperties: async (req, res) => {
  //   try {
  //     const {
  //       page = 1,
  //       limit = 10,
  //       type,
  //       minPrice,
  //       maxPrice,
  //       location,
  //       amenities,
  //       sortBy = 'createdAt',
  //       sortOrder = 'desc'
  //     } = req.query;

  //     const query = { status: 'active' };

  //     // Build filter query
  //     if (type) query.type = type;
  //     if (location) {
  //       query.location = { $regex: location, $options: 'i' };
  //     }
  //     if (minPrice || maxPrice) {
  //       query.price = {};
  //       if (minPrice) query.price.$gte = parseInt(minPrice);
  //       if (maxPrice) query.price.$lte = parseInt(maxPrice);
  //     }
  //     if (amenities) {
  //       const amenitiesArray = Array.isArray(amenities) ? amenities : [amenities];
  //       query.amenities = { $in: amenitiesArray };
  //     }

  //     const sort = {};
  //     sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  //     const properties = await Property.find(query)
  //       .populate('owner', 'firstName lastName profileImagePath')
  //       .populate('amenities', 'name icon category isActive')
  //       .sort(sort)
  //       .limit(limit * 1)
  //       .skip((page - 1) * limit);

  //     const total = await Property.countDocuments(query);

  //     res.status(200).json({
  //       properties,
  //       totalPages: Math.ceil(total / limit),
  //       currentPage: page,
  //       total
  //     });

  //   } catch (err) {
  //     console.error('Get properties error:', err);
  //     res.status(500).json({ 
  //       message: "Failed to fetch properties", 
  //       error: err.message 
  //     });
  //   }
  // },

   

  // // In propertyController.js - Update getPropertyById function
  // getPropertyById: async (req, res) => {
  //   try {
  //     const { id } = req.params;

  //     // Validate property ID
  //     if (!id || id === 'undefined') {
  //       return res.status(400).json({ 
  //         message: "Property ID is required" 
  //       });
  //     }

  //     // Check if it's a valid MongoDB ObjectId
  //     if (!mongoose.Types.ObjectId.isValid(id)) {
  //       return res.status(400).json({ 
  //         message: "Invalid property ID format" 
  //       });
  //     }

  //     console.log('Fetching property with ID:', id); // Debug log

  //     const property = await Property.findById(id)
  //       .populate('owner', 'firstName lastName email phone profileImagePath verificationStatus')
  //       .populate('amenities', 'name icon category description');

  //     if (!property) {
  //       return res.status(404).json({ message: "Property not found" });
  //     }

  //     res.status(200).json(property);
  //   } catch (err) {
  //     console.error('Get property error:', err);
      
  //     // Handle CastError specifically
  //     if (err.name === 'CastError') {
  //       return res.status(400).json({ 
  //         message: "Invalid property ID format" 
  //       });
  //     }
      
  //     res.status(500).json({ 
  //       message: "Failed to fetch property", 
  //       error: err.message 
  //     });
  //   }
  // },






// In propertyController.js - Update getAllProperties
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

    // Log discount info for debugging
    console.log(`📊 Found ${properties.length} properties`);
    properties.forEach(p => {
      if (p.discount && p.discount.isActive) {
        console.log(`💰 Property ${p._id} has active discount: ${p.discount.type} ${p.discount.value}`);
      }
    });

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

// Update getPropertyById to ensure discount data is included
getPropertyById: async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === 'undefined') {
      return res.status(400).json({ message: "Property ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid property ID format" });
    }

    console.log('📡 Fetching property with ID:', id);

    const property = await Property.findById(id)
      .populate('owner', 'firstName lastName email phone profileImagePath verificationStatus')
      .populate('amenities', 'name icon category description');

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Log discount info
    if (property.discount && property.discount.isActive) {
      console.log('💰 Property has active discount:', {
        type: property.discount.type,
        value: property.discount.value,
        originalPrice: property.price,
        discountedPrice: property.discountedPrice,
        isDiscountActive: property.isDiscountActive ? property.isDiscountActive() : false
      });
    }

    res.status(200).json(property);
  } catch (err) {
    console.error('Get property error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: "Invalid property ID format" });
    }
    res.status(500).json({ 
      message: "Failed to fetch property", 
      error: err.message 
    });
  }
},




   

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
  //       amenities,
  //       utilityPercentage,
  //       serviceChargePercentage,
  //       vatPercentage
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

  //     // Create property with new price fields
  //     const property = new Property({
  //       title,
  //       description,
  //       type,
  //       price: parseFloat(price),
  //       // New price calculation fields with defaults
  //       utilityPercentage: utilityPercentage ? parseFloat(utilityPercentage) : 20,
  //       serviceChargePercentage: serviceChargePercentage ? parseFloat(serviceChargePercentage) : 10,
  //       vatPercentage: vatPercentage ? parseFloat(vatPercentage) : 7.5,
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

  //     // Populate the property with owner and amenities data
  //     const populatedProperty = await Property.findById(property._id)
  //       .populate('owner', 'firstName lastName email profileImagePath')
  //       .populate('amenities', 'name icon category');

  //     // Log price breakdown for verification
  //     console.log('Property created with price breakdown:', {
  //       actualPrice: property.price,
  //       utilityPercentage: property.utilityPercentage,
  //       serviceChargePercentage: property.serviceChargePercentage,
  //       vatPercentage: property.vatPercentage,
  //       calculatedPrices: property.calculatedPrices,
  //       priceBreakdown: property.priceBreakdown
  //     });

  //     res.status(201).json({
  //       message: "Property created successfully",
  //       property: populatedProperty,
  //       priceBreakdown: property.priceBreakdown
  //     });

  //     console.log('Received discount data:', req.body.discount);


  //   } catch (err) {
  //     console.error('Create property error:', err);
  //     res.status(500).json({ 
  //       message: "Failed to create property", 
  //       error: err.message 
  //     });
  //   }
  // },




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
//       amenities,
//       utilityPercentage,
//       serviceChargePercentage,
//       vatPercentage,
//       discount // Make sure discount is destructured
//     } = req.body;

//     console.log('========== CREATE PROPERTY ==========');
//     console.log('Raw discount from request:', req.body.discount);
    
//     // Parse discount if it's a string
//     let parsedDiscount = null;
//     if (discount) {
//       try {
//         parsedDiscount = typeof discount === 'string' ? JSON.parse(discount) : discount;
//         console.log('Parsed discount:', parsedDiscount);
//       } catch (e) {
//         console.error('Error parsing discount:', e);
//       }
//     }

//     // Parse amenities
//     let amenitiesArray = [];
//     if (amenities) {
//       amenitiesArray = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
//     }

//     // Handle image uploads
//     let images = [];
//     if (req.files && req.files.length > 0) {
//       images = req.files.map((file, index) => {
//         const imageUrl = file.cloudinary?.url || file.path;
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

//     // Create property data object
//     const propertyData = {
//       title,
//       description,
//       type,
//       price: parseFloat(price),
//       utilityPercentage: utilityPercentage ? parseFloat(utilityPercentage) : 20,
//       serviceChargePercentage: serviceChargePercentage ? parseFloat(serviceChargePercentage) : 10,
//       vatPercentage: vatPercentage ? parseFloat(vatPercentage) : 7.5,
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
//     };

//     // Add discount if it exists and is valid
//     if (parsedDiscount && parsedDiscount.isActive) {
//       propertyData.discount = {
//         type: parsedDiscount.type,
//         value: parseFloat(parsedDiscount.value),
//         startDate: parsedDiscount.startDate ? new Date(parsedDiscount.startDate) : null,
//         endDate: parsedDiscount.endDate ? new Date(parsedDiscount.endDate) : null,
//         isActive: true
//       };
//       console.log('Added discount to property data:', propertyData.discount);
//     }

//     const property = new Property(propertyData);
//     await property.save();

//     console.log('Saved property discount:', property.discount);

//     // Add property to user's propertyList
//     await User.findByIdAndUpdate(req.user.id, {
//       $push: { propertyList: property._id }
//     });

//     // Populate the property
//     const populatedProperty = await Property.findById(property._id)
//       .populate('owner', 'firstName lastName email profileImagePath')
//       .populate('amenities', 'name icon category');

//     console.log('Populated property discount:', populatedProperty.discount);

//     res.status(201).json({
//       message: "Property created successfully",
//       property: populatedProperty,
//       priceBreakdown: property.priceBreakdown
//     });

//   } catch (err) {
//     console.error('Create property error:', err);
//     res.status(500).json({ 
//       message: "Failed to create property", 
//       error: err.message 
//     });
//   }
// },





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
//       amenities,
//       utilityPercentage,
//       serviceChargePercentage,
//       vatPercentage,
//       discount // Make sure discount is destructured here
//     } = req.body;

//     console.log('========== CREATE PROPERTY ==========');
//     console.log('Request body discount:', discount);
//     console.log('Discount type:', typeof discount);

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

//     // Create property data object
//     const propertyData = {
//       title,
//       description,
//       type,
//       price: parseFloat(price),
//       utilityPercentage: utilityPercentage ? parseFloat(utilityPercentage) : 20,
//       serviceChargePercentage: serviceChargePercentage ? parseFloat(serviceChargePercentage) : 10,
//       vatPercentage: vatPercentage ? parseFloat(vatPercentage) : 7.5,
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
//     };

//     // Parse and add discount if it exists
//     if (discount) {
//       try {
//         // Parse discount if it's a string
//         const discountData = typeof discount === 'string' ? JSON.parse(discount) : discount;
        
//         console.log('Parsed discount data:', discountData);
        
//         // Only add discount if it's active and has valid data
//         if (discountData && discountData.isActive && discountData.type && discountData.value) {
//           propertyData.discount = {
//             type: discountData.type,
//             value: parseFloat(discountData.value),
//             startDate: discountData.startDate ? new Date(discountData.startDate) : null,
//             endDate: discountData.endDate ? new Date(discountData.endDate) : null,
//             isActive: true
//           };
//           console.log('Added discount to property data:', propertyData.discount);
//         }
//       } catch (e) {
//         console.error('Error parsing discount:', e);
//       }
//     }

//     console.log('Final property data:', propertyData);

//     // Create property with all data including discount
//     const property = new Property(propertyData);

//     await property.save();

//     console.log('Property saved with discount:', property.discount);

//     // Add property to user's propertyList
//     await User.findByIdAndUpdate(req.user.id, {
//       $push: { propertyList: property._id }
//     });

//     // Populate the property with owner and amenities data
//     const populatedProperty = await Property.findById(property._id)
//       .populate('owner', 'firstName lastName email profileImagePath')
//       .populate('amenities', 'name icon category');

//     // Log price breakdown for verification
//     console.log('Property created with price breakdown:', {
//       actualPrice: property.price,
//       discount: property.discount,
//       discountedPrice: property.discountedPrice,
//       isDiscountActive: property.isDiscountActive ? property.isDiscountActive() : false,
//       utilityPercentage: property.utilityPercentage,
//       serviceChargePercentage: property.serviceChargePercentage,
//       vatPercentage: property.vatPercentage,
//       calculatedPrices: property.calculatedPrices,
//       priceBreakdown: property.priceBreakdown
//     });

//     res.status(201).json({
//       message: "Property created successfully",
//       property: populatedProperty,
//       priceBreakdown: property.priceBreakdown
//     });

//   } catch (err) {
//     console.error('Create property error:', err);
//     res.status(500).json({ 
//       message: "Failed to create property", 
//       error: err.message 
//     });
//   }
// },




// createProperty: async (req, res) => {
//   console.log('🔥🔥🔥 CREATE PROPERTY FUNCTION CALLED 🔥🔥🔥');
//   console.log('Time:', new Date().toISOString());
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
//       amenities,
//       utilityPercentage,
//       serviceChargePercentage,
//       vatPercentage,
//       discount // Make sure discount is destructured here
//     } = req.body;

//     console.log('========== CREATE PROPERTY ==========');
//     console.log('Request body discount:', discount);
//     console.log('Discount type:', typeof discount);

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

//     // Create property data object
//     const propertyData = {
//       title,
//       description,
//       type,
//       price: parseFloat(price),
//       utilityPercentage: utilityPercentage ? parseFloat(utilityPercentage) : 20,
//       serviceChargePercentage: serviceChargePercentage ? parseFloat(serviceChargePercentage) : 10,
//       vatPercentage: vatPercentage ? parseFloat(vatPercentage) : 7.5,
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
//     };

//     // ========== PARSE AND ADD DISCOUNT IF IT EXISTS ==========
//     console.log('Processing discount data...');
    
//     if (discount) {
//       try {
//         // Parse discount if it's a string
//         const discountData = typeof discount === 'string' ? JSON.parse(discount) : discount;
        
//         console.log('Parsed discount data:', discountData);
//         console.log('Discount isActive:', discountData?.isActive);
//         console.log('Discount type:', discountData?.type);
//         console.log('Discount value:', discountData?.value);
        
//         // Only add discount if it's active and has valid data
//         if (discountData && discountData.isActive === true && discountData.type && discountData.value) {
//           propertyData.discount = {
//             type: discountData.type,
//             value: parseFloat(discountData.value),
//             startDate: discountData.startDate ? new Date(discountData.startDate) : null,
//             endDate: discountData.endDate ? new Date(discountData.endDate) : null,
//             isActive: true
//           };
//           console.log('✅ Added discount to property data:', propertyData.discount);
//         } else {
//           console.log('❌ Discount data missing required fields or not active:', discountData);
          
//           // Log what's missing
//           if (!discountData) console.log('  - discountData is null/undefined');
//           if (discountData && discountData.isActive !== true) console.log('  - isActive is not true');
//           if (discountData && !discountData.type) console.log('  - type is missing');
//           if (discountData && !discountData.value) console.log('  - value is missing');
//         }
//       } catch (e) {
//         console.error('❌ Error parsing discount:', e);
//         console.error('Raw discount value:', discount);
//       }
//     } else {
//       console.log('ℹ️ No discount data received');
//     }

//     console.log('Final propertyData.discount:', propertyData.discount);

//     // Create property with all data including discount
//     const property = new Property(propertyData);

//     await property.save();

//     console.log('✅ Property saved with discount:', property.discount);
//     console.log('✅ Is discount active?', property.isDiscountActive ? property.isDiscountActive() : 'method not available');
//     console.log('✅ Discounted price:', property.discountedPrice);

//     // Add property to user's propertyList
//     await User.findByIdAndUpdate(req.user.id, {
//       $push: { propertyList: property._id }
//     });

//     // Populate the property with owner and amenities data
//     const populatedProperty = await Property.findById(property._id)
//       .populate('owner', 'firstName lastName email profileImagePath')
//       .populate('amenities', 'name icon category');

//     // Log price breakdown for verification
//     console.log('Property created with price breakdown:', {
//       actualPrice: property.price,
//       discount: property.discount,
//       discountedPrice: property.discountedPrice,
//       isDiscountActive: property.isDiscountActive ? property.isDiscountActive() : false,
//       utilityPercentage: property.utilityPercentage,
//       serviceChargePercentage: property.serviceChargePercentage,
//       vatPercentage: property.vatPercentage,
//       calculatedPrices: property.calculatedPrices,
//       priceBreakdown: property.priceBreakdown
//     });

//     res.status(201).json({
//       message: "Property created successfully",
//       property: populatedProperty,
//       priceBreakdown: property.priceBreakdown
//     });

//   } catch (err) {
//     console.error('Create property error:', err);
//     res.status(500).json({ 
//       message: "Failed to create property", 
//       error: err.message 
//     });
//   }
// },



// createProperty: async (req, res) => {
//   console.log('🔥🔥🔥 CREATE PROPERTY FUNCTION CALLED 🔥🔥🔥');
//   console.log('Time:', new Date().toISOString());
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
//       amenities,
//       utilityPercentage,
//       serviceChargePercentage,
//       vatPercentage,
//       discount
//     } = req.body;

//     console.log('========== CREATE PROPERTY ==========');
//     console.log('Request body discount:', discount);
//     console.log('Discount type:', typeof discount);

//     // Parse amenities if it's a string
//     let amenitiesArray = [];
//     if (amenities) {
//       amenitiesArray = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
      
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
//     let images = [];
//     if (req.files && req.files.length > 0) {
//       images = req.files.map((file, index) => {
//         const imageUrl = file.cloudinary?.url || file.path;
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

//     // Create base property data
//     const propertyData = {
//       title,
//       description,
//       type,
//       price: parseFloat(price),
//       utilityPercentage: utilityPercentage ? parseFloat(utilityPercentage) : 20,
//       serviceChargePercentage: serviceChargePercentage ? parseFloat(serviceChargePercentage) : 10,
//       vatPercentage: vatPercentage ? parseFloat(vatPercentage) : 7.5,
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
//     };

//     // ========== CRITICAL FIX: Parse and add discount if it exists ==========
//     console.log('Processing discount data...');
    
//     if (discount) {
//       try {
//         // Parse discount if it's a string
//         const discountData = typeof discount === 'string' ? JSON.parse(discount) : discount;
        
//         console.log('Parsed discount data:', discountData);
        
//         // Validate discount data
//         if (discountData && discountData.isActive === true && discountData.type && discountData.value) {
//           // IMPORTANT: Make sure to set the discount field in propertyData
//           propertyData.discount = {
//             type: discountData.type,
//             value: parseFloat(discountData.value),
//             startDate: discountData.startDate ? new Date(discountData.startDate) : null,
//             endDate: discountData.endDate ? new Date(discountData.endDate) : null,
//             isActive: true
//           };
//           console.log('✅ Discount added to propertyData:', propertyData.discount);
//         } else {
//           console.log('❌ Discount data missing required fields:', discountData);
//         }
//       } catch (e) {
//         console.error('❌ Error parsing discount:', e);
//       }
//     } else {
//       console.log('ℹ️ No discount data received');
//     }

//     console.log('Final propertyData before save:', {
//       title: propertyData.title,
//       price: propertyData.price,
//       hasDiscount: !!propertyData.discount,
//       discount: propertyData.discount
//     });

//     // Create property with all data including discount
//     const property = new Property(propertyData);

//     // Save to database
//     await property.save();

//     console.log('✅ Property saved successfully');
//     console.log('✅ Saved property discount:', property.discount);
//     console.log('✅ Is discount active?', property.isDiscountActive ? property.isDiscountActive() : false);
//     console.log('✅ Discounted price:', property.discountedPrice);

//     // Add property to user's propertyList
//     await User.findByIdAndUpdate(req.user.id, {
//       $push: { propertyList: property._id }
//     });

//     // Populate the property
//     const populatedProperty = await Property.findById(property._id)
//       .populate('owner', 'firstName lastName email profileImagePath')
//       .populate('amenities', 'name icon category');

//     console.log('Populated property discount:', populatedProperty.discount);

//     res.status(201).json({
//       message: "Property created successfully",
//       property: populatedProperty,
//       priceBreakdown: property.priceBreakdown
//     });

//   } catch (err) {
//     console.error('Create property error:', err);
//     res.status(500).json({ 
//       message: "Failed to create property", 
//       error: err.message 
//     });
//   }
// },


// createProperty: async (req, res) => {
//   console.log('🔥🔥🔥 CREATE PROPERTY FUNCTION CALLED 🔥🔥🔥');
//   console.log('Time:', new Date().toISOString());
//   console.log('Full req.body:', req.body);
//   console.log('Discount in req.body:', req.body.discount);
  
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
//       amenities,
//       utilityPercentage,
//       serviceChargePercentage,
//       vatPercentage,
//       discount // Make sure discount is destructured
//     } = req.body;

//     console.log('========== CREATE PROPERTY ==========');
//     console.log('Raw discount from request:', discount);
//     console.log('Discount type:', typeof discount);

//     // Parse amenities if it's a string
//     let amenitiesArray = [];
//     if (amenities) {
//       amenitiesArray = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
//     }

//     // Handle image uploads
//     let images = [];
//     if (req.files && req.files.length > 0) {
//       images = req.files.map((file, index) => {
//         const imageUrl = file.cloudinary?.url || file.path;
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

//     // Create property data object
//     const propertyData = {
//       title,
//       description,
//       type,
//       price: parseFloat(price),
//       utilityPercentage: utilityPercentage ? parseFloat(utilityPercentage) : 20,
//       serviceChargePercentage: serviceChargePercentage ? parseFloat(serviceChargePercentage) : 10,
//       vatPercentage: vatPercentage ? parseFloat(vatPercentage) : 7.5,
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
//     };

//     // ========== CRITICAL FIX: Parse and add discount if it exists ==========
//     console.log('Processing discount data...');
    
//     if (discount) {
//       try {
//         // Parse discount if it's a string
//         let discountData;
//         if (typeof discount === 'string') {
//           discountData = JSON.parse(discount);
//         } else {
//           discountData = discount;
//         }
        
//         console.log('Parsed discount data:', discountData);
        
//         // Validate discount data has required fields
//         if (discountData && discountData.isActive === true && discountData.type && discountData.value !== undefined) {
//           // Create the discount object with all fields
//           const discountObject = {
//             type: discountData.type,
//             value: parseFloat(discountData.value),
//             isActive: true
//           };
          
//           // Add optional date fields if they exist and are not null
//           if (discountData.startDate && discountData.startDate !== null) {
//             discountObject.startDate = new Date(discountData.startDate);
//           }
          
//           if (discountData.endDate && discountData.endDate !== null) {
//             discountObject.endDate = new Date(discountData.endDate);
//           }
          
//           // IMPORTANT: Assign the discount object to propertyData
//           propertyData.discount = discountObject;
          
//           console.log('✅ Discount added to propertyData:', propertyData.discount);
//         } else {
//           console.log('❌ Discount data missing required fields:', discountData);
//         }
//       } catch (e) {
//         console.error('❌ Error parsing discount:', e);
//         console.error('Raw discount value:', discount);
//       }
//     } else {
//       console.log('ℹ️ No discount data received');
//     }

//     console.log('Final propertyData before save:', {
//       title: propertyData.title,
//       price: propertyData.price,
//       hasDiscount: !!propertyData.discount,
//       discount: propertyData.discount
//     });

//     // Create property with all data including discount
//     const property = new Property(propertyData);

//     // Save to database
//     await property.save();

//     console.log('✅ Property saved successfully');
//     console.log('✅ Saved property discount:', property.discount);
//     console.log('✅ Is discount active?', property.discount ? property.discount.isActive : false);
//     console.log('✅ Discounted price:', property.discountedPrice);

//     // Add property to user's propertyList
//     await User.findByIdAndUpdate(req.user.id, {
//       $push: { propertyList: property._id }
//     });

//     // Populate the property
//     const populatedProperty = await Property.findById(property._id)
//       .populate('owner', 'firstName lastName email profileImagePath')
//       .populate('amenities', 'name icon category');

//     console.log('Populated property discount:', populatedProperty.discount);

//     res.status(201).json({
//       message: "Property created successfully",
//       property: populatedProperty,
//       priceBreakdown: property.priceBreakdown
//     });

//   } catch (err) {
//     console.error('Create property error:', err);
//     res.status(500).json({ 
//       message: "Failed to create property", 
//       error: err.message 
//     });
//   }
// },




createProperty: async (req, res) => {
  console.log('🔥🔥🔥 CREATE PROPERTY FUNCTION CALLED 🔥🔥🔥');
  console.log('Time:', new Date().toISOString());
  
  // Log the ENTIRE request body
  console.log('📦 FULL REQUEST BODY:', req.body);
  
  // Specifically check for discount
  console.log('💰 DISCOUNT IN REQUEST BODY:', req.body.discount);
  console.log('💰 DISCOUNT TYPE:', typeof req.body.discount);
  
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
      vatPercentage,
      discount
    } = req.body;

    console.log('========== CREATE PROPERTY ==========');
    console.log('Extracted discount:', discount);
    console.log('Discount type after extraction:', typeof discount);

    // Parse amenities if it's a string
    let amenitiesArray = [];
    if (amenities) {
      try {
        amenitiesArray = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
        console.log('Parsed amenities:', amenitiesArray);
      } catch (e) {
        console.error('Error parsing amenities:', e);
      }
    }

    // Handle image uploads
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file, index) => {
        const imageUrl = file.cloudinary?.url || file.path;
        return {
          url: imageUrl,
          isMain: index === 0,
          order: index
        };
      });
      console.log(`Processed ${images.length} images`);
    }

    if (images.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    // Create base property data
    const propertyData = {
      title,
      description,
      type,
      price: parseFloat(price),
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
    };

    console.log('Initial propertyData (before discount):', {
      title: propertyData.title,
      price: propertyData.price,
      hasDiscountField: !!propertyData.discount
    });

    // ========== CRITICAL: Parse and add discount if it exists ==========
    console.log('🔍 PROCESSING DISCOUNT DATA...');
    
    if (discount) {
      console.log('✅ Discount exists in request');
      console.log('Discount value:', discount);
      console.log('Discount type:', typeof discount);
      
      try {
        // Parse discount if it's a string
        let discountData;
        if (typeof discount === 'string') {
          console.log('Parsing discount string:', discount);
          discountData = JSON.parse(discount);
        } else {
          discountData = discount;
        }
        
        console.log('✅ Parsed discount data:', discountData);
        console.log('Discount isActive:', discountData?.isActive);
        console.log('Discount type:', discountData?.type);
        console.log('Discount value:', discountData?.value);
        
        // Validate discount data has required fields
        if (discountData && discountData.isActive === true && discountData.type && discountData.value !== undefined) {
          // Create the discount object
          const discountObject = {
            type: discountData.type,
            value: parseFloat(discountData.value),
            isActive: true
          };
          
          // Add optional date fields
          if (discountData.startDate && discountData.startDate !== null && discountData.startDate !== 'null') {
            discountObject.startDate = new Date(discountData.startDate);
            console.log('Added startDate:', discountObject.startDate);
          }
          
          if (discountData.endDate && discountData.endDate !== null && discountData.endDate !== 'null') {
            discountObject.endDate = new Date(discountData.endDate);
            console.log('Added endDate:', discountObject.endDate);
          }
          
          // IMPORTANT: Assign to propertyData
          propertyData.discount = discountObject;
          
          console.log('✅✅✅ DISCOUNT ADDED TO PROPERTYDATA:', propertyData.discount);
          console.log('Discount type:', propertyData.discount.type);
          console.log('Discount value:', propertyData.discount.value);
          console.log('Discount isActive:', propertyData.discount.isActive);
        } else {
          console.log('❌ Discount validation failed:', {
            hasData: !!discountData,
            isActive: discountData?.isActive,
            hasType: !!discountData?.type,
            hasValue: discountData?.value !== undefined
          });
        }
      } catch (e) {
        console.error('❌❌❌ ERROR PARSING DISCOUNT:', e);
        console.error('Raw discount value that caused error:', discount);
      }
    } else {
      console.log('ℹ️ No discount data received in request');
    }

    console.log('📦 FINAL PROPERTYDATA BEFORE SAVE:', JSON.stringify(propertyData, null, 2));
    console.log('Does propertyData have discount?', !!propertyData.discount);
    if (propertyData.discount) {
      console.log('Discount in propertyData:', propertyData.discount);
    }

    // Create property with all data
    const property = new Property(propertyData);

    // Save to database
    await property.save();
    console.log('✅ Property saved to database');

    // Check what was actually saved
    const savedProperty = await Property.findById(property._id).lean();
    console.log('📦 SAVED PROPERTY FROM DATABASE:', {
      id: savedProperty._id,
      price: savedProperty.price,
      hasDiscount: !!savedProperty.discount,
      discount: savedProperty.discount
    });

    // Add property to user's propertyList
    await User.findByIdAndUpdate(req.user.id, {
      $push: { propertyList: property._id }
    });

    // Populate the property
    const populatedProperty = await Property.findById(property._id)
      .populate('owner', 'firstName lastName email profileImagePath')
      .populate('amenities', 'name icon category');

    console.log('✅ Final populated property discount:', populatedProperty.discount);

    res.status(201).json({
      message: "Property created successfully",
      property: populatedProperty,
      priceBreakdown: property.priceBreakdown
    });

  } catch (err) {
    console.error('❌❌❌ CREATE PROPERTY ERROR:', err);
    res.status(500).json({ 
      message: "Failed to create property", 
      error: err.message 
    });
  }
},




// Add this temporary debug endpoint
debugCreateProperty: async (req, res) => {
  try {
    console.log('🔍 DEBUG CREATE PROPERTY');
    console.log('req.body:', req.body);
    console.log('req.body.discount:', req.body.discount);
    
    // Create a test property with hardcoded discount
    const testProperty = new Property({
      title: 'DEBUG TEST PROPERTY',
      description: 'This is a debug test',
      type: 'apartment',
      price: 50000,
      location: 'Test Location',
      images: [{ url: 'https://via.placeholder.com/150', isMain: true, order: 0 }],
      owner: req.user.id,
      status: 'active',
      discount: {
        type: 'percentage',
        value: 15,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isActive: true
      }
    });

    await testProperty.save();
    console.log('✅ Test property saved with discount:', testProperty.discount);
    
    res.json({
      message: 'Debug test property created',
      property: testProperty,
      discount: testProperty.discount
    });
  } catch (err) {
    console.error('Debug error:', err);
    res.status(500).json({ error: err.message });
  }
},







  // Update property
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

  //     // Handle price-related field updates
  //     if (updateData.price !== undefined) {
  //       updateData.price = parseFloat(updateData.price);
  //     }
  //     if (updateData.utilityPercentage !== undefined) {
  //       updateData.utilityPercentage = parseFloat(updateData.utilityPercentage);
  //     }
  //     if (updateData.serviceChargePercentage !== undefined) {
  //       updateData.serviceChargePercentage = parseFloat(updateData.serviceChargePercentage);
  //     }
  //     if (updateData.vatPercentage !== undefined) {
  //       updateData.vatPercentage = parseFloat(updateData.vatPercentage);
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

  //     // Log updated price breakdown
  //     console.log('Property updated with price breakdown:', {
  //       actualPrice: updatedProperty.price,
  //       utilityPercentage: updatedProperty.utilityPercentage,
  //       serviceChargePercentage: updatedProperty.serviceChargePercentage,
  //       vatPercentage: updatedProperty.vatPercentage,
  //       calculatedPrices: updatedProperty.calculatedPrices,
  //       priceBreakdown: updatedProperty.priceBreakdown
  //     });



  //     res.status(200).json({
  //       message: "Property updated successfully",
  //       property: updatedProperty,
  //       priceBreakdown: updatedProperty.priceBreakdown
  //     });
  //     console.log('Received discount data:', req.body.discount);

  //   } catch (err) {
  //     console.error('Update property error:', err);
  //     res.status(500).json({ 
  //       message: "Failed to update property", 
  //       error: err.message 
  //     });
  //   }
  // },





updateProperty: async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    console.log('========== UPDATE PROPERTY ==========');
    console.log('Property ID:', id);
    console.log('Update data:', updateData);
    console.log('Discount in updateData:', updateData.discount);

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

    // ========== HANDLE DISCOUNT UPDATE ==========
    console.log('Processing discount update...');
    
    if (updateData.discount !== undefined) {
      try {
        // If discount is null or empty, remove discount
        if (updateData.discount === null || updateData.discount === 'null') {
          updateData.discount = null;
          console.log('Removing discount');
        } 
        // If discount is provided
        else if (updateData.discount) {
          const discountData = typeof updateData.discount === 'string' 
            ? JSON.parse(updateData.discount) 
            : updateData.discount;
          
          console.log('Parsed discount data for update:', discountData);
          
          // Only add discount if it's active and has valid data
          if (discountData && discountData.isActive === true && discountData.type && discountData.value) {
            updateData.discount = {
              type: discountData.type,
              value: parseFloat(discountData.value),
              startDate: discountData.startDate ? new Date(discountData.startDate) : null,
              endDate: discountData.endDate ? new Date(discountData.endDate) : null,
              isActive: true
            };
            console.log('✅ Updated discount:', updateData.discount);
          } else {
            // If discount is provided but not active, remove it
            console.log('Discount not active or invalid, removing');
            updateData.discount = null;
          }
        }
      } catch (e) {
        console.error('Error parsing discount in update:', e);
        updateData.discount = null;
      }
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

    console.log('Final updateData.discount:', updateData.discount);

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
      discount: updatedProperty.discount,
      discountedPrice: updatedProperty.discountedPrice,
      isDiscountActive: updatedProperty.isDiscountActive ? updatedProperty.isDiscountActive() : false,
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




