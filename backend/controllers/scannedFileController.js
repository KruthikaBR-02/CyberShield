const ScannedFile = require("../models/ScannedFile");

exports.saveScannedFile = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware

    const fileData = {
      userId,
      fileName: req.body.fileName,
      fileSize: req.body.fileSize,
      previewUrl: req.body.previewUrl,
      risk: req.body.risk,
      details: req.body.details,
      category: req.body.category,
      scanDate: req.body.scanDate,
    };

    const savedFile = new ScannedFile(fileData);
    await savedFile.save();

    res.json({ success: true, savedFile });
  } catch (err) {
    console.error("SAVE FILE ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to save file" });
  }
};

exports.getScannedFiles = async (req, res) => {
  try {
    const files = await ScannedFile.find({ userId: req.user.id }).sort({ scanDate: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch files" });
  }
};
