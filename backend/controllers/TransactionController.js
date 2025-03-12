const express = require("express");

const router = express.Router();

const Transaction = require("../models/Transaction");
const Customer = require("../models/Customer");

router.post("/add", async (req, res) => {
  try {
    const { customerId, type, totalAmount, blackAmount, whiteAmount } = req.body;

    if (!customerId || !type || !totalAmount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    let transactionData = {
      customerId,
      type,
      totalAmount,
      blackAmount: blackAmount || null,
      whiteAmount: whiteAmount || null,
    };

    const transaction = await Transaction.create(transactionData);
    
    res.status(201).json({ message: "Transaction added successfully", transaction });
  } catch (error) {
    console.error("Error adding transaction:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

router.put("/updateTransaction/:transactionId", async (req, res) => {
  try {
    const { blackAmount, whiteAmount, totalAmount } = req.body;
    const { transactionId } = req.params;

    if (!transactionId || !totalAmount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Find the transaction
    const transaction = await Transaction.findByPk(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (blackAmount + whiteAmount !== totalAmount) {
      return res.status(400).json({ message: "Total must be equal to black + white amounts" });
    }

    // Update the transaction (debit or credit)
    await Transaction.update(
      {
        totalAmount,
        blackAmount,
        whiteAmount,
      },
      { where: { id: transactionId } }
    );

    res.status(200).json({ message: "Transaction updated successfully" });
  } catch (error) {
    console.error("Error updating transaction:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

router.get("/remainingAmount/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    // Fetch total debit and credit amounts for white, black, and total
    const debitTotals = await Transaction.findOne({
      attributes: [
        [sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("totalAmount")), 0), "totalAmount"],
        [sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("blackAmount")), 0), "blackAmount"],
        [sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("whiteAmount")), 0), "whiteAmount"],
      ],
      where: { customerId, type: "debit" },
      raw: true,
    });

    const creditTotals = await Transaction.findOne({
      attributes: [
        [sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("totalAmount")), 0), "totalAmount"],
        [sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("blackAmount")), 0), "blackAmount"],
        [sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("whiteAmount")), 0), "whiteAmount"],
      ],
      where: { customerId, type: "credit" },
      raw: true,
    });

    // Calculate remaining amounts
    const remainingTotal = debitTotals.totalAmount - creditTotals.totalAmount;
    const remainingBlack = debitTotals.blackAmount - creditTotals.blackAmount;
    const remainingWhite = debitTotals.whiteAmount - creditTotals.whiteAmount;

    // Fetch all transactions sorted by date (newest first)
    const transactions = await Transaction.findAll({
      where: { customerId },
      order: [["createdAt", "DESC"]],
      attributes: ["id", "type", "totalAmount", "blackAmount", "whiteAmount", "createdAt"],
    });

    res.status(200).json({
      remaining: {
        total: remainingTotal,
        black: remainingBlack,
        white: remainingWhite,
      },
      transactions,
    });
  } catch (error) {
    console.error("Error fetching remaining amount and transactions:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

  

module.exports = router;
  