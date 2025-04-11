const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Owner = require("./Owner")

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
    defaultValue: 0
  }
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


Owner.hasMany(Customer, { foreignKey: "ownerId" });
Customer.belongsTo(Owner, { foreignKey: "ownerId" });

module.exports = Customer;
