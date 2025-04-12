const express = require("express");
const router = express.Router();
const { sequelize, Customer, Transaction } = require("../models");


const { storage, cloudinary } = require("../config/cloudinary");
const multer = require("multer");
const upload = multer({ storage });

router.post(
  "/add-transaction",
  upload.array("images", 10),
  async (req, res) => {
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

      const customer = await Customer.findByPk(customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      const [day, month, year] = date.split("-");
      const newDate = new Date(`${year}-${month}-${day}`);

      const imagePaths =
        req.files?.map((file) => ({
          url: file.path,
          public_id: file.filename,
        })) || [];

      const transactionData = {
        customerId,
        type,
        totalAmount,
        originalAmount: originalAmount || 0,
        duplicateAmount: duplicateAmount || 0,
        details: details || "",
        date : newDate,
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
  }
);

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
        imagesToKeep = "[]", // JSON stringified array of { url, public_id }
      } = req.body;

      const transaction = await Transaction.findByPk(transactionId);
      if (!transaction)
        return res.status(404).json({ message: "Transaction not found" });

      const keepImages = JSON.parse(imagesToKeep);

      // Delete images not in keep list from Cloudinary
      const imagesToDelete = (transaction.images || []).filter(
        (img) => !keepImages.find((k) => k.public_id === img.public_id)
      );

      for (const img of imagesToDelete) {
        if (img.public_id) {
          await cloudinary.uploader.destroy(img.public_id);
        }
      }

      const newUploaded =
        req.files?.map((file) => ({
          url: file.path,
          public_id: file.filename,
        })) || [];

      const finalImages = [...keepImages, ...newUploaded];

      const [day, month, year] = date.split("-");
      const newDate = new Date(`${year}-${month}-${day}`);

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
    const transaction = await Transaction.findByPk(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Delete associated Cloudinary images
    for (const image of transaction.images || []) {
      if (image.public_id) {
        await cloudinary.uploader.destroy(image.public_id);
      }
    }

    await transaction.destroy();

    res.status(200).json({
      message: "Transaction and associated images deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
