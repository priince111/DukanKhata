const express = require("express");
const Owner = require("../models/Owner");
const Customer = require("../models/Customer");

const router = express.Router();

// API to Add a Customer
router.post("/add-customer", async (req, res) => {
  const { name, phone, transactionType, billType, ownerId } = req.body;

  if (!name || !phone || !transactionType || !billType || !ownerId) {
    return res.status(400).json({ message: "Fill all the required details" });
  }

  try {
    // Check if owner exists
    let owner = await Owner.findById(ownerId);
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    // Check if customer already exists
    let customer = await Customer.findOne({ phone, ownerId });
    if (customer) {
      return res.status(400).json({ message: "Customer already exists" });
    }

    // Create new customer
    customer = new Customer({
      name,
      phone,
      transactionType,
      billType,
      ownerId,
    });

    await customer.save();

    return res.status(201).json({ message: "Customer added successfully", customer });
  } catch (error) {
    console.error("Error adding customer:", error);
    return res.status(500).json({ message: "Server error", error });
  }
});

// API to List All Customers for a Specific Owner
router.get("/list-customers/:ownerId", async (req, res) => {
  const { ownerId } = req.params;

  try {
    // Check if owner exists
    let owner = await Owner.findById(ownerId);
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    // Retrieve all customers for this owner
    const customers = await Customer.find({ ownerId });

    return res.status(200).json({ customers });
  } catch (error) {
    console.error("Error retrieving customers:", error);
    return res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
