const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth");

// Get all users except the current user
router.get("/", auth, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user } }).select(
      "-password"
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
