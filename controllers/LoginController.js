const admin = require("../config/firebase");
const Owner = require("../models/Owner");
const express = require("express")
const router = express.Router();

router.post("/save-owner",async (req, res) => {
  console.log(req.body);
  const {phone, name} = req.body.phone;
  if (!phone || !name) {
    return res.status(400).json({ error: "Phone and name are required" });
  }

  try {
    let owner = await Owner.findOne({ phone });

    if (!owner) {
      owner = new Owner({ phone, name });
      await owner.save();
    } else {
      owner.name = name;
      await owner.save();
    }

    res.status(201).json({ message: "Owner registered successfully", owner });
  } catch (error) {
    console.error("Error saving owner:", error);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;

