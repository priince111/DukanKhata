const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Transaction = require("./Transaction");

const BillTransaction = sequelize.define(
  "BillTransaction",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    transactionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Bill,
        key: "id",
      },
    },
    blackAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    whiteAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "bill_transactions",
    timestamps: true,
  }
);

Transaction.hasMany(BillTransaction, { foreignKey: "transactionId", onDelete: "CASCADE" });
BillTransaction.belongsTo(Transaction, { foreignKey: "transactionId" });

module.exports = BillTransaction;
