const mongoose = require("mongoose");
const { UtilityRate } = require("../Models/UtilityModels");
require("dotenv").config();

const seedUtilityRates = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");

    const rates = [
      {
        type: 'electricity',
        rate: 65.50, // ₦ per kWh
        unit: 'kWh',
        tier1Limit: 500,
        tier1Rate: 55.50,
        tier2Limit: 1000,
        tier2Rate: 65.50,
        tier3Rate: 75.50
      },
      {
        type: 'water',
        rate: 450.75, // ₦ per m³
        unit: 'm³'
      },
      {
        type: 'gas',
        rate: 350.25, // ₦ per m³
        unit: 'm³'
      },
      {
        type: 'internet',
        rate: 15000, // ₦ per GB (monthly plan)
        unit: 'GB'
      },
      {
        type: 'waste',
        rate: 5000, // ₦ per month
        unit: 'monthly'
      },
      {
        type: 'sewage',
        rate: 3500, // ₦ per month
        unit: 'monthly'
      }
    ];

    for (const rate of rates) {
      await UtilityRate.findOneAndUpdate(
        { type: rate.type },
        { ...rate, lastUpdated: new Date() },
        { upsert: true, new: true }
      );
      console.log(`✅ ${rate.type} rate seeded`);
    }

    console.log("✅ All utility rates seeded successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding utility rates:", error);
    process.exit(1);
  }
};

seedUtilityRates();



// node server/scripts/seedUtilityRates.js