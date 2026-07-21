const { v2: cloudinary } = require("cloudinary");
const dotenv = require("dotenv");
const path = require("path");

// Load .env from the Backend directory (one level up from config)
dotenv.config({ path: path.join(__dirname, "../.env") });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = cloudinary;
