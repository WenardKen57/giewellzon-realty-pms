const multer = require('multer');

const ALLOWED_IMAGE_MIME = (process.env.ALLOWED_IMAGE_MIME || 'image/jpeg,image/png,image/webp').split(',');
const ALLOWED_SITEMAP_MIME = (process.env.ALLOWED_SITEMAP_MIME || 'image/jpeg,image/png,image/webp,application/pdf').split(',');

// Memory storage; files are kept in RAM buffers for Cloudinary upload
const storage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_MIME.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Unsupported image type'), false);
};
const sitemapFilter = (req, file, cb) => {
  if (ALLOWED_SITEMAP_MIME.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Unsupported sitemap file type'), false);
};

const maxSize = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '10', 10) * 1024 * 1024;

const uploadImage = multer({ storage, fileFilter: imageFilter, limits: { fileSize: maxSize } });
const uploadSiteMap = multer({ storage, fileFilter: sitemapFilter, limits: { fileSize: maxSize } });

module.exports = { uploadImage, uploadSiteMap };