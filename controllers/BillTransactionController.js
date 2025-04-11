const express = require("express");

const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const BillTransaction = require("../models/BillTransaction");
const Transaction = require("../models/Transaction");
const Customer = require("../models/Customer");
const sequelize = require("../config/db");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.post(
  "/add-bill-transaction",
  upload.array("images", 5),
  async (req, res) => {
    try {
      const {
        transactionId,
        totalAmount,
        originalAmount,
        duplicateAmount,
        details,
        date,
      } = req.body;

      if (!transactionId || !totalAmount || !date) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const [day, month, year] = date.split("-");
      const parsedDate = new Date(`${year}-${month}-${day}`);
      const imagePaths = req.files ? req.files.map((file) => file.path) : [];

      let transactionData = {
        transactionId,
        totalAmount,
        originalAmount: originalAmount || 0,
        duplicateAmount: duplicateAmount || 0,
        details: details || "",
        date: parsedDate,
        images: imagePaths,
      };

      const transaction = await BillTransaction.create(transactionData);
      res
        .status(201)
        .json({ message: "Bill Transaction added successfully", transaction });
    } catch (error) {
      console.error("Error adding transaction:", error);
      res.status(500).json({ message: "Server error", error });
    }
  }
);

router.put(
  "/update-bill-transaction",
  upload.array("images", 5),
  async (req, res) => {
    try {
      const {
        duplicateAmount,
        originalAmount,
        totalAmount,
        date,
        details,
        billTransactionId,
        imagesToKeep = "[]",
      } = req.body;
      console.log(req.query);
      console.log(req.body);
      if (!billTransactionId || !totalAmount || !date) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Find the transaction
      const billTransaction = await BillTransaction.findByPk(billTransactionId);
      if (!billTransaction) {
        return res.status(404).json({ message: "Bill Transaction not found" });
      }

      const [day, month, year] = date.split("-");
      const parsedDate = new Date(`${year}-${month}-${day}`);

      const keepImages = JSON.parse(imagesToKeep);
      // Update the transaction (debit or credit)
      const imagesToDelete = (billTransaction.images || []).filter(
        (img) => !keepImages.includes(img)
      );
      imagesToDelete.forEach((img) => {
        const fullPath = path.join(__dirname, "..", img);
        fs.access(fullPath, fs.constants.F_OK, (err) => {
          if (err) {
            console.warn("Image file not found, skipping delete:", fullPath);
          } else {
            fs.unlink(fullPath, (err) => {
              if (err)
                console.error("Failed to delete image:", img, err.message);
            });
          }
        });
      });

      // New images uploaded
      const newUploadedPaths = req.files?.map((file) => file.path) || [];

      // Final image list
      const finalImages = [...keepImages, ...newUploadedPaths];
      await BillTransaction.update(
        {
          totalAmount,
          duplicateAmount: duplicateAmount ? parseInt(duplicateAmount) : 0,
          originalAmount: originalAmount ? parseInt(originalAmount) : 0,
          date: parsedDate,
          details,
          images: finalImages,
        },
        { where: { id: billTransactionId } }
      );
      console.log("updated transaction", billTransaction);
      res.status(200).json({ message: "Transaction updated successfully" });
    } catch (error) {
      console.error("Error updating transaction:", error);
      res.status(500).json({ message: "Server error", error });
    }
  }
);

router.get("/list-bill-transactions/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const debitTotals = await Transaction.findOne({
      attributes: [
        [
          sequelize.fn(
            "COALESCE",
            sequelize.fn("SUM", sequelize.col("totalAmount")),
            0
          ),
          "totalAmount",
        ],
        [
          sequelize.fn(
            "COALESCE",
            sequelize.fn("SUM", sequelize.col("duplicateAmount")),
            0
          ),
          "duplicateAmount",
        ],
        [
          sequelize.fn(
            "COALESCE",
            sequelize.fn("SUM", sequelize.col("originalAmount")),
            0
          ),
          "originalAmount",
        ],
      ],
      where: { customerId, type: "debit" },
      raw: true,
    });

    const creditTotals = await BillTransaction.findOne({
      attributes: [
        [
          sequelize.fn(
            "COALESCE",
            sequelize.fn("SUM", sequelize.col("BillTransaction.totalAmount")),
            0
          ),
          "totalAmount",
        ],
        [
          sequelize.fn(
            "COALESCE",
            sequelize.fn(
              "SUM",
              sequelize.col("BillTransaction.originalAmount")
            ),
            0
          ),
          "originalAmount",
        ],
        [
          sequelize.fn(
            "COALESCE",
            sequelize.fn(
              "SUM",
              sequelize.col("BillTransaction.duplicateAmount")
            ),
            0
          ),
          "duplicateAmount",
        ],
      ],
      include: [
        {
          model: Transaction,
          attributes: [],
          where: {
            customerId: customerId,
          },
        },
      ],
      raw: true,
    });
    console.log("debitTotal", debitTotals);
    console.log("creditTotal", creditTotals);
    const remainingTotal = debitTotals.totalAmount - creditTotals.totalAmount;
    const remainingDuplicate =
      debitTotals.duplicateAmount - creditTotals.duplicateAmount;
    const remainingOriginal =
      debitTotals.originalAmount - creditTotals.originalAmount;
    customer.pendingBalance = remainingTotal;
    await customer.save();

    const transactions = await Transaction.findAll({
      where: { customerId },
      order: [
        ["date", "DESC"],
        ["createdAt", "ASC"],
      ],
      attributes: [
        "id",
        "type",
        "totalAmount",
        "duplicateAmount",
        "originalAmount",
        "date",
        "details",
        "createdAt",
        "images",
      ],
    });
    res.status(200).json({
      remaining: {
        total: remainingTotal,
        duplicate: remainingDuplicate,
        original: remainingOriginal,
      },
      transactions,
    });
    console.log("transactions", transactions);
    // Fetch all transactions sorted by date (newest first)
  } catch (error) {
    console.error("Error fetching recieved amount and transactions:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

router.get("/list-credit-transactions/:transactionId", async (req, res) => {
  try {
    const { transactionId } = req.params;

    if (!transactionId) {
      return res.status(400).json({ message: "Transaction ID is required" });
    }

    const transaction = await Transaction.findByPk(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const creditTotals = await BillTransaction.findOne({
      attributes: [
        [
          sequelize.fn(
            "COALESCE",
            sequelize.fn("SUM", sequelize.col("totalAmount")),
            0
          ),
          "totalAmount",
        ],
        [
          sequelize.fn(
            "COALESCE",
            sequelize.fn("SUM", sequelize.col("duplicateAmount")),
            0
          ),
          "duplicateAmount",
        ],
        [
          sequelize.fn(
            "COALESCE",
            sequelize.fn("SUM", sequelize.col("originalAmount")),
            0
          ),
          "originalAmount",
        ],
      ],
      where: { transactionId },
      raw: true,
    });

    const receivedTotal = creditTotals.totalAmount;
    const receivedDuplicate = creditTotals.duplicateAmount;
    const receivedOriginal = creditTotals.originalAmount;

    const transactions = await BillTransaction.findAll({
      where: { transactionId },
      order: [
        ["date", "DESC"],
        ["createdAt", "ASC"],
      ],
      attributes: [
        "id",
        "totalAmount",
        "duplicateAmount",
        "originalAmount",
        "date",
        "details",
        "createdAt",
        "images",
      ],
    });
    res.status(200).json({
      received: {
        total: receivedTotal,
        duplicate: receivedDuplicate,
        original: receivedOriginal,
      },
      transactions,
    });
    console.log("transactions", transactions);
    // Fetch all transactions sorted by date (newest first)
  } catch (error) {
    console.error("Error fetching recieved amount and transactions:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

router.post("/delete-bill-transaction/:billTransactionId", async (req, res) => {
  const { billTransactionId } = req.params;

  if (!billTransactionId) {
    return res.status(400).json({ message: "billTransaction ID is required" });
  }

  try {
    // Find the transaction
    const billTransaction = await BillTransaction.findByPk(billTransactionId);
    if (!billTransaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Delete the transaction

    if (billTransaction.images && Array.isArray(billTransaction.images)) {
      billTransaction.images.forEach((imagePath) => {
        const fullPath = path.join(__dirname, "..", imagePath);
        fs.unlink(fullPath, (err) => {
          if (err) {
            console.error(`Failed to delete image ${imagePath}:`, err.message);
          } else {
            console.log(`Deleted image: ${imagePath}`);
          }
        });
      });
    }
    await billTransaction.destroy();

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
