const express = require("express");
const router = express.Router();
const { saveScannedFile, getScannedFiles } = require("../controllers/scannedFileController");
const auth = require("../middleware/auth"); // JWT middleware

router.post("/save", saveScannedFile);
router.get("/list",  getScannedFiles);

module.exports = router;
