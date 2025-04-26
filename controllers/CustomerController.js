const express = require("express");
const {Owner, Customer, Transaction,BillTransaction } = require("../models");
const router = express.Router();

// API to Add a Customer
router.post("/add-customer", async (req, res) => {
  const { name, phone, transactionType, billType, ownerId } = req.body;
  console.log("req.body", req.body);

  if (!name || !transactionType || !billType || !ownerId) {
    return res.status(400).json({ message: "Fill all the required details" });
  }

  try {
    // Check if owner exists
    const owner = await Owner.findByPk(ownerId);
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    // Create new customer
    const customer = await Customer.create({
      name,
      phone: phone || null,
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

    customer.phone = phone?phone:null;

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

router.delete("/delete-customer/:id", async (req, res) => {
  const customerId = req.params.id;
  console.log("in delete",customerId);
  if (!customerId) {
    return res.status(400).json({ message: "Customer ID is required" });
  }

  try {
    const customer = await Customer.findByPk(customerId);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    await customer.destroy(); // Will cascade delete transactions & bill transactions

    return res.status(200).json({ message: "Customer and related data deleted successfully." });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return res.status(500).json({ message: "Server error", error });
  }
});

router.delete('/clear-all-transaction/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    // Delete all transactions for the customer
    const customer = await Customer.findByPk(customerId);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    await Transaction.destroy({ where: { customerId } });

    res.status(200).json({ message: 'All transactions cleared.',customer });
  } catch (err) {
    console.error('Error clearing transactions:', err);
    res.status(500).json({ error: 'Server error clearing transactions.' });
  }
});

module.exports = router;
