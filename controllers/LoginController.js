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

router.get("/get-owner", async (req, res) => {
  const { phone } = req.query;

  if (!phone) {
    return res.status(400).json({ error: "Phone number is required" });
  }
  console.log("phone",phone);
  try {
    const owner = await Owner.findOne({ where: { phone } });

    if (!owner) {
      return res.status(201).json({ message: "Owner not found","exists": false });
    }

    return res.status(200).json({ message: "Owner found successfully","exists": true  });
  } catch (error) {
    console.error("Error retrieving owner:", error);
    return res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;

