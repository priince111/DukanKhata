// models/BillTransaction.js

module.exports = (sequelize, DataTypes) => {
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
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      tableName: "bill_transaction",
      timestamps: true,
    }
  );

  // Setup associations in the same file using .associate
  BillTransaction.associate = (models) => {
    BillTransaction.belongsTo(models.Transaction, {
      foreignKey: "transactionId",
      onDelete: "CASCADE",
    });

    models.Transaction.hasMany(BillTransaction, {
      foreignKey: "transactionId",
      onDelete: "CASCADE",
    });
  };

  return BillTransaction;
};
