const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({ username, email, password: hashed });

    res.json({ msg: "Signup successful", user });
  } catch (err) {
    res.status(500).json({ msg: "Error", error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Invalid Password" });

    const token = jwt.sign({ id: user._id }, "secretkey123", { expiresIn: "7d" });

    res.json({ msg: "Login successful", token, user });
  } catch (err) {
    res.status(500).json({ msg: "Error", error: err.message });
  }
};
