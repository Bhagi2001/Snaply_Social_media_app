const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

/**
 * Upload media buffer to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} folder - Cloudinary folder name
 * @param {string} resourceType - 'image' or 'video'
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadToCloudinary = (fileBuffer, folder = 'social-media', resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: resourceType,
        transformation: resourceType === 'image' ? [
          { quality: 'auto', fetch_format: 'auto' },
          { width: 1080, crop: 'limit' }
        ] : [
          { quality: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height
          });
        }
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

/**
 * Delete media from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - 'image' or 'video'
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
  }
};

/**
 * Upload multiple files to Cloudinary
 * @param {Array} files - Array of multer file objects
 * @param {string} folder - Cloudinary folder
 * @returns {Promise<Array>}
 */
const uploadMultiple = async (files, folder = 'social-media/posts') => {
  const uploadPromises = files.map(file => {
    const resourceType = file.mimetype.startsWith('video') ? 'video' : 'image';
    return uploadToCloudinary(file.buffer, folder, resourceType).then(result => ({
      ...result,
      type: resourceType
    }));
  });
  
  return Promise.all(uploadPromises);
};

module.exports = { uploadToCloudinary, deleteFromCloudinary, uploadMultiple };
