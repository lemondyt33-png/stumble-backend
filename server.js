const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { JSONFilePreset } = require('lowdb/node');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Datenbank Setup (db.json wird automatisch erstellt)
const defaultData = { users: [] };
let db;

async function initDB() {
  db = await JSONFilePreset('db.json', defaultData);
  console.log("Datenbank bereit.");
}
initDB();

// --- 1. ENDPUNKT FÜR DAS SPIEL (Login & Config) ---

// Das Spiel fragt hier die SharedShadow Config ab
app.get('/SharedShadow', (req, res) => {
  // Hier den Inhalt deiner SharedShadow Datei einfügen oder zurückgeben
  res.send("Hier stehen deine Mod-Einstellungen");
});

// Login-Endpunkt für das Spiel
app.post('/user/login', async (req, res) => {
  const { deviceId, username } = req.body;
  if (!deviceId) return res.status(400).send("Keine Device-ID");

  await db.read();
  let user = db.data.users.find(u => u.deviceId === deviceId);

  if (!user) {
    // Falls der User neu ist, erstelle ihn in der db.json
    user = {
      deviceId: deviceId,
      username: username || "NewPlayer",
      gems: 0,
      crowns: 0,
      timestamp: new Date().toISOString()
    };
    db.data.users.push(user);
    await db.write();
    console.log(`Neuer User registriert: ${deviceId}`);
  }

  res.json(user);
});


// --- 2. ENDPUNKT FÜR DEN DISCORD BOT ---

app.post('/bot/update-user', async (req, res) => {
  const { auth, deviceId, newData } = req.body;

  // Sicherheitscheck: API_KEY muss mit Render übereinstimmen
  if (auth !== process.env.API_KEY) {
    console.log("Falscher API-Key Versuch");
    return res.status(403).json({ error: "Nicht autorisiert" });
  }

  await db.read();
  const user = db.data.users.find(u => u.deviceId === deviceId);

  if (user) {
    // Ändere Name, Gems oder Crowns
    Object.assign(user, newData);
    await db.write();
    console.log(`Update für ${deviceId}:`, newData);
    res.json({ success: true, message: "Daten erfolgreich geändert!" });
  } else {
    res.status(404).json({ error: "User mit dieser ID nicht gefunden" });
  }
});


// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
