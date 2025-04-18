require("dotenv").config();
const express = require("express");
const {sequelize} = require("./models");
const cors = require("cors")
const login = require('./controllers/LoginController')
const customer = require('./controllers/CustomerController')
const billTransaction = require('./controllers/BillTransactionController')
const transaction = require('./controllers/TransactionController')
const job = require("./config/cron");
require('dotenv').config();

const app = express();
job.start();
app.use(express.json());
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }));

sequelize.authenticate()
  .then(() => console.log("✅ PostgreSQL Connected!"))
  .catch((error) => console.error("❌ Connection Error:", error));

app.use("/auth",login)
app.use("/customer",customer)
app.use("/bill-transaction",billTransaction)
app.use("/transaction",transaction)

app.get("/", (req, res) => {
  res.send("Welcome to My Node.js App!");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
