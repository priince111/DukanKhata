require("dotenv").config();
const express = require("express");
const sequelize = require("./config/db");
const cors = require("cors")
const login = require('./controllers/LoginController')
const customer = require('./controllers/CustomerController')
const billTransaction = require('./controllers/BillTransactionController')
const transaction = require('./controllers/TransactionController')

const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

app.use('/uploads', express.static('uploads'));


sequelize.authenticate()
  .then(() => console.log("✅ PostgreSQL Connected!"))
  .catch((error) => console.error("❌ Connection Error:", error));

// ✅ Sync Database
sequelize.sync({ alter: true })
  .then(() => console.log("✅ Database & Tables Synced!"))
  .catch((err) => console.error("❌ Database Sync Error:", err));

app.use("/auth",login)
app.use("/customer",customer)
app.use("/bill-transaction",billTransaction)
app.use("/transaction",transaction)

app.get("/", (req, res) => {
  res.send("Welcome to My Node.js App!");
});

app.listen(5000, "0.0.0.0", () => {
  console.log("Server running on port 5000");
});


