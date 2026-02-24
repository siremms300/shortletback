const { UtilityReading, UtilityRate, UtilityAlert } = require("../Models/UtilityModels");
const Property = require("../Models/PropertyModel");
const mongoose = require("mongoose");

const utilityController = {
  // ========== READINGS ==========

  // Create new utility reading
  createReading: async (req, res) => {
    try {
      const {
        propertyId,
        unit,
        type,
        previousReading,
        currentReading,
        readingDate,
        meterNumber,
        estimated,
        notes
      } = req.body;

      console.log('Creating utility reading:', req.body);

      // Validate required fields
      if (!propertyId || !unit || !type || previousReading === undefined || currentReading === undefined) {
        return res.status(400).json({
          success: false,
          message: "Property ID, unit, type, previous reading, and current reading are required"
        });
      }

      // Check if property exists
      const property = await Property.findById(propertyId);
      if (!property) {
        return res.status(404).json({
          success: false,
          message: "Property not found"
        });
      }

      // Get current rate for this utility type
      const rateDoc = await UtilityRate.findOne({ type });
      if (!rateDoc) {
        return res.status(400).json({
          success: false,
          message: `No rate configured for ${type}. Please set up rates first.`
        });
      }

      // Calculate consumption
      const consumption = currentReading - previousReading;
      if (consumption <= 0) {
        return res.status(400).json({
          success: false,
          message: "Current reading must be greater than previous reading"
        });
      }
      
      // Calculate cost based on rate type (tiered or flat)
      let cost = 0;
      if (rateDoc.tier1Limit && rateDoc.tier1Rate && rateDoc.tier2Limit && rateDoc.tier2Rate && rateDoc.tier3Rate) {
        // Tiered pricing calculation
        if (consumption <= rateDoc.tier1Limit) {
          cost = consumption * rateDoc.tier1Rate;
        } else if (consumption <= rateDoc.tier2Limit) {
          cost = (rateDoc.tier1Limit * rateDoc.tier1Rate) + 
                 ((consumption - rateDoc.tier1Limit) * rateDoc.tier2Rate);
        } else {
          cost = (rateDoc.tier1Limit * rateDoc.tier1Rate) + 
                 ((rateDoc.tier2Limit - rateDoc.tier1Limit) * rateDoc.tier2Rate) + 
                 ((consumption - rateDoc.tier2Limit) * rateDoc.tier3Rate);
        }
      } else {
        // Flat rate pricing
        cost = consumption * rateDoc.rate;
      }

      // Generate reading number
      const readingCount = await UtilityReading.countDocuments();
      const readingNumber = `UTL-${String(readingCount + 1).padStart(4, '0')}`;

      const reading = new UtilityReading({
        readingNumber,
        property: propertyId,
        unit,
        type,
        previousReading,
        currentReading,
        consumption,
        readingDate: readingDate || new Date(),
        cost,
        rate: rateDoc.rate,
        meterNumber: meterNumber || '',
        estimated: estimated || false,
        notes: notes || '',
        createdBy: req.user.id
      });

      await reading.save();

      // Populate property details
      await reading.populate('property', 'title location');
      await reading.populate('createdBy', 'firstName lastName');

      // Check for alerts (high usage)
      await checkForAlerts(reading, req.user.id);

      res.status(201).json({
        success: true,
        message: "Utility reading created successfully",
        reading
      });

    } catch (error) {
      console.error('Create utility reading error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to create utility reading",
        error: error.message
      });
    }
  },

  // Get all utility readings
  getAllReadings: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 50,
        propertyId,
        type,
        billed,
        startDate,
        endDate,
        period
      } = req.query;

      const query = {};

      // Apply filters
      if (propertyId && propertyId !== 'all') query.property = propertyId;
      if (type && type !== 'all') query.type = type;
      if (billed && billed !== 'all') query.billed = billed === 'true';

      // Date filtering
      if (startDate || endDate) {
        query.readingDate = {};
        if (startDate) query.readingDate.$gte = new Date(startDate);
        if (endDate) query.readingDate.$lte = new Date(endDate);
      } else if (period) {
        const now = new Date();
        let start = new Date();
        
        switch (period) {
          case 'month':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'quarter':
            const quarter = Math.floor(now.getMonth() / 3);
            start = new Date(now.getFullYear(), quarter * 3, 1);
            break;
          case 'year':
            start = new Date(now.getFullYear(), 0, 1);
            break;
        }
        
        query.readingDate = { $gte: start };
      }

      const readings = await UtilityReading.find(query)
        .populate('property', 'title location')
        .populate('createdBy', 'firstName lastName')
        .sort({ readingDate: -1, createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await UtilityReading.countDocuments(query);

      res.status(200).json({
        success: true,
        readings,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });

    } catch (error) {
      console.error('Get utility readings error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch utility readings",
        error: error.message
      });
    }
  },

  // Get reading by ID
  getReadingById: async (req, res) => {
    try {
      const { id } = req.params;

      const reading = await UtilityReading.findById(id)
        .populate('property', 'title location')
        .populate('createdBy', 'firstName lastName');

      if (!reading) {
        return res.status(404).json({
          success: false,
          message: "Utility reading not found"
        });
      }

      res.status(200).json({
        success: true,
        reading
      });

    } catch (error) {
      console.error('Get reading by ID error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch reading",
        error: error.message
      });
    }
  },

  // Update reading
  updateReading: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const reading = await UtilityReading.findById(id);

      if (!reading) {
        return res.status(404).json({
          success: false,
          message: "Utility reading not found"
        });
      }

      // If readings changed, recalculate consumption and cost
      if (updateData.previousReading !== undefined || updateData.currentReading !== undefined) {
        const previous = updateData.previousReading ?? reading.previousReading;
        const current = updateData.currentReading ?? reading.currentReading;
        
        if (current > previous) {
          updateData.consumption = current - previous;
          
          // Recalculate cost based on current rate
          const rateDoc = await UtilityRate.findOne({ type: reading.type });
          if (rateDoc) {
            if (rateDoc.tier1Limit && rateDoc.tier1Rate && rateDoc.tier2Limit && rateDoc.tier2Rate && rateDoc.tier3Rate) {
              const consumption = updateData.consumption;
              if (consumption <= rateDoc.tier1Limit) {
                updateData.cost = consumption * rateDoc.tier1Rate;
              } else if (consumption <= rateDoc.tier2Limit) {
                updateData.cost = (rateDoc.tier1Limit * rateDoc.tier1Rate) + 
                                  ((consumption - rateDoc.tier1Limit) * rateDoc.tier2Rate);
              } else {
                updateData.cost = (rateDoc.tier1Limit * rateDoc.tier1Rate) + 
                                  ((rateDoc.tier2Limit - rateDoc.tier1Limit) * rateDoc.tier2Rate) + 
                                  ((consumption - rateDoc.tier2Limit) * rateDoc.tier3Rate);
              }
            } else {
              updateData.cost = updateData.consumption * rateDoc.rate;
            }
            updateData.rate = rateDoc.rate;
          }
        } else {
          return res.status(400).json({
            success: false,
            message: "Current reading must be greater than previous reading"
          });
        }
      }

      const updatedReading = await UtilityReading.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('property', 'title location')
        .populate('createdBy', 'firstName lastName');

      res.status(200).json({
        success: true,
        message: "Utility reading updated successfully",
        reading: updatedReading
      });

    } catch (error) {
      console.error('Update reading error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to update reading",
        error: error.message
      });
    }
  },

  // Delete reading
  deleteReading: async (req, res) => {
    try {
      const { id } = req.params;

      const reading = await UtilityReading.findById(id);

      if (!reading) {
        return res.status(404).json({
          success: false,
          message: "Utility reading not found"
        });
      }

      await UtilityReading.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: "Utility reading deleted successfully"
      });

    } catch (error) {
      console.error('Delete reading error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to delete reading",
        error: error.message
      });
    }
  },

  // Mark reading as billed
  markAsBilled: async (req, res) => {
    try {
      const { id } = req.params;

      const reading = await UtilityReading.findById(id);

      if (!reading) {
        return res.status(404).json({
          success: false,
          message: "Utility reading not found"
        });
      }

      reading.billed = true;
      reading.billedAt = new Date();
      await reading.save();

      res.status(200).json({
        success: true,
        message: "Reading marked as billed",
        reading
      });

    } catch (error) {
      console.error('Mark as billed error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to mark as billed",
        error: error.message
      });
    }
  },

  // Bulk upload readings
  bulkUpload: async (req, res) => {
    try {
      const { readings } = req.body;

      if (!Array.isArray(readings) || readings.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Readings array is required"
        });
      }

      const createdReadings = [];
      const errors = [];

      for (const readingData of readings) {
        try {
          const {
            propertyId,
            unit,
            type,
            previousReading,
            currentReading,
            readingDate,
            meterNumber,
            estimated
          } = readingData;

          // Validate required fields
          if (!propertyId || !unit || !type || !previousReading || !currentReading) {
            errors.push({ data: readingData, error: "Missing required fields" });
            continue;
          }

          // Check if property exists
          const property = await Property.findById(propertyId);
          if (!property) {
            errors.push({ data: readingData, error: "Property not found" });
            continue;
          }

          // Get rate
          const rateDoc = await UtilityRate.findOne({ type });
          if (!rateDoc) {
            errors.push({ data: readingData, error: `No rate for ${type}` });
            continue;
          }

          // Calculate consumption and cost
          const consumption = currentReading - previousReading;
          if (consumption <= 0) {
            errors.push({ data: readingData, error: "Current reading must be greater than previous reading" });
            continue;
          }

          let cost = 0;
          if (rateDoc.tier1Limit && rateDoc.tier1Rate && rateDoc.tier2Limit && rateDoc.tier2Rate && rateDoc.tier3Rate) {
            if (consumption <= rateDoc.tier1Limit) {
              cost = consumption * rateDoc.tier1Rate;
            } else if (consumption <= rateDoc.tier2Limit) {
              cost = (rateDoc.tier1Limit * rateDoc.tier1Rate) + 
                     ((consumption - rateDoc.tier1Limit) * rateDoc.tier2Rate);
            } else {
              cost = (rateDoc.tier1Limit * rateDoc.tier1Rate) + 
                     ((rateDoc.tier2Limit - rateDoc.tier1Limit) * rateDoc.tier2Rate) + 
                     ((consumption - rateDoc.tier2Limit) * rateDoc.tier3Rate);
            }
          } else {
            cost = consumption * rateDoc.rate;
          }

          const readingCount = await UtilityReading.countDocuments();
          const readingNumber = `UTL-${String(readingCount + 1).padStart(4, '0')}`;

          const reading = new UtilityReading({
            readingNumber,
            property: propertyId,
            unit,
            type,
            previousReading,
            currentReading,
            consumption,
            readingDate: readingDate || new Date(),
            cost,
            rate: rateDoc.rate,
            meterNumber: meterNumber || '',
            estimated: estimated || false,
            createdBy: req.user.id
          });

          await reading.save();
          await reading.populate('property', 'title location');
          createdReadings.push(reading);

        } catch (error) {
          errors.push({ data: readingData, error: error.message });
        }
      }

      res.status(201).json({
        success: true,
        message: `Successfully uploaded ${createdReadings.length} readings${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
        readings: createdReadings,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      console.error('Bulk upload error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to process bulk upload",
        error: error.message
      });
    }
  },

  // Export readings to CSV
  exportReadings: async (req, res) => {
    try {
      const {
        propertyId,
        type,
        billed,
        startDate,
        endDate
      } = req.query;

      const query = {};

      if (propertyId && propertyId !== 'all') query.property = propertyId;
      if (type && type !== 'all') query.type = type;
      if (billed && billed !== 'all') query.billed = billed === 'true';
      
      if (startDate || endDate) {
        query.readingDate = {};
        if (startDate) query.readingDate.$gte = new Date(startDate);
        if (endDate) query.readingDate.$lte = new Date(endDate);
      }

      const readings = await UtilityReading.find(query)
        .populate('property', 'title location')
        .sort({ readingDate: -1 });

      // Generate CSV
      const csvRows = [];
      csvRows.push('Reading Number,Property,Unit,Type,Previous Reading,Current Reading,Consumption,Cost,Reading Date,Meter Number,Billed,Estimated');

      for (const reading of readings) {
        csvRows.push([
          reading.readingNumber,
          reading.property?.title || 'Unknown',
          reading.unit,
          reading.type,
          reading.previousReading,
          reading.currentReading,
          reading.consumption,
          reading.cost,
          new Date(reading.readingDate).toISOString().split('T')[0],
          reading.meterNumber || '',
          reading.billed ? 'Yes' : 'No',
          reading.estimated ? 'Yes' : 'No'
        ].join(','));
      }

      const csv = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=utility-readings-${new Date().toISOString().split('T')[0]}.csv`);
      res.status(200).send(csv);

    } catch (error) {
      console.error('Export readings error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to export readings",
        error: error.message
      });
    }
  },

  // ========== RATES ==========

  // Get all rates
  getAllRates: async (req, res) => {
    try {
      console.log('Fetching all utility rates...');
      
      const rates = await UtilityRate.find()
        .populate('updatedBy', 'firstName lastName')
        .sort({ type: 1 });

      console.log(`Found ${rates.length} rates`);

      // If no rates found, create default ones
      if (rates.length === 0) {
        console.log('No rates found, creating default rates...');
        const defaultRates = [
          { type: 'electricity', rate: 65.50, unit: 'kWh' },
          { type: 'water', rate: 450.75, unit: 'm³' },
          { type: 'gas', rate: 350.25, unit: 'm³' },
          { type: 'internet', rate: 15000, unit: 'GB' },
          { type: 'waste', rate: 5000, unit: 'monthly' },
          { type: 'sewage', rate: 3500, unit: 'monthly' }
        ];

        for (const rateData of defaultRates) {
          await UtilityRate.create({
            ...rateData,
            lastUpdated: new Date(),
            updatedBy: req.user.id
          });
        }

        const newRates = await UtilityRate.find().populate('updatedBy', 'firstName lastName');
        return res.status(200).json({
          success: true,
          rates: newRates
        });
      }

      res.status(200).json({
        success: true,
        rates
      });

    } catch (error) {
      console.error('Get rates error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch rates",
        error: error.message
      });
    }
  },

  // Create or update rate
  updateRate: async (req, res) => {
    try {
      const { type } = req.params;
      const rateData = req.body;

      // Define units based on utility type
      const unitMap = {
        electricity: 'kWh',
        water: 'm³',
        gas: 'm³',
        internet: 'GB',
        waste: 'monthly',
        sewage: 'monthly'
      };

      // Set appropriate unit if not provided
      if (!rateData.unit) {
        rateData.unit = unitMap[type] || 'unit';
      }

      const rate = await UtilityRate.findOneAndUpdate(
        { type },
        {
          ...rateData,
          lastUpdated: new Date(),
          updatedBy: req.user.id
        },
        { new: true, upsert: true, runValidators: true }
      ).populate('updatedBy', 'firstName lastName');

      res.status(200).json({
        success: true,
        message: "Utility rate updated successfully",
        rate
      });

    } catch (error) {
      console.error('Update rate error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to update rate",
        error: error.message
      });
    }
  },

  // ========== ALERTS ==========

  // Get all alerts
  getAllAlerts: async (req, res) => {
    try {
      const { resolved } = req.query;

      const query = {};
      if (resolved !== undefined) {
        query.resolved = resolved === 'true';
      }

      const alerts = await UtilityAlert.find(query)
        .populate('property', 'title')
        .populate('createdBy', 'firstName lastName')
        .populate('resolvedBy', 'firstName lastName')
        .sort({ date: -1, severity: -1 });

      res.status(200).json({
        success: true,
        alerts
      });

    } catch (error) {
      console.error('Get alerts error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch alerts",
        error: error.message
      });
    }
  },

  // Resolve alert
  resolveAlert: async (req, res) => {
    try {
      const { id } = req.params;

      const alert = await UtilityAlert.findById(id);

      if (!alert) {
        return res.status(404).json({
          success: false,
          message: "Alert not found"
        });
      }

      alert.resolved = true;
      alert.resolvedAt = new Date();
      alert.resolvedBy = req.user.id;
      await alert.save();

      await alert.populate('property', 'title');
      await alert.populate('resolvedBy', 'firstName lastName');

      res.status(200).json({
        success: true,
        message: "Alert resolved successfully",
        alert
      });

    } catch (error) {
      console.error('Resolve alert error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to resolve alert",
        error: error.message
      });
    }
  },

  // ========== STATISTICS ==========

  // Get utility statistics
  getStats: async (req, res) => {
    try {
      const { period = 'month', startDate, endDate } = req.query;

      let matchStage = {};

      if (startDate && endDate) {
        matchStage.readingDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      } else {
        const now = new Date();
        let start = new Date();
        
        switch (period) {
          case 'month':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'quarter':
            const quarter = Math.floor(now.getMonth() / 3);
            start = new Date(now.getFullYear(), quarter * 3, 1);
            break;
          case 'year':
            start = new Date(now.getFullYear(), 0, 1);
            break;
        }
        
        matchStage.readingDate = { $gte: start };
      }

      // Get readings in date range
      const readings = await UtilityReading.find(matchStage)
        .populate('property', 'title');

      // Calculate totals
      const totalReadings = readings.length;
      const monthlyConsumption = readings.reduce((sum, r) => sum + (r.consumption || 0), 0);
      const monthlyCost = readings.reduce((sum, r) => sum + (r.cost || 0), 0);
      const unbilledAmount = readings
        .filter(r => !r.billed)
        .reduce((sum, r) => sum + (r.cost || 0), 0);
      const averageConsumption = totalReadings > 0 ? monthlyConsumption / totalReadings : 0;

      // Utility breakdown
      const utilityBreakdown = [];
      const types = ['electricity', 'water', 'gas', 'internet', 'waste', 'sewage'];
      
      for (const type of types) {
        const typeReadings = readings.filter(r => r.type === type);
        if (typeReadings.length > 0) {
          utilityBreakdown.push({
            type,
            consumption: typeReadings.reduce((sum, r) => sum + r.consumption, 0),
            cost: typeReadings.reduce((sum, r) => sum + r.cost, 0),
            count: typeReadings.length
          });
        }
      }

      // Property stats
      const propertyMap = new Map();
      for (const reading of readings) {
        const propId = reading.property?._id?.toString() || 'unknown';
        const propTitle = reading.property?.title || 'Unknown';
        
        if (!propertyMap.has(propId)) {
          propertyMap.set(propId, {
            property: propTitle,
            consumption: 0,
            cost: 0
          });
        }
        
        const prop = propertyMap.get(propId);
        prop.consumption += reading.consumption || 0;
        prop.cost += reading.cost || 0;
      }

      const propertyStats = Array.from(propertyMap.values());

      const stats = {
        totalReadings,
        monthlyConsumption,
        monthlyCost,
        unbilledAmount,
        averageConsumption,
        utilityBreakdown,
        propertyStats
      };

      res.status(200).json({
        success: true,
        stats
      });

    } catch (error) {
      console.error('Get utility stats error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch utility statistics",
        error: error.message
      });
    }
  }
};

// Helper function to check for alerts
async function checkForAlerts(reading, userId) {
  try {
    // Check for high usage (more than 50% above average)
    const recentReadings = await UtilityReading.find({
      property: reading.property,
      type: reading.type,
      _id: { $ne: reading._id }
    })
      .sort({ readingDate: -1 })
      .limit(5);

    if (recentReadings.length > 0) {
      const avgConsumption = recentReadings.reduce((sum, r) => sum + r.consumption, 0) / recentReadings.length;
      
      if (reading.consumption > avgConsumption * 1.5) {
        const alert = new UtilityAlert({
          type: 'high_usage',
          severity: 'high',
          message: `${reading.type} consumption ${Math.round((reading.consumption / avgConsumption - 1) * 100)}% above average for ${reading.property.title}`,
          property: reading.property,
          unit: reading.unit,
          utilityType: reading.type,
          value: reading.consumption,
          threshold: avgConsumption,
          createdBy: userId
        });
        await alert.save();
      }
    }
  } catch (error) {
    console.error('Error checking for alerts:', error);
  }
}

module.exports = utilityController;








































































// const { UtilityReading, UtilityRate, UtilityAlert, UtilityStats } = require("../Models/UtilityModels");
// const Property = require("../Models/PropertyModel");
// const mongoose = require("mongoose");

// const utilityController = {
//   // ========== READINGS ==========

//   // Create new utility reading
//   createReading: async (req, res) => {
//     try {
//       const {
//         propertyId,
//         unit,
//         type,
//         previousReading,
//         currentReading,
//         readingDate,
//         meterNumber,
//         estimated,
//         notes
//       } = req.body;

//       console.log('Creating utility reading:', req.body);

//       // Validate required fields
//       if (!propertyId || !unit || !type || previousReading === undefined || currentReading === undefined) {
//         return res.status(400).json({
//           success: false,
//           message: "Property ID, unit, type, previous reading, and current reading are required"
//         });
//       }

//       // Check if property exists
//       const property = await Property.findById(propertyId);
//       if (!property) {
//         return res.status(404).json({
//           success: false,
//           message: "Property not found"
//         });
//       }

//       // Get current rate for this utility type
//       const rateDoc = await UtilityRate.findOne({ type });
//       if (!rateDoc) {
//         return res.status(400).json({
//           success: false,
//           message: `No rate configured for ${type}. Please set up rates first.`
//         });
//       }

//       // Calculate consumption
//       const consumption = currentReading - previousReading;
      
//       // Calculate cost based on rate type (tiered or flat)
//       let cost = 0;
//       if (rateDoc.tier1Limit && rateDoc.tier1Rate && rateDoc.tier2Limit && rateDoc.tier2Rate && rateDoc.tier3Rate) {
//         // Tiered pricing calculation
//         if (consumption <= rateDoc.tier1Limit) {
//           cost = consumption * rateDoc.tier1Rate;
//         } else if (consumption <= rateDoc.tier2Limit) {
//           cost = (rateDoc.tier1Limit * rateDoc.tier1Rate) + 
//                  ((consumption - rateDoc.tier1Limit) * rateDoc.tier2Rate);
//         } else {
//           cost = (rateDoc.tier1Limit * rateDoc.tier1Rate) + 
//                  ((rateDoc.tier2Limit - rateDoc.tier1Limit) * rateDoc.tier2Rate) + 
//                  ((consumption - rateDoc.tier2Limit) * rateDoc.tier3Rate);
//         }
//       } else {
//         // Flat rate pricing
//         cost = consumption * rateDoc.rate;
//       }

//       // Generate reading number
//       const readingCount = await UtilityReading.countDocuments();
//       const readingNumber = `UTL-${String(readingCount + 1).padStart(4, '0')}`;

//       const reading = new UtilityReading({
//         readingNumber,
//         property: propertyId,
//         unit,
//         type,
//         previousReading,
//         currentReading,
//         consumption,
//         readingDate: readingDate || new Date(),
//         cost,
//         rate: rateDoc.rate,
//         meterNumber: meterNumber || '',
//         estimated: estimated || false,
//         notes: notes || '',
//         createdBy: req.user.id
//       });

//       await reading.save();

//       // Populate property details
//       await reading.populate('property', 'title location');
//       await reading.populate('createdBy', 'firstName lastName');

//       // Check for alerts (high usage)
//       await checkForAlerts(reading, req.user.id);

//       res.status(201).json({
//         success: true,
//         message: "Utility reading created successfully",
//         reading
//       });

//     } catch (error) {
//       console.error('Create utility reading error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to create utility reading",
//         error: error.message
//       });
//     }
//   },

//   // Get all utility readings
//   getAllReadings: async (req, res) => {
//     try {
//       const {
//         page = 1,
//         limit = 50,
//         propertyId,
//         type,
//         billed,
//         startDate,
//         endDate,
//         period
//       } = req.query;

//       const query = {};

//       // Apply filters
//       if (propertyId) query.property = propertyId;
//       if (type && type !== 'all') query.type = type;
//       if (billed && billed !== 'all') query.billed = billed === 'true';

//       // Date filtering
//       if (startDate || endDate) {
//         query.readingDate = {};
//         if (startDate) query.readingDate.$gte = new Date(startDate);
//         if (endDate) query.readingDate.$lte = new Date(endDate);
//       } else if (period) {
//         const now = new Date();
//         let start = new Date();
        
//         switch (period) {
//           case 'month':
//             start = new Date(now.getFullYear(), now.getMonth(), 1);
//             break;
//           case 'quarter':
//             const quarter = Math.floor(now.getMonth() / 3);
//             start = new Date(now.getFullYear(), quarter * 3, 1);
//             break;
//           case 'year':
//             start = new Date(now.getFullYear(), 0, 1);
//             break;
//         }
        
//         query.readingDate = { $gte: start };
//       }

//       const readings = await UtilityReading.find(query)
//         .populate('property', 'title location')
//         .populate('createdBy', 'firstName lastName')
//         .sort({ readingDate: -1, createdAt: -1 })
//         .limit(limit * 1)
//         .skip((page - 1) * limit);

//       const total = await UtilityReading.countDocuments(query);

//       res.status(200).json({
//         success: true,
//         readings,
//         totalPages: Math.ceil(total / limit),
//         currentPage: page,
//         total
//       });

//     } catch (error) {
//       console.error('Get utility readings error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to fetch utility readings",
//         error: error.message
//       });
//     }
//   },

//   // Get reading by ID
//   getReadingById: async (req, res) => {
//     try {
//       const { id } = req.params;

//       const reading = await UtilityReading.findById(id)
//         .populate('property', 'title location')
//         .populate('createdBy', 'firstName lastName');

//       if (!reading) {
//         return res.status(404).json({
//           success: false,
//           message: "Utility reading not found"
//         });
//       }

//       res.status(200).json({
//         success: true,
//         reading
//       });

//     } catch (error) {
//       console.error('Get reading by ID error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to fetch reading",
//         error: error.message
//       });
//     }
//   },

//   // Update reading
//   updateReading: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const updateData = req.body;

//       const reading = await UtilityReading.findById(id);

//       if (!reading) {
//         return res.status(404).json({
//           success: false,
//           message: "Utility reading not found"
//         });
//       }

//       // If readings changed, recalculate consumption and cost
//       if (updateData.previousReading !== undefined || updateData.currentReading !== undefined) {
//         const previous = updateData.previousReading ?? reading.previousReading;
//         const current = updateData.currentReading ?? reading.currentReading;
        
//         if (current > previous) {
//           updateData.consumption = current - previous;
          
//           // Recalculate cost based on current rate
//           const rateDoc = await UtilityRate.findOne({ type: reading.type });
//           if (rateDoc) {
//             if (rateDoc.tier1Limit && rateDoc.tier1Rate && rateDoc.tier2Limit && rateDoc.tier2Rate && rateDoc.tier3Rate) {
//               // Tiered pricing
//               const consumption = updateData.consumption;
//               if (consumption <= rateDoc.tier1Limit) {
//                 updateData.cost = consumption * rateDoc.tier1Rate;
//               } else if (consumption <= rateDoc.tier2Limit) {
//                 updateData.cost = (rateDoc.tier1Limit * rateDoc.tier1Rate) + 
//                                   ((consumption - rateDoc.tier1Limit) * rateDoc.tier2Rate);
//               } else {
//                 updateData.cost = (rateDoc.tier1Limit * rateDoc.tier1Rate) + 
//                                   ((rateDoc.tier2Limit - rateDoc.tier1Limit) * rateDoc.tier2Rate) + 
//                                   ((consumption - rateDoc.tier2Limit) * rateDoc.tier3Rate);
//               }
//             } else {
//               updateData.cost = updateData.consumption * rateDoc.rate;
//             }
//             updateData.rate = rateDoc.rate;
//           }
//         } else {
//           return res.status(400).json({
//             success: false,
//             message: "Current reading must be greater than previous reading"
//           });
//         }
//       }

//       const updatedReading = await UtilityReading.findByIdAndUpdate(
//         id,
//         updateData,
//         { new: true, runValidators: true }
//       )
//         .populate('property', 'title location')
//         .populate('createdBy', 'firstName lastName');

//       res.status(200).json({
//         success: true,
//         message: "Utility reading updated successfully",
//         reading: updatedReading
//       });

//     } catch (error) {
//       console.error('Update reading error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to update reading",
//         error: error.message
//       });
//     }
//   },

//   // Delete reading
//   deleteReading: async (req, res) => {
//     try {
//       const { id } = req.params;

//       const reading = await UtilityReading.findById(id);

//       if (!reading) {
//         return res.status(404).json({
//           success: false,
//           message: "Utility reading not found"
//         });
//       }

//       await UtilityReading.findByIdAndDelete(id);

//       res.status(200).json({
//         success: true,
//         message: "Utility reading deleted successfully"
//       });

//     } catch (error) {
//       console.error('Delete reading error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to delete reading",
//         error: error.message
//       });
//     }
//   },

//   // Mark reading as billed
//   markAsBilled: async (req, res) => {
//     try {
//       const { id } = req.params;

//       const reading = await UtilityReading.findById(id);

//       if (!reading) {
//         return res.status(404).json({
//           success: false,
//           message: "Utility reading not found"
//         });
//       }

//       reading.billed = true;
//       reading.billedAt = new Date();
//       await reading.save();

//       res.status(200).json({
//         success: true,
//         message: "Reading marked as billed",
//         reading
//       });

//     } catch (error) {
//       console.error('Mark as billed error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to mark as billed",
//         error: error.message
//       });
//     }
//   },

//   // Bulk upload readings
//   bulkUpload: async (req, res) => {
//     try {
//       const { readings } = req.body;

//       if (!Array.isArray(readings) || readings.length === 0) {
//         return res.status(400).json({
//           success: false,
//           message: "Readings array is required"
//         });
//       }

//       const createdReadings = [];
//       const errors = [];

//       for (const readingData of readings) {
//         try {
//           const {
//             propertyId,
//             unit,
//             type,
//             previousReading,
//             currentReading,
//             readingDate,
//             meterNumber,
//             estimated
//           } = readingData;

//           // Validate required fields
//           if (!propertyId || !unit || !type || !previousReading || !currentReading) {
//             errors.push({ data: readingData, error: "Missing required fields" });
//             continue;
//           }

//           // Get rate
//           const rateDoc = await UtilityRate.findOne({ type });
//           if (!rateDoc) {
//             errors.push({ data: readingData, error: `No rate for ${type}` });
//             continue;
//           }

//           // Calculate consumption and cost
//           const consumption = currentReading - previousReading;
//           let cost = 0;
          
//           if (rateDoc.tier1Limit && rateDoc.tier1Rate && rateDoc.tier2Limit && rateDoc.tier2Rate && rateDoc.tier3Rate) {
//             if (consumption <= rateDoc.tier1Limit) {
//               cost = consumption * rateDoc.tier1Rate;
//             } else if (consumption <= rateDoc.tier2Limit) {
//               cost = (rateDoc.tier1Limit * rateDoc.tier1Rate) + 
//                      ((consumption - rateDoc.tier1Limit) * rateDoc.tier2Rate);
//             } else {
//               cost = (rateDoc.tier1Limit * rateDoc.tier1Rate) + 
//                      ((rateDoc.tier2Limit - rateDoc.tier1Limit) * rateDoc.tier2Rate) + 
//                      ((consumption - rateDoc.tier2Limit) * rateDoc.tier3Rate);
//             }
//           } else {
//             cost = consumption * rateDoc.rate;
//           }

//           const readingCount = await UtilityReading.countDocuments();
//           const readingNumber = `UTL-${String(readingCount + 1).padStart(4, '0')}`;

//           const reading = new UtilityReading({
//             readingNumber,
//             property: propertyId,
//             unit,
//             type,
//             previousReading,
//             currentReading,
//             consumption,
//             readingDate: readingDate || new Date(),
//             cost,
//             rate: rateDoc.rate,
//             meterNumber: meterNumber || '',
//             estimated: estimated || false,
//             createdBy: req.user.id
//           });

//           await reading.save();
//           await reading.populate('property', 'title location');
//           createdReadings.push(reading);

//         } catch (error) {
//           errors.push({ data: readingData, error: error.message });
//         }
//       }

//       res.status(201).json({
//         success: true,
//         message: `Successfully uploaded ${createdReadings.length} readings${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
//         readings: createdReadings,
//         errors: errors.length > 0 ? errors : undefined
//       });

//     } catch (error) {
//       console.error('Bulk upload error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to process bulk upload",
//         error: error.message
//       });
//     }
//   },

//   // Export readings to CSV
//   exportReadings: async (req, res) => {
//     try {
//       const {
//         propertyId,
//         type,
//         billed,
//         startDate,
//         endDate
//       } = req.query;

//       const query = {};

//       if (propertyId) query.property = propertyId;
//       if (type && type !== 'all') query.type = type;
//       if (billed && billed !== 'all') query.billed = billed === 'true';
      
//       if (startDate || endDate) {
//         query.readingDate = {};
//         if (startDate) query.readingDate.$gte = new Date(startDate);
//         if (endDate) query.readingDate.$lte = new Date(endDate);
//       }

//       const readings = await UtilityReading.find(query)
//         .populate('property', 'title location')
//         .sort({ readingDate: -1 });

//       // Generate CSV
//       const csvRows = [];
//       csvRows.push('Reading Number,Property,Unit,Type,Previous Reading,Current Reading,Consumption,Cost,Reading Date,Meter Number,Billed,Estimated');

//       for (const reading of readings) {
//         csvRows.push([
//           reading.readingNumber,
//           reading.property?.title || 'Unknown',
//           reading.unit,
//           reading.type,
//           reading.previousReading,
//           reading.currentReading,
//           reading.consumption,
//           reading.cost,
//           new Date(reading.readingDate).toISOString().split('T')[0],
//           reading.meterNumber || '',
//           reading.billed ? 'Yes' : 'No',
//           reading.estimated ? 'Yes' : 'No'
//         ].join(','));
//       }

//       const csv = csvRows.join('\n');

//       res.setHeader('Content-Type', 'text/csv');
//       res.setHeader('Content-Disposition', `attachment; filename=utility-readings-${new Date().toISOString().split('T')[0]}.csv`);
//       res.status(200).send(csv);

//     } catch (error) {
//       console.error('Export readings error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to export readings",
//         error: error.message
//       });
//     }
//   },

//   // ========== RATES ==========

//   // Get all rates
//   getAllRates: async (req, res) => {
//     try {
//       const rates = await UtilityRate.find()
//         .populate('updatedBy', 'firstName lastName')
//         .sort({ type: 1 });

//       res.status(200).json({
//         success: true,
//         rates
//       });

//     } catch (error) {
//       console.error('Get rates error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to fetch rates",
//         error: error.message
//       });
//     }
//   },

//   // Create or update rate
//   updateRate: async (req, res) => {
//     try {
//       const { type } = req.params;
//       const rateData = req.body;

//       // Define units based on utility type
//       const unitMap = {
//         electricity: 'kWh',
//         water: 'm³',
//         gas: 'm³',
//         internet: 'GB',
//         waste: 'monthly',
//         sewage: 'monthly'
//       };

//       // Set appropriate unit if not provided
//       if (!rateData.unit) {
//         rateData.unit = unitMap[type] || 'unit';
//       }

//       const rate = await UtilityRate.findOneAndUpdate(
//         { type },
//         {
//           ...rateData,
//           lastUpdated: new Date(),
//           updatedBy: req.user.id
//         },
//         { new: true, upsert: true, runValidators: true }
//       ).populate('updatedBy', 'firstName lastName');

//       res.status(200).json({
//         success: true,
//         message: "Utility rate updated successfully",
//         rate
//       });

//     } catch (error) {
//       console.error('Update rate error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to update rate",
//         error: error.message
//       });
//     }
//   },

//   // ========== ALERTS ==========

//   // Get all alerts
//   getAllAlerts: async (req, res) => {
//     try {
//       const { resolved } = req.query;

//       const query = {};
//       if (resolved !== undefined) {
//         query.resolved = resolved === 'true';
//       }

//       const alerts = await UtilityAlert.find(query)
//         .populate('property', 'title')
//         .populate('createdBy', 'firstName lastName')
//         .populate('resolvedBy', 'firstName lastName')
//         .sort({ date: -1, severity: -1 });

//       res.status(200).json({
//         success: true,
//         alerts
//       });

//     } catch (error) {
//       console.error('Get alerts error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to fetch alerts",
//         error: error.message
//       });
//     }
//   },

//   // Resolve alert
//   resolveAlert: async (req, res) => {
//     try {
//       const { id } = req.params;

//       const alert = await UtilityAlert.findById(id);

//       if (!alert) {
//         return res.status(404).json({
//           success: false,
//           message: "Alert not found"
//         });
//       }

//       alert.resolved = true;
//       alert.resolvedAt = new Date();
//       alert.resolvedBy = req.user.id;
//       await alert.save();

//       await alert.populate('property', 'title');
//       await alert.populate('resolvedBy', 'firstName lastName');

//       res.status(200).json({
//         success: true,
//         message: "Alert resolved successfully",
//         alert
//       });

//     } catch (error) {
//       console.error('Resolve alert error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to resolve alert",
//         error: error.message
//       });
//     }
//   },

//   // ========== STATISTICS ==========

//   // Get utility statistics
//   getStats: async (req, res) => {
//     try {
//       const { period = 'month', startDate, endDate } = req.query;

//       let matchStage = {};

//       if (startDate && endDate) {
//         matchStage.readingDate = {
//           $gte: new Date(startDate),
//           $lte: new Date(endDate)
//         };
//       } else {
//         const now = new Date();
//         let start = new Date();
        
//         switch (period) {
//           case 'month':
//             start = new Date(now.getFullYear(), now.getMonth(), 1);
//             break;
//           case 'quarter':
//             const quarter = Math.floor(now.getMonth() / 3);
//             start = new Date(now.getFullYear(), quarter * 3, 1);
//             break;
//           case 'year':
//             start = new Date(now.getFullYear(), 0, 1);
//             break;
//         }
        
//         matchStage.readingDate = { $gte: start };
//       }

//       // Get readings in date range
//       const readings = await UtilityReading.find(matchStage)
//         .populate('property', 'title');

//       // Calculate totals
//       const totalReadings = readings.length;
//       const monthlyConsumption = readings.reduce((sum, r) => sum + (r.consumption || 0), 0);
//       const monthlyCost = readings.reduce((sum, r) => sum + (r.cost || 0), 0);
//       const unbilledAmount = readings
//         .filter(r => !r.billed)
//         .reduce((sum, r) => sum + (r.cost || 0), 0);
//       const averageConsumption = totalReadings > 0 ? monthlyConsumption / totalReadings : 0;

//       // Utility breakdown
//       const utilityBreakdown = [];
//       const types = ['electricity', 'water', 'gas', 'internet', 'waste', 'sewage'];
      
//       for (const type of types) {
//         const typeReadings = readings.filter(r => r.type === type);
//         if (typeReadings.length > 0) {
//           utilityBreakdown.push({
//             type,
//             consumption: typeReadings.reduce((sum, r) => sum + r.consumption, 0),
//             cost: typeReadings.reduce((sum, r) => sum + r.cost, 0),
//             count: typeReadings.length
//           });
//         }
//       }

//       // Property stats
//       const propertyMap = new Map();
//       for (const reading of readings) {
//         const propId = reading.property?._id?.toString() || 'unknown';
//         const propTitle = reading.property?.title || 'Unknown';
        
//         if (!propertyMap.has(propId)) {
//           propertyMap.set(propId, {
//             property: propTitle,
//             consumption: 0,
//             cost: 0
//           });
//         }
        
//         const prop = propertyMap.get(propId);
//         prop.consumption += reading.consumption || 0;
//         prop.cost += reading.cost || 0;
//       }

//       const propertyStats = Array.from(propertyMap.values());

//       const stats = {
//         totalReadings,
//         monthlyConsumption,
//         monthlyCost,
//         unbilledAmount,
//         averageConsumption,
//         utilityBreakdown,
//         propertyStats
//       };

//       res.status(200).json({
//         success: true,
//         stats
//       });

//     } catch (error) {
//       console.error('Get utility stats error:', error);
//       res.status(500).json({
//         success: false,
//         message: "Failed to fetch utility statistics",
//         error: error.message
//       });
//     }
//   }
// };

// // Helper function to check for alerts
// async function checkForAlerts(reading, userId) {
//   try {
//     // Check for high usage (more than 50% above average)
//     const recentReadings = await UtilityReading.find({
//       property: reading.property,
//       type: reading.type,
//       _id: { $ne: reading._id }
//     })
//       .sort({ readingDate: -1 })
//       .limit(5);

//     if (recentReadings.length > 0) {
//       const avgConsumption = recentReadings.reduce((sum, r) => sum + r.consumption, 0) / recentReadings.length;
      
//       if (reading.consumption > avgConsumption * 1.5) {
//         const alert = new UtilityAlert({
//           type: 'high_usage',
//           severity: 'high',
//           message: `${reading.type} consumption ${Math.round((reading.consumption / avgConsumption - 1) * 100)}% above average for ${reading.property.title}`,
//           property: reading.property,
//           unit: reading.unit,
//           utilityType: reading.type,
//           value: reading.consumption,
//           threshold: avgConsumption,
//           createdBy: userId
//         });
//         await alert.save();
//       }
//     }
//   } catch (error) {
//     console.error('Error checking for alerts:', error);
//   }
// }

// module.exports = utilityController;