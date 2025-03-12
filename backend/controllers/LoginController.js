const admin = require("../config/firebase");
const Owner = require("../models/Owner");
const express = require("express")
const router = express.Router();

// Step 1: Send OTP
router.post("/send-otp", async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  try {
    const session = await admin.auth().createSessionCookie(phone, {
      expiresIn: 600000,
    });

    return res.status(200).json({ sessionId: session });
  } catch (error) {
    return res.status(500).json({ message: "Error sending OTP", error });
  }
});

router.post("/verify-otp", async (req, res) => {
  const { sessionId, otp } = req.body;

  if (!sessionId || !otp) {
    return res.status(400).json({ error: "Session ID and OTP are required" });
  }

  try {
    const decodedToken = await admin.auth().verifySessionCookie(sessionId);

    const phone = decodedToken.phone_number;

    let owner = await Owner.findOne({ phone });

    if (!owner) {
      return res.status(200).json({ phone, newUser: true });
    }

    res.status(200).json({ phone, newUser: false, owner });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(401).json({ error: "Invalid OTP or expired session" });
  }
});

router.post("/save-owner",async (req, res) => {
  const { phone, name } = req.body;
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

