// Add this utility function to any controller or create a utils file
const checkCloudinaryStatus = () => {
  const isCloudinaryConfigured = process.env.CLOUD_NAME && 
    process.env.CLOUD_API_KEY && 
    process.env.CLOUD_API_SECRET;
  
  console.log('Cloudinary Status:', {
    configured: isCloudinaryConfigured,
    cloudName: process.env.CLOUD_NAME ? 'Set' : 'Not set',
    apiKey: process.env.CLOUD_API_KEY ? 'Set' : 'Not set',
    apiSecret: process.env.CLOUD_API_SECRET ? 'Set' : 'Not set'
  });
  
  return isCloudinaryConfigured;
};