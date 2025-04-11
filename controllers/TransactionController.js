const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
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

router.post("/add-transaction", upload.array("images", 10), async (req, res) => {
  try {
    const {
      customerId,
      type,
      totalAmount,
      originalAmount,
      duplicateAmount,
      details,
      date,
    } = req.body;

    if (!customerId || !type || !totalAmount || !date) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const imagePaths = req.files ? req.files.map((file) => file.path) : [];

    let transactionData = {
      customerId,
      type,
      totalAmount,
      originalAmount: originalAmount || 0,
      duplicateAmount: duplicateAmount || 0,
      details: details || "",
      date,
      images: imagePaths,
    };

    const transaction = await Transaction.create(transactionData);
    res
      .status(201)
      .json({ message: "Transaction added successfully", transaction });
  } catch (error) {
    console.error("Error adding transaction:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

router.put(
  "/update-transaction",
  upload.array("images", 10),
  async (req, res) => {
    try {
      const {
        transactionId,
        duplicateAmount,
        originalAmount,
        totalAmount,
        date,
        details,
        imagesToKeep = "[]", // should be a JSON stringified array
      } = req.body;

      const transaction = await Transaction.findByPk(transactionId);
      if (!transaction)
        return res.status(404).json({ message: "Transaction not found" });
      const keepImages = JSON.parse(imagesToKeep);

      const [day, month, year] = date.split("-");
      const newDate = new Date(`${year}-${month}-${day}`);

      // Determine which images to delete
      const imagesToDelete = (transaction.images || []).filter(
        (img) => !keepImages.includes(img)
      );
      imagesToDelete.forEach((img) => {
        const fullPath = path.join(__dirname, "..", img);
        fs.access(fullPath, fs.constants.F_OK, (err) => {
          if (err) {
            console.warn("Image file not found, skipping delete:", fullPath);
          } else {
            fs.unlink(fullPath, (err) => {
              if (err) console.error("Failed to delete image:", img, err.message);
            });
          }
        });
      });      
      // New images uploaded
      const newUploadedPaths = req.files?.map((file) => file.path) || [];

      // Final image list
      const finalImages = [...keepImages, ...newUploadedPaths];

      // Update transaction
      await transaction.update({
        totalAmount: parseInt(totalAmount),
        duplicateAmount: parseInt(duplicateAmount || 0),
        originalAmount: parseInt(originalAmount || 0),
        date: newDate,
        details: details || "",
        images: finalImages,
      });

      res.status(200).json({ message: "Transaction updated successfully" });
    } catch (error) {
      console.error("Error updating transaction:", error);
      res.status(500).json({ message: "Server error", error });
    }
  }
);

router.get("/list-transactions/:customerId", async (req, res) => {
  const { customerId } = req.params;
  console.log("id of customer", customerId);
  if (!customerId) {
    return res.status(400).json({ message: "Customer ID is required" });
  }
  try {
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

    const creditTotals = await Transaction.findOne({
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
      where: { customerId, type: "credit" },
      raw: true,
    });
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
  } catch (error) {
    console.error("Error fetching remaining amount and transactions:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

router.post("/delete-transaction/:transactionId", async (req, res) => {
  const { transactionId } = req.params;

  if (!transactionId) {
    return res.status(400).json({ message: "Transaction ID is required" });
  }

  try {
    // Find the transaction
    const transaction = await Transaction.findByPk(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Delete associated image files if any
    if (transaction.images && Array.isArray(transaction.images)) {
      transaction.images.forEach((imagePath) => {
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

    // Delete the transaction
    await transaction.destroy();

    res
      .status(200)
      .json({
        message: "Transaction and associated images deleted successfully",
      });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
