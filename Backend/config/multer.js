const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "job_portal",
    resource_type: "auto",
  },
});

const upload = multer({ storage });
module.exports = upload;
