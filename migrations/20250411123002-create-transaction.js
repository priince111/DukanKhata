"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("transaction", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      customerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "customer",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          isIn: [["credit", "debit"]],
        },
      },
      originalAmount: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      duplicateAmount: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      totalAmount: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      details: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      images: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
      },
      updatedAt: {
        type: Sequelize.DATE,
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("transaction");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_transaction_transactionType";'
    );
  },
};
