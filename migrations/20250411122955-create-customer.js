"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("customer", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      transactionType: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          isIn: [["both", "duplicate"]],
        },
      },
      billType: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          isIn: [["normal", "bill_based"]],
        },
      },
      ownerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "owner",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      pendingBalance: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    await queryInterface.addIndex("customer", ["phone", "ownerId"], {
      unique: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex("customer", ["phone", "ownerId"]);
    await queryInterface.dropTable("customer");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_customer_transactionType";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_customer_billType";'
    );
  },
};
