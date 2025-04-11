const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Owner = sequelize.define("Owner", {
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
    allowNull: false,
    unique: true,
    validate: {
      isNumeric: true,
    },
  },
}, {
  tableName: "owner", 
  timestamps: true,
});

module.exports = Owner;
