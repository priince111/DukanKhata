const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Customer = require("./Customer");

const Transaction = sequelize.define("Transaction", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Customer,
      key: "id",
    },
  },
  type: {
    type: DataTypes.ENUM("debit", "credit"),
    allowNull: false,
  },
  blackAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  whiteAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  receiptUrl: {
    type: DataTypes.STRING, // Stores the uploaded receipt file path
    allowNull: true,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "transactions",
  timestamps: true,
});

Customer.hasMany(Transaction, { foreignKey: "customerId", onDelete: "CASCADE" });
Transaction.belongsTo(Customer, { foreignKey: "customerId" });

module.exports = Transaction;
