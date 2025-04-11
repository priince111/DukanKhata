const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Customer = require("./Customer");

const Transaction = sequelize.define(
  "Transaction",
  {
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
    originalAmount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    duplicateAmount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    totalAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    details: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "transactions",
    timestamps: true,
  }
);

Customer.hasMany(Transaction, {
  foreignKey: "customerId",
  onDelete: "CASCADE",
});
Transaction.belongsTo(Customer, { foreignKey: "customerId" });

module.exports = Transaction;
