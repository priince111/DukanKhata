require('dotenv').config(); // Load env vars
const fs = require('fs');
const path = require('path');

module.exports = {
  development: {
    username: process.env.my_user,
    password: process.env.my_password,
    database: process.env.my_database,
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: 'postgres',
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: true,
      },
    },
  },
};
