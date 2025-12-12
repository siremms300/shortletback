// utils/cloudStorage.js
// For production - upload files to cloud storage
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary (or AWS S3)
if (process.env.CLOUDINARY_URL) {
  cloudinary.config();
}

const uploadToCloudinary = async (buffer, folder = 'uploads') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });
};

const uploadToCloudinaryFromFile = async (filePath, folder = 'uploads') => {
  return cloudinary.uploader.upload(filePath, { folder: folder });
};

module.exports = {
  uploadToCloudinary,
  uploadToCloudinaryFromFile
};