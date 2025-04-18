const express = require("express");
const {Owner, Customer, Transaction,BillTransaction } = require("../models");
const router = express.Router();

// API to Add a Customer
router.post("/add-customer", async (req, res) => {
  const { name, phone, transactionType, billType, ownerNumber } = req.body;
  console.log("req.body", req.body);

  if (!name || !phone || !transactionType || !billType || !ownerNumber) {
    return res.status(400).json({ message: "Fill all the required details" });
  }

  try {
    // Check if owner exists
    const owner = await Owner.findOne({ where: { phone: ownerNumber } });
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    const ownerId = owner.id;

    // Check if customer already exists
    let customer = await Customer.findOne({ where: { phone, ownerId } });
    if (customer) {
      return res.status(400).json({ message: "Customer already exists" });
    }

    // Create new customer
    customer = await Customer.create({
      name,
      phone,
      transactionType,
      billType,
      ownerId,
    });

    return res
      .status(201)
      .json({ message: "Customer added successfully", customer });
  } catch (error) {
    console.error("Error adding customer:", error);
    return res.status(500).json({ message: "Server error", error });
  }
});

// API to List All Customers for a Specific Owner
router.get("/list-customers", async (req, res) => {
  const { phone } = req.query;

  if (!phone) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  try {
    // 1. Get owner
    const owner = await Owner.findOne({ where: { phone } });
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    // 2. Get all customers for the owner, with latest transaction and bill transactions
    const customers = await Customer.findAll({
      where: { ownerId: owner.id },
      include: [
        {
          model: Transaction,
          include: [
            {
              model: BillTransaction,
              required: false,
            },
          ],
          order: [["createdAt", "DESC"]],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
        

    const customersWithTimestamps = customers.map((customer) => {
      let latestTimestamp = new Date(customer.updatedAt);
    
      // Loop through transactions
      customer.Transactions.forEach((txn) => {
        if (new Date(txn.updatedAt) > latestTimestamp) {
          latestTimestamp = new Date(txn.updatedAt);
        }
    
        // Loop through bill transactions inside each transaction
        txn.BillTransactions?.forEach((billTxn) => {
          if (new Date(billTxn.updatedAt) > latestTimestamp) {
            latestTimestamp = new Date(billTxn.updatedAt);
          }
        });
      });
    
      return {
        ...customer.toJSON(),
        lastUpdated: latestTimestamp,
      };
    });

    return res.status(200).json({
      customers: customersWithTimestamps,
      owner,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return res.status(500).json({
      message: "An error occurred while retrieving customers",
      error: error.message,
    });
  }
});


// API to Update a Customer
// API to Update a Customer
router.patch("/update-customer", async (req, res) => {
  const { name, phone, id, ownerId } = req.body;

  if (!name || !id || !ownerId) {
    return res
      .status(400)
      .json({ message: "Name, id, and ownerId are required." });
  }

  try {
    // Find the customer by id and ownerId
    const customer = await Customer.findOne({ where: { id, ownerId } });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    // If the phone number is changing, check for duplicates
    if (phone && phone !== customer.phone) {
      const existingCustomer = await Customer.findOne({
        where: { phone, ownerId },
      });

      if (existingCustomer) {
        return res.status(400).json({
          message: "Another customer with this phone number already exists.",
        });
      }

      customer.phone = phone;
    }

    customer.name = name;

    await customer.save();

    return res
      .status(200)
      .json({ message: "Customer updated successfully", customer });
  } catch (error) {
    console.error("Error updating customer:", error);
    return res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
