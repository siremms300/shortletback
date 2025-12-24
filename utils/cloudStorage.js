// utils/cloudStorage.js - COMPLETE VERSION
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary properly
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
  secure: true
});

// Upload from buffer (for Vercel/memory storage)
const uploadToCloudinary = async (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || 'holsapartments/uploads',
      resource_type: options.resource_type || 'auto',
      ...options
    };

    // Convert buffer to base64 string for Cloudinary
    const base64String = buffer.toString('base64');
    const dataUri = `data:${options.mimeType || 'application/octet-stream'};base64,${base64String}`;

    cloudinary.uploader.upload(dataUri, uploadOptions, (error, result) => {
      if (error) {
        console.error('Cloudinary upload error:', error);
        reject(error);
      } else {
        console.log('Cloudinary upload successful:', {
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format
        });
        resolve(result);
      }
    });
  });
};

// Upload from file path (for local development)
const uploadToCloudinaryFromFile = async (filePath, options = {}) => {
  const uploadOptions = {
    folder: options.folder || 'holsapartments/uploads',
    resource_type: options.resource_type || 'auto',
    ...options
  };

  return cloudinary.uploader.upload(filePath, uploadOptions);
};

// Delete from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

// Generate Cloudinary URL with transformations
const getOptimizedImageUrl = (publicId, transformations = {}) => {
  const defaultTransformations = {
    quality: 'auto',
    fetch_format: 'auto',
    width: transformations.width || 1200,
    crop: 'limit'
  };

  return cloudinary.url(publicId, {
    ...defaultTransformations,
    ...transformations
  });
};

// Check if Cloudinary is configured
const isCloudinaryConfigured = () => {
  return process.env.CLOUD_NAME && 
         process.env.CLOUD_API_KEY && 
         process.env.CLOUD_API_SECRET;
};

module.exports = {
  uploadToCloudinary,
  uploadToCloudinaryFromFile,
  deleteFromCloudinary,
  getOptimizedImageUrl,
  isCloudinaryConfigured
};