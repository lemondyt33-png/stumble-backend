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
// Endpunkt für den Discord Bot
// Endpunkt für den Discord Bot
app.post('/bot/change-username', async (req, res) => {
  const { auth, deviceId, newUsername } = req.body;

  // Sicherheitscheck: Stimmt das Passwort vom Bot?
  if (auth !== process.env.API_KEY) {
    return res.status(403).json({ error: 'Falscher API-Key!' });
  }

  await db.read();
  // Suche den Spieler anhand der Device-ID
  const user = db.data.users.find(u => u.deviceId === deviceId);

  if (user) {
    user.username = newUsername; // Name ändern
    await db.write();
    return res.json({ success: true, message: `Name zu ${newUsername} geändert!` });
  } else {
    return res.status(404).json({ error: 'Spieler-ID nicht gefunden!' });
  }
});
