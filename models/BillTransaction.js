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
        model: Transaction,
        key: "id",
      },
      onDelete: 'CASCADE',
    },    
    originalAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    duplicateAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    details: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
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
