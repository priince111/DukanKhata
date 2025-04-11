const { Sequelize } = require("sequelize");
require("dotenv").config(); // Load environment variables

const sequelize = new Sequelize(
  process.env.my_database,     // Database name
  process.env.my_user,     // Username
  process.env.my_password,     // Password
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "postgres",
    logging: false,
  }
);

module.exports = sequelize; 
