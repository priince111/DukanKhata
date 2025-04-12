// models/Owner.js

module.exports = (sequelize, DataTypes) => {
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

  Owner.associate = (models) => {
    Owner.hasMany(models.Customer, { foreignKey: "ownerId" });
  };

  return Owner;
};
