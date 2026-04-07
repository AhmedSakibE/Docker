
const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());

let currentName = process.env.USER_NAME || "User";

app.get('/api/name', (req, res) => {
  res.json({ name: currentName });
});

app.post('/api/name', (req, res) => {
  const newName = req.body.name;
  if (!newName) return res.status(400).json({ error: "Name required" });

  const time = new Date().toISOString();
  const log = `${currentName} changed his name to ${newName} - ${time}\n`;

  fs.appendFileSync('/app/data/name_changes.txt', log);

  currentName = newName;

  res.json({ message: "Name updated", name: currentName });
});

app.listen(3000, () => console.log("Backend running on port 3000"));
