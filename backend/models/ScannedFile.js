const mongoose = require("mongoose");

const scannedFileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fileName: String,
  fileSize: Number,
  risk: String,
  details: String,
  category: String,
  previewUrl: String,
  scanDate: Date,
});

module.exports = mongoose.model("ScannedFile", scannedFileSchema);
