const express = require("express");
const upload = require("../config/multer");

const router = express.Router();

router.post("/profile-image", upload.single("image"), (req, res) => {
  res.json({
    imageUrl: req.file.path,
    message: "Uploaded successfully!"
  });
});

router.post("/resume", (req, res) => {
  upload.single("resume")(req, res, (err) => {
    if (err) {
      console.error("Upload error:", err);
      return res.status(400).json({ error: err.message || "File upload failed" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    res.json({
      resumeUrl: req.file.path,
      message: "Resume uploaded successfully!"
    });
  });
});

module.exports = router;
