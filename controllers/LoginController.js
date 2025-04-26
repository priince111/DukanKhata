const {Owner} = require("../models");
const express = require("express")
const router = express.Router();

router.post("/save-owner",async (req, res) => {
  console.log("save owner",req.body);
  const {phone, name} = req.body;
  if (!phone || !name) {
    return res.status(400).json({ error: "Phone and name are required" });
  }

  try {
    let owner = await Owner.findOne({ where: { phone } });

    if (!owner) {
      console.log("new owner",phone)
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

