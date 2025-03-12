const express = require("express");

const router = express.Router();

const BillTransaction = require("../models/BillTransaction");
const Transaction = require("../models/Transaction");
const Customer = require("../models/Customer");

router.post("/addBill/:customerId", async (req, res) => {
  try {
    const { totalAmount, blackAmount, whiteAmount } = req.body;
    const {customerId} = req.params;

    if (!customerId || !totalAmount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (blackAmount + whiteAmount !== totalAmount) {
      return res.status(400).json({ message: "Total must be equal to black + white amounts" });
    }

    let transactionBill = {
        customerId,
        type : 'debit',
        totalAmount,
        blackAmount:  blackAmount|| null,
        whiteAmount: whiteAmount || null,
    }
    let RecievedCredit = {
        customerId,
        type : 'credit',
        totalAmount : 0,
        blackAmount: 0,
        whiteAmount: 0,
    }
    const debitBill = await Transaction.create(transactionBill);
    const creditTotal = await Transaction.create(RecievedCredit);
    
    res.status(201).json({ message: "Transaction added successfully", debitBill,creditTotal });
  } catch (error) {
    console.error("Error adding transaction:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

router.post("/addBillTransaction/:transactionId", async (req, res) => {
    try {
      const { blackAmount, whiteAmount, totalAmount } = req.body;
      const {transactionId} = req.params;
  
      if ( !amount  || !transactionId) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const transaction = await Transaction.findByPk(billId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      if (blackAmount + whiteAmount !== amount) {
        return res.status(400).json({ message: "Amount must be equal to black + white amounts" });
      }
  
      let BillTransactionData = {
        transactionId,
        amount,
        blackAmount: blackAmount || null,
        whiteAmount: whiteAmount || null,
      };
      await Transaction.update(
        {
          totalAmount: transaction.totalAmount + amount,
          blackAmount: transaction.blackAmount + blackAmount,
          whiteAmount: transaction.whiteAmount + whiteAmount,
        },
        {
          where: { id: transactionId },
        }
      );
  
      const billTrans = await BillTransaction.create(BillTransactionData);
      
      res.status(201).json({ message: "Transaction added successfully", billTrans });
    } catch (error) {
      console.error("Error adding transaction:", error);
      res.status(500).json({ message: "Server error", error });
    }
  });

  router.put("/updateBillTransaction/:transactionId/:billTransactionId", async (req, res) => {
    try {
      const { blackAmount, whiteAmount, totalAmount } = req.body;
      const { transactionId ,billTransactionId } = req.params;
  
      if (!transactionId || !totalAmount || !billTransactionId) {
        return res.status(400).json({ message: "Missing required fields" });
      }
  
      // Find the transaction
      const transaction = await Transaction.findByPk(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      const billTransaction = await Transaction.findByPk(billTransactionId);
      if (!billTransaction) {
        return res.status(404).json({ message: "Bill Transaction not found" });
      }

      if (blackAmount + whiteAmount !== totalAmount) {
        return res.status(400).json({ message: "Total must be equal to black + white amounts" });
      }
  
      await Transaction.update(
        {
          totalAmount : transaction.totalAmount - billTransaction.totalAmount + totalAmount,
          whiteAmount : transaction.whiteAmount - billTransaction.whiteAmount + whiteAmount,
          blackAmount : transaction.blackAmount - billTransaction.blackAmount + blackAmount,
        },
        { where: { id: transactionId } }
      );
      
      await BillTransaction.update(
        {
          totalAmount,
          blackAmount,
          whiteAmount,
        },
        { where: { id: billTransactionId } }
      );
  
      res.status(200).json({ message: "Transaction updated successfully" });
    } catch (error) {
      console.error("Error updating transaction:", error);
      res.status(500).json({ message: "Server error", error });
    }
  });

  router.get("/remainingAmount/:transactionId", async (req, res) => {
    try {
      const { transactionId } = req.params;
  
      if (!transactionId) {
        return res.status(400).json({ message: "Transaction ID is required" });
      }
  
      const creditTotals = await BillTransaction.findOne({
        attributes: [
          [sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("totalAmount")), 0), "totalAmount"],
          [sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("blackAmount")), 0), "blackAmount"],
          [sequelize.fn("COALESCE", sequelize.fn("SUM", sequelize.col("whiteAmount")), 0), "whiteAmount"],
        ],
        where: { customerId, type: "credit" },
        raw: true,
      });

      // Fetch all transactions sorted by date (newest first)
      const transactions = await BillTransaction.findAll({
        where: { customerId },
        order: [["createdAt", "DESC"]],
        attributes: ["id", "type", "totalAmount", "blackAmount", "whiteAmount", "createdAt"],
      });
  
      res.status(200).json({
        remaining: {
          total: creditTotals.totalAmount,
          black: creditTotals.blackAmount,
          white: creditTotals.whiteAmount,
        },
        transactions,
      });
    } catch (error) {
      console.error("Error fetching recieved amount and transactions:", error);
      res.status(500).json({ message: "Server error", error });
    }
  });
  


module.exports = router;