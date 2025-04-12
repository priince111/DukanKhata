const express = require("express");
const router = express.Router();

const { sequelize, Customer, Transaction, BillTransaction } = require("../models");

const { storage, cloudinary } = require("../config/cloudinary");
const multer = require("multer");
const upload = multer({ storage });

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
      const imagePaths =
        req.files?.map((file) => ({
          url: file.path,
          public_id: file.filename,
        })) || [];

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
      // Delete images not in keep list from Cloudinary

      const imagesToDelete = (billTransaction.images || []).filter(
        (img) => !keepImages.find((k) => k.public_id === img.public_id)
      );

      for (const img of imagesToDelete) {
        if (img.public_id) {
          await cloudinary.uploader.destroy(img.public_id);
        }
      }

      // New images uploaded
      const newUploaded =
        req.files?.map((file) => ({
          url: file.path,
          public_id: file.filename,
        })) || [];

      // Final image list
      const finalImages = [...keepImages, ...newUploaded];
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

    for (const image of billTransaction.images || []) {
      if (image.public_id) {
        await cloudinary.uploader.destroy(image.public_id);
      }
    }
    await billTransaction.destroy();

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

module.exports = router;
