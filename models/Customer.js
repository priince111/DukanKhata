// models/Customer.js

module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define("Customer", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isNumeric: true,
      },
    },
    transactionType: {
      type: DataTypes.ENUM("both", "duplicate"),
      allowNull: false,
    },
    billType: {
      type: DataTypes.ENUM("normal", "bill_based"),
      allowNull: false,
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    pendingBalance: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  }, {
    tableName: "customer",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['phone', 'ownerId'],
      },
    ],
  });

  Customer.associate = (models) => {
    Customer.belongsTo(models.Owner, { foreignKey: "ownerId" });
    Customer.hasMany(models.Transaction, { foreignKey: "customerId", onDelete: "CASCADE" });
  };

  return Customer;
};
