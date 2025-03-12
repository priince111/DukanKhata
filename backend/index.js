require("dotenv").config();
const express = require("express");
const sequelize = require("./config/db");
const cors = require("cors")
const login = require('./controllers/LoginController')

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => console.log("✅ PostgreSQL Connected!"))
  .catch((error) => console.error("❌ Connection Error:", error));

// ✅ Sync Database
sequelize.sync({ alter: true })
  .then(() => console.log("✅ Database & Tables Synced!"))
  .catch((err) => console.error("❌ Database Sync Error:", err));

app.use("/auth",login)

app.get("/", (req, res) => {
  res.send("Welcome to My Node.js App!");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});


