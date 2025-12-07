const mongoose = require("mongoose");

const amenitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    description: {
      type: String,
      required: false
    },
    icon: {
      type: String,
       required: false, 
      default: "🏠"
    },
    category: {
      type: String,
      enum: ['general', 'kitchen', 'bathroom', 'bedroom', 'entertainment', 'safety', 'accessibility', 'outdoor'],
      default: 'general'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { 
    timestamps: true 
  }
);

// Index for better query performance
amenitySchema.index({ name: 'text', description: 'text' });
amenitySchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model("Amenity", amenitySchema);

