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
    unique: true,
    validate: {
      isNumeric: true,
    },
  },
  transactionType: {
    type: DataTypes.ENUM("black-white", "black"),
    allowNull: false,
  },
  billType: {
    type: DataTypes.ENUM("normal", "bill_based"),
    allowNull: false,
  },
}, {
  tableName: "customer", 
  timestamps: true,
});

Owner.hasMany(Customer, { foreignKey: "ownerId" });
Customer.belongsTo(Owner, { foreignKey: "ownerId" });

module.exports = Customer;
