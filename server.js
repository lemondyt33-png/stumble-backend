const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const { nanoid } = require('nanoid');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const API_KEY = "03052013Nn"; // Passwort für deinen Discord-Bot
const DB_FILE = path.join(__dirname, 'db.json');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const adapter = new JSONFile(DB_FILE);
const db = new Low(adapter, { config: {}, users: [], bans: [] });

async function initDb() {
  await db.read();
  db.data ||= { config: { maintenance: false }, users: [], bans: [] };
  await db.write();
}

// --- ENDPUNKT FÜR DISCORD BOT ---
// Der Bot sendet: { "auth": "DEIN_SICHERES_PASSWORT", "username": "SpielerName", "newData": { "crowns": 999 } }
app.post('/bot/update-user', async (req, res) => {
  const { auth, username, newData } = req.body;

  if (auth !== API_KEY) return res.status(403).json({ error: 'Unbefugt' });

  await db.read();
  const user = db.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());

  if (!user) return res.status(404).json({ error: 'Benutzer nicht gefunden' });

  // Daten aktualisieren (Name, Kronen, Gems etc.)
  Object.assign(user, newData);
  await db.write();

  res.json({ success: true, message: `Update für ${username} durchgeführt`, user });
});

// --- LOGIN FÜR STUMBLE GUYS ---
app.post('/user/login/', async (req, res) => {
  await db.read();
  const { deviceId } = req.body;
  if (!deviceId) return res.status(400).json({ error: 'deviceId fehlt' });

  let user = db.data.users.find(u => u.deviceId === deviceId);

  if (!user) {
    user = {
      id: nanoid(),
      deviceId,
      username: `Player_${nanoid(4)}`,
      crowns: 0,
      gems: 0,
      trophys: 0,
      banned: false
    };
    db.data.users.push(user);
    await db.write();
  }

  // Struktur angepasst für Version 0.42 / 0.56
  res.json({
    authorized: true,
    banned: user.banned,
    username: user.username,
    crowns: user.crowns,
    gems: user.gems,
    trophys: user.trophys,
    skillRating: 1200,
    message: "Success"
  });
});

// Standard Config & Start
app.get('/config.json', async (req, res) => {
  await db.read();
  res.json(db.data.config);
});

app.listen(PORT, async () => {
  await initDb();
  console.log(`Backend läuft auf Port ${PORT}`);
});
