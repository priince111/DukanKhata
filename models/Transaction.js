// models/Transaction.js

module.exports = (sequelize, DataTypes) => {
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
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [["debit", "credit"]],
        },
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
        type: DataTypes.JSONB,
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
      tableName: "transaction",
      timestamps: true,
    }
  );

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.Customer, {
      foreignKey: "customerId",
      onDelete: "CASCADE",
    });

    Transaction.hasMany(models.BillTransaction, {
      foreignKey: "transactionId",
      onDelete: "CASCADE",
    });
  };

  return Transaction;
};
