const express = require("express");
const app = express();

const PORT = 3000;

const Database = require("better-sqlite3");
const db = new Database("database.db");

const cors = require("cors");
app.use(cors());

app.get("/api/ovelser", (req, res) => {
    const rows = db.prepare("SELECT id, navn FROM ovelse").all();
    res.json(rows);
});

// app.get("/api/okter", (req, res) => {
//     const rown = db.prepare
// });

app.use(express.static("public"));

app.listen(PORT, () => {
    console.log(`Server kjører på http://localhost:${PORT}`);
});